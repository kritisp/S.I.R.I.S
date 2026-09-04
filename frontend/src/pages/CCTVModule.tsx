import React, { useState, useEffect } from 'react';
import { 
  Video, Play, Pause, Search, Radio, Crosshair, 
  AlertTriangle, Navigation, Maximize2, X,
  ShieldAlert, CheckCircle2, Target, FileText
} from 'lucide-react';
import { VehicleGeoTrailModal } from '../components/intelligence/VehicleGeoTrailModal';
import { VehicleIntelligenceModal } from '../components/intelligence/VehicleIntelligenceModal';
import { useNavigate, useSearchParams } from 'react-router-dom';

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/vedeshskhatri/kspdatathon2026@6b33c15b04de078cc4b0723c051a559d69cd6e64/nextjs/public/videos';

// Web Audio Synthesizer for Surveillance Alerts
function playSurveillanceSound(type: 'beep' | 'lock' | 'alert') {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === 'beep') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'lock') {
      [0, 0.05].forEach((delay, idx) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'sine';
        o.frequency.setValueAtTime(1100 + idx * 250, now + delay);
        g.gain.setValueAtTime(0.2, now + delay);
        g.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.04);
        o.start(now + delay); o.stop(now + delay + 0.04);
      });
    } else if (type === 'alert') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.linearRampToValueAtTime(1100, now + 0.25);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.start(now); osc.stop(now + 0.4);
    }
  } catch (e) {
    console.warn('[Surveillance Sound]', e);
  }
}

function speakDrishtiAlert(text: string) {
  if (!text || typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Ignore speech audio error
  }
}

export interface CameraProfile {
  id: string;
  name: string;
  location: string;
  type: 'anpr' | 'face_recognition' | 'crowd_density' | 'perimeter';
  is_active: boolean;
  has_anpr: boolean;
  has_face_recog: boolean;
  videoUrl: string;
  suspectName?: string;
  suspectAlias?: string;
  riskScore: number;
  confidence: number;
  firNumber: string;
  legalSection: string;
  incidentBriefing: string;
  targetCue?: string;
  drishtiSpeech?: string;
}

// S.I.R.I.S. Odisha Police Camera Network (Bhubaneswar-Cuttack Surveillance Matrix)
const SURVEILLANCE_CAMERAS: CameraProfile[] = [
  {
    id: 'CAM-BBSR-0015',
    name: 'Saheed Nagar Commercial Intersection',
    location: 'Saheed Nagar Commercial Hub, Bhubaneswar',
    type: 'anpr',
    is_active: true,
    has_anpr: true,
    has_face_recog: false,
    videoUrl: `${CDN_BASE}/traffic2.mp4`,
    suspectName: 'KLO5AN6247',
    suspectAlias: 'White Compact SUV (KLO5AN6247)',
    riskScore: 88,
    confidence: 94.2,
    firNumber: 'FIR-2026-BBSR-8821',
    legalSection: 'BNS §303 (Vehicle Hotlist Watchlist)',
    incidentBriefing: 'Target vehicle KLO5AN6247 flagged passing flyover approach. Vehicle co-linked to watchlist syndicate.',
    targetCue: 'Vehicle entering checkpoint lane near flyover ramp',
    drishtiSpeech: 'Alert. License plate hit confirmed on Camera BBSR 0015 for KLO5AN6247.'
  },
  {
    id: 'CAM-BBSR-0010',
    name: 'Khandagiri Square Checkpoint',
    location: 'Khandagiri Intersection, Bhubaneswar',
    type: 'anpr',
    is_active: true,
    has_anpr: true,
    has_face_recog: false,
    videoUrl: `${CDN_BASE}/traffic1.mp4`,
    suspectName: 'OD-02-AB-1234',
    suspectAlias: 'Silver Maruti Suzuki Swift',
    riskScore: 91,
    confidence: 99.1,
    firNumber: 'FIR-2026-CTC-0112',
    legalSection: 'BNS §303 (Stolen Vehicle Watchlist)',
    incidentBriefing: 'Silver Maruti Swift flagged by optical ANPR sensor entering Khandagiri intersection. Vehicle reported stolen from Cuttack Sadar (FIR-2026-CTC-0112).',
    targetCue: 'Silver Maruti Swift approaching traffic checkpoint lane',
    drishtiSpeech: 'ANPR Alert. Stolen vehicle OD 02 AB 1234 detected at Khandagiri Checkpoint.'
  },
  {
    id: 'CAM-BBSR-0012',
    name: 'Master Canteen Square Arcade',
    location: 'Master Canteen, Bhubaneswar',
    type: 'face_recognition',
    is_active: true,
    has_anpr: false,
    has_face_recog: true,
    videoUrl: `${CDN_BASE}/people1.mp4`,
    suspectName: 'Ramesh Kumar',
    suspectAlias: 'Bullet Ramesh',
    riskScore: 94,
    confidence: 96.1,
    firNumber: 'FIR-2024-BBSR-0842',
    legalSection: 'BNS §303, §309 (Serial Vehicle Theft & Robbery)',
    incidentBriefing: 'Prime kingpin Ramesh Kumar identified on Master Canteen walkway. Active non-bailable warrant in multiple vehicle theft syndicates.',
    targetCue: 'Subject in dark jacket walking along pedestrian walkway towards camera',
    drishtiSpeech: 'Alert. Suspect match confirmed on Camera BBSR 0012. Bullet Ramesh at Master Canteen Square.'
  },
  {
    id: 'CAM-BBSR-0042',
    name: 'Patia InfoCity Junction',
    location: 'InfoCity Patia, Bhubaneswar',
    type: 'face_recognition',
    is_active: true,
    has_anpr: false,
    has_face_recog: true,
    videoUrl: `${CDN_BASE}/people2.mp4`,
    suspectName: 'Suresh Naidu',
    suspectAlias: 'Snake Naidu',
    riskScore: 88,
    confidence: 92.8,
    firNumber: 'FIR-2026-BBSR-4921',
    legalSection: 'BNS §318, §61 (Extortion & Highway Loot)',
    incidentBriefing: 'Co-accused Suresh Naidu spotted at InfoCity portico entrance. Subject associated with active inter-district extortion syndicate.',
    targetCue: 'Subject standing near building entrance portico',
    drishtiSpeech: 'Alert. Facial hit confirmed on Camera BBSR 0042. Suresh Naidu at InfoCity Patia.'
  },
  {
    id: 'CAM-BBSR-0050',
    name: 'Palasuni Flyover Toll Checkpoint',
    location: 'Palasuni NH-16, Bhubaneswar',
    type: 'anpr',
    is_active: true,
    has_anpr: true,
    has_face_recog: false,
    videoUrl: `${CDN_BASE}/traffic3.mp4`,
    suspectName: 'OD-02-HA-4410',
    suspectAlias: 'Dark Blue Honda City',
    riskScore: 89,
    confidence: 97.6,
    firNumber: 'FIR-2026-BBSR-5012',
    legalSection: 'BNS §303 (Highway Robbery Watchlist)',
    incidentBriefing: 'Dark Blue Honda City flagged passing Palasuni flyover checkpoint. Vehicle linked to active highway crime investigation (FIR-2026-BBSR-5012).',
    targetCue: 'Dark Blue Sedan passing high-speed ANPR camera lane',
    drishtiSpeech: 'ANPR Alert. License plate OD 02 HA 4410 detected at Palasuni Flyover.'
  },
  {
    id: 'CAM-BBSR-0055',
    name: 'Bhubaneswar Railway Station Platform 3',
    location: 'Bhubaneswar Station, Odisha',
    type: 'face_recognition',
    is_active: true,
    has_anpr: false,
    has_face_recog: true,
    videoUrl: `${CDN_BASE}/people4.mp4`,
    suspectName: 'Farid Mirza',
    suspectAlias: 'Chotta Mirza',
    riskScore: 92,
    confidence: 95.3,
    firNumber: 'FIR-2026-BBSR-3104',
    legalSection: 'BNS §310, §311 (Armed Dacoity)',
    incidentBriefing: 'Subject Farid Mirza identified walking across Bhubaneswar Railway Station Platform 3 during live biometric sweep. Linked to armed robbery series under FIR-2026-BBSR-3104.',
    targetCue: 'Pedestrian in Red Shirt with Travel Bag walking left-to-right on platform',
    drishtiSpeech: 'Alert. Biometric match confirmed on Camera BBSR 0055. Farid Mirza detected at Bhubaneswar Station Platform 3.'
  },
  {
    id: 'CAM-BBSR-0060',
    name: 'Cuttack Sadar Link Road Checkpoint',
    location: 'Cuttack Sadar Checkpoint, Odisha',
    type: 'anpr',
    is_active: true,
    has_anpr: true,
    has_face_recog: false,
    videoUrl: `${CDN_BASE}/traffic4.mp4`,
    suspectName: 'OD-02-MH-9002',
    suspectAlias: 'Commercial Freight Truck',
    riskScore: 85,
    confidence: 98.9,
    firNumber: 'FIR-2026-CTC-0089',
    legalSection: 'BNS §303, §317 (Stolen Cargo Transit)',
    incidentBriefing: 'Commercial cargo truck intercepted at Cuttack Sadar Checkpoint Lane 4. Suspected of transporting contraband cargo across border checkpoint.',
    targetCue: 'Commercial truck passing toll collection lane 4',
    drishtiSpeech: 'ANPR Toll Alert. Commercial truck OD 02 MH 9002 intercepted at Cuttack Sadar Checkpoint.'
  }
];

const INITIAL_AUDIT_LOG = [
  { time: '21:12:05', cam: 'CAM-BBSR-0015', type: 'ANPR HIT', severity: 'critical', desc: 'Target Vehicle KLO5AN6247 matched at Saheed Nagar Commercial Hub · Conf: 94.2%' },
  { time: '21:10:15', cam: 'CAM-BBSR-0010', type: 'ANPR HIT', severity: 'critical', desc: 'Target Vehicle OD-02-AB-1234 matched at Khandagiri Checkpoint · Conf: 99.1%' },
  { time: '21:07:42', cam: 'CAM-BBSR-0055', type: 'FACE AI', severity: 'critical', desc: 'Farid Mirza (SUS-6091) · Bhubaneswar Station Platform 3 · Conf: 95.3%' },
  { time: '21:01:28', cam: 'CAM-BBSR-0050', type: 'ANPR HIT', severity: 'warn', desc: 'OD-02-HA-4410 (Honda City) · Palasuni Flyover Checkpoint' },
  { time: '20:55:00', cam: 'CAM-BBSR-0015', type: 'COMMAND', severity: 'info', desc: 'S.I.R.I.S. Surveillance Matrix Live Sweep Active' }
];

export function CCTVModule() {
  const [viewMode, setViewMode] = useState<'grid' | 'focused'>('focused');
  const [selectedCamId, setSelectedCamId] = useState<string>('CAM-BBSR-0015');
  const [filterType, setFilterType] = useState<'all' | 'anpr' | 'face'>('all');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [visionMode, setVisionMode] = useState<'standard' | 'night' | 'thermal'>('standard');
  const [showBoundingBoxes, setShowBoundingBoxes] = useState<boolean>(true);
  const [systemTime, setSystemTime] = useState<string>('21:15:40');

  // Audit log & search state
  const [auditLog, setAuditLog] = useState(INITIAL_AUDIT_LOG);
  const [plateQuery, setPlateQuery] = useState('');
  const [plateResult, setPlateResult] = useState<Record<string, string | boolean> | null>(null);

  // Deep Inspection Modal
  const [inspectionCam, setInspectionCam] = useState<CameraProfile | null>(null);

  // Geo-Trail & Vehicle Modals
  const [showGeoTrailModal, setShowGeoTrailModal] = useState<boolean>(false);
  const [showVehicleModal, setShowVehicleModal] = useState<boolean>(false);
  const [activePlate, setActivePlate] = useState<string>('KLO5AN6247');


  const [searchParams] = useSearchParams();
  const caseIdParam = searchParams.get('caseId');
  const plateParam = searchParams.get('plate');

  const navigate = useNavigate();

  // Handle query parameters from URL
  useEffect(() => {
    if (plateParam) {
      setActivePlate(plateParam);
      const matchedCam = SURVEILLANCE_CAMERAS.find(c => c.suspectName === plateParam);
      if (matchedCam) setSelectedCamId(matchedCam.id);
    } else if (caseIdParam) {
      const matchedCam = SURVEILLANCE_CAMERAS.find(c => c.firNumber === caseIdParam);
      if (matchedCam) setSelectedCamId(matchedCam.id);
    }
  }, [caseIdParam, plateParam]);

  // Clock simulation
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setSystemTime(now.toTimeString().slice(0, 8));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const filteredCameras = SURVEILLANCE_CAMERAS.filter(c => {
    if (filterType === 'anpr') return c.has_anpr;
    if (filterType === 'face') return c.has_face_recog;
    return true;
  });

  const activeCam = SURVEILLANCE_CAMERAS.find(c => c.id === selectedCamId) || SURVEILLANCE_CAMERAS[0];

  const handleSearchPlate = () => {
    const q = plateQuery.trim().toUpperCase();
    if (!q) return;
    const isTargetCar = q.includes('6247') || q.includes('KLO5') || q.includes('KL05') || q.includes('KA05');
    setPlateResult({
      plate_number: q,
      matched: true,
      vehicle_details: isTargetCar ? 'White Compact SUV (KLO5AN6247)' : q.startsWith('OD-02') ? 'Silver Maruti Suzuki Swift' : q.startsWith('OD-01') ? 'Black Bajaj Pulsar 220' : 'Dark Blue Honda City',
      status: 'HOTLIST WATCHLIST HIT',
      case_id: isTargetCar ? 'FIR-2026-BBSR-8821' : q === 'OD-02-AB-1234' ? 'FIR-2026-CTC-0112' : 'FIR-2026-BBSR-8821',
      suspect: isTargetCar ? 'Syndicate Hotlist Vehicle' : 'Ramesh Kumar'
    });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-16 select-none font-sans">
      {/* Header Bar */}
      <div className="glass p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface border border-border-soft">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono font-bold bg-danger/10 text-danger-bright px-2.5 py-0.5 rounded border border-danger/30 flex items-center gap-1">
              <Radio size={11} className="animate-pulse" /> S.I.R.I.S. CCTV SURVEILLANCE MATRIX
            </span>
            <span className="text-[10px] font-mono text-success font-bold">
              {SURVEILLANCE_CAMERAS.filter(c => c.is_active).length} FEEDS ONLINE
            </span>
          </div>
          <h1 className="text-2xl font-bold font-mono text-text flex items-center gap-2">
            <Video className="text-brand" /> CCTV & Optical Surveillance Command
          </h1>
          <p className="text-xs text-text-dim mt-1">
            Odisha Police Surveillance Matrix · Biometric facial recognition & Automated License Plate Readers (ANPR)
          </p>
        </div>


        {/* Header Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowGeoTrailModal(true)}
            className="bg-danger/10 border border-danger/30 text-danger-bright px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-danger/20 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Navigation size={14} /> RECONSTRUCT GEO-TRAIL
          </button>

          <div className="flex bg-surface-2 p-1 rounded-xl border border-border-soft text-xs">
            <button
              onClick={() => setViewMode('focused')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${viewMode === 'focused' ? 'bg-surface text-brand shadow-sm' : 'text-text-dim hover:text-text'}`}
            >
              Single Feed
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${viewMode === 'grid' ? 'bg-surface text-brand shadow-sm' : 'text-text-dim hover:text-text'}`}
            >
              Multi-Grid View
            </button>
          </div>
        </div>
      </div>

      {/* Query Context Banner if present */}
      {(caseIdParam || plateParam) && (
        <div className="p-3.5 rounded-2xl bg-brand/10 border border-brand/30 flex items-center justify-between gap-3 text-xs font-mono animate-fade-in">
          <div className="flex items-center gap-2 text-brand">
            <ShieldAlert size={16} />
            <span>
              <strong>SURVEILLANCE CONTEXT:</strong> Filtered cameras & feeds linked to{' '}
              <strong className="text-text">{caseIdParam || plateParam}</strong>
            </span>
          </div>
          <button
            onClick={() => navigate('/cctv')}
            className="text-[10px] font-bold text-text-dim hover:text-text underline"
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* Camera Filters Strip */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-surface-2 border border-border-soft text-xs">
          {[
            { id: 'all', label: 'All Feeds' },
            { id: 'anpr', label: 'ANPR Readers' },
            { id: 'face', label: 'Face AI Biometrics' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setFilterType(t.id as 'all' | 'anpr' | 'face')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                filterType === t.id
                  ? 'bg-surface text-brand shadow-sm'
                  : 'text-text-dim hover:text-text'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Vision Filter Mode Switcher */}
        <div className="flex items-center gap-2 bg-surface-2 p-1 rounded-xl border border-border-soft text-xs">
          <span className="text-[10px] font-mono text-text-dim px-2">VISION FILTER:</span>
          <button
            onClick={() => setVisionMode('standard')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${visionMode === 'standard' ? 'bg-surface text-brand shadow-sm' : 'text-text-dim'}`}
          >
            Standard
          </button>
          <button
            onClick={() => setVisionMode('night')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${visionMode === 'night' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40 shadow-sm' : 'text-text-dim'}`}
          >
            Night IR
          </button>
          <button
            onClick={() => setVisionMode('thermal')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${visionMode === 'thermal' ? 'bg-orange-950 text-orange-400 border border-orange-800/40 shadow-sm' : 'text-text-dim'}`}
          >
            Thermal
          </button>
        </div>
      </div>

      {/* MULTI-GRID VIEW MODE */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCameras.map(cam => (
            <div key={cam.id} className="glass bg-surface border border-border-soft rounded-2xl overflow-hidden shadow-sm hover:border-brand transition-all flex flex-col group">
              {/* 16:9 Stream Card */}
              <div 
                onClick={() => {
                  setSelectedCamId(cam.id);
                  setInspectionCam(cam);
                }}
                className="relative aspect-video bg-black overflow-hidden cursor-pointer"
              >
                {cam.is_active ? (
                  <video
                    src={cam.videoUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className={`w-full h-full object-cover filter brightness-[0.95] contrast-[1.08] ${
                      visionMode === 'night' ? 'hue-rotate-90 contrast-125 brightness-90 saturate-200' :
                      visionMode === 'thermal' ? 'invert hue-rotate-180 contrast-150 saturate-200' : ''
                    }`}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-text-dim font-mono text-xs gap-1">
                    <AlertTriangle size={24} className="text-warning" />
                    <span>FEED OFFLINE</span>
                  </div>
                )}

                {/* Card Top OSD */}
                <div className="absolute top-2 left-2 right-2 flex justify-between items-center z-10 pointer-events-none">
                  <span className="text-[9px] font-mono font-bold bg-black/80 text-white px-2 py-0.5 rounded backdrop-blur-md border border-white/10">
                    {cam.id}
                  </span>
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded backdrop-blur-md border ${
                    cam.type === 'face_recognition' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                    cam.type === 'anpr' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                    'bg-surface-2 text-text-dim border-border'
                  }`}>
                    {cam.type === 'face_recognition' ? 'FACE AI' : cam.type === 'anpr' ? 'ANPR' : 'CCTV'}
                  </span>
                </div>

                {/* Hover Expand Icon */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-all bg-black/80 p-3 rounded-full text-white shadow-xl">
                  <Maximize2 size={20} />
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h4 className="text-sm font-bold text-text group-hover:text-brand transition-colors">
                    {cam.name}
                  </h4>
                  <p className="text-xs text-text-dim font-mono mt-0.5">{cam.location}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border-soft gap-2">
                  <button
                    onClick={() => {
                      setSelectedCamId(cam.id);
                      setInspectionCam(cam);
                    }}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-surface-2 hover:bg-brand hover:text-bg text-text text-xs font-bold transition-all flex items-center justify-center gap-1 font-mono"
                  >
                    <Target size={13} /> VERIFY TARGET
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* SINGLE FOCUSED FEED VIEW MODE */
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Feed Selector Sidebar */}
          <div className="lg:col-span-1 space-y-3">
            <div className="glass p-4 rounded-2xl bg-surface border border-border-soft space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-dim font-mono flex items-center justify-between">
                <span>Select Surveillance Camera</span>
                <span className="text-brand">ONLINE ({SURVEILLANCE_CAMERAS.filter(c=>c.is_active).length})</span>
              </h3>

              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {filteredCameras.map(c => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCamId(c.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1 ${
                      selectedCamId === c.id
                        ? 'border-brand bg-brand/10 shadow-sm'
                        : 'border-border-soft bg-surface-2 hover:bg-surface-hover'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-brand">{c.id}</span>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                        c.type === 'face_recognition' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                        c.type === 'anpr' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                        'bg-surface-2 text-text-dim border-border'
                      }`}>
                        {c.type === 'face_recognition' ? 'FACE AI' : c.type === 'anpr' ? 'ANPR' : 'CCTV'}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-text truncate">{c.name}</div>
                    <div className="text-[10px] text-text-dim font-mono truncate">{c.location}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Focused Video Viewport */}
          <div className="lg:col-span-3 space-y-4">
            <div className="glass bg-[#070b14] border border-border-soft rounded-2xl overflow-hidden relative h-[440px] flex flex-col justify-between shadow-2xl">
              {/* OSD Header Overlay */}
              <div className="p-4 bg-gradient-to-b from-black/90 via-black/40 to-transparent flex justify-between items-start z-20 pointer-events-none">
                <div className="font-mono text-xs text-white/90 space-y-0.5 bg-black/70 p-2.5 rounded-xl backdrop-blur-md border border-white/10">
                  <div className="text-brand font-bold flex items-center gap-2">
                    <Radio size={12} className="animate-pulse text-danger-bright" />
                    {activeCam.id} · {activeCam.name.toUpperCase()}
                  </div>
                  <div className="text-[10px] text-white/70">LOC: {activeCam.location}</div>
                  <div className="text-[10px] text-white/60">SENSORS: {activeCam.has_anpr ? 'ANPR' : ''} {activeCam.has_face_recog ? '· FACE AI' : ''}</div>
                </div>

                <div className="font-mono text-xs text-white/90 text-right bg-black/70 p-2.5 rounded-xl backdrop-blur-md border border-white/10">
                  <div className="text-danger-bright font-bold flex items-center gap-1.5 justify-end">
                    <span className="h-2.5 w-2.5 rounded-full bg-danger-bright animate-ping" /> REC ● LIVE FEED
                  </div>
                  <div className="text-xs font-mono font-bold text-white mt-1">2026-08-21 {systemTime}</div>
                  <div className="text-[10px] text-white/60">FPS: 30 · CODEC: H.265</div>
                </div>
              </div>

              {/* Real Video Stream HTML5 Container */}
              <div className="absolute inset-0 z-0 overflow-hidden flex items-center justify-center bg-black">
                {activeCam.is_active ? (
                  <video
                    src={activeCam.videoUrl}
                    autoPlay={isPlaying}
                    loop
                    muted
                    playsInline
                    className={`w-full h-full object-cover transition-all duration-300 ${
                      visionMode === 'night' ? 'filter hue-rotate-90 contrast-125 brightness-90 saturate-200' :
                      visionMode === 'thermal' ? 'filter invert hue-rotate-180 contrast-150 saturate-200' : ''
                    }`}
                  />
                ) : (
                  <div className="text-center space-y-2 text-text-dim font-mono">
                    <AlertTriangle size={36} className="mx-auto text-warning animate-bounce" />
                    <div className="text-sm font-bold text-text">CAM-05 STREAM OFFLINE</div>
                    <div className="text-xs">Optical Sensor Interrupted · Patrol Unit Dispatched</div>
                  </div>
                )}

                {/* Scanlines Filter */}
                <div 
                  className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.8) 3px, rgba(0,0,0,0.8) 4px)'
                  }}
                />
              </div>

              {/* Bounding Box AI Tracking Reticle */}
              {activeCam.suspectName && showBoundingBoxes && isPlaying && activeCam.is_active && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <div className="relative border-2 border-danger-bright w-72 h-44 rounded flex flex-col justify-between p-2 shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                    <div className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 border-t-2 border-l-2 border-danger-bright" />
                    <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 border-t-2 border-r-2 border-danger-bright" />
                    <div className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 border-b-2 border-l-2 border-danger-bright" />
                    <div className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 border-b-2 border-r-2 border-danger-bright" />

                    <div className="absolute -top-7 left-0 bg-danger-bright text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded shadow flex items-center gap-1.5">
                      <Crosshair size={12} className="animate-spin" />
                      TARGET HIT: {activeCam.suspectName} ({activeCam.confidence}%)
                    </div>
                  </div>
                </div>
              )}

              {/* Video Playback Controls Bar */}
              <div className="p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-between z-20">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  <button
                    onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold border transition-colors ${showBoundingBoxes ? 'bg-brand/20 text-brand border-brand/40' : 'bg-white/10 text-white/60 border-white/20'}`}
                  >
                    AI TRACKING: {showBoundingBoxes ? 'ON' : 'OFF'}
                  </button>
                </div>

                <button
                  onClick={() => setInspectionCam(activeCam)}
                  className="px-3.5 py-1.5 rounded-xl bg-danger text-white font-mono font-bold text-xs hover:bg-danger-bright transition-colors flex items-center gap-1.5 shadow"
                >
                  <Maximize2 size={13} /> INSPECT FORENSIC DOSSIER
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ANPR QUICK LOOKUP ENGINE */}
      <div className="glass p-6 rounded-2xl bg-surface border border-border-soft space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-text uppercase tracking-wider font-mono">
              ANPR Hotlist Plate Search & Verification
            </h3>
            <p className="text-xs text-text-dim">
              Query optical recognition archives across Odisha toll plazas & city cameras
            </p>
          </div>
          <span className="text-xs font-mono text-text-faint">S.I.R.I.S. ANPR MATRIX</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-text-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={plateQuery}
              onChange={(e) => setPlateQuery(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchPlate()}
              placeholder="Enter Vehicle Plate Number (e.g., KLO5AN6247, OD-02-AB-1234, OD-02-HA-4410)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-2 border border-border text-xs font-mono font-bold text-text outline-none focus:border-brand"
            />
          </div>

          <button
            onClick={handleSearchPlate}
            className="px-5 py-2.5 rounded-xl bg-brand text-bg font-bold text-xs hover:bg-brand-bright transition-colors shadow-sm"
          >
            SCAN HOTLIST
          </button>
        </div>

        {plateResult && (
          <div className="p-4 rounded-xl bg-surface-2 border border-border-soft flex items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-success/10 text-success border border-success/30">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <span className="font-mono text-sm font-bold text-text">{plateResult.plate_number}</span>
                <p className="text-xs text-text-dim">
                  Vehicle: {plateResult.vehicle_details} · Status: <strong className="text-danger-bright">{plateResult.status}</strong> · Case: {plateResult.case_id}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setActivePlate(plateResult.plate_number);
                setShowVehicleModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-brand text-bg text-xs font-bold hover:bg-brand-bright transition-colors"
            >
              VIEW VEHICLE INTEL
            </button>
          </div>
        )}
      </div>

      {/* LIVE SURVEILLANCE AUDIT LOG */}
      <div className="glass p-6 rounded-2xl bg-surface border border-border-soft space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-text uppercase tracking-wider font-mono">
            Live Surveillance Audit Log
          </h3>
          <span className="text-xs font-mono text-text-dim">Telemetry stream auto-updating</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse font-sans">
            <thead>
              <tr className="border-b border-border-soft text-text-dim font-mono text-[10px] uppercase">
                <th className="pb-3">Timestamp</th>
                <th className="pb-3">Camera Sensor</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">Severity</th>
                <th className="pb-3">Detection Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-soft/60">
              {auditLog.map((ev, idx) => (
                <tr key={idx} className="hover:bg-surface-hover transition-colors">
                  <td className="py-3 font-mono text-text-dim">{ev.time}</td>
                  <td className="py-3 font-mono font-bold text-text">{ev.cam}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-surface-2 text-text">
                      {ev.type}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                      ev.severity === 'critical' ? 'text-danger-bright font-bold' :
                      ev.severity === 'warn' ? 'text-warning-bright font-bold' :
                      'text-text-dim'
                    }`}>
                      {ev.severity.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 text-text font-medium">{ev.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORENSIC DEEP INSPECTION MODAL */}
      {inspectionCam && (
        <ForensicInspectionModal
          cam={inspectionCam}
          onClose={() => setInspectionCam(null)}
          onDispatch={(targetName) => {
            setAuditLog(prev => [
              {
                time: new Date().toLocaleTimeString('en-GB'),
                cam: inspectionCam.id,
                type: 'DISPATCH',
                severity: 'critical',
                desc: `🚨 Intercept Dispatched for ${targetName} at ${inspectionCam.location}`
              },
              ...prev
            ]);
          }}
        />
      )}

      {/* DRISHTI Modals */}
      <VehicleGeoTrailModal
        isOpen={showGeoTrailModal}
        onClose={() => setShowGeoTrailModal(false)}
        plateNumber={activePlate}
      />

      <VehicleIntelligenceModal
        isOpen={showVehicleModal}
        onClose={() => setShowVehicleModal(false)}
        plateNumber={activePlate}
        onOpenTrail={() => setShowGeoTrailModal(true)}
      />
    </div>
  );
}

// Forensic Inspection Modal Component
function ForensicInspectionModal({
  cam,
  onClose,
  onDispatch
}: {
  cam: CameraProfile;
  onClose: () => void;
  onDispatch: (targetName: string) => void;
}) {
  const [stage, setStage] = useState<'scan' | 'lock' | 'match' | 'identified'>('scan');
  const [dispatched, setDispatched] = useState<boolean>(false);

  useEffect(() => {
    playSurveillanceSound('beep');
    const t1 = setTimeout(() => {
      setStage('lock');
      playSurveillanceSound('lock');
    }, 1000);
    const t2 = setTimeout(() => {
      setStage('match');
      playSurveillanceSound('alert');
    }, 2200);
    const t3 = setTimeout(() => {
      setStage('identified');
      if (cam.drishtiSpeech) speakDrishtiAlert(cam.drishtiSpeech);
    }, 3400);

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
    };
  }, [cam]);

  const handleDispatch = () => {
    setDispatched(true);
    playSurveillanceSound('beep');
    onDispatch(cam.suspectName || 'Target');
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-surface border border-border-soft rounded-2xl max-w-5xl w-full overflow-hidden shadow-2xl flex flex-col text-text max-h-[90vh]">
        {/* Top Header */}
        <div className="p-4 bg-surface-2 border-b border-border-soft flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-danger-bright animate-ping" />
            <div>
              <h3 className="text-base font-bold text-text font-mono">{cam.name}</h3>
              <p className="text-xs text-text-dim font-mono">{cam.id} · {cam.location}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-hover text-text-dim hover:text-text">
            <X size={18} />
          </button>
        </div>

        {/* Viewport & Dossier Grid */}
        <div className="flex-1 overflow-y-auto grid lg:grid-cols-3 gap-0">
          {/* Left 2 Cols: Video Stream */}
          <div className="lg:col-span-2 bg-black relative flex items-center justify-center min-h-[340px]">
            <video src={cam.videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
            <div className="absolute top-4 left-4 z-20 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs font-mono text-white flex items-center gap-2">
              <Target size={14} className="text-brand animate-spin" />
              <span>
                {stage === 'scan' && 'Searching Video Stream...'}
                {stage === 'lock' && 'Biometric Face Alignment in Progress...'}
                {(stage === 'match' || stage === 'identified') && `🚨 MATCH CONFIRMED: ${cam.suspectName || 'TARGET'} (${cam.confidence}%)`}
              </span>
            </div>
          </div>

          {/* Right Col: Forensic Dossier Panel */}
          <div className="p-5 bg-surface-2 border-l border-border-soft space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="border-b border-border-soft pb-3">
                <span className="text-[10px] font-mono font-bold text-danger-bright uppercase">CRITICAL MATCH HIT</span>
                <h4 className="text-xl font-bold font-mono text-text mt-0.5">{cam.suspectName || 'OD-02-AB-1234'}</h4>

                <p className="text-xs text-text-dim mt-0.5">Alias: “{cam.suspectAlias || 'Target'}”</p>
              </div>

              {cam.incidentBriefing && (
                <div className="p-3 rounded-xl bg-surface border border-border-soft space-y-1">
                  <span className="text-[10px] font-bold text-brand uppercase font-mono flex items-center gap-1">
                    <FileText size={12} /> Synopsis
                  </span>
                  <p className="text-xs text-text-dim leading-relaxed">{cam.incidentBriefing}</p>
                </div>
              )}

              {cam.legalSection && (
                <div className="p-3 rounded-xl bg-surface border border-border-soft space-y-1">
                  <span className="text-[10px] font-bold text-danger-bright uppercase font-mono">Applicable IPC Sections</span>
                  <p className="text-xs text-text font-bold font-mono">{cam.legalSection}</p>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-3 border-t border-border-soft">
              <button
                onClick={handleDispatch}
                disabled={dispatched}
                className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase font-mono tracking-wider flex items-center justify-center gap-2 transition-all ${
                  dispatched ? 'bg-success text-bg' : 'bg-danger text-white hover:bg-danger-bright shadow-md'
                }`}
              >
                {dispatched ? <><CheckCircle2 size={15} /> PATROL INTERCEPT UNIT DISPATCHED</> : <><ShieldAlert size={15} /> DISPATCH IMMEDIATE PATROL UNIT</>}
              </button>

              <button
                onClick={() => {
                  onClose();
                  window.location.href = `/trail?plate=${encodeURIComponent(cam.suspectName || 'OD-02-AB-1234')}`;
                }}
                className="w-full py-2 rounded-xl text-xs font-bold font-mono bg-brand/10 border border-brand/30 text-brand hover:bg-brand/20 transition-colors flex items-center justify-center gap-1.5"
              >
                <Navigation size={13} /> RECONSTRUCT GEO-TRAIL & SUGGEST CCTV HOPS
              </button>

              <button
                onClick={onClose}
                className="w-full py-2 rounded-xl text-xs font-bold bg-surface border border-border text-text-dim hover:text-text transition-colors"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
