import React from 'react';

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

const LEVEL_LABELS: Record<number, string> = {
  1: 'Principiante',
  2: 'Explorador',
  3: 'Eco-Warrior',
  4: 'Guardián Verde',
  5: 'Maestro Reciclador',
};

function getLevelLabel(level: number): string {
  if (level >= 5) return LEVEL_LABELS[5];
  return LEVEL_LABELS[level] ?? LEVEL_LABELS[1];
}

export function ProfileScreen({ user, onLogout }: Props) {
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const levelLabel = getLevelLabel(user.level);
  const nextLevelPoints = user.level * 100;
  const progress = Math.min(user.points / nextLevelPoints, 1) * 100;

  const menuItems = [
    { icon: '🏆', label: 'Gamificación', desc: 'Puntos, insignias y logros' },
    { icon: '📊', label: 'Ranking', desc: 'Tabla de posiciones por zona' },
    { icon: '💬', label: 'Chat de ayuda', desc: 'Asistente virtual' },
    { icon: '✏️', label: 'Editar perfil', desc: 'Nombre, correo y contraseña' },
    { icon: '🔔', label: 'Notificaciones', desc: 'Configurar alertas' },
    { icon: '⚙️', label: 'Configuración', desc: 'Tema, idioma y más' },
  ];

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header">
        <div className="profile-header-bg" />
        <div className="profile-avatar-wrapper">
          <div className="profile-avatar">
            <span className="profile-avatar-text">{initials}</span>
          </div>
        </div>
        <h2 className="profile-name">{user.name}</h2>
        <p className="profile-email">{user.email}</p>
        <div className="profile-level-badge">
          Nv. {user.level} · {levelLabel}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="profile-stats-grid">
        <div className="profile-stat-card">
          <span className="profile-stat-icon">🏆</span>
          <span className="profile-stat-value">{user.points}</span>
          <span className="profile-stat-label">Puntos</span>
        </div>
        <div className="profile-stat-card">
          <span className="profile-stat-icon">⭐</span>
          <span className="profile-stat-value">{user.level}</span>
          <span className="profile-stat-label">Nivel</span>
        </div>
        <div className="profile-stat-card">
          <span className="profile-stat-icon">♻️</span>
          <span className="profile-stat-value">0</span>
          <span className="profile-stat-label">Clasificaciones</span>
        </div>
        <div className="profile-stat-card">
          <span className="profile-stat-icon">📦</span>
          <span className="profile-stat-value">0</span>
          <span className="profile-stat-label">Depósitos</span>
        </div>
      </div>

      {/* Level Progress */}
      <div className="profile-card">
        <div className="profile-card-header">
          <span className="profile-card-icon">📈</span>
          <span className="profile-card-title">Progreso del nivel</span>
        </div>
        <div className="profile-progress-bar">
          <div className="profile-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <p className="profile-progress-text">
          {user.points} / {nextLevelPoints} puntos para nivel {user.level + 1}
        </p>
      </div>

      {/* Menu */}
      <div className="profile-menu">
        {menuItems.map((item) => (
          <button key={item.label} className="profile-menu-item">
            <span className="profile-menu-icon">{item.icon}</span>
            <div className="profile-menu-text">
              <span className="profile-menu-label">{item.label}</span>
              <span className="profile-menu-desc">{item.desc}</span>
            </div>
            <span className="profile-menu-arrow">›</span>
          </button>
        ))}
      </div>

      {/* Logout */}
      <button className="profile-logout-btn" onClick={onLogout}>
        Cerrar Sesión
      </button>

      <p className="profile-version">GreenNode v1.0.0</p>
    </div>
  );
}
