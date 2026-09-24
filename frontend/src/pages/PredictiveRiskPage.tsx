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
    <div className="max-w-[1520px] mx-auto space-y-4 font-sans select-none text-text dark:text-[#F8FAFC] pb-24">
      {/* ── 1. COMMAND HEADER & PREDICTIVE HUB ── */}
      <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-3.5 sm:p-4 shadow-xs dark:shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-2 dark:bg-[#0E1422] border border-accent/40 dark:border-[#38BDF8]/40 flex items-center justify-center text-accent dark:text-[#38BDF8] shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-text dark:text-[#F8FAFC] uppercase">
                  PREDICTIVE CRIME RISK TERRAIN
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  SPATIAL RISK MODEL
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-accent/15 dark:bg-[#38BDF8]/15 border border-accent/30 dark:border-[#38BDF8]/30 text-accent dark:text-[#38BDF8]">
                  BHUBANESWAR URBAN
                </span>
              </div>
              <p className="text-xs text-text-dim dark:text-[#94A3B8] font-mono mt-0.5">
                Spatial-temporal risk forecasting utilizing FIR historical patterns, geographic incidence vectors, and environmental risk factors
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 font-mono">
            <button
              onClick={() => navigate('/gis-map')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-2 dark:bg-[#0E1422] hover:bg-surface-hover text-accent dark:text-[#38BDF8] font-bold text-xs rounded-lg border border-border-soft dark:border-[#1E293B] transition-all cursor-pointer"
            >
              <Globe size={13} />
              <span>VIEW RISK TERRAIN</span>
            </button>

            <button
              onClick={() => navigate('/resource-optimization')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-accent text-bg hover:bg-accent-bright dark:bg-[#38BDF8] dark:text-[#070A0F] dark:hover:bg-[#0284C7] font-bold text-xs rounded-lg shadow-xs transition-all cursor-pointer uppercase"
            >
              <span>OPTIMIZE RESOURCES</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. PRIMARY FORECAST BOX (Khandagiri Focus) ── */}
      <div className="bg-surface dark:bg-[#0B0F17] p-4 rounded-xl border border-border-soft dark:border-[#1E293B] shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-border-soft dark:border-[#1E293B]">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-text-dim dark:text-[#94A3B8] mb-1">
              <MapPin size={13} className="text-rose-400" />
              <span>PRIMARY FORECAST LOCATION:</span>
              <strong className="text-text dark:text-[#F8FAFC] font-bold text-sm">{selectedZone.zoneName}, {selectedZone.district}</strong>
            </div>
            <div className="flex items-center gap-2.5 mt-1.5">
              <div className="text-2xl sm:text-3xl font-bold font-mono text-rose-400 flex items-baseline gap-1">
                {selectedZone.riskScore} <span className="text-xs font-mono text-text-dim dark:text-[#94A3B8] font-normal">/ 100</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 font-mono font-bold text-[10px] border border-rose-500/20 animate-pulse">
                {selectedZone.riskLevel} RISK
              </span>
              <span className="text-[11px] font-mono text-text-dim dark:text-[#94A3B8] flex items-center gap-1 bg-surface-2 dark:bg-[#0E1422] px-2 py-1 rounded border border-border-soft dark:border-[#1E293B]">
                <Clock size={12} className="text-accent dark:text-[#38BDF8]" /> Window: {selectedZone.forecastWindow}
              </span>
            </div>
          </div>

          <div className="bg-surface-2 dark:bg-[#0E1422] p-3 rounded-lg border border-border-soft dark:border-[#1E293B] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] flex items-center justify-center text-accent dark:text-[#38BDF8] shrink-0">
              <Clock size={16} />
            </div>
            <div>
              <div className="text-[9px] font-mono uppercase font-bold text-text-dim dark:text-[#94A3B8]">PROJECTED PEAK RISK WINDOW</div>
              <div className="text-xs sm:text-sm font-bold text-accent dark:text-[#38BDF8] font-mono">{selectedZone.peakRiskTime}</div>
              <div className="text-[10px] text-text-dim dark:text-[#94A3B8] font-mono">Elevated vehicle theft & snatching probability</div>
            </div>
          </div>
        </div>

        {/* Predicted Crime Probabilities Grid */}
        <div className="mt-3.5">
          <h3 className="text-xs font-mono font-bold text-text dark:text-[#F8FAFC] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <TrendingUp size={13} className="text-accent dark:text-[#38BDF8]" /> PREDICTED CRIME CATEGORY PROBABILITIES
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {selectedZone.crimeProbabilities.map((cp, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] shadow-xs space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-text dark:text-[#F8FAFC] font-mono">{cp.crime}</span>
                  <span className="font-mono font-bold text-accent dark:text-[#38BDF8]">{cp.probability}%</span>
                </div>
                <div className="w-full bg-surface dark:bg-[#070A0F] h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${idx === 0 ? 'bg-rose-500' : idx === 1 ? 'bg-amber-400' : 'bg-accent dark:bg-[#38BDF8]'}`} 
                    style={{ width: `${cp.probability}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 3. GRID: RISK CONTRIBUTION CHART & WHY THIS AREA ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Risk Contribution Chart */}
        <div className="bg-surface dark:bg-[#0B0F17] p-4 rounded-xl border border-border-soft dark:border-[#1E293B] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-border-soft dark:border-[#1E293B] pb-2.5">
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-text dark:text-[#F8FAFC] font-mono uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart3 size={14} className="text-accent dark:text-[#38BDF8]" /> RISK CONTRIBUTION WEIGHTS
                </h2>
                <p className="text-[10px] text-text-dim dark:text-[#94A3B8] font-mono">Deterministic decomposition of forecast score ({selectedZone.riskScore}/100)</p>
              </div>
              <span className="text-[9px] font-mono text-accent dark:text-[#38BDF8] font-bold bg-accent/10 dark:bg-[#38BDF8]/10 px-2 py-0.5 rounded border border-accent/20 dark:border-[#38BDF8]/20">
                TOTAL 100%
              </span>
            </div>

            <div className="space-y-3 font-mono">
              {RISK_CONTRIBUTION_FACTORS.map((rf, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-text dark:text-[#F8FAFC] font-semibold">{rf.factor}</span>
                    <span className="font-bold text-accent dark:text-[#38BDF8]">{rf.percentage}%</span>
                  </div>
                  <div className="w-full bg-surface-2 dark:bg-[#0E1422] h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-accent dark:bg-[#38BDF8] h-full rounded-full transition-all duration-500"
                      style={{ width: `${rf.percentage * 2.8}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-text-dim dark:text-[#94A3B8]">{rf.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 p-2.5 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-[10px] font-mono text-text-dim dark:text-[#94A3B8] flex items-center gap-2">
            <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
            <span>Multi-factor scoring combining 10-year historical baseline with real-time ANPR & CDR feeds.</span>
          </div>
        </div>

        {/* Why This Area & Recent Incident Timeline */}
        <div className="bg-surface dark:bg-[#0B0F17] p-4 rounded-xl border border-border-soft dark:border-[#1E293B] shadow-xs flex flex-col justify-between font-mono">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-border-soft dark:border-[#1E293B] pb-2.5">
              <h2 className="text-xs sm:text-sm font-bold text-text dark:text-[#F8FAFC] uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-amber-400" /> WHY {selectedZone.zoneName.toUpperCase()}?
              </h2>
              <span className="text-[9px] text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                {selectedZone.recentIncidentsCount} Recent Incidents
              </span>
            </div>

            <div className="space-y-2 mb-4">
              {selectedZone.contributingFactors.map((factor, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-xs font-semibold text-text dark:text-[#F8FAFC] flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse shrink-0" />
                  <span>{factor}</span>
                </div>
              ))}
            </div>

            <h3 className="text-xs font-bold text-text dark:text-[#F8FAFC] uppercase tracking-wider mb-2">RECENT INCIDENT TIMELINE</h3>
            
            <div className="space-y-1.5 text-xs">
              <div className="p-2 rounded bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] flex items-center justify-between">
                <div>
                  <span className="text-rose-400 font-bold">19:42 IST</span> · Vehicle OD-02-MJ-8821 ANPR Sighting
                </div>
                <span className="text-[10px] text-text-dim dark:text-[#94A3B8]">Camera KDG-04</span>
              </div>

              <div className="p-2 rounded bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] flex items-center justify-between">
                <div>
                  <span className="text-amber-400 font-bold">18:30 IST</span> · Commercial Theft Report (Case #2026-0817)
                </div>
                <span className="text-[10px] text-text-dim dark:text-[#94A3B8]">Khandagiri PS</span>
              </div>

              <div className="p-2 rounded bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] flex items-center justify-between">
                <div>
                  <span className="text-accent dark:text-[#38BDF8] font-bold">Yesterday</span> · Pass-Through Transfer on Mule Account M-204
                </div>
                <span className="text-[10px] text-text-dim dark:text-[#94A3B8]">FIU Alert</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border-soft dark:border-[#1E293B] flex items-center justify-between">
            <span className="text-[11px] text-text-dim dark:text-[#94A3B8]">Recommended Response:</span>
            <button
              onClick={() => navigate('/resource-optimization')}
              className="text-xs font-bold text-accent dark:text-[#38BDF8] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>DEPLOY PATROL UNIT</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>

      </div>

      {/* ── 4. ZONE FORECAST SELECTION GRID ── */}
      <div className="bg-surface dark:bg-[#0B0F17] rounded-xl border border-border-soft dark:border-[#1E293B] p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3 border-b border-border-soft dark:border-[#1E293B] pb-2.5">
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-text dark:text-[#F8FAFC] font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Compass size={14} className="text-accent dark:text-[#38BDF8]" /> JURISDICTIONAL RISK FORECAST ZONES
            </h2>
            <p className="text-[10px] text-text-dim dark:text-[#94A3B8] font-mono">Select a zone to view detailed predictive breakdown and response plan</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 font-mono">
          {PREDICTIVE_ZONES.map((zone) => {
            const isSelected = selectedZone.id === zone.id;
            return (
              <button
                key={zone.id}
                onClick={() => setSelectedZone(zone)}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                  isSelected
                    ? 'bg-accent/15 dark:bg-[#38BDF8]/15 border-accent dark:border-[#38BDF8] text-accent dark:text-[#38BDF8] shadow-xs'
                    : 'bg-surface-2 dark:bg-[#0E1422] border-border-soft dark:border-[#1E293B] hover:border-accent/40'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-text dark:text-[#F8FAFC] truncate">{zone.zoneName}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      zone.riskLevel === 'CRITICAL' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : zone.riskLevel === 'HIGH' ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20' : 'bg-accent/10 text-accent border border-accent/20'
                    }`}>
                      {zone.riskLevel}
                    </span>
                  </div>
                  <div className="text-[10px] text-text-dim dark:text-[#94A3B8]">{zone.dominantCrime}</div>
                </div>

                <div className="pt-2 border-t border-border-soft dark:border-[#1E293B] flex items-baseline justify-between">
                  <span className="text-[10px] text-text-dim dark:text-[#94A3B8]">Score</span>
                  <span className="text-base font-bold text-text dark:text-[#F8FAFC]">{zone.riskScore}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
