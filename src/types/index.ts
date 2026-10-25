// SafeSphere Core Type Definitions

export type UserRole = 'user' | 'contact';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone_number: string;
  emergency_notes?: string;
  medical_info?: string;
  discreet_exit_pin: string;
  discreet_mode_enabled: boolean;
  quick_exit_disguise: 'weather' | 'notes' | 'calculator';
  discreet_lockscreen_mask: boolean;
  created_at: string;
  updated_at: string;
}

export type ContactStatus = 'pending' | 'accepted' | 'declined';

export type InvitationDeliveryStatus =
  | 'pending'
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'failed'
  | 'accepted'
  | 'declined'
  | 'expired';

export interface TrustedContact {
  id: string;
  user_id: string; // The primary user who owns this contact relationship
  contact_user_id?: string; // Supabase auth ID of contact if registered
  full_name: string;
  email: string;
  phone_number: string;
  relationship: string;
  escalation_order: number; // 1 = First responder, 2 = Secondary, etc.
  status: ContactStatus;
  invitation_id?: string;
  invitation_status?: InvitationDeliveryStatus;
  can_view_location: boolean;
  avatar_color?: string;
  created_at: string;
  updated_at?: string;
}

export interface ContactInvitation {
  id: string;
  inviter_id: string;
  inviter_name: string;
  invitee_email: string;
  invitee_name: string;
  invitee_phone?: string;
  relationship: string;
  escalation_order: number;
  invitation_token: string;
  status: InvitationDeliveryStatus;
  delivery_status?: InvitationDeliveryStatus;
  provider?: 'twilio' | 'unconfigured' | 'manual';
  provider_message_id?: string;
  provider_error?: string;
  sent_at?: string;
  delivered_at?: string;
  responded_at?: string;
  created_at: string;
  expires_at: string;
}

export type DistressType =
  | 'check_on_me'
  | 'call_me'
  | 'urgent_assistance'
  | 'journey_checkin';

export type IncidentPriority = 'low' | 'medium' | 'high' | 'urgent';

export type IncidentStatus =
  | 'triggered'
  | 'notification_pending'
  | 'notification_sent'
  | 'delivery_confirmed'
  | 'acknowledged'
  | 'responding'
  | 'resolved'
  | 'cancelled';

export interface Incident {
  id: string;
  incident_number: string; // e.g., "INC-2026-4421"
  owner_user_id: string;
  owner_name: string;
  owner_phone?: string;
  incident_type: DistressType;
  priority: IncidentPriority;
  status: IncidentStatus;
  title: string;
  description?: string;
  location_lat?: number;
  location_lng?: number;
  location_address?: string;
  location_accuracy?: number;
  is_demo_location?: boolean;
  location_shared: boolean;
  location_expires_at?: string;
  related_journey_id?: string;
  related_checkin_id?: string;
  escalation_tier: number;
  created_at: string;
  updated_at: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
  responding_at?: string;
  responding_by?: string;
  resolved_at?: string;
  resolved_by?: string;
  resolution_notes?: string;
}

export interface IncidentRecipient {
  id: string;
  incident_id: string;
  contact_id: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  escalation_tier: number;
  status: 'pending' | 'notified' | 'acknowledged' | 'responding' | 'resolved';
  notified_at?: string;
  acknowledged_at?: string;
  is_responding: boolean;
  responded_at?: string;
  response_note?: string;
}

export type IncidentEventType =
  | 'incident_created'
  | 'notification_queued'
  | 'notification_dispatched'
  | 'notification_delivered'
  | 'acknowledged_by_contact'
  | 'response_initiated'
  | 'escalation_triggered'
  | 'location_updated'
  | 'location_revoked'
  | 'safe_confirmed_by_user'
  | 'incident_cancelled'
  | 'incident_resolved';

export interface IncidentEvent {
  id: string;
  incident_id: string;
  event_type: IncidentEventType;
  actor_name: string;
  actor_role: 'user' | 'contact' | 'system_scheduler';
  description: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export type CheckInStatus =
  | 'active'
  | 'reminded'
  | 'in_grace_period'
  | 'escalated'
  | 'completed'
  | 'cancelled'
  | 'missed';

export interface CheckIn {
  id: string;
  owner_user_id: string;
  protocol_id?: string;
  title: string;
  deadline_at: string;
  reminder_at: string;
  grace_period_seconds: number;
  contact_wait_seconds: number;
  status: CheckInStatus;
  current_escalation_tier: number;
  next_escalation_at?: string;
  related_journey_id?: string;
  active_incident_id?: string;
  created_at: string;
  resolved_at?: string;
}

export type JourneyStatus =
  | 'in_progress'
  | 'approaching'
  | 'safe_arrival_pending'
  | 'completed'
  | 'overdue_escalated'
  | 'cancelled';

export interface JourneyCallAction {
  id: string;
  journey_id: string;
  timestamp: string;
  action_type: 'tier1_call' | 'tier2_call' | 'emergency_call';
  recipient_name: string;
  phone_number: string;
  status: 'initiated' | 'opened_dialer' | 'manual_fallback';
  note?: string;
}

export interface Journey {
  id: string;
  owner_user_id: string;
  protocol_id?: string;
  check_in_id?: string;
  origin_name: string;
  origin_lat?: number;
  origin_lng?: number;
  destination_name: string;
  dest_lat: number;
  dest_lng: number;
  safe_radius_meters: number;
  start_time: string;
  expected_arrival_time: string;
  current_lat?: number;
  current_lng?: number;
  status: JourneyStatus;
  share_location: boolean;
  prompted_arrival_at?: string;
  created_at: string;
  completed_at?: string;

  // Custom Safety Journey Configuration & State
  journey_type?: 'preset' | 'custom';
  journey_name?: string;
  check_in_interval_minutes?: number;
  response_countdown_seconds?: number;
  tier1_contact_ids?: string[];
  tier2_contact_ids?: string[];
  emergency_phone_number?: string;
  missed_checkin_action?: 'reminder' | 'escalate';
  next_check_in_at?: string;
  last_check_in_at?: string;
  check_in_status?: 'ok' | 'prompt_due' | 'missed';
  missed_count?: number;
  call_actions?: JourneyCallAction[];
}

export interface SafetyProtocol {
  id: string;
  user_id: string;
  name: string;
  description: string;
  trigger_type: 'check_in_overdue' | 'urgent_button' | 'journey_delayed' | 'custom';
  reminder_lead_seconds: number; // e.g. 120s before deadline
  grace_period_seconds: number; // e.g. 120s after deadline before tier 1
  contact_wait_seconds: number; // e.g. 180s per contact before next escalation tier
  allow_location_sharing: boolean;
  location_auto_expire_minutes: number;
  escalation_contact_ids: string[]; // Ordered list of contact IDs
  resolution_behavior?: 'require_safe_confirmation' | 'allow_contact_resolve';
  is_default: boolean;
  active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface LocationShare {
  id: string;
  user_id: string;
  session_type: 'incident' | 'journey' | 'manual';
  session_id: string;
  allowed_contact_ids: string[];
  is_active: boolean;
  started_at: string;
  expires_at: string;
}

export interface LocationUpdate {
  id: string;
  share_id: string;
  latitude: number;
  longitude: number;
  accuracy_meters: number;
  address_approximate?: string;
  is_demo_coordinates: boolean;
  created_at: string;
}

export interface NotificationRecord {
  id: string;
  user_id: string;
  recipient_id: string;
  recipient_email: string;
  recipient_name: string;
  incident_id?: string;
  channel: 'in_app' | 'browser_push' | 'email_simulated' | 'sms_simulated';
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  provider_status: string; // e.g. "Notification delivery unconfirmed (In-App Only)"
  subject: string;
  message: string;
  masked_message?: string;
  is_discreet_masked: boolean;
  created_at: string;
  delivered_at?: string;
}
