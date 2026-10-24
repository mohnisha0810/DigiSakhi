import React from 'react';
import { IncidentEvent } from '@/types';
import {
  Clock,
  Radio,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Send,
  MapPin,
  XCircle,
  ShieldAlert,
} from 'lucide-react';
import { formatDateTime, formatRelativeTime } from '@/lib/utils';

export const IncidentTimeline: React.FC<{ events: IncidentEvent[] }> = ({ events }) => {
  if (events.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-brand-muted">
        No event history logged yet.
      </div>
    );
  }

  const getEventIcon = (eventType: IncidentEvent['event_type']) => {
    switch (eventType) {
      case 'incident_created':
        return <ShieldAlert className="w-3.5 h-3.5 text-brand-coral" />;
      case 'notification_queued':
      case 'notification_dispatched':
        return <Send className="w-3.5 h-3.5 text-brand-violet" />;
      case 'notification_delivered':
        return <CheckCircle2 className="w-3.5 h-3.5 text-brand-teal" />;
      case 'acknowledged_by_contact':
        return <UserCheck className="w-3.5 h-3.5 text-brand-violet" />;
      case 'response_initiated':
        return <Radio className="w-3.5 h-3.5 text-brand-teal animate-pulse" />;
      case 'escalation_triggered':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />;
      case 'location_updated':
        return <MapPin className="w-3.5 h-3.5 text-brand-teal" />;
      case 'safe_confirmed_by_user':
      case 'incident_resolved':
        return <CheckCircle2 className="w-3.5 h-3.5 text-brand-teal" />;
      case 'incident_cancelled':
        return <XCircle className="w-3.5 h-3.5 text-brand-muted" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-brand-muted" />;
    }
  };

  return (
    <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-brand-border">
      {events.map((ev, index) => (
        <div key={ev.id || index} className="relative group">
          {/* Node icon */}
          <div className="absolute -left-6 top-1 w-6 h-6 rounded-full bg-white border border-brand-border shadow-xs flex items-center justify-center">
            {getEventIcon(ev.event_type)}
          </div>

          <div className="bg-brand-bg/70 border border-brand-border rounded-xl p-3.5 hover:border-brand-teal/40 transition-colors shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-1">
              <div className="flex items-center gap-1.5 font-medium text-brand-text">
                <span className="font-bold text-brand-text">{ev.actor_name}</span>
                <span className="text-[10px] text-brand-muted uppercase px-1.5 py-0.2 rounded bg-white border border-brand-border font-semibold">
                  {ev.actor_role.replace('_', ' ')}
                </span>
              </div>
              <span className="text-[11px] text-brand-muted font-mono" title={ev.created_at}>
                {formatDateTime(ev.created_at)} ({formatRelativeTime(ev.created_at)})
              </span>
            </div>

            <p className="text-xs text-brand-text leading-relaxed">
              {ev.description}
            </p>

            {ev.metadata && Object.keys(ev.metadata).length > 0 && (
              <div className="mt-2 text-[10px] font-mono text-brand-muted bg-white border border-brand-border p-2 rounded-lg overflow-x-auto">
                {JSON.stringify(ev.metadata)}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
