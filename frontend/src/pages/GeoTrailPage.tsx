import React, { useState, useEffect, useMemo } from 'react';
import { 
  Navigation, Play, Pause, RotateCcw,
  AlertTriangle, Eye, Search, Car,
  Download, Share2, Zap, Check, Activity
} from 'lucide-react';
import { TacticalTrailMapView } from '../components/intelligence/TacticalTrailMapView';
import { useNavigate, useSearchParams } from 'react-router-dom';

// ── ODISHA MULTI-VEHICLE ANPR DATABASE (RICH SCENARIOS) ──────────────────
export interface RelatedVehicle {
  plate: string;
  camera: string;
  time: string;
  delta: string;
}

export interface TrailHop {
  hop: number;
  cameraId: string;
  cameraName: string;
  lat: number;
  lng: number;
  timestamp: string;
  plateDetected: string;
  confidence: number;
  sightingType: string;
  distanceFromCrimeKm: number;
}

export interface VehicleTrailData {
  target: string;
  crimeLinked: string;
  trailStatus: string;
  durationMinutes: number;
  totalDistanceKm: number;
  vehicleType: string;
  relatedVehicles: RelatedVehicle[];
  trail: TrailHop[];
  potentialCctvSuggestions?: {
    cameraId: string;
    cameraName: string;
    location: string;
    distanceKm: number;
    etaMinutes: number;
    probability: number;
  }[];
}

const ODISHA_VEHICLE_TRAILS: Record<string, VehicleTrailData> = {
  // 1. ESCAPE VECTOR TARGET (4 HOPS WITH HIGH SPEED ANOMALY & NEXT CCTV PREDICTION)
  'OD-02-MJ-8821': {
    target: 'Ramesh Kumar (Bullet Ramesh)',
    crimeLinked: 'FIR-2026-BBSR-0492 (Armed Robbery & Vehicle Hijack)',
    trailStatus: 'active',
    durationMinutes: 48,
    totalDistanceKm: 12.1,
    vehicleType: 'Hyundai Creta SUV (Silver)',
    relatedVehicles: [
      { plate: 'OD-02-EZ-4410', camera: 'Master Canteen BATCS Signal Pole 5', time: '14:37 IST', delta: '+2m' },
      { plate: 'OD-02-HA-4512', camera: 'Palasuni Toll Plaza Checkpost', time: '14:48 IST', delta: '+2m' },
    ],
    potentialCctvSuggestions: [
      { cameraId: 'CAM-CTC-0010', cameraName: 'Link Road Bridge Checkpoint', location: 'Cuttack Entry Corridor', distanceKm: 4.2, etaMinutes: 6, probability: 94.2 },
      { cameraId: 'CAM-CTC-0015', cameraName: 'Badambadi Bus Stand Gate 2', location: 'Cuttack Central', distanceKm: 7.8, etaMinutes: 12, probability: 88.5 },
    ],
    trail: [
      {
        hop: 1,
        cameraId: 'CAM-BBSR-0010',
        cameraName: 'Khandagiri Square ANPR Cam #01',
        lat: 20.2589,
        lng: 85.7821,
        timestamp: '2026-08-21T14:22:10Z',
        plateDetected: 'OD-02-MJ-8821',
        confidence: 98.4,
        sightingType: 'ANPR Sighting',
        distanceFromCrimeKm: 0.2,
      },
      {
        hop: 2,
        cameraId: 'CAM-BBSR-0012',
        cameraName: 'Master Canteen BATCS Signal Pole 5',
        lat: 20.2741,
        lng: 85.8012,
        timestamp: '2026-08-21T14:35:45Z',
        plateDetected: 'OD-02-MJ-8821',
        confidence: 96.1,
        sightingType: 'Traffic Signal',
        distanceFromCrimeKm: 3.4,
      },
      {
        hop: 3,
        cameraId: 'CAM-BBSR-0015',
        cameraId2: 'CAM-BBSR-0015',
        cameraName: 'Saheed Nagar Flyover Dome ANPR 15',
        lat: 20.3012,
        lng: 85.8450,
        timestamp: '2026-08-21T14:41:00Z',
        plateDetected: 'OD-02-MJ-8821',
        confidence: 88.2,
        sightingType: 'ANPR Sighting',
        distanceFromCrimeKm: 7.8,
      },
      {
        hop: 4,
        cameraId: 'CAM-BBSR-0050',
        cameraName: 'Palasuni Toll Plaza Checkpost',
        lat: 20.3344,
        lng: 85.8723,
        timestamp: '2026-08-21T14:46:30Z',
        plateDetected: 'OD-02-MJ-8821',
        confidence: 95.5,
        sightingType: 'Toll Checkpoint',
        distanceFromCrimeKm: 12.1,
      },
    ],
  },

  // 2. CLEAN HIGH-CONFIDENCE TRAIL (5 HOPS)
  'OD-02-AB-1234': {
    target: 'Suresh Reddy (Highway Transit)',
    crimeLinked: 'FIR-2026-CTC-0112 (Cargo Hijack Routine Surveillance)',
    trailStatus: 'active',
    durationMinutes: 35,
    totalDistanceKm: 10.4,
    vehicleType: 'Mahindra Bolero Pickup (White)',
    relatedVehicles: [
      { plate: 'OD-02-MH-1102', camera: 'Rasulgarh Flyover BATCS Camera 14', time: '09:32 IST', delta: '+2m' },
      { plate: 'OD-02-P-9941', camera: 'Cuttack Sadar Bridge Checkpost', time: '09:51 IST', delta: '+1m' },
    ],
    potentialCctvSuggestions: [
      { cameraId: 'CAM-CTC-0022', cameraName: 'OMP Square Junction ANPR', location: 'Cuttack Industrial Belt', distanceKm: 3.5, etaMinutes: 5, probability: 96.1 },
    ],
    trail: [
      {
        hop: 1,
        cameraId: 'CAM-BBSR-0301',
        cameraName: 'Patia 80ft Road ANPR Cam #02',
        lat: 20.3522,
        lng: 85.8245,
        timestamp: '2026-08-21T09:15:00Z',
        plateDetected: 'OD-02-AB-1234',
        confidence: 98.7,
        sightingType: 'ANPR Sighting',
        distanceFromCrimeKm: 0.3,
      },
      {
        hop: 2,
        cameraId: 'CAM-BBSR-0305',
        cameraName: 'InfoCity Signal Junction',
        lat: 20.3612,
        lng: 85.8321,
        timestamp: '2026-08-21T09:23:00Z',
        plateDetected: 'OD-02-AB-1234',
        confidence: 97.2,
        sightingType: 'Traffic Signal',
        distanceFromCrimeKm: 2.1,
      },
      {
        hop: 3,
        cameraId: 'CAM-BBSR-0310',
        cameraName: 'Rasulgarh Flyover BATCS Camera 14',
        lat: 20.3101,
        lng: 85.8582,
        timestamp: '2026-08-21T09:30:00Z',
        plateDetected: 'OD-02-AB-1234',
        confidence: 96.5,
        sightingType: 'Traffic Signal',
        distanceFromCrimeKm: 3.5,
      },
      {
        hop: 4,
        cameraId: 'CAM-BBSR-0318',
        cameraName: 'Nakhara Bypass Surveillance Post',
        lat: 20.3892,
        lng: 85.8741,
        timestamp: '2026-08-21T09:38:00Z',
        plateDetected: 'OD-02-AB-1234',
        confidence: 95.8,
        sightingType: 'CCTV Sweep',
        distanceFromCrimeKm: 5.8,
      },
      {
        hop: 5,
        cameraId: 'CAM-CTC-0325',
        cameraName: 'Cuttack Sadar Bridge Checkpost',
        lat: 20.4564,
        lng: 85.8982,
        timestamp: '2026-08-21T09:50:00Z',
        plateDetected: 'OD-02-AB-1234',
        confidence: 97.9,
        sightingType: 'Toll Checkpoint',
        distanceFromCrimeKm: 10.4,
      },
    ],
  },

  // 3. SUSPICIOUS GAP TRAIL (UNUSUAL STOP OVER GAP ANOMALY)
  'OD-09-RT-7765': {
    target: 'Manjunath B. (SUS-9921)',
    crimeLinked: 'FIR-2026-BBSR-0732 (Commercial Burglary)',
    trailStatus: 'flagged',
    durationMinutes: 64,
    totalDistanceKm: 7.2,
    vehicleType: 'Maruti Swift Dzire (Dark Gray)',
    relatedVehicles: [
      { plate: 'OD-02-AB-9901', camera: 'Esplanade Mall Back Gate CCTV Sweep', time: '15:55 IST', delta: '+2m' },
    ],
    potentialCctvSuggestions: [
      { cameraId: 'CAM-BBSR-0440', cameraName: 'Tamando Checkpost NH-16', location: 'Bhubaneswar South Exit', distanceKm: 5.1, etaMinutes: 8, probability: 91.0 },
    ],
    trail: [
      {
        hop: 1,
        cameraId: 'CAM-BBSR-0401',
        cameraName: 'Old Town Lingaraj Temple ANPR #01',
        lat: 20.2381,
        lng: 85.8334,
        timestamp: '2026-08-21T15:00:00Z',
        plateDetected: 'OD-09-RT-7765',
        confidence: 96.8,
        sightingType: 'ANPR Sighting',
        distanceFromCrimeKm: 0.4,
      },
      {
        hop: 2,
        cameraId: 'CAM-BBSR-0405',
        cameraName: 'Kalpana Square BATCS Junction',
        lat: 20.2512,
        lng: 85.8412,
        timestamp: '2026-08-21T15:08:00Z',
        plateDetected: 'OD-09-RT-7765',
        confidence: 94.5,
        sightingType: 'Traffic Signal',
        distanceFromCrimeKm: 2.1,
      },
      {
        hop: 3,
        cameraId: 'CAM-BBSR-0412',
        cameraName: 'Esplanade Mall Back Gate CCTV Sweep',
        lat: 20.2872,
        lng: 85.8682,
        timestamp: '2026-08-21T15:53:00Z',
        plateDetected: 'OD-09-RT-7765',
        confidence: 89.1,
        sightingType: 'CCTV Sweep',
        distanceFromCrimeKm: 3.9,
      },
      {
        hop: 4,
        cameraId: 'CAM-BBSR-0420',
        cameraName: 'Bhubaneswar Railway Station Checkpost',
        lat: 20.2684,
        lng: 85.8401,
        timestamp: '2026-08-21T16:04:00Z',
        plateDetected: 'OD-09-RT-7765',
        confidence: 96.2,
        sightingType: 'Toll Checkpoint',
        distanceFromCrimeKm: 7.2,
      },
    ],
  },
};

// ── UTILITY FUNCTIONS ─────────────────────────────────────────────────────────
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function analyzeHopInsights(hop: TrailHop, prevHop: TrailHop | null) {
  if (!prevHop || !hop.timestamp || !prevHop.timestamp) {
    return { speedKmh: null, diffMinutes: null, anomaly: null };
  }

  const t1 = new Date(prevHop.timestamp).getTime();
  const t2 = new Date(hop.timestamp).getTime();
  const diffMinutes = Math.max(1, Math.round((t2 - t1) / (1000 * 60)));

  const distKm = calculateDistance(prevHop.lat, prevHop.lng, hop.lat, hop.lng);
  const hours = diffMinutes / 60;
  const speedKmh = Math.round(distKm / hours);

  let anomaly: { type: string; label: string; variant: string; detail: string } | null = null;
  if (speedKmh > 85) {
    anomaly = {
      type: 'speed',
      label: `HIGH SPEED (${speedKmh} km/h)`,
      variant: 'critical',
      detail: `Implied speed of ${speedKmh} km/h exceeds urban road limits. Check for potential fake plate swap.`,
    };
  } else if (diffMinutes > 40 && distKm < 4) {
    anomaly = {
      type: 'gap',
      label: `UNUSUAL GAP (${diffMinutes}m)`,
      variant: 'warning',
      detail: `${diffMinutes} minute gap over only ${distKm.toFixed(1)} km. Possible stopover or hideout area.`,
    };
  }

  return { speedKmh, diffMinutes, anomaly };
}

export function GeoTrailPage() {
  const [searchParams] = useSearchParams();
  const initialPlate = searchParams.get('plate') || 'OD-02-MJ-8821';
  const [searchQuery, setSearchQuery] = useState<string>(initialPlate);
  const [selectedPlate, setSelectedPlate] = useState<string>(initialPlate);
  const [trailData, setTrailData] = useState<VehicleTrailData | null>(ODISHA_VEHICLE_TRAILS[initialPlate] || ODISHA_VEHICLE_TRAILS['OD-02-MJ-8821']);
  const [selectedHop, setSelectedHop] = useState<number | null>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [scrubberPercent, setScrubberPercent] = useState<number>(0);
  const [copyToast, setCopyToast] = useState<boolean>(false);

  const navigate = useNavigate();

  useEffect(() => {
    const entry = ODISHA_VEHICLE_TRAILS[selectedPlate] || ODISHA_VEHICLE_TRAILS['OD-02-MJ-8821'];
    setTrailData(entry);
    setSelectedHop(1);
    setScrubberPercent(0);
    setIsPlaying(false);
  }, [selectedPlate]);

  // Scrubber playback timer effect
  useEffect(() => {
    if (!isPlaying) return;
    const step = 2.5;
    const timer = setInterval(() => {
      setScrubberPercent((prev) => {
        if (prev >= 100) {
          setIsPlaying(false);
          return 100;
        }
        return Math.min(100, prev + step);
      });
    }, 100);
    return () => clearInterval(timer);
  }, [isPlaying]);

  // Average match percentage calculation
  const averageMatchPercent = useMemo(() => {
    if (!trailData || trailData.trail.length === 0) return 0;
    const total = trailData.trail.reduce((acc, h) => acc + (h.confidence || 95), 0);
    return (total / trailData.trail.length).toFixed(1);
  }, [trailData]);

  const activeHop = trailData?.trail.find(h => h.hop === selectedHop) || trailData?.trail[0];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toUpperCase();
      setSelectedPlate(q);
    }
  };

  const handleExportReport = () => {
    if (!trailData) return;
    const reportText =
      `=======================================================\n` +
      `S.I.R.I.S — ODISHA POLICE INTELLIGENCE COMMAND\n` +
      `SUSPECT VEHICLE GEO-TRAIL TACTICAL REPORT\n` +
      `=======================================================\n\n` +
      `Target Plate:     ${selectedPlate}\n` +
      `Vehicle Type:     ${trailData.vehicleType}\n` +
      `Suspect Linked:   ${trailData.target}\n` +
      `Linked Case:      ${trailData.crimeLinked}\n` +
      `Trail Status:     ${trailData.trailStatus.toUpperCase()}\n` +
      `Total Hops:       ${trailData.trail.length}\n` +
      `Avg Match %:      ${averageMatchPercent}%\n` +
      `Total Distance:   ${trailData.totalDistanceKm} km\n` +
      `Total Duration:   ${trailData.durationMinutes} minutes\n` +
      `Generated At:     ${new Date().toLocaleString('en-IN')} IST\n\n` +
      `-------------------------------------------------------\n` +
      `CHRONOLOGICAL ANPR & CCTV SIGHTINGS TIMELINE:\n` +
      `-------------------------------------------------------\n` +
      trailData.trail
        .map((hop, i) => {
          const prev = i > 0 ? trailData.trail[i - 1] : null;
          const { speedKmh: spd, anomaly } = analyzeHopInsights(hop, prev);
          const speedStr = spd ? ` | Speed: ${spd} km/h` : '';
          const anomalyStr = anomaly ? ` [ANOMALY: ${anomaly.label}]` : '';

          return (
            `[HOP ${hop.hop}] ${new Date(hop.timestamp).toLocaleString('en-IN')}\n` +
            `  Camera:      ${hop.cameraName} (${hop.cameraId})\n` +
            `  Coordinates: ${hop.lat.toFixed(4)}, ${hop.lng.toFixed(4)}\n` +
            `  Confidence:  ${hop.confidence}% Match\n` +
            `  Distance:    ${hop.distanceFromCrimeKm} km from origin${speedStr}${anomalyStr}\n\n`
          );
        })
        .join('') +
      `-------------------------------------------------------\n` +
      `PROJECTED VECTOR ANALYSIS:\n` +
      `-------------------------------------------------------\n` +
      `Next Projected Heading: Extrapolated from Hop ${trailData.trail.length - 1} -> Hop ${trailData.trail.length}\n` +
      `Status: UNCONFIRMED PROJECTION (Tactical surveillance recommended)\n` +
      `=======================================================\n`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SIRIS_GeoTrail_${selectedPlate}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopySummary = () => {
    if (!trailData) return;
    const text = `[S.I.R.I.S GEO-TRAIL SUMMARY] Target: ${selectedPlate} (${trailData.vehicleType}) | Suspect: ${trailData.target} | Hops: ${trailData.trail.length} | Dist: ${trailData.totalDistanceKm}km | Duration: ${trailData.durationMinutes}m | Last Sight: ${trailData.trail[trailData.trail.length - 1].cameraName} at ${new Date(trailData.trail[trailData.trail.length - 1].timestamp).toLocaleTimeString()}`;
    navigator.clipboard.writeText(text);
    setCopyToast(true);
    setTimeout(() => setCopyToast(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-20 select-none font-sans">
      {/* Header Bar */}
      <div className="glass p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface border border-border-soft">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono bg-danger/10 text-danger-bright px-2.5 py-0.5 rounded border border-danger/30 font-bold flex items-center gap-1">
              <Navigation size={12} /> VEHICLE GEO-TRAIL RECONSTRUCTION
            </span>
            <span className="text-[10px] font-mono text-success font-bold flex items-center gap-1">
              <Activity size={10} className="animate-pulse" /> SPATIAL VECTOR ACTIVE
            </span>
          </div>
          <h1 className="text-2xl font-bold font-mono text-text flex items-center gap-2">
            Trajectory Reconstruction Matrix
          </h1>
          <p className="text-xs text-text-dim mt-1">
            Odisha Police optical ANPR surveillance corridor · Camera hop timeline telemetry & flight path projection
          </p>
        </div>

        {/* Action Controls & Search Input */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="text-text-dim absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Plate (e.g. OD-02-MJ-8821)..."
                className="pl-9 pr-3 py-2 rounded-xl bg-surface-2 border border-border-soft text-xs font-mono font-bold text-text outline-none focus:border-brand w-52"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-brand text-bg text-xs font-bold font-mono hover:bg-brand-bright transition-colors shadow-xs"
            >
              SEARCH
            </button>
          </form>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportReport}
              className="p-2 rounded-xl bg-surface-2 border border-border-soft text-text hover:text-brand transition-colors"
              title="Download Tactical Report (.txt)"
            >
              <Download size={16} />
            </button>
            <button
              onClick={handleCopySummary}
              className="p-2 rounded-xl bg-surface-2 border border-border-soft text-text hover:text-brand transition-colors"
              title="Copy Briefing Summary"
            >
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {copyToast && (
        <div className="px-4 py-2 rounded-xl bg-success/20 border border-success/40 text-success text-xs font-mono font-bold animate-fade-in flex items-center gap-2">
          <Check size={14} /> Tactical Summary copied to clipboard!
        </div>
      )}

      {/* Target Presets Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 font-mono text-xs">
        <span className="text-text-dim text-[11px] font-bold uppercase shrink-0">Preset Targets:</span>
        {[
          { plate: 'OD-02-MJ-8821', label: 'Robbery Escape (4 Hops)', status: 'HIGH RISK' },
          { plate: 'OD-02-AB-1234', label: 'Cargo Hijack (5 Hops)', status: 'ANPR MATCH' },
          { plate: 'OD-09-RT-7765', label: 'Burglary Gap (4 Hops)', status: 'UNUSUAL GAP' },
        ].map((item) => (
          <button
            key={item.plate}
            onClick={() => {
              setSearchQuery(item.plate);
              setSelectedPlate(item.plate);
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              selectedPlate === item.plate
                ? 'bg-brand/15 border-brand text-brand shadow-xs'
                : 'bg-surface border-border-soft text-text-dim hover:text-text'
            }`}
          >
            <Car size={13} />
            <span>{item.plate}</span>
            <span className="opacity-75 text-[10px]">({item.label})</span>
          </button>
        ))}
      </div>

      {trailData && (
        <>
          {/* Top Telemetry KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
            <div className="glass p-4 rounded-2xl bg-surface border border-border-soft space-y-1">
              <div className="text-[10px] text-text-dim uppercase tracking-wider">Total Hops Flagged</div>
              <div className="text-2xl font-bold text-brand">{trailData.trail.length} Cameras</div>
              <div className="text-[10px] text-text-faint">Avg Match: {averageMatchPercent}%</div>
            </div>

            <div className="glass p-4 rounded-2xl bg-surface border border-border-soft space-y-1">
              <div className="text-[10px] text-text-dim uppercase tracking-wider">Distance Traversed</div>
              <div className="text-2xl font-bold text-text">{trailData.totalDistanceKm} km</div>
              <div className="text-[10px] text-text-faint">NH-16 Surveillance Corridor</div>
            </div>

            <div className="glass p-4 rounded-2xl bg-surface border border-border-soft space-y-1">
              <div className="text-[10px] text-text-dim uppercase tracking-wider">Flight Duration</div>
              <div className="text-2xl font-bold text-text">{trailData.durationMinutes} mins</div>
              <div className="text-[10px] text-text-faint">Active Trajectory</div>
            </div>

            <div className="glass p-4 rounded-2xl bg-surface border border-border-soft space-y-1">
              <div className="text-[10px] text-text-dim uppercase tracking-wider">Target Suspect</div>
              <div className="text-sm font-bold text-danger-bright truncate">{trailData.target}</div>
              <div className="text-[10px] text-text-dim truncate">{trailData.vehicleType}</div>
            </div>
          </div>

          {/* Main Map & Hop Controls Section */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Leaflet GIS Map */}
            <div className="lg:col-span-2 space-y-4">
              <div className="h-[460px] glass rounded-2xl overflow-hidden border border-border-soft relative shadow-2xl">
                <TacticalTrailMapView
                  targetPlate={selectedPlate}
                  totalDistanceKm={trailData.totalDistanceKm}
                  durationMinutes={trailData.durationMinutes}
                  trailData={trailData.trail.map(h => ({
                    hop: h.hop,
                    cameraId: h.cameraId,
                    cameraName: h.cameraName,
                    lat: h.lat,
                    lng: h.lng,
                    timestamp: h.timestamp,
                    confidence: h.confidence,
                    distanceFromCrimeKm: h.distanceFromCrimeKm,
                    sightingType: h.sightingType || 'ANPR'
                  }))}
                  highlightedHop={selectedHop}
                  onHopSelect={(h) => setSelectedHop(h)}
                />
              </div>

              {/* Replay Controls & Timeline Scrubber Bar */}
              <div className="glass p-4 rounded-xl bg-surface border border-border-soft space-y-3 font-mono">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="px-4 py-2 rounded-xl bg-brand text-bg font-bold text-xs hover:bg-brand-bright transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                      <span>{isPlaying ? 'PAUSE REPLAY' : 'PLAY TRAJECTORY REPLAY'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsPlaying(false);
                        setScrubberPercent(0);
                        setSelectedHop(1);
                      }}
                      className="p-2 rounded-xl bg-surface-2 border border-border text-text-dim hover:text-text transition-colors"
                      title="Reset Replay"
                    >
                      <RotateCcw size={15} />
                    </button>
                  </div>

                  <span className="text-xs text-text-dim">
                    REPLAY PROGRESS: <strong className="text-brand">{Math.round(scrubberPercent)}%</strong>
                  </span>
                </div>

                {/* Timeline Scrubber Slider */}
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={scrubberPercent}
                  onChange={(e) => {
                    const pct = parseFloat(e.target.value);
                    setScrubberPercent(pct);
                    const idx = Math.min(
                      trailData.trail.length - 1,
                      Math.floor((pct / 100) * trailData.trail.length)
                    );
                    setSelectedHop(trailData.trail[idx].hop);
                  }}
                  className="w-full h-2 bg-surface-2 rounded-lg appearance-none cursor-pointer accent-brand"
                />
              </div>
            </div>

            {/* Right Col: Hop Sequence List & AI Prediction Panels */}
            <div className="space-y-4">
              {/* Hop Sequence List */}
              <div className="glass p-5 rounded-2xl bg-surface border border-border-soft space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider border-b border-border-soft pb-2 text-text font-mono flex items-center justify-between">
                  <span>Camera Hop Sequence</span>
                  <span className="text-[10px] text-brand">NH-16 CORRIDOR</span>
                </h3>

                <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1 font-mono">
                  {trailData.trail.map((hop, idx) => {
                    const prev = idx > 0 ? trailData.trail[idx - 1] : null;
                    const { anomaly } = analyzeHopInsights(hop, prev);

                    return (
                      <div
                        key={hop.hop}
                        onClick={() => setSelectedHop(hop.hop)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                          selectedHop === hop.hop
                            ? 'border-brand bg-brand/10 shadow-sm'
                            : 'border-border-soft bg-surface-2 hover:bg-surface-hover'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            hop.hop === 1 ? 'bg-danger/20 text-danger-bright border-danger/30' :
                            hop.hop === trailData.trail.length ? 'bg-success/20 text-success border-success/30' :
                            'bg-brand/20 text-brand border-brand/30'
                          }`}>
                            {hop.hop === 1 ? 'INCIDENT ORIGIN' : hop.hop === trailData.trail.length ? 'LAST KNOWN SIGHTING' : `HOP #${hop.hop}`}
                          </span>

                          <span className="text-[10px] text-success font-bold">
                            {hop.confidence}% MATCH
                          </span>
                        </div>

                        <div className="text-xs font-bold text-text">
                          {hop.cameraId} · {hop.cameraName}
                        </div>

                        <div className="text-[11px] text-text-dim flex items-center justify-between">
                          <span>Time: {new Date(hop.timestamp).toLocaleTimeString()}</span>
                          <span>Dist: {hop.distanceFromCrimeKm} km</span>
                        </div>

                        {/* Anomaly Badge if present */}
                        {anomaly && (
                          <div className={`p-2 rounded-lg text-[10px] font-bold flex items-center gap-1.5 ${
                            anomaly.variant === 'critical'
                              ? 'bg-danger/10 text-danger-bright border border-danger/20'
                              : 'bg-warning/10 text-warning-bright border border-warning/20'
                          }`}>
                            <AlertTriangle size={12} className="shrink-0" />
                            <span>{anomaly.label}: {anomaly.detail}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Potential CCTV Sensor Suggestions Card */}
              {trailData.potentialCctvSuggestions && trailData.potentialCctvSuggestions.length > 0 && (
                <div className="glass p-5 rounded-2xl bg-surface border border-border-soft space-y-3 font-mono">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-brand flex items-center gap-1.5 border-b border-border-soft pb-2">
                    <Zap size={14} className="animate-pulse text-brand" />
                    Potential Next CCTV Sensors (AI Prediction)
                  </h4>
                  <div className="space-y-2">
                    {trailData.potentialCctvSuggestions.map((sug) => (
                      <div
                        key={sug.cameraId}
                        className="p-3 rounded-xl bg-brand/5 border border-brand/20 space-y-1 hover:border-brand/40 transition-colors"
                      >
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-brand">{sug.cameraId} · {sug.cameraName}</span>
                          <span className="text-success text-[10px]">{sug.probability}% ETA: +{sug.etaMinutes}m</span>
                        </div>
                        <p className="text-[11px] text-text-dim">{sug.location} ({sug.distanceKm} km along escape vector)</p>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => navigate('/cctv')}
                    className="w-full py-2 bg-brand text-bg rounded-xl font-bold text-xs hover:bg-brand-bright transition-colors flex items-center justify-center gap-1.5 mt-2"
                  >
                    <Eye size={13} /> INSPECT CCTV MATRIX FEEDS
                  </button>
                </div>
              )}

              {/* Active Hop Detailed Dossier */}
              {activeHop && (
                <div className="glass p-5 rounded-2xl bg-surface border border-border-soft space-y-3 font-mono">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-brand border-b border-border-soft pb-2">
                    Active Hop Telemetry — Hop #{activeHop.hop}
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-text-dim">Camera ID:</span>
                      <span className="font-bold text-text">{activeHop.cameraId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-dim">Sensor Name:</span>
                      <span className="font-bold text-text truncate max-w-[180px]">{activeHop.cameraName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-dim">Timestamp:</span>
                      <span className="font-bold text-text">{new Date(activeHop.timestamp).toLocaleTimeString()} IST</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-dim">Distance:</span>
                      <span className="font-bold text-text">{activeHop.distanceFromCrimeKm} km from origin</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
