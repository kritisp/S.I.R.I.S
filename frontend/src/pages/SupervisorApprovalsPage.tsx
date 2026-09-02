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
    <div className="p-4 sm:p-6 space-y-6 font-sans bg-bg min-h-screen text-text select-none">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass p-4 rounded-2xl bg-surface/90 border border-border-strong shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-brand/20 border border-brand/40 flex items-center justify-center text-brand">
              <ClipboardCheck size={18} />
            </div>
            <h1 className="text-xl font-bold font-mono text-text uppercase tracking-wider">
              SANCTIONS & WARRANTS CLEARANCE QUEUE
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-brand/20 text-brand border border-brand/30">
              SP STATUTORY DESK
            </span>
          </div>
          <p className="text-xs text-text-dim">
            Odisha State Police · Superintendent of Police Statutory Approvals & Goonda Warrants
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-surface-2 border border-border-soft text-xs font-mono font-bold text-danger flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
            <span>{pendingCount} Awaiting Signature</span>
          </span>
        </div>
      </div>

      {/* ACTION NOTIFICATION */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* SEARCH & FILTER */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-dim" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by suspect name, FIR number, or police station..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-2 border border-border-soft text-xs text-text placeholder:text-text-faint outline-none focus:border-brand font-mono"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-surface-2 border border-border-soft text-xs font-mono text-text outline-none"
        >
          <option value="ALL">All Requests ({sanctions.length})</option>
          <option value="PENDING_SANCTION">Pending Signature</option>
          <option value="APPROVED">Approved</option>
        </select>
      </div>

      {/* MAIN 2-COLUMN CONSOLE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-mono text-xs">
        
        {/* Left Column: Docket List (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          {filteredSanctions.map((sanc) => {
            const isSelected = selectedSanction.id === sanc.id;

            return (
              <div
                key={sanc.id}
                onClick={() => setSelectedSanction(sanc)}
                className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                  isSelected
                    ? 'bg-brand/20 border-brand shadow-md'
                    : 'bg-surface-2 border-border-soft hover:bg-surface-hover'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                      sanc.urgency === 'CRITICAL' ? 'bg-danger/20 text-danger-bright' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {sanc.urgency}
                    </span>
                    <span className="font-bold text-brand">{sanc.firNumber}</span>
                  </div>
                  <span className="text-[10px] text-text-faint">{sanc.timestamp}</span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-text">{sanc.requestType}</h4>
                  <p className="text-xs text-text-dim mt-0.5">
                    Suspect: <strong className="text-text">{sanc.suspectName}</strong> · Station: {sanc.policeStation}
                  </p>
                  <p className="text-[10px] text-text-dim mt-1 leading-relaxed">
                    {sanc.summary}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border-soft/60 text-[10px]">
                  <span className="text-text-dim">IO: {sanc.investigatingOfficer}</span>
                  {sanc.status === 'PENDING_SANCTION' ? (
                    <span className="text-danger font-bold flex items-center gap-1">
                      <Clock size={12} /> Awaiting Sign-off
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 size={12} /> Sanction Granted
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: SP Executive Review Console (5 cols) */}
        <div className="lg:col-span-5 glass p-5 rounded-2xl bg-surface/90 border border-border-strong space-y-4 shadow-xl">
          {selectedSanction ? (
            <>
              <div className="border-b border-border-soft pb-2.5">
                <span className="text-[10px] font-bold text-brand uppercase tracking-wider block">SP STATUTORY REVIEW</span>
                <h3 className="text-base font-bold text-text mt-0.5">Docket #{selectedSanction.id}</h3>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-2 border border-border-soft space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-text-dim">STATUTORY POWER:</span>
                  <span className="font-bold text-text text-right max-w-[200px]">{selectedSanction.requestType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-dim">TARGET SUSPECT:</span>
                  <span className="font-bold text-danger">{selectedSanction.suspectName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-dim">ORIGINATING PS:</span>
                  <span className="font-bold text-text">{selectedSanction.policeStation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-dim">INVESTIGATING OFFICER:</span>
                  <span className="font-bold text-brand">{selectedSanction.investigatingOfficer}</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-text block mb-1">EVIDENTIARY GROUNDS & SUMMARY:</span>
                <p className="text-[10px] text-text-dim bg-surface/80 p-3 rounded-xl border border-border-soft leading-relaxed">
                  {selectedSanction.summary}
                </p>
              </div>

              {selectedSanction.status === 'PENDING_SANCTION' ? (
                <div className="space-y-2 pt-2 border-t border-border-soft">
                  <button
                    onClick={() => handleApprove(selectedSanction)}
                    className="w-full py-2.5 rounded-xl bg-brand text-bg font-bold font-mono text-xs hover:bg-brand-bright transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    <CheckCircle2 size={16} />
                    <span>AUTHORIZE & GRANT SP CLEARANCE</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleRequestEvidence(selectedSanction)}
                      className="py-2 rounded-xl bg-surface-2 border border-border-soft text-text-dim hover:text-text font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <HelpCircle size={12} className="text-brand" />
                      <span>Request Evidence</span>
                    </button>
                    <button
                      onClick={() => handleReject(selectedSanction)}
                      className="py-2 rounded-xl bg-danger/10 border border-danger/30 text-danger font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <XCircle size={12} />
                      <span>Reject Docket</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-center">
                  ✓ Formally cleared and signed under SP executive seal.
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center text-text-dim text-xs">
              Select a warrant from the queue to review evidentiary grounds and grant statutory sign-offs.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
