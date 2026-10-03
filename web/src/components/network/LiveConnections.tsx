import { useEffect, useState } from 'react';
import { useContainerConnections } from '../../hooks/useContainerConnections';
import type { ContainerConnection, LinkQuality } from '../../services/api';
import { formatAgeSeconds } from '../../utils/status';
import { DataSourceTag } from '../common/DataSourceTag';
import { LineChart } from '../metrics/charts';

const QUALITY: Record<LinkQuality, { label: string; color: string }> = {
  good: { label: 'Enlace estable', color: '#16A34A' },
  fair: { label: 'Enlace irregular', color: '#F5A524' },
  poor: { label: 'Enlace débil', color: '#E5484D' },
  lost: { label: 'Sin señal', color: '#8A98A0' },
  none: { label: 'Nunca conectó', color: '#8A98A0' },
};

/** "iPhone · Safari", "Android · Chrome"… a partir del User-Agent. */
export function describeDevice(ua: string | null): string {
  if (!ua) return '—';
  const os = /iPhone|iPad/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'Dispositivo';
  const browser = /Edg\//.test(ua) ? 'Edge' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'navegador';
  return `${os} · ${browser}`;
}

/** Reloj que avanza cada segundo para que "hace X s" corra entre consultas. */
function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

const fmt = (v: number | null, unit: string, digits = 0) => (v == null ? '—' : `${v.toFixed(digits)}${unit}`);

function Stat({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: 'warn' | 'bad' }) {
  return (
    <div className={`lc-stat${tone ? ` ${tone}` : ''}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
      {hint && <small>{hint}</small>}
    </div>
  );
}

function ConnectionCard({ c, age, expected }: { c: ContainerConnection; age: number | null; expected: number }) {
  const q = QUALITY[c.quality];
  const lats = c.series.map((p) => p.latency_ms).filter((v): v is number => v != null);
  const fresh = age != null && age <= expected + 5;
  return (
    <article className="lc-card" aria-label={`Conexión de ${c.container_id}`}>
      <header className="lc-head">
        {/* key = último reporte: reinicia la animación del latido en cada paquete recibido */}
        <span className={`lc-beat${fresh ? ' live' : ''}`} key={c.last_seen_at ?? 'none'} style={{ background: q.color }} aria-hidden="true" />
        <div className="lc-title">
          <b>{c.container_id}</b>
          <small>{c.name}</small>
        </div>
        <span className="health-pill" style={{ background: q.color }}>{q.label}</span>
      </header>

      <dl className="lc-stats">
        <Stat label="Último reporte" value={formatAgeSeconds(age)} tone={age != null && age > expected * 3 ? 'warn' : undefined} />
        <Stat
          label="Entrega (5 min)"
          value={c.delivery_pct == null ? '—' : `${c.delivery_pct}%`}
          hint={`${c.reports_window} reportes`}
          tone={c.delivery_pct != null && c.delivery_pct < 60 ? 'bad' : c.delivery_pct != null && c.delivery_pct < 90 ? 'warn' : undefined}
        />
        <Stat label="Intervalo medio" value={fmt(c.avg_interval_s, ' s', 1)} hint={c.jitter_s != null ? `±${c.jitter_s.toFixed(1)} s · esperado ${expected} s` : `esperado ${expected} s`} />
        <Stat label="Latencia estimada" value={fmt(c.latency_last_ms, ' ms')} hint={c.latency_avg_ms != null ? `media ${c.latency_avg_ms} ms` : undefined} />
        <Stat label="Precisión GPS" value={c.accuracy_m != null ? `±${Math.round(c.accuracy_m)} m` : '—'} />
        <Stat label="Reportes (1 h)" value={String(c.reports_hour)} hint={c.reports_ignored_window ? `${c.reports_ignored_window} fuera de orden` : undefined} />
      </dl>

      <div className="lc-ticks" role="img" aria-label="Últimos reportes recibidos">
        {c.series.map((p) => (
          <i key={p.t} className={p.accepted ? 'ok' : 'skip'} title={`${new Date(p.t).toLocaleTimeString('es')}${p.latency_ms != null ? ` · ${p.latency_ms} ms` : ''}`} />
        ))}
      </div>
      {lats.length >= 2 && <LineChart values={lats} unit=" ms" height={90} label={`Latencia estimada de ${c.container_id}`} color={q.color} />}

      <details className="lc-more">
        <summary>Detalles técnicos</summary>
        <dl className="lc-tech">
          <div><dt>Dispositivo</dt><dd>{describeDevice(c.user_agent)}</dd></div>
          <div><dt>Dirección IP</dt><dd>{c.ip ?? 'Solo administradores'}</dd></div>
          <div><dt>Hora del dispositivo</dt><dd>{c.device_at ? new Date(c.device_at).toLocaleTimeString('es') : '—'}</dd></div>
          <div><dt>Coordenadas</dt><dd>{c.latitude != null && c.longitude != null ? `${c.latitude.toFixed(5)}, ${c.longitude.toFixed(5)}` : '—'}</dd></div>
        </dl>
        <p className="inference-meta">
          La latencia es una estimación (hora de recepción − hora del dispositivo) y depende de que el reloj del dispositivo esté en hora.
        </p>
      </details>
    </article>
  );
}

/** Conexión en vivo de cada contenedor que reporta al webhook de ubicación. */
export function LiveConnections() {
  const q = useContainerConnections();
  const now = useNow();
  const list = q.data?.data ?? [];
  const expected = q.data?.expected_interval_seconds ?? 15;
  // La antigüedad corre localmente desde la última consulta
  const ageOf = (c: ContainerConnection) => (c.age_seconds == null ? null : c.age_seconds + Math.max(0, (now - q.dataUpdatedAt) / 1000));

  const online = list.filter((c) => c.status === 'online');
  const offline = list.filter((c) => c.status !== 'online');
  const updated = q.dataUpdatedAt ? Math.max(0, Math.round((now - q.dataUpdatedAt) / 1000)) : null;

  return (
    <section className="panel lc" aria-label="Conexión de contenedores en vivo">
      <div className="lc-top">
        <h3 className="section-title">
          Conexión en vivo <DataSourceTag source="REAL" />
        </h3>
        <span className={`lc-live${q.isError ? ' err' : ''}`} role="status">
          <i aria-hidden="true" />
          {q.isError ? 'Sin conexión con el servidor' : updated == null ? 'Conectando…' : `En vivo · actualizado hace ${updated} s`}
        </span>
      </div>
      <p className="inference-meta">
        Cada tarjeta se calcula con los reportes que el contenedor envía al webhook (cada {expected} s). {online.length} en línea de {list.length} registrados.
      </p>

      {q.isLoading && <p className="inference-meta">Cargando…</p>}
      {q.isError && !q.data && <div className="alert-box" role="alert">No fue posible cargar la conexión de los contenedores.</div>}

      {online.length > 0 ? (
        <div className="lc-grid">
          {online.map((c) => <ConnectionCard key={c.container_id} c={c} age={ageOf(c)} expected={expected} />)}
        </div>
      ) : (
        !q.isLoading && <div className="empty-state"><p>Ningún contenedor está reportando en este momento.</p></div>
      )}

      {offline.length > 0 && (
        <details className="lc-offline">
          <summary>Sin señal ({offline.length})</summary>
          <ul>
            {offline.map((c) => (
              <li key={c.container_id}>
                <b>{c.container_id}</b> <span>{c.name}</span>
                <em>{c.status === 'none' ? 'Nunca reportó' : `Último reporte ${formatAgeSeconds(ageOf(c))}`}</em>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
