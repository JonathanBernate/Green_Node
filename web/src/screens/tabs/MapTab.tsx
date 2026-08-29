import React, { useState } from 'react';
import { useAppStore } from '../../lib/appStore';
import {
  Container,
  ContainerStatus,
  CONTAINER_STATUS_LABELS,
  getFillLevelColor,
  WASTE_TYPE_ICONS,
  WASTE_TYPE_LABELS,
} from '../../lib/domain';

const STATUS_DOT: Record<ContainerStatus, string> = {
  [ContainerStatus.ACTIVE]: '#4CAF50',
  [ContainerStatus.FULL]: '#F44336',
  [ContainerStatus.MAINTENANCE]: '#FF9800',
  [ContainerStatus.OFFLINE]: '#9E9E9E',
};

export function MapTab() {
  const { containers } = useAppStore();
  const [selected, setSelected] = useState<Container | null>(null);

  return (
    <div className="screen">
      <header className="screen-header">
        <h2>🗺️ Contenedores IoT</h2>
        <p className="screen-subtitle">
          {containers.length} nodos · niveles actualizados en tiempo real vía MQTT
        </p>
      </header>

      <div className="map-canvas">
        <div className="map-grid">
          {containers.map((c) => (
            <button
              key={c.id}
              className="map-pin"
              style={{
                left: `${((c.longitude + 74.09) / 0.05) * 100}%`,
                top: `${((4.69 - c.latitude) / 0.1) * 100}%`,
                background: getFillLevelColor(c.fillLevel),
              }}
              onClick={() => setSelected(c)}
              title={`${c.id} · ${c.fillLevel}%`}
            >
              {c.fillLevel}%
            </button>
          ))}
        </div>
        <span className="map-hint">Mapa esquemático (demo). Toca un pin para ver detalle.</span>
      </div>

      <div className="container-list">
        {containers.map((c) => (
          <div key={c.id} className="container-item" onClick={() => setSelected(c)}>
            <div className="container-main">
              <span className="status-dot" style={{ background: STATUS_DOT[c.status] }} />
              <div>
                <p className="container-id">{c.id}</p>
                <p className="container-addr">{c.address}</p>
              </div>
            </div>
            <div className="fill-mini">
              <div className="fill-mini-track">
                <div
                  className="fill-mini-bar"
                  style={{ width: `${c.fillLevel}%`, background: getFillLevelColor(c.fillLevel) }}
                />
              </div>
              <span className="fill-mini-val">{c.fillLevel}%</span>
            </div>
          </div>
        ))}
      </div>

      {selected && <ContainerDetail container={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function ContainerDetail({ container, onClose }: { container: Container; onClose: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{container.id}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <p className="container-addr">{container.address}</p>

        <div className="detail-fill">
          <div className="fill-mini-track big">
            <div
              className="fill-mini-bar"
              style={{ width: `${container.fillLevel}%`, background: getFillLevelColor(container.fillLevel) }}
            />
          </div>
          <span className="fill-big-val">{container.fillLevel}%</span>
        </div>

        <div className="detail-grid">
          <div>
            <span className="detail-label">Estado</span>
            <span className="detail-value">{CONTAINER_STATUS_LABELS[container.status]}</span>
          </div>
          <div>
            <span className="detail-label">Capacidad</span>
            <span className="detail-value">{container.capacity} L</span>
          </div>
          <div>
            <span className="detail-label">Latitud</span>
            <span className="detail-value">{container.latitude.toFixed(4)}</span>
          </div>
          <div>
            <span className="detail-label">Longitud</span>
            <span className="detail-value">{container.longitude.toFixed(4)}</span>
          </div>
        </div>

        <span className="detail-label">Residuos aceptados</span>
        <div className="waste-chips">
          {container.wasteTypes.map((wt) => (
            <span className="waste-chip" key={wt}>
              {WASTE_TYPE_ICONS[wt]} {WASTE_TYPE_LABELS[wt]}
            </span>
          ))}
        </div>

        <p className="inference-meta">
          Última actualización: {new Date(container.lastUpdated).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
