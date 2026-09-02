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
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-16 select-none font-sans">
      {/* Header Bar */}
      <div className="glass p-6 rounded-2xl bg-surface border border-border-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono font-bold bg-brand/10 text-brand px-2.5 py-0.5 rounded border border-brand/30 uppercase flex items-center gap-1">
              <UserCheck size={12} /> ENTITY RESOLUTION & IDENTITY REVIEW
            </span>
            <span className="text-[10px] font-mono text-warning-bright font-bold">
              OFFICER DECISION REQUIRED — NEVER AUTO-MERGED
            </span>
          </div>
          <h1 className="text-2xl font-bold font-mono text-text flex items-center gap-2">
            <Users className="text-brand" /> Identity Resolution & Duplicate Review
          </h1>
          <p className="text-xs text-text-dim mt-1">
            S.I.R.I.S. entity resolution · Detect candidate suspect duplicates while preventing namesake false merges
          </p>
        </div>
      </div>

      {/* Candidate Pairs Grid */}
      <div className="space-y-4">
        {pairs.map(pair => (
          <div key={pair.id} className="glass p-6 rounded-2xl bg-surface border border-border-soft space-y-4 shadow-sm">
            {/* Card Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-soft pb-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-brand">{pair.id}</span>
                <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded border ${
                  pair.verdict === 'CONFIRMED_SAME' ? 'bg-success/20 text-success border-success/30' :
                  pair.verdict === 'KEPT_SEPARATE' ? 'bg-surface-2 text-text-dim border-border' :
                  pair.verdict === 'NAMESAKE_WARNING' ? 'bg-danger/20 text-danger-bright border-danger/40' :
                  'bg-warning/20 text-warning-bright border-warning/30'
                }`}>
                  {pair.verdict === 'CONFIRMED_SAME' ? '✓ CONFIRMED MERGE' :
                   pair.verdict === 'KEPT_SEPARATE' ? '✗ KEPT SEPARATE' :
                   pair.verdict === 'NAMESAKE_WARNING' ? '⚠️ NAMESAKE WARNING — DO NOT MERGE' :
                   'CANDIDATE DUPLICATE MATCH'}
                </span>
              </div>

              <span className="text-xs font-mono text-text-dim">
                Match Confidence: <strong className="text-brand">{pair.confidenceScore}%</strong>
              </span>
            </div>

            {/* Side-by-Side Person Profiles Comparison */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Person A */}
              <div className="p-4 rounded-xl bg-surface-2 border border-border-soft space-y-2">
                <div className="text-[10px] font-mono text-brand font-bold uppercase">Candidate Entity A</div>
                <div className="text-sm font-bold text-text font-mono">{pair.personA.name}</div>
                <div className="text-xs text-text-dim space-y-0.5 font-mono">
                  <div>ID: <strong>{pair.personA.id}</strong> · Alias: “{pair.personA.alias || 'N/A'}”</div>
                  <div>Age: <strong>{pair.personA.age}</strong> · Station: {pair.personA.station}</div>
                  <div>Case: <strong>{pair.personA.caseId}</strong> · Phone: {pair.personA.phone || 'N/A'}</div>
                </div>
              </div>

              {/* Person B */}
              <div className="p-4 rounded-xl bg-surface-2 border border-border-soft space-y-2">
                <div className="text-[10px] font-mono text-brand font-bold uppercase">Candidate Entity B</div>
                <div className="text-sm font-bold text-text font-mono">{pair.personB.name}</div>
                <div className="text-xs text-text-dim space-y-0.5 font-mono">
                  <div>ID: <strong>{pair.personB.id}</strong> · Alias: “{pair.personB.alias || 'N/A'}”</div>
                  <div>Age: <strong>{pair.personB.age}</strong> · Station: {pair.personB.station}</div>
                  <div>Case: <strong>{pair.personB.caseId}</strong> · Phone: {pair.personB.phone || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Matching Rationale & Warning */}
            <div className="p-3.5 rounded-xl bg-surface-2 border border-border-soft space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-dim font-mono">
                Matching Rationale & Levenshtein Metrics
              </span>
              <ul className="space-y-1">
                {pair.matchingReasons.map((reason, idx) => (
                  <li key={idx} className="text-xs text-text flex items-center gap-2 font-mono">
                    <span className="text-brand font-bold">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
              {pair.warningNote && (
                <div className="text-xs font-mono text-warning-bright pt-1 flex items-center gap-1.5">
                  <AlertTriangle size={13} /> {pair.warningNote}
                </div>
              )}
            </div>

            {/* Decision Actions */}
            <div className="pt-2 flex items-center justify-between border-t border-border-soft">
              <span className="text-xs font-mono text-text-dim">
                Status: {pair.decisionBy ? `Processed by ${pair.decisionBy} at ${pair.decisionTimestamp}` : 'Awaiting Officer Sign-off'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleKeepSeparate(pair.id)}
                  disabled={pair.verdict === 'KEPT_SEPARATE'}
                  className="px-4 py-2 rounded-xl bg-surface-2 border border-border text-text-dim hover:text-text font-mono font-bold text-xs disabled:opacity-50"
                >
                  KEEP SEPARATE
                </button>
                <button
                  onClick={() => handleConfirmMerge(pair.id)}
                  disabled={pair.verdict === 'CONFIRMED_SAME'}
                  className="px-4 py-2 rounded-xl bg-brand text-bg font-mono font-bold text-xs hover:bg-brand-bright transition-colors disabled:opacity-50"
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
