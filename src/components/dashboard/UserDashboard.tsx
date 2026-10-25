import React, { useState } from 'react';
import { useSafeSphere } from '@/store/SafeSphereContext';
import { CheckInSetupModal } from '../checkin/CheckInSetupModal';
import { EmergencyMessageModal } from '../safety/EmergencyMessageModal';
import { EmergencyCallModal } from '../safety/EmergencyCallModal';
import { ActiveIncidentsBanner } from './ActiveIncidentsBanner';
import { CustomJourneyCheckInPrompt } from '../journey/CustomJourneyCheckInPrompt';
import { HowDigiSakhiWorks } from './HowDigiSakhiWorks';
import {
  ShieldAlert,
  Compass,
  ArrowRight,
  Users,
  CheckCircle2,
  Settings,
  PhoneCall,
  History,
  Sliders,
  Clock,
  MapPin,
  ShieldCheck,
  EyeOff,
  AlertTriangle,
} from 'lucide-react';
import { formatTimeOnly } from '@/lib/utils';

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
  const primaryResponder = acceptedContacts[0]?.full_name || (contacts[0] ? `${contacts[0].full_name} (Pending)` : 'None configured');

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* =========================================================================
          1. CLEAN WELCOME HEADER & STATUS OVERVIEW
          Provides a welcoming greeting, live protection status, and immediate emergency access.
      ========================================================================= */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 lg:p-7 border border-[#E8E1F3] shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative overflow-hidden">
        {/* Soft decorative brand gradient glow */}
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-gradient-to-br from-[#F2EDFF] to-[#EAF7FF] blur-2xl pointer-events-none" />

        <div className="space-y-1.5 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F2EDFF] border border-[#5517C8]/20">
            <span
              className={`w-2 h-2 rounded-full ${
                activeIncident
                  ? 'bg-[#D92D45] animate-ping'
                  : activeJourney
                  ? 'bg-[#365BFF] animate-pulse'
                  : activeCheckIn
                  ? 'bg-[#5517C8]'
                  : 'bg-[#16865C]'
              }`}
            />
            <span className="text-xs font-extrabold text-[#351078]">
              {activeIncident
                ? 'Emergency Active'
                : activeJourney
                ? 'Journey Monitored'
                : activeCheckIn
                ? 'Check-in Active'
                : 'Protected & Ready'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-[#211638] tracking-tight">
            Welcome back, {firstName}
          </h1>
          <p className="text-xs sm:text-sm text-[#716B80]">
            For Her. With Her. Always. • Your personal safety dashboard
          </p>
        </div>

        {/* Emergency & Quick Settings Controls */}
        <div className="flex items-center gap-2.5 relative z-10 shrink-0">
          <button
            type="button"
            onClick={() => setIsEmergencyMessageOpen(true)}
            className="px-4 py-2.5 bg-[#D92D45] hover:bg-[#B71C32] text-white rounded-xl text-xs font-black shadow-xs hover:shadow-md transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
            title="Instant Emergency SOS Broadcast"
          >
            <ShieldAlert className="w-4 h-4 animate-pulse" />
            <span>Emergency SOS</span>
          </button>

          <button
            type="button"
            onClick={() => setIsEmergencyCallOpen(true)}
            className="px-3.5 py-2.5 bg-[#211638] hover:bg-black text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            title="Dial 112 National Emergency Helpline"
          >
            <PhoneCall className="w-3.5 h-3.5 text-red-400" />
            <span>Call 112</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentScreen('settings')}
            className="p-2.5 bg-[#FAF9FF] hover:bg-[#F2EDFF] text-[#211638] border border-[#E8E1F3] rounded-xl transition-colors cursor-pointer"
            title="Profile & Settings"
          >
            <Settings className="w-4 h-4 text-[#716B80] hover:text-[#5517C8]" />
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. LIVE ATTENTION BANNERS (Conditional Only)
          Renders ONLY when an active event requires immediate attention:
          - Active Incident: Single alert banner with responder status & resolve button
          - Due Journey Check-in: 3-button interactive prompt ("I'm Okay", "I Need Help", "Urgent Help")
          - Overdue Check-in Grace Period: Audible countdown & I'm Safe confirmation
          - Active Journey: Compact transit banner with arrival confirmation
      ========================================================================= */}
      {activeIncident ? (
        <ActiveIncidentsBanner />
      ) : isCustomJourneyPromptDue && activeJourney ? (
        <CustomJourneyCheckInPrompt journey={activeJourney} />
      ) : isCheckInOverdue ? (
        <div className="p-4 sm:p-5 bg-[#FFF1F3] border border-[#D92D45]/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs shadow-card animate-fadeIn">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#D92D45] text-white flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <strong className="text-[#D92D45] font-black text-sm block">
                Check-in Overdue • Grace Period Active
              </strong>
              <p className="text-[#211638] text-xs mt-0.5">
                Your scheduled check-in time elapsed. Confirm you are safe before alerts escalate.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => activeCheckIn && confirmCheckInSafe(activeCheckIn.id)}
            className="px-5 py-2.5 bg-[#16865C] hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>I'm Safe</span>
          </button>
        </div>
      ) : activeJourney ? (
        <div className="bg-gradient-to-br from-[#F2EDFF]/60 via-white to-[#EAF7FF]/60 rounded-2xl p-4 sm:p-5 border border-[#5517C8]/20 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#F2EDFF] text-[#5517C8] flex items-center justify-center shrink-0 border border-[#5517C8]/20">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#F2EDFF] text-[#351078] border border-[#5517C8]/20">
                  En Route
                </span>
                <span className="text-xs text-[#716B80]">
                  Destination: <strong className="text-[#211638]">{activeJourney.destination_name}</strong>
                </span>
              </div>
              <p className="text-xs text-[#716B80] mt-0.5">
                Arrival detector active ({activeJourney.safe_radius_meters}m safe perimeter) • Expected by{' '}
                <strong className="text-[#211638] font-mono">{formatTimeOnly(activeJourney.expected_arrival_time)}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={() => confirmSafeArrival(activeJourney.id)}
              className="px-4 py-2 bg-[#16865C] hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Confirm Arrival</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentScreen('journeys')}
              className="px-3.5 py-2 bg-white hover:bg-[#F2EDFF] text-[#351078] border border-[#E8E1F3] rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>View Route</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#5517C8]" />
            </button>
          </div>
        </div>
      ) : null}

      {/* =========================================================================
          3. CLEAN QUICK-ACCESS HUB (4 Core Feature Cards)
          Provides clear, short navigation cards linking to dedicated pages.
          Does NOT duplicate full management lists or history feeds.
      ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {/* Card 1: Safety Journeys */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E1F3] shadow-card hover:border-[#365BFF]/30 transition-all flex flex-col justify-between group">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-[#EAF7FF] text-[#365BFF] flex items-center justify-center transition-transform group-hover:scale-105">
                <Compass className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span
                className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                  activeJourney
                    ? 'bg-[#365BFF]/10 text-[#365BFF] border border-[#365BFF]/20'
                    : 'bg-slate-100 text-[#716B80]'
                }`}
              >
                {activeJourney ? 'Active Transit' : 'Ready'}
              </span>
            </div>

            <div>
              <h3 className="font-extrabold text-[#211638] text-base group-hover:text-[#365BFF] transition-colors">
                Safety Journeys
              </h3>
              <p className="text-xs text-[#716B80] mt-1 leading-relaxed">
                Plan a monitored trip with custom check-in intervals, countdown reminders, and geofenced safe arrival verification.
              </p>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#E8E1F3]">
            <button
              type="button"
              onClick={() => setCurrentScreen('journeys')}
              className="w-full py-2.5 px-4 bg-[#FAF9FF] hover:bg-[#EAF7FF] text-[#211638] hover:text-[#365BFF] border border-[#E8E1F3] rounded-xl font-bold text-xs transition-all flex items-center justify-between cursor-pointer group-hover:border-[#365BFF]/30"
            >
              <span>{activeJourney ? 'View Active Journey' : 'Open Journeys'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#365BFF] group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Card 2: Trusted Circle */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E1F3] shadow-card hover:border-[#5517C8]/30 transition-all flex flex-col justify-between group">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-[#F2EDFF] text-[#5517C8] flex items-center justify-center transition-transform group-hover:scale-105">
                <Users className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#16865C]/10 text-[#16865C] border border-[#16865C]/20 font-mono">
                {acceptedContacts.length > 0
                  ? `${acceptedContacts.length} Verified`
                  : contacts.length > 0
                  ? `${contacts.length} Added`
                  : '0 Verified'}
              </span>
            </div>

            <div>
              <h3 className="font-extrabold text-[#211638] text-base group-hover:text-[#5517C8] transition-colors">
                Trusted Circle
              </h3>
              <p className="text-xs text-[#716B80] mt-1 leading-relaxed">
                Manage your emergency escalation chain, add family or friends, and share direct WhatsApp/SMS invitation links.
              </p>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#E8E1F3]">
            <button
              type="button"
              onClick={() => setCurrentScreen('circle')}
              className="w-full py-2.5 px-4 bg-[#FAF9FF] hover:bg-[#F2EDFF] text-[#211638] hover:text-[#5517C8] border border-[#E8E1F3] rounded-xl font-bold text-xs transition-all flex items-center justify-between cursor-pointer group-hover:border-[#5517C8]/30"
            >
              <span>Open Trusted Circle</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#5517C8] group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Card 3: Safety Setup */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E1F3] shadow-card hover:border-[#08C9E8]/30 transition-all flex flex-col justify-between group">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-[#F0FDFF] text-[#08C9E8] flex items-center justify-center transition-transform group-hover:scale-105">
                <Sliders className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span
                className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                  activeCheckIn
                    ? 'bg-[#5517C8]/10 text-[#5517C8] border border-[#5517C8]/20'
                    : 'bg-slate-100 text-[#716B80]'
                }`}
              >
                {activeCheckIn ? 'Timer Active' : 'Configured'}
              </span>
            </div>

            <div>
              <h3 className="font-extrabold text-[#211638] text-base group-hover:text-[#08C9E8] transition-colors">
                Safety Setup
              </h3>
              <p className="text-xs text-[#716B80] mt-1 leading-relaxed">
                Configure automated check-in timers, escalation rules, grace period buffers, and emergency helpline destinations.
              </p>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#E8E1F3]">
            <button
              type="button"
              onClick={() => setCurrentScreen('safety_setup')}
              className="w-full py-2.5 px-4 bg-[#FAF9FF] hover:bg-[#F0FDFF] text-[#211638] hover:text-[#08C9E8] border border-[#E8E1F3] rounded-xl font-bold text-xs transition-all flex items-center justify-between cursor-pointer group-hover:border-[#08C9E8]/30"
            >
              <span>Configure Safety</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#08C9E8] group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Card 4: Activity History */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E1F3] shadow-card hover:border-[#5517C8]/30 transition-all flex flex-col justify-between group">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center transition-transform group-hover:scale-105">
                <History className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-[#716B80] font-mono">
                {incidentEvents.length} Logs
              </span>
            </div>

            <div>
              <h3 className="font-extrabold text-[#211638] text-base group-hover:text-[#5517C8] transition-colors">
                Activity History
              </h3>
              <p className="text-xs text-[#716B80] mt-1 leading-relaxed">
                Review your chronological security timeline, incident notifications, responder notes, and export audit records.
              </p>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#E8E1F3]">
            <button
              type="button"
              onClick={() => setCurrentScreen('history')}
              className="w-full py-2.5 px-4 bg-[#FAF9FF] hover:bg-[#F2EDFF] text-[#211638] hover:text-[#5517C8] border border-[#E8E1F3] rounded-xl font-bold text-xs transition-all flex items-center justify-between cursor-pointer group-hover:border-[#5517C8]/30"
            >
              <span>View Activity Log</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#5517C8] group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. HOW DIGISAKHI WORKS (Numbered Workflow Guide)
          Visual 6-stage connected stepper explaining the complete user journey.
      ========================================================================= */}
      <HowDigiSakhiWorks onExplore={() => setCurrentScreen('journeys')} />

      {/* =========================================================================
          5. COMPACT SAFETY READINESS SNAPSHOT
          A single minimal, reassuring overview card at the bottom of the homepage.
      ========================================================================= */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E1F3] shadow-card">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-[#16865C]" />
          <h4 className="text-xs font-black uppercase text-[#211638] tracking-wider">
            Safety Readiness Snapshot
          </h4>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-[#FAF9FF] border border-[#E8E1F3]">
            <span className="text-[10px] uppercase font-bold text-[#716B80] block mb-0.5">
              Primary Responder
            </span>
            <span className="font-extrabold text-[#211638] truncate block" title={primaryResponder}>
              {primaryResponder}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[#FAF9FF] border border-[#E8E1F3]">
            <span className="text-[10px] uppercase font-bold text-[#716B80] block mb-0.5">
              Emergency Helpline
            </span>
            <span className="font-extrabold text-[#211638] font-mono">
              112 (National Emergency)
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[#FAF9FF] border border-[#E8E1F3]">
            <span className="text-[10px] uppercase font-bold text-[#716B80] block mb-0.5">
              Quick Camouflage
            </span>
            <span className="font-extrabold text-[#211638]">
              Press <kbd className="px-1 py-0.5 bg-white border border-[#E8E1F3] rounded text-[10px] font-mono">Esc</kbd> anytime
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[#FAF9FF] border border-[#E8E1F3]">
            <span className="text-[10px] uppercase font-bold text-[#716B80] block mb-0.5">
              GPS Location
            </span>
            <span className="font-extrabold text-[#16865C] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16865C]" />
              <span>Session Only</span>
            </span>
          </div>
        </div>
      </div>

      {/* Emergency & Setup Modals */}
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
