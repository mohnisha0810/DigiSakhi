import React, { useState } from 'react';
import { useSafeSphere } from '@/store/SafeSphereContext';
import { DistressType } from '@/types';
import { SafetySessionModal } from '@/components/safety/SafetySessionModal';
import { EmergencyMessageModal } from '@/components/safety/EmergencyMessageModal';
import { EmergencyCallModal } from '@/components/safety/EmergencyCallModal';
import {
  PhoneCall,
  MessageCircleQuestion,
  Compass,
  AlertTriangle,
  ArrowRight,
  Shield,
  ShieldAlert,
} from 'lucide-react';

export const DistressActionPanel: React.FC = () => {
  const { contacts } = useSafeSphere();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<DistressType>('check_on_me');
  const [isEmergencyMessageOpen, setIsEmergencyMessageOpen] = useState(false);
  const [isEmergencyCallOpen, setIsEmergencyCallOpen] = useState(false);

  const acceptedContacts = contacts.filter((c) => c.status === 'accepted');

  const handleOpenHelpModal = (type: DistressType) => {
    setSelectedType(type);
    setModalOpen(true);
  };

  return (
    <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-card space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-teal bg-brand-aqua px-3 py-1 rounded-full border border-teal-200">
            Four Distress Codes
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-brand-text mt-2 tracking-tight">
            Distress Signals & Action Triggers
          </h2>
          <p className="text-xs sm:text-sm text-brand-muted mt-0.5">
            Distinct responses for different situations. Real events logged to database and synchronized with trusted contacts.
          </p>
        </div>

        <button
          onClick={() => handleOpenHelpModal('check_on_me')}
          className="px-4 py-2 bg-brand-teal hover:bg-brand-deepTeal text-white rounded-xl text-xs font-bold shadow-teal transition-all flex items-center gap-1.5 active:scale-[0.98]"
        >
          <Shield className="w-4 h-4" />
          <span>Start a Safety Session</span>
        </button>
      </div>

      {/* Grid of 4 Distinct Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ACTION A: Check on Me */}
        <button
          onClick={() => handleOpenHelpModal('check_on_me')}
          className="group text-left p-5 rounded-2xl bg-slate-50/70 hover:bg-white border border-brand-border hover:border-teal-300 hover:shadow-card transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-brand-aqua text-brand-teal flex items-center justify-center group-hover:scale-105 transition-transform">
                <MessageCircleQuestion className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-brand-aqua text-brand-deepTeal border border-teal-200">
                Discreet • Low
              </span>
            </div>
            <h3 className="font-extrabold text-brand-text text-base group-hover:text-brand-teal transition-colors">
              “Check on Me”
            </h3>
            <p className="text-xs text-brand-muted mt-1 leading-relaxed">
              Quietly asks your Tier 1 responder to ping you via text message. Does not trigger loud alarms or broadcast GPS coordinates.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-brand-border/60 flex items-center justify-between text-xs font-bold text-brand-teal group-hover:text-brand-deepTeal">
            <span>Configure & Send Ping</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* ACTION B: Call Me */}
        <button
          onClick={() => setIsEmergencyCallOpen(true)}
          className="group text-left p-5 rounded-2xl bg-slate-50/70 hover:bg-white border border-brand-border hover:border-violet-300 hover:shadow-card transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-brand-lavender text-brand-violet flex items-center justify-center group-hover:scale-105 transition-transform">
                <PhoneCall className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-brand-lavender text-brand-violet border border-violet-200">
                Direct Call • Pretext
              </span>
            </div>
            <h3 className="font-extrabold text-brand-text text-base group-hover:text-brand-violet transition-colors">
              “Call Me / Helpline”
            </h3>
            <p className="text-xs text-brand-muted mt-1 leading-relaxed">
              Instantly opens device telephone dialer for 112 emergency services, women helpline 1091, or your primary contact.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-brand-border/60 flex items-center justify-between text-xs font-bold text-brand-violet group-hover:text-violet-700">
            <span>Open Phone Dialer</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* ACTION C: Urgent Assistance */}
        <button
          onClick={() => setIsEmergencyMessageOpen(true)}
          className="group text-left p-5 rounded-2xl bg-brand-peach/40 hover:bg-brand-peach/70 border border-coral-200/80 hover:border-brand-coral hover:shadow-card transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-brand-coral text-white flex items-center justify-center group-hover:scale-105 transition-transform animate-pulse">
                <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-brand-coral text-white shadow-xs">
                Emergency SOS
              </span>
            </div>
            <h3 className="font-extrabold text-brand-text text-base group-hover:text-brand-coral transition-colors">
              “Urgent Assistance”
            </h3>
            <p className="text-xs text-brand-muted mt-1 leading-relaxed">
              Broadcasts emergency alerts with live GPS coordinates via SMS / WhatsApp with instant message prefill.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-coral-200/60 flex items-center justify-between text-xs font-bold text-brand-coral group-hover:text-red-700">
            <span>Send SOS Alert Now</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* ACTION D: Journey Check-in */}
        <button
          onClick={() => handleOpenHelpModal('journey_checkin')}
          className="group text-left p-5 rounded-2xl bg-slate-50/70 hover:bg-white border border-brand-border hover:border-teal-300 hover:shadow-card transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-brand-aqua text-brand-deepTeal flex items-center justify-center group-hover:scale-105 transition-transform">
                <Compass className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-brand-aqua text-brand-deepTeal border border-teal-200">
                Transit • Monitored
              </span>
            </div>
            <h3 className="font-extrabold text-brand-text text-base group-hover:text-brand-deepTeal transition-colors">
              “Journey Check-in”
            </h3>
            <p className="text-xs text-brand-muted mt-1 leading-relaxed">
              Monitors commute or walking home. Entering the destination radius prompts arrival confirmation; overdue arrival escalates automatically.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-brand-border/60 flex items-center justify-between text-xs font-bold text-brand-teal group-hover:text-brand-deepTeal">
            <span>Launch Monitored Transit</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>

      {/* Guided Multi-Step Safety Session Modal */}
      <SafetySessionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialType={selectedType}
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
