import React from 'react';
import { 
  Activity, AlertTriangle, TrendingUp, Zap, Clock, ShieldAlert, FileText, ArrowUpRight
} from 'lucide-react';
import { getAnomalies } from '../services/anomalyRadarService';
import { useNavigate } from 'react-router-dom';

export function AnomalyRadarPage() {
  const anomalies = getAnomalies();
  const navigate = useNavigate();

  return (
    <div className="max-w-[1520px] mx-auto space-y-4 font-sans select-none text-text dark:text-[#F8FAFC] pb-24">
      {/* ── 1. COMMAND HEADER & ANOMALY RADAR HUB ── */}
      <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-3.5 sm:p-4 shadow-xs dark:shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-2 dark:bg-[#0E1422] border border-accent/40 dark:border-[#38BDF8]/40 flex items-center justify-center text-accent dark:text-[#38BDF8] shadow-xs">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-text dark:text-[#F8FAFC] uppercase">
                  STATISTICAL CRIME PATTERN & ANOMALY ANALYSIS
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-rose-500/15 text-rose-400 border border-rose-500/30">
                  ANOMALY RADAR
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-accent/15 dark:bg-[#38BDF8]/15 border border-accent/30 dark:border-[#38BDF8]/30 text-accent dark:text-[#38BDF8]">
                  ACTIVE CCTNS SCANNER
                </span>
              </div>
              <p className="text-xs text-text-dim dark:text-[#94A3B8] font-mono mt-0.5">
                Deterministic statistical analysis · Detects incidence surges, repeat offender clusters, and temporal frequency anomalies
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. ANOMALIES LIST ── */}
      <div className="grid md:grid-cols-2 gap-4">
        {anomalies.map(item => (
          <div key={item.id} className="p-4 rounded-xl bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] space-y-3 shadow-xs hover:border-accent/40 dark:hover:border-[#38BDF8]/40 transition-all flex flex-col justify-between">
            <div className="space-y-2.5">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border-soft dark:border-[#1E293B] pb-2">
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  item.kind === 'SURGE' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                  item.kind === 'OFFENDER' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                  item.kind === 'EMERGING' ? 'bg-accent/10 dark:bg-[#38BDF8]/10 text-accent dark:text-[#38BDF8] border-accent/20 dark:border-[#38BDF8]/20' :
                  'bg-purple-500/10 text-purple-400 border-purple-500/30'
                }`}>
                  {item.kind} ANOMALY
                </span>

                <span className="text-xs font-mono font-bold text-rose-400">
                  SEVERITY: {item.severity} / 100
                </span>
              </div>

              <h3 className="text-sm font-bold text-text dark:text-[#F8FAFC] font-mono leading-snug">{item.title}</h3>
              <p className="text-xs text-text-dim dark:text-[#94A3B8] leading-relaxed">{item.detail}</p>

              {/* Rationale */}
              <div className="p-2.5 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] space-y-1 font-mono text-xs">
                <span className="text-[10px] font-bold text-accent dark:text-[#38BDF8] uppercase">Scan Rationale</span>
                <p className="text-text-dim dark:text-[#94A3B8] text-[11px]">{item.why}</p>
                <div className="text-accent dark:text-[#38BDF8] font-bold mt-1 text-[11px]">Metric: {item.metric}</div>
              </div>
            </div>

            {/* Evidence Cases */}
            <div className="pt-2.5 border-t border-border-soft dark:border-[#1E293B] space-y-1.5 font-mono">
              <span className="text-[10px] font-bold uppercase text-text-dim dark:text-[#94A3B8] flex items-center gap-1">
                <FileText size={11} /> Cites Real Case Records
              </span>
              <div className="space-y-1">
                {item.evidenceCases.map(ev => (
                  <div
                    key={ev.id}
                    onClick={() => navigate(`/cases/${ev.id}`)}
                    className="p-2 rounded bg-surface-2 dark:bg-[#0E1422] hover:bg-surface-hover border border-border-soft dark:border-[#1E293B] text-xs text-text dark:text-[#F8FAFC] flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span>{ev.id} · {ev.title}</span>
                    <ArrowUpRight size={12} className="text-accent dark:text-[#38BDF8]" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
