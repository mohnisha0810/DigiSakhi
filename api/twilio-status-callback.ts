// Vercel Serverless Function: Twilio SMS Status Callback Webhook
// Receives carrier delivery receipts (e.g. MessageStatus=delivered)

async function parseForm(req: any): Promise<Record<string, string>> {
  if (req.body && typeof req.body === 'object') return req.body;
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk: any) => { data += chunk; });
    req.on('end', () => {
      const params = new URLSearchParams(data);
      const result: Record<string, string> = {};
      params.forEach((val, key) => { result[key] = val; });
      resolve(result);
    });
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end('Method Not Allowed');
    return;
  }

  try {
    const formData = await parseForm(req);
    const messageSid = formData.MessageSid;
    const messageStatus = formData.MessageStatus; // 'queued', 'sent', 'delivered', 'failed', 'undelivered'

    console.log(`[Twilio Callback] MessageSid: ${messageSid}, Status: ${messageStatus}`);

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey && messageSid) {
      const updateData: Record<string, any> = {
        delivery_status: messageStatus === 'delivered' ? 'delivered' : messageStatus === 'failed' || messageStatus === 'undelivered' ? 'failed' : 'sent',
      };
      if (messageStatus === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      } else if (messageStatus === 'failed' || messageStatus === 'undelivered') {
        updateData.provider_error = formData.ErrorMessage || `Carrier status: ${messageStatus}`;
      }

      const updateUrl = `${supabaseUrl}/rest/v1/contact_invitations?provider_message_id=eq.${encodeURIComponent(messageSid)}`;
      await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/xml');
    res.end('<Response></Response>');
  } catch (err: any) {
    console.error('Error handling Twilio status callback:', err);
    res.statusCode = 200;
    res.end('<Response></Response>');
  }
}
