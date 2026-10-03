import type { DayBucket } from './historyUtils';

interface Props {
  days: DayBucket[];
  selected: string | null;
  onSelect: (key: string | null) => void;
}

/** Barras de los últimos 7 días. Pulsar una barra filtra la lista por ese día. */
export function ActivityChart({ days, selected, onSelect }: Props) {
  const max = Math.max(1, ...days.map((d) => d.count));
  return (
    <div className="activity" role="group" aria-label="Actividad de los últimos 7 días">
      {days.map((d, i) => (
        <button
          key={d.key}
          type="button"
          className={`activity-col${selected === d.key ? ' active' : ''}${i === days.length - 1 ? ' today' : ''}`}
          aria-pressed={selected === d.key}
          aria-label={`${d.short}: ${d.count} ${d.count === 1 ? 'residuo' : 'residuos'}`}
          onClick={() => onSelect(selected === d.key ? null : d.key)}
        >
          <span className="activity-val">{d.count || ''}</span>
          <span className="activity-bar-wrap">
            <span className="activity-bar" style={{ height: `${d.count === 0 ? 4 : 10 + (d.count / max) * 90}%` }} data-empty={d.count === 0} />
          </span>
          <span className="activity-day">{d.short}</span>
        </button>
      ))}
    </div>
  );
}
