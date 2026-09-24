import React from 'react';
import { Database, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';
import { Evidence } from '../../mockServices/types';
import { Link } from 'react-router-dom';

interface ForensicDataIngestionStatusProps {
  evidenceCount: number;
  casesCount: number;
}

export function ForensicDataIngestionStatus({
  evidenceCount,
  casesCount,
}: ForensicDataIngestionStatusProps) {
  const ingestionStats = [
    { label: 'FIR DOCUMENTS', current: casesCount || 14, total: (casesCount || 14) + 4, unit: 'Dockets', color: 'bg-emerald-500', pct: 92 },
    { label: 'CDR CALL RECORDS', current: 45231, total: 60000, unit: 'Rows', color: 'bg-emerald-500', pct: 75 },
    { label: 'FORENSIC EVIDENCE VAULT', current: evidenceCount || 28, total: evidenceCount || 28, unit: 'Custody Locked', color: 'bg-emerald-500', pct: 100 },
    { label: 'BANK / MULE TRANSACTIONS', current: 12345, total: 20000, unit: 'Txns', color: 'bg-amber-500', pct: 62 },
    { label: 'SOCMINT & OSINT DATA', current: 8765, total: 15000, unit: 'Events', color: 'bg-sky-500', pct: 58 },
  ];

  return (
    <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-4 flex flex-col justify-between shadow-xs dark:shadow-2xl font-sans select-none h-full">
      <div>
        <div className="flex items-center justify-between pb-2.5 border-b border-border-soft dark:border-[#1E293B] mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-text dark:text-[#F8FAFC]">
              DATA INGESTION &amp; EVIDENCE STATUS
            </h3>
          </div>
          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">● ONLINE</span>
        </div>

        {/* Progress List */}
        <div className="space-y-2.5 font-mono">
          {ingestionStats.map((item) => (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-text-dim dark:text-[#94A3B8] text-[10px]">{item.label}</span>
                <span className="text-[11px] font-bold text-text dark:text-[#E2E8F0]">
                  {item.current.toLocaleString()} / {item.total.toLocaleString()}
                </span>
              </div>

              <div className="h-1.5 w-full bg-surface-2 dark:bg-[#1E293B] rounded-full overflow-hidden border border-border-soft dark:border-transparent">
                <div
                  className={`h-full ${item.color} rounded-full transition-all duration-500`}
                  style={{ width: `${item.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-3 border-t border-border-soft dark:border-[#1E293B] mt-3 flex items-center justify-between text-[10px] font-mono text-text-dim dark:text-[#64748B]">
        <span>LAST UPDATED: 23:47:19</span>
        <Link to="/evidence" className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold">
          Open Evidence Vault
        </Link>
      </div>
    </div>
  );
}
