import { useMemo, useState } from 'react';
import { ActivityChart } from '../../components/history/ActivityChart';
import { BinDonut } from '../../components/history/BinDonut';
import { dayKey, dayLabel, groupByDay, lastDays } from '../../components/history/historyUtils';
import { Modal } from '../../components/common/Modal';
import { Icon } from '../../components/Icon';
import { useAppStore } from '../../lib/appStore';
import {
  BIN_COLORS,
  BIN_DESCRIPTIONS,
  BIN_LABELS,
  BIN_ORDER,
  Bin,
  ClassificationResult,
  WASTE_DISPOSAL_TIP,
  WASTE_TYPE_BIN,
  WASTE_TYPE_ICONS,
  WASTE_TYPE_LABELS,
  WasteType,
} from '../../lib/domain';

type Sort = 'recent' | 'high' | 'low';
const SORTS: { id: Sort; label: string }[] = [
  { id: 'recent', label: 'Más recientes' },
  { id: 'high', label: 'Mayor confianza' },
  { id: 'low', label: 'Menor confianza' },
];

const time = (iso: string) => new Date(iso).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });

/** Historial personal: qué clasificó el usuario y en cuál de las tres canecas va cada residuo. */
export function HistoryTab() {
  const { history, removeClassification, clearHistory } = useAppStore();
  const [bin, setBin] = useState<Bin | null>(null);
  const [material, setMaterial] = useState<WasteType | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>('recent');
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = history.length;
  const days = useMemo(() => lastDays(history), [history]);
  const today = days[days.length - 1].count;
  const week = days.reduce((s, d) => s + d.count, 0);
  const avgConf = total ? history.reduce((s, r) => s + r.confidence, 0) / total : 0;

  const countByBin = useMemo(
    () => history.reduce<Record<Bin, number>>((a, r) => ({ ...a, [WASTE_TYPE_BIN[r.wasteType]]: a[WASTE_TYPE_BIN[r.wasteType]] + 1 }), { blanca: 0, verde: 0, negra: 0 }),
    [history],
  );
  const countByMaterial = useMemo(
    () => history.reduce<Partial<Record<WasteType, number>>>((a, r) => ({ ...a, [r.wasteType]: (a[r.wasteType] ?? 0) + 1 }), {}),
    [history],
  );
  const topMaterial = (Object.entries(countByMaterial) as [WasteType, number][]).sort((a, b) => b[1] - a[1])[0]?.[0];

  const visible = useMemo(() => {
    const list = history.filter(
      (r) => (!bin || WASTE_TYPE_BIN[r.wasteType] === bin) && (!material || r.wasteType === material) && (!day || dayKey(r.timestamp) === day),
    );
    if (sort === 'high') return [...list].sort((a, b) => b.confidence - a.confidence);
    if (sort === 'low') return [...list].sort((a, b) => a.confidence - b.confidence);
    return list; // el store ya viene ordenado de más reciente a más antiguo
  }, [history, bin, material, day, sort]);

  const filtering = !!(bin || material || day);
  const clearFilters = () => { setBin(null); setMaterial(null); setDay(null); };

  const run = async (action: () => Promise<boolean>, done?: () => void) => {
    setBusy(true);
    setError(null);
    const ok = await action();
    setBusy(false);
    if (ok) done?.();
    else setError('No se pudo borrar en el servidor. Revisa tu conexión e inténtalo de nuevo.');
  };

  const renderItem = (r: ClassificationResult, i: number) => {
    const b = WASTE_TYPE_BIN[r.wasteType];
    const open = openId === r.id;
    return (
      <li key={r.id} className={`hx-item${open ? ' open' : ''}`} style={{ ['--i' as string]: Math.min(i, 12) }}>
        <button type="button" className="hx-row" aria-expanded={open} onClick={() => setOpenId(open ? null : r.id)}>
          <span className="hx-icon" style={{ background: BIN_COLORS[b] + '33' }}>{WASTE_TYPE_ICONS[r.wasteType]}</span>
          <span className="hx-main">
            <span className="hx-title">
              {WASTE_TYPE_LABELS[r.wasteType]}
              {r.simulated && <span className="fb-badge bad">simulado</span>}
              {r.feedback === 'correct' && <span className="fb-badge ok" title="Validada como correcta">✓</span>}
              {r.feedback === 'incorrect' && <span className="fb-badge bad">corregido</span>}
            </span>
            <span className="hx-sub">{time(r.timestamp)} · {BIN_LABELS[b]}</span>
          </span>
          <span className={`bin-pill bin-${b}`}>{BIN_LABELS[b].replace('Caneca ', '')}</span>
          <span className="hx-conf">{(r.confidence * 100).toFixed(0)}%</span>
          <span className="hx-chevron" aria-hidden="true"><Icon name="chevron" size={16} /></span>
        </button>

        {open && (
          <div className="hx-detail">
            <div className="hx-meter" aria-label={`Confianza ${(r.confidence * 100).toFixed(0)}%`}>
              <span style={{ width: `${r.confidence * 100}%`, background: BIN_COLORS[b] }} />
            </div>
            <p className="hx-tip">💡 {WASTE_DISPOSAL_TIP[r.wasteType]}</p>
            <p className="hx-meta">
              {new Date(r.timestamp).toLocaleString('es')} · {BIN_DESCRIPTIONS[b]}
              {r.feedback === null && ' · Sin validar'}
            </p>
            <button type="button" className="hx-delete" disabled={busy} onClick={() => void run(() => removeClassification(r.id), () => setOpenId(null))}>
              <Icon name="x" size={14} /> Eliminar esta clasificación
            </button>
          </div>
        )}
      </li>
    );
  };

  const groups = groupByDay(visible);
  let n = 0;

  return (
    <div className="screen wide hx">
      <header className="screen-header">
        <h2>Historial</h2>
        <p className="screen-subtitle">
          {total === 0 ? 'Tus clasificaciones aparecerán aquí' : `${total} ${total === 1 ? 'residuo clasificado' : 'residuos clasificados'}`}
        </p>
      </header>

      {error && <div className="alert-box" role="alert">{error}</div>}

      {total === 0 ? (
        <div className="empty-state hx-empty">
          <span className="empty-icon">🗒️</span>
          <p>Aún no tienes clasificaciones.</p>
          <p className="empty-hint">Ve a Escanear para clasificar tu primer residuo.</p>
        </div>
      ) : (
        <>
          <section className="hx-hero" aria-label="Resumen">
            <div className="hx-hero-main">
              <span className="hx-hero-num">{total}</span>
              <span className="hx-hero-label">residuos clasificados</span>
            </div>
            <dl className="hx-hero-stats">
              <div><dt>Hoy</dt><dd>{today}</dd></div>
              <div><dt>7 días</dt><dd>{week}</dd></div>
              <div><dt>Confianza media</dt><dd>{(avgConf * 100).toFixed(0)}%</dd></div>
              <div><dt>Más frecuente</dt><dd>{topMaterial ? `${WASTE_TYPE_ICONS[topMaterial]} ${WASTE_TYPE_LABELS[topMaterial]}` : '—'}</dd></div>
            </dl>
          </section>

          <div className="hx-panels">
            <section className="hx-panel" aria-label="Por caneca">
              <h3>Por caneca</h3>
              <div className="hx-bins">
                <BinDonut counts={countByBin} active={bin} onSelect={setBin} />
                <div className="bin-legend" role="group" aria-label="Filtrar por caneca">
                  {BIN_ORDER.map((b) => (
                    <button key={b} type="button" className={`bin-card bin-${b}${bin === b ? ' active' : ''}`} aria-pressed={bin === b} onClick={() => setBin(bin === b ? null : b)}>
                      <span className="bin-swatch" style={{ background: BIN_COLORS[b] }} aria-hidden="true" />
                      <span className="bin-text">
                        <span className="bin-name">{BIN_LABELS[b]}</span>
                        <span className="bin-desc">{BIN_DESCRIPTIONS[b]}</span>
                      </span>
                      <span className="bin-count">{countByBin[b]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="hx-panel" aria-label="Actividad">
              <h3>Últimos 7 días</h3>
              <ActivityChart days={days} selected={day} onSelect={setDay} />
              <p className="hx-hint">Pulsa un día para ver solo esos residuos.</p>
            </section>
          </div>

          <div className="hx-toolbar">
            <div className="chip-row" role="group" aria-label="Filtrar por material">
              <button type="button" className={`chip${!material ? ' active' : ''}`} onClick={() => setMaterial(null)}>Todos <b>{total}</b></button>
              {Object.values(WasteType).filter((w) => countByMaterial[w]).map((w) => (
                <button key={w} type="button" className={`chip${material === w ? ' active' : ''}`} aria-pressed={material === w} onClick={() => setMaterial(material === w ? null : w)}>
                  {WASTE_TYPE_ICONS[w]} {WASTE_TYPE_LABELS[w]} <b>{countByMaterial[w]}</b>
                </button>
              ))}
            </div>
            <div className="hx-tools">
              <label className="hx-sort">
                <span className="sr-only">Ordenar por</span>
                <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                  {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </label>
              <button type="button" className="btn-danger-link" onClick={() => setConfirming(true)}>Borrar historial</button>
            </div>
          </div>

          {filtering && (
            <p className="hx-filtering" role="status">
              Mostrando {visible.length} de {total}
              <button type="button" onClick={clearFilters}>Quitar filtros</button>
            </p>
          )}

          {visible.length === 0 ? (
            <div className="empty-state"><p>No hay residuos con estos filtros.</p></div>
          ) : sort === 'recent' ? (
            groups.map((g) => (
              <section key={g.key} className="hx-group" aria-label={dayLabel(g.key)}>
                <h3 className="hx-day">{dayLabel(g.key)} <span>{g.items.length}</span></h3>
                <ul className="hx-list">{g.items.map((r) => renderItem(r, n++))}</ul>
              </section>
            ))
          ) : (
            <ul className="hx-list">{visible.map((r, i) => renderItem(r, i))}</ul>
          )}
        </>
      )}

      {confirming && (
        <Modal title="Borrar historial" onClose={() => setConfirming(false)}>
          <p>Se eliminarán tus {total} clasificaciones. Esta acción no se puede deshacer.</p>
          <div className="confirm-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setConfirming(false)}>Cancelar</button>
            <button type="button" className="btn btn-danger" disabled={busy} onClick={() => void run(clearHistory, () => { setConfirming(false); clearFilters(); })}>
              {busy ? 'Borrando…' : 'Borrar todo'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
