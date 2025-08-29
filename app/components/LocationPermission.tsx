import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Card, Button } from './index';
import { useLocationStore } from '../store/locationStore';
import { LocationPermission } from '../types/location';

export const LocationPermissionComponent: React.FC<{
  onPermissionChoice?: () => void;
}> = ({ onPermissionChoice }) => {
  const { 
    permissionStatus, 
    isLoading, 
    requestLocationPermission,
    currentLocation,
    getCurrentLocation,
    startLocationWatching,
    setUseDefaultLocation,
    useDefaultLocation,
    clearPermissionStatus
  } = useLocationStore();

  const [hasMadeChoice, setHasMadeChoice] = useState(false);

  const handleRequestPermission = async () => {
    try {
      await requestLocationPermission();
      // After permission is granted, user still needs to make a choice
      setHasMadeChoice(false);
    } catch (error) {
      Alert.alert(
        'Location Permission',
        'Unable to request location permission. Please enable it in your device settings.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleUseLiveLocation = async () => {
    try {
      await getCurrentLocation();
      startLocationWatching();
      setUseDefaultLocation(false);
      setHasMadeChoice(true);
      onPermissionChoice?.();
    } catch (error) {
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please check your location settings.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleUseDefaultLocation = () => {
    setUseDefaultLocation(true);
    setHasMadeChoice(true);
    onPermissionChoice?.();
  };

  const handleSettingsPress = () => {
    Alert.alert(
      'Location Permission Required',
      'Please enable location access in your device settings to use this feature.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => {
          // In a real app, you'd open device settings here
          console.log('Open device settings');
        }},
      ]
    );
  };

  // If user has made a choice and we have either live location or default location set, don't show this component
  if (hasMadeChoice && (currentLocation || useDefaultLocation)) {
    return null;
  }

  // If permission is granted but user hasn't made a choice yet, show choice options
  if (permissionStatus?.status === 'granted' && !hasMadeChoice) {
    return (
      <View style={styles.wrapper}>
        <Card style={styles.container}>
          <Text style={styles.title}>Choose Location Source</Text>
          <Text style={styles.message}>
            How would you like to proceed?
          </Text>
          <View style={styles.buttonContainer}>
            <Button 
              title="Use My Current Location" 
              onPress={handleUseLiveLocation}
              style={[styles.button, styles.primaryButton]}
              disabled={isLoading}
            />
            <Button 
              title="Use Default Location" 
              variant="outline"
              onPress={handleUseDefaultLocation}
              style={styles.button}
              disabled={isLoading}
            />
          </View>
          {isLoading && (
            <Text style={styles.loadingText}>Getting your location...</Text>
          )}
        </Card>
      </View>
    );
  }

  // If permission is denied and can't ask again, show settings message
  if (permissionStatus?.status === 'never_ask_again') {
    return (
      <View style={styles.wrapper}>
        <Card style={styles.container}>
          <Text style={styles.title}>Location Access Required</Text>
          <Text style={styles.message}>
            This app needs access to your location to show nearby places. 
            Please enable location access in your device settings.
          </Text>
          <Button 
            title="Open Settings" 
            onPress={handleSettingsPress}
            style={styles.button}
          />
        </Card>
      </View>
    );
  }

  // If permission is denied but can ask again, show permission request
  if (permissionStatus?.status === 'denied') {
    return (
      <View style={styles.wrapper}>
        <Card style={styles.container}>
          <Text style={styles.title}>Location Permission</Text>
          <Text style={styles.message}>
            This app needs access to your location to show nearby places. 
            We'll use San Francisco as a default location if you deny access.
          </Text>
          <View style={styles.buttonContainer}>
            <Button 
              title="Allow Location" 
              onPress={handleRequestPermission}
              style={[styles.button, styles.primaryButton]}
              disabled={isLoading}
            />
            <Button 
              title="Use Default Location" 
              variant="outline"
              onPress={handleUseDefaultLocation}
              style={styles.button}
              disabled={isLoading}
            />
          </View>
        </Card>
      </View>
    );
  }

  // Initial state - show permission request
  if (!permissionStatus) {
    return (
      <View style={styles.wrapper}>
        <Card style={styles.container}>
          <Text style={styles.title}>Welcome to Nearby Places!</Text>
          <Text style={styles.message}>
            To show you nearby places, we need access to your location. 
            This helps us provide accurate results for your area.
          </Text>
          <View style={styles.buttonContainer}>
            <Button 
              title="Allow Location Access" 
              onPress={handleRequestPermission}
              style={[styles.button, styles.primaryButton]}
              disabled={isLoading}
            />
            <Button 
              title="Use Default Location" 
              variant="outline"
              onPress={handleUseDefaultLocation}
              style={styles.button}
              disabled={isLoading}
            />
          </View>
          {isLoading && (
            <Text style={styles.loadingText}>Requesting permission...</Text>
          )}
        </Card>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  loadingText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
});
