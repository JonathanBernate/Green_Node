import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';
import { DataSourceTag } from '../../components/common/DataSourceTag';
import { useContainers } from '../../hooks/useData';
import { ApiError, REPORT_TYPE_LABELS, ReportErrors, reportService, validateReport } from '../../services/api';
import type { ReportType } from '../../types';
import { logger } from '../../utils/logger';

export function ReportsPage() {
  const qc = useQueryClient();
  const { containers } = useContainers();
  const list = useQuery({ queryKey: ['reports'], queryFn: () => reportService.list() });

  const [type, setType] = useState<ReportType | ''>('');
  const [containerId, setContainerId] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [errors, setErrors] = useState<ReportErrors>({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const input = { type, container_id: containerId, description, location };
    const v = validateReport(input);
    setErrors(v);
    setNotice(null);
    if (Object.keys(v).length) return;
    setBusy(true);
    try {
      await reportService.create(input);
      setNotice({ ok: true, text: 'Reporte registrado correctamente.' });
      setType(''); setContainerId(''); setDescription(''); setLocation('');
      void qc.invalidateQueries({ queryKey: ['reports'] });
    } catch (err) {
      logger.error('No se pudo registrar el reporte', err);
      setNotice({ ok: false, text: err instanceof ApiError ? err.userMessage : 'No fue posible registrar el reporte. Inténtalo nuevamente.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen wide">
      <header className="screen-header">
        <h2>Reportes</h2>
        <p className="screen-subtitle">Informa una incidencia sobre un contenedor</p>
      </header>

      <div className="two-col">
        <form className="panel" onSubmit={submit} noValidate aria-label="Nuevo reporte">
          <div className="field">
            <label htmlFor="rp-type">Tipo de incidencia</label>
            <select id="rp-type" value={type} onChange={(e) => setType(e.target.value as ReportType | '')} aria-invalid={!!errors.type} aria-describedby={errors.type ? 'rp-type-err' : undefined}>
              <option value="">Selecciona…</option>
              {(Object.keys(REPORT_TYPE_LABELS) as ReportType[]).map((t) => (
                <option key={t} value={t}>{REPORT_TYPE_LABELS[t]}</option>
              ))}
            </select>
            {errors.type && <p id="rp-type-err" className="error-text">{errors.type}</p>}
          </div>

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
            <label htmlFor="rp-desc">Descripción <small>({description.length}/500)</small></label>
            <textarea id="rp-desc" rows={4} maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)} aria-invalid={!!errors.description} aria-describedby={errors.description ? 'rp-desc-err' : undefined} />
            {errors.description && <p id="rp-desc-err" className="error-text">{errors.description}</p>}
          </div>

          <div className="field">
            <label htmlFor="rp-loc">Referencia de ubicación <small>(opcional)</small></label>
            <input id="rp-loc" type="text" maxLength={120} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ej. frente a la tienda de la esquina" />
          </div>

          {notice && <div className={notice.ok ? 'notice-ok' : 'alert-box'} role={notice.ok ? 'status' : 'alert'}>{notice.text}</div>}

          <button type="submit" className="btn btn-primary btn-large" disabled={busy}>
            {busy ? <div className="spinner" /> : 'Enviar reporte'}
          </button>
        </form>

        <section className="panel" aria-label="Reportes enviados">
          <h3 className="section-title">Reportes enviados</h3>
          {list.data && list.data.length === 0 && <p className="inference-meta">Aún no has enviado reportes.</p>}
          <ul className="report-list">
            {list.data?.map((r) => (
              <li key={r.id} className="report-item">
                <div className="report-top">
                  <b>{REPORT_TYPE_LABELS[r.type]}</b>
                  <span className="inference-meta">{new Date(r.timestamp).toLocaleString()}</span>
                </div>
                <p>{r.description}</p>
                <div className="report-meta">
                  <span>{r.container_id}</span>
                  {r.location && <span>· {r.location}</span>}
                  <DataSourceTag source={r.source} compact />
                </div>
              </li>
            ))}
          </ul>
          {list.data && list.data.some((r) => r.source === 'SIMULATION') && (
            <p className="inference-meta">En modo simulación los reportes se guardan solo en este navegador.</p>
          )}
        </section>
      </div>
    </div>
  );
}
