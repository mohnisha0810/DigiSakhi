import React, { useState } from 'react';
import { useSafeSphere } from '@/store/SafeSphereContext';
import { CheckInSetupModal } from '../checkin/CheckInSetupModal';
import { EmergencyMessageModal } from '../safety/EmergencyMessageModal';
import { EmergencyCallModal } from '../safety/EmergencyCallModal';
import { ActiveIncidentsBanner } from './ActiveIncidentsBanner';
import { CustomJourneyCheckInPrompt } from '../journey/CustomJourneyCheckInPrompt';
import {
  ShieldAlert,
  Clock,
  Compass,
  ArrowRight,
  Users,
  CheckCircle2,
  Settings,
  PhoneCall,
  History,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { formatTimeOnly, formatRelativeTime } from '@/lib/utils';

export const UserDashboard: React.FC = () => {
  const {
    currentUser,
    contacts,
    incidentEvents,
    activeCheckIn,
    activeJourney,
    activeIncident,
    setCurrentScreen,
    openIncidentDetails,
    confirmCheckInSafe,
    confirmSafeArrival,
    virtualTime,
  } = useSafeSphere();

  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isEmergencyMessageOpen, setIsEmergencyMessageOpen] = useState(false);
  const [isEmergencyCallOpen, setIsEmergencyCallOpen] = useState(false);

  const acceptedContacts = contacts.filter((c) => c.status === 'accepted');
  const recentEvents = incidentEvents.slice(0, 2);

  const isCheckInOverdue =
    activeCheckIn &&
    (activeCheckIn.status === 'in_grace_period' || activeCheckIn.status === 'escalated');

  const now = virtualTime || new Date();
  const nextCheckInTime = activeJourney?.next_check_in_at
    ? new Date(activeJourney.next_check_in_at)
    : null;
  const isCustomJourneyPromptDue =
    activeJourney &&
    nextCheckInTime &&
    (now >= nextCheckInTime ||
      activeJourney.check_in_status === 'prompt_due' ||
      activeJourney.check_in_status === 'missed');

  const firstName = currentUser.full_name ? currentUser.full_name.split(' ')[0] : 'there';

  return (
    <div className="space-y-5 sm:space-y-6 animate-fadeIn">
      {/* =========================================================================
          1. COMPACT WELCOMING HEADER
          Answers: "Who is logged in?"
          Includes user greeting, protection status badge, and immediate emergency access.
      ========================================================================= */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-[#E8E1F3] shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
        {/* Soft brand glow */}
        <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-gradient-to-br from-[#F2EDFF] to-[#EAF7FF] blur-2xl pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F2EDFF] border border-[#5517C8]/20">
            <span className={`w-2 h-2 rounded-full ${activeIncident ? 'bg-[#D92D45] animate-ping' : 'bg-[#16865C]'}`} />
            <span className="text-[11px] font-extrabold text-[#351078]">
              {activeIncident ? 'Emergency Active' : 'Active Protection'}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#211638] tracking-tight">
            Welcome back, {firstName}
          </h1>
          <p className="text-xs sm:text-sm text-[#716B80]">
            Your journey, your circle, your peace of mind.
          </p>
        </div>

        {/* Quick Emergency & Settings Controls */}
        <div className="flex items-center gap-2 relative z-10 shrink-0">
          <button
            onClick={() => setIsEmergencyMessageOpen(true)}
            className="px-3.5 py-2.5 bg-[#D92D45] hover:bg-[#B71C32] text-white rounded-xl text-xs font-black shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            title="Instant Emergency SOS Alert"
          >
            <ShieldAlert className="w-4 h-4 animate-pulse" />
            <span>Emergency SOS</span>
          </button>

          <button
            onClick={() => setIsEmergencyCallOpen(true)}
            className="px-3 py-2.5 bg-[#211638] hover:bg-black text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            title="Dial 112 National Emergency Helpline"
          >
            <PhoneCall className="w-3.5 h-3.5 text-red-400" />
            <span>Call 112</span>
          </button>

          <button
            onClick={() => setCurrentScreen('settings')}
            className="p-2.5 bg-[#FAF9FF] hover:bg-[#F2EDFF] text-[#211638] border border-[#E8E1F3] rounded-xl transition-colors cursor-pointer"
            title="Profile & Settings"
          >
            <Settings className="w-4 h-4 text-[#716B80] hover:text-[#5517C8]" />
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. ACTIVE DISTRESS ALERT BANNER (Only when emergency incident is active)
      ========================================================================= */}
      <ActiveIncidentsBanner />

      {/* =========================================================================
          3. PRIMARY ACTION & CURRENT JOURNEY STATUS
          Answers: "What is my current safety-journey status?" & "What should I do next?"
          Shows EXACTLY ONE prominent card:
          - If Active Distress: Distress banner with details button
          - Else if Overdue Check-in: Overdue grace period prompt with I'm Safe button
          - Else if Custom Journey Prompt Due: 3-button interactive prompt
          - Else if Active Journey: Journey in progress card (ETA, Safe Radius, Confirm Arrival)
          - Else: Start a Safety Journey (The primary inactive action card)
      ========================================================================= */}
      {activeIncident ? (
        <div className="p-5 bg-[#FFF1F3] border border-[#D92D45]/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs shadow-card animate-fadeIn">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#D92D45] text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <strong className="text-[#D92D45] font-black text-sm block">
                Active Emergency Distress Alert Dispatched
              </strong>
              <p className="text-[#211638] text-xs mt-0.5">
                Your trusted circle is notified with your live GPS location.
              </p>
            </div>
          </div>
          <button
            onClick={() => openIncidentDetails(activeIncident.id)}
            className="px-4 py-2.5 bg-[#D92D45] hover:bg-[#B71C32] text-white font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
          >
            <span>View Incident Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : isCheckInOverdue ? (
        <div className="p-5 bg-[#FFF1F3] border border-[#D92D45]/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs shadow-card animate-fadeIn">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#D92D45] text-white flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <strong className="text-[#D92D45] font-black text-sm block">
                Check-in Overdue • Grace Period Active
              </strong>
              <p className="text-[#211638] text-xs mt-0.5">
                Your scheduled check-in time elapsed. Confirm you are safe to cancel escalation.
              </p>
            </div>
          </div>
          <button
            onClick={() => activeCheckIn && confirmCheckInSafe(activeCheckIn.id)}
            className="px-5 py-2.5 bg-[#16865C] hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>I'm Safe</span>
          </button>
        </div>
      ) : isCustomJourneyPromptDue && activeJourney ? (
        <CustomJourneyCheckInPrompt journey={activeJourney} />
      ) : activeJourney ? (
        /* Single Active Journey Panel */
        <div className="bg-gradient-to-br from-[#F2EDFF]/60 via-white to-[#EAF7FF]/60 rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-[#5517C8]/25 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="max-w-xl space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#F2EDFF] text-[#351078] border border-[#5517C8]/20">
              Safety Journey in Progress
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#211638] tracking-tight">
              En Route to {activeJourney.destination_name}
            </h2>
            <p className="text-xs sm:text-sm text-[#716B80] leading-relaxed">
              Safe arrival geofencing active ({activeJourney.safe_radius_meters}m radius). Expected arrival:{' '}
              <strong className="text-[#211638] font-mono">{formatTimeOnly(activeJourney.expected_arrival_time)}</strong>.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => confirmSafeArrival(activeJourney.id)}
                className="px-5 py-2.5 bg-[#16865C] hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Safe Arrival</span>
              </button>

              <button
                onClick={() => setCurrentScreen('journeys')}
                className="px-4 py-2.5 bg-white hover:bg-slate-50 text-[#351078] border border-[#E8E1F3] rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Compass className="w-4 h-4 text-[#5517C8]" />
                <span>View Route Map</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="hidden lg:flex items-center justify-center p-4 shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-[#F2EDFF] border border-[#5517C8]/20 shadow-sm flex items-center justify-center text-[#5517C8]">
              <Compass className="w-10 h-10 animate-spin-slow" />
            </div>
          </div>
        </div>
      ) : (
        /* Single Primary Action: Start a Safety Journey (When Standby) */
        <div className="bg-gradient-to-br from-[#F2EDFF]/50 via-white to-[#EAF7FF]/50 rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-[#E8E1F3] shadow-card flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
          <div className="max-w-xl space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#F2EDFF] text-[#351078] border border-[#5517C8]/20">
              Primary Safety Workflow
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#211638] tracking-tight">
              Start a Safety Journey
            </h2>
            <p className="text-xs sm:text-sm text-[#716B80] leading-relaxed">
              Going out, commuting, or walking alone? Launch a monitored journey with automated arrival detection, custom check-ins, and trusted circle backup.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setCurrentScreen('journeys')}
                className="px-5 py-3 bg-gradient-to-r from-[#5517C8] to-[#365BFF] hover:from-[#4510AB] hover:to-[#2A48D9] text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                <span>Start a Safety Journey</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsCheckInModalOpen(true)}
                className="px-4 py-3 bg-white hover:bg-slate-50 text-[#211638] border border-[#E8E1F3] rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Clock className="w-4 h-4 text-[#5517C8]" />
                <span>Quick Check-in</span>
              </button>
            </div>
          </div>

          <div className="hidden lg:flex items-center justify-center p-4 shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#F2EDFF] to-[#EAF7FF] border border-[#5517C8]/20 shadow-sm flex items-center justify-center text-[#5517C8]">
              <Compass className="w-10 h-10 animate-pulse-subtle" />
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          4. ESSENTIAL INFORMATION GRID (Clean 3-Card Summary Row)
          Provides quick visibility without duplicating full page content:
          - Card A: Safety Check-in Timer Status
          - Card B: Trusted Circle Responders Status
          - Card C: Recent Activity Timeline Snippet
      ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card A: Safety Check-in Status */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E1F3] shadow-card flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-[#F2EDFF] text-[#5517C8] flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${activeCheckIn ? 'bg-[#16865C]/10 text-[#16865C]' : 'bg-slate-100 text-[#716B80]'}`}>
                {activeCheckIn ? 'Active' : 'Standby'}
              </span>
            </div>
            <h3 className="font-extrabold text-[#211638] text-sm">
              Safety Check-in
            </h3>
            <p className="text-xs text-[#716B80] leading-relaxed">
              {activeCheckIn
                ? `Next response scheduled for ${formatTimeOnly(activeCheckIn.deadline_at)}.`
                : 'No timer currently counting down. Set a check-in before heading out.'}
            </p>
          </div>

          <div className="pt-3.5 border-t border-[#E8E1F3] mt-4">
            {activeCheckIn ? (
              <button
                onClick={() => confirmCheckInSafe(activeCheckIn.id)}
                className="w-full py-2 bg-[#16865C] hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>I'm Safe</span>
              </button>
            ) : (
              <button
                onClick={() => setIsCheckInModalOpen(true)}
                className="w-full py-2 bg-slate-50 hover:bg-[#F2EDFF] text-[#211638] border border-[#E8E1F3] rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Schedule Check-in</span>
                <ArrowRight className="w-3 h-3 text-[#5517C8]" />
              </button>
            )}
          </div>
        </div>

        {/* Card B: Trusted Circle Status */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E1F3] shadow-card flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-[#F2EDFF] text-[#365BFF] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#16865C]/10 text-[#16865C] border border-[#16865C]/20 font-mono">
                {acceptedContacts.length > 0
                  ? `${acceptedContacts.length} Verified`
                  : contacts.length > 0
                  ? `${contacts.length} Added`
                  : '0 Verified'}
              </span>
            </div>
            <h3 className="font-extrabold text-[#211638] text-sm">
              Trusted Circle
            </h3>
            <p className="text-xs text-[#716B80] leading-relaxed">
              {acceptedContacts.length > 0
                ? `${acceptedContacts.length} responder(s) verified for check-ins and emergency alerts.`
                : contacts.length > 0
                ? `${contacts.length} responder(s) in circle (${contacts.length - acceptedContacts.length} pending acceptance).`
                : 'No contacts added yet. Add trusted friends or family members.'}
            </p>
          </div>

          <div className="pt-3.5 border-t border-[#E8E1F3] mt-4">
            <button
              onClick={() => setCurrentScreen('circle')}
              className="w-full py-2 bg-slate-50 hover:bg-[#F2EDFF] text-[#211638] border border-[#E8E1F3] rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>Manage Circle</span>
              <ArrowRight className="w-3 h-3 text-[#5517C8]" />
            </button>
          </div>
        </div>

        {/* Card C: Recent Activity Preview */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E1F3] shadow-card flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <History className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-[#716B80]">
                Activity
              </span>
            </div>
            <h3 className="font-extrabold text-[#211638] text-sm">
              Recent Events
            </h3>
            {recentEvents.length === 0 ? (
              <p className="text-xs text-[#716B80] leading-relaxed">
                No safety events recorded yet. Check-ins and journeys appear here.
              </p>
            ) : (
              <div className="space-y-1.5 pt-0.5">
                {recentEvents.map((ev) => (
                  <div key={ev.id} className="text-[11px] leading-tight">
                    <span className="font-bold text-[#211638] truncate block">
                      {ev.description}
                    </span>
                    <span className="text-[#716B80] font-mono text-[10px]">
                      {formatRelativeTime(ev.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3.5 border-t border-[#E8E1F3] mt-4">
            <button
              onClick={() => setCurrentScreen('history')}
              className="w-full py-2 bg-slate-50 hover:bg-[#F2EDFF] text-[#211638] border border-[#E8E1F3] rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>View Full History</span>
              <ArrowRight className="w-3 h-3 text-[#5517C8]" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Emergency Modals */}
      <CheckInSetupModal
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
      />
      <EmergencyMessageModal
        isOpen={isEmergencyMessageOpen}
        onClose={() => setIsEmergencyMessageOpen(false)}
      />
      <EmergencyCallModal
        isOpen={isEmergencyCallOpen}
        onClose={() => setIsEmergencyCallOpen(false)}
      />
    </div>
  );
};
