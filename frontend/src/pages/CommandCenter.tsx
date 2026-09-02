import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar, Filter, UserPlus, ShieldAlert, MapPin, Users, Camera,
  TrendingUp, Clock, Shield, Target, Car, Laptop, Home, AlertCircle, Activity,
  FileText, ChevronRight, ArrowUpRight, Sparkles
} from 'lucide-react';
import { useMockState } from '../mockServices/MockStateContext';
import { useLanguage } from '../context/LanguageContext';
import { dashboardApi } from '../services/api';
import { ActionRequiredStrip } from '../components/dashboard/ActionRequiredStrip';
import { CrimeCategoryDonutChart } from '../components/dashboard/CrimeCategoryDonutChart';
import { CrimeHotspotGisMap } from '../components/dashboard/CrimeHotspotGisMap';
import { CrossStationD3Network } from '../components/dashboard/CrossStationD3Network';
import { ActiveInvestigationsTable } from '../components/dashboard/ActiveInvestigationsTable';
import { IntelligenceAlertsFeed } from '../components/dashboard/IntelligenceAlertsFeed';

const CRIME_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  vehicle_theft:   Car,
  cyber_fraud:     Laptop,
  robbery:         ShieldAlert,
  chain_snatching: ShieldAlert,
  burglary:        Home,
  drug_offence:    AlertCircle,
  hit_and_run:     Activity,
  assault:         ShieldAlert,
};

const CRIME_NAMES: Record<string, string> = {
  vehicle_theft:   'Vehicle Theft & Commercial Hijack',
  cyber_fraud:     'Cyber & OTP Online Fraud',
  robbery:         'Armed Highway Robbery',
  chain_snatching: 'Chain & Gold Snatching',
  burglary:        'Residential Burglary',
  drug_offence:    'Narcotics & NDPS Seizure',
  hit_and_run:     'Hit & Run Intersection Incident',
  assault:         'Physical Assault',
};

function fmtDate(dateStr?: string) {
  if (!dateStr) return '21 Aug 2026';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return dateStr; }
}

export function CommandCenter() {
  const { state, dispatch } = useMockState();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const role = state.currentUser?.role || 'OFFICER';
  const myStationId = state.currentUser?.stationId || 'OP-BBSR-CAP';
  const myStation = state.stations.find((s) => s.id === myStationId) || state.stations[0];

  // Filter & View States
  const [dateRange] = useState('18 Aug 2025 - 18 Aug 2025');
  const [showFilters, setShowFilters] = useState(false);
  const [filterDistrict, setFilterDistrict] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');

  // Time filter state for Cases Resolved card
  const [timeFilter, setTimeFilter] = useState<'Day' | 'Week' | 'Month' | 'Year'>('Month');

  // Active Tab for Recent Incidents Table
  const [activeIncidentTab, setActiveIncidentTab] = useState('all');
  const [selectedFIR, setSelectedFIR] = useState<Record<string, string> | null>(null);

  // Modals State
  const [showAddOfficerModal, setShowAddOfficerModal] = useState(false);
  const [assigningCase, setAssigningCase] = useState<Record<string, unknown> | null>(null);
  const [newOfficerId, setNewOfficerId] = useState('');

  // Form State for new Officer
  const [newOfficerName, setNewOfficerName] = useState('');
  const [newOfficerRank, setNewOfficerRank] = useState('Sub-Inspector');
  const [newOfficerRole, setNewOfficerRole] = useState<'OFFICER' | 'STATION_ADMIN'>('OFFICER');

  // Sample Odisha FIR Cases for Drishti Recent Incidents & Case Archive Table
  const sampleFirs = useMemo(() => {
    return [
      {
        case_number: 'FIR-2026-BBSR-0492',
        crime_type: 'robbery',
        police_station: 'Khandagiri PS',
        description: 'Armed robbery along NH-16 corridor targeting transit cargo trucks. Suspect vehicle OD-02-MJ-8821 flagged by ANPR.',
        date_filed: '2026-08-21T14:20:00Z',
        status: 'under_investigation',
        investigation_office: 'SI Ranjan Samal',
        priority: 'CRITICAL'
      },
      {
        case_number: 'FIR-2026-CTC-0112',
        crime_type: 'vehicle_theft',
        police_station: 'Cuttack Sadar PS',
        description: 'Stolen Silver Maruti Swift OD-02-AB-1234 intercepted entering link road checkpoint.',
        date_filed: '2026-08-20T09:15:00Z',
        status: 'open',
        investigation_office: 'Insp. P. Patnaik',
        priority: 'HIGH'
      },
      {
        case_number: 'FIR-2026-BBSR-3104',
        crime_type: 'chain_snatching',
        police_station: 'Saheed Nagar PS',
        description: 'Gold chain snatching near Master Canteen market portico. Suspect Farid Mirza detected on biometric CCTV.',
        date_filed: '2026-08-19T18:40:00Z',
        status: 'under_investigation',
        investigation_office: 'SI Ranjan Samal',
        priority: 'HIGH'
      },
      {
        case_number: 'FIR-2026-PURI-0882',
        crime_type: 'cyber_fraud',
        police_station: 'Puri Town PS',
        description: 'Digital arrest call scam targeting hotel reservation portal. IP address trace completed.',
        date_filed: '2026-08-18T11:30:00Z',
        status: 'closed',
        investigation_office: 'Cyber Cell Squad',
        priority: 'MEDIUM'
      },
      {
        case_number: 'FIR-2026-BBSR-5012',
        crime_type: 'burglary',
        police_station: 'Patia PS',
        description: 'Residential burglary in InfoCity Sector 4. Fingerprint & CCTV video vector matched.',
        date_filed: '2026-08-17T02:10:00Z',
        status: 'closed',
        investigation_office: 'Patia Special Team',
        priority: 'MEDIUM'
      }
    ];
  }, []);

  const filteredIncidentFIRs = useMemo(() => {
    return sampleFirs.filter(f => {
      if (activeIncidentTab === 'all') return true;
      return f.status === activeIncidentTab;
    });
  }, [sampleFirs, activeIncidentTab]);

  // Filtered Data Calculations for Active Investigations
  const filteredCases = useMemo(() => {
    return state.cases.filter((c) => {
      if (role !== 'SUPER_ADMIN' && c.stationId !== myStationId) return false;
      if (filterDistrict !== 'ALL') {
        const station = state.stations.find((s) => s.id === c.stationId);
        if (station?.district !== filterDistrict) return false;
      }
      if (filterCategory !== 'ALL' && !c.crimeType.toLowerCase().includes(filterCategory.toLowerCase())) {
        return false;
      }
      if (filterPriority !== 'ALL' && c.priority !== filterPriority) return false;
      return true;
    });
  }, [state.cases, state.stations, role, myStationId, filterDistrict, filterCategory, filterPriority]);

  const [, setBackendStats] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    dashboardApi.getStats()
      .then((stats) => setBackendStats(stats))
      .catch((err) => console.warn('Dashboard stats backend connection:', err));
  }, []);

  // Station Officers list for assignment modal
  const stationOfficers = useMemo(() => {
    return state.users.filter((u) => u.stationId === myStationId);
  }, [state.users, myStationId]);

  // Add Officer Handler
  const handleAddOfficerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOfficerName.trim()) return;
    const newOfficerIdStr = `INV-KHD-${String(state.users.length + 1).padStart(3, '0')}`;
    const newOfficer = {
      id: newOfficerIdStr,
      name: newOfficerName,
      role: newOfficerRole,
      stationId: myStationId,
      status: 'ACTIVE' as const,
      rank: newOfficerRank,
    };
    dispatch({ type: 'ADD_USER', payload: newOfficer });

    dispatch({
      type: 'ADD_ALERT',
      payload: {
        id: `ALT-${Date.now()}`,
        type: 'PATTERN_DETECTED',
        message: `Officer ${newOfficerName} deployed under station ${myStation?.name}.`,
        createdAt: new Date().toISOString(),
        isRead: false,
      },
    });

    setNewOfficerName('');
    setShowAddOfficerModal(false);
  };

  // Reassign Case Handler
  const handleConfirmReassign = () => {
    if (!assigningCase || !newOfficerId) return;
    const updated = { ...assigningCase, investigatorId: newOfficerId };
    dispatch({ type: 'UPDATE_CASE', payload: updated as unknown as typeof state.cases[0] });

    dispatch({
      type: 'ADD_ALERT',
      payload: {
        id: `ALT-${Date.now()}`,
        type: 'PATTERN_DETECTED',
        message: `Case ${assigningCase.id} reassigned to ${
          state.users.find((u) => u.id === newOfficerId)?.name
        }.`,
        relatedCaseId: String(assigningCase.id),
        createdAt: new Date().toISOString(),
        isRead: false,
      },
    });

    setAssigningCase(null);
    setNewOfficerId('');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-24 font-sans select-none">

      {/* ── 1. HEADER BAR ── */}
      <div className="glass p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface border border-border-soft">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-md bg-rose-500/10 text-rose-500 border border-rose-500/30">
              FIELD OPS // COMMAND CONSOLE
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-bold text-emerald-500 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live CCTNS Sync
            </span>
          </div>
          <h1 className="text-2xl font-bold font-mono text-text">
            {t('nav.dashboard', 'Tactical Dispatch & Case Console')}
          </h1>
          <p className="text-xs text-text-dim mt-0.5">
            Odisha State Police · {myStation?.name || 'Khandagiri PS'} Central Sector Intelligence Radar
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs">
          <div className="flex items-center gap-2 bg-surface-2 px-3.5 py-2 rounded-xl border border-border-soft text-text">
            <Calendar size={14} className="text-brand" />
            <span>{dateRange}</span>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border font-bold transition-all cursor-pointer ${
              showFilters
                ? 'bg-brand text-bg border-brand'
                : 'bg-surface-2 text-text border-border-soft hover:bg-surface-hover'
            }`}
          >
            <Filter size={14} />
            <span>{t('common.filters', 'Filters')}</span>
          </button>

          {role === 'STATION_ADMIN' && (
            <button
              onClick={() => setShowAddOfficerModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand text-bg font-bold hover:bg-brand-bright transition-all shadow-sm cursor-pointer"
            >
              <UserPlus size={14} />
              <span>Deploy Officer</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Options Bar */}
      {showFilters && (
        <div className="p-4 rounded-2xl glass bg-surface border border-border-soft grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs animate-fade-in">
          <div>
            <label className="block text-[10px] text-text-dim uppercase font-bold mb-1">District</label>
            <select
              value={filterDistrict}
              onChange={(e) => setFilterDistrict(e.target.value)}
              className="w-full p-2 rounded-xl bg-surface-2 border border-border text-text outline-none cursor-pointer"
            >
              <option value="ALL">All Districts</option>
              <option value="Bhubaneswar Urban">Bhubaneswar Urban</option>
              <option value="Cuttack">Cuttack District</option>
              <option value="Puri">Puri District</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-text-dim uppercase font-bold mb-1">Crime Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full p-2 rounded-xl bg-surface-2 border border-border text-text outline-none cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              <option value="robbery">Armed Robbery</option>
              <option value="theft">Vehicle Theft</option>
              <option value="cyber">Cyber Fraud</option>
              <option value="burglary">Burglary</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-text-dim uppercase font-bold mb-1">Priority</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full p-2 rounded-xl bg-surface-2 border border-border text-text outline-none cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical Watchlist</option>
              <option value="HIGH">High Priority</option>
              <option value="NORMAL">Normal Priority</option>
            </select>
          </div>
        </div>
      )}

      {/* ── 2. ACTION REQUIRED ALERT STRIP ── */}
      <ActionRequiredStrip
        stats={{
          overdueWork: 15,
          inactiveCases: 8,
          overloadedOfficers: 2,
          unresolvedMatches: 4,
        }}
      />

      {/* ── 3. BALANCED 8-COL / 4-COL LAYOUT GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN (8 COLS): HIGH-IMPACT CARDS + ACTIVE INVESTIGATIONS TABLE + CROSS-STATION LINKS */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* 4 BIG HIGH-IMPACT INTELLIGENCE CARDS (2x2 GRID) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* BIG BOX 1: CROSS-STATION PATTERN ALERT */}
            <div className="rounded-2xl glass bg-surface border border-border-soft p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden">
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center shadow-2xs">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-sm border border-rose-500/50 bg-rose-500/10 text-rose-500 font-mono text-[9px] font-black uppercase tracking-wider -rotate-1 shadow-2xs">
                    ALERT #BBSR-0492 // CRITICAL
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 font-mono">
                    Cross-Station Crime Link Detected
                  </span>
                  <h3 className="text-base font-black text-text tracking-tight leading-snug">
                    Khandagiri – Saheed Nagar Armed Heist Vector
                  </h3>
                  <p className="text-[11px] text-text-dim pt-1 line-clamp-2 leading-relaxed">
                    Vehicle OD-02-AB-1234 matched between Residential Burglary & Armed Robbery across 2 station jurisdictions.
                  </p>
                </div>
              </div>

              <div className="pt-3.5 mt-3 border-t border-border-soft flex items-center justify-between font-mono">
                <div>
                  <span className="text-xs font-black text-text">Pattern Strength</span>
                  <span className="block text-[10px] text-rose-500 font-semibold">96.4% Match Matrix</span>
                </div>
                <Link
                  to="/network"
                  className="px-4 py-1.5 rounded-full bg-surface-2 hover:bg-rose-500 hover:text-white text-text border border-border-soft text-xs font-bold transition-all shadow-2xs flex items-center gap-1"
                >
                  View Network
                </Link>
              </div>
            </div>

            {/* BIG BOX 2: PRIMARY CRIME VECTOR & HOTSPOT */}
            <div className="rounded-2xl glass bg-surface border border-border-soft p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden">
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shadow-2xs">
                    <MapPin className="w-5 h-5" />
                  </div>
                  
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-sm border border-amber-500/50 bg-amber-500/10 text-amber-500 font-mono text-[9px] font-black uppercase tracking-wider -rotate-1 shadow-2xs">
                    GRID #BBSR-06 // ACTIVE
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 font-mono">
                    Primary Crime Vector & MO
                  </span>
                  <h3 className="text-base font-black text-text tracking-tight leading-snug">
                    Vehicle Theft & Highway Commercial Hijack
                  </h3>
                  <p className="text-[11px] text-text-dim pt-1 line-clamp-2 leading-relaxed">
                    Peak window 22:00–03:00 hrs targeting commercial transit along NH-16 corridor.
                  </p>
                </div>
              </div>

              <div className="pt-3.5 mt-3 border-t border-border-soft flex items-center justify-between font-mono">
                <div>
                  <span className="text-xs font-black text-text">Hotspot Grid</span>
                  <span className="block text-[10px] text-text-dim font-semibold">GIS Patrol Active</span>
                </div>
                <Link
                  to="/map"
                  className="px-4 py-1.5 rounded-full bg-[#2E5FE0] text-white text-xs font-bold hover:bg-blue-700 transition-all shadow-2xs flex items-center gap-1"
                >
                  Deploy Patrol
                </Link>
              </div>
            </div>

            {/* BIG BOX 3: SUSPECT WATCHLIST & ACTIVE WARRANT */}
            <div className="rounded-2xl glass bg-surface border border-border-soft p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden">
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20 flex items-center justify-center shadow-2xs">
                    <Users className="w-5 h-5" />
                  </div>
                  
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-sm border border-rose-500/50 bg-rose-500/10 text-rose-500 font-mono text-[9px] font-black uppercase tracking-wider -rotate-1 shadow-2xs">
                    WARRANT #SUS-7701 // LIVE
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-dim font-mono">
                    ANPR Hit 14m ago · Indiranagar Node
                  </span>
                  <h3 className="text-base font-black text-text tracking-tight leading-snug">
                    Ramesh Kumar “Bullet Ramesh”
                  </h3>
                  <div className="flex items-center gap-2 pt-1 font-mono text-[10px]">
                    <span className="px-2 py-0.5 rounded bg-surface-2 text-rose-500 font-bold border border-border-soft">
                      Non-Bailable Warrant
                    </span>
                    <span className="text-text-dim">Repeat Offender</span>
                  </div>
                </div>
              </div>

              <div className="pt-3.5 mt-3 border-t border-border-soft flex items-center justify-between font-mono">
                <div>
                  <span className="text-xs font-black text-text">Active Warrant</span>
                  <span className="block text-[10px] text-text-dim font-semibold">PCR Unit Alerted</span>
                </div>
                <button
                  onClick={() => navigate('/cctv')}
                  className="px-4 py-1.5 rounded-full bg-surface-2 hover:bg-rose-500 hover:text-white text-text border border-border-soft text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                >
                  Track Suspect
                </button>
              </div>
            </div>

            {/* BIG BOX 4: OPTICAL ANPR & SENSOR TELEMETRY */}
            <div className="rounded-2xl glass bg-surface border border-border-soft p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden">
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shadow-2xs">
                    <Camera className="w-5 h-5" />
                  </div>
                  
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-sm border border-emerald-500/50 bg-emerald-500/10 text-emerald-500 font-mono text-[9px] font-black uppercase tracking-wider -rotate-1 shadow-2xs">
                    SENSOR #12.5K // LIVE
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-dim font-mono">
                    Surveillance Network · Odisha Sector
                  </span>
                  <h3 className="text-base font-black text-text tracking-tight leading-snug">
                    12,500+ ANPR Nodes Active
                  </h3>
                  <div className="flex items-center gap-2 pt-1 font-mono text-[10px]">
                    <span className="px-2 py-0.5 rounded bg-surface-2 text-emerald-500 font-bold border border-border-soft">
                      14 PCR Units
                    </span>
                    <span className="text-emerald-500 font-bold">Optical Sync 99.4%</span>
                  </div>
                </div>
              </div>

              <div className="pt-3.5 mt-3 border-t border-border-soft flex items-center justify-between font-mono">
                <div>
                  <span className="text-xs font-black text-text">Sensor Grid</span>
                  <span className="block text-[10px] text-text-dim font-semibold">Real-Time Streams</span>
                </div>
                <button
                  onClick={() => navigate('/cctv')}
                  className="px-4 py-1.5 rounded-full bg-surface-2 hover:bg-[#2E5FE0] hover:text-white text-text border border-border-soft text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                >
                  View Feed
                </button>
              </div>
            </div>

          </div>

          {/* ACTIVE INVESTIGATIONS TABLE */}
          <ActiveInvestigationsTable
            cases={filteredCases}
            stationOfficers={stationOfficers}
            onAssignCase={(caseObj) => {
              setAssigningCase(caseObj);
              setNewOfficerId(caseObj.investigatorId || stationOfficers[0]?.id || '');
            }}
          />

          {/* CROSS-STATION LINKS D3 NETWORK GRAPH */}
          <CrossStationD3Network cases={filteredCases} />
        </div>

        {/* RIGHT COLUMN (4 COLS): RESOLVED GRAPH + CRIME CATEGORIES DONUT + GIS HOTSPOT MAP + SHORTENED INTEL ALERTS */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* CASES RESOLVED THIS MONTH GRAPH CARD */}
          <div className="rounded-2xl glass bg-surface border border-border-soft p-5 shadow-2xs flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-text-dim font-mono">
                <p className="text-xs font-bold uppercase tracking-wider">
                  {timeFilter === 'Day' ? 'Cases Resolved Today' :
                   timeFilter === 'Week' ? 'Cases Resolved This Week' :
                   timeFilter === 'Year' ? 'Cases Resolved This Year' :
                   'Cases Resolved This Month'}
                </p>
                <span className="flex items-center gap-1 text-[11px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full border border-success/20">
                  <TrendingUp className="w-3 h-3" />
                  +4.2% KPI
                </span>
              </div>
              
              <p className="text-3xl sm:text-4xl font-black text-text tracking-tight font-display">
                {timeFilter === 'Day' ? '92.0%' :
                 timeFilter === 'Week' ? '88.2%' :
                 timeFilter === 'Year' ? '81.4%' :
                 '84.5%'}
                <span className="text-xs sm:text-sm font-semibold text-text-dim ml-1.5 font-mono">
                  / {timeFilter === 'Day' ? '12 Dossiers' :
                     timeFilter === 'Week' ? '48 Dossiers' :
                     timeFilter === 'Year' ? '1,840 Dossiers' :
                     '152 Dossiers'}
                </span>
              </p>

              {/* Time Filter Pills */}
              <div className="flex items-center justify-between p-1 rounded-2xl bg-surface-2 border border-border-soft text-xs font-mono font-semibold">
                {(['Day', 'Week', 'Month', 'Year'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setTimeFilter(tab)}
                    className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer text-center ${
                      timeFilter === tab 
                        ? 'bg-brand text-white font-bold shadow-xs' 
                        : 'text-text-dim hover:text-text'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* SMOOTH CURVED SVG BEZIER SPLINE CHART (COBALT #2E5FE0) */}
              <div className="relative mt-2 h-36 w-full">
                <svg viewBox="0 0 300 110" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2E5FE0" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#2E5FE0" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Baseline Grid lines */}
                  <line x1="0" y1="30" x2="300" y2="30" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" strokeWidth="1" />
                  <line x1="0" y1="70" x2="300" y2="70" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" strokeWidth="1" />

                  <path
                    d={
                      timeFilter === 'Day'
                        ? 'M 0,85 C 40,80 70,65 100,50 C 130,35 160,55 190,30 C 220,15 240,25 260,18 C 280,15 290,22 300,18 L 300,110 L 0,110 Z'
                        : timeFilter === 'Week'
                        ? 'M 0,78 C 30,65 60,80 90,45 C 120,28 150,55 180,35 C 210,16 230,30 250,22 C 275,16 290,30 300,24 L 300,110 L 0,110 Z'
                        : timeFilter === 'Year'
                        ? 'M 0,90 C 40,75 80,62 120,50 C 160,40 200,30 240,20 C 260,15 275,13 300,10 L 300,110 L 0,110 Z'
                        : 'M 0,70 C 20,45 40,85 70,55 C 100,25 120,75 150,50 C 180,24 200,12 230,15 C 250,18 270,75 300,48 L 300,110 L 0,110 Z'
                    }
                    fill="url(#chartGradient)"
                    className="transition-all duration-500"
                  />

                  <path
                    d={
                      timeFilter === 'Day'
                        ? 'M 0,85 C 40,80 70,65 100,50 C 130,35 160,55 190,30 C 220,15 240,25 260,18'
                        : timeFilter === 'Week'
                        ? 'M 0,78 C 30,65 60,80 90,45 C 120,28 150,55 180,35 C 210,16 230,30 250,22 C 275,16 290,30 300,24'
                        : timeFilter === 'Year'
                        ? 'M 0,90 C 40,75 80,62 120,50 C 160,40 200,30 240,20 C 260,15 275,13 300,10'
                        : 'M 0,70 C 20,45 40,85 70,55 C 100,25 120,75 150,50 C 180,24 200,12 230,15 C 250,18 270,75 300,48'
                    }
                    fill="none"
                    stroke="#2E5FE0"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />

                  {/* Peak Highlight Circle */}
                  <circle
                    cx="300"
                    cy={timeFilter === 'Year' ? 10 : timeFilter === 'Day' ? 18 : timeFilter === 'Week' ? 24 : 48}
                    r="4"
                    fill="#2E5FE0"
                    className="animate-pulse"
                  />
                </svg>

                {/* X-Axis Timeline Markers */}
                <div className="flex items-center justify-between text-[10px] font-mono text-text-dim pt-2 border-t border-border-soft">
                  <span>{timeFilter === 'Day' ? '06:00' : timeFilter === 'Week' ? 'Mon' : timeFilter === 'Year' ? 'Q1 2026' : 'Week 1'}</span>
                  <span>{timeFilter === 'Day' ? '12:00' : timeFilter === 'Week' ? 'Wed' : timeFilter === 'Year' ? 'Q2' : 'Week 2'}</span>
                  <span>{timeFilter === 'Day' ? '18:00' : timeFilter === 'Week' ? 'Fri' : timeFilter === 'Year' ? 'Q3' : 'Week 3'}</span>
                  <span className="font-bold text-[#2E5FE0]">{timeFilter === 'Day' ? 'Now' : timeFilter === 'Week' ? 'Sun' : timeFilter === 'Year' ? 'Q4 (Active)' : 'Week 4'}</span>
                </div>
              </div>

              {/* 2-Column Resolution Velocity Stats */}
              <div className="grid grid-cols-2 gap-3 pt-1 font-mono">
                <div className="p-3 rounded-xl bg-surface-2 border border-border-soft flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-text-dim">
                    <Clock className="w-3.5 h-3.5 text-[#2E5FE0]" />
                    <span>Avg. Resolution</span>
                  </div>
                  <p className="text-base font-extrabold text-text mt-1">
                    {timeFilter === 'Day' ? '3.8 hrs' : timeFilter === 'Week' ? '4.2 hrs' : timeFilter === 'Year' ? '5.1 days' : '4.6 hrs'}
                  </p>
                  <span className="text-[10px] text-success font-semibold">
                    ↓ 18% faster
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-surface-2 border border-border-soft flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-text-dim">
                    <Shield className="w-3.5 h-3.5 text-success" />
                    <span>Chargesheet Rate</span>
                  </div>
                  <p className="text-base font-extrabold text-text mt-1">
                    {timeFilter === 'Day' ? '96.2%' : timeFilter === 'Week' ? '91.8%' : timeFilter === 'Year' ? '89.6%' : '90.4%'}
                  </p>
                  <span className="text-[10px] text-text-dim font-semibold">
                    Benchmark Met
                  </span>
                </div>
              </div>
            </div>

            {/* BOTTOM TARGET CARD */}
            <div className="p-4 rounded-xl bg-[#0F172A] text-white flex items-center justify-between shadow-xs border border-slate-800 font-mono">
              <div>
                <div className="flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-blue-400" />
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">FIELD OPS // PLAN 2026</p>
                </div>
                <p className="text-xs font-black text-white mt-0.5 uppercase tracking-wide">Clearance Target</p>
              </div>

              <div className="relative w-12 h-12 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-800"
                    strokeWidth="4"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-[#2E5FE0]"
                    strokeDasharray={`${
                      timeFilter === 'Day' ? 92 :
                      timeFilter === 'Week' ? 88 :
                      timeFilter === 'Year' ? 81 :
                      75
                    }, 100`}
                    strokeWidth="4"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-[10px] font-black text-white">
                  {timeFilter === 'Day' ? '92%' :
                   timeFilter === 'Week' ? '88%' :
                   timeFilter === 'Year' ? '81%' :
                   '75%'}
                </span>
              </div>
            </div>
          </div>

          {/* CRIME CATEGORY DONUT CHART */}
          <CrimeCategoryDonutChart cases={filteredCases} />

          {/* CRIME HOTSPOTS GIS MAP */}
          <CrimeHotspotGisMap />

          {/* SHORTENED INTELLIGENCE ALERTS FEED */}
          <IntelligenceAlertsFeed />

        </div>

      </div>

      {/* ── 4. DRISHTI SOURCE: RECENT INCIDENTS & CASE ARCHIVE TABLE ── */}
      <div className="rounded-3xl glass bg-surface border border-border-soft p-6 sm:p-8 shadow-xs">
        
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-soft">
          <div>
            <h2 className="text-lg font-extrabold text-text tracking-tight font-display">
              Recent Incidents & Case Archive
            </h2>
            <p className="text-xs text-text-dim mt-0.5">Live First Information Reports recorded across Odisha State Police</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-full text-xs font-semibold font-mono">
              {['all', 'open', 'under_investigation', 'closed'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveIncidentTab(tab)}
                  className={`px-3.5 py-1 rounded-full transition-all cursor-pointer capitalize ${
                    activeIncidentTab === tab
                      ? 'bg-brand text-white shadow-xs font-bold'
                      : 'text-text-dim hover:text-text'
                  }`}
                >
                  {tab.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table Column Header */}
        <div className="hidden sm:grid grid-cols-12 items-center px-4 py-2.5 text-[11px] font-mono font-semibold uppercase tracking-wider text-text-dim border-b border-border-soft gap-4">
          <div className="col-span-6">Case & Incident</div>
          <div className="col-span-3">Date Filed</div>
          <div className="col-span-3 text-right pr-9">Status / Case ID</div>
        </div>

        {/* List Rows */}
        <div className="divide-y divide-border-soft/60">
          {filteredIncidentFIRs.map((fir, idx) => {
            const rawType = fir.crime_type.toLowerCase();
            const CrimeIcon = CRIME_ICONS[rawType] || FileText;
            const title = CRIME_NAMES[rawType] || fir.crime_type;

            return (
              <div
                key={idx}
                onClick={() => setSelectedFIR(fir)}
                className="group grid grid-cols-12 items-center py-3.5 px-3 hover:bg-surface-hover rounded-2xl transition-colors cursor-pointer gap-4"
              >
                {/* Left: Squircle Icon + Title */}
                <div className="col-span-12 sm:col-span-6 flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-surface-2 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform text-text">
                    <CrimeIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-text truncate">
                        {title}
                      </p>
                      {fir.priority === 'CRITICAL' && (
                        <span className="text-[9px] font-extrabold uppercase bg-rose-500 text-white px-2 py-0.5 rounded-full inline-flex items-center gap-1 font-mono shadow-2xs">
                          <Sparkles className="w-2.5 h-2.5" /> High Priority
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-dim truncate">
                      {fir.police_station} · IO: {fir.investigation_office}
                    </p>
                  </div>
                </div>

                {/* Middle: Date */}
                <div className="hidden sm:flex sm:col-span-3 items-center text-xs font-mono font-medium text-text-dim">
                  {fmtDate(fir.date_filed)}
                </div>

                {/* Right: Case Number & Status */}
                <div className="col-span-12 sm:col-span-3 flex items-center justify-end gap-3 font-mono">
                  <div className="text-right">
                    <p className="text-xs font-bold text-text">
                      {fir.case_number}
                    </p>
                    <p className={`text-[10px] font-bold capitalize ${
                      fir.status === 'open' ? 'text-rose-500' : fir.status === 'closed' ? 'text-emerald-500' : 'text-amber-500'
                    }`}>
                      {fir.status.replace('_', ' ')}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFIR(fir);
                    }}
                    className="px-2.5 py-1 text-xs font-semibold text-brand hover:bg-brand/10 rounded-lg flex items-center gap-1"
                  >
                    <span>View Dossier</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Controls */}
        <div className="pt-4 mt-2 border-t border-border-soft flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-dim font-mono">
          <span>Showing <strong className="text-text font-bold">{filteredIncidentFIRs.length}</strong> active cases</span>

          <Link
            to="/cases"
            className="font-bold text-brand hover:underline flex items-center gap-1"
          >
            View Full FIR Registry
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>

      {/* Case Quick Dossier Drawer Modal */}
      {selectedFIR && (
        <div
          onClick={() => setSelectedFIR(null)}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-[99999] flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-border-soft space-y-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border-soft">
              <div>
                <span className="text-[10px] font-mono font-bold text-rose-500 uppercase">CASE DOSSIER DETAILS</span>
                <h3 className="text-lg font-bold text-text font-mono">{selectedFIR.case_number}</h3>
              </div>
              <button
                onClick={() => setSelectedFIR(null)}
                className="p-1.5 rounded-xl bg-surface-2 text-text-dim hover:text-text"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-text-dim font-mono text-[10px] uppercase">Incident Type</span>
                <p className="font-bold text-text text-sm">{selectedFIR.crime_type.toUpperCase()}</p>
              </div>
              <div>
                <span className="text-text-dim font-mono text-[10px] uppercase">Police Station</span>
                <p className="font-semibold text-text">{selectedFIR.police_station}</p>
              </div>
              <div>
                <span className="text-text-dim font-mono text-[10px] uppercase">Investigating Officer</span>
                <p className="font-semibold text-text">{selectedFIR.investigation_office}</p>
              </div>
              <div>
                <span className="text-text-dim font-mono text-[10px] uppercase">Synopsis</span>
                <p className="text-text-dim leading-relaxed font-medium bg-surface-2 p-3 rounded-xl border border-border-soft mt-1">
                  {selectedFIR.description}
                </p>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => {
                  setSelectedFIR(null);
                  navigate('/workspace/CASE-2026-541');
                }}
                className="flex-1 py-2.5 rounded-xl bg-brand text-white text-xs font-bold hover:bg-brand-bright transition-colors shadow-xs font-mono"
              >
                Open Full Case Workspace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODALS ── */}

      {/* Add Officer Modal */}
      {showAddOfficerModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-[99999] flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl p-6 max-w-md w-full border border-border-soft space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-text font-mono">Deploy New Officer to Station</h3>
            <form onSubmit={handleAddOfficerSubmit} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-[10px] text-text-dim uppercase font-bold mb-1">Officer Name</label>
                <input
                  type="text"
                  required
                  value={newOfficerName}
                  onChange={(e) => setNewOfficerName(e.target.value)}
                  placeholder="e.g., SI Debashish Swain"
                  className="w-full p-2.5 rounded-xl bg-surface-2 border border-border text-text outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-[10px] text-text-dim uppercase font-bold mb-1">Rank</label>
                <select
                  value={newOfficerRank}
                  onChange={(e) => setNewOfficerRank(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-surface-2 border border-border text-text outline-none"
                >
                  <option value="Inspector">Inspector (IIC)</option>
                  <option value="Sub-Inspector">Sub-Inspector (SI)</option>
                  <option value="Assistant Sub-Inspector">Assistant Sub-Inspector (ASI)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-text-dim uppercase font-bold mb-1">Role</label>
                <select
                  value={newOfficerRole}
                  onChange={(e) => setNewOfficerRole(e.target.value as 'OFFICER' | 'STATION_ADMIN')}
                  className="w-full p-2.5 rounded-xl bg-surface-2 border border-border text-text outline-none"
                >
                  <option value="OFFICER">Investigating Officer (IO)</option>
                  <option value="STATION_ADMIN">Station Administrator</option>
                </select>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddOfficerModal(false)}
                  className="flex-1 py-2 rounded-xl bg-surface-2 border border-border text-text-dim font-bold hover:text-text"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-brand text-bg font-bold hover:bg-brand-bright"
                >
                  Confirm Deploy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reassign Case Modal */}
      {assigningCase && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-[99999] flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl p-6 max-w-md w-full border border-border-soft space-y-4 shadow-2xl font-mono text-xs">
            <h3 className="text-base font-bold text-text">Reassign Case {String(assigningCase.id)}</h3>
            <p className="text-text-dim">Select an available officer from {myStation?.name} to take lead IO responsibility:</p>

            <select
              value={newOfficerId}
              onChange={(e) => setNewOfficerId(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-surface-2 border border-border text-text outline-none"
            >
              {stationOfficers.map(off => (
                <option key={off.id} value={off.id}>{off.name} ({off.rank || 'Officer'})</option>
              ))}
            </select>

            <div className="pt-3 flex gap-2">
              <button
                onClick={() => setAssigningCase(null)}
                className="flex-1 py-2 rounded-xl bg-surface-2 border border-border text-text-dim font-bold hover:text-text"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReassign}
                className="flex-1 py-2 rounded-xl bg-brand text-bg font-bold hover:bg-brand-bright"
              >
                Confirm Reassign
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
