import React, { useState, useEffect } from 'react';
import { useSafeSphere } from '@/store/SafeSphereContext';
import {
  ShieldAlert,
  MapPin,
  Clock,
  Phone,
  MessageSquare,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  X,
  Users,
  Send,
  RefreshCw,
} from 'lucide-react';
import { geoService } from '@/lib/geolocation';
import {
  buildEmergencyAlertMessage,
  triggerWhatsAppShare,
  triggerSmsShare,
  isMobileDevice,
} from '@/lib/messaging';
import { toast } from '@/lib/toast';

interface EmergencyMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialNote?: string;
}

export const EmergencyMessageModal: React.FC<EmergencyMessageModalProps> = ({
  isOpen,
  onClose,
  initialNote = '',
}) => {
  const {
    currentUser,
    contacts,
    locationPermission,
    triggerDistressAction,
    openIncidentDetails,
    setCurrentScreen,
  } = useSafeSphere();

  const acceptedContacts = contacts.filter((c) => c.status === 'accepted');

  const [step, setStep] = useState<'compose' | 'awaiting_send' | 'sent'>('compose');
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [customRecipientPhone, setCustomRecipientPhone] = useState('');
  const [situationNote, setSituationNote] = useState(initialNote);
  const [shareLocation, setShareLocation] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{
    latitude: number;
    longitude: number;
    addressApproximate?: string;
    isDemoCoordinates?: boolean;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdIncidentId, setCreatedIncidentId] = useState<string | null>(null);
  const [activeDispatchContact, setActiveDispatchContact] = useState<any>(null);
  const [lastDispatchedChannel, setLastDispatchedChannel] = useState<'whatsapp' | 'sms' | 'copy' | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Initialize selected contacts
  useEffect(() => {
    if (isOpen) {
      setStep('compose');
      setCreatedIncidentId(null);
      setActiveDispatchContact(null);
      setLastDispatchedChannel(null);
      setCopiedSuccess(false);

      if (acceptedContacts.length > 0) {
        setSelectedContactIds(acceptedContacts.map((c) => c.id));
      } else {
        setSelectedContactIds([]);
      }

      // Fetch fresh location fix
      resolveLocation();
    }
  }, [isOpen]);

  const resolveLocation = async () => {
    setIsLocating(true);
    try {
      const loc = await geoService.getCurrentLocation({ allowDemoFallback: false });
      if (loc.latitude && loc.longitude) {
        setCurrentCoords({
          latitude: loc.latitude,
          longitude: loc.longitude,
          addressApproximate: loc.addressApproximate,
          isDemoCoordinates: loc.isDemoCoordinates,
        });
      }
    } catch {
      // Location denied or unavailable
    } finally {
      setIsLocating(false);
    }
  };

  if (!isOpen) return null;

  const locationUrl =
    shareLocation && currentCoords
      ? `https://maps.google.com/?q=${currentCoords.latitude},${currentCoords.longitude}`
      : undefined;

  const currentMessagePreview = buildEmergencyAlertMessage({
    userName: currentUser.full_name,
    note: situationNote,
    locationUrl,
    address: shareLocation ? currentCoords?.addressApproximate : undefined,
  });

  const handleToggleContact = (id: string) => {
    setSelectedContactIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const getTargetRecipients = () => {
    const list = acceptedContacts.filter((c) => selectedContactIds.includes(c.id));
    if (list.length === 0 && customRecipientPhone.trim()) {
      return [
        {
          id: 'custom_contact',
          full_name: 'Emergency Recipient',
          phone_number: customRecipientPhone.trim(),
          relationship: 'Emergency Contact',
          escalation_order: 1,
          status: 'accepted' as const,
          email: '',
          user_id: currentUser.id,
          can_view_location: true,
          created_at: new Date().toISOString(),
        },
      ];
    }
    return list;
  };

  // Ensure incident is recorded in database
  const ensureIncidentLogged = async () => {
    if (createdIncidentId) return createdIncidentId;
    try {
      const incId = await triggerDistressAction('urgent_assistance', {
        customNote: situationNote || 'Urgent assistance requested by user',
      });
      setCreatedIncidentId(incId);
      return incId;
    } catch (e: any) {
      console.warn('Incident registration fallback:', e);
      return null;
    }
  };

  const handleDispatchWhatsApp = async (contact: any) => {
    setIsSubmitting(true);
    try {
      await ensureIncidentLogged();
      setActiveDispatchContact(contact);
      setLastDispatchedChannel('whatsapp');

      const res = triggerWhatsAppShare(contact.phone_number, currentMessagePreview);
      if (!res.success) {
        toast.error(res.error || 'Could not open WhatsApp.');
      } else {
        setStep('awaiting_send');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDispatchSms = async (contact: any) => {
    setIsSubmitting(true);
    try {
      await ensureIncidentLogged();
      setActiveDispatchContact(contact);
      setLastDispatchedChannel('sms');

      const res = triggerSmsShare(contact.phone_number, currentMessagePreview);
      if (!res.success) {
        toast.error(res.error || 'Could not open SMS.');
      } else {
        setStep('awaiting_send');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyAlert = async () => {
    await ensureIncidentLogged();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentMessagePreview);
      setCopiedSuccess(true);
      setLastDispatchedChannel('copy');
      toast.success('Emergency alert message copied to clipboard!');
      setTimeout(() => setCopiedSuccess(false), 3000);
    }
  };

  const handleConfirmSent = () => {
    setStep('sent');
    toast.success('Emergency alert marked as sent by user.');
  };

  const targetRecipients = getTargetRecipients();
  const primaryRecipient = targetRecipients[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-brand-border rounded-3xl max-w-lg w-full p-6 shadow-elevated relative my-8 animate-fadeIn">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-brand-muted hover:text-brand-text p-1 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 1. COMPOSE STEP */}
        {step === 'compose' && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-coral text-white flex items-center justify-center shrink-0 shadow-coral animate-pulse">
                <ShieldAlert className="w-7 h-7 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-brand-peach text-brand-coral border border-coral-200">
                  Real Emergency SOS Dispatch
                </span>
                <h3 className="text-xl font-extrabold text-brand-text mt-1">
                  Send Emergency Alert
                </h3>
                <p className="text-xs text-brand-muted">
                  Prepares an urgent distress alert with live location and opens your messaging app directly.
                </p>
              </div>
            </div>

            {/* Recipient Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-brand-text flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-brand-teal" />
                  <span>Send Alert To:</span>
                </label>
                <span className="text-[11px] text-brand-muted font-mono">
                  {targetRecipients.length} selected
                </span>
              </div>

              {acceptedContacts.length === 0 ? (
                <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>No Verified Circle Contacts</span>
                  </div>
                  <p className="text-amber-800 text-[11px]">
                    Enter a trusted recipient phone number below to send your alert directly:
                  </p>
                  <input
                    type="tel"
                    placeholder="e.g. +91 98765 43210 or 9876543210"
                    value={customRecipientPhone}
                    onChange={(e) => setCustomRecipientPhone(e.target.value)}
                    className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-bold text-brand-text placeholder:text-brand-muted focus:outline-none focus:border-brand-teal"
                  />
                </div>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {acceptedContacts.map((contact) => (
                    <label
                      key={contact.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-brand-border cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={selectedContactIds.includes(contact.id)}
                          onChange={() => handleToggleContact(contact.id)}
                          className="rounded border-brand-border text-brand-coral focus:ring-brand-coral"
                        />
                        <div>
                          <p className="font-bold text-xs text-brand-text leading-tight">
                            {contact.full_name}{' '}
                            <span className="text-[10px] text-brand-muted font-normal">
                              ({contact.relationship})
                            </span>
                          </p>
                          <p className="text-[10px] text-brand-muted font-mono">{contact.phone_number}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-white border border-brand-border text-brand-muted">
                        Tier {contact.escalation_order}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Situation Quick Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-text">
                Emergency Situation Note (Optional):
              </label>
              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {[
                  'I need urgent help immediately',
                  'Someone is following me',
                  'Medical emergency',
                  'Unsafe location, please call me',
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setSituationNote(preset)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-slate-100 hover:bg-slate-200 text-brand-text transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={situationNote}
                onChange={(e) => setSituationNote(e.target.value)}
                placeholder="Type details or leave as urgent assistance..."
                className="w-full bg-slate-50 border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-text focus:outline-none focus:border-brand-teal font-medium"
              />
            </div>

            {/* Location Sharing Toggle */}
            <div className="p-3 bg-brand-aqua/40 border border-teal-200 rounded-2xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-teal shrink-0" />
                <div>
                  <span className="font-bold text-brand-deepTeal block text-xs">
                    Include Real-Time Live Location
                  </span>
                  <span className="text-[11px] text-brand-muted">
                    {isLocating
                      ? 'Resolving GPS fix...'
                      : currentCoords
                      ? `${currentCoords.addressApproximate || 'Coordinates resolved'} (Google Maps link)`
                      : 'Location will be included if permitted'}
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={shareLocation}
                onChange={(e) => setShareLocation(e.target.checked)}
                className="rounded border-brand-border text-brand-teal focus:ring-brand-teal h-4 w-4"
              />
            </div>

            {/* Message Preview Box */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-brand-muted uppercase">
                  Alert Message Preview
                </span>
                <button
                  type="button"
                  onClick={handleCopyAlert}
                  className="text-[11px] text-brand-teal font-bold hover:underline flex items-center gap-1"
                >
                  {copiedSuccess ? <Check className="w-3 h-3 text-teal-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSuccess ? 'Copied!' : 'Copy Text'}</span>
                </button>
              </div>
              <pre className="p-3 bg-slate-50 border border-brand-border rounded-xl text-[11px] font-mono text-brand-text whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto">
                {currentMessagePreview}
              </pre>
            </div>

            {/* Direct Dispatch Actions */}
            <div className="space-y-2 pt-2 border-t border-brand-border">
              <p className="text-[11px] text-brand-muted text-center font-medium">
                Choose your preferred app to dispatch immediately:
              </p>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={isSubmitting || targetRecipients.length === 0}
                  onClick={() => handleDispatchWhatsApp(primaryRecipient)}
                  className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
                >
                  <Phone className="w-4 h-4 fill-current" />
                  <span>Send via WhatsApp</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting || targetRecipients.length === 0}
                  onClick={() => handleDispatchSms(primaryRecipient)}
                  className="py-3 px-4 bg-brand-coral hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-all shadow-coral flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
                >
                  <MessageSquare className="w-4 h-4 fill-current" />
                  <span>Send via SMS App</span>
                </button>
              </div>

              {/* If multiple contacts, show dispatch options */}
              {targetRecipients.length > 1 && (
                <div className="pt-2 text-[11px] text-brand-muted text-center">
                  Will prepare alert for primary responder{' '}
                  <strong className="text-brand-text">{primaryRecipient.full_name}</strong> first.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. AWAITING USER SEND IN MESSAGING APP */}
        {step === 'awaiting_send' && (
          <div className="space-y-5 text-center animate-fadeIn py-2">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto border-2 border-amber-300 animate-pulse">
              <Send className="w-8 h-8 stroke-[2.2] translate-x-0.5" />
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                Action Required On Device
              </span>
              <h3 className="text-xl font-extrabold text-brand-text mt-2">
                Messaging App Opened
              </h3>
              <p className="text-xs text-brand-muted mt-1 leading-relaxed max-w-sm mx-auto">
                DigiSakhi has prepared your emergency alert with live location and opened your{' '}
                <strong className="text-brand-text uppercase">
                  {lastDispatchedChannel === 'whatsapp' ? 'WhatsApp' : 'Messages'}
                </strong>{' '}
                app for <strong>{activeDispatchContact?.full_name || 'your contact'}</strong>.
              </p>
            </div>

            {/* Critical honest disclaimer box */}
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-left text-xs space-y-2">
              <div className="flex items-start gap-2.5 font-bold text-amber-900">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span>Please Press "Send" in Your App</span>
                  <p className="font-normal text-amber-800 text-[11px] mt-0.5 leading-relaxed">
                    Browser security requires you to tap the <strong>Send</strong> button inside your
                    messaging app to deliver the text. DigiSakhi does not falsely claim the message
                    is sent until you confirm.
                  </p>
                </div>
              </div>
            </div>

            {/* Recipient Details & Action Confirmation */}
            <div className="p-3 bg-slate-50 border border-brand-border rounded-xl text-left text-xs flex items-center justify-between">
              <div>
                <p className="font-bold text-brand-text">{activeDispatchContact?.full_name}</p>
                <p className="text-[11px] text-brand-muted font-mono">{activeDispatchContact?.phone_number}</p>
              </div>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                Awaiting Send
              </span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmSent}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>✓ I Have Sent The Message</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    lastDispatchedChannel === 'whatsapp'
                      ? handleDispatchWhatsApp(activeDispatchContact)
                      : handleDispatchSms(activeDispatchContact)
                  }
                  className="flex-1 py-2.5 px-3 border border-brand-border text-brand-text hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Re-open App</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyAlert}
                  className="flex-1 py-2.5 px-3 border border-brand-border text-brand-text hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Text</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. CONFIRMED SENT STEP */}
        {step === 'sent' && (
          <div className="space-y-5 text-center animate-fadeIn py-2">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border-2 border-emerald-300">
              <CheckCircle2 className="w-9 h-9 stroke-[2.2]" />
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                Confirmed Dispatched by User
              </span>
              <h3 className="text-xl font-extrabold text-brand-text mt-2">
                Emergency Alert Sent
              </h3>
              <p className="text-xs text-brand-muted mt-1 leading-relaxed max-w-sm mx-auto">
                Your emergency SOS broadcast has been dispatched to{' '}
                <strong className="text-brand-text">{activeDispatchContact?.full_name || 'your circle'}</strong>{' '}
                and logged in your DigiSakhi security timeline.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-brand-border rounded-2xl text-left text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-brand-muted">Incident Status:</span>
                <span className="font-bold text-brand-coral bg-brand-peach px-2.5 py-0.5 rounded-full uppercase text-[10px]">
                  Active Emergency SOS
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-brand-muted">Delivery Channel:</span>
                <span className="font-bold text-brand-text capitalize">
                  {lastDispatchedChannel === 'whatsapp' ? 'WhatsApp (User Gesture)' : 'SMS Message Composer'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-brand-muted">Recipient:</span>
                <span className="font-bold text-brand-text font-mono">
                  {activeDispatchContact?.phone_number}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              {createdIncidentId && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    openIncidentDetails(createdIncidentId);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-[#5517C8] to-[#365BFF] hover:from-[#4510AB] hover:to-[#2A48D9] text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all"
                >
                  <span>View Incident Console & Responses</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 border border-brand-border text-brand-muted hover:text-brand-text rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                Close Window
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
