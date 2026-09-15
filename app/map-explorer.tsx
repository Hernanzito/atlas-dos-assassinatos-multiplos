'use client';

import { useEffect, useRef, useState } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';

const places = [
  { name: 'MASP', category: 'Cultura', detail: 'Arte, arquitetura e Avenida Paulista', coords: [-23.5614, -46.6559] as [number, number], color: '#ef5d3f' },
  { name: 'Parque Ibirapuera', category: 'Natureza', detail: 'Áreas verdes, museus e ciclovias', coords: [-23.5874, -46.6576] as [number, number], color: '#4e9c7a' },
  { name: 'Mercadão', category: 'Gastronomia', detail: 'Sabores e história no centro da cidade', coords: [-23.5418, -46.6291] as [number, number], color: '#e7a33d' },
  { name: 'Pinacoteca', category: 'Cultura', detail: 'Arte brasileira junto ao Jardim da Luz', coords: [-23.5343, -46.6339] as [number, number], color: '#ef5d3f' },
];

export default function MapExplorer() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    let live = true;

    import('leaflet').then((L) => {
      if (!live || !mapContainer.current) return;
      const instance = L.map(mapContainer.current, { zoomControl: false, attributionControl: true }).setView([-23.5578, -46.6496], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(instance);
      L.control.zoom({ position: 'bottomright' }).addTo(instance);
      places.forEach((place, index) => {
        const marker = L.circleMarker(place.coords, { radius: 10, color: '#fffaf2', weight: 4, fillColor: place.color, fillOpacity: 1 }).addTo(instance);
        marker.bindTooltip(place.name, { direction: 'top', offset: [0, -8], className: 'map-tooltip' });
        marker.on('click', () => setActive(index));
      });
      map.current = instance;
    });

    return () => { live = false; map.current?.remove(); map.current = null; };
  }, []);

  const focusPlace = (index: number) => {
    setActive(index);
    map.current?.flyTo(places[index].coords, 15, { duration: 1.1 });
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Atlas Urbano — início"><span className="brand-mark">A</span><span>ATLAS <em>URBANO</em></span></a>
        <div className="header-copy"><span>GUIA DE CAMPO · 01</span><strong>São Paulo, SP</strong></div>
      </header>
      <section className="intro">
        <p className="eyebrow">Explore a cidade</p>
        <h1>Quatro paradas.<br /><i>Mil caminhos.</i></h1>
        <p className="lede">Uma pequena seleção de lugares que revelam cultura, natureza e sabores paulistanos.</p>
      </section>
      <section className="map-wrap" aria-label="Mapa de pontos de interesse em São Paulo">
        <div ref={mapContainer} className="map" />
        <div className="map-label"><span>23°33′S</span><span>46°38′W</span></div>
        <aside className="place-card" aria-live="polite">
          <div className="place-number">0{active + 1}</div><p>{places[active].category}</p><h2>{places[active].name}</h2><span>{places[active].detail}</span>
        </aside>
      </section>
      <nav className="place-list" aria-label="Escolher local">
        {places.map((place, index) => (
          <button key={place.name} className={active === index ? 'active' : ''} onClick={() => focusPlace(index)}>
            <span className="index">0{index + 1}</span><span className="place-meta"><strong>{place.name}</strong><small>{place.category}</small></span><span className="arrow" aria-hidden="true">↗</span>
          </button>
        ))}
      </nav>
      <footer><span>Feito com Leaflet + OpenStreetMap</span><span>EXEMPLO INTERATIVO · 2026</span></footer>
    </main>
  );
}
