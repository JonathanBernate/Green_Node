import { useState } from 'react';
import { DataSourceTag } from '../../components/common/DataSourceTag';
import { Kpi } from '../../components/common/Kpi';
import { BarChart, LineChart } from '../../components/metrics/charts';
import { config } from '../../config/env';
import { useAlerts, useAppMetrics, useNetworkSnapshot, useScenarios } from '../../hooks/useData';

const LAYERS = [
  ['Acceso', 'Nodos IoT (sensores de nivel)'],
  ['LPWAN', 'LoRaWAN / NB-IoT / LTE-M'],
  ['Gateway', 'Concentrador de nodos'],
  ['Backhaul', 'Enlace hacia el servidor'],
  ['Broker', 'MQTT'],
  ['Aplicación', 'API + interfaz web'],
];

export function NetworkPage() {
  const scenarios = useScenarios();
  const [scenarioId, setScenarioId] = useState('sc-50');
  const snap = useNetworkSnapshot(scenarioId);
  const alerts = useAlerts().filter((a) => a.type === 'high_latency' || a.type === 'high_packet_loss' || a.type === 'comm_problem');
  const metrics = useAppMetrics();
  const api = metrics.summary('GET');
  const inf = metrics.summary('inference');

  const d = snap.data?.data;
  const source = snap.data?.source ?? 'SIMULATION';
  const m = d?.summary;

  return (
    <div className="screen wide">
      <header className="screen-header">
        <h2>Red IoT</h2>
        <p className="screen-subtitle">
          Métricas de cobertura, tráfico, latencia y escalabilidad · <DataSourceTag source={source} />
        </p>
      </header>

      {source === 'SIMULATION' && (
        <div className="notice-sim" role="note">
          <b>Valores sintéticos de demostración.</b> No son resultados medidos del proyecto ni de una red física.
          Se reemplazan por las salidas del simulador cuando el backend las expone.
        </div>
      )}

      <div className="field inline">
        <label htmlFor="scenario">Escenario</label>
        <select id="scenario" value={scenarioId} onChange={(e) => setScenarioId(e.target.value)}>
          {(scenarios.data?.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>

      {snap.isLoading && <p className="inference-meta">Cargando métricas…</p>}
      {snap.isError && <div className="alert-box" role="alert">No fue posible cargar las métricas de red.</div>}

      {m && d && (
        <>
          <div className="kpi-grid">
            <Kpi label="Latencia de red" value={`${m.latencyMs.toFixed(0)} ms`} source={source} tone={m.latencyMs > config.alerts.latencyMs ? 'warn' : 'default'} />
            <Kpi label="PDR" value={`${m.pdr.toFixed(1)} %`} hint="Paquetes entregados" source={source} />
            <Kpi label="Pérdida" value={`${m.packetLossPct.toFixed(1)} %`} source={source} tone={m.packetLossPct > config.alerts.packetLossPct ? 'warn' : 'default'} />
            <Kpi label="Throughput" value={`${m.throughputMsgS.toFixed(2)} msg/s`} source={source} />
            <Kpi label="Tráfico" value={`${m.trafficKbps.toFixed(2)} kbit/s`} source={source} />
            <Kpi label="Cobertura" value={`${m.coveragePct.toFixed(0)} %`} source={source} />
            <Kpi label="Nodos" value={m.nodes} source={source} />
            <Kpi label="Gateways" value={m.gateways} source={source} />
          </div>

          <div className="two-col">
            <section className="panel">
              <h3 className="section-title">Latencia en el tiempo</h3>
              <LineChart values={d.series.map((p) => p.latencyMs)} unit=" ms" label="Latencia de red en el tiempo" />
              <h3 className="section-title" style={{ marginTop: 18 }}>PDR en el tiempo</h3>
              <LineChart values={d.series.map((p) => p.pdr)} unit="%" decimals={1} color="#1D6FD1" label="PDR en el tiempo" />
            </section>

            <section className="panel">
              <h3 className="section-title">Nodos por gateway</h3>
              <BarChart items={d.nodesPerGateway.map((g) => ({ label: g.gatewayId, value: g.nodes }))} label="Nodos por gateway" />
              <h3 className="section-title" style={{ marginTop: 18 }}>Escalabilidad (latencia vs. nodos)</h3>
              <BarChart
                items={d.scalability.map((s) => ({ label: `${s.nodes} nodos`, value: Math.round(s.latencyMs), color: '#F5A524' }))}
                unit=" ms"
                label="Latencia según número de nodos"
              />
            </section>
          </div>
        </>
      )}

      {alerts.length > 0 && (
        <section className="panel">
          <h3 className="section-title">Alertas de red</h3>
          <ul className="alert-list">
            {alerts.map((a) => <li key={a.id} className={`alert-item sev-${a.severity}`}>{a.message}</li>)}
          </ul>
        </section>
      )}

      <section className="panel">
        <h3 className="section-title">Capas de la arquitectura <DataSourceTag source="REFERENCE" /></h3>
        <ol className="layers">
          {LAYERS.map(([name, desc]) => (
            <li key={name}><b>{name}</b><span>{desc}</span></li>
          ))}
        </ol>
        <p className="inference-meta">
          Arquitectura híbrida: la capa de acceso LPWAN y el gateway requieren infraestructura; lo que sea
          estrictamente ad-hoc debe delimitarse en el documento y en el simulador.
        </p>
      </section>

      <section className="panel">
        <h3 className="section-title">Métricas de la aplicación <DataSourceTag source="REAL" /></h3>
        <p className="inference-meta">Medidas en este navegador. No son la latencia de la red IoT.</p>
        <div className="kpi-grid">
          <Kpi label="Respuesta API (media)" value={api.avgMs != null ? `${api.avgMs.toFixed(0)} ms` : '—'} hint={`${api.count} solicitudes · ${api.errors} errores`} />
          <Kpi label="Respuesta API (p95)" value={api.p95Ms != null ? `${api.p95Ms.toFixed(0)} ms` : '—'} />
          <Kpi label="Inferencia (media)" value={inf.avgMs != null ? `${inf.avgMs.toFixed(0)} ms` : '—'} hint={`${inf.count} inferencias`} />
        </div>
      </section>
    </div>
  );
}
