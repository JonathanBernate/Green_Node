import type { ConnectionStatus } from '../../types';

const LABEL: Record<ConnectionStatus, string> = {
  ONLINE: 'En línea',
  CONNECTING: 'Conectando',
  OFFLINE: 'Sin conexión',
  SIMULATION: 'Simulación',
  ERROR: 'Error',
};

export function ConnectionBadge({ status }: { status: ConnectionStatus }) {
  return (
    <span className={`conn-badge conn-${status.toLowerCase()}`} role="status" aria-live="polite">
      <span className="conn-dot" aria-hidden="true" />
      {LABEL[status]}
    </span>
  );
}
