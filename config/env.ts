// Environment configuration
// In a production app, these would be loaded from environment variables
export const ENV = {
  // Nearby Places API Server (Mock API)
  NEARBY_PLACES_API_BASE_URL: 'https://nbp-production.up.railway.app',
  
  // Google Maps API Key - Load from environment variable
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE',
  
  // Default location (San Francisco)
  DEFAULT_LOCATION: {
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  },
  
  // API Configuration
  API_CONFIG: {
    TIMEOUT: 10000, // 10 seconds
    RETRY_ATTEMPTS: 3,
    RATE_LIMIT_DELAY: 1000, // 1 second delay on rate limit
  },
} as const;

