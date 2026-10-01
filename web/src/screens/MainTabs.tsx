import React, { useState } from 'react';
import { AppStoreProvider } from '../lib/appStore';
import { HomeScreen } from './HomeScreen';
import { ScanTab } from './tabs/ScanTab';
import { MapTab } from './tabs/MapTab';
import { HistoryTab } from './tabs/HistoryTab';
import { EducationTab } from './tabs/EducationTab';
import { ProfileTab } from './tabs/ProfileTab';

interface User {
  id: string;
  name: string;
  email: string;
  points: number;
  level: number;
}

interface Props {
  user: User;
  onLogout: () => void;
}

const TABS = [
  { key: 'home', icon: '🏠', label: 'Inicio' },
  { key: 'scan', icon: '📷', label: 'Escanear' },
  { key: 'map', icon: '🗺️', label: 'Mapa' },
  { key: 'history', icon: '📋', label: 'Historial' },
  { key: 'education', icon: '📚', label: 'Aprende' },
  { key: 'profile', icon: '👤', label: 'Perfil' },
];

export function MainTabs({ user, onLogout }: Props) {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <AppStoreProvider>
      <div className="tabs-page">
        <div className="tabs-content">
          {activeTab === 'home' && (
            <HomeScreen userName={user.name} userLevel={user.level} userPoints={user.points} />
          )}
          {activeTab === 'scan' && <ScanTab />}
          {activeTab === 'map' && <MapTab />}
          {activeTab === 'history' && <HistoryTab />}
          {activeTab === 'education' && <EducationTab />}
          {activeTab === 'profile' && <ProfileTab onLogout={onLogout} />}
        </div>
        <div className="tab-bar">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`tab-item ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </AppStoreProvider>
  );
}
