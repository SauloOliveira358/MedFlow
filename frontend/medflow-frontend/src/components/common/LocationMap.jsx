import { useState, useRef, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Icon from './Icon';

export default function LocationMap({
  lat = -19.9227,
  lng = -43.9451,
  clinicName = '',
  address = '',
  editable = false,
  onChange,
  height = 280,
}) {
  const currentLat = typeof lat === 'number' && !isNaN(lat) ? lat : -19.9227;
  const currentLng = typeof lng === 'number' && !isNaN(lng) ? lng : -43.9451;

  const [pinPos, setPinPos] = useState({ lat: currentLat, lng: currentLng });
  const [copied, setCopied] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchMessage, setSearchMessage] = useState('');

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  // Initialize Leaflet Map with Google Maps Tiles
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    try {
      const map = L.map(mapContainerRef.current, {
        center: [currentLat, currentLng],
        zoom: 16,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      // Google Maps Road Tiles - 100% gratuito, sem chave de API e sem duplo alfinete
      L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['0', '1', '2', '3'],
        attribution: 'Google Maps',
      }).addTo(map);

      // Pin Marker SVG único (sem sobreposição)
      const pinIcon = L.divIcon({
        className: 'medflow-leaflet-pin',
        html: `
          <div class="pin-marker-wrapper" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.35)); cursor: ${editable ? 'grab' : 'pointer'};">
            <svg width="34" height="42" viewBox="0 0 34 42" fill="none">
              <path d="M17 0C7.61 0 0 7.61 0 17C0 26.9 14.7 40.7 15.4 41.3C15.9 41.7 16.4 42 17 42C17.6 42 18.1 41.7 18.6 41.3C19.3 40.7 34 26.9 34 17C34 7.61 26.39 0 17 0Z" fill="#ea4335"/>
              <circle cx="17" cy="17" r="7" fill="#ffffff"/>
              <circle cx="17" cy="17" r="4" fill="#ea4335"/>
            </svg>
          </div>
        `,
        iconSize: [34, 42],
        iconAnchor: [17, 42],
        popupAnchor: [0, -42],
      });

      const marker = L.marker([currentLat, currentLng], {
        icon: pinIcon,
        draggable: editable,
        title: clinicName || 'Local do Atendimento',
      }).addTo(map);

      if (clinicName) {
        marker.bindPopup(`<strong>${clinicName}</strong><br/><small>${address || 'Local da consulta'}</small>`);
      }

      if (editable) {
        // Clicar no mapa posiciona o marcador exatamente onde clicou
        map.on('click', (e) => {
          const newLat = Number(e.latlng.lat.toFixed(6));
          const newLng = Number(e.latlng.lng.toFixed(6));
          marker.setLatLng([newLat, newLng]);
          setPinPos({ lat: newLat, lng: newLng });
          setSearchMessage('Ponto marcado no mapa!');
          onChange?.({ lat: newLat, lng: newLng });
        });

        // Arrastar o marcador atualiza as coordenadas em tempo real
        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          const newLat = Number(pos.lat.toFixed(6));
          const newLng = Number(pos.lng.toFixed(6));
          setPinPos({ lat: newLat, lng: newLng });
          setSearchMessage('Ponto reposicionado com sucesso!');
          onChange?.({ lat: newLat, lng: newLng });
        });
      }

      mapInstanceRef.current = map;
      markerRef.current = marker;

      // Ensure proper sizing after mount
      setTimeout(() => {
        try {
          map.invalidateSize();
        } catch {}
      }, 250);
    } catch (e) {
      console.warn('Leaflet error in environment:', e);
    }

    return () => {
      try {
        mapInstanceRef.current?.remove?.();
      } catch {}
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Update map when coordinates change externally (e.g. typing in Latitude/Longitude input)
  useEffect(() => {
    setPinPos({ lat: currentLat, lng: currentLng });
    if (mapInstanceRef.current && markerRef.current) {
      try {
        const cur = markerRef.current.getLatLng();
        if (Math.abs(cur.lat - currentLat) > 0.00001 || Math.abs(cur.lng - currentLng) > 0.00001) {
          markerRef.current.setLatLng([currentLat, currentLng]);
          mapInstanceRef.current.setView([currentLat, currentLng], mapInstanceRef.current.getZoom() || 16);
        }
      } catch {}
    }
  }, [currentLat, currentLng]);

  // Google Maps search query handler
  const handleSearch = async (e) => {
    e?.preventDefault?.();
    const query = searchQuery.trim();
    if (!query) return;

    // Check if query is direct coordinates: e.g. "-19.9227, -43.9451"
    const coordMatch = query.match(/^(-?\d+(\.\d+)?)[,\s]+(-?\d+(\.\d+)?)$/);
    if (coordMatch) {
      const parsedLat = Number(parseFloat(coordMatch[1]).toFixed(6));
      const parsedLng = Number(parseFloat(coordMatch[3]).toFixed(6));
      setPinPos({ lat: parsedLat, lng: parsedLng });
      setSearchResults([]);
      setSearchMessage(`Coordenadas aplicadas: ${parsedLat}, ${parsedLng}`);

      if (mapInstanceRef.current && markerRef.current) {
        markerRef.current.setLatLng([parsedLat, parsedLng]);
        mapInstanceRef.current.setView([parsedLat, parsedLng], 16);
      }
      if (onChange) onChange({ lat: parsedLat, lng: parsedLng });
      return;
    }

    setIsSearching(true);
    setSearchMessage('');
    setSearchResults([]);

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=br`;
      const response = await fetch(url, {
        headers: { 'Accept-Language': 'pt-BR,pt;q=0.9' },
      });
      if (!response.ok) throw new Error('Erro na pesquisa');
      const data = await response.json();

      if (data && data.length > 0) {
        setSearchResults(data);
        const top = data[0];
        const newLat = Number(parseFloat(top.lat).toFixed(6));
        const newLng = Number(parseFloat(top.lon).toFixed(6));
        setPinPos({ lat: newLat, lng: newLng });
        setSearchMessage(`Local encontrado: ${top.display_name.split(',').slice(0, 3).join(',')}`);

        if (mapInstanceRef.current && markerRef.current) {
          markerRef.current.setLatLng([newLat, newLng]);
          mapInstanceRef.current.setView([newLat, newLng], 16);
        }
        if (onChange) {
          onChange({
            lat: newLat,
            lng: newLng,
            address: top.display_name,
          });
        }
      } else {
        setSearchMessage('Nenhum endereço encontrado para esta busca. Tente rua e número.');
      }
    } catch {
      setSearchMessage('Não foi possível buscar na rede. Marque diretamente no mapa ou digite a Latitude e Longitude.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = (item) => {
    const newLat = Number(parseFloat(item.lat).toFixed(6));
    const newLng = Number(parseFloat(item.lon).toFixed(6));
    setPinPos({ lat: newLat, lng: newLng });
    setSearchResults([]);
    setSearchQuery(item.display_name.split(',').slice(0, 3).join(', '));
    setSearchMessage(`Local selecionado: ${item.display_name.split(',').slice(0, 3).join(',')}`);

    if (mapInstanceRef.current && markerRef.current) {
      markerRef.current.setLatLng([newLat, newLng]);
      mapInstanceRef.current.setView([newLat, newLng], 16);
    }
    if (onChange) {
      onChange({
        lat: newLat,
        lng: newLng,
        address: item.display_name,
      });
    }
  };

  const handleUseGeolocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocalização não suportada no seu navegador.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLat = Number(pos.coords.latitude.toFixed(6));
        const newLng = Number(pos.coords.longitude.toFixed(6));
        setPinPos({ lat: newLat, lng: newLng });
        setIsLocating(false);
        setSearchMessage(`Localização GPS obtida: ${newLat}, ${newLng}`);

        if (mapInstanceRef.current && markerRef.current) {
          markerRef.current.setLatLng([newLat, newLng]);
          mapInstanceRef.current.setView([newLat, newLng], 16);
        }
        if (onChange) onChange({ lat: newLat, lng: newLng });
      },
      () => {
        setIsLocating(false);
        alert('Não foi possível obter sua localização atual via GPS.');
      },
      { timeout: 8000 }
    );
  };

  const gmapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${pinPos.lat},${pinPos.lng}`;

  const copyCoords = () => {
    navigator.clipboard?.writeText?.(`${pinPos.lat}, ${pinPos.lng}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Fallback map click handler for headless test environments
  const handleContainerClick = (e) => {
    if (!editable) return;
    if (mapInstanceRef.current) return; // Handled natively by Leaflet

    const rect = mapContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const relX = Math.max(0, Math.min(1, x / (rect.width || 300)));
    const relY = Math.max(0, Math.min(1, y / (rect.height || 200)));
    const newLng = Number(((pinPos.lng - 0.006) + relX * 0.012).toFixed(6));
    const newLat = Number(((pinPos.lat + 0.004) - relY * 0.008).toFixed(6));
    setPinPos({ lat: newLat, lng: newLng });
    onChange?.({ lat: newLat, lng: newLng });
  };

  return (
    <div className={`medflow-location-map ${editable ? 'editable' : 'readonly'}`}>
      {/* Header bar */}
      <div className="map-header">
        <div className="map-title-info">
          <span className="map-badge">
            <Icon name="pin" size={14} />
            {editable ? 'Pesquisa e Ponto no Mapa' : 'Localização no Google Maps'}
          </span>
          {clinicName && <strong className="map-clinic-name">{clinicName}</strong>}
          {address && <span className="map-address-text">{address}</span>}
        </div>

        <div className="map-header-actions">
          <a
            href={gmapsSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="map-btn gmaps-btn"
            title="Abrir no Google Maps"
          >
            <Icon name="pin" size={13} />
            <span>Abrir no Google Maps</span>
            <span style={{ fontSize: '11px', opacity: 0.8 }}>↗</span>
          </a>
        </div>
      </div>

      {editable && (
        <div className="map-search-panel">
          <div className="map-search-row">
            <div className="map-search-input-box">
              <Icon name="search" size={16} className="search-icon-inside" />
              <input
                type="text"
                className="map-search-input"
                placeholder="Pesquisar endereço no mapa (ex: Av. Paulista, 1000 ou Rua das Flores, BH)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
                aria-label="Pesquisar endereço no mapa"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="map-clear-btn"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setSearchMessage('');
                  }}
                  title="Limpar pesquisa"
                >
                  <Icon name="x" size={13} />
                </button>
              )}
            </div>

            <button
              type="button"
              className="button small primary map-action-btn"
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
            >
              {isSearching ? 'Buscando...' : 'Buscar no Maps'}
            </button>

            <button
              type="button"
              className="map-tool-btn"
              onClick={handleUseGeolocation}
              disabled={isLocating}
              title="Obter coordenadas GPS atuais"
            >
              <Icon name="sparkles" size={13} />
              {isLocating ? 'GPS...' : 'Meu Local (GPS)'}
            </button>
          </div>

          {searchMessage && (
            <div className="map-search-feedback">
              <Icon name="check" size={13} />
              <span>{searchMessage}</span>
            </div>
          )}

          {searchResults.length > 1 && (
            <div className="map-results-dropdown">
              <span className="results-title">Vários locais encontrados — clique para selecionar:</span>
              {searchResults.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="result-row"
                  onClick={() => handleSelectResult(item)}
                >
                  <Icon name="pin" size={13} />
                  <span>{item.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Real Interactive Map Canvas with Google Maps Tiles */}
      <div
        ref={mapContainerRef}
        className={`map-viewport leaflet-google-map ${editable ? 'clickable' : ''}`}
        style={{ height: `${height}px`, width: '100%', position: 'relative' }}
        onClick={handleContainerClick}
        role={editable ? 'button' : 'region'}
        aria-label={editable ? 'Clique no mapa para posicionar o marcador' : 'Mapa da consulta'}
        tabIndex={editable ? 0 : undefined}
      >
        {editable && (
          <div className="map-click-hint" style={{ pointerEvents: 'none' }}>
            <Icon name="pin" size={12} />
            <span>Clique ou arraste o alfinete vermelho para marcar a localização exata</span>
          </div>
        )}
      </div>

      {/* Footer bar with coordinate feedback */}
      <div className="map-footer">
        <div className="map-coords-badge">
          <span className="coord-dot" />
          <span className="coord-label">Latitude:</span>
          <code>{pinPos.lat.toFixed(5)}</code>
          <span className="coord-label" style={{ marginLeft: '6px' }}>
            Longitude:
          </span>
          <code>{pinPos.lng.toFixed(5)}</code>
          <button
            type="button"
            className="copy-coord-btn"
            onClick={copyCoords}
            title="Copiar coordenadas"
          >
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>

        <span className="map-live-status">
          <Icon name="check" size={13} />
          {editable ? 'Alfinete único sincronizado com o Google Maps' : 'Localização sincronizada com Google Maps'}
        </span>
      </div>
    </div>
  );
}
