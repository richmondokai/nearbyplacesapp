export interface Location {
  latitude: number;
  longitude: number;
  latitudeDelta?: number;
  longitudeDelta?: number;
  accuracy?: number;
  timestamp?: number;
}

export interface Place {
  id: string;
  name: string;
  address: string;
  location: Location;
  rating?: number;
  types?: string[];
  photos?: string[];
  placeId?: string;
  distance?: number; // Distance from user in meters
  
  // Additional fields for details screen
  phoneNumber?: string;
  website?: string;
  openingHours?: {
    open_now: boolean;
    periods?: any[];
    weekday_text?: string[];
  };
  priceLevel?: number; // 0-4 scale
  reviews?: Array<{
    author_name: string;
    rating: number;
    text: string;
    time: number;
  }>;
}

export interface LocationPermission {
  status: 'granted' | 'denied' | 'restricted' | 'never_ask_again';
  canAskAgain: boolean;
}

export interface NearbyPlacesResponse {
  results: Place[];
  nextPageToken?: string;
  status: string;
}

export type PermissionStatus = 'granted' | 'denied' | 'restricted' | 'never_ask_again';

// Supported place types for the app
export const SUPPORTED_PLACE_TYPES = [
  'restaurant',
  'cafe',
  'gas_station',
  'bank',
  'pharmacy',
  'lodging',
  'park',
  'gym',
  'hospital',
  'shopping_mall',
  'store',
  'bar',
  'school',
  'police',
  'post_office',
  'library',
  'museum',
  'movie_theater',
  'amusement_park',
  'aquarium',
  'zoo',
  'stadium',
  'airport',
  'train_station',
  'bus_station',
  'subway_station',
] as const;

export type SupportedPlaceType = typeof SUPPORTED_PLACE_TYPES[number];

// Place type configuration with display names and marker colors
export const PLACE_TYPE_CONFIG = {
  restaurant: { label: 'Restaurants', color: '#E34234', icon: '🍽️' },      // 1. Vermilion
  cafe: { label: 'Cafes', color: '#2A52BE', icon: '☕' },                  // 2. Cerulean
  gas_station: { label: 'Gas Stations', color: '#FFBF00', icon: '⛽' },    // 3. Amber
  bank: { label: 'Banks', color: '#FF00FF', icon: '🏦' },                  // 4. Magenta/Fuchsia
  pharmacy: { label: 'Pharmacies', color: '#7FFF00', icon: '💊' },         // 5. Chartreuse
  lodging: { label: 'Hotels', color: '#007FFF', icon: '🏨' },              // 6. Azure
  park: { label: 'Parks', color: '#FF7F50', icon: '🌳' },                  // 7. Coral
  gym: { label: 'Gyms', color: '#708090', icon: '💪' },                    // 8. Slate
  hospital: { label: 'Hospitals', color: '#40826D', icon: '🏥' },          // 9. Viridian
  shopping_mall: { label: 'Shopping Malls', color: '#8F00FF', icon: '🛍️' }, // 10. Electric Violet
  store: { label: 'Stores', color: '#F8C471', icon: '🏪' },
  bar: { label: 'Bars', color: '#E74C3C', icon: '🍺' },
  school: { label: 'Schools', color: '#52C3A2', icon: '🎓' },
  police: { label: 'Police', color: '#34495E', icon: '👮' },
  post_office: { label: 'Post Offices', color: '#E67E22', icon: '📮' },
  library: { label: 'Libraries', color: '#8E44AD', icon: '📚' },
  museum: { label: 'Museums', color: '#16A085', icon: '🏛️' },
  movie_theater: { label: 'Movie Theaters', color: '#C0392B', icon: '🎬' },
  amusement_park: { label: 'Amusement Parks', color: '#F39C12', icon: '🎡' },
  aquarium: { label: 'Aquariums', color: '#2980B9', icon: '🐠' },
  zoo: { label: 'Zoos', color: '#27AE60', icon: '🦁' },
  stadium: { label: 'Stadiums', color: '#E74C3C', icon: '🏟️' },
  airport: { label: 'Airports', color: '#9B59B6', icon: '✈️' },
  train_station: { label: 'Train Stations', color: '#3498DB', icon: '🚂' },
  bus_station: { label: 'Bus Stations', color: '#1ABC9C', icon: '🚌' },
  subway_station: { label: 'Subway Stations', color: '#2C3E50', icon: '🚇' },
} as const;

// API configuration for nearby places
export const NEARBY_PLACES_CONFIG = {
  DEFAULT_RADIUS: 5000, // 5km in meters
  MAX_RESULTS: 20,
  DEFAULT_TYPE: 'restaurant' as SupportedPlaceType,
} as const;
