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
    <div className="max-w-[1520px] mx-auto p-4 sm:p-6 space-y-4 font-sans select-none text-text dark:text-[#F8FAFC] pb-24">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-4 shadow-xs dark:shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-2 dark:bg-[#0E1422] border border-accent/40 dark:border-[#38BDF8]/40 flex items-center justify-center text-accent dark:text-[#38BDF8] shadow-xs">
            <Users size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold font-mono text-text dark:text-[#F8FAFC] uppercase tracking-wider">
                Officer & Station Performance Matrix
              </h1>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-accent/10 dark:bg-[#38BDF8]/10 text-accent dark:text-[#38BDF8] border border-accent/20 dark:border-[#38BDF8]/20">
                STATE COMMAND
              </span>
            </div>
            <p className="text-xs text-text-dim dark:text-[#94A3B8]">
              Odisha State Police · Sector 4 Officer Clearances, Active Caseloads & SLA Compliance Tracking
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-xs font-mono font-bold text-emerald-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>4 Inspectors Synced</span>
          </span>
        </div>
      </div>

      {/* ── 4 KEY EXECUTIVE KPI CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
        <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-text-dim dark:text-[#94A3B8] uppercase">Avg Clearance Rate</span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">Above Target</span>
          </div>
          <p className="text-xl font-mono font-bold text-text dark:text-[#F8FAFC] mt-1">92.4%</p>
          <span className="text-[9px] text-text-dim dark:text-[#94A3B8] pt-1 border-t border-border-soft dark:border-[#1E293B] block">Benchmark: &gt;75%</span>
        </div>

        <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-text-dim dark:text-[#94A3B8] uppercase">Average 112 Response</span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-accent/10 dark:bg-[#38BDF8]/10 border border-accent/30 dark:border-[#38BDF8]/30 text-accent dark:text-[#38BDF8]">Fast Velocity</span>
          </div>
          <p className="text-xl font-mono font-bold text-accent dark:text-[#38BDF8] mt-1">4m 12s</p>
          <span className="text-[9px] text-text-dim dark:text-[#94A3B8] pt-1 border-t border-border-soft dark:border-[#1E293B] block">Sector 4 urban average</span>
        </div>

        <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-text-dim dark:text-[#94A3B8] uppercase">Division Caseload</span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-400">Active Queue</span>
          </div>
          <p className="text-xl font-mono font-bold text-text dark:text-[#F8FAFC] mt-1">61 Active FIRs</p>
          <span className="text-[9px] text-text-dim dark:text-[#94A3B8] pt-1 border-t border-border-soft dark:border-[#1E293B] block">15.2 FIRs / officer avg</span>
        </div>

        <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-text-dim dark:text-[#94A3B8] uppercase">Charge Sheet SLA</span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">92.0% On-Time</span>
          </div>
          <p className="text-xl font-mono font-bold text-amber-400 mt-1">92.0%</p>
          <span className="text-[9px] text-text-dim dark:text-[#94A3B8] pt-1 border-t border-border-soft dark:border-[#1E293B] block">60-day statutory quota</span>
        </div>
      </div>

      {/* ── SEARCH & FILTER CONTROLS ── */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-dim dark:text-[#94A3B8]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search inspector by name, badge ID, station or specialization..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] text-xs text-text dark:text-[#F8FAFC] placeholder:text-text-dim dark:placeholder:text-[#94A3B8] outline-none focus:border-accent dark:focus:border-[#38BDF8] font-mono"
          />
        </div>

        <select
          value={stationFilter}
          onChange={(e) => setStationFilter(e.target.value)}
          className="px-3.5 py-2 rounded-lg bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] text-xs font-mono text-text dark:text-[#F8FAFC] outline-none focus:border-accent dark:focus:border-[#38BDF8]"
        >
          <option value="ALL">All Stations (4)</option>
          <option value="Khandagiri">Khandagiri PS</option>
          <option value="Cuttack">Cuttack Badambadi PS</option>
          <option value="Saheed Nagar">Saheed Nagar PS</option>
          <option value="Jatni">Jatni Rural PS</option>
        </select>
      </div>

      {/* ── MAIN 2-COLUMN INSPECTOR ROSTER & CASE BACKLOG DETAILS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start font-mono">
        
        {/* Left Column: Officer Scorecards List (7 cols) */}
        <div className="lg:col-span-7 bg-surface dark:bg-[#0B0F17] p-4 rounded-xl border border-border-soft dark:border-[#1E293B] space-y-3 shadow-xs">
          <h3 className="text-xs font-mono font-bold text-accent dark:text-[#38BDF8] uppercase tracking-wider flex items-center gap-2 border-b border-border-soft dark:border-[#1E293B] pb-2.5">
            <Users size={14} /> Inspector Duty Roster & Workload Scorecards
          </h3>

          <div className="space-y-2.5">
            {filteredOfficers.map((officer) => {
              const isSelected = selectedOfficer.officer_id === officer.officer_id;

              return (
                <div
                  key={officer.officer_id}
                  onClick={() => setSelectedOfficer(officer)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                    isSelected
                      ? 'bg-accent/10 dark:bg-[#38BDF8]/10 border-accent dark:border-[#38BDF8] shadow-xs'
                      : 'bg-surface-2 dark:bg-[#0E1422] border-border-soft dark:border-[#1E293B] hover:border-accent/50 dark:hover:border-[#38BDF8]/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-surface dark:bg-[#0B0F17] text-accent dark:text-[#38BDF8] font-bold text-xs flex items-center justify-center border border-accent/30 dark:border-[#38BDF8]/30">
                        {officer.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-text dark:text-[#F8FAFC] flex items-center gap-2">
                          {officer.name}
                          <span className="text-[10px] text-text-dim dark:text-[#94A3B8]">({officer.officer_id})</span>
                        </h4>
                        <p className="text-[11px] text-text-dim dark:text-[#94A3B8] flex items-center gap-1 mt-0.5">
                          <Building2 size={12} className="text-accent dark:text-[#38BDF8]" />
                          {officer.station} · {officer.specialization}
                        </p>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      officer.status.includes('Optimal')
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    }`}>
                      {officer.status}
                    </span>
                  </div>

                  {/* Performance Progress Bars */}
                  <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border-soft dark:border-[#1E293B] text-xs">
                    <div>
                      <span className="text-[9px] text-text-dim dark:text-[#94A3B8] block uppercase">Clearance Rate</span>
                      <span className="font-bold text-emerald-400">{officer.clearance_rate}%</span>
                      <div className="w-full h-1.5 rounded-full bg-surface dark:bg-[#0B0F17] mt-1 overflow-hidden border border-border-soft dark:border-[#1E293B]">
                        <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${officer.clearance_rate}%` }} />
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] text-text-dim dark:text-[#94A3B8] block uppercase">Active FIRs</span>
                      <span className="font-bold text-accent dark:text-[#38BDF8]">{officer.active_cases} / 20</span>
                      <div className="w-full h-1.5 rounded-full bg-surface dark:bg-[#0B0F17] mt-1 overflow-hidden border border-border-soft dark:border-[#1E293B]">
                        <div className={`h-full rounded-full ${officer.active_cases > 18 ? 'bg-rose-400' : 'bg-accent dark:bg-[#38BDF8]'}`} style={{ width: `${(officer.active_cases / 20) * 100}%` }} />
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] text-text-dim dark:text-[#94A3B8] block uppercase">SLA Compliance</span>
                      <span className="font-bold text-amber-400">{officer.sla_compliance}%</span>
                      <div className="w-full h-1.5 rounded-full bg-surface dark:bg-[#0B0F17] mt-1 overflow-hidden border border-border-soft dark:border-[#1E293B]">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${officer.sla_compliance}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Inspector Backlog Drilldown (5 cols) */}
        <div className="lg:col-span-5 bg-surface dark:bg-[#0B0F17] p-4 rounded-xl border border-border-soft dark:border-[#1E293B] space-y-3 shadow-xs text-xs">
          <div className="border-b border-border-soft dark:border-[#1E293B] pb-2.5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-text dark:text-[#F8FAFC]">{selectedOfficer.name} · Dossier</h3>
              <p className="text-[11px] text-text-dim dark:text-[#94A3B8] mt-0.5">{selectedOfficer.station}</p>
            </div>
            <div className="text-right">
              <span className="text-emerald-400 font-bold text-xs block">{selectedOfficer.closed_cases_month} Closed</span>
              <span className="text-[9px] text-text-dim dark:text-[#94A3B8]">this month</span>
            </div>
          </div>

          {/* Contact Details */}
          <div className="p-3 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-text-dim dark:text-[#94A3B8]">PHONE:</span>
              <span className="font-bold text-text dark:text-[#F8FAFC]">{selectedOfficer.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-dim dark:text-[#94A3B8]">EMAIL:</span>
              <span className="font-bold text-text dark:text-[#F8FAFC] truncate max-w-[180px]">{selectedOfficer.email}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-border-soft dark:border-[#1E293B]">
              <span className="text-text-dim dark:text-[#94A3B8]">JOINED STATION:</span>
              <span className="font-bold text-accent dark:text-[#38BDF8]">{selectedOfficer.joined_station}</span>
            </div>
          </div>

          {/* Active Cases Backlog Stream */}
          <div className="space-y-2">
            <span className="font-bold text-accent dark:text-[#38BDF8] text-xs block uppercase tracking-wider">Assigned Active FIR Backlog:</span>
            {selectedOfficer.recent_cases.map((c, idx) => (
              <div key={idx} className="p-2.5 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-accent dark:text-[#38BDF8]">{c.case_number}</span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                    c.sla_status.includes('Critical') 
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  }`}>
                    {c.sla_status}
                  </span>
                </div>
                <p className="text-text dark:text-[#F8FAFC] text-[11px] font-bold font-sans">{c.crime_type}</p>
                <div className="flex justify-between text-[10px] text-text-dim dark:text-[#94A3B8] pt-1 border-t border-border-soft dark:border-[#1E293B]">
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
