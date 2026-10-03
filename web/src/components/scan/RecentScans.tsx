import { Link } from 'react-router-dom';
import { useAppStore } from '../../lib/appStore';
import { BIN_LABELS, WASTE_TYPE_BIN, WASTE_TYPE_ICONS, WASTE_TYPE_LABELS } from '../../lib/domain';
import { formatAgo } from '../../utils/status';

/** Los últimos escaneos del usuario, con acceso rápido al historial completo. */
export function RecentScans() {
  const { history } = useAppStore();
  const recent = history.slice(0, 3);
  if (recent.length === 0) return null;
  return (
    <section className="recent" aria-label="Escaneos recientes">
      <div className="recent-head">
        <h3>Tus últimos escaneos</h3>
        <Link to="/history">Ver historial →</Link>
      </div>
      <ul>
        {recent.map((r) => {
          const bin = WASTE_TYPE_BIN[r.wasteType];
          return (
            <li key={r.id}>
              <span className="recent-icon" aria-hidden="true">{WASTE_TYPE_ICONS[r.wasteType]}</span>
              <span className="recent-text">
                <b>{WASTE_TYPE_LABELS[r.wasteType]}</b>
                <small>{formatAgo(r.timestamp)}</small>
              </span>
              <span className={`bin-pill bin-${bin}`}>{BIN_LABELS[bin].replace('Caneca ', '')}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
