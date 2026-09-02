import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, Sparkles, PhoneCall, Video, Truck, GitBranch, CreditCard, 
  FileText, ExternalLink, ChevronRight, CheckCircle2, MapPin, AlertTriangle, 
  ArrowRight, Shield, Layers, RefreshCw, Network, HelpCircle
} from 'lucide-react';
import { 
  PRIMARY_DEMO_CASE, FUSION_NODES, FUSION_EDGES, INTELLIGENCE_SIGNALS, 
  FusionEntityNode 
} from '../data/round3DemoData';

const SIGNAL_ICONS: Record<string, any> = {
  FileText: FileText,
  PhoneCall: PhoneCall,
  Video: Video,
  Truck: Truck,
  GitBranch: GitBranch,
  CreditCard: CreditCard
};

export function IntelligenceFusionPage() {
  const navigate = useNavigate();
  const [selectedNode, setSelectedNode] = useState<FusionEntityNode | null>(FUSION_NODES[1]); // Default Rahul S.
  const [activeSignalFilter, setActiveSignalFilter] = useState<string>('ALL');

  const filteredSignals = INTELLIGENCE_SIGNALS.filter(sig => {
    if (activeSignalFilter === 'ALL') return true;
    return sig.sourceType === activeSignalFilter;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-6 rounded-2xl border border-border-soft shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/30 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={12} /> CCTNS 2.0-INSPIRED CAPABILITY
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-danger/10 text-danger border border-danger/30 text-[10px] font-mono font-bold uppercase tracking-wider">
              {PRIMARY_DEMO_CASE.caseNumber}
            </span>
          </div>
          <h1 className="text-2xl font-display font-bold text-text tracking-tight flex items-center gap-2">
            INTELLIGENCE FUSION CENTER
          </h1>
          <p className="text-xs text-text-dim mt-1 font-sans">
            Unified operational picture from multi-source investigation signals • {PRIMARY_DEMO_CASE.title}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate('/predictive-risk')}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand hover:bg-brand-hover text-bg font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            <span>FORECAST AREA RISK</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {/* Top Workspace Context Banner */}
      <div className="bg-surface-2 border border-brand/30 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shadow-sm">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-brand animate-pulse" />
          <span className="font-bold text-text uppercase">INVESTIGATION WORKSPACE:</span>
          <span className="text-brand font-bold">Operation Nightfall</span>
          <span className="text-text-dim text-[11px]">[{PRIMARY_DEMO_CASE.firNumber}]</span>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[11px]">
          <span className="text-text-dim">SOURCE: <strong className="text-text font-bold">5 evidence sources ingested</strong></span>
          <span className="text-text-dim">GRAPH: <strong className="text-text font-bold">42 entities • 67 relationships</strong></span>
          <span className="text-text-dim">DISCOVERIES: <strong className="text-amber-400 font-bold">6 cross-source correlations</strong></span>
        </div>
      </div>

      {/* CCTNS 2.0 Banner Info */}
      <div className="bg-surface-2/80 border border-brand/20 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand/15 border border-brand/30 flex items-center justify-center text-brand shrink-0 mt-0.5">
            <Shield size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-text font-mono uppercase tracking-wider">CCTNS 2.0-INSPIRED CAPABILITIES</h3>
              <span className="text-[10px] font-mono text-text-dim px-2 py-0.5 rounded bg-surface border border-border-soft">PROTOTYPE • SYNTHETIC DATA</span>
            </div>
            <p className="text-[11px] text-text-dim mt-0.5">
              Fusing FIR records, CDR analytics, CCTV ANPR sightings, vehicle associations, prior criminal records, and mule account links into one actionable intelligence picture.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] font-mono font-semibold">
          <span className="px-2 py-1 bg-surface rounded border border-border-soft text-text">✓ Multi-source Correlation</span>
          <span className="px-2 py-1 bg-surface rounded border border-border-soft text-text">✓ AI Threat Scoring</span>
          <span className="px-2 py-1 bg-surface rounded border border-border-soft text-text">✓ Entity Resolution</span>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface p-5 rounded-2xl border border-border-soft shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-danger/5 rounded-full blur-2xl -mr-6 -mt-6"></div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase font-bold text-text-dim tracking-wider">THREAT LEVEL</span>
            <span className="px-2 py-0.5 rounded bg-danger/20 text-danger text-[10px] font-mono font-bold border border-danger/30 animate-pulse">
              HIGH
            </span>
          </div>
          <div className="text-2xl font-display font-extrabold text-danger flex items-center gap-2">
            <ShieldAlert size={24} className="text-danger" />
            CRITICAL
          </div>
          <p className="text-[10px] font-mono text-text-dim mt-2">Converging high-risk signals</p>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-border-soft shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase font-bold text-text-dim tracking-wider">THREAT SCORE</span>
            <span className="text-[10px] font-mono text-brand font-bold">91% Index</span>
          </div>
          <div className="text-2xl font-display font-extrabold text-text flex items-baseline gap-1">
            {PRIMARY_DEMO_CASE.threatScore} <span className="text-xs text-text-dim font-normal font-mono">/ 100</span>
          </div>
          <div className="w-full bg-surface-2 h-1.5 rounded-full overflow-hidden mt-3">
            <div className="bg-gradient-to-r from-warning to-danger h-full rounded-full" style={{ width: `${PRIMARY_DEMO_CASE.threatScore}%` }}></div>
          </div>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-border-soft shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase font-bold text-text-dim tracking-wider">CORROBORATING SIGNALS</span>
            <span className="px-2 py-0.5 rounded bg-brand/10 text-brand text-[10px] font-mono font-bold border border-brand/30">
              100% Match
            </span>
          </div>
          <div className="text-2xl font-display font-extrabold text-brand flex items-baseline gap-1">
            0{PRIMARY_DEMO_CASE.corroboratingSignalsCount} <span className="text-xs text-text-dim font-normal font-mono">Independent feeds</span>
          </div>
          <p className="text-[10px] font-mono text-text-dim mt-2">FIR, CDR, CCTV, Vehicle, AML, History</p>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-border-soft shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase font-bold text-text-dim tracking-wider">LINKED CASES</span>
            <span className="text-[10px] font-mono text-amber-400 font-bold">Cross-Station</span>
          </div>
          <div className="text-2xl font-display font-extrabold text-text flex items-baseline gap-1">
            0{PRIMARY_DEMO_CASE.linkedCasesCount} <span className="text-xs text-text-dim font-normal font-mono">Indexed FIRs</span>
          </div>
          <p className="text-[10px] font-mono text-text-dim mt-2">Khandagiri PS & Capital PS</p>
        </div>
      </div>

      {/* Main Grid: Central Intelligence Graph & Node Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Central Graph Box (2 Cols) */}
        <div className="lg:col-span-2 bg-surface rounded-2xl border border-border-soft p-5 shadow-sm flex flex-col justify-between min-h-[460px]">
          <div className="flex items-center justify-between mb-4 border-b border-border-soft pb-3">
            <div>
              <h2 className="text-sm font-bold text-text font-mono uppercase tracking-wider flex items-center gap-2">
                <Network size={16} className="text-brand" /> CENTRAL INTELLIGENCE GRAPH
              </h2>
              <p className="text-[11px] text-text-dim">Multi-modal entity correlation matrix for Case #2026-0817</p>
            </div>
            <button
              onClick={() => navigate('/network')}
              className="flex items-center gap-1 text-xs font-mono font-bold text-brand hover:underline"
            >
              <span>FULL EXPLORER</span>
              <ExternalLink size={13} />
            </button>
          </div>

          {/* Interactive Graph Canvas Simulation */}
          <div className="relative flex-1 bg-surface-2/60 rounded-xl border border-border-soft p-6 overflow-hidden flex items-center justify-center min-h-[340px]">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>

            {/* Nodes Layout Grid */}
            <div className="relative z-10 w-full h-full flex flex-col justify-between items-center py-4">
              
              {/* Top Row: FIR Case & Suspect */}
              <div className="flex items-center justify-around w-full max-w-lg">
                <button
                  onClick={() => setSelectedNode(FUSION_NODES[0])}
                  className={`p-3 rounded-xl border font-mono text-xs font-bold transition-all shadow-md cursor-pointer ${
                    selectedNode?.id === FUSION_NODES[0].id
                      ? 'bg-brand text-bg border-brand ring-4 ring-brand/20 scale-105'
                      : 'bg-surface border-brand/50 text-brand hover:bg-surface-hover'
                  }`}
                >
                  <div className="text-[9px] uppercase font-bold text-text-dim">PRIMARY CASE</div>
                  <div>CASE #2026-0817</div>
                </button>

                <div className="h-0.5 w-16 bg-gradient-to-r from-brand to-danger animate-pulse"></div>

                <button
                  onClick={() => setSelectedNode(FUSION_NODES[1])}
                  className={`p-3 rounded-xl border font-mono text-xs font-bold transition-all shadow-md cursor-pointer ${
                    selectedNode?.id === FUSION_NODES[1].id
                      ? 'bg-danger text-white border-danger ring-4 ring-danger/20 scale-105'
                      : 'bg-surface border-danger/60 text-danger hover:bg-surface-hover'
                  }`}
                >
                  <div className="text-[9px] uppercase font-bold text-text-dim">SUSPECT</div>
                  <div>Rahul S. (94%)</div>
                </button>
              </div>

              {/* Middle Row: Phone, Vehicle, CCTV */}
              <div className="flex items-center justify-between w-full max-w-xl my-6 px-4">
                <button
                  onClick={() => setSelectedNode(FUSION_NODES[2])}
                  className={`p-2.5 rounded-xl border font-mono text-[11px] font-bold transition-all shadow-sm cursor-pointer ${
                    selectedNode?.id === FUSION_NODES[2].id
                      ? 'bg-amber-500 text-bg border-amber-500 ring-2 ring-amber-500/20'
                      : 'bg-surface border-border-soft text-text hover:border-amber-400'
                  }`}
                >
                  <PhoneCall size={14} className="mb-1 text-amber-400" />
                  +91-9199370000
                </button>

                <button
                  onClick={() => setSelectedNode(FUSION_NODES[3])}
                  className={`p-3 rounded-xl border font-mono text-xs font-bold transition-all shadow-md cursor-pointer ${
                    selectedNode?.id === FUSION_NODES[3].id
                      ? 'bg-brand text-bg border-brand ring-4 ring-brand/20 scale-105'
                      : 'bg-surface border-brand/60 text-text hover:border-brand'
                  }`}
                >
                  <Truck size={16} className="mb-1 text-brand" />
                  OD-02-MJ-8821
                </button>

                <button
                  onClick={() => setSelectedNode(FUSION_NODES[4])}
                  className={`p-2.5 rounded-xl border font-mono text-[11px] font-bold transition-all shadow-sm cursor-pointer ${
                    selectedNode?.id === FUSION_NODES[4].id
                      ? 'bg-purple-500 text-white border-purple-500 ring-2 ring-purple-500/20'
                      : 'bg-surface border-border-soft text-text hover:border-purple-400'
                  }`}
                >
                  <Video size={14} className="mb-1 text-purple-400" />
                  CCTV KDG-04
                </button>
              </div>

              {/* Bottom Row: Previous FIRs, Mule Account, Location */}
              <div className="flex flex-wrap items-center justify-around w-full max-w-xl gap-2">
                <button
                  onClick={() => setSelectedNode(FUSION_NODES[5])}
                  className={`p-2 rounded-lg border font-mono text-[10px] font-bold transition-all cursor-pointer ${
                    selectedNode?.id === FUSION_NODES[5].id ? 'bg-surface-hover border-text text-text' : 'bg-surface border-border-soft text-text-dim'
                  }`}
                >
                  FIR-2025-114
                </button>

                <button
                  onClick={() => setSelectedNode(FUSION_NODES[7])}
                  className={`p-2.5 rounded-xl border font-mono text-[11px] font-bold transition-all cursor-pointer ${
                    selectedNode?.id === FUSION_NODES[7].id
                      ? 'bg-emerald-500 text-bg border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'bg-surface border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10'
                  }`}
                >
                  <CreditCard size={14} className="inline mr-1 text-emerald-400" />
                  Mule M-204
                </button>

                <button
                  onClick={() => setSelectedNode(FUSION_NODES[8])}
                  className={`p-2.5 rounded-xl border font-mono text-[11px] font-bold transition-all cursor-pointer ${
                    selectedNode?.id === FUSION_NODES[8].id
                      ? 'bg-danger text-white border-danger ring-2 ring-danger/20'
                      : 'bg-surface border-danger/40 text-danger hover:bg-danger/10'
                  }`}
                >
                  <MapPin size={14} className="inline mr-1 text-danger" />
                  Khandagiri
                </button>
              </div>

            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-text-dim">
            <span>Click any node to inspect signal details</span>
            <span>9 Entity Nodes • 9 Relationship Edges</span>
          </div>
        </div>

        {/* Selected Entity Inspector Panel */}
        <div className="bg-surface rounded-2xl border border-border-soft p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-border-soft pb-3">
              <h3 className="text-xs font-bold text-text font-mono uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} className="text-brand" /> ENTITY INSPECTOR
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-surface-2 rounded text-brand border border-border-soft">
                {selectedNode?.type || 'ENTITY'}
              </span>
            </div>

            {selectedNode ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-surface-2 border border-border-soft">
                  <div className="text-[10px] font-mono uppercase font-bold text-text-dim">Selected Element</div>
                  <div className="text-base font-bold text-text font-mono mt-0.5">{selectedNode.label}</div>
                  <div className="text-xs text-text-dim mt-1">{selectedNode.subtitle}</div>
                  
                  {selectedNode.riskScore && (
                    <div className="mt-3 pt-2 border-t border-border-soft flex items-center justify-between">
                      <span className="text-[10px] font-mono text-text-dim">Risk Rating</span>
                      <span className="text-xs font-mono font-bold text-danger">{selectedNode.riskScore} / 100</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="text-[10px] font-mono uppercase font-bold text-text-dim">Connected Relationships</div>
                  
                  {FUSION_EDGES.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).map((edge) => (
                    <div key={edge.id} className="p-2.5 rounded-lg bg-surface border border-border-soft text-xs flex items-center justify-between">
                      <span className="font-mono text-brand font-semibold text-[11px]">{edge.label}</span>
                      <span className="text-[10px] font-mono text-text-dim">{edge.confidence}% Conf.</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-text-dim text-xs">Select a node from the graph to inspect intelligence.</div>
            )}
          </div>

          <div className="pt-4 border-t border-border-soft mt-4 space-y-2">
            <button
              onClick={() => navigate('/network')}
              className="w-full py-2 bg-surface-2 hover:bg-surface-hover text-text font-mono text-xs font-bold rounded-xl border border-border-soft flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Network size={14} className="text-brand" /> VIEW CONNECTED NETWORK
            </button>
          </div>
        </div>
      </div>

      {/* Signal Sources Cards Section */}
      <div className="bg-surface rounded-2xl border border-border-soft p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border-b border-border-soft pb-4">
          <div>
            <h2 className="text-base font-bold text-text font-mono uppercase tracking-wider flex items-center gap-2">
              <Layers size={18} className="text-brand" /> CORROBORATING INTELLIGENCE SIGNALS
            </h2>
            <p className="text-xs text-text-dim">6 verified operational feeds converging on Case #2026-0817</p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'FIR', 'CDR', 'CCTV', 'VEHICLE', 'FINANCIAL'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveSignalFilter(filter)}
                className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  activeSignalFilter === filter
                    ? 'bg-brand text-bg font-bold shadow-sm'
                    : 'bg-surface-2 text-text-dim hover:text-text border border-border-soft'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSignals.map((signal) => {
            const IconComp = SIGNAL_ICONS[signal.iconName] || FileText;
            return (
              <div
                key={signal.id}
                className="p-4 rounded-xl bg-surface-2/70 border border-border-soft hover:border-brand/40 transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-brand/10 border border-brand/30 flex items-center justify-center text-brand">
                        <IconComp size={15} />
                      </div>
                      <span className="text-xs font-mono font-bold text-text">{signal.source}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-brand bg-brand/10 px-2 py-0.5 rounded border border-brand/20">
                      {signal.confidence}% Conf
                    </span>
                  </div>

                  <p className="text-xs text-text-dim font-sans leading-relaxed">{signal.description}</p>
                </div>

                {signal.details && (
                  <div className="p-2.5 rounded-lg bg-surface border border-border-soft space-y-1 font-mono text-[10px]">
                    {Object.entries(signal.details).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-text-dim">{k}:</span>
                        <span className="text-text font-bold truncate max-w-[150px]">{v}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2 border-t border-border-soft/60 flex items-center justify-between text-[10px] font-mono text-text-dim">
                  <span>Timestamp: {signal.timestamp}</span>
                  <span className="text-success font-bold flex items-center gap-1">
                    <CheckCircle2 size={12} /> Verified
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Assessment & Why This Alert Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Assessment Text Box (2 Cols) */}
        <div className="lg:col-span-2 bg-gradient-to-br from-surface to-surface-2 p-6 rounded-2xl border border-brand/30 shadow-md space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand/20 border border-brand/40 flex items-center justify-center text-brand">
              <Sparkles size={18} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text font-mono uppercase tracking-wider">AI INVESTIGATION ASSESSMENT</h2>
              <p className="text-[10px] font-mono text-brand font-semibold">S.I.R.I.S Intelligence Correlation Engine</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface/90 border border-border-soft text-sm text-text leading-relaxed font-sans shadow-inner">
            "Multiple independent intelligence signals converge on the same subject (<strong className="text-brand">Rahul S.</strong>) and vehicle (<strong className="text-brand">OD-02-MJ-8821</strong>). The subject has links to previous cases (<strong className="text-amber-400">FIR-2025-114, FIR-2026-031</strong>), a recurring CDR relationship, recent CCTV activity near Khandagiri Square at 19:42 IST and a suspicious financial association with Mule Account <strong className="text-emerald-400">M-204</strong>."
          </div>

          <div>
            <h3 className="text-xs font-mono font-bold text-text-dim uppercase mb-2 tracking-wider">WHY THIS ALERT? (EVIDENCE CHIPS)</h3>
            <div className="flex flex-wrap gap-2">
              {[
                '+ Previous case similarity',
                '+ Repeat offender activity',
                '+ Recent CCTV sighting',
                '+ CDR relationship',
                '+ Financial anomaly',
                '+ Geographic overlap'
              ].map((chip, idx) => (
                <span key={idx} className="px-3 py-1.5 rounded-lg bg-surface-2 text-text text-xs font-mono font-bold border border-border-soft flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand"></span>
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Operational Navigation Shortcuts */}
        <div className="bg-surface p-6 rounded-2xl border border-border-soft shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-xs font-bold text-text font-mono uppercase tracking-wider mb-1 flex items-center gap-2">
              <Layers size={14} className="text-brand" /> DEEP INVESTIGATION DRILL-DOWN
            </h3>
            <p className="text-[11px] text-text-dim mb-4">Navigate directly to specialized intelligence workspaces:</p>

            <div className="space-y-2">
              <button
                onClick={() => navigate('/money-trail')}
                className="w-full p-2.5 bg-surface-2 hover:bg-surface-hover text-text font-mono text-xs font-bold rounded-xl border border-border-soft flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2"><CreditCard size={14} className="text-emerald-400" /> OPEN MONEY TRAIL</span>
                <ChevronRight size={14} className="text-text-dim" />
              </button>

              <button
                onClick={() => navigate('/trail')}
                className="w-full p-2.5 bg-surface-2 hover:bg-surface-hover text-text font-mono text-xs font-bold rounded-xl border border-border-soft flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2"><Truck size={14} className="text-brand" /> VIEW GEO TRAIL</span>
                <ChevronRight size={14} className="text-text-dim" />
              </button>

              <button
                onClick={() => navigate('/cdr')}
                className="w-full p-2.5 bg-surface-2 hover:bg-surface-hover text-text font-mono text-xs font-bold rounded-xl border border-border-soft flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2"><PhoneCall size={14} className="text-amber-400" /> VIEW CDR</span>
                <ChevronRight size={14} className="text-text-dim" />
              </button>

              <button
                onClick={() => navigate('/cctv')}
                className="w-full p-2.5 bg-surface-2 hover:bg-surface-hover text-text font-mono text-xs font-bold rounded-xl border border-border-soft flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2"><Video size={14} className="text-purple-400" /> VIEW CCTV</span>
                <ChevronRight size={14} className="text-text-dim" />
              </button>
            </div>
          </div>

          <button
            onClick={() => navigate('/predictive-risk')}
            className="w-full py-3 bg-brand hover:bg-brand-hover text-bg font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>PREDICTIVE CRIME RISK</span>
            <ArrowRight size={15} />
          </button>
        </div>

      </div>
    </div>
  );
}
