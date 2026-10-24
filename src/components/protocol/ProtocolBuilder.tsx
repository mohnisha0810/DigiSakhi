import React, { useState } from 'react';
import { useSafeSphere } from '@/store/SafeSphereContext';
import { SafetyProtocol } from '@/types';
import { StepProgress } from '@/components/common/StepProgress';
import {
  Sliders,
  CheckCircle2,
  Clock,
  Users,
  MapPin,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  ArrowUpDown,
  FileCheck2,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export const ProtocolBuilder: React.FC = () => {
  const {
    protocols,
    saveProtocol,
    setDefaultProtocol,
    deleteProtocol,
    contacts,
    currentUser,
  } = useSafeSphere();

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [wizardStep, setWizardStep] = useState(1);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState<SafetyProtocol['trigger_type']>('check_in_overdue');
  const [reminderLeadMinutes, setReminderLeadMinutes] = useState(2);
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState(3);
  const [contactWaitMinutes, setContactWaitMinutes] = useState(3);
  const [allowLocationSharing, setAllowLocationSharing] = useState(true);
  const [autoExpireMinutes, setAutoExpireMinutes] = useState(60);
  const [resolutionBehavior, setResolutionBehavior] = useState<'require_safe_confirmation' | 'allow_contact_resolve'>('require_safe_confirmation');
  const [isDefault, setIsDefault] = useState(false);

  // Escalation contact ordering
  const acceptedContacts = contacts
    .filter((c) => c.status === 'accepted')
    .sort((a, b) => a.escalation_order - b.escalation_order);

  const [tier1ContactId, setTier1ContactId] = useState<string>('');
  const [tier2ContactId, setTier2ContactId] = useState<string>('');

  // Validation & Success feedback
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [savedSuccessMessage, setSavedSuccessMessage] = useState<string | null>(null);

  const wizardSteps = [
    { id: 1, label: 'Trigger' },
    { id: 2, label: 'Timing' },
    { id: 3, label: 'Hierarchy' },
    { id: 4, label: 'Permissions' },
    { id: 5, label: 'Review' },
  ];

  const handleStartNew = () => {
    setName('');
    setDescription('');
    setTriggerType('check_in_overdue');
    setReminderLeadMinutes(2);
    setGracePeriodMinutes(3);
    setContactWaitMinutes(3);
    setAllowLocationSharing(true);
    setAutoExpireMinutes(60);
    setResolutionBehavior('require_safe_confirmation');
    setIsDefault(false);
    setTier1ContactId(acceptedContacts[0]?.id || '');
    setTier2ContactId(acceptedContacts[1]?.id || '');
    setValidationErrors([]);
    setEditingId(null);
    setWizardStep(1);
    setIsEditing(true);
  };

  const handleEdit = (proto: SafetyProtocol) => {
    setEditingId(proto.id);
    setName(proto.name);
    setDescription(proto.description || '');
    setTriggerType(proto.trigger_type);
    setReminderLeadMinutes(Math.round(proto.reminder_lead_seconds / 60) || 2);
    setGracePeriodMinutes(Math.round(proto.grace_period_seconds / 60) || 3);
    setContactWaitMinutes(Math.round(proto.contact_wait_seconds / 60) || 3);
    setAllowLocationSharing(proto.allow_location_sharing);
    setAutoExpireMinutes(proto.location_auto_expire_minutes || 60);
    setResolutionBehavior(proto.resolution_behavior || 'require_safe_confirmation');
    setIsDefault(proto.is_default);

    const orderedIds = proto.escalation_contact_ids || [];
    setTier1ContactId(orderedIds[0] || acceptedContacts[0]?.id || '');
    setTier2ContactId(orderedIds[1] || acceptedContacts[1]?.id || '');
    setValidationErrors([]);
    setWizardStep(1);
    setIsEditing(true);
  };

  const handleSwapContactOrder = () => {
    const temp = tier1ContactId;
    setTier1ContactId(tier2ContactId);
    setTier2ContactId(temp);
  };

  const validateStep = (currentStep: number): boolean => {
    const errors: string[] = [];

    if (currentStep === 1) {
      if (!name.trim()) {
        errors.push('Protocol Name is required.');
      } else if (name.trim().length < 3) {
        errors.push('Protocol Name must be at least 3 characters.');
      }
    }

    if (currentStep === 3) {
      if (!tier1ContactId) {
        errors.push('Please select a Primary Responder (Tier 1 contact).');
      }
      if (tier2ContactId && tier2ContactId === tier1ContactId) {
        errors.push('Tier 1 and Tier 2 cannot be assigned to the same contact.');
      }
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleWizardNext = () => {
    if (!validateStep(wizardStep)) return;
    setWizardStep((prev) => Math.min(prev + 1, 5));
  };

  const handleWizardBack = () => {
    setValidationErrors([]);
    setWizardStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setValidationErrors(['Protocol Name is required.']);
      setWizardStep(1);
      return;
    }
    if (!tier1ContactId) {
      setValidationErrors(['Please select a Primary Responder (Tier 1 contact).']);
      setWizardStep(3);
      return;
    }

    const orderedContactIds: string[] = [];
    if (tier1ContactId) orderedContactIds.push(tier1ContactId);
    if (tier2ContactId && tier2ContactId !== tier1ContactId) orderedContactIds.push(tier2ContactId);

    await saveProtocol({
      id: editingId || undefined,
      user_id: currentUser.id,
      name: name.trim(),
      description: description.trim() || 'Custom personal safety protocol.',
      trigger_type: triggerType,
      reminder_lead_seconds: reminderLeadMinutes * 60,
      grace_period_seconds: gracePeriodMinutes * 60,
      contact_wait_seconds: contactWaitMinutes * 60,
      allow_location_sharing: allowLocationSharing,
      location_auto_expire_minutes: autoExpireMinutes,
      escalation_contact_ids: orderedContactIds,
      resolution_behavior: resolutionBehavior,
      is_default: isDefault,
      active: true,
    });

    setSavedSuccessMessage(`Protocol "${name.trim()}" successfully saved and connected to escalation engine.`);
    setTimeout(() => setSavedSuccessMessage(null), 5000);
    setIsEditing(false);
  };

  const getContactName = (id: string): string => {
    const c = contacts.find((item) => item.id === id);
    return c ? `${c.full_name} (${c.relationship})` : 'Unassigned';
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-brand-border shadow-card flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-violet bg-brand-lavender px-3 py-1 rounded-full border border-violet-200">
            Personal Safety Protocol Builder
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-text mt-2 tracking-tight">
            Safety Protocols & Escalation Rules
          </h1>
          <p className="text-sm text-brand-muted mt-1 max-w-2xl leading-relaxed">
            “Your safety. Your rules. Your trusted circle.” Configure custom escalation rules that directly drive Smart Check-in, distress dispatches, and Safe Arrival Verification workflows.
          </p>
        </div>

        {!isEditing && (
          <button
            onClick={handleStartNew}
            className="px-4 py-2.5 bg-brand-violet hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-violet hover:shadow-hover transition-all flex items-center gap-2 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Build New Protocol
          </button>
        )}
      </div>

      {/* Confirmation feedback banner */}
      {savedSuccessMessage && (
        <div className="p-4 bg-brand-aqua border border-teal-200 rounded-xl text-brand-deepTeal text-xs shadow-xs flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-brand-teal shrink-0" />
          <span className="font-semibold">{savedSuccessMessage}</span>
        </div>
      )}

      {/* Guided Builder Multi-Step Form */}
      {isEditing && (
        <form onSubmit={handleSubmit} className="bg-white border border-violet-300 rounded-3xl p-6 shadow-elevated space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-brand-border pb-3">
            <div>
              <h2 className="text-lg font-extrabold text-brand-text flex items-center gap-2">
                <Sliders className="w-5 h-5 text-brand-violet" />
                <span>{editingId ? 'Edit Safety Protocol' : 'Create Safety Protocol'}</span>
              </h2>
              <p className="text-xs text-brand-muted mt-0.5">
                Saved parameters directly control the backend scheduler escalation sequence.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-xs font-bold text-brand-muted hover:text-brand-text px-3 py-1 rounded-lg border border-brand-border hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>

          {/* Step Indicator */}
          <StepProgress steps={wizardSteps} currentStep={wizardStep} accentColor="violet" />

          {/* Validation Errors Box */}
          {validationErrors.length > 0 && (
            <div className="p-3.5 bg-brand-peach border border-coral-200 rounded-xl text-brand-coral text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 text-brand-coral shrink-0" />
                <span>Please correct the following:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 pl-1 text-red-700">
                {validationErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* STEP 1: Trigger & Protocol Basics */}
          {wizardStep === 1 && (
            <div className="space-y-4 mt-2 animate-fadeIn">
              <div>
                <label className="block text-xs font-bold text-brand-text mb-1">
                  Protocol Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Late Night Commute Protocol"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-brand-border rounded-xl px-3.5 py-2.5 text-xs text-brand-text font-medium focus:outline-none focus:border-brand-violet"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-text mb-1">
                  Primary Trigger Type *
                </label>
                <select
                  value={triggerType}
                  onChange={(e) => setTriggerType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-text font-medium focus:outline-none focus:border-brand-violet"
                >
                  <option value="check_in_overdue">Scheduled Check-in Overdue</option>
                  <option value="journey_delayed">Monitored Journey Delayed</option>
                  <option value="urgent_button">Urgent Distress Action Dispatched</option>
                  <option value="custom">Custom Multi-Situation Protocol</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-text mb-1">
                  Description & Context
                </label>
                <input
                  type="text"
                  placeholder="e.g. Used for evening commute from campus or solo public transit."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-brand-border rounded-xl px-3.5 py-2.5 text-xs text-brand-text font-medium focus:outline-none focus:border-brand-violet"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Timing & Buffers */}
          {wizardStep === 2 && (
            <div className="space-y-4 mt-2 animate-fadeIn">
              <div className="p-4 bg-slate-50 rounded-2xl border border-brand-border space-y-4">
                <h3 className="text-xs font-bold text-brand-violet uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-brand-violet" />
                  Timing & Buffer Rules
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-brand-text mb-1">
                      Pre-Deadline Reminder Lead
                    </label>
                    <select
                      value={reminderLeadMinutes}
                      onChange={(e) => setReminderLeadMinutes(Number(e.target.value))}
                      className="w-full bg-white border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-text font-medium"
                    >
                      <option value={1}>1 Minute Before</option>
                      <option value={2}>2 Minutes Before (Recommended)</option>
                      <option value={5}>5 Minutes Before</option>
                      <option value={10}>10 Minutes Before</option>
                    </select>
                    <p className="text-[10px] text-brand-muted mt-1">Notification sent to remind you before deadline</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-text mb-1">
                      Grace Period Buffer
                    </label>
                    <select
                      value={gracePeriodMinutes}
                      onChange={(e) => setGracePeriodMinutes(Number(e.target.value))}
                      className="w-full bg-white border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-text font-medium"
                    >
                      <option value={1}>1 Minute</option>
                      <option value={2}>2 Minutes</option>
                      <option value={3}>3 Minutes (Default)</option>
                      <option value={5}>5 Minutes</option>
                    </select>
                    <p className="text-[10px] text-brand-muted mt-1">Buffer time after deadline before alerting Contact 1</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-text mb-1">
                      Acknowledgement Timeout
                    </label>
                    <select
                      value={contactWaitMinutes}
                      onChange={(e) => setContactWaitMinutes(Number(e.target.value))}
                      className="w-full bg-white border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-text font-medium"
                    >
                      <option value={1}>1 Minute</option>
                      <option value={2}>2 Minutes</option>
                      <option value={3}>3 Minutes</option>
                      <option value={5}>5 Minutes</option>
                    </select>
                    <p className="text-[10px] text-brand-muted mt-1">Wait for Contact 1 before escalating to Contact 2</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Responder Hierarchy */}
          {wizardStep === 3 && (
            <div className="space-y-4 mt-2 animate-fadeIn">
              <div className="p-4 bg-slate-50 rounded-2xl border border-brand-border space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-brand-teal uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-brand-teal" />
                    Sequential Escalation Hierarchy
                  </h3>

                  {acceptedContacts.length >= 2 && (
                    <button
                      type="button"
                      onClick={handleSwapContactOrder}
                      className="px-3 py-1 bg-white hover:bg-slate-100 text-brand-violet border border-violet-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-xs"
                    >
                      <ArrowUpDown className="w-3.5 h-3.5" />
                      Swap Tier 1 / Tier 2 Order
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-brand-text mb-1">
                      Tier 1 Primary Responder *
                    </label>
                    <select
                      value={tier1ContactId}
                      onChange={(e) => setTier1ContactId(e.target.value)}
                      className="w-full bg-white border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-text font-medium focus:outline-none focus:border-brand-violet"
                    >
                      <option value="">-- Select Contact 1 --</option>
                      {acceptedContacts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.full_name} ({c.relationship})
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-brand-muted mt-1">Receives initial alert immediately upon grace period expiration</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-text mb-1">
                      Tier 2 Secondary Escalation Contact
                    </label>
                    <select
                      value={tier2ContactId}
                      onChange={(e) => setTier2ContactId(e.target.value)}
                      className="w-full bg-white border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-text font-medium focus:outline-none focus:border-brand-violet"
                    >
                      <option value="">-- None / Circle End --</option>
                      {acceptedContacts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.full_name} ({c.relationship})
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-brand-muted mt-1">Alerted if Tier 1 does not acknowledge within {contactWaitMinutes}m</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Permissions & Resolution */}
          {wizardStep === 4 && (
            <div className="space-y-4 mt-2 animate-fadeIn">
              <div className="p-4 bg-slate-50 rounded-2xl border border-brand-border space-y-3">
                <label className="flex items-start gap-2.5 text-xs text-brand-text cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowLocationSharing}
                    onChange={(e) => setAllowLocationSharing(e.target.checked)}
                    className="mt-0.5 rounded border-brand-border text-brand-teal"
                  />
                  <span>
                    <strong className="text-brand-text block font-bold">Share Location During Active Alert</strong>
                    Coordinates shared strictly with authorized responders while active.
                  </span>
                </label>

                {/* Advanced Options for Location & Resolution */}
                <details className="group border border-brand-border rounded-2xl p-3 bg-white">
                  <summary className="text-xs font-bold text-brand-violet cursor-pointer list-none flex items-center justify-between">
                    <span>Advanced Options (Auto-Expiry & Resolution Policy)</span>
                    <ChevronRight className="w-3.5 h-3.5 transition-transform group-open:rotate-90" />
                  </summary>

                  <div className="pt-3 mt-2 border-t border-brand-border space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-brand-text mb-1">
                        Location Auto-Expiry Window
                      </label>
                      <select
                        value={autoExpireMinutes}
                        onChange={(e) => setAutoExpireMinutes(Number(e.target.value))}
                        disabled={!allowLocationSharing}
                        className="w-full bg-slate-50 border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-text font-medium disabled:opacity-40"
                      >
                        <option value={15}>15 Minutes</option>
                        <option value={30}>30 Minutes</option>
                        <option value={60}>60 Minutes (1 Hour)</option>
                        <option value={120}>120 Minutes (2 Hours)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-brand-text mb-1">
                        Session Resolution Policy
                      </label>
                      <select
                        value={resolutionBehavior}
                        onChange={(e) => setResolutionBehavior(e.target.value as any)}
                        className="w-full bg-slate-50 border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-text font-medium"
                      >
                        <option value="require_safe_confirmation">
                          Require Explicit Safe Confirmation by You
                        </option>
                        <option value="allow_contact_resolve">
                          Allow Responder to Resolve Incident
                        </option>
                      </select>
                    </div>
                  </div>
                </details>
              </div>
            </div>
          )}

          {/* STEP 5: Review & Save */}
          {wizardStep === 5 && (
            <div className="space-y-4 mt-2 animate-fadeIn">
              {/* Set as default checkbox */}
              <label className="flex items-center gap-2 p-3 bg-slate-50 border border-brand-border rounded-xl text-xs text-brand-text font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded border-brand-border text-brand-teal"
                />
                <span>Set as my default active safety protocol for new check-ins and journeys.</span>
              </label>

              {/* Live Preview Summary Card */}
              <div className="p-4 bg-brand-lavender/60 border border-violet-200 rounded-2xl text-xs text-brand-text space-y-1">
                <p className="font-extrabold text-brand-violet flex items-center gap-1.5 text-sm">
                  <FileCheck2 className="w-4 h-4 text-brand-violet" />
                  Plain-English Protocol Preview:
                </p>
                <p className="leading-relaxed text-xs text-brand-text/90 pt-1">
                  “When my check-in deadline arrives, DigiSakhi sends a reminder {reminderLeadMinutes} min ahead and grants a {gracePeriodMinutes} min grace period. If unconfirmed, an alert is sent to {getContactName(tier1ContactId)}. If unacknowledged within {contactWaitMinutes} min, it escalates to {getContactName(tier2ContactId)}. Location sharing is {allowLocationSharing ? `enabled (expires after ${autoExpireMinutes}m)` : 'disabled'}. {resolutionBehavior === 'require_safe_confirmation' ? 'Requires explicit safe confirmation from you to resolve.' : 'Responders may mark resolved after confirming safety.'}”
                </p>
              </div>

              <div className="p-3 bg-brand-aqua/40 border border-brand-teal/20 rounded-xl text-[11px] text-brand-deepTeal flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-teal shrink-0" />
                <span>
                  This protocol will immediately drive backend scheduler escalation logic across the platform.
                </span>
              </div>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-brand-border mt-4">
            {wizardStep > 1 ? (
              <button
                type="button"
                onClick={handleWizardBack}
                className="px-4 py-2.5 rounded-xl border border-brand-border text-brand-muted hover:text-brand-text text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2.5 rounded-xl border border-brand-border text-brand-muted hover:text-brand-text text-xs font-bold transition-colors"
              >
                Cancel
              </button>
            )}

            {wizardStep < 5 ? (
              <button
                type="button"
                onClick={handleWizardNext}
                className="px-5 py-2.5 rounded-xl bg-brand-violet hover:bg-violet-700 text-white text-xs font-bold shadow-violet flex items-center gap-1.5 transition-all active:scale-[0.98]"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="submit"
                className="px-5 py-2.5 bg-brand-violet hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-violet transition-all active:scale-[0.98]"
              >
                Save Protocol
              </button>
            )}
          </div>
        </form>
      )}

      {/* List of Saved Protocols */}
      <div className="space-y-4">
        {protocols.map((protocol) => {
          const isDef = protocol.is_default;
          const contact1 = contacts.find((c) => c.id === protocol.escalation_contact_ids?.[0]) || acceptedContacts[0];
          const contact2 = contacts.find((c) => c.id === protocol.escalation_contact_ids?.[1]) || acceptedContacts[1];

          return (
            <div
              key={protocol.id}
              className={`rounded-2xl border p-6 transition-all shadow-card ${
                isDef
                  ? 'bg-white border-teal-300 ring-1 ring-teal-200'
                  : 'bg-white border-brand-border'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      isDef ? 'bg-brand-aqua text-brand-teal' : 'bg-slate-100 text-brand-muted'
                    }`}
                  >
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-brand-text text-base">
                        {protocol.name}
                      </h3>
                      {isDef && (
                        <span className="text-[10px] font-extrabold bg-brand-aqua text-brand-deepTeal px-2.5 py-0.5 rounded-full border border-teal-200 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Default Active
                        </span>
                      )}
                      <span className="text-xs text-brand-muted font-mono capitalize">
                        Trigger: {protocol.trigger_type.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                      {protocol.description || 'Configured personal safety protocol.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!isDef && (
                    <button
                      onClick={() => setDefaultProtocol(protocol.id)}
                      className="px-3 py-1.5 rounded-lg border border-brand-border text-xs font-bold text-brand-muted hover:text-brand-text hover:bg-slate-50 transition-colors"
                    >
                      Make Default
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(protocol)}
                    className="px-3 py-1.5 rounded-lg bg-brand-lavender text-brand-violet hover:bg-violet-100 text-xs font-bold border border-violet-200 transition-colors"
                  >
                    Configure Rules
                  </button>
                  {protocols.length > 1 && !isDef && (
                    <button
                      onClick={() => deleteProtocol(protocol.id)}
                      className="p-1.5 text-brand-muted hover:text-brand-coral rounded-lg transition-colors"
                      title="Delete protocol"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Protocol rule parameters breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-brand-border text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50">
                  <span className="text-[10px] uppercase font-bold text-brand-muted block">Grace Buffer</span>
                  <p className="font-bold text-brand-text mt-0.5">
                    {Math.round(protocol.grace_period_seconds / 60)} Minutes
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50">
                  <span className="text-[10px] uppercase font-bold text-brand-muted block">Tier 1 Primary</span>
                  <p className="font-bold text-brand-text mt-0.5 truncate">
                    {contact1 ? contact1.full_name : 'Primary Contact'}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50">
                  <span className="text-[10px] uppercase font-bold text-brand-muted block">Tier 2 Secondary</span>
                  <p className="font-bold text-brand-text mt-0.5 truncate">
                    {contact2 ? contact2.full_name : 'Secondary Contact'}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50">
                  <span className="text-[10px] uppercase font-bold text-brand-muted block">Location Sharing</span>
                  <p className="font-bold text-brand-text mt-0.5">
                    {protocol.allow_location_sharing ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
