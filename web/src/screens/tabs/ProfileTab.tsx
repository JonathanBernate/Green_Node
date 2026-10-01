import React from 'react';
import { useAppStore } from '../../lib/appStore';
import { MqttConnectionState } from '../../lib/iotSimulator';

const CONN_LABEL: Record<MqttConnectionState, string> = {
  [MqttConnectionState.CONNECTED]: 'Conectado',
  [MqttConnectionState.CONNECTING]: 'Conectando...',
  [MqttConnectionState.RECONNECTING]: 'Reconectando...',
  [MqttConnectionState.DISCONNECTED]: 'Desconectado',
};

const CONN_COLOR: Record<MqttConnectionState, string> = {
  [MqttConnectionState.CONNECTED]: '#4CAF50',
  [MqttConnectionState.CONNECTING]: '#FF9800',
  [MqttConnectionState.RECONNECTING]: '#FF9800',
  [MqttConnectionState.DISCONNECTED]: '#F44336',
};

export function ProfileTab({ onLogout }: { onLogout: () => void }) {
  const { connectionState, publishCount, lastPublishedAt, alerts, history } = useAppStore();

  return (
    <div className="screen">
      <header className="screen-header">
        <h2>👤 Perfil</h2>
        <p className="screen-subtitle">Cuenta y estado del sistema</p>
      </header>

      <div className="profile-card">
        <div className="avatar">👤</div>
        <div>
          <p className="profile-name">Usuario Demo</p>
          <p className="profile-email">demo@greennode.co</p>
          <div className="profile-badges">
            <span className="badge-chip">🏅 Nivel 3</span>
            <span className="badge-chip">⭐ {history.length * 10} pts</span>
          </div>
        </div>
      </div>

      <div className="iot-status-card">
        <div className="iot-status-header">
          <span>Estado IoT / MQTT</span>
          <span className="conn-pill" style={{ background: CONN_COLOR[connectionState] }}>
            {CONN_LABEL[connectionState]}
          </span>
        </div>
        <div className="iot-metrics">
          <div>
            <span className="detail-label">Broker</span>
            <span className="detail-value">mqtt://localhost:1883</span>
          </div>
          <div>
            <span className="detail-label">Mensajes publicados</span>
            <span className="detail-value">{publishCount}</span>
          </div>
          <div>
            <span className="detail-label">Último mensaje</span>
            <span className="detail-value">
              {lastPublishedAt ? new Date(lastPublishedAt).toLocaleTimeString() : '—'}
            </span>
          </div>
          <div>
            <span className="detail-label">Alertas</span>
            <span className="detail-value">{alerts.length}</span>
          </div>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="alerts-card">
          <span className="detail-label">Alertas recientes</span>
          {alerts.slice(0, 5).map((a) => (
            <div className="alert-row" key={a.id}>
              <span className="alert-dot" />
              <span className="alert-msg">{a.message}</span>
            </div>
          ))}
        </div>
      )}

      <button className="btn btn-outline btn-large logout-btn" onClick={onLogout}>
        Cerrar sesión
      </button>

      <p className="app-version">GreenNode v1.0.0 · demo web</p>
    </div>
  );
}
