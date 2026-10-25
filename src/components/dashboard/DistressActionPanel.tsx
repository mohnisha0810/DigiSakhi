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
    <div className="bg-white border border-[#E8E1F3] rounded-2xl p-6 shadow-card space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#351078] bg-[#F2EDFF] px-3 py-1 rounded-full border border-[#5517C8]/20">
            Four Distress Codes
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#211638] mt-2 tracking-tight">
            Distress Signals & Action Triggers
          </h2>
          <p className="text-xs sm:text-sm text-[#716B80] mt-0.5">
            Distinct responses for different situations. Real events logged to database and synchronized with trusted contacts.
          </p>
        </div>

        <button
          onClick={() => handleOpenHelpModal('check_on_me')}
          className="px-4 py-2 bg-gradient-to-r from-[#5517C8] to-[#365BFF] hover:from-[#4510AB] hover:to-[#2A48D9] text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 active:scale-[0.98] cursor-pointer"
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
          className="group text-left p-5 rounded-2xl bg-slate-50 hover:bg-[#FAF9FF] border border-[#E8E1F3] hover:border-[#5517C8]/40 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#F2EDFF] text-[#5517C8] flex items-center justify-center group-hover:scale-105 transition-transform border border-[#5517C8]/20">
                <MessageCircleQuestion className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#F2EDFF] text-[#5517C8] border border-[#5517C8]/20">
                Discreet • Low
              </span>
            </div>
            <h3 className="font-extrabold text-[#211638] text-base group-hover:text-[#5517C8] transition-colors">
              “Check on Me”
            </h3>
            <p className="text-xs text-[#716B80] mt-1 leading-relaxed">
              Quietly asks your Tier 1 responder to ping you via text message. Does not trigger loud alarms or broadcast GPS coordinates.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E8E1F3] flex items-center justify-between text-xs font-bold text-[#5517C8]">
            <span>Configure & Send Ping</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* ACTION B: Call Me */}
        <button
          onClick={() => setIsEmergencyCallOpen(true)}
          className="group text-left p-5 rounded-2xl bg-slate-50 hover:bg-[#FAF9FF] border border-[#E8E1F3] hover:border-[#365BFF]/40 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#F2EDFF] text-[#365BFF] flex items-center justify-center group-hover:scale-105 transition-transform border border-[#365BFF]/20">
                <PhoneCall className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#F2EDFF] text-[#365BFF] border border-[#365BFF]/20">
                Direct Call • Pretext
              </span>
            </div>
            <h3 className="font-extrabold text-[#211638] text-base group-hover:text-[#365BFF] transition-colors">
              “Call Me / Helpline”
            </h3>
            <p className="text-xs text-[#716B80] mt-1 leading-relaxed">
              Instantly opens device telephone dialer for 112 emergency services, women helpline 1091, or your primary contact.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E8E1F3] flex items-center justify-between text-xs font-bold text-[#365BFF]">
            <span>Open Phone Dialer</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* ACTION C: Urgent Assistance */}
        <button
          onClick={() => setIsEmergencyMessageOpen(true)}
          className="group text-left p-5 rounded-2xl bg-red-50/50 hover:bg-red-50 border border-red-200 hover:border-red-400 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#D92D45] text-white flex items-center justify-center group-hover:scale-105 transition-transform animate-pulse">
                <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#D92D45] text-white shadow-xs">
                Emergency SOS
              </span>
            </div>
            <h3 className="font-extrabold text-[#211638] text-base group-hover:text-[#D92D45] transition-colors">
              “Urgent Assistance”
            </h3>
            <p className="text-xs text-[#716B80] mt-1 leading-relaxed">
              Broadcasts emergency alerts with live GPS coordinates via SMS / WhatsApp with instant message prefill.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-red-200/60 flex items-center justify-between text-xs font-bold text-[#D92D45]">
            <span>Send SOS Alert Now</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* ACTION D: Journey Check-in */}
        <button
          onClick={() => handleOpenHelpModal('journey_checkin')}
          className="group text-left p-5 rounded-2xl bg-slate-50 hover:bg-[#FAF9FF] border border-[#E8E1F3] hover:border-[#5517C8]/40 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#F2EDFF] text-[#5517C8] flex items-center justify-center group-hover:scale-105 transition-transform border border-[#5517C8]/20">
                <Compass className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#F2EDFF] text-[#351078] border border-[#5517C8]/20">
                Transit • Monitored
              </span>
            </div>
            <h3 className="font-extrabold text-[#211638] text-base group-hover:text-[#5517C8] transition-colors">
              “Journey Check-in”
            </h3>
            <p className="text-xs text-[#716B80] mt-1 leading-relaxed">
              Monitors commute or walking home. Entering the destination radius prompts arrival confirmation; overdue arrival escalates automatically.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E8E1F3] flex items-center justify-between text-xs font-bold text-[#5517C8]">
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
