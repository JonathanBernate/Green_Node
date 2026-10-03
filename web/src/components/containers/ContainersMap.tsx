import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useContainerLocations } from '../../hooks/useContainerLocations';
import type { ContainerLocation, LocationStatus } from '../../services/api';
import { formatAgeSeconds } from '../../utils/status';

export const LOCATION_LABELS: Record<LocationStatus, string> = {
  online: 'En línea',
  stale: 'Sin actualizar',
  none: 'Sin ubicación',
};
export const LOCATION_COLORS: Record<LocationStatus, string> = {
  online: '#16A34A',
  stale: '#F5A524',
  none: '#8A98A0',
};

const hasPosition = (c: ContainerLocation): c is ContainerLocation & { latitude: number; longitude: number } =>
  c.latitude != null && c.longitude != null;

function pinIcon(c: ContainerLocation, selected: boolean) {
  const el = document.createElement('span');
  el.className = `loc-pin ${c.status}${selected ? ' sel' : ''}`;
  el.textContent = c.container_id; // textContent: el id viene del servidor
  return L.divIcon({ className: 'lf-pin-wrap', html: el, iconSize: [84, 26], iconAnchor: [42, 13] });
}

/** Mapa en tiempo casi real (polling) de las ubicaciones que reportan los contenedores. */
export function ContainersMap() {
  const q = useContainerLocations();
  const items = useMemo(() => q.data?.data ?? [], [q.data]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = items.find((c) => c.container_id === selectedId) ?? null;

  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markers = useRef<Map<string, L.Marker>>(new Map());
  const fitted = useRef(false);
  const selectRef = useRef(setSelectedId);
  selectRef.current = setSelectedId;

  const counts = useMemo(() => {
    const m: Record<LocationStatus, number> = { online: 0, stale: 0, none: 0 };
    items.forEach((c) => { m[c.status] += 1; });
    return m;
  }, [items]);

  // Mapa: se crea una sola vez
  useEffect(() => {
    if (!mapEl.current) return;
    const map = L.map(mapEl.current, { zoomControl: false }).setView([4.6097, -74.0817], 12);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    mapRef.current = map;
    const current = markers.current;
    return () => { map.remove(); mapRef.current = null; current.clear(); fitted.current = false; };
  }, []);

  // Sincroniza marcadores sin reconstruirlos: mover/actualizar los existentes, quitar los que ya no están
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const live = new Set<string>();
    items.filter(hasPosition).forEach((c) => {
      live.add(c.container_id);
      const ll: L.LatLngTuple = [c.latitude, c.longitude];
      const icon = pinIcon(c, c.container_id === selectedId);
      const existing = markers.current.get(c.container_id);
      if (existing) {
        existing.setLatLng(ll);
        existing.setIcon(icon);
      } else {
        const m = L.marker(ll, { icon, title: c.container_id, riseOnHover: true }).addTo(map);
        m.on('click', () => selectRef.current(c.container_id));
        markers.current.set(c.container_id, m);
      }
    });
    markers.current.forEach((m, id) => {
      if (!live.has(id)) { m.remove(); markers.current.delete(id); }
    });

    if (!fitted.current && live.size > 0) {
      fitted.current = true;
      map.fitBounds(L.latLngBounds(items.filter(hasPosition).map((c) => [c.latitude, c.longitude] as L.LatLngTuple)), { padding: [50, 50], maxZoom: 16 });
    }
  }, [items, selectedId]);

  const select = (c: ContainerLocation) => {
    setSelectedId(c.container_id);
    if (hasPosition(c)) mapRef.current?.flyTo([c.latitude, c.longitude], Math.max(mapRef.current.getZoom(), 16), { duration: 0.7 });
  };

  return (
    <section className="live-map" aria-label="Ubicación de contenedores en tiempo real">
      <div className="live-map-head">
        <h3>Ubicación en tiempo real</h3>
        <div className="loc-legend" aria-label="Leyenda">
          {(Object.keys(LOCATION_LABELS) as LocationStatus[]).map((s) => (
            <span key={s}><i className={`loc-dot ${s}`} aria-hidden="true" />{LOCATION_LABELS[s]} <b>{counts[s]}</b></span>
          ))}
        </div>
      </div>

      {q.isError && <div className="alert-box" role="alert">No fue posible cargar las ubicaciones. Se reintentará automáticamente.</div>}

      <div className="live-map-body">
        <div className="map-live" ref={mapEl} role="application" aria-label="Mapa de ubicación de contenedores" />

        <div className="live-map-side">
          {selected && (
            <div className="loc-info" role="region" aria-label={`Información de ${selected.container_id}`}>
              <div className="loc-info-head">
                <b>{selected.name}</b>
                <span className="health-pill" style={{ background: LOCATION_COLORS[selected.status] }}>{LOCATION_LABELS[selected.status]}</span>
              </div>
              <p className="container-addr">{selected.address ?? selected.container_id}</p>
              <dl className="cont-meta">
                <div><dt>Última actualización</dt><dd>{formatAgeSeconds(selected.age_seconds)}</dd></div>
                <div><dt>Coordenadas</dt><dd>{hasPosition(selected) ? `${selected.latitude.toFixed(5)}, ${selected.longitude.toFixed(5)}` : '—'}</dd></div>
                <div><dt>Precisión</dt><dd>{selected.accuracy != null ? `±${Math.round(selected.accuracy)} m` : '—'}</dd></div>
                <div><dt>Clasificaciones</dt><dd>{selected.classifications_count}</dd></div>
              </dl>
            </div>
          )}

          <ul className="loc-list">
            {items.map((c) => (
              <li key={c.container_id}>
                <button type="button" className={`container-item${c.container_id === selectedId ? ' sel' : ''}`} onClick={() => select(c)}>
                  <span className="container-main">
                    <i className={`loc-dot ${c.status}`} aria-hidden="true" />
                    <span>
                      <span className="container-id">{c.container_id}</span>
                      <span className="container-addr">{c.name}</span>
                    </span>
                  </span>
                  <span className="loc-state" style={{ color: LOCATION_COLORS[c.status] }}>
                    {c.status === 'none' ? LOCATION_LABELS.none : formatAgeSeconds(c.age_seconds)}
                  </span>
                </button>
              </li>
            ))}
            {!q.isLoading && items.length === 0 && <li className="inference-meta">Aún no hay contenedores registrados.</li>}
          </ul>
        </div>
      </div>
    </section>
  );
}
