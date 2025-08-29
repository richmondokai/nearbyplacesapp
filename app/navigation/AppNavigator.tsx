import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NearbyPlacesScreen } from '../screens/NearbyPlacesScreen';
import { PlaceDetailsScreen } from '../screens/PlaceDetailsScreen';
import { RootStackParamList } from './types';

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="NearbyPlaces"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="NearbyPlaces"
        component={NearbyPlacesScreen}
        options={{
          title: 'Nearby Places',
          headerShown: false, // Hide header for main screen
        }}
      />
      <Stack.Screen
        name="PlaceDetails"
        component={PlaceDetailsScreen}
        options={({ route }) => ({
          title: route.params.placeName,
          headerBackTitle: 'Back',
        })}
      />
    </Stack.Navigator>
  );
};
