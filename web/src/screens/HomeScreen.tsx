import React from 'react';
import { useAppStore } from '../lib/appStore';
import { Icon } from '../components/Icon';

interface Props {
  userName: string;
  userLevel: number;
  userPoints: number;
  onNavigate: (tab: string) => void;
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

const ACTIONS = [
  { key: 'scan', icon: 'scan', label: 'Escanear', hint: 'Clasifica un residuo', tone: 'green' },
  { key: 'map', icon: 'map', label: 'Mapa', hint: 'Contenedores cercanos', tone: 'blue' },
  { key: 'history', icon: 'history', label: 'Historial', hint: 'Tus clasificaciones', tone: 'orange' },
  { key: 'education', icon: 'book', label: 'Aprender', hint: 'Micro-lecciones', tone: 'purple' },
];

export function HomeScreen({ userName, userLevel, userPoints, onNavigate }: Props) {
  const { history } = useAppStore();
  const levelLabel = getLevelLabel(userLevel);
  const nextLevelPoints = userLevel * 100;
  const progress = Math.min(userPoints / nextLevelPoints, 1) * 100;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

  const stats = [
    { icon: 'recycle', value: history.length, label: 'Clasificaciones' },
    { icon: 'box', value: 0, label: 'Depósitos' },
    { icon: 'flame', value: 0, label: 'Racha días' },
  ];

  return (
    <div className="screen wide home">
      <header className="home-greeting">
        <div>
          <p className="home-hello">{greeting}</p>
          <h2 className="home-name">{userName.split(' ')[0]}</h2>
        </div>
        <span className="level-chip">
          Nv. {userLevel} · {levelLabel}
        </span>
      </header>

      <section className="hero-card">
        <div className="hero-top">
          <div>
            <p className="hero-label">Tus puntos</p>
            <p className="hero-points">{userPoints}</p>
          </div>
          <div className="hero-trophy"><Icon name="trophy" size={28} /></div>
        </div>
        <div className="hero-track">
          <div className="hero-fill" style={{ width: `${progress}%` }} />
        </div>
        <p className="hero-next">
          {userPoints} / {nextLevelPoints} puntos para el nivel {userLevel + 1}
        </p>
      </section>

      <section className="home-actions">
      <h3 className="section-title">Acciones rápidas</h3>
      <div className="action-grid">
        {ACTIONS.map((a) => (
          <button key={a.key} className={`action-card tone-${a.tone}`} onClick={() => onNavigate(a.key)}>
            <span className="action-icon"><Icon name={a.icon} size={22} /></span>
            <span className="action-label">{a.label}</span>
            <span className="action-hint">{a.hint}</span>
          </button>
        ))}
      </div>
      </section>

      <section className="tip-card">
        <span className="tip-icon"><Icon name="bulb" size={22} /></span>
        <div>
          <h3 className="tip-title">Dato del día</h3>
          <p className="tip-text">
            ¿Sabías que reciclar una lata de aluminio ahorra suficiente energía para encender un
            televisor por 3 horas? ¡Cada depósito cuenta!
          </p>
        </div>
      </section>

      <section className="home-summary">
      <h3 className="section-title">Tu resumen</h3>
      <div className="summary-grid">
        {stats.map((s) => (
          <div key={s.label} className="summary-card">
            <span className="summary-icon"><Icon name={s.icon} size={20} /></span>
            <span className="summary-value">{s.value}</span>
            <span className="summary-label">{s.label}</span>
          </div>
        ))}
      </div>
      </section>
    </div>
  );
}
