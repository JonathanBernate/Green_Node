import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ContainerDetail } from '../../components/containers/ContainerDetail';
import { DataSourceTag } from '../../components/common/DataSourceTag';
import { useContainers, useGateways } from '../../hooks/useData';
import { Container, getFillLevelColor } from '../../lib/domain';
import { COLLECTION_POINTS } from '../../mocks/collectionPoints';
import type { ContainerHealth } from '../../types';
import { deriveHealth, HEALTH_COLORS, HEALTH_LABELS } from '../../utils/status';

type BaseLayer = 'street' | 'satellite';
type HealthFilter = 'ALL' | ContainerHealth;

const BASE_LAYERS: Record<BaseLayer, { label: string; url: string; attribution: string; maxZoom: number }> = {
  street: {
    label: 'Calles',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  },
  satellite: {
    label: 'Satélite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Imágenes &copy; Esri, Maxar, Earthstar Geographics',
    maxZoom: 18,
  },
};

const FILTERS: HealthFilter[] = ['ALL', 'NORMAL', 'WARNING', 'CRITICAL', 'OFFLINE'];

const pinIcon = (c: Container, health: ContainerHealth, selected: boolean) =>
  L.divIcon({
    className: 'lf-pin-wrap',
    html: `<span class="lf-pin${selected ? ' sel' : ''}${health === 'OFFLINE' ? ' off' : ''}" style="background:${getFillLevelColor(c.fillLevel)}">${c.fillLevel}%</span>`,
    iconSize: [46, 26],
    iconAnchor: [23, 13],
  });

const gatewayIcon = L.divIcon({ className: 'lf-pin-wrap', html: '<span class="lf-gw"></span>', iconSize: [18, 18], iconAnchor: [9, 9] });

/** Mapa real (OpenStreetMap / satélite) de contenedores, gateways y puntos de acopio. */
export function MapTab() {
  const { containers, source } = useContainers();
  const gateways = useGateways();
  const gws = gateways.data?.data ?? [];

  const [selected, setSelected] = useState<Container | null>(null);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [base, setBase] = useState<BaseLayer>('street');
  const [filter, setFilter] = useState<HealthFilter>('ALL');
  const [query, setQuery] = useState('');
  const [showCoverage, setShowCoverage] = useState(true);
  const [showGateways, setShowGateways] = useState(true);
  const [showPoints, setShowPoints] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileRef = useRef<L.TileLayer | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const pointsRef = useRef<L.LayerGroup | null>(null);
  const meRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const fitted = useRef(false);
  const highlightRef = useRef<string | null>(null);
  highlightRef.current = highlight;
  const onSelectRef = useRef(setSelected);
  onSelectRef.current = setSelected;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return containers.filter(
      (c) =>
        (filter === 'ALL' || deriveHealth(c) === filter) &&
        (!q || c.id.toLowerCase().includes(q) || c.address.toLowerCase().includes(q)),
    );
  }, [containers, filter, query]);

  const counts = useMemo(() => {
    const m: Record<HealthFilter, number> = { ALL: containers.length, NORMAL: 0, WARNING: 0, CRITICAL: 0, OFFLINE: 0 };
    containers.forEach((c) => { m[deriveHealth(c)] += 1; });
    return m;
  }, [containers]);

  // Crear el mapa una sola vez
  useEffect(() => {
    if (!mapEl.current) return;
    const map = L.map(mapEl.current, { zoomControl: false }).setView([4.6097, -74.0817], 12);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.control.scale({ imperial: false }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    pointsRef.current = L.layerGroup();
    meRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; tileRef.current = null; };
  }, []);

  // Capa base (calles / satélite)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    tileRef.current?.remove();
    const b = BASE_LAYERS[base];
    tileRef.current = L.tileLayer(b.url, { maxZoom: b.maxZoom, attribution: b.attribution }).addTo(map);
    tileRef.current.bringToBack();
  }, [base]);

  const fitAll = () => {
    const map = mapRef.current;
    const pts: L.LatLngTuple[] = [...visible.map((c) => [c.latitude, c.longitude] as L.LatLngTuple), ...(showGateways ? gws.map((g) => [g.latitude, g.longitude] as L.LatLngTuple) : [])];
    if (map && pts.length > 0) map.flyToBounds(L.latLngBounds(pts), { padding: [50, 50], maxZoom: 16, duration: 0.8 });
  };

  // Marcadores de contenedores, gateways y cobertura
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    markersRef.current.clear();

    if (showGateways) {
      gws.forEach((g) => {
        if (showCoverage) {
          L.circle([g.latitude, g.longitude], {
            radius: g.coverageRadiusM, color: '#1D6FD1', weight: 1.5, dashArray: '6 6', fillColor: '#1D6FD1', fillOpacity: 0.08, interactive: false,
          }).addTo(layer);
        }
        L.marker([g.latitude, g.longitude], { icon: gatewayIcon, title: g.name })
          .bindPopup(`<b>${g.name}</b><br/>Gateway ${g.id}<br/>${g.nodeIds.length} nodos · cobertura de diseño ${g.coverageRadiusM} m`)
          .addTo(layer);
      });
    }

    visible.forEach((c) => {
      const h = deriveHealth(c);
      const marker = L.marker([c.latitude, c.longitude], { icon: pinIcon(c, h, c.id === highlightRef.current), title: c.id, riseOnHover: true }).addTo(layer);
      const box = document.createElement('div');
      const title = document.createElement('b');
      title.textContent = c.id;
      const addr = document.createElement('div');
      addr.textContent = c.address;
      const state = document.createElement('div');
      state.textContent = `${c.fillLevel}% · ${HEALTH_LABELS[h]}`;
      state.style.color = HEALTH_COLORS[h];
      state.style.fontWeight = '700';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lf-popup-btn';
      btn.textContent = 'Ver detalle';
      btn.onclick = () => onSelectRef.current(c);
      box.append(title, addr, state, btn);
      marker.bindPopup(box);
      marker.on('click', () => setHighlight(c.id));
      markersRef.current.set(c.id, marker);
    });

    if (!fitted.current && (visible.length > 0 || gws.length > 0)) {
      fitted.current = true;
      fitAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, gws, showCoverage, showGateways]);

  // Resalta el contenedor elegido sin reconstruir los marcadores (mantiene abierto el popup)
  useEffect(() => {
    visible.forEach((c) => markersRef.current.get(c.id)?.setIcon(pinIcon(c, deriveHealth(c), c.id === highlight)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlight]);

  // Puntos de acopio (opcional)
  useEffect(() => {
    const map = mapRef.current;
    const layer = pointsRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    if (!showPoints) { map.removeLayer(layer); return; }
    COLLECTION_POINTS.forEach((p) => {
      L.circleMarker([p.latitude, p.longitude], { radius: 7, color: '#fff', weight: 2, fillColor: p.kind === 'compostaje' ? '#2E9E5B' : '#1D6FD1', fillOpacity: 1 })
        .bindPopup(`<b>${p.name}</b><br/>${p.address}<br/>Recibe: ${p.accepts.join(', ') || 'No registrado'}`)
        .addTo(layer);
    });
    layer.addTo(map);
  }, [showPoints]);

  const focusContainer = (c: Container) => {
    setHighlight(c.id);
    const map = mapRef.current;
    const marker = markersRef.current.get(c.id);
    if (!map || !marker) return;
    map.flyTo([c.latitude, c.longitude], Math.max(map.getZoom(), 16), { duration: 0.7 });
    map.once('moveend', () => marker.openPopup());
    mapEl.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const locate = () => {
    setLocError(null);
    if (!navigator.geolocation) { setLocError('Tu navegador no permite geolocalización.'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const map = mapRef.current;
        const me = meRef.current;
        if (!map || !me) return;
        me.clearLayers();
        const ll: L.LatLngTuple = [pos.coords.latitude, pos.coords.longitude];
        L.circle(ll, { radius: pos.coords.accuracy, color: '#2563EB', weight: 1, fillOpacity: 0.1, interactive: false }).addTo(me);
        L.circleMarker(ll, { radius: 8, color: '#fff', weight: 3, fillColor: '#2563EB', fillOpacity: 1 }).bindTooltip('Estás aquí').addTo(me);
        map.flyTo(ll, 15, { duration: 0.8 });
      },
      () => setLocError('No se pudo obtener tu ubicación. Revisa el permiso del navegador.'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="screen wide">
      <header className="screen-header">
        <h2>Mapa</h2>
        <p className="screen-subtitle">
          {visible.length} de {containers.length} contenedores · {gws.length} gateways · <DataSourceTag source={source} />
        </p>
      </header>

      <div className="map-canvas live">
        <div className="map-toolbar">
          <div className="seg" role="group" aria-label="Tipo de mapa">
            {(Object.keys(BASE_LAYERS) as BaseLayer[]).map((k) => (
              <button key={k} type="button" className={base === k ? 'active' : ''} aria-pressed={base === k} onClick={() => setBase(k)}>
                {BASE_LAYERS[k].label}
              </button>
            ))}
          </div>
          <button type="button" className="tool-btn" onClick={locate}>Mi ubicación</button>
          <button type="button" className="tool-btn" onClick={fitAll}>Ver todo</button>
        </div>

        <div ref={mapEl} className="map-live" role="application" aria-label="Mapa interactivo de contenedores y gateways" />

        <div className="map-legend">
          <label className="check-inline"><input type="checkbox" checked={showGateways} onChange={(e) => setShowGateways(e.target.checked)} /> Gateways</label>
          <label className="check-inline"><input type="checkbox" checked={showCoverage} disabled={!showGateways} onChange={(e) => setShowCoverage(e.target.checked)} /> Cobertura de diseño</label>
          <label className="check-inline"><input type="checkbox" checked={showPoints} onChange={(e) => setShowPoints(e.target.checked)} /> Puntos de acopio (OSM)</label>
        </div>
        {locError && <div className="alert-box" role="alert">{locError}</div>}
        <span className="map-hint">
          El radio de cobertura es un parámetro de diseño, no una medición. Los nodos virtuales son simulación.
        </span>
      </div>

      <div className="container-panel">
        <input
          type="search"
          className="map-search"
          placeholder="Buscar contenedor o dirección…"
          aria-label="Buscar contenedor o dirección"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="chip-row">
          {FILTERS.map((f) => (
            <button key={f} type="button" className={`chip${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
              {f === 'ALL' ? 'Todos' : HEALTH_LABELS[f]} <b>{counts[f]}</b>
            </button>
          ))}
        </div>

        <div className="container-list">
          {visible.length === 0 && <p className="inference-meta">Ningún contenedor coincide con el filtro.</p>}
          {visible.map((c) => {
            const h = deriveHealth(c);
            return (
              <button key={c.id} className={`container-item${highlight === c.id ? ' sel' : ''}`} onClick={() => focusContainer(c)}>
                <span className="container-main">
                  <span className="status-dot" style={{ background: HEALTH_COLORS[h] }} aria-hidden="true" />
                  <span>
                    <span className="container-id">{c.id}</span>
                    <span className="container-addr">{c.address}</span>
                  </span>
                </span>
                <span className="fill-mini">
                  <span className="fill-mini-track" aria-hidden="true">
                    <span className="fill-mini-bar" style={{ width: `${c.fillLevel}%`, background: getFillLevelColor(c.fillLevel) }} />
                  </span>
                  <span className="fill-mini-val">{c.fillLevel}%</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {selected && <ContainerDetail container={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
