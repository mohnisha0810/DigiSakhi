import React, { useState } from 'react';
import { useSafeSphere } from '@/store/SafeSphereContext';
import { SafetyMap } from '../map/SafetyMap';
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
} from 'lucide-react';
import { DEMO_DESTINATION_COORDINATES } from '@/lib/geolocation';
import { formatDateTime, formatTimeOnly, calculateDistanceMeters } from '@/lib/utils';
import { StatusBadge } from '@/components/common/StatusBadge';
import { StepProgress } from '@/components/common/StepProgress';

export const JourneyScreen: React.FC = () => {
  const {
    activeJourney,
    journeys,
    createJourney,
    confirmSafeArrival,
    cancelJourney,
    stopLocationSharing,
    virtualTime,
    currentLocation,
    locationPermission,
    contacts,
    setCurrentScreen,
  } = useSafeSphere();

  // Wizard State
  const [step, setStep] = useState(1);
  const [originName, setOriginName] = useState('Current Location');
  const [destinationName, setDestinationName] = useState('Montgomery St Station');
  const [destLat, setDestLat] = useState(DEMO_DESTINATION_COORDINATES.latitude);
  const [destLng, setDestLng] = useState(DEMO_DESTINATION_COORDINATES.longitude);
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [safeRadiusMeters, setSafeRadiusMeters] = useState(200);
  const [shareLocation, setShareLocation] = useState(locationPermission === 'granted');
  const [transitNote, setTransitNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals for Emergency actions
  const [isEmergencyMessageOpen, setIsEmergencyMessageOpen] = useState(false);
  const [isEmergencyCallOpen, setIsEmergencyCallOpen] = useState(false);

  const eligibleContacts = contacts.filter((c) => c.status === 'accepted');
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>(
    eligibleContacts.map((c) => c.id)
  );

  const wizardSteps = [
    { id: 1, label: 'Destination' },
    { id: 2, label: 'Safety Settings' },
    { id: 3, label: 'Circle & Permissions' },
    { id: 4, label: 'Review & Start' },
  ];

  const presets = [
    {
      name: 'Montgomery St Station',
      lat: 37.7897,
      lng: -122.4011,
      mins: 20,
    },
    {
      name: 'University Campus Library',
      lat: 37.7765,
      lng: -122.4172,
      mins: 35,
    },
    {
      name: 'Home (Mission Bay Apt)',
      lat: 37.7712,
      lng: -122.3925,
      mins: 25,
    },
  ];

  const handleSelectPreset = (p: typeof presets[0]) => {
    setDestinationName(p.name);
    setDestLat(p.lat);
    setDestLng(p.lng);
    setDurationMinutes(p.mins);
  };

  const handleToggleContact = (contactId: string) => {
    setSelectedContactIds((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId]
    );
  };

  const handleNext = () => setStep((prev) => Math.min(prev + 1, 4));
  const handleBack = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleStartJourney = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createJourney({
        originName,
        destinationName,
        destLat,
        destLng,
        safeRadiusMeters,
        durationMinutes,
        shareLocation: shareLocation && locationPermission !== 'denied' && locationPermission !== 'unavailable',
        allowedContactIds: selectedContactIds,
      });
      setStep(1);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Active Journey calculations
  let distanceMeters: number | null = null;
  let isPastETA = false;
  let isWithinRadius = false;
  let isPromptingArrival = false;
  let isOverdue = false;

  if (activeJourney) {
    const eta = new Date(activeJourney.expected_arrival_time);
    isPastETA = virtualTime >= eta;

    if (activeJourney.current_lat && activeJourney.current_lng) {
      distanceMeters = calculateDistanceMeters(
        activeJourney.current_lat,
        activeJourney.current_lng,
        activeJourney.dest_lat,
        activeJourney.dest_lng
      );
    }

    isWithinRadius =
      distanceMeters !== null && distanceMeters <= activeJourney.safe_radius_meters;
    isPromptingArrival =
      activeJourney.status === 'safe_arrival_pending' || isWithinRadius;
    isOverdue = isPastETA || activeJourney.status === 'overdue_escalated';
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-brand-border shadow-card flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-violet bg-brand-lavender px-3 py-1 rounded-full border border-violet-200">
            End-to-End Transit Protection
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-text mt-2 tracking-tight">
            My Journeys
          </h1>
          <p className="text-xs sm:text-sm text-brand-muted mt-1 max-w-2xl leading-relaxed">
            Plan and monitor commutes with geofenced arrival verification. When you enter your destination safe radius, DigiSakhi prompts you to confirm safe arrival. Safety is never automatically assumed.
          </p>
        </div>

        {activeJourney && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEmergencyMessageOpen(true)}
              className="px-3.5 py-2 bg-brand-coral hover:bg-red-600 text-white rounded-xl text-xs font-black shadow-coral transition-all flex items-center gap-1.5 active:scale-95"
            >
              <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
              <span>I Need Help</span>
            </button>
            <button
              onClick={() => confirmSafeArrival(activeJourney.id)}
              className="px-4 py-2 bg-brand-teal hover:bg-brand-deepTeal text-white rounded-xl text-xs font-bold shadow-teal transition-all flex items-center gap-1.5 active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm Arrival</span>
            </button>
          </div>
        )}
      </div>

      {/* ACTIVE JOURNEY VIEW */}
      {activeJourney ? (
        <div className="space-y-6">
          <div className="bg-white border border-brand-border rounded-3xl p-6 sm:p-7 shadow-card space-y-5">
            {/* Top Status Banner */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-brand-border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-brand-lavender text-brand-violet flex items-center justify-center shrink-0">
                  <Compass className="w-6 h-6 animate-spin-slow" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-extrabold text-brand-text">
                      En Route to {activeJourney.destination_name}
                    </h2>
                    <StatusBadge status={activeJourney.status} />
                    {activeJourney.share_location && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-aqua text-brand-deepTeal border border-teal-200 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-teal animate-pulse" />
                        Live GPS
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-brand-muted mt-0.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-brand-teal" />
                    <span>Origin: {activeJourney.origin_name}</span>
                    <span>•</span>
                    <span>Safe Radius: {activeJourney.safe_radius_meters}m</span>
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-brand-muted tracking-wider block">
                  Expected Arrival
                </span>
                <span
                  className={`text-lg font-mono font-black ${
                    isPastETA ? 'text-amber-600' : 'text-brand-text'
                  }`}
                >
                  {formatTimeOnly(activeJourney.expected_arrival_time)}
                </span>
              </div>
            </div>

            {/* Overdue Alert if elapsed */}
            {isOverdue && (
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-900 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <strong className="text-amber-950 block font-bold text-sm">
                    Journey Overdue — Connected Escalation Active
                  </strong>
                  <p className="text-amber-800 text-xs mt-1 leading-relaxed">
                    Expected arrival time has elapsed. Please confirm your safe arrival below. If unconfirmed, escalation alerts will dispatch automatically to your authorized trusted circle.
                  </p>
                </div>
              </div>
            )}

            {/* Geofence Safe Radius Prompt */}
            {isPromptingArrival && (
              <div className="p-5 bg-brand-aqua/40 border border-teal-300 rounded-2xl text-xs text-brand-deepTeal shadow-xs">
                <div className="flex items-start gap-3">
                  <Radio className="w-5 h-5 text-brand-teal shrink-0 mt-0.5 animate-pulse" />
                  <div className="flex-1">
                    <p className="font-extrabold text-brand-text text-sm">
                      Destination Radius Reached ({distanceMeters !== null ? `~${distanceMeters}m away` : 'Within safe perimeter'})
                    </p>
                    <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                      DigiSakhi has detected you entered your safe destination boundary. Confirm you have safely arrived to complete this journey.
                    </p>
                    <div className="mt-3">
                      <button
                        onClick={() => confirmSafeArrival(activeJourney.id)}
                        className="px-5 py-2.5 bg-brand-teal hover:bg-brand-deepTeal text-white rounded-xl font-bold text-xs shadow-teal transition-all flex items-center gap-1.5 active:scale-95"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Yes, I Have Safely Arrived</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* High Priority Journey Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => confirmSafeArrival(activeJourney.id)}
                  className="px-5 py-3 bg-brand-teal hover:bg-brand-deepTeal text-white rounded-xl text-xs font-bold shadow-teal transition-all flex items-center gap-2 active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>I'm Safe • Confirm Safe Arrival</span>
                </button>

                <button
                  onClick={() => setIsEmergencyMessageOpen(true)}
                  className="px-5 py-3 bg-brand-coral hover:bg-red-600 text-white rounded-xl text-xs font-black shadow-coral transition-all flex items-center gap-2 active:scale-95"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>I Need Help • SOS</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {activeJourney.share_location && (
                  <button
                    onClick={stopLocationSharing}
                    className="text-xs text-brand-coral hover:text-red-700 px-3.5 py-2.5 rounded-xl bg-brand-peach border border-coral-200 font-bold transition-colors flex items-center gap-1.5"
                    title="Stop broadcasting GPS location"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Stop Sharing GPS</span>
                  </button>
                )}

                <button
                  onClick={() => cancelJourney(activeJourney.id)}
                  className="text-xs text-brand-muted hover:text-brand-coral px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-red-50 border border-brand-border font-bold transition-colors flex items-center gap-1"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Cancel Journey</span>
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Route Map */}
          <div className="bg-white rounded-3xl p-6 border border-brand-border shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-brand-teal" />
                <h3 className="font-extrabold text-brand-text text-base">
                  Live Transit Route & Safe Arrival Geofence
                </h3>
              </div>
              <span className="text-xs text-brand-muted font-medium">
                OpenStreetMap • {activeJourney.safe_radius_meters}m Perimeter
              </span>
            </div>
            <SafetyMap />
          </div>
        </div>
      ) : (
        /* 4-STEP JOURNEY SETUP WIZARD (Displayed directly when no journey is active) */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-card space-y-6">
          <div className="pb-4 border-b border-brand-border">
            <h2 className="text-xl font-extrabold text-brand-text">
              Plan a New Safety Journey
            </h2>
            <p className="text-xs text-brand-muted mt-1">
              Follow this 4-step wizard to configure your route, arrival expectations, and circle escalation rules.
            </p>
            <div className="mt-4">
              <StepProgress steps={wizardSteps} currentStep={step} />
            </div>
          </div>

          <form onSubmit={handleStartJourney}>
            {/* Step 1: Destination Setup */}
            {step === 1 && (
              <div className="space-y-5 animate-fadeIn">
                <div className="space-y-3">
                  <h3 className="font-extrabold text-brand-text text-sm">
                    Step 1: Set up the journey
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-brand-text mb-1">
                        Origin (Start Point)
                      </label>
                      <input
                        type="text"
                        value={originName}
                        onChange={(e) => setOriginName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-xs focus:ring-2 focus:ring-brand-teal focus:border-brand-teal"
                        placeholder="Current Location, Office, Station..."
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-brand-text mb-1">
                        Destination Name
                      </label>
                      <input
                        type="text"
                        value={destinationName}
                        onChange={(e) => setDestinationName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-xs focus:ring-2 focus:ring-brand-teal focus:border-brand-teal"
                        placeholder="Home, Library, Station..."
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-text mb-1">
                      Quick Destination Presets
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {presets.map((p) => (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() => handleSelectPreset(p)}
                          className={`p-3 rounded-xl border text-left text-xs transition-all ${
                            destinationName === p.name
                              ? 'bg-brand-lavender text-brand-violet border-violet-300 font-bold'
                              : 'bg-slate-50 text-brand-muted border-brand-border hover:bg-slate-100'
                          }`}
                        >
                          <div className="font-bold text-brand-text">{p.name}</div>
                          <div className="text-[11px] text-brand-muted mt-0.5">
                            ~{p.mins} mins estimated
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-text mb-1">
                      Transit Note (Optional)
                    </label>
                    <input
                      type="text"
                      value={transitNote}
                      onChange={(e) => setTransitNote(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-brand-border text-xs focus:ring-2 focus:ring-brand-teal focus:border-brand-teal"
                      placeholder="e.g. Taking Line 4 Metro, car license plate 5582..."
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-brand-border">
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!destinationName.trim()}
                    className="px-5 py-2.5 bg-brand-teal hover:bg-brand-deepTeal text-white rounded-xl text-xs font-bold shadow-teal transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <span>Next: Safety Settings</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Safety Settings */}
            {step === 2 && (
              <div className="space-y-5 animate-fadeIn">
                <div className="space-y-4">
                  <h3 className="font-extrabold text-brand-text text-sm">
                    Step 2: Choose safety settings
                  </h3>

                  <div>
                    <label className="block text-xs font-bold text-brand-text mb-1">
                      Estimated Duration ({durationMinutes} minutes)
                    </label>
                    <input
                      type="range"
                      min={5}
                      max={180}
                      step={5}
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value))}
                      className="w-full accent-brand-teal"
                    />
                    <div className="flex justify-between text-[11px] text-brand-muted font-mono mt-1">
                      <span>5 mins</span>
                      <span className="font-bold text-brand-teal">{durationMinutes} mins</span>
                      <span>3 hours</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-text mb-1">
                      Geofenced Safe Arrival Radius ({safeRadiusMeters} meters)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[100, 200, 500].map((radius) => (
                        <button
                          key={radius}
                          type="button"
                          onClick={() => setSafeRadiusMeters(radius)}
                          className={`p-3 rounded-xl border text-center text-xs transition-all ${
                            safeRadiusMeters === radius
                              ? 'bg-brand-aqua text-brand-deepTeal border-teal-300 font-extrabold'
                              : 'bg-slate-50 text-brand-muted border-brand-border hover:bg-slate-100'
                          }`}
                        >
                          <div className="font-bold text-brand-text">{radius}m</div>
                          <div className="text-[10px] text-brand-muted">
                            {radius === 100 ? 'Precise' : radius === 200 ? 'Standard' : 'Spacious'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-brand-border rounded-xl text-xs text-brand-muted">
                    <strong className="text-brand-text block font-bold mb-1">
                      Human Safe Arrival Principle
                    </strong>
                    Entering within {safeRadiusMeters}m triggers an arrival confirmation prompt. Safety is never automatically presumed without your explicit confirmation.
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-brand-border">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-brand-text rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-5 py-2.5 bg-brand-teal hover:bg-brand-deepTeal text-white rounded-xl text-xs font-bold shadow-teal transition-all flex items-center gap-1.5"
                  >
                    <span>Next: Permissions & Circle</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Permissions & Trusted Contacts */}
            {step === 3 && (
              <div className="space-y-5 animate-fadeIn">
                <div className="space-y-4">
                  <h3 className="font-extrabold text-brand-text text-sm">
                    Step 3: Review trusted contacts & escalation preferences
                  </h3>

                  <div className="p-4 rounded-xl border border-brand-border bg-slate-50 flex items-center justify-between">
                    <div>
                      <strong className="text-brand-text font-bold text-xs block">
                        Share Live GPS Location
                      </strong>
                      <p className="text-[11px] text-brand-muted">
                        Allow authorized responders to view your transit progress on the map.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={shareLocation}
                      onChange={(e) => setShareLocation(e.target.checked)}
                      className="w-5 h-5 rounded accent-brand-teal"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-text mb-2">
                      Authorized Trusted Contacts for this Journey ({selectedContactIds.length} selected)
                    </label>

                    {eligibleContacts.length === 0 ? (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
                        <span>No verified contacts in circle yet.</span>
                        <button
                          type="button"
                          onClick={() => setCurrentScreen('circle')}
                          className="font-bold text-brand-teal hover:underline"
                        >
                          Add Contact Now →
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {eligibleContacts.map((contact) => (
                          <label
                            key={contact.id}
                            className={`p-3 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-colors ${
                              selectedContactIds.includes(contact.id)
                                ? 'bg-brand-aqua/40 border-teal-200 text-brand-deepTeal font-bold'
                                : 'bg-white border-brand-border text-brand-muted'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={selectedContactIds.includes(contact.id)}
                                onChange={() => handleToggleContact(contact.id)}
                                className="w-4 h-4 rounded accent-brand-teal"
                              />
                              <div>
                                <span className="font-bold text-brand-text">{contact.full_name}</span>
                                <span className="text-[11px] text-brand-muted ml-2">
                                  ({contact.relationship})
                                </span>
                              </div>
                            </div>
                            <span className="text-[11px] text-brand-muted font-mono">
                              {contact.phone_number}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-brand-border">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-brand-text rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-5 py-2.5 bg-brand-teal hover:bg-brand-deepTeal text-white rounded-xl text-xs font-bold shadow-teal transition-all flex items-center gap-1.5"
                  >
                    <span>Next: Review & Start</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Review & Start */}
            {step === 4 && (
              <div className="space-y-5 animate-fadeIn">
                <div className="space-y-4">
                  <h3 className="font-extrabold text-brand-text text-sm">
                    Step 4: Review and start journey
                  </h3>

                  <div className="bg-slate-50 border border-brand-border rounded-2xl p-5 space-y-3 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-brand-border">
                      <span className="text-brand-muted">Destination:</span>
                      <span className="font-bold text-brand-text">{destinationName}</span>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-brand-border">
                      <span className="text-brand-muted">Origin:</span>
                      <span className="font-bold text-brand-text">{originName}</span>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-brand-border">
                      <span className="text-brand-muted">Estimated Duration:</span>
                      <span className="font-bold text-brand-text font-mono">{durationMinutes} mins</span>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-brand-border">
                      <span className="text-brand-muted">Safe Radius:</span>
                      <span className="font-bold text-brand-text font-mono">{safeRadiusMeters} meters</span>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-brand-border">
                      <span className="text-brand-muted">Live Location Sharing:</span>
                      <span className="font-bold text-brand-teal">{shareLocation ? 'Enabled' : 'Disabled'}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-brand-muted">Notified Contacts:</span>
                      <span className="font-bold text-brand-text">{selectedContactIds.length} Verified Responders</span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-brand-aqua/50 border border-teal-200 rounded-xl text-xs text-brand-deepTeal">
                    <strong className="block font-bold">Ready to Launch</strong>
                    Starting this journey will activate real-time geofence arrival detection. You can confirm safe arrival at any point.
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-brand-border">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-brand-text rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-brand-teal hover:bg-brand-deepTeal text-white rounded-xl text-xs font-black shadow-teal transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    <Compass className="w-4 h-4" />
                    <span>{isSubmitting ? 'Starting Journey...' : 'Start Safety Journey Now'}</span>
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Geofence Verification Educational Explainer */}
      <div className="bg-white rounded-3xl p-6 border border-brand-border shadow-card">
        <h3 className="font-extrabold text-brand-text text-sm mb-3 flex items-center gap-2">
          <Radio className="w-4 h-4 text-brand-teal" />
          <span>How Safe Arrival Verification Works</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs text-brand-text">
          <div className="p-4 rounded-2xl bg-slate-50 border border-brand-border space-y-1">
            <span className="font-bold text-brand-deepTeal block">1. Geofenced Radius Detection</span>
            <p className="text-[11px] text-brand-muted leading-relaxed">
              When device GPS enters within your designated destination radius, DigiSakhi triggers an arrival prompt.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-brand-border space-y-1">
            <span className="font-bold text-brand-violet block">2. Explicit Human Confirmation</span>
            <p className="text-[11px] text-brand-muted leading-relaxed">
              DigiSakhi never presumes safety automatically upon entering the radius. You explicitly confirm arrival.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-brand-border space-y-1">
            <span className="font-bold text-brand-coral block">3. Overdue Escalation Fallback</span>
            <p className="text-[11px] text-brand-muted leading-relaxed">
              If expected arrival passes without safe confirmation, automated check-in escalation alerts your circle.
            </p>
          </div>
        </div>
      </div>

      {/* Past Journeys History Table */}
      <div className="bg-white rounded-3xl p-6 border border-brand-border shadow-card">
        <div className="flex items-center justify-between pb-3 border-b border-brand-border mb-4">
          <h3 className="font-extrabold text-brand-text text-base flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-muted" />
            <span>Previous Journeys</span>
          </h3>
          <span className="text-xs text-brand-muted font-mono">
            {journeys.length} Logged
          </span>
        </div>

        {journeys.length === 0 ? (
          <div className="py-8 text-center text-xs text-brand-muted">
            No previous journeys recorded yet. Start your first journey above.
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
                      To: {jny.destination_name}
                    </span>
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