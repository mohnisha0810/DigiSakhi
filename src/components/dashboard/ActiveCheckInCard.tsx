import React from 'react';
import { useSafeSphere } from '@/store/SafeSphereContext';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  XCircle,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { formatTimeOnly, formatDurationSeconds } from '@/lib/utils';

export const ActiveCheckInCard: React.FC = () => {
  const {
    activeCheckIn,
    confirmCheckInSafe,
    extendCheckInTime,
    cancelCheckIn,
    virtualTime,
    contacts,
    openIncidentDetails,
    setCurrentScreen,
    defaultProtocol,
    protocols,
  } = useSafeSphere();

  if (!activeCheckIn) {
    return (
      <div className="bg-white border border-[#E8E1F3] rounded-2xl p-6 shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-[#211638] text-base">No Active Check-in</h3>
            <p className="text-xs text-[#716B80] mt-0.5">
              Set a persistent safety timer with automatic multi-tier escalation before heading out.
            </p>
          </div>
        </div>
        <button
          onClick={() => setCurrentScreen('my_safety')}
          className="px-4 py-2.5 bg-gradient-to-r from-[#5517C8] to-[#365BFF] hover:from-[#4510AB] hover:to-[#2A48D9] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 whitespace-nowrap active:scale-[0.98] cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          Start New Check-in
        </button>
      </div>
    );
  }

  const deadline = new Date(activeCheckIn.deadline_at);
  const now = virtualTime;
  const diffSeconds = Math.round((deadline.getTime() - now.getTime()) / 1000);

  const isOverdue = diffSeconds <= 0;
  const isGracePeriod = activeCheckIn.status === 'in_grace_period';
  const isEscalated = activeCheckIn.status === 'escalated';

  const proto = protocols.find((p) => p.id === activeCheckIn.protocol_id) || defaultProtocol;
  const orderedIds = proto?.escalation_contact_ids || [];
  const targetId = orderedIds[(activeCheckIn.current_escalation_tier || 1) - 1];
  const tierContact = contacts.find((c) => c.id === targetId) || contacts[0];

  return (
    <div
      className={`border rounded-2xl p-6 shadow-card transition-all relative overflow-hidden ${
        isEscalated
          ? 'bg-red-50/60 border-red-300 shadow-red-500/10'
          : isGracePeriod
          ? 'bg-amber-50 border-amber-300 shadow-amber-500/10'
          : 'bg-white border-[#5517C8]/20 shadow-card'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              isEscalated
                ? 'bg-red-100 text-[#D92D45]'
                : isGracePeriod
                ? 'bg-amber-100 text-amber-700 animate-pulse'
                : 'bg-[#F2EDFF] text-[#5517C8]'
            }`}
          >
            {isEscalated ? (
              <ShieldAlert className="w-6 h-6 stroke-[2.2]" />
            ) : isGracePeriod ? (
              <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
            ) : (
              <Clock className="w-6 h-6 stroke-[2.2] animate-spin-slow" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-[#211638] text-base">{activeCheckIn.title}</h3>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                  isEscalated
                    ? 'bg-[#D92D45] text-white border-transparent shadow-xs'
                    : isGracePeriod
                    ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                    : 'bg-[#F2EDFF] text-[#351078] border-[#5517C8]/20'
                }`}
              >
                {isEscalated
                  ? `Escalated to Tier ${activeCheckIn.current_escalation_tier}`
                  : isGracePeriod
                  ? 'Overdue Grace Period'
                  : 'Monitoring Active'}
              </span>
            </div>
            <p className="text-xs text-[#716B80] mt-0.5">
              Deadline: <span className="text-[#211638] font-bold">{formatTimeOnly(activeCheckIn.deadline_at)}</span>
            </p>
          </div>
        </div>

        {/* Big Countdown Timer */}
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-[#716B80] font-bold">
            {isOverdue ? 'Time Past Deadline' : 'Time Remaining'}
          </p>
          <p
            className={`text-2xl font-mono font-black ${
              isEscalated
                ? 'text-[#D92D45]'
                : isGracePeriod
                ? 'text-amber-600 animate-pulse'
                : 'text-[#5517C8]'
            }`}
          >
            {isOverdue ? `+${formatDurationSeconds(Math.abs(diffSeconds))}` : formatDurationSeconds(diffSeconds)}
          </p>
        </div>
      </div>

      {/* State banner notes */}
      {isEscalated && (
        <div className="mb-4 p-3.5 bg-white border border-red-200 rounded-xl text-xs text-[#D92D45] flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#D92D45] shrink-0" />
            <span>
              Alert dispatched to <strong className="text-[#211638]">{tierContact?.full_name || 'Contact'}</strong>. Awaiting acknowledgement.
            </span>
          </div>
          {activeCheckIn.active_incident_id && (
            <button
              onClick={() => openIncidentDetails(activeCheckIn.active_incident_id!)}
              className="text-xs text-[#D92D45] font-bold hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
            >
              View Incident
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {isGracePeriod && (
        <div className="mb-4 p-3.5 bg-amber-100/70 border border-amber-300 rounded-xl text-xs text-amber-800 flex items-center gap-2 shadow-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 animate-bounce" />
          <span>
            Check-in deadline passed! Grace buffer is running. Confirm safety now to prevent automated escalation to your contacts.
          </span>
        </div>
      )}

      {/* Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E8E1F3]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => confirmCheckInSafe(activeCheckIn.id)}
            className="px-4 py-2.5 bg-gradient-to-r from-[#5517C8] to-[#365BFF] hover:from-[#4510AB] hover:to-[#2A48D9] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 active:scale-[0.98] cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            I Am Safe (Check In)
          </button>

          <button
            onClick={() => extendCheckInTime(activeCheckIn.id, 15)}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#211638] rounded-xl text-xs font-bold border border-[#E8E1F3] transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Add 15 minutes to check-in deadline"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#5517C8]" />
            +15 Mins
          </button>
        </div>

        <button
          onClick={() => cancelCheckIn(activeCheckIn.id)}
          className="text-xs text-[#716B80] hover:text-[#D92D45] transition-colors flex items-center gap-1 px-2 py-1 font-semibold cursor-pointer"
        >
          <XCircle className="w-3.5 h-3.5" />
          Cancel Timer
        </button>
      </div>
    </div>
  );
};
