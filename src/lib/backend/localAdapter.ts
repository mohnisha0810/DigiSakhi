// SafeSphere Local Development Adapter with Persistent Storage
// Used for local testing and hackathon judging when cloud Supabase credentials are not supplied.
// WARNING: This adapter provides local persistent state and simulated authorization filtering,
// but DOES NOT provide cryptographic production Row Level Security.

import { BackendAdapter, AuthSession } from './types';
import {
  UserProfile,
  TrustedContact,
  ContactInvitation,
  SafetyProtocol,
  CheckIn,
  Journey,
  Incident,
  IncidentRecipient,
  IncidentEvent,
  LocationShare,
  LocationUpdate,
  NotificationRecord,
} from '@/types';
import {
  LocalStorageDB,
  INITIAL_USER_PROFILE,
  INITIAL_CONTACT_PROFILES,
  INITIAL_CONTACTS,
  INITIAL_PROTOCOLS,
} from '../supabase';

const SESSION_STORAGE_KEY = 'safesphere_auth_session';

async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${salt}:${password}:digisakhi_secret_salt_2026`);
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : (globalThis as any).crypto;
  if (cryptoObj?.subtle) {
    const hashBuffer = await cryptoObj.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Robust fallback if subtle is unavailable in non-browser/node environment
  let h = 0x811c9dc5;
  for (let i = 0; i < data.length; i++) {
    h = Math.imul(h ^ data[i], 0x01000193);
  }
  return (h >>> 0).toString(16);
}

export class LocalDevelopmentAdapter implements BackendAdapter {
  readonly mode = 'local_dev_adapter' as const;
  readonly isCloud = false as const;

  // Realtime BroadcastChannel
  private channel = typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel('safesphere_realtime_sync')
    : null;

  constructor() {
    LocalStorageDB.initialize();
  }

  // --- Authentication ---
  async signUp(params: {
    email: string;
    password: string;
    fullName: string;
    phoneNumber?: string;
    emergencyNotes?: string;
    medicalInfo?: string;
  }): Promise<AuthSession> {
    if (!params.password || params.password.length < 4) {
      throw new Error('Password must be at least 6 characters.');
    }

    const profiles = LocalStorageDB.getItem<UserProfile[]>('profiles', []);
    const existing = profiles.find((p) => p.email.toLowerCase() === params.email.toLowerCase());
    if (existing) {
      throw new Error('A user with this email address already exists.');
    }

    const salt = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    const passwordHash = await hashPassword(params.password, salt);
    const credentials = LocalStorageDB.getItem<Record<string, { salt: string; hash: string }>>(
      'safesphere_auth_credentials',
      {}
    );
    credentials[params.email.toLowerCase()] = { salt, hash: passwordHash };
    LocalStorageDB.setItem('safesphere_auth_credentials', credentials);

    const newId = 'usr_' + Math.random().toString(36).substring(2, 9);
    const newProfile: UserProfile = {
      id: newId,
      email: params.email.toLowerCase(),
      full_name: params.fullName,
      phone_number: params.phoneNumber || '',
      emergency_notes: params.emergencyNotes || '',
      medical_info: params.medicalInfo || '',
      discreet_exit_pin: '1234',
      discreet_mode_enabled: false,
      quick_exit_disguise: 'weather',
      discreet_lockscreen_mask: true,
      onboarding_completed: false,
      onboarding_step: 1,
      check_in_preferences: {
        enabled: true,
        interval_minutes: 10,
        countdown_seconds: 120,
        notification_type: 'in_app',
      },
      emergency_preferences: {
        emergency_number: '112',
        share_location: true,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Default protocol for new user
    const defaultProtocol: SafetyProtocol = {
      id: 'proto_' + Math.random().toString(36).substring(2, 9),
      user_id: newId,
      name: 'Standard Safety Protocol',
      description: 'Default protocol for automated check-ins and grace period escalation.',
      trigger_type: 'check_in_overdue',
      reminder_lead_seconds: 120,
      grace_period_seconds: 180,
      contact_wait_seconds: 180,
      allow_location_sharing: true,
      location_auto_expire_minutes: 60,
      escalation_contact_ids: [],
      is_default: true,
      active: true,
      created_at: new Date().toISOString(),
    };

    const protocols = LocalStorageDB.getItem<SafetyProtocol[]>('safety_protocols', []);
    LocalStorageDB.setItem('safety_protocols', [...protocols, defaultProtocol]);
    LocalStorageDB.setItem('profiles', [...profiles, newProfile]);

    const session: AuthSession = {
      user: { id: newProfile.id, email: newProfile.email },
      profile: newProfile,
      token: 'local_dev_token_' + newProfile.id,
    };

    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch {}

    // Synchronize to serverless backend for multi-device recovery
    try {
      if (typeof window !== 'undefined' && 'fetch' in window) {
        await fetch('/api/account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'signup',
            email: newProfile.email,
            password: params.password,
            fullName: newProfile.full_name,
            phoneNumber: newProfile.phone_number,
            emergencyNotes: newProfile.emergency_notes,
            medicalInfo: newProfile.medical_info,
          }),
        });
      }
    } catch (apiErr) {
      console.warn('Backend sign-up sync note:', apiErr);
    }

    return session;
  }

  private syncToApi(action: string, payload: Record<string, any>): void {
    if (typeof window !== 'undefined' && 'fetch' in window) {
      try {
        fetch('/api/account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, ...payload }),
        }).catch((err) => {
          console.warn(`[localAdapter] syncToApi error (${action}):`, err);
        });
      } catch {}
    }
  }

  async signIn(email: string, password?: string): Promise<AuthSession> {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Try serverless backend persistence first for cross-device support
    try {
      if (typeof window !== 'undefined' && 'fetch' in window) {
        const res = await fetch('/api/account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'signin', email: cleanEmail, password }),
        });
        if (res.ok) {
          const result = await res.json();
          if (result.success && result.session?.profile) {
            let serverProfile = result.session.profile;

            // Merge into local profiles
            const localProfiles = LocalStorageDB.getItem<UserProfile[]>('profiles', []);
            const existingLocalProfile = localProfiles.find(
              (p) => p.id === serverProfile.id || p.email.toLowerCase() === serverProfile.email.toLowerCase()
            );

            // If local profile has higher onboarding progress or saved details, preserve them
            if (existingLocalProfile) {
              const localCompleted = Boolean(existingLocalProfile.onboarding_completed);
              const localStep = existingLocalProfile.onboarding_step || 1;
              const serverCompleted = Boolean(serverProfile.onboarding_completed);
              const serverStep = serverProfile.onboarding_step || 1;

              serverProfile = {
                ...existingLocalProfile,
                ...serverProfile,
                onboarding_completed: localCompleted || serverCompleted,
                onboarding_step: Math.max(localStep, serverStep),
                check_in_preferences: {
                  ...existingLocalProfile.check_in_preferences,
                  ...serverProfile.check_in_preferences,
                },
                emergency_preferences: {
                  ...existingLocalProfile.emergency_preferences,
                  ...serverProfile.emergency_preferences,
                },
              };
            }

            const updatedProfiles = localProfiles.filter((p) => p.id !== serverProfile.id && p.email !== serverProfile.email);
            LocalStorageDB.setItem('profiles', [...updatedProfiles, serverProfile]);

            // Sync contacts from backend with local fallback merge
            const localContacts = LocalStorageDB.getItem<TrustedContact[]>('trusted_contacts', []);
            const userLocalContacts = localContacts.filter((c) => c.user_id === serverProfile.id);
            const serverContacts: TrustedContact[] = Array.isArray(result.data?.contacts) ? result.data.contacts : [];

            // Combine unique contacts by ID
            const contactMap = new Map<string, TrustedContact>();
            userLocalContacts.forEach((c) => contactMap.set(c.id, c));
            serverContacts.forEach((c) => contactMap.set(c.id, c));
            const mergedUserContacts = Array.from(contactMap.values());

            const otherContacts = localContacts.filter((c) => c.user_id !== serverProfile.id);
            LocalStorageDB.setItem('trusted_contacts', [...otherContacts, ...mergedUserContacts]);

            // If local had contacts not yet in backend, sync to backend
            if (userLocalContacts.length > serverContacts.length) {
              this.syncToApi('sync_user_data', {
                userId: serverProfile.id,
                data: { contacts: mergedUserContacts, profile: serverProfile },
              });
            }

            // Sync protocols
            const localProtocols = LocalStorageDB.getItem<SafetyProtocol[]>('safety_protocols', []);
            const userLocalProtocols = localProtocols.filter((p) => p.user_id === serverProfile.id);
            const serverProtocols: SafetyProtocol[] = Array.isArray(result.data?.protocols) ? result.data.protocols : [];
            const protoMap = new Map<string, SafetyProtocol>();
            userLocalProtocols.forEach((p) => protoMap.set(p.id, p));
            serverProtocols.forEach((p) => protoMap.set(p.id, p));
            const mergedProtocols = Array.from(protoMap.values());
            const otherProtocols = localProtocols.filter((p) => p.user_id !== serverProfile.id);
            LocalStorageDB.setItem('safety_protocols', [...otherProtocols, ...mergedProtocols]);

            // Sync invitations
            const localInvs = LocalStorageDB.getItem<ContactInvitation[]>('contact_invitations', []);
            const userLocalInvs = localInvs.filter((i) => i.inviter_id === serverProfile.id);
            const serverInvs: ContactInvitation[] = Array.isArray(result.data?.invitations) ? result.data.invitations : [];
            const invMap = new Map<string, ContactInvitation>();
            userLocalInvs.forEach((i) => invMap.set(i.id, i));
            serverInvs.forEach((i) => invMap.set(i.id, i));
            const mergedInvs = Array.from(invMap.values());
            const otherInvs = localInvs.filter((i) => i.inviter_id !== serverProfile.id);
            LocalStorageDB.setItem('contact_invitations', [...otherInvs, ...mergedInvs]);

            // Sync journeys
            if (Array.isArray(result.data?.journeys)) {
              const localJourneys = LocalStorageDB.getItem<Journey[]>('journeys', []);
              const userLocalJourneys = localJourneys.filter((j) => j.owner_user_id === serverProfile.id);
              const journeyMap = new Map<string, Journey>();
              userLocalJourneys.forEach((j) => journeyMap.set(j.id, j));
              (result.data.journeys as Journey[]).forEach((j) => journeyMap.set(j.id, j));
              const otherJourneys = localJourneys.filter((j) => j.owner_user_id !== serverProfile.id);
              LocalStorageDB.setItem('journeys', [...otherJourneys, ...Array.from(journeyMap.values())]);
            }

            // Sync check-ins
            if (Array.isArray(result.data?.checkIns)) {
              const localCheckIns = LocalStorageDB.getItem<CheckIn[]>('check_ins', []);
              const userLocalCheckIns = localCheckIns.filter((c) => c.owner_user_id === serverProfile.id);
              const checkInMap = new Map<string, CheckIn>();
              userLocalCheckIns.forEach((c) => checkInMap.set(c.id, c));
              (result.data.checkIns as CheckIn[]).forEach((c) => checkInMap.set(c.id, c));
              const otherCheckIns = localCheckIns.filter((c) => c.owner_user_id !== serverProfile.id);
              LocalStorageDB.setItem('check_ins', [...otherCheckIns, ...Array.from(checkInMap.values())]);
            }

            const updatedSession: AuthSession = {
              ...result.session,
              profile: serverProfile,
            };

            // Persist session
            try {
              localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedSession));
            } catch {}

            return updatedSession;
          }
        }
      }
    } catch (apiErr) {
      console.warn('Backend sign-in fallback to local store:', apiErr);
    }

    // 2. Local fallback
    const profiles = LocalStorageDB.getItem<UserProfile[]>('profiles', [
      INITIAL_USER_PROFILE,
      ...INITIAL_CONTACT_PROFILES,
    ]);

    const profile = profiles.find((p) => p.email.toLowerCase() === cleanEmail);
    if (!profile) {
      throw new Error(`No account found with email "${email}". Please sign up first.`);
    }

    const credentials = LocalStorageDB.getItem<Record<string, { salt: string; hash: string }>>(
      'safesphere_auth_credentials',
      {}
    );
    const cred = credentials[cleanEmail];
    if (cred && password) {
      const candidateHash = await hashPassword(password, cred.salt);
      if (candidateHash !== cred.hash) {
        throw new Error('Incorrect password. Please verify your password and try again.');
      }
    }

    const session: AuthSession = {
      user: { id: profile.id, email: profile.email },
      profile,
      token: 'local_dev_token_' + profile.id,
    };

    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch {}

    return session;
  }

  async signOut(): Promise<void> {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {}
  }

  async getCurrentSession(): Promise<AuthSession | null> {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const session = JSON.parse(stored) as AuthSession;
        const profiles = LocalStorageDB.getItem<UserProfile[]>('profiles', [
          INITIAL_USER_PROFILE,
          ...INITIAL_CONTACT_PROFILES,
        ]);
        let freshProfile = profiles.find((p) => p.id === session.user.id || p.email === session.user.email);

        // Attempt recovery from serverless backend if missing or outdated locally
        if (!freshProfile && typeof window !== 'undefined' && 'fetch' in window) {
          try {
            const res = await fetch(`/api/account?action=get_account&userId=${encodeURIComponent(session.user.id)}`);
            if (res.ok) {
              const result = await res.json();
              if (result.success && result.profile) {
                freshProfile = result.profile;
                LocalStorageDB.setItem('profiles', [...profiles, freshProfile]);
              }
            }
          } catch {}
        }

        if (freshProfile) {
          session.profile = freshProfile;
        }
        return session;
      }
    } catch {}
    return null;
  }

  // --- Profiles ---
  async getProfile(userId: string): Promise<UserProfile | null> {
    const profiles = LocalStorageDB.getItem<UserProfile[]>('profiles', []);
    return profiles.find((p) => p.id === userId) || null;
  }

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const profiles = LocalStorageDB.getItem<UserProfile[]>('profiles', []);
    let updatedProfile: UserProfile | null = null;

    const newProfiles = profiles.map((p) => {
      if (p.id === userId) {
        updatedProfile = {
          ...p,
          ...updates,
          updated_at: new Date().toISOString(),
        };
        return updatedProfile;
      }
      return p;
    });

    if (!updatedProfile) throw new Error('Profile not found.');

    LocalStorageDB.setItem('profiles', newProfiles);

    // Sync to serverless backend
    this.syncToApi('update_profile', { userId, updates });

    // Update active session if it matches
    const curSession = await this.getCurrentSession();
    if (curSession && curSession.user.id === userId) {
      curSession.profile = updatedProfile;
      try {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(curSession));
      } catch {}
    }

    return updatedProfile;
  }

  // --- Contacts (Scoped to owner user_id) ---
  async getContacts(userId: string): Promise<TrustedContact[]> {
    const contacts = LocalStorageDB.getItem<TrustedContact[]>('trusted_contacts', []);
    const invitations = LocalStorageDB.getItem<ContactInvitation[]>('contact_invitations', []);
    const acceptedInvs = invitations.filter((i) => i.inviter_id === userId && i.status === 'accepted');

    let modified = false;
    for (const c of contacts) {
      if (c.user_id === userId && c.status !== 'accepted') {
        const matchingAcceptedInv = acceptedInvs.find(
          (inv) =>
            inv.id === c.invitation_id ||
            (inv.invitee_email && c.email && inv.invitee_email.toLowerCase() === c.email.toLowerCase()) ||
            (inv.invitee_phone && c.phone_number && inv.invitee_phone === c.phone_number)
        );
        if (matchingAcceptedInv) {
          c.status = 'accepted';
          c.invitation_status = 'accepted';
          c.can_view_location = true;
          modified = true;
        }
      }
    }

    if (modified) {
      LocalStorageDB.setItem('trusted_contacts', contacts);
    }

    return contacts.filter((c) => c.user_id === userId);
  }

  async createContact(contact: Omit<TrustedContact, 'id' | 'created_at'>): Promise<TrustedContact> {
    const contacts = LocalStorageDB.getItem<TrustedContact[]>('trusted_contacts', []);
    const newContact: TrustedContact = {
      ...contact,
      id: 'tc_' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
    };
    LocalStorageDB.setItem('trusted_contacts', [...contacts, newContact]);

    // Sync to backend
    this.syncToApi('create_contact', { userId: contact.user_id, contact: newContact });

    return newContact;
  }

  async updateContact(contactId: string, updates: Partial<TrustedContact>): Promise<TrustedContact> {
    const contacts = LocalStorageDB.getItem<TrustedContact[]>('trusted_contacts', []);
    let updated: TrustedContact | null = null;

    const newContacts = contacts.map((c) => {
      if (c.id === contactId) {
        updated = { ...c, ...updates, updated_at: new Date().toISOString() };
        return updated;
      }
      return c;
    });

    if (!updated) throw new Error('Contact not found.');
    LocalStorageDB.setItem('trusted_contacts', newContacts);

    // Sync to backend
    const savedContact = updated as TrustedContact;
    this.syncToApi('update_contact', { userId: savedContact.user_id, contact: savedContact });

    return savedContact;
  }

  async deleteContact(contactId: string): Promise<void> {
    const contacts = LocalStorageDB.getItem<TrustedContact[]>('trusted_contacts', []);
    const target = contacts.find((c) => c.id === contactId);
    LocalStorageDB.setItem(
      'trusted_contacts',
      contacts.filter((c) => c.id !== contactId)
    );
    if (target) {
      this.syncToApi('delete_contact', { userId: target.user_id, contactId });
    }
  }

  async reorderContacts(userId: string, contactIdsInOrder: string[]): Promise<TrustedContact[]> {
    const contacts = LocalStorageDB.getItem<TrustedContact[]>('trusted_contacts', []);
    const updated = contacts.map((c) => {
      if (c.user_id === userId) {
        const orderIdx = contactIdsInOrder.indexOf(c.id);
        if (orderIdx !== -1) {
          return { ...c, escalation_order: orderIdx + 1 };
        }
      }
      return c;
    });
    LocalStorageDB.setItem('trusted_contacts', updated);
    return updated.filter((c) => c.user_id === userId);
  }

  // --- Invitations ---
  async getInvitations(userId: string): Promise<ContactInvitation[]> {
    const invs = LocalStorageDB.getItem<ContactInvitation[]>('contact_invitations', []);
    return invs.filter((i) => i.inviter_id === userId);
  }

  async createInvitation(invitation: Omit<ContactInvitation, 'id' | 'created_at'>): Promise<ContactInvitation> {
    const invs = LocalStorageDB.getItem<ContactInvitation[]>('contact_invitations', []);
    const newInv: ContactInvitation = {
      ...invitation,
      id: 'inv_' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
    };
    LocalStorageDB.setItem('contact_invitations', [newInv, ...invs]);

    // Sync to backend
    this.syncToApi('create_invitation', { userId: invitation.inviter_id, invitation: newInv });

    return newInv;
  }

  async getInvitationByToken(token: string): Promise<ContactInvitation | null> {
    const invs = LocalStorageDB.getItem<ContactInvitation[]>('contact_invitations', []);
    return invs.find((i) => i.invitation_token === token) || null;
  }

  async acceptInvitation(invitationId: string, acceptingUserId?: string): Promise<void> {
    const invs = LocalStorageDB.getItem<ContactInvitation[]>('contact_invitations', []);
    const target = invs.find((i) => i.id === invitationId || i.invitation_token === invitationId);
    if (!target) return;

    const updatedInvs = invs.map((i) =>
      i.id === target.id
        ? {
            ...i,
            status: 'accepted' as const,
            delivery_status: 'accepted' as const,
            responded_at: new Date().toISOString(),
          }
        : i
    );
    LocalStorageDB.setItem('contact_invitations', updatedInvs);

    // Update matching trusted_contacts record
    const contacts = LocalStorageDB.getItem<TrustedContact[]>('trusted_contacts', []);
    const updatedContacts = contacts.map((c) => {
      const isMatch =
        c.invitation_id === target.id ||
        (c.user_id === target.inviter_id && c.email.toLowerCase() === target.invitee_email.toLowerCase()) ||
        (target.invitee_phone && c.phone_number && c.phone_number === target.invitee_phone);

      if (isMatch) {
        return {
          ...c,
          status: 'accepted' as const,
          invitation_status: 'accepted' as const,
          contact_user_id: acceptingUserId || c.contact_user_id,
          can_view_location: true,
          updated_at: new Date().toISOString(),
        };
      }
      return c;
    });
    LocalStorageDB.setItem('trusted_contacts', updatedContacts);
  }

  async declineInvitation(invitationId: string): Promise<void> {
    const invs = LocalStorageDB.getItem<ContactInvitation[]>('contact_invitations', []);
    const target = invs.find((i) => i.id === invitationId);
    if (!target) throw new Error('Invitation not found.');

    const updatedInvs = invs.map((i) =>
      i.id === invitationId
        ? {
            ...i,
            status: 'declined' as const,
            delivery_status: 'declined' as const,
            responded_at: new Date().toISOString(),
          }
        : i
    );
    LocalStorageDB.setItem('contact_invitations', updatedInvs);

    // Update matching trusted_contacts record
    const contacts = LocalStorageDB.getItem<TrustedContact[]>('trusted_contacts', []);
    const updatedContacts = contacts.map((c) => {
      const isMatch =
        (c.user_id === target.inviter_id && c.email.toLowerCase() === target.invitee_email.toLowerCase()) ||
        (target.invitee_phone && c.phone_number && c.phone_number === target.invitee_phone);

      if (isMatch) {
        return {
          ...c,
          status: 'declined' as const,
          invitation_status: 'declined' as const,
          updated_at: new Date().toISOString(),
        };
      }
      return c;
    });
    LocalStorageDB.setItem('trusted_contacts', updatedContacts);
  }

  async updateInvitationDelivery(
    invitationId: string,
    updates: Partial<ContactInvitation>
  ): Promise<ContactInvitation> {
    const invs = LocalStorageDB.getItem<ContactInvitation[]>('contact_invitations', []);
    const target = invs.find((i) => i.id === invitationId);
    if (!target) throw new Error('Invitation not found.');

    const updated: ContactInvitation = { ...target, ...updates };
    const updatedInvs = invs.map((i) => (i.id === invitationId ? updated : i));
    LocalStorageDB.setItem('contact_invitations', updatedInvs);

    // Keep trusted_contacts invitation_status in sync
    if (updates.status || updates.delivery_status) {
      const contacts = LocalStorageDB.getItem<TrustedContact[]>('trusted_contacts', []);
      const newStatus = updates.status || updates.delivery_status;
      const updatedContacts = contacts.map((c) => {
        const isMatch =
          (c.user_id === target.inviter_id && c.email.toLowerCase() === target.invitee_email.toLowerCase()) ||
          (target.invitee_phone && c.phone_number && c.phone_number === target.invitee_phone);
        if (isMatch) {
          return {
            ...c,
            invitation_status: newStatus,
            updated_at: new Date().toISOString(),
          };
        }
        return c;
      });
      LocalStorageDB.setItem('trusted_contacts', updatedContacts);
    }

    return updated;
  }

  // --- Protocols ---
  async getProtocols(userId: string): Promise<SafetyProtocol[]> {
    const protocols = LocalStorageDB.getItem<SafetyProtocol[]>('safety_protocols', []);
    return protocols.filter((p) => p.user_id === userId);
  }

  async saveProtocol(protocol: Omit<SafetyProtocol, 'id' | 'created_at'> & { id?: string }): Promise<SafetyProtocol> {
    const protocols = LocalStorageDB.getItem<SafetyProtocol[]>('safety_protocols', []);
    let saved: SafetyProtocol;

    if (protocol.id) {
      saved = {
        ...protocol,
        id: protocol.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as SafetyProtocol;
      const updated = protocols.map((p) => (p.id === protocol.id ? saved : p));
      LocalStorageDB.setItem('safety_protocols', updated);
    } else {
      saved = {
        ...protocol,
        id: 'proto_' + Math.random().toString(36).substring(2, 9),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      LocalStorageDB.setItem('safety_protocols', [...protocols, saved]);
    }

    if (saved.is_default) {
      await this.setDefaultProtocol(saved.user_id, saved.id);
    }

    // Sync to backend
    this.syncToApi('save_protocol', { userId: saved.user_id, protocol: saved });

    return saved;
  }

  async setDefaultProtocol(userId: string, protocolId: string): Promise<void> {
    const protocols = LocalStorageDB.getItem<SafetyProtocol[]>('safety_protocols', []);
    const updated = protocols.map((p) => {
      if (p.user_id === userId) {
        return { ...p, is_default: p.id === protocolId };
      }
      return p;
    });
    LocalStorageDB.setItem('safety_protocols', updated);
  }

  async deleteProtocol(protocolId: string): Promise<void> {
    const protocols = LocalStorageDB.getItem<SafetyProtocol[]>('safety_protocols', []);
    const target = protocols.find((p) => p.id === protocolId);
    LocalStorageDB.setItem(
      'safety_protocols',
      protocols.filter((p) => p.id !== protocolId)
    );
    if (target) {
      this.syncToApi('delete_protocol', { userId: target.user_id, protocolId });
    }
  }

  // --- Check-ins ---
  async getCheckIns(userId: string): Promise<CheckIn[]> {
    const checkIns = LocalStorageDB.getItem<CheckIn[]>('check_ins', []);
    return checkIns.filter((c) => c.owner_user_id === userId);
  }

  async createCheckIn(checkIn: Omit<CheckIn, 'id' | 'created_at'>): Promise<CheckIn> {
    const checkIns = LocalStorageDB.getItem<CheckIn[]>('check_ins', []);
    const newCheckIn: CheckIn = {
      ...checkIn,
      id: 'chk_' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
    };
    LocalStorageDB.setItem('check_ins', [newCheckIn, ...checkIns]);

    // Sync to backend
    this.syncToApi('save_checkin', { userId: newCheckIn.owner_user_id, checkIn: newCheckIn });

    return newCheckIn;
  }

  async updateCheckIn(id: string, updates: Partial<CheckIn>): Promise<CheckIn> {
    const checkIns = LocalStorageDB.getItem<CheckIn[]>('check_ins', []);
    let updated: CheckIn | null = null;

    const newCheckIns = checkIns.map((c) => {
      if (c.id === id) {
        updated = { ...c, ...updates };
        return updated;
      }
      return c;
    });

    if (!updated) throw new Error('Check-in not found.');
    LocalStorageDB.setItem('check_ins', newCheckIns);

    // Sync to backend
    const savedCheckIn = updated as CheckIn;
    this.syncToApi('save_checkin', { userId: savedCheckIn.owner_user_id, checkIn: savedCheckIn });

    return savedCheckIn;
  }

  // --- Journeys ---
  async getJourneys(userId: string): Promise<Journey[]> {
    const journeys = LocalStorageDB.getItem<Journey[]>('journeys', []);
    return journeys.filter((j) => j.owner_user_id === userId);
  }

  async createJourney(journey: Omit<Journey, 'id' | 'created_at'>): Promise<Journey> {
    const journeys = LocalStorageDB.getItem<Journey[]>('journeys', []);
    const newJourney: Journey = {
      ...journey,
      safe_radius_meters: journey.safe_radius_meters ?? (journey as any).safeRadiusMeters ?? 200,
      id: 'jny_' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
    };
    LocalStorageDB.setItem('journeys', [newJourney, ...journeys]);

    // Sync to backend
    this.syncToApi('save_journey', { userId: newJourney.owner_user_id, journey: newJourney });

    return newJourney;
  }

  async updateJourney(id: string, updates: Partial<Journey>): Promise<Journey> {
    const journeys = LocalStorageDB.getItem<Journey[]>('journeys', []);
    let updated: Journey | null = null;

    const newJourneys = journeys.map((j) => {
      if (j.id === id) {
        updated = { ...j, ...updates };
        return updated;
      }
      return j;
    });

    if (!updated) throw new Error('Journey not found.');
    LocalStorageDB.setItem('journeys', newJourneys);

    // Sync to backend
    const savedJourney = updated as Journey;
    this.syncToApi('save_journey', { userId: savedJourney.owner_user_id, journey: savedJourney });

    return savedJourney;
  }

  // --- Incidents (Authorized access check) ---
  async getIncidents(userId: string, isContactRole = false, contactEmail?: string): Promise<Incident[]> {
    const incidents = LocalStorageDB.getItem<Incident[]>('incidents', []);
    const recipients = LocalStorageDB.getItem<IncidentRecipient[]>('incident_recipients', []);

    if (!isContactRole) {
      // Owner only sees their own incidents
      return incidents.filter((i) => i.owner_user_id === userId);
    } else {
      // Contact only sees incidents where they are assigned in incident_recipients
      return incidents.filter((i) => {
        const assigned = recipients.filter((r) => r.incident_id === i.id);
        return assigned.some(
          (r) =>
            r.contact_id === userId ||
            (contactEmail && r.contact_email.toLowerCase() === contactEmail.toLowerCase())
        );
      });
    }
  }

  async createIncident(
    incident: Omit<Incident, 'id' | 'created_at' | 'updated_at'>,
    recipients: Omit<IncidentRecipient, 'id' | 'incident_id'>[],
    initialEvent: Omit<IncidentEvent, 'id' | 'created_at' | 'incident_id'>
  ): Promise<{ incident: Incident; recipients: IncidentRecipient[] }> {
    const now = new Date().toISOString();
    const newIncId = 'inc_' + Math.random().toString(36).substring(2, 9);

    const newIncident: Incident = {
      ...incident,
      id: newIncId,
      created_at: now,
      updated_at: now,
    };

    const newRecipients: IncidentRecipient[] = recipients.map((r) => ({
      ...r,
      id: 'ir_' + Math.random().toString(36).substring(2, 9),
      incident_id: newIncId,
    }));

    const newEvent: IncidentEvent = {
      ...initialEvent,
      id: 'ev_' + Math.random().toString(36).substring(2, 9),
      incident_id: newIncId,
      created_at: now,
    };

    const curIncidents = LocalStorageDB.getItem<Incident[]>('incidents', []);
    const curRecipients = LocalStorageDB.getItem<IncidentRecipient[]>('incident_recipients', []);
    const curEvents = LocalStorageDB.getItem<IncidentEvent[]>('incident_events', []);

    LocalStorageDB.setItem('incidents', [newIncident, ...curIncidents]);
    LocalStorageDB.setItem('incident_recipients', [...newRecipients, ...curRecipients]);
    LocalStorageDB.setItem('incident_events', [newEvent, ...curEvents]);

    return { incident: newIncident, recipients: newRecipients };
  }

  async updateIncident(incidentId: string, updates: Partial<Incident>): Promise<Incident> {
    const session = await this.getCurrentSession();
    const callerId = session?.user.id;
    const incidents = LocalStorageDB.getItem<Incident[]>('incidents', []);
    const recipients = LocalStorageDB.getItem<IncidentRecipient[]>('incident_recipients', []);
    
    const target = incidents.find((i) => i.id === incidentId);
    if (!target) throw new Error('Incident not found.');

    // Authorization verification: caller must be incident owner or authorized recipient
    if (callerId) {
      const isOwner = target.owner_user_id === callerId;
      const isAssignedRecipient = recipients.some(
        (r) => r.incident_id === incidentId && (r.contact_id === callerId || r.contact_email.toLowerCase() === session.user.email.toLowerCase())
      );

      if (!isOwner && !isAssignedRecipient) {
        throw new Error('Unauthorized: You are not authorized to access or modify this incident.');
      }
    }

    let updated: Incident | null = null;
    const newIncidents = incidents.map((i) => {
      if (i.id === incidentId) {
        updated = { ...i, ...updates, updated_at: new Date().toISOString() };
        return updated;
      }
      return i;
    });

    LocalStorageDB.setItem('incidents', newIncidents);
    return updated!;
  }

  // --- Recipients ---
  async getIncidentRecipients(incidentId?: string): Promise<IncidentRecipient[]> {
    const recipients = LocalStorageDB.getItem<IncidentRecipient[]>('incident_recipients', []);
    return incidentId ? recipients.filter((r) => r.incident_id === incidentId) : recipients;
  }

  async updateRecipient(recipientId: string, updates: Partial<IncidentRecipient>): Promise<IncidentRecipient> {
    const session = await this.getCurrentSession();
    const callerEmail = session?.user.email?.toLowerCase();
    const recipients = LocalStorageDB.getItem<IncidentRecipient[]>('incident_recipients', []);
    
    const target = recipients.find((r) => r.id === recipientId);
    if (!target) throw new Error('Recipient record not found.');

    // Authorization verification: only the recipient contact or incident owner may update response status
    if (callerEmail && target.contact_email.toLowerCase() !== callerEmail) {
      const incidents = LocalStorageDB.getItem<Incident[]>('incidents', []);
      const parentInc = incidents.find((i) => i.id === target.incident_id);
      if (parentInc?.owner_user_id !== session?.user.id) {
        throw new Error('Unauthorized: You can only update your own responder status.');
      }
    }

    let updated: IncidentRecipient | null = null;
    const newRecipients = recipients.map((r) => {
      if (r.id === recipientId) {
        updated = { ...r, ...updates };
        return updated;
      }
      return r;
    });

    LocalStorageDB.setItem('incident_recipients', newRecipients);
    return updated!;
  }

  // --- Events ---
  async getIncidentEvents(incidentId?: string): Promise<IncidentEvent[]> {
    const events = LocalStorageDB.getItem<IncidentEvent[]>('incident_events', []);
    return incidentId ? events.filter((e) => e.incident_id === incidentId) : events;
  }

  async logIncidentEvent(event: Omit<IncidentEvent, 'id' | 'created_at'>): Promise<IncidentEvent> {
    const events = LocalStorageDB.getItem<IncidentEvent[]>('incident_events', []);
    const newEvent: IncidentEvent = {
      ...event,
      id: 'ev_' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
    };
    LocalStorageDB.setItem('incident_events', [newEvent, ...events]);
    return newEvent;
  }

  // --- Location Shares ---
  async getActiveLocationShare(userId: string): Promise<LocationShare | null> {
    const shares = LocalStorageDB.getItem<LocationShare[]>('location_shares', []);
    const now = new Date().toISOString();
    return shares.find((s) => s.user_id === userId && s.is_active && s.expires_at > now) || null;
  }

  async getLocationShareForSession(
    sessionId: string,
    sessionType: 'incident' | 'journey'
  ): Promise<LocationShare | null> {
    const shares = LocalStorageDB.getItem<LocationShare[]>('location_shares', []);
    const now = new Date().toISOString();
    return (
      shares.find(
        (s) =>
          s.session_id === sessionId &&
          s.session_type === sessionType &&
          s.is_active &&
          s.expires_at > now
      ) || null
    );
  }

  async createLocationShare(share: Omit<LocationShare, 'id' | 'started_at'>): Promise<LocationShare> {
    const shares = LocalStorageDB.getItem<LocationShare[]>('location_shares', []);
    const newShare: LocationShare = {
      ...share,
      id: 'loc_' + Math.random().toString(36).substring(2, 9),
      started_at: new Date().toISOString(),
    };
    LocalStorageDB.setItem('location_shares', [newShare, ...shares]);
    return newShare;
  }

  async stopLocationShare(shareId: string): Promise<void> {
    const shares = LocalStorageDB.getItem<LocationShare[]>('location_shares', []);
    const updated = shares.map((s) => (s.id === shareId ? { ...s, is_active: false } : s));
    LocalStorageDB.setItem('location_shares', updated);
  }

  async recordLocationUpdate(update: Omit<LocationUpdate, 'id' | 'created_at'>): Promise<LocationUpdate> {
    const updates = LocalStorageDB.getItem<LocationUpdate[]>('location_updates', []);
    const newUpdate: LocationUpdate = {
      ...update,
      id: 'locup_' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
    };
    LocalStorageDB.setItem('location_updates', [newUpdate, ...updates]);
    return newUpdate;
  }

  async getLocationUpdates(shareId: string, requestingUserId?: string): Promise<LocationUpdate[]> {
    const shares = LocalStorageDB.getItem<LocationShare[]>('location_shares', []);
    const share = shares.find((s) => s.id === shareId);
    if (!share || !share.is_active || share.expires_at <= new Date().toISOString()) {
      return [];
    }

    // Backend access control enforcement: caller must be owner or authorized recipient
    if (requestingUserId && requestingUserId !== share.user_id) {
      const contacts = LocalStorageDB.getItem<TrustedContact[]>('trusted_contacts', []);
      const callerContact = contacts.find(
        (c) =>
          (c.contact_user_id === requestingUserId || c.id === requestingUserId) &&
          c.user_id === share.user_id
      );

      const isAllowedRecipient =
        (share.allowed_contact_ids.includes(requestingUserId) ||
          (callerContact && share.allowed_contact_ids.includes(callerContact.id))) &&
        callerContact?.can_view_location === true &&
        callerContact?.status === 'accepted';

      if (!isAllowedRecipient) {
        throw new Error('Unauthorized: You are not authorized to view location updates for this session.');
      }
    }

    const updates = LocalStorageDB.getItem<LocationUpdate[]>('location_updates', []);
    return updates.filter((u) => u.share_id === shareId);
  }

  async getLatestLocationUpdate(shareId: string, requestingUserId?: string): Promise<LocationUpdate | null> {
    const updates = await this.getLocationUpdates(shareId, requestingUserId);
    return updates.length > 0 ? updates[0] : null;
  }

  // --- Notifications ---
  async getNotifications(userId: string, recipientEmail?: string): Promise<NotificationRecord[]> {
    const records = LocalStorageDB.getItem<NotificationRecord[]>('notification_records', []);
    return records.filter(
      (r) =>
        r.user_id === userId ||
        (recipientEmail && r.recipient_email.toLowerCase() === recipientEmail.toLowerCase())
    );
  }

  async logNotification(record: Omit<NotificationRecord, 'id' | 'created_at'>): Promise<NotificationRecord> {
    const records = LocalStorageDB.getItem<NotificationRecord[]>('notification_records', []);
    const newRecord: NotificationRecord = {
      ...record,
      id: 'notif_' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
    };
    LocalStorageDB.setItem('notification_records', [newRecord, ...records]);
    return newRecord;
  }

  // --- Realtime sync subscription ---
  subscribeToChanges(onUpdate: (table: string, payload: any) => void): () => void {
    if (!this.channel) return () => {};
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'TABLE_UPDATE') {
        onUpdate(e.data.table, e.data.data);
      }
    };
    this.channel.addEventListener('message', handler);
    return () => this.channel?.removeEventListener('message', handler);
  }
}
