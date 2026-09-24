import React, { useState, useEffect } from 'react';
import { 
  Users, UserCheck, AlertTriangle, ShieldCheck, CheckCircle2, 
  XCircle, Info, Sparkles, ChevronRight, Lock
} from 'lucide-react';
import { 
  identityReviewStore, IdentityCandidatePair 
} from '../services/identityReviewService';

export function IdentityReviewPage() {
  const [pairs, setPairs] = useState<IdentityCandidatePair[]>(identityReviewStore.getPairs());

  useEffect(() => {
    return identityReviewStore.subscribe(() => {
      setPairs([...identityReviewStore.getPairs()]);
    });
  }, []);

  const handleConfirmMerge = (id: string) => {
    identityReviewStore.confirmMerge(id);
  };

  const handleKeepSeparate = (id: string) => {
    identityReviewStore.keepSeparate(id);
  };

  return (
    <div className="max-w-[1520px] mx-auto space-y-4 font-sans select-none text-text dark:text-[#F8FAFC] pb-24">
      {/* ── 1. COMMAND HEADER & IDENTITY REVIEW HUB ── */}
      <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-3.5 sm:p-4 shadow-xs dark:shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-2 dark:bg-[#0E1422] border border-accent/40 dark:border-[#38BDF8]/40 flex items-center justify-center text-accent dark:text-[#38BDF8] shadow-xs">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold font-mono tracking-tight text-text dark:text-[#F8FAFC] uppercase">
                  IDENTITY RESOLUTION & DUPLICATE REVIEW
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-accent/15 dark:bg-[#38BDF8]/15 border border-accent/30 dark:border-[#38BDF8]/30 text-accent dark:text-[#38BDF8]">
                  ENTITY RESOLUTION
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  OFFICER SIGN-OFF MANDATORY
                </span>
              </div>
              <p className="text-xs text-text-dim dark:text-[#94A3B8] font-mono mt-0.5">
                S.I.R.I.S. entity resolution · Detect candidate suspect duplicates while preventing namesake false merges
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. CANDIDATE PAIRS GRID ── */}
      <div className="space-y-3">
        {pairs.map(pair => (
          <div key={pair.id} className="p-4 rounded-xl bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] space-y-3 shadow-xs hover:border-accent/40 dark:hover:border-[#38BDF8]/40 transition-all">
            {/* Card Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-border-soft dark:border-[#1E293B] pb-2.5">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-mono font-bold text-accent dark:text-[#38BDF8]">{pair.id}</span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  pair.verdict === 'CONFIRMED_SAME' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                  pair.verdict === 'KEPT_SEPARATE' ? 'bg-surface-2 dark:bg-[#0E1422] text-text-dim dark:text-[#94A3B8] border-border-soft dark:border-[#1E293B]' :
                  pair.verdict === 'NAMESAKE_WARNING' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                  'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}>
                  {pair.verdict === 'CONFIRMED_SAME' ? '✓ CONFIRMED MERGE' :
                   pair.verdict === 'KEPT_SEPARATE' ? '✗ KEPT SEPARATE' :
                   pair.verdict === 'NAMESAKE_WARNING' ? '⚠️ NAMESAKE WARNING — DO NOT MERGE' :
                   'CANDIDATE DUPLICATE MATCH'}
                </span>
              </div>

              <span className="text-[11px] font-mono text-text-dim dark:text-[#94A3B8]">
                Match Confidence: <strong className="text-accent dark:text-[#38BDF8]">{pair.confidenceScore}%</strong>
              </span>
            </div>

            {/* Side-by-Side Person Profiles Comparison */}
            <div className="grid md:grid-cols-2 gap-3">
              {/* Person A */}
              <div className="p-3 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] space-y-1.5 font-mono">
                <div className="text-[9px] text-accent dark:text-[#38BDF8] font-bold uppercase">Candidate Entity A</div>
                <div className="text-sm font-bold text-text dark:text-[#F8FAFC]">{pair.personA.name}</div>
                <div className="text-xs text-text-dim dark:text-[#94A3B8] space-y-0.5">
                  <div>ID: <strong className="text-text dark:text-[#F8FAFC]">{pair.personA.id}</strong> · Alias: “{pair.personA.alias || 'N/A'}”</div>
                  <div>Age: <strong className="text-text dark:text-[#F8FAFC]">{pair.personA.age}</strong> · Station: {pair.personA.station}</div>
                  <div>Case: <strong className="text-text dark:text-[#F8FAFC]">{pair.personA.caseId}</strong> · Phone: {pair.personA.phone || 'N/A'}</div>
                </div>
              </div>

              {/* Person B */}
              <div className="p-3 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] space-y-1.5 font-mono">
                <div className="text-[9px] text-accent dark:text-[#38BDF8] font-bold uppercase">Candidate Entity B</div>
                <div className="text-sm font-bold text-text dark:text-[#F8FAFC]">{pair.personB.name}</div>
                <div className="text-xs text-text-dim dark:text-[#94A3B8] space-y-0.5">
                  <div>ID: <strong className="text-text dark:text-[#F8FAFC]">{pair.personB.id}</strong> · Alias: “{pair.personB.alias || 'N/A'}”</div>
                  <div>Age: <strong className="text-text dark:text-[#F8FAFC]">{pair.personB.age}</strong> · Station: {pair.personB.station}</div>
                  <div>Case: <strong className="text-text dark:text-[#F8FAFC]">{pair.personB.caseId}</strong> · Phone: {pair.personB.phone || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Matching Rationale & Warning */}
            <div className="p-3 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] space-y-1.5 font-mono">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-dim dark:text-[#94A3B8]">
                Matching Rationale & Levenshtein Metrics
              </span>
              <ul className="space-y-1">
                {pair.matchingReasons.map((reason, idx) => (
                  <li key={idx} className="text-xs text-text dark:text-[#F8FAFC] flex items-center gap-2">
                    <span className="text-accent dark:text-[#38BDF8] font-bold">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
              {pair.warningNote && (
                <div className="text-xs text-rose-400 pt-1 flex items-center gap-1.5">
                  <AlertTriangle size={12} /> {pair.warningNote}
                </div>
              )}
            </div>

            {/* Decision Actions */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-border-soft dark:border-[#1E293B] font-mono">
              <span className="text-[11px] text-text-dim dark:text-[#94A3B8]">
                Status: {pair.decisionBy ? `Processed by ${pair.decisionBy} at ${pair.decisionTimestamp}` : 'Awaiting Officer Sign-off'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleKeepSeparate(pair.id)}
                  disabled={pair.verdict === 'KEPT_SEPARATE'}
                  className="px-3.5 py-1.5 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-text-dim dark:text-[#94A3B8] hover:text-text dark:hover:text-[#F8FAFC] font-bold text-xs disabled:opacity-50 cursor-pointer"
                >
                  KEEP SEPARATE
                </button>
                <button
                  onClick={() => handleConfirmMerge(pair.id)}
                  disabled={pair.verdict === 'CONFIRMED_SAME'}
                  className="px-4 py-1.5 rounded-lg bg-accent text-bg hover:bg-accent-bright dark:bg-[#38BDF8] dark:text-[#070A0F] dark:hover:bg-[#0284C7] font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer uppercase"
                >
                  CONFIRM IDENTITY MERGE
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
