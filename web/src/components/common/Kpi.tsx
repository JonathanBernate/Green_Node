import type { DataSource } from '../../types';
import { DataSourceTag } from './DataSourceTag';

interface Props {
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'default' | 'good' | 'warn' | 'bad';
  source?: DataSource;
}

export function Kpi({ label, value, hint, tone = 'default', source }: Props) {
  return (
    <div className={`kpi kpi-${tone}`}>
      <span className="kpi-label">{label}</span>
      <span className="kpi-value">{value}</span>
      {hint && <span className="kpi-hint">{hint}</span>}
      {source && source !== 'REAL' && <DataSourceTag source={source} compact />}
    </div>
  );
}
