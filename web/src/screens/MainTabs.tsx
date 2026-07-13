import React, { useState } from 'react';

interface Props {
  onLogout: () => void;
}

const TABS = [
  { key: 'scan', icon: '📷', label: 'Escanear' },
  { key: 'map', icon: '🗺️', label: 'Mapa' },
  { key: 'history', icon: '📋', label: 'Historial' },
  { key: 'education', icon: '📚', label: 'Aprender' },
  { key: 'profile', icon: '👤', label: 'Perfil' },
];

export function MainTabs({ onLogout }: Props) {
  const [activeTab, setActiveTab] = useState('scan');
  const active = TABS.find((t) => t.key === activeTab);

  return (
    <div className="tabs-page">
      <div className="tabs-content">
        <h2>{active?.icon} {active?.label}</h2>
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
