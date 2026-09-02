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
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-6 rounded-2xl border border-border-soft shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={12} /> CCTNS 2.0 RESOURCE ENGINE • SIMULATION
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/30 text-[10px] font-mono font-bold uppercase tracking-wider">
              STATEWIDE PATROL DISPATCH
            </span>
          </div>
          <h1 className="text-2xl font-display font-bold text-text tracking-tight flex items-center gap-2">
            AI RESOURCE OPTIMIZATION
          </h1>
          <p className="text-xs text-text-dim mt-1 font-sans">
            Convert predicted risk into actionable deployment recommendations
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleOptimizeDeployment}
            disabled={isOptimizing}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand hover:bg-brand-hover text-bg font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={15} className={isOptimizing ? 'animate-spin' : ''} />
            <span>{isOptimizing ? 'RECALCULATING...' : 'OPTIMIZE DEPLOYMENT'}</span>
          </button>
        </div>
      </div>

      {/* Simulation Feedback Toast */}
      {notificationMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono text-xs flex items-center justify-between shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            <span className="font-bold">{notificationMsg}</span>
          </div>
          <span className="text-[10px] bg-emerald-950 px-2 py-0.5 rounded font-bold border border-emerald-500/30">SIMULATION ACTIVE</span>
        </div>
      )}

      {/* Optimization Results Summary Banner (After clicking Optimize) */}
      {optimizationComplete && (
        <div className="bg-gradient-to-r from-brand/15 via-surface to-emerald-500/15 border border-brand/30 rounded-2xl p-5 shadow-sm space-y-3 animate-slide-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-success animate-ping"></span>
              <h2 className="text-xs font-mono font-bold text-text uppercase tracking-wider">OPTIMIZATION COMPLETE</h2>
              <span className="px-2 py-0.5 rounded bg-surface border border-border-soft text-[10px] font-mono text-text-dim">SIMULATION</span>
            </div>
            <span className="text-xs font-mono text-success font-bold">+27% Estimated Coverage Improvement</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div className="bg-surface/80 p-3 rounded-xl border border-border-soft">
              <div className="text-[10px] font-mono text-text-dim">Available Patrol Units</div>
              <div className="text-lg font-bold font-mono text-text">12 Units</div>
            </div>
            <div className="bg-surface/80 p-3 rounded-xl border border-border-soft">
              <div className="text-[10px] font-mono text-text-dim">Priority Deployments</div>
              <div className="text-lg font-bold font-mono text-brand">8 Zones</div>
            </div>
            <div className="bg-surface/80 p-3 rounded-xl border border-border-soft">
              <div className="text-[10px] font-mono text-text-dim">Coverage Improvement</div>
              <div className="text-lg font-bold font-mono text-success">+27%</div>
            </div>
            <div className="bg-surface/80 p-3 rounded-xl border border-border-soft">
              <div className="text-[10px] font-mono text-text-dim">Resource Conflicts</div>
              <div className="text-lg font-bold font-mono text-text">0 Conflicts</div>
            </div>
          </div>
        </div>
      )}

      {/* AI Recommendations List */}
      <div className="bg-surface rounded-2xl border border-border-soft p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6 border-b border-border-soft pb-4">
          <div>
            <h2 className="text-base font-bold text-text font-mono uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={18} className="text-brand" /> AI DEPLOYMENT RECOMMENDATIONS
            </h2>
            <p className="text-xs text-text-dim">Prioritized patrol allocations matched to high-risk zones</p>
          </div>
          <span className="text-xs font-mono text-text-dim bg-surface-2 px-3 py-1 rounded-lg border border-border-soft">
            {recommendations.length} Active Recommendations
          </span>
        </div>

        <div className="space-y-4">
          {recommendations.map((rec, idx) => {
            const isDeployed = rec.status === 'DEPLOYED';
            return (
              <div
                key={rec.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6 ${
                  isDeployed
                    ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm'
                    : rec.priority === 'CRITICAL'
                      ? 'bg-danger/5 border-danger/40 shadow-sm'
                      : 'bg-surface-2/60 border-border-soft hover:bg-surface-hover'
                }`}
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-0.5 rounded font-mono font-bold text-[10px] ${
                      rec.priority === 'CRITICAL' ? 'bg-danger/20 text-danger border border-danger/30' : rec.priority === 'HIGH' ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30' : 'bg-brand/20 text-brand border border-brand/30'
                    }`}>
                      {rec.priority} PRIORITY
                    </span>

                    <h3 className="text-sm font-bold text-text font-mono flex items-center gap-2">
                      <Truck size={16} className="text-brand" />
                      {rec.unitCode} <ArrowRight size={14} className="text-text-dim" /> {rec.targetZone}
                    </h3>

                    {isDeployed && (
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[10px] rounded border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 size={12} /> DEPLOYED
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-text-dim">
                    <span className="flex items-center gap-1"><Clock size={13} className="text-brand" /> Time: {rec.recommendedTimeWindow}</span>
                    <span className="flex items-center gap-1"><AlertTriangle size={13} className="text-amber-400" /> Threat: {rec.predictedCrime}</span>
                  </div>

                  <div className="space-y-1 pt-1 font-mono text-[11px]">
                    <div className="text-text-dim font-bold">AI Rationale:</div>
                    {rec.rationale.map((rat, rIdx) => (
                      <div key={rIdx} className="flex items-center gap-2 text-text">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand"></span>
                        <span>{rat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions per recommendation */}
                <div className="flex flex-wrap lg:flex-col items-center gap-2 shrink-0 border-t lg:border-t-0 lg:border-l border-border-soft pt-4 lg:pt-0 lg:pl-6">
                  <button
                    onClick={() => navigate('/map')}
                    className="flex-1 lg:w-full py-2 px-3 bg-surface hover:bg-surface-hover text-text font-mono text-xs font-bold rounded-xl border border-border-soft transition-colors cursor-pointer text-center"
                  >
                    VIEW AREA
                  </button>

                  <button
                    onClick={() => navigate('/intelligence-fusion')}
                    className="flex-1 lg:w-full py-2 px-3 bg-surface hover:bg-surface-hover text-text font-mono text-xs font-bold rounded-xl border border-border-soft transition-colors cursor-pointer text-center"
                  >
                    VIEW INTELLIGENCE
                  </button>

                  <button
                    onClick={() => setSelectedDeployRec(rec)}
                    disabled={isDeployed}
                    className={`flex-1 lg:w-full py-2 px-4 font-mono text-xs font-bold rounded-xl transition-all cursor-pointer text-center ${
                      isDeployed
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30 cursor-not-allowed'
                        : 'bg-brand hover:bg-brand-hover text-bg shadow-sm'
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
      <div className="bg-surface rounded-2xl border border-border-soft p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6 border-b border-border-soft pb-4">
          <div>
            <h2 className="text-base font-bold text-text font-mono uppercase tracking-wider flex items-center gap-2">
              <Truck size={18} className="text-brand" /> AVAILABLE PATROL UNITS & INTERCEPTORS
            </h2>
            <p className="text-xs text-text-dim">Real-time status roster for Bhubaneswar Urban command units</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {units.map((unit) => (
            <div key={unit.id} className="p-4 rounded-xl bg-surface-2/60 border border-border-soft space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-brand/10 border border-brand/30 flex items-center justify-center text-brand font-bold font-mono text-xs">
                    {unit.unitCode.split(' ')[1]}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold font-mono text-text">{unit.unitCode}</h3>
                    <p className="text-[10px] text-text-dim font-mono">{unit.vehicleType}</p>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                  unit.status === 'AVAILABLE' ? 'bg-success/20 text-success' : unit.status === 'DISPATCHED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-brand/20 text-brand'
                }`}>
                  {unit.status}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-surface border border-border-soft space-y-1 font-mono text-[10px]">
                <div className="flex justify-between">
                  <span className="text-text-dim">Officer in Charge:</span>
                  <span className="text-text font-bold">{unit.officerInCharge}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-dim">Location:</span>
                  <span className="text-text font-bold truncate max-w-[150px]">{unit.currentLocation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-dim">Distance / ETA:</span>
                  <span className="text-brand font-bold">{unit.distanceKm} km ({unit.etaMins} mins)</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SIMULATED DEPLOYMENT CONFIRMATION MODAL */}
      {selectedDeployRec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface border border-border-strong rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 font-sans">
            <div className="flex items-center justify-between border-b border-border-soft pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand/20 border border-brand/40 flex items-center justify-center text-brand">
                  <Navigation size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-mono font-bold text-text uppercase tracking-wider">AI RECOMMENDATION DEPLOYMENT</h3>
                  <p className="text-[10px] text-brand font-mono">Simulated Dispatch Protocol</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedDeployRec(null)}
                className="text-text-dim hover:text-text p-1 rounded-lg hover:bg-surface-hover cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-surface-2 border border-border-soft space-y-2 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-text-dim">Assigned Unit:</span>
                <span className="font-bold text-brand">{selectedDeployRec.unitCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-dim">Target Zone:</span>
                <span className="font-bold text-text">{selectedDeployRec.targetZone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-dim">Patrol Window:</span>
                <span className="font-bold text-amber-400">{selectedDeployRec.recommendedTimeWindow}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-dim">Priority Level:</span>
                <span className="font-bold text-danger">{selectedDeployRec.priority}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-brand/10 border border-brand/30 text-[11px] text-text-dim font-mono">
              Confirming will trigger simulated QRT patrol dispatch for {selectedDeployRec.targetZone} and update statewide fleet availability.
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setSelectedDeployRec(null)}
                className="flex-1 py-2.5 bg-surface-2 hover:bg-surface-hover text-text font-mono text-xs font-bold rounded-xl border border-border-soft transition-colors cursor-pointer"
              >
                CANCEL
              </button>
              <button
                onClick={confirmDeployment}
                className="flex-1 py-2.5 bg-brand hover:bg-brand-hover text-bg font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                CONFIRM SIMULATED DEPLOYMENT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
