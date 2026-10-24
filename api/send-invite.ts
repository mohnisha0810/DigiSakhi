// Vercel Serverless Function: Send Trusted Contact SMS Invitation
// Dispatches real SMS invitations via Twilio REST API

function normalizePhone(raw: string): { valid: boolean; phone: string; error?: string } {
  if (!raw || typeof raw !== 'string') {
    return { valid: false, phone: '', error: 'Recipient phone number is required.' };
  }
  let cleaned = raw.trim().replace(/[\s\-\(\)]/g, '');
  if (cleaned.startsWith('00')) cleaned = '+' + cleaned.substring(2);
  
  // If user entered a 10-digit Indian mobile number without country prefix (+91)
  if (/^[6-9]\d{9}$/.test(cleaned)) {
    cleaned = '+91' + cleaned;
  }

  // Check E.164 format: + followed by 7 to 15 digits
  const e164Regex = /^\+[1-9]\d{6,14}$/;
  if (!e164Regex.test(cleaned)) {
    return {
      valid: false,
      phone: cleaned,
      error: `Invalid phone number format "${raw}". Please use standard international E.164 format with country code (e.g. +91 98765 43210 for India, or +1 555 123 4567 for US).`,
    };
  }

  return { valid: true, phone: cleaned };
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

function generateSecureToken(): string {
  // Generate a cryptographically strong 32-character hex token
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return 'inv_' + crypto.randomUUID().replace(/-/g, '');
  }
  return 'inv_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
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

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed. Use POST.' }));
    return;
  }

  try {
    const body = await parseBody(req);
    const {
      inviterName,
      inviteeName,
      inviteePhone,
      relationship,
      origin,
      token: providedToken,
    } = body;

    if (!inviterName || !inviteeName) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Both inviterName and inviteeName are required.' }));
      return;
    }

    // Phone normalization & validation
    const phoneCheck = normalizePhone(inviteePhone);
    if (!phoneCheck.valid) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        success: false,
        error: phoneCheck.error,
        delivery_status: 'failed',
      }));
      return;
    }

    const cleanPhone = phoneCheck.phone;
    const token = providedToken || generateSecureToken();
    const baseUrl = origin || process.env.PUBLIC_URL || 'https://safesphere-liart.vercel.app';
    const inviteUrl = `${baseUrl.replace(/\/$/, '')}/invite?token=${token}`;

    // Read Twilio Credentials from Server Environment
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_PHONE_NUMBER;
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

    // Check if SMS provider credentials are configured
    const isTwilioConfigured = Boolean(
      accountSid &&
      authToken &&
      (fromPhone || messagingServiceSid) &&
      !accountSid.includes('placeholder')
    );

    if (!isTwilioConfigured) {
      // TRUTHFUL REPORTING: Provider unconfigured
      // We NEVER claim fake SMS delivery.
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        success: false,
        error: 'SMS Gateway Unconfigured: Real SMS delivery requires Twilio credentials. Please configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in Vercel project environment variables.',
        delivery_status: 'failed',
        provider: 'unconfigured',
        invitation_token: token,
        invite_url: inviteUrl,
        recipient_phone: cleanPhone,
        recipient_name: inviteeName,
        missing_credentials: [
          !accountSid && 'TWILIO_ACCOUNT_SID',
          !authToken && 'TWILIO_AUTH_TOKEN',
          (!fromPhone && !messagingServiceSid) && 'TWILIO_PHONE_NUMBER',
        ].filter(Boolean),
      }));
      return;
    }

    // Provider is configured: Make real Twilio REST API call
    const twilioEndpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const messageText = `DigiSakhi: ${inviterName} has invited you as their trusted emergency safety contact (${relationship || 'Friend'}). Open this link to review & accept: ${inviteUrl}`;

    const formData = new URLSearchParams();
    if (messagingServiceSid) {
      formData.append('MessagingServiceSid', messagingServiceSid);
    } else if (fromPhone) {
      formData.append('From', fromPhone);
    }
    formData.append('To', cleanPhone);
    formData.append('Body', messageText);

    const twilioResponse = await fetch(twilioEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const twilioData: any = await twilioResponse.json();

    if (!twilioResponse.ok) {
      // Twilio error handling
      let detailedMsg = twilioData.message || 'SMS delivery failed at carrier gateway.';
      if (twilioData.code === 21608) {
        detailedMsg = `Twilio Trial Account Notice (Error 21608): The phone number ${cleanPhone} is unverified. On Twilio free trial accounts, you must verify the recipient phone number in your Twilio Console (under Phone Numbers -> Verified Caller IDs) before sending, or upgrade to a full account.`;
      } else if (twilioData.code === 21408) {
        detailedMsg = `Twilio Regional Permission Notice (Error 21408): Permission to send an SMS to this country/region has not been enabled in your Twilio Console. Enable the region under Messaging -> Settings -> Geo-Permissions.`;
      } else if (twilioData.code === 21211) {
        detailedMsg = `Invalid Phone Number (Error 21211): Twilio reports that ${cleanPhone} is not a valid mobile phone number capable of receiving SMS.`;
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        success: false,
        error: detailedMsg,
        provider_code: twilioData.code,
        delivery_status: 'failed',
        provider: 'twilio',
        invitation_token: token,
        invite_url: inviteUrl,
        recipient_phone: cleanPhone,
      }));
      return;
    }

    // SUCCESS FROM PROVIDER
    // Truthful status is 'sent' (Twilio accepted request for carrier dispatch), NOT 'delivered'.
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: true,
      message: `SMS invitation dispatched to ${cleanPhone}. Message SID: ${twilioData.sid}`,
      delivery_status: 'sent',
      provider: 'twilio',
      provider_message_id: twilioData.sid,
      invitation_token: token,
      invite_url: inviteUrl,
      recipient_phone: cleanPhone,
      recipient_name: inviteeName,
      details: {
        to: twilioData.to,
        status: twilioData.status, // e.g. "queued" or "sent"
        sid: twilioData.sid,
        date_created: twilioData.date_created,
      },
    }));
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      error: `Server error while dispatching invitation: ${err.message || 'Unknown error'}`,
      delivery_status: 'failed',
    }));
  }
}
