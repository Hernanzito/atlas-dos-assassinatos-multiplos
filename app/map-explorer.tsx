'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { LayerGroup, Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';

type EventRecord = {
  id: string; date: string; time: string | null; year: number; victims: number;
  lat: number | null; lng: number | null; province: string | null; canton: string | null;
  district: string | null; circuit: string | null; subcircuit: string | null;
  area: string | null; place: string | null; placeType: string | null;
  weapon: string | null; weaponType: string | null; motivation: string | null;
  observedMotivation: string | null; ageMin: number | null; ageMax: number | null;
  men: number; women: number;
};

const yearColors: Record<number, string> = { 2023: '#d8a759', 2024: '#f06a47', 2025: '#a52c3e' };
const formatDate = (date: string) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`)).replace('.', '');
const display = (value: string | null) => value || 'Não informado';

export default function MapExplorer() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const points = useRef<LayerGroup | null>(null);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [selected, setSelected] = useState<EventRecord | null>(null);
  const [year, setYear] = useState('todos');
  const [province, setProvince] = useState('todas');
  const [area, setArea] = useState('todas');
  const [minimumVictims, setMinimumVictims] = useState(3);
  const [query, setQuery] = useState('');
  const [listOpen, setListOpen] = useState(false);

  useEffect(() => {
    fetch('/eventos.json').then(async (response) => await response.json() as EventRecord[]).then((data) => {
      setEvents(data);
      setSelected(data.find((event) => event.lat !== null) || data[0] || null);
    });
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
        const marker = L.circleMarker([event.lat!, event.lng!], { radius: Math.min(18, 5 + event.victims * .85), color: '#fff9ef', weight: 1.5, fillColor: yearColors[event.year], fillOpacity: .88 }).addTo(points.current!);
        marker.bindTooltip(`<strong>${event.canton || event.province || 'Local não informado'}</strong><br>${event.victims} vítimas · ${formatDate(event.date)}`, { className: 'map-tooltip' });
        marker.on('click', () => setSelected(event));
      });
    });
    return () => { cancelled = true; };
  }, [mapped]);

  const selectEvent = (event: EventRecord) => {
    setSelected(event); setListOpen(false);
    if (event.lat !== null && event.lng !== null) map.current?.flyTo([event.lat, event.lng], 14, { duration: .9 });
  };
  const reset = () => {
    setYear('todos'); setProvince('todas'); setArea('todas'); setMinimumVictims(3); setQuery('');
    map.current?.flyTo([-1.55, -78.4], 7, { duration: .8 });
  };

  return <main className="atlas-shell">
    <header className="masthead">
      <a className="identity" href="#top" aria-label="Atlas da violência — início"><span className="identity-mark">AM</span><span>ATLAS DOS<br /><b>ASSASSINATOS MÚLTIPLOS</b></span></a>
      <div className="masthead-meta"><span>ECUADOR</span><strong>2023—2025</strong></div>
    </header>
    <section className="hero" id="top"><div><p className="kicker">Territorialização de ocorrências</p><h1>Onde a violência<br /><em>se concentra.</em></h1></div><p className="hero-copy">Explore a distribuição territorial de assassinatos múltiplos, filtre por período e lugar e consulte cada ocorrência registrada na base.</p></section>
    <section className="summary" aria-label="Resumo dos dados filtrados">
      <div><strong>{filtered.length.toLocaleString('pt-BR')}</strong><span>ocorrências</span></div><div><strong>{victims.toLocaleString('pt-BR')}</strong><span>vítimas</span></div><div><strong>{mapped.length.toLocaleString('pt-BR')}</strong><span>pontos no mapa</span></div>
      <p>O tamanho do círculo representa o número de vítimas. A cor identifica o ano.</p>
    </section>
    <section className="workspace">
      <aside className="filters" aria-label="Filtros do mapa">
        <div className="section-heading"><span>01</span><h2>Filtros</h2><button onClick={reset}>Limpar</button></div>
        <label>Buscar território<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cantão, distrito, circuito…" /></label>
        <div className="filter-grid"><label>Ano<select value={year} onChange={(event) => setYear(event.target.value)}><option value="todos">Todos</option><option>2025</option><option>2024</option><option>2023</option></select></label><label>Área<select value={area} onChange={(event) => setArea(event.target.value)}><option value="todas">Todas</option><option value="URBANO">Urbana</option><option value="RURAL">Rural</option></select></label></div>
        <label>Província<select value={province} onChange={(event) => setProvince(event.target.value)}><option value="todas">Todas as províncias</option>{provinces.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="range-label"><span>Vítimas mínimas <b>{minimumVictims}</b></span><input type="range" min="3" max="15" value={minimumVictims} onChange={(event) => setMinimumVictims(Number(event.target.value))} /></label>
        <div className="legend"><span><i style={{ background: yearColors[2025] }} />2025</span><span><i style={{ background: yearColors[2024] }} />2024</span><span><i style={{ background: yearColors[2023] }} />2023</span></div>
        <button className="result-button" onClick={() => setListOpen(true)}>{filtered.length} ocorrências encontradas <span>→</span></button>
      </aside>
      <div className="map-stage" aria-label="Mapa das ocorrências no Equador">
        <div ref={mapContainer} className="map" /><div className="map-caption">Base cartográfica: OpenStreetMap · Coordenadas da fonte</div>
        {selected && <article className="detail-card" aria-live="polite"><button className="detail-close" onClick={() => setSelected(null)} aria-label="Fechar detalhes">×</button><div className="detail-top"><span style={{ color: yearColors[selected.year] }}>{formatDate(selected.date)}</span><b>{selected.victims} vítimas</b></div><h2>{display(selected.canton)}</h2><p>{display(selected.province)} · {display(selected.area)}</p><dl><div><dt>Local</dt><dd>{display(selected.place)}</dd></div><div><dt>Arma</dt><dd>{display(selected.weapon)}</dd></div><div><dt>Motivação presumida</dt><dd>{display(selected.observedMotivation || selected.motivation)}</dd></div><div><dt>Território policial</dt><dd>{display(selected.subcircuit || selected.circuit)}</dd></div></dl><small>ID da ocorrência: {selected.id} {selected.time ? `· ${selected.time}` : ''}</small></article>}
      </div>
    </section>
    <section className="method-note"><span>02</span><h2>Leitura responsável</h2><p>Os pontos representam ocorrências, não vítimas individuais. Nove ocorrências da base não possuem coordenadas válidas e continuam contabilizadas nos indicadores e resultados. A visualização reproduz classificações da fonte, sem inferir causalidade.</p></section>
    {listOpen && <div className="drawer-backdrop" onClick={() => setListOpen(false)}><aside className="drawer" onClick={(event) => event.stopPropagation()} aria-label="Lista de ocorrências"><header><div><span>RESULTADOS</span><h2>{filtered.length} ocorrências</h2></div><button onClick={() => setListOpen(false)} aria-label="Fechar lista">×</button></header><div className="drawer-list">{filtered.map((event) => <button key={event.id} onClick={() => selectEvent(event)}><span className="event-date">{formatDate(event.date)}</span><strong>{display(event.canton)}</strong><small>{display(event.province)} · {event.victims} vítimas {event.lat === null ? '· sem coordenadas' : ''}</small></button>)}</div></aside></div>}
    <footer><span>Fonte: “Asesinatos múltiples respaldo 2025 CH”</span><span>Atualização da base: 28 set 2025</span></footer>
  </main>;
}
