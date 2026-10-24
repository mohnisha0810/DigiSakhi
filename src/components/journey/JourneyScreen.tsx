import React, { useState } from 'react';
import { useSafeSphere } from '@/store/SafeSphereContext';
import { ActiveJourneyCard } from '../dashboard/ActiveJourneyCard';
import { JourneySetupModal } from './JourneySetupModal';
import { SafetyMap } from '../map/SafetyMap';
import {
  Compass,
  MapPin,
  Plus,
  ShieldCheck,
  Calendar,
  Radio,
  Map,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';

export const JourneyScreen: React.FC = () => {
  const { activeJourney, journeys } = useSafeSphere();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-brand-border shadow-card flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-violet bg-brand-lavender px-3 py-1 rounded-full border border-violet-200">
            Feature Seven • Safe Arrival Verification
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-text mt-2 tracking-tight">
            Monitored Journeys & Live Route Map
          </h1>
          <p className="text-sm text-brand-muted mt-1 max-w-2xl leading-relaxed">
            Entering the destination radius prompts you to confirm safe arrival. Safety is never automatically assumed. If overdue, the connected Smart Check-in escalation initiates.
          </p>
        </div>

        {!activeJourney && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-brand-violet hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-violet hover:shadow-hover transition-all flex items-center gap-2 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Start Monitored Journey
          </button>
        )}
      </div>

      {/* Active Journey Card */}
      {activeJourney ? (
        <ActiveJourneyCard />
      ) : (
        <div className="bg-white rounded-2xl p-8 border border-brand-border shadow-card text-center max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-brand-lavender text-brand-violet flex items-center justify-center mx-auto mb-3">
            <Compass className="w-7 h-7" />
          </div>
          <h3 className="font-extrabold text-brand-text text-base">No Monitored Journey in Progress</h3>
          <p className="text-xs text-brand-muted mt-1 mb-4 leading-relaxed">
            Planning transit, walking home, or an evening commute? Launch a journey to activate geofenced safe arrival verification.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 bg-brand-violet hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-violet transition-colors"
          >
            Start Monitored Journey
          </button>
        </div>
      )}

      {/* Route & Live Map Section */}
      <div className="bg-white rounded-2xl p-6 border border-brand-border shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-brand-border">
          <h3 className="font-extrabold text-brand-text text-base flex items-center gap-2">
            <Map className="w-4 h-4 text-brand-teal" />
            <span>Interactive Safety Route Map</span>
          </h3>
          <span className="text-xs text-brand-muted font-medium">
            OpenStreetMap • Geofenced Perimeter
          </span>
        </div>
        <SafetyMap />
      </div>

      {/* Geofence verification explanation */}
      <div className="bg-white rounded-2xl p-6 border border-brand-border shadow-card">
        <h3 className="font-extrabold text-brand-text text-base mb-3 flex items-center gap-2">
          <Radio className="w-4 h-4 text-brand-teal" />
          <span>How Safe Arrival Verification Works</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-brand-text">
          <div className="p-4 rounded-xl bg-slate-50 border border-brand-border space-y-1.5">
            <span className="font-bold text-brand-deepTeal">1. Geofenced Radius Detection</span>
            <p className="text-[11px] text-brand-muted leading-relaxed">
              When device GPS crosses within your chosen destination radius (e.g. 200m), SafeSphere triggers an arrival prompt.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-brand-border space-y-1.5">
            <span className="font-bold text-brand-violet">2. Explicit Human Confirmation</span>
            <p className="text-[11px] text-brand-muted leading-relaxed">
              Crucial safety rule: SafeSphere never presumes safety automatically upon entering the geofence. The user must explicitly confirm safety.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-brand-border space-y-1.5">
            <span className="font-bold text-brand-coral">3. Automatic Overdue Fallback</span>
            <p className="text-[11px] text-brand-muted leading-relaxed">
              If expected arrival time passes without safe confirmation, the connected check-in escalation alerts Contact A immediately.
            </p>
          </div>
        </div>
      </div>

      {/* Past Journeys History */}
      <div className="bg-white rounded-2xl p-6 border border-brand-border shadow-card">
        <h3 className="font-extrabold text-brand-text text-base mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-brand-muted" />
          <span>Journey Records</span>
        </h3>

        {journeys.length === 0 ? (
          <EmptyState
            icon={Compass}
            title="No Journeys Recorded"
            description="Past transit journeys with verified arrival will appear here."
            actionLabel="Start Monitored Journey"
            onAction={() => setIsModalOpen(true)}
          />
        ) : (
          <div className="divide-y divide-brand-border">
            {journeys.map((jny) => (
              <div key={jny.id} className="py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-brand-text">To: {jny.destination_name}</span>
                    <StatusBadge status={jny.status} />
                  </div>
                  <p className="text-brand-muted text-[11px] mt-0.5">
                    From: {jny.origin_name} • Safe Radius: {jny.safe_radius_meters}m
                  </p>
                </div>

                <div className="text-right text-[11px] text-brand-muted font-mono">
                  ETA: {formatDateTime(jny.expected_arrival_time)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <JourneySetupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
