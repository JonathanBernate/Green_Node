import React from 'react';

/** Gráficos SVG ligeros (sin dependencias). Cada uno incluye título accesible. */

interface LineProps {
  values: number[];
  height?: number;
  color?: string;
  unit?: string;
  label: string;
  decimals?: number;
}

export function LineChart({ values, height = 140, color = 'var(--brand)', unit = '', label, decimals = 0 }: LineProps) {
  const W = 320;
  const pad = { l: 38, r: 8, t: 10, b: 14 };
  if (values.length < 2) return <p className="chart-empty">Sin datos suficientes</p>;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const x = (i: number) => pad.l + (i / (values.length - 1)) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - (v - min) / span) * (height - pad.t - pad.b);
  const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
  const area = `${pts.join(' ')} ${x(values.length - 1)},${height - pad.b} ${x(0)},${height - pad.b}`;
  const fmt = (v: number) => `${v.toFixed(decimals)}${unit}`;
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${height}`} role="img" aria-label={`${label}: mín ${fmt(min)}, máx ${fmt(max)}`}>
      <title>{label}</title>
      <polygon points={area} fill={color} opacity="0.12" />
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
      <text x={pad.l - 6} y={pad.t + 4} textAnchor="end" className="chart-axis">{fmt(max)}</text>
      <text x={pad.l - 6} y={height - pad.b} textAnchor="end" className="chart-axis">{fmt(min)}</text>
      <line x1={pad.l} x2={W - pad.r} y1={height - pad.b} y2={height - pad.b} className="chart-grid" />
    </svg>
  );
}

interface BarItem { label: string; value: number; color?: string }

export function BarChart({ items, unit = '', label, max }: { items: BarItem[]; unit?: string; label: string; max?: number }) {
  const top = max ?? Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="bar-chart" role="img" aria-label={label}>
      {items.map((it) => (
        <div className="bar-row" key={it.label}>
          <span className="bar-label">{it.label}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${(it.value / top) * 100}%`, background: it.color ?? 'var(--brand)' }} />
          </div>
          <span className="bar-value">{it.value}{unit}</span>
        </div>
      ))}
    </div>
  );
}

interface Segment { label: string; value: number; color: string }

export function Donut({ segments, label, center }: { segments: Segment[]; label: string; center?: string }) {
  const total = segments.reduce((a, s) => a + s.value, 0);
  const R = 42;
  const C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 120 120" className="donut" role="img" aria-label={label}>
        <title>{label}</title>
        <circle cx="60" cy="60" r={R} fill="none" stroke="var(--neutral-100)" strokeWidth="16" />
        {total > 0 &&
          segments.map((s) => {
            const len = (s.value / total) * C;
            const el = (
              <circle
                key={s.label}
                cx="60" cy="60" r={R} fill="none" stroke={s.color} strokeWidth="16"
                strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset}
                transform="rotate(-90 60 60)"
              />
            );
            offset += len;
            return el;
          })}
        <text x="60" y="64" textAnchor="middle" className="donut-center">{center ?? total}</text>
      </svg>
      <ul className="donut-legend">
        {segments.map((s) => (
          <li key={s.label}><span className="legend-dot" style={{ background: s.color }} />{s.label} <b>{s.value}</b></li>
        ))}
      </ul>
    </div>
  );
}
