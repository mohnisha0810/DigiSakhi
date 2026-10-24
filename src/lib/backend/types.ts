// SafeSphere Unified Backend Data Access Layer Types

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

export interface AuthSession {
  user: {
    id: string;
    email: string;
  };
  profile: UserProfile;
  token?: string;
}

export interface BackendAdapter {
  // Mode identifier
  readonly mode: 'supabase_cloud' | 'local_dev_adapter';
  readonly isCloud: boolean;

  // Authentication & Session
  signUp(params: {
    email: string;
    password: string;
    fullName: string;
    phoneNumber?: string;
    emergencyNotes?: string;
    medicalInfo?: string;
  }): Promise<AuthSession>;

  signIn(email: string, password?: string): Promise<AuthSession>;
  signOut(): Promise<void>;
  getCurrentSession(): Promise<AuthSession | null>;

  // Profiles
  getProfile(userId: string): Promise<UserProfile | null>;
  updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile>;

  // Contacts
  getContacts(userId: string): Promise<TrustedContact[]>;
  createContact(contact: Omit<TrustedContact, 'id' | 'created_at'>): Promise<TrustedContact>;
  updateContact(contactId: string, updates: Partial<TrustedContact>): Promise<TrustedContact>;
  deleteContact(contactId: string): Promise<void>;
  reorderContacts(userId: string, contactIdsInOrder: string[]): Promise<TrustedContact[]>;

  // Invitations
  getInvitations(userId: string): Promise<ContactInvitation[]>;
  createInvitation(invitation: Omit<ContactInvitation, 'id' | 'created_at'>): Promise<ContactInvitation>;
  getInvitationByToken(token: string): Promise<ContactInvitation | null>;
  acceptInvitation(invitationId: string, acceptingUserId?: string): Promise<void>;
  declineInvitation(invitationId: string): Promise<void>;
  updateInvitationDelivery(
    invitationId: string,
    updates: Partial<ContactInvitation>
  ): Promise<ContactInvitation>;

  // Protocols
  getProtocols(userId: string): Promise<SafetyProtocol[]>;
  saveProtocol(protocol: Omit<SafetyProtocol, 'id' | 'created_at'> & { id?: string }): Promise<SafetyProtocol>;
  setDefaultProtocol(userId: string, protocolId: string): Promise<void>;
  deleteProtocol(protocolId: string): Promise<void>;

  // Check-ins
  getCheckIns(userId: string): Promise<CheckIn[]>;
  createCheckIn(checkIn: Omit<CheckIn, 'id' | 'created_at'>): Promise<CheckIn>;
  updateCheckIn(id: string, updates: Partial<CheckIn>): Promise<CheckIn>;

  // Journeys
  getJourneys(userId: string): Promise<Journey[]>;
  createJourney(journey: Omit<Journey, 'id' | 'created_at'>): Promise<Journey>;
  updateJourney(id: string, updates: Partial<Journey>): Promise<Journey>;

  // Incidents
  getIncidents(userId: string, isContactRole?: boolean, contactEmail?: string): Promise<Incident[]>;
  createIncident(
    incident: Omit<Incident, 'id' | 'created_at' | 'updated_at'>,
    recipients: Omit<IncidentRecipient, 'id' | 'incident_id'>[],
    initialEvent: Omit<IncidentEvent, 'id' | 'created_at' | 'incident_id'>
  ): Promise<{ incident: Incident; recipients: IncidentRecipient[] }>;
  updateIncident(incidentId: string, updates: Partial<Incident>): Promise<Incident>;

  // Recipients
  getIncidentRecipients(incidentId?: string): Promise<IncidentRecipient[]>;
  updateRecipient(recipientId: string, updates: Partial<IncidentRecipient>): Promise<IncidentRecipient>;

  // Incident Events
  getIncidentEvents(incidentId?: string): Promise<IncidentEvent[]>;
  logIncidentEvent(event: Omit<IncidentEvent, 'id' | 'created_at'>): Promise<IncidentEvent>;

  // Location Shares & Updates
  getActiveLocationShare(userId: string): Promise<LocationShare | null>;
  getLocationShareForSession(sessionId: string, sessionType: 'incident' | 'journey'): Promise<LocationShare | null>;
  createLocationShare(share: Omit<LocationShare, 'id' | 'started_at'>): Promise<LocationShare>;
  stopLocationShare(shareId: string): Promise<void>;
  recordLocationUpdate(update: Omit<LocationUpdate, 'id' | 'created_at'>): Promise<LocationUpdate>;
  getLocationUpdates(shareId: string, requestingUserId?: string): Promise<LocationUpdate[]>;
  getLatestLocationUpdate(shareId: string, requestingUserId?: string): Promise<LocationUpdate | null>;

  // Notifications
  getNotifications(userId: string, recipientEmail?: string): Promise<NotificationRecord[]>;
  logNotification(record: Omit<NotificationRecord, 'id' | 'created_at'>): Promise<NotificationRecord>;

  // Realtime subscription
  subscribeToChanges(onUpdate: (table: string, payload: any) => void): () => void;
}
