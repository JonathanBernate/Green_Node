import { DataSourceTag } from '../common/DataSourceTag';
import { REPORT_TYPE_COLORS, REPORT_TYPE_ICONS, REPORT_TYPE_LABELS } from '../../services/api';
import type { Report } from '../../types';
import { formatAgo } from '../../utils/status';

interface Props {
  report: Report;
  /** Resalta un reporte recién enviado. */
  fresh?: boolean;
  /** Versión corta para el Inicio. */
  compact?: boolean;
}

export function ReportCard({ report: r, fresh, compact }: Props) {
  const color = REPORT_TYPE_COLORS[r.type];
  return (
    <li className={`rp-card${fresh ? ' fresh' : ''}${compact ? ' compact' : ''}`} style={{ ['--rp' as string]: color }}>
      <span className="rp-icon" aria-hidden="true">{REPORT_TYPE_ICONS[r.type]}</span>
      <div className="rp-body">
        <div className="rp-top">
          <b>{REPORT_TYPE_LABELS[r.type]}</b>
          <time dateTime={r.timestamp} title={new Date(r.timestamp).toLocaleString('es')}>{formatAgo(r.timestamp)}</time>
        </div>
        <p className="rp-desc">{r.description}</p>
        <div className="rp-meta">
          <span className="rp-chip">{r.container_id}</span>
          {r.location && !compact && <span className="rp-loc">📍 {r.location}</span>}
          {!compact && <DataSourceTag source={r.source} compact />}
          {fresh && <span className="rp-new">Nuevo</span>}
        </div>
      </div>
    </li>
  );
}
