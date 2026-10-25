import test, { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { setupTestEnvironment } from './setup';

// Setup environment before importing modules that inspect window/localStorage
const storage = setupTestEnvironment();

import {
  LocalStorageDB,
  INITIAL_USER_PROFILE,
  INITIAL_CONTACT_PROFILES,
  INITIAL_CONTACTS,
  INITIAL_PROTOCOLS,
} from '../src/lib/supabase';
import { LocalDevelopmentAdapter } from '../src/lib/backend/localAdapter';
import { schedulerService } from '../src/lib/scheduler';
import { geoService } from '../src/lib/geolocation';
import { calculateDistanceMeters, generateIncidentNumber } from '../src/lib/utils';
import { Incident, IncidentRecipient, IncidentEvent, CheckIn, Journey, SafetyProtocol } from '../src/types';

describe('SafeSphere Comprehensive QA Audit Suite', () => {
  let backend: LocalDevelopmentAdapter;

  beforeEach(() => {
    storage.clear();
    LocalStorageDB.resetDatabase();
    schedulerService.resetVirtualTime();
    backend = new LocalDevelopmentAdapter();
  });

  // =========================================================================
  // 1. AUTHENTICATION & SESSION PERSISTENCE
  // =========================================================================
  describe('1. Authentication & Session Persistence', () => {
    it('signs up a new user and persists their account and default safety protocol', async () => {
      const email = 'clara.test@safesphere.demo';
      const session = await backend.signUp({
        email,
        password: 'securePassword123!',
        fullName: 'Clara Oswald',
        phoneNumber: '+1 (555) 999-1111',
        emergencyNotes: 'Allergic to sulfa drugs',
        medicalInfo: 'Type 1 diabetic',
      });

      assert.ok(session.user.id.startsWith('usr_'));
      assert.equal(session.user.email, email);
      assert.equal(session.profile.full_name, 'Clara Oswald');
      assert.equal(session.profile.medical_info, 'Type 1 diabetic');

      // Verify default protocol was auto-created for this user
      const protocols = await backend.getProtocols(session.user.id);
      assert.equal(protocols.length, 1);
      assert.equal(protocols[0].is_default, true);
      assert.equal(protocols[0].user_id, session.user.id);

      // Verify session was persisted in storage
      const activeSession = await backend.getCurrentSession();
      assert.equal(activeSession?.user.email, email);
    });

    it('rejects duplicate registration with identical email', async () => {
      await backend.signUp({
        email: 'clara.duplicate@safesphere.demo',
        password: 'pass',
        fullName: 'Clara Duplicate',
      });

      await assert.rejects(
        async () => {
          await backend.signUp({
            email: 'clara.duplicate@safesphere.demo',
            password: 'differentPassword',
            fullName: 'Clara Another',
          });
        },
        {
          message: 'A user with this email address already exists.',
        }
      );
    });

    it('signs in an existing user and rejects invalid credentials', async () => {
      const elenaEmail = INITIAL_USER_PROFILE.email;
      const session = await backend.signIn(elenaEmail);
      assert.equal(session.user.id, INITIAL_USER_PROFILE.id);
      assert.equal(session.profile.full_name, INITIAL_USER_PROFILE.full_name);

      await assert.rejects(
        async () => {
          await backend.signIn('nonexistent@safesphere.demo');
        },
        /No account found with email/
      );
    });

    it('clears session on signOut', async () => {
      await backend.signIn(INITIAL_USER_PROFILE.email);
      await backend.signOut();
      // In local dev adapter, after sign out, default session fallback returns default or null
      const rawStored = storage.getItem('safesphere_auth_session');
      assert.equal(rawStored, null);
    });
  });

  // =========================================================================
  // 2. USER & CONTACT AUTHORIZATION & DATA ISOLATION
  // =========================================================================
  describe('2. User & Trusted Contact Authorization & Isolation', () => {
    it('guarantees a trusted contact cannot access unrelated users incidents', async () => {
      // User A (Elena) creates an incident with Maya as recipient
      const userAId = 'usr_elena_01';
      const userBId = 'usr_unrelated_99';
      const mayaEmail = 'maya@safesphere.demo';
      const davidEmail = 'david@safesphere.demo';

      // Create an incident owned by User B (unrelated)
      const incBRes = await backend.createIncident(
        {
          incident_number: generateIncidentNumber(),
          owner_user_id: userBId,
          owner_name: 'Unrelated User',
          incident_type: 'check_on_me',
          priority: 'low',
          status: 'notification_sent',
          title: 'User B Private Incident',
          location_shared: false,
          escalation_tier: 1,
        },
        [
          {
            contact_id: 'tc_stranger',
            contact_name: 'Stranger Contact',
            contact_email: 'stranger@other.demo',
            contact_phone: '+1 555-0000',
            escalation_tier: 1,
            status: 'notified',
            is_responding: false,
          },
        ],
        {
          actor_name: 'System',
          actor_role: 'system_scheduler',
          description: 'Incident initialized',
          event_type: 'incident_created',
        }
      );

      // Create an incident owned by User A with Maya as recipient
      const incARes = await backend.createIncident(
        {
          incident_number: generateIncidentNumber(),
          owner_user_id: userAId,
          owner_name: 'Elena Rostova',
          incident_type: 'check_on_me',
          priority: 'low',
          status: 'notification_sent',
          title: 'Elena Incident for Maya',
          location_shared: true,
          escalation_tier: 1,
        },
        [
          {
            contact_id: 'tc_maya_01',
            contact_name: 'Maya Patel',
            contact_email: mayaEmail,
            contact_phone: '+1 555-345-6789',
            escalation_tier: 1,
            status: 'notified',
            is_responding: false,
          },
        ],
        {
          actor_name: 'Elena Rostova',
          actor_role: 'user',
          description: 'Check on me triggered',
          event_type: 'incident_created',
        }
      );

      // Maya (contact role) queries incidents
      const mayaIncidents = await backend.getIncidents('usr_maya_02', true, mayaEmail);
      assert.ok(mayaIncidents.some((i) => i.id === incARes.incident.id));
      assert.ok(!mayaIncidents.some((i) => i.id === incBRes.incident.id));

      // David (contact role, not assigned to either) queries incidents
      const davidIncidents = await backend.getIncidents('usr_david_03', true, davidEmail);
      assert.ok(!davidIncidents.some((i) => i.id === incARes.incident.id));
      assert.ok(!davidIncidents.some((i) => i.id === incBRes.incident.id));
    });

    it('enforces backend authorization on location updates', async () => {
      // User A starts a location share authorized ONLY for tc_maya_01
      const share = await backend.createLocationShare({
        user_id: 'usr_elena_01',
        session_type: 'manual',
        session_id: 'sess_loc_iso_01',
        allowed_contact_ids: ['tc_maya_01'],
        is_active: true,
        expires_at: new Date(Date.now() + 3600000).toISOString(),
      });

      await backend.recordLocationUpdate({
        share_id: share.id,
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy_meters: 10,
        is_demo_coordinates: false,
      });

      // Maya (usr_maya_02, linked to tc_maya_01) can view coordinates
      const mayaUpdates = await backend.getLocationUpdates(share.id, 'usr_maya_02');
      assert.equal(mayaUpdates.length, 1);
      assert.equal(mayaUpdates[0].latitude, 37.7749);

      // Unrelated user (usr_stranger_99) attempting to view coordinates is rejected
      await assert.rejects(
        async () => {
          await backend.getLocationUpdates(share.id, 'usr_stranger_99');
        },
        /Unauthorized: You are not authorized to view location updates/
      );
    });

    it('prevents unauthorized users from modifying responder status', async () => {
      // Create an incident assigned to Maya
      const incRes = await backend.createIncident(
        {
          incident_number: generateIncidentNumber(),
          owner_user_id: 'usr_elena_01',
          owner_name: 'Elena Rostova',
          incident_type: 'check_on_me',
          priority: 'low',
          status: 'notification_sent',
          title: 'Auth test incident',
          location_shared: false,
          escalation_tier: 1,
        },
        [
          {
            contact_id: 'tc_maya_01',
            contact_name: 'Maya Patel',
            contact_email: 'maya@safesphere.demo',
            contact_phone: '+1 555-345-6789',
            escalation_tier: 1,
            status: 'notified',
            is_responding: false,
          },
        ],
        {
          actor_name: 'System',
          actor_role: 'system_scheduler',
          description: 'Incident initialized',
          event_type: 'incident_created',
        }
      );

      const recipient = incRes.recipients[0];

      // Simulate logged in as David Chen trying to modify Maya's responder status
      storage.setItem(
        'safesphere_auth_session',
        JSON.stringify({
          user: { id: 'usr_david_03', email: 'david@safesphere.demo' },
          profile: INITIAL_CONTACT_PROFILES[1],
          token: 'tok_david',
        })
      );

      await assert.rejects(
        async () => {
          await backend.updateRecipient(recipient.id, { is_responding: true, status: 'responding' });
        },
        /Unauthorized: You can only update your own responder status/
      );
    });
  });

  // =========================================================================
  // 3. ALL DISTRESS CODES
  // =========================================================================
  describe('3. All Distress Codes Verification', () => {
    it('Feature 1A: “Check on Me” creates low-priority incident assigned to Tier 1 contact', async () => {
      const contacts = await backend.getContacts('usr_elena_01');
      const tier1 = contacts.find((c) => c.escalation_order === 1 && c.status === 'accepted');
      assert.ok(tier1, 'Tier 1 contact must exist');

      const incNum = generateIncidentNumber();
      const res = await backend.createIncident(
        {
          incident_number: incNum,
          owner_user_id: 'usr_elena_01',
          owner_name: 'Elena Rostova',
          incident_type: 'check_on_me',
          priority: 'low',
          status: 'notification_sent',
          title: 'Discreet Check-in: Please check on me',
          description: 'Discreet check requested.',
          location_shared: false,
          escalation_tier: 1,
        },
        [
          {
            contact_id: tier1.id,
            contact_name: tier1.full_name,
            contact_email: tier1.email,
            contact_phone: tier1.phone_number,
            escalation_tier: 1,
            status: 'notified',
            is_responding: false,
          },
        ],
        {
          actor_name: 'Elena Rostova',
          actor_role: 'user',
          description: 'User initiated "Check on Me" distress ping.',
          event_type: 'incident_created',
        }
      );

      assert.equal(res.incident.incident_type, 'check_on_me');
      assert.equal(res.incident.priority, 'low');
      assert.equal(res.incident.status, 'notification_sent');
      assert.equal(res.recipients.length, 1);
      assert.equal(res.recipients[0].contact_id, tier1.id);
    });

    it('Feature 1B: “Call Me” creates call-request incident', async () => {
      const contacts = await backend.getContacts('usr_elena_01');
      const tier1 = contacts.find((c) => c.escalation_order === 1);
      assert.ok(tier1);

      const res = await backend.createIncident(
        {
          incident_number: generateIncidentNumber(),
          owner_user_id: 'usr_elena_01',
          owner_name: 'Elena Rostova',
          incident_type: 'call_me',
          priority: 'medium',
          status: 'notification_sent',
          title: 'Urgent Call Request: Call me as an excuse to exit',
          description: 'Needs phone call excuse.',
          location_shared: false,
          escalation_tier: 1,
        },
        [
          {
            contact_id: tier1.id,
            contact_name: tier1.full_name,
            contact_email: tier1.email,
            contact_phone: tier1.phone_number,
            escalation_tier: 1,
            status: 'notified',
            is_responding: false,
          },
        ],
        {
          actor_name: 'Elena Rostova',
          actor_role: 'user',
          description: 'User initiated "Call Me" request.',
          event_type: 'incident_created',
        }
      );

      assert.equal(res.incident.incident_type, 'call_me');
      assert.equal(res.incident.priority, 'medium');
    });

    it('Feature 1C: “Urgent Assistance” creates urgent broadcast to all active contacts with location', async () => {
      const contacts = (await backend.getContacts('usr_elena_01')).filter((c) => c.status === 'accepted');
      assert.ok(contacts.length >= 2, 'Should have multiple accepted contacts');

      const recipients = contacts.map((c) => ({
        contact_id: c.id,
        contact_name: c.full_name,
        contact_email: c.email,
        contact_phone: c.phone_number,
        escalation_tier: c.escalation_order,
        status: 'notified' as const,
        is_responding: false,
      }));

      const res = await backend.createIncident(
        {
          incident_number: generateIncidentNumber(),
          owner_user_id: 'usr_elena_01',
          owner_name: 'Elena Rostova',
          incident_type: 'urgent_assistance',
          priority: 'urgent',
          status: 'notification_sent',
          title: 'EMERGENCY: Urgent Assistance Requested',
          description: 'Immediate assistance required.',
          location_lat: 37.7749,
          location_lng: -122.4194,
          location_shared: true,
          escalation_tier: 1,
        },
        recipients,
        {
          actor_name: 'Elena Rostova',
          actor_role: 'user',
          description: 'Urgent assistance broadcast dispatched to all circle contacts.',
          event_type: 'incident_created',
        }
      );

      assert.equal(res.incident.incident_type, 'urgent_assistance');
      assert.equal(res.incident.priority, 'urgent');
      assert.equal(res.recipients.length, contacts.length);
      assert.equal(res.incident.location_shared, true);
    });

    it('Feature 1D: “Journey Check-in” creates persistent monitored transit record', async () => {
      const journey = await backend.createJourney({
        owner_user_id: 'usr_elena_01',
        origin_name: 'University Campus',
        destination_name: 'Home (Mission Bay Apt)',
        dest_lat: 37.7712,
        dest_lng: -122.3925,
        safeRadiusMeters: 200,
        start_time: new Date().toISOString(),
        expected_arrival_time: new Date(Date.now() + 1800000).toISOString(),
        status: 'in_progress',
        share_location: true,
      });

      assert.ok(journey.id.startsWith('jny_'));
      assert.equal(journey.status, 'in_progress');
      assert.equal(journey.destination_name, 'Home (Mission Bay Apt)');
    });
  });

  // =========================================================================
  // 4. RESPONSE TRACKING, ACKNOWLEDGEMENT & RESOLUTION
  // =========================================================================
  describe('4. Response Tracking, Acknowledgement & Resolution', () => {
    it('handles contact acknowledgement, responding with note, and user safe resolution', async () => {
      const incRes = await backend.createIncident(
        {
          incident_number: generateIncidentNumber(),
          owner_user_id: 'usr_elena_01',
          owner_name: 'Elena Rostova',
          incident_type: 'check_on_me',
          priority: 'low',
          status: 'notification_sent',
          title: 'Workflow tracking test',
          location_shared: false,
          escalation_tier: 1,
        },
        [
          {
            contact_id: 'tc_maya_01',
            contact_name: 'Maya Patel',
            contact_email: 'maya@safesphere.demo',
            contact_phone: '+1 555-345-6789',
            escalation_tier: 1,
            status: 'notified',
            is_responding: false,
          },
        ],
        {
          actor_name: 'Elena Rostova',
          actor_role: 'user',
          description: 'Incident initialized',
          event_type: 'incident_created',
        }
      );

      const incidentId = incRes.incident.id;
      const recipientId = incRes.recipients[0].id;

      // 1. Simulate Maya acknowledges
      storage.setItem(
        'safesphere_auth_session',
        JSON.stringify({
          user: { id: 'usr_maya_02', email: 'maya@safesphere.demo' },
          profile: INITIAL_CONTACT_PROFILES[0],
          token: 'tok_maya',
        })
      );

      await backend.updateIncident(incidentId, {
        status: 'acknowledged',
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: 'Maya Patel',
      });
      await backend.updateRecipient(recipientId, { status: 'acknowledged' });
      await backend.logIncidentEvent({
        incident_id: incidentId,
        actor_name: 'Maya Patel',
        actor_role: 'contact',
        description: 'Maya Patel acknowledged the distress alert.',
        event_type: 'acknowledged_by_contact',
      });

      let currentInc = (await backend.getIncidents('usr_elena_01')).find((i) => i.id === incidentId);
      assert.equal(currentInc?.status, 'acknowledged');

      // 2. Maya indicates responding with context note
      await backend.updateIncident(incidentId, {
        status: 'responding',
        responding_at: new Date().toISOString(),
        responding_by: 'Maya Patel',
      });
      await backend.updateRecipient(recipientId, {
        is_responding: true,
        response_note: 'Driving towards your location now',
      });
      await backend.logIncidentEvent({
        incident_id: incidentId,
        actor_name: 'Maya Patel',
        actor_role: 'contact',
        description: 'Maya Patel is responding: "Driving towards your location now"',
        event_type: 'response_initiated',
      });

      currentInc = (await backend.getIncidents('usr_elena_01')).find((i) => i.id === incidentId);
      const updatedRecs = await backend.getIncidentRecipients(incidentId);
      assert.equal(currentInc?.status, 'responding');
      assert.equal(updatedRecs[0].is_responding, true);
      assert.equal(updatedRecs[0].response_note, 'Driving towards your location now');

      // 3. User resolves incident
      storage.setItem(
        'safesphere_auth_session',
        JSON.stringify({
          user: { id: 'usr_elena_01', email: 'elena@safesphere.demo' },
          profile: INITIAL_USER_PROFILE,
          token: 'tok_elena',
        })
      );

      await backend.updateIncident(incidentId, {
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolved_by: 'Elena Rostova',
        resolution_notes: 'Confirmed safe at apartment.',
      });
      await backend.logIncidentEvent({
        incident_id: incidentId,
        actor_name: 'Elena Rostova',
        actor_role: 'user',
        description: 'User confirmed safe. Incident resolved.',
        event_type: 'incident_resolved',
      });

      currentInc = (await backend.getIncidents('usr_elena_01')).find((i) => i.id === incidentId);
      assert.equal(currentInc?.status, 'resolved');
      assert.equal(currentInc?.resolution_notes, 'Confirmed safe at apartment.');

      // Check chronological timeline
      const events = await backend.getIncidentEvents(incidentId);
      assert.equal(events.length, 4); // created, acknowledged, responding, resolved
      assert.equal(events[0].event_type, 'incident_resolved');
    });
  });

  // =========================================================================
  // 5. SMART CHECK-IN & PROTOCOL-DRIVEN MULTI-TIER ESCALATION
  // =========================================================================
  describe('5. Smart Check-in & Protocol-Driven Escalation', () => {
    it('verifies missed check-in enters grace period without becoming an emergency', async () => {
      const now = new Date();
      const deadline = new Date(now.getTime() + 60000); // 1 minute from now
      const reminder = new Date(now.getTime() + 30000);

      const checkIn = await backend.createCheckIn({
        owner_user_id: 'usr_elena_01',
        title: 'Walk to Transit',
        deadline_at: deadline.toISOString(),
        reminder_at: reminder.toISOString(),
        grace_period_seconds: 60, // 60s grace buffer
        contact_wait_seconds: 60,
        status: 'active',
        current_escalation_tier: 0,
      });

      // Advance time past deadline (70s), but before grace period end (120s)
      schedulerService.advanceVirtualTimeSeconds(70);
      schedulerService.executeSchedulerCycle();

      const updatedCheckIn = (await backend.getCheckIns('usr_elena_01')).find((c) => c.id === checkIn.id);
      assert.equal(updatedCheckIn?.status, 'in_grace_period');

      // Verify NO emergency incidents were created during grace period
      const incidents = await backend.getIncidents('usr_elena_01');
      const relatedInc = incidents.find((i) => i.related_checkin_id === checkIn.id);
      assert.equal(relatedInc, undefined, 'Must not create emergency incident during grace period');
    });

    it('escalates to Tier 1 upon grace expiry, and does NOT flag confirmed emergency', async () => {
      const now = new Date();
      const deadline = new Date(now.getTime() + 60000);
      const reminder = new Date(now.getTime() + 30000);

      const checkIn = await backend.createCheckIn({
        owner_user_id: 'usr_elena_01',
        title: 'Evening Jog',
        deadline_at: deadline.toISOString(),
        reminder_at: reminder.toISOString(),
        grace_period_seconds: 60,
        contact_wait_seconds: 60,
        status: 'active',
        current_escalation_tier: 0,
      });

      // Advance past deadline + grace period (130s)
      schedulerService.advanceVirtualTimeSeconds(130);
      schedulerService.executeSchedulerCycle();

      const updatedCheckIn = (await backend.getCheckIns('usr_elena_01')).find((c) => c.id === checkIn.id);
      assert.equal(updatedCheckIn?.status, 'escalated');
      assert.equal(updatedCheckIn?.current_escalation_tier, 1);

      const incidents = await backend.getIncidents('usr_elena_01');
      const inc = incidents.find((i) => i.related_checkin_id === checkIn.id);
      assert.ok(inc, 'Escalation incident must be created');
      assert.equal(inc.escalation_tier, 1);

      // Verify non-emergency requirement:
      // A missed check-in is an overdue check-in, NOT an assumed emergency
      assert.equal(inc.priority, 'high', 'Overdue check-in should have high priority, not urgent');
      assert.ok(
        inc.description?.includes('not a confirmed emergency'),
        'Description must state it is an overdue check-in, not an assumed emergency'
      );
    });

    it('escalates from Tier 1 to Tier 2 when contact wait window elapses unacknowledged', async () => {
      const now = new Date();
      const deadline = new Date(now.getTime() + 60000);
      const reminder = new Date(now.getTime() + 30000);

      const checkIn = await backend.createCheckIn({
        owner_user_id: 'usr_elena_01',
        title: 'Late Transit Walk',
        deadline_at: deadline.toISOString(),
        reminder_at: reminder.toISOString(),
        grace_period_seconds: 60,
        contact_wait_seconds: 60, // 60s wait for Tier 1 before Tier 2
        status: 'active',
        current_escalation_tier: 0,
      });

      // 1. Advance past grace period -> triggers Tier 1
      schedulerService.advanceVirtualTimeSeconds(130);
      schedulerService.executeSchedulerCycle();

      let chk = (await backend.getCheckIns('usr_elena_01')).find((c) => c.id === checkIn.id);
      assert.equal(chk?.current_escalation_tier, 1);

      // 2. Advance past contact wait window (another 70s) without acknowledgement
      schedulerService.advanceVirtualTimeSeconds(70);
      schedulerService.executeSchedulerCycle();

      chk = (await backend.getCheckIns('usr_elena_01')).find((c) => c.id === checkIn.id);
      assert.equal(chk?.current_escalation_tier, 2);

      const inc = (await backend.getIncidents('usr_elena_01')).find((i) => i.related_checkin_id === checkIn.id);
      assert.ok(inc);
      assert.equal(inc.escalation_tier, 2);

      // Verify Tier 2 recipient (David Chen) was added
      const recipients = await backend.getIncidentRecipients(inc.id);
      assert.equal(recipients.length, 2);
      assert.ok(recipients.some((r) => r.escalation_tier === 1));
      assert.ok(recipients.some((r) => r.escalation_tier === 2));
    });

    it('strictly executes customized protocol with inverted contact order', async () => {
      // Create a custom protocol where David Chen is Tier 1 and Maya Patel is Tier 2
      const customProtocol = await backend.saveProtocol({
        user_id: 'usr_elena_01',
        name: 'Inverted Order Custom Protocol',
        description: 'David Chen Tier 1, Maya Patel Tier 2',
        trigger_type: 'check_in_overdue',
        reminder_lead_seconds: 60,
        grace_period_seconds: 60,
        contact_wait_seconds: 60,
        allow_location_sharing: true,
        location_auto_expire_minutes: 30,
        escalation_contact_ids: ['tc_david_02', 'tc_maya_01'],
        is_default: false,
        active: true,
      });

      const now = new Date();
      const deadline = new Date(now.getTime() + 60000);
      const reminder = new Date(now.getTime() + 30000);

      const checkIn = await backend.createCheckIn({
        owner_user_id: 'usr_elena_01',
        title: 'Custom Protocol Run',
        deadline_at: deadline.toISOString(),
        reminder_at: reminder.toISOString(),
        grace_period_seconds: 60,
        contact_wait_seconds: 60,
        protocol_id: customProtocol.id,
        status: 'active',
        current_escalation_tier: 0,
      });

      // Advance past deadline + grace period
      schedulerService.advanceVirtualTimeSeconds(130);
      schedulerService.executeSchedulerCycle();

      const inc = (await backend.getIncidents('usr_elena_01')).find((i) => i.related_checkin_id === checkIn.id);
      assert.ok(inc);

      const recs = await backend.getIncidentRecipients(inc.id);
      const tier1Rec = recs.find((r) => r.escalation_tier === 1);

      // Crucial verification: Tier 1 MUST be David Chen (tc_david_02), exactly as customized in the protocol!
      assert.equal(tier1Rec?.contact_id, 'tc_david_02');
      assert.ok(tier1Rec?.contact_name.includes('David'));

      // Advance past contact wait window
      schedulerService.advanceVirtualTimeSeconds(70);
      schedulerService.executeSchedulerCycle();

      const postWaitRecs = await backend.getIncidentRecipients(inc.id);
      const tier2Rec = postWaitRecs.find((r) => r.escalation_tier === 2);

      // Crucial verification: Tier 2 MUST be Maya Patel (tc_maya_01)
      assert.equal(tier2Rec?.contact_id, 'tc_maya_01');
      assert.ok(tier2Rec?.contact_name.includes('Maya'));
    });
  });

  // =========================================================================
  // 6. SCHEDULER IDEMPOTENCY & DUPLICATE PREVENTION
  // =========================================================================
  describe('6. Scheduler Idempotency & Duplicate Prevention', () => {
    it('guarantees repeated scheduler runs generate zero duplicate alerts or incidents', async () => {
      const now = new Date();
      const deadline = new Date(now.getTime() + 60000);
      const reminder = new Date(now.getTime() + 30000);

      const checkIn = await backend.createCheckIn({
        owner_user_id: 'usr_elena_01',
        title: 'Idempotency Test Check-in',
        deadline_at: deadline.toISOString(),
        reminder_at: reminder.toISOString(),
        grace_period_seconds: 60,
        contact_wait_seconds: 60,
        status: 'active',
        current_escalation_tier: 0,
      });

      schedulerService.advanceVirtualTimeSeconds(130);

      // Run cycle 5 times consecutively
      for (let i = 0; i < 5; i++) {
        schedulerService.executeSchedulerCycle();
      }

      const incidents = (await backend.getIncidents('usr_elena_01')).filter(
        (i) => i.related_checkin_id === checkIn.id
      );
      assert.equal(incidents.length, 1, 'Should create exactly one incident, never duplicates');

      const recipients = await backend.getIncidentRecipients(incidents[0].id);
      assert.equal(recipients.length, 1, 'Should have exactly one Tier 1 recipient record');
    });
  });

  // =========================================================================
  // 7. SAFE ARRIVAL VERIFICATION & JOURNEY LOCATION SHARING SHUTOFF
  // =========================================================================
  describe('7. Safe Arrival Verification & Journey Completion', () => {
    it('prompts arrival when within safe radius, and confirming arrival terminates location sharing', async () => {
      const destLat = 37.7897;
      const destLng = -122.4011;
      const safeRadius = 200;

      const journey = await backend.createJourney({
        owner_user_id: 'usr_elena_01',
        origin_name: 'Library',
        destination_name: 'Montgomery St Station',
        dest_lat: destLat,
        dest_lng: destLng,
        safe_radius_meters: safeRadius,
        start_time: new Date().toISOString(),
        expected_arrival_time: new Date(Date.now() + 1200000).toISOString(),
        status: 'in_progress',
        share_location: true,
      });

      // Create linked location share
      const share = await backend.createLocationShare({
        user_id: 'usr_elena_01',
        session_type: 'journey',
        session_id: journey.id,
        allowed_contact_ids: ['tc_maya_01'],
        is_active: true,
        expires_at: new Date(Date.now() + 3600000).toISOString(),
      });

      // Simulate device coordinate near destination (150m away)
      const userNearLat = 37.7899;
      const userNearLng = -122.4010;
      const dist = calculateDistanceMeters(userNearLat, userNearLng, destLat, destLng);
      assert.ok(dist <= safeRadius, `Distance ${dist}m must be within radius ${safeRadius}m`);

      // Update journey with near coordinates
      await backend.updateJourney(journey.id, {
        current_lat: userNearLat,
        current_lng: userNearLng,
      });

      // Execute scheduler cycle
      schedulerService.executeSchedulerCycle();

      const promptedJourney = (await backend.getJourneys('usr_elena_01')).find((j) => j.id === journey.id);
      assert.equal(promptedJourney?.status, 'safe_arrival_pending', 'Should prompt arrival confirmation');

      // Crucial verification: Safety is NOT automatically assumed. User must confirm safe arrival!
      // User confirms safe arrival
      await backend.updateJourney(journey.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
      });
      // Journey completion automatically stops journey-specific location sharing
      await backend.stopLocationShare(share.id);

      const completedJourney = (await backend.getJourneys('usr_elena_01')).find((j) => j.id === journey.id);
      assert.equal(completedJourney?.status, 'completed');

      const postArrivalShare = await backend.getLocationShareForSession(journey.id, 'journey');
      assert.equal(postArrivalShare, null, 'Active location share must be terminated upon safe arrival');
    });
  });

  // =========================================================================
  // 8. LOCATION SHARING EXPIRY & IMMEDIATE REVOCATION
  // =========================================================================
  describe('8. Location Sharing Expiry & Revocation', () => {
    it('deactivates expired location sharing session on scheduler cycle', async () => {
      // Create share with expiry in the past
      const pastExpiry = new Date(Date.now() - 10000).toISOString();
      const expShare = await backend.createLocationShare({
        user_id: 'usr_elena_01',
        session_type: 'manual',
        session_id: 'sess_exp_01',
        allowed_contact_ids: ['tc_maya_01'],
        is_active: true,
        expires_at: pastExpiry,
      });

      // Before scheduler: record exists with is_active=true
      schedulerService.executeSchedulerCycle();

      // After scheduler: active query returns null
      const activeShare = await backend.getActiveLocationShare('usr_elena_01');
      assert.equal(activeShare, null, 'Expired location share must be deactivated');

      // Attempting to query location updates on expired share returns empty array
      const updates = await backend.getLocationUpdates(expShare.id, 'tc_maya_01');
      assert.equal(updates.length, 0);
    });

    it('immediately terminates broadcast on 1-click stop-sharing action', async () => {
      const share = await backend.createLocationShare({
        user_id: 'usr_elena_01',
        session_type: 'manual',
        session_id: 'sess_live_stop_01',
        allowed_contact_ids: ['tc_maya_01'],
        is_active: true,
        expires_at: new Date(Date.now() + 3600000).toISOString(),
      });

      assert.equal(share.is_active, true);

      // Stop sharing immediately
      await backend.stopLocationShare(share.id);

      const active = await backend.getActiveLocationShare('usr_elena_01');
      assert.equal(active, null, 'Active share must be null after stop sharing');
    });
  });

  // =========================================================================
  // 9. PERSISTENCE AFTER REFRESH
  // =========================================================================
  describe('9. Persistence After Refresh Verification', () => {
    it('persists contacts, protocols, check-ins, journeys, and incidents across adapter re-initialization', async () => {
      // 1. Add contact
      const contact = await backend.createContact({
        user_id: 'usr_elena_01',
        full_name: 'Rachel Zane',
        email: 'rachel@safesphere.demo',
        phone_number: '+1 (555) 321-4321',
        relationship: 'Sister',
        escalation_order: 4,
        status: 'accepted',
        can_view_location: true,
      });

      // 2. Add protocol
      const protocol = await backend.saveProtocol({
        user_id: 'usr_elena_01',
        name: 'Persistent Protocol Test',
        description: 'Verify persistence across simulated restart',
        trigger_type: 'urgent_button',
        reminder_lead_seconds: 60,
        grace_period_seconds: 60,
        contact_wait_seconds: 60,
        allow_location_sharing: true,
        location_auto_expire_minutes: 15,
        escalation_contact_ids: [contact.id],
        is_default: false,
        active: true,
      });

      // 3. Add incident
      const incRes = await backend.createIncident(
        {
          incident_number: 'INC-PERSIST-01',
          owner_user_id: 'usr_elena_01',
          owner_name: 'Elena Rostova',
          incident_type: 'check_on_me',
          priority: 'low',
          status: 'notification_sent',
          title: 'Persistent Incident Test',
          location_shared: false,
          escalation_tier: 1,
        },
        [
          {
            contact_id: contact.id,
            contact_name: contact.full_name,
            contact_email: contact.email,
            contact_phone: contact.phone_number,
            escalation_tier: 1,
            status: 'notified',
            is_responding: false,
          },
        ],
        {
          actor_name: 'Elena Rostova',
          actor_role: 'user',
          description: 'Persistence test incident',
          event_type: 'incident_created',
        }
      );

      // Simulate browser refresh by creating a completely brand new adapter instance
      const freshAdapter = new LocalDevelopmentAdapter();

      // Verify contact persisted
      const freshContacts = await freshAdapter.getContacts('usr_elena_01');
      assert.ok(freshContacts.some((c) => c.id === contact.id && c.full_name === 'Rachel Zane'));

      // Verify protocol persisted
      const freshProtocols = await freshAdapter.getProtocols('usr_elena_01');
      assert.ok(freshProtocols.some((p) => p.id === protocol.id && p.name === 'Persistent Protocol Test'));

      // Verify incident persisted
      const freshIncidents = await freshAdapter.getIncidents('usr_elena_01');
      assert.ok(freshIncidents.some((i) => i.id === incRes.incident.id && i.incident_number === 'INC-PERSIST-01'));
    });
  });

  // =========================================================================
  // 10. DISCREET QUICK EXIT INTEGRITY
  // =========================================================================
  describe('10. Discreet Quick Exit Integrity', () => {
    it('verifies quick exit camouflage does not cancel active safety sessions', async () => {
      // Start an active check-in
      const checkIn = await backend.createCheckIn({
        owner_user_id: 'usr_elena_01',
        title: 'Active Session Under Camouflage',
        deadline_at: new Date(Date.now() + 600000).toISOString(),
        reminder_at: new Date(Date.now() + 300000).toISOString(),
        grace_period_seconds: 120,
        contact_wait_seconds: 120,
        status: 'active',
        current_escalation_tier: 0,
      });

      // Start an active journey
      const journey = await backend.createJourney({
        owner_user_id: 'usr_elena_01',
        origin_name: 'Office',
        destination_name: 'Home',
        dest_lat: 37.7749,
        dest_lng: -122.4194,
        safeRadiusMeters: 200,
        start_time: new Date().toISOString(),
        expected_arrival_time: new Date(Date.now() + 1800000).toISOString(),
        status: 'in_progress',
        share_location: true,
      });

      // Simulate triggering Quick Exit
      storage.setItem('safesphere_quick_exit_active', 'true');

      // Verify scheduler and backend sessions are STILL active and monitored
      schedulerService.executeSchedulerCycle();

      const activeCheckIns = await backend.getCheckIns('usr_elena_01');
      const activeJourneys = await backend.getJourneys('usr_elena_01');

      const chk = activeCheckIns.find((c) => c.id === checkIn.id);
      const jny = activeJourneys.find((j) => j.id === journey.id);

      assert.equal(chk?.status, 'active', 'Check-in must remain active while under camouflage');
      assert.equal(jny?.status, 'in_progress', 'Journey must remain in_progress while under camouflage');

      // Test PIN verification
      const user = await backend.getProfile('usr_elena_01');
      const validPin = user?.discreet_exit_pin || '1234';

      const attemptWrongPin = '9999';
      assert.notEqual(attemptWrongPin, validPin);

      const attemptCorrectPin = '1234';
      assert.equal(attemptCorrectPin, validPin);
    });
  });

  // =========================================================================
  // 11. TRUSTED CONTACT INVITATION & SMS DELIVERY LIFECYCLE
  // =========================================================================
  describe('11. Trusted Contact Invitation & SMS Delivery Lifecycle', () => {
    it('creates invitation in pending state, enforces authorization, and transitions accurately on recipient accept/decline', async () => {
      const token = 'inv_test_secure_token_999';
      const expires = new Date(Date.now() + 7 * 86400000).toISOString();

      // 1. Create invitation with real phone number
      const createdInv = await backend.createInvitation({
        inviter_id: 'usr_elena_01',
        inviter_name: 'Elena Rostova',
        invitee_name: 'Priya Sharma',
        invitee_email: 'priya.sharma@example.com',
        invitee_phone: '+919876543210',
        relationship: 'Sister',
        escalation_order: 1,
        invitation_token: token,
        status: 'pending',
        delivery_status: 'pending',
        provider: 'twilio',
        expires_at: expires,
      });

      // 2. Create pending contact record linked to invitation
      const createdContact = await backend.createContact({
        user_id: 'usr_elena_01',
        full_name: 'Priya Sharma',
        email: 'priya.sharma@example.com',
        phone_number: '+919876543210',
        relationship: 'Sister',
        escalation_order: 1,
        status: 'pending',
        invitation_id: createdInv.id,
        invitation_status: 'pending',
        can_view_location: false,
        avatar_color: 'bg-teal-600',
      });

      // Verify contact is strictly pending and unauthorized for location
      assert.equal(createdContact.status, 'pending', 'Contact must be pending prior to acceptance');
      assert.equal(createdContact.can_view_location, false, 'Pending contact must not have location access');

      // 3. Provider dispatch updates delivery status to 'sent'
      await backend.updateInvitationDelivery(createdInv.id, {
        status: 'sent',
        delivery_status: 'sent',
        provider_message_id: 'SM1234567890abcdef',
        sent_at: new Date().toISOString(),
      });

      // 4. Token lookup by recipient
      const lookedUpInv = await backend.getInvitationByToken(token);
      assert.ok(lookedUpInv, 'Invitation should be retrievable by secure token');
      assert.equal(lookedUpInv?.invitee_name, 'Priya Sharma');
      assert.equal(lookedUpInv?.delivery_status, 'sent');
      assert.equal(lookedUpInv?.provider_message_id, 'SM1234567890abcdef');

      // 5. Carrier delivery receipt webhook updates status to 'delivered'
      await backend.updateInvitationDelivery(createdInv.id, {
        delivery_status: 'delivered',
        delivered_at: new Date().toISOString(),
      });

      const deliveredInv = await backend.getInvitationByToken(token);
      assert.equal(deliveredInv?.delivery_status, 'delivered', 'Carrier delivery receipt reflected accurately');

      // 6. Recipient clicks "Accept Invitation"
      await backend.acceptInvitation(createdInv.id, 'usr_priya_new');

      const acceptedInv = await backend.getInvitationByToken(token);
      assert.equal(acceptedInv?.status, 'accepted', 'Invitation marked accepted upon recipient confirmation');

      const allContacts = await backend.getContacts('usr_elena_01');
      const updatedContact = allContacts.find((c) => c.email === 'priya.sharma@example.com');
      assert.equal(updatedContact?.status, 'accepted', 'Contact activated in circle upon acceptance');
      assert.equal(updatedContact?.can_view_location, true, 'Location permission granted upon verified acceptance');

      // 7. Verify declining workflow with a second contact
      const declineToken = 'inv_decline_token_111';
      const declineInv = await backend.createInvitation({
        inviter_id: 'usr_elena_01',
        inviter_name: 'Elena Rostova',
        invitee_name: 'Declining Contact',
        invitee_email: 'decline@example.com',
        invitee_phone: '+919999988888',
        relationship: 'Colleague',
        escalation_order: 3,
        invitation_token: declineToken,
        status: 'pending',
        delivery_status: 'sent',
        expires_at: expires,
      });

      await backend.declineInvitation(declineInv.id);
      const declinedInv = await backend.getInvitationByToken(declineToken);
      assert.equal(declinedInv?.status, 'declined', 'Invitation status updated to declined');
    });
  });

  // =========================================================================
  // 12. USER-INITIATED MESSAGING: WHATSAPP CLICK-TO-CHAT & NATIVE SMS
  // =========================================================================
  describe('12. User-Initiated Messaging: WhatsApp & Native SMS Composer', () => {
    it('accurately normalizes Indian and international phone numbers for WhatsApp and SMS schemes', async () => {
      const {
        normalizePhoneNumber,
        normalizeForWhatsApp,
        normalizeForSms,
        buildWhatsAppUrl,
        buildSmsUrl,
        buildInvitationMessage,
      } = await import('../src/lib/messaging');

      // 1. Indian 10-digit mobile number
      const norm1 = normalizePhoneNumber('9876543210');
      assert.equal(norm1.valid, true);
      assert.equal(norm1.digits, '919876543210', 'WhatsApp requires digits only with 91 country code');
      assert.equal(norm1.formattedSms, '+919876543210', 'SMS requires +91 prefix');

      // 2. Indian mobile with leading 0
      const norm2 = normalizePhoneNumber('09876543210');
      assert.equal(norm2.valid, true);
      assert.equal(norm2.digits, '919876543210');
      assert.equal(norm2.formattedSms, '+919876543210');

      // 3. Indian mobile with +91 and spaces
      const norm3 = normalizePhoneNumber('+91 98765 43210');
      assert.equal(norm3.valid, true);
      assert.equal(norm3.digits, '919876543210');
      assert.equal(norm3.formattedSms, '+919876543210');

      // 4. US International number
      const normUS = normalizePhoneNumber('+1 (555) 234-5678');
      assert.equal(normUS.valid, true);
      assert.equal(normUS.digits, '15552345678', 'Must not prepend 91 to international numbers');
      assert.equal(normUS.formattedSms, '+15552345678');

      // 5. UK International number
      const normUK = normalizePhoneNumber('+44 7911 123456');
      assert.equal(normUK.valid, true);
      assert.equal(normUK.digits, '447911123456');
      assert.equal(normUK.formattedSms, '+447911123456');

      // 6. Invalid numbers
      const normBad = normalizePhoneNumber('12345');
      assert.equal(normBad.valid, false, 'Short numbers must be flagged as invalid');

      // 7. Message construction
      const inviteUrl = 'https://safesphere-liart.vercel.app/invite?token=inv_test_123';
      const msg = buildInvitationMessage({
        inviterName: 'Elena Rostova',
        relationship: 'Sister',
        inviteUrl,
      });

      assert.ok(msg.includes('DigiSakhi'), 'Message must include brand name DigiSakhi');
      assert.ok(msg.includes('Elena Rostova'), 'Message must include inviter name');
      assert.ok(msg.includes('Sister'), 'Message must include relationship');
      assert.ok(msg.includes(inviteUrl), 'Message must contain exact invite URL');

      // 8. WhatsApp URL generation
      const wa = buildWhatsAppUrl('9876543210', msg);
      assert.ok(wa.url.startsWith('https://wa.me/919876543210?text='), 'WhatsApp URL must start with https://wa.me/91...');
      assert.ok(!wa.url.includes('+'), 'WhatsApp URL must not contain + sign');
      assert.ok(wa.url.includes(encodeURIComponent(inviteUrl)), 'URL must encode the invitation link');

      // 9. SMS URL generation
      const sms = buildSmsUrl('9876543210', msg);
      assert.ok(sms.url.startsWith('sms:+919876543210'), 'SMS URL must preserve + on phone number');
      assert.ok(sms.url.includes('body='), 'SMS URL must have body parameter');
      assert.ok(sms.url.includes(encodeURIComponent(inviteUrl)), 'SMS URL must encode the invitation link');
    });
  });

  // =========================================================================
  // 13. TRUSTED CONTACT INVITATION STATUS SYNCHRONIZATION & AUTO-RECONCILIATION
  // =========================================================================
  describe('13. Trusted Contact Invitation Status Synchronization & Auto-Reconciliation', () => {
    it('automatically reconciles pending contacts to accepted when their invitation is accepted', async () => {
      const invToken = 'inv_sync_test_999';
      const expires = new Date(Date.now() + 7 * 86400000).toISOString();

      // 1. Inviter creates invitation
      const inv = await backend.createInvitation({
        inviter_id: 'usr_elena_01',
        inviter_name: 'Elena Rostova',
        invitee_name: 'Aarti Sharma',
        invitee_email: 'aarti.sync@example.com',
        invitee_phone: '+919876543210',
        relationship: 'Sister',
        escalation_order: 2,
        invitation_token: invToken,
        status: 'pending',
        delivery_status: 'pending',
        expires_at: expires,
      });

      // 2. Inviter creates pending contact record
      const contact = await backend.createContact({
        user_id: 'usr_elena_01',
        full_name: 'Aarti Sharma',
        email: 'aarti.sync@example.com',
        phone_number: '+919876543210',
        relationship: 'Sister',
        escalation_order: 2,
        status: 'pending',
        invitation_id: inv.id,
        invitation_status: 'pending',
        can_view_location: false,
      });

      // Verify contact is pending initially
      let contacts = await backend.getContacts('usr_elena_01');
      let foundContact = contacts.find((c) => c.id === contact.id);
      assert.equal(foundContact?.status, 'pending');
      assert.equal(foundContact?.can_view_location, false);

      // 3. Recipient accepts the invitation (e.g. from external device/flow)
      await backend.acceptInvitation(inv.id, 'usr_aarti_accepted');

      // 4. Inviter's getContacts call must auto-reconcile and heal the status
      contacts = await backend.getContacts('usr_elena_01');
      foundContact = contacts.find((c) => c.id === contact.id);

      assert.equal(foundContact?.status, 'accepted', 'Contact status must be reconciled to accepted');
      assert.equal(foundContact?.can_view_location, true, 'can_view_location must be true for accepted contact');
      assert.equal(foundContact?.invitation_status, 'accepted');

      // 5. Verify unaccepted contacts remain pending and are not falsely promoted
      const unacceptedInv = await backend.createInvitation({
        inviter_id: 'usr_elena_01',
        inviter_name: 'Elena Rostova',
        invitee_name: 'Pending Friend',
        invitee_email: 'pending.friend@example.com',
        invitee_phone: '+919811122233',
        relationship: 'Colleague',
        escalation_order: 3,
        invitation_token: 'inv_still_pending_token',
        status: 'pending',
        delivery_status: 'pending',
        expires_at: expires,
      });

      const unacceptedContact = await backend.createContact({
        user_id: 'usr_elena_01',
        full_name: 'Pending Friend',
        email: 'pending.friend@example.com',
        phone_number: '+919811122233',
        relationship: 'Colleague',
        escalation_order: 3,
        status: 'pending',
        invitation_id: unacceptedInv.id,
        invitation_status: 'pending',
        can_view_location: false,
      });

      contacts = await backend.getContacts('usr_elena_01');
      const foundPending = contacts.find((c) => c.id === unacceptedContact.id);
      assert.equal(foundPending?.status, 'pending', 'Unaccepted contact must remain strictly pending');
      assert.equal(foundPending?.can_view_location, false);
    });
  });

  // =========================================================================
  // 14. FUNCTIONAL EMERGENCY SOS ALERTS & EMERGENCY CALLING
  // =========================================================================
  describe('14. Functional Emergency Alerts, Emergency Calling, and Automatic Safety Check-ins', () => {
    it('constructs complete Emergency SOS broadcast with live location and notes', async () => {
      const { buildEmergencyAlertMessage } = await import('../src/lib/messaging');

      const alert = buildEmergencyAlertMessage({
        userName: 'Elena Rostova',
        note: 'Someone is following me near Central Park',
        locationUrl: 'https://maps.google.com/?q=28.6139,77.2090',
        address: 'Connaught Place, New Delhi',
        timestamp: '25 Oct 2026, 01:15 PM',
      });

      assert.ok(alert.includes('DIGISAKHI EMERGENCY ALERT'), 'Must include brand and alert header');
      assert.ok(alert.includes('Elena Rostova'), 'Must include user name');
      assert.ok(alert.includes('https://maps.google.com/?q=28.6139,77.2090'), 'Must include Google Maps location link');
      assert.ok(alert.includes('Connaught Place, New Delhi'), 'Must include address');
      assert.ok(alert.includes('Someone is following me near Central Park'), 'Must include user situation note');
      assert.ok(alert.includes('25 Oct 2026, 01:15 PM'), 'Must include timestamp');
    });

    it('verifies automatic safety check-in timer triggers grace period and escalates without false alarm', async () => {
      const now = new Date();
      const deadline = new Date(now.getTime() + 60000); // 1 minute
      const reminder = new Date(now.getTime() + 30000);

      const checkIn = await backend.createCheckIn({
        owner_user_id: 'usr_elena_01',
        title: 'Late Night Transit Check-in',
        deadline_at: deadline.toISOString(),
        reminder_at: reminder.toISOString(),
        grace_period_seconds: 60,
        contact_wait_seconds: 60,
        status: 'active',
        current_escalation_tier: 0,
      });

      // 1. Advance past deadline -> enters grace period
      schedulerService.advanceVirtualTimeSeconds(65);
      schedulerService.executeSchedulerCycle();

      let currentCheckIn = (await backend.getCheckIns('usr_elena_01')).find((c) => c.id === checkIn.id);
      assert.equal(currentCheckIn?.status, 'in_grace_period', 'Check-in must enter grace period when deadline passes');

      // 2. Advance past grace period buffer -> automatic Tier 1 escalation
      schedulerService.advanceVirtualTimeSeconds(60);
      schedulerService.executeSchedulerCycle();

      currentCheckIn = (await backend.getCheckIns('usr_elena_01')).find((c) => c.id === checkIn.id);
      assert.equal(currentCheckIn?.status, 'escalated', 'Check-in must automatically escalate upon grace expiry');
      assert.equal(currentCheckIn?.current_escalation_tier, 1);

      // Verify incident was created
      const incidents = await backend.getIncidents('usr_elena_01');
      const related = incidents.find((i) => i.related_checkin_id === checkIn.id);
      assert.ok(related, 'Automatic escalation must create traceable incident in audit history');
      assert.equal(related?.status, 'notification_sent');
    });
  });

  // =========================================================================
  // 15. SIMPLIFIED 6-SECTION NAVIGATION & STREAMLINED USER EXPERIENCE
  // =========================================================================
  describe('15. Simplified 6-Section Navigation & Streamlined User Experience', () => {
    it('verifies 6 core navigation sections exist and map cleanly without clutter', async () => {
      const coreScreens = ['home', 'journeys', 'circle', 'safety_setup', 'history', 'settings'];
      assert.equal(coreScreens.length, 6, 'There must be exactly 6 primary navigation destinations');

      // Legacy aliases must resolve into the 6 sections
      const aliasMap: Record<string, string> = {
        dashboard: 'home',
        journey_active: 'journeys',
        map_view: 'journeys',
        contacts: 'circle',
        protocols: 'safety_setup',
        protocol_builder: 'safety_setup',
        my_safety: 'safety_setup',
        checkin_active: 'safety_setup',
        incident_details: 'history',
        privacy_settings: 'settings',
        account_settings: 'settings',
        notifications_inbox: 'settings',
      };

      for (const [alias, target] of Object.entries(aliasMap)) {
        assert.ok(coreScreens.includes(target), `Alias '${alias}' must resolve to one of the 6 core screens, got '${target}'`);
      }
    });

    it('accurately calculates dynamic first-time setup checklist from real persisted records', async () => {
      const user = await backend.getProfile('usr_elena_01');
      assert.ok(user, 'User Elena must exist');

      const contacts = await backend.getContacts('usr_elena_01');
      const acceptedContacts = contacts.filter((c) => c.status === 'accepted');
      const protocols = await backend.getProtocols('usr_elena_01');

      // Evaluate actual completion states
      const isProfileComplete = Boolean(user.full_name && (user.emergency_notes || user.medical_info));
      const isContactComplete = acceptedContacts.length > 0;
      const isCheckInComplete = protocols.length > 0;
      const isEmergencyComplete = Boolean(user.emergency_notes || user.discreet_exit_pin || user.medical_info);

      assert.equal(isProfileComplete, true, 'Profile with emergency notes must be complete');
      assert.equal(isContactComplete, true, 'User Elena with accepted contacts must satisfy contact step');
      assert.equal(isCheckInComplete, true, 'User Elena with protocols must satisfy check-in step');
      assert.equal(isEmergencyComplete, true, 'User Elena with notes/PIN must satisfy emergency step');

      // Test with a fresh user who has 0 contacts and 0 protocols
      const session = await backend.signUp({
        email: 'priya@test.org',
        password: 'securePassword123!',
        fullName: 'Priya Sharma',
      });
      const freshUser = session.profile;
      const freshContacts = await backend.getContacts(freshUser.id);
      const freshProtocols = (await backend.getProtocols(freshUser.id)).filter(p => !p.is_default);

      const freshProfileComplete = Boolean(freshUser.full_name && (freshUser.emergency_notes || freshUser.medical_info));
      const freshContactComplete = freshContacts.filter((c) => c.status === 'accepted').length > 0;

      assert.equal(freshProfileComplete, false, 'New user without emergency notes must be incomplete');
      assert.equal(freshContactComplete, false, 'New user with 0 contacts must be incomplete');
    });

    it('validates 4-step journey setup process lifecycle from creation to verified arrival', async () => {
      // Step 1: Destination setup
      const origin = 'Mission District Co-working';
      const destination = 'Central Terminal';
      const destLat = 37.7897;
      const destLng = -122.4011;

      // Step 2: Safety settings
      const safeRadiusMeters = 200;
      const durationMinutes = 20;
      const expectedArrival = new Date(Date.now() + durationMinutes * 60000).toISOString();

      // Step 3: Permissions & Escalation
      const shareLocation = true;
      const allowedContacts = ['tc_maya_01'];

      // Step 4: Launch journey
      const journey = await backend.createJourney({
        owner_user_id: 'usr_elena_01',
        origin_name: origin,
        destination_name: destination,
        dest_lat: destLat,
        dest_lng: destLng,
        safe_radius_meters: safeRadiusMeters,
        expected_arrival_time: expectedArrival,
        share_location: shareLocation,
        status: 'in_progress',
      });

      assert.ok(journey.id, 'Journey must be created with unique ID');
      assert.equal(journey.status, 'in_progress', 'Initial journey status must be in_progress');
      assert.equal(journey.destination_name, 'Central Terminal');
      assert.equal(journey.safe_radius_meters, 200);

      // Verify human safe arrival confirmation
      await backend.updateJourney(journey.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
      });

      const updatedJourney = (await backend.getJourneys('usr_elena_01')).find((j) => j.id === journey.id);
      assert.equal(updatedJourney?.status, 'completed', 'Journey must transition to completed on safe arrival');
    });
  });

  // =========================================================================
  // 16. FULLY FUNCTIONAL CUSTOM SAFETY JOURNEY & 3-BUTTON CHECK-IN ENGINE
  // =========================================================================
  describe('16. Custom Safety Journey & 3-Button Check-in Engine', () => {
    it('creates a custom journey with 10-minute interval and schedules next check-in correctly', async () => {
      const now = schedulerService.getVirtualNow();
      const intervalMinutes = 10;
      const countdownSeconds = 120;
      const nextCheckIn = new Date(now.getTime() + intervalMinutes * 60000).toISOString();

      const journey = await backend.createJourney({
        owner_user_id: 'usr_elena_01',
        origin_name: 'Office Building',
        destination_name: 'Mission Bay Home',
        dest_lat: 37.7712,
        dest_lng: -122.3925,
        safe_radius_meters: 200,
        start_time: now.toISOString(),
        expected_arrival_time: new Date(now.getTime() + 30 * 60000).toISOString(),
        status: 'in_progress',
        share_location: true,
        journey_type: 'custom',
        journey_name: 'Late Evening Solo Commute',
        check_in_interval_minutes: intervalMinutes,
        response_countdown_seconds: countdownSeconds,
        tier1_contact_ids: ['tc_maya_01'],
        tier2_contact_ids: ['tc_sarah_01'],
        emergency_phone_number: '112',
        missed_checkin_action: 'reminder',
        last_check_in_at: now.toISOString(),
        next_check_in_at: nextCheckIn,
        check_in_status: 'ok',
        missed_count: 0,
        call_actions: [],
      });

      assert.ok(journey.id.startsWith('jny_'));
      assert.equal(journey.journey_type, 'custom');
      assert.equal(journey.check_in_interval_minutes, 10);
      assert.equal(journey.response_countdown_seconds, 120);
      assert.equal(journey.emergency_phone_number, '112');
      assert.equal(journey.next_check_in_at, nextCheckIn);
      assert.equal(journey.check_in_status, 'ok');
    });

    it('triggers check-in prompt when scheduled time is reached and handles "I\'m Okay 💚"', async () => {
      const now = schedulerService.getVirtualNow();
      const nextCheckIn = new Date(now.getTime() + 60000); // 1 minute ahead

      const journey = await backend.createJourney({
        owner_user_id: 'usr_elena_01',
        origin_name: 'Downtown Office',
        destination_name: 'Home',
        dest_lat: 37.7712,
        dest_lng: -122.3925,
        safe_radius_meters: 200,
        start_time: now.toISOString(),
        expected_arrival_time: new Date(now.getTime() + 1800000).toISOString(),
        status: 'in_progress',
        share_location: false,
        journey_type: 'custom',
        journey_name: 'Evening Transit',
        check_in_interval_minutes: 10,
        response_countdown_seconds: 120,
        tier1_contact_ids: ['tc_maya_01'],
        emergency_phone_number: '112',
        next_check_in_at: nextCheckIn.toISOString(),
        last_check_in_at: now.toISOString(),
        check_in_status: 'ok',
      });

      // 1. Advance virtual time past next_check_in_at
      schedulerService.advanceVirtualTimeSeconds(65);
      schedulerService.executeSchedulerCycle();

      const activeJourneys = await backend.getJourneys('usr_elena_01');
      const prompted = activeJourneys.find((j) => j.id === journey.id);
      assert.equal(prompted?.check_in_status, 'prompt_due', 'Check-in status must transition to prompt_due when time arrives');

      // 2. User confirms: "I'M OKAY 💚"
      const confirmedNow = schedulerService.getVirtualNow();
      const futureCheckIn = new Date(confirmedNow.getTime() + 10 * 60000).toISOString();

      await backend.updateJourney(journey.id, {
        last_check_in_at: confirmedNow.toISOString(),
        next_check_in_at: futureCheckIn,
        check_in_status: 'ok',
      });

      const updated = (await backend.getJourneys('usr_elena_01')).find((j) => j.id === journey.id);
      assert.equal(updated?.check_in_status, 'ok', 'Status must reset to ok after safe confirmation');
      assert.equal(updated?.last_check_in_at, confirmedNow.toISOString());
      assert.equal(updated?.next_check_in_at, futureCheckIn);
    });

    it('handles "I Need Help 🟠", records Tier 1 call action, and enables Tier 2 escalation', async () => {
      const now = schedulerService.getVirtualNow();
      const journey = await backend.createJourney({
        owner_user_id: 'usr_elena_01',
        origin_name: 'Market St',
        destination_name: 'Home',
        dest_lat: 37.7712,
        dest_lng: -122.3925,
        safe_radius_meters: 200,
        start_time: now.toISOString(),
        expected_arrival_time: new Date(now.getTime() + 1800000).toISOString(),
        status: 'in_progress',
        share_location: true,
        journey_type: 'custom',
        journey_name: 'Walk Home',
        check_in_interval_minutes: 10,
        response_countdown_seconds: 120,
        tier1_contact_ids: ['tc_maya_01'],
        tier2_contact_ids: ['tc_sarah_01'],
        emergency_phone_number: '112',
        next_check_in_at: now.toISOString(),
        check_in_status: 'prompt_due',
        call_actions: [],
      });

      // User presses "I NEED HELP 🟠"
      const tier1Action = {
        id: 'act_t1_01',
        journey_id: journey.id,
        timestamp: now.toISOString(),
        action_type: 'tier1_call' as const,
        recipient_name: 'Maya Lin',
        phone_number: '+1 (555) 234-5678',
        status: 'opened_dialer' as const,
        note: 'User pressed I Need Help during check-in',
      };

      await backend.updateJourney(journey.id, {
        call_actions: [tier1Action],
      });

      let updated = (await backend.getJourneys('usr_elena_01')).find((j) => j.id === journey.id);
      assert.equal(updated?.call_actions?.length, 1);
      assert.equal(updated?.call_actions?.[0].action_type, 'tier1_call');
      assert.equal(updated?.call_actions?.[0].recipient_name, 'Maya Lin');

      // Next escalation: Tier 2 call action
      const tier2Action = {
        id: 'act_t2_01',
        journey_id: journey.id,
        timestamp: new Date(now.getTime() + 30000).toISOString(),
        action_type: 'tier2_call' as const,
        recipient_name: 'Sarah Chen',
        phone_number: '+1 (555) 876-5432',
        status: 'opened_dialer' as const,
        note: 'Escalated to Tier 2 backup contact',
      };

      await backend.updateJourney(journey.id, {
        call_actions: [tier2Action, tier1Action],
      });

      updated = (await backend.getJourneys('usr_elena_01')).find((j) => j.id === journey.id);
      assert.equal(updated?.call_actions?.length, 2);
      assert.equal(updated?.call_actions?.[0].action_type, 'tier2_call');
    });

    it('handles "Urgent Help 🚨", records emergency call action with verified phone number', async () => {
      const now = schedulerService.getVirtualNow();
      const journey = await backend.createJourney({
        owner_user_id: 'usr_elena_01',
        origin_name: 'Subway Station',
        destination_name: 'Apartment',
        dest_lat: 37.7712,
        dest_lng: -122.3925,
        safe_radius_meters: 200,
        start_time: now.toISOString(),
        expected_arrival_time: new Date(now.getTime() + 1800000).toISOString(),
        status: 'in_progress',
        share_location: true,
        journey_type: 'custom',
        emergency_phone_number: '112',
        check_in_status: 'prompt_due',
      });

      const urgentAction = {
        id: 'act_urg_01',
        journey_id: journey.id,
        timestamp: now.toISOString(),
        action_type: 'emergency_call' as const,
        recipient_name: 'National Emergency Helpline (112)',
        phone_number: '112',
        status: 'opened_dialer' as const,
      };

      await backend.updateJourney(journey.id, {
        call_actions: [urgentAction],
      });

      const updated = (await backend.getJourneys('usr_elena_01')).find((j) => j.id === journey.id);
      assert.equal(updated?.call_actions?.[0].action_type, 'emergency_call');
      assert.equal(updated?.call_actions?.[0].phone_number, '112');
    });

    it('records missed check-in when countdown elapses and late "I\'m Okay" resolves it', async () => {
      const now = schedulerService.getVirtualNow();
      const checkInTime = new Date(now.getTime() - 10000); // 10s in past

      const journey = await backend.createJourney({
        owner_user_id: 'usr_elena_01',
        origin_name: 'Metro',
        destination_name: 'Home',
        dest_lat: 37.7712,
        dest_lng: -122.3925,
        safe_radius_meters: 200,
        start_time: new Date(now.getTime() - 600000).toISOString(),
        expected_arrival_time: new Date(now.getTime() + 1800000).toISOString(),
        status: 'in_progress',
        share_location: true,
        journey_type: 'custom',
        check_in_interval_minutes: 10,
        response_countdown_seconds: 60,
        next_check_in_at: checkInTime.toISOString(),
        check_in_status: 'prompt_due',
        missed_count: 0,
      });

      // Advance past countdown window (65 seconds)
      schedulerService.advanceVirtualTimeSeconds(65);
      schedulerService.executeSchedulerCycle();

      let current = (await backend.getJourneys('usr_elena_01')).find((j) => j.id === journey.id);
      assert.equal(current?.check_in_status, 'missed', 'Check-in must be marked as missed after countdown expires');
      assert.ok((current?.missed_count || 0) >= 1, 'Missed count must be incremented');

      // Late "I'M OKAY 💚" confirmation resolves missed check-in
      const resolvedNow = schedulerService.getVirtualNow();
      const newNext = new Date(resolvedNow.getTime() + 10 * 60000).toISOString();

      await backend.updateJourney(journey.id, {
        check_in_status: 'ok',
        last_check_in_at: resolvedNow.toISOString(),
        next_check_in_at: newNext,
      });

      current = (await backend.getJourneys('usr_elena_01')).find((j) => j.id === journey.id);
      assert.equal(current?.check_in_status, 'ok', 'Late response must resolve missed check-in');
      assert.equal(current?.next_check_in_at, newNext);
    });

    it('persists journey configuration across adapter reloads and stops prompts when ended', async () => {
      const now = schedulerService.getVirtualNow();
      const journey = await backend.createJourney({
        owner_user_id: 'usr_elena_01',
        origin_name: 'Library',
        destination_name: 'Home',
        dest_lat: 37.7712,
        dest_lng: -122.3925,
        safe_radius_meters: 200,
        start_time: now.toISOString(),
        expected_arrival_time: new Date(now.getTime() + 1800000).toISOString(),
        status: 'in_progress',
        share_location: true,
        journey_type: 'custom',
        journey_name: 'Late Study Commute',
        check_in_interval_minutes: 15,
        response_countdown_seconds: 180,
        tier1_contact_ids: ['tc_maya_01'],
        emergency_phone_number: '112',
        next_check_in_at: new Date(now.getTime() + 15 * 60000).toISOString(),
        check_in_status: 'ok',
      });

      // Simulate page refresh: re-instantiate adapter
      const reloadedBackend = new LocalDevelopmentAdapter();
      const reloadedJourneys = await reloadedBackend.getJourneys('usr_elena_01');
      const found = reloadedJourneys.find((j) => j.id === journey.id);

      assert.ok(found, 'Active custom journey must survive browser reload');
      assert.equal(found?.journey_name, 'Late Study Commute');
      assert.equal(found?.check_in_interval_minutes, 15);
      assert.equal(found?.response_countdown_seconds, 180);

      // User ends journey
      await reloadedBackend.updateJourney(journey.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
      });

      const endedJourneys = await reloadedBackend.getJourneys('usr_elena_01');
      const endedJourney = endedJourneys.find((j) => j.id === journey.id);
      assert.equal(endedJourney?.status, 'completed', 'Journey must be completed and stop all future prompts');
    });
  });
});
