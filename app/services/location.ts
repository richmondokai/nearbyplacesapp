import Geolocation from 'react-native-geolocation-service';
import { Platform, PermissionsAndroid } from 'react-native';
import { Location, LocationPermission, Place, SupportedPlaceType, NEARBY_PLACES_CONFIG } from '../types/location';
import { ENV } from '../../config/env';
import { nearbyPlacesApiService } from './nearbyPlacesApi';

class LocationService {
  private hasLocationPermission = false;
  private locationWatcherId: number | null = null;

  async requestLocationPermission(): Promise<LocationPermission> {
    if (Platform.OS === 'ios') {
      return this.requestIOSPermission();
    } else {
      return this.requestAndroidPermission();
    }
  }

  private async requestIOSPermission(): Promise<LocationPermission> {
    try {
      const permission = await Geolocation.requestAuthorization('whenInUse');
      this.hasLocationPermission = permission === 'granted';
      
      // Handle different iOS permission states
      if (permission === 'granted') {
        return {
          status: 'granted',
          canAskAgain: true,
        };
      } else if (permission === 'denied') {
        return {
          status: 'denied',
          canAskAgain: true,
        };
      } else if (permission === 'restricted') {
        return {
          status: 'restricted',
          canAskAgain: false,
        };
      } else {
        // Default case - treat as denied
        return {
          status: 'denied',
          canAskAgain: true,
        };
      }
    } catch (error) {
      console.error('iOS location permission error:', error);
      return {
        status: 'denied',
        canAskAgain: true,
      };
    }
  }

  private async requestAndroidPermission(): Promise<LocationPermission> {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'This app needs access to your location to show nearby places.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      
      this.hasLocationPermission = granted === PermissionsAndroid.RESULTS.GRANTED;
      
      // Handle different Android permission results
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        return {
          status: 'granted',
          canAskAgain: true,
        };
      } else if (granted === PermissionsAndroid.RESULTS.DENIED) {
        return {
          status: 'denied',
          canAskAgain: true,
        };
      } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        return {
          status: 'never_ask_again',
          canAskAgain: false,
        };
      } else {
        // Default case - treat as denied
        return {
          status: 'denied',
          canAskAgain: true,
        };
      }
    } catch (error) {
      console.error('Android location permission error:', error);
      return {
        status: 'denied',
        canAskAgain: true,
      };
    }
  }

  startLocationWatching(
    onLocationUpdate: (location: Location) => void,
    onError?: (error: any) => void
  ): void {
    console.log('startLocationWatching called, permission status:', this.hasLocationPermission);
    
    if (!this.hasLocationPermission) {
      console.log('Attempting to start location watching without permission flag...');
    }

    // Stop any existing watcher
    if (this.locationWatcherId !== null) {
      console.log('Stopping existing location watcher...');
      this.stopLocationWatching();
    }

    this.locationWatcherId = Geolocation.watchPosition(
      (position) => {
        const location: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };
        // Update permission flag if we successfully get location updates
        this.hasLocationPermission = true;
        console.log('Location watching update:', location);
        onLocationUpdate(location);
      },
      (error) => {
        console.error('Location watching error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        if (onError) onError(error);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 10, // Update every 10 meters
        interval: 5000, // Update every 5 seconds
        fastestInterval: 2000, // Fastest update every 2 seconds
      }
    );
    
    console.log('Location watching started with ID:', this.locationWatcherId);
  }

  stopLocationWatching(): void {
    if (this.locationWatcherId !== null) {
      Geolocation.clearWatch(this.locationWatcherId);
      this.locationWatcherId = null;
    }
  }

  async getCurrentLocation(): Promise<Location> {
    return new Promise((resolve, reject) => {
      console.log('getCurrentLocation called, permission status:', this.hasLocationPermission);
      
      // Check if we have location permission
      if (!this.hasLocationPermission) {
        // Try to get location anyway - the permission might have been granted elsewhere
        console.log('Attempting to get current location without permission flag...');
      }

      Geolocation.getCurrentPosition(
        (position) => {
          const location: Location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };
          // Update permission flag if we successfully got location
          this.hasLocationPermission = true;
          console.log('Successfully got current location:', location);
          resolve(location);
        },
        (error) => {
          console.error('Get current location error:', error);
          console.error('Error code:', error.code);
          console.error('Error message:', error.message);
          
          // Provide more specific error information
          let errorMessage = 'Unknown location error';
          switch (error.code) {
            case 1:
              errorMessage = 'Location permission denied';
              break;
            case 2:
              errorMessage = 'Location unavailable';
              break;
            case 3:
              errorMessage = 'Location request timed out';
              break;
          }
          
          const enhancedError = new Error(errorMessage);
          enhancedError.message = errorMessage;
          reject(enhancedError);
        },
        {
          enableHighAccuracy: true,
          timeout: 20000, // Increased timeout
          maximumAge: 10000,
        }
      );
    });
  }

  async getNearbyPlaces(
    location: Location,
    type: SupportedPlaceType = NEARBY_PLACES_CONFIG.DEFAULT_TYPE,
    radius: number = NEARBY_PLACES_CONFIG.DEFAULT_RADIUS
  ): Promise<Place[]> {
    try {
      // Use the new Nearby Places API Server instead of Google Places API
      const places = await nearbyPlacesApiService.getNearbyPlaces(location, type, radius);
      
      // Sort places by distance (closest first)
      return places.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    } catch (error) {
      console.error('Failed to fetch nearby places:', error);
      throw error;
    }
  }

  getDefaultLocation(): Location {
    return ENV.DEFAULT_LOCATION;
  }

  isLocationPermissionGranted(): boolean {
    return this.hasLocationPermission;
  }

  updatePermissionStatus(granted: boolean): void {
    this.hasLocationPermission = granted;
    console.log('Location permission status updated:', granted);
  }

  async checkPermissionStatus(): Promise<LocationPermission> {
    if (Platform.OS === 'ios') {
      return this.checkIOSPermissionStatus();
    } else {
      return this.checkAndroidPermissionStatus();
    }
  }

  private async checkAndroidPermissionStatus(): Promise<LocationPermission> {
    try {
      // For Android, check if we already have permission
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      
      this.hasLocationPermission = granted;
      return {
        status: granted ? 'granted' : 'denied',
        canAskAgain: true, // We can always ask again on Android unless user selected "Never ask again"
      };
    } catch (error) {
      console.error('Android permission status check error:', error);
      return {
        status: 'denied',
        canAskAgain: true,
      };
    }
  }

  private async checkIOSPermissionStatus(): Promise<LocationPermission> {
    try {
      // For iOS, we need to check the current authorization status
      // Note: iOS doesn't have a direct way to check without requesting
      // So we'll use a different approach - try to get current position
      // which will fail with permission error if not granted
      return new Promise((resolve) => {
        Geolocation.getCurrentPosition(
          (position) => {
            // If we can get position, permission is granted
            this.hasLocationPermission = true;
            resolve({
              status: 'granted',
              canAskAgain: true,
            });
          },
          (error) => {
            // Check error code to determine permission status
            if (error.code === 1) {
              // Permission denied
              this.hasLocationPermission = false;
              resolve({
                status: 'denied',
                canAskAgain: true,
              });
            } else if (error.code === 2) {
              // Location unavailable (but permission might be granted)
              this.hasLocationPermission = false;
              resolve({
                status: 'denied',
                canAskAgain: true,
              });
            } else {
              // Other error, assume denied
              this.hasLocationPermission = false;
              resolve({
                status: 'denied',
                canAskAgain: true,
              });
            }
          },
          {
            enableHighAccuracy: false,
            timeout: 1000, // Very short timeout just to check permission
            maximumAge: 0,
          }
        );
      });
    } catch (error) {
      console.error('iOS permission status check error:', error);
      return {
        status: 'denied',
        canAskAgain: true,
      };
    }
  }

  async checkGPSAvailability(): Promise<boolean> {
    return new Promise((resolve) => {
      Geolocation.getCurrentPosition(
        (position) => {
          console.log('GPS is available and working');
          this.hasLocationPermission = true;
          resolve(true);
        },
        (error) => {
          console.log('GPS check failed:', error.message);
          resolve(false);
        },
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 30000,
        }
      );
    });
  }

  cleanup(): void {
    this.stopLocationWatching();
  }
}

export const locationService = new LocationService();
