import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { Card, Button } from './index';
import { Place, SUPPORTED_PLACE_TYPES, PLACE_TYPE_CONFIG, SupportedPlaceType } from '../types/location';
import { useLocationStore } from '../store/locationStore';

interface PlacesListProps {
  places: Place[];
  onPlacePress?: (place: Place) => void;
  onRefresh?: () => void;
  externalSelectedType?: SupportedPlaceType | 'all';
  onTypeChange?: (type: SupportedPlaceType | 'all') => void;
  onCategoryPlacesFiltered?: (filteredPlaces: Place[], category: SupportedPlaceType | 'all') => void;
}

export const PlacesListComponent: React.FC<PlacesListProps> = ({
  places,
  onPlacePress,
  onRefresh,
  externalSelectedType,
  onTypeChange,
  onCategoryPlacesFiltered,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [internalSelectedType, setInternalSelectedType] = useState<SupportedPlaceType | 'all'>('all');
  const { fetchNearbyPlaces, fetchAllNearbyPlaces, isLoading } = useLocationStore();

  // Use external selected type if provided, otherwise use internal state
  const selectedType = externalSelectedType !== undefined ? externalSelectedType : internalSelectedType;

  // Sync internal state when external type changes
  useEffect(() => {
    if (externalSelectedType !== undefined) {
      setInternalSelectedType(externalSelectedType);
    }
  }, [externalSelectedType]);

  // Define a type for place type buttons that includes 'all'
  type PlaceTypeButton = {
    key: SupportedPlaceType | 'all';
    label: string;
    icon: string;
    color: string;
  };

  // Filter to only show supported place types
  const placeTypes: PlaceTypeButton[] = [
    { key: 'all', label: 'All Places', icon: '📍', color: '#007AFF' },
    ...SUPPORTED_PLACE_TYPES.slice(0, 12).map(type => ({
      key: type,
      label: PLACE_TYPE_CONFIG[type].label,
      icon: PLACE_TYPE_CONFIG[type].icon,
      color: PLACE_TYPE_CONFIG[type].color,
    }))
  ];

  // Filter places by selected category
  const getFilteredPlacesByCategory = (category: SupportedPlaceType | 'all'): Place[] => {
    if (category === 'all') {
      return places; // Return all places for "All Places" tab
    }
    
    // Filter places by the selected category
    return places.filter(place => 
      place.types && place.types.includes(category)
    );
  };

  // Filter and sort places by distance (closest first)
  const filteredAndSortedPlaces = useMemo(() => {
    // First filter by selected category
    let filtered = getFilteredPlacesByCategory(selectedType);
    
    // Then filter by search query
    filtered = filtered.filter(place =>
      place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.address.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort by distance (closest first), places without distance go to the end
    filtered.sort((a, b) => {
      if (a.distance === undefined && b.distance === undefined) return 0;
      if (a.distance === undefined) return 1;
      if (b.distance === undefined) return -1;
      return a.distance - b.distance;
    });

    return filtered;
  }, [places, searchQuery, selectedType]);

  const handleTypeChange = async (type: SupportedPlaceType | 'all') => {
    console.log(`Switching to type: ${type}`);
    
    // Update internal state if no external control
    if (externalSelectedType === undefined) {
      setInternalSelectedType(type);
    }
    
    // Call external handler if provided
    if (onTypeChange) {
      onTypeChange(type);
    }
    
    // IMPORTANT: Never change location when switching tabs
    // The fetch functions will use whatever currentLocation is set in the store
    // This ensures that if user is using live GPS, it stays at live GPS
    // If user is using default location, it stays at default location
    
    if (type === 'all') {
      // For "All Places" tab:
      // - If user is on DEFAULT LOCATION: Always fetch fresh data (user expects to see all places)
      // - If user is on LIVE GPS: Only fetch if no data exists (preserve current behavior)
      const { useDefaultLocation } = useLocationStore.getState();
      
      if (useDefaultLocation) {
        // DEFAULT LOCATION: Always fetch fresh data for "All Places"
        // This ensures users see all available places in San Francisco
        console.log('Default location mode: Fetching fresh data for All Places tab');
        await fetchAllNearbyPlaces();
      } else if (places.length === 0) {
        // LIVE GPS: Only fetch if no data exists
        console.log('Live GPS mode: No existing data, fetching all nearby places');
        await fetchAllNearbyPlaces();
      } else {
        // LIVE GPS: Data exists, just switch view without fetching
        console.log('Live GPS mode: Using existing data for All Places view');
      }
    } else {
      // For specific categories, fetch places for that type only
      console.log(`Fetching places for category: ${type}`);
      await fetchNearbyPlaces(type);
    }

    // Notify parent component about filtered places for map markers
    if (onCategoryPlacesFiltered) {
      const filteredPlaces = getFilteredPlacesByCategory(type);
      console.log(`Filtering places for category ${type}: ${filteredPlaces.length} places found`);
      onCategoryPlacesFiltered(filteredPlaces, type);
    }
  };

  const handlePlacePress = (place: Place) => {
    if (onPlacePress) {
      onPlacePress(place);
    }
  };

  const formatDistance = (distance?: number): string => {
    if (distance === undefined) return 'Unknown';
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    }
    return `${(distance / 1000).toFixed(1)}km`;
  };

  const getPlaceTypeLabel = (place: Place): string => {
    if (place.types && place.types.length > 0) {
      const supportedType = place.types.find(type => 
        SUPPORTED_PLACE_TYPES.includes(type as SupportedPlaceType)
      ) as SupportedPlaceType;
      
      if (supportedType && PLACE_TYPE_CONFIG[supportedType]) {
        return PLACE_TYPE_CONFIG[supportedType].label;
      }
      return place.types[0]; // Fallback to first type
    }
    return 'Unknown Type';
  };

  const renderPlaceItem = ({ item }: { item: Place }) => (
    <TouchableOpacity onPress={() => handlePlacePress(item)} activeOpacity={0.7}>
      <View style={styles.placeItem}>
        {/* Main content */}
        <View style={styles.placeContent}>
          <Text style={styles.placeName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.placeType} numberOfLines={1}>
            {getPlaceTypeLabel(item)}
          </Text>
        </View>

        {/* Right side info */}
        <View style={styles.placeInfo}>
          <Text style={styles.distanceText}>
            {formatDistance(item.distance)}
          </Text>
          {item.rating && (
            <Text style={styles.ratingText}>
              ⭐ {item.rating}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderTypeButton = ({ item }: { item: PlaceTypeButton }) => (
    <TouchableOpacity
      style={[
        styles.typeButton,
        selectedType === item.key && styles.selectedTypeButton
      ]}
      onPress={() => handleTypeChange(item.key)}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.typeButtonText,
        selectedType === item.key && styles.selectedTypeButtonText
      ]}>
        {item.icon} {item.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search places..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      {/* Place Type Filter */}
      <View style={styles.typeFilterContainer}>
        <FlatList
          data={placeTypes}
          renderItem={renderTypeButton}
          keyExtractor={(item) => item.key.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.typeFilterList}
        />
      </View>

      {/* Places List */}
      <FlatList
        data={filteredAndSortedPlaces}
        renderItem={renderPlaceItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.placesList}
        showsVerticalScrollIndicator={true}
        refreshing={isLoading}
        onRefresh={onRefresh}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={true}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No places found matching your search.' : 'No places found nearby.'}
            </Text>
            {!searchQuery && (
              <Button
                title="Refresh"
                onPress={onRefresh}
                style={styles.refreshButton}
              />
            )}
          </View>
        }
        ListHeaderComponent={
          filteredAndSortedPlaces.length > 0 ? (
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderText}>
                {filteredAndSortedPlaces.length} places found
                {selectedType !== 'all' && ` in ${PLACE_TYPE_CONFIG[selectedType as SupportedPlaceType]?.label || selectedType}`}
                {searchQuery && ` matching "${searchQuery}"`}
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#F8F8F8',
  },
  typeFilterContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  typeFilterList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
  },
  selectedTypeButton: {
    backgroundColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedTypeButtonText: {
    color: '#FFFFFF',
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F8F8',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  listHeaderText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  placesList: {
    padding: 0,
  },
  placeItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    alignItems: 'center',
  },
  placeContent: {
    flex: 1,
    marginRight: 12,
  },
  placeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  placeType: {
    fontSize: 14,
    color: '#666',
  },
  placeInfo: {
    alignItems: 'flex-end',
  },
  distanceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#FF9500',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
  refreshButton: {
    minWidth: 120,
  },
});
