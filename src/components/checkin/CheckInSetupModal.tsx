import React, { useState } from 'react';
import { useSafeSphere } from '@/store/SafeSphereContext';
import { StepProgress } from '@/components/common/StepProgress';
import {
  Clock,
  ArrowRight,
  ArrowLeft,
  X,
  ShieldCheck,
  Users,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { formatTimeOnly } from '@/lib/utils';

export const CheckInSetupModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { createCheckIn, defaultProtocol, protocols, contacts, setCurrentScreen } = useSafeSphere();

  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [deadlineMinutes, setDeadlineMinutes] = useState(30);
  const [reminderLeadMinutes, setReminderLeadMinutes] = useState(2);
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState(
    defaultProtocol ? Math.round(defaultProtocol.grace_period_seconds / 60) : 3
  );
  const [contactWaitMinutes, setContactWaitMinutes] = useState(
    defaultProtocol ? Math.round(defaultProtocol.contact_wait_seconds / 60) : 3
  );
  const [selectedProtocolId, setSelectedProtocolId] = useState(defaultProtocol?.id || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const steps = [
    { id: 1, label: 'Deadline' },
    { id: 2, label: 'Grace Period' },
    { id: 3, label: 'Escalation' },
    { id: 4, label: 'Save' },
  ];

  const quickActivityPresets = [
    'Walking home from library',
    'Solo public transit commute',
    'Meeting someone new',
    'Evening neighborhood run',
  ];

  const handleNext = () => {
    if (step === 1 && !title.trim()) return;
    setStep((prev) => Math.min(prev + 1, 4));
  };
  const handleBack = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleProtocolChange = (protocolId: string) => {
    setSelectedProtocolId(protocolId);
    const proto = protocols.find((p) => p.id === protocolId);
    if (proto) {
      setGracePeriodMinutes(Math.round(proto.grace_period_seconds / 60));
      setContactWaitMinutes(Math.round(proto.contact_wait_seconds / 60));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await createCheckIn({
        title: title.trim(),
        deadlineMinutes,
        reminderLeadMinutes,
        gracePeriodMinutes,
        contactWaitMinutes,
        protocolId: selectedProtocolId || defaultProtocol?.id,
      });

      setTitle('');
      onClose();
      setCurrentScreen('my_safety');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deadlineTime = new Date(Date.now() + deadlineMinutes * 60 * 1000);
  const graceExpiryTime = new Date(Date.now() + (deadlineMinutes + gracePeriodMinutes) * 60 * 1000);

  const activeProto = protocols.find((p) => p.id === selectedProtocolId) || defaultProtocol;
  const orderedIds = activeProto?.escalation_contact_ids || [];
  const contact1 = contacts.find((c) => c.id === orderedIds[0]) || contacts[0];
  const contact2 = contacts.find((c) => c.id === orderedIds[1]) || contacts[1];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-brand-border rounded-3xl max-w-md w-full p-6 shadow-elevated relative my-8 animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-brand-muted hover:text-brand-text p-1 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <form onSubmit={handleSubmit}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-brand-aqua text-brand-teal flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-brand-text">Create Smart Check-in</h3>
              <p className="text-xs text-brand-muted">
                Persistent deadline with automated escalation protocol.
              </p>
            </div>
          </div>

          {/* Step Indicator */}
          <StepProgress steps={steps} currentStep={step} accentColor="teal" />

          {/* STEP 1: Deadline */}
          {step === 1 && (
            <div className="space-y-4 mt-4 animate-fadeIn">
              <div>
                <label className="block text-xs font-bold text-brand-text mb-1.5">
                  Activity Presets:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {quickActivityPresets.map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => setTitle(preset)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                        title === preset
                          ? 'bg-brand-aqua border-brand-teal text-brand-deepTeal font-bold shadow-xs'
                          : 'bg-slate-50 border-brand-border text-brand-muted hover:text-brand-text'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-text mb-1">
                  Check-in Activity Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Walking home from metro"
                  className="w-full bg-slate-50 border border-brand-border rounded-xl px-3.5 py-2.5 text-xs text-brand-text font-medium focus:outline-none focus:border-brand-teal"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-text mb-1">
                  Expected Completion Deadline
                </label>
                <select
                  value={deadlineMinutes}
                  onChange={(e) => setDeadlineMinutes(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-text font-medium"
                >
                  <option value={5}>5 Minutes (Quick Check-in)</option>
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes (Recommended)</option>
                  <option value={45}>45 Minutes</option>
                  <option value={60}>60 Minutes (1 Hour)</option>
                  <option value={120}>2 Hours</option>
                </select>
                <p className="text-[10px] text-brand-muted mt-1 font-mono">
                  Target deadline: {formatTimeOnly(deadlineTime.toISOString())}
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: Grace Period */}
          {step === 2 && (
            <div className="space-y-4 mt-4 animate-fadeIn">
              <div>
                <label className="block text-xs font-bold text-brand-text mb-1">
                  Grace Period Buffer Duration
                </label>
                <select
                  value={gracePeriodMinutes}
                  onChange={(e) => setGracePeriodMinutes(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-text font-medium"
                >
                  <option value={1}>1 Minute (Fast Test)</option>
                  <option value={2}>2 Minutes</option>
                  <option value={3}>3 Minutes (Default Safety Buffer)</option>
                  <option value={5}>5 Minutes</option>
                  <option value={10}>10 Minutes</option>
                </select>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-1.5 text-xs">
                <span className="font-bold text-amber-900 block">
                  Safety Transparency: How Grace Period Works
                </span>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  If the deadline passes without confirmation, the session enters a{' '}
                  <strong>{gracePeriodMinutes}-minute Grace Period</strong>. DigiSakhi treats this as an{' '}
                  <strong>Overdue Status</strong>—NOT an assumed emergency. You receive an urgent device reminder to confirm safe before your contacts are alerted.
                </p>
              </div>

              {/* Advanced Options: Reminder Lead */}
              <details className="group border border-brand-border rounded-2xl p-3 bg-white">
                <summary className="text-xs font-bold text-brand-teal cursor-pointer list-none flex items-center justify-between">
                  <span>Advanced Options (Pre-Deadline Notification Lead)</span>
                  <ChevronRight className="w-3.5 h-3.5 transition-transform group-open:rotate-90" />
                </summary>
                <div className="pt-3 mt-2 border-t border-brand-border">
                  <label className="block text-[11px] font-bold text-brand-muted mb-1">
                    Send Reminder Before Deadline:
                  </label>
                  <select
                    value={reminderLeadMinutes}
                    onChange={(e) => setReminderLeadMinutes(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-text font-medium"
                  >
                    <option value={1}>1 Minute Ahead</option>
                    <option value={2}>2 Minutes Ahead (Recommended)</option>
                    <option value={5}>5 Minutes Ahead</option>
                  </select>
                </div>
              </details>
            </div>
          )}

          {/* STEP 3: Escalation Contacts */}
          {step === 3 && (
            <div className="space-y-4 mt-4 animate-fadeIn">
              <div>
                <label className="block text-xs font-bold text-brand-text mb-1">
                  Active Safety Protocol
                </label>
                <select
                  value={selectedProtocolId}
                  onChange={(e) => handleProtocolChange(e.target.value)}
                  className="w-full bg-slate-50 border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-text font-medium"
                >
                  {protocols.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.is_default ? '(Default Protocol)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Responder Escalation Chain Preview */}
              <div className="p-4 bg-slate-50 border border-brand-border rounded-2xl space-y-3">
                <span className="text-[10px] uppercase font-bold text-brand-muted tracking-wider block">
                  Escalation Chain Sequence
                </span>

                <div className="flex items-center gap-3 text-xs">
                  <div className="w-7 h-7 rounded-full bg-brand-aqua text-brand-teal font-bold flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-bold text-brand-text">
                      {contact1?.full_name || 'Primary Responder (Tier 1)'}
                    </p>
                    <p className="text-[10px] text-brand-muted">
                      Notified immediately upon grace period expiration ({formatTimeOnly(graceExpiryTime.toISOString())})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs pt-2 border-t border-brand-border">
                  <div className="w-7 h-7 rounded-full bg-brand-lavender text-brand-violet font-bold flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-bold text-brand-text">
                      {contact2?.full_name || 'Secondary Responder (Tier 2)'}
                    </p>
                    <p className="text-[10px] text-brand-muted">
                      Escalated if Tier 1 does not acknowledge within {contactWaitMinutes} minutes
                    </p>
                  </div>
                </div>
              </div>

              {/* Advanced Options: Contact Wait Window */}
              <details className="group border border-brand-border rounded-2xl p-3 bg-white">
                <summary className="text-xs font-bold text-brand-teal cursor-pointer list-none flex items-center justify-between">
                  <span>Advanced Options (Contact Acknowledgement Timeout)</span>
                  <ChevronRight className="w-3.5 h-3.5 transition-transform group-open:rotate-90" />
                </summary>
                <div className="pt-3 mt-2 border-t border-brand-border">
                  <label className="block text-[11px] font-bold text-brand-muted mb-1">
                    Wait Window Before Secondary Escalation:
                  </label>
                  <select
                    value={contactWaitMinutes}
                    onChange={(e) => setContactWaitMinutes(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-text font-medium"
                  >
                    <option value={1}>1 Minute</option>
                    <option value={2}>2 Minutes</option>
                    <option value={3}>3 Minutes (Default)</option>
                    <option value={5}>5 Minutes</option>
                  </select>
                </div>
              </details>
            </div>
          )}

          {/* STEP 4: Review & Save */}
          {step === 4 && (
            <div className="space-y-4 mt-4 animate-fadeIn">
              <div className="p-4 bg-slate-50 border border-brand-border rounded-2xl space-y-2.5 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-brand-border">
                  <span className="text-[10px] uppercase font-bold text-brand-muted">
                    Check-in Execution Rule
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-brand-aqua text-brand-teal border border-teal-200">
                    Active Escalation
                  </span>
                </div>

                <div className="space-y-1 leading-relaxed">
                  <p>
                    <strong>Activity: </strong>
                    <span className="text-brand-text font-bold">{title}</span>
                  </p>
                  <p>
                    <strong>Target Deadline: </strong>
                    <span>{deadlineMinutes} minutes ({formatTimeOnly(deadlineTime.toISOString())})</span>
                  </p>
                  <p>
                    <strong>Grace Buffer: </strong>
                    <span>+{gracePeriodMinutes} minutes before Tier 1 escalation</span>
                  </p>
                  <p>
                    <strong>Primary Responder: </strong>
                    <span>{contact1?.full_name || 'Primary Contact'}</span>
                  </p>
                </div>
              </div>

              <div className="p-3 bg-brand-aqua/40 border border-brand-teal/20 rounded-xl text-[11px] text-brand-deepTeal flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-teal shrink-0" />
                <span>
                  Check-in will persist in localStorage/Supabase. Confirm safety or extend time at any point.
                </span>
              </div>
            </div>
          )}

          {/* Form Actions */}
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
                disabled={step === 1 && !title.trim()}
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl bg-brand-teal hover:bg-brand-deepTeal disabled:opacity-50 text-white text-xs font-bold shadow-teal flex items-center gap-1.5 transition-all active:scale-[0.98]"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-brand-teal hover:bg-brand-deepTeal text-white text-xs font-bold shadow-teal transition-all active:scale-[0.98]"
              >
                {isSubmitting ? 'Starting Check-in...' : 'Save & Start Check-in'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
