import React, { useState, useEffect, useRef } from 'react';
import { useSafeSphere } from '@/store/SafeSphereContext';
import {
  geoService,
  GeoLocationResult,
  LocationPermissionState,
  SimulatedLocationMode,
  DEMO_PRESET_COORDINATES,
} from '@/lib/geolocation';
import {
  MapPin,
  Shield,
  ShieldAlert,
  Radio,
  EyeOff,
  Users,
  Compass,
  AlertTriangle,
  RotateCw,
  Clock,
  CheckCircle2,
  XCircle,
  Activity,
  SlidersHorizontal,
} from 'lucide-react';
import { formatDateTime, calculateDistanceMeters } from '@/lib/utils';
import L from 'leaflet';

export const SafetyMap: React.FC = () => {
  const {
    activeJourney,
    activeIncident,
    contacts,
    currentUser,
    activeLocationShare,
    stopLocationSharing,
    simulatedLocationMode,
    setSimulatedLocationMode,
    refreshLocation,
    virtualTime,
  } = useSafeSphere();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const safeRadiusCircleRef = useRef<L.Circle | null>(null);

  const [currentLocation, setCurrentLocation] = useState<GeoLocationResult | null>(null);
  const [permissionState, setPermissionState] = useState<LocationPermissionState>('prompt');
  const [isSharingActive, setIsSharingActive] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loadingLoc, setLoadingLoc] = useState<boolean>(false);
  const [simulateExpired, setSimulateExpired] = useState<boolean>(false);

  // Sync with context's activeLocationShare
  useEffect(() => {
    if (activeLocationShare && !activeLocationShare.is_active) {
      setIsSharingActive(false);
    }
  }, [activeLocationShare]);

  // Load location on mount
  useEffect(() => {
    handleRefreshLocation();
  }, [simulatedLocationMode]);

  const handleRefreshLocation = async () => {
    setLoadingLoc(true);
    try {
      const res = await refreshLocation(false);
      setCurrentLocation(res);
      setPermissionState(res.permissionState);
      if (res.error) {
        setStatusMessage(res.error);
      } else {
        setStatusMessage(null);
      }
    } catch (err: any) {
      setStatusMessage('Error acquiring GPS fix: ' + err.message);
    } finally {
      setLoadingLoc(false);
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat =
        currentLocation?.latitude || activeJourney?.dest_lat || DEMO_PRESET_COORDINATES.latitude;
      const initialLng =
        currentLocation?.longitude || activeJourney?.dest_lng || DEMO_PRESET_COORDINATES.longitude;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 14,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    const hasValidCoords =
      currentLocation &&
      currentLocation.latitude !== null &&
      currentLocation.longitude !== null;

    // Check if sharing is blocked due to manual stop or expiry simulation
    const sharingAllowed = isSharingActive && !simulateExpired;

    // 1. User Position Marker & Accuracy Circle
    if (hasValidCoords && sharingAllowed) {
      const lat = currentLocation!.latitude!;
      const lng = currentLocation!.longitude!;
      const accuracy = currentLocation!.accuracy || 15;
      const latLng: L.LatLngExpression = [lat, lng];

      const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: `
          <div style="background-color: #0D9488; width: 22px; height: 22px; border-radius: 50%; border: 3px solid #FFFFFF; box-shadow: 0 0 15px #14B8A6; position: relative;">
            <div style="position: absolute; inset: -6px; border-radius: 50%; border: 2px solid #14B8A6; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite; opacity: 0.75;"></div>
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng(latLng);
      } else {
        userMarkerRef.current = L.marker(latLng, { icon: userIcon })
          .addTo(map)
          .bindPopup(`<b>${currentUser.full_name}</b><br/>${currentLocation!.addressApproximate}`);
      }

      // Accuracy Circle
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.setLatLng(latLng);
        accuracyCircleRef.current.setRadius(accuracy);
      } else {
        accuracyCircleRef.current = L.circle(latLng, {
          radius: accuracy,
          color: '#0D9488',
          fillColor: '#14B8A6',
          fillOpacity: 0.15,
          weight: 1,
        }).addTo(map);
      }

      map.setView(latLng, map.getZoom());
    } else {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.remove();
        accuracyCircleRef.current = null;
      }
    }

    // 2. Destination Marker & Safe Arrival Radius Circle
    if (activeJourney) {
      const destLatLng: L.LatLngExpression = [activeJourney.dest_lat, activeJourney.dest_lng];

      const destIcon = L.divIcon({
        className: 'custom-dest-marker',
        html: `
          <div style="background-color: #6366F1; width: 26px; height: 26px; border-radius: 8px; border: 2px solid #FFFFFF; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.6);">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      if (destMarkerRef.current) {
        destMarkerRef.current.setLatLng(destLatLng);
      } else {
        destMarkerRef.current = L.marker(destLatLng, { icon: destIcon })
          .addTo(map)
          .bindPopup(
            `<b>Destination</b><br/>${activeJourney.destination_name}<br/>Safe Radius: ${activeJourney.safe_radius_meters}m`
          );
      }

      // Safe Radius Geofence Circle
      if (safeRadiusCircleRef.current) {
        safeRadiusCircleRef.current.setLatLng(destLatLng);
        safeRadiusCircleRef.current.setRadius(activeJourney.safe_radius_meters);
      } else {
        safeRadiusCircleRef.current = L.circle(destLatLng, {
          radius: activeJourney.safe_radius_meters,
          color: '#6366F1',
          fillColor: '#818CF8',
          fillOpacity: 0.18,
          weight: 2,
          dashArray: '4, 6',
        }).addTo(map);
      }
    } else {
      if (destMarkerRef.current) {
        destMarkerRef.current.remove();
        destMarkerRef.current = null;
      }
      if (safeRadiusCircleRef.current) {
        safeRadiusCircleRef.current.remove();
        safeRadiusCircleRef.current = null;
      }
    }
  }, [currentLocation, isSharingActive, simulateExpired, activeJourney]);

  const handleStopSharing = async () => {
    setIsSharingActive(false);
    await stopLocationSharing();
    setStatusMessage('Live location sharing has been immediately stopped and revoked.');
  };

  const handleResumeSharing = () => {
    setIsSharingActive(true);
    setSimulateExpired(false);
    handleRefreshLocation();
    setStatusMessage(null);
  };

  // Compute distance to destination if active journey exists
  let distanceToDest: number | null = null;
  if (
    activeJourney &&
    currentLocation &&
    currentLocation.latitude !== null &&
    currentLocation.longitude !== null
  ) {
    distanceToDest = calculateDistanceMeters(
      currentLocation.latitude,
      currentLocation.longitude,
      activeJourney.dest_lat,
      activeJourney.dest_lng
    );
  }

  const authorizedContacts = contacts.filter(
    (c) => c.status === 'accepted' && c.can_view_location
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-card flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-teal bg-brand-aqua/60 px-2.5 py-0.5 rounded-full border border-brand-teal/20">
            Feature Four & Seven • Privacy Geolocation & Safe Arrival
          </span>
          <h1 className="text-2xl font-bold text-brand-text mt-1.5 flex items-center gap-2">
            Live Location & Geofence Map
          </h1>
          <p className="text-xs text-brand-muted mt-1 max-w-2xl leading-relaxed">
            Real browser geolocation with explicit user permission. Coordinates are never fabricated or silently tracked. Stops immediately when requested or when safe arrival is verified.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isSharingActive && !simulateExpired ? (
            <button
              onClick={handleStopSharing}
              className="px-4 py-2 bg-brand-peach/80 hover:bg-brand-peach text-brand-coral border border-brand-coral/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
              title="Immediately revoke location sharing on the backend and halt device GPS"
            >
              <EyeOff className="w-4 h-4" />
              Stop Sharing Immediately
            </button>
          ) : (
            <button
              onClick={handleResumeSharing}
              className="px-4 py-2 bg-brand-teal hover:bg-brand-deepTeal text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-teal"
            >
              <Radio className="w-4 h-4" />
              Resume Location Sharing
            </button>
          )}

          <button
            onClick={handleRefreshLocation}
            disabled={loadingLoc}
            className="p-2 bg-white hover:bg-brand-bg text-brand-muted hover:text-brand-text rounded-xl border border-brand-border shadow-xs transition-colors"
            title="Refresh GPS Coordinates"
          >
            <RotateCw className={`w-4 h-4 ${loadingLoc ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Geolocation State Simulation & Inspection Bar (for Hackathon Testing) */}
      <div className="bg-brand-bg border border-brand-border rounded-2xl p-4 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-brand-teal" />
            <span className="text-xs font-bold text-brand-text uppercase tracking-wider">
              Location State Tester:
            </span>
            <span className="text-[11px] text-brand-muted">
              Test all 5 required permission and lifecycle states
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => {
                setSimulateExpired(false);
                setSimulatedLocationMode('real');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                simulatedLocationMode === 'real' && !simulateExpired
                  ? 'bg-brand-teal text-white shadow-teal'
                  : 'bg-white border border-brand-border text-brand-muted hover:text-brand-text shadow-xs'
              }`}
            >
              Live Device GPS
            </button>

            <button
              onClick={() => {
                setSimulateExpired(false);
                setSimulatedLocationMode('granted');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                simulatedLocationMode === 'granted' && !simulateExpired
                  ? 'bg-brand-violet text-white shadow-violet'
                  : 'bg-white border border-brand-border text-brand-muted hover:text-brand-text shadow-xs'
              }`}
            >
              Simulate: Granted (Demo Fix)
            </button>

            <button
              onClick={() => {
                setSimulateExpired(false);
                setSimulatedLocationMode('denied');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                simulatedLocationMode === 'denied'
                  ? 'bg-brand-coral text-white shadow-coral'
                  : 'bg-white border border-brand-border text-brand-muted hover:text-brand-text shadow-xs'
              }`}
            >
              Simulate: Denied
            </button>

            <button
              onClick={() => {
                setSimulateExpired(false);
                setSimulatedLocationMode('unavailable');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                simulatedLocationMode === 'unavailable'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-white border border-brand-border text-brand-muted hover:text-brand-text shadow-xs'
              }`}
            >
              Simulate: Unavailable
            </button>

            <button
              onClick={() => {
                setSimulateExpired(false);
                setSimulatedLocationMode('stale');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                simulatedLocationMode === 'stale'
                  ? 'bg-amber-400 text-amber-950 font-bold shadow-xs'
                  : 'bg-white border border-brand-border text-brand-muted hover:text-brand-text shadow-xs'
              }`}
            >
              Simulate: Stale (&gt;2m Old)
            </button>

            <button
              onClick={() => {
                setSimulateExpired(true);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                simulateExpired
                  ? 'bg-brand-coral text-white shadow-coral'
                  : 'bg-white border border-brand-border text-brand-muted hover:text-brand-text shadow-xs'
              }`}
            >
              Simulate: Sharing Expired
            </button>
          </div>
        </div>
      </div>

      {/* State Notification Banners */}
      {/* 1. Denied State */}
      {permissionState === 'denied' && (
        <div className="p-4 bg-brand-peach/70 border border-brand-coral/40 rounded-xl text-brand-text text-xs shadow-card space-y-1">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-brand-coral shrink-0" />
            <strong className="text-brand-text text-sm font-bold">Location Permission Denied</strong>
          </div>
          <p className="text-brand-muted text-xs leading-relaxed">
            DigiSakhi respects your privacy and will never silently track or fabricate coordinates. Manual check-ins and safe arrival verification remain 100% operational.
          </p>
        </div>
      )}

      {/* 2. Unavailable State */}
      {permissionState === 'unavailable' && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-950 text-xs shadow-card space-y-1">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <strong className="text-amber-950 text-sm font-bold">GPS Fix Unavailable</strong>
          </div>
          <p className="text-amber-800 text-xs leading-relaxed">
            Device location signal is temporarily unavailable or timed out. Your safety check-ins and arrival confirmations remain ready for manual confirmation.
          </p>
        </div>
      )}

      {/* 3. Stale Location Indicator */}
      {currentLocation?.isStale && isSharingActive && !simulateExpired && (
        <div className="p-4 bg-amber-50 border border-amber-400 rounded-xl text-amber-950 text-xs shadow-card space-y-1 animate-pulse-subtle">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <strong className="text-amber-950 text-sm font-bold">
                ⚠️ Stale Location Fix ({Math.round(currentLocation.staleSeconds / 60)} minutes old)
              </strong>
            </div>
            <button
              onClick={handleRefreshLocation}
              className="text-xs text-amber-700 underline font-bold hover:text-amber-900"
            >
              Request Fresh GPS Fix
            </button>
          </div>
          <p className="text-amber-800 text-xs leading-relaxed">
            The last recorded coordinate fix is older than 2 minutes. The user device may have entered an area with poor signal or mobile background location throttling.
          </p>
        </div>
      )}

      {/* 4. Sharing Expired Banner */}
      {simulateExpired && (
        <div className="p-4 bg-brand-peach/70 border border-brand-coral/40 rounded-xl text-brand-text text-xs shadow-card space-y-1">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-coral shrink-0" />
            <strong className="text-brand-text text-sm font-bold">Location Sharing Session Expired</strong>
          </div>
          <p className="text-brand-muted text-xs leading-relaxed">
            The configured location sharing duration has expired. Responders can no longer view your coordinates.
          </p>
        </div>
      )}

      {/* 5. Demo Coordinate Preset Banner */}
      {currentLocation?.isDemoCoordinates && isSharingActive && !simulateExpired && (
        <div className="p-3 bg-brand-lavender/60 border border-brand-violet/30 rounded-xl text-brand-text text-xs flex items-center justify-between gap-2 shadow-card">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-brand-violet shrink-0 animate-pulse" />
            <span>
              <strong className="text-brand-text">SIMULATED LOCATION: </strong> Showing preview coordinates. Live GPS active on mobile devices.
            </span>
          </div>
          <button
            onClick={() => setSimulatedLocationMode('real')}
            className="text-xs text-brand-violet underline font-bold hover:text-brand-violet/80"
          >
            Switch to Live Device GPS
          </button>
        </div>
      )}

      {/* Leaflet Map Card */}
      <div className="bg-white border border-brand-border rounded-2xl p-4 shadow-card space-y-4">
        {/* Map Header details */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs px-2">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isSharingActive && !simulateExpired && permissionState === 'granted'
                  ? 'bg-brand-teal animate-ping'
                  : 'bg-brand-muted'
              }`}
            />
            <span className="font-bold text-brand-text">
              {isSharingActive && !simulateExpired && permissionState === 'granted'
                ? 'Location Broadcasting'
                : 'Location Inactive / Hidden'}
            </span>
            <span className="text-brand-border">•</span>
            <span className="text-brand-muted">
              {currentLocation && currentLocation.latitude !== null
                ? currentLocation.addressApproximate
                : 'Coordinates Hidden'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-brand-muted font-mono text-[11px]">
            {currentLocation && currentLocation.accuracy !== null && (
              <span>Accuracy: ±{currentLocation.accuracy}m</span>
            )}
            {activeJourney && distanceToDest !== null && (
              <span className="text-brand-violet font-semibold">
                Distance: {distanceToDest}m (Radius: {activeJourney.safe_radius_meters}m)
              </span>
            )}
            <span>Updated: {formatDateTime(currentLocation?.timestamp)}</span>
          </div>
        </div>

        {/* The Leaflet Map Container */}
        <div className="w-full h-96 rounded-xl overflow-hidden border border-brand-border relative z-10 shadow-xs">
          <div ref={mapContainerRef} className="w-full h-full" />
        </div>

        {/* Destination & Geofence Legend */}
        {activeJourney && (
          <div className="p-3.5 bg-brand-bg border border-brand-border rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-brand-violet border border-white shadow-xs" />
              <span className="text-brand-text">
                Destination: <strong className="text-brand-text font-bold">{activeJourney.destination_name}</strong>
              </span>
              <span className="text-brand-border">|</span>
              <span className="text-brand-muted">
                Safe Arrival Radius: <strong className="text-brand-violet font-semibold">{activeJourney.safe_radius_meters}m</strong>
              </span>
            </div>

            <div className="text-[11px]">
              {distanceToDest !== null && distanceToDest <= activeJourney.safe_radius_meters ? (
                <span className="font-bold flex items-center gap-1 text-brand-teal">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-teal" />
                  Inside Safe Radius: Ready to Confirm Arrival
                </span>
              ) : (
                <span className="text-brand-muted">
                  Approaching destination ({distanceToDest ? `${distanceToDest}m away` : 'calculating...'})
                </span>
              )}
            </div>
          </div>
        )}

        {/* Authorized Viewers Footer */}
        <div className="pt-2 px-2 flex flex-wrap items-center justify-between gap-3 text-xs text-brand-muted">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-teal" />
            <span>
              Authorized circle members who can view location:{' '}
              <strong className="text-brand-text font-semibold">
                {authorizedContacts.map((c) => c.full_name).join(', ') || 'None assigned'}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px]">
            <Clock className="w-3.5 h-3.5 text-brand-muted" />
            <span>Session auto-expires after 60 minutes or upon confirmed safe arrival</span>
          </div>
        </div>
      </div>
    </div>
  );
};
