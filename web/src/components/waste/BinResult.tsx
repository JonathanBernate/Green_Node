import { BIN_COLORS, BIN_DESCRIPTIONS, BIN_LABELS, Bin } from '../../lib/domain';

interface Props {
  bin: Bin;
  /** El modelo no está seguro: se muestra como sugerencia. */
  uncertain?: boolean;
  compact?: boolean;
}

/** Indica en cuál de las tres canecas va el residuo: blanca, verde o negra. */
export function BinResult({ bin, uncertain, compact }: Props) {
  return (
    <div className={`bin-result bin-${bin}${compact ? ' compact' : ''}${uncertain ? ' uncertain' : ''}`} role="status" aria-label={`${uncertain ? 'Probablemente va en la' : 'Va en la'} ${BIN_LABELS[bin]}`}>
      <span className="bin-can" aria-hidden="true">
        <i className="bin-lid" style={{ background: BIN_COLORS[bin] }} />
        <i className="bin-body" style={{ background: BIN_COLORS[bin] }} />
      </span>
      <span className="bin-result-text">
        <small>{uncertain ? 'Probablemente va en la' : 'Deposítalo en la'}</small>
        <b>{BIN_LABELS[bin]}</b>
        {!compact && <em>{BIN_DESCRIPTIONS[bin]}</em>}
      </span>
    </div>
  );
}
