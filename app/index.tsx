import React from 'react';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from '../package.json';

AppRegistry.registerComponent(appName, () => App);

export default App;
