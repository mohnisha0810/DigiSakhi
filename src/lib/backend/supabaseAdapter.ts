// SafeSphere Real Supabase Cloud Adapter
// Implements typed data access via @supabase/supabase-js with Row Level Security (RLS)

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
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

export class SupabaseBackendAdapter implements BackendAdapter {
  readonly mode = 'supabase_cloud' as const;
  readonly isCloud = true as const;

  constructor(private supabase: SupabaseClient<Database>) {}

  // --- Authentication ---
  async signUp(params: {
    email: string;
    password: string;
    fullName: string;
    phoneNumber?: string;
    emergencyNotes?: string;
    medicalInfo?: string;
  }): Promise<AuthSession> {
    const { data, error } = await this.supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: {
          full_name: params.fullName,
          phone_number: params.phoneNumber,
          emergency_notes: params.emergencyNotes,
          medical_info: params.medicalInfo,
        },
      },
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Sign up failed. Please try again.');

    // Fetch user profile (created automatically via trigger handle_new_user)
    const profile = await this.getProfile(data.user.id);
    if (!profile) {
      // Fallback manual profile creation if trigger is deferred
      const newProf: UserProfile = {
        id: data.user.id,
        email: data.user.email!,
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
      await (this.supabase.from('profiles') as any).upsert(newProf);
      return { user: { id: data.user.id, email: data.user.email! }, profile: newProf, token: data.session?.access_token };
    }

    return {
      user: { id: data.user.id, email: data.user.email! },
      profile,
      token: data.session?.access_token,
    };
  }

  async signIn(email: string, password = ''): Promise<AuthSession> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Login failed.');

    const profile = await this.getProfile(data.user.id);
    if (!profile) throw new Error('User profile record missing.');

    return {
      user: { id: data.user.id, email: data.user.email! },
      profile,
      token: data.session?.access_token,
    };
  }

  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
  }

  async getCurrentSession(): Promise<AuthSession | null> {
    const { data } = await this.supabase.auth.getSession();
    if (!data.session?.user) return null;

    const profile = await this.getProfile(data.session.user.id);
    if (!profile) return null;

    return {
      user: { id: data.session.user.id, email: data.session.user.email! },
      profile,
      token: data.session.access_token,
    };
  }

  // --- Profiles ---
  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) return null;
    return data as UserProfile;
  }

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const { data, error } = await (this.supabase
      .from('profiles') as any)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as UserProfile;
  }

  // --- Contacts ---
  async getContacts(userId: string): Promise<TrustedContact[]> {
    const { data, error } = await this.supabase
      .from('trusted_contacts')
      .select('*')
      .eq('user_id', userId)
      .order('escalation_order', { ascending: true });

    if (error) throw new Error(error.message);
    const contacts = (data || []) as TrustedContact[];

    // Auto-reconciliation: check for any pending contacts with accepted invitations
    const pendingContacts = contacts.filter((c) => c.status !== 'accepted');
    if (pendingContacts.length > 0) {
      try {
        const { data: acceptedInvs } = await this.supabase
          .from('contact_invitations')
          .select('*')
          .eq('inviter_id', userId)
          .eq('status', 'accepted');

        if (acceptedInvs && acceptedInvs.length > 0) {
          for (const contact of pendingContacts) {
            const match = acceptedInvs.find((inv: any) =>
              (inv.invitee_email && contact.email && inv.invitee_email.toLowerCase() === contact.email.toLowerCase()) ||
              (inv.invitee_phone && contact.phone_number && inv.invitee_phone === contact.phone_number)
            );
            if (match) {
              contact.status = 'accepted';
              contact.can_view_location = true;
              contact.contact_user_id = (match as any).responder_user_id || contact.contact_user_id;

              // Fire and forget background update to persist it
              (this.supabase.from('trusted_contacts') as any)
                .update({
                  status: 'accepted',
                  can_view_location: true,
                  contact_user_id: contact.contact_user_id,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', contact.id)
                .then(() => {})
                .catch(() => {});
            }
          }
        }
      } catch (reconcileErr) {
        console.warn('Contacts auto-reconciliation error:', reconcileErr);
      }
    }

    return contacts;
  }

  async createContact(contact: Omit<TrustedContact, 'id' | 'created_at'>): Promise<TrustedContact> {
    const { data, error } = await (this.supabase
      .from('trusted_contacts') as any)
      .insert(contact)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as TrustedContact;
  }

  async updateContact(contactId: string, updates: Partial<TrustedContact>): Promise<TrustedContact> {
    const { data, error } = await (this.supabase
      .from('trusted_contacts') as any)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', contactId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as TrustedContact;
  }

  async deleteContact(contactId: string): Promise<void> {
    const { error } = await this.supabase
      .from('trusted_contacts')
      .delete()
      .eq('id', contactId);

    if (error) throw new Error(error.message);
  }

  async reorderContacts(userId: string, contactIdsInOrder: string[]): Promise<TrustedContact[]> {
    const promises = contactIdsInOrder.map((id, index) =>
      (this.supabase.from('trusted_contacts') as any)
        .update({ escalation_order: index + 1 })
        .eq('id', id)
        .eq('user_id', userId)
    );
    await Promise.all(promises);
    return this.getContacts(userId);
  }

  // --- Invitations ---
  async getInvitations(userId: string): Promise<ContactInvitation[]> {
    const { data, error } = await this.supabase
      .from('contact_invitations')
      .select('*')
      .eq('inviter_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as ContactInvitation[];
  }

  async createInvitation(invitation: Omit<ContactInvitation, 'id' | 'created_at'>): Promise<ContactInvitation> {
    const { data, error } = await (this.supabase
      .from('contact_invitations') as any)
      .insert(invitation)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as ContactInvitation;
  }

  async getInvitationByToken(token: string): Promise<ContactInvitation | null> {
    const { data, error } = await this.supabase
      .from('contact_invitations')
      .select('*')
      .eq('invitation_token', token)
      .single();

    if (error || !data) return null;
    return data as ContactInvitation;
  }

  async acceptInvitation(invitationId: string, acceptingUserId?: string): Promise<void> {
    const { data: inv, error: findErr } = await this.supabase
      .from('contact_invitations')
      .select('*')
      .eq('id', invitationId)
      .single();

    if (findErr || !inv) throw new Error('Invitation not found.');

    const respondedAt = new Date().toISOString();

    await (this.supabase.from('contact_invitations') as any)
      .update({
        status: 'accepted',
        delivery_status: 'accepted',
        responded_at: respondedAt,
        responder_user_id: acceptingUserId || null,
      })
      .eq('id', invitationId);

    // Update trusted_contacts by user_id and email
    if ((inv as any).invitee_email) {
      await (this.supabase.from('trusted_contacts') as any)
        .update({
          status: 'accepted',
          can_view_location: true,
          contact_user_id: acceptingUserId || null,
          updated_at: respondedAt,
        })
        .eq('user_id', (inv as any).inviter_id)
        .ilike('email', (inv as any).invitee_email);
    }

    // Also update by phone_number if available
    if ((inv as any).invitee_phone) {
      await (this.supabase.from('trusted_contacts') as any)
        .update({
          status: 'accepted',
          can_view_location: true,
          contact_user_id: acceptingUserId || null,
          updated_at: respondedAt,
        })
        .eq('user_id', (inv as any).inviter_id)
        .eq('phone_number', (inv as any).invitee_phone);
    }
  }

  async declineInvitation(invitationId: string): Promise<void> {
    const { data: inv, error: findErr } = await this.supabase
      .from('contact_invitations')
      .select('*')
      .eq('id', invitationId)
      .single();

    if (findErr || !inv) throw new Error('Invitation not found.');

    await (this.supabase.from('contact_invitations') as any)
      .update({
        status: 'declined',
        delivery_status: 'declined',
        responded_at: new Date().toISOString(),
      })
      .eq('id', invitationId);

    await (this.supabase.from('trusted_contacts') as any)
      .update({
        status: 'declined',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', (inv as any).inviter_id)
      .eq('email', (inv as any).invitee_email);
  }

  async updateInvitationDelivery(
    invitationId: string,
    updates: Partial<ContactInvitation>
  ): Promise<ContactInvitation> {
    const { data, error } = await (this.supabase
      .from('contact_invitations') as any)
      .update(updates)
      .eq('id', invitationId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as ContactInvitation;
  }

  // --- Protocols ---
  async getProtocols(userId: string): Promise<SafetyProtocol[]> {
    const { data, error } = await this.supabase
      .from('safety_protocols')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return (data || []) as SafetyProtocol[];
  }

  async saveProtocol(protocol: Omit<SafetyProtocol, 'id' | 'created_at'> & { id?: string }): Promise<SafetyProtocol> {
    if (protocol.id) {
      const { data, error } = await (this.supabase
        .from('safety_protocols') as any)
        .update({ ...protocol, updated_at: new Date().toISOString() })
        .eq('id', protocol.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as SafetyProtocol;
    } else {
      const { data, error } = await (this.supabase
        .from('safety_protocols') as any)
        .insert(protocol)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as SafetyProtocol;
    }
  }

  async setDefaultProtocol(userId: string, protocolId: string): Promise<void> {
    await (this.supabase.from('safety_protocols') as any)
      .update({ is_default: false })
      .eq('user_id', userId);

    await (this.supabase.from('safety_protocols') as any)
      .update({ is_default: true })
      .eq('id', protocolId)
      .eq('user_id', userId);
  }

  async deleteProtocol(protocolId: string): Promise<void> {
    const { error } = await this.supabase
      .from('safety_protocols')
      .delete()
      .eq('id', protocolId);

    if (error) throw new Error(error.message);
  }

  // --- Check-ins ---
  async getCheckIns(userId: string): Promise<CheckIn[]> {
    const { data, error } = await this.supabase
      .from('check_ins')
      .select('*')
      .eq('owner_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as CheckIn[];
  }

  async createCheckIn(checkIn: Omit<CheckIn, 'id' | 'created_at'>): Promise<CheckIn> {
    const { data, error } = await (this.supabase
      .from('check_ins') as any)
      .insert(checkIn)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as CheckIn;
  }

  async updateCheckIn(id: string, updates: Partial<CheckIn>): Promise<CheckIn> {
    const { data, error } = await (this.supabase
      .from('check_ins') as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as CheckIn;
  }

  // --- Journeys ---
  async getJourneys(userId: string): Promise<Journey[]> {
    const { data, error } = await this.supabase
      .from('journeys')
      .select('*')
      .eq('owner_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as Journey[];
  }

  async createJourney(journey: Omit<Journey, 'id' | 'created_at'>): Promise<Journey> {
    const { data, error } = await (this.supabase
      .from('journeys') as any)
      .insert(journey)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Journey;
  }

  async updateJourney(id: string, updates: Partial<Journey>): Promise<Journey> {
    const { data, error } = await (this.supabase
      .from('journeys') as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Journey;
  }

  // --- Incidents ---
  async getIncidents(userId: string, isContactRole = false, contactEmail?: string): Promise<Incident[]> {
    if (!isContactRole) {
      const { data, error } = await this.supabase
        .from('incidents')
        .select('*')
        .eq('owner_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return (data || []) as Incident[];
    } else {
      // Authorized contact: query incidents via incident_recipients join or RLS
      const { data, error } = await this.supabase
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return (data || []) as Incident[];
    }
  }

  async createIncident(
    incident: Omit<Incident, 'id' | 'created_at' | 'updated_at'>,
    recipients: Omit<IncidentRecipient, 'id' | 'incident_id'>[],
    initialEvent: Omit<IncidentEvent, 'id' | 'created_at' | 'incident_id'>
  ): Promise<{ incident: Incident; recipients: IncidentRecipient[] }> {
    const { data: newInc, error: incErr } = await (this.supabase
      .from('incidents') as any)
      .insert(incident)
      .select()
      .single();

    if (incErr) throw new Error(incErr.message);

    const mappedRecipients = recipients.map((r) => ({
      ...r,
      incident_id: newInc.id,
    }));

    const { data: newRecs, error: recErr } = await (this.supabase
      .from('incident_recipients') as any)
      .insert(mappedRecipients)
      .select();

    if (recErr) throw new Error(recErr.message);

    await (this.supabase.from('incident_events') as any).insert({
      ...initialEvent,
      incident_id: newInc.id,
    });

    return { incident: newInc as Incident, recipients: (newRecs || []) as IncidentRecipient[] };
  }

  async updateIncident(incidentId: string, updates: Partial<Incident>): Promise<Incident> {
    const { data, error } = await (this.supabase
      .from('incidents') as any)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', incidentId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Incident;
  }

  // --- Recipients ---
  async getIncidentRecipients(incidentId?: string): Promise<IncidentRecipient[]> {
    let query = this.supabase.from('incident_recipients').select('*');
    if (incidentId) {
      query = query.eq('incident_id', incidentId);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []) as IncidentRecipient[];
  }

  async updateRecipient(recipientId: string, updates: Partial<IncidentRecipient>): Promise<IncidentRecipient> {
    const { data, error } = await (this.supabase
      .from('incident_recipients') as any)
      .update(updates)
      .eq('id', recipientId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as IncidentRecipient;
  }

  // --- Events ---
  async getIncidentEvents(incidentId?: string): Promise<IncidentEvent[]> {
    let query = this.supabase
      .from('incident_events')
      .select('*')
      .order('created_at', { ascending: false });

    if (incidentId) {
      query = query.eq('incident_id', incidentId);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []) as IncidentEvent[];
  }

  async logIncidentEvent(event: Omit<IncidentEvent, 'id' | 'created_at'>): Promise<IncidentEvent> {
    const { data, error } = await (this.supabase
      .from('incident_events') as any)
      .insert(event)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as IncidentEvent;
  }

  // --- Location Shares ---
  async getActiveLocationShare(userId: string): Promise<LocationShare | null> {
    const { data, error } = await this.supabase
      .from('location_shares')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return data as LocationShare;
  }

  async getLocationShareForSession(
    sessionId: string,
    sessionType: 'incident' | 'journey'
  ): Promise<LocationShare | null> {
    const { data, error } = await this.supabase
      .from('location_shares')
      .select('*')
      .eq('session_id', sessionId)
      .eq('session_type', sessionType)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return data as LocationShare;
  }

  async createLocationShare(share: Omit<LocationShare, 'id' | 'started_at'>): Promise<LocationShare> {
    const { data, error } = await (this.supabase
      .from('location_shares') as any)
      .insert(share)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as LocationShare;
  }

  async stopLocationShare(shareId: string): Promise<void> {
    await (this.supabase.from('location_shares') as any)
      .update({ is_active: false })
      .eq('id', shareId);
  }

  async recordLocationUpdate(update: Omit<LocationUpdate, 'id' | 'created_at'>): Promise<LocationUpdate> {
    const { data, error } = await (this.supabase
      .from('location_updates') as any)
      .insert(update)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as LocationUpdate;
  }

  async getLocationUpdates(shareId: string, requestingUserId?: string): Promise<LocationUpdate[]> {
    // Supabase RLS enforces "Authorized contacts read active location updates" directly at DB
    const { data, error } = await this.supabase
      .from('location_updates')
      .select('*')
      .eq('share_id', shareId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as LocationUpdate[];
  }

  async getLatestLocationUpdate(shareId: string, requestingUserId?: string): Promise<LocationUpdate | null> {
    const { data, error } = await this.supabase
      .from('location_updates')
      .select('*')
      .eq('share_id', shareId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return data as LocationUpdate;
  }

  // --- Notifications ---
  async getNotifications(userId: string, recipientEmail?: string): Promise<NotificationRecord[]> {
    let query = this.supabase
      .from('notification_records')
      .select('*')
      .order('created_at', { ascending: false });

    if (recipientEmail) {
      query = query.or(`user_id.eq.${userId},recipient_email.eq.${recipientEmail}`);
    } else {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []) as NotificationRecord[];
  }

  async logNotification(record: Omit<NotificationRecord, 'id' | 'created_at'>): Promise<NotificationRecord> {
    const { data, error } = await (this.supabase
      .from('notification_records') as any)
      .insert(record)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as NotificationRecord;
  }

  // --- Supabase Realtime Subscription ---
  subscribeToChanges(onUpdate: (table: string, payload: any) => void): () => void {
    const channel = this.supabase
      .channel('safesphere_realtime_all')
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        onUpdate(payload.table, payload.new || payload.old);
      })
      .subscribe();

    return () => {
      this.supabase.removeChannel(channel);
    };
  }
}
