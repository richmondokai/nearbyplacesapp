import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Linking,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { PlaceDetailsRouteProp, RootStackNavigationProp, RootStackParamList } from '../navigation/types';
import { Place } from '../types/location';
import { ENV } from '../../config/env';
import { useLocationStore } from '../store/locationStore';
import { nearbyPlacesApiService } from '../services/nearbyPlacesApi';

const { width: screenWidth } = Dimensions.get('window');

export const PlaceDetailsScreen: React.FC = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'PlaceDetails'>>();
  const navigation = useNavigation<RootStackNavigationProp>();
  const { placeId, placeName } = route.params;
  const { currentLocation } = useLocationStore();

  const [place, setPlace] = useState<Place | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlaceDetails();
  }, [placeId]);

  const fetchPlaceDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get place details from the API
      const placeData = await nearbyPlacesApiService.getPlaceDetails(placeId);
      
      if (placeData) {
        setPlace(placeData);
      } else {
        throw new Error('Place not found');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch place details';
      setError(errorMessage);
      Alert.alert('Error', errorMessage, [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCall = () => {
    if (place?.phoneNumber) {
      Linking.openURL(`tel:${place.phoneNumber}`);
    }
  };

  const handleWebsite = () => {
    if (place?.website) {
      Linking.openURL(place.website);
    }
  };

  const handleDirections = async () => {
    if (!place?.location) {
      Alert.alert('Error', 'Location information not available');
      return;
    }

    const { latitude, longitude } = place.location;
    const placeName = place.name || 'Destination';
    
    try {
      // Platform-specific map app handling
      if (Platform.OS === 'ios') {
        // Try Apple Maps first (iOS)
        const appleMapsUrl = `maps://app?daddr=${latitude},${longitude}&q=${encodeURIComponent(placeName)}`;
        const canOpenAppleMaps = await Linking.canOpenURL(appleMapsUrl);
        
        if (canOpenAppleMaps) {
          await Linking.openURL(appleMapsUrl);
          return;
        }
      } else if (Platform.OS === 'android') {
        // Try Google Maps first (Android)
        const googleMapsUrl = `geo:${latitude},${longitude}?q=${encodeURIComponent(placeName)}`;
        const canOpenGoogleMaps = await Linking.canOpenURL(googleMapsUrl);
        
        if (canOpenGoogleMaps) {
          await Linking.openURL(googleMapsUrl);
          return;
        }
        
        // Fallback to Google Maps app if geo: scheme doesn't work
        const googleMapsAppUrl = `comgooglemaps://?q=${latitude},${longitude}&q=${encodeURIComponent(placeName)}`;
        const canOpenGoogleMapsApp = await Linking.canOpenURL(googleMapsAppUrl);
        
        if (canOpenGoogleMapsApp) {
          await Linking.openURL(googleMapsAppUrl);
          return;
        }
      }
      
      // Universal fallback: Web-based Google Maps
      const webMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&q=${encodeURIComponent(placeName)}`;
      await Linking.openURL(webMapsUrl);
      
    } catch (error) {
      console.error('Failed to open maps:', error);
      
      // Final fallback: Web-based directions
      try {
        const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
        await Linking.openURL(fallbackUrl);
      } catch (fallbackError) {
        console.error('Fallback maps failed:', fallbackError);
        Alert.alert(
          'Navigation Error',
          'Unable to open maps app. Please try opening your preferred navigation app manually.',
          [
            { text: 'OK' },
            { 
              text: 'Copy Coordinates', 
              onPress: () => {
                // You could implement clipboard functionality here
                Alert.alert('Coordinates', `${latitude}, ${longitude}`);
              }
            }
          ]
        );
      }
    }
  };

  const formatPriceLevel = (level?: number): string => {
    if (level === undefined) return 'Not available';
    return '💰'.repeat(level);
  };

  const formatOpeningHours = (hours?: any): string => {
    if (!hours) return 'Hours not available';
    
    if (hours.open_now !== undefined) {
      return hours.open_now ? '🟢 Open Now' : '🔴 Closed';
    }
    
    if (hours.weekday_text && hours.weekday_text.length > 0) {
      return hours.weekday_text.join('\n');
    }
    
    return 'Hours not available';
  };

  const calculateDistance = (placeLocation: Place['location']): string => {
    if (!currentLocation) return 'Distance unknown';
    
    const R = 6371e3; // Earth's radius in meters
    const φ1 = currentLocation.latitude * Math.PI / 180;
    const φ2 = placeLocation.latitude * Math.PI / 180;
    const Δφ = (placeLocation.latitude - currentLocation.latitude) * Math.PI / 180;
    const Δλ = (placeLocation.longitude - currentLocation.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distanceMeters = R * c;
    
    if (distanceMeters < 1000) {
      return `${Math.round(distanceMeters)}m away`;
    }
    return `${(distanceMeters / 1000).toFixed(1)}km away`;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading place details...</Text>
      </View>
    );
  }

  if (error || !place) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {error || 'Failed to load place details'}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchPlaceDetails}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Place Image Section */}
      <View style={styles.imageSection}>
        {place.photos && place.photos.length > 0 ? (
          <Image
            source={{ uri: place.photos[0] }}
            style={styles.placeImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>📸</Text>
            <Text style={styles.placeholderSubtext}>No photo available</Text>
          </View>
        )}
      </View>

      {/* Header Section */}
      <View style={styles.headerSection}>
        <Text style={styles.placeName}>{place.name}</Text>
        <Text style={styles.placeAddress}>{place.address}</Text>
        
        {/* Distance from current location */}
        <View style={styles.distanceContainer}>
          <Text style={styles.distanceText}>
            📍 {calculateDistance(place.location)}
          </Text>
        </View>
        
        {/* Rating and Price Level */}
        <View style={styles.metaRow}>
          {place.rating && (
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingText}>⭐ {place.rating}</Text>
            </View>
          )}
          {place.priceLevel !== undefined && (
            <View style={styles.priceContainer}>
              <Text style={styles.priceText}>{formatPriceLevel(place.priceLevel)}</Text>
            </View>
          )}
        </View>

        {/* Opening Hours */}
        {place.openingHours && (
          <View style={styles.hoursContainer}>
            <Text style={styles.hoursTitle}>🕒 Business Hours</Text>
            <Text style={styles.hoursText}>{formatOpeningHours(place.openingHours)}</Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        <TouchableOpacity style={styles.actionButton} onPress={handleDirections}>
          <Text style={styles.actionButtonText}>🗺️ Get Directions</Text>
        </TouchableOpacity>
        
        {place.phoneNumber && (
          <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
            <Text style={styles.actionButtonText}>📞 Call {place.phoneNumber}</Text>
          </TouchableOpacity>
        )}
        
        {place.website && (
          <TouchableOpacity style={styles.actionButton} onPress={handleWebsite}>
            <Text style={styles.actionButtonText}>🌐 Visit Website</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Place Types */}
      {place.types && place.types.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <View style={styles.typesContainer}>
            {place.types.slice(0, 5).map((type, index) => (
              <View key={index} style={styles.typeTag}>
                <Text style={styles.typeText}>{type}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Reviews Section */}
      {place.reviews && place.reviews.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Reviews</Text>
          {place.reviews.slice(0, 3).map((review: any, index: number) => (
            <View key={index} style={styles.reviewContainer}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewAuthor}>{review.author_name}</Text>
                <Text style={styles.reviewRating}>⭐ {review.rating}</Text>
              </View>
              <Text style={styles.reviewText} numberOfLines={3}>
                {review.text}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Photos Section */}
      {place.photos && place.photos.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <Text style={styles.photoNote}>
            📸 {place.photos.length} photos available
          </Text>
          <Text style={styles.photoNote}>
            Tap "Get Directions" to view in Google Maps
          </Text>
        </View>
      )}
    </ScrollView>
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
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#D32F2F',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  imageSection: {
    height: 200,
    backgroundColor: '#FFFFFF',
  },
  placeImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 48,
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  headerSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 16,
  },
  placeName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  placeAddress: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    lineHeight: 22,
  },
  distanceContainer: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  distanceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingContainer: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 12,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  priceContainer: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  hoursContainer: {
    backgroundColor: '#F8F8F8',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  hoursTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  hoursText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actionSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  typesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeTag: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  typeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  reviewContainer: {
    backgroundColor: '#F8F8F8',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  reviewRating: {
    fontSize: 14,
    color: '#FF9500',
    fontWeight: '600',
  },
  reviewText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  photoNote: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
});
