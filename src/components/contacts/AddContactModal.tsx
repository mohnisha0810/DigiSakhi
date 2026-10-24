import React, { useState } from 'react';
import { useSafeSphere } from '@/store/SafeSphereContext';
import { StepProgress } from '@/components/common/StepProgress';
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
} from 'lucide-react';

export const AddContactModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { inviteContact, contacts, acceptInvitation, invitations } = useSafeSphere();

  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [relationship, setRelationship] = useState('Friend');
  const [escalationTier, setEscalationTier] = useState<number>(contacts.length + 1);
  const [canViewLocation, setCanViewLocation] = useState(true);
  const [canReceiveDistress, setCanReceiveDistress] = useState(true);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const steps = [
    { id: 1, label: 'Details' },
    { id: 2, label: 'Permissions' },
    { id: 3, label: 'Invite' },
  ];

  const handleNext = () => {
    if (step === 1 && (!fullName.trim() || !email.trim())) return;
    setStep((prev) => Math.min(prev + 1, 3));
  };
  const handleBack = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;

    setIsSubmitting(true);
    try {
      const token = await inviteContact({
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim() || '+1 (555) 000-0000',
        relationship,
        escalationOrder: escalationTier,
      });

      setGeneratedToken(token);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://safesphere.demo/invite?token=${generatedToken}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDevAcceptNow = () => {
    const inv = invitations.find((i) => i.invitation_token === generatedToken);
    if (inv) {
      acceptInvitation(inv.id);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-brand-border rounded-3xl max-w-md w-full p-6 shadow-elevated relative my-8 animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-brand-muted hover:text-brand-text p-1 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!generatedToken ? (
          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-brand-aqua text-brand-teal flex items-center justify-center">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-brand-text">Add Trusted Contact</h3>
                <p className="text-xs text-brand-muted">
                  Add a verified responder to your safety escalation chain.
                </p>
              </div>
            </div>

            {/* Step Indicator */}
            <StepProgress steps={steps} currentStep={step} accentColor="teal" />

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

                <div className="grid grid-cols-2 gap-3">
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

                  <div>
                    <label className="block text-xs font-bold text-brand-text mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full bg-slate-50 border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-text font-medium"
                    />
                  </div>
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
                    <span className="text-brand-text">{fullName}</span> ({relationship})
                  </p>
                  <p>
                    <strong>Email: </strong>
                    <span className="text-brand-text font-mono">{email}</span>
                  </p>
                  <p>
                    <strong>Phone: </strong>
                    <span className="text-brand-text">{phoneNumber || 'On file'}</span>
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                  <strong className="font-bold">Privacy rule: </strong>
                  The contact will be saved in an actual <strong className="font-bold text-amber-700">Pending</strong> state and will not receive any safety alerts until they explicitly accept your invitation token.
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

              {step < 3 ? (
                <button
                  type="button"
                  disabled={step === 1 && (!fullName.trim() || !email.trim())}
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
                  {isSubmitting ? 'Creating Invitation...' : 'Send Invitation Token'}
                </button>
              )}
            </div>
          </form>
        ) : (
          /* Actual Invitation Status Screen */
          <div className="space-y-4 py-2 animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-brand-aqua text-brand-teal flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 stroke-[2.2]" />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                  Status: Pending Acceptance
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-brand-text">
                Invitation Created for {fullName}
              </h3>
              <p className="text-xs text-brand-muted leading-relaxed mt-1">
                Your contact has been saved with a unique verification token. Until accepted, they cannot view your active sessions or receive distress alerts.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-brand-border rounded-xl">
              <p className="text-[10px] text-brand-muted uppercase font-bold tracking-wider">
                Generated Invitation Link
              </p>
              <p className="font-mono text-xs text-brand-teal truncate mt-1">
                https://safesphere.demo/invite?token={generatedToken}
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-brand-text border border-brand-border rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-brand-teal" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Link Copied to Clipboard!' : 'Copy Invitation Link'}
              </button>

              <button
                type="button"
                onClick={handleDevAcceptNow}
                className="w-full py-2.5 bg-brand-teal hover:bg-brand-deepTeal text-white rounded-xl text-xs font-bold shadow-teal transition-all active:scale-[0.98]"
              >
                Simulate Recipient Acceptance (Dev Mode)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
