import { useQueryClient } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { ReportCard } from '../../components/reports/ReportCard';
import { useContainers } from '../../hooks/useData';
import { useReports } from '../../hooks/useReports';
import {
  ApiError,
  REPORT_TYPE_COLORS,
  REPORT_TYPE_ICONS,
  REPORT_TYPE_LABELS,
  ReportErrors,
  reportService,
  validateReport,
} from '../../services/api';
import type { Report, ReportType } from '../../types';
import { logger } from '../../utils/logger';

const TYPES = Object.keys(REPORT_TYPE_LABELS) as ReportType[];
const MAX = 500;

export function ReportsPage() {
  const qc = useQueryClient();
  const { containers } = useContainers();
  const list = useReports();

  const [type, setType] = useState<ReportType | ''>('');
  const [containerId, setContainerId] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [errors, setErrors] = useState<ReportErrors>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<Report | null>(null);
  const [filter, setFilter] = useState<ReportType | 'ALL'>('ALL');

  const reports = list.data ?? [];
  const visible = reports.filter((r) => filter === 'ALL' || r.type === filter);
  const usedTypes = TYPES.filter((t) => reports.some((r) => r.type === t));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const input = { type, container_id: containerId, description, location };
    const v = validateReport(input);
    setErrors(v);
    setError(null);
    if (Object.keys(v).length) return;
    setBusy(true);
    try {
      const created = await reportService.create(input);
      setSent(created);
      setType(''); setContainerId(''); setDescription(''); setLocation('');
      setFilter('ALL');
      await qc.invalidateQueries({ queryKey: ['reports'] });
    } catch (err) {
      logger.error('No se pudo registrar el reporte', err);
      setError(err instanceof ApiError ? err.userMessage : 'No fue posible registrar el reporte. Inténtalo nuevamente.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen wide rp">
      <header className="screen-header">
        <h2>Reportes</h2>
        <p className="screen-subtitle">Cuéntanos qué pasa con un contenedor y lo verás también en tu inicio</p>
      </header>

      <div className="two-col rp-cols">
        <form className="panel rp-form" onSubmit={submit} noValidate aria-label="Nuevo reporte">
          {sent && (
            <div className="rp-success" role="status">
              <span className="rp-check" aria-hidden="true">✓</span>
              <div>
                <b>¡Reporte enviado!</b>
                <p>{REPORT_TYPE_LABELS[sent.type]} · {sent.container_id}</p>
                <div className="rp-success-actions">
                  <Link to="/" className="rp-link">Ver en el inicio</Link>
                  <button type="button" className="rp-link" onClick={() => setSent(null)}>Cerrar</button>
                </div>
              </div>
            </div>
          )}

          <fieldset className="rp-types" aria-describedby={errors.type ? 'rp-type-err' : undefined}>
            <legend>Tipo de incidencia</legend>
            <div className="rp-type-grid" role="radiogroup" aria-label="Tipo de incidencia">
              {TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={type === t}
                  className={`rp-type${type === t ? ' on' : ''}`}
                  style={{ ['--rp' as string]: REPORT_TYPE_COLORS[t] }}
                  onClick={() => setType(t)}
                >
                  <span aria-hidden="true">{REPORT_TYPE_ICONS[t]}</span>
                  {REPORT_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
            {errors.type && <p id="rp-type-err" className="error-text">{errors.type}</p>}
          </fieldset>

          <div className="field">
            <label htmlFor="rp-container">Contenedor</label>
            <select id="rp-container" value={containerId} onChange={(e) => setContainerId(e.target.value)} aria-invalid={!!errors.container_id} aria-describedby={errors.container_id ? 'rp-cont-err' : undefined}>
              <option value="">Selecciona…</option>
              {containers.map((c) => (
                <option key={c.id} value={c.id}>{c.id} · {c.address}</option>
              ))}
            </select>
            {errors.container_id && <p id="rp-cont-err" className="error-text">{errors.container_id}</p>}
          </div>

          <div className="field">
            <label htmlFor="rp-desc">Descripción</label>
            <textarea id="rp-desc" rows={4} maxLength={MAX} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="¿Qué ocurre? Cuanto más detalle, más rápido se atiende." aria-invalid={!!errors.description} aria-describedby={errors.description ? 'rp-desc-err' : undefined} />
            <div className="rp-count"><span className={description.length > MAX * 0.9 ? 'warn' : ''}>{description.length}/{MAX}</span></div>
            {errors.description && <p id="rp-desc-err" className="error-text">{errors.description}</p>}
          </div>

          <div className="field">
            <label htmlFor="rp-loc">Referencia de ubicación <small>(opcional)</small></label>
            <input id="rp-loc" type="text" maxLength={120} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ej. frente a la tienda de la esquina" />
          </div>

          {error && <div className="alert-box" role="alert">{error}</div>}

          <button type="submit" className="btn btn-primary btn-large" disabled={busy}>
            {busy ? <div className="spinner" /> : 'Enviar reporte'}
          </button>
        </form>

        <section className="panel rp-history" aria-label="Reportes enviados">
          <div className="rp-history-head">
            <h3 className="section-title">Reportes enviados {reports.length > 0 && <span className="count-pill">{reports.length}</span>}</h3>
          </div>

          {usedTypes.length > 1 && (
            <div className="chip-row rp-filters" role="group" aria-label="Filtrar por tipo">
              <button type="button" className={`chip${filter === 'ALL' ? ' active' : ''}`} onClick={() => setFilter('ALL')}>Todos</button>
              {usedTypes.map((t) => (
                <button key={t} type="button" className={`chip${filter === t ? ' active' : ''}`} aria-pressed={filter === t} onClick={() => setFilter(filter === t ? 'ALL' : t)}>
                  {REPORT_TYPE_ICONS[t]} {REPORT_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          )}

          {reports.length === 0 ? (
            <div className="rp-empty">
              <span aria-hidden="true">📣</span>
              <p>Aún no has enviado reportes.</p>
              <small>Cuando envíes uno aparecerá aquí.</small>
            </div>
          ) : (
            <ul className="rp-list">
              {visible.map((r) => <ReportCard key={r.id} report={r} fresh={r.id === sent?.id} />)}
            </ul>
          )}
          {reports.some((r) => r.source === 'SIMULATION') && (
            <p className="inference-meta">En modo simulación los reportes se guardan solo en este navegador.</p>
          )}
        </section>
      </div>
    </div>
  );
}
