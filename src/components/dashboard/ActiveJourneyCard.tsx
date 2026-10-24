import React from 'react';
import { useSafeSphere } from '@/store/SafeSphereContext';
import {
  Compass,
  MapPin,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Radio,
  ArrowRight,
  EyeOff,
  Clock,
  Info,
} from 'lucide-react';
import { formatTimeOnly, calculateDistanceMeters } from '@/lib/utils';

export const ActiveJourneyCard: React.FC = () => {
  const {
    activeJourney,
    confirmSafeArrival,
    cancelJourney,
    virtualTime,
    setCurrentScreen,
    currentLocation,
    locationPermission,
    stopLocationSharing,
  } = useSafeSphere();

  if (!activeJourney) return null;

  const eta = new Date(activeJourney.expected_arrival_time);
  const now = virtualTime;
  const isPastETA = now >= eta;

  // Calculate distance if coordinates exist
  let distanceMeters: number | null = null;
  if (activeJourney.current_lat && activeJourney.current_lng) {
    distanceMeters = calculateDistanceMeters(
      activeJourney.current_lat,
      activeJourney.current_lng,
      activeJourney.dest_lat,
      activeJourney.dest_lng
    );
  }

  const isWithinRadius =
    distanceMeters !== null && distanceMeters <= activeJourney.safe_radius_meters;
  const isPromptingArrival =
    activeJourney.status === 'safe_arrival_pending' || isWithinRadius;
  const isOverdue =
    isPastETA || activeJourney.status === 'overdue_escalated';

  const isLocationDeniedOrUnavailable =
    locationPermission === 'denied' || locationPermission === 'unavailable';

  return (
    <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-card relative overflow-hidden space-y-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-brand-lavender text-brand-violet flex items-center justify-center shrink-0">
            <Compass className="w-6 h-6 stroke-[2.2] animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-brand-text text-base">Active Transit Journey</h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-lavender text-brand-violet border border-violet-200">
                Safe Arrival Monitored
              </span>
              {activeJourney.share_location && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-aqua text-brand-deepTeal border border-teal-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-teal animate-pulse" />
                  Live GPS
                </span>
              )}
            </div>
            <p className="text-xs text-brand-muted mt-0.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-brand-teal" />
              Destination: <strong className="text-brand-text">{activeJourney.destination_name}</strong>
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-brand-muted font-bold">Expected Arrival</p>
          <p className={`text-base font-mono font-black ${isPastETA ? 'text-amber-600' : 'text-brand-text'}`}>
            {formatTimeOnly(activeJourney.expected_arrival_time)}
          </p>
        </div>
      </div>

      {/* Overdue Warning connecting to Check-In Escalation */}
      {isOverdue && (
        <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="text-amber-950 block font-bold">Journey Overdue — Connected Escalation Active</strong>
            <p className="text-amber-800 text-[11px] mt-0.5 leading-relaxed">
              Expected arrival time has passed. The connected Smart Check-in grace period is counting down. If safe arrival is not confirmed, escalation alerts will dispatch to your trusted circle.
            </p>
          </div>
        </div>
      )}

      {/* Stale Location Notice */}
      {currentLocation?.isStale && activeJourney.share_location && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Stale Location: </strong> Last coordinate update was {Math.round(currentLocation.staleSeconds / 60)}m ago. Signal may be weak or device background throttled.
            </span>
          </div>
        </div>
      )}

      {/* Geolocation Denied / Unavailable Banner */}
      {isLocationDeniedOrUnavailable && (
        <div className="p-3 bg-slate-50 border border-brand-border rounded-xl text-xs text-brand-text flex items-start gap-2.5">
          <Info className="w-4 h-4 text-brand-violet shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="text-brand-text block font-bold">Manual Arrival Verification Active</strong>
            <p className="text-brand-muted text-[11px] mt-0.5 leading-relaxed">
              Device GPS tracking is disabled or unavailable. DigiSakhi will not fabricate fake coordinates. Confirm your arrival manually below when you arrive safely.
            </p>
          </div>
        </div>
      )}

      {/* Geofence Safe Radius Verification Prompt */}
      {isPromptingArrival && (
        <div className="p-4 bg-brand-aqua/50 border border-teal-300 rounded-xl text-xs text-brand-deepTeal shadow-xs animate-pulse-subtle">
          <div className="flex items-start gap-3">
            <Radio className="w-5 h-5 text-brand-teal shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-extrabold text-brand-text text-sm">
                Approaching Destination ({distanceMeters !== null ? `${distanceMeters}m away` : 'Safe Radius Reached'})
              </p>
              <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                DigiSakhi detected you have entered the designated safe arrival radius ({activeJourney.safe_radius_meters}m). Please confirm you have arrived safely. Safety is never automatically assumed.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => confirmSafeArrival(activeJourney.id)}
                  className="px-4 py-2 bg-brand-teal hover:bg-brand-deepTeal text-white rounded-xl font-bold text-xs shadow-teal transition-all flex items-center gap-1.5 active:scale-[0.98]"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Yes, I Have Safely Arrived
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Normal progress footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-brand-border">
        <div className="flex items-center gap-3 text-xs text-brand-muted">
          <span>Safe Radius: <strong className="text-brand-text">{activeJourney.safe_radius_meters}m</strong></span>
          <span>•</span>
          <span>
            {distanceMeters !== null
              ? `Distance: ~${distanceMeters >= 1000 ? (distanceMeters / 1000).toFixed(1) + 'km' : distanceMeters + 'm'}`
              : isLocationDeniedOrUnavailable
              ? 'Manual Mode'
              : 'GPS Tracking Active'}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {activeJourney.share_location && (
            <button
              onClick={stopLocationSharing}
              className="text-xs text-brand-coral hover:text-red-700 px-3 py-1.5 rounded-xl bg-brand-peach border border-coral-200 flex items-center gap-1 transition-colors font-bold"
              title="Stop sharing live location immediately"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>Stop Sharing</span>
            </button>
          )}

          <button
            onClick={() => setCurrentScreen('journeys')}
            className="text-xs text-brand-violet hover:text-violet-800 px-3 py-1.5 rounded-xl bg-brand-lavender border border-violet-200 flex items-center gap-1 font-bold"
          >
            <span>View Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => confirmSafeArrival(activeJourney.id)}
            className="px-3.5 py-1.5 bg-brand-teal hover:bg-brand-deepTeal text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 active:scale-[0.98]"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            I Am Safe
          </button>

          <button
            onClick={() => cancelJourney(activeJourney.id)}
            className="text-xs text-brand-muted hover:text-brand-coral p-1.5"
            title="Cancel Journey"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
