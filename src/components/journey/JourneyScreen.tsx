import React, { useState, useEffect } from 'react';
import { useSafeSphere } from '@/store/SafeSphereContext';
import { SafetyMap } from '../map/SafetyMap';
import { CustomJourneyCheckInPrompt } from './CustomJourneyCheckInPrompt';
import { EmergencyMessageModal } from '../safety/EmergencyMessageModal';
import { EmergencyCallModal } from '../safety/EmergencyCallModal';
import {
  Compass,
  MapPin,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Radio,
  EyeOff,
  Users,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  PhoneCall,
  XCircle,
  Sliders,
  Sparkles,
  Phone,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { DEMO_DESTINATION_COORDINATES } from '@/lib/geolocation';
import { formatDateTime, formatTimeOnly } from '@/lib/utils';
import { StatusBadge } from '@/components/common/StatusBadge';
import { StepProgress } from '@/components/common/StepProgress';

export const JourneyScreen: React.FC = () => {
  const {
    activeJourney,
    journeys,
    createJourney,
    createCustomJourney,
    confirmSafeArrival,
    cancelJourney,
    stopLocationSharing,
    virtualTime,
    locationPermission,
    contacts,
    setCurrentScreen,
  } = useSafeSphere();

  // Dynamic live clock for seconds-accurate countdowns
  const [liveNow, setLiveNow] = useState<Date>(virtualTime || new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveNow(virtualTime || new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, [virtualTime]);

  // Two ways to start: 'custom' or 'preset'
  const [startMode, setStartMode] = useState<'custom' | 'preset'>('custom');

  // Custom Plan Form State
  const [customJourneyName, setCustomJourneyName] = useState('Evening Commute');
  const [intervalType, setIntervalType] = useState<number | 'custom'>(10);
  const [customIntervalMinutes, setCustomIntervalMinutes] = useState(10);
  const [countdownSeconds, setCountdownSeconds] = useState(120);
  const [emergencyPhoneOption, setEmergencyPhoneOption] = useState<'112' | '1091' | '100' | 'custom'>('112');
  const [customEmergencyPhone, setCustomEmergencyPhone] = useState('');
  const [missedAction, setMissedAction] = useState<'reminder' | 'escalate'>('reminder');
  const [customOrigin, setCustomOrigin] = useState('Current Location');
  const [customDestination, setCustomDestination] = useState('Home');

  // Accepted Contacts from Circle
  const acceptedContacts = contacts.filter((c) => c.status === 'accepted');
  const [tier1Ids, setTier1Ids] = useState<string[]>(() =>
    acceptedContacts.length > 0 ? [acceptedContacts[0].id] : []
  );
  const [tier2Ids, setTier2Ids] = useState<string[]>(() =>
    acceptedContacts.length > 1 ? [acceptedContacts[1].id] : []
  );

  // Synchronize default contact selection if contacts load after mount
  useEffect(() => {
    if (acceptedContacts.length > 0 && tier1Ids.length === 0) {
      setTier1Ids([acceptedContacts[0].id]);
      if (acceptedContacts.length > 1) {
        setTier2Ids([acceptedContacts[1].id]);
      }
    }
  }, [contacts]);

  // Preset Plan State (for existing preset wizard)
  const [presetStep, setPresetStep] = useState(1);
  const [presetOrigin, setPresetOrigin] = useState('Current Location');
  const [presetDestination, setPresetDestination] = useState('Montgomery St Station');
  const [presetDestLat, setPresetDestLat] = useState(DEMO_DESTINATION_COORDINATES.latitude);
  const [presetDestLng, setPresetDestLng] = useState(DEMO_DESTINATION_COORDINATES.longitude);
  const [presetDuration, setPresetDuration] = useState(25);
  const [presetSafeRadius, setPresetSafeRadius] = useState(200);
  const [presetShareLocation, setPresetShareLocation] = useState(locationPermission === 'granted');
  const [presetSelectedContactIds, setPresetSelectedContactIds] = useState<string[]>(() =>
    acceptedContacts.map((c) => c.id)
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Modals for Emergency actions
  const [isEmergencyMessageOpen, setIsEmergencyMessageOpen] = useState(false);
  const [isEmergencyCallOpen, setIsEmergencyCallOpen] = useState(false);
  const [isEndingConfirmOpen, setIsEndingConfirmOpen] = useState(false);

  const presets = [
    { name: 'Montgomery St Station', lat: 37.7897, lng: -122.4011, mins: 20 },
    { name: 'University Campus Library', lat: 37.7765, lng: -122.4172, mins: 35 },
    { name: 'Home (Mission Bay Apt)', lat: 37.7712, lng: -122.3925, mins: 25 },
  ];

  const handleSelectPreset = (p: typeof presets[0]) => {
    setPresetDestination(p.name);
    setPresetDestLat(p.lat);
    setPresetDestLng(p.lng);
    setPresetDuration(p.mins);
  };

  const handleToggleTier1 = (contactId: string) => {
    setTier1Ids((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId]
    );
  };

  const handleToggleTier2 = (contactId: string) => {
    setTier2Ids((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId]
    );
  };

  // Start Custom Safety Journey Handler
  const handleStartCustomJourney = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const actualInterval =
      intervalType === 'custom' ? Number(customIntervalMinutes) : Number(intervalType);

    if (!actualInterval || actualInterval <= 0) {
      setValidationError('Please enter a valid check-in interval greater than 0 minutes.');
      return;
    }

    const emergencyNumber =
      emergencyPhoneOption === 'custom'
        ? customEmergencyPhone.trim()
        : emergencyPhoneOption;

    if (!emergencyNumber) {
      setValidationError('Please specify a valid emergency phone number for the Urgent Help action.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createCustomJourney({
        journeyName: customJourneyName.trim() || 'Custom Safety Journey',
        originName: customOrigin.trim() || 'Current Location',
        destinationName: customDestination.trim() || 'Safety Destination',
        checkInIntervalMinutes: actualInterval,
        responseCountdownSeconds: countdownSeconds,
        tier1ContactIds: tier1Ids,
        tier2ContactIds: tier2Ids,
        emergencyPhoneNumber: emergencyNumber,
        missedCheckinAction: missedAction,
        shareLocation: locationPermission === 'granted',
      });
    } catch (err: any) {
      setValidationError(err.message || 'Failed to start custom safety journey.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Start Preset Journey Handler
  const handleStartPresetJourney = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createJourney({
        originName: presetOrigin,
        destinationName: presetDestination,
        destLat: presetDestLat,
        destLng: presetDestLng,
        safeRadiusMeters: presetSafeRadius,
        durationMinutes: presetDuration,
        shareLocation: presetShareLocation && locationPermission !== 'denied' && locationPermission !== 'unavailable',
        allowedContactIds: presetSelectedContactIds,
      });
      setPresetStep(1);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Active Journey Countdown & Status Calculations
  let isCheckInDue = false;
  let isCheckInMissed = false;
  let secondsUntilNextCheckIn = 0;
  let formattedNextCheckIn = '';
  let formattedLastCheckIn = '';

  if (activeJourney) {
    const nextCheckInTime = activeJourney.next_check_in_at
      ? new Date(activeJourney.next_check_in_at)
      : new Date(activeJourney.expected_arrival_time);

    const countdownWindow = activeJourney.response_countdown_seconds || 120;
    const deadlineTime = new Date(nextCheckInTime.getTime() + countdownWindow * 1000);

    isCheckInDue = liveNow >= nextCheckInTime;
    isCheckInMissed = liveNow >= deadlineTime || activeJourney.check_in_status === 'missed';

    secondsUntilNextCheckIn = Math.max(
      0,
      Math.round((nextCheckInTime.getTime() - liveNow.getTime()) / 1000)
    );

    formattedNextCheckIn = formatTimeOnly(nextCheckInTime.toISOString());
    formattedLastCheckIn = activeJourney.last_check_in_at
      ? formatTimeOnly(activeJourney.last_check_in_at)
      : formatTimeOnly(activeJourney.start_time);
  }

  // Format MM:SS for countdown until next check-in
  const formatCountdownTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. TOP HEADER */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-brand-border shadow-card flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-violet bg-brand-lavender px-3 py-1 rounded-full border border-violet-200">
            Automated Check-ins & Transit Monitoring
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-text mt-2 tracking-tight">
            My Safety Journeys
          </h1>
          <p className="text-xs sm:text-sm text-brand-muted mt-1 max-w-2xl leading-relaxed">
            Configure periodic safety check-ins with visible response countdowns, 1-click Tier 1 & Tier 2 calling, and urgent emergency dialer handoffs.
          </p>
        </div>

        {activeJourney && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEmergencyMessageOpen(true)}
              className="px-3.5 py-2.5 bg-brand-coral hover:bg-red-600 text-white rounded-xl text-xs font-black shadow-coral transition-all flex items-center gap-1.5 active:scale-95"
            >
              <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
              <span>Emergency SOS</span>
            </button>
            <button
              onClick={() => setIsEndingConfirmOpen(true)}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-brand-text border border-brand-border rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5 text-brand-muted" />
              <span>End Journey</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. ACTIVE JOURNEY SCREEN */}
      {activeJourney ? (
        <div className="space-y-6 animate-fadeIn">
          {/* Main Active Journey Status Panel */}
          <div className="bg-white border border-brand-border rounded-3xl p-6 sm:p-8 shadow-card space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-brand-border">
              <div className="flex items-center gap-3.5">
                <div className="w-13 h-13 rounded-2xl bg-brand-lavender text-brand-violet flex items-center justify-center shrink-0 shadow-xs">
                  <Compass className="w-7 h-7 stroke-[2.2] animate-spin-slow" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-xl font-extrabold text-brand-text">
                      {activeJourney.journey_name || activeJourney.destination_name}
                    </h2>
                    <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                      Safety Journey Active
                    </span>
                    {activeJourney.journey_type === 'custom' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-lavender text-brand-violet border border-violet-200">
                        Custom Plan • {activeJourney.check_in_interval_minutes || 10}m
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-brand-muted mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-brand-teal" />
                    <span>Destination: <strong className="text-brand-text">{activeJourney.destination_name}</strong></span>
                    <span>•</span>
                    <span>Started: {formatTimeOnly(activeJourney.start_time)}</span>
                  </p>
                </div>
              </div>

              {/* Countdown Ticker Box */}
              <div className="bg-slate-50 border border-brand-border rounded-2xl p-3.5 sm:p-4 text-right shrink-0">
                <span className="text-[10px] uppercase font-bold text-brand-muted tracking-wider block">
                  Next Scheduled Check-in
                </span>
                <div className="flex items-baseline gap-2 justify-end">
                  <span className="text-2xl font-mono font-black text-brand-deepTeal">
                    {isCheckInDue ? 'Due Now' : formatCountdownTimer(secondsUntilNextCheckIn)}
                  </span>
                  <span className="text-xs text-brand-muted font-mono font-bold">
                    ({formattedNextCheckIn})
                  </span>
                </div>
                <span className="text-[10px] text-brand-muted block mt-0.5">
                  Last safe confirmation: <strong className="text-brand-text">{formattedLastCheckIn}</strong>
                </span>
              </div>
            </div>

            {/* LIVE CHECK-IN PROMPT WHEN DUE */}
            {(isCheckInDue || isCheckInMissed) && (
              <CustomJourneyCheckInPrompt journey={activeJourney} />
            )}

            {/* Normal Transit Controls & Details */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => confirmSafeArrival(activeJourney.id)}
                  className="px-5 py-3 bg-brand-teal hover:bg-brand-deepTeal text-white rounded-xl text-xs font-bold shadow-teal transition-all flex items-center gap-2 active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Safe Arrival (End Session)</span>
                </button>

                <button
                  onClick={() => setIsEmergencyCallOpen(true)}
                  className="px-4 py-3 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 active:scale-95"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-coral-400" />
                  <span>Call 112</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {activeJourney.share_location && (
                  <button
                    onClick={stopLocationSharing}
                    className="text-xs text-brand-coral hover:text-red-700 px-3.5 py-2.5 rounded-xl bg-brand-peach border border-coral-200 font-bold transition-colors flex items-center gap-1.5"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Stop Sharing GPS</span>
                  </button>
                )}

                <button
                  onClick={() => setIsEndingConfirmOpen(true)}
                  className="text-xs text-brand-muted hover:text-brand-coral px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-red-50 border border-brand-border font-bold transition-colors flex items-center gap-1"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>End Journey</span>
                </button>
              </div>
            </div>

            {/* Initiated Call History / Escalation Log */}
            {activeJourney.call_actions && activeJourney.call_actions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-brand-border space-y-2">
                <h4 className="text-xs font-extrabold text-brand-text flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-brand-teal" />
                  <span>Recent Call Actions in this Journey</span>
                </h4>
                <div className="space-y-1.5">
                  {activeJourney.call_actions.map((act) => (
                    <div
                      key={act.id}
                      className="p-3 rounded-xl bg-slate-50 border border-brand-border flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-brand-text capitalize">
                          {act.action_type.replace('_', ' ')}
                        </span>
                        <span className="text-brand-muted ml-2">
                          → {act.recipient_name} ({act.phone_number})
                        </span>
                      </div>
                      <span className="text-[11px] text-brand-muted font-mono">
                        {formatTimeOnly(act.timestamp)} • Dialer Opened
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Interactive Route Map */}
          <div className="bg-white rounded-3xl p-6 border border-brand-border shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-brand-teal" />
                <h3 className="font-extrabold text-brand-text text-base">
                  Live Transit Route & Safe Arrival Radius
                </h3>
              </div>
              <span className="text-xs text-brand-muted font-medium">
                OpenStreetMap • Geofenced Perimeter
              </span>
            </div>
            <SafetyMap />
          </div>
        </div>
      ) : (
        /* 3. TWO WAYS TO START A JOURNEY (When no journey is active) */
        <div className="space-y-6">
          {/* Top Option Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Option A: Customize My Own Safety Plan (Prominent / Recommended) */}
            <button
              type="button"
              onClick={() => setStartMode('custom')}
              className={`p-5 rounded-3xl border text-left transition-all relative ${
                startMode === 'custom'
                  ? 'bg-gradient-to-br from-brand-aqua/40 via-white to-brand-lavender/30 border-teal-300 shadow-card ring-2 ring-brand-teal/20'
                  : 'bg-white border-brand-border hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-2xl bg-brand-aqua text-brand-deepTeal flex items-center justify-center font-bold">
                  <Sliders className="w-5 h-5 text-brand-teal" />
                </div>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-brand-teal text-white">
                  Customizable
                </span>
              </div>
              <h3 className="font-extrabold text-brand-text text-base">
                Customize My Own Safety Plan
              </h3>
              <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                Choose custom check-in intervals (5, 10, 15, 20, 30m, or custom), response countdown, Tier 1 & Tier 2 contacts, and emergency dialer numbers.
              </p>
            </button>

            {/* Option B: Use a Preset Safety Plan */}
            <button
              type="button"
              onClick={() => setStartMode('preset')}
              className={`p-5 rounded-3xl border text-left transition-all ${
                startMode === 'preset'
                  ? 'bg-gradient-to-br from-brand-lavender/40 via-white to-brand-aqua/20 border-violet-300 shadow-card ring-2 ring-brand-violet/20'
                  : 'bg-white border-brand-border hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-2xl bg-brand-lavender text-brand-violet flex items-center justify-center font-bold">
                  <Compass className="w-5 h-5 text-brand-violet" />
                </div>
                <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-brand-muted">
                  Quick Preset
                </span>
              </div>
              <h3 className="font-extrabold text-brand-text text-base">
                Use a Preset Safety Plan
              </h3>
              <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                Rapid launch with standard destination arrival verification (Montgomery Station, Campus Library, Mission Bay Home).
              </p>
            </button>
          </div>

          {/* Validation Notice Banner */}
          {validationError && (
            <div className="p-4 bg-brand-peach border border-coral-300 rounded-2xl text-xs text-brand-coral flex items-center gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-brand-coral shrink-0" />
              <span className="font-bold">{validationError}</span>
            </div>
          )}

          {/* MODE 1: CUSTOM SAFETY JOURNEY SETUP FORM */}
          {startMode === 'custom' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-card space-y-6 animate-fadeIn">
              <div className="pb-4 border-b border-brand-border">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-brand-teal" />
                  <h2 className="text-xl font-extrabold text-brand-text">
                    Configure Custom Safety Journey
                  </h2>
                </div>
                <p className="text-xs text-brand-muted mt-1">
                  Tailor your check-in schedule, response countdown, escalation contacts, and emergency helpline.
                </p>
              </div>

              <form onSubmit={handleStartCustomJourney} className="space-y-6">
                {/* 1. Journey Name & Route */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase text-brand-deepTeal tracking-wider">
                    1. Journey Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-brand-text mb-1">
                        Journey Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={customJourneyName}
                        onChange={(e) => setCustomJourneyName(e.target.value)}
                        placeholder="e.g. Evening Commute, Cab to Airport"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-xs focus:ring-2 focus:ring-brand-teal focus:border-brand-teal"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-brand-text mb-1">
                        Origin (Starting Point)
                      </label>
                      <input
                        type="text"
                        value={customOrigin}
                        onChange={(e) => setCustomOrigin(e.target.value)}
                        placeholder="Current Location"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-xs focus:ring-2 focus:ring-brand-teal focus:border-brand-teal"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-brand-text mb-1">
                        Destination
                      </label>
                      <input
                        type="text"
                        value={customDestination}
                        onChange={(e) => setCustomDestination(e.target.value)}
                        placeholder="Home, Office, Station"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-xs focus:ring-2 focus:ring-brand-teal focus:border-brand-teal"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Check-in Interval Selection */}
                <div className="space-y-3 pt-2 border-t border-brand-border/60">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-black uppercase text-brand-deepTeal tracking-wider">
                        2. Check-in Interval
                      </h3>
                      <p className="text-[11px] text-brand-muted">
                        How often DigiSakhi prompts: "Are you okay? Please confirm your safety."
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-brand-teal">
                      Selected: {intervalType === 'custom' ? customIntervalMinutes : intervalType} mins
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                    {[5, 10, 15, 20, 30].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setIntervalType(mins)}
                        className={`p-3 rounded-xl border text-center text-xs font-bold transition-all ${
                          intervalType === mins
                            ? 'bg-brand-aqua text-brand-deepTeal border-teal-300 shadow-2xs font-black'
                            : 'bg-slate-50 text-brand-muted border-brand-border hover:bg-slate-100'
                        }`}
                      >
                        {mins} Minutes
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setIntervalType('custom')}
                      className={`p-3 rounded-xl border text-center text-xs font-bold transition-all ${
                        intervalType === 'custom'
                          ? 'bg-brand-aqua text-brand-deepTeal border-teal-300 shadow-2xs font-black'
                          : 'bg-slate-50 text-brand-muted border-brand-border hover:bg-slate-100'
                      }`}
                    >
                      Custom...
                    </button>
                  </div>

                  {intervalType === 'custom' && (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-brand-border space-y-2 animate-fadeIn">
                      <label className="block text-xs font-bold text-brand-text">
                        Enter Custom Check-in Interval (Minutes)
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min={1}
                          max={180}
                          value={customIntervalMinutes}
                          onChange={(e) => setCustomIntervalMinutes(Math.max(1, Number(e.target.value)))}
                          className="w-32 px-3 py-2 rounded-xl border border-brand-border text-xs font-bold"
                          required
                        />
                        <span className="text-xs text-brand-muted">
                          Minutes between check-in prompts (1 to 180 min)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Response Countdown Duration */}
                <div className="space-y-3 pt-2 border-t border-brand-border/60">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-black uppercase text-brand-deepTeal tracking-wider">
                        3. Response Countdown Duration
                      </h3>
                      <p className="text-[11px] text-brand-muted">
                        Time you have to tap "I'M OKAY 💚" before check-in is considered missed.
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-brand-violet">
                      {countdownSeconds} Seconds ({Math.round(countdownSeconds / 60)} min)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { secs: 60, label: '60s (1 min)' },
                      { secs: 120, label: '120s (2 min)' },
                      { secs: 180, label: '180s (3 min)' },
                      { secs: 300, label: '300s (5 min)' },
                    ].map((opt) => (
                      <button
                        key={opt.secs}
                        type="button"
                        onClick={() => setCountdownSeconds(opt.secs)}
                        className={`p-3 rounded-xl border text-center text-xs font-bold transition-all ${
                          countdownSeconds === opt.secs
                            ? 'bg-brand-lavender text-brand-violet border-violet-300 shadow-2xs font-black'
                            : 'bg-slate-50 text-brand-muted border-brand-border hover:bg-slate-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Tier 1 & Tier 2 Trusted Contacts */}
                <div className="space-y-4 pt-2 border-t border-brand-border/60">
                  <div>
                    <h3 className="text-xs font-black uppercase text-brand-deepTeal tracking-wider">
                      4. Trusted Responders (Tier 1 & Tier 2)
                    </h3>
                    <p className="text-[11px] text-brand-muted">
                      Select contacts from your circle. When you tap "I Need Help", Tier 1 is called first; Tier 2 is the backup responder.
                    </p>
                  </div>

                  {acceptedContacts.length === 0 ? (
                    <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="text-amber-900 font-bold">
                          No accepted contacts in your Trusted Circle.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentScreen('circle')}
                        className="px-3.5 py-1.5 bg-brand-teal text-white font-bold rounded-xl text-xs shadow-xs"
                      >
                        Add Contacts in Circle →
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Tier 1 Box */}
                      <div className="p-4 rounded-2xl border border-brand-border bg-slate-50 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-extrabold text-brand-text flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-brand-teal" />
                            <span>Tier 1 Contact (Primary Responder)</span>
                          </label>
                          <span className="text-[10px] text-brand-muted font-bold">
                            Called 1st on "I Need Help"
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {acceptedContacts.map((contact) => (
                            <label
                              key={`t1_${contact.id}`}
                              className={`p-2.5 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-colors ${
                                tier1Ids.includes(contact.id)
                                  ? 'bg-brand-aqua/40 border-teal-300 text-brand-deepTeal font-bold'
                                  : 'bg-white border-brand-border text-brand-muted'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={tier1Ids.includes(contact.id)}
                                  onChange={() => handleToggleTier1(contact.id)}
                                  className="w-4 h-4 rounded accent-brand-teal"
                                />
                                <div>
                                  <span className="font-bold text-brand-text">{contact.full_name}</span>
                                  <span className="text-[10px] text-brand-muted ml-1.5">
                                    ({contact.relationship})
                                  </span>
                                </div>
                              </div>
                              <span className="text-[11px] font-mono text-brand-muted">
                                {contact.phone_number}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Tier 2 Box */}
                      <div className="p-4 rounded-2xl border border-brand-border bg-slate-50 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-extrabold text-brand-text flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-brand-violet" />
                            <span>Tier 2 Contact (Backup Responder)</span>
                          </label>
                          <span className="text-[10px] text-brand-muted font-bold">
                            Available Escalation Step
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {acceptedContacts.map((contact) => (
                            <label
                              key={`t2_${contact.id}`}
                              className={`p-2.5 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-colors ${
                                tier2Ids.includes(contact.id)
                                  ? 'bg-brand-lavender/40 border-violet-300 text-brand-violet font-bold'
                                  : 'bg-white border-brand-border text-brand-muted'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={tier2Ids.includes(contact.id)}
                                  onChange={() => handleToggleTier2(contact.id)}
                                  className="w-4 h-4 rounded accent-brand-violet"
                                />
                                <div>
                                  <span className="font-bold text-brand-text">{contact.full_name}</span>
                                  <span className="text-[10px] text-brand-muted ml-1.5">
                                    ({contact.relationship})
                                  </span>
                                </div>
                              </div>
                              <span className="text-[11px] font-mono text-brand-muted">
                                {contact.phone_number}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. Emergency Phone Number for Urgent Help */}
                <div className="space-y-3 pt-2 border-t border-brand-border/60">
                  <div>
                    <h3 className="text-xs font-black uppercase text-brand-deepTeal tracking-wider">
                      5. Emergency Phone Number (for "URGENT HELP 🚨")
                    </h3>
                    <p className="text-[11px] text-brand-muted">
                      When you tap "Urgent Help", DigiSakhi immediately opens your native dialer with this number.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: '112', label: '112 (National Emergency)' },
                      { id: '1091', label: '1091 (Women Helpline)' },
                      { id: '100', label: '100 (Police)' },
                      { id: 'custom', label: 'Custom Number...' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setEmergencyPhoneOption(opt.id as any)}
                        className={`p-3 rounded-xl border text-center text-xs font-bold transition-all ${
                          emergencyPhoneOption === opt.id
                            ? 'bg-brand-peach text-brand-coral border-coral-300 shadow-2xs font-black'
                            : 'bg-slate-50 text-brand-muted border-brand-border hover:bg-slate-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {emergencyPhoneOption === 'custom' && (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-brand-border space-y-2 animate-fadeIn">
                      <label className="block text-xs font-bold text-brand-text">
                        Enter Emergency Phone Number
                      </label>
                      <input
                        type="tel"
                        value={customEmergencyPhone}
                        onChange={(e) => setCustomEmergencyPhone(e.target.value)}
                        placeholder="e.g. +91 98765 43210 or emergency service"
                        className="w-full sm:w-72 px-3.5 py-2.5 rounded-xl border border-brand-border text-xs font-bold"
                        required
                      />
                    </div>
                  )}
                </div>

                {/* 6. Missed Check-in Behavior */}
                <div className="space-y-3 pt-2 border-t border-brand-border/60">
                  <div>
                    <h3 className="text-xs font-black uppercase text-brand-deepTeal tracking-wider">
                      6. Missed Check-in Rule
                    </h3>
                    <p className="text-[11px] text-brand-muted">
                      What should happen if the response countdown window elapses without your confirmation?
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label
                      className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition-colors ${
                        missedAction === 'reminder'
                          ? 'bg-brand-aqua/30 border-teal-300 text-brand-deepTeal font-bold'
                          : 'bg-white border-brand-border text-brand-muted'
                      }`}
                    >
                      <input
                        type="radio"
                        name="missedAction"
                        checked={missedAction === 'reminder'}
                        onChange={() => setMissedAction('reminder')}
                        className="mt-0.5 accent-brand-teal"
                      />
                      <div>
                        <span className="font-bold text-brand-text block text-xs">
                          Persistent In-App Reminder Only
                        </span>
                        <span className="text-[11px] text-brand-muted font-normal">
                          Shows prominent warning with the 3 actions; does not alert contacts until you choose to.
                        </span>
                      </div>
                    </label>

                    <label
                      className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition-colors ${
                        missedAction === 'escalate'
                          ? 'bg-brand-aqua/30 border-teal-300 text-brand-deepTeal font-bold'
                          : 'bg-white border-brand-border text-brand-muted'
                      }`}
                    >
                      <input
                        type="radio"
                        name="missedAction"
                        checked={missedAction === 'escalate'}
                        onChange={() => setMissedAction('escalate')}
                        className="mt-0.5 accent-brand-teal"
                      />
                      <div>
                        <span className="font-bold text-brand-text block text-xs">
                          Escalate to Tier 1 Responder
                        </span>
                        <span className="text-[11px] text-brand-muted font-normal">
                          Sends automated notification to Tier 1 contact stating check-in deadline elapsed.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Submit & Start Button */}
                <div className="pt-4 border-t border-brand-border flex items-center justify-between">
                  <span className="text-xs text-brand-muted">
                    Safety session begins immediately upon confirmation.
                  </span>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3.5 bg-brand-teal hover:bg-brand-deepTeal text-white rounded-xl text-xs font-black shadow-teal transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <Compass className="w-4 h-4" />
                    <span>{isSubmitting ? 'Starting Journey...' : 'Start Custom Safety Journey 🚀'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* MODE 2: PRESET JOURNEY WIZARD (Existing 4-step wizard) */}
          {startMode === 'preset' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-card space-y-6 animate-fadeIn">
              <div className="pb-4 border-b border-brand-border">
                <h2 className="text-xl font-extrabold text-brand-text">
                  Preset Safety Plan Wizard
                </h2>
                <p className="text-xs text-brand-muted mt-1">
                  Follow this 4-step wizard for standard arrival verification.
                </p>
                <div className="mt-4">
                  <StepProgress
                    steps={[
                      { id: 1, label: 'Destination' },
                      { id: 2, label: 'Safety Settings' },
                      { id: 3, label: 'Circle & Permissions' },
                      { id: 4, label: 'Review & Start' },
                    ]}
                    currentStep={presetStep}
                  />
                </div>
              </div>

              <form onSubmit={handleStartPresetJourney}>
                {/* Step 1: Destination */}
                {presetStep === 1 && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-brand-text mb-1">
                          Origin
                        </label>
                        <input
                          type="text"
                          value={presetOrigin}
                          onChange={(e) => setPresetOrigin(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-xs"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-brand-text mb-1">
                          Destination
                        </label>
                        <input
                          type="text"
                          value={presetDestination}
                          onChange={(e) => setPresetDestination(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-xs"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-brand-text mb-1">
                        Presets
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {presets.map((p) => (
                          <button
                            key={p.name}
                            type="button"
                            onClick={() => handleSelectPreset(p)}
                            className={`p-3 rounded-xl border text-left text-xs transition-all ${
                              presetDestination === p.name
                                ? 'bg-brand-lavender text-brand-violet border-violet-300 font-bold'
                                : 'bg-slate-50 text-brand-muted border-brand-border hover:bg-slate-100'
                            }`}
                          >
                            <div className="font-bold text-brand-text">{p.name}</div>
                            <div className="text-[11px] text-brand-muted mt-0.5">~{p.mins} mins</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-brand-border">
                      <button
                        type="button"
                        onClick={() => setPresetStep(2)}
                        className="px-5 py-2.5 bg-brand-teal hover:bg-brand-deepTeal text-white rounded-xl text-xs font-bold shadow-teal flex items-center gap-1.5"
                      >
                        <span>Next: Settings</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Settings */}
                {presetStep === 2 && (
                  <div className="space-y-4 animate-fadeIn">
                    <div>
                      <label className="block text-xs font-bold text-brand-text mb-1">
                        Estimated Duration ({presetDuration} mins)
                      </label>
                      <input
                        type="range"
                        min={5}
                        max={180}
                        step={5}
                        value={presetDuration}
                        onChange={(e) => setPresetDuration(Number(e.target.value))}
                        className="w-full accent-brand-teal"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-brand-text mb-1">
                        Safe Radius ({presetSafeRadius}m)
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[100, 200, 500].map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setPresetSafeRadius(r)}
                            className={`p-3 rounded-xl border text-center text-xs font-bold ${
                              presetSafeRadius === r
                                ? 'bg-brand-aqua text-brand-deepTeal border-teal-300 font-black'
                                : 'bg-slate-50 text-brand-muted border-brand-border'
                            }`}
                          >
                            {r}m
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between pt-4 border-t border-brand-border">
                      <button
                        type="button"
                        onClick={() => setPresetStep(1)}
                        className="px-4 py-2 bg-slate-100 text-brand-text rounded-xl text-xs font-bold"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setPresetStep(3)}
                        className="px-5 py-2.5 bg-brand-teal text-white rounded-xl text-xs font-bold shadow-teal flex items-center gap-1.5"
                      >
                        <span>Next: Permissions</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Permissions */}
                {presetStep === 3 && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="p-4 rounded-xl border border-brand-border bg-slate-50 flex items-center justify-between">
                      <div>
                        <strong className="text-brand-text text-xs block">Live GPS Location Sharing</strong>
                        <p className="text-[11px] text-brand-muted">Allow authorized responders to view map coordinates.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={presetShareLocation}
                        onChange={(e) => setPresetShareLocation(e.target.checked)}
                        className="w-5 h-5 rounded accent-brand-teal"
                      />
                    </div>

                    <div className="flex justify-between pt-4 border-t border-brand-border">
                      <button
                        type="button"
                        onClick={() => setPresetStep(2)}
                        className="px-4 py-2 bg-slate-100 text-brand-text rounded-xl text-xs font-bold"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setPresetStep(4)}
                        className="px-5 py-2.5 bg-brand-teal text-white rounded-xl text-xs font-bold shadow-teal flex items-center gap-1.5"
                      >
                        <span>Next: Review</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 4: Review & Start */}
                {presetStep === 4 && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-brand-border space-y-2 text-xs">
                      <div><strong>Destination:</strong> {presetDestination}</div>
                      <div><strong>Duration:</strong> {presetDuration} mins</div>
                      <div><strong>Safe Radius:</strong> {presetSafeRadius}m</div>
                      <div><strong>Live GPS:</strong> {presetShareLocation ? 'Enabled' : 'Disabled'}</div>
                    </div>

                    <div className="flex justify-between pt-4 border-t border-brand-border">
                      <button
                        type="button"
                        onClick={() => setPresetStep(3)}
                        className="px-4 py-2 bg-slate-100 text-brand-text rounded-xl text-xs font-bold"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-3 bg-brand-teal text-white rounded-xl text-xs font-black shadow-teal flex items-center gap-2"
                      >
                        <span>Start Preset Journey</span>
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
      )}

      {/* 4. PAST JOURNEYS TABLE */}
      <div className="bg-white rounded-3xl p-6 border border-brand-border shadow-card">
        <div className="flex items-center justify-between pb-3 border-b border-brand-border mb-4">
          <h3 className="font-extrabold text-brand-text text-base flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-muted" />
            <span>Previous Journeys</span>
          </h3>
          <span className="text-xs text-brand-muted font-mono">{journeys.length} Logged</span>
        </div>

        {journeys.length === 0 ? (
          <div className="py-8 text-center text-xs text-brand-muted">
            No previous journeys recorded yet. Configure and launch your first journey above.
          </div>
        ) : (
          <div className="divide-y divide-brand-border">
            {journeys.map((jny) => (
              <div
                key={jny.id}
                className="py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-brand-text">
                      {jny.journey_name || `To: ${jny.destination_name}`}
                    </span>
                    <StatusBadge status={jny.status} />
                    {jny.journey_type === 'custom' && (
                      <span className="text-[10px] bg-brand-lavender text-brand-violet px-2 py-0.2 rounded font-bold">
                        Custom ({jny.check_in_interval_minutes}m)
                      </span>
                    )}
                  </div>
                  <p className="text-brand-muted text-[11px] mt-0.5">
                    From: {jny.origin_name} • Destination: {jny.destination_name}
                  </p>
                </div>

                <div className="text-right text-[11px] text-brand-muted font-mono">
                  {formatDateTime(jny.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* End Journey Confirmation Modal */}
      {isEndingConfirmOpen && activeJourney && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-brand-border shadow-elevated space-y-4 animate-fadeIn">
            <h3 className="font-extrabold text-brand-text text-base">End Safety Journey?</h3>
            <p className="text-xs text-brand-muted leading-relaxed">
              Confirming will complete this session and stop all future check-in prompts and location broadcasts.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsEndingConfirmOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-brand-text rounded-xl text-xs font-bold"
              >
                Keep Active
              </button>
              <button
                onClick={() => {
                  confirmSafeArrival(activeJourney.id);
                  setIsEndingConfirmOpen(false);
                }}
                className="px-4 py-2 bg-brand-coral hover:bg-red-600 text-white rounded-xl text-xs font-bold shadow-coral"
              >
                Yes, End Journey
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Modals */}
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
