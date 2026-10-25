import React, { useState } from 'react';
import { useSafeSphere } from '@/store/SafeSphereContext';
import { IncidentTimeline } from '../incidents/IncidentTimeline';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  Clock,
  ShieldAlert,
  Send,
  Calendar,
  ChevronRight,
  Filter,
  CheckCircle2,
  Bell,
  Radio,
} from 'lucide-react';
import { formatDateTime, formatRelativeTime } from '@/lib/utils';

export const ActivityHistoryScreen: React.FC = () => {
  const {
    incidents,
    incidentEvents,
    notifications,
    openIncidentDetails,
    setCurrentScreen,
  } = useSafeSphere();

  const [activeTab, setActiveTab] = useState<'timeline' | 'incidents' | 'notifications'>('timeline');

  const sortedEvents = [...incidentEvents].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-[#E8E1F3] shadow-card flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#351078] bg-[#F2EDFF] px-3 py-1 rounded-full border border-[#5517C8]/20">
            Audit & Session Logs
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#211638] mt-2 tracking-tight">
            Activity History
          </h1>
          <p className="text-sm text-[#716B80] mt-1 max-w-2xl leading-relaxed">
            Transparent, chronological audit trails for every check-in, distress signal, acknowledgement, and notification dispatch.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="w-full sm:w-auto grid grid-cols-3 sm:flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-[#E8E1F3]">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'timeline'
                ? 'bg-white text-[#5517C8] shadow-sm'
                : 'text-[#716B80] hover:text-[#211638]'
            }`}
          >
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Timeline</span>
            <span className="hidden sm:inline-block text-[10px] bg-slate-100 text-[#716B80] px-1.5 py-0.2 rounded-full font-mono">
              {sortedEvents.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('incidents')}
            className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'incidents'
                ? 'bg-white text-[#5517C8] shadow-sm'
                : 'text-[#716B80] hover:text-[#211638]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Incidents</span>
            <span className="hidden sm:inline-block text-[10px] bg-slate-100 text-[#716B80] px-1.5 py-0.2 rounded-full font-mono">
              {incidents.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'notifications'
                ? 'bg-white text-[#5517C8] shadow-sm'
                : 'text-[#716B80] hover:text-[#211638]'
            }`}
          >
            <Bell className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Notifs</span>
            <span className="hidden sm:inline-block text-[10px] bg-slate-100 text-[#716B80] px-1.5 py-0.2 rounded-full font-mono">
              {notifications.length}
            </span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'timeline' && (
        <div className="bg-white rounded-2xl p-6 border border-[#E8E1F3] shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8E1F3]">
            <h3 className="font-bold text-[#211638] text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#5517C8]" />
              Chronological Security Timeline
            </h3>
            <span className="text-xs text-[#716B80] font-mono">
              {sortedEvents.length} recorded events
            </span>
          </div>

          {sortedEvents.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No Security Events Logged Yet"
              description="Actions, check-in deadlines, transit updates, and responder pings will be recorded here chronologically."
              actionLabel="Go to Safety Hub"
              onAction={() => setCurrentScreen('my_safety')}
              variant="teal"
            />
          ) : (
            <IncidentTimeline events={sortedEvents} />
          )}
        </div>
      )}

      {activeTab === 'incidents' && (
        <div className="bg-white rounded-2xl p-6 border border-[#E8E1F3] shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8E1F3]">
            <h3 className="font-bold text-[#211638] text-base flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#D92D45]" />
              Distress & Overdue Incidents
            </h3>
            <span className="text-xs text-[#716B80] font-mono">
              {incidents.length} sessions
            </span>
          </div>

          {incidents.length === 0 ? (
            <EmptyState
              icon={ShieldAlert}
              title="All Clear — No Incidents Recorded"
              description="No active or past distress alerts have been initiated. You are fully protected."
              actionLabel="Return to Dashboard"
              onAction={() => setCurrentScreen('home')}
              variant="teal"
            />
          ) : (
            <div className="divide-y divide-[#E8E1F3]">
              {incidents.map((inc) => (
                <div
                  key={inc.id}
                  onClick={() => openIncidentDetails(inc.id)}
                  className="py-4 flex flex-wrap items-center justify-between gap-3 text-xs cursor-pointer hover:bg-slate-50 px-3 rounded-xl transition-colors group"
                >
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-[#211638]">
                        {inc.incident_number}
                      </span>
                      <span className="font-bold text-[#211638]">{inc.title}</span>
                      <StatusBadge status={inc.priority} />
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-[#716B80] border border-slate-200">
                        {inc.incident_type.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-[#716B80] text-xs mt-1">
                      Initiated by <strong className="text-[#211638]">{inc.owner_name}</strong> •{' '}
                      {formatRelativeTime(inc.created_at)} ({formatDateTime(inc.created_at)})
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <StatusBadge status={inc.status} />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openIncidentDetails(inc.id);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 group-hover:bg-[#F2EDFF] group-hover:text-[#5517C8] text-[#211638] font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>View Responses</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="bg-white rounded-2xl p-6 border border-[#E8E1F3] shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8E1F3]">
            <h3 className="font-bold text-[#211638] text-base flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#5517C8]" />
              Notification Dispatch History
            </h3>
            <span className="text-xs text-[#716B80] font-mono">
              {notifications.length} dispatched
            </span>
          </div>

          {notifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No Notifications Dispatched"
              description="Real-time multi-channel delivery receipts (SMS, in-app, push) will appear here when alerts trigger."
              variant="slate"
            />
          ) : (
            <div className="divide-y divide-[#E8E1F3]">
              {notifications.map((notif) => (
                <div key={notif.id} className="py-3.5 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-[#211638]">
                      To: {notif.recipient_name} ({notif.recipient_email})
                    </span>
                    <span className="text-[#716B80] text-[11px] font-mono">
                      {formatRelativeTime(notif.created_at)}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[#211638]">{notif.subject}</p>
                  <p className="text-xs text-[#716B80]">{notif.message}</p>
                  <div className="pt-1 flex items-center gap-1.5 text-[11px] text-[#5517C8] font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{notif.provider_status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
