import React, { useState } from 'react';
import { 
  ClipboardCheck, ShieldAlert, CheckCircle2, XCircle, FileText, 
  AlertTriangle, Clock, Send, Building, UserCheck, Search, Filter, HelpCircle 
} from 'lucide-react';

interface SanctionRequest {
  id: string;
  firNumber: string;
  requestType: string;
  suspectName: string;
  policeStation: string;
  investigatingOfficer: string;
  timestamp: string;
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  summary: string;
  status: 'PENDING_SANCTION' | 'APPROVED';
}

const DEMO_SANCTIONS: SanctionRequest[] = [
  {
    id: 'SANC-2026-0891',
    firNumber: 'FIR-2026-00541',
    requestType: 'Sec 110 BNSS Mule Account Freezing & Search Warrant',
    suspectName: 'Rajesh Kumar ("Bullet Ramesh")',
    policeStation: 'Khandagiri PS',
    investigatingOfficer: 'Ins. S. Pattnaik',
    timestamp: 'Today, 14:20 IST',
    urgency: 'CRITICAL',
    summary: 'Mule bank account pass-through transaction of ₹3.2 Lakhs identified within 45 mins of commercial heist. Immediate freeze required under SP statutory powers.',
    status: 'PENDING_SANCTION'
  },
  {
    id: 'SANC-2026-0874',
    firNumber: 'FIR-2026-00142',
    requestType: 'Odisha Goonda Act Detention Order',
    suspectName: 'Rakesh Swain ("Kalia")',
    policeStation: 'Saheed Nagar PS',
    investigatingOfficer: 'Sub-Ins. R. Das',
    timestamp: 'Today, 11:15 IST',
    urgency: 'HIGH',
    summary: 'Repeat offender with 4 prior extortion dockets. FSL ballistics matching recovered country firearm to Unit IV incident scene.',
    status: 'PENDING_SANCTION'
  },
  {
    id: 'SANC-2026-0850',
    firNumber: 'FIR-2026-00981',
    requestType: 'Tower-Dump CDR Special Intercept Order',
    suspectName: 'Unidentified Syndicate ("Badambadi Heist")',
    policeStation: 'Cuttack Badambadi PS',
    investigatingOfficer: 'Ins. M. Mohanty',
    timestamp: 'Yesterday, 18:40 IST',
    urgency: 'HIGH',
    summary: 'Cellular tower dump analysis of 3 BTS nodes adjacent to Badambadi jewelry vault during 02:00-04:00 window.',
    status: 'APPROVED'
  }
];

export function SupervisorApprovalsPage() {
  const [sanctions, setSanctions] = useState<SanctionRequest[]>(DEMO_SANCTIONS);
  const [selectedSanction, setSelectedSanction] = useState<SanctionRequest>(DEMO_SANCTIONS[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [actionSuccess, setActionSuccess] = useState('');

  const filteredSanctions = sanctions.filter((s) => {
    const matchesSearch =
      s.suspectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.firNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.policeStation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'ALL' || s.status === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleApprove = (sanc: SanctionRequest) => {
    setSanctions(prev => prev.map(x => x.id === sanc.id ? { ...x, status: 'APPROVED' } : x));
    setSelectedSanction(prev => ({ ...prev, status: 'APPROVED' }));
    setActionSuccess(`Granted SP Statutory Clearance for ${sanc.requestType} against ${sanc.suspectName}`);
    setTimeout(() => setActionSuccess(''), 4500);
  };

  const handleReject = (sanc: SanctionRequest) => {
    setSanctions(prev => prev.filter(x => x.id !== sanc.id));
    setActionSuccess(`Rejected sanction request for ${sanc.firNumber}. Sent back to ${sanc.investigatingOfficer}.`);
    setTimeout(() => setActionSuccess(''), 4500);
  };

  const handleRequestEvidence = (sanc: SanctionRequest) => {
    setActionSuccess(`Requested additional call data records (CDR) & FSL evidence from ${sanc.investigatingOfficer}.`);
    setTimeout(() => setActionSuccess(''), 4500);
  };

  const pendingCount = sanctions.filter(s => s.status === 'PENDING_SANCTION').length;

  return (
    <div className="max-w-[1520px] mx-auto space-y-4 font-sans select-none text-text dark:text-[#F8FAFC] pb-24">
      {/* ── UNIFIED COMMAND-CENTER HEADER ── */}
      <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-3.5 sm:p-4 shadow-xs dark:shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-2 dark:bg-[#0E1422] border border-accent/40 dark:border-[#38BDF8]/40 flex items-center justify-center text-accent dark:text-[#38BDF8] shadow-xs shrink-0">
              <ClipboardCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-accent dark:text-[#38BDF8]">
                  SP STATUTORY DESK
                </span>
                <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  STATEWIDE WARRANTS
                </span>
                {pendingCount > 0 && (
                  <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400">
                    {pendingCount} AWAITING SIGNATURE
                  </span>
                )}
              </div>
              <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-text dark:text-[#F8FAFC] mt-0.5">
                Sanctions & Statutory Warrants Clearance Queue
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-xs font-mono font-bold text-rose-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>{pendingCount} Pending Review</span>
            </span>
          </div>
        </div>
      </div>

      {/* ACTION NOTIFICATION */}
      {actionSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* SEARCH & FILTER */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-dim dark:text-[#94A3B8]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by suspect name, FIR number, or police station..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] text-xs text-text dark:text-[#F8FAFC] placeholder:text-text-dim dark:placeholder:text-[#94A3B8] outline-none focus:border-accent dark:focus:border-[#38BDF8] font-mono"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 rounded-lg bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] text-xs font-mono text-text dark:text-[#F8FAFC] outline-none"
        >
          <option value="ALL">All Requests ({sanctions.length})</option>
          <option value="PENDING_SANCTION">Pending Signature</option>
          <option value="APPROVED">Approved</option>
        </select>
      </div>

      {/* MAIN 2-COLUMN CONSOLE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start font-mono text-xs">
        
        {/* Left Column: Docket List (7 cols) */}
        <div className="lg:col-span-7 space-y-2.5">
          {filteredSanctions.map((sanc) => {
            const isSelected = selectedSanction?.id === sanc.id;

            return (
              <div
                key={sanc.id}
                onClick={() => setSelectedSanction(sanc)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                  isSelected
                    ? 'bg-accent/15 dark:bg-[#38BDF8]/15 border-accent dark:border-[#38BDF8] shadow-xs'
                    : 'bg-surface dark:bg-[#0B0F17] border-border-soft dark:border-[#1E293B] hover:bg-surface-hover dark:hover:bg-[#151D2E]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                      sanc.urgency === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {sanc.urgency}
                    </span>
                    <span className="font-bold text-accent dark:text-[#38BDF8]">{sanc.firNumber}</span>
                  </div>
                  <span className="text-[10px] text-text-dim dark:text-[#94A3B8]">{sanc.timestamp}</span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-text dark:text-[#F8FAFC]">{sanc.requestType}</h4>
                  <p className="text-[11px] text-text-dim dark:text-[#94A3B8] mt-0.5">
                    Suspect: <strong className="text-text dark:text-[#F8FAFC]">{sanc.suspectName}</strong> · Station: {sanc.policeStation}
                  </p>
                  <p className="text-[10px] text-text-dim dark:text-[#94A3B8] mt-1 leading-relaxed">
                    {sanc.summary}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border-soft/60 dark:border-[#1E293B] text-[10px]">
                  <span className="text-text-dim dark:text-[#94A3B8]">IO: {sanc.investigatingOfficer}</span>
                  {sanc.status === 'PENDING_SANCTION' ? (
                    <span className="text-rose-400 font-bold flex items-center gap-1">
                      <Clock size={11} /> Awaiting Sign-off
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 size={11} /> Sanction Granted
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: SP Executive Review Console (5 cols) */}
        <div className="lg:col-span-5 bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-4 sm:p-5 space-y-3.5 shadow-xs dark:shadow-2xl">
          {selectedSanction ? (
            <>
              <div className="border-b border-border-soft dark:border-[#1E293B] pb-2.5">
                <span className="text-[10px] font-bold text-accent dark:text-[#38BDF8] uppercase tracking-wider block">SP STATUTORY REVIEW</span>
                <h3 className="text-sm font-bold text-text dark:text-[#F8FAFC] mt-0.5">Docket #{selectedSanction.id}</h3>
              </div>

              <div className="p-3 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-text-dim dark:text-[#94A3B8]">STATUTORY POWER:</span>
                  <span className="font-bold text-text dark:text-[#F8FAFC] text-right max-w-[200px]">{selectedSanction.requestType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-dim dark:text-[#94A3B8]">TARGET SUSPECT:</span>
                  <span className="font-bold text-rose-400">{selectedSanction.suspectName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-dim dark:text-[#94A3B8]">ORIGINATING PS:</span>
                  <span className="font-bold text-text dark:text-[#F8FAFC]">{selectedSanction.policeStation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-dim dark:text-[#94A3B8]">INVESTIGATING OFFICER:</span>
                  <span className="font-bold text-accent dark:text-[#38BDF8]">{selectedSanction.investigatingOfficer}</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-text dark:text-[#F8FAFC] block mb-1 text-[11px]">EVIDENTIARY GROUNDS:</span>
                <p className="text-[10px] text-text-dim dark:text-[#94A3B8] bg-surface-2 dark:bg-[#0E1422] p-2.5 rounded-lg border border-border-soft dark:border-[#1E293B] leading-relaxed">
                  {selectedSanction.summary}
                </p>
              </div>

              {selectedSanction.status === 'PENDING_SANCTION' ? (
                <div className="space-y-2 pt-2 border-t border-border-soft dark:border-[#1E293B]">
                  <button
                    onClick={() => handleApprove(selectedSanction)}
                    className="w-full py-2 rounded-lg bg-accent text-bg dark:bg-[#38BDF8] dark:text-[#070A0F] font-bold font-mono text-xs hover:bg-accent-bright dark:hover:bg-[#0284C7] transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer uppercase"
                  >
                    <CheckCircle2 size={15} />
                    <span>AUTHORIZE & GRANT CLEARANCE</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleRequestEvidence(selectedSanction)}
                      className="py-1.5 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-text-dim dark:text-[#94A3B8] hover:text-text dark:hover:text-[#F8FAFC] font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer uppercase"
                    >
                      <HelpCircle size={11} className="text-accent dark:text-[#38BDF8]" />
                      <span>Request Evidence</span>
                    </button>
                    <button
                      onClick={() => handleReject(selectedSanction)}
                      className="py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer uppercase"
                    >
                      <XCircle size={11} />
                      <span>Reject Docket</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-center text-xs">
                  ✓ Formally cleared and signed under SP executive seal.
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center text-text-dim dark:text-[#94A3B8] text-xs">
              Select a warrant from the queue to review evidentiary grounds and grant statutory sign-offs.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
