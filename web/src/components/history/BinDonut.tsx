import { BIN_COLORS, BIN_ORDER, Bin } from '../../lib/domain';

const R = 52;
const C = 2 * Math.PI * R;
const GAP = 3;

interface Props {
  counts: Record<Bin, number>;
  active: Bin | null;
  onSelect: (b: Bin | null) => void;
}

/** Dona SVG con la proporción de residuos por caneca. Los segmentos son clicables. */
export function BinDonut({ counts, active, onSelect }: Props) {
  const total = BIN_ORDER.reduce((s, b) => s + counts[b], 0);
  let offset = 0;
  const shown = active ? counts[active] : total;

  return (
    <div className="donut">
      <svg viewBox="0 0 140 140" role="img" aria-label={`Residuos por caneca: ${BIN_ORDER.map((b) => `${b} ${counts[b]}`).join(', ')}`}>
        <circle cx="70" cy="70" r={R} className="donut-track" />
        {total > 0 &&
          BIN_ORDER.map((b) => {
            const len = (counts[b] / total) * C;
            const seg = (
              <circle
                key={b}
                cx="70"
                cy="70"
                r={R}
                className={`donut-seg${active && active !== b ? ' dim' : ''}`}
                stroke={BIN_COLORS[b]}
                strokeDasharray={`${Math.max(len - (len < C ? GAP : 0), 0)} ${C}`}
                strokeDashoffset={-offset}
                onClick={() => onSelect(active === b ? null : b)}
              />
            );
            offset += len;
            return len > 0 ? seg : null;
          })}
      </svg>
      <div className="donut-center">
        <b>{shown}</b>
        <span>{active ? 'en esta caneca' : 'clasificados'}</span>
      </div>
    </div>
  );
}
