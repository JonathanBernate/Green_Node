import { useQuery } from '@tanstack/react-query';
import { CONTAINER_STATUS_LABELS, Container, getFillLevelColor, WASTE_TYPE_ICONS, WASTE_TYPE_LABELS } from '../../lib/domain';
import { telemetryService } from '../../services/api';
import { formatAgo, HEALTH_COLORS, HEALTH_LABELS, deriveHealth } from '../../utils/status';
import { DataSourceTag } from '../common/DataSourceTag';
import { Modal } from '../common/Modal';
import { LineChart } from '../metrics/charts';

export function ContainerDetail({ container, onClose }: { container: Container; onClose: () => void }) {
  const health = deriveHealth(container);
  const series = useQuery({
    queryKey: ['telemetry', container.id, container.fillLevel],
    queryFn: () => telemetryService.series(container.id, container.fillLevel),
  });

  return (
    <Modal title={container.id} onClose={onClose}>
      <p className="container-addr">{container.address}</p>

      <div className="detail-fill">
        <div className="fill-mini-track big" aria-hidden="true">
          <div className="fill-mini-bar" style={{ width: `${container.fillLevel}%`, background: getFillLevelColor(container.fillLevel) }} />
        </div>
        <span className="fill-big-val">{container.fillLevel}%</span>
      </div>

      <div className="detail-grid">
        <div>
          <span className="detail-label">Estado</span>
          <span className="detail-value" style={{ color: HEALTH_COLORS[health] }}>{HEALTH_LABELS[health]}</span>
        </div>
        <div>
          <span className="detail-label">Estado reportado</span>
          <span className="detail-value">{CONTAINER_STATUS_LABELS[container.status]}</span>
        </div>
        <div>
          <span className="detail-label">Batería</span>
          <span className="detail-value">{container.batteryLevel != null ? `${container.batteryLevel}%` : 'No reportada'}</span>
        </div>
        <div>
          <span className="detail-label">Gateway</span>
          <span className="detail-value">{container.gatewayId ?? '—'}</span>
        </div>
        <div>
          <span className="detail-label">Capacidad</span>
          <span className="detail-value">{container.capacity} L</span>
        </div>
        <div>
          <span className="detail-label">Última comunicación</span>
          <span className="detail-value">{formatAgo(container.lastUpdated)}</span>
        </div>
        <div>
          <span className="detail-label">Latitud</span>
          <span className="detail-value">{container.latitude.toFixed(4)}</span>
        </div>
        <div>
          <span className="detail-label">Longitud</span>
          <span className="detail-value">{container.longitude.toFixed(4)}</span>
        </div>
      </div>

      <span className="detail-label">Nivel de llenado (últimas horas)</span>
      {series.data && (
        <>
          <LineChart values={series.data.data.map((p) => p.fillLevel)} unit="%" label={`Nivel de llenado de ${container.id}`} />
          <DataSourceTag source={series.data.source} />
        </>
      )}

      <span className="detail-label" style={{ marginTop: 12 }}>Residuos aceptados</span>
      <div className="waste-chips">
        {container.wasteTypes.map((wt) => (
          <span className="waste-chip" key={wt}>{WASTE_TYPE_ICONS[wt]} {WASTE_TYPE_LABELS[wt]}</span>
        ))}
      </div>

      {container.virtual && <p className="inference-meta">Nodo virtual: el contenedor no existe físicamente (simulación).</p>}
    </Modal>
  );
}
