import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar, Text, TouchableOpacity } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RootStackNavigationProp } from '../navigation/types';
import { LocationPermissionComponent } from '../components/LocationPermission';
import { MapViewComponent } from '../components/MapView';
import { PlacesListComponent } from '../components/PlacesList';
import { useLocationStore } from '../store/locationStore';
import { Place, Location, SupportedPlaceType, SUPPORTED_PLACE_TYPES } from '../types/location';

export const NearbyPlacesScreen: React.FC = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const { 
    currentLocation, 
    nearbyPlaces, 
    permissionStatus, 
    isLoading,
    isLocationWatching,
    error,
    requestLocationPermission,
    fetchNearbyPlaces,
    startLocationWatching,
    stopLocationWatching,
    retryFetchPlaces,
    useDefaultLocation,
    toggleUseDefaultLocation,
    clearPermissionStatus,
    checkCurrentPermissionStatus
  } = useLocationStore();

  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<SupportedPlaceType | 'all'>('all');
  const [filteredPlacesForMap, setFilteredPlacesForMap] = useState<Place[]>([]);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    // Always check current permission status when component mounts
    // This ensures we get fresh permission state on every app launch
    const checkPermission = async () => {
      try {
        // First clear any stored permission status to force fresh check
        clearPermissionStatus();
        
        // Then check current permission status without requesting
        await checkCurrentPermissionStatus();
        
        // If permission is not granted, then request it
        if (!permissionStatus || permissionStatus.status !== 'granted') {
          await requestLocationPermission();
        }
      } catch (error) {
        console.error('Error checking permission status:', error);
      }
    };
    
    checkPermission();
  }, []);

  // Cleanup location watching when component unmounts
  useEffect(() => {
    return () => {
      stopLocationWatching();
    };
  }, [stopLocationWatching]);

  // Initialize filtered places when places change
  useEffect(() => {
    if (nearbyPlaces.length > 0) {
      // When places are first loaded, show all places on map
      // This ensures "All Places" view is the default
      setFilteredPlacesForMap(nearbyPlaces);
      console.log(`Initialized map with ${nearbyPlaces.length} places for "All Places" view`);
    }
  }, [nearbyPlaces]);

  // Handle returning from place details screen
  useFocusEffect(
    React.useCallback(() => {
      // Only auto-focus map when using default location
      // When using live GPS, the map should stay at user's current location
      if (useDefaultLocation && selectedPlace && selectedCategory !== 'all') {
        // Small delay to ensure the map is ready
        const timer = setTimeout(() => {
          focusMapOnPlace(selectedPlace);
        }, 100);
        
        return () => clearTimeout(timer);
      } else if (!useDefaultLocation) {
        console.log('Auto-map focusing disabled - user is using live GPS location');
      }
    }, [selectedPlace, selectedCategory, useDefaultLocation])
  );

  const getPlaceCategory = (place: Place): SupportedPlaceType | 'all' => {
    if (place.types && place.types.length > 0) {
      const supportedType = place.types.find(type => 
        SUPPORTED_PLACE_TYPES.includes(type as SupportedPlaceType)
      ) as SupportedPlaceType;
      
      if (supportedType) {
        return supportedType;
      }
    }
    return 'all';
  };

  const focusMapOnPlace = (place: Place) => {
    // Only allow map focusing when using default location
    // When using live GPS, the map should stay at user's current location
    if (useDefaultLocation && mapRef.current && place.location) {
      // Animate to the place with a zoomed-in view
      mapRef.current.animateToRegion(
        {
          latitude: place.location.latitude,
          longitude: place.location.longitude,
          latitudeDelta: 0.005, // Zoomed in view
          longitudeDelta: 0.005,
        },
        1000 // Animation duration in milliseconds
      );
    } else if (!useDefaultLocation) {
      console.log('Map focusing disabled - user is using live GPS location');
    }
  };

  const handlePlacePress = (place: Place) => {
    setSelectedPlace(place);
    
    // Store the place's category for when we return
    const placeCategory = getPlaceCategory(place);
    setSelectedCategory(placeCategory);
    
    // Focus map on the selected place
    focusMapOnPlace(place);
    
    // Navigate to place details screen
    navigation.navigate('PlaceDetails', {
      placeId: place.placeId || place.id,
      placeName: place.name,
    });
  };

  const handleRefresh = () => {
    if (currentLocation) {
      fetchNearbyPlaces();
    }
  };

  const handleMapMarkerPress = (place: Place) => {
    setSelectedPlace(place);
    
    // Navigate to place details screen
    navigation.navigate('PlaceDetails', {
      placeId: place.placeId || place.id,
      placeName: place.name,
    });
  };

  const handleLocationChange = (newLocation: Location) => {
    // This will be called when the map region changes
    // We can use this to update the current location if needed
    console.log('Map region changed to:', newLocation);
  };

  const handleRetry = () => {
    retryFetchPlaces();
  };

  const handleLocationToggle = async () => {
    await toggleUseDefaultLocation();
    
    // When switching to default location, automatically select "All Places" tab
    // This matches the behavior of the permission screen
    setSelectedCategory('all');
  };

  const handleCategoryChange = (category: SupportedPlaceType | 'all') => {
    console.log(`Category changed to: ${category} while using ${useDefaultLocation ? 'default' : 'live GPS'} location`);
    
    // IMPORTANT: Never change location when switching categories
    // This ensures that if user is using live GPS, it stays at live GPS
    // If user is using default location, it stays at default location
    
    setSelectedCategory(category);
  };

  const handleCategoryPlacesFiltered = (filteredPlaces: Place[], category: SupportedPlaceType | 'all') => {
    console.log(`Received ${filteredPlaces.length} filtered places for category: ${category}`);
    setFilteredPlacesForMap(filteredPlaces);
  };

  const handlePermissionChoice = () => {
    console.log('NearbyPlacesScreen: User made permission choice, hiding permission UI');
  };

  // Show location permission component if permission not granted or user hasn't made a choice
  if (!permissionStatus || 
      permissionStatus.status !== 'granted' || 
      (!currentLocation && !useDefaultLocation)) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <LocationPermissionComponent onPermissionChoice={handlePermissionChoice} />
      </SafeAreaView>
    );
  }

  // Show loading state
  if (isLoading && !currentLocation && !useDefaultLocation) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.loadingContainer}>
          <LocationPermissionComponent />
        </View>
      </SafeAreaView>
    );
  }

  // Show main app content
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Map View */}
      {currentLocation && (
        <MapViewComponent
          ref={mapRef}
          currentLocation={currentLocation}
          nearbyPlaces={filteredPlacesForMap} // Use filtered places for map markers
          isLoading={isLoading}
          onMarkerPress={handleMapMarkerPress}
          onLocationChange={handleLocationChange}
          disableAutoCenter={useDefaultLocation} // Only disable auto-center when using default location
        />
      )}

      {/* Location Status Indicator */}
      {permissionStatus?.status === 'granted' && (
        <>
          {/* Status Card - Top Left */}
          <View style={styles.statusCardLeft}>
            <View style={styles.locationStatus}>
              <View style={[styles.statusDot, { backgroundColor: useDefaultLocation ? '#FF9800' : (isLocationWatching ? '#4CAF50' : '#FF9800') }]} />
              <Text style={styles.statusText}>
                {useDefaultLocation ? 'Default Location' : (isLocationWatching ? 'Live GPS Active' : 'GPS Updating...')}
              </Text>
            </View>
          </View>
          
          {/* Location Toggle Button - Top Right */}
          <TouchableOpacity 
            onPress={handleLocationToggle} 
            style={styles.locationToggleButtonRight}
            disabled={isLoading}
          >
            <Text style={styles.locationToggleButtonText}>
              {useDefaultLocation ? 'Switch to Live GPS' : 'Switch to Default Location'}
            </Text>
          </TouchableOpacity>
        </>
      )}

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={handleRetry} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Places List */}
      <View style={styles.listContainer}>
        <PlacesListComponent
          places={nearbyPlaces}
          onPlacePress={handlePlacePress}
          onRefresh={handleRefresh}
          externalSelectedType={selectedCategory}
          onTypeChange={handleCategoryChange}
          onCategoryPlacesFiltered={handleCategoryPlacesFiltered}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  statusCardLeft: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 1000,
  },
  locationToggleButtonRight: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1000,
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  locationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },

  locationToggleButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  errorBanner: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#D32F2F',
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
