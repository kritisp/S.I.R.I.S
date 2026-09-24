import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Navigation, ShieldAlert, Sparkles, CheckCircle2, RefreshCw, Truck, 
  MapPin, Clock, AlertTriangle, ArrowRight, Shield, Activity, Users, Layers, ExternalLink, X
} from 'lucide-react';
import { 
  SYNTHETIC_PATROL_UNITS, INITIAL_AI_RECOMMENDATIONS, PatrolUnit, DeploymentRecommendation 
} from '../data/round3DemoData';

export function ResourceOptimizationPage() {
  const navigate = useNavigate();
  const [units, setUnits] = useState<PatrolUnit[]>(SYNTHETIC_PATROL_UNITS);
  const [recommendations, setRecommendations] = useState<DeploymentRecommendation[]>(INITIAL_AI_RECOMMENDATIONS);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [optimizationComplete, setOptimizationComplete] = useState<boolean>(false);
  const [selectedDeployRec, setSelectedDeployRec] = useState<DeploymentRecommendation | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Trigger deterministic optimization simulation
  const handleOptimizeDeployment = () => {
    setIsOptimizing(true);
    setOptimizationComplete(false);

    setTimeout(() => {
      setIsOptimizing(false);
      setOptimizationComplete(true);
      
      // Re-order recommendations with updated optimal score priorities
      setRecommendations(prev => [...prev].sort((a, b) => (a.priority === 'CRITICAL' ? -1 : 1)));
    }, 1200);
  };

  // Confirm simulated deployment
  const confirmDeployment = () => {
    if (!selectedDeployRec) return;

    const rec = selectedDeployRec;
    setSelectedDeployRec(null);

    // Update recommendation status
    setRecommendations(prev => prev.map(r => r.id === rec.id ? { ...r, status: 'DEPLOYED' } : r));

    // Update matching unit status
    setUnits(prev => prev.map(u => u.unitCode === rec.unitCode ? { ...u, status: 'DISPATCHED', assignedZone: rec.targetZone } : u));

    // Show simulation toast feedback
    setNotificationMsg(`DEPLOYMENT SIMULATED: ${rec.unitCode} assigned to ${rec.targetZone} (${rec.recommendedTimeWindow}).`);
    setTimeout(() => setNotificationMsg(null), 5000);
  };

  return (
    <div className="max-w-[1520px] mx-auto space-y-4 font-sans select-none text-text dark:text-[#F8FAFC] pb-24">
      {/* ── UNIFIED COMMAND-CENTER HEADER ── */}
      <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-3.5 sm:p-4 shadow-xs dark:shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-2 dark:bg-[#0E1422] border border-accent/40 dark:border-[#38BDF8]/40 flex items-center justify-center text-accent dark:text-[#38BDF8] shadow-xs shrink-0">
              <Truck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-accent dark:text-[#38BDF8]">
                  RESOURCE OPTIMIZATION
                </span>
                <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  STATEWIDE FLEET ACTIVE
                </span>
                <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-text-dim dark:text-[#94A3B8]">
                  PATROL ROUTING & ALLOCATION
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-text dark:text-[#F8FAFC] mt-0.5">
                Patrol Resource & Dispatch Allocation Engine
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleOptimizeDeployment}
              disabled={isOptimizing}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-bg dark:bg-[#38BDF8] dark:text-[#070A0F] font-mono font-bold text-xs rounded-lg hover:bg-accent-bright dark:hover:bg-[#0284C7] shadow-xs transition-all cursor-pointer disabled:opacity-50 uppercase"
            >
              <RefreshCw size={14} className={isOptimizing ? 'animate-spin' : ''} />
              <span>{isOptimizing ? 'RECALCULATING...' : 'OPTIMIZE DEPLOYMENT'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Simulation Feedback Toast */}
      {notificationMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono text-xs flex items-center justify-between shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span className="font-bold">{notificationMsg}</span>
          </div>
          <span className="text-[10px] bg-emerald-950 px-2 py-0.5 rounded font-bold border border-emerald-500/30">SIMULATION ACTIVE</span>
        </div>
      )}

      {/* Optimization Results Summary Banner (After clicking Optimize) */}
      {optimizationComplete && (
        <div className="bg-surface dark:bg-[#0B0F17] border border-accent/40 dark:border-[#38BDF8]/40 rounded-xl p-4 sm:p-5 shadow-xs dark:shadow-2xl space-y-3 animate-slide-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <h2 className="text-xs font-mono font-bold text-text dark:text-[#F8FAFC] uppercase tracking-wider">OPTIMIZATION COMPLETE</h2>
              <span className="px-2 py-0.5 rounded bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-[10px] font-mono text-text-dim dark:text-[#94A3B8]">SIMULATION</span>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-bold">+27% Estimated Coverage Improvement</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
            <div className="bg-surface-2 dark:bg-[#0E1422] p-3 rounded-lg border border-border-soft dark:border-[#1E293B]">
              <div className="text-[10px] font-mono text-text-dim dark:text-[#94A3B8]">Available Patrol Units</div>
              <div className="text-base font-bold font-mono text-text dark:text-[#F8FAFC]">12 Units</div>
            </div>
            <div className="bg-surface-2 dark:bg-[#0E1422] p-3 rounded-lg border border-border-soft dark:border-[#1E293B]">
              <div className="text-[10px] font-mono text-text-dim dark:text-[#94A3B8]">Priority Deployments</div>
              <div className="text-base font-bold font-mono text-accent dark:text-[#38BDF8]">8 Zones</div>
            </div>
            <div className="bg-surface-2 dark:bg-[#0E1422] p-3 rounded-lg border border-border-soft dark:border-[#1E293B]">
              <div className="text-[10px] font-mono text-text-dim dark:text-[#94A3B8]">Coverage Improvement</div>
              <div className="text-base font-bold font-mono text-emerald-400">+27%</div>
            </div>
            <div className="bg-surface-2 dark:bg-[#0E1422] p-3 rounded-lg border border-border-soft dark:border-[#1E293B]">
              <div className="text-[10px] font-mono text-text-dim dark:text-[#94A3B8]">Resource Conflicts</div>
              <div className="text-base font-bold font-mono text-text dark:text-[#F8FAFC]">0 Conflicts</div>
            </div>
          </div>
        </div>
      )}

      {/* AI Recommendations List */}
      <div className="bg-surface dark:bg-[#0B0F17] rounded-xl border border-border-soft dark:border-[#1E293B] p-4 sm:p-5 shadow-xs dark:shadow-2xl">
        <div className="flex items-center justify-between mb-4 border-b border-border-soft dark:border-[#1E293B] pb-3">
          <div>
            <h2 className="text-xs font-bold text-text dark:text-[#F8FAFC] font-mono uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={14} className="text-accent dark:text-[#38BDF8]" /> AI DEPLOYMENT RECOMMENDATIONS
            </h2>
            <p className="text-[11px] text-text-dim dark:text-[#94A3B8]">Prioritized patrol allocations matched to high-risk zones</p>
          </div>
          <span className="text-[11px] font-mono text-text-dim dark:text-[#94A3B8] bg-surface-2 dark:bg-[#0E1422] px-2.5 py-1 rounded-lg border border-border-soft dark:border-[#1E293B]">
            {recommendations.length} Active Recommendations
          </span>
        </div>

        <div className="space-y-3">
          {recommendations.map((rec) => {
            const isDeployed = rec.status === 'DEPLOYED';
            return (
              <div
                key={rec.id}
                className={`p-4 rounded-xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                  isDeployed
                    ? 'bg-emerald-950/20 border-emerald-500/40 shadow-xs'
                    : rec.priority === 'CRITICAL'
                      ? 'bg-rose-500/5 border-rose-500/30 shadow-xs'
                      : 'bg-surface-2/60 dark:bg-[#0E1422]/60 border-border-soft dark:border-[#1E293B] hover:bg-surface-hover dark:hover:bg-[#151D2E]'
                }`}
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                      rec.priority === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : rec.priority === 'HIGH' ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30' : 'bg-accent/20 text-accent dark:bg-[#38BDF8]/20 dark:text-[#38BDF8] border border-accent/30 dark:border-[#38BDF8]/30'
                    }`}>
                      {rec.priority} PRIORITY
                    </span>

                    <h3 className="text-xs font-bold text-text dark:text-[#F8FAFC] font-mono flex items-center gap-1.5">
                      <Truck size={14} className="text-accent dark:text-[#38BDF8]" />
                      {rec.unitCode} <ArrowRight size={13} className="text-text-dim dark:text-[#94A3B8]" /> {rec.targetZone}
                    </h3>

                    {isDeployed && (
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[10px] rounded border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 size={12} /> DEPLOYED
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-text-dim dark:text-[#94A3B8]">
                    <span className="flex items-center gap-1"><Clock size={12} className="text-accent dark:text-[#38BDF8]" /> Time: {rec.recommendedTimeWindow}</span>
                    <span className="flex items-center gap-1"><AlertTriangle size={12} className="text-amber-400" /> Threat: {rec.predictedCrime}</span>
                  </div>

                  <div className="space-y-0.5 pt-0.5 font-mono text-[10px]">
                    <div className="text-text-dim dark:text-[#94A3B8] font-bold">AI Rationale:</div>
                    {rec.rationale.map((rat, rIdx) => (
                      <div key={rIdx} className="flex items-center gap-1.5 text-text dark:text-[#F8FAFC]">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent dark:bg-[#38BDF8]"></span>
                        <span>{rat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions per recommendation */}
                <div className="flex flex-wrap lg:flex-col items-center gap-2 shrink-0 border-t lg:border-t-0 lg:border-l border-border-soft dark:border-[#1E293B] pt-3 lg:pt-0 lg:pl-4">
                  <button
                    onClick={() => navigate('/map')}
                    className="flex-1 lg:w-full py-1.5 px-3 bg-surface-2 dark:bg-[#0E1422] hover:bg-surface-hover dark:hover:bg-[#151D2E] text-text dark:text-[#F8FAFC] font-mono text-xs font-bold rounded-lg border border-border-soft dark:border-[#1E293B] transition-colors cursor-pointer text-center uppercase"
                  >
                    VIEW AREA
                  </button>

                  <button
                    onClick={() => navigate('/intelligence-fusion')}
                    className="flex-1 lg:w-full py-1.5 px-3 bg-surface-2 dark:bg-[#0E1422] hover:bg-surface-hover dark:hover:bg-[#151D2E] text-text dark:text-[#F8FAFC] font-mono text-xs font-bold rounded-lg border border-border-soft dark:border-[#1E293B] transition-colors cursor-pointer text-center uppercase"
                  >
                    VIEW INTEL
                  </button>

                  <button
                    onClick={() => setSelectedDeployRec(rec)}
                    disabled={isDeployed}
                    className={`flex-1 lg:w-full py-1.5 px-3 font-mono text-xs font-bold rounded-lg transition-all cursor-pointer text-center uppercase ${
                      isDeployed
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30 cursor-not-allowed'
                        : 'bg-accent text-bg dark:bg-[#38BDF8] dark:text-[#070A0F] hover:bg-accent-bright dark:hover:bg-[#0284C7] shadow-xs'
                    }`}
                  >
                    {isDeployed ? 'ASSIGNED' : 'DEPLOY UNIT'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Available Resources Roster Grid */}
      <div className="bg-surface dark:bg-[#0B0F17] rounded-xl border border-border-soft dark:border-[#1E293B] p-4 sm:p-5 shadow-xs dark:shadow-2xl">
        <div className="flex items-center justify-between mb-4 border-b border-border-soft dark:border-[#1E293B] pb-3">
          <div>
            <h2 className="text-xs font-bold text-text dark:text-[#F8FAFC] font-mono uppercase tracking-wider flex items-center gap-2">
              <Truck size={14} className="text-accent dark:text-[#38BDF8]" /> AVAILABLE PATROL UNITS & INTERCEPTORS
            </h2>
            <p className="text-[11px] text-text-dim dark:text-[#94A3B8]">Real-time status roster for Bhubaneswar Urban command units</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {units.map((unit) => (
            <div key={unit.id} className="p-3.5 rounded-lg bg-surface-2/60 dark:bg-[#0E1422]/60 border border-border-soft dark:border-[#1E293B] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-accent/10 dark:bg-[#38BDF8]/10 border border-accent/30 dark:border-[#38BDF8]/30 flex items-center justify-center text-accent dark:text-[#38BDF8] font-bold font-mono text-[11px]">
                    {unit.unitCode.split(' ')[1]}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold font-mono text-text dark:text-[#F8FAFC]">{unit.unitCode}</h3>
                    <p className="text-[10px] text-text-dim dark:text-[#94A3B8] font-mono">{unit.vehicleType}</p>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                  unit.status === 'AVAILABLE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : unit.status === 'DISPATCHED' ? 'bg-accent/20 text-accent dark:bg-[#38BDF8]/20 dark:text-[#38BDF8] border border-accent/30 dark:border-[#38BDF8]/30' : 'bg-surface-2 dark:bg-[#0E1422] text-text-dim dark:text-[#94A3B8] border border-border-soft dark:border-[#1E293B]'
                }`}>
                  {unit.status}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] space-y-1 font-mono text-[10px]">
                <div className="flex justify-between">
                  <span className="text-text-dim dark:text-[#94A3B8]">Officer:</span>
                  <span className="text-text dark:text-[#F8FAFC] font-bold">{unit.officerInCharge}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-dim dark:text-[#94A3B8]">Location:</span>
                  <span className="text-text dark:text-[#F8FAFC] font-bold truncate max-w-[150px]">{unit.currentLocation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-dim dark:text-[#94A3B8]">Distance / ETA:</span>
                  <span className="text-accent dark:text-[#38BDF8] font-bold">{unit.distanceKm} km ({unit.etaMins} mins)</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SIMULATED DEPLOYMENT CONFIRMATION MODAL */}
      {selectedDeployRec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in select-none">
          <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl max-w-md w-full p-5 shadow-2xl space-y-3.5 font-sans text-text dark:text-[#F8FAFC]">
            <div className="flex items-center justify-between border-b border-border-soft dark:border-[#1E293B] pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-accent/20 dark:bg-[#38BDF8]/20 border border-accent/40 dark:border-[#38BDF8]/40 flex items-center justify-center text-accent dark:text-[#38BDF8]">
                  <Navigation size={15} />
                </div>
                <div>
                  <h3 className="text-xs font-mono font-bold text-text dark:text-[#F8FAFC] uppercase tracking-wider">AI RECOMMENDATION DEPLOYMENT</h3>
                  <p className="text-[10px] text-accent dark:text-[#38BDF8] font-mono">Simulated Dispatch Protocol</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedDeployRec(null)}
                className="text-text-dim dark:text-[#94A3B8] hover:text-text dark:hover:text-[#F8FAFC] p-1 rounded-lg hover:bg-surface-hover dark:hover:bg-[#151D2E] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-3 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] space-y-1.5 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-text-dim dark:text-[#94A3B8]">Assigned Unit:</span>
                <span className="font-bold text-accent dark:text-[#38BDF8]">{selectedDeployRec.unitCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-dim dark:text-[#94A3B8]">Target Zone:</span>
                <span className="font-bold text-text dark:text-[#F8FAFC]">{selectedDeployRec.targetZone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-dim dark:text-[#94A3B8]">Patrol Window:</span>
                <span className="font-bold text-amber-400">{selectedDeployRec.recommendedTimeWindow}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-dim dark:text-[#94A3B8]">Priority Level:</span>
                <span className="font-bold text-rose-400">{selectedDeployRec.priority}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-accent/10 dark:bg-[#38BDF8]/10 border border-accent/30 dark:border-[#38BDF8]/30 text-[11px] text-text-dim dark:text-[#94A3B8] font-mono">
              Confirming will trigger simulated QRT patrol dispatch for {selectedDeployRec.targetZone} and update statewide fleet availability.
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setSelectedDeployRec(null)}
                className="flex-1 py-2 bg-surface-2 dark:bg-[#0E1422] hover:bg-surface-hover dark:hover:bg-[#151D2E] text-text dark:text-[#F8FAFC] font-mono text-xs font-bold rounded-lg border border-border-soft dark:border-[#1E293B] transition-colors cursor-pointer uppercase"
              >
                CANCEL
              </button>
              <button
                onClick={confirmDeployment}
                className="flex-1 py-2 bg-accent text-bg dark:bg-[#38BDF8] dark:text-[#070A0F] hover:bg-accent-bright dark:hover:bg-[#0284C7] font-mono font-bold text-xs rounded-lg shadow-xs transition-all cursor-pointer uppercase"
              >
                CONFIRM DISPATCH
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
