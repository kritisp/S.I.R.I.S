import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Network, Search, Radio, Lock, CheckCircle2,
  Layers, Newspaper, Database, Navigation, Crosshair,
  ZoomIn, ZoomOut, Plus, MapPin, ArrowRight, ShieldAlert, FileText, Radio as RadioIcon, Globe, Cpu
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import {
  NodeType, NETWORK_NODES, NETWORK_EDGES, NetworkNode, NetworkEdge
} from '../mockServices/networkGraphData';

import { IntelligenceGraph } from '../components/graph/IntelligenceGraph';
import { NodeDetailPanel } from '../components/graph/NodeDetailPanel';
import { ArgusWhyPanel } from '../components/graph/ArgusWhyPanel';
import { OsintPanel } from '../components/intelligence/OsintPanel';
import { graphIntelligenceService, GraphOverview, IntelAlert } from '../services/graphIntelligenceService';
import { useMockState } from '../mockServices/MockStateContext';
import { workspaceApi, WorkspaceDTO } from '../services/api/workspaceApi';
import { transformResultPayloadToGraph } from '../utils/graphTransform';

// ─── Filter types for Interactive Force Node Graph ────────────────────────────
type EntityFilter = 'ALL' | NodeType;
type RelFilter = 'ALL' | 'CROSS_STATION' | 'AI_DISCOVERED' | 'SHARED_PHONE' | 'SHARED_VEHICLE' | 'LINKED_CASE';

// ─── Legend Component ─────────────────────────────────────────────────────────
function GraphLegend() {
  const nodeTypes = [
    { color: '#C08A18', label: 'Station' },
    { color: '#2563EB', label: 'Case' },
    { color: '#DB2777', label: 'Person' },
    { color: '#059669', label: 'Phone' },
    { color: '#7C3AED', label: 'Vehicle' },
    { color: '#EA580C', label: 'Location' },
    { color: '#64748B', label: 'Evidence' },
  ];

  return (
    <div className="bg-surface border border-border-soft rounded-xl p-3 font-mono">
      <div className="text-[10px] uppercase font-bold text-text-faint tracking-wider mb-2">Legend</div>
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-1">
          {nodeTypes.map(t => (
            <div key={t.label} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
              <span className="text-[10px] text-text-dim">{t.label}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-border-soft pt-2 space-y-1">
          <div className="flex items-center gap-2">
            <svg width="28" height="4"><line x1="0" y1="2" x2="28" y2="2" stroke="var(--border-soft)" strokeWidth="1.5"/></svg>
            <span className="text-[10px] text-text-dim">Local link</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="28" height="4"><line x1="0" y1="2" x2="28" y2="2" stroke="var(--danger-bright)" strokeWidth="2" strokeDasharray="6 3"/></svg>
            <span className="text-[10px] text-text-dim">Cross-station</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="28" height="4"><line x1="0" y1="2" x2="28" y2="2" stroke="var(--accent-bright)" strokeWidth="1.5" strokeDasharray="4 3"/></svg>
            <span className="text-[10px] text-text-dim">AI discovered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Lock size={12} className="text-danger-bright" />
            <span className="text-[10px] text-text-dim">Restricted</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={12} className="text-success" />
            <span className="text-[10px] text-text-dim">Authorized</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Graph Summary Component ──────────────────────────────────────────────────
function SummaryPanel({ summary }: { summary: Record<string, number> }) {
  const items = [
    { label: 'Connected Cases', value: summary.totalCases },
    { label: 'Entities', value: summary.totalEntities },
    { label: 'Stations', value: summary.totalStations },
    { label: 'Cross-Station Links', value: summary.crossStationLinks, highlight: 'text-danger-bright' },
    { label: 'Restricted Records', value: summary.restrictedRecords, highlight: 'text-warning' },
    { label: 'AI Discovered Links', value: summary.aiDiscoveredLinks, highlight: 'text-accent-bright' },
  ];

  return (
    <div className="bg-surface border border-border-soft rounded-xl p-3 font-mono">
      <div className="text-[10px] uppercase font-bold text-text-faint tracking-wider mb-2 flex items-center gap-1.5">
        <Radio size={10} className="text-brand" /> Network Summary
      </div>
      <div className="space-y-1.5">
        {items.map(item => (
          <div key={item.label} className="flex items-center justify-between text-xs">
            <span className="text-text-dim">{item.label}</span>
            <span className={`font-bold tabular-nums ${item.highlight || 'text-text'}`}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PREDICTIVE ROUTES LEAFLET MAP COMPONENT ─────────────────────────────────
function PredictiveRoutesMap({ syndicate }: { syndicate: typeof SYNDICATES[0] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = L.map(mapRef.current, {
      center: [20.278, 85.818],
      zoom: 11,
      zoomControl: false,
      attributionControl: false,
    });
    mapInstance.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      className: 'map-tiles-dark-invert',
    }).addTo(map);

    const routeCoords: [number, number][] = [
      [20.2588, 85.7871], // Khandagiri Square
      [20.2666, 85.8436], // Master Canteen
      [20.2882, 85.8488], // Saheed Nagar
      [20.3255, 85.8820], // Pahala Toll
      [20.4625, 85.8828], // Cuttack Chopshops
    ];

    L.polyline(routeCoords, {
      color: syndicate.color || '#3B82F6',
      weight: 4,
      opacity: 0.85,
      dashArray: '8 6',
    }).addTo(map);

    const waypoints = [
      { name: `Origin: ${syndicate.kingpin.last_location}`, coords: routeCoords[0], type: 'target' },
      { name: syndicate.anpr_chokepoints[0] || 'CAM-BBSR-0010 (Khandagiri Square)', coords: routeCoords[1], type: 'anpr' },
      { name: 'Pahala Highway Intercept Gate', coords: routeCoords[3], type: 'chokepoint' },
      { name: `Predicted Hideout: ${syndicate.primary_corridor}`, coords: routeCoords[4], type: 'hideout' },
    ];

    waypoints.forEach((wp) => {
      const color = wp.type === 'target' ? '#EF4444' : wp.type === 'hideout' ? '#F59E0B' : '#3B82F6';
      const markerHtml = `
        <div style="display:flex; flex-direction:column; align-items:center; transform:translate(-50%,-50%); cursor:pointer;">
          <div style="width:14px; height:14px; border-radius:9999px; background:${color}; border:2px solid #FFF; box-shadow:0 0 10px ${color};"></div>
          <span style="font-family:monospace; font-size:9px; font-weight:bold; color:#FFF; background:rgba(15,23,42,0.9); padding:2px 6px; border-radius:4px; margin-top:2px; border:1px solid rgba(255,255,255,0.2); white-space:nowrap;">
            ${wp.name}
          </span>
        </div>
      `;
      const customIcon = L.divIcon({ html: markerHtml, className: 'custom-route-marker', iconSize: [0, 0] });
      L.marker(wp.coords, { icon: customIcon }).addTo(map);
    });

    setTimeout(() => map.invalidateSize(), 150);

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [syndicate]);

  return (
    <div className="relative w-full h-[480px] rounded-2xl overflow-hidden border border-border-soft select-none bg-[#070B14]">
      <div ref={mapRef} className="absolute inset-0 w-full h-full" />

      <div className="absolute right-3 bottom-3 flex items-center gap-1 z-10 bg-slate-900/90 border border-white/20 rounded-xl p-1 shadow-lg backdrop-blur-md">
        <button
          onClick={() => mapInstance.current?.zoomIn()}
          className="p-1.5 text-slate-300 hover:text-white"
          title="Zoom In"
        >
          <ZoomIn size={14} />
        </button>
        <button
          onClick={() => mapInstance.current?.zoomOut()}
          className="p-1.5 text-slate-300 hover:text-white"
          title="Zoom Out"
        >
          <ZoomOut size={14} />
        </button>
        <button
          onClick={() => mapInstance.current?.flyTo([20.278, 85.818], 11)}
          className="p-1.5 text-slate-300 hover:text-white"
          title="Reset Map"
        >
          <Crosshair size={14} />
        </button>
      </div>

      <div className="absolute left-3 top-3 z-10 bg-slate-900/90 border border-border-soft p-3 rounded-xl max-w-xs text-xs font-mono backdrop-blur-md space-y-1">
        <span className="text-rose-400 font-bold uppercase text-[9px] flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          ACTIVE GEOSPATIAL VECTOR TRACKING
        </span>
        <p className="font-bold text-white text-xs">{syndicate.kingpin.vehicle}</p>
        <p className="text-slate-400 text-[10px]">{syndicate.predicted_escape_route}</p>
      </div>
    </div>
  );
}

// ─── ALL 5 STRUCTURED SYNDICATES FROM DRISHTI SOURCE ──────────────────────────
const SYNDICATES = [
  {
    id: 'SYN-VT-01',
    name: 'Bullet Ramesh Inter-District Vehicle Theft Syndicate',
    category: 'vehicle_theft',
    category_label: 'Vehicle Theft & Fencing',
    color: '#3b82f6',
    threat_level: 'CRITICAL',
    risk_score: 94,
    estimated_volume: '₹1.8 Cr (42 Vehicles/yr)',
    districts: ['Bhubaneswar Urban', 'Cuttack', 'Puri'],
    primary_corridor: 'Khandagiri Highway Corridor → Cuttack Link Road Checkpost',
    predicted_escape_route: 'Khandagiri Square → Master Canteen → NH-16 Northward to Cuttack chopshops',
    anpr_chokepoints: ['CAM-BBSR-0010 (Khandagiri Square)', 'CAM-CTC-0010 (Link Road Bridge)'],
    kingpin: {
      id: 'SUS-8842',
      name: 'Ramesh Kumar',
      alias: 'Bullet Ramesh',
      role: 'Syndicate Head & Logistics Mastermind',
      risk_score: 94,
      status: 'Active Watchlist / Under Surveillance',
      vehicle: 'Hyundai Creta / Bajaj Pulsar (OD-02-MJ-8821)',
      last_location: 'Khandagiri Square ANPR Node 4, Bhubaneswar',
      mugshot: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      reward: '₹1,00,000'
    },
    lieutenants: [
      { id: 'SUS-4401', name: 'Deepak Shetty', alias: 'Chopshop Fence', role: 'Chopshop Fence & Disposal Lead', risk_score: 75, district: 'Cuttack', mugshot: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', task: 'Runs Cuttack auto scrap yard & engine dismantling' },
      { id: 'SUS-1190', name: 'Manoj Reddy', alias: 'Jammer Manoj', role: 'Getaway Driver & Jammer Operator', risk_score: 65, district: 'Bhubaneswar', mugshot: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80', task: 'Operates 433MHz frequency immobilizer bypass units' },
      { id: 'SUS-2211', name: 'Farid Mirza', alias: 'Chotta Mirza', role: 'Master Key & Hardware Supplier', risk_score: 82, district: 'Puri', mugshot: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80', task: 'Procures blank smart-keys & lock-picking toolkits' }
    ],
    connected_firs: [
      { case_number: 'FIR-2026-BBSR-0492', crime: 'Armed Robbery', station: 'Khandagiri PS', date: '2026-08-21', status: 'Under Investigation', note: 'Matched vehicle OD-02-AB-1234 on ANPR' },
      { case_number: 'FIR-2026-CTC-0112', crime: 'Vehicle Theft', station: 'Cuttack Sadar PS', date: '2026-08-20', status: 'Open', note: 'Chassis VIN serial tampering confirmed' },
      { case_number: 'FIR-2026-PURI-0882', crime: 'Highway Hijack', station: 'Puri Town PS', date: '2026-08-18', status: 'Closed', note: 'ANPR hit at Link Road Checkpoint (23:42 hrs)' }
    ],
    modus_operandi: 'Uses electronic frequency jammers to disrupt alarm systems and master immobilizer bypasses between 22:00-04:00 hrs. Transits stolen vehicles to rural chopshops in Cuttack within 6 hours.',
    tactical_action: 'Deploy mobile PCR interceptors along NH-16 exit corridor and activate automated ANPR sweeps at Cuttack Link Road.'
  },
  {
    id: 'SYN-ND-02',
    name: 'Helmet Imran Commercial Synthetic Narcotics Ring',
    category: 'narcotics',
    category_label: 'Commercial Narcotics (NDPS)',
    color: '#10b981',
    threat_level: 'CRITICAL',
    risk_score: 96,
    estimated_volume: '₹3.4 Cr (Commercial MDMA)',
    districts: ['Bhubaneswar Urban', 'Khordha', 'Puri'],
    primary_corridor: 'Patia InfoCity → Master Canteen Transit Node',
    predicted_escape_route: 'Patia Tech Corridor → Jayadev Vihar Flyover → Puri Highway Drop Zone',
    anpr_chokepoints: ['CAM-BBSR-0089 (InfoCity Square)', 'CAM-PURI-0004 (Batamangala Chowk)'],
    kingpin: {
      id: 'SUS-5921',
      name: 'Imran Khan',
      alias: 'Helmet Imran',
      role: 'Commercial Narcotics Trafficking Lead',
      risk_score: 96,
      status: 'High Priority Intercept Target',
      vehicle: 'Dark Grey KTM Duke 390 (OD-02-ER-9112)',
      last_location: 'Near InfoCity Sector 4, Bhubaneswar East',
      mugshot: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
      reward: '₹2,50,000'
    },
    lieutenants: [
      { id: 'SUS-2211', name: 'Farid Mirza', alias: 'Chotta Mirza', role: 'Contraband Sourcing & Arms Supplier', risk_score: 82, district: 'Bhubaneswar', mugshot: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80', task: 'Procures synthetic meth precursors from transit' },
      { id: 'SUS-3302', name: 'Arun Gowda', alias: 'Courier Arun', role: 'Dead-drop Courier & Logistics', risk_score: 68, district: 'Khordha', mugshot: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80', task: 'Executes dead-drops at highway fuel pumps' }
    ],
    connected_firs: [
      { case_number: 'FIR-2026-BBSR-3104', crime: 'Drug Seizure', station: 'Saheed Nagar PS', date: '2026-08-19', status: 'Under Investigation', note: '1.2kg MDMA seized at dead-drop node' },
      { case_number: 'FIR-2026-BBSR-5012', crime: 'Contraband Raid', station: 'Patia PS', date: '2026-08-17', status: 'Closed', note: 'Encrypted chat logs verified by Cyber Cell' }
    ],
    modus_operandi: 'Operates encrypted messaging distribution channels with dead-drop coordinates near tech parks and university nodes. Relies on fast delivery couriers wearing unbranded helmets.',
    tactical_action: 'Coordinate with STF Anti-Narcotics Wing, initiate bank account freezes under NDPS Section 68F, and inspect parcel hubs.'
  },
  {
    id: 'SYN-RB-03',
    name: 'Snake Naidu Armed Highway Robbery & Extortion Cell',
    category: 'robbery',
    category_label: 'Armed Robbery & Extortion',
    color: '#f43f5e',
    threat_level: 'HIGH',
    risk_score: 91,
    estimated_volume: '₹95 Lakhs (Highway Loot)',
    districts: ['Bhubaneswar Urban', 'Cuttack', 'Puri'],
    primary_corridor: 'National Highway 16 & State Highway 20 Corridor',
    predicted_escape_route: 'Saheed Nagar → Master Canteen → NH-16 Toll Intercept toward Cuttack',
    anpr_chokepoints: ['CAM-BBSR-0088 (Saheed Nagar)', 'CAM-CTC-0002 (Cuttack Ring Rd)'],
    kingpin: {
      id: 'SUS-7104',
      name: 'Suresh Naidu',
      alias: 'Snake Naidu',
      role: 'Highway Extortion & Armed Robbery Gang Leader',
      risk_score: 91,
      status: 'ABSCONDING (NBW Issued)',
      vehicle: 'TVS Apache RTR Black (OD-02-V-9901)',
      last_location: 'Saheed Nagar / Master Canteen Fringe',
      mugshot: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      reward: '₹1,50,000'
    },
    lieutenants: [
      { id: 'SUS-3302', name: 'Arun Gowda', alias: 'Spotter Arun', role: 'Highway Spotter & Target Scout', risk_score: 68, district: 'Cuttack', mugshot: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80', task: 'Monitors cash transit trucks at toll plazas' }
    ],
    connected_firs: [
      { case_number: 'FIR-2026-CTC-0269', crime: 'Armed Robbery', station: 'Cuttack Sadar PS', date: '2026-08-16', status: 'Open', note: 'Bladed weapons & machetes recovered from scene' }
    ],
    modus_operandi: 'Intercepts late-night commercial transport vehicles and solitary commuters using bladed weapons. Flees across district boundaries within 90 minutes.',
    tactical_action: 'Issue Non-Bailable Warrant execution alert across all SP control rooms and initiate Lookout Circular at state toll gates.'
  },
  {
    id: 'SYN-CY-04',
    name: 'Vikram Malhotra Cyber Extortion & Crypto Mule Nexus',
    category: 'cybercrime',
    category_label: 'Cyber Fraud & Money Laundering',
    color: '#06b6d4',
    threat_level: 'HIGH',
    risk_score: 88,
    estimated_volume: '₹4.2 Cr (Digital Extortion)',
    districts: ['Bhubaneswar Urban', 'Cuttack'],
    primary_corridor: 'InfoCity Tech Hub → Crypto Wallet Mules',
    predicted_escape_route: 'Patia Cyber Hub → Cloud Proxy → Multi-state mule drain',
    anpr_chokepoints: ['CAM-BBSR-0082 (Patia Main Rd)'],
    kingpin: {
      id: 'SUS-9104',
      name: 'Vikram Malhotra',
      alias: 'Vicky Blade',
      role: 'Cyber Extortion & Money Laundering Head',
      risk_score: 88,
      status: 'Digital Intelligence Tracking',
      vehicle: 'Black Yamaha R15 (OD-02-HA-8820)',
      last_location: 'InfoCity Tech Hub, Bhubaneswar',
      mugshot: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
      reward: '₹2,00,000'
    },
    lieutenants: [
      { id: 'SUS-6022', name: 'Bhavani Karpe', alias: 'Karpe Madam', role: 'Mule Bank Account Coordinator', risk_score: 85, district: 'Bhubaneswar', mugshot: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', task: 'Recruits fake KYC accounts from students & gig workers' }
    ],
    connected_firs: [
      { case_number: 'FIR-2026-BBSR-9104', crime: 'Cyber Extortion', station: 'Cyber CEN PS Bhubaneswar', date: '2026-08-15', status: 'Under Investigation', note: '14 mule bank accounts frozen under 1930 Helpline' }
    ],
    modus_operandi: 'Impersonates law enforcement over VoIP video calls, coercing victims into transferring funds to mule accounts, which are converted into cryptocurrency within 20 minutes.',
    tactical_action: 'Freeze 14 identified mule accounts via State Cyber Cell 1930 portal and trace IP routing.'
  },
  {
    id: 'SYN-EX-05',
    name: 'Anand Shinde Protection & Habitual Violence Cell',
    category: 'assault',
    category_label: 'Extortion & Organized Assault',
    color: '#8b5cf6',
    threat_level: 'HIGH',
    risk_score: 90,
    estimated_volume: '₹45 Lakhs (Protection Money)',
    districts: ['Cuttack', 'Puri'],
    primary_corridor: 'Chhatrabazar Market → Industrial Belt',
    predicted_escape_route: 'Chhatrabazar → Highway Intercept toward Puri Hideout',
    anpr_chokepoints: ['CAM-CTC-0001 (Chhatrabazar)'],
    kingpin: {
      id: 'SUS-8041',
      name: 'Anand Shinde',
      alias: 'Buda Anand',
      role: 'Protection Racket & Syndicate Enforcer',
      risk_score: 90,
      status: 'Arrest Warrant Pending',
      vehicle: 'Hero Splendor (OD-36-E-4491)',
      last_location: 'Near Chhatrabazar Market, Cuttack',
      mugshot: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      reward: '₹75,000'
    },
    lieutenants: [
      { id: 'SUS-1190', name: 'Manoj Reddy', alias: 'Rider Manoj', role: 'Local Intimidation Operative', risk_score: 65, district: 'Cuttack', mugshot: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80', task: 'Executes physical threats on construction contractors' }
    ],
    connected_firs: [
      { case_number: 'FIR-2026-CTC-1961', crime: 'Extortion Complaint', station: 'Cuttack Sadar PS', date: '2026-08-14', status: 'Open', note: 'Witness protection detail deployed at complainant site' }
    ],
    modus_operandi: 'Runs systematic protection rackets targeting small merchants and industrial contractors using physical intimidation.',
    tactical_action: 'Serve summons under Section 35 BNSS, conduct witness safety verification, and deploy night beats.'
  }
];

export function NetworkExplorer() {
  const { state } = useMockState();
  const role = state.currentUser?.role || 'OFFICER';

  type TabType = 'graph' | 'wall' | 'cards' | 'matrix' | 'routes' | 'osint';
  const [activeTab, setActiveTab] = useState<TabType>('graph');

  const [selectedSyndicate, setSelectedSyndicate] = useState(SYNDICATES[0]);
  const [selectedEvidenceModal, setSelectedEvidenceModal] = useState<Record<string, string> | null>(null);

  const [argusLiveOverview, setArgusLiveOverview] = useState<GraphOverview | null>(null);
  const [argusAlerts, setArgusAlerts] = useState<IntelAlert[]>([]);
  const [showWhyPanel, setShowWhyPanel] = useState<boolean>(false);

  const [customPins, setCustomPins] = useState([
    {
      id: 'PIN-1',
      text: 'ANPR camera hit at Khandagiri Square at 23:42 hrs (OD-02-MJ-8821).',
      author: 'SI Ranjan Samal',
      tag: 'ANPR HIT',
      date: '29 Aug',
      rotation: 'rotate-[-3deg]',
      color: 'bg-[#fef9c3] border-amber-300 text-stone-900'
    },
    {
      id: 'PIN-2',
      text: 'Informer reports second chopshop active near Cuttack Industrial fringe.',
      author: 'Insp. P. Patnaik',
      tag: 'INFORMER INTEL',
      date: '29 Aug',
      rotation: 'rotate-[2.5deg]',
      color: 'bg-[#dbeafe] border-sky-300 text-stone-900'
    }
  ]);

  const [showAddPinModal, setShowAddPinModal] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteTag, setNewNoteTag] = useState('FIELD CLUE');

  const handleAddPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    const newPin = {
      id: `PIN-${Date.now()}`,
      text: newNoteText,
      author: 'SI Ranjan Samal',
      tag: newNoteTag,
      date: 'Just now',
      rotation: 'rotate-[1.5deg]',
      color: 'bg-[#fef9c3] border-amber-300 text-stone-900'
    };
    setCustomPins([newPin, ...customPins]);
    setNewNoteText('');
    setShowAddPinModal(false);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState<EntityFilter>('ALL');
  const [relFilter, setRelFilter] = useState<RelFilter>('ALL');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceDTO | null>(null);

  const [graphLoading, setGraphLoading] = useState<boolean>(true);
  const [graphError, setGraphError] = useState<string | null>(null);

  useEffect(() => {
    async function loadWorkspaceData() {
      try {
        const payload = await workspaceApi.getWorkspace('CASE-2026-541');
        setActiveWorkspace(payload);
      } catch (err) {
        console.warn('NetworkExplorer workspace API load notice:', err);
      }
    }
    loadWorkspaceData();

    // Fetch live Neo4j graph overview & alerts
    setGraphLoading(true);
    graphIntelligenceService.getOverview(150)
      .then(data => {
        if (data && data.nodes && data.nodes.length > 0) {
          setArgusLiveOverview(data);
          setGraphError(null);
        } else if (data && data.nodes && data.nodes.length === 0) {
          setGraphError("Neo4j Database connected, but 0 nodes found. Please project cases into Neo4j.");
        } else {
          setGraphError("Neo4j Graph Service is offline or unreachable.");
        }
      })
      .catch(err => {
        setGraphError(`Neo4j Connection Error: ${err.message || err}`);
      })
      .finally(() => {
        setGraphLoading(false);
      });

    graphIntelligenceService.getAlerts().then(res => {
      if (res && res.alerts) {
        setArgusAlerts(res.alerts);
      }
    });
  }, []);

  const dynamicGraphData = useMemo(() => {
    if (argusLiveOverview && argusLiveOverview.nodes.length > 0) {
      const nodes: NetworkNode[] = argusLiveOverview.nodes.map(n => {
        const rawType = (n.entity_type || (n.node_type === 'case' ? 'CASE' : 'PERSON')).toUpperCase();
        let nodeType: NodeType = 'PERSON';
        if (rawType === 'CASE') nodeType = 'CASE';
        else if (rawType === 'PHONE') nodeType = 'PHONE';
        else if (rawType === 'VEHICLE') nodeType = 'VEHICLE';
        else if (rawType === 'LOCATION') nodeType = 'LOCATION';
        else if (rawType === 'STATION') nodeType = 'STATION';
        else if (rawType === 'EVIDENCE') nodeType = 'EVIDENCE';

        return {
          id: n.id,
          type: nodeType,
          label: n.label || n.id,
          sublabel: `Betweenness: ${n.betweenness} | Complaints: ${n.complaint_count}`,
          stationId: n.station_id || 'OP-BBSR-CAP',
          accessStatus: 'AUTHORIZED',
          isCrossStation: n.is_flagged || n.betweenness > 0.2,
          isAiDiscovered: n.betweenness > 0.1,
          metadata: {
            betweenness: n.betweenness,
            influence: n.influence,
            complaintCount: n.complaint_count,
            district: n.district || 'Khordha (Bhubaneswar)'
          }
        };
      });

      const edges: NetworkEdge[] = argusLiveOverview.edges.map((e, idx) => ({
        id: `argus-edge-${idx}`,
        source: e.source,
        target: e.target,
        relationship: 'MATCHED_ENTITY',
        label: e.weight >= 1 ? 'Linked Entity' : 'Associate',
        isCrossStation: e.weight > 0.8,
        isAiDiscovered: true,
        confidence: Math.round(e.weight * 100)
      }));

      return { nodes, edges };
    }
    if (activeWorkspace?.results) {
      return transformResultPayloadToGraph(activeWorkspace.results);
    }
    return { nodes: NETWORK_NODES, edges: NETWORK_EDGES };
  }, [argusLiveOverview, activeWorkspace]);

  const filteredNodes = useMemo(() => {
    return dynamicGraphData.nodes.filter(n => {
      if (entityFilter !== 'ALL' && n.type !== entityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return n.name.toLowerCase().includes(q) || n.subtitle.toLowerCase().includes(q) || n.id.toLowerCase().includes(q);
      }
      return true;
    });
  }, [dynamicGraphData.nodes, entityFilter, searchQuery]);

  const filteredNodeIds = useMemo(() => new Set(filteredNodes.map(n => n.id)), [filteredNodes]);

  const filteredEdges = useMemo(() => {
    return dynamicGraphData.edges.filter(e => {
      if (!filteredNodeIds.has(e.source) || !filteredNodeIds.has(e.target)) return false;
      if (relFilter === 'CROSS_STATION' && !e.crossStation) return false;
      if (relFilter === 'AI_DISCOVERED' && !e.aiDiscovered) return false;
      if (relFilter === 'SHARED_PHONE' && e.type !== 'PHONE') return false;
      if (relFilter === 'SHARED_VEHICLE' && e.type !== 'VEHICLE') return false;
      if (relFilter === 'LINKED_CASE' && e.type !== 'CASE') return false;
      return true;
    });
  }, [dynamicGraphData.edges, filteredNodeIds, relFilter]);

  const selectedNode = useMemo(() => {
    return dynamicGraphData.nodes.find(n => n.id === selectedNodeId) || null;
  }, [dynamicGraphData.nodes, selectedNodeId]);

  const summaryStats = useMemo(() => {
    const totalCases = filteredNodes.filter(n => n.type === 'CASE').length;
    const totalEntities = filteredNodes.filter(n => n.type !== 'CASE' && n.type !== 'STATION').length;
    const totalStations = filteredNodes.filter(n => n.type === 'STATION').length;
    const crossStationLinks = filteredEdges.filter(e => e.crossStation).length;
    const restrictedRecords = filteredNodes.filter(n => n.restricted).length;
    const aiDiscoveredLinks = filteredEdges.filter(e => e.aiDiscovered).length;
    return { totalCases, totalEntities, totalStations, crossStationLinks, restrictedRecords, aiDiscoveredLinks };
  }, [filteredNodes, filteredEdges]);

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-24 font-sans select-none">
      
      {/* ── TOP HEADER & SUB-TAB NAVIGATION BAR ── */}
      <div className="glass p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface border border-border-soft">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-md bg-rose-500/10 text-rose-500 border border-rose-500/30">
              INTELLIGENCE // NETWORK MATRIX ({role})
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-bold text-emerald-500 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              5 Active Gang Rings
            </span>
          </div>
          <h1 className="text-2xl font-bold font-mono text-text">
            Criminal Syndicate & Network Explorer
          </h1>
          <p className="text-xs text-text-dim mt-0.5">
            Odisha State Police CCTNS · Multi-Station Crime Ring Analysis & Interactive D3 Link Topology
          </p>
        </div>

        {/* Sub-Tab Navigation Bar */}
        <div className="flex items-center gap-1.5 bg-surface-2 p-1.5 rounded-2xl border border-border-soft text-xs font-semibold font-mono self-start md:self-auto overflow-x-auto">
          {[
            { id: 'graph', label: 'Interactive Network Explorer', icon: Network },
            { id: 'wall', label: 'Investigation Wall', icon: Newspaper },
            { id: 'cards', label: 'Syndicate Cards', icon: Layers },
            { id: 'matrix', label: 'Nexus Matrix', icon: Database },
            { id: 'routes', label: 'Predictive Routes', icon: Navigation },
            { id: 'osint', label: 'OSINT Hub', icon: Globe },
          ].map(tab => {
            const IconComp = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-brand text-white shadow-xs font-bold'
                    : 'text-text-dim hover:text-text hover:bg-surface'
                }`}
              >
                <IconComp className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── TAB 1 (DEFAULT): INTERACTIVE NETWORK EXPLORER ── */}
      {activeTab === 'graph' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl glass bg-surface border border-border-soft flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <Search size={14} className="text-text-dim" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search nodes by ID, name, vehicle, phone..."
                className="w-full bg-transparent text-text placeholder:text-text-faint outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value as EntityFilter)}
                className="p-2 rounded-xl bg-surface-2 border border-border text-text outline-none cursor-pointer"
              >
                <option value="ALL">All Entity Types</option>
                <option value="PERSON">Persons</option>
                <option value="CASE">Cases</option>
                <option value="PHONE">Phones</option>
                <option value="VEHICLE">Vehicles</option>
                <option value="LOCATION">Locations</option>
              </select>

              <select
                value={relFilter}
                onChange={(e) => setRelFilter(e.target.value as RelFilter)}
                className="p-2 rounded-xl bg-surface-2 border border-border text-text outline-none cursor-pointer"
              >
                <option value="ALL">All Link Types</option>
                <option value="CROSS_STATION">Cross-Station Links</option>
                <option value="AI_DISCOVERED">AI Discovered</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 bg-surface border border-border-soft rounded-2xl p-4 h-[640px] relative overflow-hidden shadow-xs">
              {graphLoading && (
                <div className="absolute inset-0 z-30 bg-surface/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 font-mono">
                  <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-text-dim font-bold">Querying Live Neo4j Graph Database...</span>
                </div>
              )}
              {graphError && !argusLiveOverview && (
                <div className="absolute inset-x-4 top-4 z-30 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-mono flex items-center justify-between gap-2 shadow-lg backdrop-blur-md">
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={16} />
                    <span><strong>NEO4J GRAPH OFFLINE:</strong> {graphError}</span>
                  </div>
                  <button
                    onClick={() => {
                      setGraphLoading(true);
                      graphIntelligenceService.getOverview(150).then(data => {
                        if (data && data.nodes && data.nodes.length > 0) {
                          setArgusLiveOverview(data);
                          setGraphError(null);
                        }
                      }).finally(() => setGraphLoading(false));
                    }}
                    className="px-2.5 py-1 bg-rose-500 text-white rounded-lg font-bold text-[10px] hover:bg-rose-600 transition-all cursor-pointer"
                  >
                    RETRY NEO4J
                  </button>
                </div>
              )}
              <IntelligenceGraph
                nodes={filteredNodes}
                edges={filteredEdges}
                selectedNodeId={selectedNodeId}
                onSelectNode={(nodeId) => setSelectedNodeId(nodeId)}
              />
            </div>

            <div className="lg:col-span-4 space-y-4">
              {selectedNode ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-surface-2 p-1.5 rounded-xl border border-border-soft text-xs font-mono">
                    <button
                      onClick={() => setShowWhyPanel(false)}
                      className={`flex-1 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        !showWhyPanel ? 'bg-brand text-white' : 'text-text-dim hover:text-text'
                      }`}
                    >
                      Node Details
                    </button>
                    <button
                      onClick={() => setShowWhyPanel(true)}
                      className={`flex-1 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        showWhyPanel ? 'bg-brand text-white' : 'text-text-dim hover:text-text'
                      }`}
                    >
                      <Cpu size={12} />
                      <span>S.I.R.I.S. Why?</span>
                    </button>
                  </div>

                  {showWhyPanel ? (
                    <ArgusWhyPanel
                      nodeId={selectedNode.id}
                      label={selectedNode.label}
                      entityType={selectedNode.type}
                      onClose={() => setSelectedNodeId(null)}
                    />
                  ) : (
                    <NodeDetailPanel
                      node={selectedNode}
                      onClose={() => setSelectedNodeId(null)}
                      onExpandNode={(nodeId) => setSelectedNodeId(nodeId)}
                    />
                  )}
                </div>
              ) : (
                <>
                  <SummaryPanel summary={summaryStats} />
                  <GraphLegend />
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: ULTRA-DETAILED INVESTIGATION WALL (VINTAGE NEWSPAPER BOARD) ── */}
      {activeTab === 'wall' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-2 text-text p-3.5 rounded-2xl border border-border-soft font-mono text-xs shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
              <span>ACTIVE INVESTIGATION WALL: <strong className="text-brand">{selectedSyndicate.name}</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedSyndicate.id}
                onChange={(e) => {
                  const s = SYNDICATES.find(syn => syn.id === e.target.value);
                  if (s) setSelectedSyndicate(s);
                }}
                className="px-3 py-1.5 rounded-xl bg-surface border border-border text-text font-bold cursor-pointer outline-none"
              >
                {SYNDICATES.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>

              <button
                onClick={() => setShowAddPinModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-brand text-white font-bold hover:bg-brand-bright transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={13} />
                <span>+ Pin Clue</span>
              </button>
            </div>
          </div>

          {/* VINTAGE NEWSPAPER BOARD */}
          <div className="relative w-full rounded-3xl bg-[#e6ddcd] dark:bg-[#181a1d] border-[10px] border-[#2b2722] p-6 sm:p-8 shadow-2xl overflow-hidden select-none">
            
            {/* Top Newspaper Masthead */}
            <div className="relative z-10 bg-[#f4eee2] dark:bg-[#202328] p-4 rounded-xl border-2 border-stone-500 shadow-md text-center transform rotate-[-0.5deg] mb-6">
              <div className="flex items-center justify-between text-[9px] font-mono text-stone-600 dark:text-stone-400 border-b border-stone-400 pb-1 uppercase tracking-wider">
                <span>VOL. LXXIV NO. 28,491</span>
                <span className="font-bold text-stone-900 dark:text-white">ODISHA STATE POLICE · INTELLIGENCE DISPATCH</span>
                <span>VERIFIED CCTNS MATRIX</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black font-serif tracking-tight uppercase text-stone-900 dark:text-stone-100 py-1">
                THE ODISHA POLICE GAZETTE
              </h2>
              <div className="border-t border-stone-400 pt-1 text-[10px] font-mono font-bold text-red-700 dark:text-red-400 uppercase tracking-widest">
                ★ ACTIVE CROSS-DISTRICT CRIMINAL SYNDICATE INVESTIGATION WALL ★
              </div>
            </div>

            {/* CRISS-CROSSING DECORATED ARTIFACT COLLAGE */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-start font-mono">
              
              {/* LEFT CLUSTER (4 COLS) */}
              <div className="md:col-span-4 space-y-4">
                {/* Official CID Dossier */}
                <div
                  onClick={() => setSelectedEvidenceModal({
                    title: 'ODISHA CID REVIEW PROGRAM — SUBJECT DOSSIER',
                    type: 'OFFICIAL POLICE DOSSIER',
                    mugshot: selectedSyndicate.kingpin.mugshot,
                    content: `Subject ${selectedSyndicate.kingpin.name} (Alias: "${selectedSyndicate.kingpin.alias}") operating corridor: ${selectedSyndicate.primary_corridor}. Threat Level: ${selectedSyndicate.threat_level} (${selectedSyndicate.risk_score}%). Non-bailable warrants active under CCTNS.`,
                    date: '21 Aug 2026',
                    stamp: 'VERIFIED CCTNS'
                  })}
                  className="bg-[#fcfaf5] dark:bg-[#1f2227] text-stone-950 dark:text-stone-100 p-4 rounded-xl shadow-xl border border-stone-400 text-xs transform rotate-[-3.5deg] cursor-pointer hover:rotate-0 hover:scale-102 transition-all relative"
                >
                  <div className="absolute -top-2 left-4 w-4 h-4 rounded-full bg-gradient-to-tr from-red-800 to-red-400 border border-white shadow-md z-30" />
                  <div className="flex items-center justify-between border-b border-stone-300 pb-1 text-[8.5px] font-bold uppercase text-stone-700 dark:text-stone-300">
                    <span>CID SPECIAL DOSSIER</span>
                    <span className="bg-red-700 text-white px-1.5 py-0.5 rounded text-[7.5px]">CONFIDENTIAL</span>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <div className="w-14 h-16 bg-stone-200 dark:bg-stone-800 rounded border border-stone-400 overflow-hidden shrink-0">
                      <img src={selectedSyndicate.kingpin.mugshot} alt="Kingpin" className="w-full h-full object-cover filter grayscale contrast-125" />
                    </div>
                    <div className="text-[9px] space-y-0.5 min-w-0">
                      <p><strong>NAME:</strong> {selectedSyndicate.kingpin.name}</p>
                      <p><strong>ALIAS:</strong> “{selectedSyndicate.kingpin.alias}”</p>
                      <p><strong>THREAT:</strong> <span className="text-red-700 font-bold">{selectedSyndicate.threat_level}</span></p>
                    </div>
                  </div>
                </div>

                {/* Torn Newspaper Clipping */}
                <div className="bg-[#e8dfce] dark:bg-[#1b1d22] text-stone-900 dark:text-stone-100 p-3 rounded-xl shadow-lg border border-stone-400 font-serif text-xs transform rotate-[2.5deg] relative">
                  <div className="border-b-2 border-black dark:border-stone-500 pb-0.5 mb-1 flex items-center justify-between">
                    <span className="font-black text-[11px] uppercase">ODISHA SAMACHAR</span>
                    <span className="text-[8px] font-mono text-stone-600">PAGE 3 · CRIME</span>
                  </div>
                  <div className="bg-stone-900 text-white dark:bg-white dark:text-stone-900 font-black text-[10px] p-1 uppercase leading-tight mb-1 text-center font-mono">
                    SPECIAL SQUAD BUSTS HIGHWAY GANG
                  </div>
                  <p className="text-[8.5px] leading-snug text-stone-800 dark:text-stone-200">
                    Over 42 vehicles traced along NH-16 corridor. Police recover master 433MHz frequency jammers from Cuttack chopshop.
                  </p>
                </div>

                {/* Seized Hardware Docket */}
                <div className="bg-[#edf2f7] dark:bg-[#1a1c22] text-stone-900 dark:text-stone-100 p-3.5 rounded-xl shadow-xl border border-stone-400 text-[9px] transform rotate-[-2deg] relative">
                  <div className="flex items-center justify-between border-b border-stone-300 pb-1 text-[8.5px] font-bold">
                    <span className="text-emerald-800 dark:text-emerald-400">⚡ EVIDENCE SEIZURE</span>
                    <span className="text-red-700">#EV-4910</span>
                  </div>
                  <div className="pt-1.5 space-y-1">
                    <p className="font-bold">• 433MHz Master RF Jammer</p>
                    <p className="font-bold">• OBD-II Duplicator & 14 Smart Blanks</p>
                    <p className="text-emerald-800 dark:text-emerald-400 font-bold text-[8px]">FSL Forensics Verified</p>
                  </div>
                </div>
              </div>

              {/* CENTER CLUSTER (4 COLS) */}
              <div className="md:col-span-4 space-y-4">
                {/* Large Wanted Poster */}
                <div
                  onClick={() => setSelectedEvidenceModal({
                    title: `WANTED BULLETIN: ${selectedSyndicate.kingpin.name}`,
                    type: 'WANTED NOTICE',
                    mugshot: selectedSyndicate.kingpin.mugshot,
                    content: `Wanted for organized criminal gang offenses, vehicle theft, and armed robbery. Last sighted near ${selectedSyndicate.kingpin.last_location}. Declared Reward: ${selectedSyndicate.kingpin.reward}.`,
                    date: 'CURRENT BULLETIN',
                    stamp: 'ACTIVE NBW WARRANT'
                  })}
                  className="bg-[#fffefb] dark:bg-[#1a1c1f] text-stone-950 dark:text-stone-100 p-4 rounded-xl shadow-2xl border-2 border-stone-400 text-center transform rotate-[1deg] cursor-pointer hover:rotate-0 hover:scale-102 transition-all relative"
                >
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-gradient-to-tr from-red-800 to-red-400 border border-white shadow-lg z-30" />
                  <div className="border-b-2 border-black dark:border-stone-500 pb-1 mb-2">
                    <h3 className="font-black text-base uppercase tracking-tight text-black dark:text-white">
                      ★ WANTED BY ODISHA POLICE ★
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 max-w-[190px] mx-auto mb-2">
                    <div className="relative aspect-square rounded overflow-hidden bg-stone-200 border border-black">
                      <img src={selectedSyndicate.kingpin.mugshot} alt={selectedSyndicate.kingpin.name} className="w-full h-full object-cover filter grayscale contrast-125" />
                      <span className="absolute bottom-0 inset-x-0 bg-black/90 text-white text-[7px] font-bold py-0.5">
                        {selectedSyndicate.kingpin.name.split(' ')[0]}
                      </span>
                    </div>
                    <div className="relative aspect-square rounded overflow-hidden bg-stone-200 border border-black">
                      <img src={selectedSyndicate.lieutenants[0].mugshot} alt={selectedSyndicate.lieutenants[0].name} className="w-full h-full object-cover filter grayscale contrast-125" />
                      <span className="absolute bottom-0 inset-x-0 bg-black/90 text-white text-[7px] font-bold py-0.5">
                        {selectedSyndicate.lieutenants[0].name.split(' ')[0]}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs font-black uppercase text-stone-900 dark:text-white">
                    {selectedSyndicate.kingpin.name}
                  </p>
                  <p className="text-[10px] text-red-700 dark:text-red-400 font-bold mt-0.5">
                    REWARD: {selectedSyndicate.kingpin.reward}
                  </p>
                </div>

                {/* FASTag Toll Tag Receipt */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-[#1f2937] text-white p-2.5 rounded-xl shadow-lg border border-stone-500 text-[8px] transform rotate-[-2.5deg]">
                    <div className="flex items-center justify-between pb-0.5 border-b border-stone-600 text-amber-400 font-bold">
                      <span>FASTAG TOLL</span>
                      <RadioIcon className="w-2.5 h-2.5 text-emerald-400" />
                    </div>
                    <p className="pt-0.5 text-[7.5px] text-stone-300">TAG: 34161FA8829104</p>
                    <p className="text-emerald-400 text-[7.5px]">VEH: OD-02-MJ-8821</p>
                  </div>
                  <div className="bg-[#f8f5ee] dark:bg-[#1a1b1e] text-stone-950 dark:text-stone-100 p-2.5 rounded-xl shadow border border-stone-400 text-[8px] transform rotate-[3deg]">
                    <p className="font-bold text-red-700">#TL-8821</p>
                    <p className="text-[7.5px] text-stone-600">Pahala Toll</p>
                  </div>
                </div>
              </div>

              {/* RIGHT CLUSTER (4 COLS) */}
              <div className="md:col-span-4 space-y-4">
                {customPins.map(pin => (
                  <div key={pin.id} className={`p-3 rounded-xl shadow-md border text-xs relative ${pin.rotation} ${pin.color}`}>
                    <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-wider border-b border-stone-300 pb-1 mb-1">
                      <span>{pin.tag}</span>
                      <span>{pin.date}</span>
                    </div>
                    <p className="text-[11px] font-medium leading-snug">{pin.text}</p>
                    <div className="mt-2 pt-1 border-t border-stone-300/60 text-[8px] font-bold">— {pin.author}</div>
                  </div>
                ))}
              </div>

            </div>

            {/* Bottom CCTNS Linked FIR Dockets */}
            <div className="mt-6 pt-4 border-t-2 border-black dark:border-stone-500 font-mono">
              <span className="font-bold text-xs uppercase tracking-wider text-stone-900 dark:text-white block mb-3">
                CCTNS LINKED CASE DOCKETS ({selectedSyndicate.connected_firs.length})
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {selectedSyndicate.connected_firs.map(fir => (
                  <div key={fir.case_number} className="bg-[#f0eae1] dark:bg-[#1e2024] p-3 rounded-xl border border-stone-400 text-xs">
                    <div className="flex items-center justify-between font-bold text-stone-900 dark:text-stone-100 text-xs">
                      <span>{fir.case_number}</span>
                      <span className="text-[9px] bg-stone-300 dark:bg-stone-700 px-1.5 py-0.5 rounded">{fir.status}</span>
                    </div>
                    <p className="font-bold text-stone-950 dark:text-white mt-1">{fir.crime}</p>
                    <p className="text-[10px] text-stone-600 dark:text-stone-400">{fir.station}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── TAB 3: EXACT DRISHTI SYNDICATE CARDS WORKBENCH ── */}
      {activeTab === 'cards' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start font-mono">
          <div className="lg:col-span-7 space-y-3.5">
            {SYNDICATES.map((syn) => {
              const isSelected = selectedSyndicate.id === syn.id;
              return (
                <div
                  key={syn.id}
                  onClick={() => setSelectedSyndicate(syn)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer relative bg-surface border-border-soft shadow-xs space-y-4 ${
                    isSelected
                      ? 'border-brand ring-2 ring-brand/10'
                      : 'hover:border-border'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-surface-2 text-text-dim">
                        {syn.category_label}
                      </span>
                      <h2 className="text-base font-bold text-text mt-1.5">
                        {syn.name}
                      </h2>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
                        RISK {syn.risk_score}/100
                      </span>
                      <span className="text-xs text-text-dim font-medium">
                        {syn.connected_firs.length} Cases
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-2 border border-border-soft">
                      <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-surface shrink-0 border border-border-soft">
                        <img
                          src={syn.kingpin.mugshot}
                          alt={syn.kingpin.name}
                          className="w-full h-full object-cover object-top"
                        />
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-rose-500 ring-1 ring-white" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] font-bold text-rose-500 uppercase block">Prime Kingpin</span>
                        <p className="text-xs font-bold text-text truncate">{syn.kingpin.name}</p>
                        <p className="text-[10px] text-text-dim truncate">“{syn.kingpin.alias}”</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-surface-2 border border-border-soft space-y-1.5">
                      <span className="text-[9px] font-bold text-text-dim uppercase block">
                        Specialized Cells ({syn.lieutenants.length})
                      </span>
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="flex -space-x-2 overflow-hidden">
                          {syn.lieutenants.map((lt) => (
                            <div key={lt.id} className="w-7 h-7 rounded-full overflow-hidden border-2 border-surface shrink-0 bg-surface-2">
                              <img src={lt.mugshot} alt={lt.name} className="w-full h-full object-cover object-top" />
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-text font-medium truncate">
                          {syn.lieutenants.map((l) => l.name.split(' ')[0]).join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-text-dim leading-relaxed line-clamp-2">
                    <strong className="text-text font-semibold">Modus Operandi:</strong> {syn.modus_operandi}
                  </p>

                  <div className="pt-2.5 border-t border-border-soft flex items-center justify-between text-xs">
                    <span className="text-text-dim text-xs truncate max-w-xs flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-brand shrink-0" />
                      <span className="text-text">{syn.primary_corridor}</span>
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSyndicate(syn);
                        setActiveTab('wall');
                      }}
                      className="inline-flex items-center gap-1 font-bold text-brand hover:underline text-xs shrink-0 cursor-pointer"
                    >
                      <span>Investigation Wall</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="sticky top-4 p-6 rounded-2xl glass bg-surface border border-border-soft shadow-xs space-y-4">
              <div className="pb-3 border-b border-border-soft">
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand block">
                  Target Syndicate Focus
                </span>
                <h3 className="text-sm font-bold text-text mt-0.5">
                  {selectedSyndicate.name}
                </h3>
              </div>

              <div className="p-4 rounded-xl bg-surface-2 border border-border-soft space-y-3">
                <div className="flex items-center gap-3.5">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-border-soft">
                    <img
                      src={selectedSyndicate.kingpin.mugshot}
                      alt={selectedSyndicate.kingpin.name}
                      className="w-full h-full object-cover object-top"
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-rose-500 ring-2 ring-surface" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-text truncate">
                      {selectedSyndicate.kingpin.name}
                    </h4>
                    <p className="text-xs text-text-dim font-medium">
                      Alias: <span className="font-semibold text-text">“{selectedSyndicate.kingpin.alias}”</span>
                    </p>
                    <span className="inline-block text-[10px] px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-500 font-bold border border-rose-500/20 mt-1">
                      Risk Rating {selectedSyndicate.kingpin.risk_score}/100
                    </span>
                  </div>
                </div>

                <div className="text-xs text-text-dim space-y-1.5 pt-2 border-t border-border-soft">
                  <p><strong className="text-text font-semibold">Status:</strong> {selectedSyndicate.kingpin.status}</p>
                  <p><strong className="text-text font-semibold">Vehicle:</strong> {selectedSyndicate.kingpin.vehicle}</p>
                  <p><strong className="text-text font-semibold">Last Sighted:</strong> {selectedSyndicate.kingpin.last_location}</p>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-dim block">
                  Connected Case Dockets ({selectedSyndicate.connected_firs.length})
                </span>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedSyndicate.connected_firs.map((fir) => (
                    <div
                      key={fir.case_number}
                      className="p-3 rounded-xl bg-surface-2 border border-border-soft flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-brand">
                          <FileText className="w-3.5 h-3.5" />
                          <span>{fir.case_number}</span>
                        </div>
                        <p className="text-[11px] text-text-dim font-medium">
                          {fir.crime} · {fir.station}
                        </p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-surface text-text-dim font-bold uppercase border border-border-soft">
                        {fir.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-surface-2 border border-border-soft space-y-1.5">
                <div className="flex items-center gap-1.5 text-text font-bold text-xs">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                  <span>COMMAND TACTICAL DIRECTIVE</span>
                </div>
                <p className="text-xs text-text-dim leading-relaxed">
                  {selectedSyndicate.tactical_action}
                </p>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* ── TAB 4: EXACT DRISHTI STRATEGIC NEXUS MATRIX ── */}
      {activeTab === 'matrix' && (
        <div className="p-6 rounded-2xl glass bg-surface border border-border-soft shadow-xs space-y-4 font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border-soft">
            <div>
              <h3 className="text-sm font-extrabold text-text uppercase tracking-wider">
                Cross-District Criminal Syndicate Nexus Matrix
              </h3>
              <p className="text-xs text-text-dim mt-0.5">
                Inter-state crime nexus, financial volume, corridor tracking & linked CCTNS evidence
              </p>
            </div>
            <span className="text-xs font-mono text-brand font-bold bg-brand/10 px-3 py-1 rounded-xl border border-brand/20 self-start sm:self-auto">
              5 Primary Rings • 51 Linked Case Dockets
            </span>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse min-w-[950px]">
              <thead>
                <tr className="bg-surface-2 border-b border-border-soft text-text-dim uppercase text-[10.5px]">
                  <th className="px-4 py-3.5 font-bold">Syndicate Network</th>
                  <th className="px-4 py-3.5 font-bold">Prime Kingpin</th>
                  <th className="px-4 py-3.5 font-bold">Financial Scale</th>
                  <th className="px-4 py-3.5 font-bold">Operating Corridor</th>
                  <th className="px-4 py-3.5 font-bold">Threat Level</th>
                  <th className="px-4 py-3.5 font-bold text-center">Linked FIRs</th>
                  <th className="px-4 py-3.5 font-bold text-right">Dossier Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft/60">
                {SYNDICATES.map((syn) => (
                  <tr key={syn.id} className="hover:bg-surface-hover transition-colors">
                    <td className="px-4 py-4 font-bold text-text">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" style={{ background: syn.color }} />
                        <span className="font-bold text-text truncate max-w-[200px]">{syn.name}</span>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-text">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl overflow-hidden bg-surface-2 shrink-0 border border-border-soft">
                          <img src={syn.kingpin.mugshot} alt={syn.kingpin.name} className="w-full h-full object-cover object-top" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-text text-xs truncate">{syn.kingpin.name}</div>
                          <div className="text-[10px] text-text-dim font-medium">“{syn.kingpin.alias}”</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span className="font-bold text-emerald-500 text-xs whitespace-nowrap block">
                        {syn.estimated_volume}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-text-dim text-xs">
                      <span className="line-clamp-2 leading-snug">{syn.primary_corridor}</span>
                    </td>

                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold whitespace-nowrap border ${
                        syn.threat_level === 'CRITICAL'
                          ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${syn.threat_level === 'CRITICAL' ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`} />
                        <span>{syn.threat_level} ({syn.risk_score}%)</span>
                      </span>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span className="inline-block font-bold text-brand bg-brand/10 px-2.5 py-0.5 rounded-lg border border-brand/20 text-xs whitespace-nowrap">
                        {syn.connected_firs.length} Cases
                      </span>
                    </td>

                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedSyndicate(syn);
                          setSelectedEvidenceModal({
                            title: `CCTNS CASE DOSSIER — ${syn.connected_firs[0].case_number}`,
                            type: 'CRITICAL CASE DOCKET',
                            content: `Case Number: ${syn.connected_firs[0].case_number} · ${syn.connected_firs[0].crime} (${syn.connected_firs[0].station}). Status: ${syn.connected_firs[0].status}. Note: ${syn.connected_firs[0].note}`,
                            date: syn.connected_firs[0].date,
                            stamp: 'CCTNS SYNCED'
                          });
                        }}
                        className="whitespace-nowrap px-3.5 py-1.5 rounded-xl bg-brand text-white hover:bg-brand-bright font-bold text-xs transition-all cursor-pointer shadow-2xs"
                      >
                        Inspect Docket →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 5: PREDICTIVE ROUTES (WITH LIVE LEAFLET ESCAPE MAP) ── */}
      {activeTab === 'routes' && (
        <div className="p-6 rounded-2xl glass bg-surface border border-border-soft space-y-4 font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-soft">
            <div>
              <h3 className="text-sm font-extrabold text-text uppercase">Predictive Escape Route & ANPR Interception Grid</h3>
              <p className="text-xs text-text-dim">Calibrated multi-source intel feeds (FASTag sweeps, SIM cell tower hops, ANPR time-decay trajectory)</p>
            </div>

            <select
              value={selectedSyndicate.id}
              onChange={(e) => {
                const s = SYNDICATES.find(syn => syn.id === e.target.value);
                if (s) setSelectedSyndicate(s);
              }}
              className="px-3 py-1.5 rounded-xl bg-surface-2 border border-border text-text font-bold text-xs cursor-pointer outline-none"
            >
              {SYNDICATES.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="p-4 rounded-xl bg-surface-2 border border-border-soft grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-[10px] text-text-dim uppercase font-bold">Active Tracking Target</span>
              <p className="font-bold text-text mt-0.5">{selectedSyndicate.kingpin.name} ({selectedSyndicate.kingpin.alias})</p>
            </div>
            <div>
              <span className="text-[10px] text-text-dim uppercase font-bold">Predicted Next Corridor</span>
              <p className="font-bold text-rose-500 mt-0.5">{selectedSyndicate.predicted_escape_route}</p>
            </div>
            <div>
              <span className="text-[10px] text-text-dim uppercase font-bold">ANPR Chokepoints</span>
              <p className="text-text-dim mt-0.5">{selectedSyndicate.anpr_chokepoints.join(' · ')}</p>
            </div>
          </div>

          {/* INTERACTIVE LEAFLET TACTICAL MAP */}
          <PredictiveRoutesMap syndicate={selectedSyndicate} />
        </div>
      )}

      {/* ── TAB 6: ARGUS OSINT ENRICHMENT HUB ── */}
      {activeTab === 'osint' && (
        <div className="max-w-4xl mx-auto space-y-4">
          <OsintPanel />
        </div>
      )}

      {/* Modal to Add Pin Clue */}
      {showAddPinModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-[99999] flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl p-6 max-w-md w-full border border-border-soft space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-border-soft">
              <h3 className="text-sm font-bold text-text">Pin New Evidence Lead</h3>
              <button onClick={() => setShowAddPinModal(false)} className="text-text-dim">✕</button>
            </div>

            <form onSubmit={handleAddPin} className="space-y-3">
              <div>
                <label className="block text-[10px] text-text-dim uppercase font-bold mb-1">Observation Note</label>
                <textarea
                  required
                  rows={3}
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="e.g. Sighted suspect switching to Bajaj Pulsar (OD-02-MJ-8821)..."
                  className="w-full p-2.5 rounded-xl bg-surface-2 border border-border text-text outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-[10px] text-text-dim uppercase font-bold mb-1">Tag Classification</label>
                <select
                  value={newNoteTag}
                  onChange={(e) => setNewNoteTag(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-surface-2 border border-border text-text outline-none"
                >
                  <option value="ANPR HIT">ANPR Hit</option>
                  <option value="FIELD SIGHTING">Field Sighting</option>
                  <option value="INFORMER INTEL">Informer Intel</option>
                  <option value="WEAPON CLUE">Weapon Clue</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddPinModal(false)}
                  className="flex-1 py-2 rounded-xl bg-surface-2 border border-border text-text-dim font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-brand text-white font-bold"
                >
                  Pin to Board
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Dossier Modal */}
      {selectedEvidenceModal && (
        <div
          onClick={() => setSelectedEvidenceModal(null)}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-[99999] flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface rounded-3xl p-6 max-w-md w-full border border-border-soft space-y-4 shadow-2xl font-mono text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border-soft">
              <div>
                <span className="text-[10px] text-rose-500 font-bold uppercase">{selectedEvidenceModal.type}</span>
                <h3 className="text-base font-bold text-text mt-0.5">{selectedEvidenceModal.title}</h3>
              </div>
              <button onClick={() => setSelectedEvidenceModal(null)} className="p-1 rounded bg-surface-2 text-text-dim">✕</button>
            </div>

            <p className="text-text-dim leading-relaxed bg-surface-2 p-3 rounded-xl border border-border-soft">
              {selectedEvidenceModal.content}
            </p>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedEvidenceModal(null)}
                className="px-4 py-2 rounded-xl bg-brand text-white font-bold"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
