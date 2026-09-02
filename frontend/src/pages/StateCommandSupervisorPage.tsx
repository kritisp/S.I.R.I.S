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
    <div className="p-4 sm:p-6 space-y-6 font-sans bg-bg min-h-screen text-text select-none">
      
      {/* ── TOP SUPERVISORY HEADER & TABS ── */}
      <div className="glass p-4 rounded-2xl bg-surface/90 border border-border-strong shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-brand/20 border border-brand/40 flex items-center justify-center text-brand">
                <Shield size={18} />
              </div>
              <h1 className="text-xl font-bold font-mono text-text uppercase tracking-wider">
                S.I.R.I.S. STATE COMMAND & SUPERVISORY HUB
              </h1>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-brand/20 text-brand border border-brand/30">
                STATE POLICE HQ · ODISHA
              </span>
            </div>
            <p className="text-xs text-text-dim">
              Director General of Police / State Command Supervisory Matrix & Division Operational Telemetry.
            </p>
          </div>

          {/* Capsular Live Telemetry Pill */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-2 border border-border-soft text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-text">142 Patrol Fleets Active</span>
              <span className="text-text-dim">·</span>
              <span className="text-brand font-bold">112 ETA: 4m 12s</span>
            </div>

            {pendingSanctions.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-danger/15 border border-danger/30 text-danger-bright text-xs font-mono font-bold">
                <AlertTriangle size={13} />
                <span>{pendingSanctions.length} Warrants Pending</span>
              </div>
            )}
          </div>
        </div>

        {/* ── DRISHTI SUPERVISOR NAVIGATION TABS ── */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 border-t border-border-soft pt-3">
          {[
            { id: 'ops', label: 'Operations Command', icon: LayoutDashboard },
            { id: 'performance', label: 'Officer & Station Performance', icon: Users },
            { id: 'assignment', label: 'Case Assignment', icon: CheckSquare },
            { id: 'approvals', label: 'Sanctions & Warrants', icon: ClipboardCheck },
            { id: 'dispatch', label: 'Fleet & Patrol Dispatch', icon: Navigation },
            { id: 'network', label: 'Cross-Station Network Graph', icon: GitBranch },
            { id: 'escalations', label: 'Emergency QRT & Escalations', icon: AlertTriangle },
            { id: 'audit', label: 'Compliance & Audit Logs', icon: History },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => navigate(`/supervisor/${tab.id}`)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-brand text-bg shadow-md'
                    : 'bg-surface-2 text-text-dim hover:text-text hover:bg-surface-hover'
                }`}
              >
                <Icon size={14} />
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

      {/* ── TAB 1: OPERATIONS COMMAND DASHBOARD (DRISHTI 4-CARD MATRIX + CLEARANCE CHART) ── */}
      {activeTab === 'ops' && (
        <div className="space-y-6">
          {/* KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="glass p-4 rounded-2xl bg-surface/90 border border-border-soft space-y-1">
              <span className="text-[10px] font-mono font-bold text-text-dim uppercase tracking-wider block">ACTIVE PATROL FLEETS</span>
              <p className="text-2xl font-bold font-mono text-brand">142 Units</p>
              <span className="text-[10px] font-mono text-emerald-400">100% GPS Vector Connected</span>
            </div>
            <div className="glass p-4 rounded-2xl bg-surface/90 border border-border-soft space-y-1">
              <span className="text-[10px] font-mono font-bold text-text-dim uppercase tracking-wider block">112 AVG RESPONSE</span>
              <p className="text-2xl font-bold font-mono text-emerald-400">4m 12s</p>
              <span className="text-[10px] font-mono text-text-dim">Sector 4 Benchmark &lt;10m</span>
            </div>
            <div className="glass p-4 rounded-2xl bg-surface/90 border border-border-soft space-y-1">
              <span className="text-[10px] font-mono font-bold text-text-dim uppercase tracking-wider block">PENDING SANCTIONS</span>
              <p className="text-2xl font-bold font-mono text-danger-bright">{pendingSanctions.length} Warrants</p>
              <span className="text-[10px] font-mono text-text-dim">SP Statutory Clearance Desk</span>
            </div>
            <div className="glass p-4 rounded-2xl bg-surface/90 border border-border-soft space-y-1">
              <span className="text-[10px] font-mono font-bold text-text-dim uppercase tracking-wider block">DISPOSAL VELOCITY</span>
              <p className="text-2xl font-bold font-mono text-amber-400">92.4%</p>
              <span className="text-[10px] font-mono text-emerald-400">148 Cases Closed (MoM)</span>
            </div>
          </div>

          {/* DRISHTI 4-CARD INTELLIGENCE GRID + DIVISION CHART */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 8 Cols: 4 Balanced Intelligence Cards */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Card 1: Active Patrol Fleets */}
              <div className="glass p-5 rounded-2xl bg-surface/90 border border-border-soft space-y-4 flex flex-col justify-between hover:border-brand/40 transition-all">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-brand/20 text-brand border border-brand/30 flex items-center justify-center">
                      <Navigation size={20} />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-brand/20 text-brand">4 Sectors Active</span>
                  </div>
                  <div className="mt-3 space-y-1">
                    <span className="text-xs text-text-dim font-mono">Patrol Fleets On Beat</span>
                    <h3 className="text-lg font-bold text-text">142 Units Operational</h3>
                    <p className="text-[11px] font-mono text-emerald-400">100% Satellite Connected · 2s Refresh</p>
                  </div>
                </div>
                <div className="pt-3 border-t border-border-soft flex items-center justify-between">
                  <span className="text-xs font-mono text-text-dim">PCR & Cheetah Active</span>
                  <button onClick={() => navigate('/supervisor/dispatch')} className="px-3 py-1.5 rounded-xl bg-brand text-bg font-bold font-mono text-xs hover:bg-brand-bright transition-colors cursor-pointer">
                    Fleet Map
                  </button>
                </div>
              </div>

              {/* Card 2: 112 Emergency Response */}
              <div className="glass p-5 rounded-2xl bg-surface/90 border border-border-soft space-y-4 flex flex-col justify-between hover:border-brand/40 transition-all">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                      <Clock size={20} />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">SLA Compliant</span>
                  </div>
                  <div className="mt-3 space-y-1">
                    <span className="text-xs text-text-dim font-mono">112 Average Response ETA</span>
                    <h3 className="text-lg font-bold text-text">4m 12s Latency</h3>
                    <p className="text-[11px] text-text-dim">Sector 4 urban beat benchmark &lt;10m; dispatch to on-scene verified.</p>
                  </div>
                </div>
                <div className="pt-3 border-t border-border-soft flex items-center justify-between">
                  <span className="text-xs font-mono text-text-dim">Auto-Routed Queue</span>
                  <button onClick={() => navigate('/supervisor/dispatch')} className="px-3 py-1.5 rounded-xl bg-surface-2 border border-border-soft text-brand font-bold font-mono text-xs hover:bg-surface-hover transition-colors cursor-pointer">
                    Deploy Patrol
                  </button>
                </div>
              </div>

              {/* Card 3: Statutory Sanctions Desk */}
              <div className="glass p-5 rounded-2xl bg-surface/90 border border-border-soft space-y-4 flex flex-col justify-between hover:border-brand/40 transition-all">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-danger/20 text-danger-bright border border-danger/30 flex items-center justify-center">
                      <FileCheck size={20} />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-danger/20 text-danger-bright">Action Required</span>
                  </div>
                  <div className="mt-3 space-y-1">
                    <span className="text-xs text-text-dim font-mono">SP Statutory Clearance Desk</span>
                    <h3 className="text-lg font-bold text-text">{pendingSanctions.length} Warrants Pending</h3>
                    <div className="flex gap-1.5 pt-1 font-mono text-[10px]">
                      <span className="px-2 py-0.5 rounded bg-surface-2 text-warning">Goonda Act</span>
                      <span className="px-2 py-0.5 rounded bg-surface-2 text-brand">BNSS §110</span>
                    </div>
                  </div>
                </div>
                <div className="pt-3 border-t border-border-soft flex items-center justify-between">
                  <span className="text-xs font-mono text-text-dim">Awaiting SP Sign-off</span>
                  <button onClick={() => navigate('/supervisor/approvals')} className="px-3 py-1.5 rounded-xl bg-danger/20 border border-danger/30 text-danger-bright font-bold font-mono text-xs hover:bg-danger/30 transition-colors cursor-pointer">
                    Review Warrants
                  </button>
                </div>
              </div>

              {/* Card 4: Clearance Velocity */}
              <div className="glass p-5 rounded-2xl bg-surface/90 border border-border-soft space-y-4 flex flex-col justify-between hover:border-brand/40 transition-all">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                      <Gauge size={20} />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">92.4% Clearance</span>
                  </div>
                  <div className="mt-3 space-y-1">
                    <span className="text-xs text-text-dim font-mono">Division Clearance & Disposal</span>
                    <h3 className="text-lg font-bold text-text">148 Cases Closed (MoM)</h3>
                    <p className="text-[11px] font-mono text-emerald-400">+4.2% Disposal Velocity</p>
                  </div>
                </div>
                <div className="pt-3 border-t border-border-soft flex items-center justify-between">
                  <span className="text-xs font-mono text-text-dim">5 Police Stations Synced</span>
                  <button onClick={() => navigate('/supervisor/performance')} className="px-3 py-1.5 rounded-xl bg-surface-2 border border-border-soft text-text font-bold font-mono text-xs hover:bg-surface-hover transition-colors cursor-pointer">
                    Scorecards
                  </button>
                </div>
              </div>

            </div>

            {/* Right 4 Cols: Spline Chart & Division Clearance Target */}
            <div className="lg:col-span-4 glass p-5 rounded-2xl bg-surface/90 border border-border-soft space-y-4 flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-text-dim">DIVISION DISPOSALS THIS MONTH</span>
                  <span className="text-[10px] font-mono text-brand font-bold">152 Dossiers</span>
                </div>
                <p className="text-3xl font-extrabold font-mono text-brand mt-2">92.4%</p>
                <span className="text-xs text-text-dim">Sector 4 Division Clearance Rate</span>

                {/* Spline Chart */}
                <div className="relative mt-4 h-32 w-full">
                  <svg viewBox="0 0 300 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="sirishChartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0,65 C 20,40 40,80 70,50 C 100,20 120,70 150,45 C 180,20 200,10 230,12 C 250,15 270,70 300,45 L 300,100 L 0,100 Z"
                      fill="url(#sirishChartGrad)"
                    />
                    <path
                      d="M 0,65 C 20,40 40,80 70,50 C 100,20 120,70 150,45 C 180,20 200,10 230,12 C 250,15 270,70 300,45"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="3"
                    />
                  </svg>
                </div>
              </div>

              {/* Target Card */}
              <div className="p-3 rounded-xl bg-surface-2 border border-border-soft flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-text-dim block">STATE COMMAND PLAN 2026</span>
                  <span className="text-xs font-bold text-text">Disposal Target: 85%</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-brand/20 border border-brand text-brand font-mono font-bold text-xs flex items-center justify-center">
                  85%
                </div>
              </div>
            </div>
          </div>

          {/* WORKLOAD MATRIX TABLE & LIVE FLEETS LIST */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 glass p-5 rounded-2xl bg-surface/90 border border-border-soft space-y-3">
              <div className="flex items-center justify-between border-b border-border-soft pb-2.5">
                <span className="text-xs font-mono font-bold text-brand uppercase tracking-wider">
                  DIVISION POLICE STATION WORKLOAD MATRIX
                </span>
                <button onClick={() => navigate('/supervisor/performance')} className="text-[10px] font-mono text-brand hover:underline cursor-pointer">
                  Full Roster →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="text-[10px] text-text-dim uppercase border-b border-border-soft">
                      <th className="pb-2">POLICE STATION</th>
                      <th className="pb-2">DISPOSAL RATE</th>
                      <th className="pb-2">CHARGE SHEET SLA</th>
                      <th className="pb-2">AVG RESPONSE</th>
                      <th className="pb-2">RISK</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-soft">
                    {stationWorkloads.map((st, idx) => (
                      <tr key={idx} className="hover:bg-surface-hover/60 transition-colors">
                        <td className="py-2.5 font-bold text-text">{st.district}</td>
                        <td className="py-2.5 font-bold text-emerald-400">{st.disposalRate}%</td>
                        <td className="py-2.5 text-text-dim">{st.chargeSheetSla}% (60 Days)</td>
                        <td className="py-2.5 text-text-dim">{st.avgResponse}</td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
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
            <div className="lg:col-span-5 glass p-5 rounded-2xl bg-surface/90 border border-border-soft space-y-3">
              <div className="flex items-center justify-between border-b border-border-soft pb-2.5">
                <span className="text-xs font-mono font-bold text-brand uppercase tracking-wider flex items-center gap-1.5">
                  <Navigation size={14} /> LIVE MOVING PATROL FLEETS
                </span>
                <button onClick={() => navigate('/supervisor/dispatch')} className="text-[10px] font-mono text-brand hover:underline cursor-pointer">
                  Full GPS Map →
                </button>
              </div>

              <div className="space-y-2">
                {patrolUnits.map((unit) => (
                  <div key={unit.id} className="p-2.5 rounded-xl bg-surface-2 border border-border-soft space-y-1 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-text flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                        {unit.callsign}
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-brand/20 text-brand">
                        {unit.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-text-dim">{unit.officer} · {unit.precinct}</p>
                    <div className="flex justify-between text-[9px] text-text-faint pt-1 border-t border-border-soft/60">
                      <span>Speed: <strong className="text-text">{unit.speed}</strong></span>
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
        <div className="glass p-5 rounded-2xl bg-surface/90 border border-border-soft space-y-4">
          <div className="flex items-center justify-between border-b border-border-soft pb-3">
            <div>
              <h2 className="text-base font-bold font-mono text-brand">CROSS-STATION CRIME NETWORK GRAPH</h2>
              <p className="text-xs text-text-dim">Inter-station intelligence linkages across Bhubaneswar and Cuttack Police Stations.</p>
            </div>
            <button onClick={() => navigate('/network')} className="px-3 py-1.5 rounded-xl bg-brand text-bg font-bold font-mono text-xs cursor-pointer">
              OPEN NETWORK EXPLORER
            </button>
          </div>

          <div className="p-6 rounded-xl bg-surface-2 border border-border-soft font-mono text-xs space-y-3">
            <div className="p-3 rounded-lg bg-surface/80 border border-border-soft flex justify-between items-center">
              <div>
                <span className="font-bold text-accent">Rajesh Kumar ("Bullet Ramesh") ↔ Vehicle OD-02-AB-1234</span>
                <p className="text-[10px] text-text-dim">Linked Khandagiri PS (FIR-2026-0142) with Cuttack City PS (FIR-2026-00981)</p>
              </div>
              <span className="px-2.5 py-1 rounded bg-brand/20 text-brand font-bold">CONFIDENCE: 94%</span>
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

