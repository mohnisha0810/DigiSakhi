import React, { useState } from 'react';
import { useSafeSphere } from '@/store/SafeSphereContext';
import { StepProgress } from '@/components/common/StepProgress';
import {
  Compass,
  MapPin,
  Clock,
  ArrowRight,
  ArrowLeft,
  X,
  Users,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { DEMO_DESTINATION_COORDINATES } from '@/lib/geolocation';
import { formatTimeOnly } from '@/lib/utils';

export const JourneySetupModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { createJourney, defaultProtocol, contacts, locationPermission, setCurrentScreen } =
    useSafeSphere();

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

  const eligibleContacts = contacts.filter((c) => c.status === 'accepted' && c.can_view_location);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>(
    eligibleContacts.map((c) => c.id)
  );

  if (!isOpen) return null;

  const steps = [
    { id: 1, label: 'Destination' },
    { id: 2, label: 'Arrival Time' },
    { id: 3, label: 'Permissions' },
    { id: 4, label: 'Review' },
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

  const handleStart = async (e: React.FormEvent) => {
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
        protocolId: defaultProtocol?.id,
      });
      onClose();
      setCurrentScreen('journeys');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLocationDeniedOrUnavailable =
    locationPermission === 'denied' || locationPermission === 'unavailable';

  // Compute expected arrival time preview
  const estimatedArrival = new Date(Date.now() + durationMinutes * 60 * 1000);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-brand-border rounded-3xl max-w-lg w-full p-6 shadow-elevated relative my-8 animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-brand-muted hover:text-brand-text p-1 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <form onSubmit={handleStart}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-brand-lavender text-brand-violet flex items-center justify-center">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-brand-text">Plan a Journey</h3>
              <p className="text-xs text-brand-muted">
                Safe arrival verification connected to Smart Check-in escalation.
              </p>
            </div>
          </div>

          {/* Step Indicator */}
          <StepProgress steps={steps} currentStep={step} accentColor="violet" />

          {/* STEP 1: Destination */}
          {step === 1 && (
            <div className="space-y-4 mt-4 animate-fadeIn">
              <div>
                <label className="block text-xs font-bold text-brand-text mb-1.5">
                  Destination Presets:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {presets.map((p) => (
                    <button
                      type="button"
                      key={p.name}
                      onClick={() => handleSelectPreset(p)}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                        destinationName === p.name
                          ? 'bg-brand-lavender border-violet-300 text-brand-violet font-bold shadow-xs'
                          : 'bg-slate-50 border-brand-border text-brand-muted hover:text-brand-text'
                      }`}
                    >
                      <p className="font-bold truncate">{p.name.split(' ')[0]}</p>
                      <p className="text-[10px] text-brand-muted">{p.mins} mins</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-text mb-1">
                  Destination Name *
                </label>
                <input
                  type="text"
                  required
                  value={destinationName}
                  onChange={(e) => setDestinationName(e.target.value)}
                  className="w-full bg-slate-50 border border-brand-border rounded-xl px-3.5 py-2.5 text-xs text-brand-text font-medium focus:outline-none focus:border-brand-violet"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-text mb-1">
                  Safe Arrival Radius
                </label>
                <select
                  value={safeRadiusMeters}
                  onChange={(e) => setSafeRadiusMeters(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-text font-medium"
                >
                  <option value={50}>50 meters (High Precision)</option>
                  <option value={100}>100 meters</option>
                  <option value={200}>200 meters (Recommended)</option>
                  <option value={500}>500 meters (Transit Hub)</option>
                </select>
                <p className="text-[10px] text-brand-muted mt-1">
                  When inside this boundary, SafeSphere will prompt safe arrival verification.
                </p>
              </div>

              {/* Advanced Options: Custom Coordinates */}
              <details className="group border border-brand-border rounded-2xl p-3 bg-white">
                <summary className="text-xs font-bold text-brand-violet cursor-pointer list-none flex items-center justify-between">
                  <span>Advanced Options (Manual Lat / Lng Coordinates)</span>
                  <ChevronRight className="w-3.5 h-3.5 transition-transform group-open:rotate-90" />
                </summary>
                <div className="grid grid-cols-2 gap-3 pt-3 mt-2 border-t border-brand-border">
                  <div>
                    <label className="block text-[11px] font-bold text-brand-muted mb-1">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={destLat}
                      onChange={(e) => setDestLat(parseFloat(e.target.value))}
                      className="w-full bg-slate-50 border border-brand-border rounded-lg px-2.5 py-1.5 text-xs text-brand-text font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-brand-muted mb-1">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={destLng}
                      onChange={(e) => setDestLng(parseFloat(e.target.value))}
                      className="w-full bg-slate-50 border border-brand-border rounded-lg px-2.5 py-1.5 text-xs text-brand-text font-mono"
                    />
                  </div>
                </div>
              </details>
            </div>
          )}

          {/* STEP 2: Arrival Time */}
          {step === 2 && (
            <div className="space-y-4 mt-4 animate-fadeIn">
              <div>
                <label className="block text-xs font-bold text-brand-text mb-1">
                  Estimated Transit Time Duration
                </label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-text font-medium"
                >
                  <option value={10}>10 Minutes</option>
                  <option value={15}>15 Minutes</option>
                  <option value={20}>20 Minutes</option>
                  <option value={25}>25 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={45}>45 Minutes</option>
                  <option value={60}>60 Minutes (1 Hour)</option>
                </select>
              </div>

              {/* Time Arrival Callout */}
              <div className="p-4 bg-brand-lavender/60 border border-brand-violet/20 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-brand-violet tracking-wider">
                    Computed ETA
                  </span>
                  <p className="text-xl font-bold text-brand-text font-mono mt-0.5">
                    {formatTimeOnly(estimatedArrival.toISOString())}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-brand-violet/50" />
              </div>

              {/* Advanced Options: Transit Notes */}
              <details className="group border border-brand-border rounded-2xl p-3 bg-white">
                <summary className="text-xs font-bold text-brand-violet cursor-pointer list-none flex items-center justify-between">
                  <span>Advanced Options (Transit Route Notes)</span>
                  <ChevronRight className="w-3.5 h-3.5 transition-transform group-open:rotate-90" />
                </summary>
                <div className="pt-3 mt-2 border-t border-brand-border">
                  <label className="block text-[11px] font-bold text-brand-muted mb-1">
                    Route or Transit Details:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Taking the 38 Geary Bus / Wearing blue jacket"
                    value={transitNote}
                    onChange={(e) => setTransitNote(e.target.value)}
                    className="w-full bg-slate-50 border border-brand-border rounded-xl px-3 py-2 text-xs text-brand-text font-medium"
                  />
                </div>
              </details>
            </div>
          )}

          {/* STEP 3: Contacts & Permissions */}
          {step === 3 && (
            <div className="space-y-4 mt-4 animate-fadeIn">
              {isLocationDeniedOrUnavailable ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Device Geolocation Denied or Unavailable</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Coordinates will not be tracked or fabricated. Your journey will use{' '}
                    <strong>Manual Safe Arrival Verification</strong>, where you confirm safe arrival
                    manually upon arrival.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="flex items-start gap-2.5 text-xs text-brand-text cursor-pointer p-3 bg-slate-50 rounded-2xl border border-brand-border">
                    <input
                      type="checkbox"
                      checked={shareLocation}
                      onChange={(e) => setShareLocation(e.target.checked)}
                      className="mt-0.5 rounded border-brand-border text-brand-violet focus:ring-brand-violet"
                    />
                    <span>
                      <strong className="text-brand-text block font-bold">
                        Share live location during this journey
                      </strong>
                      Authorized circle members can see your route and distance until safe arrival is confirmed.
                    </span>
                  </label>

                  {shareLocation && eligibleContacts.length > 0 && (
                    <div className="p-3.5 bg-white border border-brand-border rounded-2xl space-y-2">
                      <span className="text-[11px] font-bold text-brand-text flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-brand-teal" />
                        Authorized Viewers for this Journey:
                      </span>
                      <div className="space-y-1.5">
                        {eligibleContacts.map((contact) => (
                          <label
                            key={contact.id}
                            className="flex items-center gap-2 text-xs text-brand-text cursor-pointer p-1.5 rounded-lg hover:bg-slate-50"
                          >
                            <input
                              type="checkbox"
                              checked={selectedContactIds.includes(contact.id)}
                              onChange={() => handleToggleContact(contact.id)}
                              className="rounded border-brand-border text-brand-teal"
                            />
                            <span>
                              {contact.full_name}{' '}
                              <span className="text-brand-muted text-[11px]">
                                ({contact.relationship})
                              </span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="p-3.5 bg-slate-50 border border-brand-border rounded-xl text-[11px] text-brand-muted space-y-1 leading-relaxed">
                <p>
                  <strong className="text-brand-text font-bold">Safe Arrival Rule: </strong>
                  Confirming safe arrival immediately terminates journey-specific location sharing.
                </p>
                <p>
                  If you are overdue beyond deadline + grace period, Smart Check-in escalation initiates.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: Review & Start Journey */}
          {step === 4 && (
            <div className="space-y-4 mt-4 animate-fadeIn">
              <div className="p-4 bg-slate-50 border border-brand-border rounded-2xl space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-brand-border">
                  <span className="text-[10px] uppercase font-bold text-brand-muted">
                    Journey Itinerary
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-brand-lavender text-brand-violet border border-violet-200">
                    Monitored Transit
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-brand-violet shrink-0 mt-0.5" />
                    <div>
                      <p className="text-brand-muted text-[11px]">Destination:</p>
                      <p className="font-bold text-brand-text text-sm">{destinationName}</p>
                      <p className="text-[10px] text-brand-muted">Radius: {safeRadiusMeters} meters</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-brand-teal shrink-0 mt-0.5" />
                    <div>
                      <p className="text-brand-muted text-[11px]">Estimated Arrival:</p>
                      <p className="font-bold text-brand-text">
                        {durationMinutes} minutes ({formatTimeOnly(estimatedArrival.toISOString())})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Users className="w-4 h-4 text-brand-teal shrink-0 mt-0.5" />
                    <div>
                      <p className="text-brand-muted text-[11px]">Circle Viewers:</p>
                      <p className="font-bold text-brand-text">
                        {eligibleContacts
                          .filter((c) => selectedContactIds.includes(c.id))
                          .map((c) => c.full_name)
                          .join(', ') || 'None assigned'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-brand-aqua/40 border border-brand-teal/20 rounded-xl text-[11px] text-brand-deepTeal flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-teal shrink-0" />
                <span>
                  SafeSphere will track transit distance and prompt safe arrival when you reach the safe radius.
                </span>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-between gap-3 pt-6 border-t border-brand-border mt-6">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2.5 rounded-xl border border-brand-border text-brand-muted hover:text-brand-text text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-brand-border text-brand-muted hover:text-brand-text text-xs font-bold transition-colors"
              >
                Cancel
              </button>
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl bg-brand-violet hover:bg-violet-700 text-white text-xs font-bold shadow-violet flex items-center gap-1.5 transition-all active:scale-[0.98]"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-brand-violet hover:bg-violet-700 text-white text-xs font-bold shadow-violet transition-all active:scale-[0.98]"
              >
                {isSubmitting ? 'Starting Journey...' : 'Start Monitored Journey'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
