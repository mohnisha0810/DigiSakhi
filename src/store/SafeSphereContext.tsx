import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  UserProfile,
  TrustedContact,
  ContactInvitation,
  SafetyProtocol,
  CheckIn,
  Journey,
  JourneyCallAction,
  Incident,
  IncidentRecipient,
  IncidentEvent,
  LocationShare,
  NotificationRecord,
  DistressType,
  UserRole,
  InvitationDeliveryStatus,
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
  | 'safety_setup'
  | 'protocols'
  | 'protocol_builder'
  | 'history'
  | 'trusted_dashboard'
  | 'incident_details'
  | 'checkin_active'
  | 'map_view'
  | 'settings'
  | 'privacy_settings'
  | 'notifications_inbox'
  | 'account_settings';

interface SafeSphereContextType {
  // Authentication & Role
  currentUser: UserProfile;
  isAuthenticated: boolean;
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
  completeOnboardingStep: (stepNumber: number, data?: Partial<UserProfile>) => Promise<void>;
  finishOnboarding: () => Promise<void>;

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
  createCustomJourney: (data: {
    journeyName?: string;
    originName?: string;
    destinationName?: string;
    checkInIntervalMinutes: number;
    responseCountdownSeconds: number;
    tier1ContactIds: string[];
    tier2ContactIds: string[];
    emergencyPhoneNumber: string;
    missedCheckinAction: 'reminder' | 'escalate';
    shareLocation?: boolean;
  }) => Promise<string>;
  respondCustomJourneyCheckIn: (
    journeyId: string,
    response: 'im_okay' | 'need_help' | 'urgent_help',
    note?: string
  ) => Promise<void>;
  recordJourneyCallAction: (
    journeyId: string,
    action: {
      action_type: 'tier1_call' | 'tier2_call' | 'emergency_call';
      recipient_name: string;
      phone_number: string;
      status: 'initiated' | 'opened_dialer' | 'manual_fallback';
      note?: string;
    }
  ) => Promise<void>;
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
  }) => Promise<{
    token: string;
    success: boolean;
    deliveryStatus: InvitationDeliveryStatus;
    messageId?: string;
    error?: string;
    inviteUrl: string;
  }>;
  acceptInvitation: (invitationId: string) => Promise<void>;
  declineInvitation: (invitationId: string) => Promise<void>;
  resendInvitation: (invitationId: string) => Promise<{ success: boolean; error?: string }>;
  reorderContacts: (reorderedContacts: TrustedContact[]) => Promise<void>;
  removeContact: (contactId: string) => Promise<void>;
  syncPendingInvitations: () => Promise<boolean>;

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

export const EMPTY_USER_PROFILE: UserProfile = {
  id: '',
  email: '',
  full_name: '',
  phone_number: '',
  emergency_notes: '',
  medical_info: '',
  discreet_exit_pin: '1234',
  discreet_mode_enabled: false,
  quick_exit_disguise: 'weather',
  discreet_lockscreen_mask: true,
  onboarding_completed: false,
  onboarding_step: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const SafeSphereContext = createContext<SafeSphereContextType | undefined>(undefined);

export const SafeSphereProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Profiles & Auth
  const [allProfiles, setAllProfiles] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile>(EMPTY_USER_PROFILE);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

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

  // Current Role: user is 'contact' if marked role is contact or in test scenarios
  const isContact = Boolean(
    currentUser.role === 'contact' ||
    (currentUser.id && (currentUser.id === 'usr_maya_02' || currentUser.id === 'usr_david_03'))
  );
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
      const isContactRole = Boolean(
        user.role === 'contact' ||
        user.id === 'usr_maya_02' ||
        user.id === 'usr_david_03'
      );

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
      setIsLoading(true);
      try {
        const session = await backendService.getCurrentSession();
        if (session?.profile && session.user?.id) {
          setCurrentUser(session.profile);
          setIsAuthenticated(true);
          await loadUserData(session.profile);
        } else {
          setIsAuthenticated(false);
          setCurrentUser(EMPTY_USER_PROFILE);
          // When no authenticated session exists, keep collections clean and unseeded
          setContacts([]);
          setInvitations([]);
          setProtocols([]);
          setCheckIns([]);
          setJourneys([]);
          setIncidents([]);
        }
      } catch (err) {
        console.warn('Session check fallback:', err);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
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
      setIsAuthenticated(true);
      await loadUserData(session.profile);
      setSuccessMessage(`Welcome back, ${session.profile.full_name}!`);
      if (session.profile.onboarding_completed) {
        setCurrentScreen(
          session.profile.role === 'contact' || session.profile.id === 'usr_maya_02' || session.profile.id === 'usr_david_03'
            ? 'trusted_dashboard'
            : 'dashboard'
        );
      }
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
      setIsAuthenticated(true);
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
      setIsAuthenticated(false);
      setCurrentUser(EMPTY_USER_PROFILE);
      setContacts([]);
      setInvitations([]);
      setProtocols([]);
      setCheckIns([]);
      setJourneys([]);
      setIncidents([]);
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

    setIsLoading(true);
    try {
      const session = await backendService.signIn(target.email);
      setCurrentUser(session.profile);
      setIsAuthenticated(true);
      await loadUserData(session.profile);
      setSuccessMessage(`Switched active profile to ${session.profile.full_name}`);
      if (target.role === 'contact' || target.id === 'usr_maya_02' || target.id === 'usr_david_03') {
        setCurrentScreen('trusted_dashboard');
      } else {
        setCurrentScreen('dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboardingStep = async (stepNumber: number, data?: Partial<UserProfile>) => {
    try {
      const updates: Partial<UserProfile> = {
        onboarding_step: stepNumber,
        ...data,
      };
      const updated = await backendService.updateProfile(currentUser.id, updates);
      setCurrentUser(updated);
      await loadUserData(updated);
    } catch (err: any) {
      console.error('Failed to save onboarding progress:', err);
      setError('Failed to save onboarding progress: ' + err.message);
      throw err;
    }
  };

  const finishOnboarding = async () => {
    setIsLoading(true);
    try {
      const updated = await backendService.updateProfile(currentUser.id, {
        onboarding_completed: true,
        onboarding_step: 5,
      });
      setCurrentUser(updated);
      await loadUserData(updated);
      setSuccessMessage(`Welcome to DigiSakhi, ${updated.full_name}! Your dashboard is ready.`);
      setCurrentScreen('dashboard');
    } catch (err: any) {
      console.error('Failed to complete onboarding:', err);
      setError('Could not complete setup: ' + err.message);
      throw err;
    } finally {
      setIsLoading(false);
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

    const targetIncident = incidents.find((i) => i.id === incidentId);
    const ownerDisplayName = targetIncident?.owner_name?.split(' ')[0] || 'user';

    await backendService.logIncidentEvent({
      incident_id: incidentId,
      event_type: 'response_initiated',
      actor_name: actorName,
      actor_role: 'contact',
      description: `${actorName} indicated active response: "${note || `Taking action to support ${ownerDisplayName}`}".`,
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

  const createCustomJourney = async (data: {
    journeyName?: string;
    originName?: string;
    destinationName?: string;
    checkInIntervalMinutes: number;
    responseCountdownSeconds: number;
    tier1ContactIds: string[];
    tier2ContactIds: string[];
    emergencyPhoneNumber: string;
    missedCheckinAction: 'reminder' | 'escalate';
    shareLocation?: boolean;
  }): Promise<string> => {
    const now = schedulerService.getVirtualNow();
    const intervalMins = Math.max(1, data.checkInIntervalMinutes || 10);
    const countdownSecs = Math.max(30, data.responseCountdownSeconds || 120);
    const nextCheckIn = new Date(now.getTime() + intervalMins * 60000);
    const expectedArrival = new Date(now.getTime() + intervalMins * 3 * 60000);

    const journeyName = (data.journeyName && data.journeyName.trim()) || 'Custom Safety Journey';
    const originName = (data.originName && data.originName.trim()) || 'Current Location';
    const destinationName = (data.destinationName && data.destinationName.trim()) || 'Safety Destination';

    const geo = await refreshLocation(false);
    const hasCoordinates = geo.latitude !== null && geo.longitude !== null;
    const isSharing = Boolean(data.shareLocation && hasCoordinates);

    const checkIn = await backendService.createCheckIn({
      owner_user_id: currentUser.id,
      title: `Check-in: ${journeyName}`,
      deadline_at: nextCheckIn.toISOString(),
      reminder_at: new Date(nextCheckIn.getTime() - 60000).toISOString(),
      grace_period_seconds: countdownSecs,
      contact_wait_seconds: 180,
      status: 'active',
      current_escalation_tier: 0,
    });

    const journey = await backendService.createJourney({
      owner_user_id: currentUser.id,
      check_in_id: checkIn.id,
      origin_name: originName,
      origin_lat: geo.latitude ?? undefined,
      origin_lng: geo.longitude ?? undefined,
      destination_name: destinationName,
      dest_lat: geo.latitude ?? 37.7897,
      dest_lng: geo.longitude ?? -122.4011,
      safe_radius_meters: 200,
      start_time: now.toISOString(),
      expected_arrival_time: expectedArrival.toISOString(),
      current_lat: geo.latitude ?? undefined,
      current_lng: geo.longitude ?? undefined,
      status: 'in_progress',
      share_location: isSharing,

      // Custom Plan Configuration
      journey_type: 'custom',
      journey_name: journeyName,
      check_in_interval_minutes: intervalMins,
      response_countdown_seconds: countdownSecs,
      tier1_contact_ids: data.tier1ContactIds,
      tier2_contact_ids: data.tier2ContactIds,
      emergency_phone_number: data.emergencyPhoneNumber || '112',
      missed_checkin_action: data.missedCheckinAction,
      last_check_in_at: now.toISOString(),
      next_check_in_at: nextCheckIn.toISOString(),
      check_in_status: 'ok',
      missed_count: 0,
      call_actions: [],
    });

    await backendService.updateCheckIn(checkIn.id, { related_journey_id: journey.id });

    if (isSharing && geo.latitude !== null && geo.longitude !== null) {
      const allContactIds = Array.from(new Set([...data.tier1ContactIds, ...data.tier2ContactIds]));
      await backendService.createLocationShare({
        user_id: currentUser.id,
        session_type: 'journey',
        session_id: journey.id,
        allowed_contact_ids: allContactIds,
        is_active: true,
        expires_at: new Date(expectedArrival.getTime() + 60 * 60000).toISOString(),
      });
    }

    const incidentEvents = LocalStorageDB.getItem<IncidentEvent[]>('incident_events', []);
    const newEvent: IncidentEvent = {
      id: 'ev_' + Math.random().toString(36).substring(2, 9),
      incident_id: 'jny_' + journey.id,
      event_type: 'incident_created',
      actor_name: currentUser.full_name,
      actor_role: 'user',
      description: `Custom Safety Journey "${journeyName}" started. Interval: ${intervalMins}m, Response window: ${countdownSecs}s, Next check-in at ${nextCheckIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
      created_at: now.toISOString(),
    };
    LocalStorageDB.setItem('incident_events', [newEvent, ...incidentEvents]);

    await loadUserData(currentUser);
    setSuccessMessage(`Custom Safety Journey "${journeyName}" started! Next check-in in ${intervalMins} minutes.`);
    setCurrentScreen('journeys');
    return journey.id;
  };

  const respondCustomJourneyCheckIn = async (
    journeyId: string,
    response: 'im_okay' | 'need_help' | 'urgent_help',
    note?: string
  ) => {
    const now = schedulerService.getVirtualNow();
    const journey = journeys.find((j) => j.id === journeyId);
    if (!journey) return;

    const intervalMins = journey.check_in_interval_minutes || 10;
    const nextCheckIn = new Date(now.getTime() + intervalMins * 60000);

    if (response === 'im_okay') {
      // BUTTON 1: "I'M OKAY 💚"
      await backendService.updateJourney(journeyId, {
        last_check_in_at: now.toISOString(),
        next_check_in_at: nextCheckIn.toISOString(),
        check_in_status: 'ok',
      });

      if (journey.check_in_id) {
        await backendService.updateCheckIn(journey.check_in_id, {
          status: 'active',
          deadline_at: nextCheckIn.toISOString(),
          reminder_at: new Date(nextCheckIn.getTime() - 60000).toISOString(),
        });
      }

      const incidentEvents = LocalStorageDB.getItem<IncidentEvent[]>('incident_events', []);
      const newEvent: IncidentEvent = {
        id: 'ev_' + Math.random().toString(36).substring(2, 9),
        incident_id: 'jny_' + journey.id,
        event_type: 'safe_confirmed_by_user',
        actor_name: currentUser.full_name,
        actor_role: 'user',
        description: `Safety Check-in Confirmed: User confirmed "I'm Okay 💚". Next check-in at ${nextCheckIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
        created_at: now.toISOString(),
      };
      LocalStorageDB.setItem('incident_events', [newEvent, ...incidentEvents]);

      await loadUserData(currentUser);
      setSuccessMessage(`Safety confirmed! Next check-in scheduled for ${nextCheckIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`);
    } else if (response === 'need_help') {
      // BUTTON 2: "I NEED HELP 🟠"
      const tier1Ids = journey.tier1_contact_ids || [];
      const tier1Contact =
        contacts.find((c) => tier1Ids.includes(c.id) && c.status === 'accepted') ||
        contacts.find((c) => c.status === 'accepted');

      const actionRecord: JourneyCallAction = {
        id: 'act_' + Math.random().toString(36).substring(2, 9),
        journey_id: journeyId,
        timestamp: now.toISOString(),
        action_type: 'tier1_call',
        recipient_name: tier1Contact ? tier1Contact.full_name : 'Tier 1 Contact',
        phone_number: tier1Contact ? tier1Contact.phone_number : 'Not configured',
        status: tier1Contact ? 'opened_dialer' : 'manual_fallback',
        note: note || 'User pressed "I Need Help" during safety journey check-in.',
      };

      const existingActions = journey.call_actions || [];
      await backendService.updateJourney(journeyId, {
        call_actions: [actionRecord, ...existingActions],
      });

      const incidentEvents = LocalStorageDB.getItem<IncidentEvent[]>('incident_events', []);
      const newEvent: IncidentEvent = {
        id: 'ev_' + Math.random().toString(36).substring(2, 9),
        incident_id: 'jny_' + journey.id,
        event_type: 'escalation_triggered',
        actor_name: currentUser.full_name,
        actor_role: 'user',
        description: `Help requested: User pressed "I Need Help 🟠". Calling Tier 1 responder ${tier1Contact?.full_name || 'contact'} (${tier1Contact?.phone_number || 'N/A'}).`,
        created_at: now.toISOString(),
      };
      LocalStorageDB.setItem('incident_events', [newEvent, ...incidentEvents]);

      // Native dialer handoff
      if (tier1Contact?.phone_number) {
        const cleanPhone = tier1Contact.phone_number.replace(/\s+/g, '');
        window.location.href = `tel:${encodeURIComponent(cleanPhone)}`;
      }

      await loadUserData(currentUser);
      setSuccessMessage(`Initiating call to Tier 1 responder: ${tier1Contact?.full_name || 'contact'}...`);
    } else if (response === 'urgent_help') {
      // BUTTON 3: "URGENT HELP 🚨"
      const emergencyNum = journey.emergency_phone_number || '112';

      const actionRecord: JourneyCallAction = {
        id: 'act_' + Math.random().toString(36).substring(2, 9),
        journey_id: journeyId,
        timestamp: now.toISOString(),
        action_type: 'emergency_call',
        recipient_name: `Emergency Helpline (${emergencyNum})`,
        phone_number: emergencyNum,
        status: 'opened_dialer',
        note: 'Urgent Help triggered from safety journey check-in prompt.',
      };

      const existingActions = journey.call_actions || [];
      await backendService.updateJourney(journeyId, {
        call_actions: [actionRecord, ...existingActions],
      });

      const incidentEvents = LocalStorageDB.getItem<IncidentEvent[]>('incident_events', []);
      const newEvent: IncidentEvent = {
        id: 'ev_' + Math.random().toString(36).substring(2, 9),
        incident_id: 'jny_' + journey.id,
        event_type: 'response_initiated',
        actor_name: currentUser.full_name,
        actor_role: 'user',
        description: `URGENT HELP ACTIVATED! User pressed "Urgent Help 🚨". Opening dialer for emergency service: ${emergencyNum}.`,
        created_at: now.toISOString(),
      };
      LocalStorageDB.setItem('incident_events', [newEvent, ...incidentEvents]);

      const cleanPhone = emergencyNum.replace(/\s+/g, '');
      window.location.href = `tel:${encodeURIComponent(cleanPhone)}`;

      await loadUserData(currentUser);
      setSuccessMessage(`Opening emergency phone dialer for ${emergencyNum}...`);
    }
  };

  const recordJourneyCallAction = async (
    journeyId: string,
    action: {
      action_type: 'tier1_call' | 'tier2_call' | 'emergency_call';
      recipient_name: string;
      phone_number: string;
      status: 'initiated' | 'opened_dialer' | 'manual_fallback';
      note?: string;
    }
  ) => {
    const journey = journeys.find((j) => j.id === journeyId);
    if (!journey) return;
    const now = schedulerService.getVirtualNow();

    const newAction: JourneyCallAction = {
      id: 'act_' + Math.random().toString(36).substring(2, 9),
      journey_id: journeyId,
      timestamp: now.toISOString(),
      ...action,
    };

    const existingActions = journey.call_actions || [];
    await backendService.updateJourney(journeyId, {
      call_actions: [newAction, ...existingActions],
    });

    const incidentEvents = LocalStorageDB.getItem<IncidentEvent[]>('incident_events', []);
    const newEvent: IncidentEvent = {
      id: 'ev_' + Math.random().toString(36).substring(2, 9),
      incident_id: 'jny_' + journey.id,
      event_type: 'response_initiated',
      actor_name: currentUser.full_name,
      actor_role: 'user',
      description: `Call initiated: ${action.action_type.replace('_', ' ')} to ${action.recipient_name} (${action.phone_number}). Status: ${action.status}.`,
      created_at: now.toISOString(),
    };
    LocalStorageDB.setItem('incident_events', [newEvent, ...incidentEvents]);

    await loadUserData(currentUser);
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
  }): Promise<{
    token: string;
    success: boolean;
    deliveryStatus: InvitationDeliveryStatus;
    messageId?: string;
    error?: string;
    inviteUrl: string;
  }> => {
    const origin =
      typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost:5173')
        ? window.location.origin
        : 'https://safesphere-liart.vercel.app';

    const token =
      'inv_' +
      (typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID().replace(/-/g, '')
        : Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12));

    const expires = new Date(Date.now() + 7 * 86400000).toISOString();
    const inviteUrl = `${origin}/invite?token=${token}&inviter=${encodeURIComponent(currentUser.full_name)}&name=${encodeURIComponent(data.fullName)}&rel=${encodeURIComponent(data.relationship)}&phone=${encodeURIComponent(data.phoneNumber)}`;

    const createdInv = await backendService.createInvitation({
      inviter_id: currentUser.id,
      inviter_name: currentUser.full_name,
      invitee_email: data.email,
      invitee_name: data.fullName,
      invitee_phone: data.phoneNumber,
      relationship: data.relationship,
      escalation_order: data.escalationOrder,
      invitation_token: token,
      status: 'pending',
      delivery_status: 'pending',
      provider: 'manual',
      expires_at: expires,
    });

    await backendService.createContact({
      user_id: currentUser.id,
      full_name: data.fullName,
      email: data.email,
      phone_number: data.phoneNumber,
      relationship: data.relationship,
      escalation_order: data.escalationOrder,
      status: 'pending', // Strictly pending until accepted!
      invitation_id: createdInv.id,
      invitation_status: 'pending',
      can_view_location: false,
      avatar_color: 'bg-teal-600',
    });

    // Notify serverless endpoint to register invitation for cross-device tracking
    try {
      fetch('/api/invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          token,
          invitation: {
            id: createdInv.id,
            token,
            inviter_id: currentUser.id,
            inviter_name: currentUser.full_name,
            invitee_email: data.email,
            invitee_name: data.fullName,
            invitee_phone: data.phoneNumber,
            relationship: data.relationship,
            escalation_order: data.escalationOrder,
            expires_at: expires,
          },
        }),
      }).catch(() => {});
    } catch {}

    await loadUserData(currentUser);
    setSuccessMessage(`Contact ${data.fullName} saved! Choose WhatsApp or SMS to send their invitation.`);

    return {
      token,
      success: true,
      deliveryStatus: 'pending',
      inviteUrl,
    };
  };

  const syncPendingInvitations = useCallback(async (): Promise<boolean> => {
    if (!currentUser?.id) return false;

    try {
      const currentContacts = await backendService.getContacts(currentUser.id);
      const currentInvs = await backendService.getInvitations(currentUser.id);

      const pendingContacts = currentContacts.filter((c) => c.status !== 'accepted');
      const pendingInvs = currentInvs.filter((i) => i.status !== 'accepted');

      if (pendingContacts.length === 0 && pendingInvs.length === 0) {
        return false;
      }

      // Collect unique tokens for pending contacts and invitations
      const tokenSet = new Set<string>();
      for (const inv of currentInvs) {
        if (inv.invitation_token) tokenSet.add(inv.invitation_token);
      }
      for (const contact of pendingContacts) {
        const matchingInv = currentInvs.find(
          (i) =>
            i.id === contact.invitation_id ||
            (contact.email && i.invitee_email && i.invitee_email.toLowerCase() === contact.email.toLowerCase()) ||
            (contact.phone_number && i.invitee_phone && i.invitee_phone === contact.phone_number)
        );
        if (matchingInv?.invitation_token) {
          tokenSet.add(matchingInv.invitation_token);
        }
      }

      const tokens = Array.from(tokenSet);
      if (tokens.length === 0) return false;

      const res = await fetch(`/api/invitation?tokens=${encodeURIComponent(tokens.join(','))}`);
      if (!res.ok) return false;
      const data = await res.json();
      if (!data.valid || !data.statuses) return false;

      let hasUpdates = false;
      for (const [token, info] of Object.entries<any>(data.statuses)) {
        if (info.status === 'accepted') {
          // Check if invitation needs update
          const matchedInv = currentInvs.find((i) => i.invitation_token === token);
          if (matchedInv && matchedInv.status !== 'accepted') {
            await backendService.acceptInvitation(matchedInv.id, info.responder_user_id);
            hasUpdates = true;
          }

          // Check if contact needs update
          const matchedContacts = currentContacts.filter(
            (c) =>
              (matchedInv && c.invitation_id === matchedInv.id) ||
              (matchedInv && matchedInv.invitee_email && c.email && matchedInv.invitee_email.toLowerCase() === c.email.toLowerCase()) ||
              (matchedInv && matchedInv.invitee_phone && c.phone_number && matchedInv.invitee_phone === c.phone_number)
          );

          for (const c of matchedContacts) {
            if (c.status !== 'accepted') {
              await backendService.updateContact(c.id, {
                status: 'accepted',
                invitation_status: 'accepted',
                can_view_location: true,
                contact_user_id: info.responder_user_id || c.contact_user_id,
              });
              hasUpdates = true;
            }
          }
        }
      }

      if (hasUpdates) {
        await loadUserData(currentUser);
        toast.success('Trusted contact verified! Connected in your safety circle.');
        return true;
      }
    } catch (err) {
      console.warn('Sync pending invitations error:', err);
    }
    return false;
  }, [currentUser, loadUserData]);

  // Polling for pending contact acceptance across devices
  useEffect(() => {
    const hasPending = contacts.some((c) => c.status !== 'accepted');
    if (!hasPending) return;

    const interval = setInterval(() => {
      syncPendingInvitations();
    }, 3500);

    return () => clearInterval(interval);
  }, [contacts, syncPendingInvitations]);

  // Window focus & tab visibility change listener
  useEffect(() => {
    const handleSyncOnVisible = () => {
      if (document.visibilityState === 'visible') {
        syncPendingInvitations();
      }
    };

    window.addEventListener('focus', handleSyncOnVisible);
    document.addEventListener('visibilitychange', handleSyncOnVisible);

    return () => {
      window.removeEventListener('focus', handleSyncOnVisible);
      document.removeEventListener('visibilitychange', handleSyncOnVisible);
    };
  }, [syncPendingInvitations]);

  const acceptInvitation = async (invitationId: string, acceptingUserId?: string) => {
    await backendService.acceptInvitation(invitationId, acceptingUserId);
    await loadUserData(currentUser);
    setSuccessMessage('Contact invitation accepted and verified in safety circle.');
  };

  const declineInvitation = async (invitationId: string) => {
    await backendService.declineInvitation(invitationId);
    await loadUserData(currentUser);
    setSuccessMessage('Invitation marked as declined.');
  };

  const resendInvitation = async (invitationId: string): Promise<{ success: boolean; error?: string }> => {
    const inv = invitations.find((i) => i.id === invitationId);
    if (!inv) return { success: false, error: 'Invitation not found.' };

    await backendService.updateInvitationDelivery(invitationId, {
      status: 'pending',
      delivery_status: 'pending',
      sent_at: new Date().toISOString(),
    });

    await loadUserData(currentUser);
    setSuccessMessage(`Ready to send invitation to ${inv.invitee_name}. Choose WhatsApp or SMS.`);
    return { success: true };
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
        isAuthenticated,
        currentRole,
        allProfiles,
        backendMode,
        isCloud: backendService.isCloud,
        switchUserAccount,
        updateUserProfile,
        signIn,
        signUp,
        signOut,
        completeOnboardingStep,
        finishOnboarding,
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
        createCustomJourney,
        respondCustomJourneyCheckIn,
        recordJourneyCallAction,
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
        declineInvitation,
        resendInvitation,
        reorderContacts,
        removeContact,
        syncPendingInvitations,
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
