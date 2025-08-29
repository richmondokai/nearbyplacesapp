import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { AppNavigator } from './navigation/AppNavigator';

function App(): JSX.Element {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <AppNavigator />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});

export default App;

