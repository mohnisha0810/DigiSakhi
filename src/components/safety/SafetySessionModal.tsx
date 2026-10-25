import React, { useState } from 'react';
import { useSafeSphere } from '@/store/SafeSphereContext';
import { DistressType } from '@/types';
import { StepProgress } from '@/components/common/StepProgress';
import {
  buildEmergencyAlertMessage,
  triggerWhatsAppShare,
  triggerSmsShare,
} from '@/lib/messaging';
import {
  ShieldAlert,
  PhoneCall,
  UserCheck,
  Compass,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  Users,
  MapPin,
  AlertTriangle,
  ChevronRight,
  Shield,
  Clock,
  Sparkles,
  MessageSquare,
  Phone,
} from 'lucide-react';

interface SafetySessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: DistressType;
}

export const SafetySessionModal: React.FC<SafetySessionModalProps> = ({
  isOpen,
  onClose,
  initialType = 'check_on_me',
}) => {
  const {
    currentUser,
    contacts,
    defaultProtocol,
    locationPermission,
    currentLocation,
    triggerDistressAction,
    createJourney,
    setCurrentScreen,
    openIncidentDetails,
  } = useSafeSphere();

  const [step, setStep] = useState(1);
  const [helpType, setHelpType] = useState<DistressType>(initialType);
  const [customNote, setCustomNote] = useState('');
  const [shareLocation, setShareLocation] = useState(locationPermission === 'granted');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedIncidentId, setCompletedIncidentId] = useState<string | null>(null);

  const acceptedContacts = contacts.filter((c) => c.status === 'accepted');
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>(
    acceptedContacts.map((c) => c.id)
  );

  if (!isOpen) return null;

  const steps = [
    { id: 1, label: 'Help Type' },
    { id: 2, label: 'Contacts' },
    { id: 3, label: 'Review' },
    { id: 4, label: 'Confirm' },
  ];

  const handleNext = () => setStep((prev) => Math.min(prev + 1, 4));
  const handleBack = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleToggleContact = (id: string) => {
    setSelectedContactIds((prev) =>
      prev.includes(id) ? prev.filter((cId) => cId !== id) : [...prev, id]
    );
  };

  const handleConfirmAndDispatch = async () => {
    setIsSubmitting(true);
    try {
      if (helpType === 'journey_checkin') {
        // Start journey checkin
        const j = await createJourney({
          originName: 'Current Location',
          destinationName: 'Safe Arrival Destination',
          destLat: 37.7897,
          destLng: -122.4011,
          safeRadiusMeters: 200,
          durationMinutes: 30,
          shareLocation,
          allowedContactIds: selectedContactIds,
          protocolId: defaultProtocol?.id,
        });
        setIsSubmitting(false);
        onClose();
        setCurrentScreen('journeys');
        return;
      }

      // Dispatch distress code
      const incId = await triggerDistressAction(helpType, {
        targetContactId: selectedContactIds[0],
        customNote: customNote.trim() || undefined,
      });

      if (incId) {
        setCompletedIncidentId(incId);
      } else {
        onClose();
        setCurrentScreen('my_safety');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isUrgent = helpType === 'urgent_assistance';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-brand-border rounded-3xl max-w-lg w-full p-6 shadow-elevated relative my-8 animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-brand-muted hover:text-brand-text p-1 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!completedIncidentId ? (
          <div>
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isUrgent ? 'bg-brand-peach text-brand-coral' : 'bg-brand-aqua text-brand-teal'
                }`}
              >
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-brand-text">
                  Start a Safety Session
                </h3>
                <p className="text-xs text-brand-muted">
                  Guided distress alert dispatch with verified circle coordination.
                </p>
              </div>
            </div>

            {/* Step Indicator */}
            <StepProgress
              steps={steps}
              currentStep={step}
              accentColor={isUrgent ? 'coral' : 'teal'}
            />

            {/* STEP 1: Choose Help Type */}
            {step === 1 && (
              <div className="space-y-3 mt-4 animate-fadeIn">
                <p className="text-xs font-bold text-brand-text">
                  Select the type of assistance you need right now:
                </p>

                <div className="space-y-2.5">
                  {/* Option 1: Check on Me */}
                  <label
                    onClick={() => setHelpType('check_on_me')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                      helpType === 'check_on_me'
                        ? 'bg-brand-aqua/50 border-brand-teal text-brand-text shadow-xs'
                        : 'bg-slate-50 border-brand-border hover:bg-slate-100 text-brand-text'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-brand-aqua text-brand-teal flex items-center justify-center shrink-0 mt-0.5">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">Check on Me</span>
                        <span className="text-[10px] uppercase font-bold text-brand-teal bg-brand-aqua px-2 py-0.5 rounded-full border border-teal-200">
                          Low Priority
                        </span>
                      </div>
                      <p className="text-[11px] text-brand-muted mt-0.5 leading-relaxed">
                        Discreet text prompt sent to your Tier 1 responder asking them to check in via messaging.
                      </p>
                    </div>
                  </label>

                  {/* Option 2: Call Me */}
                  <label
                    onClick={() => setHelpType('call_me')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                      helpType === 'call_me'
                        ? 'bg-brand-lavender/50 border-brand-violet text-brand-text shadow-xs'
                        : 'bg-slate-50 border-brand-border hover:bg-slate-100 text-brand-text'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-brand-lavender text-brand-violet flex items-center justify-center shrink-0 mt-0.5">
                      <PhoneCall className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">Call Me</span>
                        <span className="text-[10px] uppercase font-bold text-brand-violet bg-brand-lavender px-2 py-0.5 rounded-full border border-violet-200">
                          Pretext Call
                        </span>
                      </div>
                      <p className="text-[11px] text-brand-muted mt-0.5 leading-relaxed">
                        Requests an immediate phone call from your circle as an interruption pretext to exit uncomfortable situations.
                      </p>
                    </div>
                  </label>

                  {/* Option 3: Urgent Assistance */}
                  <label
                    onClick={() => setHelpType('urgent_assistance')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                      helpType === 'urgent_assistance'
                        ? 'bg-brand-peach/60 border-brand-coral text-brand-text shadow-coral/10 shadow-sm'
                        : 'bg-slate-50 border-brand-border hover:bg-slate-100 text-brand-text'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-brand-coral text-white flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-brand-coral">Urgent Assistance</span>
                        <span className="text-[10px] uppercase font-bold text-white bg-brand-coral px-2 py-0.5 rounded-full">
                          Emergency SOS
                        </span>
                      </div>
                      <p className="text-[11px] text-brand-muted mt-0.5 leading-relaxed">
                        Immediate urgent broadcast to <strong>all circle contacts simultaneously</strong> with your live GPS location.
                      </p>
                    </div>
                  </label>

                  {/* Option 4: Journey Check-in */}
                  <label
                    onClick={() => setHelpType('journey_checkin')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                      helpType === 'journey_checkin'
                        ? 'bg-brand-aqua/50 border-brand-teal text-brand-text shadow-xs'
                        : 'bg-slate-50 border-brand-border hover:bg-slate-100 text-brand-text'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-brand-aqua text-brand-teal flex items-center justify-center shrink-0 mt-0.5">
                      <Compass className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">Monitored Transit Journey</span>
                        <span className="text-[10px] uppercase font-bold text-brand-teal bg-brand-aqua px-2 py-0.5 rounded-full border border-teal-200">
                          Arrival Tracking
                        </span>
                      </div>
                      <p className="text-[11px] text-brand-muted mt-0.5 leading-relaxed">
                        Monitored commute with automatic geofenced safe arrival verification and overdue check-in escalation.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* STEP 2: Select Contacts */}
            {step === 2 && (
              <div className="space-y-4 mt-4 animate-fadeIn">
                <div>
                  <h4 className="text-xs font-bold text-brand-text mb-1">
                    Circle Recipients for this Alert:
                  </h4>
                  <p className="text-xs text-brand-muted">
                    {helpType === 'urgent_assistance'
                      ? 'Urgent assistance notifies all active contacts simultaneously.'
                      : 'Notifies your escalation responders according to your safety protocol.'}
                  </p>
                </div>

                {acceptedContacts.length === 0 ? (
                  <div className="p-4 bg-brand-peach/50 border border-brand-coral/40 rounded-2xl space-y-2 text-xs">
                    <div className="flex items-center gap-2 font-bold text-brand-coral">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>No Verified Contacts Available</span>
                    </div>
                    <p className="text-brand-muted">
                      You haven't verified any trusted contacts yet. Your alert will be recorded to your security audit log. Add contacts to notify them directly.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        setCurrentScreen('circle');
                      }}
                      className="text-xs font-bold text-brand-teal hover:underline flex items-center gap-1"
                    >
                      <span>Add Trusted Contacts in Circle →</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {acceptedContacts.map((contact) => (
                      <label
                        key={contact.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-brand-border cursor-pointer hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedContactIds.includes(contact.id)}
                            onChange={() => handleToggleContact(contact.id)}
                            className="rounded border-brand-border text-brand-teal focus:ring-brand-teal"
                          />
                          <div>
                            <p className="font-bold text-xs text-brand-text">
                              {contact.full_name}{' '}
                              <span className="text-[11px] text-brand-muted font-normal">
                                ({contact.relationship})
                              </span>
                            </p>
                            <p className="text-[10px] text-brand-muted">{contact.email}</p>
                          </div>
                        </div>

                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-white border border-brand-border text-brand-muted">
                          Tier {contact.escalation_order}
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                <div className="p-3 bg-brand-aqua/40 border border-brand-teal/20 rounded-xl text-[11px] text-brand-deepTeal flex items-center gap-2">
                  <Shield className="w-4 h-4 text-brand-teal shrink-0" />
                  <span>
                    Protocol <strong>{defaultProtocol?.name || 'Default Protocol'}</strong> will govern acknowledgment timeouts and secondary escalation.
                  </span>
                </div>
              </div>
            )}

            {/* STEP 3: Review & Options */}
            {step === 3 && (
              <div className="space-y-4 mt-4 animate-fadeIn">
                <div className="p-4 bg-slate-50 border border-brand-border rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-brand-muted">
                      Selected Help Type
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                        isUrgent
                          ? 'bg-brand-coral text-white border-brand-coral'
                          : 'bg-brand-aqua text-brand-teal border-brand-teal/20'
                      }`}
                    >
                      {helpType.replace('_', ' ')}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-brand-muted">Targeted Responders:</span>
                    <p className="text-xs font-bold text-brand-text mt-0.5">
                      {acceptedContacts
                        .filter((c) => selectedContactIds.includes(c.id))
                        .map((c) => c.full_name)
                        .join(', ') || 'No contacts selected'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-brand-border flex items-center justify-between text-xs">
                    <span className="text-brand-muted">Location Sharing:</span>
                    <span className="font-bold text-brand-text">
                      {shareLocation && locationPermission !== 'denied'
                        ? 'Attached (GPS Active)'
                        : 'Disabled / Hidden'}
                    </span>
                  </div>
                </div>

                {/* Expandable Advanced Options */}
                <details className="group border border-brand-border rounded-2xl p-3 bg-white">
                  <summary className="text-xs font-bold text-brand-violet cursor-pointer list-none flex items-center justify-between">
                    <span>Advanced Options (Situational Note & Privacy)</span>
                    <ChevronRight className="w-3.5 h-3.5 transition-transform group-open:rotate-90" />
                  </summary>

                  <div className="mt-3 pt-3 border-t border-brand-border space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-brand-text mb-1">
                        Optional Message or Incident Note:
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Someone is following me on 4th street / Need phone distraction"
                        value={customNote}
                        onChange={(e) => setCustomNote(e.target.value)}
                        className="w-full bg-slate-50 border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-text focus:outline-none focus:border-brand-teal font-medium"
                      />
                    </div>

                    <label className="flex items-center gap-2 text-xs text-brand-text cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shareLocation}
                        onChange={(e) => setShareLocation(e.target.checked)}
                        className="rounded border-brand-border text-brand-teal"
                      />
                      <span>Include real-time GPS coordinate fix with this alert</span>
                    </label>
                  </div>
                </details>
              </div>
            )}

            {/* STEP 4: Confirm */}
            {step === 4 && (
              <div className="space-y-4 mt-4 animate-fadeIn text-center">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto ${
                    isUrgent ? 'bg-brand-peach text-brand-coral animate-pulse' : 'bg-brand-aqua text-brand-teal'
                  }`}
                >
                  <ShieldAlert className="w-8 h-8" />
                </div>

                <div>
                  <h4 className="text-lg font-extrabold text-brand-text">
                    Ready to Dispatch {helpType.replace('_', ' ').toUpperCase()}
                  </h4>
                  <p className="text-xs text-brand-muted mt-1 max-w-sm mx-auto leading-relaxed">
                    {isUrgent
                      ? 'This is a high-priority emergency broadcast. Alerts and live coordinates will be dispatched immediately to your circle.'
                      : 'DigiSakhi will log the incident and alert your circle according to your protocol rules.'}
                  </p>
                </div>

                {isUrgent && (
                  <div className="p-3 bg-brand-peach/60 border border-brand-coral/40 rounded-xl text-left text-xs text-brand-coral flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="font-bold leading-relaxed">
                      Anti-Accidental Protection: Please verify you intend to send an urgent emergency broadcast to all circle members.
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-between gap-3 pt-6 border-t border-brand-border mt-6">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 py-2.5 rounded-xl border border-brand-border text-brand-muted hover:text-brand-text text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-brand-border text-brand-muted hover:text-brand-text text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-5 py-2.5 rounded-xl bg-brand-teal hover:bg-brand-deepTeal text-white text-xs font-bold shadow-teal flex items-center gap-1.5 transition-all active:scale-[0.98]"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmAndDispatch}
                  className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold transition-all active:scale-[0.98] ${
                    isUrgent
                      ? 'bg-brand-coral hover:bg-red-600 shadow-coral'
                      : 'bg-brand-teal hover:bg-brand-deepTeal shadow-teal'
                  }`}
                >
                  {isSubmitting ? 'Dispatching Alert...' : 'Confirm & Dispatch Now'}
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Completion State with Direct Contextual Links */
          <div className="text-center py-4 space-y-4 animate-fadeIn">
            <div className="w-14 h-14 rounded-2xl bg-brand-aqua text-brand-teal flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-brand-text">
                Distress Alert Dispatched Successfully
              </h3>
              <p className="text-xs text-brand-muted mt-1 max-w-sm mx-auto leading-relaxed">
                Your incident was registered and notification dispatches were sent to your authorized circle responders.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-brand-border rounded-2xl text-left text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-brand-muted font-medium">Incident Status:</span>
                <span className="font-bold text-amber-700 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full uppercase text-[10px]">
                  Active / Awaiting Response
                </span>
              </div>
              <p className="text-[11px] text-brand-muted leading-relaxed">
                You can monitor responder acknowledgements, view contact response notes, and confirm yourself safe at any time.
              </p>
            </div>

            {/* Direct App Dispatch Buttons */}
            {(() => {
              const target = contacts.find((c) => selectedContactIds.includes(c.id)) || contacts[0];
              const locationUrl =
                shareLocation && currentLocation?.latitude && currentLocation?.longitude
                  ? `https://maps.google.com/?q=${currentLocation.latitude},${currentLocation.longitude}`
                  : undefined;
              const alertMsg = buildEmergencyAlertMessage({
                userName: currentUser.full_name,
                note: customNote,
                locationUrl,
                address: shareLocation ? currentLocation?.addressApproximate : undefined,
              });

              return (
                <div className="space-y-2 pt-1 text-left">
                  {target && (
                    <div className="p-3 bg-brand-aqua/40 border border-teal-200 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-brand-muted">Target Contact:</span>
                        <p className="font-bold text-brand-text">{target.full_name}</p>
                      </div>
                      <span className="font-mono text-brand-teal font-bold">{target.phone_number}</span>
                    </div>
                  )}

                  {helpType === 'call_me' && target ? (
                    <button
                      type="button"
                      onClick={() => {
                        window.location.href = `tel:${target.phone_number.replace(/[\s\-\(\)]/g, '')}`;
                      }}
                      className="w-full py-3 bg-brand-violet hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>Open Phone Dialer ({target.phone_number})</span>
                    </button>
                  ) : target ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => triggerWhatsAppShare(target.phone_number, alertMsg)}
                        className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-[0.98]"
                      >
                        <Phone className="w-3.5 h-3.5 fill-current" />
                        <span>Open WhatsApp</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => triggerSmsShare(target.phone_number, alertMsg)}
                        className="py-2.5 px-3 bg-brand-coral hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-all shadow-coral flex items-center justify-center gap-1.5 active:scale-[0.98]"
                      >
                        <MessageSquare className="w-3.5 h-3.5 fill-current" />
                        <span>Open SMS App</span>
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })()}

            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-brand-border">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openIncidentDetails(completedIncidentId);
                }}
                className="flex-1 py-3 bg-brand-teal hover:bg-brand-deepTeal text-white rounded-xl text-xs font-bold shadow-teal flex items-center justify-center gap-1.5 transition-all"
              >
                <span>View Incident & Responses</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  setCurrentScreen('my_safety');
                }}
                className="py-3 px-4 border border-brand-border text-brand-muted hover:text-brand-text rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                Go to My Safety
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
