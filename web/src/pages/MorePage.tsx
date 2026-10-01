import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { NAV_ITEMS } from '../components/layout/nav';

/** Menú "Más" (móvil): accesos a las secciones que no caben en la barra inferior. */
export function MorePage() {
  return (
    <div className="screen">
      <header className="screen-header">
        <h2>Más opciones</h2>
        <p className="screen-subtitle">Todas las secciones de GreenNode</p>
      </header>
      <ul className="more-list">
        {NAV_ITEMS.filter((n) => !n.primary).map((n) => (
          <li key={n.to}>
            <Link to={n.to} className="more-item">
              <span className="more-icon"><Icon name={n.icon} size={22} /></span>
              <span className="more-text">
                <b>{n.label}</b>
                <small>{n.desc}</small>
              </span>
              <Icon name="chevron" size={18} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
