import React from 'react';
import { useSafeSphere } from '@/store/SafeSphereContext';
import {
  ShieldAlert,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  Radio,
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { StatusBadge } from '@/components/common/StatusBadge';

export const ActiveIncidentsBanner: React.FC = () => {
  const {
    activeIncident,
    incidentRecipients,
    resolveIncident,
    openIncidentDetails,
  } = useSafeSphere();

  if (!activeIncident) return null;

  const recipients = incidentRecipients.filter((r) => r.incident_id === activeIncident.id);
  const acknowledgingRecipient = recipients.find((r) => r.status === 'acknowledged' || r.status === 'responding');
  const respondingRecipient = recipients.find((r) => r.is_responding);

  const isUrgent = activeIncident.priority === 'urgent';

  return (
    <div
      className={`rounded-2xl p-5 border shadow-card relative overflow-hidden transition-all animate-fadeIn ${
        isUrgent
          ? 'bg-brand-peach/70 border-coral-300 shadow-coral/10'
          : 'bg-brand-aqua/60 border-teal-300 shadow-teal/10'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
              isUrgent
                ? 'bg-brand-peach text-brand-coral animate-pulse'
                : 'bg-white text-brand-teal shadow-xs'
            }`}
          >
            <ShieldAlert className="w-6 h-6 stroke-[2.2]" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-brand-text">
                {activeIncident.incident_number}
              </span>
              <StatusBadge status={activeIncident.status} />
              <span className="text-xs text-brand-muted">
                {formatRelativeTime(activeIncident.created_at)}
              </span>
            </div>

            <h3 className="font-extrabold text-brand-text text-base mt-1">
              {activeIncident.title}
            </h3>

            {/* Responder acknowledgement status */}
            <div className="mt-2 flex items-center gap-2 flex-wrap text-xs">
              {respondingRecipient ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-teal-200 text-brand-deepTeal font-semibold shadow-xs">
                  <UserCheck className="w-4 h-4 text-brand-teal" />
                  <span>
                    <strong>{respondingRecipient.contact_name}</strong> is responding: "{respondingRecipient.response_note || 'On way'}"
                  </span>
                </div>
              ) : acknowledgingRecipient ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-violet-200 text-brand-violet font-semibold shadow-xs">
                  <UserCheck className="w-4 h-4 text-brand-violet" />
                  <span>
                    Acknowledged by <strong>{acknowledgingRecipient.contact_name}</strong> ({formatRelativeTime(acknowledgingRecipient.acknowledged_at)})
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-brand-border text-brand-muted font-medium shadow-xs">
                  <Radio className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  <span>
                    Dispatched to {recipients.length} contact{recipients.length !== 1 ? 's' : ''} (Awaiting acknowledgement)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
          <button
            onClick={() => resolveIncident(activeIncident.id, 'User marked safe and resolved incident.')}
            className="px-4 py-2 bg-brand-teal hover:bg-brand-deepTeal text-white rounded-xl text-xs font-bold transition-all shadow-teal flex items-center gap-1.5 active:scale-[0.98]"
          >
            <CheckCircle2 className="w-4 h-4" />
            I Am Safe • Resolve
          </button>

          <button
            onClick={() => openIncidentDetails(activeIncident.id)}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-brand-text rounded-xl text-xs font-bold border border-brand-border transition-colors flex items-center gap-1"
          >
            <span>Timeline</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
