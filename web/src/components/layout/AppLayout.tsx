import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../app/AuthProvider';
import { useConnectionStatus } from '../../hooks/useData';
import { config } from '../../config/env';
import { ConnectionBadge } from '../common/ConnectionBadge';
import { DataSourceTag } from '../common/DataSourceTag';
import { Avatar } from '../common/Avatar';
import { Icon } from '../Icon';
import { NAV_ITEMS } from './nav';

export function AppLayout() {
  const status = useConnectionStatus();
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const primary = NAV_ITEMS.filter((n) => n.primary);
  const secondaryActive = !primary.some((n) => (n.to === '/' ? pathname === '/' : pathname.startsWith(n.to)));

  return (
    <div className="tabs-page">
      <div className="tabs-content" key={pathname}>
        <div className="status-bar" aria-label="Estado del sistema">
          <ConnectionBadge status={status} />
          {config.useMockData && <DataSourceTag source="SIMULATION" />}
        </div>
        <main id="contenido">
          <Outlet />
        </main>
      </div>

      <nav className="tab-bar" aria-label="Navegación principal">
        <div className="nav-brand" aria-hidden="true">
          <span className="nav-logo"><Icon name="leaf" size={22} stroke={2.2} /></span>
          <span className="nav-name">GreenNode</span>
        </div>

        {NAV_ITEMS.map((n, i) => (
          <div key={n.to} className="nav-entry">
            {NAV_ITEMS[i - 1]?.group !== n.group && <span className="nav-group">{n.group}</span>}
            <NavLink
              to={n.to}
              end={n.to === '/'}
              title={n.desc}
              className={({ isActive }) => `tab-item ${isActive ? 'active' : ''} ${n.primary ? '' : 'secondary'}`}
            >
              <Icon name={n.icon} size={22} />
              <span className="tab-label">{n.label}</span>
            </NavLink>
          </div>
        ))}

        <NavLink to="/more" className={`tab-item more-tab ${secondaryActive ? 'active' : ''}`}>
          <Icon name="grid" size={22} />
          <span className="tab-label">Más</span>
        </NavLink>

        <div className="nav-user">
          <NavLink to="/settings" className="nav-user-link" title="Ajustes de cuenta">
            <Avatar user={user} className="sm" />
            <span className="nav-user-text">
              <b>{user?.name}</b>
              <small>Nivel {user?.level} · {user?.points} pts</small>
            </span>
          </NavLink>
          <button type="button" className="nav-logout" onClick={logout} aria-label="Cerrar sesión" title="Cerrar sesión">
            <Icon name="logout" size={18} />
          </button>
        </div>
      </nav>
    </div>
  );
}
