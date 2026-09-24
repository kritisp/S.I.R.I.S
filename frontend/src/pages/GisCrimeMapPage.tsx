import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Layers, RefreshCw, Clock, Box, Map, SlidersHorizontal, ChevronLeft, X, Flame, 
  ShieldAlert, Navigation, Sparkles, AlertTriangle, ArrowRight, Shield, CheckCircle2 
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RISK_TERRAIN_COMPOSITE_FACTORS, PREDICTIVE_ZONES } from '../data/round3DemoData';

// ── Odisha Safety-net Mock Hotspots Data ──────────────────────────────────────
export interface HotspotPoint {
  lat: number;
  lng: number;
  area: string;
  count: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  district: string;
  top_crime_types: string[];
}

export const ODISHA_HOTSPOTS: HotspotPoint[] = [
  { lat: 20.2589, lng: 85.7821, area: 'Khandagiri Square', count: 48, severity: 'critical', district: 'Khordha (Bhubaneswar)', top_crime_types: ['vehicle_theft', 'robbery'] },
  { lat: 20.2678, lng: 85.8398, area: 'Master Canteen Square', count: 38, severity: 'critical', district: 'Khordha (Bhubaneswar)', top_crime_types: ['chain_snatching', 'theft'] },
  { lat: 20.2880, lng: 85.8420, area: 'Saheed Nagar Hub', count: 32, severity: 'high', district: 'Khordha (Bhubaneswar)', top_crime_types: ['burglary', 'cybercrime'] },
  { lat: 20.3540, lng: 85.8190, area: 'Patia InfoCity Zone', count: 27, severity: 'high', district: 'Khordha (Bhubaneswar)', top_crime_types: ['cybercrime', 'vehicle_theft'] },
  { lat: 20.3012, lng: 85.8450, area: 'Palasuni NH-16 Flyover', count: 24, severity: 'high', district: 'Khordha (Bhubaneswar)', top_crime_types: ['highway_robbery', 'hit_and_run'] },
  { lat: 20.4625, lng: 85.8820, area: 'Cuttack Badambadi Terminal', count: 42, severity: 'critical', district: 'Cuttack', top_crime_types: ['extortion', 'assault'] },
  { lat: 20.5120, lng: 85.9100, area: 'Cuttack Chaudwar Industrial Gate', count: 19, severity: 'medium', district: 'Cuttack', top_crime_types: ['cargo_theft'] },
  { lat: 19.8135, lng: 85.8312, area: 'Puri Grand Road', count: 21, severity: 'medium', district: 'Puri', top_crime_types: ['pickpocketing', 'theft'] },
  { lat: 22.2604, lng: 84.8536, area: 'Rourkela Steel Township', count: 29, severity: 'high', district: 'Sundargarh (Rourkela)', top_crime_types: ['industrial_theft', 'assault'] },
  { lat: 19.3149, lng: 84.7941, area: 'Berhampur Silk City Market', count: 18, severity: 'medium', district: 'Ganjam (Berhampur)', top_crime_types: ['burglary'] },
];

export const ODISHA_CRIME_ROUTES = [
  {
    id: 'ROUTE-NH16-OD',
    name: 'NH-16 Bhubaneswar-Cuttack Interstate Corridor',
    short_name: 'NH-16 Corridor',
    threat_level: 'critical',
    distance_km: 28.4,
    est_transit_time: '32 mins',
    suspect_name: 'OD-02 Interstate Vehicle Theft Syndicate',
    color: '#ef4444',
    points: [
      [85.7821, 20.2589],
      [85.8012, 20.2741],
      [85.8398, 20.2678],
      [85.8450, 20.3012],
      [85.8820, 20.4625]
    ]
  },
  {
    id: 'ROUTE-PURI-OD',
    name: 'Bhubaneswar-Puri State Highway Expressway',
    short_name: 'Puri Highway',
    threat_level: 'high',
    distance_km: 56.1,
    est_transit_time: '55 mins',
    suspect_name: 'Coastal Extortion Gang',
    color: '#f59e0b',
    points: [
      [85.7821, 20.2589],
      [85.8120, 20.1500],
      [85.8312, 19.8135]
    ]
  }
];

const SEVERITY_HEX = {
  critical: '#c8372d',
  high: '#e05a3a',
  medium: '#f0a848',
  low: '#4A8B6F',
};

const SEVERITY_RADIUS = { critical: 22, high: 16, medium: 12, low: 8 };

const DISTRICTS = [
  'all',
  'Khordha (Bhubaneswar)',
  'Cuttack',
  'Puri',
  'Sundargarh (Rourkela)',
  'Ganjam (Berhampur)',
  'Sambalpur',
  'Balasore',
  'Angul'
];

const CRIME_TYPES = [
  'all',
  'vehicle_theft',
  'robbery',
  'chain_snatching',
  'assault',
  'burglary',
  'cybercrime',
  'highway_robbery'
];

export type MapDisplayMode = 'CURRENT CRIME' | 'PREDICTIVE RISK' | 'RISK TERRAIN';

export function GisCrimeMapPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialMode: MapDisplayMode = searchParams.get('mode') === 'risk-terrain' 
    ? 'RISK TERRAIN' 
    : searchParams.get('mode') === 'predictive-risk' 
      ? 'PREDICTIVE RISK' 
      : 'CURRENT CRIME';

  const [mapMode, setMapMode] = useState<MapDisplayMode>(initialMode);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [hotspots] = useState<HotspotPoint[]>(ODISHA_HOTSPOTS);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterDistrict, setFilterDistrict] = useState<string>('all');
  const [filterCrimeType, setFilterCrimeType] = useState<string>('all');
  const [selectedHotspot, setSelectedHotspot] = useState<HotspotPoint | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  const filtered = hotspots.filter(h => {
    if (filterSeverity !== 'all' && h.severity !== filterSeverity) return false;
    if (filterDistrict !== 'all' && h.district !== filterDistrict) return false;
    if (filterCrimeType !== 'all' && !h.top_crime_types.includes(filterCrimeType)) return false;
    return true;
  });

  // Initialize Leaflet Map Centered on Bhubaneswar
  useEffect(() => {
    if (!containerRef.current) return;
    if ((containerRef.current as any)._leaflet_id) {
      delete (containerRef.current as any)._leaflet_id;
    }

    const map = L.map(containerRef.current, {
      center: [20.2961, 85.8245], // Bhubaneswar Center
      zoom: 12,
      scrollWheelZoom: true,
    });

    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    mapRef.current = map;

    // Apply DRISHTI dark invert CSS filter
    const tileContainer = tileLayer.getContainer();
    if (tileContainer) {
      tileContainer.classList.add('map-tiles-dark-invert');
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Hotspots & Corridors & Risk Terrain Layers on Map
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Clear existing markers/layers
    map.eachLayer((layer: any) => {
      if (layer instanceof L.CircleMarker || layer instanceof L.Polyline || layer instanceof L.Circle) {
        map.removeLayer(layer);
      }
    });

    // 1. Render Odisha Crime Corridors
    ODISHA_CRIME_ROUTES.forEach(route => {
      const latLngs = route.points.map(pt => [pt[1], pt[0]] as [number, number]);
      const halo = L.polyline(latLngs, {
        color: route.color,
        weight: 10,
        opacity: 0.25,
        lineCap: 'round'
      }).addTo(map);

      const line = L.polyline(latLngs, {
        color: route.color,
        weight: 4,
        opacity: 0.9,
        lineCap: 'round'
      }).addTo(map);

      line.bindTooltip(`<strong>${route.name}</strong><br/>${route.distance_km} km · ${route.threat_level.toUpperCase()}`, { sticky: true });
    });

    // 2. Render Layers based on Mode
    if (mapMode === 'RISK TERRAIN' || mapMode === 'PREDICTIVE RISK') {
      // Render Risk Terrain Heat Rings for Predictive Zones
      PREDICTIVE_ZONES.forEach(zone => {
        const isSelected = selectedHotspot?.area === zone.zoneName || selectedHotspot?.area.includes(zone.zoneName);
        const radiusMeters = zone.riskScore * 25;
        const color = zone.riskScore > 80 ? '#ef4444' : zone.riskScore > 70 ? '#f59e0b' : '#3b82f6';

        L.circle([zone.lat, zone.lng], {
          radius: radiusMeters,
          color: color,
          fillColor: color,
          fillOpacity: isSelected ? 0.35 : 0.2,
          weight: isSelected ? 3 : 1.5,
          dashArray: mapMode === 'RISK TERRAIN' ? '4, 4' : undefined
        }).addTo(map).bindTooltip(
          `<div style="font-family: sans-serif; font-size: 11px; padding: 2px;">
            <strong style="font-weight: 700; color: #0f172a;">${zone.zoneName} (${mapMode})</strong>
            <p style="margin: 2px 0 0; color: #475569;">
              Composite Risk: <span style="font-weight: 700; color: ${color};">${zone.riskScore}/100 (${zone.riskLevel})</span>
            </p>
          </div>`
        );
      });
    }

    // Render Odisha Hotspots
    filtered.forEach(h => {
      const radius = SEVERITY_RADIUS[h.severity] || 14;
      const color = SEVERITY_HEX[h.severity] || '#3b82f6';
      const isSelected = selectedHotspot?.area === h.area;

      const pulse = L.circleMarker([h.lat, h.lng], {
        radius: radius * 1.8,
        fillColor: color,
        fillOpacity: isSelected ? 0.35 : 0.18,
        stroke: false,
      }).addTo(map);

      const marker = L.circleMarker([h.lat, h.lng], {
        radius: isSelected ? radius + 3 : radius,
        fillColor: color,
        color: '#ffffff',
        weight: isSelected ? 3 : 2,
        fillOpacity: 0.85,
      }).addTo(map);

      marker.bindTooltip(
        `<div style="font-family: sans-serif; font-size: 11px; padding: 2px;">
          <strong style="font-weight: 700; color: #0f172a;">${h.area}</strong>
          <p style="margin: 2px 0 0; color: #475569;">
            <span style="font-weight: 700; color: ${color};">${h.count} FIRs</span> · <span style="text-transform: capitalize; font-weight: 600;">${h.severity}</span>
          </p>
        </div>`
      );

      marker.on('click', () => setSelectedHotspot(h));
      pulse.on('click', () => setSelectedHotspot(h));
    });
  }, [filtered, selectedHotspot, mapMode]);

  // Pan to selected hotspot
  useEffect(() => {
    if (mapRef.current && selectedHotspot) {
      mapRef.current.flyTo([selectedHotspot.lat, selectedHotspot.lng], 14, { duration: 1.2 });
    }
  }, [selectedHotspot]);

  return (
    <div className="max-w-[1520px] mx-auto space-y-4 font-sans select-none text-text dark:text-[#F8FAFC] pb-24">
      {/* ── UNIFIED COMMAND-CENTER HEADER ── */}
      <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-3.5 sm:p-4 shadow-xs dark:shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-2 dark:bg-[#0E1422] border border-accent/40 dark:border-[#38BDF8]/40 flex items-center justify-center text-accent dark:text-[#38BDF8] shadow-xs shrink-0">
              <Map size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-accent dark:text-[#38BDF8]">
                  GIS SPATIAL INTELLIGENCE
                </span>
                <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {filtered.length} ACTIVE HOTSPOTS
                </span>
                <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-text-dim dark:text-[#94A3B8]">
                  BHUBANESWAR-CUTTACK COMMISSIONERATE
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-text dark:text-[#F8FAFC] mt-0.5">
                GIS Crime Map & Risk Terrain Analysis
              </h1>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1.5 bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] p-1 rounded-xl">
            {(['CURRENT CRIME', 'PREDICTIVE RISK', 'RISK TERRAIN'] as MapDisplayMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setMapMode(mode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  mapMode === mode
                    ? mode === 'RISK TERRAIN'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-accent text-bg dark:bg-[#38BDF8] dark:text-[#070A0F] shadow-xs'
                    : 'text-text-dim dark:text-[#94A3B8] hover:text-text dark:hover:text-[#F8FAFC] hover:bg-surface-hover dark:hover:bg-[#151D2E]'
                }`}
              >
                {mode === 'RISK TERRAIN' && <Sparkles size={12} className="text-amber-300 animate-pulse" />}
                <span>{mode}</span>
                {mode === 'RISK TERRAIN' && (
                  <span className="text-[9px] bg-purple-900/60 px-1 py-0.2 rounded font-mono text-purple-200">RTM</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAP CONTAINER WITH FLOATING PANELS ── */}
      <div className="relative w-full h-[720px] rounded-xl overflow-hidden border border-border-soft dark:border-[#1E293B] bg-surface dark:bg-[#0B0F17] shadow-xs dark:shadow-2xl">
        
        {/* ── 1. Floating Collapsible Intelligence HUD Drawer ── */}
        {!sidebarOpen ? (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute top-4 left-4 z-[1001] flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-surface/95 dark:bg-[#0B0F17]/95 backdrop-blur-md border border-border-soft dark:border-[#1E293B] text-text dark:text-[#F8FAFC] shadow-2xl transition-all group hover:scale-[1.02] cursor-pointer"
          >
            <div className="w-6 h-6 rounded-lg bg-accent/10 dark:bg-[#38BDF8]/10 border border-accent/30 dark:border-[#38BDF8]/30 flex items-center justify-center text-accent dark:text-[#38BDF8]">
              <SlidersHorizontal size={14} />
            </div>
            <span className="text-xs font-mono font-bold tracking-wide text-accent dark:text-[#38BDF8] uppercase">{mapMode}</span>
            <span className="px-1.5 py-0.5 rounded-md bg-surface-2 dark:bg-[#0E1422] text-accent dark:text-[#38BDF8] font-mono text-[10px] font-bold border border-border-soft dark:border-[#1E293B]">
              {filtered.length}
            </span>
          </button>
        ) : (
          <div className="absolute top-4 left-4 bottom-16 w-80 max-w-[calc(100vw-2.5rem)] z-[1002] bg-surface/95 dark:bg-[#0B0F17]/95 backdrop-blur-2xl border border-border-soft dark:border-[#1E293B] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-slide-in">
            
            {/* Header */}
            <div className="p-3.5 border-b border-border-soft dark:border-[#1E293B] flex items-center justify-between bg-surface-2 dark:bg-[#0E1422]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Flame size={15} className="animate-pulse" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-text dark:text-[#F8FAFC] tracking-wide font-mono flex items-center gap-1.5 uppercase">
                    {mapMode}
                    <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 text-[10px] font-mono font-bold border border-rose-500/30">
                      {filtered.length}
                    </span>
                  </h2>
                  <p className="text-[10px] font-mono text-text-dim dark:text-[#94A3B8]">Bhubaneswar-Cuttack Grid</p>
                </div>
              </div>

              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg text-text-dim dark:text-[#94A3B8] hover:text-text dark:hover:text-[#F8FAFC] hover:bg-surface-hover dark:hover:bg-[#151D2E] transition-colors cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
            </div>

            {/* RTM Special Badge Header if in Risk Terrain Mode */}
            {mapMode === 'RISK TERRAIN' && (
              <div className="p-3 bg-purple-950/40 border-b border-purple-500/30 font-mono text-[11px] space-y-1">
                <div className="flex items-center justify-between font-bold text-purple-300">
                  <span className="flex items-center gap-1"><Sparkles size={13} /> RTM-STYLE PROTOTYPE</span>
                  <span className="text-[9px] bg-purple-500/20 px-2 py-0.5 rounded text-purple-200 border border-purple-500/40">COMPOSITE MODEL</span>
                </div>
                <p className="text-[10px] text-text-dim dark:text-[#94A3B8]">Synthesizing 6 geographic risk layers (historical, trend, repeat offenders, CCTV, transit, time-of-day).</p>
              </div>
            )}

            {/* Filters section */}
            <div className="p-3 border-b border-border-soft dark:border-[#1E293B] space-y-2.5 bg-surface/50 dark:bg-[#0B0F17]/50 font-mono text-xs">
              <div>
                <span className="text-[9px] text-text-dim dark:text-[#94A3B8] uppercase tracking-wider font-bold block mb-1">Severity</span>
                <div className="flex flex-wrap gap-1">
                  {['all', 'critical', 'high', 'medium', 'low'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setFilterSeverity(s)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize transition-all cursor-pointer ${
                        filterSeverity === s
                          ? 'bg-accent text-bg dark:bg-[#38BDF8] dark:text-[#070A0F] shadow-xs'
                          : 'bg-surface-2 dark:bg-[#0E1422] text-text-dim dark:text-[#94A3B8] hover:text-text dark:hover:text-[#F8FAFC] border border-border-soft dark:border-[#1E293B]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] text-text-dim dark:text-[#94A3B8] uppercase tracking-wider mb-1 font-bold block">District</label>
                  <select
                    value={filterDistrict}
                    onChange={e => setFilterDistrict(e.target.value)}
                    className="w-full bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-text dark:text-[#F8FAFC] text-[10px] font-bold rounded-lg px-2 py-1 outline-none"
                  >
                    {DISTRICTS.map(d => (
                      <option key={d} value={d}>{d === 'all' ? 'All Districts' : d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[9px] text-text-dim dark:text-[#94A3B8] uppercase tracking-wider mb-1 font-bold block">Crime Type</label>
                  <select
                    value={filterCrimeType}
                    onChange={e => setFilterCrimeType(e.target.value)}
                    className="w-full bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-text dark:text-[#F8FAFC] text-[10px] font-bold rounded-lg px-2 py-1 outline-none"
                  >
                    {CRIME_TYPES.map(c => (
                      <option key={c} value={c}>{c === 'all' ? 'All Crimes' : c.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Hotspots scroll list */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
              {filtered.map((h, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedHotspot(h)}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                    selectedHotspot?.area === h.area
                      ? 'bg-accent/10 dark:bg-[#38BDF8]/10 border-accent/50 dark:border-[#38BDF8]/50 shadow-xs'
                      : 'bg-surface-2/60 dark:bg-[#0E1422]/60 border-border-soft dark:border-[#1E293B] hover:bg-surface-hover dark:hover:bg-[#151D2E]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                      <span className="text-xs text-text dark:text-[#F8FAFC] font-bold font-mono truncate">{h.area}</span>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-amber-400">{h.count} FIRs</span>
                  </div>
                  <div className="text-[10px] text-text-dim dark:text-[#94A3B8] font-mono mt-1 ml-4 capitalize">
                    {h.severity} · {h.district}
                  </div>
                </button>
              ))}
            </div>

            {/* Legend */}
            <div className="p-2.5 border-t border-border-soft dark:border-[#1E293B] bg-surface-2 dark:bg-[#0E1422] flex items-center justify-between text-[9px] font-mono text-text-dim dark:text-[#94A3B8]">
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Critical</div>
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> High</div>
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400" /> Med</div>
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Low</div>
            </div>
          </div>
        )}

        {/* ── 2. Full Width Leaflet Map Engine ── */}
        <div ref={containerRef} className="w-full h-full min-h-[600px] z-1" />

        {/* RISK TERRAIN PROFILE DRAWER / POPUP (When hotspot is clicked in Risk Terrain mode) */}
        {mapMode === 'RISK TERRAIN' && selectedHotspot && (
          <div className="absolute bottom-16 right-4 z-[1002] w-88 bg-surface/95 dark:bg-[#0B0F17]/95 backdrop-blur-2xl border border-purple-500/40 rounded-xl p-4 shadow-2xl font-mono text-xs animate-fade-in space-y-3">
            <div className="flex items-center justify-between border-b border-border-soft dark:border-[#1E293B] pb-2">
              <div>
                <div className="text-[9px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles size={11} /> RISK TERRAIN PROFILE
                </div>
                <div className="text-sm font-bold text-text dark:text-[#F8FAFC] mt-0.5">{selectedHotspot.area}</div>
              </div>
              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded font-bold text-[10px] border border-purple-500/30">
                RTM-STYLE PROTOTYPE
              </span>
            </div>

            <div className="flex items-center justify-between bg-surface-2 dark:bg-[#0E1422] p-2.5 rounded-lg border border-border-soft dark:border-[#1E293B]">
              <span className="text-text-dim dark:text-[#94A3B8] text-[11px]">Composite Risk Score:</span>
              <span className="text-base font-extrabold text-rose-400 font-mono">87 / 100</span>
            </div>

            <div className="space-y-1.5">
              <div className="text-[10px] text-text-dim dark:text-[#94A3B8] uppercase font-bold">Main Contributors</div>
              {RISK_TERRAIN_COMPOSITE_FACTORS.slice(0, 3).map((f, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px] p-1.5 rounded bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B]">
                  <span className="text-text dark:text-[#F8FAFC]">{f.factor}</span>
                  <span className="font-bold text-accent dark:text-[#38BDF8]">{f.weight}%</span>
                </div>
              ))}
            </div>

            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300">
              <strong>Recommended Patrol Window:</strong> 19:00 — 22:00 IST
            </div>

            <div className="pt-2 border-t border-border-soft dark:border-[#1E293B] flex gap-2">
              <button
                onClick={() => navigate('/resource-optimization')}
                className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg shadow transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>DEPLOY OPTIMIZED RESOURCE</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        )}

        {/* ── 3. Lower Left Controls Bar ── */}
        <div className="absolute bottom-4 left-4 z-[1000] flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-surface/95 dark:bg-[#0B0F17]/95 backdrop-blur-md border border-border-soft dark:border-[#1E293B] text-xs font-mono font-bold text-accent dark:text-[#38BDF8] flex items-center gap-2 shadow-xl">
            <Layers size={14} /> MODE: {mapMode}
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-surface/95 dark:bg-[#0B0F17]/95 backdrop-blur-md border border-border-soft dark:border-[#1E293B] text-xs font-mono text-text-dim dark:text-[#94A3B8] flex items-center gap-2 shadow-xl">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>{filtered.length} Hotspots Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
