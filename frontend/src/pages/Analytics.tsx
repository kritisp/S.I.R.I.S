import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, MapPin, 
  RefreshCw, Clock,
  ArrowUpRight,
  Terminal, Car, ShieldAlert, Home, Crosshair, Flame, 
  FlaskConical, Briefcase, Scale, Radar,
  Layers, Database, ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

// ── Static fallback mock data ─────────────────────────────────────────────
const MOCK_MONTHLY_DATA = [
  { month: 'Aug 2025', crimes: 312, resolved: 220 },
  { month: 'Sep 2025', crimes: 298, resolved: 215 },
  { month: 'Oct 2025', crimes: 341, resolved: 245 },
  { month: 'Nov 2025', crimes: 289, resolved: 210 },
  { month: 'Dec 2025', crimes: 267, resolved: 195 },
  { month: 'Jan 2026', crimes: 301, resolved: 230 },
  { month: 'Feb 2026', crimes: 318, resolved: 240 },
  { month: 'Mar 2026', crimes: 356, resolved: 270 },
  { month: 'Apr 2026', crimes: 334, resolved: 250 },
  { month: 'May 2026', crimes: 342, resolved: 260 },
  { month: 'Jun 2026', crimes: 365, resolved: 280 },
  { month: 'Jul 2026', crimes: 322, resolved: 248 },
];

const MOCK_DISTRICT_DATA = [
  { district: 'Bhubaneswar Urban', count: 102, share: '34%', rate: 'Critical', color: '#DC2626' },
  { district: 'Cuttack District',  count: 24,  share: '8%',  rate: 'Elevated', color: '#EA580C' },
  { district: 'Puri District',     count: 20,  share: '7%',  rate: 'Moderate', color: '#D97706' },
  { district: 'Sambalpur',         count: 18,  share: '6%',  rate: 'Moderate', color: '#2563EB' },
  { district: 'Rourkela',          count: 18,  share: '6%',  rate: 'Moderate', color: '#059669' },
  { district: 'Berhampur',         count: 15,  share: '5%',  rate: 'Normal',   color: '#475569' },
];

const MOCK_CRIME_TYPES = [
  { type: 'Cyber & Online Fraud', key: 'cyber', icon: Terminal, count: 68, pct: 23, severity: 'High', color: 'bg-indigo-500', textCol: 'text-indigo-400' },
  { type: 'Vehicle Theft',        key: 'vehicle', icon: Car, count: 57, pct: 19, severity: 'High', color: 'bg-blue-500',   textCol: 'text-blue-400' },
  { type: 'Robbery & Dacoity',    key: 'robbery', icon: ShieldAlert, count: 46, pct: 15, severity: 'Critical', color: 'bg-red-500', textCol: 'text-red-400' },
  { type: 'House Burglary',       key: 'burglary', icon: Home, count: 38, pct: 13, severity: 'Medium', color: 'bg-amber-500', textCol: 'text-amber-400' },
  { type: 'Chain Snatching',      key: 'snatching', icon: Crosshair, count: 32, pct: 11, severity: 'Medium', color: 'bg-orange-500', textCol: 'text-orange-400' },
  { type: 'Physical Assault',     key: 'assault', icon: Flame, count: 24, pct: 8,  severity: 'Medium', color: 'bg-rose-500',  textCol: 'text-rose-400' },
  { type: 'Narcotics / NDPS',     key: 'narcotics', icon: FlaskConical, count: 18, pct: 6,  severity: 'Critical', color: 'bg-purple-500', textCol: 'text-purple-400' },
  { type: 'Extortion / Threats',  key: 'extortion', icon: Briefcase, count: 15, pct: 5,  severity: 'Low', color: 'bg-emerald-500', textCol: 'text-emerald-400' },
];

const MOCK_DARK_ZONES_FALLBACK = [
  { district: 'Sambalpur', rate: 18.2, expected: 45.1, score: 75, deficit: '60%', reason: 'Beat policing gap identified along industrial transit belt', risk: 'Critical Deficit' },
  { district: 'Balasore',   rate: 21.4, expected: 45.1, score: 68, deficit: '53%', reason: 'Interstate border jurisdiction friction & low digital registration', risk: 'High Deficit' },
  { district: 'Koraput',   rate: 23.7, expected: 45.1, score: 55, deficit: '47%', reason: 'Station connectivity lags in outer agency outposts', risk: 'Moderate Gap' },
  { district: 'Kendrapara', rate: 26.8, expected: 45.1, score: 48, deficit: '41%', reason: 'Low public awareness of e-FIR kiosk portal', risk: 'Moderate Gap' },
];

// Tactical Chart Tooltip
const TacticalTooltip = ({ active, payload, label }: { active?: boolean; payload?: unknown[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-2 dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl px-3.5 py-2.5 shadow-2xl text-xs text-text dark:text-[#F8FAFC]">
        <p className="text-[11px] font-mono uppercase tracking-wider text-text-dim dark:text-[#94A3B8] font-semibold mb-1 pb-1 border-b border-border-soft dark:border-[#1E293B]">
          {label}
        </p>
        <div className="space-y-1">
          {(payload as Array<{ name: string; value: number; color?: string }>).map((p, i) => (
            <div key={i} className="flex items-center justify-between gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-text-dim dark:text-[#94A3B8]">
                <span className="w-2 h-2 rounded-full" style={{ background: p.color || '#38BDF8' }} />
                <span>{p.name}:</span>
              </span>
              <span className="font-mono font-bold text-text dark:text-[#F8FAFC]">
                {Number(p.value).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

function LiveCounter(baseValue: number, intervalMs = 10000) {
  const [value, setValue] = useState(baseValue);
  useEffect(() => {
    const id = setInterval(() => {
      const choices = [-2, -1, 0, 1, 2];
      const delta = choices[Math.floor(Math.random() * choices.length)];
      setValue(prev => Math.max(1, prev + delta));
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return value;
}

export function Analytics() {
  const [trendData, setTrendData] = useState(MOCK_MONTHLY_DATA);
  const [districtData] = useState(MOCK_DISTRICT_DATA);
  const [crimeTypes] = useState(MOCK_CRIME_TYPES);
  const [darkZones] = useState(MOCK_DARK_ZONES_FALLBACK);

  // Live fluctuating counters
  const liveTotalFIRs = LiveCounter(2445, 4, 10000);
  const livePeakIncidents = LiveCounter(365, 3, 10000);
  const liveClearanceRate = LiveCounter(74, 1, 12000);

  // Dynamic Chart Updates every 8s
  useEffect(() => {
    const interval = setInterval(() => {
      setTrendData(prev => {
        if (!prev || prev.length === 0) return prev;
        return prev.map((item, idx) => {
          if (idx >= prev.length - 3) {
            const shift = Math.floor(Math.random() * 5) - 2;
            return { ...item, crimes: Math.max(100, item.crimes + shift) };
          }
          return item;
        });
      });
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(new Date());
  const [monthsBack, setMonthsBack] = useState(12);

  const fetchAnalyticsData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setTimeout(() => {
      setLastUpdated(new Date());
      setLoading(false);
      setRefreshing(false);
    }, 500);
  }, []);

  const formatTime = (d: Date | null) => d
    ? d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
    : null;

  return (
    <div className="max-w-[1520px] mx-auto space-y-4 font-sans select-none text-text dark:text-[#F8FAFC] pb-24">

      {/* ── 1. POLICE COMMAND HEADER & TELEMETRY HUB ── */}
      <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-3.5 sm:p-4 shadow-xs dark:shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-2 dark:bg-[#0E1422] border border-accent/40 dark:border-[#38BDF8]/40 flex items-center justify-center text-accent dark:text-[#38BDF8] shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-text dark:text-[#F8FAFC] uppercase">
                  CRIME INTELLIGENCE & TELEMETRY
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-accent/15 dark:bg-[#38BDF8]/15 border border-accent/30 dark:border-[#38BDF8]/30 text-accent dark:text-[#38BDF8]">
                  STATEWIDE CCTNS
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE TELEMETRY
                </span>
              </div>
              <p className="text-xs text-text-dim dark:text-[#94A3B8] font-mono mt-0.5">
                State Crime Record Bureau (SCRB) • Multi-Jurisdictional Statistical Aggregation Engine
              </p>
            </div>
          </div>

          {/* Tactical Controls & Status */}
          <div className="flex items-center gap-2 flex-wrap font-mono">
            {lastUpdated && (
              <span className="text-[11px] text-text-dim dark:text-[#94A3B8] flex items-center gap-1.5 bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] px-2.5 py-1.5 rounded-lg">
                <Clock className="w-3.5 h-3.5 text-accent dark:text-[#38BDF8]" />
                <span>UPDATED: {formatTime(lastUpdated)}</span>
              </span>
            )}

            <button
              onClick={() => fetchAnalyticsData(true)}
              disabled={refreshing || loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] hover:border-accent/40 dark:hover:border-[#38BDF8]/40 text-xs font-mono font-bold text-accent dark:text-[#38BDF8] transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-accent dark:text-[#38BDF8]' : ''}`} />
              <span>{refreshing ? 'SYNCING…' : 'REFRESH'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. EXECUTIVE POLICE KPI CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
        {/* KPI 1: Total FIRs */}
        <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-3.5 shadow-xs hover:border-accent/40 dark:hover:border-[#38BDF8]/40 transition-all">
          <div className="flex items-center justify-between text-xs text-text-dim dark:text-[#94A3B8] mb-1.5">
            <span className="uppercase tracking-wider font-semibold text-[11px]">Total Registered FIRs</span>
            <div className="w-6 h-6 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-accent/20 dark:border-[#38BDF8]/20 flex items-center justify-center text-accent dark:text-[#38BDF8]">
              <Database className="w-3 h-3" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-text dark:text-[#F8FAFC]">
              {liveTotalFIRs.toLocaleString()}
            </span>
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-400">
              <TrendingUp className="w-3 h-3" /> +8.0%
            </span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-border-soft dark:border-[#1E293B] flex items-center justify-between text-[10px] text-text-dim dark:text-[#94A3B8]">
            <span>Statewide Repository</span>
            <span className="text-accent dark:text-[#38BDF8] font-bold">CCTNS v4.2</span>
          </div>
        </div>

        {/* KPI 2: High Risk Peak Index */}
        <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-3.5 shadow-xs hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between text-xs text-text-dim dark:text-[#94A3B8] mb-1.5">
            <span className="uppercase tracking-wider font-semibold text-[11px]">Peak Month Volume</span>
            <div className="w-6 h-6 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Flame className="w-3 h-3" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-amber-400">
              {livePeakIncidents.toLocaleString()}
            </span>
            <span className="text-xs text-text-dim dark:text-[#94A3B8]">Incidents</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-border-soft dark:border-[#1E293B] flex items-center justify-between text-[10px] text-text-dim dark:text-[#94A3B8]">
            <span>Peak Incident Period</span>
            <span className="text-amber-400 font-bold">Summer Surge</span>
          </div>
        </div>

        {/* KPI 3: Clearance Velocity */}
        <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-3.5 shadow-xs hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between text-xs text-text-dim dark:text-[#94A3B8] mb-1.5">
            <span className="uppercase tracking-wider font-semibold text-[11px]">Case Disposal Rate</span>
            <div className="w-6 h-6 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Scale className="w-3 h-3" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-emerald-400">
              {liveClearanceRate}%
            </span>
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-400">
              <TrendingUp className="w-3 h-3" /> +3.4%
            </span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-border-soft dark:border-[#1E293B] flex items-center justify-between text-[10px] text-text-dim dark:text-[#94A3B8]">
            <span>Resolution Velocity</span>
            <span className="text-emerald-400 font-bold">OPTIMAL</span>
          </div>
        </div>

        {/* KPI 4: Under-reporting Dark Zones */}
        <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-3.5 shadow-xs hover:border-rose-500/40 transition-all">
          <div className="flex items-center justify-between text-xs text-text-dim dark:text-[#94A3B8] mb-1.5">
            <span className="uppercase tracking-wider font-semibold text-[11px]">Dark Zones Flagged</span>
            <div className="w-6 h-6 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Radar className="w-3 h-3" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-rose-400">
              {darkZones.length}
            </span>
            <span className="text-xs text-rose-400 font-semibold">Districts</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-border-soft dark:border-[#1E293B] flex items-center justify-between text-[10px] text-text-dim dark:text-[#94A3B8]">
            <span>Reporting Deficit</span>
            <span className="text-rose-400 font-bold">&gt;40% Below Avg</span>
          </div>
        </div>
      </div>

      {/* ── 3. CHARTS GRID (ROW 1: CRIME TREND AREA CHART & DISTRICT HOTSPOTS) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Monthly Crime Trend (Area Chart) - 7 Cols */}
        <div className="lg:col-span-7 bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-soft dark:border-[#1E293B]">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-text dark:text-[#F8FAFC] font-mono uppercase tracking-wider">
                Monthly Incident Trajectory
              </h3>
              <p className="text-[11px] text-text-dim dark:text-[#94A3B8] font-mono">
                Registered FIR dockets vs. Resolved cases (MoM Telemetry)
              </p>
            </div>

            {/* Time Selector Buttons */}
            <div className="flex bg-surface-2 dark:bg-[#0E1422] p-1 rounded-lg border border-border-soft dark:border-[#1E293B] self-start sm:self-auto font-mono">
              {[
                { label: '3M', val: 3 },
                { label: '6M', val: 6 },
                { label: '12M', val: 12 },
                { label: 'All Time', val: 999 },
              ].map(b => (
                <button
                  key={b.label}
                  onClick={() => setMonthsBack(b.val)}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold transition-all cursor-pointer ${
                    monthsBack === b.val
                      ? 'bg-accent/20 dark:bg-[#38BDF8]/20 text-accent dark:text-[#38BDF8] border border-accent/40 dark:border-[#38BDF8]/40'
                      : 'text-text-dim dark:text-[#94A3B8] hover:text-text dark:hover:text-[#F8FAFC]'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="crimeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#38BDF8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                <Tooltip content={<TacticalTooltip />} />
                <Area type="monotone" dataKey="crimes" stroke="#38BDF8" strokeWidth={2} fillOpacity={1} fill="url(#crimeGrad)" name="Registered FIRs" />
                <Area type="monotone" dataKey="resolved" stroke="#10B981" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#resolvedGrad)" name="Cleared Cases" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Crime Districts (Horizontal Bar Chart) - 5 Cols */}
        <div className="lg:col-span-5 bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-border-soft dark:border-[#1E293B]">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-text dark:text-[#F8FAFC] font-mono uppercase tracking-wider">
                Jurisdiction Volume
              </h3>
              <p className="text-[11px] text-text-dim dark:text-[#94A3B8] font-mono">
                Top high-density district commands
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-accent dark:text-[#38BDF8] font-bold">
              TOP 6
            </span>
          </div>

          <div className="pt-4 h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districtData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="district" type="category" tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} width={115} />
                <Tooltip content={<TacticalTooltip />} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Active FIRs">
                  {districtData.map((d, i) => (
                    <Cell key={i} fill={d.color || '#38BDF8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ── 4. SECOND ROW: CRIME CATEGORIES & UNDERREPORTING ANOMALIES ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Crime Type Breakdown (7 Cols) */}
        <div className="lg:col-span-7 bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-border-soft dark:border-[#1E293B] mb-3">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-text dark:text-[#F8FAFC] font-mono uppercase tracking-wider">
                Crime Classification Matrix
              </h3>
              <p className="text-[11px] text-text-dim dark:text-[#94A3B8] font-mono">
                Statutory categories across active CCTNS records
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent/10 dark:bg-[#38BDF8]/10 text-accent dark:text-[#38BDF8] border border-accent/20 dark:border-[#38BDF8]/20 font-bold">
              300 FIR BATCH
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {crimeTypes.map((c) => {
              const IconComponent = c.icon || Layers;
              return (
                <div 
                  key={c.type}
                  className="p-2.5 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] hover:border-accent/40 dark:hover:border-[#38BDF8]/40 transition-all flex flex-col justify-between gap-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded bg-surface dark:bg-[#070A0F] border border-border-soft dark:border-[#1E293B] flex items-center justify-center shrink-0">
                        <IconComponent className={`w-3 h-3 ${c.textCol}`} />
                      </div>
                      <span className="text-xs font-bold text-text dark:text-[#F8FAFC] truncate">
                        {c.type}
                      </span>
                    </div>
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      c.severity === 'Critical' 
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                        : c.severity === 'High' 
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-surface dark:bg-[#070A0F] text-text-dim dark:text-[#94A3B8] border border-border-soft dark:border-[#1E293B]'
                    }`}>
                      {c.severity}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="w-full h-1 bg-surface dark:bg-[#070A0F] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${c.color} rounded-full transition-all duration-700`}
                        style={{ width: `${Math.max(c.pct, 5)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-text-dim dark:text-[#94A3B8]">
                      <span>{c.count} Cases</span>
                      <span className="font-bold text-text dark:text-[#F8FAFC]">{c.pct}% Share</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Under-Reporting Dark Zones (5 Cols) */}
        <div className="lg:col-span-5 bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border-soft dark:border-[#1E293B] mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Radar className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-text dark:text-[#F8FAFC] font-mono uppercase tracking-wider">
                    Under-Reporting Dark Zones
                  </h3>
                  <p className="text-[11px] text-text-dim dark:text-[#94A3B8] font-mono">
                    Districts with &gt;40% deficit below statewide baseline
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {darkZones.map((z, idx) => (
                <div 
                  key={z.district || idx}
                  className="p-2.5 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-amber-500/20 hover:border-amber-500/40 transition-all flex items-start justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                      <span className="text-xs font-bold text-text dark:text-[#F8FAFC] font-mono">
                        {z.district} District
                      </span>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {z.deficit} DEFICIT
                      </span>
                    </div>
                    <p className="text-[10px] text-text-dim dark:text-[#94A3B8] mt-1 leading-snug">
                      {z.reason}
                    </p>
                  </div>

                  <div className="text-right shrink-0 font-mono">
                    <p className="text-xs font-bold text-amber-400">
                      {z.rate} <span className="text-[10px] opacity-75">FIRs/L</span>
                    </p>
                    <p className="text-[10px] text-text-dim dark:text-[#94A3B8]">
                      Exp: {z.expected}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-border-soft dark:border-[#1E293B] flex items-center justify-between text-[11px] text-text-dim dark:text-[#94A3B8] font-mono">
            <span>Recommended: Deploy Digital e-FIR Kiosks</span>
            <Link
              to="/gis-map"
              className="text-accent dark:text-[#38BDF8] font-semibold hover:underline flex items-center gap-1"
            >
              <span>View Map</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
