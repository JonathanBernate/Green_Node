import { Link } from 'react-router-dom';
import { useAuth } from '../../app/AuthProvider';
import { DataSourceTag } from '../../components/common/DataSourceTag';
import { Kpi } from '../../components/common/Kpi';
import { Icon } from '../../components/Icon';
import { LearningCard } from '../../components/learn/LearningCard';
import { Donut, LineChart } from '../../components/metrics/charts';
import { config } from '../../config/env';
import { useAlerts, useContainers, useNetworkSnapshot } from '../../hooks/useData';
import { useAppStore } from '../../lib/appStore';
import { WASTE_TYPE_COLORS, WASTE_TYPE_ICONS, WASTE_TYPE_LABELS, WasteType } from '../../lib/domain';
import { deriveHealth, formatAgo, HEALTH_COLORS, HEALTH_LABELS } from '../../utils/status';
import type { ContainerHealth } from '../../types';

const LEVEL_LABELS: Record<number, string> = {
  1: 'Principiante', 2: 'Explorador', 3: 'Eco-Warrior', 4: 'Guardián Verde', 5: 'Maestro Reciclador',
};

const ACTIONS = [
  { to: '/classification', icon: 'scan', label: 'Escanear', hint: 'Clasifica un residuo', tone: 'green' },
  { to: '/containers', icon: 'list', label: 'Contenedores', hint: 'Estado y llenado', tone: 'blue' },
  { to: '/reports', icon: 'flag', label: 'Reportar', hint: 'Informa una incidencia', tone: 'orange' },
  { to: '/network', icon: 'signal', label: 'Red IoT', hint: 'Latencia, PDR, cobertura', tone: 'purple' },
];

export function DashboardPage() {
  const { user } = useAuth();
  const { history, publishCount } = useAppStore();
  const { containers, source } = useContainers();
  const net = useNetworkSnapshot('sc-50');
  const alerts = useAlerts();

  const level = user?.level ?? 1;
  const points = user?.points ?? 0;
  const nextLevelPoints = level * 100;
  const progress = Math.min(points / nextLevelPoints, 1) * 100;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

  const health = containers.map((c) => deriveHealth(c));
  const count = (h: ContainerHealth) => health.filter((x) => x === h).length;
  const avgFill = containers.length ? Math.round(containers.reduce((a, c) => a + c.fillLevel, 0) / containers.length) : 0;
  const active = containers.length - count('OFFLINE');

  const real = history.filter((h) => !h.simulated);
  const byType = Object.values(WasteType).map((wt) => ({
    label: WASTE_TYPE_LABELS[wt],
    value: real.filter((h) => h.wasteType === wt).length,
    color: WASTE_TYPE_COLORS[wt],
  }));
  const netSource = net.data?.source ?? 'SIMULATION';
  const m = net.data?.data.summary;

  return (
    <div className="screen wide dash">
      <header className="home-greeting">
        <div>
          <p className="home-hello">{greeting}</p>
          <h2 className="home-name">{(user?.name ?? 'Usuario').split(' ')[0]}</h2>
        </div>
        <span className="level-chip">Nv. {level} · {LEVEL_LABELS[Math.min(level, 5)] ?? LEVEL_LABELS[1]}</span>
      </header>

      {config.useMockData && (
        <div className="notice-sim" role="note">
          <b>DATOS DE SIMULACIÓN.</b> Los contenedores son nodos virtuales y las métricas de red son
          sintéticas; no corresponden a infraestructura física.
        </div>
      )}

      <div className="kpi-grid">
        <Kpi label="Contenedores" value={containers.length} source={source} />
        <Kpi label="Activos" value={active} tone="good" source={source} />
        <Kpi label="Críticos" value={count('CRITICAL')} tone={count('CRITICAL') ? 'bad' : 'default'} source={source} />
        <Kpi label="Llenado promedio" value={`${avgFill}%`} source={source} />
        <Kpi label="Residuos clasificados" value={real.length} hint="Con modelo de IA" />
        <Kpi label="Mensajes enviados" value={publishCount} hint="Telemetría + eventos" source="SIMULATION" />
        <Kpi label="Latencia de red" value={m ? `${m.latencyMs.toFixed(0)} ms` : '—'} source={netSource} />
        <Kpi label="PDR" value={m ? `${m.pdr.toFixed(1)} %` : '—'} source={netSource} />
      </div>

      <div className="dash-grid">
        <section className="hero-card dash-hero" aria-label="Puntos">
          <div className="hero-top">
            <div>
              <p className="hero-label">Tus puntos</p>
              <p className="hero-points">{points}</p>
            </div>
            <div className="hero-trophy"><Icon name="trophy" size={28} /></div>
          </div>
          <div className="hero-track"><div className="hero-fill" style={{ width: `${progress}%` }} /></div>
          <p className="hero-next">{points} / {nextLevelPoints} puntos para el nivel {level + 1}</p>
        </section>

        <LearningCard />

        <section className="panel">
          <h3 className="section-title">Estado de contenedores</h3>
          <Donut
            label="Distribución de contenedores por estado"
            center={String(containers.length)}
            segments={(['NORMAL', 'WARNING', 'CRITICAL', 'OFFLINE'] as ContainerHealth[]).map((h) => ({
              label: HEALTH_LABELS[h], value: count(h), color: HEALTH_COLORS[h],
            }))}
          />
        </section>

        <section className="panel">
          <h3 className="section-title">Residuos clasificados</h3>
          {real.length === 0 ? (
            <p className="inference-meta">Aún no hay clasificaciones con modelo. <Link to="/classification">Clasificar ahora</Link></p>
          ) : (
            <Donut label="Distribución de residuos clasificados" center={String(real.length)} segments={byType.filter((b) => b.value > 0)} />
          )}
        </section>

        <section className="panel">
          <h3 className="section-title">Latencia de red <DataSourceTag source={netSource} compact /></h3>
          {net.data && <LineChart values={net.data.data.series.map((p) => p.latencyMs)} unit=" ms" label="Latencia de red en el tiempo" />}
          <Link to="/network" className="panel-link">Ver métricas de red</Link>
        </section>

        <section className="panel">
          <h3 className="section-title">Alertas {alerts.length > 0 && <span className="count-pill">{alerts.length}</span>}</h3>
          {alerts.length === 0 ? (
            <p className="inference-meta">Sin alertas activas.</p>
          ) : (
            <ul className="alert-list">
              {alerts.slice(0, 5).map((a) => (
                <li key={a.id} className={`alert-item sev-${a.severity}`}>
                  <span>{a.message}</span>
                  <small>{formatAgo(a.timestamp)}</small>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <h3 className="section-title">Eventos recientes</h3>
          {history.length === 0 ? (
            <p className="inference-meta">Todavía no hay eventos.</p>
          ) : (
            <ul className="event-list">
              {history.slice(0, 5).map((h) => (
                <li key={h.id}>
                  <span className="event-icon" style={{ background: WASTE_TYPE_COLORS[h.wasteType] + '22' }}>{WASTE_TYPE_ICONS[h.wasteType]}</span>
                  <span className="event-text">
                    <b>{WASTE_TYPE_LABELS[h.wasteType]}</b>
                    <small>{h.simulated ? 'Resultado simulado' : `${(h.confidence * 100).toFixed(0)}% · ${h.model ?? 'modelo'}`}</small>
                  </span>
                  <small>{formatAgo(h.timestamp)}</small>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <h3 className="section-title">Acciones rápidas</h3>
      <div className="action-grid four">
        {ACTIONS.map((a) => (
          <Link key={a.to} to={a.to} className={`action-card tone-${a.tone}`}>
            <span className="action-icon"><Icon name={a.icon} size={22} /></span>
            <span className="action-label">{a.label}</span>
            <span className="action-hint">{a.hint}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
