import { useState } from 'react';
import { useAuth } from '../app/AuthProvider';
import { ConnectionBadge } from '../components/common/ConnectionBadge';
import { DataSourceTag } from '../components/common/DataSourceTag';
import { Icon } from '../components/Icon';
import { config } from '../config/env';
import { useAlerts, useAppMetrics, useConnectionStatus } from '../hooks/useData';
import { useAppStore } from '../lib/appStore';
import { MqttConnectionState } from '../lib/iotSimulator';
import { appMetrics, classificationService } from '../services/api';

const CONN_LABEL: Record<MqttConnectionState, string> = {
  [MqttConnectionState.CONNECTED]: 'Conectado',
  [MqttConnectionState.CONNECTING]: 'Conectando…',
  [MqttConnectionState.RECONNECTING]: 'Reconectando…',
  [MqttConnectionState.DISCONNECTED]: 'Desconectado',
};

export function SettingsPage() {
  const { user, logout } = useAuth();
  const { connectionState, publishCount, lastPublishedAt } = useAppStore();
  const status = useConnectionStatus();
  const alerts = useAlerts();
  useAppMetrics();
  const [queue, setQueue] = useState(() => classificationService.queue());
  const [flushMsg, setFlushMsg] = useState<string | null>(null);

  const pending = queue.filter((q) => q.delivery === 'pending').length;

  const flush = async () => {
    const sent = await classificationService.flush();
    setQueue(classificationService.queue());
    setFlushMsg(config.useMockData ? 'En simulación no hay servidor al que enviar.' : `${sent} evento(s) enviados.`);
  };

  const clearLocal = () => {
    ['greennode.events', 'greennode.reports'].forEach((k) => localStorage.removeItem(k));
    // Caché local del historial (el historial guardado en el servidor no se borra)
    Object.keys(localStorage).filter((k) => k.startsWith('greennode.history')).forEach((k) => localStorage.removeItem(k));
    appMetrics.clear();
    window.location.reload();
  };

  return (
    <div className="screen wide">
      <header className="screen-header">
        <h2>Ajustes</h2>
        <p className="screen-subtitle">Cuenta, estado del sistema y datos locales</p>
      </header>

      <div className="profile-card">
        <div className="avatar">{(user?.name ?? '?').trim().charAt(0).toUpperCase()}</div>
        <div>
          <p className="profile-name">{user?.name}</p>
          <p className="profile-email">{user?.email}</p>
          <div className="profile-badges">
            <span className="badge-chip"><Icon name="medal" size={14} /> Nivel {user?.level}</span>
            <span className="badge-chip"><Icon name="star" size={14} /> {user?.points} pts</span>
          </div>
        </div>
      </div>

      <div className="two-col">
        <section className="panel">
          <h3 className="section-title">Estado del sistema</h3>
          <dl className="sys-list">
            <div><dt>Conexión</dt><dd><ConnectionBadge status={status} /></dd></div>
            <div><dt>Origen de datos</dt><dd><DataSourceTag source={config.useMockData ? 'SIMULATION' : 'REAL'} /></dd></div>
            <div><dt>API</dt><dd>{config.useMockData ? 'No utilizada (simulación)' : config.apiUrl}</dd></div>
            <div>
              <dt>MQTT</dt>
              <dd>
                {config.useMockData ? 'Simulado en el navegador' : 'A través del backend'} · {CONN_LABEL[connectionState]}
              </dd>
            </div>
            <div><dt>Mensajes publicados</dt><dd>{publishCount}{config.useMockData && ' (simulados)'}</dd></div>
            <div><dt>Último mensaje</dt><dd>{lastPublishedAt ? new Date(lastPublishedAt).toLocaleTimeString() : '—'}</dd></div>
            <div><dt>Alertas activas</dt><dd>{alerts.length}</dd></div>
            <div><dt>Versión</dt><dd>GreenNode web {config.appVersion}</dd></div>
          </dl>
        </section>

        <section className="panel">
          <h3 className="section-title">Eventos y datos locales</h3>
          <p className="inference-meta">
            Eventos en cola local: <b>{queue.length}</b> · pendientes de envío: <b>{pending}</b>
          </p>
          <div className="settings-actions">
            <button className="btn btn-outline" onClick={flush} disabled={pending === 0}>Reintentar envío</button>
            <button className="btn btn-outline" onClick={clearLocal}>Borrar datos locales</button>
          </div>
          {flushMsg && <p className="inference-meta" role="status">{flushMsg}</p>}
          <p className="inference-meta">
            El historial, los eventos y los reportes de este navegador se guardan en el almacenamiento local.
          </p>
        </section>
      </div>

      <button className="btn btn-outline btn-large logout-btn" onClick={logout}>
        <Icon name="logout" size={18} /> Cerrar sesión
      </button>
    </div>
  );
}
