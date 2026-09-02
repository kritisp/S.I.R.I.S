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
      <div className="bg-surface-2 border border-border-soft rounded-xl px-3.5 py-2.5 shadow-2xl text-xs text-text">
        <p className="text-[11px] font-mono uppercase tracking-wider text-text-dim font-semibold mb-1 pb-1 border-b border-border-soft font-mono">
          {label}
        </p>
        <div className="space-y-1">
          {(payload as Array<{ name: string; value: number; color?: string }>).map((p, i) => (
            <div key={i} className="flex items-center justify-between gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-text-dim">
                <span className="w-2 h-2 rounded-full" style={{ background: p.color || '#3B82F6' }} />
                <span>{p.name}:</span>
              </span>
              <span className="font-mono font-bold text-text">
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
    <div className="p-4 sm:p-7 space-y-6 max-w-7xl mx-auto animate-fade-in font-sans pb-24">

      {/* ── 1. POLICE COMMAND HEADER & TELEMETRY HUB ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-border-soft">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand to-brand-hover flex items-center justify-center text-white shadow-md shadow-brand/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text font-mono uppercase">
                CRIME INTELLIGENCE & TELEMETRY
              </h1>
              <p className="text-xs text-text-dim font-medium">
                Odisha State Police CCTNS • State Crime Record Bureau (SCRB)
              </p>
            </div>
          </div>
        </div>

        {/* Tactical Controls & Status */}
        <div className="flex items-center gap-2.5 flex-wrap font-mono">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-success/10 border border-success/20 text-success text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-success animate-ping" />
            <span>GRID SYNCHRONIZED</span>
          </div>

          {lastUpdated && (
            <span className="text-xs text-text-dim flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTime(lastUpdated)}</span>
            </span>
          )}

          <button
            onClick={() => fetchAnalyticsData(true)}
            disabled={refreshing || loading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-surface border border-border-soft hover:border-brand/40 text-xs font-semibold text-text transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-brand' : ''}`} />
            <span>{refreshing ? 'Syncing…' : 'Refresh Telemetry'}</span>
          </button>
        </div>
      </div>

      {/* ── 2. EXECUTIVE POLICE KPI CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        {/* KPI 1: Total FIRs */}
        <div className="p-4 sm:p-5 rounded-2xl glass border border-border-soft hover:border-brand/40 transition-all group">
          <div className="flex items-center justify-between text-xs text-text-dim mb-2">
            <span className="uppercase tracking-wider font-semibold">Total Registered FIRs</span>
            <div className="w-7 h-7 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
              <Database className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-text">
              {liveTotalFIRs.toLocaleString()}
            </span>
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-success">
              <TrendingUp className="w-3 h-3" /> +8.0%
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-border-soft flex items-center justify-between text-[11px] text-text-dim">
            <span>Statewide Repository</span>
            <span className="text-brand font-medium">CCTNS v4.2</span>
          </div>
        </div>

        {/* KPI 2: High Risk Peak Index */}
        <div className="p-4 sm:p-5 rounded-2xl glass border border-border-soft hover:border-warning/40 transition-all group">
          <div className="flex items-center justify-between text-xs text-text-dim mb-2">
            <span className="uppercase tracking-wider font-semibold">Peak Month Volume</span>
            <div className="w-7 h-7 rounded-lg bg-warning/10 border border-warning/20 flex items-center justify-center text-warning">
              <Flame className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-warning">
              {livePeakIncidents.toLocaleString()}
            </span>
            <span className="text-xs text-text-dim">Incidents</span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-border-soft flex items-center justify-between text-[11px] text-text-dim">
            <span>Peak Incident Period</span>
            <span className="text-warning font-semibold">Summer Surge</span>
          </div>
        </div>

        {/* KPI 3: Clearance Velocity */}
        <div className="p-4 sm:p-5 rounded-2xl glass border border-border-soft hover:border-success/40 transition-all group">
          <div className="flex items-center justify-between text-xs text-text-dim mb-2">
            <span className="uppercase tracking-wider font-semibold">Case Disposal Rate</span>
            <div className="w-7 h-7 rounded-lg bg-success/10 border border-success/20 flex items-center justify-center text-success">
              <Scale className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-success">
              {liveClearanceRate}%
            </span>
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-success">
              <TrendingUp className="w-3 h-3" /> +3.4%
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-border-soft flex items-center justify-between text-[11px] text-text-dim">
            <span>Resolution Velocity</span>
            <span className="text-success font-semibold">Optimal</span>
          </div>
        </div>

        {/* KPI 4: Under-reporting Dark Zones */}
        <div className="p-4 sm:p-5 rounded-2xl glass border border-border-soft hover:border-error/40 transition-all group">
          <div className="flex items-center justify-between text-xs text-text-dim mb-2">
            <span className="uppercase tracking-wider font-semibold">Dark Zones Flagged</span>
            <div className="w-7 h-7 rounded-lg bg-error/10 border border-error/20 flex items-center justify-center text-error">
              <Radar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-error">
              {darkZones.length}
            </span>
            <span className="text-xs text-error font-semibold">Districts</span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-border-soft flex items-center justify-between text-[11px] text-text-dim">
            <span>Reporting Deficit</span>
            <span className="text-error font-semibold">&gt;40% Below Avg</span>
          </div>
        </div>
      </div>

      {/* ── 3. CHARTS GRID (ROW 1: CRIME TREND AREA CHART & DISTRICT HOTSPOTS) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Monthly Crime Trend (Area Chart) - 7 Cols */}
        <div className="lg:col-span-7 rounded-2xl glass border border-border-soft shadow-xs p-5 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border-soft">
            <div>
              <h3 className="text-sm font-bold text-text font-mono uppercase tracking-wider">
                Monthly Incident Trajectory
              </h3>
              <p className="text-xs text-text-dim">
                Registered FIR dockets vs. Resolved cases (MoM Telemetry)
              </p>
            </div>

            {/* Time Selector Buttons */}
            <div className="flex bg-surface-2 p-1 rounded-xl border border-border-soft self-start sm:self-auto font-mono">
              {[
                { label: '3M', val: 3 },
                { label: '6M', val: 6 },
                { label: '12M', val: 12 },
                { label: 'All Time', val: 999 },
              ].map(b => (
                <button
                  key={b.label}
                  onClick={() => setMonthsBack(b.val)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    monthsBack === b.val
                      ? 'bg-brand text-white shadow-xs'
                      : 'text-text-dim hover:text-text'
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
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 11, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748B', fontSize: 11, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                <Tooltip content={<TacticalTooltip />} />
                <Area type="monotone" dataKey="crimes" stroke="#3B82F6" strokeWidth={2.5} fillOpacity={1} fill="url(#crimeGrad)" name="Registered FIRs" />
                <Area type="monotone" dataKey="resolved" stroke="#10B981" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#resolvedGrad)" name="Cleared Cases" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Crime Districts (Horizontal Bar Chart) - 5 Cols */}
        <div className="lg:col-span-5 rounded-2xl glass border border-border-soft shadow-xs p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-border-soft">
            <div>
              <h3 className="text-sm font-bold text-text font-mono uppercase tracking-wider">
                Jurisdiction Volume
              </h3>
              <p className="text-xs text-text-dim">
                Top high-density district commands
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-2 text-text-dim font-semibold">
              TOP 6
            </span>
          </div>

          <div className="pt-4 h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districtData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748B', fontSize: 11, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="district" type="category" tick={{ fill: '#64748B', fontSize: 11, fontFamily: 'monospace' }} axisLine={false} tickLine={false} width={115} />
                <Tooltip content={<TacticalTooltip />} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} name="Active FIRs">
                  {districtData.map((d, i) => (
                    <Cell key={i} fill={d.color || '#3B82F6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ── 4. SECOND ROW: CRIME CATEGORIES & UNDERREPORTING ANOMALIES ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Crime Type Breakdown (7 Cols) */}
        <div className="lg:col-span-7 rounded-2xl glass border border-border-soft shadow-xs p-5">
          <div className="flex items-center justify-between pb-4 border-b border-border-soft mb-4">
            <div>
              <h3 className="text-sm font-bold text-text font-mono uppercase tracking-wider">
                Crime Classification Matrix
              </h3>
              <p className="text-xs text-text-dim">
                Statutory categories across active CCTNS records
              </p>
            </div>
            <span className="text-[11px] font-mono text-brand font-bold">
              300 FIR Batch
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {crimeTypes.map((c) => {
              const IconComponent = c.icon || Layers;
              return (
                <div 
                  key={c.type}
                  className="p-3 rounded-xl bg-surface border border-border-soft hover:border-brand/40 transition-all flex flex-col justify-between gap-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-surface-2 border border-border-soft flex items-center justify-center shrink-0 shadow-2xs">
                        <IconComponent className={`w-3.5 h-3.5 ${c.textCol}`} />
                      </div>
                      <span className="text-xs font-bold text-text truncate">
                        {c.type}
                      </span>
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      c.severity === 'Critical' 
                        ? 'bg-error/10 text-error border border-error/20' 
                        : c.severity === 'High' 
                          ? 'bg-warning/10 text-warning border border-warning/20'
                          : 'bg-surface-2 text-text-dim'
                    }`}>
                      {c.severity}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="w-full h-1.5 bg-surface-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${c.color} rounded-full transition-all duration-700`}
                        style={{ width: `${Math.max(c.pct, 5)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-text-dim">
                      <span>{c.count} Cases</span>
                      <span className="font-bold text-text">{c.pct}% Share</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Under-Reporting Dark Zones (5 Cols) */}
        <div className="lg:col-span-5 rounded-2xl glass border border-border-soft shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-border-soft mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-warning/10 border border-warning/20 flex items-center justify-center text-warning">
                  <Radar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text font-mono uppercase tracking-wider">
                    Under-Reporting Dark Zones
                  </h3>
                  <p className="text-xs text-text-dim">
                    Districts with &gt;40% deficit below statewide baseline
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              {darkZones.map((z, idx) => (
                <div 
                  key={z.district || idx}
                  className="p-3 rounded-xl bg-warning/5 border border-warning/20 hover:border-warning/40 transition-all flex items-start justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-warning shrink-0" />
                      <span className="text-xs font-bold text-text font-mono">
                        {z.district} District
                      </span>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-warning/10 text-warning border border-warning/20">
                        {z.deficit} Deficit
                      </span>
                    </div>
                    <p className="text-[11px] text-text-dim mt-1 leading-snug">
                      {z.reason}
                    </p>
                  </div>

                  <div className="text-right shrink-0 font-mono">
                    <p className="text-xs font-bold text-warning">
                      {z.rate} <span className="text-[10px] opacity-75">FIRs/L</span>
                    </p>
                    <p className="text-[10px] text-text-dim">
                      Exp: {z.expected}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border-soft flex items-center justify-between text-[11px] text-text-dim font-mono">
            <span>Recommended: Deploy Digital e-FIR Kiosks</span>
            <Link
              to="/map"
              className="text-brand font-semibold hover:underline flex items-center gap-1"
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
