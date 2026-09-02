import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, ShieldAlert, Sparkles, MapPin, Clock, AlertTriangle, 
  BarChart3, Layers, ArrowRight, CheckCircle2, ChevronRight, Activity, Globe, Compass, Shield
} from 'lucide-react';
import { 
  PREDICTIVE_ZONES, RISK_CONTRIBUTION_FACTORS, PredictiveZoneRisk 
} from '../data/round3DemoData';

export function PredictiveRiskPage() {
  const navigate = useNavigate();
  const [selectedZone, setSelectedZone] = useState<PredictiveZoneRisk>(PREDICTIVE_ZONES[0]); // Khandagiri default

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-6 rounded-2xl border border-border-soft shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={12} /> PROTOTYPE • SYNTHETIC DATA
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/30 text-[10px] font-mono font-bold uppercase tracking-wider">
              BHUBANESWAR URBAN
            </span>
          </div>
          <h1 className="text-2xl font-display font-bold text-text tracking-tight flex items-center gap-2">
            PREDICTIVE CRIME RISK
          </h1>
          <p className="text-xs text-text-dim mt-1 font-sans">
            AI-assisted risk forecasting using historical and recent synthetic intelligence signals
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate('/map?mode=risk-terrain')}
            className="flex items-center gap-2 px-4 py-2.5 bg-surface-2 hover:bg-surface-hover text-text font-bold text-xs rounded-xl border border-border-soft transition-all cursor-pointer"
          >
            <Globe size={15} className="text-brand" />
            <span>VIEW RISK TERRAIN</span>
          </button>

          <button
            onClick={() => navigate('/resource-optimization')}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand hover:bg-brand-hover text-bg font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            <span>OPTIMIZE RESOURCES</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {/* Primary Forecast Box (Khandagiri Focus) */}
      <div className="bg-gradient-to-br from-surface to-surface-2 p-6 rounded-2xl border border-brand/30 shadow-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-border-soft">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-text-dim mb-1">
              <MapPin size={14} className="text-danger" />
              <span>PRIMARY FORECAST LOCATION:</span>
              <strong className="text-text font-bold text-sm">{selectedZone.zoneName}, {selectedZone.district}</strong>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <div className="text-3xl font-display font-extrabold text-danger flex items-baseline gap-1">
                {selectedZone.riskScore} <span className="text-sm font-mono text-text-dim font-normal">/ 100</span>
              </div>
              <span className="px-3 py-1 rounded-lg bg-danger/20 text-danger font-mono font-bold text-xs border border-danger/30 animate-pulse">
                {selectedZone.riskLevel} RISK
              </span>
              <span className="text-xs font-mono text-text-dim flex items-center gap-1 bg-surface px-2.5 py-1 rounded border border-border-soft">
                <Clock size={13} className="text-brand" /> Window: {selectedZone.forecastWindow}
              </span>
            </div>
          </div>

          <div className="bg-surface p-4 rounded-xl border border-border-soft flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-brand/10 border border-brand/30 flex items-center justify-center text-brand shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase font-bold text-text-dim">PROJECTED PEAK RISK WINDOW</div>
              <div className="text-sm font-bold text-brand font-mono">{selectedZone.peakRiskTime}</div>
              <div className="text-[10px] text-text-dim">Elevated vehicle theft & snatching probability</div>
            </div>
          </div>
        </div>

        {/* Predicted Crime Probabilities Grid */}
        <div className="mt-6">
          <h3 className="text-xs font-mono font-bold text-text uppercase tracking-wider mb-3 flex items-center gap-2">
            <TrendingUp size={14} className="text-brand" /> PREDICTED CRIME CATEGORY PROBABILITIES
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {selectedZone.crimeProbabilities.map((cp, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-surface border border-border-soft shadow-sm space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-text font-sans">{cp.crime}</span>
                  <span className="font-mono font-bold text-brand">{cp.probability}%</span>
                </div>
                <div className="w-full bg-surface-2 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${idx === 0 ? 'bg-danger' : idx === 1 ? 'bg-amber-400' : 'bg-brand'}`} 
                    style={{ width: `${cp.probability}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid: Risk Contribution Chart & Why This Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Risk Contribution Chart */}
        <div className="bg-surface p-6 rounded-2xl border border-border-soft shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-border-soft pb-3">
              <div>
                <h2 className="text-sm font-bold text-text font-mono uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 size={16} className="text-brand" /> RISK CONTRIBUTION WEIGHTS
                </h2>
                <p className="text-[11px] text-text-dim">Deterministic decomposition of forecast score ({selectedZone.riskScore}/100)</p>
              </div>
              <span className="text-[10px] font-mono text-brand font-bold bg-brand/10 px-2 py-0.5 rounded border border-brand/20">
                Total 100%
              </span>
            </div>

            <div className="space-y-4">
              {RISK_CONTRIBUTION_FACTORS.map((rf, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-text font-semibold">{rf.factor}</span>
                    <span className="font-bold text-brand">{rf.percentage}%</span>
                  </div>
                  <div className="w-full bg-surface-2 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-brand to-brand-hover h-full rounded-full transition-all duration-500"
                      style={{ width: `${rf.percentage * 2.8}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-text-dim">{rf.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 p-3 rounded-xl bg-surface-2/60 border border-border-soft text-[10px] font-mono text-text-dim flex items-center gap-2">
            <CheckCircle2 size={14} className="text-success shrink-0" />
            <span>Multi-factor scoring combining 10-year historical baseline with real-time ANPR & CDR feeds.</span>
          </div>
        </div>

        {/* Why This Area & Recent Incident Timeline */}
        <div className="bg-surface p-6 rounded-2xl border border-border-soft shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-border-soft pb-3">
              <h2 className="text-sm font-bold text-text font-mono uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-400" /> WHY {selectedZone.zoneName.toUpperCase()}?
              </h2>
              <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                {selectedZone.recentIncidentsCount} Recent Incidents
              </span>
            </div>

            <div className="space-y-3 mb-6">
              {selectedZone.contributingFactors.map((factor, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-surface-2/80 border border-border-soft text-xs font-mono font-semibold text-text flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-danger animate-pulse shrink-0"></div>
                  <span>{factor}</span>
                </div>
              ))}
            </div>

            <h3 className="text-xs font-mono font-bold text-text uppercase tracking-wider mb-3">RECENT INCIDENT TIMELINE</h3>
            
            <div className="space-y-2 font-mono text-xs">
              <div className="p-2.5 rounded-lg bg-surface border border-border-soft flex items-center justify-between">
                <div>
                  <span className="text-danger font-bold">19:42 IST</span> · Vehicle OD-02-MJ-8821 ANPR Sighting
                </div>
                <span className="text-[10px] text-text-dim">Camera KDG-04</span>
              </div>

              <div className="p-2.5 rounded-lg bg-surface border border-border-soft flex items-center justify-between">
                <div>
                  <span className="text-amber-400 font-bold">18:30 IST</span> · Commercial Theft Report (Case #2026-0817)
                </div>
                <span className="text-[10px] text-text-dim">Khandagiri PS</span>
              </div>

              <div className="p-2.5 rounded-lg bg-surface border border-border-soft flex items-center justify-between">
                <div>
                  <span className="text-brand font-bold">Yesterday</span> · Pass-Through Transfer on Mule Account M-204
                </div>
                <span className="text-[10px] text-text-dim">FIU Alert</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border-soft flex items-center justify-between">
            <span className="text-[11px] text-text-dim font-mono">Recommended Response:</span>
            <button
              onClick={() => navigate('/resource-optimization')}
              className="text-xs font-mono font-bold text-brand hover:underline flex items-center gap-1"
            >
              <span>DEPLOY PATROL UNIT</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

      </div>

      {/* Zone Forecast Selection Grid */}
      <div className="bg-surface rounded-2xl border border-border-soft p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 border-b border-border-soft pb-3">
          <div>
            <h2 className="text-sm font-bold text-text font-mono uppercase tracking-wider flex items-center gap-2">
              <Compass size={16} className="text-brand" /> JURISDICTIONAL RISK FORECAST ZONES
            </h2>
            <p className="text-xs text-text-dim">Select a zone to view detailed predictive breakdown and response plan</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {PREDICTIVE_ZONES.map((zone) => {
            const isSelected = selectedZone.id === zone.id;
            return (
              <button
                key={zone.id}
                onClick={() => setSelectedZone(zone)}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? 'bg-brand/10 border-brand ring-2 ring-brand/20 shadow-md'
                    : 'bg-surface-2/60 border-border-soft hover:bg-surface-hover'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-bold text-text truncate">{zone.zoneName}</span>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      zone.riskLevel === 'CRITICAL' ? 'bg-danger/20 text-danger' : zone.riskLevel === 'HIGH' ? 'bg-amber-400/20 text-amber-400' : 'bg-brand/20 text-brand'
                    }`}>
                      {zone.riskLevel}
                    </span>
                  </div>
                  <div className="text-[10px] text-text-dim font-mono">{zone.dominantCrime}</div>
                </div>

                <div className="pt-2 border-t border-border-soft/60 flex items-baseline justify-between">
                  <span className="text-[10px] font-mono text-text-dim">Score</span>
                  <span className="text-lg font-display font-extrabold text-text font-mono">{zone.riskScore}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
