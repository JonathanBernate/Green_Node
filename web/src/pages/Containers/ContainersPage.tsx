import { useState } from 'react';
import { ContainerDetail } from '../../components/containers/ContainerDetail';
import { DataSourceTag } from '../../components/common/DataSourceTag';
import { useContainers } from '../../hooks/useData';
import { Container, getFillLevelColor } from '../../lib/domain';
import type { ContainerHealth } from '../../types';
import { deriveHealth, formatAgo, HEALTH_COLORS, HEALTH_LABELS } from '../../utils/status';

type Filter = 'ALL' | ContainerHealth;
const FILTERS: Filter[] = ['ALL', 'NORMAL', 'WARNING', 'CRITICAL', 'OFFLINE'];

export function ContainersPage() {
  const { containers, source, loading, error } = useContainers();
  const [filter, setFilter] = useState<Filter>('ALL');
  const [selected, setSelected] = useState<Container | null>(null);

  const withHealth = containers.map((c) => ({ c, h: deriveHealth(c) }));
  const counts = withHealth.reduce<Record<string, number>>((acc, { h }) => ({ ...acc, [h]: (acc[h] ?? 0) + 1 }), {});
  const visible = withHealth.filter(({ h }) => filter === 'ALL' || h === filter);

  return (
    <div className="screen wide">
      <header className="screen-header">
        <h2>Contenedores</h2>
        <p className="screen-subtitle">
          {containers.length} nodos · <DataSourceTag source={source} />
        </p>
      </header>

      <div className="filter-chips" role="group" aria-label="Filtrar por estado">
        {FILTERS.map((f) => (
          <button
            key={f}
            className={`chip ${filter === f ? 'active' : ''}`}
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
          >
            {f === 'ALL' ? 'Todos' : HEALTH_LABELS[f]}
            <b>{f === 'ALL' ? containers.length : counts[f] ?? 0}</b>
          </button>
        ))}
      </div>

      {loading && <p className="inference-meta">Cargando contenedores…</p>}
      {error && <div className="alert-box" role="alert">{error}</div>}

      <ul className="cont-grid">
        {visible.map(({ c, h }) => (
          <li key={c.id}>
            <button className="cont-card" onClick={() => setSelected(c)} aria-label={`Ver detalle de ${c.id}`}>
              <div className="cont-head">
                <span className="cont-id">{c.id}</span>
                <span className="health-pill" style={{ background: HEALTH_COLORS[h] }}>{HEALTH_LABELS[h]}</span>
              </div>
              <p className="container-addr">{c.address}</p>
              <div className="cont-fill">
                <div className="fill-mini-track big" aria-hidden="true">
                  <div className="fill-mini-bar" style={{ width: `${c.fillLevel}%`, background: getFillLevelColor(c.fillLevel) }} />
                </div>
                <b>{c.fillLevel}%</b>
              </div>
              <dl className="cont-meta">
                <div><dt>Batería</dt><dd>{c.batteryLevel != null ? `${c.batteryLevel}%` : '—'}</dd></div>
                <div><dt>Gateway</dt><dd>{c.gatewayId ?? '—'}</dd></div>
                <div><dt>Últ. comunicación</dt><dd>{formatAgo(c.lastUpdated)}</dd></div>
              </dl>
              {c.virtual && <span className="virtual-tag">Nodo virtual</span>}
            </button>
          </li>
        ))}
      </ul>

      {!loading && visible.length === 0 && (
        <div className="empty-state"><p>No hay contenedores con este estado.</p></div>
      )}

      {selected && <ContainerDetail container={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
