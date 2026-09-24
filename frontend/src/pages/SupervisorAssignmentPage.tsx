import React, { useState } from 'react';
import { 
  CheckSquare, Sparkles, Users, Building2, AlertCircle, CheckCircle2, 
  ArrowRight, Shield, Clock, Search, Filter, RefreshCw, Scale 
} from 'lucide-react';

interface UnassignedCase {
  fir_number: string;
  crime_type: string;
  station: string;
  filed_at: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  description: string;
  recommended_officer: {
    officer_id: string;
    name: string;
    station: string;
    current_load: number;
    match_score: number;
    match_reason: string;
  };
}

const INITIAL_UNASSIGNED: UnassignedCase[] = [
  {
    fir_number: 'FIR-2026-00541',
    crime_type: 'Commercial Heist & Pass-Through Money Trail',
    station: 'Khandagiri PS',
    filed_at: 'Today, 14:15 IST',
    priority: 'HIGH',
    description: 'Pass-through mule account forwarded 96% of ₹3.2 Lakhs within 45 minutes; vehicle OD-02-AB-1234 flagged.',
    recommended_officer: {
      officer_id: 'OP-BBSR-104',
      name: 'Ins. S. Pattnaik',
      station: 'Khandagiri PS',
      current_load: 14,
      match_score: 96,
      match_reason: 'Domain specialist in commercial robbery syndicates; 94.2% clearance rate and stationed in Khandagiri.',
    },
  },
  {
    fir_number: 'FIR-2026-00142',
    crime_type: 'Unit IV Warehouse Robbery & Weapon Recovery',
    station: 'Saheed Nagar PS',
    filed_at: 'Today, 15:30 IST',
    priority: 'CRITICAL',
    description: 'Forced entry via rear ventilation shutters; 72hr statutory forensic FSL clock active.',
    recommended_officer: {
      officer_id: 'OP-KHD-405',
      name: 'Sub-Ins. R. Das',
      station: 'Jatni Rural PS (Adjacent)',
      current_load: 12,
      match_score: 92,
      match_reason: 'Lowest active caseload (12 FIRs), 83.4% clearance velocity; relieves overloaded Saheed Nagar officer.',
    },
  },
  {
    fir_number: 'FIR-2026-00981',
    crime_type: 'Badambadi Jewelry Heist & Fence Intercept',
    station: 'Cuttack Badambadi PS',
    filed_at: 'Today, 16:40 IST',
    priority: 'MEDIUM',
    description: 'Gold bullion stolen from vault; CCTV DVR power supply disabled before entry.',
    recommended_officer: {
      officer_id: 'OP-CTC-208',
      name: 'Ins. M. Mohanty',
      station: 'Cuttack Badambadi PS',
      current_load: 16,
      match_score: 88,
      match_reason: 'Lead investigator for financial & burglary cell; Cuttack City jurisdiction match.',
    },
  },
];

const AVAILABLE_OFFICERS = [
  { id: 'OP-BBSR-104', name: 'Ins. S. Pattnaik (Khandagiri PS · 14 Cases)' },
  { id: 'OP-KHD-405', name: 'Sub-Ins. R. Das (Jatni Rural PS · 12 Cases · Recommended)' },
  { id: 'OP-CTC-208', name: 'Ins. M. Mohanty (Cuttack Badambadi PS · 16 Cases)' },
  { id: 'OP-BBSR-312', name: 'Ins. B. Swain (Saheed Nagar PS · 19 Cases · Overloaded)' },
];

export function SupervisorAssignmentPage() {
  const [cases, setCases] = useState<UnassignedCase[]>(INITIAL_UNASSIGNED);
  const [selectedCase, setSelectedCase] = useState<UnassignedCase | null>(INITIAL_UNASSIGNED[0]);
  const [chosenOfficerId, setChosenOfficerId] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const handleAssign = (firNumber: string, officerName: string) => {
    setCases((prev) => prev.filter((c) => c.fir_number !== firNumber));
    setToastMessage(`Assigned ${firNumber} to ${officerName}. CCTNS docket updated.`);
    setSelectedCase(cases.find((c) => c.fir_number !== firNumber) || null);
    setTimeout(() => setToastMessage(''), 4500);
  };

  const handleRebalance = () => {
    setToastMessage('AI Workload Balancing complete: 4 active FIRs reallocated from Saheed Nagar to Jatni Rural PS.');
    setTimeout(() => setToastMessage(''), 4500);
  };

  return (
    <div className="max-w-[1520px] mx-auto p-4 sm:p-6 space-y-4 font-sans select-none text-text dark:text-[#F8FAFC] pb-24">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-4 shadow-xs dark:shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-2 dark:bg-[#0E1422] border border-accent/40 dark:border-[#38BDF8]/40 flex items-center justify-center text-accent dark:text-[#38BDF8] shadow-xs">
            <CheckSquare size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold font-mono text-text dark:text-[#F8FAFC] uppercase tracking-wider">
                Case Assignment & Workload Balancer
              </h1>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-accent/10 dark:bg-[#38BDF8]/10 text-accent dark:text-[#38BDF8] border border-accent/20 dark:border-[#38BDF8]/20">
                STATE ALLOCATION
              </span>
            </div>
            <p className="text-xs text-text-dim dark:text-[#94A3B8]">
              Odisha State Police · Sector 4 Unassigned FIRs, AI Inspector Matching & Rebalancing Engine
            </p>
          </div>
        </div>

        <button
          onClick={handleRebalance}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent hover:bg-accent-bright dark:bg-[#38BDF8] dark:hover:bg-[#0284C7] text-bg dark:text-[#070A0F] font-bold font-mono text-xs uppercase transition-all shadow-xs cursor-pointer"
        >
          <Sparkles size={14} />
          <span>AI Rebalance Workload</span>
        </button>
      </div>

      {/* KPI METRIC STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[10px] font-mono text-text-dim dark:text-[#94A3B8] uppercase">Pending Assignments</span>
          <div className="text-xl font-mono font-bold text-text dark:text-[#F8FAFC] mt-1">{cases.length} FIRs</div>
          <span className="text-[9px] font-mono text-amber-400 mt-0.5">High / Critical Priority</span>
        </div>
        <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[10px] font-mono text-text-dim dark:text-[#94A3B8] uppercase">Available Inspectors</span>
          <div className="text-xl font-mono font-bold text-accent dark:text-[#38BDF8] mt-1">4 Officers</div>
          <span className="text-[9px] font-mono text-emerald-400 mt-0.5">Avg Load: 15.2 FIRs</span>
        </div>
        <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[10px] font-mono text-text-dim dark:text-[#94A3B8] uppercase">Matching Precision</span>
          <div className="text-xl font-mono font-bold text-emerald-400 mt-1">94.8%</div>
          <span className="text-[9px] font-mono text-text-dim dark:text-[#94A3B8] mt-0.5">Domain + Velocity Match</span>
        </div>
        <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[10px] font-mono text-text-dim dark:text-[#94A3B8] uppercase">Allocation Status</span>
          <div className="text-xl font-mono font-bold text-emerald-400 mt-1">Optimal</div>
          <span className="text-[9px] font-mono text-text-dim dark:text-[#94A3B8] mt-0.5">Automated Queue Active</span>
        </div>
      </div>

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MAIN 2-COLUMN CONSOLE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start font-mono text-xs">
        
        {/* Left Column: Unassigned Incoming FIR Queue (7 cols) */}
        <div className="lg:col-span-7 bg-surface dark:bg-[#0B0F17] p-4 rounded-xl border border-border-soft dark:border-[#1E293B] space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-border-soft dark:border-[#1E293B] pb-2.5">
            <span className="text-xs font-mono font-bold text-accent dark:text-[#38BDF8] uppercase tracking-wider flex items-center gap-1.5">
              <CheckSquare size={14} /> Unassigned Incoming FIRs ({cases.length})
            </span>
            <span className="text-[10px] font-mono text-text-dim dark:text-[#94A3B8]">Auto-prioritized by AI</span>
          </div>

          {cases.length === 0 ? (
            <div className="py-16 text-center text-text-dim dark:text-[#94A3B8] text-xs flex flex-col items-center gap-2">
              <CheckCircle2 size={32} className="text-emerald-400" />
              <span>All incoming FIRs have been assigned across division stations.</span>
            </div>
          ) : (
            <div className="space-y-2.5">
              {cases.map((c) => {
                const isSelected = selectedCase?.fir_number === c.fir_number;

                return (
                  <div
                    key={c.fir_number}
                    onClick={() => setSelectedCase(c)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                      isSelected
                        ? 'bg-accent/10 dark:bg-[#38BDF8]/10 border-accent dark:border-[#38BDF8] shadow-xs'
                        : 'bg-surface-2 dark:bg-[#0E1422] border-border-soft dark:border-[#1E293B] hover:border-accent/50 dark:hover:border-[#38BDF8]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-accent dark:text-[#38BDF8]">{c.fir_number}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          c.priority === 'CRITICAL' 
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
                            : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        }`}>
                          {c.priority}
                        </span>
                      </div>
                      <span className="text-[10px] text-text-dim dark:text-[#94A3B8]">{c.filed_at}</span>
                    </div>

                    <p className="text-xs font-bold text-text dark:text-[#F8FAFC]">{c.crime_type}</p>
                    <p className="text-[11px] text-text-dim dark:text-[#94A3B8] leading-relaxed font-sans">{c.description}</p>

                    <div className="flex items-center justify-between pt-2 border-t border-border-soft dark:border-[#1E293B] text-[10px]">
                      <span className="text-text-dim dark:text-[#94A3B8] flex items-center gap-1">
                        <Building2 size={12} className="text-accent dark:text-[#38BDF8]" />
                        {c.station}
                      </span>

                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <Sparkles size={12} />
                        Match: {c.recommended_officer.name} ({c.recommended_officer.match_score}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: AI Match Recommendation & One-Click Assignment (5 cols) */}
        <div className="lg:col-span-5 bg-surface dark:bg-[#0B0F17] p-4 rounded-xl border border-border-soft dark:border-[#1E293B] space-y-4 shadow-xs">
          {selectedCase ? (
            <>
              <div className="border-b border-border-soft dark:border-[#1E293B] pb-2.5">
                <span className="text-[10px] font-bold text-accent dark:text-[#38BDF8] uppercase tracking-wider block">AI Matching Engine</span>
                <h3 className="text-sm font-bold text-text dark:text-[#F8FAFC] mt-0.5">Assignment: {selectedCase.fir_number}</h3>
              </div>

              {/* Recommended Match Card */}
              <div className="p-3.5 rounded-xl bg-surface-2 dark:bg-[#0E1422] border border-accent/30 dark:border-[#38BDF8]/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text dark:text-[#F8FAFC] flex items-center gap-1.5">
                    <Sparkles size={14} className="text-accent dark:text-[#38BDF8]" /> Recommended Lead Inspector
                  </span>
                  <span className="text-xs font-bold text-emerald-400 font-mono">
                    {selectedCase.recommended_officer.match_score}% Match Score
                  </span>
                </div>

                <div className="pt-1">
                  <p className="text-sm font-bold text-text dark:text-[#F8FAFC]">{selectedCase.recommended_officer.name}</p>
                  <p className="text-[10px] text-text-dim dark:text-[#94A3B8]">
                    {selectedCase.recommended_officer.station} · Current Load: {selectedCase.recommended_officer.current_load} FIRs
                  </p>
                </div>

                <p className="text-[11px] text-text-dim dark:text-[#94A3B8] bg-surface dark:bg-[#0B0F17] p-2.5 rounded-lg border border-border-soft dark:border-[#1E293B] leading-relaxed font-sans">
                  💡 <strong className="text-text dark:text-[#F8FAFC]">Rationale:</strong> {selectedCase.recommended_officer.match_reason}
                </p>

                <button
                  onClick={() => handleAssign(selectedCase.fir_number, selectedCase.recommended_officer.name)}
                  className="w-full py-2.5 rounded-lg bg-accent hover:bg-accent-bright dark:bg-[#38BDF8] dark:hover:bg-[#0284C7] text-bg dark:text-[#070A0F] font-bold font-mono text-xs uppercase flex items-center justify-center gap-2 shadow-xs cursor-pointer mt-2"
                >
                  <CheckCircle2 size={16} />
                  <span>Assign to {selectedCase.recommended_officer.name}</span>
                </button>
              </div>

              {/* Manual Reassignment Dropdown */}
              <div className="space-y-2 pt-2 border-t border-border-soft dark:border-[#1E293B]">
                <span className="text-[11px] text-text-dim dark:text-[#94A3B8] font-bold block uppercase tracking-wider">Manual Inspector Override:</span>
                <select
                  value={chosenOfficerId}
                  onChange={(e) => setChosenOfficerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-xs font-mono text-text dark:text-[#F8FAFC] outline-none focus:border-accent dark:focus:border-[#38BDF8]"
                >
                  <option value="">Select Alternative Officer...</option>
                  {AVAILABLE_OFFICERS.map((off) => (
                    <option key={off.id} value={off.id}>{off.name}</option>
                  ))}
                </select>

                {chosenOfficerId && (
                  <button
                    onClick={() => {
                      const offName = AVAILABLE_OFFICERS.find((o) => o.id === chosenOfficerId)?.name || chosenOfficerId;
                      handleAssign(selectedCase.fir_number, offName);
                    }}
                    className="w-full py-2 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-accent/40 dark:border-[#38BDF8]/40 text-accent dark:text-[#38BDF8] font-bold text-xs uppercase hover:bg-accent/10 dark:hover:bg-[#38BDF8]/10 transition-colors cursor-pointer"
                  >
                    Confirm Manual Assignment
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-text-dim dark:text-[#94A3B8] text-xs">
              Select an unassigned FIR from the queue to view AI matching scores and assign an inspector.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
