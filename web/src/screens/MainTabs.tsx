import React, { useState } from 'react';
import { AppStoreProvider } from '../lib/appStore';
import { HomeScreen } from './HomeScreen';
import { ScanTab } from './tabs/ScanTab';
import { MapTab } from './tabs/MapTab';
import { HistoryTab } from './tabs/HistoryTab';
import { EducationTab } from './tabs/EducationTab';
import { ProfileTab } from './tabs/ProfileTab';
import { Icon } from '../components/Icon';

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
  { key: 'home', icon: 'home', label: 'Inicio' },
  { key: 'scan', icon: 'scan', label: 'Escanear' },
  { key: 'map', icon: 'map', label: 'Mapa' },
  { key: 'history', icon: 'history', label: 'Historial' },
  { key: 'education', icon: 'book', label: 'Aprende' },
  { key: 'profile', icon: 'user', label: 'Perfil' },
];

export function MainTabs({ user, onLogout }: Props) {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <AppStoreProvider>
      <div className="tabs-page">
        <div className="tabs-content" key={activeTab}>
          {activeTab === 'home' && (
            <HomeScreen
              userName={user.name}
              userLevel={user.level}
              userPoints={user.points}
              onNavigate={setActiveTab}
            />
          )}
          {activeTab === 'scan' && <ScanTab />}
          {activeTab === 'map' && <MapTab />}
          {activeTab === 'history' && <HistoryTab />}
          {activeTab === 'education' && <EducationTab />}
          {activeTab === 'profile' && <ProfileTab user={user} onLogout={onLogout} />}
        </div>
        <nav className="tab-bar">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`tab-item ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <Icon name={tab.icon} size={22} />
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </AppStoreProvider>
  );
}
