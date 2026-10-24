import { LocalStorageDB } from './supabase';
import { notificationService } from './notifications';
import { generateIncidentNumber, calculateDistanceMeters } from './utils';
import {
  UserProfile,
  CheckIn,
  Journey,
  Incident,
  IncidentRecipient,
  IncidentEvent,
  TrustedContact,
  SafetyProtocol,
  NotificationRecord,
  LocationShare,
} from '@/types';

// Track executed escalation actions to guarantee strict idempotency
const PROCESSED_ACTIONS_KEY = 'scheduler_processed_actions';

export interface SchedulerExecutionResult {
  timestamp: string;
  actionsTaken: string[];
  remindersSent: number;
  escalationsTriggered: number;
  arrivalsPrompted: number;
}

class SafetySchedulerService {
  private timer: ReturnType<typeof setInterval> | null = null;
  private virtualTimeOffsetMs = 0; // Virtual offset for demo fast-forwarding

  constructor() {
    this.loadVirtualOffset();
  }

  getVirtualNow(): Date {
    return new Date(Date.now() + this.virtualTimeOffsetMs);
  }

  getVirtualOffsetMs(): number {
    return this.virtualTimeOffsetMs;
  }

  setVirtualOffsetMs(ms: number): void {
    this.virtualTimeOffsetMs = ms;
    try {
      localStorage.setItem('safesphere_virtual_offset_ms', ms.toString());
    } catch {}
  }

  advanceVirtualTimeSeconds(seconds: number): void {
    this.setVirtualOffsetMs(this.virtualTimeOffsetMs + seconds * 1000);
    this.executeSchedulerCycle(); // Trigger immediately after advancing time
  }

  resetVirtualTime(): void {
    this.setVirtualOffsetMs(0);
    try {
      localStorage.removeItem('safesphere_virtual_offset_ms');
    } catch {}
  }

  private loadVirtualOffset(): void {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('safesphere_virtual_offset_ms');
      if (stored) {
        this.virtualTimeOffsetMs = parseInt(stored, 10) || 0;
      }
    } catch {}
  }

  private getProcessedActions(): Set<string> {
    const list = LocalStorageDB.getItem<string[]>(PROCESSED_ACTIONS_KEY, []);
    return new Set(list);
  }

  private markActionProcessed(actionKey: string): void {
    const actions = this.getProcessedActions();
    actions.add(actionKey);
    // Keep max 200 items in log
    const arr = Array.from(actions).slice(-200);
    LocalStorageDB.setItem(PROCESSED_ACTIONS_KEY, arr);
  }

  start(intervalMs = 3000): void {
    if (this.timer) return;
    this.executeSchedulerCycle();
    this.timer = setInterval(() => {
      this.executeSchedulerCycle();
    }, intervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  // The core idempotent scheduler cycle
  executeSchedulerCycle(): SchedulerExecutionResult {
    const now = this.getVirtualNow();
    const actionsTaken: string[] = [];
    let remindersSent = 0;
    let escalationsTriggered = 0;
    let arrivalsPrompted = 0;

    const checkIns = LocalStorageDB.getItem<CheckIn[]>('check_ins', []);
    const journeys = LocalStorageDB.getItem<Journey[]>('journeys', []);
    const contacts = LocalStorageDB.getItem<TrustedContact[]>('trusted_contacts', []);
    const protocols = LocalStorageDB.getItem<SafetyProtocol[]>('safety_protocols', []);
    let incidents = LocalStorageDB.getItem<Incident[]>('incidents', []);
    let incidentRecipients = LocalStorageDB.getItem<IncidentRecipient[]>('incident_recipients', []);
    let incidentEvents = LocalStorageDB.getItem<IncidentEvent[]>('incident_events', []);
    let notifications = LocalStorageDB.getItem<NotificationRecord[]>('notification_records', []);

    let checkInsUpdated = false;
    let journeysUpdated = false;
    let incidentsUpdated = false;

    // 1. Process Check-Ins
    for (let i = 0; i < checkIns.length; i++) {
      const checkIn = checkIns[i];
      if (checkIn.status === 'completed' || checkIn.status === 'cancelled') {
        continue;
      }

      const deadline = new Date(checkIn.deadline_at);
      const reminderTime = new Date(checkIn.reminder_at);
      const gracePeriodEnd = new Date(deadline.getTime() + checkIn.grace_period_seconds * 1000);

      // A. Pre-deadline Reminder
      if (now >= reminderTime && now < deadline && checkIn.status === 'active') {
        const actionKey = `reminder_${checkIn.id}`;
        if (!this.getProcessedActions().has(actionKey)) {
          this.markActionProcessed(actionKey);
          checkIn.status = 'reminded';
          checkInsUpdated = true;
          remindersSent++;
          actionsTaken.push(`Sent reminder for check-in "${checkIn.title}"`);

          const notif = notificationService.sendNotification({
            userId: checkIn.owner_user_id,
            recipientId: checkIn.owner_user_id,
            recipientName: 'You',
            recipientEmail: 'elena@safesphere.demo',
            subject: 'Check-in Reminder Approaching',
            message: `Your check-in "${checkIn.title}" is due in ${Math.round((deadline.getTime() - now.getTime()) / 60000)} minutes. Please confirm you are safe.`,
            isDiscreetMasked: true,
          });
          notif.then((record) => {
            const cur = LocalStorageDB.getItem<NotificationRecord[]>('notification_records', []);
            LocalStorageDB.setItem('notification_records', [record, ...cur]);
          });
        }
      }

      // B. Deadline passed, entering Grace Period
      if (now >= deadline && now < gracePeriodEnd && (checkIn.status === 'active' || checkIn.status === 'reminded')) {
        const actionKey = `grace_${checkIn.id}`;
        if (!this.getProcessedActions().has(actionKey)) {
          this.markActionProcessed(actionKey);
          checkIn.status = 'in_grace_period';
          checkInsUpdated = true;
          actionsTaken.push(`Check-in "${checkIn.title}" entered grace period (${checkIn.grace_period_seconds}s)`);
        }
      }

      // C. Grace period expired -> Initial Tier 1 Escalation
      if (
        now >= gracePeriodEnd &&
        (checkIn.status === 'in_grace_period' || checkIn.status === 'active' || checkIn.status === 'reminded')
      ) {
        const actionKey = `escalate_tier1_${checkIn.id}`;
        if (!this.getProcessedActions().has(actionKey)) {
          this.markActionProcessed(actionKey);

          // Find active protocol or fallback
          const proto = protocols.find((p) => p.id === checkIn.protocol_id) || protocols.find((p) => p.is_default) || protocols[0];

          let tier1Contact: TrustedContact | undefined;
          if (proto?.escalation_contact_ids && proto.escalation_contact_ids.length > 0) {
            tier1Contact = contacts.find((c) => c.id === proto.escalation_contact_ids[0] && c.status === 'accepted');
          }
          if (!tier1Contact) {
            const acceptedContacts = contacts
              .filter((c) => c.status === 'accepted' && c.user_id === checkIn.owner_user_id)
              .sort((a, b) => a.escalation_order - b.escalation_order);
            tier1Contact = acceptedContacts[0];
          }

          // Lookup owner profile dynamically
          const profiles = LocalStorageDB.getItem<UserProfile[]>('profiles', []);
          const ownerProfile = profiles.find((p) => p.id === checkIn.owner_user_id);
          const ownerName = ownerProfile?.full_name || 'Protected User';
          const ownerPhone = ownerProfile?.phone_number || '';

          if (tier1Contact) {
            checkIn.status = 'escalated';
            checkIn.current_escalation_tier = 1;
            checkIn.next_escalation_at = new Date(now.getTime() + checkIn.contact_wait_seconds * 1000).toISOString();
            checkInsUpdated = true;
            escalationsTriggered++;

            // Create real incident record
            const newIncidentId = 'inc_' + Math.random().toString(36).substring(2, 9);
            const incidentNum = generateIncidentNumber();
            const newIncident: Incident = {
              id: newIncidentId,
              incident_number: incidentNum,
              owner_user_id: checkIn.owner_user_id,
              owner_name: ownerName,
              owner_phone: ownerPhone,
              incident_type: 'journey_checkin',
              priority: 'high',
              status: 'notification_sent',
              title: `Overdue Check-in: ${checkIn.title}`,
              description: `Missed safety check-in deadline. This is an overdue check-in requiring attention, not a confirmed emergency.`,
              location_lat: 37.7955,
              location_lng: -122.3937,
              location_address: 'Ferry Building, San Francisco, CA (Demo Coords)',
              location_accuracy: 15,
              is_demo_location: true,
              location_shared: proto?.allow_location_sharing ?? true,
              location_expires_at: new Date(now.getTime() + (proto?.location_auto_expire_minutes || 60) * 60000).toISOString(),
              related_journey_id: checkIn.related_journey_id,
              related_checkin_id: checkIn.id,
              escalation_tier: 1,
              created_at: now.toISOString(),
              updated_at: now.toISOString(),
            };

            checkIn.active_incident_id = newIncidentId;

            // Recipient record for Tier 1 contact
            const recipient: IncidentRecipient = {
              id: 'ir_' + Math.random().toString(36).substring(2, 9),
              incident_id: newIncidentId,
              contact_id: tier1Contact.id,
              contact_name: tier1Contact.full_name,
              contact_email: tier1Contact.email,
              contact_phone: tier1Contact.phone_number,
              escalation_tier: 1,
              status: 'notified',
              notified_at: now.toISOString(),
              is_responding: false,
            };

            // Event timeline items
            const ev1: IncidentEvent = {
              id: 'ev_' + Math.random().toString(36).substring(2, 9),
              incident_id: newIncidentId,
              event_type: 'incident_created',
              actor_name: 'SafeSphere Scheduler',
              actor_role: 'system_scheduler',
              description: `Automated overdue check-in escalation initiated. Grace period of ${checkIn.grace_period_seconds}s expired without user confirmation.`,
              created_at: now.toISOString(),
            };

            const ev2: IncidentEvent = {
              id: 'ev_' + Math.random().toString(36).substring(2, 9),
              incident_id: newIncidentId,
              event_type: 'escalation_triggered',
              actor_name: 'SafeSphere Scheduler',
              actor_role: 'system_scheduler',
              description: `Tier 1 alert dispatched to primary contact ${tier1Contact.full_name} (${tier1Contact.relationship}). Awaiting response within ${checkIn.contact_wait_seconds}s.`,
              created_at: new Date(now.getTime() + 1000).toISOString(),
            };

            incidents = [newIncident, ...incidents];
            incidentRecipients = [recipient, ...incidentRecipients];
            incidentEvents = [ev2, ev1, ...incidentEvents];
            incidentsUpdated = true;

            actionsTaken.push(`Escalated to Tier 1: ${tier1Contact.full_name}`);

            // Dispatch notification
            notificationService.sendNotification({
              userId: checkIn.owner_user_id,
              recipientId: tier1Contact.id,
              recipientName: tier1Contact.full_name,
              recipientEmail: tier1Contact.email,
              incidentId: newIncidentId,
              subject: `Overdue Safety Check-in Alert: ${ownerName}`,
              message: `${ownerName} missed scheduled check-in "${checkIn.title}". Please attempt contact or acknowledge on SafeSphere.`,
              isDiscreetMasked: false,
            }).then((notif) => {
              const cur = LocalStorageDB.getItem<NotificationRecord[]>('notification_records', []);
              LocalStorageDB.setItem('notification_records', [notif, ...cur]);
            });
          }
        }
      }

      // D. Multi-tier Escalation: If Tier 1 has not acknowledged and wait window elapsed -> Escalate to Tier 2
      if (checkIn.status === 'escalated' && checkIn.next_escalation_at && checkIn.active_incident_id) {
        const nextEscTime = new Date(checkIn.next_escalation_at);
        const relatedInc = incidents.find((inc) => inc.id === checkIn.active_incident_id);

        // Check if incident is already acknowledged or resolved
        const isAlreadyAcknowledged = relatedInc && (relatedInc.status === 'acknowledged' || relatedInc.status === 'responding' || relatedInc.status === 'resolved');

        if (now >= nextEscTime && !isAlreadyAcknowledged && checkIn.current_escalation_tier === 1) {
          const actionKey = `escalate_tier2_${checkIn.id}`;
          if (!this.getProcessedActions().has(actionKey)) {
            this.markActionProcessed(actionKey);

            const proto = protocols.find((p) => p.id === checkIn.protocol_id) || protocols.find((p) => p.is_default) || protocols[0];

            let tier2Contact: TrustedContact | undefined;
            if (proto?.escalation_contact_ids && proto.escalation_contact_ids.length > 1) {
              tier2Contact = contacts.find((c) => c.id === proto.escalation_contact_ids[1] && c.status === 'accepted');
            }
            if (!tier2Contact) {
              const acceptedContacts = contacts
                .filter((c) => c.status === 'accepted' && c.user_id === checkIn.owner_user_id)
                .sort((a, b) => a.escalation_order - b.escalation_order);
              tier2Contact = acceptedContacts[1];
            }
            const profiles = LocalStorageDB.getItem<UserProfile[]>('profiles', []);
            const ownerProfile = profiles.find((p) => p.id === checkIn.owner_user_id);
            const ownerName = ownerProfile?.full_name || 'Protected User';

            if (tier2Contact && relatedInc) {
              checkIn.current_escalation_tier = 2;
              checkIn.next_escalation_at = undefined; // Max tiers reached for demo
              checkInsUpdated = true;
              escalationsTriggered++;

              relatedInc.escalation_tier = 2;
              relatedInc.updated_at = now.toISOString();

              const recipient2: IncidentRecipient = {
                id: 'ir_' + Math.random().toString(36).substring(2, 9),
                incident_id: relatedInc.id,
                contact_id: tier2Contact.id,
                contact_name: tier2Contact.full_name,
                contact_email: tier2Contact.email,
                contact_phone: tier2Contact.phone_number,
                escalation_tier: 2,
                status: 'notified',
                notified_at: now.toISOString(),
                is_responding: false,
              };

              const evTier2: IncidentEvent = {
                id: 'ev_' + Math.random().toString(36).substring(2, 9),
                incident_id: relatedInc.id,
                event_type: 'escalation_triggered',
                actor_name: 'SafeSphere Scheduler',
                actor_role: 'system_scheduler',
                description: `Tier 1 contact did not acknowledge within ${checkIn.contact_wait_seconds}s. Escalated to Tier 2: ${tier2Contact.full_name} (${tier2Contact.relationship}).`,
                created_at: now.toISOString(),
              };

              incidentRecipients = [recipient2, ...incidentRecipients];
              incidentEvents = [evTier2, ...incidentEvents];
              incidentsUpdated = true;

              actionsTaken.push(`Escalated to Tier 2: ${tier2Contact.full_name}`);

              notificationService.sendNotification({
                userId: checkIn.owner_user_id,
                recipientId: tier2Contact.id,
                recipientName: tier2Contact.full_name,
                recipientEmail: tier2Contact.email,
                incidentId: relatedInc.id,
                subject: `Escalated Safety Alert: ${ownerName}`,
                message: `Tier 1 responder did not acknowledge. ${ownerName}'s check-in "${checkIn.title}" remains overdue.`,
                isDiscreetMasked: false,
              }).then((notif) => {
                const cur = LocalStorageDB.getItem<NotificationRecord[]>('notification_records', []);
                LocalStorageDB.setItem('notification_records', [notif, ...cur]);
              });
            }
          }
        }
      }
    }

    // 2. Process Journeys & Safe Arrival Verification
    for (let j = 0; j < journeys.length; j++) {
      const journey = journeys[j];
      if (journey.status === 'completed' || journey.status === 'cancelled') {
        continue;
      }

      // Proximity check if user coordinates are recorded
      if (journey.current_lat && journey.current_lng) {
        const dist = calculateDistanceMeters(
          journey.current_lat,
          journey.current_lng,
          journey.dest_lat,
          journey.dest_lng
        );

        // Entered safe arrival radius
        if (dist <= journey.safe_radius_meters && journey.status === 'in_progress') {
          journey.status = 'safe_arrival_pending';
          journey.prompted_arrival_at = now.toISOString();
          journeysUpdated = true;
          arrivalsPrompted++;
          actionsTaken.push(`User within ${dist}m of destination: Prompting safe arrival confirmation.`);
        }
      }

      // Expected arrival time overdue check
      const eta = new Date(journey.expected_arrival_time);
      if (now >= eta && (journey.status === 'in_progress' || journey.status === 'safe_arrival_pending')) {
        const linkedCheckIn = checkIns.find((c) => c.id === journey.check_in_id || c.related_journey_id === journey.id);
        if (linkedCheckIn && linkedCheckIn.status === 'escalated') {
          journey.status = 'overdue_escalated';
          journeysUpdated = true;
        }

        const actionKey = `journey_overdue_${journey.id}`;
        if (!this.getProcessedActions().has(actionKey)) {
          this.markActionProcessed(actionKey);
          actionsTaken.push(`Journey to ${journey.destination_name} is overdue.`);
        }
      }
    }

    // 3. Process Location Share Expiry
    const locationShares = LocalStorageDB.getItem<LocationShare[]>('location_shares', []);
    let sharesUpdated = false;
    for (let s = 0; s < locationShares.length; s++) {
      const share = locationShares[s];
      if (share.is_active && new Date(share.expires_at) <= now) {
        share.is_active = false;
        sharesUpdated = true;
        const actionKey = `loc_share_expired_${share.id}`;
        if (!this.getProcessedActions().has(actionKey)) {
          this.markActionProcessed(actionKey);
          actionsTaken.push(`Location sharing session ${share.id} reached expiry and was deactivated.`);
        }
      }
    }

    // Persist any updates
    if (checkInsUpdated) LocalStorageDB.setItem('check_ins', checkIns);
    if (journeysUpdated) LocalStorageDB.setItem('journeys', journeys);
    if (sharesUpdated) LocalStorageDB.setItem('location_shares', locationShares);
    if (incidentsUpdated) {
      LocalStorageDB.setItem('incidents', incidents);
      LocalStorageDB.setItem('incident_recipients', incidentRecipients);
      LocalStorageDB.setItem('incident_events', incidentEvents);
    }

    return {
      timestamp: now.toISOString(),
      actionsTaken,
      remindersSent,
      escalationsTriggered,
      arrivalsPrompted,
    };
  }
}

export const schedulerService = new SafetySchedulerService();
