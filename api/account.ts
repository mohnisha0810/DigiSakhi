// Vercel Serverless Function: Account Persistence, Authentication & User Data Store
// Provides reliable cross-device persistent account storage, profile recovery, and data isolation.

import fs from 'fs';
import crypto from 'crypto';

interface UserRecord {
  id: string;
  email: string;
  salt: string;
  passwordHash: string;
  profile: any;
  contacts: any[];
  invitations: any[];
  protocols: any[];
  checkIns: any[];
  journeys: any[];
  incidents: any[];
  notifications: any[];
  created_at: string;
  updated_at: string;
}

const STORE_FILE = '/tmp/safesphere_accounts_store.json';

// In-memory cache across warm lambda invocations
const inMemoryAccounts = new Map<string, UserRecord>();

function getAccountsStore(): Record<string, UserRecord> {
  const result: Record<string, UserRecord> = {};
  inMemoryAccounts.forEach((v, k) => {
    result[k] = v;
  });

  try {
    if (fs.existsSync(STORE_FILE)) {
      const data = JSON.parse(fs.readFileSync(STORE_FILE, 'utf-8'));
      if (data && typeof data === 'object') {
        Object.assign(result, data);
      }
    }
  } catch (err) {
    console.error('Error reading account store:', err);
  }

  return result;
}

function saveAccountsStore(store: Record<string, UserRecord>): void {
  Object.entries(store).forEach(([k, v]) => {
    inMemoryAccounts.set(k, v);
  });

  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving account store:', err);
  }
}

function hashPassword(password: string, salt: string): string {
  return crypto
    .createHash('sha256')
    .update(`${salt}:${password}:digisakhi_secret_salt_2026`)
    .digest('hex');
}

async function parseBody(req: any): Promise<any> {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk: any) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve({});
      }
    });
  });
}

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  const store = getAccountsStore();

  // =========================================================================
  // GET REQUESTS
  // =========================================================================
  if (req.method === 'GET') {
    const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
    const action = url.searchParams.get('action');
    const email = url.searchParams.get('email')?.toLowerCase();
    const userId = url.searchParams.get('userId');

    // Check email availability
    if (action === 'check_email' && email) {
      const exists = Object.values(store).some((u) => u.email === email);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ exists }));
      return;
    }

    // Get account by userId or email
    if (action === 'get_account' || action === 'get_user_data') {
      const record = Object.values(store).find(
        (u) => (userId && u.id === userId) || (email && u.email === email)
      );

      if (!record) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'User record not found.' }));
        return;
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          success: true,
          profile: record.profile,
          contacts: record.contacts || [],
          invitations: record.invitations || [],
          protocols: record.protocols || [],
          checkIns: record.checkIns || [],
          journeys: record.journeys || [],
          incidents: record.incidents || [],
          notifications: record.notifications || [],
        })
      );
      return;
    }

    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Invalid GET action.' }));
    return;
  }

  // =========================================================================
  // POST REQUESTS
  // =========================================================================
  if (req.method === 'POST') {
    const body = await parseBody(req);
    const action = body.action;

    // 1. SIGN UP (Register new account)
    if (action === 'signup') {
      const email = body.email?.trim().toLowerCase();
      const password = body.password;
      const fullName = body.fullName?.trim();

      if (!email || !password || !fullName) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Email, password, and full name are required.' }));
        return;
      }

      if (Object.values(store).some((u) => u.email === email)) {
        res.statusCode = 409;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'An account with this email already exists.' }));
        return;
      }

      const salt = crypto.randomBytes(16).toString('hex');
      const passwordHash = hashPassword(password, salt);
      const newUserId = 'usr_' + crypto.randomBytes(6).toString('hex');

      const initialProfile = {
        id: newUserId,
        email,
        full_name: fullName,
        phone_number: body.phoneNumber || '',
        emergency_notes: body.emergencyNotes || '',
        medical_info: body.medicalInfo || '',
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

      const defaultProtocol = {
        id: 'proto_' + crypto.randomBytes(6).toString('hex'),
        user_id: newUserId,
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

      const newRecord: UserRecord = {
        id: newUserId,
        email,
        salt,
        passwordHash,
        profile: initialProfile,
        contacts: [],
        invitations: [],
        protocols: [defaultProtocol],
        checkIns: [],
        journeys: [],
        incidents: [],
        notifications: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      store[newUserId] = newRecord;
      saveAccountsStore(store);

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          success: true,
          session: {
            user: { id: newUserId, email },
            profile: initialProfile,
            token: 'auth_token_' + newUserId,
          },
          data: {
            contacts: [],
            invitations: [],
            protocols: [defaultProtocol],
            checkIns: [],
            journeys: [],
          },
        })
      );
      return;
    }

    // 2. SIGN IN (Authenticate existing account)
    if (action === 'signin') {
      const email = body.email?.trim().toLowerCase();
      const password = body.password;

      if (!email) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Email is required.' }));
        return;
      }

      const record = Object.values(store).find((u) => u.email === email);
      if (!record) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: `No account found with email "${email}". Please sign up first.` }));
        return;
      }

      if (password && record.salt && record.passwordHash) {
        const candidateHash = hashPassword(password, record.salt);
        if (candidateHash !== record.passwordHash) {
          res.statusCode = 401;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Incorrect password. Please verify your password and try again.' }));
          return;
        }
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          success: true,
          session: {
            user: { id: record.id, email: record.email },
            profile: record.profile,
            token: 'auth_token_' + record.id,
          },
          data: {
            contacts: record.contacts || [],
            invitations: record.invitations || [],
            protocols: record.protocols || [],
            checkIns: record.checkIns || [],
            journeys: record.journeys || [],
            incidents: record.incidents || [],
            notifications: record.notifications || [],
          },
        })
      );
      return;
    }

    // 3. UPDATE PROFILE & ONBOARDING
    if (action === 'update_profile') {
      const userId = body.userId;
      const updates = body.updates;

      if (!userId || !updates) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'userId and updates are required.' }));
        return;
      }

      const record = store[userId];
      if (!record) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'User record not found.' }));
        return;
      }

      record.profile = {
        ...record.profile,
        ...updates,
        updated_at: new Date().toISOString(),
      };
      record.updated_at = new Date().toISOString();

      saveAccountsStore(store);

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, profile: record.profile }));
      return;
    }

    // 4. BATCH SYNC USER DATA
    if (action === 'sync_user_data') {
      const userId = body.userId;
      const data = body.data;

      if (!userId || !data) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'userId and data are required.' }));
        return;
      }

      const record = store[userId];
      if (record) {
        if (data.profile) {
          record.profile = { ...record.profile, ...data.profile, updated_at: new Date().toISOString() };
        }
        if (Array.isArray(data.contacts)) record.contacts = data.contacts;
        if (Array.isArray(data.invitations)) record.invitations = data.invitations;
        if (Array.isArray(data.protocols)) record.protocols = data.protocols;
        if (Array.isArray(data.checkIns)) record.checkIns = data.checkIns;
        if (Array.isArray(data.journeys)) record.journeys = data.journeys;
        if (Array.isArray(data.incidents)) record.incidents = data.incidents;
        if (Array.isArray(data.notifications)) record.notifications = data.notifications;
        record.updated_at = new Date().toISOString();

        saveAccountsStore(store);
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true }));
      return;
    }

    // 5. CREATE CONTACT
    if (action === 'create_contact' || action === 'update_contact') {
      const userId = body.userId;
      const contact = body.contact;

      if (!userId || !contact) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'userId and contact are required.' }));
        return;
      }

      const record = store[userId];
      if (record) {
        record.contacts = record.contacts || [];
        const existingIdx = record.contacts.findIndex((c) => c.id === contact.id);
        if (existingIdx >= 0) {
          record.contacts[existingIdx] = { ...record.contacts[existingIdx], ...contact };
        } else {
          record.contacts.push(contact);
        }
        saveAccountsStore(store);
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, contact }));
      return;
    }

    // 5B. DELETE CONTACT
    if (action === 'delete_contact') {
      const userId = body.userId;
      const contactId = body.contactId;

      if (!userId || !contactId) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'userId and contactId are required.' }));
        return;
      }

      const record = store[userId];
      if (record && record.contacts) {
        record.contacts = record.contacts.filter((c) => c.id !== contactId);
        saveAccountsStore(store);
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true }));
      return;
    }

    // 6. CREATE INVITATION
    if (action === 'create_invitation' || action === 'update_invitation') {
      const userId = body.userId;
      const invitation = body.invitation;

      if (!userId || !invitation) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'userId and invitation are required.' }));
        return;
      }

      const record = store[userId];
      if (record) {
        record.invitations = record.invitations || [];
        const existingIdx = record.invitations.findIndex((i) => i.id === invitation.id);
        if (existingIdx >= 0) {
          record.invitations[existingIdx] = { ...record.invitations[existingIdx], ...invitation };
        } else {
          record.invitations.push(invitation);
        }
        saveAccountsStore(store);
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, invitation }));
      return;
    }

    // 7. SAVE SAFETY PROTOCOL
    if (action === 'save_protocol') {
      const userId = body.userId;
      const protocol = body.protocol;

      if (!userId || !protocol) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'userId and protocol are required.' }));
        return;
      }

      const record = store[userId];
      if (record) {
        record.protocols = record.protocols || [];
        const existingIdx = record.protocols.findIndex((p) => p.id === protocol.id);
        if (existingIdx >= 0) {
          record.protocols[existingIdx] = { ...record.protocols[existingIdx], ...protocol };
        } else {
          record.protocols.push(protocol);
        }
        saveAccountsStore(store);
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, protocol }));
      return;
    }

    // 8. SAVE JOURNEY
    if (action === 'save_journey') {
      const userId = body.userId;
      const journey = body.journey;

      if (!userId || !journey) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'userId and journey are required.' }));
        return;
      }

      const record = store[userId];
      if (record) {
        record.journeys = record.journeys || [];
        const existingIdx = record.journeys.findIndex((j) => j.id === journey.id);
        if (existingIdx >= 0) {
          record.journeys[existingIdx] = { ...record.journeys[existingIdx], ...journey };
        } else {
          record.journeys.push(journey);
        }
        saveAccountsStore(store);
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, journey }));
      return;
    }

    // 9. SAVE CHECK-IN
    if (action === 'save_checkin') {
      const userId = body.userId;
      const checkIn = body.checkIn;

      if (!userId || !checkIn) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'userId and checkIn are required.' }));
        return;
      }

      const record = store[userId];
      if (record) {
        record.checkIns = record.checkIns || [];
        const existingIdx = record.checkIns.findIndex((c) => c.id === checkIn.id);
        if (existingIdx >= 0) {
          record.checkIns[existingIdx] = { ...record.checkIns[existingIdx], ...checkIn };
        } else {
          record.checkIns.push(checkIn);
        }
        saveAccountsStore(store);
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, checkIn }));
      return;
    }

    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Invalid POST action.' }));
    return;
  }

  res.statusCode = 405;
  res.end('Method Not Allowed');
}
