import React, { useState } from 'react';
import { useSafeSphere } from '@/store/SafeSphereContext';
import { DistressActionPanel } from '../dashboard/DistressActionPanel';
import { ActiveCheckInCard } from '../dashboard/ActiveCheckInCard';
import { ActiveIncidentsBanner } from '../dashboard/ActiveIncidentsBanner';
import { CheckInSetupModal } from '../checkin/CheckInSetupModal';
import { EmergencyMessageModal } from './EmergencyMessageModal';
import { EmergencyCallModal } from './EmergencyCallModal';
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  Plus,
  Radio,
  Sliders,
  CheckCircle2,
  Users,
  PhoneCall,
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
  const [isEmergencyMessageOpen, setIsEmergencyMessageOpen] = useState(false);
  const [isEmergencyCallOpen, setIsEmergencyCallOpen] = useState(false);

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

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Emergency SOS Button */}
          <button
            onClick={() => setIsEmergencyMessageOpen(true)}
            className="px-4 py-2.5 bg-brand-coral hover:bg-red-600 text-white rounded-xl text-xs font-black shadow-coral transition-all flex items-center gap-1.5 active:scale-[0.98]"
            title="Dispatch urgent emergency SOS text with live GPS location"
          >
            <ShieldAlert className="w-4 h-4 animate-pulse" />
            <span>Emergency SOS</span>
          </button>

          {/* Emergency Call Button */}
          <button
            onClick={() => setIsEmergencyCallOpen(true)}
            className="px-3.5 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 active:scale-[0.98]"
            title="Dial 112 National Emergency Helpline or Primary Contact"
          >
            <PhoneCall className="w-4 h-4 text-coral-400" />
            <span>Call 112</span>
          </button>

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
