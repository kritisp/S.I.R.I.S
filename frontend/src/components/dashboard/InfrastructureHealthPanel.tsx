import React from 'react';
import {
  Activity, Server, Database, Network, ShieldCheck,
  CheckCircle2, HardDrive, Cpu, Radio, Sparkles
} from 'lucide-react';

interface ServiceStatus {
  name: string;
  role: string;
  status: 'OPERATIONAL' | 'CONNECTED' | 'AVAILABLE';
  healthMetric: string;
}

const SERVICES: ServiceStatus[] = [
  {
    name: 'Intelligence Analysis Service',
    role: 'Case correlation & entity extraction',
    status: 'AVAILABLE',
    healthMetric: 'Operational · Entity analysis active',
  },
  {
    name: 'Cross-Station Knowledge Graph',
    role: 'Entity association repository',
    status: 'CONNECTED',
    healthMetric: 'Connected · Graph service active',
  },
  {
    name: 'Case Investigation Database',
    role: 'Authoritative case & FIR records',
    status: 'CONNECTED',
    healthMetric: 'Connected · Synchronized',
  },
  {
    name: 'Evidence Vault & Custody Locker',
    role: 'Digital evidence repository',
    status: 'OPERATIONAL',
    healthMetric: 'Operational · Custody verified',
  },
  {
    name: 'CCTNS-II Data Gateway',
    role: 'State police network interface',
    status: 'CONNECTED',
    healthMetric: 'Connected · Station link active',
  },
];

export function InfrastructureHealthPanel() {
  return (
    <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-4 flex flex-col justify-between shadow-xs dark:shadow-2xl font-sans select-none h-full transition-colors">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border-soft dark:border-[#1E293B] mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-xs sm:text-sm font-bold font-mono uppercase tracking-wider text-text dark:text-[#F8FAFC]">
              INVESTIGATION SYSTEM &amp; DATA STATUS
            </h2>
          </div>

          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold">
            SYSTEMS READY
          </span>
        </div>

        {/* Services Grid */}
        <div className="space-y-2 font-mono">
          {SERVICES.map((srv, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B]/70 hover:border-emerald-500/40 transition-all flex items-center justify-between gap-2 shadow-2xs"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-text dark:text-[#F8FAFC]">
                    {srv.name}
                  </span>
                </div>
                <p className="text-[10px] text-text-dim dark:text-[#94A3B8] font-sans truncate">
                  {srv.role}
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[9px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {srv.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer System Status */}
      <div className="pt-3 mt-3 border-t border-border-soft dark:border-[#1E293B] flex items-center justify-between font-mono text-[11px] text-text-dim dark:text-[#94A3B8]">
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={13} className="text-emerald-500" />
          <span>All investigation subsystems verified</span>
        </div>
        <span className="text-emerald-600 dark:text-emerald-400 font-bold">Station Service OK</span>
      </div>
    </div>
  );
}
