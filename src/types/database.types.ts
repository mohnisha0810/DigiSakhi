// Strongly typed Supabase Database schema definitions
// Mirrors PostgreSQL schema with Row Level Security (RLS)

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          phone_number: string | null;
          emergency_notes: string | null;
          medical_info: string | null;
          discreet_exit_pin: string;
          discreet_mode_enabled: boolean;
          quick_exit_disguise: 'weather' | 'notes' | 'calculator';
          discreet_lockscreen_mask: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          phone_number?: string | null;
          emergency_notes?: string | null;
          medical_info?: string | null;
          discreet_exit_pin?: string;
          discreet_mode_enabled?: boolean;
          quick_exit_disguise?: 'weather' | 'notes' | 'calculator';
          discreet_lockscreen_mask?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          phone_number?: string | null;
          emergency_notes?: string | null;
          medical_info?: string | null;
          discreet_exit_pin?: string;
          discreet_mode_enabled?: boolean;
          quick_exit_disguise?: 'weather' | 'notes' | 'calculator';
          discreet_lockscreen_mask?: boolean;
          updated_at?: string;
        };
      };
      trusted_contacts: {
        Row: {
          id: string;
          user_id: string;
          contact_user_id: string | null;
          full_name: string;
          email: string;
          phone_number: string;
          relationship: string;
          escalation_order: number;
          status: 'pending' | 'accepted' | 'declined';
          can_view_location: boolean;
          avatar_color: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          contact_user_id?: string | null;
          full_name: string;
          email: string;
          phone_number: string;
          relationship: string;
          escalation_order?: number;
          status?: 'pending' | 'accepted' | 'declined';
          can_view_location?: boolean;
          avatar_color?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          contact_user_id?: string | null;
          full_name?: string;
          email?: string;
          phone_number?: string;
          relationship?: string;
          escalation_order?: number;
          status?: 'pending' | 'accepted' | 'declined';
          can_view_location?: boolean;
          avatar_color?: string | null;
          updated_at?: string;
        };
      };
      contact_invitations: {
        Row: {
          id: string;
          inviter_id: string;
          invitee_email: string;
          invitee_name: string;
          relationship: string;
          escalation_order: number;
          invitation_token: string;
          status: 'pending' | 'accepted' | 'declined' | 'expired';
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          inviter_id: string;
          invitee_email: string;
          invitee_name: string;
          relationship: string;
          escalation_order?: number;
          invitation_token: string;
          status?: 'pending' | 'accepted' | 'declined' | 'expired';
          created_at?: string;
          expires_at?: string;
        };
        Update: {
          id?: string;
          inviter_id?: string;
          invitee_email?: string;
          invitee_name?: string;
          relationship?: string;
          escalation_order?: number;
          status?: 'pending' | 'accepted' | 'declined' | 'expired';
        };
      };
      safety_protocols: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          trigger_type: 'check_in_overdue' | 'urgent_button' | 'journey_delayed' | 'custom';
          reminder_lead_seconds: number;
          grace_period_seconds: number;
          contact_wait_seconds: number;
          allow_location_sharing: boolean;
          location_auto_expire_minutes: number;
          escalation_contact_ids: string[];
          is_default: boolean;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          trigger_type: 'check_in_overdue' | 'urgent_button' | 'journey_delayed' | 'custom';
          reminder_lead_seconds?: number;
          grace_period_seconds?: number;
          contact_wait_seconds?: number;
          allow_location_sharing?: boolean;
          location_auto_expire_minutes?: number;
          escalation_contact_ids?: string[];
          is_default?: boolean;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          trigger_type?: 'check_in_overdue' | 'urgent_button' | 'journey_delayed' | 'custom';
          reminder_lead_seconds?: number;
          grace_period_seconds?: number;
          contact_wait_seconds?: number;
          allow_location_sharing?: boolean;
          location_auto_expire_minutes?: number;
          escalation_contact_ids?: string[];
          is_default?: boolean;
          active?: boolean;
          updated_at?: string;
        };
      };
      check_ins: {
        Row: {
          id: string;
          owner_user_id: string;
          protocol_id: string | null;
          title: string;
          deadline_at: string;
          reminder_at: string;
          grace_period_seconds: number;
          contact_wait_seconds: number;
          status: 'active' | 'reminded' | 'in_grace_period' | 'escalated' | 'completed' | 'cancelled';
          current_escalation_tier: number;
          next_escalation_at: string | null;
          related_journey_id: string | null;
          active_incident_id: string | null;
          created_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          owner_user_id: string;
          protocol_id?: string | null;
          title: string;
          deadline_at: string;
          reminder_at: string;
          grace_period_seconds?: number;
          contact_wait_seconds?: number;
          status?: 'active' | 'reminded' | 'in_grace_period' | 'escalated' | 'completed' | 'cancelled';
          current_escalation_tier?: number;
          next_escalation_at?: string | null;
          related_journey_id?: string | null;
          active_incident_id?: string | null;
          created_at?: string;
          resolved_at?: string | null;
        };
        Update: {
          status?: 'active' | 'reminded' | 'in_grace_period' | 'escalated' | 'completed' | 'cancelled';
          deadline_at?: string;
          reminder_at?: string;
          current_escalation_tier?: number;
          next_escalation_at?: string | null;
          active_incident_id?: string | null;
          resolved_at?: string | null;
        };
      };
      journeys: {
        Row: {
          id: string;
          owner_user_id: string;
          protocol_id: string | null;
          check_in_id: string | null;
          origin_name: string;
          destination_name: string;
          dest_lat: number;
          dest_lng: number;
          safe_radius_meters: number;
          start_time: string;
          expected_arrival_time: string;
          current_lat: number | null;
          current_lng: number | null;
          status: 'in_progress' | 'approaching' | 'safe_arrival_pending' | 'completed' | 'overdue_escalated' | 'cancelled';
          share_location: boolean;
          prompted_arrival_at: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          owner_user_id: string;
          protocol_id?: string | null;
          check_in_id?: string | null;
          origin_name: string;
          destination_name: string;
          dest_lat: number;
          dest_lng: number;
          safe_radius_meters?: number;
          start_time?: string;
          expected_arrival_time: string;
          current_lat?: number | null;
          current_lng?: number | null;
          status?: 'in_progress' | 'approaching' | 'safe_arrival_pending' | 'completed' | 'overdue_escalated' | 'cancelled';
          share_location?: boolean;
          prompted_arrival_at?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          current_lat?: number | null;
          current_lng?: number | null;
          status?: 'in_progress' | 'approaching' | 'safe_arrival_pending' | 'completed' | 'overdue_escalated' | 'cancelled';
          prompted_arrival_at?: string | null;
          completed_at?: string | null;
        };
      };
      incidents: {
        Row: {
          id: string;
          incident_number: string;
          owner_user_id: string;
          incident_type: 'check_on_me' | 'call_me' | 'urgent_assistance' | 'journey_checkin';
          priority: 'low' | 'medium' | 'high' | 'urgent';
          status: 'triggered' | 'notification_pending' | 'notification_sent' | 'delivery_confirmed' | 'acknowledged' | 'responding' | 'resolved' | 'cancelled';
          title: string;
          description: string | null;
          location_lat: number | null;
          location_lng: number | null;
          location_address: string | null;
          location_accuracy: number | null;
          is_demo_location: boolean;
          location_shared: boolean;
          location_expires_at: string | null;
          related_journey_id: string | null;
          related_checkin_id: string | null;
          escalation_tier: number;
          created_at: string;
          updated_at: string;
          acknowledged_at: string | null;
          acknowledged_by: string | null;
          responding_at: string | null;
          responding_by: string | null;
          resolved_at: string | null;
          resolved_by: string | null;
          resolution_notes: string | null;
        };
        Insert: {
          id?: string;
          incident_number: string;
          owner_user_id: string;
          incident_type: 'check_on_me' | 'call_me' | 'urgent_assistance' | 'journey_checkin';
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          status?: 'triggered' | 'notification_pending' | 'notification_sent' | 'delivery_confirmed' | 'acknowledged' | 'responding' | 'resolved' | 'cancelled';
          title: string;
          description?: string | null;
          location_lat?: number | null;
          location_lng?: number | null;
          location_address?: string | null;
          location_accuracy?: number | null;
          is_demo_location?: boolean;
          location_shared?: boolean;
          location_expires_at?: string | null;
          related_journey_id?: string | null;
          related_checkin_id?: string | null;
          escalation_tier?: number;
          created_at?: string;
          updated_at?: string;
          acknowledged_at?: string | null;
          acknowledged_by?: string | null;
          responding_at?: string | null;
          responding_by?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          resolution_notes?: string | null;
        };
        Update: {
          status?: 'triggered' | 'notification_pending' | 'notification_sent' | 'delivery_confirmed' | 'acknowledged' | 'responding' | 'resolved' | 'cancelled';
          escalation_tier?: number;
          updated_at?: string;
          acknowledged_at?: string | null;
          acknowledged_by?: string | null;
          responding_at?: string | null;
          responding_by?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          resolution_notes?: string | null;
        };
      };
      incident_recipients: {
        Row: {
          id: string;
          incident_id: string;
          contact_id: string;
          escalation_tier: number;
          status: 'pending' | 'notified' | 'acknowledged' | 'responding' | 'resolved';
          notified_at: string | null;
          acknowledged_at: string | null;
          is_responding: boolean;
          responded_at: string | null;
          response_note: string | null;
        };
        Insert: {
          id?: string;
          incident_id: string;
          contact_id: string;
          escalation_tier?: number;
          status?: 'pending' | 'notified' | 'acknowledged' | 'responding' | 'resolved';
          notified_at?: string | null;
          acknowledged_at?: string | null;
          is_responding?: boolean;
          responded_at?: string | null;
          response_note?: string | null;
        };
        Update: {
          status?: 'pending' | 'notified' | 'acknowledged' | 'responding' | 'resolved';
          acknowledged_at?: string | null;
          is_responding?: boolean;
          responded_at?: string | null;
          response_note?: string | null;
        };
      };
      incident_events: {
        Row: {
          id: string;
          incident_id: string;
          event_type: string;
          actor_name: string;
          actor_role: 'user' | 'contact' | 'system_scheduler';
          description: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          incident_id: string;
          event_type: string;
          actor_name: string;
          actor_role: 'user' | 'contact' | 'system_scheduler';
          description: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          description?: string;
          metadata?: Json;
        };
      };
      location_shares: {
        Row: {
          id: string;
          user_id: string;
          session_type: 'incident' | 'journey' | 'manual';
          session_id: string;
          allowed_contact_ids: string[];
          is_active: boolean;
          started_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_type: 'incident' | 'journey' | 'manual';
          session_id: string;
          allowed_contact_ids?: string[];
          is_active?: boolean;
          started_at?: string;
          expires_at: string;
        };
        Update: {
          is_active?: boolean;
          expires_at?: string;
        };
      };
      location_updates: {
        Row: {
          id: string;
          share_id: string;
          latitude: number;
          longitude: number;
          accuracy_meters: number;
          address_approximate: string | null;
          is_demo_coordinates: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          share_id: string;
          latitude: number;
          longitude: number;
          accuracy_meters: number;
          address_approximate?: string | null;
          is_demo_coordinates?: boolean;
          created_at?: string;
        };
        Update: {
          latitude?: number;
          longitude?: number;
          accuracy_meters?: number;
          address_approximate?: string | null;
        };
      };
      notification_records: {
        Row: {
          id: string;
          user_id: string;
          recipient_id: string | null;
          recipient_email: string;
          recipient_name: string;
          incident_id: string | null;
          channel: 'in_app' | 'browser_push' | 'email_simulated' | 'sms_simulated';
          status: 'pending' | 'sent' | 'delivered' | 'failed';
          provider_status: string | null;
          subject: string;
          message: string;
          masked_message: string | null;
          is_discreet_masked: boolean;
          created_at: string;
          delivered_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          recipient_id?: string | null;
          recipient_email: string;
          recipient_name: string;
          incident_id?: string | null;
          channel: 'in_app' | 'browser_push' | 'email_simulated' | 'sms_simulated';
          status?: 'pending' | 'sent' | 'delivered' | 'failed';
          provider_status?: string | null;
          subject: string;
          message: string;
          masked_message?: string | null;
          is_discreet_masked?: boolean;
          created_at?: string;
          delivered_at?: string | null;
        };
        Update: {
          status?: 'pending' | 'sent' | 'delivered' | 'failed';
          provider_status?: string | null;
          delivered_at?: string | null;
        };
      };
    };
  };
}
