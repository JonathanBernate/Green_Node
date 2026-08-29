import React from 'react';
import { useAppStore } from '../../lib/appStore';
import {
  WasteType,
  WASTE_TYPE_LABELS,
  WASTE_TYPE_COLORS,
  WASTE_TYPE_ICONS,
} from '../../lib/domain';

export function HistoryTab() {
  const { history } = useAppStore();

  const total = history.length;
  const avgConfidence =
    total > 0 ? history.reduce((s, r) => s + r.confidence, 0) / total : 0;

  const countByType = history.reduce<Record<string, number>>((acc, r) => {
    acc[r.wasteType] = (acc[r.wasteType] ?? 0) + 1;
    return acc;
  }, {});

  // Precisión percibida según validación del usuario
  const validated = history.filter((r) => r.feedback !== null);
  const correct = validated.filter((r) => r.feedback === 'correct').length;
  const accuracy = validated.length > 0 ? (correct / validated.length) * 100 : 0;

  return (
    <div className="screen">
      <header className="screen-header">
        <h2>📋 Historial</h2>
        <p className="screen-subtitle">Tus clasificaciones registradas</p>
      </header>

      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-value">{total}</span>
          <span className="stat-label">Clasificaciones</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{(avgConfidence * 100).toFixed(0)}%</span>
          <span className="stat-label">Confianza media</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">
            {validated.length > 0 ? `${accuracy.toFixed(0)}%` : '—'}
          </span>
          <span className="stat-label">Precisión validada</span>
        </div>
      </div>

      {validated.length > 0 && (
        <p className="accuracy-note">
          {correct} de {validated.length} clasificaciones validadas como correctas
        </p>
      )}

      {total > 0 && (
        <div className="type-breakdown">
          {Object.values(WasteType).map((wt) => {
            const count = countByType[wt] ?? 0;
            const pct = total > 0 ? (count / total) * 100 : 0;
            return (
              <div className="breakdown-row" key={wt}>
                <span className="breakdown-label">
                  {WASTE_TYPE_ICONS[wt]} {WASTE_TYPE_LABELS[wt]}
                </span>
                <div className="breakdown-track">
                  <div
                    className="breakdown-fill"
                    style={{ width: `${pct}%`, background: WASTE_TYPE_COLORS[wt] }}
                  />
                </div>
                <span className="breakdown-count">{count}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="history-list">
        {total === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🗒️</span>
            <p>Aún no tienes clasificaciones.</p>
            <p className="empty-hint">Ve a la pestaña Escanear para empezar.</p>
          </div>
        ) : (
          history.map((r) => (
            <div className="history-item" key={r.id}>
              <div
                className="history-icon"
                style={{ background: WASTE_TYPE_COLORS[r.wasteType] + '22' }}
              >
                {WASTE_TYPE_ICONS[r.wasteType]}
              </div>
              <div className="history-info">
                <p className="history-type" style={{ color: WASTE_TYPE_COLORS[r.wasteType] }}>
                  {WASTE_TYPE_LABELS[r.wasteType]}
                  {r.feedback === 'correct' && (
                    <span className="fb-badge ok" title={r.autoConfirmed ? 'Auto-confirmada' : 'Validada correcta'}>
                      {r.autoConfirmed ? '✓ auto' : '✓'}
                    </span>
                  )}
                  {r.feedback === 'incorrect' && (
                    <span className="fb-badge bad" title="Marcada incorrecta">✗</span>
                  )}
                </p>
                {r.feedback === 'incorrect' && r.correctedType && (
                  <p className="history-corrected">
                    Tipo real: {WASTE_TYPE_ICONS[r.correctedType]}{' '}
                    {WASTE_TYPE_LABELS[r.correctedType]}
                  </p>
                )}
                <p className="history-time">
                  {new Date(r.timestamp).toLocaleString()} · {r.inferenceTimeMs} ms
                </p>
              </div>
              <span className="history-conf">{(r.confidence * 100).toFixed(0)}%</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
