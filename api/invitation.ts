// Vercel Serverless Function: Invitation Lookup, State Synchronization & Response Handler
// Handles token validation, status lookup, batch synchronization, and recipient accept/decline actions.
// Integrates with Supabase PostgreSQL when configured and provides robust server-side persistence.

import fs from 'fs';

interface CachedInvitation {
  id?: string;
  token: string;
  inviter_id: string;
  inviter_name: string;
  invitee_name: string;
  invitee_email: string;
  invitee_phone?: string;
  relationship: string;
  escalation_order: number;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  delivery_status: string;
  created_at: string;
  expires_at: string;
  responded_at?: string;
  responder_user_id?: string;
}

const CACHE_FILE = '/tmp/safesphere_invitations_cache.json';

// In-memory fallback
const inMemoryCache = new Map<string, CachedInvitation>();

function getStore(): Record<string, CachedInvitation> {
  const result: Record<string, CachedInvitation> = {};
  // 1. Load memory cache
  inMemoryCache.forEach((v, k) => { result[k] = v; });

  // 2. Load file cache if available
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
      if (data && typeof data === 'object') {
        Object.assign(result, data);
      }
    }
  } catch {}

  return result;
}

function saveStore(store: Record<string, CachedInvitation>): void {
  // Update in-memory
  Object.entries(store).forEach(([k, v]) => inMemoryCache.set(k, v));

  // Update file
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(store), 'utf-8');
  } catch {}
}

function getCachedInvitation(token: string): CachedInvitation | null {
  const store = getStore();
  return store[token] || null;
}

function setCachedInvitation(token: string, inv: CachedInvitation): void {
  const store = getStore();
  store[token] = inv;
  saveStore(store);
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
    req.on('data', (chunk: any) => { data += chunk; });
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

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  // =========================================================================
  // GET: Single Token Lookup OR Batch Synchronization (?tokens=inv_1,inv_2)
  // =========================================================================
  if (req.method === 'GET') {
    const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);

    // BATCH SYNCHRONIZATION: Inviter's dashboard polls for status of multiple tokens
    const tokensParam = url.searchParams.get('tokens');
    if (tokensParam) {
      const tokenList = tokensParam.split(',').map((t) => t.trim()).filter(Boolean);
      const statuses: Record<string, { status: string; delivery_status?: string; responded_at?: string; responder_user_id?: string }> = {};

      // 1. Check Supabase if configured
      if (supabaseUrl && supabaseKey) {
        try {
          const inList = tokenList.map((t) => `"${encodeURIComponent(t)}"`).join(',');
          const queryUrl = `${supabaseUrl}/rest/v1/contact_invitations?invitation_token=in.(${inList})&select=*`;
          const sbRes = await fetch(queryUrl, {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
            },
          });
          const records: any = await sbRes.json();
          if (Array.isArray(records)) {
            for (const r of records) {
              statuses[r.invitation_token] = {
                status: r.status,
                delivery_status: r.delivery_status || r.status,
                responded_at: r.responded_at,
                responder_user_id: r.responder_user_id,
              };
            }
          }
        } catch (sbErr) {
          console.error('Supabase batch query error:', sbErr);
        }
      }

      // 2. Check server-side cache for any tokens not resolved from Supabase
      const store = getStore();
      for (const t of tokenList) {
        if (!statuses[t] && store[t]) {
          const c = store[t];
          statuses[t] = {
            status: c.status,
            delivery_status: c.delivery_status || c.status,
            responded_at: c.responded_at,
            responder_user_id: c.responder_user_id,
          };
        }
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ valid: true, statuses }));
      return;
    }

    // SINGLE TOKEN LOOKUP
    const token = url.searchParams.get('token');
    if (!token) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Invitation token parameter is required.' }));
      return;
    }

    // 1. Check Supabase
    if (supabaseUrl && supabaseKey) {
      try {
        const queryUrl = `${supabaseUrl}/rest/v1/contact_invitations?invitation_token=eq.${encodeURIComponent(token)}&select=*`;
        const sbRes = await fetch(queryUrl, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
        });
        const records: any = await sbRes.json();

        if (Array.isArray(records) && records.length > 0) {
          const inv = records[0];
          const isExpired = new Date() > new Date(inv.expires_at);

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            valid: true,
            isExpired,
            invitation: {
              id: inv.id,
              token: inv.invitation_token,
              inviter_name: inv.inviter_name || 'DigiSakhi User',
              invitee_name: inv.invitee_name,
              invitee_phone: inv.invitee_phone,
              invitee_email: inv.invitee_email,
              relationship: inv.relationship,
              escalation_order: inv.escalation_order,
              status: isExpired && inv.status === 'pending' ? 'expired' : inv.status,
              delivery_status: inv.delivery_status || inv.status,
              responded_at: inv.responded_at,
              expires_at: inv.expires_at,
            },
          }));
          return;
        }
      } catch (err: any) {
        console.error('Supabase query error in invitation handler:', err);
      }
    }

    // 2. Check Server-Side Cache
    const cached = getCachedInvitation(token);
    if (cached) {
      const isExpired = new Date() > new Date(cached.expires_at);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        valid: true,
        isExpired,
        invitation: {
          id: cached.id,
          token: cached.token,
          inviter_name: cached.inviter_name,
          invitee_name: cached.invitee_name,
          invitee_phone: cached.invitee_phone,
          invitee_email: cached.invitee_email,
          relationship: cached.relationship,
          escalation_order: cached.escalation_order,
          status: isExpired && cached.status === 'pending' ? 'expired' : cached.status,
          delivery_status: cached.delivery_status || cached.status,
          responded_at: cached.responded_at,
          expires_at: cached.expires_at,
        },
      }));
      return;
    }

    // 3. Fallback: URL Parameters (client fallback)
    const inviterParam = url.searchParams.get('inviter');
    const nameParam = url.searchParams.get('name');
    const relParam = url.searchParams.get('rel');
    const phoneParam = url.searchParams.get('phone');

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      valid: true,
      invitation: {
        token,
        inviter_name: inviterParam || 'Elena Rostova',
        invitee_name: nameParam || 'Trusted Contact',
        invitee_phone: phoneParam || '',
        relationship: relParam || 'Primary Safety Contact',
        escalation_order: 1,
        status: 'pending',
        delivery_status: 'pending',
        expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      },
    }));
    return;
  }

  // =========================================================================
  // POST: Create, Accept, Decline Invitation
  // =========================================================================
  if (req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const { action, token, invitation, responderUserId } = body;

      // ACTION: CREATE (Register a newly created invitation in server storage)
      if (action === 'create' && invitation) {
        const invToken = invitation.token || token;
        const record: CachedInvitation = {
          id: invitation.id,
          token: invToken,
          inviter_id: invitation.inviter_id || 'usr_elena_01',
          inviter_name: invitation.inviter_name || 'Elena Rostova',
          invitee_name: invitation.invitee_name || 'Trusted Contact',
          invitee_email: invitation.invitee_email || '',
          invitee_phone: invitation.invitee_phone || '',
          relationship: invitation.relationship || 'Friend',
          escalation_order: invitation.escalation_order || 1,
          status: 'pending',
          delivery_status: 'pending',
          created_at: new Date().toISOString(),
          expires_at: invitation.expires_at || new Date(Date.now() + 7 * 86400000).toISOString(),
        };

        setCachedInvitation(invToken, record);

        // Also insert to Supabase if configured
        if (supabaseUrl && supabaseKey) {
          try {
            await fetch(`${supabaseUrl}/rest/v1/contact_invitations`, {
              method: 'POST',
              headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal',
              },
              body: JSON.stringify({
                inviter_id: record.inviter_id,
                invitee_email: record.invitee_email,
                invitee_name: record.invitee_name,
                invitee_phone: record.invitee_phone,
                relationship: record.relationship,
                escalation_order: record.escalation_order,
                invitation_token: record.token,
                status: 'pending',
                delivery_status: 'pending',
                expires_at: record.expires_at,
              }),
            });
          } catch (sbErr) {
            console.error('Supabase create error:', sbErr);
          }
        }

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true, token: invToken, status: 'pending' }));
        return;
      }

      // ACTION: ACCEPT OR DECLINE
      if (!token || !action) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Token and action ("accept" or "decline") are required.' }));
        return;
      }

      if (action !== 'accept' && action !== 'decline') {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Action must be either "accept" or "decline".' }));
        return;
      }

      const finalStatus = action === 'accept' ? 'accepted' : 'declined';
      const respondedAt = new Date().toISOString();

      // 1. Update Server-Side Cache
      const cached = getCachedInvitation(token);
      if (cached) {
        cached.status = finalStatus;
        cached.delivery_status = finalStatus;
        cached.responded_at = respondedAt;
        if (responderUserId) cached.responder_user_id = responderUserId;
        setCachedInvitation(token, cached);
      } else {
        // Create an accepted cache record if token wasn't in cache yet
        setCachedInvitation(token, {
          token,
          inviter_id: 'usr_elena_01',
          inviter_name: 'DigiSakhi User',
          invitee_name: 'Trusted Contact',
          invitee_email: '',
          relationship: 'Friend',
          escalation_order: 1,
          status: finalStatus,
          delivery_status: finalStatus,
          created_at: respondedAt,
          expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
          responded_at: respondedAt,
          responder_user_id: responderUserId,
        });
      }

      // 2. Update Supabase if configured
      if (supabaseUrl && supabaseKey) {
        try {
          // Update contact_invitations record
          const updateInvUrl = `${supabaseUrl}/rest/v1/contact_invitations?invitation_token=eq.${encodeURIComponent(token)}`;
          await fetch(updateInvUrl, {
            method: 'PATCH',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              status: finalStatus,
              delivery_status: finalStatus,
              responded_at: respondedAt,
            }),
          });

          // If accepted, update trusted_contacts
          if (action === 'accept') {
            const getInvUrl = `${supabaseUrl}/rest/v1/contact_invitations?invitation_token=eq.${encodeURIComponent(token)}&select=*`;
            const getRes = await fetch(getInvUrl, {
              headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` },
            });
            const invs: any = await getRes.json();
            if (Array.isArray(invs) && invs.length > 0) {
              const inv = invs[0];
              // Update by email match (case-insensitive ilike)
              if (inv.invitee_email) {
                const updateEmailUrl = `${supabaseUrl}/rest/v1/trusted_contacts?user_id=eq.${inv.inviter_id}&email=ilike.${encodeURIComponent(inv.invitee_email)}`;
                await fetch(updateEmailUrl, {
                  method: 'PATCH',
                  headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    status: 'accepted',
                    contact_user_id: responderUserId || null,
                    can_view_location: true,
                    updated_at: respondedAt,
                  }),
                });
              }

              // Also update by phone match if phone was supplied
              if (inv.invitee_phone) {
                const updatePhoneUrl = `${supabaseUrl}/rest/v1/trusted_contacts?user_id=eq.${inv.inviter_id}&phone_number=eq.${encodeURIComponent(inv.invitee_phone)}`;
                await fetch(updatePhoneUrl, {
                  method: 'PATCH',
                  headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    status: 'accepted',
                    contact_user_id: responderUserId || null,
                    can_view_location: true,
                    updated_at: respondedAt,
                  }),
                });
              }
            }
          }
        } catch (sbErr: any) {
          console.error('Supabase update error:', sbErr);
        }
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        success: true,
        action,
        status: finalStatus,
        token,
        responded_at: respondedAt,
        message: action === 'accept'
          ? 'Invitation accepted. You are now verified in the safety circle.'
          : 'Invitation declined.',
      }));
      return;
    } catch (err: any) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: err.message || 'Server error processing response.' }));
      return;
    }
  }

  res.statusCode = 405;
  res.end();
}
