import React, { useState, useEffect } from 'react';
import { LoginScreen } from './screens/LoginScreen';
import { MainTabs } from './screens/MainTabs';

interface User {
  id: string;
  name: string;
  email: string;
  points: number;
  level: number;
}

export function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('auth_user');
    const savedToken = localStorage.getItem('auth_token');
    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_token');
      }
    }
  }, []);

  const handleLogin = (userData: User, _token: string) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  if (user) {
    return <MainTabs user={user} onLogout={handleLogout} />;
  }

  return <LoginScreen onLogin={handleLogin} />;
}
