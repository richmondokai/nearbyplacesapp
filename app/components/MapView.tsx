import React, { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { Location, Place, PLACE_TYPE_CONFIG, SupportedPlaceType, SUPPORTED_PLACE_TYPES } from '../types/location';
import { ENV } from '../../config/env';

interface MapViewComponentProps {
  currentLocation: Location;
  nearbyPlaces: Place[];
  isLoading?: boolean;
  onMarkerPress?: (place: Place) => void;
  onLocationChange?: (location: Location) => void;
  disableAutoCenter?: boolean; // New prop to control auto-centering
}

export interface MapViewRef {
  animateToRegion: (region: Region, duration?: number) => void;
  animateToCoordinate: (coordinate: { latitude: number; longitude: number }, duration?: number) => void;
  centerOnCurrentLocation: () => void;
}

export const MapViewComponent = forwardRef<MapViewRef, MapViewComponentProps>(({
  currentLocation,
  nearbyPlaces,
  isLoading = false,
  onMarkerPress,
  onLocationChange,
  disableAutoCenter = false, // Default to false for backward compatibility
}, ref) => {
  const mapRef = useRef<MapView>(null);
  const [currentZoom, setCurrentZoom] = useState(15); // Default zoom level

  // Expose map methods to parent component
  useImperativeHandle(ref, () => ({
    animateToRegion: (region: Region, duration: number = 1000) => {
      if (mapRef.current) {
        mapRef.current.animateToRegion(region, duration);
      }
    },
    animateToCoordinate: (coordinate: { latitude: number; longitude: number }, duration: number = 1000) => {
      if (mapRef.current) {
        const region: Region = {
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        mapRef.current.animateToRegion(region, duration);
      }
    },
    centerOnCurrentLocation: () => {
      if (mapRef.current && currentLocation) {
        console.log('MapView: Force centering on current location:', currentLocation);
        const region: Region = {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: currentLocation.latitudeDelta || 0.0922,
          longitudeDelta: currentLocation.longitudeDelta || 0.0421,
        };
        mapRef.current.animateToRegion(region, 1000);
      }
    },
  }));

  // Auto-center map when current location changes (only if not disabled)
  useEffect(() => {
    console.log('MapView: Location changed, disableAutoCenter:', disableAutoCenter, 'currentLocation:', currentLocation);
    
    if (mapRef.current && currentLocation) {
      if (!disableAutoCenter) {
        // Auto-center when using live GPS
        const region: Region = {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: currentLocation.latitudeDelta || 0.0922,
          longitudeDelta: currentLocation.longitudeDelta || 0.0421,
        };
        
        console.log('MapView: Auto-centering to new location:', region);
        mapRef.current.animateToRegion(region, 1000);
      } else {
        // Force center when switching to default location (San Francisco)
        console.log('MapView: Force centering to default location (San Francisco)');
        const region: Region = {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: currentLocation.latitudeDelta || 0.0922,
          longitudeDelta: currentLocation.longitudeDelta || 0.0421,
        };
        mapRef.current.animateToRegion(region, 1000);
      }
    }
  }, [currentLocation, disableAutoCenter]);

  const handleMarkerPress = (place: Place) => {
    if (onMarkerPress) {
      onMarkerPress(place);
    }
  };

  const handleRegionChangeComplete = (region: Region) => {
    // Optional: Handle when user manually moves the map
    if (onLocationChange) {
      const newLocation: Location = {
        latitude: region.latitude,
        longitude: region.longitude,
        latitudeDelta: region.latitudeDelta,
        longitudeDelta: region.longitudeDelta,
      };
      onLocationChange(newLocation);
    }
  };

  // Zoom in functionality
  const handleZoomIn = () => {
    if (mapRef.current) {
      const newZoom = Math.min(currentZoom + 1, 20);
      setCurrentZoom(newZoom);
      
      // Calculate new deltas based on zoom level
      const zoomFactor = Math.pow(0.5, newZoom - 15); // Base zoom is 15
      const newLatDelta = 0.0922 * zoomFactor;
      const newLngDelta = 0.0421 * zoomFactor;
      
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: newLatDelta,
        longitudeDelta: newLngDelta,
      }, 300);
    }
  };

  // Zoom out functionality
  const handleZoomOut = () => {
    if (mapRef.current) {
      const newZoom = Math.max(currentZoom - 1, 1);
      setCurrentZoom(newZoom);
      
      // Calculate new deltas based on zoom level
      const zoomFactor = Math.pow(0.5, newZoom - 15); // Base zoom is 15
      const newLatDelta = 0.0922 * zoomFactor;
      const newLngDelta = 0.0421 * zoomFactor;
      
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: newLatDelta,
        longitudeDelta: newLngDelta,
      }, 300);
    }
  };

  // Get unique marker color for each place using the 10 specific colors
  const getMarkerColor = (place: Place): string => {
    // Define the 10 unique, visually distinct colors for map markers
    const MARKER_COLORS = [
      '#E34234', // 1. Vermilion - vibrant warm red
      '#2A52BE', // 2. Cerulean - deep serene blue
      '#FFBF00', // 3. Amber - rich golden yellow
      '#FF00FF', // 4. Magenta/Fuchsia - electric pinkish-purple
      '#7FFF00', // 5. Chartreuse - bold greenish-yellow
      '#007FFF', // 6. Azure - bright sky blue
      '#FF7F50', // 7. Coral - friendly pink-orange blend
      '#708090', // 8. Slate - sophisticated dark blue-gray
      '#40826D', // 9. Viridian - muted blue-green tone
      '#8F00FF', // 10. Electric Violet - deep intense purple
    ];
    
    // Simple approach: use place ID to assign consistent colors
    const str = place.id || place.name || '';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Use hash to select from our predefined colors
    const colorIndex = Math.abs(hash) % MARKER_COLORS.length;
    console.log(`Place: ${place.name}, Color: ${MARKER_COLORS[colorIndex]}, Index: ${colorIndex}`);
    return MARKER_COLORS[colorIndex];
  };

  // Get marker title with distance
  const getMarkerTitle = (place: Place): string => {
    let title = place.name;
    if (place.distance !== undefined) {
      const distance = place.distance < 1000 
        ? `${Math.round(place.distance)}m` 
        : `${(place.distance / 1000).toFixed(1)}km`;
      title += ` (${distance})`;
    }
    return title;
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: currentLocation.latitudeDelta || 0.0922,
          longitudeDelta: currentLocation.longitudeDelta || 0.0421,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        showsTraffic={false}
        showsBuildings={true}
        showsIndoors={true}
        followsUserLocation={true}
        userLocationUpdateInterval={5000}
        userLocationFastestInterval={2000}
        userLocationPriority="high"
        // Note: Google Maps API key is configured in android/app/src/main/AndroidManifest.xml
        // and ios/YourApp/Info.plist for react-native-maps v1.7.1
        onRegionChangeComplete={handleRegionChangeComplete}
      >
        {/* Current location marker - only show if not using showsUserLocation */}
        {!currentLocation.accuracy && (
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            title="Your Location"
            description="You are here"
            pinColor="#007AFF"
          />
        )}

        {/* Nearby places markers with different colors */}
        {nearbyPlaces.map((place) => {
          const markerColor = getMarkerColor(place);
          console.log(`Creating marker for ${place.name} with color: ${markerColor}`);
          return (
            <Marker
              key={place.id}
              coordinate={{
                latitude: place.location.latitude,
                longitude: place.location.longitude,
              }}
              title={getMarkerTitle(place)}
              description={place.address}
              pinColor={markerColor}
              onPress={() => handleMarkerPress(place)}
            />
          );
        })}
      </MapView>

      {/* Custom Location Button - Bottom Left */}
      <View style={styles.locationButtonContainer}>
        <TouchableOpacity 
          style={styles.locationButton} 
          onPress={() => {
            if (mapRef.current && currentLocation) {
              mapRef.current.animateToRegion({
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                latitudeDelta: currentLocation.latitudeDelta || 0.0922,
                longitudeDelta: currentLocation.longitudeDelta || 0.0421,
              }, 1000);
            }
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.locationIconText}>📍</Text>
        </TouchableOpacity>
      </View>

      {/* Custom Zoom Controls - Bottom Right */}
      <View style={styles.zoomControls}>
        <TouchableOpacity 
          style={styles.zoomButton} 
          onPress={handleZoomIn}
          activeOpacity={0.7}
        >
          <View style={styles.zoomIconContainer}>
            <View style={styles.zoomIconLineHorizontal} />
            <View style={styles.zoomIconLineVertical} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.zoomButton} 
          onPress={handleZoomOut}
          activeOpacity={0.7}
        >
          <View style={styles.zoomIconContainer}>
            <View style={styles.zoomIconLineHorizontal} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Loading overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Finding nearby places...</Text>
          </View>
        </View>
      )}
    </View>
  );
});

MapViewComponent.displayName = 'MapViewComponent';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: Dimensions.get('window').height * 0.6,
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  zoomControls: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    padding: 4,
  },
  zoomButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(128, 128, 128, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  zoomIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 20,
    height: 20,
    position: 'relative',
  },
  zoomIconLineHorizontal: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 1,
    width: 12,
    height: 2,
    top: 9,
    left: 4,
  },
  zoomIconLineVertical: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 1,
    width: 2,
    height: 12,
    top: 4,
    left: 9,
  },
  locationButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    padding: 4,
  },
  locationButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationIconText: {
    color: 'white',
    fontSize: 20,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },

});
