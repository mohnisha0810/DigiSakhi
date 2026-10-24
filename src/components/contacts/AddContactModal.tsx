import React, { useState } from 'react';
import { useSafeSphere } from '@/store/SafeSphereContext';
import { StepProgress } from '@/components/common/StepProgress';
import { StatusBadge } from '@/components/common/StatusBadge';
import { InvitationDeliveryStatus } from '@/types';
import {
  X,
  UserPlus,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  Shield,
  MapPin,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  MessageSquare,
  Phone,
  Info,
} from 'lucide-react';

interface InviteResultState {
  token: string;
  success: boolean;
  deliveryStatus: InvitationDeliveryStatus;
  messageId?: string;
  error?: string;
  inviteUrl: string;
}

export const AddContactModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { inviteContact, contacts, currentUser } = useSafeSphere();

  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [relationship, setRelationship] = useState('Friend');
  const [escalationTier, setEscalationTier] = useState<number>(contacts.length + 1);
  const [canViewLocation, setCanViewLocation] = useState(true);
  const [canReceiveDistress, setCanReceiveDistress] = useState(true);
  const [inviteResult, setInviteResult] = useState<InviteResultState | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setStep(1);
    setFullName('');
    setEmail('');
    setPhoneNumber('');
    setRelationship('Friend');
    setEscalationTier(contacts.length + 1);
    setCanViewLocation(true);
    setCanReceiveDistress(true);
    setInviteResult(null);
    setCopied(false);
    setValidationError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const steps = [
    { id: 1, label: 'Details' },
    { id: 2, label: 'Permissions' },
    { id: 3, label: 'Review & Send' },
  ];

  const handleNext = () => {
    setValidationError(null);
    if (step === 1) {
      if (!fullName.trim()) {
        setValidationError('Please enter the contact\'s full name.');
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setValidationError('Please enter a valid email address.');
        return;
      }
      if (!phoneNumber.trim()) {
        setValidationError('Please enter a mobile phone number for SMS delivery.');
        return;
      }
      const digits = phoneNumber.replace(/\D/g, '');
      if (digits.length < 10) {
        setValidationError('Phone number must have at least 10 digits (including country code if outside India).');
        return;
      }
    }
    setStep((prev) => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setValidationError(null);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    if (!fullName.trim() || !email.trim() || !phoneNumber.trim()) return;

    setIsSubmitting(true);
    try {
      const result = await inviteContact({
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        relationship,
        escalationOrder: escalationTier,
      });

      setInviteResult(result);
    } catch (err: any) {
      setValidationError(err.message || 'An error occurred while creating the invitation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (!inviteResult) return;
    const url =
      inviteResult.inviteUrl ||
      `${window.location.origin}/invite?token=${inviteResult.token}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenRecipientView = () => {
    if (!inviteResult) return;
    const url =
      inviteResult.inviteUrl ||
      `${window.location.origin}/invite?token=${inviteResult.token}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-brand-border rounded-3xl max-w-md w-full p-6 shadow-elevated relative my-8 animate-fadeIn">
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 text-brand-muted hover:text-brand-text p-1 transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {!inviteResult ? (
          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-brand-aqua text-brand-teal flex items-center justify-center shrink-0">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-brand-text">Add Trusted Contact</h3>
                <p className="text-xs text-brand-muted">
                  Add a verified responder and dispatch an SMS invitation.
                </p>
              </div>
            </div>

            {/* Step Indicator */}
            <StepProgress steps={steps} currentStep={step} accentColor="teal" />

            {/* Validation Error Banner */}
            {validationError && (
              <div className="mt-3 p-3 bg-brand-peach border border-coral-200 rounded-xl text-brand-coral text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span className="font-semibold">{validationError}</span>
              </div>
            )}

            {/* STEP 1: Enter Details */}
            {step === 1 && (
              <div className="space-y-3.5 mt-4 animate-fadeIn">
                <div>
                  <label className="block text-xs font-bold text-brand-text mb-1">
                    Contact Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rachel Adams"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-50 border border-brand-border rounded-xl px-3.5 py-2.5 text-xs text-brand-text focus:outline-none focus:border-brand-teal font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-text mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="rachel@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-brand-border rounded-xl px-3.5 py-2.5 text-xs text-brand-text focus:outline-none focus:border-brand-teal font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-text mb-1">
                    Mobile Phone Number (for SMS delivery) *
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-brand-muted absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210 or +1 555 123 4567"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full bg-slate-50 border border-brand-border rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-brand-text focus:outline-none focus:border-brand-teal font-medium"
                    />
                  </div>
                  <p className="text-[11px] text-brand-muted mt-1 leading-relaxed">
                    Enter with country code (e.g. <span className="font-mono text-brand-teal">+91</span> for India, <span className="font-mono text-brand-teal">+1</span> for US). 10-digit Indian numbers auto-default to +91.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-text mb-1">
                    Relationship
                  </label>
                  <select
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    className="w-full bg-slate-50 border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-text font-medium"
                  >
                    <option value="Friend">Friend</option>
                    <option value="Roommate">Roommate</option>
                    <option value="Sister">Sister</option>
                    <option value="Brother">Brother</option>
                    <option value="Mother">Mother</option>
                    <option value="Father">Father</option>
                    <option value="Partner">Partner / Spouse</option>
                    <option value="Colleague">Colleague</option>
                  </select>
                </div>
              </div>
            )}

            {/* STEP 2: Permissions & Escalation Tier */}
            {step === 2 && (
              <div className="space-y-3.5 mt-4 animate-fadeIn">
                <div>
                  <label className="block text-xs font-bold text-brand-text mb-1">
                    Escalation Priority Hierarchy
                  </label>
                  <select
                    value={escalationTier}
                    onChange={(e) => setEscalationTier(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-text font-medium"
                  >
                    <option value={1}>Tier 1 (Primary Responder — Notified First)</option>
                    <option value={2}>Tier 2 (Secondary Escalation Contact)</option>
                    <option value={3}>Tier 3 (Circle Member)</option>
                  </select>
                </div>

                <div className="space-y-2 pt-1">
                  <label className="flex items-center gap-2.5 text-xs text-brand-text cursor-pointer p-3 rounded-xl bg-slate-50 border border-brand-border">
                    <input
                      type="checkbox"
                      checked={canViewLocation}
                      onChange={(e) => setCanViewLocation(e.target.checked)}
                      className="rounded border-brand-border text-brand-teal focus:ring-brand-teal"
                    />
                    <span>
                      <strong className="block font-bold">Location Permission</strong>
                      Authorize this contact to view transit distance and GPS when you enable sharing.
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs text-brand-text cursor-pointer p-3 rounded-xl bg-slate-50 border border-brand-border">
                    <input
                      type="checkbox"
                      checked={canReceiveDistress}
                      onChange={(e) => setCanReceiveDistress(e.target.checked)}
                      className="rounded border-brand-border text-brand-teal focus:ring-brand-teal"
                    />
                    <span>
                      <strong className="block font-bold">Emergency Distress Alerts</strong>
                      Include in broadcast notifications when Urgent Assistance is triggered.
                    </span>
                  </label>
                </div>

                {/* Advanced Options */}
                <details className="group border border-brand-border rounded-2xl p-3 bg-white">
                  <summary className="text-xs font-bold text-brand-teal cursor-pointer list-none flex items-center justify-between">
                    <span>Advanced Options (Medical Data Sharing)</span>
                    <ChevronRight className="w-3.5 h-3.5 transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="pt-2 mt-2 border-t border-brand-border text-[11px] text-brand-muted">
                    Emergency responder notes and allergy data will be visible to this contact only while an active distress incident is open.
                  </div>
                </details>
              </div>
            )}

            {/* STEP 3: Review & Send Invitation */}
            {step === 3 && (
              <div className="space-y-4 mt-4 animate-fadeIn">
                <div className="p-4 bg-slate-50 border border-brand-border rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-brand-border">
                    <span className="text-[10px] uppercase font-bold text-brand-muted">
                      Invitation Summary
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-brand-aqua text-brand-teal border border-teal-200">
                      Tier {escalationTier} Responder
                    </span>
                  </div>

                  <p>
                    <strong>Name: </strong>
                    <span className="text-brand-text font-semibold">{fullName}</span> ({relationship})
                  </p>
                  <p>
                    <strong>Email: </strong>
                    <span className="text-brand-text font-mono">{email}</span>
                  </p>
                  <p>
                    <strong>Phone: </strong>
                    <span className="text-brand-text font-mono font-semibold">{phoneNumber}</span>
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-[11px] text-teal-900 leading-relaxed flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 text-brand-teal shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Real SMS Dispatch: </strong>
                    Clicking "Send Invitation SMS" sends an SMS to{' '}
                    <span className="font-mono font-bold text-brand-deepTeal">{phoneNumber}</span> via Twilio with a verification link. The contact remains in <strong className="font-bold text-amber-700">Pending</strong> state until they explicitly accept on their device.
                  </div>
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
                  onClick={handleClose}
                  className="px-4 py-2.5 rounded-xl border border-brand-border text-brand-muted hover:text-brand-text text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  disabled={step === 1 && (!fullName.trim() || !email.trim() || !phoneNumber.trim())}
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
                  className="px-5 py-2.5 rounded-xl bg-brand-teal hover:bg-brand-deepTeal text-white text-xs font-bold shadow-teal transition-all active:scale-[0.98] flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Dispatching SMS...</span>
                    </>
                  ) : (
                    <span>Send Invitation SMS</span>
                  )}
                </button>
              )}
            </div>
          </form>
        ) : (
          /* Real Post-Invitation Status View */
          <div className="space-y-4 py-2 animate-fadeIn">
            {inviteResult.success ? (
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-brand-aqua text-brand-teal flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 stroke-[2.2]" />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <StatusBadge status="sent" />
                    <span className="text-[10px] uppercase font-bold text-brand-muted">
                      Twilio REST API
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-brand-text">
                    SMS Dispatched to {fullName}
                  </h3>
                  <p className="text-xs text-brand-muted leading-relaxed mt-1">
                    An SMS invitation has been queued with carrier delivery to{' '}
                    <strong className="text-brand-text">{phoneNumber}</strong>.
                    {inviteResult.messageId && (
                      <span className="block font-mono text-[11px] text-brand-teal mt-0.5">
                        Message SID: {inviteResult.messageId}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <AlertTriangle className="w-7 h-7 stroke-[2.2]" />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <StatusBadge status="failed" />
                    <span className="text-[10px] uppercase font-bold text-amber-700">
                      SMS Notice
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-brand-text">
                    Contact Saved • SMS Gateway Notice
                  </h3>
                  <div className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-xl p-3 mt-2 leading-relaxed">
                    <p className="font-semibold">{inviteResult.error || 'Carrier delivery not completed.'}</p>
                    {inviteResult.error && inviteResult.error.includes('TWILIO_') && (
                      <p className="text-[11px] text-amber-800 mt-1.5">
                        To enable automated SMS delivery, configure <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">TWILIO_ACCOUNT_SID</code>, <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">TWILIO_AUTH_TOKEN</code>, and <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">TWILIO_PHONE_NUMBER</code> in Vercel project settings.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Generated Invitation Link */}
            <div className="p-3.5 bg-slate-50 border border-brand-border rounded-xl">
              <p className="text-[10px] text-brand-muted uppercase font-bold tracking-wider">
                Direct Verification Link (for {fullName})
              </p>
              <p className="font-mono text-xs text-brand-teal break-all mt-1 select-all bg-white p-2 rounded-lg border border-brand-border">
                {inviteResult.inviteUrl || `${window.location.origin}/invite?token=${inviteResult.token}`}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-brand-border text-[11px] text-brand-muted leading-relaxed">
              <strong className="text-brand-text">DigiSakhi Trust Protocol: </strong>
              {fullName} will remain in <strong className="text-amber-700">Pending</strong> status and cannot view your location or receive alerts until they click this link and tap <strong>"Accept Invitation"</strong>.
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-2">
              {!inviteResult.success && (
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`sms:${encodeURIComponent(phoneNumber)}?&body=${encodeURIComponent(
                      `DigiSakhi: ${currentUser.full_name} has invited you as their trusted emergency safety contact (${relationship}). Open this link to review and accept: ${inviteResult.inviteUrl || `${window.location.origin}/invite?token=${inviteResult.token}`}`
                    )}`}
                    className="py-2.5 px-3 bg-brand-aqua hover:bg-teal-100 text-brand-deepTeal border border-teal-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors active:scale-[0.99] text-center"
                  >
                    <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                    <span>Send via Phone SMS</span>
                  </a>

                  <a
                    href={`https://wa.me/${encodeURIComponent(phoneNumber.replace(/\D/g, ''))}?text=${encodeURIComponent(
                      `DigiSakhi: ${currentUser.full_name} has invited you as their trusted emergency safety contact (${relationship}). Open this link to review and accept: ${inviteResult.inviteUrl || `${window.location.origin}/invite?token=${inviteResult.token}`}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors active:scale-[0.99] text-center"
                  >
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    <span>Send via WhatsApp</span>
                  </a>
                </div>
              )}

              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-brand-text border border-brand-border rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors active:scale-[0.99]"
              >
                {copied ? <Check className="w-4 h-4 text-brand-teal" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Link Copied to Clipboard!' : 'Copy Invitation Link'}
              </button>

              <button
                type="button"
                onClick={handleOpenRecipientView}
                className="w-full py-2.5 bg-white hover:bg-slate-50 text-brand-text border border-brand-border rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors active:scale-[0.99]"
              >
                <ExternalLink className="w-4 h-4 text-brand-muted" />
                <span>Open Recipient Screen (Test in New Tab)</span>
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="w-full py-2.5 bg-brand-teal hover:bg-brand-deepTeal text-white rounded-xl text-xs font-bold shadow-teal transition-all active:scale-[0.98] mt-1"
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