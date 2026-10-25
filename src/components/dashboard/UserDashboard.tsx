import React, { useState } from 'react';
import { useSafeSphere } from '@/store/SafeSphereContext';
import { ActiveCheckInCard } from './ActiveCheckInCard';
import { ActiveJourneyCard } from './ActiveJourneyCard';
import { ActiveIncidentsBanner } from './ActiveIncidentsBanner';
import { SetupRoadmap } from './SetupRoadmap';
import { CheckInSetupModal } from '../checkin/CheckInSetupModal';
import { JourneySetupModal } from '../journey/JourneySetupModal';
import { SafetySessionModal } from '../safety/SafetySessionModal';
import { EmergencyMessageModal } from '../safety/EmergencyMessageModal';
import { EmergencyCallModal } from '../safety/EmergencyCallModal';
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
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { DistressType } from '@/types';

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
    setCurrentScreen,
    openIncidentDetails,
  } = useSafeSphere();

  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isJourneyModalOpen, setIsJourneyModalOpen] = useState(false);
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);
  const [isEmergencyMessageOpen, setIsEmergencyMessageOpen] = useState(false);
  const [isEmergencyCallOpen, setIsEmergencyCallOpen] = useState(false);
  const [safetyModalInitialType, setSafetyModalInitialType] = useState<DistressType>('check_on_me');

  const acceptedContacts = contacts.filter((c) => c.status === 'accepted');
  const recentEvents = incidentEvents.slice(0, 3);

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handleOpenSafetyModal = (type: DistressType = 'check_on_me') => {
    setSafetyModalInitialType(type);
    setIsSafetyModalOpen(true);
  };

  const isCheckInOverdue =
    activeCheckIn &&
    (activeCheckIn.status === 'in_grace_period' || activeCheckIn.status === 'escalated');

  // Determine Dominant Primary Action
  const renderDominantAction = () => {
    if (activeIncident) {
      return (
        <button
          onClick={() => openIncidentDetails(activeIncident.id)}
          className="px-6 py-3.5 bg-brand-coral hover:bg-red-600 text-white rounded-xl text-sm font-bold shadow-coral hover:shadow-hover transition-all flex items-center gap-2 active:scale-[0.98]"
        >
          <ShieldAlert className="w-5 h-5 animate-pulse" />
          <span>Active Distress Alert • View Status & Timeline</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      );
    }

    if (activeCheckIn) {
      return (
        <button
          onClick={() => setCurrentScreen('my_safety')}
          className="px-6 py-3.5 bg-brand-teal hover:bg-brand-deepTeal text-white rounded-xl text-sm font-bold shadow-teal hover:shadow-hover transition-all flex items-center gap-2 active:scale-[0.98]"
        >
          <Clock className="w-5 h-5 animate-spin-slow" />
          <span>Active Check-in • Confirm Safety</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      );
    }

    if (activeJourney) {
      return (
        <button
          onClick={() => setCurrentScreen('journeys')}
          className="px-6 py-3.5 bg-brand-violet hover:bg-violet-700 text-white rounded-xl text-sm font-bold shadow-violet hover:shadow-hover transition-all flex items-center gap-2 active:scale-[0.98]"
        >
          <Compass className="w-5 h-5" />
          <span>Active Journey • View Transit & Map</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      );
    }

    return (
      <button
        onClick={() => handleOpenSafetyModal('check_on_me')}
        className="px-6 py-3.5 bg-brand-teal hover:bg-brand-deepTeal text-white rounded-xl text-sm font-bold shadow-teal hover:shadow-hover transition-all flex items-center gap-2 active:scale-[0.98]"
      >
        <Shield className="w-5 h-5" />
        <span>Start a Safety Session</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Contextual Alert: No Trusted Contacts Added */}
      {acceptedContacts.length === 0 && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <strong className="text-amber-900 font-bold block text-sm">
                No Verified Trusted Responders in Circle
              </strong>
              <span className="text-amber-800">
                DigiSakhi escalation requires at least one verified contact to alert during overdue check-ins or distress.
              </span>
            </div>
          </div>
          <button
            onClick={() => setCurrentScreen('circle')}
            className="px-4 py-2 bg-brand-teal hover:bg-brand-deepTeal text-white font-bold rounded-xl text-xs shadow-teal transition-all flex items-center gap-1.5"
          >
            <span>Add Trusted Contacts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Contextual Alert: Overdue Check-in */}
      {isCheckInOverdue && (
        <div className="p-4 bg-brand-peach/80 border border-brand-coral/40 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs animate-pulse-subtle">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-brand-coral shrink-0" />
            <div>
              <strong className="text-brand-coral font-bold block text-sm">
                ⚠️ Safety Check-in Overdue (+Grace Period Buffer Active)
              </strong>
              <span className="text-brand-text">
                Your scheduled deadline has elapsed. Please mark safe or extend duration immediately before secondary escalation alerts your circle.
              </span>
            </div>
          </div>
          <button
            onClick={() => setCurrentScreen('my_safety')}
            className="px-4 py-2 bg-brand-coral hover:bg-red-600 text-white font-bold rounded-xl text-xs shadow-coral transition-all flex items-center gap-1.5"
          >
            <span>Resolve or Extend Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Active Incident Urgent Alert Banner if triggered */}
      <ActiveIncidentsBanner />

      {/* Hero Welcome Section with Tasteful Safety Artwork */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-aqua/40 via-white to-brand-lavender/30 border border-brand-border p-6 sm:p-8 shadow-card">
        {/* Layered decorative gradient artwork */}
        <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full bg-gradient-to-br from-teal-200/40 to-violet-300/30 blur-2xl pointer-events-none" />
        <div className="absolute right-32 -bottom-12 w-48 h-48 rounded-full bg-gradient-to-tr from-brand-aqua/60 to-brand-lavender/40 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 backdrop-blur border border-teal-200/80 shadow-xs mb-3">
              <span className="w-2 h-2 rounded-full bg-brand-teal animate-pulse" />
              <span className="text-xs font-bold text-brand-deepTeal">
                {getGreeting()}, {currentUser.full_name.split(' ')[0]}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-brand-text tracking-tight leading-tight">
              Your safety, your way.
            </h1>

            <p className="text-sm sm:text-base text-brand-muted mt-2 leading-relaxed">
              Everything you need to feel more prepared, connected, and in control. Set personalized check-in deadlines, monitor commutes, and alert your circle with discreet codes.
            </p>

            {/* Dominant Primary Action & Secondary Actions */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              {renderDominantAction()}

              {!activeJourney && (
                <button
                  onClick={() => setIsJourneyModalOpen(true)}
                  className="px-5 py-3.5 bg-white hover:bg-slate-50 text-brand-text border border-brand-border rounded-xl text-sm font-bold shadow-xs transition-colors flex items-center gap-2"
                >
                  <Compass className="w-4 h-4 text-brand-violet" />
                  <span>Plan a Journey</span>
                </button>
              )}

              {/* Direct Emergency SOS Button */}
              <button
                onClick={() => setIsEmergencyMessageOpen(true)}
                className="px-5 py-3.5 bg-brand-coral hover:bg-red-600 text-white rounded-xl text-sm font-extrabold shadow-coral transition-all flex items-center gap-2 active:scale-[0.98]"
                title="Send urgent emergency SOS broadcast to trusted circle with live GPS location"
              >
                <ShieldAlert className="w-4 h-4 animate-pulse" />
                <span>Emergency SOS</span>
              </button>

              {/* Direct Emergency Call Button */}
              <button
                onClick={() => setIsEmergencyCallOpen(true)}
                className="px-5 py-3.5 bg-slate-900 hover:bg-black text-white rounded-xl text-sm font-bold shadow-xs transition-all flex items-center gap-2 active:scale-[0.98]"
                title="Directly dial 112 National Emergency Helpline or your primary contact"
              >
                <PhoneCall className="w-4 h-4 text-coral-400" />
                <span>Call 112</span>
              </button>
            </div>
          </div>

          {/* Refined Abstract Safety Badge Artwork */}
          <div className="hidden lg:flex flex-col items-center justify-center shrink-0">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-brand-teal/20 to-brand-violet/20 animate-float" />
              <div className="w-24 h-24 rounded-2xl bg-white shadow-elevated border border-brand-border flex items-center justify-center relative z-10">
                <ShieldCheck className="w-12 h-12 text-brand-teal stroke-[2.2]" />
              </div>
              <div className="absolute -bottom-2 -right-2 px-2.5 py-1 rounded-full bg-brand-lavender text-brand-violet text-[10px] font-extrabold border border-violet-200 shadow-xs z-20 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-brand-violet" />
                <span>Protected</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* B. One Attractive Current Safety Status Card driven by real data */}
      <div className="bg-white rounded-2xl p-5 border border-brand-border shadow-card flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-brand-aqua text-brand-deepTeal flex items-center justify-center font-bold shrink-0">
            <Shield className="w-5 h-5 text-brand-teal stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-brand-text text-sm sm:text-base">
                Current Safety Perimeter
              </h2>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-brand-aqua text-brand-deepTeal border border-teal-200">
                Active Protocol
              </span>
            </div>
            <p className="text-xs text-brand-muted mt-0.5">
              Protocol: <strong className="text-brand-text">{defaultProtocol?.name || 'Standard Protocol'}</strong> • Escalation Chain:{' '}
              <strong className="text-brand-text">{acceptedContacts.length} Verified Responders</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-brand-border text-brand-muted">
            <MapPin className="w-3.5 h-3.5 text-brand-teal" />
            <span>GPS: <strong className="text-brand-text capitalize">{locationPermission}</strong></span>
          </div>

          <button
            onClick={() => setCurrentScreen('protocols')}
            className="text-xs font-bold text-brand-violet hover:text-violet-700 flex items-center gap-1 transition-colors"
          >
            <span>Review Rules</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* D. Three Quick-Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Request a Check-in */}
        <div className="bg-white rounded-2xl p-5 border border-brand-border shadow-card hover:shadow-hover transition-all flex flex-col justify-between group">
          <div>
            <div className="w-10 h-10 rounded-xl bg-brand-aqua text-brand-teal flex items-center justify-center mb-3">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-brand-text text-base group-hover:text-brand-teal transition-colors">
              Schedule Check-in
            </h3>
            <p className="text-xs text-brand-muted mt-1 leading-relaxed">
              Set a timed safety session before heading out. If unconfirmed before deadline + grace buffer, your circle escalates automatically.
            </p>
          </div>

          <button
            onClick={() => setIsCheckInModalOpen(true)}
            className="mt-4 w-full py-2.5 rounded-xl bg-brand-aqua hover:bg-teal-100 text-brand-deepTeal font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Configure Check-in</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 2: Plan a Journey */}
        <div className="bg-white rounded-2xl p-5 border border-brand-border shadow-card hover:shadow-hover transition-all flex flex-col justify-between group">
          <div>
            <div className="w-10 h-10 rounded-xl bg-brand-lavender text-brand-violet flex items-center justify-center mb-3">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-brand-text text-base group-hover:text-brand-violet transition-colors">
              Plan a Journey
            </h3>
            <p className="text-xs text-brand-muted mt-1 leading-relaxed">
              Real-time transit monitoring. Entering destination radius prompts safe arrival confirmation; overdue arrival triggers check-in escalation.
            </p>
          </div>

          <button
            onClick={() => setIsJourneyModalOpen(true)}
            className="mt-4 w-full py-2.5 rounded-xl bg-brand-lavender hover:bg-violet-100 text-brand-violet font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Plan Monitored Journey</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 3: Emergency Assistance */}
        <div className="bg-white rounded-2xl p-5 border border-brand-border shadow-card hover:shadow-hover transition-all flex flex-col justify-between group">
          <div>
            <div className="w-10 h-10 rounded-xl bg-brand-peach text-brand-coral flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-brand-text text-base group-hover:text-brand-coral transition-colors">
              Emergency SOS & Call
            </h3>
            <p className="text-xs text-brand-muted mt-1 leading-relaxed">
              Instant high-priority dispatch with live GPS location via WhatsApp/SMS, or direct 112 emergency phone dialer.
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => setIsEmergencyMessageOpen(true)}
              className="py-2.5 rounded-xl bg-brand-coral hover:bg-red-600 text-white font-bold text-xs shadow-coral transition-colors flex items-center justify-center gap-1.5 active:scale-[0.98]"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>SOS Alert</span>
            </button>
            <button
              onClick={() => setIsEmergencyCallOpen(true)}
              className="py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 active:scale-[0.98]"
            >
              <PhoneCall className="w-3.5 h-3.5 text-coral-400" />
              <span>Call 112</span>
            </button>
          </div>
        </div>
      </div>

      {/* E. Compact Setup Roadmap */}
      <SetupRoadmap />

      {/* F. Small Active Sessions Section (only when relevant) */}
      {(activeCheckIn || activeJourney) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-brand-text text-sm flex items-center gap-2">
              <Radio className="w-4 h-4 text-brand-teal animate-pulse" />
              <span>Active Safety Sessions in Progress</span>
            </h3>
            {activeJourney && (
              <button
                onClick={() => setCurrentScreen('journeys')}
                className="text-xs font-bold text-brand-violet hover:underline flex items-center gap-1"
              >
                <span>View Full Map & Tracking →</span>
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {activeCheckIn && <ActiveCheckInCard />}
            {activeJourney && <ActiveJourneyCard />}
          </div>
        </div>
      )}

      {/* G. Short Recent Activity List (latest 3 events) */}
      <div className="bg-white rounded-2xl p-6 border border-brand-border shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-brand-border">
          <h3 className="font-extrabold text-brand-text text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-teal" />
            <span>Recent Activity</span>
          </h3>
          <button
            onClick={() => setCurrentScreen('history')}
            className="text-xs font-bold text-brand-teal hover:text-brand-deepTeal flex items-center gap-1 transition-colors"
          >
            <span>View All History</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentEvents.length === 0 ? (
          <div className="py-6 text-center text-xs text-brand-muted">
            No recent activity recorded yet. Start a check-in or journey to see real-time events.
          </div>
        ) : (
          <div className="divide-y divide-brand-border">
            {recentEvents.map((ev) => (
              <div key={ev.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-brand-text">{ev.actor_name}</span>
                    <span className="text-[10px] uppercase px-1.5 py-0.2 rounded bg-slate-100 text-brand-muted font-medium">
                      {ev.actor_role.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-brand-muted text-xs mt-0.5 leading-relaxed">
                    {ev.description}
                  </p>
                </div>
                <span className="text-[11px] text-brand-muted shrink-0 font-mono">
                  {formatRelativeTime(ev.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Setup Modals */}
      <CheckInSetupModal
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
      />
      <JourneySetupModal
        isOpen={isJourneyModalOpen}
        onClose={() => setIsJourneyModalOpen(false)}
      />
      <SafetySessionModal
        isOpen={isSafetyModalOpen}
        onClose={() => setIsSafetyModalOpen(false)}
        initialType={safetyModalInitialType}
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
