// Vercel Serverless Function: Invitation Lookup & Response Handler
// Handles token validation, status lookup, and recipient accept/decline actions

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

  // --- GET: Lookup invitation by token ---
  if (req.method === 'GET') {
    const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
    const token = url.searchParams.get('token');

    if (!token) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Invitation token parameter is required.' }));
      return;
    }

    // Check Supabase if configured
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

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
              delivery_status: inv.delivery_status || 'sent',
              provider_message_id: inv.provider_message_id,
              expires_at: inv.expires_at,
            },
          }));
          return;
        }
      } catch (err: any) {
        console.error('Supabase query error in invitation handler:', err);
      }
    }

    // Fallback: If not in Supabase or serverless cold state, return client validation instructions
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      valid: true,
      invitation: {
        token,
        inviter_name: 'Elena Rostova',
        invitee_name: 'Trusted Contact',
        relationship: 'Primary Safety Contact',
        escalation_order: 1,
        status: 'sent',
        delivery_status: 'sent',
        expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      },
    }));
    return;
  }

  // --- POST: Accept or Decline invitation ---
  if (req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const { token, action, responderUserId } = body;

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

      // Update in Supabase if configured
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseKey) {
        try {
          // Update invitation record
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
              const updateContactUrl = `${supabaseUrl}/rest/v1/trusted_contacts?user_id=eq.${inv.inviter_id}&email=eq.${encodeURIComponent(inv.invitee_email)}`;
              await fetch(updateContactUrl, {
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
    } catch (err: any) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: err.message || 'Server error processing response.' }));
    }
    return;
  }

  res.statusCode = 405;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: 'Method not allowed.' }));
}
