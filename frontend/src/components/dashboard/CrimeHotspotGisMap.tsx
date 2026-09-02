import React, { useState, useEffect, useRef } from 'react';
import { Info, Crosshair, ZoomIn, ZoomOut } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLanguage } from '../../context/LanguageContext';

interface HotspotCluster {
  id: string;
  name: string;
  lat: number;
  lng: number;
  intensity: 'HIGH' | 'MEDIUM' | 'EXTREME';
  cases: number;
  primaryCrime: string;
  trend: string;
}

const BHUBANESWAR_HOTSPOTS: HotspotCluster[] = [
  { id: 'h1', name: 'Khandagiri Chhak', lat: 20.2588, lng: 85.7871, intensity: 'EXTREME', cases: 22, primaryCrime: 'Vehicle Theft', trend: '↑ 18%' },
  { id: 'h2', name: 'Patrapada Junction', lat: 20.2435, lng: 85.7621, intensity: 'HIGH', cases: 17, primaryCrime: 'Robbery', trend: '↑ 13%' },
  { id: 'h3', name: 'Bhubaneswar Central', lat: 20.2666, lng: 85.8436, intensity: 'EXTREME', cases: 35, primaryCrime: 'Cyber Fraud', trend: '↑ 24%' },
  { id: 'h4', name: 'Kalinga Vihar', lat: 20.2281, lng: 85.7695, intensity: 'MEDIUM', cases: 14, primaryCrime: 'Burglary', trend: '↓ 4%' },
  { id: 'h5', name: 'Saheed Nagar', lat: 20.2882, lng: 85.8488, intensity: 'HIGH', cases: 19, primaryCrime: 'Financial Fraud', trend: '↑ 11%' },
  { id: 'h6', name: 'Gajapati Nagar', lat: 20.2985, lng: 85.8291, intensity: 'MEDIUM', cases: 11, primaryCrime: 'Assault', trend: '↓ 8%' },
  { id: 'h7', name: 'Pahala Highway', lat: 20.3255, lng: 85.8820, intensity: 'MEDIUM', cases: 9, primaryCrime: 'Highway Extortion', trend: 'Steady' },
];

const INITIAL_CENTER: [number, number] = [20.278, 85.818];
const INITIAL_ZOOM = 12;

export function CrimeHotspotGisMap() {
  const { t } = useLanguage();
  const [selectedHotspot, setSelectedHotspot] = useState<HotspotCluster | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Leaflet Map
    const map = L.map(mapContainerRef.current, {
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      minZoom: 10,
      maxZoom: 17,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: true,
      fadeAnimation: true,
    });

    mapInstanceRef.current = map;

    // Standard OpenStreetMap tiles with DRISHTI dark invert CSS filter (100% reliable, zero watermarks)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
      className: 'map-tiles-dark-invert',
    }).addTo(map);



    // Add Hotspot Heat Glow Layers & Interactive Markers
    BHUBANESWAR_HOTSPOTS.forEach((h) => {
      const isExtreme = h.intensity === 'EXTREME';
      const isHigh = h.intensity === 'HIGH';

      // 1. Heat Glow Radiance Circles
      const glowColor = isExtreme ? '#EF4444' : isHigh ? '#F59E0B' : '#0EA5E9';
      const glowRadius = isExtreme ? 1400 : isHigh ? 1000 : 750;

      L.circle([h.lat, h.lng], {
        radius: glowRadius,
        color: glowColor,
        weight: 0,
        fillColor: glowColor,
        fillOpacity: isExtreme ? 0.35 : isHigh ? 0.28 : 0.2,
        interactive: false,
      }).addTo(map);

      // Inner concentrated core
      L.circle([h.lat, h.lng], {
        radius: glowRadius * 0.45,
        color: glowColor,
        weight: 0,
        fillColor: glowColor,
        fillOpacity: isExtreme ? 0.55 : isHigh ? 0.45 : 0.35,
        interactive: false,
      }).addTo(map);

      // 2. High-Definition Glowing Marker & Location Label
      const markerBg = isExtreme ? 'bg-rose-500' : isHigh ? 'bg-amber-500' : 'bg-sky-500';
      const markerGlowRgba = isExtreme ? 'rgba(239,68,68,0.9)' : isHigh ? 'rgba(245,158,11,0.9)' : 'rgba(14,165,233,0.9)';

      const markerHtml = `
        <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: translate(-50%, -50%); user-select: none;">
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 16px; height: 16px;">
            <div class="${markerBg}" style="width: 12px; height: 12px; border-radius: 9999px; border: 2px solid rgba(255,255,255,0.95); box-shadow: 0 0 10px ${markerGlowRgba};"></div>
            ${isExtreme ? '<div style="position: absolute; width: 22px; height: 22px; border-radius: 9999px; border: 1.5px solid #EF4444; animation: ping 1.5s cubic-bezier(0,0,0.2,1) infinite; opacity: 0.75;"></div>' : ''}
          </div>
          <div style="margin-top: 3px; white-space: nowrap;">
            <span style="font-family: inherit; font-size: 9px; font-weight: 700; color: #FFFFFF; background: rgba(0,0,0,0.85); padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.25); box-shadow: 0 2px 6px rgba(0,0,0,0.8); backdrop-filter: blur(4px);">
              ${h.name}
            </span>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-gis-hotspot-marker',
        iconSize: [0, 0],
      });

      const marker = L.marker([h.lat, h.lng], { icon: customIcon }).addTo(map);
      marker.on('click', () => {
        setSelectedHotspot((prev) => (prev?.id === h.id ? null : h));
      });
    });

    // Invalidate size after mount to ensure smooth canvas sizing
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleResetView = () => {
    mapInstanceRef.current?.flyTo(INITIAL_CENTER, INITIAL_ZOOM, { duration: 0.8 });
    setSelectedHotspot(null);
  };

  return (
    <div className="bg-surface dark:bg-[#0F1726] border border-border dark:border-[#1E293B] rounded-2xl p-4 flex flex-col justify-between shadow-xs h-full relative overflow-hidden font-sans">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2 z-10">
        <div className="flex items-center gap-1.5 relative">
          <h3 className="text-xs font-bold text-text dark:text-[#F8FAFC] tracking-wide">
            {t('dashboard.crimeHotspots', 'Crime Hotspots (This Month)')}
          </h3>
          <button
            type="button"
            onClick={() => setShowInfo(!showInfo)}
            className="text-text-faint dark:text-[#64748B] hover:text-text dark:hover:text-[#CBD5E1] transition-colors focus:outline-hidden"
            title="GIS Hotspot Info"
          >
            <Info size={13} />
          </button>

          {showInfo && (
            <div className="absolute left-0 top-6 z-30 bg-[#0B1120]/95 border border-cyan-500/30 text-white text-[10px] p-2 rounded-lg shadow-xl backdrop-blur-md w-56 animate-fade-in">
              <p className="font-semibold text-cyan-400 mb-0.5">Bhubaneswar Urban GIS</p>
              <p className="text-slate-300">
                Spatial density clusters derived from active FIR registrations, CCTV pattern alerts, and patrol logs across commissionerate limits.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 text-[10px] font-mono text-text-dim dark:text-[#94A3B8]">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span>GIS BHUBANESWAR</span>
        </div>
      </div>

      {/* Main Map Visual Viewport Container */}
      <div className="relative w-full aspect-[2.2/1] min-h-[175px] rounded-xl overflow-hidden border border-border-soft dark:border-[#1E293B] select-none bg-[#070B14]">
        {/* Leaflet Map Canvas Ref */}
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

        {/* Vertical Heat Intensity Legend Bar (Right side) */}
        <div className="absolute right-2 top-2.5 bottom-2.5 w-4 rounded-full flex flex-col items-center justify-between py-1.5 px-0.5 bg-black/80 border border-white/15 backdrop-blur-md z-10 shadow-lg select-none pointer-events-none">
          <span className="text-[7px] font-mono font-bold text-rose-500">High</span>
          <div className="w-1.5 flex-1 my-1 rounded-full bg-gradient-to-b from-[#EF4444] via-[#F59E0B] via-[#10B981] to-[#0EA5E9]" />
          <span className="text-[7px] font-mono font-bold text-sky-400">Low</span>
        </div>

        {/* Map Viewport Controls (Bottom Right) */}
        <div className="absolute right-8 bottom-2 flex items-center gap-0.5 z-10 bg-[#0B1120]/90 border border-white/20 rounded-lg p-0.5 backdrop-blur-md shadow-lg">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={12} />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={12} />
          </button>
          <button
            type="button"
            onClick={handleResetView}
            className="p-1 text-slate-300 hover:text-white hover:bg-white/10 rounded transition-colors"
            title="Recenter Map"
          >
            <Crosshair size={12} />
          </button>
        </div>

        {/* Selected Cluster Info Box Overlay */}
        {selectedHotspot && (
          <div className="absolute left-2 bottom-2 z-20 bg-[#0B1120]/95 border border-cyan-500/40 rounded-xl p-2.5 shadow-2xl text-left backdrop-blur-md max-w-[210px] animate-fade-in font-sans">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[10px] font-bold text-white truncate">{selectedHotspot.name}</span>
              <span
                className={`text-[8px] font-mono font-bold px-1 py-0.2 rounded ${
                  selectedHotspot.intensity === 'EXTREME'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    : selectedHotspot.intensity === 'HIGH'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                }`}
              >
                {selectedHotspot.intensity}
              </span>
            </div>
            <div className="text-[9px] font-mono text-slate-300 space-y-0.5">
              <div>
                Active Cases: <strong className="text-white">{selectedHotspot.cases}</strong>
              </div>
              <div>
                Primary: <strong className="text-amber-400">{selectedHotspot.primaryCrime}</strong>
              </div>
              <div>
                Trend: <strong className="text-emerald-400">{selectedHotspot.trend}</strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
