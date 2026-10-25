import React from 'react';
import {
  UserCheck,
  Users,
  Compass,
  Clock,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface HowDigiSakhiWorksProps {
  onExplore?: () => void;
}

export const HowDigiSakhiWorks: React.FC<HowDigiSakhiWorksProps> = ({ onExplore }) => {
  const stages = [
    {
      step: 1,
      title: 'Create Your Account',
      description: 'Register and securely log in with persistent account protection.',
      icon: UserCheck,
      color: 'text-[#5517C8]',
      bg: 'bg-[#F2EDFF]',
      border: 'border-[#5517C8]/20',
    },
    {
      step: 2,
      title: 'Build Your Trusted Circle',
      description: 'Add trusted contacts with instant WhatsApp & SMS verification.',
      icon: Users,
      color: 'text-[#365BFF]',
      bg: 'bg-[#EAF7FF]',
      border: 'border-[#365BFF]/20',
    },
    {
      step: 3,
      title: 'Choose Your Safety Tool',
      description: 'Access Journey Tracking, timed Check-ins, or Emergency Assistance.',
      icon: Compass,
      color: 'text-[#08C9E8]',
      bg: 'bg-[#F0FDFF]',
      border: 'border-[#08C9E8]/30',
    },
    {
      step: 4,
      title: 'Use Safety Features',
      description: 'Manage active journeys, respond to check-in prompts, and track safety.',
      icon: Clock,
      color: 'text-[#5517C8]',
      bg: 'bg-[#F2EDFF]',
      border: 'border-[#5517C8]/20',
    },
    {
      step: 5,
      title: 'Get Emergency Assistance',
      description: 'Access 1-click SOS broadcast with live GPS and 112 helpline calling.',
      icon: ShieldAlert,
      color: 'text-[#D92D45]',
      bg: 'bg-[#FFF1F3]',
      border: 'border-[#D92D45]/30',
    },
    {
      step: 6,
      title: 'Confirm Your Safety',
      description: 'Confirm safe arrival and review your verified security audit logs.',
      icon: CheckCircle2,
      color: 'text-[#16865C]',
      bg: 'bg-[#E8F8F0]',
      border: 'border-[#16865C]/30',
    },
  ];

  return (
    <section className="bg-white rounded-3xl p-5 sm:p-7 border border-[#E8E1F3] shadow-card space-y-6">
      {/* Header & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E1F3]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F2EDFF] text-[#351078] border border-[#5517C8]/20 text-[10px] font-extrabold uppercase tracking-wider mb-2">
            <Sparkles className="w-3 h-3 text-[#5517C8]" />
            <span>Workflow Guide</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#211638] tracking-tight">
            How DigiSakhi Works
          </h2>
          <p className="text-xs sm:text-sm text-[#716B80] mt-1 leading-relaxed max-w-2xl">
            A seamless, proactive personal safety workflow designed to protect you from departure to arrival.
          </p>
        </div>

        {onExplore && (
          <button
            type="button"
            onClick={onExplore}
            className="self-start sm:self-center px-4 py-2.5 bg-gradient-to-r from-[#5517C8] to-[#365BFF] hover:from-[#4510AB] hover:to-[#2A48D9] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 active:scale-95 cursor-pointer shrink-0"
          >
            <span>Explore Safety Features</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* =========================================================================
          DESKTOP WORKFLOW (Horizontal Stepper Grid for lg screens)
          Visually connected, numbered sequence with consistent icons & short descriptions.
      ========================================================================= */}
      <div className="hidden lg:grid grid-cols-6 gap-3 relative">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const isLast = idx === stages.length - 1;

          return (
            <div key={stage.step} className="relative flex flex-col items-center text-center group">
              {/* Connector line between steps */}
              {!isLast && (
                <div className="absolute top-5 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-[#5517C8]/20 to-[#365BFF]/20 -z-0 pointer-events-none" />
              )}

              {/* Numbered Icon Node */}
              <div className="relative z-10 mb-3">
                <div
                  className={`w-11 h-11 rounded-2xl ${stage.bg} ${stage.color} border ${stage.border} flex items-center justify-center shadow-xs transition-transform group-hover:scale-110`}
                >
                  <Icon className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#211638] text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                  {stage.step}
                </span>
              </div>

              {/* Stage Title & Description */}
              <h3 className="font-extrabold text-[#211638] text-xs mb-1 group-hover:text-[#5517C8] transition-colors leading-snug">
                {stage.title}
              </h3>
              <p className="text-[11px] text-[#716B80] leading-snug">
                {stage.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* =========================================================================
          TABLET WORKFLOW (2-Row / 3-Column Grid for md screens)
      ========================================================================= */}
      <div className="hidden sm:grid lg:hidden grid-cols-3 gap-4">
        {stages.map((stage) => {
          const Icon = stage.icon;

          return (
            <div
              key={stage.step}
              className="p-4 rounded-2xl bg-[#FAF9FF] border border-[#E8E1F3] hover:border-[#5517C8]/30 transition-all flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-9 h-9 rounded-xl ${stage.bg} ${stage.color} border ${stage.border} flex items-center justify-center transition-transform group-hover:scale-105`}
                >
                  <Icon className="w-4 h-4 stroke-[2.2]" />
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white border border-[#E8E1F3] text-[#351078]">
                  Stage {stage.step}
                </span>
              </div>

              <div>
                <h3 className="font-extrabold text-[#211638] text-xs mb-1 group-hover:text-[#5517C8] transition-colors">
                  {stage.title}
                </h3>
                <p className="text-[11px] text-[#716B80] leading-relaxed">
                  {stage.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* =========================================================================
          MOBILE WORKFLOW (Vertical Timeline for < sm screens)
          Connected dots with continuous line on the left, clear typography.
      ========================================================================= */}
      <div className="sm:hidden relative pl-6 space-y-5 border-l-2 border-[#E8E1F3] ml-3">
        {stages.map((stage) => {
          const Icon = stage.icon;

          return (
            <div key={stage.step} className="relative group">
              {/* Timeline Dot Node */}
              <div
                className={`absolute -left-[35px] top-0 w-8 h-8 rounded-xl ${stage.bg} ${stage.color} border ${stage.border} flex items-center justify-center shadow-xs`}
              >
                <Icon className="w-4 h-4 stroke-[2.2]" />
              </div>

              <div className="pl-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-black uppercase text-[#351078] bg-[#F2EDFF] px-1.5 py-0.2 rounded font-mono">
                    Step {stage.step}
                  </span>
                  <h3 className="font-extrabold text-[#211638] text-xs">
                    {stage.title}
                  </h3>
                </div>
                <p className="text-[11px] text-[#716B80] leading-snug">
                  {stage.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
