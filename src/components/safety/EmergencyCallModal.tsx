import React, { useState, useEffect } from 'react';
import { useSafeSphere } from '@/store/SafeSphereContext';
import {
  PhoneCall,
  Phone,
  Shield,
  ShieldAlert,
  Users,
  Copy,
  Check,
  ExternalLink,
  X,
  AlertTriangle,
  Info,
  Radio,
  ArrowRight,
} from 'lucide-react';
import { isMobileDevice } from '@/lib/messaging';
import { toast } from '@/lib/toast';

interface EmergencyCallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CallTarget {
  id: string;
  label: string;
  number: string;
  description: string;
  badge: string;
  badgeColor: string;
  isHelpline?: boolean;
}

export const EmergencyCallModal: React.FC<EmergencyCallModalProps> = ({ isOpen, onClose }) => {
  const { contacts, currentUser, triggerDistressAction } = useSafeSphere();

  const [selectedTargetId, setSelectedTargetId] = useState<string>('helpline_112');
  const [customNumber, setCustomNumber] = useState<string>('');
  const [callState, setCallState] = useState<'idle' | 'opening_dialer' | 'dialer_active' | 'desktop_info'>('idle');
  const [activeNumber, setActiveNumber] = useState<string>('');
  const [activeLabel, setActiveLabel] = useState<string>('');
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);

  const isMobile = isMobileDevice();
  const acceptedContacts = contacts.filter((c) => c.status === 'accepted');
  const primaryContact = acceptedContacts[0];
  const secondaryContact = acceptedContacts[1];

  // Available call targets
  const callTargets: CallTarget[] = [
    {
      id: 'helpline_112',
      label: 'National Emergency Helpline (112)',
      number: '112',
      description: 'All-in-one immediate emergency response: Police, Medical Ambulance, & Disaster Response.',
      badge: 'National Helpline',
      badgeColor: 'bg-brand-coral text-white',
      isHelpline: true,
    },
    {
      id: 'helpline_1091',
      label: "Women's Safety Helpline (1091)",
      number: '1091',
      description: '24/7 dedicated women distress & immediate intervention emergency helpline.',
      badge: "Women's SOS",
      badgeColor: 'bg-brand-violet text-white',
      isHelpline: true,
    },
    {
      id: 'helpline_100',
      label: 'Police Direct Emergency (100)',
      number: '100',
      description: 'Direct police control room emergency dispatch.',
      badge: 'Police Direct',
      badgeColor: 'bg-slate-800 text-white',
      isHelpline: true,
    },
  ];

  if (primaryContact) {
    callTargets.push({
      id: `contact_${primaryContact.id}`,
      label: `${primaryContact.full_name} (Tier 1 Responder)`,
      number: primaryContact.phone_number,
      description: `Primary trusted circle responder • ${primaryContact.relationship}.`,
      badge: 'Primary Circle',
      badgeColor: 'bg-brand-aqua text-brand-deepTeal border border-teal-200',
    });
  }

  if (secondaryContact) {
    callTargets.push({
      id: `contact_${secondaryContact.id}`,
      label: `${secondaryContact.full_name} (Tier 2 Responder)`,
      number: secondaryContact.phone_number,
      description: `Secondary circle escalation contact • ${secondaryContact.relationship}.`,
      badge: 'Tier 2 Circle',
      badgeColor: 'bg-slate-100 text-brand-text border border-brand-border',
    });
  }

  useEffect(() => {
    if (isOpen) {
      setCallState('idle');
      setCopiedSuccess(false);
      setSelectedTargetId('helpline_112');
      setCustomNumber('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getResolvedNumberAndLabel = (): { number: string; label: string } => {
    if (selectedTargetId === 'custom') {
      return {
        number: customNumber.trim().replace(/[\s\-\(\)]/g, ''),
        label: 'Custom Emergency Number',
      };
    }
    const target = callTargets.find((t) => t.id === selectedTargetId);
    return {
      number: target ? target.number : '112',
      label: target ? target.label : 'Emergency Helpline',
    };
  };

  const handleInitiateCall = async () => {
    const { number, label } = getResolvedNumberAndLabel();
    if (!number) {
      toast.error('Please enter or select a valid telephone number.');
      return;
    }

    setActiveNumber(number);
    setActiveLabel(label);

    // Clean telephone URI
    const cleanTel = number.replace(/[\s\-\(\)]/g, '');
    const telUri = `tel:${cleanTel}`;

    // Log pretext incident in background
    triggerDistressAction('call_me', {
      customNote: `Emergency telephone call initiated to ${label} (${cleanTel})`,
    }).catch(() => {});

    if (isMobile) {
      setCallState('opening_dialer');
      setTimeout(() => {
        window.location.href = telUri;
        setCallState('dialer_active');
      }, 500);
    } else {
      // Desktop: attempt tel: protocol handler (FaceTime / Skype / Phone Link) and show desktop instructions
      try {
        window.location.href = telUri;
      } catch {}
      setCallState('desktop_info');
    }
  };

  const handleCopyNumber = () => {
    if (navigator.clipboard && activeNumber) {
      navigator.clipboard.writeText(activeNumber);
      setCopiedSuccess(true);
      toast.success(`Copied ${activeNumber} to clipboard!`);
      setTimeout(() => setCopiedSuccess(false), 3000);
    }
  };

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

        {/* 1. SELECTION & CALL TARGETS (IDLE STATE) */}
        {callState === 'idle' && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-coral text-white flex items-center justify-center shrink-0 shadow-coral animate-pulse">
                <PhoneCall className="w-6 h-6 stroke-[2.3]" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-brand-peach text-brand-coral border border-coral-200">
                  Instant Emergency Dial
                </span>
                <h3 className="text-xl font-extrabold text-brand-text mt-1">
                  Emergency Phone Call
                </h3>
                <p className="text-xs text-brand-muted">
                  Connect immediately with emergency services or your primary safety contact.
                </p>
              </div>
            </div>

            {/* Target Options List */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-brand-text flex items-center justify-between">
                <span>Select Emergency Call Destination:</span>
                <span className="text-[11px] text-brand-muted font-normal">
                  {isMobile ? 'Opens Native Phone Dialer' : 'Desktop Telephony & Copy'}
                </span>
              </label>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {callTargets.map((target) => (
                  <label
                    key={target.id}
                    onClick={() => setSelectedTargetId(target.id)}
                    className={`flex items-start justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                      selectedTargetId === target.id
                        ? 'bg-brand-peach/40 border-brand-coral shadow-xs'
                        : 'bg-slate-50 border-brand-border hover:bg-slate-100 text-brand-text'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="emergency_call_target"
                        checked={selectedTargetId === target.id}
                        onChange={() => setSelectedTargetId(target.id)}
                        className="mt-1 text-brand-coral focus:ring-brand-coral"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-brand-text">
                            {target.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-brand-muted mt-0.5 leading-relaxed">
                          {target.description}
                        </p>
                        <p className="text-xs font-mono font-bold text-brand-coral mt-1">
                          {target.number}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full shrink-0 ${target.badgeColor}`}
                    >
                      {target.badge}
                    </span>
                  </label>
                ))}

                {/* Custom Number Option */}
                <label
                  onClick={() => setSelectedTargetId('custom')}
                  className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                    selectedTargetId === 'custom'
                      ? 'bg-brand-peach/40 border-brand-coral shadow-xs'
                      : 'bg-slate-50 border-brand-border hover:bg-slate-100 text-brand-text'
                  }`}
                >
                  <input
                    type="radio"
                    name="emergency_call_target"
                    checked={selectedTargetId === 'custom'}
                    onChange={() => setSelectedTargetId('custom')}
                    className="mt-1 text-brand-coral focus:ring-brand-coral"
                  />
                  <div className="flex-1">
                    <span className="font-bold text-xs text-brand-text block">
                      Dial Other Emergency Number
                    </span>
                    <input
                      type="tel"
                      placeholder="e.g. 1090 (Women Power Line) or relative phone"
                      value={customNumber}
                      onChange={(e) => {
                        setCustomNumber(e.target.value);
                        setSelectedTargetId('custom');
                      }}
                      className="mt-1.5 w-full bg-white border border-brand-border rounded-xl px-3 py-1.5 text-xs text-brand-text font-bold focus:outline-none focus:border-brand-coral"
                    />
                  </div>
                </label>
              </div>
            </div>

            {/* Mobile / Desktop Notice */}
            <div className="p-3 bg-brand-aqua/40 border border-teal-200 rounded-2xl text-xs text-brand-deepTeal flex items-start gap-2.5">
              <Info className="w-4 h-4 text-brand-teal shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                {isMobile ? (
                  <span>
                    Tapping <strong>"Place Emergency Call"</strong> will immediately launch your phone's native telephone dialer with the selected number pre-filled.
                  </span>
                ) : (
                  <span>
                    Desktop device detected: Clicking call will attempt your computer's telephony application (e.g. FaceTime or Phone Link) and display the number for manual dialing on your phone.
                  </span>
                )}
              </div>
            </div>

            {/* Direct Action */}
            <div className="pt-2 border-t border-brand-border">
              <button
                type="button"
                onClick={handleInitiateCall}
                className="w-full py-3.5 bg-brand-coral hover:bg-red-600 text-white rounded-xl text-xs font-extrabold shadow-coral transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Place Emergency Call ({getResolvedNumberAndLabel().number})</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. OPENING DIALER STATE */}
        {callState === 'opening_dialer' && (
          <div className="space-y-4 text-center py-8 animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-brand-coral text-white flex items-center justify-center mx-auto shadow-coral animate-spin">
              <Radio className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-brand-text">
                Opening Device Dialer...
              </h3>
              <p className="text-xs text-brand-muted mt-1 font-mono font-bold">
                {activeNumber}
              </p>
            </div>
          </div>
        )}

        {/* 3. DIALER ACTIVE (MOBILE FEEDBACK) */}
        {callState === 'dialer_active' && (
          <div className="space-y-5 text-center animate-fadeIn py-2">
            <div className="w-16 h-16 rounded-full bg-brand-peach text-brand-coral flex items-center justify-center mx-auto border-2 border-brand-coral/40">
              <PhoneCall className="w-8 h-8 stroke-[2.2]" />
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-brand-peach text-brand-coral border border-coral-200">
                Native Dialer Triggered
              </span>
              <h3 className="text-xl font-extrabold text-brand-text mt-2">
                Phone Dialer Opened
              </h3>
              <p className="text-xs text-brand-muted mt-1 leading-relaxed max-w-sm mx-auto">
                Your mobile phone dialer has been opened with{' '}
                <strong className="text-brand-text">{activeLabel}</strong>.
              </p>
            </div>

            {/* Target number card */}
            <div className="p-4 bg-slate-50 border border-brand-border rounded-2xl text-center space-y-1">
              <span className="text-[10px] uppercase font-bold text-brand-muted">Dialing Target:</span>
              <p className="text-2xl font-mono font-black text-brand-coral tracking-wider">
                {activeNumber}
              </p>
            </div>

            {/* Honest verification disclaimer */}
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-left text-xs space-y-2">
              <div className="flex items-start gap-2.5 font-bold text-amber-900">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span>Please Confirm on Your Device</span>
                  <p className="font-normal text-amber-800 text-[11px] mt-0.5 leading-relaxed">
                    Browser security allows opening the phone app, but requires you to tap <strong>Call</strong> on your phone screen. DigiSakhi does not falsely claim the call connected.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  window.location.href = `tel:${activeNumber.replace(/[\s\-\(\)]/g, '')}`;
                }}
                className="w-full py-3 bg-brand-coral hover:bg-red-600 text-white rounded-xl text-xs font-bold shadow-coral flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Re-open Telephone Dialer</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 border border-brand-border text-brand-muted hover:text-brand-text rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                Return to Safety Dashboard
              </button>
            </div>
          </div>
        )}

        {/* 4. DESKTOP INFORMATION STATE */}
        {callState === 'desktop_info' && (
          <div className="space-y-5 text-center animate-fadeIn py-2">
            <div className="w-16 h-16 rounded-full bg-brand-lavender text-brand-violet flex items-center justify-center mx-auto border-2 border-violet-200">
              <Phone className="w-8 h-8 stroke-[2.2]" />
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-brand-lavender text-brand-violet border border-violet-200">
                Desktop Device Detected
              </span>
              <h3 className="text-xl font-extrabold text-brand-text mt-2">
                Emergency Calling Details
              </h3>
              <p className="text-xs text-brand-muted mt-1 leading-relaxed max-w-sm mx-auto">
                Direct cellular calls require a mobile phone. Please dial the emergency number directly on your phone:
              </p>
            </div>

            {/* Target number card */}
            <div className="p-4 bg-slate-50 border border-brand-border rounded-2xl text-center space-y-1">
              <span className="text-[10px] uppercase font-bold text-brand-muted">{activeLabel}</span>
              <p className="text-3xl font-mono font-black text-brand-coral tracking-wider my-1">
                {activeNumber}
              </p>
              <button
                type="button"
                onClick={handleCopyNumber}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold text-brand-teal hover:bg-brand-aqua transition-colors"
              >
                {copiedSuccess ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSuccess ? 'Number Copied!' : 'Copy Number'}</span>
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-brand-border rounded-xl text-left text-[11px] text-brand-muted space-y-1 leading-relaxed">
              <p>
                • If your computer has a connected telephony application (such as <strong>FaceTime</strong>, <strong>Skype</strong>, or <strong>Windows Phone Link</strong>), DigiSakhi attempted to trigger it automatically.
              </p>
              <p>
                • For immediate emergency assistance, dial <strong>{activeNumber}</strong> directly on your handheld phone.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  window.location.href = `tel:${activeNumber.replace(/[\s\-\(\)]/g, '')}`;
                }}
                className="w-full py-3 bg-brand-teal hover:bg-brand-deepTeal text-white rounded-xl text-xs font-bold shadow-teal flex items-center justify-center gap-2 transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Launch Computer Calling App</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 border border-brand-border text-brand-muted hover:text-brand-text rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
