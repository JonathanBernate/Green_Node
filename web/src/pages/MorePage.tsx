import { Link } from 'react-router-dom';
import { useAuth } from '../app/AuthProvider';
import { Icon } from '../components/Icon';
import { NAV_GROUPS, NAV_ITEMS } from '../components/layout/nav';

const TONES: Record<string, string> = { Comunidad: 'tone-green', Sistema: 'tone-blue' };

/** Menú "Más" (móvil): accesos a las secciones que no caben en la barra inferior. */
export function MorePage() {
  const { user } = useAuth();
  return (
    <div className="screen">
      <header className="screen-header">
        <h2>Más opciones</h2>
        <p className="screen-subtitle">Todas las secciones de GreenNode</p>
      </header>

      <Link to="/settings" className="more-profile">
        <span className="avatar">{(user?.name ?? '?').trim().charAt(0).toUpperCase()}</span>
        <span className="more-profile-text">
          <b>{user?.name}</b>
          <small>Nivel {user?.level} · {user?.points} pts</small>
        </span>
        <Icon name="chevron" size={18} />
      </Link>

      {NAV_GROUPS.map((group) => {
        const items = NAV_ITEMS.filter((n) => !n.primary && n.group === group);
        if (items.length === 0) return null;
        return (
          <section key={group} className="more-section">
            <h3 className="more-heading">{group}</h3>
            <ul className="more-grid">
              {items.map((n) => (
                <li key={n.to}>
                  <Link to={n.to} className={`more-tile ${TONES[group] ?? ''}`}>
                    <span className="more-icon"><Icon name={n.icon} size={22} /></span>
                    <b>{n.label}</b>
                    <small>{n.desc}</small>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
