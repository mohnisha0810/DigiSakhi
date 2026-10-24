import React, { useState } from 'react';
import { useSafeSphere } from '@/store/SafeSphereContext';
import { DistressActionPanel } from '../dashboard/DistressActionPanel';
import { ActiveCheckInCard } from '../dashboard/ActiveCheckInCard';
import { ActiveIncidentsBanner } from '../dashboard/ActiveIncidentsBanner';
import { CheckInSetupModal } from '../checkin/CheckInSetupModal';
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  Plus,
  Radio,
  Sliders,
  CheckCircle2,
  Users,
} from 'lucide-react';

export const MySafetyScreen: React.FC = () => {
  const {
    activeCheckIn,
    activeIncident,
    defaultProtocol,
    contacts,
    setCurrentScreen,
  } = useSafeSphere();

  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);

  const acceptedContacts = contacts.filter((c) => c.status === 'accepted');

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-6 border border-brand-border shadow-card flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-teal bg-brand-aqua px-3 py-1 rounded-full border border-teal-200">
              Personal Safety Hub
            </span>
            <span className="text-xs text-brand-muted">
              Armed with: <strong className="text-brand-text">{acceptedContacts.length} Verified Contacts</strong>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-text mt-2 tracking-tight">
            My Safety & Distress Codes
          </h1>
          <p className="text-sm text-brand-muted mt-1 max-w-2xl leading-relaxed">
            Four tailored safety actions designed for different real-world scenarios. Choose discreet assistance, an exit pretext call, or emergency broadcast.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {!activeCheckIn && (
            <button
              onClick={() => setIsCheckInModalOpen(true)}
              className="px-4 py-2.5 bg-brand-teal hover:bg-brand-deepTeal text-white rounded-xl text-xs font-bold shadow-teal hover:shadow-hover transition-all flex items-center gap-2 active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              Schedule Check-in
            </button>
          )}

          <button
            onClick={() => setCurrentScreen('protocols')}
            className="px-3.5 py-2.5 bg-brand-lavender hover:bg-violet-100 text-brand-violet rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            title="Configure safety escalation timing and contacts"
          >
            <Sliders className="w-4 h-4" />
            <span className="hidden sm:inline">Protocol Settings</span>
          </button>
        </div>
      </div>

      {/* Active Incident Banner if triggered */}
      <ActiveIncidentsBanner />

      {/* Active Check-in Card if running */}
      {activeCheckIn && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-brand-teal uppercase tracking-wider px-1">
            <Clock className="w-3.5 h-3.5 text-brand-teal animate-spin-slow" />
            <span>Active Safety Check-in Session</span>
          </div>
          <ActiveCheckInCard />
        </div>
      )}

      {/* 4 Distress Codes Action Panel */}
      <DistressActionPanel />

      {/* Modal for check-in setup */}
      <CheckInSetupModal
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
      />
    </div>
  );
};
