import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Maximize2, Eye, EyeOff, Grid } from 'lucide-react';

// Fix Leaflet marker icon paths for safety
if (typeof window !== 'undefined' && L.Icon && L.Icon.Default) {
  delete (L.Icon.Default.prototype as unknown as { _getIconUrl: unknown })._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

export interface HopMarkerData {
  hop: number;
  cameraId: string;
  cameraName: string;
  lat: number;
  lng: number;
  timestamp: string;
  confidence: number;
  distanceFromCrimeKm: number;
  sightingType: string;
}

interface TacticalTrailMapViewProps {
  trailData?: HopMarkerData[];
  targetPlate?: string;
  totalDistanceKm?: number;
  durationMinutes?: number;
  highlightedHop?: number | null;
  onHopSelect?: (hopNumber: number) => void;
}

export function TacticalTrailMapView({
  trailData = [
    { hop: 1, cameraId: 'CAM-BBSR-0010', cameraName: 'Khandagiri Square', lat: 20.2589, lng: 85.7821, timestamp: '2026-08-21T21:10:00Z', confidence: 98, distanceFromCrimeKm: 0.2, sightingType: 'ANPR' },
    { hop: 2, cameraId: 'CAM-BBSR-0020', cameraName: 'Patrapada NH-16', lat: 20.2741, lng: 85.8012, timestamp: '2026-08-21T21:25:00Z', confidence: 94, distanceFromCrimeKm: 5.1, sightingType: 'ANPR' },
    { hop: 3, cameraId: 'CAM-BBSR-0030', cameraName: 'Palasuni Overbridge', lat: 20.3012, lng: 85.8450, timestamp: '2026-08-21T21:40:00Z', confidence: 91, distanceFromCrimeKm: 8.4, sightingType: 'CCTV' },
    { hop: 4, cameraId: 'CAM-BBSR-0040', cameraName: 'Cuttack Sadar Checkpoint', lat: 20.4625, lng: 85.8820, timestamp: '2026-08-21T21:58:00Z', confidence: 99, distanceFromCrimeKm: 12.1, sightingType: 'ANPR' },
  ],
  targetPlate = 'OD-02-AB-1234',
  totalDistanceKm = 12.1,
  durationMinutes = 48,
  highlightedHop = null,
  onHopSelect
}: TacticalTrailMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [mapReady, setMapReady] = useState<boolean>(false);
  const [nightVision, setNightVision] = useState<boolean>(false);
  const [tacticalGrid, setTacticalGrid] = useState<boolean>(false);

  // Initialize Leaflet map
  useEffect(() => {
    if (!containerRef.current) return;

    if ((containerRef.current as unknown as { _leaflet_id?: unknown })._leaflet_id) {
      delete (containerRef.current as unknown as { _leaflet_id?: unknown })._leaflet_id;
    }

    const defaultCenter: [number, number] =
      trailData.length > 0 ? [trailData[0].lat, trailData[0].lng] : [20.2961, 85.8245];


    const map = L.map(containerRef.current, {
      center: defaultCenter,
      zoom: 12,
      scrollWheelZoom: true,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Standard OpenStreetMap tiles by default (identical to user screenshot)
    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    const layerGroup = L.layerGroup().addTo(map);
    mapRef.current = map;
    layerGroupRef.current = layerGroup;
    setMapReady(true);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layerGroupRef.current = null;
      }
    };
  }, []);

  // Night Vision Tile Invert Toggle
  useEffect(() => {
    if (!tileLayerRef.current) return;
    const tileContainer = tileLayerRef.current.getContainer();
    if (tileContainer) {
      if (nightVision) {
        tileContainer.classList.add('map-tiles-dark-invert');
      } else {
        tileContainer.classList.remove('map-tiles-dark-invert');
      }
    }
  }, [nightVision]);

  // Fit bounds helper
  const handleFitAll = useCallback(() => {
    if (!mapRef.current || trailData.length === 0) return;
    const positions: [number, number][] = trailData.map(h => [h.lat, h.lng]);
    if (positions.length > 1) {
      mapRef.current.flyToBounds(positions, { padding: [60, 60], duration: 1.2 });
    } else {
      mapRef.current.flyTo(positions[0], 14, { duration: 1.2 });
    }
  }, [trailData]);

  // Update Hop Markers & Vector Lines
  useEffect(() => {
    if (!mapRef.current || !layerGroupRef.current || !mapReady) return;
    const layerGroup = layerGroupRef.current;
    layerGroup.clearLayers();

    if (trailData.length === 0) return;

    // Draw Vector Lines between Hops (Sage Green #4A8B6F)
    for (let i = 0; i < trailData.length - 1; i++) {
      const p1: [number, number] = [trailData[i].lat, trailData[i].lng];
      const p2: [number, number] = [trailData[i + 1].lat, trailData[i + 1].lng];
      const nextHop = trailData[i + 1];
      const isLowConf = nextHop.confidence < 90;

      const polyline = L.polyline([p1, p2], {
        color: isLowConf ? '#48596D' : '#4A8B6F',
        weight: isLowConf ? 3 : 4,
        dashArray: isLowConf ? '6, 6' : undefined,
        opacity: isLowConf ? 0.65 : 0.85,
      });
      polyline.addTo(layerGroup);
    }

    // Add Projected Vector Line from Last Hop (Earthy Gold #D97706)
    if (trailData.length > 1) {
      const lastHop = trailData[trailData.length - 1];
      const projLat = lastHop.lat + (lastHop.lat - trailData[trailData.length - 2].lat) * 0.4;
      const projLng = lastHop.lng + (lastHop.lng - trailData[trailData.length - 2].lng) * 0.4;

      const projLine = L.polyline([[lastHop.lat, lastHop.lng], [projLat, projLng]], {
        color: '#D97706',
        weight: 3,
        dashArray: '6, 6',
        opacity: 0.8,
      });
      projLine.addTo(layerGroup);
    }

    // Add Hop Markers
    trailData.forEach((hop, idx) => {
      const isFirst = idx === 0;
      const isLast = idx === trailData.length - 1;
      const isHighlighted = highlightedHop === hop.hop;

      const bgColor = isFirst ? '#4A8B6F' : isLast ? '#B91C1C' : '#4A8B6F';
      const borderCol = isFirst ? '#2E5A47' : isLast ? '#7F1D1D' : '#2E5A47';
      const iconSvg = isFirst
        ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3l14 9-14 9V3z"/></svg>'
        : isLast
        ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>'
        : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>';

      const customHtml = `
        <div style="position: relative; display: inline-block;">
          <div style="
            position: relative;
            z-index: 10;
            background-color: ${bgColor};
            color: #FFFFFF;
            border: 1.5px solid ${borderCol};
            border-radius: 6px;
            padding: 3px 8px;
            height: 26px;
            display: flex;
            align-items: center;
            gap: 5px;
            font-family: monospace;
            font-weight: 700;
            font-size: 11px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            cursor: pointer;
            ${isHighlighted ? 'outline: 3px solid #4A8B6F; outline-offset: 2px;' : ''}
          ">
            <span>${iconSvg}</span>
            <span>#${hop.hop}</span>
          </div>
        </div>
      `;

      const icon = L.divIcon({
        html: customHtml,
        className: '',
        iconSize: [65, 26],
        iconAnchor: [32, 13],
      });

      const marker = L.marker([hop.lat, hop.lng], { icon, zIndexOffset: isHighlighted ? 1000 : idx * 10 });

      marker.bindTooltip(`
        <div style="background:#0f172a; border:1px solid #334155; border-radius:8px; padding:8px 12px; color:#f8fafc; font-family:monospace; font-size:11px;">
          <div style="color:${bgColor}; font-weight:bold; font-size:12px; margin-bottom:2px;">
            ${hop.cameraId} · ${hop.cameraName}
          </div>
          <div>Confidence: <strong>${hop.confidence}%</strong> (${hop.sightingType})</div>
          <div>Dist: <strong>${hop.distanceFromCrimeKm} km</strong></div>
          <div>Time: <strong>${new Date(hop.timestamp).toLocaleTimeString()} IST</strong></div>
        </div>
      `, { opacity: 1, direction: 'top', offset: [0, -12] });

      marker.on('click', () => {
        if (onHopSelect) onHopSelect(hop.hop);
      });

      marker.addTo(layerGroup);
    });

    handleFitAll();
  }, [trailData, mapReady, highlightedHop, handleFitAll, onHopSelect]);

  // Fly to highlighted hop
  useEffect(() => {
    if (!mapRef.current || !highlightedHop) return;
    const hop = trailData.find(h => h.hop === highlightedHop);
    if (hop) {
      mapRef.current.flyTo([hop.lat, hop.lng], 15, { duration: 1.2 });
    }
  }, [highlightedHop, trailData]);

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden border border-slate-300 bg-white shadow-xl select-none">
      {/* Leaflet Map Canvas Container */}
      <div ref={containerRef} className="w-full h-full z-0" />

      {/* Top Telemetry Header Bar Overlay (Identical to User Screenshot) */}
      <div className="absolute top-3 left-3 z-[500] flex items-center gap-2 flex-wrap">
        <div className="px-3.5 py-1.5 rounded-xl bg-[#0F172A] text-white font-mono text-xs font-bold shadow-lg border border-slate-700 flex items-center gap-2">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">TARGET:</span>
          <span className="text-[#4A8B6F] font-extrabold">{targetPlate}</span>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl bg-[#0F172A] text-white font-mono text-xs font-bold shadow-lg border border-slate-700 flex items-center gap-2">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">DISTANCE:</span>
          <span>{totalDistanceKm} km</span>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl bg-[#0F172A] text-white font-mono text-xs font-bold shadow-lg border border-slate-700 flex items-center gap-2">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">DURATION:</span>
          <span>{durationMinutes}m</span>
        </div>
      </div>

      {/* Top Right Floating Toolbar (Identical to User Screenshot) */}
      <div className="absolute top-3 right-3 z-[500] flex items-center gap-2">
        <button
          type="button"
          onClick={() => setNightVision(!nightVision)}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border shadow-lg transition-all flex items-center gap-1.5 ${
            nightVision
              ? 'bg-emerald-950 text-emerald-400 border-emerald-600'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
          }`}
        >
          {nightVision ? <EyeOff size={13} /> : <Eye size={13} />}
          <span>{nightVision ? 'NV MODE: ON' : 'NV GRID'}</span>
        </button>

        <button
          type="button"
          onClick={() => setTacticalGrid(!tacticalGrid)}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border shadow-lg transition-all flex items-center gap-1.5 ${
            tacticalGrid
              ? 'bg-slate-900 text-emerald-400 border-slate-700'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
          }`}
        >
          <Grid size={13} />
          <span>{tacticalGrid ? 'GRID: ON' : 'GRID'}</span>
        </button>

        <button
          type="button"
          onClick={handleFitAll}
          className="p-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-lg"
          title="Fit All Hops"
        >
          <Maximize2 size={14} />
        </button>
      </div>

      {/* Tactical Graticule Grid Overlay */}
      {tacticalGrid && (
        <div
          className="absolute inset-0 pointer-events-none z-[400] transition-opacity duration-300"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(74, 139, 111, 0.2) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(74, 139, 111, 0.2) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
      )}

      {/* Tactical Map Legend Card (Identical to User Screenshot) */}
      <div className="absolute bottom-4 left-4 z-[500] bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl p-3.5 shadow-2xl font-sans text-xs space-y-2 max-w-xs pointer-events-auto">
        <div className="font-mono font-extrabold text-slate-900 uppercase tracking-wider text-[10px]">
          TACTICAL MAP LEGEND
        </div>
        <div className="space-y-1.5 text-slate-700 text-[11px] font-medium">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#4A8B6F] shrink-0" />
            <span>Hop 1 (Origin - #4A8B6F)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#4A8B6F] shrink-0" />
            <span>ANPR / CCTV Hop (#4A8B6F)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#B91C1C] shrink-0" />
            <span>Last Confirmed (#B91C1C)</span>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-slate-100 font-mono text-[10px]">
            <span className="text-slate-500 font-bold">---</span>
            <span className="text-slate-600">Low Conf. (&lt;90% match)</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px]">
            <span className="text-[#D97706] font-bold">---</span>
            <span className="text-[#D97706] font-semibold">Projected Vector (#D97706)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
