import React, { useState } from 'react';
import { useSafeSphere } from '@/store/SafeSphereContext';
import { ActiveCheckInCard } from '../dashboard/ActiveCheckInCard';
import { CheckInSetupModal } from './CheckInSetupModal';
import {
  Clock,
  Plus,
  Calendar,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';

export const CheckInScreen: React.FC = () => {
  const { activeCheckIn, checkIns } = useSafeSphere();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#E8E1F3] rounded-2xl p-6 shadow-card flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#351078] bg-[#F2EDFF] px-2.5 py-0.5 rounded-full border border-[#5517C8]/20">
            Feature Two • Smart Check-in Engine
          </span>
          <h1 className="text-2xl font-bold text-[#211638] mt-1.5 flex items-center gap-2">
            Persistent Check-ins & Automatic Escalation
          </h1>
          <p className="text-xs text-[#716B80] mt-1 max-w-2xl leading-relaxed">
            Check-ins persist across browser tabs and device reboots. If you don't confirm safety before deadline + grace period, DigiSakhi initiates sequential contact alerts.
          </p>
        </div>

        {!activeCheckIn && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-[#5517C8] to-[#365BFF] hover:from-[#4510AB] hover:to-[#2A48D9] text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Safety Check-in
          </button>
        )}
      </div>

      {/* Active Check-in Card */}
      <ActiveCheckInCard />

      {/* How Escalation Works Diagram */}
      <div className="bg-white border border-[#E8E1F3] rounded-2xl p-6 shadow-card">
        <h3 className="font-bold text-[#211638] text-base mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#5517C8]" />
          Escalation Flow Architecture
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-[#E8E1F3] space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#5517C8]">Step 1</span>
            <p className="font-bold text-[#211638]">Deadline Set</p>
            <p className="text-[11px] text-[#716B80]">
              User configures arrival or check-in deadline. Reminder sent 2m before.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-[#E8E1F3] space-y-1">
            <span className="text-[10px] uppercase font-bold text-amber-600">Step 2</span>
            <p className="font-bold text-[#211638]">Grace Period</p>
            <p className="text-[11px] text-[#716B80]">
              A 3-minute grace buffer activates. Missed check-in is treated as overdue, not an assumed emergency.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-[#E8E1F3] space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#D92D45]">Step 3</span>
            <p className="font-bold text-[#211638]">Tier 1 Contact</p>
            <p className="text-[11px] text-[#716B80]">
              Primary responder receives high-priority alert. System waits for contact acknowledgement.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-[#E8E1F3] space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#365BFF]">Step 4</span>
            <p className="font-bold text-[#211638]">Tier 2 Escalation</p>
            <p className="text-[11px] text-[#716B80]">
              If Tier 1 does not acknowledge within wait window, alert escalates to Secondary responder.
            </p>
          </div>
        </div>
      </div>

      {/* Check-in History */}
      <div className="bg-white border border-[#E8E1F3] rounded-2xl p-6 shadow-card">
        <h3 className="font-bold text-[#211638] text-base mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#716B80]" />
          Check-in Session Records
        </h3>

        {checkIns.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No Check-ins Recorded"
            description="Past check-in sessions with confirmed arrival or escalation will appear here."
            actionLabel="New Safety Check-in"
            onAction={() => setIsModalOpen(true)}
          />
        ) : (
          <div className="divide-y divide-[#E8E1F3]">
            {checkIns.map((chk) => (
              <div key={chk.id} className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#211638]">{chk.title}</span>
                    <StatusBadge status={chk.status} />
                  </div>
                  <p className="text-[#716B80] text-[11px] mt-0.5">
                    Deadline: {formatDateTime(chk.deadline_at)} • Grace: {Math.round(chk.grace_period_seconds / 60)}m
                  </p>
                </div>

                <div className="text-right text-[11px] text-[#716B80] font-mono">
                  Created: {formatDateTime(chk.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CheckInSetupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
