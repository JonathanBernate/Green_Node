import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DataSourceTag } from '../../components/common/DataSourceTag';
import { COLLECTION_POINTS, PointKind } from '../../mocks/collectionPoints';
const KIND_LABEL: Record<PointKind, string> = { acopio: 'Acopio', compostaje: 'Compostaje' };
const KIND_COLOR: Record<PointKind, string> = { acopio: '#1D6FD1', compostaje: '#2E9E5B' };
type Filter = 'all' | PointKind;

export function CollectionPointsPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<Map<string, L.CircleMarker>>(new Map());

  const points = useMemo(
    () => COLLECTION_POINTS.filter((p) => filter === 'all' || p.kind === filter),
    [filter],
  );

  // Crea el mapa (OpenStreetMap, gratuito y sin clave)
  useEffect(() => {
    if (!mapEl.current) return;
    const map = L.map(mapEl.current).setView([4.6486, -74.078], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Sincroniza marcadores con el filtro
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    markersRef.current.clear();
    points.forEach((p) => {
      const marker = L.circleMarker([p.latitude, p.longitude], {
        radius: 10,
        color: '#fff',
        weight: 2,
        fillColor: KIND_COLOR[p.kind],
        fillOpacity: 1,
      }).addTo(layer);
      const box = document.createElement('div');
      const title = document.createElement('b');
      title.textContent = p.name;
      const addr = document.createElement('div');
      addr.textContent = `${p.address} · ${p.schedule}`;
      const acc = document.createElement('div');
      acc.textContent = `Recibe: ${p.accepts.join(', ')}`;
      box.append(title, addr, acc);
      marker.bindPopup(box);
      marker.on('click', () => setSelectedId(p.id));
      markersRef.current.set(p.id, marker);
    });
    if (points.length > 0) map.fitBounds(L.latLngBounds(points.map((p) => [p.latitude, p.longitude])), { padding: [40, 40] });
  }, [points]);

  // Abre el popup del punto elegido en el listado
  useEffect(() => {
    const marker = selectedId ? markersRef.current.get(selectedId) : null;
    if (!marker) return;
    marker.openPopup();
    mapRef.current?.panTo(marker.getLatLng());
  }, [selectedId]);

  const counts = {
    all: COLLECTION_POINTS.length,
    acopio: COLLECTION_POINTS.filter((p) => p.kind === 'acopio').length,
    compostaje: COLLECTION_POINTS.filter((p) => p.kind === 'compostaje').length,
  };

  return (
    <div className="screen wide">
      <header className="screen-header">
        <h2>Puntos de acopio y compostaje</h2>
        <p className="screen-subtitle">
          {points.length} puntos · <DataSourceTag source="SIMULATION" />
        </p>
      </header>

      <div className="notice-sim" role="note">
        <b>Ubicaciones de ejemplo.</b> No son puntos de acopio verificados; se reemplazan por datos reales cuando el backend los exponga.
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }}>
        {(['all', 'acopio', 'compostaje'] as Filter[]).map((f) => (
          <button key={f} type="button" className={`chip${filter === f ? ' active' : ''}`} onClick={() => { setFilter(f); setSelectedId(null); }}>
            {f === 'all' ? 'Todos' : KIND_LABEL[f]} <b>{counts[f]}</b>
          </button>
        ))}
      </div>

      <div
        ref={mapEl}
        role="application"
        aria-label="Mapa de puntos de acopio y compostaje"
        style={{ width: '100%', height: 420, borderRadius: 16, overflow: 'hidden', zIndex: 0 }}
      />

      <section className="panel" style={{ marginTop: 14 }}>
        <h3 className="section-title">Listado</h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
          {points.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => setSelectedId(p.id)}
                style={{
                  width: '100%', textAlign: 'left', cursor: 'pointer', background: '#fff', borderRadius: 12, padding: 12,
                  border: `1.5px solid ${selectedId === p.id ? KIND_COLOR[p.kind] : 'var(--line)'}`,
                }}
              >
                <b style={{ color: KIND_COLOR[p.kind] }}>{KIND_LABEL[p.kind]}</b> · <b>{p.name}</b>
                <div className="inference-meta">{p.address} · {p.schedule}</div>
                <div className="inference-meta">Recibe: {p.accepts.join(', ')}</div>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
