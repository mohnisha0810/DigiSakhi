import React, { useState } from 'react';
import { useSafeSphere } from '@/store/SafeSphereContext';
import { CheckInSetupModal } from '../checkin/CheckInSetupModal';
import { EmergencyMessageModal } from '../safety/EmergencyMessageModal';
import { EmergencyCallModal } from '../safety/EmergencyCallModal';
import { ActiveIncidentsBanner } from './ActiveIncidentsBanner';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Compass,
  AlertTriangle,
  ArrowRight,
  MapPin,
  Users,
  ChevronRight,
  Radio,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  Sliders,
  Settings,
  X,
  UserCheck,
} from 'lucide-react';
import { formatRelativeTime, formatTimeOnly } from '@/lib/utils';

export const UserDashboard: React.FC = () => {
  const {
    currentUser,
    contacts,
    incidentEvents,
    activeCheckIn,
    activeJourney,
    activeIncident,
    locationPermission,
    defaultProtocol,
    protocols,
    setCurrentScreen,
    openIncidentDetails,
    confirmCheckInSafe,
    confirmSafeArrival,
  } = useSafeSphere();

  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isEmergencyMessageOpen, setIsEmergencyMessageOpen] = useState(false);
  const [isEmergencyCallOpen, setIsEmergencyCallOpen] = useState(false);
  const [isChecklistDismissed, setIsChecklistDismissed] = useState(false);

  const acceptedContacts = contacts.filter((c) => c.status === 'accepted');
  const pendingContacts = contacts.filter((c) => c.status === 'pending');
  const recentEvents = incidentEvents.slice(0, 3);

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const isCheckInOverdue =
    activeCheckIn &&
    (activeCheckIn.status === 'in_grace_period' || activeCheckIn.status === 'escalated');

  // Real-data completion checks for first-time onboarding flow
  const isProfileComplete = Boolean(
    currentUser.full_name &&
    (currentUser.emergency_notes || currentUser.medical_info)
  );
  const isContactComplete = acceptedContacts.length > 0;
  const isCheckInComplete = Boolean(protocols.length > 0 || defaultProtocol);
  const isEmergencyComplete = Boolean(
    currentUser.emergency_notes || currentUser.discreet_exit_pin || currentUser.medical_info
  );

  const checklistItems = [
    {
      id: 'profile',
      label: 'Complete your basic profile',
      description: 'Add your contact number and emergency medical notes.',
      completed: isProfileComplete,
      actionLabel: 'Edit Profile',
      onAction: () => setCurrentScreen('settings'),
    },
    {
      id: 'contact',
      label: 'Add at least one trusted contact',
      description: 'Your circle receives automated check-in and distress alerts.',
      completed: isContactComplete,
      actionLabel: 'Add Contact',
      onAction: () => setCurrentScreen('circle'),
    },
    {
      id: 'checkins',
      label: 'Configure safety check-ins',
      description: 'Choose intervals and escalation grace periods.',
      completed: isCheckInComplete,
      actionLabel: 'Setup Check-ins',
      onAction: () => setCurrentScreen('safety_setup'),
    },
    {
      id: 'emergency',
      label: 'Review emergency & privacy preferences',
      description: 'Configure discreet exit PIN and emergency phone numbers.',
      completed: isEmergencyComplete,
      actionLabel: 'Review Settings',
      onAction: () => setCurrentScreen('settings'),
    },
  ];

  const completedCount = checklistItems.filter((item) => item.completed).length;
  const isSetupIncomplete = completedCount < checklistItems.length && !isChecklistDismissed;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. TOP HEADER: Greeting, Status & Direct Emergency Controls */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-brand-border shadow-card flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        {/* Soft background glow */}
        <div className="absolute -right-10 -top-10 w-52 h-52 rounded-full bg-gradient-to-br from-teal-100/50 to-violet-100/40 blur-2xl pointer-events-none" />

        <div className="space-y-1.5 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-aqua/50 border border-teal-200/80 shadow-2xs mb-1">
            <span className="w-2 h-2 rounded-full bg-brand-teal animate-pulse" />
            <span className="text-xs font-extrabold text-brand-deepTeal">
              DigiSakhi Protection
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-text tracking-tight">
            {getGreeting()}, {currentUser.full_name.split(' ')[0]}
          </h1>
          <p className="text-xs sm:text-sm text-brand-muted max-w-xl leading-relaxed">
            Your personal safety command center. Monitor journeys, manage automated check-ins, and alert your circle with instant discreet dispatches.
          </p>
        </div>

        {/* Top Emergency Buttons & Quick Profile Link */}
        <div className="flex items-center gap-2.5 shrink-0 relative z-10">
          <button
            onClick={() => setIsEmergencyMessageOpen(true)}
            className="px-4 py-2.5 bg-brand-coral hover:bg-red-600 text-white rounded-xl text-xs font-black shadow-coral transition-all flex items-center gap-1.5 active:scale-95"
            title="Dispatch Emergency SOS message with live GPS location"
          >
            <ShieldAlert className="w-4 h-4 animate-pulse" />
            <span>Emergency SOS</span>
          </button>

          <button
            onClick={() => setIsEmergencyCallOpen(true)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
            title="Directly dial 112 National Emergency Helpline or Primary Contact"
          >
            <PhoneCall className="w-4 h-4 text-coral-400" />
            <span>Call 112</span>
          </button>

          <button
            onClick={() => setCurrentScreen('settings')}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 text-brand-text border border-brand-border rounded-xl transition-colors"
            title="Profile & Settings"
          >
            <Settings className="w-4 h-4 text-brand-muted hover:text-brand-text" />
          </button>
        </div>
      </div>

      {/* 2. ACTIVE DISTRESS ALERT BANNER (Only when emergency incident is active) */}
      <ActiveIncidentsBanner />

      {/* 3. CURRENT SAFETY STATUS (Answers: "Am I currently in a safety session?") */}
      {activeIncident ? (
        <div className="p-4 sm:p-5 bg-brand-peach border border-coral-300 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-coral animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-coral text-white flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <strong className="text-brand-coral font-black text-sm block">
                Active Emergency Distress Alert Dispatched
              </strong>
              <span className="text-brand-text">
                Your circle is actively notified. Live GPS broadcast is active.
              </span>
            </div>
          </div>
          <button
            onClick={() => openIncidentDetails(activeIncident.id)}
            className="px-4 py-2 bg-brand-coral hover:bg-red-600 text-white font-bold rounded-xl text-xs shadow-xs transition-all flex items-center gap-1.5"
          >
            <span>View Distress Details & Timeline</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : isCheckInOverdue ? (
        <div className="p-4 sm:p-5 bg-brand-peach/90 border border-brand-coral/50 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-coral animate-pulse-subtle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-coral text-white flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <strong className="text-brand-coral font-black text-sm block">
                ⚠️ Safety Check-in Overdue (+Grace Period Active)
              </strong>
              <span className="text-brand-text">
                Your scheduled deadline has elapsed. Confirm you are safe now before escalation alerts your circle.
              </span>
            </div>
          </div>
          <button
            onClick={() => activeCheckIn && confirmCheckInSafe(activeCheckIn.id)}
            className="px-4 py-2 bg-brand-coral hover:bg-red-600 text-white font-bold rounded-xl text-xs shadow-coral transition-all flex items-center gap-1.5 active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirm Safe Now</span>
          </button>
        </div>
      ) : activeJourney ? (
        <div className="p-4 sm:p-5 bg-brand-lavender/50 border border-violet-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-lavender text-brand-violet flex items-center justify-center shrink-0">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <strong className="text-brand-violet font-extrabold text-sm">
                  Safety Journey in Progress
                </strong>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-lavender text-brand-violet border border-violet-200">
                  ETA: {formatTimeOnly(activeJourney.expected_arrival_time)}
                </span>
              </div>
              <span className="text-brand-muted">
                Destination: <strong className="text-brand-text">{activeJourney.destination_name}</strong> • Safe Radius: {activeJourney.safe_radius_meters}m
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => confirmSafeArrival(activeJourney.id)}
              className="px-3.5 py-2 bg-brand-teal hover:bg-brand-deepTeal text-white rounded-xl font-bold text-xs shadow-teal transition-all flex items-center gap-1.5 active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm Safe Arrival</span>
            </button>
            <button
              onClick={() => setCurrentScreen('journeys')}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-brand-violet border border-violet-200 rounded-xl font-bold text-xs transition-colors flex items-center gap-1"
            >
              <span>View Route Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : activeCheckIn ? (
        <div className="p-4 sm:p-5 bg-brand-aqua/40 border border-teal-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-aqua text-brand-deepTeal flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-brand-teal" />
            </div>
            <div>
              <strong className="text-brand-deepTeal font-extrabold text-sm block">
                Safety Check-in Session Active
              </strong>
              <span className="text-brand-muted">
                Next response deadline: <strong className="text-brand-text">{formatTimeOnly(activeCheckIn.deadline_at)}</strong>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => confirmCheckInSafe(activeCheckIn.id)}
              className="px-4 py-2 bg-brand-teal hover:bg-brand-deepTeal text-white rounded-xl font-bold text-xs shadow-teal transition-all flex items-center gap-1.5 active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>I'm Safe</span>
            </button>
            <button
              onClick={() => setCurrentScreen('safety_setup')}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-brand-text border border-brand-border rounded-xl font-bold text-xs transition-colors"
            >
              Manage Check-ins
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 sm:p-5 bg-slate-50 border border-brand-border rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-brand-border text-brand-teal flex items-center justify-center shrink-0 shadow-2xs">
              <ShieldCheck className="w-5 h-5 text-brand-teal" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <strong className="text-brand-text font-bold text-sm">
                  Standby Protection Active
                </strong>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 text-brand-muted">
                  Not in active session
                </span>
              </div>
              <span className="text-brand-muted">
                DigiSakhi is ready. Start a journey or schedule a check-in whenever you need protection.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-brand-muted text-[11px] flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-brand-teal" />
              GPS: <strong className="text-brand-text capitalize">{locationPermission}</strong>
            </span>
            <span className="text-brand-muted text-[11px] flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-brand-violet" />
              Circle: <strong className="text-brand-text">{acceptedContacts.length} Verified</strong>
            </span>
          </div>
        </div>
      )}

      {/* 4. FIRST-TIME USER SETUP CHECKLIST (Guided onboarding based on actual saved state) */}
      {isSetupIncomplete && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-brand-border shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-brand-border">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-teal" />
                <h3 className="font-extrabold text-brand-text text-base">
                  Getting Started with DigiSakhi
                </h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-brand-aqua text-brand-deepTeal">
                  {completedCount} of {checklistItems.length} Complete
                </span>
              </div>
              <p className="text-xs text-brand-muted mt-0.5">
                Complete these initial steps to activate your personal safety circle.
              </p>
            </div>
            <button
              onClick={() => setIsChecklistDismissed(true)}
              className="text-xs text-brand-muted hover:text-brand-text p-1 flex items-center gap-1"
              title="Dismiss checklist"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {checklistItems.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 text-xs ${
                  item.completed
                    ? 'bg-slate-50/70 border-slate-200 text-brand-muted'
                    : 'bg-white border-brand-border shadow-2xs hover:border-teal-200'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      item.completed
                        ? 'bg-teal-100 text-brand-teal'
                        : 'border border-slate-300 text-transparent'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4
                      className={`font-bold ${
                        item.completed ? 'text-brand-muted line-through' : 'text-brand-text'
                      }`}
                    >
                      {item.label}
                    </h4>
                    <p className="text-[11px] text-brand-muted mt-0.5 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                {!item.completed && (
                  <button
                    onClick={item.onAction}
                    className="px-3 py-1.5 bg-brand-aqua hover:bg-teal-100 text-brand-deepTeal rounded-lg font-bold text-[11px] shrink-0 transition-colors"
                  >
                    {item.actionLabel}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. ONE LARGE PROMINENT PRIMARY CARD (Answers: "What should I do next?") */}
      {!activeJourney ? (
        <div className="bg-gradient-to-br from-brand-aqua/20 via-white to-brand-lavender/25 rounded-3xl p-6 sm:p-8 border border-brand-border shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-brand-lavender text-brand-violet border border-violet-200">
              Primary Protection Workflow
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-text tracking-tight mt-1">
              Start a Safety Journey
            </h2>
            <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
              Going out, commuting, or walking home alone? Launch a monitored journey. DigiSakhi verifies your arrival upon entering your destination safe radius, and escalates to your trusted circle if overdue.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setCurrentScreen('journeys')}
                className="px-6 py-3.5 bg-brand-teal hover:bg-brand-deepTeal text-white rounded-xl text-sm font-bold shadow-teal hover:shadow-hover transition-all flex items-center gap-2 active:scale-95"
              >
                <Compass className="w-4 h-4" />
                <span>Start a Safety Journey</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsCheckInModalOpen(true)}
                className="px-4 py-3 bg-white hover:bg-slate-50 text-brand-text border border-brand-border rounded-xl text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5"
              >
                <Clock className="w-4 h-4 text-brand-teal" />
                <span>Quick Check-in</span>
              </button>
            </div>
          </div>

          <div className="hidden lg:flex items-center justify-center p-6 shrink-0">
            <div className="w-28 h-28 rounded-3xl bg-white border border-brand-border shadow-elevated flex items-center justify-center text-brand-teal">
              <Compass className="w-14 h-14 stroke-[2.2] animate-pulse-subtle" />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-violet-50 via-white to-brand-aqua/20 rounded-3xl p-6 sm:p-8 border border-violet-200 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-brand-lavender text-brand-violet border border-violet-200">
              Active Transit
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-text tracking-tight mt-1">
              En Route to {activeJourney.destination_name}
            </h2>
            <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
              Safe arrival geofencing is active. Expected arrival: <strong className="text-brand-text">{formatTimeOnly(activeJourney.expected_arrival_time)}</strong>. Confirm your safe arrival once you reach your destination.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => confirmSafeArrival(activeJourney.id)}
                className="px-6 py-3.5 bg-brand-teal hover:bg-brand-deepTeal text-white rounded-xl text-sm font-bold shadow-teal transition-all flex items-center gap-2 active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Safe Arrival</span>
              </button>

              <button
                onClick={() => setCurrentScreen('journeys')}
                className="px-4 py-3 bg-white hover:bg-slate-50 text-brand-violet border border-violet-200 rounded-xl text-xs font-bold shadow-2xs transition-colors flex items-center gap-1.5"
              >
                <Compass className="w-4 h-4" />
                <span>Open Journey Map</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="hidden lg:flex items-center justify-center p-6 shrink-0">
            <div className="w-28 h-28 rounded-3xl bg-white border border-violet-200 shadow-elevated flex items-center justify-center text-brand-violet">
              <Compass className="w-14 h-14 stroke-[2.2] animate-spin-slow" />
            </div>
          </div>
        </div>
      )}

      {/* 6. SECONDARY AREA: 3 Clean Compact Summaries (Check-in, Trusted Circle, Recent Activity) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card A: Next Check-in Summary */}
        <div className="bg-white rounded-2xl p-5 border border-brand-border shadow-card flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-brand-aqua text-brand-teal flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-brand-muted">
                {activeCheckIn ? 'Active' : 'Standby'}
              </span>
            </div>
            <h3 className="font-extrabold text-brand-text text-sm">
              Safety Check-in
            </h3>
            <p className="text-xs text-brand-muted leading-relaxed">
              {activeCheckIn
                ? `Response scheduled for ${formatTimeOnly(activeCheckIn.deadline_at)}.`
                : 'No check-in currently counting down. Set a timer before leaving.'}
            </p>
          </div>

          <div className="pt-4 border-t border-brand-border/60 mt-4 flex items-center justify-between">
            {activeCheckIn ? (
              <button
                onClick={() => confirmCheckInSafe(activeCheckIn.id)}
                className="w-full py-2 bg-brand-teal hover:bg-brand-deepTeal text-white rounded-xl font-bold text-xs shadow-teal transition-all flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>I'm Safe</span>
              </button>
            ) : (
              <button
                onClick={() => setIsCheckInModalOpen(true)}
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-brand-text border border-brand-border rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1"
              >
                <span>Schedule Check-in</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Card B: Trusted Circle Status */}
        <div className="bg-white rounded-2xl p-5 border border-brand-border shadow-card flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-brand-lavender text-brand-violet flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-brand-muted font-mono">
                {acceptedContacts.length} Verified
              </span>
            </div>
            <h3 className="font-extrabold text-brand-text text-sm">
              Trusted Circle
            </h3>
            <p className="text-xs text-brand-muted leading-relaxed">
              {acceptedContacts.length > 0
                ? `${acceptedContacts.length} responders authorized for check-ins and emergency alerts.`
                : 'No verified contacts yet. Add your trusted friends or family members.'}
            </p>
          </div>

          <div className="pt-4 border-t border-brand-border/60 mt-4">
            <button
              onClick={() => setCurrentScreen('circle')}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-brand-text border border-brand-border rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1"
            >
              <span>Manage Circle</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card C: Recent Activity Preview */}
        <div className="bg-white rounded-2xl p-5 border border-brand-border shadow-card flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-brand-muted">
                Audit Trail
              </span>
            </div>
            <h3 className="font-extrabold text-brand-text text-sm">
              Recent Activity
            </h3>
            {recentEvents.length === 0 ? (
              <p className="text-xs text-brand-muted leading-relaxed">
                No safety events recorded yet. Recent events will appear here.
              </p>
            ) : (
              <div className="space-y-1.5 pt-1">
                {recentEvents.slice(0, 2).map((ev) => (
                  <div key={ev.id} className="text-[11px] leading-tight">
                    <span className="font-bold text-brand-text truncate block">
                      {ev.description}
                    </span>
                    <span className="text-brand-muted font-mono text-[10px]">
                      {formatRelativeTime(ev.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-brand-border/60 mt-4">
            <button
              onClick={() => setCurrentScreen('history')}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-brand-text border border-brand-border rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1"
            >
              <span>View Activity History</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
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