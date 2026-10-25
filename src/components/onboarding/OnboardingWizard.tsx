import React, { useState, useEffect } from 'react';
import { useSafeSphere } from '@/store/SafeSphereContext';
import { DigiSakhiLogo } from '@/components/common/DigiSakhiLogo';
import {
  triggerWhatsAppShare,
  triggerSmsShare,
  isMobileDevice,
} from '@/lib/messaging';
import {
  Shield,
  ShieldCheck,
  CheckCircle2,
  Clock,
  PhoneCall,
  Users,
  MapPin,
  ArrowRight,
  ArrowLeft,
  UserPlus,
  Send,
  MessageSquare,
  Share2,
  AlertTriangle,
  Info,
  Check,
  Sparkles,
  Phone,
  Mail,
  User,
  Sliders,
  Copy,
  ExternalLink,
} from 'lucide-react';

export const OnboardingWizard: React.FC = () => {
  const {
    currentUser,
    contacts,
    inviteContact,
    completeOnboardingStep,
    finishOnboarding,
    updateUserProfile,
    signOut,
  } = useSafeSphere();

  // Step indicator: 1 to 5 (restore from user's saved onboarding_step if present)
  const [currentStep, setCurrentStep] = useState<number>(() => {
    return currentUser.onboarding_step && currentUser.onboarding_step >= 1 && currentUser.onboarding_step <= 5
      ? currentUser.onboarding_step
      : 1;
  });

  const [saving, setSaving] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);

  // --- Step 1 State: Profile Confirmation ---
  const [fullName, setFullName] = useState(currentUser.full_name || '');
  const [phoneNumber, setPhoneNumber] = useState(currentUser.phone_number || '');
  const [emergencyNotes, setEmergencyNotes] = useState(currentUser.emergency_notes || '');

  // --- Step 2 State: Add Trusted Contact ---
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactRel, setContactRel] = useState('Friend');
  const [escalationOrder, setEscalationOrder] = useState<1 | 2>(1);
  const [inviting, setInviting] = useState(false);
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);
  const [lastInvitedPhone, setLastInvitedPhone] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // --- Step 3 State: Check-in Preferences ---
  const [checkInsEnabled, setCheckInsEnabled] = useState(
    currentUser.check_in_preferences?.enabled ?? true
  );
  const [checkInInterval, setCheckInInterval] = useState<number>(
    currentUser.check_in_preferences?.interval_minutes ?? 10
  );
  const [countdownSeconds, setCountdownSeconds] = useState<number>(
    currentUser.check_in_preferences?.countdown_seconds ?? 120
  );
  const [notificationType, setNotificationType] = useState<'in_app' | 'chime' | 'browser_push'>(
    currentUser.check_in_preferences?.notification_type ?? 'in_app'
  );

  // --- Step 4 State: Emergency Preferences ---
  const [tier1ContactId, setTier1ContactId] = useState<string>(
    currentUser.emergency_preferences?.tier1_contact_id || ''
  );
  const [tier2ContactId, setTier2ContactId] = useState<string>(
    currentUser.emergency_preferences?.tier2_contact_id || ''
  );
  const [emergencyNumber, setEmergencyNumber] = useState<string>(
    currentUser.emergency_preferences?.emergency_number || '112'
  );
  const [shareLocationInEmergency, setShareLocationInEmergency] = useState<boolean>(
    currentUser.emergency_preferences?.share_location ?? true
  );

  // Sync state if currentUser changes
  useEffect(() => {
    if (currentUser.onboarding_step && currentUser.onboarding_step > currentStep) {
      setCurrentStep(currentUser.onboarding_step);
    }
  }, [currentUser]);

  // Tier 1 and Tier 2 contacts lists
  const tier1Contacts = contacts.filter((c) => c.escalation_order === 1);
  const tier2Contacts = contacts.filter((c) => c.escalation_order === 2);

  // Default Tier 1 / Tier 2 selection if contacts exist
  useEffect(() => {
    if (!tier1ContactId && tier1Contacts.length > 0) {
      setTier1ContactId(tier1Contacts[0].id);
    }
    if (!tier2ContactId && tier2Contacts.length > 0) {
      setTier2ContactId(tier2Contacts[0].id);
    }
  }, [contacts]);

  // --- Step 1 Action: Save Profile & Continue ---
  const handleStep1Continue = async () => {
    if (!fullName.trim()) {
      setStepError('Please enter your full name.');
      return;
    }
    setStepError(null);
    setSaving(true);
    try {
      await completeOnboardingStep(2, {
        full_name: fullName.trim(),
        phone_number: phoneNumber.trim(),
        emergency_notes: emergencyNotes.trim(),
      });
      setCurrentStep(2);
    } catch (err: any) {
      setStepError(err.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  // --- Step 2 Action: Send Contact Invite ---
  const handleInviteContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setStepError(null);
    if (!contactName.trim()) {
      setStepError('Please enter the contact’s name.');
      return;
    }
    if (!contactPhone.trim() && !contactEmail.trim()) {
      setStepError('Please provide either a phone number or email.');
      return;
    }

    setInviting(true);
    try {
      const result = await inviteContact({
        fullName: contactName.trim(),
        phoneNumber: contactPhone.trim(),
        email: contactEmail.trim() || `${contactName.trim().toLowerCase().replace(/\s+/g, '.')}@contact.local`,
        relationship: contactRel,
        escalationOrder,
      });

      setLastInviteUrl(result.inviteUrl);
      setLastInvitedPhone(contactPhone.trim());

      // Reset form fields
      setContactName('');
      setContactPhone('');
      setContactEmail('');
    } catch (err: any) {
      setStepError(err.message || 'Failed to send invitation.');
    } finally {
      setInviting(false);
    }
  };

  const handleStep2Continue = async () => {
    setStepError(null);
    setSaving(true);
    try {
      await completeOnboardingStep(3);
      setCurrentStep(3);
    } catch (err: any) {
      setStepError(err.message || 'Failed to advance step.');
    } finally {
      setSaving(false);
    }
  };

  // --- Step 3 Action: Save Check-in Preferences ---
  const handleStep3Continue = async () => {
    setStepError(null);
    setSaving(true);
    try {
      await completeOnboardingStep(4, {
        check_in_preferences: {
          enabled: checkInsEnabled,
          interval_minutes: checkInInterval,
          countdown_seconds: countdownSeconds,
          notification_type: notificationType,
        },
      });
      setCurrentStep(4);
    } catch (err: any) {
      setStepError(err.message || 'Failed to save check-in preferences.');
    } finally {
      setSaving(false);
    }
  };

  // --- Step 4 Action: Save Emergency Preferences ---
  const handleStep4Continue = async () => {
    setStepError(null);
    if (!emergencyNumber.trim()) {
      setStepError('Please provide an emergency phone helpline.');
      return;
    }
    setSaving(true);
    try {
      await completeOnboardingStep(5, {
        emergency_preferences: {
          tier1_contact_id: tier1ContactId || undefined,
          tier2_contact_id: tier2ContactId || undefined,
          emergency_number: emergencyNumber.trim(),
          share_location: shareLocationInEmergency,
        },
      });
      setCurrentStep(5);
    } catch (err: any) {
      setStepError(err.message || 'Failed to save emergency preferences.');
    } finally {
      setSaving(false);
    }
  };

  // --- Step 5 Action: Finish Onboarding & Go to Dashboard ---
  const handleFinish = async () => {
    setStepError(null);
    setSaving(true);
    try {
      await finishOnboarding();
    } catch (err: any) {
      setStepError(err.message || 'Failed to finish onboarding.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyInviteLink = () => {
    if (!lastInviteUrl) return;
    navigator.clipboard.writeText(lastInviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const firstName = fullName.split(' ')[0] || 'Friend';

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col font-sans selection:bg-brand-aqua selection:text-brand-deepTeal">
      {/* Top Header */}
      <header className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between border-b border-brand-border/60">
        <DigiSakhiLogo size="md" subtitle="Safety Setup" />
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-brand-muted">
            Step {currentStep} of 5
          </span>
          <button
            onClick={() => signOut()}
            className="text-xs font-semibold text-brand-muted hover:text-brand-coral transition-colors px-2.5 py-1 rounded-lg hover:bg-slate-100"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col">
        {/* Progress Bar */}
        <div className="w-full mb-8">
          <div className="flex items-center justify-between text-xs font-bold text-brand-muted mb-2">
            <span className={currentStep >= 1 ? 'text-brand-teal' : ''}>1. Welcome</span>
            <span className={currentStep >= 2 ? 'text-brand-teal' : ''}>2. Circle</span>
            <span className={currentStep >= 3 ? 'text-brand-teal' : ''}>3. Check-ins</span>
            <span className={currentStep >= 4 ? 'text-brand-teal' : ''}>4. Emergency</span>
            <span className={currentStep >= 5 ? 'text-brand-teal' : ''}>5. Ready</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-teal to-brand-violet transition-all duration-300 rounded-full"
              style={{ width: `${(currentStep / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Global Step Error Alert */}
        {stepError && (
          <div className="mb-6 p-3.5 bg-brand-peach border border-brand-coral/40 rounded-xl text-brand-coral text-xs flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span className="font-semibold">{stepError}</span>
            </div>
            <button onClick={() => setStepError(null)} className="font-bold text-xs p-1">
              ✕
            </button>
          </div>
        )}

        {/* Step Cards */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-card relative flex-1 flex flex-col justify-between">
          {/* ========================================================================= */}
          {/* STEP 1: WELCOME TO DIGISAKHI */}
          {/* ========================================================================= */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-brand-aqua text-brand-teal flex items-center justify-center shadow-xs">
                  <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
                </div>
                <h2 className="text-2xl font-extrabold text-brand-text tracking-tight">
                  Welcome to DigiSakhi!
                </h2>
                <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
                  DigiSakhi is your dedicated personal safety companion. In the next few quick steps, we'll set up your trusted contact circle, automated journey check-ins, and emergency response preferences.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-brand-text mb-1.5">
                    Confirm Your Display Name <span className="text-brand-coral">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-brand-muted absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Priya Sharma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-brand-bg border border-brand-border rounded-xl pl-9 pr-3 py-2.5 text-xs text-brand-text focus:outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal/20"
                    />
                  </div>
                  <p className="text-[11px] text-brand-muted mt-1">
                    This name will appear on your dashboard greeting and in emergency invitations.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-text mb-1.5">
                    Your Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-brand-muted absolute left-3 top-3" />
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full bg-brand-bg border border-brand-border rounded-xl pl-9 pr-3 py-2.5 text-xs text-brand-text focus:outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-text mb-1.5">
                    Emergency Notes or Medical Info (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Blood type O+, Asthma inhaler in bag, Allergies"
                    value={emergencyNotes}
                    onChange={(e) => setEmergencyNotes(e.target.value)}
                    className="w-full bg-brand-bg border border-brand-border rounded-xl p-3 text-xs text-brand-text focus:outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal/20 resize-none"
                  />
                  <p className="text-[11px] text-brand-muted mt-1">
                    Discreetly included in high-priority SOS dispatches to your trusted contacts.
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-brand-border flex justify-end">
                <button
                  type="button"
                  onClick={handleStep1Continue}
                  disabled={saving}
                  className="px-7 py-3 bg-gradient-to-r from-[#5517C8] to-[#365BFF] hover:from-[#4510AB] hover:to-[#2A48D9] text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <span>{saving ? 'Saving...' : 'Continue'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: ADD TRUSTED CONTACTS */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-1.5">
                <div className="w-10 h-10 rounded-2xl bg-brand-aqua text-brand-teal flex items-center justify-center shadow-xs">
                  <Users className="w-5 h-5 stroke-[2.5]" />
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-brand-text tracking-tight">
                  Add Your Trusted Contacts
                </h2>
                <p className="text-xs text-brand-muted leading-relaxed">
                  Choose the people you trust and may want to contact during a safety situation. You can organize them into <strong>Tier 1</strong> (Primary responder) and <strong>Tier 2</strong> (Backup responder).
                </p>
              </div>

              {/* Add Contact Form */}
              <form onSubmit={handleInviteContact} className="p-4 bg-brand-bg rounded-2xl border border-brand-border space-y-3">
                <p className="text-xs font-extrabold text-brand-text flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-brand-teal" />
                  <span>Invite a Trusted Responder</span>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-brand-text mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Priya Sharma"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full bg-white border border-brand-border rounded-lg px-3 py-2 text-xs text-brand-text focus:outline-none focus:border-brand-teal"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-brand-text mb-1">
                      Mobile Number (for SMS / WhatsApp) *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +91 98765 43210"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full bg-white border border-brand-border rounded-lg px-3 py-2 text-xs text-brand-text focus:outline-none focus:border-brand-teal"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-brand-text mb-1">
                      Relationship
                    </label>
                    <select
                      value={contactRel}
                      onChange={(e) => setContactRel(e.target.value)}
                      className="w-full bg-white border border-brand-border rounded-lg px-3 py-2 text-xs text-brand-text focus:outline-none focus:border-brand-teal"
                    >
                      <option value="Friend">Friend</option>
                      <option value="Roommate">Roommate</option>
                      <option value="Parent">Parent</option>
                      <option value="Sister">Sister</option>
                      <option value="Partner">Partner</option>
                      <option value="Colleague">Colleague</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-brand-text mb-1">
                      Responder Tier
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEscalationOrder(1)}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors ${
                          escalationOrder === 1
                            ? 'bg-brand-aqua text-brand-deepTeal border-brand-teal'
                            : 'bg-white text-brand-muted border-brand-border'
                        }`}
                      >
                        Tier 1 (Primary)
                      </button>
                      <button
                        type="button"
                        onClick={() => setEscalationOrder(2)}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors ${
                          escalationOrder === 2
                            ? 'bg-brand-lavender text-brand-violet border-brand-violet'
                            : 'bg-white text-brand-muted border-brand-border'
                        }`}
                      >
                        Tier 2 (Backup)
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[11px] text-brand-muted">
                    Generates a secure, 1-click invitation token
                  </span>
                  <button
                    type="submit"
                    disabled={inviting}
                    className="px-4 py-2 bg-gradient-to-r from-[#5517C8] to-[#365BFF] hover:from-[#4510AB] hover:to-[#2A48D9] text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{inviting ? 'Generating...' : 'Send Invitation'}</span>
                  </button>
                </div>
              </form>

              {/* Share Invitation Drawer if token generated */}
              {lastInviteUrl && (
                <div className="p-4 bg-brand-aqua/40 border border-brand-teal/30 rounded-2xl space-y-2.5 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-brand-teal" />
                      <span className="text-xs font-extrabold text-brand-deepTeal">
                        Invitation Link Generated
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyInviteLink}
                      className="px-2.5 py-1 rounded-lg bg-white border border-brand-teal/30 text-brand-deepTeal text-[11px] font-bold flex items-center gap-1 hover:bg-teal-50"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-brand-muted leading-relaxed">
                    Share this link with your contact so they can review safety permissions and connect to your circle:
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        triggerWhatsAppShare(
                          lastInvitedPhone || '',
                          `DigiSakhi: ${fullName} invited you to their trusted circle. Tap to accept: ${lastInviteUrl}`
                        )
                      }
                      className="px-3 py-1.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share on WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        triggerSmsShare(
                          lastInvitedPhone || '',
                          `DigiSakhi: ${fullName} invited you to their trusted circle. Tap to accept: ${lastInviteUrl}`
                        )
                      }
                      className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Open Native SMS</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Added Contacts List */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-brand-text">
                  Your Trusted Circle ({contacts.length})
                </p>
                {contacts.length === 0 ? (
                  <div className="p-4 bg-brand-bg rounded-xl border border-brand-border text-center text-xs text-brand-muted">
                    No contacts added yet. Add at least one Tier 1 contact, or skip and add later.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {contacts.map((c) => (
                      <div
                        key={c.id}
                        className="p-3 bg-white rounded-xl border border-brand-border flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-brand-teal/10 text-brand-teal flex items-center justify-center font-bold text-[11px]">
                            {c.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-brand-text">
                              {c.full_name}{' '}
                              <span className="text-[10px] text-brand-muted font-normal">
                                ({c.relationship})
                              </span>
                            </p>
                            <p className="text-[10px] text-brand-muted">{c.phone_number}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              c.escalation_order === 1
                                ? 'bg-brand-aqua text-brand-deepTeal'
                                : 'bg-brand-lavender text-brand-violet'
                            }`}
                          >
                            Tier {c.escalation_order}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              c.status === 'accepted'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {c.status === 'accepted' ? 'Connected' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Explanatory note */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-brand-muted leading-relaxed">
                <span className="font-bold text-brand-text">Note on Invitations: </span>
                A trusted contact must open their invitation link to accept the relationship. Once connected, they can receive your check-in escalation alerts and live GPS dispatches.
              </div>

              {/* Navigation Actions */}
              <div className="pt-4 border-t border-brand-border flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2.5 text-xs font-bold text-brand-muted hover:text-brand-text transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <div className="flex items-center gap-3">
                  {contacts.length === 0 && (
                    <button
                      type="button"
                      onClick={handleStep2Continue}
                      className="text-xs font-bold text-brand-muted hover:text-brand-text underline transition-colors"
                    >
                      Skip for now
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleStep2Continue}
                    disabled={saving}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#5517C8] to-[#365BFF] hover:from-[#4510AB] hover:to-[#2A48D9] text-white rounded-xl text-xs font-extrabold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <span>{saving ? 'Saving...' : 'Save & Continue'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: CONFIGURE SAFETY CHECK-INS */}
          {/* ========================================================================= */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-1.5">
                <div className="w-10 h-10 rounded-2xl bg-brand-aqua text-brand-teal flex items-center justify-center shadow-xs">
                  <Clock className="w-5 h-5 stroke-[2.5]" />
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-brand-text tracking-tight">
                  Configure Safety Check-Ins
                </h2>
                <p className="text-xs text-brand-muted leading-relaxed">
                  DigiSakhi can help you confirm that you're safe at regular intervals during a journey. Check-in timers begin when you actively start a safety journey from your dashboard.
                </p>
              </div>

              {/* Check-ins Toggle */}
              <div className="p-4 bg-brand-bg rounded-2xl border border-brand-border flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-brand-text">
                    Enable Automatic Check-In Prompts
                  </h4>
                  <p className="text-[11px] text-brand-muted">
                    Prompt you with a 1-tap "I'm Okay" button during your journey
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkInsEnabled}
                    onChange={(e) => setCheckInsEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5517C8]"></div>
                </label>
              </div>

              {/* Check-In Interval Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-brand-text">
                  Preferred Check-In Interval
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[5, 10, 15, 30].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setCheckInInterval(mins)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        checkInInterval === mins
                          ? 'bg-brand-aqua text-brand-deepTeal border-brand-teal font-extrabold shadow-xs'
                          : 'bg-white text-brand-text border-brand-border hover:bg-slate-50 text-xs'
                      }`}
                    >
                      <div className="text-sm font-black">{mins} mins</div>
                      <div className="text-[10px] text-brand-muted">
                        {mins === 10 ? 'Recommended' : mins === 5 ? 'High Alert' : 'Standard Commute'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Response Countdown Window */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-brand-text">
                  Response Countdown Window
                </label>
                <p className="text-[11px] text-brand-muted">
                  How long you have to tap "I'm Okay" before DigiSakhi alerts your Tier 1 contact.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { secs: 60, label: '60 secs (1 min)' },
                    { secs: 120, label: '120 secs (2 mins)' },
                    { secs: 180, label: '180 secs (3 mins)' },
                    { secs: 300, label: '300 secs (5 mins)' },
                  ].map((opt) => (
                    <button
                      key={opt.secs}
                      type="button"
                      onClick={() => setCountdownSeconds(opt.secs)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        countdownSeconds === opt.secs
                          ? 'bg-brand-lavender text-brand-violet border-brand-violet font-extrabold shadow-xs'
                          : 'bg-white text-brand-text border-brand-border hover:bg-slate-50 text-xs'
                      }`}
                    >
                      <span className="text-xs font-bold">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notification Banner */}
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">Transparent Timer Notice: </strong>
                  Check-in timers will NOT start immediately. A timer only activates when you explicitly launch a safety journey from your dashboard.
                </div>
              </div>

              {/* Navigation Actions */}
              <div className="pt-4 border-t border-brand-border flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2.5 text-xs font-bold text-brand-muted hover:text-brand-text transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={handleStep3Continue}
                  disabled={saving}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#5517C8] to-[#365BFF] hover:from-[#4510AB] hover:to-[#2A48D9] text-white rounded-xl text-xs font-extrabold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <span>{saving ? 'Saving...' : 'Save & Continue'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: EMERGENCY PREFERENCES */}
          {/* ========================================================================= */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-1.5">
                <div className="w-10 h-10 rounded-2xl bg-brand-peach text-brand-coral flex items-center justify-center shadow-xs">
                  <PhoneCall className="w-5 h-5 stroke-[2.5]" />
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-brand-text tracking-tight">
                  Emergency & Escalation Preferences
                </h2>
                <p className="text-xs text-brand-muted leading-relaxed">
                  Configure emergency calling order, helpline numbers, and location-sharing permissions.
                </p>
              </div>

              <div className="space-y-4">
                {/* Emergency Helpline Number */}
                <div>
                  <label className="block text-xs font-bold text-brand-text mb-1">
                    Emergency Phone Helpline <span className="text-brand-coral">*</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEmergencyNumber('112')}
                      className={`px-3 py-2 rounded-xl text-xs font-extrabold border transition-colors ${
                        emergencyNumber === '112'
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-brand-text border-brand-border'
                      }`}
                    >
                      112 (National Helpline)
                    </button>
                    <input
                      type="tel"
                      placeholder="Or enter custom number (e.g. 1091)"
                      value={emergencyNumber}
                      onChange={(e) => setEmergencyNumber(e.target.value)}
                      className="flex-1 bg-brand-bg border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-text focus:outline-none focus:border-brand-teal"
                    />
                  </div>
                  <p className="text-[11px] text-brand-muted mt-1">
                    112 is India's all-in-one emergency helpline for police, medical, and fire assistance.
                  </p>
                </div>

                {/* Primary Tier 1 Contact selector */}
                <div>
                  <label className="block text-xs font-bold text-brand-text mb-1">
                    Primary Tier 1 Contact
                  </label>
                  {tier1Contacts.length > 0 ? (
                    <select
                      value={tier1ContactId}
                      onChange={(e) => setTier1ContactId(e.target.value)}
                      className="w-full bg-brand-bg border border-brand-border rounded-xl px-3 py-2.5 text-xs text-brand-text focus:outline-none focus:border-brand-teal"
                    >
                      {tier1Contacts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.full_name} ({c.phone_number}) - {c.relationship}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-brand-muted">
                      No Tier 1 contacts in your circle. Add one later in Trusted Circle.
                    </div>
                  )}
                </div>

                {/* Backup Tier 2 Contact selector */}
                <div>
                  <label className="block text-xs font-bold text-brand-text mb-1">
                    Backup Tier 2 Contact (Optional)
                  </label>
                  {tier2Contacts.length > 0 ? (
                    <select
                      value={tier2ContactId}
                      onChange={(e) => setTier2ContactId(e.target.value)}
                      className="w-full bg-brand-bg border border-brand-border rounded-xl px-3 py-2.5 text-xs text-brand-text focus:outline-none focus:border-brand-teal"
                    >
                      <option value="">None selected</option>
                      {tier2Contacts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.full_name} ({c.phone_number}) - {c.relationship}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-brand-muted">
                      No Tier 2 backup contact added yet.
                    </div>
                  )}
                </div>

                {/* Location Sharing Toggle */}
                <div className="p-4 bg-brand-bg rounded-2xl border border-brand-border flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-brand-text">
                      Broadcast Live GPS During Emergency SOS
                    </h4>
                    <p className="text-[11px] text-brand-muted">
                      Embeds current Google Maps coordinates into SOS WhatsApp & SMS messages
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shareLocationInEmergency}
                      onChange={(e) => setShareLocationInEmergency(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-coral"></div>
                  </label>
                </div>
              </div>

              {/* Navigation Actions */}
              <div className="pt-4 border-t border-brand-border flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-4 py-2.5 text-xs font-bold text-brand-muted hover:text-brand-text transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={handleStep4Continue}
                  disabled={saving}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#5517C8] to-[#365BFF] hover:from-[#4510AB] hover:to-[#2A48D9] text-white rounded-xl text-xs font-extrabold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <span>{saving ? 'Saving...' : 'Save & Continue'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 5: READY TO BEGIN */}
          {/* ========================================================================= */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-fadeIn text-center">
              <div className="flex flex-col items-center space-y-2">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-teal via-teal-400 to-brand-violet text-white flex items-center justify-center shadow-lg shadow-teal-500/25 mb-1">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-brand-text tracking-tight">
                  You're all set, {firstName}!
                </h2>
                <p className="text-xs sm:text-sm text-brand-muted max-w-md leading-relaxed">
                  Your DigiSakhi personal safety shield is configured and tailored to your safety rules. Here is a summary of your settings:
                </p>
              </div>

              {/* Summary Card */}
              <div className="bg-brand-bg rounded-2xl border border-brand-border p-5 text-left space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-brand-border/60">
                  <span className="text-xs font-bold text-brand-muted uppercase tracking-wider">
                    Configuration Summary
                  </span>
                  <span className="text-xs font-extrabold text-brand-teal flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verified</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-brand-muted block text-[11px]">User Account:</span>
                    <strong className="text-brand-text">{fullName || currentUser.full_name}</strong>
                    <span className="text-brand-muted block text-[11px] truncate">{currentUser.email}</span>
                  </div>

                  <div>
                    <span className="text-brand-muted block text-[11px]">Trusted Circle:</span>
                    <strong className="text-brand-text">
                      {contacts.length} Contact{contacts.length !== 1 ? 's' : ''} ({tier1Contacts.length} Primary)
                    </strong>
                  </div>

                  <div>
                    <span className="text-brand-muted block text-[11px]">Safety Check-Ins:</span>
                    <strong className="text-brand-text">
                      {checkInsEnabled ? `Every ${checkInInterval} mins (${countdownSeconds}s window)` : 'Disabled'}
                    </strong>
                  </div>

                  <div>
                    <span className="text-brand-muted block text-[11px]">Emergency Helpline:</span>
                    <strong className="text-brand-text">Dial {emergencyNumber}</strong>
                    <span className="text-brand-muted block text-[11px]">
                      {shareLocationInEmergency ? 'Live GPS enabled' : 'GPS hidden'}
                    </span>
                  </div>
                </div>

                {contacts.length === 0 && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Reminder: You haven't added trusted contacts yet. Invite contacts anytime from the <strong>Trusted Circle</strong> tab.
                    </span>
                  </div>
                )}
              </div>

              {/* Action: Go to Dashboard */}
              <div className="pt-4 flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={saving}
                  className="w-full sm:w-auto px-10 py-3.5 bg-gradient-to-r from-[#5517C8] to-[#365BFF] hover:from-[#4510AB] hover:to-[#2A48D9] text-white rounded-2xl text-sm font-black shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <span>{saving ? 'Finalizing Setup...' : 'Go to My Dashboard'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="text-xs font-semibold text-brand-muted hover:text-brand-text transition-colors"
                >
                  Review previous step
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
