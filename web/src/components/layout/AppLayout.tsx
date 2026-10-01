import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useConnectionStatus } from '../../hooks/useData';
import { config } from '../../config/env';
import { ConnectionBadge } from '../common/ConnectionBadge';
import { DataSourceTag } from '../common/DataSourceTag';
import { Icon } from '../Icon';
import { NAV_ITEMS } from './nav';

export function AppLayout() {
  const status = useConnectionStatus();
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
        {NAV_ITEMS.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === '/'}
            className={({ isActive }) =>
              `tab-item ${isActive ? 'active' : ''} ${n.primary ? '' : 'secondary'}`
            }
          >
            <Icon name={n.icon} size={22} />
            <span className="tab-label">{n.label}</span>
          </NavLink>
        ))}
        <NavLink to="/more" className={`tab-item more-tab ${secondaryActive ? 'active' : ''}`}>
          <Icon name="grid" size={22} />
          <span className="tab-label">Más</span>
        </NavLink>
      </nav>
    </div>
  );
}
