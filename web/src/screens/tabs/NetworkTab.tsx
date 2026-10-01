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

/** Color de la barra de llenado según el nivel medio de la red. */
function fillColor(level: number): string {
  if (level > 80) return '#F44336';
  if (level >= 50) return '#FF9800';
  return '#4CAF50';
}

export function NetworkTab() {
  const {
    metrics,
    usingRealBroker,
    connectionState,
    containers,
    alerts,
    publishCount,
  } = useAppStore();

  const avgFill = metrics ? metrics.avgFillLevel : 0;

  return (
    <div className="screen">
      <header className="screen-header">
        <h2>📡 Red IoT</h2>
        <p className="screen-subtitle">Monitoreo de la red de contenedores en tiempo real</p>
      </header>

      <div className="iot-status-card">
        <div className="iot-status-header">
          <span>{usingRealBroker ? 'Broker MQTT real (WebSocket)' : 'Simulación interna'}</span>
          <span className="conn-pill" style={{ background: CONN_COLOR[connectionState] }}>
            {CONN_LABEL[connectionState]}
          </span>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <span className="metric-value">{metrics?.totalNodes ?? containers.length}</span>
          <span className="metric-label">Nodos totales</span>
        </div>
        <div className="metric-card">
          <span className="metric-value">{metrics?.containersActive ?? '—'}</span>
          <span className="metric-label">Contenedores activos</span>
        </div>
        <div className="metric-card">
          <span className="metric-value">{metrics?.containersFull ?? 0}</span>
          <span className="metric-label">Contenedores llenos</span>
        </div>
        <div className="metric-card">
          <span className="metric-value">{metrics ? metrics.avgFillLevel.toFixed(1) + '%' : '—'}</span>
          <span className="metric-label">Nivel medio de llenado</span>
        </div>
        <div className="metric-card">
          <span className="metric-value">{metrics?.cycle ?? 0}</span>
          <span className="metric-label">Ciclo de telemetría</span>
        </div>
        <div className="metric-card">
          <span className="metric-value">{publishCount}</span>
          <span className="metric-label">Mensajes recibidos</span>
        </div>
      </div>

      {!metrics && (
        <div className="empty-state">
          <p className="empty-hint">Esperando métricas de la red...</p>
        </div>
      )}

      <div className="iot-status-card">
        <span className="detail-label">Nivel medio de llenado de la red</span>
        <div className="fill-mini">
          <div className="net-fill-track">
            <div
              className="net-fill-bar"
              style={{ width: `${Math.max(0, Math.min(100, avgFill))}%`, background: fillColor(avgFill) }}
            />
          </div>
          <span className="fill-mini-val">{metrics ? avgFill.toFixed(0) + '%' : '—'}</span>
        </div>
      </div>

      <div className="alerts-card">
        <span className="detail-label">Alertas recientes</span>
        {alerts.length > 0 ? (
          alerts.slice(0, 5).map((a) => (
            <div className="alert-row" key={a.id}>
              <span className="alert-dot" />
              <span className="alert-msg">{a.message}</span>
            </div>
          ))
        ) : (
          <div className="alert-row">
            <span className="alert-msg">Sin alertas</span>
          </div>
        )}
      </div>

      {metrics && (
        <p className="app-version">
          Última actualización: {new Date(metrics.timestamp).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
