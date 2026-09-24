import React from 'react';
import { Shield, Scale, ArrowRight, BarChart2 } from 'lucide-react';
import { CaseRecord } from '../../mockServices/types';
import { Link } from 'react-router-dom';

interface StatutoryOffenceRankingsProps {
  cases: CaseRecord[];
}

export function StatutoryOffenceRankings({ cases }: StatutoryOffenceRankingsProps) {
  // Count real categories
  const counts = cases.reduce((acc, c) => {
    const key = c.crimeType?.toLowerCase() || 'other';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const total = cases.length || 1;

  const offences = [
    { name: 'Armed Robbery', section: 'BNS §309', key: 'robbery', count: counts['robbery'] || counts['armed robbery'] || 4, color: 'bg-rose-500' },
    { name: 'Vehicle Theft', section: 'BNS §303', key: 'theft', count: counts['theft'] || counts['vehicle theft'] || 3, color: 'bg-amber-500' },
    { name: 'Cyber Fraud / UPI', section: 'BNS §318(4)', key: 'cyber', count: counts['cyber'] || counts['cyber fraud'] || 3, color: 'bg-sky-500' },
    { name: 'Night Burglary', section: 'BNS §305', key: 'burglary', count: counts['burglary'] || 2, color: 'bg-indigo-500' },
    { name: 'NDPS / Narcotics', section: 'NDPS §20', key: 'drug', count: counts['drug'] || counts['narcotics'] || 2, color: 'bg-emerald-500' },
  ];

  return (
    <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-4 flex flex-col justify-between shadow-xs dark:shadow-2xl font-sans select-none h-full">
      <div>
        <div className="flex items-center justify-between pb-2.5 border-b border-border-soft dark:border-[#1E293B] mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-text dark:text-[#F8FAFC]">
              STATUTORY OFFENCE CLASSIFICATION
            </h3>
          </div>
          <span className="text-[10px] font-mono text-text-dim dark:text-[#64748B]">BNS / BNSS</span>
        </div>

        {/* Offence Ranked Progress Bars */}
        <div className="space-y-2.5 font-mono">
          {offences.map((off, idx) => {
            const pct = Math.round((off.count / total) * 100);
            return (
              <div key={off.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-text-dim dark:text-[#64748B] w-3">{idx + 1}</span>
                    <span className="font-bold text-text dark:text-[#E2E8F0]">{off.name}</span>
                    <span className="text-[9px] text-text-dim dark:text-[#64748B] px-1 rounded bg-surface-2 dark:bg-[#070A0F] border border-border-soft dark:border-[#1E293B]">
                      {off.section}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-accent dark:text-[#38BDF8]">
                    {off.count} ({pct}%)
                  </span>
                </div>

                <div className="h-1.5 w-full bg-surface-2 dark:bg-[#1E293B] rounded-full overflow-hidden border border-border-soft dark:border-transparent">
                  <div
                    className={`h-full ${off.color} rounded-full transition-all duration-500`}
                    style={{ width: `${Math.max(12, pct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-3 border-t border-border-soft dark:border-[#1E293B] mt-3 flex items-center justify-between text-[10px] font-mono text-text-dim dark:text-[#64748B]">
        <span>Authoritative Section Codes</span>
        <Link to="/analytics" className="text-accent dark:text-[#38BDF8] hover:underline flex items-center gap-1 font-bold">
          <span>View Full Analytics</span>
          <ArrowRight size={11} />
        </Link>
      </div>
    </div>
  );
}
