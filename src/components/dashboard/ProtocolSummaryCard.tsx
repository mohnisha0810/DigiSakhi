import React from 'react';
import { useSafeSphere } from '@/store/SafeSphereContext';
import {
  Sliders,
  ArrowRight,
  Clock,
  Users,
  MapPin,
  Check,
} from 'lucide-react';

export const ProtocolSummaryCard: React.FC = () => {
  const { defaultProtocol, contacts, setCurrentScreen } = useSafeSphere();

  if (!defaultProtocol) return null;

  const orderedIds = defaultProtocol.escalation_contact_ids || [];
  const contact1 = contacts.find((c) => c.id === orderedIds[0]) || contacts[0];
  const contact2 = contacts.find((c) => c.id === orderedIds[1]) || contacts[1];

  return (
    <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand-lavender text-brand-violet flex items-center justify-center shadow-xs">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-brand-text text-sm">Active Safety Protocol</h3>
              <span className="text-[10px] font-bold bg-brand-aqua text-brand-teal border border-brand-teal/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Check className="w-2.5 h-2.5" />
                Default Active
              </span>
            </div>
            <p className="text-xs text-brand-muted mt-0.5">{defaultProtocol.name}</p>
          </div>
        </div>

        <button
          onClick={() => setCurrentScreen('protocols')}
          className="text-xs text-brand-violet hover:text-brand-violet/80 font-bold flex items-center gap-1 transition-colors"
        >
          <span>Edit Protocol</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Protocol summary explanation */}
      <div className="bg-brand-bg border border-brand-border rounded-xl p-4 text-xs text-brand-text space-y-3">
        <p className="leading-relaxed">
          <strong className="text-brand-text font-bold">Rule Execution: </strong>
          When a scheduled check-in or journey deadline is reached, DigiSakhi waits a{' '}
          <strong className="text-brand-teal font-bold">{Math.round(defaultProtocol.grace_period_seconds / 60)} minute</strong> grace period. If unconfirmed, Tier 1 alert dispatches to{' '}
          <strong className="text-brand-teal font-bold">{contact1?.full_name || 'Primary Contact'}</strong>. If unacknowledged within{' '}
          <strong className="text-brand-teal font-bold">{Math.round(defaultProtocol.contact_wait_seconds / 60)} minutes</strong>, escalates to Tier 2 ({contact2?.full_name || 'Secondary Contact'}).
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-brand-border text-[11px] text-brand-muted">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-brand-teal" />
            <span>Reminder: {Math.round(defaultProtocol.reminder_lead_seconds / 60)}m ahead</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-brand-violet" />
            <span>{contacts.filter((c) => c.status === 'accepted').length} Verified Contacts</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-brand-teal" />
            <span>
              GPS Sharing: {defaultProtocol.allow_location_sharing ? 'Enabled during active sessions' : 'Disabled'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
