import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AppNavigator } from './app/navigation/AppNavigator';

// Suppress specific warnings for cleaner development experience
LogBox.ignoreLogs([
  'new NativeEventEmitter() was called with a non-null argument without the required `removeListeners` method',
  'new NativeEventEmitter() was called with a non-null argument without the required `addListener` method',
  // Suppress location-related warnings
  'Location mismatch detected',
  'Location permission',
  // Suppress additional React Native warnings
  'AsyncStorage has been extracted',
  'ViewPropTypes will be removed',
  'ColorPropType will be removed',
  'ImagePropType will be removed',
  'TextPropTypes will be removed',
  'ViewPropTypes will be removed',
  'StyleSheetPropType will be removed',
  'Deprecated',
  'Warning',
  'WARN',
]);

// Completely disable all warnings in production
if (!__DEV__) {
  LogBox.ignoreAllLogs();
}

// Suppress console warnings in development
if (__DEV__) {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    const message = args[0];
    if (typeof message === 'string') {
      // Suppress specific warning messages
      if (message.includes('Location mismatch detected') ||
          message.includes('NativeEventEmitter') ||
          message.includes('removeListeners') ||
          message.includes('addListener')) {
        return; // Don't show these warnings
      }
    }
    // Show other warnings normally
    originalWarn.apply(console, args);
  };
}

const App: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});

export default App;
