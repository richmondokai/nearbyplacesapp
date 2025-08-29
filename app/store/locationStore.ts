import { create } from 'zustand';
import { Location, Place, LocationPermission, SupportedPlaceType, NEARBY_PLACES_CONFIG, SUPPORTED_PLACE_TYPES } from '../types/location';
import { locationService } from '../services/location';

interface LocationState {
  currentLocation: Location | null;
  nearbyPlaces: Place[];
  allPlaces: Place[]; // Store all places from all categories
  placesByCategory: Record<SupportedPlaceType, Place[]>; // Store places by category
  permissionStatus: LocationPermission | null;
  isLoading: boolean;
  error: string | null;
  isLocationWatching: boolean;
  selectedPlaceType: SupportedPlaceType;
  searchRadius: number;
  useDefaultLocation: boolean;
  isPermissionRequestPhase: boolean;
}

interface LocationActions {
  requestLocationPermission: () => Promise<void>;
  getCurrentLocation: () => Promise<void>;
  fetchNearbyPlaces: (type?: SupportedPlaceType, radius?: number) => Promise<void>;
  fetchAllNearbyPlaces: (radius?: number) => Promise<void>;
  verifyLocationConsistency: () => Location | null;
  setCurrentLocation: (location: Location) => void;
  setNearbyPlaces: (places: Place[]) => void;
  setPermissionStatus: (status: LocationPermission) => void;
  updateLocationServicePermission: (granted: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  startLocationWatching: () => void;
  stopLocationWatching: () => void;
  setSelectedPlaceType: (type: SupportedPlaceType) => void;
  setSearchRadius: (radius: number) => void;
  setUseDefaultLocation: (useDefault: boolean) => void;
  toggleUseDefaultLocation: () => Promise<void>;
  retryFetchPlaces: () => Promise<void>;
  reset: () => void;
  debugLocationState: () => void;
  forceMapRefresh: () => void;
  getCurrentStatus: () => string;
  clearPermissionStatus: () => void;
  checkCurrentPermissionStatus: () => Promise<void>;
  setPermissionRequestPhase: (phase: boolean) => void;
}

type LocationStore = LocationState & LocationActions;

const initialState: LocationState = {
  currentLocation: null,
  nearbyPlaces: [],
  allPlaces: [],
  placesByCategory: {} as Record<SupportedPlaceType, Place[]>,
  permissionStatus: null,
  isLoading: false,
  error: null,
  isLocationWatching: false,
  selectedPlaceType: NEARBY_PLACES_CONFIG.DEFAULT_TYPE,
  searchRadius: NEARBY_PLACES_CONFIG.DEFAULT_RADIUS,
  useDefaultLocation: false,
  isPermissionRequestPhase: false,
};

export const useLocationStore = create<LocationStore>((set, get) => ({
  ...initialState,

  // Helper function to verify location consistency
  verifyLocationConsistency: () => {
    const { currentLocation, useDefaultLocation } = get();
    if (!currentLocation) return null;

    if (useDefaultLocation) {
      const defaultLocation = locationService.getDefaultLocation();
      const isUsingDefaultLocation = Math.abs(currentLocation.latitude - defaultLocation.latitude) < 0.001 && 
                                   Math.abs(currentLocation.longitude - defaultLocation.longitude) < 0.001;
      if (!isUsingDefaultLocation) {
        // Suppressed: Location mismatch detected! Correcting to default location
        set({ currentLocation: defaultLocation });
        return defaultLocation;
      }
    }
    return currentLocation;
  },

  requestLocationPermission: async () => {
    try {
      set({ isLoading: true, error: null });
      const permission = await locationService.requestLocationPermission();
      set({ permissionStatus: permission });

      // Update the service's permission status
      if (permission.status === 'granted') {
        locationService.updatePermissionStatus(true);
        // Don't automatically get location - let user choose
        // await get().getCurrentLocation();
        // get().startLocationWatching();
      } else {
        locationService.updatePermissionStatus(false);
      }
      // Don't automatically set default location - let user choose
    } catch (error) {
      set({ error: 'Failed to request location permission' });
      locationService.updatePermissionStatus(false);
      // Don't automatically set default location - let user choose
    } finally {
      set({ isLoading: false });
    }
  },

  getCurrentLocation: async () => {
    try {
      set({ isLoading: true, error: null });
      console.log('Attempting to get current location...');
      
      const location = await locationService.getCurrentLocation();
      console.log('Successfully got current location:', location);
      
      set({ currentLocation: location });
      
      // Fetch nearby places after getting location
      await get().fetchNearbyPlaces();
    } catch (error) {
      console.error('Failed to get current location:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to get current location';
      set({ error: errorMessage });
      
      // Don't automatically fall back to default location
      // Let the user choose what to do
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchNearbyPlaces: async (type?: SupportedPlaceType, radius?: number) => {
    try {
      // Verify location consistency before fetching
      const verifiedLocation = get().verifyLocationConsistency();
      if (!verifiedLocation) {
        set({ error: 'No location available' });
        return;
      }

      const { selectedPlaceType, searchRadius, useDefaultLocation } = get();

      set({ isLoading: true, error: null });
      
      // Clear previous places immediately to avoid showing stale data
      set({ nearbyPlaces: [], allPlaces: [] });
      
      const placeType = type || selectedPlaceType;
      console.log(`Fetching places for type: ${placeType} at ${useDefaultLocation ? 'default' : 'live GPS'} location (${verifiedLocation.latitude.toFixed(4)}, ${verifiedLocation.longitude.toFixed(4)})`);
      
      const places = await locationService.getNearbyPlaces(
        verifiedLocation, 
        placeType, 
        radius || searchRadius
      );
      
      console.log(`Found ${places.length} places for type: ${placeType}`);
      set({ nearbyPlaces: places });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch nearby places';
      set({ error: errorMessage });
      set({ nearbyPlaces: [] }); // Clear places on error
    } finally {
      set({ isLoading: false });
    }
  },

  startLocationWatching: () => {
    const { currentLocation } = get();
    if (!currentLocation) return;

    // Set isLocationWatching to true immediately when starting
    console.log('Starting location watching, setting isLocationWatching to true');
    set({ isLocationWatching: true });

    locationService.startLocationWatching(
      (newLocation) => {
        // Update current location with real-time GPS data
        set({ 
          currentLocation: newLocation,
          isLocationWatching: true 
        });
        
        // DISABLED: Don't automatically fetch places when location changes
        // This was causing issues with category selections
        // const { currentLocation: oldLocation } = get();
        // if (oldLocation && isLocationSignificantlyDifferent(oldLocation, newLocation)) {
        //   get().fetchNearbyPlaces();
        // }
        
        console.log(`Location updated to: ${newLocation.latitude.toFixed(4)}, ${newLocation.longitude.toFixed(4)}`);
      },
      (error) => {
        console.error('Location watching error:', error);
        set({ error: 'Location tracking error' });
        // Keep isLocationWatching true even on error, as the service might recover
      }
    );
  },

  stopLocationWatching: () => {
    console.log('Stopping location watching, setting isLocationWatching to false');
    locationService.stopLocationWatching();
    set({ isLocationWatching: false });
  },

  setSelectedPlaceType: (type: SupportedPlaceType) => {
    set({ selectedPlaceType: type });
    // Don't automatically fetch places - let user choose when to fetch
  },

  setSearchRadius: (radius: number) => {
    set({ searchRadius: radius });
    // Don't automatically fetch places - let user choose when to fetch
  },

  retryFetchPlaces: async () => {
    const { currentLocation, selectedPlaceType, searchRadius } = get();
    if (currentLocation) {
      await get().fetchNearbyPlaces(selectedPlaceType, searchRadius);
    }
  },

  setCurrentLocation: (location: Location) => {
    set({ currentLocation: location });
  },

  setNearbyPlaces: (places: Place[]) => {
    set({ nearbyPlaces: places });
  },

  setPermissionStatus: (status: LocationPermission) => {
    set({ permissionStatus: status });
    // Also update the location service permission status
    locationService.updatePermissionStatus(status.status === 'granted');
  },

  updateLocationServicePermission: (granted: boolean) => {
    locationService.updatePermissionStatus(granted);
  },

  // Debug method to check current state
  debugLocationState: () => {
    const state = get();
    console.log('=== Location Store Debug ===');
    console.log('useDefaultLocation:', state.useDefaultLocation);
    console.log('currentLocation:', state.currentLocation);
    console.log('isLocationWatching:', state.isLocationWatching);
    console.log('permissionStatus:', state.permissionStatus);
    console.log('==========================');
  },

  // Force refresh map location (useful for debugging)
  forceMapRefresh: () => {
    const state = get();
    console.log('Force refreshing map location:', state.currentLocation);
    // This will trigger the MapView useEffect to re-center
    if (state.currentLocation) {
      set({ currentLocation: { ...state.currentLocation } });
    }
  },

  // Get current status for debugging
  getCurrentStatus: () => {
    const state = get();
    const status = state.useDefaultLocation ? 'Using Default Location' : 
                   (state.isLocationWatching ? 'Live GPS Active' : 'GPS Updating...');
    console.log('Current status:', status, {
      useDefaultLocation: state.useDefaultLocation,
      isLocationWatching: state.isLocationWatching
    });
    return status;
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  setUseDefaultLocation: (useDefault: boolean) => {
    console.log(`setUseDefaultLocation called with: ${useDefault}`);
    set({ useDefaultLocation: useDefault });
    if (useDefault) {
      const defaultLocation = locationService.getDefaultLocation();
      console.log(`Setting currentLocation to default: ${defaultLocation.latitude}, ${defaultLocation.longitude}`);
      set({ currentLocation: defaultLocation });
      // Immediately fetch places from ALL categories for the default location
      // This ensures all places are visible on map and populated in All Places tab
      get().fetchAllNearbyPlaces();
    }
  },

  fetchAllNearbyPlaces: async (radius?: number) => {
    try {
      // Verify location consistency before fetching
      const verifiedLocation = get().verifyLocationConsistency();
      if (!verifiedLocation) {
        set({ error: 'No location available' });
        return;
      }

      const { searchRadius, useDefaultLocation } = get();

      set({ isLoading: true, error: null });
      
      // Clear previous places immediately to avoid showing stale data
      set({ nearbyPlaces: [], allPlaces: [] });
      
      console.log(`Fetching places from all categories at ${useDefaultLocation ? 'default' : 'live GPS'} location (${verifiedLocation.latitude.toFixed(4)}, ${verifiedLocation.longitude.toFixed(4)})`);
      
      // Fetch places from multiple categories to populate All Places
      const allPlaces: Place[] = [];
      // Use all supported place types instead of limiting to 8
      const typesToFetch = SUPPORTED_PLACE_TYPES;
      
      for (const type of typesToFetch) {
        try {
          const places = await locationService.getNearbyPlaces(
            verifiedLocation, 
            type, 
            radius || searchRadius
          );
          console.log(`Found ${places.length} places for ${type}`);
          allPlaces.push(...places);
        } catch (error) {
          console.warn(`Failed to fetch places for type ${type}:`, error);
        }
      }
      
      // Remove duplicates and sort by distance
      const uniquePlaces = allPlaces.filter((place, index, self) => 
        index === self.findIndex(p => p.id === place.id)
      );
      
      uniquePlaces.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      
      console.log(`Total unique places after consolidation: ${uniquePlaces.length}`);
      
      set({ 
        allPlaces: uniquePlaces, 
        nearbyPlaces: uniquePlaces,
        isLoading: false 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch all nearby places';
      set({ error: errorMessage, nearbyPlaces: [], isLoading: false });
    }
  },

  toggleUseDefaultLocation: async () => {
    const { useDefaultLocation } = get();
    const newUseDefault = !useDefaultLocation;
    console.log(`Switching location mode from ${useDefaultLocation ? 'default' : 'live GPS'} to ${newUseDefault ? 'default' : 'live GPS'}`);
    
    // Debug current state
    get().debugLocationState();
    
    if (newUseDefault) {
      // Switch to default location
      const defaultLocation = locationService.getDefaultLocation();
      console.log(`Setting default location: ${defaultLocation.latitude.toFixed(4)}, ${defaultLocation.longitude.toFixed(4)}`);
      
      // Stop location watching first
      console.log('Stopping location watching...');
      get().stopLocationWatching();
      
      set({ 
        currentLocation: defaultLocation,
        useDefaultLocation: true,
        isLoading: false,
        error: null
      });
      
      // Verify the state was updated
      const stateAfterStop = get();
      console.log('State after stopping location watching:', {
        isLocationWatching: stateAfterStop.isLocationWatching,
        useDefaultLocation: stateAfterStop.useDefaultLocation
      });
      
      // Fetch places for default location
      await get().fetchAllNearbyPlaces();
      
      // Force map refresh to ensure it centers on default location
      get().forceMapRefresh();
      
      console.log('Successfully switched to default location');
      console.log('Map should now center on San Francisco');
      
      // Verify final status
      get().getCurrentStatus();
    } else {
      // Switch to live GPS
      try {
        set({ isLoading: true, error: null });
        console.log('Checking GPS availability...');
        
        // First check if GPS is available
        const gpsAvailable = await locationService.checkGPSAvailability();
        if (!gpsAvailable) {
          throw new Error('GPS is not available on this device');
        }
        
        console.log('Getting current GPS location...');
        const currentLocation = await locationService.getCurrentLocation();
        console.log(`Setting live GPS location: ${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`);
        
        console.log('Setting new live GPS location in store:', currentLocation);
        set({ 
          currentLocation: currentLocation,
          useDefaultLocation: false,
          isLoading: false,
          error: null
        });
        
        // Start location watching for real-time updates
        console.log('Starting location watching...');
        get().startLocationWatching();
        
        // Verify the state was updated
        const stateAfterStart = get();
        console.log('State after starting location watching:', {
          isLocationWatching: stateAfterStart.isLocationWatching,
          useDefaultLocation: stateAfterStart.useDefaultLocation
        });
        
        await get().fetchNearbyPlaces();
        
        // Force map refresh to ensure it centers on live GPS location
        get().forceMapRefresh();
        
        console.log('Successfully switched to live GPS location');
        console.log('Map should now center on your current GPS location');
        
        // Verify final status
        get().getCurrentStatus();
      } catch (error) {
        console.error('Failed to switch to live GPS:', error);
        
        // Revert to default location if live GPS fails
        const defaultLocation = locationService.getDefaultLocation();
        set({ 
          currentLocation: defaultLocation,
          useDefaultLocation: true,
          isLoading: false,
          error: `Failed to get your current location: ${error instanceof Error ? error.message : 'Unknown error'}. Reverted to default location.`
        });
        
        // Stop any location watching
        get().stopLocationWatching();
        
        // Fetch places for default location
        await get().fetchAllNearbyPlaces();
        
        // Force map refresh to ensure it centers on default location
        get().forceMapRefresh();
      }
    }
  },

  reset: () => {
    get().stopLocationWatching();
    set(initialState);
  },

  // Clear stored permission status to force fresh check
  clearPermissionStatus: () => {
    set({ permissionStatus: null });
  },

  checkCurrentPermissionStatus: async () => {
    const status = await locationService.checkPermissionStatus();
    set({ permissionStatus: status });
  },

  setPermissionRequestPhase: (phase: boolean) => {
    set({ isPermissionRequestPhase: phase });
  },
}));

// Helper function to determine if location change is significant
function isLocationSignificantlyDifferent(
  oldLocation: Location, 
  newLocation: Location, 
  thresholdMeters: number = 50
): boolean {
  const latDiff = oldLocation.latitude - newLocation.latitude;
  const lngDiff = oldLocation.longitude - newLocation.longitude;
  
  // Rough conversion to meters (1 degree ≈ 111,000 meters)
  const latDiffMeters = Math.abs(latDiff) * 111000;
  const lngDiffMeters = Math.abs(lngDiff) * 111000 * Math.cos(oldLocation.latitude * Math.PI / 180);
  
  const totalDiffMeters = Math.sqrt(latDiffMeters * latDiffMeters + lngDiffMeters * lngDiffMeters);
  
  return totalDiffMeters > thresholdMeters;
}
