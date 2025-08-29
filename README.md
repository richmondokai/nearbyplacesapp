# Nearby Places App

A comprehensive React Native application that helps users discover nearby places of interest using real-time location services and a custom Places API. The app provides an intuitive map interface, categorized place listings, and intelligent location management with smart permission handling.

## 🌟 Features

### Core Functionality
- **Real-time Location Services**: GPS-based location tracking with intelligent permission management
- **Interactive Map View**: React Native Maps integration with custom markers and place clustering
- **Smart Place Discovery**: Fetch nearby places from multiple categories using custom API
- **Advanced Permission Management**: Smart permission flow with user choice options and recovery mechanisms
- **Fallback Location System**: Default San Francisco location when GPS is unavailable
- **Location Recovery System**: "Allow Location" button for users who initially denied access

### Place Categories
The app supports 25+ place types including:
- 🍽️ Restaurants & Cafes
- ⛽ Gas Stations & Banks
- 🏥 Hospitals & Pharmacies
- 🏨 Hotels & Shopping Centers
- 🎓 Schools & Libraries
- 🚇 Transportation Hubs
- 🎭 Entertainment Venues

### User Experience Features
- **Dual Location Mode**: Choose between live GPS location or default location
- **Smart Permission Flow**: Seamless permission handling with recovery options
- **Category-based Filtering**: Browse places by type or view all places
- **Place Details**: Comprehensive information including ratings, photos, and contact details
- **Responsive Design**: Modern UI with smooth animations and intuitive navigation
- **Offline Support**: Graceful handling of network issues and location errors
- **Warning Suppression**: Clean development experience with suppressed non-critical warnings

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React Native with TypeScript
- **State Management**: Zustand for lightweight, performant state management
- **Navigation**: React Navigation v6 with stack navigation
- **Maps**: React Native Maps with custom marker clustering
- **Location Services**: React Native Geolocation Service
- **API Integration**: Custom Nearby Places API server
- **Styling**: React Native StyleSheet with custom theme system

### Project Structure
```
app/
├── components/          # Reusable UI components
│   ├── Button.tsx      # Custom button component
│   ├── Card.tsx        # Card container component
│   ├── Input.tsx       # Input field component
│   ├── LocationPermission.tsx  # Smart permission management
│   ├── MapView.tsx     # Interactive map component
│   └── PlacesList.tsx  # Places listing component
├── hooks/               # Custom React hooks
├── navigation/          # Navigation configuration
│   ├── AppNavigator.tsx # Main navigation setup
│   └── types.ts         # Navigation type definitions
├── screens/             # App screens
│   ├── NearbyPlacesScreen.tsx  # Main places discovery screen with smart permission flow
│   └── PlaceDetailsScreen.tsx  # Individual place details
├── services/            # API and service layer
│   ├── location.ts      # Location services with enhanced permission handling
│   └── nearbyPlacesApi.ts # Places API integration
├── store/               # State management
│   └── locationStore.ts # Enhanced location and places state management
├── theme/               # Design system
│   ├── colors.ts        # Color palette
│   ├── spacing.ts       # Spacing values
│   └── typography.ts    # Typography styles
├── types/               # TypeScript type definitions
│   └── location.ts      # Location and place types
└── utils/               # Utility functions
```

## 🔐 Environment Configuration

### Required API Keys
This app requires the following API keys to function properly:

- **Google Maps API Key**: For map display and location services
  - Get your key from [Google Cloud Console](https://console.cloud.google.com/)
  - Enable Maps SDK for Android and Maps SDK for iOS
  - Set up billing and API restrictions for security

### Setting Up Environment Variables
1. Copy the example environment file: `cp env.example .env`
2. Edit `.env` and add your actual API keys
3. Never commit the `.env` file to version control
4. For production builds, configure the keys in your build system

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)
- Physical Android device or emulator for testing

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd NearbyPlacesAppNew
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**
   ```bash
   # Copy the example environment file
   cp env.example .env
   
   # Edit .env and add your Google Maps API key
   # GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   ```

4. **iOS Setup** (macOS only)
   ```bash
   cd ios
   pod install
   cd ..
   ```

4. **Environment Configuration**
   - Copy `config/env.example.ts` to `config/env.ts`
   - Update API endpoints and configuration values

### Running the App

1. **Start Metro bundler**
   ```bash
   npm start
   # or
   yarn start
   ```

2. **Run on Android**
   ```bash
   npm run android
   # or
   yarn android
   ```

3. **Run on iOS** (macOS only)
   ```bash
   npm run ios
   # or
   yarn ios
   ```

## 🔧 Configuration

### Environment Variables
Create `config/env.ts` with your configuration:

```typescript
export const ENV = {
  API_BASE_URL: 'https://your-api-server.com',
  DEFAULT_LOCATION: {
    latitude: 37.7749,
    longitude: -122.4194,
    name: 'San Francisco, CA'
  },
  GOOGLE_MAPS_API_KEY: 'your-google-maps-api-key'
};
```

### Location Services
The app requires location permissions for optimal functionality:
- **Android**: `ACCESS_FINE_LOCATION` permission
- **iOS**: `NSLocationWhenInUseUsageDescription` in Info.plist

## 📱 Usage Guide

### First Launch
1. **Permission Request**: App will request location access
2. **Location Choice**: Choose between live GPS or default location
3. **Place Discovery**: Browse nearby places by category

### Using the App
- **Map View**: Interactive map showing nearby places with custom markers
- **Category Tabs**: Filter places by type (Restaurants, Hotels, etc.)
- **Place Details**: Tap on place markers or list items for detailed information
- **Location Toggle**: Switch between live GPS and default location modes

### Location Modes
- **Live GPS**: Real-time location tracking with automatic place updates
- **Default Location**: Uses San Francisco as fallback when GPS unavailable

## 🔒 Advanced Permission Management

### Smart Permission Flow
The app implements an intelligent permission management system that provides multiple recovery options:

1. **Fresh Check on Launch**: Always checks current permission status on every app launch
2. **User Choice Options**: 
   - Allow location access
   - Use default location
   - Deny and continue with limited functionality
3. **Permission Recovery**: "Allow Location" button for users who initially denied access
4. **Session-aware Logic**: Button only appears for first-time denials, not returning users

### Permission Flow States
```
App Launch → Check Previous Permission → Clear Stored Status → Check Current Status → Request if Needed → Show Appropriate UI
```

### Smart Button Logic
The "Allow Location" button appears only when:
- User is using default location (`useDefaultLocation = true`)
- User hasn't attempted location access yet (`hasAttemptedLocationAccess = false`)
- Location wasn't previously granted (`wasLocationPreviouslyGranted = false`)

### Permission Recovery Features
- **One-time Recovery**: Button disappears after user interaction
- **Automatic Switching**: Seamlessly switches from default to live GPS when permission granted
- **Real-time Updates**: Automatically fetches places based on new live location
- **Map Centering**: Auto-centers map on user's new location

## 🗺️ Map Features

### Interactive Map Components
- **Custom Markers**: Category-based marker colors and icons
- **Place Clustering**: Efficient rendering of multiple nearby places
- **Smooth Animations**: Map transitions and marker animations
- **Location Centering**: Automatic centering on user location or selected places
- **Smart Positioning**: Context-aware map behavior based on location mode

### Map Customization
- **Marker Colors**: Unique colors for each place category
- **Icon System**: Emoji-based icons for visual appeal
- **Zoom Controls**: Automatic zoom adjustment based on place density
- **Location Indicators**: Clear visual feedback for current location mode

## 📊 Enhanced State Management

### Zustand Store Architecture
The app uses Zustand for lightweight, performant state management with enhanced permission handling:

```typescript
interface LocationState {
  currentLocation: Location | null;
  nearbyPlaces: Place[];
  permissionStatus: LocationPermission | null;
  isLoading: boolean;
  useDefaultLocation: boolean;
  isLocationWatching: boolean;
  // ... other enhanced state properties
}
```

### Key Store Methods
- `checkCurrentPermissionStatus()`: Fresh permission status check
- `requestLocationPermission()`: Enhanced permission request with recovery
- `toggleUseDefaultLocation()`: Smart switching between location modes
- `fetchNearbyPlaces()`: Get places for specific categories
- `setUseDefaultLocation()`: Intelligent default location handling
- `clearPermissionStatus()`: Force fresh permission checks

### Permission State Persistence
- **Session Management**: Tracks permission attempts across app sessions
- **Smart Recovery**: Remembers user choices and permission history
- **Context Awareness**: Adapts UI based on permission state and user history

## 🌐 API Integration

### Custom Places API
The app integrates with a custom Nearby Places API server:

- **Endpoint**: `/api/places/nearby`
- **Parameters**: Location coordinates, place type, search radius
- **Response**: Structured place data with metadata
- **Error Handling**: Graceful fallbacks and user feedback

### API Features
- **Category-based Queries**: Fetch places by specific types
- **Radius-based Search**: Configurable search radius (default: 5000m)
- **Pagination Support**: Handle large numbers of results
- **Caching**: Efficient data management and updates
- **Real-time Updates**: Automatic refresh when location changes

## 🎨 Enhanced UI/UX Design

### Design System
- **Color Palette**: Consistent color scheme with semantic meaning
- **Typography**: Clear hierarchy with readable fonts
- **Spacing**: Consistent spacing using design tokens
- **Components**: Reusable, accessible UI components

### Smart UI Components
- **Context-aware Buttons**: "Allow Location" button with intelligent visibility
- **Dynamic Status Cards**: Real-time location status indicators
- **Responsive Layouts**: Adaptive UI based on permission and location state
- **Touch-friendly**: Optimized for mobile interaction

### User Experience Improvements
- **Seamless Transitions**: Smooth flow between permission states
- **Clear Feedback**: Visual indicators for all app states
- **Intuitive Navigation**: Logical flow from permission to discovery
- **Recovery Options**: Multiple paths for users to enable location access

## 🧪 Testing

### Test Setup
```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Testing Strategy
- **Unit Tests**: Component and utility function testing
- **Integration Tests**: API and state management testing
- **E2E Tests**: User flow and interaction testing
- **Permission Flow Tests**: Comprehensive permission state testing

## 🚀 Deployment

### Android Build
```bash
cd android
./gradlew assembleRelease
```

### iOS Build
```bash
cd ios
xcodebuild -workspace NearbyPlacesAppNew.xcworkspace -scheme NearbyPlacesAppNew -configuration Release
```

### Build Configuration
- **Release Signing**: Configure signing certificates
- **Bundle Identifiers**: Update app identifiers
- **Version Management**: Semantic versioning support

## 🔧 Troubleshooting

### Common Issues

1. **Metro Bundler Issues**
   ```bash
   npm start --reset-cache
   ```

2. **Android Build Issues**
   ```bash
   cd android
   ./gradlew clean
   ```

3. **iOS Build Issues**
   ```bash
   cd ios
   pod deintegrate
   pod install
   ```

4. **Location Permission Issues**
   - Check device settings
   - Verify permission declarations in manifests
   - Test with physical device
   - Use the "Allow Location" button for recovery

### Debug Mode
Enable debug logging in the location store:
```typescript
// In locationStore.ts
debugLocationState();
getCurrentStatus();
```

### Warning Suppression
The app includes comprehensive warning suppression for a clean development experience:
- **Location warnings**: Suppressed for cleaner console output
- **NativeEventEmitter warnings**: React Native internal warnings suppressed
- **Development vs Production**: Different warning levels for each environment

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

### Code Standards
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting
- **Commit Messages**: Conventional commit format

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- React Native community for the excellent framework
- React Native Maps for map integration
- Zustand for lightweight state management
- Custom Places API server contributors

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the code documentation

---

**Built with ❤️ using React Native**

**Latest Updates:**
- ✨ Smart permission flow with recovery mechanisms
- 🔄 "Allow Location" button for permission recovery
- 🧠 Session-aware permission management
- 🔇 Comprehensive warning suppression
- 🎯 Enhanced user experience with intelligent UI
