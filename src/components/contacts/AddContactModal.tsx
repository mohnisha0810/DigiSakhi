import React, { useState } from 'react';
import { useSafeSphere } from '@/store/SafeSphereContext';
import { StepProgress } from '@/components/common/StepProgress';
import { StatusBadge } from '@/components/common/StatusBadge';
import { InvitationDeliveryStatus } from '@/types';
import {
  normalizePhoneNumber,
  buildInvitationMessage,
  triggerWhatsAppShare,
  triggerSmsShare,
  isMobileDevice,
} from '@/lib/messaging';
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
  Share2,
  Send,
  Info,
} from 'lucide-react';

interface InviteResultState {
  token: string;
  success: boolean;
  deliveryStatus: InvitationDeliveryStatus;
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
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

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
    setCopiedLink(false);
    setCopiedMsg(false);
    setValidationError(null);
    setActionNotice(null);
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
        setValidationError('Please enter a mobile phone number.');
        return;
      }
      const norm = normalizePhoneNumber(phoneNumber);
      if (!norm.valid) {
        setValidationError(norm.error || 'Please enter a valid 10-15 digit mobile number.');
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

    const norm = normalizePhoneNumber(phoneNumber);
    if (!norm.valid) {
      setValidationError(norm.error || 'Please enter a valid mobile number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await inviteContact({
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: norm.formattedSms,
        relationship,
        escalationOrder: escalationTier,
      });

      setInviteResult({
        token: result.token,
        success: true,
        deliveryStatus: result.deliveryStatus,
        inviteUrl: result.inviteUrl,
      });
    } catch (err: any) {
      setValidationError(err.message || 'An error occurred while creating the invitation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Invitation Message builder
  const fullInviteMessage = inviteResult
    ? buildInvitationMessage({
        inviterName: currentUser.full_name,
        relationship,
        inviteUrl: inviteResult.inviteUrl,
      })
    : '';

  const handleSendWhatsApp = () => {
    if (!inviteResult) return;
    setActionNotice('Opening WhatsApp...');
    const res = triggerWhatsAppShare(phoneNumber, fullInviteMessage);
    if (!res.success) {
      setValidationError(res.error || 'Could not open WhatsApp. Please check the phone number or use copy message.');
    } else {
      setTimeout(() => setActionNotice(null), 3000);
    }
  };

  const handleSendSms = () => {
    if (!inviteResult) return;
    const res = triggerSmsShare(phoneNumber, fullInviteMessage);
    if (!res.success) {
      setValidationError(res.error || 'Could not launch SMS app. Please use Copy Message below.');
    } else if (!res.isMobile) {
      setActionNotice('SMS message copied to clipboard! Paste it into your desktop messaging app (iMessage, Skype, etc.).');
      setTimeout(() => setActionNotice(null), 5000);
    } else {
      setActionNotice('Launching your phone\'s Messages app...');
      setTimeout(() => setActionNotice(null), 3000);
    }
  };

  const handleCopyMessage = () => {
    if (!fullInviteMessage) return;
    navigator.clipboard.writeText(fullInviteMessage);
    setCopiedMsg(true);
    setActionNotice('Full invitation message copied to clipboard!');
    setTimeout(() => {
      setCopiedMsg(false);
      setActionNotice(null);
    }, 3000);
  };

  const handleCopyLinkOnly = () => {
    if (!inviteResult) return;
    navigator.clipboard.writeText(inviteResult.inviteUrl);
    setCopiedLink(true);
    setActionNotice('Invitation link copied to clipboard!');
    setTimeout(() => {
      setCopiedLink(false);
      setActionNotice(null);
    }, 3000);
  };

  const handleOpenRecipientView = () => {
    if (!inviteResult) return;
    window.open(inviteResult.inviteUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-brand-border rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-elevated relative my-8 animate-fadeIn">
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
              <div className="w-10 h-10 rounded-xl bg-[#F2EDFF] text-[#5517C8] flex items-center justify-center shrink-0 border border-[#5517C8]/20">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#211638]">Add Trusted Contact</h3>
                <p className="text-xs text-[#716B80]">
                  Add a verified responder and send an invite via WhatsApp or SMS.
                </p>
              </div>
            </div>

            {/* Step Indicator */}
            <StepProgress steps={steps} currentStep={step} accentColor="violet" />

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
                    Mobile Phone Number (for WhatsApp / SMS) *
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-brand-muted absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210 or +91 98765 43210"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full bg-slate-50 border border-brand-border rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-brand-text focus:outline-none focus:border-brand-teal font-medium"
                    />
                  </div>
                  <p className="text-[11px] text-brand-muted mt-1 leading-relaxed">
                    Indian numbers (10 digits starting with 6-9) auto-format to <span className="font-mono text-brand-teal font-semibold">+91</span>. International numbers are supported.
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
                  <Share2 className="w-4 h-4 text-brand-teal shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Instant Device Sharing: </strong>
                    On the next screen, you will be able to dispatch the invitation directly via{' '}
                    <strong>WhatsApp</strong> or your phone's <strong>Messages (SMS)</strong> app. No third-party SMS provider setup required.
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
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#5517C8] to-[#365BFF] hover:from-[#4510AB] hover:to-[#2A48D9] disabled:opacity-50 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all active:scale-[0.98]"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#5517C8] to-[#365BFF] hover:from-[#4510AB] hover:to-[#2A48D9] text-white text-xs font-bold shadow-md transition-all active:scale-[0.98] flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Contact...</span>
                    </>
                  ) : (
                    <span>Create & Send Invitation</span>
                  )}
                </button>
              )}
            </div>
          </form>
        ) : (
          /* User-Initiated Sharing View */
          <div className="space-y-4 py-2 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-aqua text-brand-teal flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-7 h-7 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <StatusBadge status="pending" />
                  <span className="text-[10px] uppercase font-bold text-brand-muted">
                    Tier {escalationTier} Responder
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-brand-text">
                  Invitation Ready for {fullName}
                </h3>
                <p className="text-xs text-brand-muted">
                  Choose your messaging app to send the invitation to <strong className="text-brand-text">{phoneNumber}</strong>:
                </p>
              </div>
            </div>

            {/* Action Notice Toast */}
            {actionNotice && (
              <div className="p-3 bg-brand-aqua border border-teal-200 rounded-xl text-brand-deepTeal text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                <Check className="w-4 h-4 shrink-0 text-brand-teal" />
                <span>{actionNotice}</span>
              </div>
            )}

            {/* Primary Sharing Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
              >
                <Phone className="w-4 h-4 fill-current" />
                <span>Send via WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleSendSms}
                className="py-3 px-4 bg-[#5517C8] hover:bg-[#4510AB] text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
              >
                <MessageSquare className="w-4 h-4 fill-current" />
                <span>Send via Messages (SMS)</span>
              </button>
            </div>

            {/* Complete Invitation Message Preview Box */}
            <div className="p-3.5 bg-slate-50 border border-[#E8E1F3] rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#716B80] uppercase font-bold tracking-wider">
                  Invitation Message Preview
                </span>
                <span className="text-[10px] text-[#5517C8] font-mono font-semibold">
                  {phoneNumber}
                </span>
              </div>
              <p className="font-mono text-xs text-[#211638] bg-white p-3 rounded-xl border border-[#E8E1F3] whitespace-pre-wrap select-all leading-relaxed max-h-36 overflow-y-auto">
                {fullInviteMessage}
              </p>
            </div>

            {/* Direct Copy Options */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCopyMessage}
                className="py-2.5 px-3 bg-white hover:bg-[#F2EDFF] text-[#211638] border border-[#E8E1F3] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs active:scale-[0.99]"
              >
                {copiedMsg ? <Check className="w-4 h-4 text-[#16865C]" /> : <Copy className="w-4 h-4 text-[#716B80]" />}
                <span>{copiedMsg ? 'Message Copied!' : 'Copy Message'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLinkOnly}
                className="py-2.5 px-3 bg-white hover:bg-[#F2EDFF] text-[#211638] border border-[#E8E1F3] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs active:scale-[0.99]"
              >
                {copiedLink ? <Check className="w-4 h-4 text-[#16865C]" /> : <Copy className="w-4 h-4 text-[#716B80]" />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Link Only'}</span>
              </button>
            </div>

            {/* Verification / Security Protocol Notice */}
            <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
              <strong className="font-bold">DigiSakhi Security Rule: </strong>
              {fullName} is saved in <strong className="text-amber-800">Pending</strong> state. They cannot view your live location or receive distress broadcasts until they open your link and click <strong>"Accept Invitation"</strong>.
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={handleOpenRecipientView}
                className="w-full py-2.5 bg-slate-100 hover:bg-[#F2EDFF] text-[#211638] border border-[#E8E1F3] rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors active:scale-[0.99]"
              >
                <ExternalLink className="w-4 h-4 text-[#716B80]" />
                <span>Test Recipient Screen (Opens in New Tab)</span>
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="w-full py-2.5 bg-gradient-to-r from-[#5517C8] to-[#365BFF] hover:from-[#4510AB] hover:to-[#2A48D9] text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-[0.98]"
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
