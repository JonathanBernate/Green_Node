import { KeyboardEvent, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../app/AuthProvider';
import { Avatar } from '../components/common/Avatar';
import { ConnectionBadge } from '../components/common/ConnectionBadge';
import { DataSourceTag } from '../components/common/DataSourceTag';
import { Modal } from '../components/common/Modal';
import { Icon } from '../components/Icon';
import { ProfileSection } from '../components/settings/ProfileSection';
import { SecuritySection } from '../components/settings/SecuritySection';
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

const TABS = [
  { id: 'perfil', label: 'Perfil', icon: 'user', hint: 'Foto y datos personales' },
  { id: 'seguridad', label: 'Seguridad', icon: 'lock', hint: 'Contraseña y sesión' },
  { id: 'sistema', label: 'Sistema', icon: 'signal', hint: 'Conexión y alertas' },
  { id: 'datos', label: 'Datos', icon: 'box', hint: 'Almacenamiento local' },
] as const;
type TabId = (typeof TABS)[number]['id'];

function SystemSection() {
  const { connectionState, publishCount, lastPublishedAt } = useAppStore();
  const status = useConnectionStatus();
  const alerts = useAlerts();
  useAppMetrics();
  return (
    <section className="panel" aria-label="Estado del sistema">
      <h3 className="section-title">Estado del sistema</h3>
      <dl className="sys-list">
        <div><dt>Conexión</dt><dd><ConnectionBadge status={status} /></dd></div>
        <div><dt>Origen de datos</dt><dd><DataSourceTag source={config.useMockData ? 'SIMULATION' : 'REAL'} /></dd></div>
        <div><dt>API</dt><dd>{config.useMockData ? 'No utilizada (simulación)' : config.apiUrl}</dd></div>
        <div><dt>MQTT</dt><dd>{config.useMockData ? 'Simulado en el navegador' : 'A través del backend'} · {CONN_LABEL[connectionState]}</dd></div>
        <div><dt>Mensajes publicados</dt><dd>{publishCount}{config.useMockData && ' (simulados)'}</dd></div>
        <div><dt>Último mensaje</dt><dd>{lastPublishedAt ? new Date(lastPublishedAt).toLocaleTimeString() : '—'}</dd></div>
        <div><dt>Alertas activas</dt><dd>{alerts.length}</dd></div>
        <div><dt>Versión</dt><dd>GreenNode web {config.appVersion}</dd></div>
      </dl>
    </section>
  );
}

function DataSection() {
  const { history } = useAppStore();
  const [queue, setQueue] = useState(() => classificationService.queue());
  const [flushMsg, setFlushMsg] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const pending = queue.filter((q) => q.delivery === 'pending').length;

  const flush = async () => {
    const sent = await classificationService.flush();
    setQueue(classificationService.queue());
    setFlushMsg(config.useMockData ? 'En simulación no hay servidor al que enviar.' : `${sent} evento(s) enviados.`);
  };

  const clearLocal = () => {
    ['greennode.events'].forEach((k) => localStorage.removeItem(k));
    // Cachés locales de historial y reportes (lo guardado en el servidor no se borra)
    Object.keys(localStorage).filter((k) => k.startsWith('greennode.history') || k.startsWith('greennode.reports')).forEach((k) => localStorage.removeItem(k));
    appMetrics.clear();
    window.location.reload();
  };

  return (
    <section className="panel" aria-label="Datos locales">
      <h3 className="section-title">Datos de este navegador</h3>
      <dl className="st-counters">
        <div><dd>{history.length}</dd><dt>Clasificaciones en caché</dt></div>
        <div><dd>{queue.length}</dd><dt>Eventos en cola</dt></div>
        <div><dd>{pending}</dd><dt>Pendientes de envío</dt></div>
      </dl>
      <div className="settings-actions">
        <button className="btn btn-outline" onClick={flush} disabled={pending === 0}>Reintentar envío</button>
        <button className="btn btn-outline" onClick={() => setConfirming(true)}>Borrar datos locales</button>
      </div>
      {flushMsg && <p className="inference-meta" role="status">{flushMsg}</p>}
      <p className="inference-meta">Solo se borra la caché de este navegador; lo que ya está guardado en tu cuenta se conserva.</p>
      {confirming && (
        <Modal title="Borrar datos locales" onClose={() => setConfirming(false)}>
          <p>Se vaciarán la caché del historial, los reportes locales y los eventos en cola de este navegador.</p>
          <div className="confirm-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setConfirming(false)}>Cancelar</button>
            <button type="button" className="btn btn-danger" onClick={clearLocal}>Borrar</button>
          </div>
        </Modal>
      )}
    </section>
  );
}

export function SettingsPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const requested = params.get('tab');
  const tab: TabId = TABS.some((t) => t.id === requested) ? (requested as TabId) : 'perfil';

  const go = (id: TabId) => setParams(id === 'perfil' ? {} : { tab: id }, { replace: true });
  const onKey = (e: KeyboardEvent, i: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;
    const next = TABS[(i + dir + TABS.length) % TABS.length].id;
    go(next);
    document.getElementById(`st-tab-${next}`)?.focus();
  };

  return (
    <div className="screen wide st">
      <header className="screen-header">
        <h2>Ajustes</h2>
        <p className="screen-subtitle">Tu cuenta, seguridad y estado del sistema</p>
      </header>

      <div className="st-hero">
        <Avatar user={user} className="lg" />
        <div className="st-hero-text">
          <b>{user?.name}</b>
          <small>{user?.email}</small>
          <div className="profile-badges">
            <span className="badge-chip"><Icon name="medal" size={14} /> Nivel {user?.level}</span>
            <span className="badge-chip"><Icon name="star" size={14} /> {user?.points} pts</span>
          </div>
        </div>
      </div>

      <div className="st-layout">
        <div className="st-tabs" role="tablist" aria-label="Secciones de ajustes" aria-orientation="vertical">
          {TABS.map((t, i) => (
            <button
              key={t.id}
              id={`st-tab-${t.id}`}
              role="tab"
              type="button"
              aria-selected={tab === t.id}
              aria-controls={`st-panel-${t.id}`}
              tabIndex={tab === t.id ? 0 : -1}
              className={`st-tab${tab === t.id ? ' active' : ''}`}
              onClick={() => go(t.id)}
              onKeyDown={(e) => onKey(e, i)}
            >
              <Icon name={t.icon} size={20} />
              <span className="st-tab-text"><b>{t.label}</b><small>{t.hint}</small></span>
            </button>
          ))}
        </div>

        <div className="st-content" role="tabpanel" id={`st-panel-${tab}`} aria-labelledby={`st-tab-${tab}`} key={tab}>
          {tab === 'perfil' && <ProfileSection />}
          {tab === 'seguridad' && <SecuritySection />}
          {tab === 'sistema' && <SystemSection />}
          {tab === 'datos' && <DataSection />}
        </div>
      </div>
    </div>
  );
}
