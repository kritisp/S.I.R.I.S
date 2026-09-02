import React, { useState, useEffect } from 'react';
import { ShieldAlert, Info, AlertTriangle, Activity, CheckCircle2 } from 'lucide-react';
import { fetchRiskScore, RiskScoreResult } from '../../services/riskService';

interface RiskIntelligenceCardProps {
  accusedName?: string;
  firCount?: number;
  crimeTypes?: string[];
  priorConvictions?: number;
}

export function RiskIntelligenceCard({
  accusedName = 'Rajesh Kumar',
  firCount = 3,
  crimeTypes = ['Armed Robbery', 'Burglary'],
  priorConvictions = 2
}: RiskIntelligenceCardProps) {
  const [riskData, setRiskData] = useState<RiskScoreResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    fetchRiskScore(accusedName, firCount, crimeTypes, priorConvictions)
      .then(res => setRiskData(res))
      .finally(() => setLoading(false));
  }, [accusedName, firCount, crimeTypes, priorConvictions]);

  if (loading) {
    return (
      <div className="glass bg-surface border border-border-soft rounded-2xl p-5 text-center text-xs text-text-dim font-mono">
        Calculating analytical risk telemetry...
      </div>
    );
  }

  if (!riskData) return null;

  return (
    <div className="glass bg-surface border border-border-soft rounded-2xl p-5 space-y-4 shadow-sm select-none">
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-border-soft pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-danger/10 text-danger-bright border border-danger/20">
            <ShieldAlert size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono text-text flex items-center gap-2">
              ANALYTICAL RISK INDICATOR
            </h3>
            <p className="text-[11px] text-text-dim">
              Investigation prioritization score based on history & MO parameters
            </p>
          </div>
        </div>

        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
          riskData.riskTier === 'CRITICAL' ? 'bg-danger/20 text-danger-bright border-danger/30' :
          riskData.riskTier === 'HIGH' ? 'bg-warning/20 text-warning-bright border-warning/30' :
          'bg-brand/20 text-brand border-brand/30'
        }`}>
          {riskData.riskTier} RISK
        </span>
      </div>

      {/* Score gauge & accused info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-surface-2 border border-border-soft">
        <div>
          <div className="text-[10px] font-mono text-text-dim uppercase">Suspect Entity</div>
          <div className="text-base font-bold text-text">{riskData.accusedName}</div>
          <div className="text-xs text-text-dim font-mono mt-0.5">Confidence: {Math.round(riskData.confidence * 100)}%</div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] font-mono text-text-dim uppercase">Priority Index</div>
            <div className="text-2xl font-extrabold font-mono text-danger-bright">
              {riskData.riskScore} <span className="text-xs text-text-dim font-normal">/ 100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contributing Factors */}
      <div className="space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-text-dim font-mono">
          Contributing Factors
        </div>
        <div className="space-y-1.5">
          {riskData.contributingFactors.map((factor, i) => (
            <div key={i} className="text-xs text-text flex items-start gap-2 bg-surface-2 p-2 rounded-lg border border-border-soft">
              <CheckCircle2 size={13} className="text-brand shrink-0 mt-0.5" />
              <span>{factor}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Non-guilt Disclaimer */}
      <div className="p-2.5 rounded-lg bg-bg-elev/40 border border-border-soft text-[10px] font-mono text-text-faint flex items-start gap-2">
        <Info size={13} className="text-brand shrink-0 mt-0.5" />
        <div>
          <strong>DISCLAIMER:</strong> {riskData.legalDisclaimer}
        </div>
      </div>
    </div>
  );
}
