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
    <div className="p-4 sm:p-6 space-y-6 font-sans bg-bg min-h-screen text-text select-none">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass p-4 rounded-2xl bg-surface/90 border border-border-strong shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-brand/20 border border-brand/40 flex items-center justify-center text-brand">
              <CheckSquare size={18} />
            </div>
            <h1 className="text-xl font-bold font-mono text-text uppercase tracking-wider">
              CASE ASSIGNMENT & WORKLOAD BALANCER
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-brand/20 text-brand border border-brand/30">
              STATE COMMAND ALLOCATION
            </span>
          </div>
          <p className="text-xs text-text-dim">
            Odisha State Police · Sector 4 Unassigned FIRs, AI Inspector Matching & Rebalancing
          </p>
        </div>

        <button
          onClick={handleRebalance}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand text-bg font-bold font-mono text-xs hover:bg-brand-bright transition-all shadow-md cursor-pointer"
        >
          <Sparkles size={14} />
          <span>AI REBALANCE WORKLOAD</span>
        </button>
      </div>

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MAIN 2-COLUMN CONSOLE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-mono text-xs">
        
        {/* Left Column: Unassigned Incoming FIR Queue (7 cols) */}
        <div className="lg:col-span-7 glass p-5 rounded-2xl bg-surface/90 border border-border-soft space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-border-soft pb-2.5">
            <span className="text-xs font-mono font-bold text-brand uppercase tracking-wider flex items-center gap-1.5">
              <CheckSquare size={14} /> UNASSIGNED INCOMING FIRS ({cases.length})
            </span>
            <span className="text-[10px] font-mono text-text-dim">Auto-prioritized by AI</span>
          </div>

          {cases.length === 0 ? (
            <div className="py-16 text-center text-text-dim text-xs flex flex-col items-center gap-2">
              <CheckCircle2 size={32} className="text-emerald-400" />
              <span>All incoming FIRs have been assigned across division stations.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {cases.map((c) => {
                const isSelected = selectedCase?.fir_number === c.fir_number;

                return (
                  <div
                    key={c.fir_number}
                    onClick={() => setSelectedCase(c)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                      isSelected
                        ? 'bg-brand/20 border-brand shadow-md'
                        : 'bg-surface-2 border-border-soft hover:bg-surface-hover'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-brand">{c.fir_number}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                          c.priority === 'CRITICAL' ? 'bg-danger/20 text-danger-bright' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {c.priority}
                        </span>
                      </div>
                      <span className="text-[10px] text-text-faint">{c.filed_at}</span>
                    </div>

                    <p className="text-xs font-bold text-text">{c.crime_type}</p>
                    <p className="text-[10px] text-text-dim leading-relaxed">{c.description}</p>

                    <div className="flex items-center justify-between pt-2 border-t border-border-soft/60 text-[10px]">
                      <span className="text-text-dim flex items-center gap-1">
                        <Building2 size={12} className="text-brand" />
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
        <div className="lg:col-span-5 glass p-5 rounded-2xl bg-surface/90 border border-border-strong space-y-4 shadow-xl">
          {selectedCase ? (
            <>
              <div className="border-b border-border-soft pb-2.5">
                <span className="text-[10px] font-bold text-brand uppercase tracking-wider block">AI MATCHING ENGINE</span>
                <h3 className="text-base font-bold text-text mt-0.5">Assignment: {selectedCase.fir_number}</h3>
              </div>

              {/* Recommended Match Card */}
              <div className="p-4 rounded-xl bg-surface-2 border border-brand/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text flex items-center gap-1.5">
                    <Sparkles size={14} className="text-brand" /> Top Recommended Inspector
                  </span>
                  <span className="text-xs font-bold text-emerald-400 font-mono">
                    {selectedCase.recommended_officer.match_score}% Match Score
                  </span>
                </div>

                <div className="pt-1">
                  <p className="text-sm font-bold text-text">{selectedCase.recommended_officer.name}</p>
                  <p className="text-[10px] text-text-dim">
                    {selectedCase.recommended_officer.station} · Current Load: {selectedCase.recommended_officer.current_load} FIRs
                  </p>
                </div>

                <p className="text-[10px] text-text-dim bg-surface/80 p-2.5 rounded-lg border border-border-soft leading-relaxed">
                  💡 <strong>Rationale:</strong> {selectedCase.recommended_officer.match_reason}
                </p>

                <button
                  onClick={() => handleAssign(selectedCase.fir_number, selectedCase.recommended_officer.name)}
                  className="w-full py-2.5 rounded-xl bg-brand text-bg font-bold font-mono text-xs hover:bg-brand-bright transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer mt-2"
                >
                  <CheckCircle2 size={16} />
                  <span>Assign to {selectedCase.recommended_officer.name}</span>
                </button>
              </div>

              {/* Manual Reassignment Dropdown */}
              <div className="space-y-2 pt-2 border-t border-border-soft">
                <span className="text-[11px] text-text-dim font-bold block">MANUAL INSPECTOR REASSIGNMENT:</span>
                <select
                  value={chosenOfficerId}
                  onChange={(e) => setChosenOfficerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-border-soft text-xs font-mono text-text outline-none focus:border-brand"
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
                    className="w-full py-2 rounded-xl bg-surface-2 border border-border-soft text-brand font-bold text-xs hover:bg-surface-hover transition-colors cursor-pointer"
                  >
                    Confirm Manual Assignment
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-text-dim text-xs">
              Select an unassigned FIR from the queue to view AI matching scores and assign an inspector.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
