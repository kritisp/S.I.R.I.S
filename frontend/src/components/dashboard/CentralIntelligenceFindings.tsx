import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Network, ArrowUpRight, ShieldAlert,
  GitMerge, Smartphone, Car, Fingerprint, Layers, ExternalLink
} from 'lucide-react';

interface FindingItem {
  id: string;
  type: 'MODUS_OPERANDI' | 'PHONE_CROSS_MATCH' | 'VEHICLE_SYNDICATE' | 'IDENTITY_RESOLUTION';
  title: string;
  description: string;
  statusText: string;
  statusColor: string;
  entities: string[];
  cases: string[];
  stations: string[];
  timestamp: string;
}

const FINDINGS: FindingItem[] = [
  {
    id: 'find-01',
    type: 'MODUS_OPERANDI',
    title: 'Potential Repeated Modus Operandi Across Stations',
    description: 'Coercive digital extortion script and VoIP communication patterns show structural similarity across two station records.',
    statusText: 'REQUIRES VALIDATION',
    statusColor: 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30',
    entities: ['Target Profile: Commercial Account Holders', 'VoIP Route: +91-98765-43210'],
    cases: ['FIR-2026-BBSR-014', 'FIR-2026-CTC-008'],
    stations: ['Khandagiri PS', 'Cuttack Sadar PS'],
    timestamp: '18m ago',
  },
  {
    id: 'find-02',
    type: 'PHONE_CROSS_MATCH',
    title: 'Shared Device Identifier Detected',
    description: 'Device IMEI record observed across multiple jurisdiction complaints in Khordha and Cuttack.',
    statusText: 'MATCH DETECTED',
    statusColor: 'bg-accent/15 text-accent dark:text-[#38BDF8] border-accent/30 dark:border-[#38BDF8]/30',
    entities: ['IMEI: 864920048192019', 'SIMs Logged: 4'],
    cases: ['FIR-2026-BBSR-019', 'FIR-2026-PUR-003'],
    stations: ['Khandagiri PS', 'Puri Town PS'],
    timestamp: '45m ago',
  },
  {
    id: 'find-03',
    type: 'VEHICLE_SYNDICATE',
    title: 'Vehicle Observed Across Case Records',
    description: 'Registration OD-02-AK-4455 noted in separate station incident dockets within the same timeframe.',
    statusText: 'CROSS-STATION LINK',
    statusColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    entities: ['Reg: OD-02-AK-4455', 'Make: Mahindra Scorpio'],
    cases: ['FIR-2026-BBSR-001', 'FIR-2026-CTC-012'],
    stations: ['Khandagiri PS', 'Chauliaganj PS'],
    timestamp: '2h ago',
  },
  {
    id: 'find-04',
    type: 'IDENTITY_RESOLUTION',
    title: 'Potential Alias Convergence',
    description: 'Recorded name variation suggests potential match to subject in Puri Cyber case record.',
    statusText: 'IDENTITY REVIEW',
    statusColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    entities: ['Primary Name: Rahul Verma', 'Recorded Alias: R.V.'],
    cases: ['FIR-2026-BBSR-001', 'FIR-2026-PUR-007'],
    stations: ['Khandagiri PS', 'Puri Cyber Cell'],
    timestamp: '3h ago',
  },
];

export function CentralIntelligenceFindings() {
  const navigate = useNavigate();

  const getIcon = (type: FindingItem['type']) => {
    switch (type) {
      case 'MODUS_OPERANDI':
        return <GitMerge size={14} className="text-purple-500" />;
      case 'PHONE_CROSS_MATCH':
        return <Smartphone size={14} className="text-accent dark:text-[#38BDF8]" />;
      case 'VEHICLE_SYNDICATE':
        return <Car size={14} className="text-amber-500" />;
      case 'IDENTITY_RESOLUTION':
        return <Fingerprint size={14} className="text-emerald-500" />;
    }
  };

  return (
    <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-4 flex flex-col justify-between shadow-xs dark:shadow-2xl font-sans select-none h-full transition-colors">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border-soft dark:border-[#1E293B] mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
            <h2 className="text-xs sm:text-sm font-bold font-mono uppercase tracking-wider text-text dark:text-[#F8FAFC]">
              RECENT INTELLIGENCE FINDINGS
            </h2>
          </div>

          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30 font-bold">
            RELATIONSHIP INTELLIGENCE
          </span>
        </div>

        {/* Findings List */}
        <div className="space-y-2.5 font-sans">
          {FINDINGS.map((finding) => (
            <div
              key={finding.id}
              onClick={() => navigate('/network')}
              className="p-3 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B]/70 hover:border-purple-500/50 transition-all cursor-pointer group shadow-2xs"
            >
              {/* Finding Title & Status Badge */}
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-surface dark:bg-[#070A0F] border border-border-soft dark:border-[#1E293B] flex items-center justify-center shrink-0">
                    {getIcon(finding.type)}
                  </div>
                  <h3 className="text-xs font-bold text-text dark:text-[#F8FAFC] group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                    {finding.title}
                  </h3>
                </div>

                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border shrink-0 ${finding.statusColor}`}>
                  {finding.statusText}
                </span>
              </div>

              {/* Description */}
              <p className="text-[11px] text-text-dim dark:text-[#94A3B8] line-clamp-2 mb-2">
                {finding.description}
              </p>

              {/* Entity Tags & Cross-Station Badges */}
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                {finding.entities.map((ent, i) => (
                  <span
                    key={i}
                    className="px-1.5 py-0.2 rounded bg-surface dark:bg-[#070A0F] text-text dark:text-[#E2E8F0] border border-border-soft dark:border-[#1E293B]"
                  >
                    {ent}
                  </span>
                ))}

                <span className="text-text-dim dark:text-[#64748B]">across</span>

                {finding.stations.map((st, i) => (
                  <span
                    key={i}
                    className="px-1.5 py-0.2 rounded bg-accent/10 dark:bg-[#38BDF8]/10 text-accent dark:text-[#38BDF8] border border-accent/20 dark:border-[#38BDF8]/20 font-bold"
                  >
                    {st}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="pt-3 mt-3 border-t border-border-soft dark:border-[#1E293B] flex items-center justify-between font-mono text-[11px]">
        <span className="text-text-dim dark:text-[#64748B]">Cross-case intelligence requires officer confirmation</span>
        <button
          onClick={() => navigate('/network')}
          className="text-accent dark:text-[#38BDF8] hover:underline flex items-center gap-1 font-bold cursor-pointer"
        >
          <span>Open Full Network Graph</span>
          <ArrowUpRight size={12} />
        </button>
      </div>
    </div>
  );
}
