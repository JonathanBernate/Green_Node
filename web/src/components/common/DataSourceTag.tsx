import type { DataSource } from '../../types';

const TEXT: Record<DataSource, string> = {
  REAL: 'DATOS REALES',
  SIMULATION: 'DATOS DE SIMULACIÓN',
  ESTIMATED: 'ESTIMADO',
  REFERENCE: 'REFERENCIAL',
};

/** Etiqueta obligatoria junto a cualquier dato que no sea REAL. */
export function DataSourceTag({ source, compact }: { source: DataSource; compact?: boolean }) {
  return (
    <span className={`source-tag source-${source.toLowerCase()}`} title={TEXT[source]}>
      {compact && source === 'SIMULATION' ? 'SIMULACIÓN' : TEXT[source]}
    </span>
  );
}
