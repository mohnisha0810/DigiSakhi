import { createClient, SupabaseClient } from '@supabase/supabase-js';
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

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isCloudSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('placeholder')
);

// Fallback or Real Supabase Client
export const supabase: SupabaseClient | null = isCloudSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Initial Seed Data for Demo & Development
export const INITIAL_USER_PROFILE: UserProfile = {
  id: 'usr_elena_01',
  email: 'elena@safesphere.demo',
  full_name: 'Elena Rostova',
  phone_number: '+1 (555) 234-5678',
  emergency_notes: 'Asthma inhaler in outer bag pocket. Blood type O+.',
  medical_info: 'Mild asthma, penicillin allergy.',
  discreet_exit_pin: '1234',
  discreet_mode_enabled: false,
  quick_exit_disguise: 'weather',
  discreet_lockscreen_mask: true,
  created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  updated_at: new Date().toISOString(),
};

export const INITIAL_CONTACT_PROFILES: UserProfile[] = [
  {
    id: 'usr_maya_02',
    email: 'maya@safesphere.demo',
    full_name: 'Maya Patel',
    phone_number: '+1 (555) 345-6789',
    emergency_notes: 'Primary emergency contact & roommate.',
    discreet_exit_pin: '1234',
    discreet_mode_enabled: false,
    quick_exit_disguise: 'weather',
    discreet_lockscreen_mask: false,
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'usr_david_03',
    email: 'david@safesphere.demo',
    full_name: 'David Chen',
    phone_number: '+1 (555) 456-7890',
    emergency_notes: 'Secondary emergency contact & brother.',
    discreet_exit_pin: '1234',
    discreet_mode_enabled: false,
    quick_exit_disguise: 'notes',
    discreet_lockscreen_mask: false,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const INITIAL_CONTACTS: TrustedContact[] = [
  {
    id: 'tc_maya_01',
    user_id: 'usr_elena_01',
    contact_user_id: 'usr_maya_02',
    full_name: 'Maya Patel',
    email: 'maya@safesphere.demo',
    phone_number: '+1 (555) 345-6789',
    relationship: 'Roommate & Best Friend',
    escalation_order: 1, // Tier 1 responder
    status: 'accepted',
    can_view_location: true,
    avatar_color: 'bg-teal-500',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'tc_david_02',
    user_id: 'usr_elena_01',
    contact_user_id: 'usr_david_03',
    full_name: 'David Chen',
    email: 'david@safesphere.demo',
    phone_number: '+1 (555) 456-7890',
    relationship: 'Brother',
    escalation_order: 2, // Tier 2 responder
    status: 'accepted',
    can_view_location: true,
    avatar_color: 'bg-indigo-500',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'tc_sarah_03',
    user_id: 'usr_elena_01',
    full_name: 'Sarah Jenkins',
    email: 'sarah@safesphere.demo',
    phone_number: '+1 (555) 987-6543',
    relationship: 'Colleague',
    escalation_order: 3,
    status: 'pending', // Unverified contact demonstration!
    can_view_location: false,
    avatar_color: 'bg-amber-500',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

export const INITIAL_PROTOCOLS: SafetyProtocol[] = [
  {
    id: 'proto_night_commute',
    user_id: 'usr_elena_01',
    name: 'Late Night Commute Protocol',
    description: 'Automatic escalation workflow for late transit or walking home alone.',
    trigger_type: 'check_in_overdue',
    reminder_lead_seconds: 120, // 2 minutes before deadline
    grace_period_seconds: 180, // 3 minutes after deadline before tier 1
    contact_wait_seconds: 180, // 3 minutes wait per tier before next contact
    allow_location_sharing: true,
    location_auto_expire_minutes: 60,
    escalation_contact_ids: ['tc_maya_01', 'tc_david_02'],
    is_default: true,
    active: true,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'proto_solo_run',
    user_id: 'usr_elena_01',
    name: 'Solo Trail & Run Protocol',
    description: 'Safety check-in for running or workouts in low-signal or isolated parks.',
    trigger_type: 'check_in_overdue',
    reminder_lead_seconds: 300,
    grace_period_seconds: 300,
    contact_wait_seconds: 240,
    allow_location_sharing: true,
    location_auto_expire_minutes: 120,
    escalation_contact_ids: ['tc_maya_01', 'tc_david_02'],
    is_default: false,
    active: true,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

// Persistent Local Database Storage Manager
const STORAGE_PREFIX = 'safesphere_db_v1_';

export class LocalStorageDB {
  private static channel = typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel('safesphere_realtime_sync')
    : null;

  static getItem<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const data = localStorage.getItem(STORAGE_PREFIX + key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  static setItem<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
      this.channel?.postMessage({ type: 'TABLE_UPDATE', table: key, data: value });
    } catch (err) {
      console.error(`Failed to store ${key} in localStorage:`, err);
    }
  }

  static subscribe(onSync: (table: string, data: any) => void): () => void {
    if (!this.channel) return () => {};
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'TABLE_UPDATE') {
        onSync(e.data.table, e.data.data);
      }
    };
    this.channel.addEventListener('message', handler);
    return () => this.channel?.removeEventListener('message', handler);
  }

  static resetDatabase(): void {
    if (typeof window === 'undefined') return;
    // Clear all SafeSphere keys
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));

    // Re-seed initial data
    this.setItem('profiles', [INITIAL_USER_PROFILE, ...INITIAL_CONTACT_PROFILES]);
    this.setItem('trusted_contacts', INITIAL_CONTACTS);
    this.setItem('contact_invitations', []);
    this.setItem('safety_protocols', INITIAL_PROTOCOLS);
    this.setItem('check_ins', []);
    this.setItem('journeys', []);
    this.setItem('incidents', []);
    this.setItem('incident_recipients', []);
    this.setItem('incident_events', []);
    this.setItem('location_shares', []);
    this.setItem('location_updates', []);
    this.setItem('notification_records', []);

    this.channel?.postMessage({ type: 'DATABASE_RESET' });
  }

  static initialize(): void {
    const initialized = this.getItem('db_initialized', false);
    if (!initialized) {
      this.resetDatabase();
      this.setItem('db_initialized', true);
    }
  }
}

// Auto initialize storage on load
if (typeof window !== 'undefined') {
  LocalStorageDB.initialize();
}
