import React, { useState, useEffect, useRef } from 'react';
import { 
  Navigation, Radio, Fuel, Gauge, MapPin, Send, CheckCircle2, 
  AlertCircle, Filter, Shield, Layers, Compass, Milestone, AlertTriangle, Sparkles 
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface PatrolUnit {
  id: string;
  callsign: string;
  type: string;
  officer: string;
  precinct: string;
  district: string;
  speedKmH: number;
  fuel: number;
  status: string;
  lat: number;
  lng: number;
}

const DEMO_PATROL_UNITS: PatrolUnit[] = [
  { id: 'PU-01', callsign: 'CHEETAH-BBSR-01', type: 'Cheetah Bike', officer: 'Ins. S. Pattnaik', precinct: 'Khandagiri Square', district: 'Bhubaneswar', speedKmH: 42, fuel: 88, status: 'ON BEAT PATROL', lat: 20.258, lng: 85.782 },
  { id: 'PU-02', callsign: 'PCR-CTC-04', type: 'PCR Interceptor', officer: 'Ins. M. Mohanty', precinct: 'Badambadi Bus Stand', district: 'Cuttack', speedKmH: 55, fuel: 74, status: 'RESPONDING TO 112', lat: 20.462, lng: 85.882 },
  { id: 'PU-03', callsign: 'QRT-PATRAPADA-02', type: 'QRT Tactical', officer: 'Sub-Ins. R. Das', precinct: 'NH-16 Expressway', district: 'Khordha', speedKmH: 68, fuel: 92, status: 'HIGHWAY INTERCEPT', lat: 20.235, lng: 85.765 },
  { id: 'PU-04', callsign: 'BEAT-SAHEED-03', type: 'PCR Van', officer: 'Ins. B. Swain', precinct: 'Saheed Nagar Market', district: 'Bhubaneswar', speedKmH: 18, fuel: 65, status: 'STATION BACKUP', lat: 20.292, lng: 85.840 },
  { id: 'PU-05', callsign: 'DRONE-PURI-01', type: 'Surveillance Drone', officer: 'Drone Ops Tech', precinct: 'Grand Road / Temple', district: 'Puri', speedKmH: 35, fuel: 95, status: 'AIR SURVEILLANCE', lat: 19.813, lng: 85.831 },
];

const DARK_ZONES = [
  {
    corridor: 'NH-16 Khandagiri Square → Pitapalli Toll',
    risk_level: 'CRITICAL',
    crime_vector: 'Organized Cargo Heists & Inter-State Theft',
    window: '22:00 - 04:00 IST',
    recommended_patrol: 'Deploy 2 Cheetah Bikes + 1 QRT Interceptor at Pitapalli Junction'
  },
  {
    corridor: 'Badambadi Link Road (Cuttack Ring Road)',
    risk_level: 'HIGH',
    crime_vector: 'Commercial Cash Robbery & Mule Drop Nodes',
    window: '20:00 - 02:00 IST',
    recommended_patrol: 'Deploy Drone Unit + PCR-CTC-04 for high-angle optical surveillance'
  },
  {
    corridor: 'Janpath Saheed Nagar Commercial Belt',
    risk_level: 'HIGH',
    crime_vector: 'Late-Night Jewelry & Cash Counter Burglary',
    window: '23:30 - 03:30 IST',
    recommended_patrol: 'Station Static Foot Beat at Saheed Nagar Junction'
  }
];

export function SupervisorFleetDispatchPage() {
  const [patrolUnits, setPatrolUnits] = useState<PatrolUnit[]>(DEMO_PATROL_UNITS);
  const [selectedUnit, setSelectedUnit] = useState<PatrolUnit>(DEMO_PATROL_UNITS[0]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [newTarget, setNewTarget] = useState<string>('');
  const [dispatchToast, setDispatchToast] = useState<string>('');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});

  // 2-Second Moving GPS Vector Telemetry Simulation
  const [tick, setTick] = useState(748);
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(prev => prev + 1);
      setPatrolUnits(prev =>
        prev.map(u => ({
          ...u,
          lat: u.lat + (Math.random() - 0.5) * 0.002,
          lng: u.lng + (Math.random() - 0.5) * 0.002,
          speedKmH: Math.max(15, Math.min(90, u.speedKmH + Math.floor((Math.random() - 0.5) * 6)))
        }))
      );
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [20.2961, 85.8245],
      zoom: 12,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
      className: 'map-tiles-dark-invert'
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Leaflet Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    patrolUnits.forEach(u => {
      const isSelected = u.id === selectedUnit.id;
      const color = isSelected ? '#3b82f6' : u.status.includes('112') ? '#ef4444' : '#10b981';

      const customIcon = L.divIcon({
        className: 'custom-patrol-marker',
        html: `
          <div style="
            width: 32px; height: 32px;
            background: rgba(15, 23, 42, 0.9);
            border: 2px solid ${color};
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            color: ${color}; font-weight: bold; font-size: 11px;
            box-shadow: 0 0 12px ${color}80;
            cursor: pointer;
          ">
            🚓
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      if (!markersRef.current[u.id]) {
        const marker = L.marker([u.lat, u.lng], { icon: customIcon }).addTo(map);
        marker.on('click', () => setSelectedUnit(u));
        markersRef.current[u.id] = marker;
      } else {
        markersRef.current[u.id].setLatLng([u.lat, u.lng]);
      }
    });
  }, [patrolUnits, selectedUnit]);

  const filteredUnits = patrolUnits.filter(u => {
    if (selectedDistrict === 'ALL') return true;
    return u.district === selectedDistrict;
  });

  const handleRedeploy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTarget.trim()) return;

    setDispatchToast(`Transmitted Radio Dispatch Order: Re-routed ${selectedUnit.callsign} to "${newTarget}"`);
    setNewTarget('');
    setTimeout(() => setDispatchToast(''), 4500);
  };

  const handleQuickDeploy = (corridor: string) => {
    setDispatchToast(`Tactical Dispatch Order: Re-routed ${selectedUnit.callsign} to Dark Zone: "${corridor}"`);
    setTimeout(() => setDispatchToast(''), 4500);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 font-sans bg-bg min-h-screen text-text select-none">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass p-4 rounded-2xl bg-surface/90 border border-border-strong shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-brand/20 border border-brand/40 flex items-center justify-center text-brand">
              <Navigation size={18} />
            </div>
            <h1 className="text-xl font-bold font-mono text-text uppercase tracking-wider">
              FLEET & PATROL DISPATCH
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-brand/20 text-brand border border-brand/30">
              STATE COMMAND GPS VECTORING
            </span>
          </div>
          <p className="text-xs text-text-dim">
            Odisha State Police · Live 2-Second Moving Patrol Fleet & Dark Zone Predictive Dispatch
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-surface-2 border border-border-soft text-xs font-mono font-bold text-brand flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand animate-ping" />
            <span>2s Satellite Stream #{tick}</span>
          </span>
        </div>
      </div>

      {/* TOAST NOTIFICATION */}
      {dispatchToast && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{dispatchToast}</span>
        </div>
      )}

      {/* MAIN CONSOLE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT 8 COLS: LEAFLET MOVING FLEET MAP + DARK ZONE RECOMMENDATIONS */}
        <div className="lg:col-span-8 space-y-6">
          
          <div className="glass p-5 rounded-2xl bg-surface/90 border border-border-soft space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border-soft pb-2.5">
              <span className="text-xs font-mono font-bold text-brand uppercase tracking-wider flex items-center gap-1.5">
                <Navigation size={14} /> LIVE MOVING VECTOR PATROL MAP ({filteredUnits.length} UNITS)
              </span>

              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="bg-surface-2 border border-border-soft rounded-xl px-3 py-1 text-xs font-mono text-text outline-none"
              >
                <option value="ALL">All Districts</option>
                <option value="Bhubaneswar">Bhubaneswar Urban</option>
                <option value="Cuttack">Cuttack City</option>
                <option value="Khordha">Khordha Rural</option>
                <option value="Puri">Puri District</option>
              </select>
            </div>

            {/* LEAFLET MAP CONTAINER */}
            <div ref={mapContainerRef} className="w-full h-[450px] rounded-xl border border-border-soft overflow-hidden relative z-0" />

            {/* MAP LEGEND */}
            <div className="flex items-center justify-between pt-2 border-t border-border-soft text-[10px] font-mono text-text-dim">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand" /> PCR Van</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Cheetah Bike</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning" /> QRT Interceptor</span>
              </div>
              <span className="text-emerald-400 font-bold">● Dashed Line = 2s Real-Time Vector Trail</span>
            </div>
          </div>

          {/* DARK ZONE HOTSPOT RECOMMENDATIONS */}
          <div className="glass p-5 rounded-2xl bg-surface/90 border border-amber-500/30 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border-soft pb-2.5">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle size={14} /> JURISDICTION DARK ZONE HOTSPOTS & DISPATCH GUIDANCE
              </span>
              <span className="text-[10px] font-mono text-text-dim">AI Predictive Night Grid</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {DARK_ZONES.map((zone, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-surface-2 border border-border-soft flex flex-col justify-between gap-2 font-mono text-xs">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-danger/20 text-danger-bright">
                        {zone.risk_level}
                      </span>
                      <span className="text-[9px] text-text-faint">{zone.window}</span>
                    </div>

                    <h4 className="font-bold text-text text-xs">{zone.corridor}</h4>
                    <p className="text-[10px] text-text-dim mt-1">{zone.crime_vector}</p>
                    <p className="text-[10px] text-brand bg-brand/10 p-2 rounded-lg border border-brand/20 mt-2">
                      💡 {zone.recommended_patrol}
                    </p>
                  </div>

                  <button
                    onClick={() => handleQuickDeploy(zone.corridor)}
                    className="w-full py-1.5 rounded-lg bg-brand text-bg font-bold text-[10px] hover:bg-brand-bright transition-colors shadow-sm cursor-pointer"
                  >
                    Deploy {selectedUnit.callsign} Here →
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT 4 COLS: SELECTED UNIT TELEMETRY & RADIO DISPATCH DIRECTIVE */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="glass p-5 rounded-2xl bg-surface/90 border border-border-strong space-y-4 shadow-xl font-mono text-xs">
            <div className="border-b border-border-soft pb-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-brand uppercase tracking-wider block">SELECTED UNIT TELEMETRY</span>
                <h3 className="text-base font-bold text-text mt-0.5">{selectedUnit.callsign}</h3>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                {selectedUnit.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded-xl bg-surface-2 border border-border-soft">
                <span className="text-text-dim text-[9px] block">UNIT TYPE</span>
                <span className="font-bold text-text">{selectedUnit.type}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-2 border border-border-soft">
                <span className="text-text-dim text-[9px] block">OFFICER IN CHARGE</span>
                <span className="font-bold text-text truncate block">{selectedUnit.officer}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-2 border border-border-soft">
                <span className="text-text-dim text-[9px] block">MOVING SPEED</span>
                <span className="font-bold text-brand text-sm">{selectedUnit.speedKmH} km/h</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-2 border border-border-soft">
                <span className="text-text-dim text-[9px] block">FUEL RESERVES</span>
                <span className="font-bold text-emerald-400 text-sm">{selectedUnit.fuel}%</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-surface-2 border border-border-soft space-y-1 text-[11px]">
              <span className="text-text-dim text-[9px] block">ACTIVE BEAT PRECINCT</span>
              <span className="font-bold text-text block">{selectedUnit.precinct}</span>
              <span className="text-text-faint text-[10px]">District: {selectedUnit.district}</span>
            </div>

            {/* RADIO DISPATCH TRANSMIT FORM */}
            <form onSubmit={handleRedeploy} className="space-y-2.5 pt-2 border-t border-border-soft">
              <span className="font-bold text-text text-xs block">DISPATCH NEW BEAT TARGET:</span>
              <input
                type="text"
                value={newTarget}
                onChange={(e) => setNewTarget(e.target.value)}
                placeholder="e.g. Khandagiri Square, Master Canteen..."
                className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-border-soft text-text placeholder:text-text-faint outline-none focus:border-brand text-xs font-mono"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-brand text-bg font-bold font-mono text-xs hover:bg-brand-bright transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Send size={14} />
                <span>TRANSMIT RADIO DISPATCH ORDER</span>
              </button>
            </form>
          </div>

          {/* UNIT ROSTER QUICK SWITCHER */}
          <div className="glass p-5 rounded-2xl bg-surface/90 border border-border-soft space-y-3 font-mono text-xs">
            <span className="font-bold text-text block">SELECT PATROL UNIT:</span>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {filteredUnits.map(unit => (
                <button
                  key={unit.id}
                  onClick={() => setSelectedUnit(unit)}
                  className={`w-full p-2.5 rounded-xl text-left border transition-all flex items-center justify-between cursor-pointer ${
                    selectedUnit.id === unit.id
                      ? 'bg-brand/20 border-brand text-text'
                      : 'bg-surface-2 border-border-soft text-text-dim hover:text-text'
                  }`}
                >
                  <div>
                    <span className="font-bold block text-text">{unit.callsign}</span>
                    <span className="text-[10px] text-text-dim">{unit.precinct}</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400">{unit.speedKmH} km/h</span>
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
