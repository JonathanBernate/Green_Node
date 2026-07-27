import React, { useState } from 'react';
import { HomeScreen } from './HomeScreen';

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

function ProfileView({ user, onLogout }: { user: User; onLogout: () => void }) {
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div style={{ padding: 20, maxWidth: 400, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{
          width: 80, height: 80, borderRadius: 40,
          background: '#C8E6C9', border: '3px solid #81C784',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, fontWeight: 700, color: '#1B5E20', margin: '0 auto',
        }}>
          {initials}
        </div>
        <h2 style={{ margin: '12px 0 4px' }}>{user.name}</h2>
        <p style={{ color: '#757575', margin: 0 }}>{user.email}</p>
      </div>
      <button
        onClick={onLogout}
        style={{
          width: '100%', padding: '12px 0', borderRadius: 12,
          border: '1.5px solid #2E7D32', background: 'transparent',
          color: '#2E7D32', fontWeight: 600, fontSize: 16, cursor: 'pointer',
        }}
      >
        Cerrar Sesión
      </button>
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
        return <ProfileView user={user} onLogout={onLogout} />;
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
