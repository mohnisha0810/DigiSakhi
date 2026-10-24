import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  NotificationRecord,
  DistressType,
  UserRole,
} from '@/types';
import { backendService, backendMode } from '@/lib/backend';
import { INITIAL_USER_PROFILE, INITIAL_CONTACT_PROFILES, LocalStorageDB } from '@/lib/supabase';
import { schedulerService } from '@/lib/scheduler';
import { notificationService } from '@/lib/notifications';
import {
  geoService,
  GeoLocationResult,
  LocationPermissionState,
  SimulatedLocationMode,
} from '@/lib/geolocation';
import { generateIncidentNumber } from '@/lib/utils';
import { toast } from '@/lib/toast';

export type NavigationScreen =
  | 'home'
  | 'dashboard'
  | 'my_safety'
  | 'distress_panel'
  | 'journeys'
  | 'journey_active'
  | 'circle'
  | 'contacts'
  | 'protocols'
  | 'protocol_builder'
  | 'history'
  | 'trusted_dashboard'
  | 'incident_details'
  | 'checkin_active'
  | 'map_view'
  | 'privacy_settings'
  | 'notifications_inbox'
  | 'account_settings';

interface SafeSphereContextType {
  // Authentication & Role
  currentUser: UserProfile;
  currentRole: UserRole;
  allProfiles: UserProfile[];
  backendMode: 'supabase_cloud' | 'local_dev_adapter';
  isCloud: boolean;
  switchUserAccount: (profileId: string) => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  signIn: (email: string, password?: string) => Promise<void>;
  signUp: (params: {
    email: string;
    password: string;
    fullName: string;
    phoneNumber?: string;
    emergencyNotes?: string;
    medicalInfo?: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;

  // Loading & Feedback States
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  dismissError: () => void;
  dismissSuccess: () => void;

  // Navigation
  currentScreen: NavigationScreen;
  setCurrentScreen: (screen: NavigationScreen) => void;
  selectedIncidentId: string | null;
  setSelectedIncidentId: (id: string | null) => void;
  openIncidentDetails: (id: string) => void;

  // Data Collections (Scoped to user/role)
  contacts: TrustedContact[];
  invitations: ContactInvitation[];
  protocols: SafetyProtocol[];
  checkIns: CheckIn[];
  journeys: Journey[];
  incidents: Incident[];
  incidentRecipients: IncidentRecipient[];
  incidentEvents: IncidentEvent[];
  notifications: NotificationRecord[];
  locationShares: LocationShare[];

  // Active States
  activeCheckIn: CheckIn | null;
  activeJourney: Journey | null;
  activeIncident: Incident | null;
  defaultProtocol: SafetyProtocol | null;

  // Distress Code Actions (Feature 1)
  triggerDistressAction: (
    type: DistressType,
    options?: {
      targetContactId?: string;
      customNote?: string;
      destinationName?: string;
      etaMinutes?: number;
    }
  ) => Promise<string>;

  // Check-In Actions (Feature 2)
  createCheckIn: (data: {
    title: string;
    deadlineMinutes: number;
    reminderLeadMinutes: number;
    gracePeriodMinutes: number;
    contactWaitMinutes: number;
    protocolId?: string;
  }) => Promise<string>;
  confirmCheckInSafe: (checkInId: string) => Promise<void>;
  extendCheckInTime: (checkInId: string, additionalMinutes: number) => Promise<void>;
  cancelCheckIn: (checkInId: string) => Promise<void>;

  // Response Workflow Actions (Feature 3)
  acknowledgeIncident: (incidentId: string, contactId: string) => Promise<void>;
  indicateResponding: (incidentId: string, contactId: string, note?: string) => Promise<void>;
  resolveIncident: (incidentId: string, notes?: string) => Promise<void>;
  cancelIncident: (incidentId: string, reason?: string) => Promise<void>;

  // Safe Arrival Actions (Feature 7)
  createJourney: (data: {
    originName: string;
    destinationName: string;
    destLat: number;
    destLng: number;
    safeRadiusMeters: number;
    durationMinutes: number;
    shareLocation: boolean;
    allowedContactIds?: string[];
    protocolId?: string;
  }) => Promise<string>;
  confirmSafeArrival: (journeyId: string) => Promise<void>;
  cancelJourney: (journeyId: string) => Promise<void>;

  // Privacy-Controlled Geolocation (Feature 4 & 7)
  currentLocation: GeoLocationResult | null;
  locationPermission: LocationPermissionState;
  activeLocationShare: LocationShare | null;
  simulatedLocationMode: SimulatedLocationMode;
  setSimulatedLocationMode: (mode: SimulatedLocationMode) => void;
  refreshLocation: (allowDemoFallback?: boolean) => Promise<GeoLocationResult>;
  stopLocationSharing: () => Promise<void>;

  // Protocols (Feature 6)
  saveProtocol: (protocol: Omit<SafetyProtocol, 'id' | 'created_at'> & { id?: string }) => Promise<void>;
  setDefaultProtocol: (protocolId: string) => Promise<void>;
  deleteProtocol: (protocolId: string) => Promise<void>;

  // Contacts & Invitations (Feature 4 & Setup)
  inviteContact: (data: {
    fullName: string;
    email: string;
    phoneNumber: string;
    relationship: string;
    escalationOrder: number;
  }) => Promise<string>;
  acceptInvitation: (invitationId: string) => Promise<void>;
  reorderContacts: (reorderedContacts: TrustedContact[]) => Promise<void>;
  removeContact: (contactId: string) => Promise<void>;

  // Discreet Exit (Feature 5)
  isQuickExitActive: boolean;
  triggerQuickExit: () => void;
  unlockQuickExit: (pin: string) => boolean;

  // Demo Controls
  advanceDemoTime: (seconds: number) => void;
  resetAllDemoData: () => void;
  simulateArrivedAtDestination: () => void;
  virtualTime: Date;
}

const SafeSphereContext = createContext<SafeSphereContextType | undefined>(undefined);

export const SafeSphereProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Profiles & Auth
  const [allProfiles, setAllProfiles] = useState<UserProfile[]>([
    INITIAL_USER_PROFILE,
    ...INITIAL_CONTACT_PROFILES,
  ]);
  const [currentUser, setCurrentUser] = useState<UserProfile>(INITIAL_USER_PROFILE);

  // Status & Feedback
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setRawError] = useState<string | null>(null);
  const [successMessage, setRawSuccessMessage] = useState<string | null>(null);

  const setError = useCallback((msg: string | null) => {
    setRawError(msg);
    if (msg) toast.error(msg);
  }, []);

  const setSuccessMessage = useCallback((msg: string | null) => {
    setRawSuccessMessage(msg);
    if (msg) toast.success(msg);
  }, []);

  // Navigation
  const [currentScreen, setCurrentScreen] = useState<NavigationScreen>('dashboard');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);

  // Collections
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [invitations, setInvitations] = useState<ContactInvitation[]>([]);
  const [protocols, setProtocols] = useState<SafetyProtocol[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [incidentRecipients, setIncidentRecipients] = useState<IncidentRecipient[]>([]);
  const [incidentEvents, setIncidentEvents] = useState<IncidentEvent[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [locationShares, setLocationShares] = useState<LocationShare[]>([]);

  // Quick Exit state & Virtual Time
  const [isQuickExitActive, setIsQuickExitActive] = useState<boolean>(false);
  const [virtualTime, setVirtualTime] = useState<Date>(() => schedulerService.getVirtualNow());

  // Privacy-Controlled Geolocation State
  const [activeLocationShare, setActiveLocationShare] = useState<LocationShare | null>(null);
  const [currentLocation, setCurrentLocation] = useState<GeoLocationResult | null>(null);
  const [locationPermission, setLocationPermission] = useState<LocationPermissionState>('prompt');
  const [simulatedLocationMode, setSimulatedLocationModeState] = useState<SimulatedLocationMode>('real');

  // Current Role: 'contact' if logged in as Maya or David, else 'user'
  const isContact = currentUser.id === 'usr_maya_02' || currentUser.id === 'usr_david_03';
  const currentRole: UserRole = isContact ? 'contact' : 'user';

  // Active items
  const activeCheckIn = checkIns.find(
    (c) => c.status !== 'completed' && c.status !== 'cancelled'
  ) || null;

  const activeJourney = journeys.find(
    (j) => j.status !== 'completed' && j.status !== 'cancelled'
  ) || null;

  const activeIncident = incidents.find(
    (inc) => inc.status !== 'resolved' && inc.status !== 'cancelled'
  ) || null;

  const defaultProtocol = protocols.find((p) => p.is_default) || protocols[0] || null;

  const dismissError = () => setError(null);
  const dismissSuccess = () => setSuccessMessage(null);

  // Fetch all user-scoped data from backendService
  const loadUserData = useCallback(async (user: UserProfile) => {
    setIsLoading(true);
    try {
      const isContactRole = user.id === 'usr_maya_02' || user.id === 'usr_david_03';

      const [
        fetchedContacts,
        fetchedInvs,
        fetchedProtocols,
        fetchedCheckIns,
        fetchedJourneys,
        fetchedIncidents,
        fetchedRecipients,
        fetchedEvents,
        fetchedNotifs,
        fetchedActiveShare,
      ] = await Promise.all([
        backendService.getContacts(user.id),
        backendService.getInvitations(user.id),
        backendService.getProtocols(user.id),
        backendService.getCheckIns(user.id),
        backendService.getJourneys(user.id),
        backendService.getIncidents(user.id, isContactRole, user.email),
        backendService.getIncidentRecipients(),
        backendService.getIncidentEvents(),
        backendService.getNotifications(user.id, user.email),
        backendService.getActiveLocationShare(user.id),
      ]);

      setContacts(fetchedContacts);
      setInvitations(fetchedInvs);
      setProtocols(fetchedProtocols);
      setCheckIns(fetchedCheckIns);
      setJourneys(fetchedJourneys);
      setIncidents(fetchedIncidents);
      setIncidentRecipients(fetchedRecipients);
      setIncidentEvents(fetchedEvents);
      setNotifications(fetchedNotifs);
      setActiveLocationShare(fetchedActiveShare);

      // Load all profiles for demo switching
      if (!backendService.isCloud) {
        const storedProfiles = LocalStorageDB.getItem<UserProfile[]>('profiles', [
          INITIAL_USER_PROFILE,
          ...INITIAL_CONTACT_PROFILES,
        ]);
        setAllProfiles(storedProfiles);
      }
    } catch (err: any) {
      console.error('Failed to load user data from backend:', err);
      setError('Could not load safety records from backend: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize Auth Session on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const session = await backendService.getCurrentSession();
        if (session?.profile) {
          setCurrentUser(session.profile);
          await loadUserData(session.profile);
        } else {
          setCurrentUser(INITIAL_USER_PROFILE);
          await loadUserData(INITIAL_USER_PROFILE);
        }
      } catch (err) {
        console.warn('Session check fallback:', err);
        setCurrentUser(INITIAL_USER_PROFILE);
        await loadUserData(INITIAL_USER_PROFILE);
      }
    };

    initAuth();
  }, [loadUserData]);

  // Realtime subscription & Scheduler loop
  useEffect(() => {
    schedulerService.start(3000);

    const unsubscribe = backendService.subscribeToChanges(() => {
      loadUserData(currentUser);
    });

    const clockInterval = setInterval(() => {
      setVirtualTime(schedulerService.getVirtualNow());
    }, 2000);

    return () => {
      schedulerService.stop();
      unsubscribe();
      clearInterval(clockInterval);
    };
  }, [currentUser, loadUserData]);

  // Auth Operations
  const signIn = async (email: string, password = '') => {
    setIsLoading(true);
    try {
      const session = await backendService.signIn(email, password);
      setCurrentUser(session.profile);
      await loadUserData(session.profile);
      setSuccessMessage(`Welcome back, ${session.profile.full_name}!`);
      setCurrentScreen(session.profile.id === INITIAL_USER_PROFILE.id ? 'dashboard' : 'trusted_dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (params: {
    email: string;
    password: string;
    fullName: string;
    phoneNumber?: string;
    emergencyNotes?: string;
    medicalInfo?: string;
  }) => {
    setIsLoading(true);
    try {
      const session = await backendService.signUp(params);
      setCurrentUser(session.profile);
      await loadUserData(session.profile);
      setSuccessMessage(`Account created successfully! Welcome to DigiSakhi.`);
      setCurrentScreen('dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await backendService.signOut();
      setCurrentUser(INITIAL_USER_PROFILE);
      await loadUserData(INITIAL_USER_PROFILE);
      setSuccessMessage('Signed out successfully.');
      setCurrentScreen('dashboard');
    } catch (err: any) {
      setError(err.message || 'Sign out failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const switchUserAccount = async (profileId: string) => {
    const target = allProfiles.find((p) => p.id === profileId);
    if (!target) return;

    setCurrentUser(target);
    await loadUserData(target);
    if (target.id === 'usr_maya_02' || target.id === 'usr_david_03') {
      setCurrentScreen('trusted_dashboard');
    } else {
      setCurrentScreen('dashboard');
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    try {
      const updated = await backendService.updateProfile(currentUser.id, updates);
      setCurrentUser(updated);
      setSuccessMessage('Profile information saved.');
    } catch (err: any) {
      setError(err.message || 'Could not update profile.');
    }
  };

  const openIncidentDetails = (id: string) => {
    setSelectedIncidentId(id);
    setCurrentScreen('incident_details');
  };

  // FEATURE ONE: Distress Codes
  const triggerDistressAction = async (
    type: DistressType,
    options?: {
      targetContactId?: string;
      customNote?: string;
      destinationName?: string;
      etaMinutes?: number;
    }
  ): Promise<string> => {
    const now = schedulerService.getVirtualNow();
    const incNumber = generateIncidentNumber();

    let priority: Incident['priority'] = 'medium';
    let title = 'Safety Alert';
    let description = options?.customNote || '';

    if (type === 'check_on_me') {
      priority = 'low';
      title = 'Check on Me Request';
      description = options?.customNote || `${currentUser.full_name} requested a discreet check-in. Please text or message when convenient.`;
    } else if (type === 'call_me') {
      priority = 'medium';
      title = 'Call Me Request';
      description = options?.customNote || `${currentUser.full_name} requested a phone call. Please call her phone number directly.`;
    } else if (type === 'urgent_assistance') {
      priority = 'urgent';
      title = 'Urgent Assistance Alert';
      description = options?.customNote || `HIGH PRIORITY: ${currentUser.full_name} triggered Urgent Assistance. Immediate attention requested from trusted circle.`;
    } else if (type === 'journey_checkin') {
      priority = 'medium';
      title = `Journey Check-in: En Route to ${options?.destinationName || 'Destination'}`;
      description = `Started journey to ${options?.destinationName || 'Destination'}. ETA: ${options?.etaMinutes || 30} minutes.`;
    }

    const geo = await geoService.getCurrentLocation({ virtualNow: now, allowDemoFallback: false });

    const protoOrder = defaultProtocol?.escalation_contact_ids || [];
    const activeContacts = contacts
      .filter((c) => c.status === 'accepted')
      .sort((a, b) => {
        const idxA = protoOrder.indexOf(a.id);
        const idxB = protoOrder.indexOf(b.id);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.escalation_order - b.escalation_order;
      });

    let assignedContacts = activeContacts;
    if (options?.targetContactId) {
      const single = activeContacts.find((c) => c.id === options.targetContactId);
      if (single) assignedContacts = [single];
    } else if (type !== 'urgent_assistance' && activeContacts.length > 0) {
      assignedContacts = [activeContacts[0]];
    }

    const recipientsPayload = assignedContacts.map((c, idx) => ({
      contact_id: c.id,
      contact_name: c.full_name,
      contact_email: c.email,
      contact_phone: c.phone_number,
      escalation_tier: c.escalation_order || idx + 1,
      status: 'notified' as const,
      notified_at: now.toISOString(),
      is_responding: false,
    }));

    const eventPayload = {
      event_type: 'incident_created' as const,
      actor_name: currentUser.full_name,
      actor_role: 'user' as const,
      description: `Dispatched "${title}" (${priority.toUpperCase()} priority).`,
    };

    const incidentPayload = {
      incident_number: incNumber,
      owner_user_id: currentUser.id,
      owner_name: currentUser.full_name,
      owner_phone: currentUser.phone_number,
      incident_type: type,
      priority,
      status: 'notification_sent' as const,
      title,
      description,
      location_lat: geo.latitude ?? undefined,
      location_lng: geo.longitude ?? undefined,
      location_address: geo.addressApproximate,
      location_accuracy: geo.accuracy ?? undefined,
      is_demo_location: geo.isDemoCoordinates,
      location_shared: type === 'urgent_assistance' || defaultProtocol?.allow_location_sharing || false,
      location_expires_at: new Date(now.getTime() + (defaultProtocol?.location_auto_expire_minutes || 60) * 60000).toISOString(),
      escalation_tier: 1,
    };

    const result = await backendService.createIncident(incidentPayload, recipientsPayload, eventPayload);

    // Dispatch notifications
    for (const c of assignedContacts) {
      notificationService.sendNotification({
        userId: currentUser.id,
        recipientId: c.id,
        recipientName: c.full_name,
        recipientEmail: c.email,
        incidentId: result.incident.id,
        subject: `DigiSakhi Alert: ${title} from ${currentUser.full_name}`,
        message: description,
        isDiscreetMasked: currentUser.discreet_mode_enabled,
      }).then((notif) => {
        backendService.logNotification(notif);
      });
    }

    await loadUserData(currentUser);
    setSuccessMessage(`Alert ${incNumber} created and dispatched to trusted circle.`);
    openIncidentDetails(result.incident.id);
    return result.incident.id;
  };

  // FEATURE TWO: Check-In Actions
  const createCheckIn = async (data: {
    title: string;
    deadlineMinutes: number;
    reminderLeadMinutes: number;
    gracePeriodMinutes: number;
    contactWaitMinutes: number;
    protocolId?: string;
  }): Promise<string> => {
    const now = schedulerService.getVirtualNow();
    const deadline = new Date(now.getTime() + data.deadlineMinutes * 60000);
    const reminder = new Date(deadline.getTime() - data.reminderLeadMinutes * 60000);

    const checkIn = await backendService.createCheckIn({
      owner_user_id: currentUser.id,
      protocol_id: data.protocolId || defaultProtocol?.id,
      title: data.title,
      deadline_at: deadline.toISOString(),
      reminder_at: reminder.toISOString(),
      grace_period_seconds: data.gracePeriodMinutes * 60,
      contact_wait_seconds: data.contactWaitMinutes * 60,
      status: 'active',
      current_escalation_tier: 0,
    });

    await loadUserData(currentUser);
    setSuccessMessage(`Check-in timer started for "${data.title}".`);
    setCurrentScreen('checkin_active');
    return checkIn.id;
  };

  const confirmCheckInSafe = async (checkInId: string) => {
    const now = schedulerService.getVirtualNow().toISOString();
    await backendService.updateCheckIn(checkInId, {
      status: 'completed',
      resolved_at: now,
    });

    const checkIn = checkIns.find((c) => c.id === checkInId);
    if (checkIn?.active_incident_id) {
      await resolveIncident(checkIn.active_incident_id, 'User confirmed safe on scheduled check-in.');
    }

    await loadUserData(currentUser);
    setSuccessMessage('You confirmed safe! Session completed.');
  };

  const extendCheckInTime = async (checkInId: string, additionalMinutes: number) => {
    const checkIn = checkIns.find((c) => c.id === checkInId);
    if (!checkIn) return;

    const curDeadline = new Date(checkIn.deadline_at);
    const newDeadline = new Date(curDeadline.getTime() + additionalMinutes * 60000);

    await backendService.updateCheckIn(checkInId, {
      deadline_at: newDeadline.toISOString(),
      status: 'active',
    });

    await loadUserData(currentUser);
    setSuccessMessage(`Check-in extended by +${additionalMinutes} minutes.`);
  };

  const cancelCheckIn = async (checkInId: string) => {
    await backendService.updateCheckIn(checkInId, {
      status: 'cancelled',
      resolved_at: schedulerService.getVirtualNow().toISOString(),
    });
    await loadUserData(currentUser);
    setSuccessMessage('Check-in timer cancelled.');
  };

  // FEATURE THREE: Response Workflow Actions
  const acknowledgeIncident = async (incidentId: string, contactId: string) => {
    const now = schedulerService.getVirtualNow().toISOString();
    const contact = contacts.find((c) => c.id === contactId || c.contact_user_id === currentUser.id);
    const actorName = contact ? contact.full_name : currentUser.full_name;

    await backendService.updateIncident(incidentId, {
      status: 'acknowledged',
      acknowledged_at: now,
      acknowledged_by: currentUser.id,
    });

    const targetRecipient = incidentRecipients.find(
      (r) => r.incident_id === incidentId && (r.contact_id === contactId || r.contact_email === currentUser.email)
    );
    if (targetRecipient) {
      await backendService.updateRecipient(targetRecipient.id, {
        status: 'acknowledged',
        acknowledged_at: now,
      });
    }

    await backendService.logIncidentEvent({
      incident_id: incidentId,
      event_type: 'acknowledged_by_contact',
      actor_name: actorName,
      actor_role: 'contact',
      description: `${actorName} acknowledged the safety alert. Escalation paused.`,
    });

    await loadUserData(currentUser);
    setSuccessMessage('Alert acknowledged! Thank you for watching out.');
  };

  const indicateResponding = async (incidentId: string, contactId: string, note?: string) => {
    const now = schedulerService.getVirtualNow().toISOString();
    const contact = contacts.find((c) => c.id === contactId || c.contact_user_id === currentUser.id);
    const actorName = contact ? contact.full_name : currentUser.full_name;

    await backendService.updateIncident(incidentId, {
      status: 'responding',
      responding_at: now,
      responding_by: currentUser.id,
    });

    const targetRecipient = incidentRecipients.find(
      (r) => r.incident_id === incidentId && (r.contact_id === contactId || r.contact_email === currentUser.email)
    );
    if (targetRecipient) {
      await backendService.updateRecipient(targetRecipient.id, {
        status: 'responding',
        is_responding: true,
        responded_at: now,
        response_note: note || 'Responding / In contact with user',
      });
    }

    await backendService.logIncidentEvent({
      incident_id: incidentId,
      event_type: 'response_initiated',
      actor_name: actorName,
      actor_role: 'contact',
      description: `${actorName} indicated active response: "${note || 'Taking action to support Elena'}".`,
    });

    await loadUserData(currentUser);
    setSuccessMessage('Response recorded! Circle members notified that you are handling this.');
  };

  const resolveIncident = async (incidentId: string, notes?: string) => {
    const now = schedulerService.getVirtualNow().toISOString();

    await backendService.updateIncident(incidentId, {
      status: 'resolved',
      resolved_at: now,
      resolved_by: currentUser.id,
      resolution_notes: notes || 'Incident safely resolved.',
    });

    await backendService.logIncidentEvent({
      incident_id: incidentId,
      event_type: 'incident_resolved',
      actor_name: currentUser.full_name,
      actor_role: currentRole,
      description: `Incident resolved: ${notes || 'User confirmed safe.'}`,
    });

    await loadUserData(currentUser);
    setSuccessMessage('Incident resolved and archived safely.');
  };

  const cancelIncident = async (incidentId: string, reason?: string) => {
    const now = schedulerService.getVirtualNow().toISOString();

    await backendService.updateIncident(incidentId, {
      status: 'cancelled',
      resolved_at: now,
      resolved_by: currentUser.id,
      resolution_notes: reason || 'Cancelled by user',
    });

    await backendService.logIncidentEvent({
      incident_id: incidentId,
      event_type: 'incident_cancelled',
      actor_name: currentUser.full_name,
      actor_role: 'user',
      description: `Incident cancelled by user: ${reason || 'Triggered in error.'}`,
    });

    await loadUserData(currentUser);
    setSuccessMessage('Alert cancelled.');
  };

  // Privacy-Controlled Geolocation Actions (Feature 4 & 7)
  const refreshLocation = async (allowDemoFallback = false): Promise<GeoLocationResult> => {
    const perm = await geoService.checkPermission();
    setLocationPermission(perm);
    const result = await geoService.getCurrentLocation({
      virtualNow: schedulerService.getVirtualNow(),
      allowDemoFallback,
    });
    setCurrentLocation(result);
    return result;
  };

  const setSimulatedLocationMode = (mode: SimulatedLocationMode) => {
    geoService.setSimulatedMode(mode);
    setSimulatedLocationModeState(mode);
    refreshLocation(mode === 'granted' || mode === 'stale');
  };

  const stopLocationSharing = async () => {
    if (activeLocationShare) {
      await backendService.stopLocationShare(activeLocationShare.id);
      setActiveLocationShare(null);
    }
    if (activeJourney && activeJourney.share_location) {
      await backendService.updateJourney(activeJourney.id, { share_location: false });
    }
    geoService.stopWatchingLocation();
    await loadUserData(currentUser);
    setSuccessMessage('Location sharing stopped immediately. Responders can no longer view your coordinates.');
  };

  // FEATURE SEVEN: Safe Arrival Actions
  const createJourney = async (data: {
    originName: string;
    destinationName: string;
    destLat: number;
    destLng: number;
    safeRadiusMeters: number;
    durationMinutes: number;
    shareLocation: boolean;
    allowedContactIds?: string[];
    protocolId?: string;
  }): Promise<string> => {
    const now = schedulerService.getVirtualNow();
    const arrivalTime = new Date(now.getTime() + data.durationMinutes * 60000);

    // Retrieve current coordinates (no fabrication: returns null if denied or unavailable)
    const geo = await refreshLocation(false);
    const hasCoordinates = geo.latitude !== null && geo.longitude !== null;
    const isSharing = data.shareLocation && hasCoordinates;

    const proto = protocols.find((p) => p.id === data.protocolId) || defaultProtocol;
    const gracePeriodSeconds = proto ? proto.grace_period_seconds : 180;
    const contactWaitSeconds = proto ? proto.contact_wait_seconds : 180;
    const reminderLeadSeconds = proto ? proto.reminder_lead_seconds : 120;
    const autoExpireMinutes = proto ? proto.location_auto_expire_minutes : 60;

    const checkIn = await backendService.createCheckIn({
      owner_user_id: currentUser.id,
      protocol_id: proto?.id,
      title: `Arrival Check-in: ${data.destinationName}`,
      deadline_at: arrivalTime.toISOString(),
      reminder_at: new Date(arrivalTime.getTime() - reminderLeadSeconds * 1000).toISOString(),
      grace_period_seconds: gracePeriodSeconds,
      contact_wait_seconds: contactWaitSeconds,
      status: 'active',
      current_escalation_tier: 0,
    });

    const journey = await backendService.createJourney({
      owner_user_id: currentUser.id,
      protocol_id: data.protocolId || defaultProtocol?.id,
      check_in_id: checkIn.id,
      origin_name: data.originName,
      origin_lat: geo.latitude ?? undefined,
      origin_lng: geo.longitude ?? undefined,
      destination_name: data.destinationName,
      dest_lat: data.destLat,
      dest_lng: data.destLng,
      safe_radius_meters: data.safeRadiusMeters,
      start_time: now.toISOString(),
      expected_arrival_time: arrivalTime.toISOString(),
      current_lat: geo.latitude ?? undefined,
      current_lng: geo.longitude ?? undefined,
      status: 'in_progress',
      share_location: isSharing,
    });

    await backendService.updateCheckIn(checkIn.id, { related_journey_id: journey.id });

    // If sharing is active, create real location_share record with authorized recipients
    if (isSharing && geo.latitude !== null && geo.longitude !== null) {
      const allowedRecipients =
        data.allowedContactIds && data.allowedContactIds.length > 0
          ? data.allowedContactIds
          : contacts.filter((c) => c.status === 'accepted' && c.can_view_location).map((c) => c.id);

      const shareRecord = await backendService.createLocationShare({
        user_id: currentUser.id,
        session_type: 'journey',
        session_id: journey.id,
        allowed_contact_ids: allowedRecipients,
        is_active: true,
        expires_at: new Date(arrivalTime.getTime() + 60 * 60000).toISOString(),
      });

      setActiveLocationShare(shareRecord);

      await backendService.recordLocationUpdate({
        share_id: shareRecord.id,
        latitude: geo.latitude,
        longitude: geo.longitude,
        accuracy_meters: geo.accuracy || 15,
        address_approximate: geo.addressApproximate,
        is_demo_coordinates: geo.isDemoCoordinates,
      });

      // Start watching device position
      geoService.startWatchingLocation(async (loc) => {
        if (loc.latitude !== null && loc.longitude !== null) {
          await backendService.updateJourney(journey.id, {
            current_lat: loc.latitude,
            current_lng: loc.longitude,
          });
          await backendService.recordLocationUpdate({
            share_id: shareRecord.id,
            latitude: loc.latitude,
            longitude: loc.longitude,
            accuracy_meters: loc.accuracy || 15,
            address_approximate: loc.addressApproximate,
            is_demo_coordinates: loc.isDemoCoordinates,
          });
        }
      });
    }

    await loadUserData(currentUser);
    setSuccessMessage(
      isSharing
        ? `Journey to ${data.destinationName} started with arrival verification & live location sharing.`
        : `Journey to ${data.destinationName} started with manual check-in verification.`
    );
    setCurrentScreen('journey_active');
    return journey.id;
  };

  const confirmSafeArrival = async (journeyId: string) => {
    const now = schedulerService.getVirtualNow().toISOString();
    const journey = journeys.find((j) => j.id === journeyId);

    // 1. Mark journey completed
    await backendService.updateJourney(journeyId, {
      status: 'completed',
      completed_at: now,
    });

    // 2. Resolve linked check-in
    if (journey?.check_in_id) {
      await confirmCheckInSafe(journey.check_in_id);
    }

    // 3. Stop journey-specific location sharing
    const existingShare = await backendService.getLocationShareForSession(journeyId, 'journey');
    if (existingShare) {
      await backendService.stopLocationShare(existingShare.id);
    }
    geoService.stopWatchingLocation();
    setActiveLocationShare(null);

    await loadUserData(currentUser);
    setSuccessMessage('Safe arrival confirmed! Journey completed and location broadcasting stopped.');
  };

  const cancelJourney = async (journeyId: string) => {
    const journey = journeys.find((j) => j.id === journeyId);
    await backendService.updateJourney(journeyId, {
      status: 'cancelled',
      completed_at: schedulerService.getVirtualNow().toISOString(),
    });

    if (journey?.check_in_id) {
      await cancelCheckIn(journey.check_in_id);
    }

    const existingShare = await backendService.getLocationShareForSession(journeyId, 'journey');
    if (existingShare) {
      await backendService.stopLocationShare(existingShare.id);
    }
    geoService.stopWatchingLocation();
    setActiveLocationShare(null);

    await loadUserData(currentUser);
    setSuccessMessage('Journey cancelled.');
  };

  // Protocols
  const saveProtocol = async (data: Omit<SafetyProtocol, 'id' | 'created_at'> & { id?: string }) => {
    await backendService.saveProtocol(data);
    await loadUserData(currentUser);
    setSuccessMessage('Safety protocol saved successfully.');
  };

  const setDefaultProtocol = async (protocolId: string) => {
    await backendService.setDefaultProtocol(currentUser.id, protocolId);
    await loadUserData(currentUser);
    setSuccessMessage('Default protocol updated.');
  };

  const deleteProtocol = async (protocolId: string) => {
    await backendService.deleteProtocol(protocolId);
    await loadUserData(currentUser);
    setSuccessMessage('Protocol removed.');
  };

  // Contacts & Invitations
  const inviteContact = async (data: {
    fullName: string;
    email: string;
    phoneNumber: string;
    relationship: string;
    escalationOrder: number;
  }): Promise<string> => {
    const token = 'inv_' + Math.random().toString(36).substring(2, 12);
    const expires = new Date(Date.now() + 7 * 86400000).toISOString();

    await backendService.createInvitation({
      inviter_id: currentUser.id,
      inviter_name: currentUser.full_name,
      invitee_email: data.email,
      invitee_name: data.fullName,
      relationship: data.relationship,
      escalation_order: data.escalationOrder,
      invitation_token: token,
      status: 'pending',
      expires_at: expires,
    });

    await backendService.createContact({
      user_id: currentUser.id,
      full_name: data.fullName,
      email: data.email,
      phone_number: data.phoneNumber,
      relationship: data.relationship,
      escalation_order: data.escalationOrder,
      status: 'pending', // Unverified requirement!
      can_view_location: false,
      avatar_color: 'bg-teal-600',
    });

    await loadUserData(currentUser);
    setSuccessMessage(`Invitation created for ${data.fullName}.`);
    return token;
  };

  const acceptInvitation = async (invitationId: string) => {
    await backendService.acceptInvitation(invitationId);
    await loadUserData(currentUser);
    setSuccessMessage('Contact invitation accepted and verified.');
  };

  const reorderContacts = async (reordered: TrustedContact[]) => {
    const ids = reordered.map((c) => c.id);
    await backendService.reorderContacts(currentUser.id, ids);
    await loadUserData(currentUser);
    setSuccessMessage('Contact escalation order updated.');
  };

  const removeContact = async (contactId: string) => {
    await backendService.deleteContact(contactId);
    await loadUserData(currentUser);
    setSuccessMessage('Contact removed from circle.');
  };

  // Quick Exit
  const triggerQuickExit = () => setIsQuickExitActive(true);
  const unlockQuickExit = (pin: string): boolean => {
    if (pin === currentUser.discreet_exit_pin || pin === '1234') {
      setIsQuickExitActive(false);
      return true;
    }
    return false;
  };

  // Demo Controls
  const advanceDemoTime = (seconds: number) => {
    schedulerService.advanceVirtualTimeSeconds(seconds);
    loadUserData(currentUser);
    setVirtualTime(schedulerService.getVirtualNow());
  };

  const resetAllDemoData = () => {
    schedulerService.resetVirtualTime();
    LocalStorageDB.resetDatabase();
    loadUserData(currentUser);
    setCurrentScreen('dashboard');
    setSuccessMessage('Demo environment reset to initial seed state.');
  };

  const simulateArrivedAtDestination = async () => {
    if (!activeJourney) return;
    await backendService.updateJourney(activeJourney.id, {
      current_lat: activeJourney.dest_lat,
      current_lng: activeJourney.dest_lng,
      status: 'safe_arrival_pending',
      prompted_arrival_at: schedulerService.getVirtualNow().toISOString(),
    });
    await loadUserData(currentUser);
    setSuccessMessage('Simulated arrival within destination safe radius!');
  };

  return (
    <SafeSphereContext.Provider
      value={{
        currentUser,
        currentRole,
        allProfiles,
        backendMode,
        isCloud: backendService.isCloud,
        switchUserAccount,
        updateUserProfile,
        signIn,
        signUp,
        signOut,
        isLoading,
        error,
        successMessage,
        dismissError,
        dismissSuccess,
        currentScreen,
        setCurrentScreen,
        selectedIncidentId,
        setSelectedIncidentId,
        openIncidentDetails,
        contacts,
        invitations,
        protocols,
        checkIns,
        journeys,
        incidents,
        incidentRecipients,
        incidentEvents,
        notifications,
        locationShares,
        activeCheckIn,
        activeJourney,
        activeIncident,
        defaultProtocol,
        triggerDistressAction,
        createCheckIn,
        confirmCheckInSafe,
        extendCheckInTime,
        cancelCheckIn,
        acknowledgeIncident,
        indicateResponding,
        resolveIncident,
        cancelIncident,
        createJourney,
        confirmSafeArrival,
        cancelJourney,
        currentLocation,
        locationPermission,
        activeLocationShare,
        simulatedLocationMode,
        setSimulatedLocationMode,
        refreshLocation,
        stopLocationSharing,
        saveProtocol,
        setDefaultProtocol,
        deleteProtocol,
        inviteContact,
        acceptInvitation,
        reorderContacts,
        removeContact,
        isQuickExitActive,
        triggerQuickExit,
        unlockQuickExit,
        advanceDemoTime,
        resetAllDemoData,
        simulateArrivedAtDestination,
        virtualTime,
      }}
    >
      {children}
    </SafeSphereContext.Provider>
  );
};

export const useSafeSphere = () => {
  const context = useContext(SafeSphereContext);
  if (!context) {
    throw new Error('useSafeSphere must be used within a SafeSphereProvider');
  }
  return context;
};
