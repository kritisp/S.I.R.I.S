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
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-16 select-none font-sans">
      {/* Header Bar */}
      <div className="glass p-6 rounded-2xl bg-surface border border-border-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono font-bold bg-danger/10 text-danger-bright px-2.5 py-0.5 rounded border border-danger/30 uppercase flex items-center gap-1">
              <Activity size={12} className="animate-pulse" /> STATISTICAL ANOMALY RADAR
            </span>
            <span className="text-[10px] font-mono text-brand font-bold">
              AUTOMATIC SCANNER ACTIVE
            </span>
          </div>
          <h1 className="text-2xl font-bold font-mono text-text flex items-center gap-2">
            <TrendingUp className="text-brand" /> Anomaly Radar & Pattern Scanner
          </h1>
          <p className="text-xs text-text-dim mt-1">
            Glass-Box deterministic statistical scan · Detects surges, offender activity bursts, emerging patterns & timing clusters
          </p>
        </div>
      </div>

      {/* Anomalies List */}
      <div className="grid md:grid-cols-2 gap-5">
        {anomalies.map(item => (
          <div key={item.id} className="glass p-6 rounded-2xl bg-surface border border-border-soft space-y-4 shadow-sm hover:border-brand transition-all flex flex-col justify-between">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border-soft pb-2.5">
                <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded border ${
                  item.kind === 'SURGE' ? 'bg-danger/20 text-danger-bright border-danger/40' :
                  item.kind === 'OFFENDER' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                  item.kind === 'EMERGING' ? 'bg-brand/20 text-brand border-brand/40' :
                  'bg-purple-500/20 text-purple-300 border-purple-500/40'
                }`}>
                  {item.kind} ANOMALY
                </span>

                <span className="text-xs font-mono font-bold text-danger-bright">
                  SEVERITY: {item.severity} / 100
                </span>
              </div>

              <h3 className="text-base font-bold text-text font-mono leading-snug">{item.title}</h3>
              <p className="text-xs text-text-dim leading-relaxed">{item.detail}</p>

              {/* Rationale */}
              <div className="p-3 rounded-xl bg-surface-2 border border-border-soft space-y-1 font-mono text-xs">
                <span className="text-[10px] font-bold text-brand uppercase">Scan Rationale</span>
                <p className="text-text-dim">{item.why}</p>
                <div className="text-brand font-bold mt-1">Metric: {item.metric}</div>
              </div>
            </div>

            {/* Evidence Cases */}
            <div className="pt-3 border-t border-border-soft space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase text-text-dim flex items-center gap-1">
                <FileText size={12} /> Cites Real Case Records
              </span>
              <div className="space-y-1">
                {item.evidenceCases.map(ev => (
                  <div
                    key={ev.id}
                    onClick={() => navigate(`/cases/${ev.id}`)}
                    className="p-2 rounded-lg bg-surface-2 hover:bg-surface-hover border border-border-soft text-xs font-mono text-text flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <span>{ev.id} · {ev.title}</span>
                    <ArrowUpRight size={13} className="text-brand" />
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
