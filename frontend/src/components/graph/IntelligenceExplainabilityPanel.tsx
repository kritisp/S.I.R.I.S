import React, { useEffect, useState } from 'react';
import { X, Network, Share2, AlertTriangle, ShieldCheck, Cpu } from 'lucide-react';
import { graphIntelligenceService, WhyResult } from '../../services/graphIntelligenceService';

interface IntelligenceExplainabilityPanelProps {
  nodeId: string;
  label: string;
  entityType: string;
  onClose: () => void;
}

export function IntelligenceExplainabilityPanel({ nodeId, label, entityType, onClose }: IntelligenceExplainabilityPanelProps) {
  const [loading, setLoading] = useState(true);
  const [whyData, setWhyData] = useState<WhyResult | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    graphIntelligenceService.getWhy(nodeId).then((res) => {
      if (isMounted) {
        setWhyData(res);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [nodeId]);

  return (
    <div className="bg-surface border border-border-soft rounded-2xl p-4 space-y-4 font-mono shadow-xl text-xs animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border-soft">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-brand animate-pulse" />
          <span className="font-bold text-text uppercase tracking-wider text-[11px]">
            S.I.R.I.S. Graph Explainability Panel
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded bg-surface-2 text-text-dim hover:text-text cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>

      {/* Target Node info */}
      <div className="p-3 rounded-xl bg-surface-2 border border-border-soft space-y-1">
        <div className="flex items-center justify-between text-[10px] text-text-dim uppercase font-bold">
          <span>{entityType || 'ENTITY'}</span>
          {whyData?.is_flagged && (
            <span className="text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
              HIGH BETWEENNESS FLAG
            </span>
          )}
        </div>
        <p className="font-bold text-text text-sm truncate">{label || nodeId}</p>
        <p className="text-[10px] text-text-faint font-mono truncate">ID: {nodeId}</p>
      </div>

      {loading ? (
        <div className="py-6 text-center text-text-dim text-xs flex items-center justify-center gap-2">
          <div className="w-3.5 h-3.5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          <span>Computing Brandes Betweenness & Bridge Paths...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Centrality Metrics */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-surface-2 border border-border-soft">
              <span className="text-[9px] text-text-dim uppercase block">Betweenness</span>
              <span className="text-base font-extrabold text-brand tabular-nums">
                {whyData?.betweenness ?? 0.0}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-2 border border-border-soft">
              <span className="text-[9px] text-text-dim uppercase block">Influence</span>
              <span className="text-base font-extrabold text-emerald-500 tabular-nums">
                {whyData?.influence ?? 0.0}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-2 border border-border-soft">
              <span className="text-[9px] text-text-dim uppercase block">FIR Exposure</span>
              <span className="text-base font-extrabold text-amber-500 tabular-nums">
                {whyData?.complaint_count ?? 0}
              </span>
            </div>
          </div>

          {/* Removal Test */}
          {whyData?.removal_test && (
            <div
              className={`p-3 rounded-xl border space-y-1.5 ${
                whyData.removal_test.is_bridge
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : 'bg-surface-2 border-border-soft text-text-dim'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-[11px]">
                {whyData.removal_test.is_bridge ? (
                  <AlertTriangle size={13} className="text-rose-500 shrink-0" />
                ) : (
                  <ShieldCheck size={13} className="text-emerald-500 shrink-0" />
                )}
                <span>GRAPH FRAGMENTATION TEST (REMOVAL IMPACT)</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                {whyData.removal_test.note}
              </p>
              <div className="flex justify-between text-[10px] pt-1 border-t border-border-soft/60">
                <span>Before: {whyData.removal_test.components_before} subgraphs</span>
                <span>After: {whyData.removal_test.components_after} subgraphs</span>
              </div>
            </div>
          )}

          {/* Bridge Paths */}
          {whyData?.bridge_paths && whyData.bridge_paths.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-text-dim flex items-center gap-1">
                <Share2 size={11} className="text-brand" /> Critical Bridge Paths
              </span>
              <div className="space-y-1.5">
                {whyData.bridge_paths.map((bp, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-xl bg-surface-2 border border-border-soft text-[10.5px] space-y-1"
                  >
                    <div className="flex items-center justify-between text-text-dim text-[9.5px]">
                      <span>Path #{i + 1}</span>
                      <span className="text-emerald-500 font-bold">Passes through target</span>
                    </div>
                    <p className="font-mono text-text truncate">
                      {bp.path.join(' → ')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
