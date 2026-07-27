import React from 'react';

interface Props {
  userName: string;
  userLevel: number;
  userPoints: number;
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

export function HomeScreen({ userName, userLevel, userPoints }: Props) {
  const levelLabel = getLevelLabel(userLevel);
  const nextLevelPoints = userLevel * 100;
  const progress = Math.min(userPoints / nextLevelPoints, 1) * 100;

  return (
    <div style={{ padding: '20px', maxWidth: 600, margin: '0 auto' }}>
      {/* Greeting */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <p style={{ color: '#757575', margin: 0, fontSize: 14 }}>Bienvenido</p>
          <h2 style={{ margin: '4px 0 0', color: '#212121' }}>{userName.split(' ')[0]}</h2>
        </div>
        <span style={{
          background: '#E8F5E9',
          color: '#1B5E20',
          padding: '4px 12px',
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 600,
          border: '1px solid #C8E6C9',
        }}>
          Nv. {userLevel} · {levelLabel}
        </span>
      </div>

      {/* Points Card */}
      <div style={{
        background: '#fff',
        borderRadius: 12,
        padding: 24,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: 24,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ color: '#757575', margin: 0, fontSize: 12 }}>Tus puntos</p>
            <p style={{ fontSize: 40, fontWeight: 700, color: '#2E7D32', margin: '4px 0 0' }}>{userPoints}</p>
          </div>
          <div style={{
            width: 56, height: 56, borderRadius: 28,
            background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28,
          }}>
            🏆
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <div style={{ height: 8, background: '#EEEEEE', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: '#2E7D32', borderRadius: 999 }} />
          </div>
          <p style={{ color: '#757575', fontSize: 12, margin: '8px 0 0' }}>
            {userPoints} / {nextLevelPoints} puntos para nivel {userLevel + 1}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <h3 style={{ marginBottom: 12 }}>Acciones rápidas</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        {[
          { icon: '📷', label: 'Escanear', bg: '#E8F5E9' },
          { icon: '🗺️', label: 'Mapa', bg: '#E3F2FD' },
          { icon: '📋', label: 'Historial', bg: '#FFF3E0' },
          { icon: '📚', label: 'Aprender', bg: '#E8F5E9' },
        ].map((action) => (
          <div key={action.label} style={{
            background: action.bg,
            borderRadius: 12,
            padding: '20px 0',
            textAlign: 'center',
            cursor: 'pointer',
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{action.icon}</div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{action.label}</p>
          </div>
        ))}
      </div>

      {/* Eco Tip */}
      <div style={{
        border: '1px solid #E0E0E0',
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 22 }}>💡</span>
          <h3 style={{ margin: 0 }}>Dato del día</h3>
        </div>
        <p style={{ color: '#424242', margin: 0, lineHeight: 1.6 }}>
          ¿Sabías que reciclar una lata de aluminio ahorra suficiente energía
          para encender un televisor por 3 horas? ¡Cada depósito cuenta!
        </p>
      </div>

      {/* Summary */}
      <h3 style={{ marginBottom: 12 }}>Tu resumen</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {[
          { icon: '♻️', value: 0, label: 'Clasificaciones' },
          { icon: '📦', value: 0, label: 'Depósitos' },
          { icon: '🔥', value: 0, label: 'Racha días' },
        ].map((stat) => (
          <div key={stat.label} style={{
            border: '1px solid #E0E0E0',
            borderRadius: 12,
            padding: '20px 0',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{stat.icon}</div>
            <p style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>{stat.value}</p>
            <p style={{ color: '#757575', fontSize: 12, margin: 0 }}>{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
