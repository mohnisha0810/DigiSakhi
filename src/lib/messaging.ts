// User-Initiated Messaging Utilities for DigiSakhi (Native SMS & WhatsApp)
// Requires zero external SMS gateways, paid APIs, or third-party telecom credentials.

export interface NormalizedPhoneResult {
  valid: boolean;
  digits: string;
  formattedSms: string;
  error?: string;
}

/**
 * Normalizes phone numbers with strict handling for Indian (10-digit mobile) and international numbers.
 * WhatsApp requires digits only without leading '+' or '0'.
 * SMS requires E.164 format with leading '+'.
 */
export function normalizePhoneNumber(raw: string): NormalizedPhoneResult {
  if (!raw || typeof raw !== 'string') {
    return {
      valid: false,
      digits: '',
      formattedSms: '',
      error: 'Please enter a recipient mobile number.',
    };
  }

  const cleaned = raw.trim().replace(/[\s\-\(\)\.]/g, '');
  let digits = cleaned.replace(/\D/g, '');

  if (!digits) {
    return {
      valid: false,
      digits: '',
      formattedSms: '',
      error: 'Phone number does not contain any digits.',
    };
  }

  // Case 1: 10-digit Indian mobile number starting with 6, 7, 8, or 9
  if (/^[6-9]\d{9}$/.test(digits)) {
    return {
      valid: true,
      digits: '91' + digits,
      formattedSms: '+91' + digits,
    };
  }

  // Case 2: 11-digit Indian number starting with 0 followed by 6-9
  if (/^0[6-9]\d{9}$/.test(digits)) {
    const withoutZero = digits.substring(1);
    return {
      valid: true,
      digits: '91' + withoutZero,
      formattedSms: '+91' + withoutZero,
    };
  }

  // Case 3: 12-digit Indian number already starting with 91
  if (/^91[6-9]\d{9}$/.test(digits)) {
    return {
      valid: true,
      digits,
      formattedSms: '+' + digits,
    };
  }

  // Case 4: International numbers with standard country code (10 to 15 digits)
  if (digits.length >= 10 && digits.length <= 15) {
    return {
      valid: true,
      digits,
      formattedSms: '+' + digits,
    };
  }

  return {
    valid: false,
    digits,
    formattedSms: cleaned.startsWith('+') ? cleaned : '+' + digits,
    error: `Invalid phone number format (${raw}). Please enter at least 10 digits (e.g. 9876543210 for India, or +15551234567 for US).`,
  };
}

/**
 * Normalizes phone number specifically for WhatsApp (digits only).
 */
export function normalizeForWhatsApp(raw: string): { valid: boolean; digits: string; error?: string } {
  const res = normalizePhoneNumber(raw);
  return { valid: res.valid, digits: res.digits, error: res.error };
}

/**
 * Normalizes phone number specifically for SMS URI (e.g. +919876543210).
 */
export function normalizeForSms(raw: string): { valid: boolean; phone: string; error?: string } {
  const res = normalizePhoneNumber(raw);
  return { valid: res.valid, phone: res.formattedSms, error: res.error };
}

/**
 * Constructs the official DigiSakhi invitation text.
 */
export function buildInvitationMessage(params: {
  inviterName: string;
  relationship: string;
  inviteUrl: string;
}): string {
  const rel = params.relationship || 'Friend';
  const inviter = params.inviterName || 'DigiSakhi User';
  return `DigiSakhi Safety Circle: ${inviter} has invited you as their trusted emergency contact (${rel}).\n\nTap this secure link to review safety permissions & activate: ${params.inviteUrl}`;
}

/**
 * Constructs a real, high-priority DigiSakhi Emergency SOS broadcast message.
 * Formats time, GPS coordinates (Google Maps URL), user note, and urgency indicators.
 */
export function buildEmergencyAlertMessage(params: {
  userName: string;
  note?: string;
  locationUrl?: string;
  address?: string;
  timestamp?: string;
}): string {
  const time = params.timestamp || new Date().toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  let msg = `🚨 DIGISAKHI EMERGENCY ALERT 🚨\nI need urgent help! This is an emergency broadcast from ${params.userName}.\n\n`;
  msg += `🕒 Time: ${time}\n`;
  if (params.locationUrl) {
    msg += `📍 Live Location: ${params.locationUrl}\n`;
  }
  if (params.address) {
    msg += `📌 Approx Area: ${params.address}\n`;
  }
  if (params.note && params.note.trim()) {
    msg += `📝 Situation Note: ${params.note.trim()}\n`;
  }
  msg += `\nPlease call me immediately or dispatch emergency assistance.\n(Sent via DigiSakhi Women's Safety App)`;
  return msg;
}

/**
 * Builds the official WhatsApp click-to-chat URL.
 * Adheres to WhatsApp API documentation: https://wa.me/<number>?text=<urlencoded_text>
 */
export function buildWhatsAppUrl(phoneNumber: string, message: string): { url: string; error?: string } {
  const norm = normalizeForWhatsApp(phoneNumber);
  if (!norm.valid) {
    return { url: '', error: norm.error };
  }
  const encodedText = encodeURIComponent(message);
  return { url: `https://wa.me/${norm.digits}?text=${encodedText}` };
}

/**
 * Detects whether the current device is running a mobile operating system.
 */
export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent || ''
  );
}

/**
 * Detects whether the current device is iOS (iPhone/iPad).
 */
export function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent || '');
}

/**
 * Builds platform-compliant native SMS URL.
 * iOS uses &body= while RFC 5724/Android uses ?body=
 */
export function buildSmsUrl(phoneNumber: string, message: string): { url: string; error?: string; isIOS: boolean } {
  const norm = normalizeForSms(phoneNumber);
  if (!norm.valid) {
    return { url: '', error: norm.error, isIOS: isIOSDevice() };
  }

  const isIOS = isIOSDevice();
  const encodedText = encodeURIComponent(message);
  // Important: norm.phone is +919876543210. The '+' is preserved without encoding to %2B so dialers parse it.
  const url = isIOS
    ? `sms:${norm.phone}&body=${encodedText}`
    : `sms:${norm.phone}?body=${encodedText}`;

  return { url, isIOS };
}

/**
 * Opens WhatsApp directly using user-gesture-safe navigation.
 */
export function triggerWhatsAppShare(phoneNumber: string, message: string): {
  success: boolean;
  url: string;
  error?: string;
} {
  const wa = buildWhatsAppUrl(phoneNumber, message);
  if (!wa.url) {
    return { success: false, url: '', error: wa.error };
  }

  if (typeof window !== 'undefined') {
    try {
      const opened = window.open(wa.url, '_blank', 'noopener,noreferrer');
      if (!opened || opened.closed || typeof opened.closed === 'undefined') {
        // Fallback if popup blocked
        window.location.href = wa.url;
      }
    } catch {
      window.location.href = wa.url;
    }
  }

  return { success: true, url: wa.url };
}

/**
 * Opens the native SMS app on mobile or triggers copy on desktop.
 */
export function triggerSmsShare(phoneNumber: string, message: string): {
  success: boolean;
  url: string;
  isMobile: boolean;
  error?: string;
} {
  const sms = buildSmsUrl(phoneNumber, message);
  if (!sms.url) {
    return { success: false, url: '', isMobile: isMobileDevice(), error: sms.error };
  }

  const mobile = isMobileDevice();

  if (typeof window !== 'undefined') {
    if (mobile) {
      window.location.href = sms.url;
    } else {
      // Desktop: Attempt to open SMS handler (e.g. iMessage/Skype) and also copy to clipboard
      try {
        window.location.href = sms.url;
      } catch {}
      if (navigator.clipboard) {
        navigator.clipboard.writeText(message);
      }
    }
  }

  return { success: true, url: sms.url, isMobile: mobile };
}
