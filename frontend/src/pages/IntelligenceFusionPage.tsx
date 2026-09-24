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
    <div className="max-w-[1520px] mx-auto space-y-4 font-sans select-none text-text dark:text-[#F8FAFC] pb-24">
      {/* ── 1. COMMAND HEADER & FUSION HUB ── */}
      <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-3.5 sm:p-4 shadow-xs dark:shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-2 dark:bg-[#0E1422] border border-accent/40 dark:border-[#38BDF8]/40 flex items-center justify-center text-accent dark:text-[#38BDF8] shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-text dark:text-[#F8FAFC] uppercase">
                  INTELLIGENCE FUSION CENTER
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-accent/15 dark:bg-[#38BDF8]/15 border border-accent/30 dark:border-[#38BDF8]/30 text-accent dark:text-[#38BDF8]">
                  CCTNS 2.0 MATRIX
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-rose-500/10 border border-rose-500/30 text-rose-400">
                  {PRIMARY_DEMO_CASE.caseNumber}
                </span>
              </div>
              <p className="text-xs text-text-dim dark:text-[#94A3B8] font-mono mt-0.5">
                Unified operational picture from multi-source investigation signals • {PRIMARY_DEMO_CASE.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 font-mono">
            <button
              onClick={() => navigate('/predictive-risk')}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-accent text-bg hover:bg-accent-bright dark:bg-[#38BDF8] dark:text-[#070A0F] dark:hover:bg-[#0284C7] font-bold text-xs rounded-lg shadow-xs transition-all cursor-pointer uppercase"
            >
              <span>FORECAST AREA RISK</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. WORKSPACE CONTEXT STRIP ── */}
      <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shadow-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent dark:bg-[#38BDF8] animate-pulse" />
          <span className="font-bold text-text dark:text-[#F8FAFC] uppercase text-[11px]">INVESTIGATION WORKSPACE:</span>
          <span className="text-accent dark:text-[#38BDF8] font-bold">Operation Nightfall</span>
          <span className="text-text-dim dark:text-[#94A3B8] text-[10px]">[{PRIMARY_DEMO_CASE.firNumber}]</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px]">
          <span className="text-text-dim dark:text-[#94A3B8]">SOURCE: <strong className="text-text dark:text-[#F8FAFC] font-bold">5 ingested</strong></span>
          <span className="text-text-dim dark:text-[#94A3B8]">GRAPH: <strong className="text-text dark:text-[#F8FAFC] font-bold">42 entities • 67 relationships</strong></span>
          <span className="text-text-dim dark:text-[#94A3B8]">DISCOVERIES: <strong className="text-amber-400 font-bold">6 correlations</strong></span>
        </div>
      </div>

      {/* ── 3. TOP KPI CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
        <div className="bg-surface dark:bg-[#0B0F17] p-3.5 rounded-xl border border-border-soft dark:border-[#1E293B] shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-bold text-text-dim dark:text-[#94A3B8] tracking-wider">THREAT LEVEL</span>
            <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 text-[9px] font-bold border border-rose-500/20 animate-pulse">
              CRITICAL
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-rose-400 flex items-center gap-1.5">
            <ShieldAlert size={20} />
            CONVERGING
          </div>
          <p className="text-[10px] text-text-dim dark:text-[#94A3B8] mt-1.5">Multi-signal high-risk lock</p>
        </div>

        <div className="bg-surface dark:bg-[#0B0F17] p-3.5 rounded-xl border border-border-soft dark:border-[#1E293B] shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-bold text-text-dim dark:text-[#94A3B8] tracking-wider">THREAT SCORE</span>
            <span className="text-[10px] text-accent dark:text-[#38BDF8] font-bold">91% Index</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-text dark:text-[#F8FAFC] flex items-baseline gap-1">
            {PRIMARY_DEMO_CASE.threatScore} <span className="text-xs text-text-dim dark:text-[#94A3B8] font-normal">/ 100</span>
          </div>
          <div className="w-full bg-surface-2 dark:bg-[#0E1422] h-1.5 rounded-full overflow-hidden mt-2">
            <div className="bg-gradient-to-r from-amber-500 to-rose-500 h-full rounded-full" style={{ width: `${PRIMARY_DEMO_CASE.threatScore}%` }} />
          </div>
        </div>

        <div className="bg-surface dark:bg-[#0B0F17] p-3.5 rounded-xl border border-border-soft dark:border-[#1E293B] shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-bold text-text-dim dark:text-[#94A3B8] tracking-wider">CORROBORATING FEEDS</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-bold border border-emerald-500/20">
              100% Match
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-accent dark:text-[#38BDF8] flex items-baseline gap-1">
            0{PRIMARY_DEMO_CASE.corroboratingSignalsCount} <span className="text-xs text-text-dim dark:text-[#94A3B8] font-normal">Feeds</span>
          </div>
          <p className="text-[10px] text-text-dim dark:text-[#94A3B8] mt-1.5">FIR, CDR, CCTV, Vehicle, Mule</p>
        </div>

        <div className="bg-surface dark:bg-[#0B0F17] p-3.5 rounded-xl border border-border-soft dark:border-[#1E293B] shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-bold text-text-dim dark:text-[#94A3B8] tracking-wider">LINKED JURISDICTIONS</span>
            <span className="text-[10px] text-amber-400 font-bold">Cross-Station</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-text dark:text-[#F8FAFC] flex items-baseline gap-1">
            0{PRIMARY_DEMO_CASE.linkedCasesCount} <span className="text-xs text-text-dim dark:text-[#94A3B8] font-normal">FIRs</span>
          </div>
          <p className="text-[10px] text-text-dim dark:text-[#94A3B8] mt-1.5">Khandagiri PS & Capital PS</p>
        </div>
      </div>

      {/* ── 4. MAIN GRID: CENTRAL INTELLIGENCE GRAPH & NODE DETAIL PANEL ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Central Graph Box (2 Cols) */}
        <div className="lg:col-span-2 bg-surface dark:bg-[#0B0F17] rounded-xl border border-border-soft dark:border-[#1E293B] p-4 shadow-xs flex flex-col justify-between min-h-[440px]">
          <div className="flex items-center justify-between mb-3 border-b border-border-soft dark:border-[#1E293B] pb-2.5">
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-text dark:text-[#F8FAFC] font-mono uppercase tracking-wider flex items-center gap-2">
                <Network size={15} className="text-accent dark:text-[#38BDF8]" /> CENTRAL INTELLIGENCE GRAPH
              </h2>
              <p className="text-[10px] text-text-dim dark:text-[#94A3B8] font-mono">Multi-modal entity correlation matrix for Case #2026-0817</p>
            </div>
            <button
              onClick={() => navigate('/network')}
              className="flex items-center gap-1 text-[11px] font-mono font-bold text-accent dark:text-[#38BDF8] hover:underline"
            >
              <span>FULL EXPLORER</span>
              <ExternalLink size={12} />
            </button>
          </div>

          {/* Interactive Graph Canvas Simulation */}
          <div className="relative flex-1 bg-surface-2 dark:bg-[#070A0F] rounded-lg border border-border-soft dark:border-[#1E293B] p-5 overflow-hidden flex items-center justify-center min-h-[320px]">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:20px_20px]" />

            {/* Nodes Layout Grid */}
            <div className="relative z-10 w-full h-full flex flex-col justify-between items-center py-2">
              
              {/* Top Row: FIR Case & Suspect */}
              <div className="flex items-center justify-around w-full max-w-lg">
                <button
                  onClick={() => setSelectedNode(FUSION_NODES[0])}
                  className={`p-2.5 rounded-lg border font-mono text-xs font-bold transition-all shadow-xs cursor-pointer ${
                    selectedNode?.id === FUSION_NODES[0].id
                      ? 'bg-accent/20 dark:bg-[#38BDF8]/20 text-accent dark:text-[#38BDF8] border-accent dark:border-[#38BDF8] ring-2 ring-accent/30'
                      : 'bg-surface dark:bg-[#0B0F17] border-border-soft dark:border-[#1E293B] text-accent dark:text-[#38BDF8] hover:border-accent/40'
                  }`}
                >
                  <div className="text-[8px] uppercase font-bold text-text-dim dark:text-[#94A3B8]">PRIMARY CASE</div>
                  <div>CASE #2026-0817</div>
                </button>

                <div className="h-0.5 w-16 bg-gradient-to-r from-accent to-rose-500 animate-pulse" />

                <button
                  onClick={() => setSelectedNode(FUSION_NODES[1])}
                  className={`p-2.5 rounded-lg border font-mono text-xs font-bold transition-all shadow-xs cursor-pointer ${
                    selectedNode?.id === FUSION_NODES[1].id
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500 ring-2 ring-rose-500/30'
                      : 'bg-surface dark:bg-[#0B0F17] border-border-soft dark:border-[#1E293B] text-rose-400 hover:border-rose-500/40'
                  }`}
                >
                  <div className="text-[8px] uppercase font-bold text-text-dim dark:text-[#94A3B8]">SUSPECT</div>
                  <div>Rahul S. (94%)</div>
                </button>
              </div>

              {/* Middle Row: Phone, Vehicle, CCTV */}
              <div className="flex items-center justify-between w-full max-w-xl my-4 px-2">
                <button
                  onClick={() => setSelectedNode(FUSION_NODES[2])}
                  className={`p-2 rounded-lg border font-mono text-[11px] font-bold transition-all shadow-xs cursor-pointer ${
                    selectedNode?.id === FUSION_NODES[2].id
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500 ring-2 ring-amber-500/30'
                      : 'bg-surface dark:bg-[#0B0F17] border-border-soft dark:border-[#1E293B] text-text dark:text-[#F8FAFC] hover:border-amber-400/40'
                  }`}
                >
                  <PhoneCall size={12} className="mb-0.5 text-amber-400 inline mr-1" />
                  +91-9199370000
                </button>

                <button
                  onClick={() => setSelectedNode(FUSION_NODES[3])}
                  className={`p-2.5 rounded-lg border font-mono text-xs font-bold transition-all shadow-xs cursor-pointer ${
                    selectedNode?.id === FUSION_NODES[3].id
                      ? 'bg-accent/20 dark:bg-[#38BDF8]/20 text-accent dark:text-[#38BDF8] border-accent dark:border-[#38BDF8] ring-2 ring-accent/30'
                      : 'bg-surface dark:bg-[#0B0F17] border-border-soft dark:border-[#1E293B] text-text dark:text-[#F8FAFC] hover:border-accent/40'
                  }`}
                >
                  <Truck size={14} className="mb-0.5 text-accent dark:text-[#38BDF8] inline mr-1" />
                  OD-02-MJ-8821
                </button>

                <button
                  onClick={() => setSelectedNode(FUSION_NODES[4])}
                  className={`p-2 rounded-lg border font-mono text-[11px] font-bold transition-all shadow-xs cursor-pointer ${
                    selectedNode?.id === FUSION_NODES[4].id
                      ? 'bg-purple-500/20 text-purple-400 border-purple-500 ring-2 ring-purple-500/30'
                      : 'bg-surface dark:bg-[#0B0F17] border-border-soft dark:border-[#1E293B] text-text dark:text-[#F8FAFC] hover:border-purple-400/40'
                  }`}
                >
                  <Video size={12} className="mb-0.5 text-purple-400 inline mr-1" />
                  CCTV KDG-04
                </button>
              </div>

              {/* Bottom Row: Previous FIRs, Mule Account, Location */}
              <div className="flex flex-wrap items-center justify-around w-full max-w-xl gap-2">
                <button
                  onClick={() => setSelectedNode(FUSION_NODES[5])}
                  className={`p-2 rounded-lg border font-mono text-[10px] font-bold transition-all cursor-pointer ${
                    selectedNode?.id === FUSION_NODES[5].id ? 'bg-surface-2 dark:bg-[#0E1422] border-accent dark:border-[#38BDF8] text-accent dark:text-[#38BDF8]' : 'bg-surface dark:bg-[#0B0F17] border-border-soft dark:border-[#1E293B] text-text-dim dark:text-[#94A3B8]'
                  }`}
                >
                  FIR-2025-114
                </button>

                <button
                  onClick={() => setSelectedNode(FUSION_NODES[7])}
                  className={`p-2 rounded-lg border font-mono text-[11px] font-bold transition-all cursor-pointer ${
                    selectedNode?.id === FUSION_NODES[7].id
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500 ring-2 ring-emerald-500/30'
                      : 'bg-surface dark:bg-[#0B0F17] border-border-soft dark:border-[#1E293B] text-emerald-400 hover:border-emerald-500/40'
                  }`}
                >
                  <CreditCard size={12} className="inline mr-1 text-emerald-400" />
                  Mule M-204
                </button>

                <button
                  onClick={() => setSelectedNode(FUSION_NODES[8])}
                  className={`p-2 rounded-lg border font-mono text-[11px] font-bold transition-all cursor-pointer ${
                    selectedNode?.id === FUSION_NODES[8].id
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500 ring-2 ring-rose-500/30'
                      : 'bg-surface dark:bg-[#0B0F17] border-border-soft dark:border-[#1E293B] text-rose-400 hover:border-rose-500/40'
                  }`}
                >
                  <MapPin size={12} className="inline mr-1 text-rose-400" />
                  Khandagiri
                </button>
              </div>

            </div>
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono text-text-dim dark:text-[#94A3B8]">
            <span>Click any node to inspect signal details</span>
            <span>9 Entity Nodes • 9 Relationship Edges</span>
          </div>
        </div>

        {/* Selected Entity Inspector Panel */}
        <div className="bg-surface dark:bg-[#0B0F17] rounded-xl border border-border-soft dark:border-[#1E293B] p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-border-soft dark:border-[#1E293B] pb-2.5">
              <h3 className="text-xs font-bold text-text dark:text-[#F8FAFC] font-mono uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={13} className="text-accent dark:text-[#38BDF8]" /> ENTITY INSPECTOR
              </h3>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-surface-2 dark:bg-[#0E1422] rounded text-accent dark:text-[#38BDF8] border border-border-soft dark:border-[#1E293B]">
                {selectedNode?.type || 'ENTITY'}
              </span>
            </div>

            {selectedNode ? (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B]">
                  <div className="text-[9px] font-mono uppercase font-bold text-text-dim dark:text-[#94A3B8]">Selected Element</div>
                  <div className="text-sm font-bold text-text dark:text-[#F8FAFC] font-mono mt-0.5">{selectedNode.label}</div>
                  <div className="text-xs text-text-dim dark:text-[#94A3B8] mt-0.5">{selectedNode.subtitle}</div>
                  
                  {selectedNode.riskScore && (
                    <div className="mt-2.5 pt-2 border-t border-border-soft dark:border-[#1E293B] flex items-center justify-between">
                      <span className="text-[10px] font-mono text-text-dim dark:text-[#94A3B8]">Risk Rating</span>
                      <span className="text-xs font-mono font-bold text-rose-400">{selectedNode.riskScore} / 100</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono uppercase font-bold text-text-dim dark:text-[#94A3B8]">Connected Relationships</div>
                  
                  {FUSION_EDGES.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).map((edge) => (
                    <div key={edge.id} className="p-2 rounded bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-xs flex items-center justify-between">
                      <span className="font-mono text-accent dark:text-[#38BDF8] font-semibold text-[10px]">{edge.label}</span>
                      <span className="text-[9px] font-mono text-text-dim dark:text-[#94A3B8]">{edge.confidence}% Conf.</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-text-dim dark:text-[#94A3B8] text-xs font-mono">Select a node from the graph to inspect intelligence.</div>
            )}
          </div>

          <div className="pt-3 border-t border-border-soft dark:border-[#1E293B] mt-3 space-y-2">
            <button
              onClick={() => navigate('/network')}
              className="w-full py-2 bg-surface-2 dark:bg-[#0E1422] hover:bg-surface-hover text-accent dark:text-[#38BDF8] font-mono text-xs font-bold rounded-lg border border-border-soft dark:border-[#1E293B] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Network size={13} /> VIEW CONNECTED NETWORK
            </button>
          </div>
        </div>
      </div>

      {/* ── 5. SIGNAL SOURCES CARDS SECTION ── */}
      <div className="bg-surface dark:bg-[#0B0F17] rounded-xl border border-border-soft dark:border-[#1E293B] p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-border-soft dark:border-[#1E293B] pb-3">
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-text dark:text-[#F8FAFC] font-mono uppercase tracking-wider flex items-center gap-2">
              <Layers size={16} className="text-accent dark:text-[#38BDF8]" /> CORROBORATING INTELLIGENCE SIGNALS
            </h2>
            <p className="text-[10px] text-text-dim dark:text-[#94A3B8] font-mono">6 verified operational feeds converging on Case #2026-0817</p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 font-mono">
            {['ALL', 'FIR', 'CDR', 'CCTV', 'VEHICLE', 'FINANCIAL'].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveSignalFilter(filter)}
                className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                  activeSignalFilter === filter
                    ? 'bg-accent/20 dark:bg-[#38BDF8]/20 text-accent dark:text-[#38BDF8] border border-accent/40 dark:border-[#38BDF8]/40'
                    : 'bg-surface-2 dark:bg-[#0E1422] text-text-dim dark:text-[#94A3B8] hover:text-text dark:hover:text-[#F8FAFC] border border-border-soft dark:border-[#1E293B]'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredSignals.map((signal) => {
            const IconComp = SIGNAL_ICONS[signal.iconName] || FileText;
            return (
              <div
                key={signal.id}
                className="p-3.5 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] hover:border-accent/40 dark:hover:border-[#38BDF8]/40 transition-all flex flex-col justify-between space-y-2.5"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-surface dark:bg-[#070A0F] border border-border-soft dark:border-[#1E293B] flex items-center justify-center text-accent dark:text-[#38BDF8]">
                        <IconComp size={13} />
                      </div>
                      <span className="text-xs font-mono font-bold text-text dark:text-[#F8FAFC]">{signal.source}</span>
                    </div>
                    <span className="text-[9px] font-mono font-bold text-accent dark:text-[#38BDF8] bg-accent/10 dark:bg-[#38BDF8]/10 px-1.5 py-0.5 rounded border border-accent/20 dark:border-[#38BDF8]/20">
                      {signal.confidence}% Conf
                    </span>
                  </div>

                  <p className="text-xs text-text-dim dark:text-[#94A3B8] leading-relaxed">{signal.description}</p>
                </div>

                {signal.details && (
                  <div className="p-2 rounded bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] space-y-0.5 font-mono text-[10px]">
                    {Object.entries(signal.details).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-text-dim dark:text-[#94A3B8]">{k}:</span>
                        <span className="text-text dark:text-[#F8FAFC] font-bold truncate max-w-[150px]">{v}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2 border-t border-border-soft dark:border-[#1E293B] flex items-center justify-between text-[10px] font-mono text-text-dim dark:text-[#94A3B8]">
                  <span>Timestamp: {signal.timestamp}</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 size={11} /> Verified
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 6. AI ASSESSMENT & WHY THIS ALERT PANEL ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Assessment Text Box (2 Cols) */}
        <div className="lg:col-span-2 bg-surface dark:bg-[#0B0F17] p-4 rounded-xl border border-border-soft dark:border-[#1E293B] shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-accent/30 dark:border-[#38BDF8]/30 flex items-center justify-center text-accent dark:text-[#38BDF8]">
              <Sparkles size={15} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-text dark:text-[#F8FAFC] font-mono uppercase tracking-wider">AI INVESTIGATION ASSESSMENT</h2>
              <p className="text-[10px] font-mono text-accent dark:text-[#38BDF8] font-semibold">S.I.R.I.S Intelligence Correlation Engine</p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-xs sm:text-sm text-text dark:text-[#F8FAFC] leading-relaxed font-mono">
            "Multiple independent intelligence signals converge on the same subject (<strong className="text-accent dark:text-[#38BDF8]">Rahul S.</strong>) and vehicle (<strong className="text-accent dark:text-[#38BDF8]">OD-02-MJ-8821</strong>). The subject has links to previous cases (<strong className="text-amber-400">FIR-2025-114, FIR-2026-031</strong>), a recurring CDR relationship, recent CCTV activity near Khandagiri Square at 19:42 IST and a suspicious financial association with Mule Account <strong className="text-emerald-400">M-204</strong>."
          </div>

          <div>
            <h3 className="text-[10px] font-mono font-bold text-text-dim dark:text-[#94A3B8] uppercase mb-1.5 tracking-wider">WHY THIS ALERT? (EVIDENCE CHIPS)</h3>
            <div className="flex flex-wrap gap-1.5 font-mono">
              {[
                '+ Previous case similarity',
                '+ Repeat offender activity',
                '+ Recent CCTV sighting',
                '+ CDR relationship',
                '+ Financial anomaly',
                '+ Geographic overlap'
              ].map((chip, idx) => (
                <span key={idx} className="px-2.5 py-1 rounded bg-surface-2 dark:bg-[#0E1422] text-text dark:text-[#F8FAFC] text-[10px] font-bold border border-border-soft dark:border-[#1E293B] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent dark:bg-[#38BDF8]" />
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Operational Navigation Shortcuts */}
        <div className="bg-surface dark:bg-[#0B0F17] p-4 rounded-xl border border-border-soft dark:border-[#1E293B] shadow-xs flex flex-col justify-between space-y-3 font-mono">
          <div>
            <h3 className="text-xs font-bold text-text dark:text-[#F8FAFC] uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Layers size={13} className="text-accent dark:text-[#38BDF8]" /> DEEP INVESTIGATION DRILL-DOWN
            </h3>
            <p className="text-[10px] text-text-dim dark:text-[#94A3B8] mb-3">Navigate directly to specialized intelligence workspaces:</p>

            <div className="space-y-1.5">
              <button
                onClick={() => navigate('/money-trail')}
                className="w-full p-2 bg-surface-2 dark:bg-[#0E1422] hover:bg-surface-hover text-text dark:text-[#F8FAFC] text-xs font-bold rounded-lg border border-border-soft dark:border-[#1E293B] flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2"><CreditCard size={13} className="text-emerald-400" /> OPEN MONEY TRAIL</span>
                <ChevronRight size={13} className="text-text-dim dark:text-[#94A3B8]" />
              </button>

              <button
                onClick={() => navigate('/trail')}
                className="w-full p-2 bg-surface-2 dark:bg-[#0E1422] hover:bg-surface-hover text-text dark:text-[#F8FAFC] text-xs font-bold rounded-lg border border-border-soft dark:border-[#1E293B] flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2"><Truck size={13} className="text-accent dark:text-[#38BDF8]" /> VIEW GEO TRAIL</span>
                <ChevronRight size={13} className="text-text-dim dark:text-[#94A3B8]" />
              </button>

              <button
                onClick={() => navigate('/cdr')}
                className="w-full p-2 bg-surface-2 dark:bg-[#0E1422] hover:bg-surface-hover text-text dark:text-[#F8FAFC] text-xs font-bold rounded-lg border border-border-soft dark:border-[#1E293B] flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2"><PhoneCall size={13} className="text-amber-400" /> VIEW CDR</span>
                <ChevronRight size={13} className="text-text-dim dark:text-[#94A3B8]" />
              </button>

              <button
                onClick={() => navigate('/cctv')}
                className="w-full p-2 bg-surface-2 dark:bg-[#0E1422] hover:bg-surface-hover text-text dark:text-[#F8FAFC] text-xs font-bold rounded-lg border border-border-soft dark:border-[#1E293B] flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2"><Video size={13} className="text-purple-400" /> VIEW CCTV</span>
                <ChevronRight size={13} className="text-text-dim dark:text-[#94A3B8]" />
              </button>
            </div>
          </div>

          <button
            onClick={() => navigate('/predictive-risk')}
            className="w-full py-2.5 bg-accent text-bg hover:bg-accent-bright dark:bg-[#38BDF8] dark:text-[#070A0F] dark:hover:bg-[#0284C7] font-bold text-xs rounded-lg shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer uppercase"
          >
            <span>PREDICTIVE CRIME RISK</span>
            <ArrowRight size={14} />
          </button>
        </div>

      </div>
    </div>
  );
}
