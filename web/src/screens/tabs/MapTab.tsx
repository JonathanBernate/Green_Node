import { useMemo, useState } from 'react';
import { ContainerDetail } from '../../components/containers/ContainerDetail';
import { DataSourceTag } from '../../components/common/DataSourceTag';
import { useContainers, useGateways } from '../../hooks/useData';
import { Container, getFillLevelColor } from '../../lib/domain';
import { deriveHealth, HEALTH_COLORS, HEALTH_LABELS } from '../../utils/status';

/**
 * Mapa esquemático: proyecta las coordenadas reales (lat/lng) de contenedores y gateways
 * en un plano. No usa teselas de mapa (funciona sin conexión a servicios externos).
 */
export function MapTab() {
  const { containers, source } = useContainers();
  const gateways = useGateways();
  const [selected, setSelected] = useState<Container | null>(null);
  const [showCoverage, setShowCoverage] = useState(true);

  const gws = gateways.data?.data ?? [];

  const proj = useMemo(() => {
    const lats = [...containers.map((c) => c.latitude), ...gws.map((g) => g.latitude)];
    const lngs = [...containers.map((c) => c.longitude), ...gws.map((g) => g.longitude)];
    if (lats.length === 0) return null;
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const padLat = (maxLat - minLat || 0.01) * 0.12;
    const padLng = (maxLng - minLng || 0.01) * 0.12;
    const lat0 = minLat - padLat, lat1 = maxLat + padLat, lng0 = minLng - padLng, lng1 = maxLng + padLng;
    // metros por grado (aprox.) para dibujar el radio de cobertura
    const mLat = 111320;
    const mLng = 111320 * Math.cos(((lat0 + lat1) / 2) * (Math.PI / 180));
    return {
      x: (lng: number) => ((lng - lng0) / (lng1 - lng0)) * 100,
      y: (lat: number) => ((lat1 - lat) / (lat1 - lat0)) * 100,
      wPct: (m: number) => (m / mLng / (lng1 - lng0)) * 100,
      hPct: (m: number) => (m / mLat / (lat1 - lat0)) * 100,
    };
  }, [containers, gws]);

  return (
    <div className="screen wide">
      <header className="screen-header">
        <h2>Mapa</h2>
        <p className="screen-subtitle">
          {containers.length} contenedores · {gws.length} gateways · <DataSourceTag source={source} />
        </p>
      </header>

      <div className="map-canvas">
        <div className="map-grid" role="group" aria-label="Mapa esquemático de contenedores y gateways">
          <div className="map-coverage-layer" aria-hidden="true">
          {proj && showCoverage && gws.map((g) => (
            <span
              key={`cov-${g.id}`}
              className="map-coverage"
              style={{
                left: `${proj.x(g.longitude)}%`,
                top: `${proj.y(g.latitude)}%`,
                width: `${proj.wPct(g.coverageRadiusM) * 2}%`,
                height: `${proj.hPct(g.coverageRadiusM) * 2}%`,
              }}
            />
          ))}
          </div>
          {proj && gws.map((g) => (
            <span
              key={g.id}
              className="map-gateway"
              style={{ left: `${proj.x(g.longitude)}%`, top: `${proj.y(g.latitude)}%` }}
              title={`${g.name} (${g.id})`}
              role="img"
              aria-label={`Gateway ${g.name}`}
            />
          ))}
          {proj && containers.map((c) => {
            const h = deriveHealth(c);
            return (
              <button
                key={c.id}
                className="map-pin"
                style={{ left: `${proj.x(c.longitude)}%`, top: `${proj.y(c.latitude)}%`, background: getFillLevelColor(c.fillLevel), outline: h === 'OFFLINE' ? `2px dashed ${HEALTH_COLORS.OFFLINE}` : undefined }}
                onClick={() => setSelected(c)}
                aria-label={`${c.id}, ${c.fillLevel}% de llenado, ${HEALTH_LABELS[h]}`}
              >
                {c.fillLevel}%
              </button>
            );
          })}
        </div>
        <div className="map-legend">
          <span><i className="lg-gw" /> Gateway</span>
          <label className="check-inline">
            <input type="checkbox" checked={showCoverage} onChange={(e) => setShowCoverage(e.target.checked)} />
            Cobertura de diseño
          </label>
        </div>
        <span className="map-hint">
          Plano esquemático construido con coordenadas geográficas. El radio de cobertura es un parámetro de diseño, no una medición.
        </span>
      </div>

      <div className="container-list">
        {containers.map((c) => {
          const h = deriveHealth(c);
          return (
            <button key={c.id} className="container-item" onClick={() => setSelected(c)}>
              <span className="container-main">
                <span className="status-dot" style={{ background: HEALTH_COLORS[h] }} aria-hidden="true" />
                <span>
                  <span className="container-id">{c.id}</span>
                  <span className="container-addr">{c.address}</span>
                </span>
              </span>
              <span className="fill-mini">
                <span className="fill-mini-track" aria-hidden="true">
                  <span className="fill-mini-bar" style={{ width: `${c.fillLevel}%`, background: getFillLevelColor(c.fillLevel) }} />
                </span>
                <span className="fill-mini-val">{c.fillLevel}%</span>
              </span>
            </button>
          );
        })}
      </div>

      {selected && <ContainerDetail container={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
