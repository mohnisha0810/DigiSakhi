// SafeSphere Geolocation & Map Coordinates Service
// Privacy-first: Requests permission, tracks accuracy, detects stale fixes,
// supports immediate stop-sharing, and STRICTLY enforces a NO-FABRICATION policy.
// If permission is denied or unavailable, coordinates are null and manual check-in is preserved.

export type LocationPermissionState = 'prompt' | 'granted' | 'denied' | 'unavailable';

export interface GeoLocationResult {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  addressApproximate: string;
  isDemoCoordinates: boolean;
  timestamp: string;
  permissionState: LocationPermissionState;
  isStale: boolean;
  staleSeconds: number;
  error?: string;
}

// Preset verified demo location (e.g. San Francisco Ferry Building / Embarcadero)
export const DEMO_PRESET_COORDINATES = {
  latitude: 37.7955,
  longitude: -122.3937,
  accuracy: 15,
  addressApproximate: 'Ferry Building, The Embarcadero, San Francisco, CA (Demo Preset)',
  isDemoCoordinates: true,
};

export const DEMO_DESTINATION_COORDINATES = {
  latitude: 37.7897,
  longitude: -122.4011,
  accuracy: 10,
  addressApproximate: 'Montgomery St Station, Market & 2nd St, San Francisco, CA',
  isDemoCoordinates: true,
};

// Stale threshold: If a GPS fix is older than 2 minutes (120 seconds), mark as stale
export const STALE_LOCATION_THRESHOLD_SECONDS = 120;

export type SimulatedLocationMode = 'real' | 'granted' | 'denied' | 'unavailable' | 'stale';

class GeolocationService {
  private watchId: number | null = null;
  private permissionStatus: LocationPermissionState = 'prompt';
  private simulatedMode: SimulatedLocationMode = 'real';
  private lastKnownFix: GeoLocationResult | null = null;

  setSimulatedMode(mode: SimulatedLocationMode) {
    this.simulatedMode = mode;
    if (mode === 'real') {
      this.checkPermission();
    } else if (mode === 'granted' || mode === 'stale') {
      this.permissionStatus = 'granted';
    } else if (mode === 'denied') {
      this.permissionStatus = 'denied';
    } else if (mode === 'unavailable') {
      this.permissionStatus = 'unavailable';
    }
  }

  getSimulatedMode(): SimulatedLocationMode {
    return this.simulatedMode;
  }

  async checkPermission(): Promise<LocationPermissionState> {
    if (this.simulatedMode !== 'real') {
      return this.permissionStatus;
    }

    if (typeof navigator === 'undefined' || !navigator.permissions) {
      this.permissionStatus = 'prompt';
      return 'prompt';
    }

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      this.permissionStatus = result.state as LocationPermissionState;
      result.onchange = () => {
        this.permissionStatus = result.state as LocationPermissionState;
      };
      return result.state as LocationPermissionState;
    } catch {
      this.permissionStatus = 'prompt';
      return 'prompt';
    }
  }

  /**
   * Retrieves current coordinates.
   * STRICT POLICY: Does not fabricate coordinates if permission is denied or unavailable.
   * Returns null coordinates and clear explanatory text.
   */
  async getCurrentLocation(options?: {
    allowDemoFallback?: boolean;
    virtualNow?: Date;
  }): Promise<GeoLocationResult> {
    const now = options?.virtualNow || new Date();
    const nowIso = now.toISOString();

    // 1. Handle Simulated Testing Modes
    if (this.simulatedMode === 'denied') {
      return {
        latitude: null,
        longitude: null,
        accuracy: null,
        addressApproximate: 'Location permission denied by user',
        isDemoCoordinates: false,
        timestamp: nowIso,
        permissionState: 'denied',
        isStale: false,
        staleSeconds: 0,
        error: 'Location permission was denied in browser settings. SafeSphere will not track your location. Manual check-ins and safe arrival verification are fully available.',
      };
    }

    if (this.simulatedMode === 'unavailable') {
      return {
        latitude: null,
        longitude: null,
        accuracy: null,
        addressApproximate: 'GPS signal unavailable',
        isDemoCoordinates: false,
        timestamp: nowIso,
        permissionState: 'unavailable',
        isStale: false,
        staleSeconds: 0,
        error: 'GPS location is temporarily unavailable (no satellite/tower lock). Manual check-ins and safe arrival verification remain fully operational.',
      };
    }

    if (this.simulatedMode === 'stale') {
      const staleTimestamp = new Date(now.getTime() - 240 * 1000).toISOString(); // 4 minutes ago
      return {
        ...DEMO_PRESET_COORDINATES,
        timestamp: staleTimestamp,
        permissionState: 'granted',
        isStale: true,
        staleSeconds: 240,
        error: 'Location fix is stale (last update 4 minutes ago). Signal may be weak or device is background throttled.',
      };
    }

    if (this.simulatedMode === 'granted') {
      return {
        ...DEMO_PRESET_COORDINATES,
        timestamp: nowIso,
        permissionState: 'granted',
        isStale: false,
        staleSeconds: 0,
      };
    }

    // 2. Real Browser Geolocation
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      if (options?.allowDemoFallback) {
        return {
          ...DEMO_PRESET_COORDINATES,
          timestamp: nowIso,
          permissionState: 'granted',
          isStale: false,
          staleSeconds: 0,
        };
      }

      return {
        latitude: null,
        longitude: null,
        accuracy: null,
        addressApproximate: 'Geolocation API not supported',
        isDemoCoordinates: false,
        timestamp: nowIso,
        permissionState: 'unavailable',
        isStale: false,
        staleSeconds: 0,
        error: 'Browser Geolocation is not supported on this device. Manual check-ins remain fully available.',
      };
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.permissionStatus = 'granted';
          const fixDate = new Date(position.timestamp);
          const staleSecs = Math.max(0, Math.floor((now.getTime() - fixDate.getTime()) / 1000));
          const isStale = staleSecs > STALE_LOCATION_THRESHOLD_SECONDS;

          const result: GeoLocationResult = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: Math.round(position.coords.accuracy),
            addressApproximate: `Live GPS Fix (±${Math.round(position.coords.accuracy)}m accuracy)`,
            isDemoCoordinates: false,
            timestamp: fixDate.toISOString(),
            permissionState: 'granted',
            isStale,
            staleSeconds: staleSecs,
          };

          this.lastKnownFix = result;
          resolve(result);
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            this.permissionStatus = 'denied';
            resolve({
              latitude: null,
              longitude: null,
              accuracy: null,
              addressApproximate: 'Location permission denied by user',
              isDemoCoordinates: false,
              timestamp: nowIso,
              permissionState: 'denied',
              isStale: false,
              staleSeconds: 0,
              error: 'Location permission was denied in your browser. Coordinates will not be shared. Manual check-ins and safe arrival confirmation remain fully active.',
            });
          } else {
            this.permissionStatus = 'unavailable';
            const errorMsg =
              error.code === error.POSITION_UNAVAILABLE
                ? 'GPS location is temporarily unavailable on this device.'
                : 'GPS location request timed out.';

            resolve({
              latitude: null,
              longitude: null,
              accuracy: null,
              addressApproximate: 'GPS fix unavailable',
              isDemoCoordinates: false,
              timestamp: nowIso,
              permissionState: 'unavailable',
              isStale: false,
              staleSeconds: 0,
              error: `${errorMsg} Manual check-ins and safe arrival confirmation remain fully active.`,
            });
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 7000,
          maximumAge: 10000,
        }
      );
    });
  }

  startWatchingLocation(
    onUpdate: (location: GeoLocationResult) => void,
    onError?: (errorText: string) => void
  ): () => void {
    if (this.simulatedMode !== 'real') {
      // In simulation mode, emit current simulated fix immediately
      this.getCurrentLocation().then(onUpdate);
      return () => {};
    }

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      onError?.('Geolocation not supported');
      return () => {};
    }

    this.stopWatchingLocation();

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const now = new Date();
        const fixDate = new Date(position.timestamp);
        const staleSecs = Math.max(0, Math.floor((now.getTime() - fixDate.getTime()) / 1000));
        const isStale = staleSecs > STALE_LOCATION_THRESHOLD_SECONDS;

        const result: GeoLocationResult = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy),
          addressApproximate: `Live GPS fix (±${Math.round(position.coords.accuracy)}m)`,
          isDemoCoordinates: false,
          timestamp: fixDate.toISOString(),
          permissionState: 'granted',
          isStale,
          staleSeconds: staleSecs,
        };

        this.lastKnownFix = result;
        onUpdate(result);
      },
      (error) => {
        const state = error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable';
        this.permissionStatus = state;
        onError?.(error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );

    return () => this.stopWatchingLocation();
  }

  stopWatchingLocation() {
    if (this.watchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  getPermissionStatus(): LocationPermissionState {
    return this.permissionStatus;
  }

  getLastKnownFix(): GeoLocationResult | null {
    return this.lastKnownFix;
  }

  checkIsStale(timestampIso: string, virtualNow?: Date): { isStale: boolean; staleSeconds: number } {
    const now = virtualNow || new Date();
    const fixTime = new Date(timestampIso);
    const staleSeconds = Math.max(0, Math.floor((now.getTime() - fixTime.getTime()) / 1000));
    return {
      isStale: staleSeconds > STALE_LOCATION_THRESHOLD_SECONDS,
      staleSeconds,
    };
  }
}

export const geoService = new GeolocationService();
