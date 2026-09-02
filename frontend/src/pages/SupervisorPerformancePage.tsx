import React, { useState } from 'react';
import { 
  Users, Award, TrendingUp, Clock, CheckCircle2, AlertTriangle, 
  FileText, Search, Building2, Filter, ArrowUpRight, Shield, 
  ChevronRight, Sparkles, Phone, Mail, Calendar 
} from 'lucide-react';

interface CaseItem {
  case_number: string;
  crime_type: string;
  date: string;
  status: string;
  sla_status: string;
}

interface OfficerRecord {
  officer_id: string;
  name: string;
  station: string;
  phone: string;
  email: string;
  joined_station: string;
  specialization: string;
  active_cases: number;
  closed_cases_month: number;
  clearance_rate: number;
  avg_response_min: number;
  sla_compliance: number;
  status: string;
  recent_cases: CaseItem[];
}

const DEMO_OFFICERS: OfficerRecord[] = [
  {
    officer_id: 'OP-BBSR-104',
    name: 'Ins. S. Pattnaik',
    station: 'Khandagiri Police Station',
    phone: '+91 94370 12345',
    email: 's.pattnaik@odishapolice.gov.in',
    joined_station: '12 Jan 2024',
    specialization: 'Commercial Robbery & ANPR Intercept',
    active_cases: 14,
    closed_cases_month: 12,
    clearance_rate: 94.2,
    avg_response_min: 4.2,
    sla_compliance: 96.0,
    status: 'Optimal SLA',
    recent_cases: [
      { case_number: 'FIR-2026-00541', crime_type: 'Armed Heist & Pass-Through AML', date: '2026-08-20', status: 'Under Investigation', sla_status: 'On Time (12d)' },
      { case_number: 'FIR-2026-00142', crime_type: 'Unit IV Warehouse Robbery', date: '2026-08-18', status: 'Charge Sheet Prepared', sla_status: 'On Time (14d)' }
    ]
  },
  {
    officer_id: 'OP-CTC-208',
    name: 'Ins. M. Mohanty',
    station: 'Cuttack Badambadi PS',
    phone: '+91 94371 88200',
    email: 'm.mohanty@odishapolice.gov.in',
    joined_station: '05 Mar 2023',
    specialization: 'Financial Crimes & Mule Recovery',
    active_cases: 16,
    closed_cases_month: 9,
    clearance_rate: 91.8,
    avg_response_min: 5.8,
    sla_compliance: 92.0,
    status: 'Optimal SLA',
    recent_cases: [
      { case_number: 'FIR-2026-00981', crime_type: 'Badambadi Jewelry Heist', date: '2026-08-15', status: 'Evidence Corroborated', sla_status: 'On Time (17d)' }
    ]
  },
  {
    officer_id: 'OP-BBSR-312',
    name: 'Ins. B. Swain',
    station: 'Saheed Nagar PS',
    phone: '+91 99370 44112',
    email: 'b.swain@odishapolice.gov.in',
    joined_station: '18 Nov 2024',
    specialization: 'Cyber Burglary & CDR Analysis',
    active_cases: 19,
    closed_cases_month: 8,
    clearance_rate: 88.5,
    avg_response_min: 6.1,
    sla_compliance: 89.0,
    status: 'Near SLA Limit',
    recent_cases: [
      { case_number: 'FIR-2026-00081', crime_type: 'Saheed Nagar Commercial Theft', date: '2026-08-10', status: 'Pending Forensic Lab', sla_status: 'Critical SLA (52d)' }
    ]
  },
  {
    officer_id: 'OP-KHD-405',
    name: 'Sub-Ins. R. Das',
    station: 'Jatni Rural PS',
    phone: '+91 97760 11223',
    email: 'r.das@odishapolice.gov.in',
    joined_station: '01 Jun 2025',
    specialization: 'Highway Intercept & Patrol Dispatch',
    active_cases: 12,
    closed_cases_month: 6,
    clearance_rate: 83.4,
    avg_response_min: 8.5,
    sla_compliance: 84.0,
    status: 'Optimal SLA',
    recent_cases: [
      { case_number: 'FIR-2026-00210', crime_type: 'NH-16 Vehicle Hijack', date: '2026-08-12', status: 'Vehicle Seized', sla_status: 'On Time (20d)' }
    ]
  }
];

export function SupervisorPerformancePage() {
  const [officers] = useState<OfficerRecord[]>(DEMO_OFFICERS);
  const [selectedOfficer, setSelectedOfficer] = useState<OfficerRecord>(DEMO_OFFICERS[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stationFilter, setStationFilter] = useState('ALL');

  const filteredOfficers = officers.filter(off => {
    const matchSearch = 
      off.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      off.officer_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      off.station.toLowerCase().includes(searchTerm.toLowerCase()) ||
      off.specialization.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStation = stationFilter === 'ALL' || off.station.includes(stationFilter);
    return matchSearch && matchStation;
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 font-sans bg-bg min-h-screen text-text select-none">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass p-4 rounded-2xl bg-surface/90 border border-border-strong shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-brand/20 border border-brand/40 flex items-center justify-center text-brand">
              <Users size={18} />
            </div>
            <h1 className="text-xl font-bold font-mono text-text uppercase tracking-wider">
              OFFICER & STATION PERFORMANCE MATRIX
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-brand/20 text-brand border border-brand/30">
              STATE COMMAND METRICS
            </span>
          </div>
          <p className="text-xs text-text-dim">
            Odisha State Police · Sector 4 Officer Clearances, Active Caseloads & SLA Compliance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-surface-2 border border-border-soft text-xs font-mono font-bold text-emerald-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>4 Inspectors Synced</span>
          </span>
        </div>
      </div>

      {/* ── 4 KEY EXECUTIVE KPI CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="glass p-5 rounded-2xl bg-surface/90 border border-border-soft space-y-2">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Award size={20} />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">Above Target</span>
          </div>
          <span className="text-xs text-text-dim block">Avg Clearance Rate</span>
          <p className="text-2xl font-extrabold text-text">92.4%</p>
          <span className="text-[10px] text-text-faint pt-2 border-t border-border-soft/60 block">Benchmark: &gt;75%</span>
        </div>

        <div className="glass p-5 rounded-2xl bg-surface/90 border border-border-soft space-y-2">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-brand/20 text-brand border border-brand/30 flex items-center justify-center">
              <Clock size={20} />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand/20 text-brand">Fast Velocity</span>
          </div>
          <span className="text-xs text-text-dim block">Average 112 Response</span>
          <p className="text-2xl font-extrabold text-text">4m 12s</p>
          <span className="text-[10px] text-text-faint pt-2 border-t border-border-soft/60 block">Sector 4 urban average</span>
        </div>

        <div className="glass p-5 rounded-2xl bg-surface/90 border border-border-soft space-y-2">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
              <Users size={20} />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-400">Active Queue</span>
          </div>
          <span className="text-xs text-text-dim block">Division Caseload</span>
          <p className="text-2xl font-extrabold text-text">61 Active FIRs</p>
          <span className="text-[10px] text-text-faint pt-2 border-t border-border-soft/60 block">15.2 FIRs / officer avg</span>
        </div>

        <div className="glass p-5 rounded-2xl bg-surface/90 border border-border-soft space-y-2">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Shield size={20} />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">92.0% On-Time</span>
          </div>
          <span className="text-xs text-text-dim block">Charge Sheet SLA</span>
          <p className="text-2xl font-extrabold text-text">92.0%</p>
          <span className="text-[10px] text-text-faint pt-2 border-t border-border-soft/60 block">60-day statutory quota</span>
        </div>
      </div>

      {/* ── SEARCH & FILTER CONTROLS ── */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-dim" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search inspector by name, badge ID, station or specialization..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-2 border border-border-soft text-xs text-text placeholder:text-text-faint outline-none focus:border-brand font-mono"
          />
        </div>

        <select
          value={stationFilter}
          onChange={(e) => setStationFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-surface-2 border border-border-soft text-xs font-mono text-text outline-none"
        >
          <option value="ALL">All Stations (4)</option>
          <option value="Khandagiri">Khandagiri PS</option>
          <option value="Cuttack">Cuttack Badambadi PS</option>
          <option value="Saheed Nagar">Saheed Nagar PS</option>
          <option value="Jatni">Jatni Rural PS</option>
        </select>
      </div>

      {/* ── MAIN 2-COLUMN INSPECTOR ROSTER & CASE BACKLOG DETAILS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-mono">
        
        {/* Left Column: Officer Scorecards List (7 cols) */}
        <div className="lg:col-span-7 glass p-5 rounded-2xl bg-surface/90 border border-border-soft space-y-4 shadow-xl">
          <h3 className="text-xs font-mono font-bold text-brand uppercase tracking-wider flex items-center gap-2 border-b border-border-soft pb-2.5">
            <Users size={14} /> INSPECTOR DUTY ROSTER & WORKLOAD SCORECARDS
          </h3>

          <div className="space-y-3">
            {filteredOfficers.map((officer) => {
              const isSelected = selectedOfficer.officer_id === officer.officer_id;

              return (
                <div
                  key={officer.officer_id}
                  onClick={() => setSelectedOfficer(officer)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer space-y-3 ${
                    isSelected
                      ? 'bg-brand/20 border-brand shadow-md'
                      : 'bg-surface-2 border-border-soft hover:bg-surface-hover'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand/20 text-brand font-bold text-xs flex items-center justify-center border border-brand/30">
                        {officer.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-text flex items-center gap-2">
                          {officer.name}
                          <span className="text-[10px] text-text-dim">({officer.officer_id})</span>
                        </h4>
                        <p className="text-[11px] text-text-dim flex items-center gap-1 mt-0.5">
                          <Building2 size={12} className="text-brand" />
                          {officer.station} · {officer.specialization}
                        </p>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md ${
                      officer.status.includes('Optimal')
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {officer.status}
                    </span>
                  </div>

                  {/* Performance Progress Bars */}
                  <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border-soft/60 text-xs">
                    <div>
                      <span className="text-[9px] text-text-dim block">CLEARANCE RATE</span>
                      <span className="font-bold text-emerald-400">{officer.clearance_rate}%</span>
                      <div className="w-full h-1.5 rounded-full bg-surface-hover mt-1 overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${officer.clearance_rate}%` }} />
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] text-text-dim block">ACTIVE FIRS</span>
                      <span className="font-bold text-brand">{officer.active_cases} / 20</span>
                      <div className="w-full h-1.5 rounded-full bg-surface-hover mt-1 overflow-hidden">
                        <div className={`h-full rounded-full ${officer.active_cases > 18 ? 'bg-danger' : 'bg-brand'}`} style={{ width: `${(officer.active_cases / 20) * 100}%` }} />
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] text-text-dim block">SLA COMPLIANCE</span>
                      <span className="font-bold text-warning">{officer.sla_compliance}%</span>
                      <div className="w-full h-1.5 rounded-full bg-surface-hover mt-1 overflow-hidden">
                        <div className="h-full bg-warning rounded-full" style={{ width: `${officer.sla_compliance}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Inspector Backlog Drilldown (5 cols) */}
        <div className="lg:col-span-5 glass p-5 rounded-2xl bg-surface/90 border border-border-strong space-y-4 shadow-xl text-xs">
          <div className="border-b border-border-soft pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-text">{selectedOfficer.name} · Dossier</h3>
              <p className="text-[11px] text-text-dim mt-0.5">{selectedOfficer.station}</p>
            </div>
            <div className="text-right">
              <span className="text-emerald-400 font-bold text-sm block">{selectedOfficer.closed_cases_month} Closed</span>
              <span className="text-[9px] text-text-faint">this month</span>
            </div>
          </div>

          {/* Contact Details */}
          <div className="p-3 rounded-xl bg-surface-2 border border-border-soft space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-text-dim">PHONE:</span>
              <span className="font-bold text-text">{selectedOfficer.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-dim">EMAIL:</span>
              <span className="font-bold text-text truncate max-w-[180px]">{selectedOfficer.email}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-border-soft/60">
              <span className="text-text-dim">JOINED STATION:</span>
              <span className="font-bold text-brand">{selectedOfficer.joined_station}</span>
            </div>
          </div>

          {/* Active Cases Backlog Stream */}
          <div className="space-y-2">
            <span className="font-bold text-brand text-xs block">ASSIGNED ACTIVE FIR BACKLOG:</span>
            {selectedOfficer.recent_cases.map((c, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-surface-2 border border-border-soft space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-brand">{c.case_number}</span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                    c.sla_status.includes('Critical') ? 'bg-danger/20 text-danger-bright' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {c.sla_status}
                  </span>
                </div>
                <p className="text-text text-[11px] font-bold">{c.crime_type}</p>
                <div className="flex justify-between text-[10px] text-text-dim pt-1 border-t border-border-soft/60">
                  <span>Filed: {c.date}</span>
                  <span>{c.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
