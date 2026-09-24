import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  LayoutDashboard, Navigation, Clock, FileCheck, ShieldAlert, Radio, 
  CheckCircle2, AlertTriangle, ChevronRight, TrendingUp, Building2, 
  Users, Zap, ArrowUpRight, Sparkles, MapPin, Gauge, Shield, Search, 
  MoreVertical, Camera, CheckSquare, ClipboardCheck, GitBranch, History, 
  Bot, Check, Eye, UserCheck, CreditCard, Layers, XCircle, HelpCircle
} from 'lucide-react';
import { explainableIntelStore } from '../services/explainableIntelService';
import { SupervisorPerformancePage } from './SupervisorPerformancePage';
import { SupervisorAssignmentPage } from './SupervisorAssignmentPage';
import { SupervisorApprovalsPage } from './SupervisorApprovalsPage';
import { SupervisorFleetDispatchPage } from './SupervisorFleetDispatchPage';
import { SupervisorEscalationsPage } from './SupervisorEscalationsPage';
import { SupervisorAuditPage } from './SupervisorAuditPage';

export function StateCommandSupervisorPage() {
  const navigate = useNavigate();
  const { tabId } = useParams();

  // Active Supervisory Tab derived from URL
  const activeTab = (tabId as 'ops' | 'performance' | 'assignment' | 'approvals' | 'dispatch' | 'network' | 'escalations' | 'audit') || 'ops';

  // Filter State
  const [timeFilter, setTimeFilter] = useState<'Day' | 'Week' | 'Month' | 'Year'>('Month');
  const [approvedNotification, setApprovedNotification] = useState<string>('');

  // Mock Supervisory State (Odisha Police Telemetry)
  const [pendingSanctions, setPendingSanctions] = useState([
    { id: 'SANC-01', title: 'Goonda Act Detention Order', suspect: 'Rajesh Kumar (Bullet Ramesh)', fir: 'FIR-2026-0142', station: 'Khandagiri PS', section: 'BNS §310 / Goonda Act §3', date: '2026-08-18' },
    { id: 'SANC-02', title: 'Preventive Custody Warrant', suspect: 'Rakesh Swain (Kalia)', fir: 'FIR-2026-00541', station: 'Badambadi PS', section: 'BNSS §110 Preventive', date: '2026-08-19' },
    { id: 'SANC-03', title: 'Mule Account Bank Freezing Order', suspect: 'Debasis Jena', fir: 'FIR-2026-00541', station: 'Saheed Nagar PS', section: 'BNS §318 (Cheating / Money Mule)', date: '2026-08-20' },
  ]);

  const [patrolUnits, setPatrolUnits] = useState([
    { id: 'PU-01', callsign: 'CHEETAH-BBSR-01', officer: 'Ins. S. Pattnaik', precinct: 'Khandagiri Sector 4', speed: '42 km/h', fuel: 88, status: 'ON BEAT PATROL', lat: 20.258, lng: 85.782 },
    { id: 'PU-02', callsign: 'PCR-CTC-04', officer: 'Ins. M. Mohanty', precinct: 'Cuttack Badambadi', speed: '55 km/h', fuel: 74, status: 'RESPONDING TO 112', lat: 20.462, lng: 85.882 },
    { id: 'PU-03', callsign: 'QRT-PATRAPADA-02', officer: 'Sub-Ins. R. Das', precinct: 'NH-16 Corridor', speed: '68 km/h', fuel: 92, status: 'HIGHWAY INTERCEPT', lat: 20.235, lng: 85.765 },
    { id: 'PU-04', callsign: 'BEAT-SAHEED-03', officer: 'Ins. B. Swain', precinct: 'Saheed Nagar PS', speed: '18 km/h', fuel: 65, status: 'STATION BACKUP', lat: 20.292, lng: 85.840 },
  ]);

  const stationWorkloads = [
    { district: 'Khandagiri PS (Khordha)', disposalRate: 94.2, chargeSheetSla: 96, avgResponse: '4m 12s', risk: 'LOW' },
    { district: 'Cuttack Badambadi PS', disposalRate: 91.8, chargeSheetSla: 92, avgResponse: '5m 45s', risk: 'LOW' },
    { district: 'Saheed Nagar PS (Bhubaneswar)', disposalRate: 88.5, chargeSheetSla: 89, avgResponse: '6m 10s', risk: 'MODERATE' },
    { district: 'Jatni PS (Khordha Rural)', disposalRate: 83.4, chargeSheetSla: 84, avgResponse: '8m 30s', risk: 'MODERATE' },
    { district: 'Puri Sea Beach PS', disposalRate: 96.0, chargeSheetSla: 98, avgResponse: '3m 50s', risk: 'LOW' },
  ];

  const handleApproveSanction = (id: string, title: string) => {
    setPendingSanctions(prev => prev.filter(s => s.id !== id));
    setApprovedNotification(`Approved statutory sanction: ${title}`);
    setTimeout(() => setApprovedNotification(''), 4000);
  };

  return (
    <div className="max-w-[1520px] mx-auto space-y-4 font-sans select-none text-text dark:text-[#F8FAFC] pb-24">
      {/* ── UNIFIED COMMAND-CENTER HEADER & TABS ── */}
      <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-3.5 sm:p-4 shadow-xs dark:shadow-2xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-2 dark:bg-[#0E1422] border border-accent/40 dark:border-[#38BDF8]/40 flex items-center justify-center text-accent dark:text-[#38BDF8] shadow-xs shrink-0">
              <Shield size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-accent dark:text-[#38BDF8]">
                  STATE POLICE HQ · ODISHA
                </span>
                <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  142 FLEETS ACTIVE
                </span>
                {pendingSanctions.length > 0 && (
                  <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400">
                    {pendingSanctions.length} WARRANTS PENDING
                  </span>
                )}
              </div>
              <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-text dark:text-[#F8FAFC] mt-0.5">
                State Command & Supervisory Control Matrix
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-xs font-mono">
              <span className="text-text-dim dark:text-[#94A3B8]">112 Avg ETA:</span>
              <span className="text-accent dark:text-[#38BDF8] font-bold">4m 12s</span>
            </div>
          </div>
        </div>

        {/* ── DRISHTI SUPERVISOR NAVIGATION TABS ── */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-border-soft dark:border-[#1E293B] pt-2.5">
          {[
            { id: 'ops', label: 'Operations Command', icon: LayoutDashboard },
            { id: 'performance', label: 'Scorecards', icon: Users },
            { id: 'assignment', label: 'Case Assignment', icon: CheckSquare },
            { id: 'approvals', label: 'Sanctions & Warrants', icon: ClipboardCheck },
            { id: 'dispatch', label: 'Fleet Dispatch', icon: Navigation },
            { id: 'network', label: 'Cross-Station Graph', icon: GitBranch },
            { id: 'escalations', label: 'Emergency QRT', icon: AlertTriangle },
            { id: 'audit', label: 'Audit & Compliance', icon: History },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => navigate(`/supervisor/${tab.id}`)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-accent text-bg dark:bg-[#38BDF8] dark:text-[#070A0F] shadow-xs'
                    : 'bg-surface-2 dark:bg-[#0E1422] text-text-dim dark:text-[#94A3B8] hover:text-text dark:hover:text-[#F8FAFC] hover:bg-surface-hover dark:hover:bg-[#151D2E] border border-border-soft dark:border-[#1E293B]'
                }`}
              >
                <Icon size={13} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Toast Notification */}
      {approvedNotification && (
        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{approvedNotification}</span>
        </div>
      )}

      {/* ── TAB 1: OPERATIONS COMMAND DASHBOARD ── */}
      {activeTab === 'ops' && (
        <div className="space-y-4">
          {/* KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-3.5 shadow-xs dark:shadow-2xl space-y-1">
              <span className="text-[10px] font-mono font-bold text-text-dim dark:text-[#94A3B8] uppercase tracking-wider block">ACTIVE PATROL FLEETS</span>
              <p className="text-2xl font-bold font-mono text-accent dark:text-[#38BDF8]">142 Units</p>
              <span className="text-[10px] font-mono text-emerald-400">100% Vector Connected</span>
            </div>
            <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-3.5 shadow-xs dark:shadow-2xl space-y-1">
              <span className="text-[10px] font-mono font-bold text-text-dim dark:text-[#94A3B8] uppercase tracking-wider block">112 AVG RESPONSE</span>
              <p className="text-2xl font-bold font-mono text-emerald-400">4m 12s</p>
              <span className="text-[10px] font-mono text-text-dim dark:text-[#94A3B8]">Sector Benchmark &lt;10m</span>
            </div>
            <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-3.5 shadow-xs dark:shadow-2xl space-y-1">
              <span className="text-[10px] font-mono font-bold text-text-dim dark:text-[#94A3B8] uppercase tracking-wider block">PENDING SANCTIONS</span>
              <p className="text-2xl font-bold font-mono text-rose-400">{pendingSanctions.length} Warrants</p>
              <span className="text-[10px] font-mono text-text-dim dark:text-[#94A3B8]">SP Statutory Clearance</span>
            </div>
            <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-3.5 shadow-xs dark:shadow-2xl space-y-1">
              <span className="text-[10px] font-mono font-bold text-text-dim dark:text-[#94A3B8] uppercase tracking-wider block">DISPOSAL VELOCITY</span>
              <p className="text-2xl font-bold font-mono text-amber-400">92.4%</p>
              <span className="text-[10px] font-mono text-emerald-400">148 Cases Closed (MoM)</span>
            </div>
          </div>

          {/* DRISHTI 4-CARD INTELLIGENCE GRID + DIVISION CHART */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left 8 Cols: 4 Balanced Intelligence Cards */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Card 1: Active Patrol Fleets */}
              <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-4 space-y-3 flex flex-col justify-between shadow-xs dark:shadow-2xl">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 dark:bg-[#38BDF8]/10 text-accent dark:text-[#38BDF8] border border-accent/30 dark:border-[#38BDF8]/30 flex items-center justify-center">
                      <Navigation size={16} />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-accent/20 text-accent dark:bg-[#38BDF8]/20 dark:text-[#38BDF8]">4 Sectors Active</span>
                  </div>
                  <div className="mt-2 space-y-0.5">
                    <span className="text-[11px] text-text-dim dark:text-[#94A3B8] font-mono">Patrol Fleets On Beat</span>
                    <h3 className="text-base font-bold text-text dark:text-[#F8FAFC]">142 Units Operational</h3>
                    <p className="text-[10px] font-mono text-emerald-400">100% Satellite Connected · 2s Refresh</p>
                  </div>
                </div>
                <div className="pt-2.5 border-t border-border-soft dark:border-[#1E293B] flex items-center justify-between">
                  <span className="text-[11px] font-mono text-text-dim dark:text-[#94A3B8]">PCR & Cheetah Active</span>
                  <button onClick={() => navigate('/supervisor/dispatch')} className="px-3 py-1 rounded-lg bg-accent text-bg dark:bg-[#38BDF8] dark:text-[#070A0F] font-bold font-mono text-xs hover:bg-accent-bright dark:hover:bg-[#0284C7] transition-colors cursor-pointer uppercase">
                    Fleet Map
                  </button>
                </div>
              </div>

              {/* Card 2: 112 Emergency Response */}
              <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-4 space-y-3 flex flex-col justify-between shadow-xs dark:shadow-2xl">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                      <Clock size={16} />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">SLA Compliant</span>
                  </div>
                  <div className="mt-2 space-y-0.5">
                    <span className="text-[11px] text-text-dim dark:text-[#94A3B8] font-mono">112 Average Response ETA</span>
                    <h3 className="text-base font-bold text-text dark:text-[#F8FAFC]">4m 12s Latency</h3>
                    <p className="text-[10px] text-text-dim dark:text-[#94A3B8]">Sector urban beat benchmark &lt;10m.</p>
                  </div>
                </div>
                <div className="pt-2.5 border-t border-border-soft dark:border-[#1E293B] flex items-center justify-between">
                  <span className="text-[11px] font-mono text-text-dim dark:text-[#94A3B8]">Auto-Routed Queue</span>
                  <button onClick={() => navigate('/supervisor/dispatch')} className="px-3 py-1 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-accent dark:text-[#38BDF8] font-bold font-mono text-xs hover:bg-surface-hover dark:hover:bg-[#151D2E] transition-colors cursor-pointer uppercase">
                    Deploy Patrol
                  </button>
                </div>
              </div>

              {/* Card 3: Statutory Sanctions Desk */}
              <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-4 space-y-3 flex flex-col justify-between shadow-xs dark:shadow-2xl">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                      <FileCheck size={16} />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">Action Required</span>
                  </div>
                  <div className="mt-2 space-y-0.5">
                    <span className="text-[11px] text-text-dim dark:text-[#94A3B8] font-mono">SP Statutory Clearance Desk</span>
                    <h3 className="text-base font-bold text-text dark:text-[#F8FAFC]">{pendingSanctions.length} Warrants Pending</h3>
                    <div className="flex gap-1.5 pt-1 font-mono text-[10px]">
                      <span className="px-1.5 py-0.2 rounded bg-surface-2 dark:bg-[#0E1422] text-amber-400">Goonda Act</span>
                      <span className="px-1.5 py-0.2 rounded bg-surface-2 dark:bg-[#0E1422] text-accent dark:text-[#38BDF8]">BNSS §110</span>
                    </div>
                  </div>
                </div>
                <div className="pt-2.5 border-t border-border-soft dark:border-[#1E293B] flex items-center justify-between">
                  <span className="text-[11px] font-mono text-text-dim dark:text-[#94A3B8]">Awaiting SP Sign-off</span>
                  <button onClick={() => navigate('/supervisor/approvals')} className="px-3 py-1 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold font-mono text-xs hover:bg-rose-500/30 transition-colors cursor-pointer uppercase">
                    Review
                  </button>
                </div>
              </div>

              {/* Card 4: Clearance Velocity */}
              <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-4 space-y-3 flex flex-col justify-between shadow-xs dark:shadow-2xl">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                      <Gauge size={16} />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">92.4% Clearance</span>
                  </div>
                  <div className="mt-2 space-y-0.5">
                    <span className="text-[11px] text-text-dim dark:text-[#94A3B8] font-mono">Division Clearance & Disposal</span>
                    <h3 className="text-base font-bold text-text dark:text-[#F8FAFC]">148 Cases Closed (MoM)</h3>
                    <p className="text-[10px] font-mono text-emerald-400">+4.2% Disposal Velocity</p>
                  </div>
                </div>
                <div className="pt-2.5 border-t border-border-soft dark:border-[#1E293B] flex items-center justify-between">
                  <span className="text-[11px] font-mono text-text-dim dark:text-[#94A3B8]">5 Police Stations</span>
                  <button onClick={() => navigate('/supervisor/performance')} className="px-3 py-1 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-text dark:text-[#F8FAFC] font-bold font-mono text-xs hover:bg-surface-hover dark:hover:bg-[#151D2E] transition-colors cursor-pointer uppercase">
                    Scorecards
                  </button>
                </div>
              </div>

            </div>

            {/* Right 4 Cols: Spline Chart & Division Clearance Target */}
            <div className="lg:col-span-4 bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-4 space-y-3 flex flex-col justify-between shadow-xs dark:shadow-2xl">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-text-dim dark:text-[#94A3B8] uppercase">DIVISION DISPOSALS</span>
                  <span className="text-[10px] font-mono text-accent dark:text-[#38BDF8] font-bold">152 Dossiers</span>
                </div>
                <p className="text-2xl font-extrabold font-mono text-accent dark:text-[#38BDF8] mt-1">92.4%</p>
                <span className="text-[11px] text-text-dim dark:text-[#94A3B8]">Sector 4 Division Clearance Rate</span>

                {/* Spline Chart */}
                <div className="relative mt-3 h-28 w-full">
                  <svg viewBox="0 0 300 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="sirishChartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0,65 C 20,40 40,80 70,50 C 100,20 120,70 150,45 C 180,20 200,10 230,12 C 250,15 270,70 300,45 L 300,100 L 0,100 Z"
                      fill="url(#sirishChartGrad)"
                    />
                    <path
                      d="M 0,65 C 20,40 40,80 70,50 C 100,20 120,70 150,45 C 180,20 200,10 230,12 C 250,15 270,70 300,45"
                      fill="none"
                      stroke="#38BDF8"
                      strokeWidth="2.5"
                    />
                  </svg>
                </div>
              </div>

              {/* Target Card */}
              <div className="p-2.5 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-mono text-text-dim dark:text-[#94A3B8] block uppercase">STATE COMMAND PLAN</span>
                  <span className="text-xs font-bold text-text dark:text-[#F8FAFC]">Disposal Target: 85%</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent text-accent dark:bg-[#38BDF8]/20 dark:border-[#38BDF8] dark:text-[#38BDF8] font-mono font-bold text-xs flex items-center justify-center">
                  85%
                </div>
              </div>
            </div>
          </div>

          {/* WORKLOAD MATRIX TABLE & LIVE FLEETS LIST */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7 bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-4 space-y-3 shadow-xs dark:shadow-2xl">
              <div className="flex items-center justify-between border-b border-border-soft dark:border-[#1E293B] pb-2">
                <span className="text-xs font-mono font-bold text-accent dark:text-[#38BDF8] uppercase tracking-wider">
                  DIVISION POLICE STATION WORKLOAD MATRIX
                </span>
                <button onClick={() => navigate('/supervisor/performance')} className="text-[10px] font-mono text-accent dark:text-[#38BDF8] hover:underline cursor-pointer uppercase">
                  Full Roster →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="text-[10px] text-text-dim dark:text-[#94A3B8] uppercase border-b border-border-soft dark:border-[#1E293B]">
                      <th className="pb-2">POLICE STATION</th>
                      <th className="pb-2">DISPOSAL</th>
                      <th className="pb-2">CHARGE SHEET SLA</th>
                      <th className="pb-2">AVG RESP</th>
                      <th className="pb-2">RISK</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-soft/60 dark:divide-[#1E293B]">
                    {stationWorkloads.map((st, idx) => (
                      <tr key={idx} className="hover:bg-surface-hover dark:hover:bg-[#151D2E] transition-colors">
                        <td className="py-2.5 font-bold text-text dark:text-[#F8FAFC]">{st.district}</td>
                        <td className="py-2.5 font-bold text-emerald-400">{st.disposalRate}%</td>
                        <td className="py-2.5 text-text-dim dark:text-[#94A3B8]">{st.chargeSheetSla}% (60D)</td>
                        <td className="py-2.5 text-text-dim dark:text-[#94A3B8]">{st.avgResponse}</td>
                        <td className="py-2.5">
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            st.risk === 'LOW' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {st.risk}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Live Moving Patrol Units */}
            <div className="lg:col-span-5 bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-4 space-y-3 shadow-xs dark:shadow-2xl">
              <div className="flex items-center justify-between border-b border-border-soft dark:border-[#1E293B] pb-2">
                <span className="text-xs font-mono font-bold text-accent dark:text-[#38BDF8] uppercase tracking-wider flex items-center gap-1.5">
                  <Navigation size={13} /> LIVE PATROL FLEETS
                </span>
                <button onClick={() => navigate('/supervisor/dispatch')} className="text-[10px] font-mono text-accent dark:text-[#38BDF8] hover:underline cursor-pointer uppercase">
                  GPS Map →
                </button>
              </div>

              <div className="space-y-2">
                {patrolUnits.map((unit) => (
                  <div key={unit.id} className="p-2.5 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] space-y-1 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-text dark:text-[#F8FAFC] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        {unit.callsign}
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-accent/20 text-accent dark:bg-[#38BDF8]/20 dark:text-[#38BDF8]">
                        {unit.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-text-dim dark:text-[#94A3B8]">{unit.officer} · {unit.precinct}</p>
                    <div className="flex justify-between text-[9px] text-text-dim dark:text-[#94A3B8] pt-1 border-t border-border-soft/60 dark:border-[#1E293B]">
                      <span>Speed: <strong className="text-text dark:text-[#F8FAFC]">{unit.speed}</strong></span>
                      <span>Fuel: <strong className="text-emerald-400">{unit.fuel}%</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: OFFICER & STATION PERFORMANCE SCORECARDS ── */}
      {activeTab === 'performance' && <SupervisorPerformancePage />}

      {/* ── TAB 3: CASE ASSIGNMENT & WORKLOAD ALLOCATION ── */}
      {activeTab === 'assignment' && <SupervisorAssignmentPage />}

      {/* ── TAB 4: SANCTIONS & WARRANTS DESK (APPROVALS) ── */}
      {activeTab === 'approvals' && <SupervisorApprovalsPage />}

      {/* ── TAB 5: FLEET & PATROL DISPATCH ── */}
      {activeTab === 'dispatch' && <SupervisorFleetDispatchPage />}

      {/* ── TAB 6: CROSS-STATION NETWORK GRAPH ── */}
      {activeTab === 'network' && (
        <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-4 sm:p-5 space-y-3 shadow-xs dark:shadow-2xl">
          <div className="flex items-center justify-between border-b border-border-soft dark:border-[#1E293B] pb-3">
            <div>
              <h2 className="text-xs font-bold font-mono text-accent dark:text-[#38BDF8] uppercase">CROSS-STATION CRIME NETWORK GRAPH</h2>
              <p className="text-[11px] text-text-dim dark:text-[#94A3B8]">Inter-station intelligence linkages across Bhubaneswar and Cuttack Police Stations.</p>
            </div>
            <button onClick={() => navigate('/network')} className="px-3.5 py-1.5 rounded-lg bg-accent text-bg dark:bg-[#38BDF8] dark:text-[#070A0F] font-bold font-mono text-xs hover:bg-accent-bright dark:hover:bg-[#0284C7] transition-colors cursor-pointer uppercase">
              OPEN NETWORK EXPLORER
            </button>
          </div>

          <div className="p-4 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] font-mono text-xs space-y-2.5">
            <div className="p-3 rounded-lg bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] flex justify-between items-center">
              <div>
                <span className="font-bold text-accent dark:text-[#38BDF8]">Rajesh Kumar ("Bullet Ramesh") ↔ Vehicle OD-02-AB-1234</span>
                <p className="text-[10px] text-text-dim dark:text-[#94A3B8]">Linked Khandagiri PS (FIR-2026-0142) with Cuttack City PS (FIR-2026-00981)</p>
              </div>
              <span className="px-2 py-0.5 rounded bg-accent/20 text-accent dark:bg-[#38BDF8]/20 dark:text-[#38BDF8] font-bold text-[10px]">CONFIDENCE: 94%</span>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 7: EMERGENCY QRT & ESCALATIONS ── */}
      {activeTab === 'escalations' && <SupervisorEscalationsPage />}

      {/* ── TAB 8: AUDIT & COMPLIANCE LOGS ── */}
      {activeTab === 'audit' && <SupervisorAuditPage />}

    </div>
  );
}

