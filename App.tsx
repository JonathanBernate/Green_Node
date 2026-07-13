import React from 'react';
import { StatusBar } from 'react-native';
import { AppProviders } from '@/main/providers/AppProviders';
import { RootNavigator } from '@/main/navigation/RootNavigator';

function App() {
  return (
    <AppProviders>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <RootNavigator />
    </AppProviders>
  );
}

export default App;
