import React, { useState } from 'react';
import { LoginScreen } from './screens/LoginScreen';
import { MainTabs } from './screens/MainTabs';

export function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if (isLoggedIn) {
    return <MainTabs onLogout={() => setIsLoggedIn(false)} />;
  }

  return <LoginScreen onLogin={() => setIsLoggedIn(true)} />;
}
