'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { LayerGroup, Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';

type ProvinceFeature = { type: 'Feature'; properties?: { province?: string }; geometry: { type: string; coordinates: unknown } };
type ProvinceCollection = { type: 'FeatureCollection'; features: ProvinceFeature[] };

type EventRecord = {
  id: string; date: string; time: string | null; year: number; victims: number;
  lat: number | null; lng: number | null; province: string | null; canton: string | null;
  district: string | null; circuit: string | null; subcircuit: string | null;
  area: string | null; place: string | null; placeType: string | null;
  weapon: string | null; weaponType: string | null; motivation: string | null;
  observedMotivation: string | null; ageMin: number | null; ageMax: number | null;
  men: number; women: number;
};

const yearColors: Record<number, string> = { 2023: '#f2d79b', 2024: '#f4b8a8', 2025: '#c8b7e8' };
const formatDate = (date: string) => new Intl.DateTimeFormat('es-EC', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`)).replace('.', '');
const display = (value: string | null) => value || 'No informado';
const normalizeName = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

export default function MapExplorer() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const points = useRef<LayerGroup | null>(null);
  const provinceShape = useRef<LayerGroup | null>(null);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [boundaries, setBoundaries] = useState<ProvinceCollection | null>(null);
  const [selected, setSelected] = useState<EventRecord | null>(null);
  const [year, setYear] = useState('todos');
  const [province, setProvince] = useState('todas');
  const [area, setArea] = useState('todas');
  const [minimumVictims, setMinimumVictims] = useState(3);
  const [query, setQuery] = useState('');
  const [listOpen, setListOpen] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/eventos.json`).then(async (response) => await response.json() as EventRecord[]).then((data) => {
      setEvents(data);
    });
    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/provincias.geojson`).then(async (response) => await response.json() as ProvinceCollection).then(setBoundaries);
  }, []);

  const provinces = useMemo(() => Array.from(new Set(events.map((event) => event.province).filter(Boolean) as string[])).sort(), [events]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('es');
    return events.filter((event) => {
      const haystack = [event.province, event.canton, event.district, event.circuit, event.subcircuit, event.id].join(' ').toLocaleLowerCase('es');
      return (year === 'todos' || event.year === Number(year)) && (province === 'todas' || event.province === province)
        && (area === 'todas' || event.area === area) && event.victims >= minimumVictims && (!needle || haystack.includes(needle));
    });
  }, [events, year, province, area, minimumVictims, query]);

  const mapped = filtered.filter((event) => event.lat !== null && event.lng !== null);
  const victims = filtered.reduce((sum, event) => sum + event.victims, 0);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    let live = true;
    import('leaflet').then((L) => {
      if (!live || !mapContainer.current) return;
      const instance = L.map(mapContainer.current, { zoomControl: false, minZoom: 6 }).setView([-1.55, -78.4], 7);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; OpenStreetMap' }).addTo(instance);
      L.control.zoom({ position: 'bottomright' }).addTo(instance);
      points.current = L.layerGroup().addTo(instance);
      map.current = instance;
    });
    return () => { live = false; map.current?.remove(); map.current = null; };
  }, []);

  useEffect(() => {
    if (!map.current || !points.current) return;
    let cancelled = false;
    import('leaflet').then((L) => {
      if (cancelled || !map.current || !points.current) return;
      points.current.clearLayers();
      mapped.forEach((event) => {
        const marker = L.circleMarker([event.lat!, event.lng!], {
          radius: Math.min(18, 5 + event.victims * .85),
          color: '#111',
          weight: 1.25,
          fillColor: yearColors[event.year],
          fillOpacity: .86,
        }).addTo(points.current!);
        marker.bindTooltip(`<strong>${event.canton || event.province || 'Lugar no informado'}</strong><br>${event.victims} víctimas · ${formatDate(event.date)}`, { className: 'map-tooltip' });
        marker.on('click', () => setSelected(event));
      });
    });
    return () => { cancelled = true; };
  }, [mapped]);

  useEffect(() => {
    if (!map.current || !boundaries) return;
    let cancelled = false;
    import('leaflet').then((L) => {
      const instance = map.current;
      if (cancelled || !instance) return;
      if (provinceShape.current) {
        provinceShape.current.removeFrom(instance);
        provinceShape.current = null;
      }
      if (province === 'todas') {
        instance.flyTo([-1.55, -78.4], 7, { duration: .7 });
        return;
      }
      const feature = boundaries.features.find((item) => normalizeName(String(item.properties?.province || '')) === normalizeName(province));
      if (!feature) return;
      const layer = L.geoJSON(feature as Parameters<typeof L.geoJSON>[0], {
        interactive: false,
        style: { color: '#111', weight: 1.5, fillColor: '#c8b7e8', fillOpacity: .3 },
      }).addTo(instance);
      layer.bringToBack();
      provinceShape.current = layer;
      instance.fitBounds(layer.getBounds(), { padding: [32, 32], maxZoom: 9 });
    });
    return () => { cancelled = true; };
  }, [province, boundaries]);

  const selectEvent = (event: EventRecord) => {
    setSelected(event); setListOpen(false);
    if (event.lat !== null && event.lng !== null) map.current?.flyTo([event.lat, event.lng], 14, { duration: .9 });
  };
  const reset = () => {
    setYear('todos'); setProvince('todas'); setArea('todas'); setMinimumVictims(3); setQuery('');
    setSelected(null);
    map.current?.flyTo([-1.55, -78.4], 7, { duration: .8 });
  };

  return <main className="atlas-shell">
    <header className="masthead">
      <a className="identity" href="#top" aria-label="Atlas de la violencia — inicio"><span className="identity-mark">AM</span><span>ATLAS DE LOS<br /><b>ASESINATOS MÚLTIPLES</b></span></a>
      <div className="masthead-meta"><span>ECUADOR</span><strong>2023—2025</strong></div>
    </header>
    <section className="hero" id="top"><div><p className="kicker">Territorialización de hechos</p><h1>Donde la violencia<br /><em>se concentra.</em></h1></div><p className="hero-copy">Explore la distribución territorial de asesinatos múltiples, filtre por período y lugar y consulte cada hecho registrado en la base.</p></section>
    <section className="summary" aria-label="Resumen de los datos filtrados">
      <div><strong>{filtered.length.toLocaleString('es-EC')}</strong><span>asesinatos múltiples</span></div><div><strong>{victims.toLocaleString('es-EC')}</strong><span>víctimas</span></div><div><strong>{province === 'todas' ? '—' : victims.toLocaleString('es-EC')}</strong><span>{province === 'todas' ? 'seleccione una provincia' : `víctimas en ${province}`}</span></div>
      <p>El tamaño del círculo representa el número de víctimas. El color identifica el año.</p>
    </section>
    <section className="workspace">
      <aside className="filters" aria-label="Filtros del mapa">
        <div className="section-heading"><span>01</span><h2>Filtros</h2><button onClick={reset}>Limpiar</button></div>
        <label>Buscar territorio<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cantón, distrito, circuito…" /></label>
        <div className="filter-grid"><label>Año<select value={year} onChange={(event) => setYear(event.target.value)}><option value="todos">Todos</option><option>2025</option><option>2024</option><option>2023</option></select></label><label>Área<select value={area} onChange={(event) => setArea(event.target.value)}><option value="todas">Todas</option><option value="URBANO">Urbana</option><option value="RURAL">Rural</option></select></label></div>
        <label>Provincia<select value={province} onChange={(event) => { setProvince(event.target.value); setSelected(null); }}><option value="todas">Todas las provincias</option>{provinces.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="range-label"><span>Víctimas mínimas <b>{minimumVictims}</b></span><input type="range" min="3" max="15" value={minimumVictims} onChange={(event) => setMinimumVictims(Number(event.target.value))} /></label>
        <div className="legend"><span><i style={{ background: yearColors[2025] }} />2025</span><span><i style={{ background: yearColors[2024] }} />2024</span><span><i style={{ background: yearColors[2023] }} />2023</span></div>
        <button className="result-button" onClick={() => setListOpen(true)}>{filtered.length} hechos encontrados <span>→</span></button>
      </aside>
      <div className="map-stage" aria-label="Mapa de hechos en Ecuador">
        <div ref={mapContainer} className="map" /><div className="map-caption">Base cartográfica: OpenStreetMap · Coordenadas de la fuente</div>
        {selected && <article className="detail-card" aria-live="polite"><button className="detail-close" onClick={() => setSelected(null)} aria-label="Cerrar detalles">×</button><div className="detail-top"><span style={{ color: yearColors[selected.year] }}>{formatDate(selected.date)}</span><b>{selected.victims} víctimas</b></div><h2>{display(selected.canton)}</h2><p>{display(selected.province)} · {display(selected.area)}</p><dl><div><dt>Lugar</dt><dd>{display(selected.place)}</dd></div><div><dt>Arma</dt><dd>{display(selected.weapon)}</dd></div><div><dt>Motivación presunta</dt><dd>{display(selected.observedMotivation || selected.motivation)}</dd></div><div><dt>Territorio policial</dt><dd>{display(selected.subcircuit || selected.circuit)}</dd></div></dl><small>ID del hecho: {selected.id} {selected.time ? `· ${selected.time}` : ''}</small></article>}
      </div>
    </section>
    <section className="method-note"><span>02</span><h2>Lectura responsable</h2><p>Los puntos representan hechos, no víctimas individuales. Nueve hechos de la base no tienen coordenadas válidas y se mantienen en los indicadores y resultados. La visualización reproduce las clasificaciones de la fuente, sin inferir causalidad.</p></section>
    {listOpen && <div className="drawer-backdrop" onClick={() => setListOpen(false)}><aside className="drawer" onClick={(event) => event.stopPropagation()} aria-label="Lista de hechos"><header><div><span>RESULTADOS</span><h2>{filtered.length} hechos</h2></div><button onClick={() => setListOpen(false)} aria-label="Cerrar lista">×</button></header><div className="drawer-list">{filtered.map((event) => <button key={event.id} onClick={() => selectEvent(event)}><span className="event-date">{formatDate(event.date)}</span><strong>{display(event.canton)}</strong><small>{display(event.province)} · {event.victims} víctimas {event.lat === null ? '· sin coordenadas' : ''}</small></button>)}</div></aside></div>}
    <footer><span>Fuente: “Asesinatos múltiples respaldo 2025 CH”</span><span>Actualización de la base: 28 sep 2025</span></footer>
  </main>;
}
