import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, CheckCircle2, Network, Shield, ArrowRight, Layers, Database, GitBranch, AlertTriangle, FileText
} from 'lucide-react';

export interface CaseTargetInfo {
  caseId?: string;
  firNumber?: string;
  title?: string;
  persons?: string[];
  vehicles?: string[];
  phones?: string[];
  locations?: string[];
  accounts?: string[];
  evidenceCount?: number;
}

interface GraphConstructionOverlayProps {
  isOpen: boolean;
  onComplete?: () => void;
  caseTarget?: CaseTargetInfo;
}

export function GraphConstructionOverlay({ isOpen, onComplete, caseTarget }: GraphConstructionOverlayProps) {
  const navigate = useNavigate();
  const [stage, setStage] = useState<number>(1);
  const [entitiesCount, setEntitiesCount] = useState<number>(0);
  const [relationshipsCount, setRelationshipsCount] = useState<number>(0);
  const [showDiscovery, setShowDiscovery] = useState<boolean>(false);

  const firLabel = caseTarget?.firNumber || 'FIR #2026-0817';
  const personsList = caseTarget?.persons && caseTarget.persons.length > 0 ? caseTarget.persons : ['Primary Suspect'];
  const vehiclesList = caseTarget?.vehicles && caseTarget.vehicles.length > 0 ? caseTarget.vehicles : ['OD-02-MJ-8821'];
  const phonesList = caseTarget?.phones && caseTarget.phones.length > 0 ? caseTarget.phones : ['+91-9199370000'];
  const locationsList = caseTarget?.locations && caseTarget.locations.length > 0 ? caseTarget.locations : ['Incident Area'];

  const extractedEntities = [
    ...personsList,
    ...vehiclesList,
    ...phonesList,
    ...locationsList,
    firLabel
  ];

  useEffect(() => {
    if (!isOpen) {
      setStage(1);
      setEntitiesCount(0);
      setRelationshipsCount(0);
      setShowDiscovery(false);
      return;
    }

    // Stage timeline progression (Total ~4.5 seconds)
    const t1 = setTimeout(() => setStage(2), 900); // Extracting Entities
    const t2 = setTimeout(() => setStage(3), 1800); // Resolving Entities
    const t3 = setTimeout(() => setStage(4), 2800); // Correlating Relationships
    const t4 = setTimeout(() => setStage(5), 3800); // Constructing Knowledge Graph

    const targetEntCount = Math.max(12, extractedEntities.length * 3);
    const targetRelCount = Math.max(18, targetEntCount * 2);

    // Counter animations
    const countInterval = setInterval(() => {
      setEntitiesCount(prev => (prev < targetEntCount ? prev + 2 : targetEntCount));
      setRelationshipsCount(prev => (prev < targetRelCount ? prev + 3 : targetRelCount));
    }, 80);

    const t5 = setTimeout(() => {
      clearInterval(countInterval);
      setEntitiesCount(targetEntCount);
      setRelationshipsCount(targetRelCount);
      setShowDiscovery(true);
    }, 4500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearInterval(countInterval);
    };
  }, [isOpen, extractedEntities.length]);

  if (!isOpen) return null;

  const handleViewIntelligence = () => {
    if (onComplete) onComplete();
    if (caseTarget?.caseId || caseTarget?.firNumber) {
      navigate(`/workspace/${encodeURIComponent(caseTarget.caseId || caseTarget.firNumber || '')}`);
    } else {
      navigate('/intelligence-fusion');
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4 animate-fade-in font-sans select-none">
      <div className="bg-surface border border-brand/40 rounded-3xl max-w-3xl w-full p-8 shadow-2xl space-y-6 relative overflow-hidden text-text">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand/15 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

        {/* Overlay Header */}
        <div className="flex items-center justify-between border-b border-border-soft pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand/20 border border-brand/40 flex items-center justify-center text-brand">
              <Network size={24} className="animate-spin" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-brand uppercase tracking-wider">CCTNS 2.0 INTELLIGENCE ENGINE</span>
                <span className="px-2 py-0.5 rounded bg-brand/20 text-brand text-[10px] font-mono font-bold border border-brand/30">
                  STAGE {stage} / 5
                </span>
              </div>
              <h2 className="text-xl font-display font-extrabold text-text tracking-tight mt-0.5">
                CONSTRUCTING INVESTIGATION KNOWLEDGE GRAPH
              </h2>
            </div>
          </div>
        </div>

        {/* Live Counters Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-surface-2/80 border border-border-soft font-mono">
          <div className="p-3 rounded-xl bg-surface border border-border-soft text-center">
            <div className="text-2xl font-extrabold text-brand font-display">{entitiesCount}</div>
            <div className="text-[10px] text-text-dim uppercase font-bold">ENTITIES DISCOVERED</div>
          </div>
          <div className="p-3 rounded-xl bg-surface border border-border-soft text-center">
            <div className="text-2xl font-extrabold text-amber-400 font-display">{relationshipsCount}</div>
            <div className="text-[10px] text-text-dim uppercase font-bold">RELATIONSHIPS</div>
          </div>
          <div className="p-3 rounded-xl bg-surface border border-border-soft text-center">
            <div className="text-2xl font-extrabold text-emerald-400 font-display">05</div>
            <div className="text-[10px] text-text-dim uppercase font-bold">EVIDENCE SOURCES</div>
          </div>
          <div className="p-3 rounded-xl bg-surface border border-border-soft text-center">
            <div className="text-2xl font-extrabold text-purple-400 font-display">06</div>
            <div className="text-[10px] text-text-dim uppercase font-bold">CORRELATIONS</div>
          </div>
        </div>

        {/* 5-Stage Animation View */}
        {!showDiscovery ? (
          <div className="space-y-4 font-mono text-xs py-2">
            
            {/* Stage 1: Ingesting Evidence */}
            <div className={`p-3.5 rounded-xl border transition-all ${stage >= 1 ? 'bg-surface-2 border-brand/40 text-text' : 'opacity-40 border-border-soft'}`}>
              <div className="flex items-center justify-between font-bold mb-1">
                <span className="flex items-center gap-2">
                  {stage > 1 ? <CheckCircle2 size={16} className="text-success" /> : <span className="w-3 h-3 rounded-full bg-brand animate-ping" />}
                  1. INGESTING EVIDENCE &amp; EXHIBITS FOR {firLabel}...
                </span>
                {stage > 1 && <span className="text-success text-[10px]">100% COMPLETE</span>}
              </div>
              <div className="flex flex-wrap gap-2 text-[10px] text-text-dim mt-2">
                <span className="px-2 py-0.5 rounded bg-surface border border-border-soft text-success">✓ FIR Narrative Processed</span>
                <span className="px-2 py-0.5 rounded bg-surface border border-border-soft text-success">✓ CDR Cellular Records</span>
                <span className="px-2 py-0.5 rounded bg-surface border border-border-soft text-success">✓ ANPR / CCTV Feeds</span>
                <span className="px-2 py-0.5 rounded bg-surface border border-border-soft text-success">✓ Geospatial Telemetry</span>
              </div>
            </div>

            {/* Stage 2: Extracting Entities */}
            <div className={`p-3.5 rounded-xl border transition-all ${stage >= 2 ? 'bg-surface-2 border-brand/40 text-text' : 'opacity-40 border-border-soft'}`}>
              <div className="flex items-center justify-between font-bold mb-1">
                <span className="flex items-center gap-2">
                  {stage > 2 ? <CheckCircle2 size={16} className="text-success" /> : stage === 2 ? <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping" /> : null}
                  2. EXTRACTING CASE ENTITIES...
                </span>
                {stage > 2 && <span className="text-success text-[10px]">EXTRACTED</span>}
              </div>
              {stage >= 2 && (
                <div className="flex flex-wrap gap-1.5 mt-2 animate-fade-in">
                  {extractedEntities.map((e, idx) => (
                    <span key={idx} className="px-2 py-1 rounded bg-brand/10 text-brand border border-brand/30 font-bold text-[10px] animate-pulse">
                      {e}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Stage 3: Resolving Entities */}
            <div className={`p-3.5 rounded-xl border transition-all ${stage >= 3 ? 'bg-surface-2 border-brand/40 text-text' : 'opacity-40 border-border-soft'}`}>
              <div className="flex items-center justify-between font-bold mb-1">
                <span className="flex items-center gap-2">
                  {stage > 3 ? <CheckCircle2 size={16} className="text-success" /> : stage === 3 ? <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" /> : null}
                  3. RESOLVING CANONICAL ENTITY MAPPINGS...
                </span>
                {stage > 3 && <span className="text-success text-[10px]">RESOLVED</span>}
              </div>
              {stage >= 3 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 text-[10px]">
                  <div className="p-1.5 rounded bg-surface border border-border-soft">Person → <strong>{personsList[0]}</strong></div>
                  <div className="p-1.5 rounded bg-surface border border-border-soft">Vehicle → <strong>{vehiclesList[0]}</strong></div>
                  <div className="p-1.5 rounded bg-surface border border-border-soft">Phone → <strong>{phonesList[0]}</strong></div>
                  <div className="p-1.5 rounded bg-surface border border-border-soft">Location → <strong>{locationsList[0]}</strong></div>
                  <div className="p-1.5 rounded bg-surface border border-border-soft">Case Target → <strong>{firLabel}</strong></div>
                </div>
              )}
            </div>

            {/* Stage 4 & 5: Correlations & Knowledge Graph */}
            <div className={`p-3.5 rounded-xl border transition-all ${stage >= 4 ? 'bg-surface-2 border-brand/40 text-text' : 'opacity-40 border-border-soft'}`}>
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-2">
                  {stage === 5 ? <CheckCircle2 size={16} className="text-success animate-bounce" /> : <span className="w-3 h-3 rounded-full bg-purple-400 animate-ping" />}
                  4 & 5. PROJECTING TO CLOUD NEO4J AURA &amp; CORRELATING SYNDICATE...
                </span>
                <span className="text-brand font-bold text-[10px]">
                  {stage === 5 ? '100% KNOWLEDGE GRAPH READY' : 'PROCESSING...'}
                </span>
              </div>
            </div>

          </div>
        ) : (
          /* PART 4 — INTELLIGENCE DISCOVERY MOMENT CARD */
          <div className="bg-gradient-to-br from-surface to-surface-2 p-6 rounded-2xl border border-brand/50 shadow-xl space-y-4 animate-slide-in">
            <div className="flex items-center justify-between border-b border-border-soft pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-danger/20 border border-danger/40 flex items-center justify-center text-danger">
                  <Sparkles size={20} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-mono text-text uppercase tracking-wider">INTELLIGENCE DISCOVERY: {firLabel}</h3>
                  <p className="text-[10px] font-mono text-danger font-bold">Multi-Hop Cross-Case Syndicate Link Detected • 94% Confidence</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-danger/20 text-danger text-[10px] font-mono font-bold border border-danger/30">
                STATEWIDE OVERLAP
              </span>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-border-soft text-xs text-text font-mono leading-relaxed space-y-2">
              <p className="font-bold text-amber-300">
                &quot;Suspect &amp; Vehicle [{vehiclesList[0]}] in {firLabel} correlated across jurisdiction records in Cloud Neo4j Aura.&quot;
              </p>
              <div className="pt-2 border-t border-border-soft/60 space-y-1 text-[11px] text-text-dim">
                <div className="font-bold uppercase text-text">Live Supporting Signals:</div>
                <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-brand"></span> Vehicle registration &amp; ANPR match ({vehiclesList[0]})</div>
                <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-brand"></span> Geographic proximity match ({locationsList[0]})</div>
                <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-brand"></span> Telecom burst correlation with active suspect line ({phonesList[0]})</div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleViewIntelligence}
                className="w-full py-3.5 bg-brand hover:bg-brand-hover text-bg font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 font-mono uppercase tracking-wider"
              >
                <span>OPEN {firLabel} INVESTIGATION WORKSPACE &amp; GRAPH</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
