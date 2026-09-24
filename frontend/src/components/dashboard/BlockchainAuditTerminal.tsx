import React from 'react';
import { Terminal, ShieldCheck, Box, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function BlockchainAuditTerminal() {
  const terminalLines = [
    { text: '>> Ingesting case docket: FIR_2026_118.pdf [SHA-256: a3f6d...b7e9c] VERIFIED', color: 'text-emerald-600 dark:text-emerald-400' },
    { text: '>> Extracting case entities via Multi-Source Extraction Pipeline... 23 entities identified', color: 'text-text dark:text-[#E2E8F0]' },
    { text: '>> Resolving suspect aliases and deduplicating cross-station records... 2 profiles linked', color: 'text-accent dark:text-[#38BDF8]' },
    { text: '>> Updating state investigation graph... 102 nodes, 231 relationships committed', color: 'text-text dark:text-[#E2E8F0]' },
    { text: '>> Running network centrality & link analysis... COMPLETE', color: 'text-text dark:text-[#E2E8F0]' },
    { text: '>> Evaluating anomaly risk heuristics: Mule Account Velocity detected [ALERT ALT-001]', color: 'text-amber-600 dark:text-amber-400 font-bold' },
    { text: '>> Section 63 BSA evidentiary audit record written to tamper-evident custody ledger... TXN: 0x7a8b9c...e2f3d4', color: 'text-emerald-600 dark:text-emerald-400' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 font-mono text-xs select-none">
      {/* ── LEFT: MONOSPACE TERMINAL (8 COLS) ── */}
      <div className="lg:col-span-8 bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-3.5 shadow-xs dark:shadow-2xl flex flex-col justify-between">
        <div className="flex items-center justify-between pb-2 border-b border-border-soft dark:border-[#1E293B]/70 mb-2">
          <div className="flex items-center gap-2 text-[10px] text-text-dim dark:text-[#64748B] uppercase font-bold">
            <Terminal size={13} className="text-accent dark:text-[#38BDF8]" />
            <span>CENTRAL INTELLIGENCE REAL-TIME EVENT STREAM</span>
          </div>
          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
            AUTO-SYNC 1s
          </span>
        </div>

        <div className="space-y-1 text-[11px] leading-relaxed overflow-x-auto py-1">
          {terminalLines.map((line, idx) => (
            <div key={idx} className={`${line.color} whitespace-nowrap`}>
              {line.text}
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-border-soft dark:border-[#1E293B]/70 mt-1 flex items-center justify-between text-[10px] text-text-dim dark:text-[#64748B]">
          <span>STATUS: ALL SUBSYSTEMS NOMINAL</span>
          <span className="text-accent dark:text-[#38BDF8]">CENTRAL INTELLIGENCE ENGINE ONLINE</span>
        </div>
      </div>

      {/* ── RIGHT: SECTION 63 BSA AUDIT TRAIL (4 COLS) ── */}
      <div className="lg:col-span-4 bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-3.5 shadow-xs dark:shadow-2xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2 border-b border-border-soft dark:border-[#1E293B]/70 mb-2">
            <div className="flex items-center gap-1.5 text-[10px] text-accent dark:text-[#38BDF8] font-bold uppercase">
              <ShieldCheck size={13} className="text-emerald-600 dark:text-emerald-400" />
              <span>BLOCKCHAIN AUDIT TRAIL</span>
            </div>
            <span className="text-[9px] text-text-dim dark:text-[#64748B]">SEC 63 BSA</span>
          </div>

          <p className="text-[10px] text-text-dim dark:text-[#94A3B8] leading-relaxed">
            ALL INGESTED EVIDENCE &amp; STATUTORY FIR FILES ARE HASHED &amp; LOGGED ON CHAIN FOR EVIDENCE INTEGRITY (SECTION 63 BHARATIYA SAKSHYA ADHINIYAM).
          </p>

          <div className="mt-3 space-y-1.5 text-[10px] bg-surface-2 dark:bg-[#070A0F] p-2 rounded-lg border border-border-soft dark:border-[#1E293B]">
            <div className="flex justify-between">
              <span className="text-text-dim dark:text-[#64748B]">LATEST BLOCK:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">#08421</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-dim dark:text-[#64748B]">TXN HASH:</span>
              <span className="text-accent dark:text-[#38BDF8] font-bold">0x7a8b9c....e2f3d4</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-dim dark:text-[#64748B]">CUSTODY INTEGRITY:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">100% VERIFIED</span>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-border-soft dark:border-[#1E293B]/70 mt-2 flex items-center justify-between text-[10px]">
          <span className="text-text-dim dark:text-[#64748B]">CCTNS-II CERTIFICATE</span>
          <Link to="/reports" className="text-accent dark:text-[#38BDF8] hover:underline font-bold flex items-center gap-0.5">
            <span>Export Official Diary</span>
            <ArrowUpRight size={11} />
          </Link>
        </div>
      </div>
    </div>
  );
}
