import { Outlet } from 'react-router-dom';
import { useAuth } from '../../app/AuthProvider';
import { useLocationReporter, type ReporterStatus } from '../../hooks/useLocationReporter';
import { formatAgo } from '../../utils/status';
import { Icon } from '../Icon';

const STATUS_LABEL: Record<ReporterStatus, string> = {
  starting: 'Obteniendo ubicación…',
  active: 'Ubicación en línea',
  denied: 'Permiso denegado',
  unsupported: 'Sin geolocalización',
  error: 'Error de envío',
};

/** Interfaz del contenedor inteligente: solo clasificación + estado del envío de ubicación. */
export function ContainerKioskLayout() {
  const { user, logout } = useAuth();
  const containerId = user?.container?.id;
  const loc = useLocationReporter(containerId);
  const ok = loc.status === 'active';

  return (
    <div className="kiosk">
      <header className="kiosk-bar">
        <span className="nav-logo"><Icon name="leaf" size={22} stroke={2.2} /></span>
        <div className="kiosk-id">
          <b>{user?.container?.name ?? 'Contenedor sin asignar'}</b>
          <small>{containerId ?? 'Pide a un administrador que te asigne un contenedor'}</small>
        </div>
        <span className={`loc-badge ${ok ? 'ok' : loc.status === 'starting' ? 'wait' : 'bad'}`} role="status" aria-live="polite">
          <span className="conn-dot" aria-hidden="true" />
          {STATUS_LABEL[loc.status]}
        </span>
        <button type="button" className="nav-logout" onClick={logout} aria-label="Cerrar sesión" title="Cerrar sesión">
          <Icon name="logout" size={18} />
        </button>
      </header>

      {loc.message && <div className="alert-box kiosk-alert" role="alert">{loc.message}</div>}
      {loc.lastSentAt && loc.lastPosition && (
        <p className="kiosk-meta">
          Último envío {formatAgo(loc.lastSentAt)} · {loc.lastPosition.latitude.toFixed(5)}, {loc.lastPosition.longitude.toFixed(5)} (±{Math.round(loc.lastPosition.accuracy)} m)
        </p>
      )}

      <main id="contenido" className="kiosk-main">
        <Outlet />
      </main>
    </div>
  );
}
