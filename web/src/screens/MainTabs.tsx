import React, { useState } from 'react';
import { HomeScreen } from './HomeScreen';
import { ProfileScreen } from './ProfileScreen';

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
  { key: 'profile', icon: '👤', label: 'Perfil' },
];

function ScanView() {
  return (
    <div style={{ padding: 20, textAlign: 'center', paddingTop: 60 }}>
      <p style={{ fontSize: 48 }}>📷</p>
      <h2>Escanear</h2>
      <p style={{ color: '#757575' }}>Apunta la cámara a un residuo para clasificarlo</p>
    </div>
  );
}

function MapView() {
  return (
    <div style={{ padding: 20, textAlign: 'center', paddingTop: 60 }}>
      <p style={{ fontSize: 48 }}>🗺️</p>
      <h2>Mapa</h2>
      <p style={{ color: '#757575' }}>Encuentra contenedores cercanos</p>
    </div>
  );
}

function HistoryView() {
  return (
    <div style={{ padding: 20, textAlign: 'center', paddingTop: 60 }}>
      <p style={{ fontSize: 48 }}>📋</p>
      <h2>Historial</h2>
      <p style={{ color: '#757575' }}>Tu historial de depósitos aparecerá aquí</p>
    </div>
  );
}

export function MainTabs({ user, onLogout }: Props) {
  const [activeTab, setActiveTab] = useState('home');

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen userName={user.name} userLevel={user.level} userPoints={user.points} />;
      case 'scan':
        return <ScanView />;
      case 'map':
        return <MapView />;
      case 'history':
        return <HistoryView />;
      case 'profile':
        return <ProfileScreen user={user} onLogout={onLogout} />;
      default:
        return null;
    }
  };

  return (
    <div className="tabs-page">
      <div className="tabs-content">
        {renderContent()}
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
  );
}
