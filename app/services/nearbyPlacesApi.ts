import { ENV } from '../../config/env';
import { Place, Location, SupportedPlaceType, NEARBY_PLACES_CONFIG } from '../types/location';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

interface HealthCheckResponse {
  status: string;
  timestamp: string;
  version: string;
  environment: string;
}

// API Response format based on the documentation
interface NearbyPlacesResponse {
  places: Array<{
    id: string;
    name: string;
    type: string;
    address: string;
    lat: number;
    lng: number;
    distance: number;
    rating?: number;
    price_level?: number;
    image_url?: string;
  }>;
  total: number;
  query: {
    lat: number;
    lng: number;
    radius: number;
    type: string;
    limit: number;
  };
}

// Place Details Response format based on the API documentation
interface PlaceDetailsResponse {
  id: string;
  name: string;
  type: string;
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  website?: string;
  rating?: number;
  price_level?: number;
  hours?: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
  image_url?: string;
  description?: string;
}

class NearbyPlacesApiService {
  private baseUrl: string;
  private timeout: number;
  private retryAttempts: number;
  private rateLimitDelay: number;

  constructor() {
    this.baseUrl = ENV.NEARBY_PLACES_API_BASE_URL;
    this.timeout = ENV.API_CONFIG.TIMEOUT;
    this.retryAttempts = ENV.API_CONFIG.RETRY_ATTEMPTS;
    this.rateLimitDelay = ENV.API_CONFIG.RATE_LIMIT_DELAY;
  }

  /**
   * Health check endpoint to verify API server status
   */
  async checkHealth(): Promise<HealthCheckResponse> {
    try {
      const response = await this.makeRequest<HealthCheckResponse>('/api/health');
      return response;
    } catch (error) {
      console.error('Health check failed:', error);
      throw new Error('API server is not responding');
    }
  }

  /**
   * Get nearby places from the API server
   */
  async getNearbyPlaces(
    location: Location,
    type: SupportedPlaceType = NEARBY_PLACES_CONFIG.DEFAULT_TYPE,
    radius: number = NEARBY_PLACES_CONFIG.DEFAULT_RADIUS
  ): Promise<Place[]> {
    try {
      const params = new URLSearchParams({
        lat: location.latitude.toString(),
        lng: location.longitude.toString(),
        type: type,
        radius: radius.toString(),
        limit: '20', // Default limit
      });

      const response = await this.makeRequest<NearbyPlacesResponse>(`/api/places/nearby?${params}`);
      
              if (response.places) {
          // Transform API response to our Place interface
          return response.places.map(place => ({
            id: place.id,
            name: place.name,
            address: place.address,
            location: {
              latitude: place.lat,
              longitude: place.lng,
            },
            rating: place.rating,
            types: [place.type], // Convert single type to array
            placeId: place.id,
            distance: place.distance * 1000, // Convert km to meters
            priceLevel: place.price_level,
            photos: place.image_url ? [place.image_url] : undefined,
          }));
        }
      
      return [];
    } catch (error) {
      console.error('Failed to fetch nearby places:', error);
      throw error;
    }
  }

  /**
   * Get place details from the API server
   */
  async getPlaceDetails(placeId: string): Promise<Place | null> {
    try {
      const response = await this.makeRequest<PlaceDetailsResponse>(`/api/places/${placeId}`);
      
      if (response) {
        // Transform API response to our Place interface
        return {
          id: response.id,
          name: response.name,
          address: response.address,
          location: {
            latitude: response.lat,
            longitude: response.lng,
          },
          rating: response.rating,
          types: [response.type], // Convert single type to array
          placeId: response.id,
          phoneNumber: response.phone,
          website: response.website,
          priceLevel: response.price_level,
          photos: response.image_url ? [response.image_url] : undefined,
          openingHours: response.hours ? {
            open_now: true, // Assume open if hours are provided
            weekday_text: [
              `Monday: ${response.hours.monday}`,
              `Tuesday: ${response.hours.tuesday}`,
              `Wednesday: ${response.hours.wednesday}`,
              `Thursday: ${response.hours.thursday}`,
              `Friday: ${response.hours.friday}`,
              `Saturday: ${response.hours.saturday}`,
              `Sunday: ${response.hours.sunday}`,
            ],
          } : undefined,
        };
      }
      
      return null;
    } catch (error) {
      console.error('Failed to fetch place details:', error);
      throw error;
    }
  }

  /**
   * Generic request method with timeout, retry, and rate limiting
   */
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : this.rateLimitDelay;
        
        console.warn(`Rate limited. Waiting ${delay}ms before retry...`);
        await this.delay(delay);
        
        // Retry the request
        return this.makeRequest<T>(endpoint, options);
      }

      // Handle other HTTP errors
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        throw error;
      }
      
      throw new Error('Network request failed');
    }
  }

  /**
   * Calculate distance between two locations using Haversine formula
   */
  private calculateDistance(location1: Location, location2: Location): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = location1.latitude * Math.PI / 180;
    const φ2 = location2.latitude * Math.PI / 180;
    const Δφ = (location2.latitude - location1.latitude) * Math.PI / 180;
    const Δλ = (location2.longitude - location1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get API server information
   */
  async getServerInfo(): Promise<{ baseUrl: string; status: string }> {
    try {
      const health = await this.checkHealth();
      return {
        baseUrl: this.baseUrl,
        status: health.status,
      };
    } catch (error) {
      return {
        baseUrl: this.baseUrl,
        status: 'unavailable',
      };
    }
  }
}

export const nearbyPlacesApiService = new NearbyPlacesApiService();
