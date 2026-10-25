import React, { useState, useEffect } from 'react';
import { Journey, TrustedContact } from '@/types';
import { useSafeSphere } from '@/store/SafeSphereContext';
import {
  CheckCircle2,
  AlertTriangle,
  PhoneCall,
  ShieldAlert,
  Clock,
  ArrowRight,
  Phone,
  Info,
  Check,
} from 'lucide-react';

interface CustomJourneyCheckInPromptProps {
  journey: Journey;
  onDismiss?: () => void;
}

export const CustomJourneyCheckInPrompt: React.FC<CustomJourneyCheckInPromptProps> = ({
  journey,
}) => {
  const {
    respondCustomJourneyCheckIn,
    recordJourneyCallAction,
    contacts,
    virtualTime,
  } = useSafeSphere();

  const [activeCallStatus, setActiveCallStatus] = useState<string | null>(null);
  const [calledTier1, setCalledTier1] = useState(false);
  const [calledTier2, setCalledTier2] = useState(false);
  const [calledUrgent, setCalledUrgent] = useState(false);

  // Time calculations
  const now = virtualTime || new Date();
  const nextCheckIn = journey.next_check_in_at ? new Date(journey.next_check_in_at) : now;
  const countdownDuration = journey.response_countdown_seconds || 120;
  const deadline = new Date(nextCheckIn.getTime() + countdownDuration * 1000);

  const isDue = now >= nextCheckIn;
  const isMissed = now >= deadline;
  const secondsRemaining = Math.max(0, Math.round((deadline.getTime() - now.getTime()) / 1000));
  const progressPercent = Math.min(100, Math.max(0, (secondsRemaining / countdownDuration) * 100));

  // Find Tier 1 and Tier 2 contacts
  const tier1Contacts = contacts.filter((c) =>
    (journey.tier1_contact_ids || []).includes(c.id) && c.status === 'accepted'
  );
  const tier1Contact = tier1Contacts[0] || contacts.find((c) => c.status === 'accepted');

  const tier2Contacts = contacts.filter((c) =>
    (journey.tier2_contact_ids || []).includes(c.id) && c.status === 'accepted'
  );
  const tier2Contact = tier2Contacts[0] || contacts.filter((c) => c.status === 'accepted')[1];

  const emergencyNumber = journey.emergency_phone_number || '112';

  // Format seconds as MM:SS
  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleImOkay = async () => {
    await respondCustomJourneyCheckIn(journey.id, 'im_okay');
    setActiveCallStatus(null);
    setCalledTier1(false);
    setCalledTier2(false);
    setCalledUrgent(false);
  };

  const handleNeedHelp = async () => {
    setCalledTier1(true);
    setActiveCallStatus(`Calling Tier 1: ${tier1Contact?.full_name || 'Contact'} (${tier1Contact?.phone_number || 'N/A'})`);
    await respondCustomJourneyCheckIn(journey.id, 'need_help');
  };

  const handleCallTier2 = async () => {
    if (!tier2Contact) return;
    setCalledTier2(true);
    setActiveCallStatus(`Calling Tier 2 Backup: ${tier2Contact.full_name} (${tier2Contact.phone_number})`);

    await recordJourneyCallAction(journey.id, {
      action_type: 'tier2_call',
      recipient_name: tier2Contact.full_name,
      phone_number: tier2Contact.phone_number,
      status: 'opened_dialer',
      note: 'User initiated Tier 2 backup contact call.',
    });

    const cleanPhone = tier2Contact.phone_number.replace(/\s+/g, '');
    window.location.href = `tel:${encodeURIComponent(cleanPhone)}`;
  };

  const handleUrgentHelp = async () => {
    setCalledUrgent(true);
    setActiveCallStatus(`Urgent Help: Opening emergency dialer for ${emergencyNumber}`);
    await respondCustomJourneyCheckIn(journey.id, 'urgent_help');
  };

  return (
    <div
      className={`rounded-3xl p-6 sm:p-7 border shadow-elevated space-y-5 animate-fadeIn ${
        isMissed
          ? 'bg-gradient-to-br from-amber-50 via-white to-red-50 border-amber-300'
          : 'bg-gradient-to-br from-brand-aqua/30 via-white to-brand-lavender/30 border-teal-300'
      }`}
    >
      {/* Top Banner & Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-brand-border">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              isMissed
                ? 'bg-amber-100 text-amber-700 animate-pulse'
                : 'bg-brand-aqua text-brand-deepTeal'
            }`}
          >
            {isMissed ? (
              <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
            ) : (
              <Clock className="w-6 h-6 stroke-[2.2] animate-spin-slow" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                  isMissed
                    ? 'bg-amber-200 text-amber-900 border border-amber-300'
                    : 'bg-brand-aqua text-brand-deepTeal border border-teal-200'
                }`}
              >
                {isMissed ? 'Check-in Missed' : 'Check-in Due Now'}
              </span>
              <span className="text-xs text-brand-muted">
                {journey.journey_name || journey.destination_name}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-brand-text tracking-tight mt-0.5">
              {isMissed
                ? 'Are you okay? Please confirm your safety.'
                : 'Are you okay? Please confirm your safety.'}
            </h2>
          </div>
        </div>

        {/* Visible Countdown Timer */}
        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-brand-muted tracking-wider block">
            {isMissed ? 'Overdue By' : 'Response Window'}
          </span>
          <span
            className={`text-xl font-mono font-black ${
              isMissed ? 'text-amber-700' : 'text-brand-deepTeal'
            }`}
          >
            {isMissed ? 'Window Closed' : formatTimer(secondsRemaining)}
          </span>
        </div>
      </div>

      {/* Countdown Progress Bar (Only during active countdown) */}
      {!isMissed && (
        <div className="space-y-1.5">
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
            <div
              className={`h-full transition-all duration-1000 rounded-full ${
                secondsRemaining <= 30
                  ? 'bg-brand-coral animate-pulse'
                  : 'bg-gradient-to-r from-brand-teal to-brand-violet'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-brand-muted font-mono">
            <span>{secondsRemaining}s remaining to confirm</span>
            <span>Interval: {journey.check_in_interval_minutes || 10}m</span>
          </div>
        </div>
      )}

      {/* Missed Warning Explanation */}
      {isMissed && (
        <div className="p-3.5 bg-amber-100/70 border border-amber-300 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-bold">Missed Check-in Recorded: </strong>
            Your scheduled response window has passed. Confirm you are safe to reset the schedule, or tap Help to contact your circle.
          </div>
        </div>
      )}

      {/* Active Call Status Banner if a call was just initiated */}
      {activeCallStatus && (
        <div className="p-4 bg-slate-900 text-white rounded-2xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-card animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <PhoneCall className="w-4 h-4 text-coral-400 animate-pulse" />
            <div>
              <span className="font-bold block text-sm">{activeCallStatus}</span>
              <span className="text-[11px] text-slate-300">
                Opening phone dialer. Tap Call on your phone to complete connection.
              </span>
            </div>
          </div>

          {calledTier1 && tier2Contact && (
            <button
              onClick={handleCallTier2}
              className="px-3.5 py-2 bg-brand-violet hover:bg-violet-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shrink-0 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Tier 2: {tier2Contact.full_name}</span>
            </button>
          )}
        </div>
      )}

      {/* EXACTLY THREE CLEAR PRIMARY ACTION BUTTONS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
        {/* BUTTON 1: "I'M OKAY 💚" */}
        <button
          onClick={handleImOkay}
          className="py-4 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md hover:shadow-lg transition-all flex flex-col items-center justify-center gap-1 active:scale-98 group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-200 group-hover:scale-110 transition-transform" />
            <span className="text-base tracking-wide">I'M OKAY 💚</span>
          </div>
          <span className="text-[11px] font-normal text-emerald-100 opacity-90">
            Confirm safe & schedule next check-in
          </span>
        </button>

        {/* BUTTON 2: "I NEED HELP 🟠" */}
        <button
          onClick={handleNeedHelp}
          className="py-4 px-5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm shadow-md hover:shadow-lg transition-all flex flex-col items-center justify-center gap-1 active:scale-98 group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-amber-200 group-hover:scale-110 transition-transform" />
            <span className="text-base tracking-wide">I NEED HELP 🟠</span>
          </div>
          <span className="text-[11px] font-normal text-amber-100 opacity-90 truncate max-w-[220px]">
            1-Click Call Tier 1 ({tier1Contact?.full_name || 'Contact'})
          </span>
        </button>

        {/* BUTTON 3: "URGENT HELP 🚨" */}
        <button
          onClick={handleUrgentHelp}
          className="py-4 px-5 rounded-2xl bg-brand-coral hover:bg-red-700 text-white font-black text-sm shadow-coral hover:shadow-lg transition-all flex flex-col items-center justify-center gap-1 active:scale-98 group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-200 group-hover:scale-110 transition-transform animate-pulse" />
            <span className="text-base tracking-wide">URGENT HELP 🚨</span>
          </div>
          <span className="text-[11px] font-normal text-red-100 opacity-90">
            1-Click Call Emergency ({emergencyNumber})
          </span>
        </button>
      </div>

      {/* Next Escalation Step Available if Tier 1 Was Called */}
      {calledTier1 && tier2Contact && (
        <div className="p-4 bg-slate-50 border border-brand-border rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-brand-violet shrink-0" />
            <div>
              <strong className="text-brand-text font-bold">
                Tier 1 Call In Progress or Unanswered?
              </strong>
              <p className="text-[11px] text-brand-muted">
                You can immediately escalate to your backup Tier 2 responder: {tier2Contact.full_name} ({tier2Contact.relationship}).
              </p>
            </div>
          </div>
          <button
            onClick={handleCallTier2}
            className="px-4 py-2 bg-brand-violet hover:bg-violet-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Call Tier 2: {tier2Contact.full_name}</span>
          </button>
        </div>
      )}

      {/* Honest Technical Limitation Note */}
      <div className="p-3 bg-slate-50/80 border border-slate-200 rounded-xl text-[11px] text-brand-muted flex items-start gap-2">
        <Info className="w-3.5 h-3.5 text-brand-muted shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Device Telephony Note: </strong> Web browsers cannot place phone calls completely silently in the background. Pressing "I Need Help" or "Urgent Help" immediately opens your device native phone dialer with the number prefilled ready to tap Call.
        </p>
      </div>
    </div>
  );
};
