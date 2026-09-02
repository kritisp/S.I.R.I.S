import React, { useState } from 'react';
import { 
  ShieldCheck, AlertTriangle, CheckCircle2, XCircle, HelpCircle, 
  FileText, Link2, Info, Sparkles, Shield
} from 'lucide-react';
import { ExplainableLead, VerificationDecision, explainableIntelStore } from '../../services/explainableIntelService';

interface Props {
  lead: ExplainableLead;
  onDecisionChange?: () => void;
}

export function ExplainableLeadCard({ lead, onDecisionChange }: Props) {
  const [decision, setDecision] = useState<VerificationDecision>(lead.decision);
  const [notes, setNotes] = useState<string>(lead.decisionNotes || '');

  const handleDecision = (newDecision: VerificationDecision) => {
    setDecision(newDecision);
    explainableIntelStore.updateDecision(lead.id, newDecision, notes);
    if (onDecisionChange) onDecisionChange();
  };

  const getConfidenceBadge = (conf: string) => {
    switch (conf) {
      case 'HIGH':
        return 'bg-success/15 text-success border-success/30';
      case 'MEDIUM':
        return 'bg-warning/15 text-warning-bright border-warning/30';
      default:
        return 'bg-danger/15 text-danger-bright border-danger/30';
    }
  };

  return (
    <div className="glass p-5 rounded-2xl bg-surface border border-border-soft space-y-4 shadow-sm hover:border-brand/50 transition-all font-sans select-none">
      {/* Lead Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-soft pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold bg-brand/10 text-brand px-2 py-0.5 rounded border border-brand/30 uppercase flex items-center gap-1">
              <Sparkles size={11} /> EXPLAINABLE INTEL LEAD
            </span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getConfidenceBadge(lead.confidence)}`}>
              CONFIDENCE: {lead.confidence} ({lead.confidenceScore}%)
            </span>
          </div>
          <h3 className="text-base font-bold text-text font-mono">{lead.title}</h3>
        </div>

        {/* Current Officer Decision Badge */}
        <div>
          {decision === 'CONFIRMED' && (
            <span className="px-3 py-1 rounded-xl bg-success/20 text-success border border-success/40 text-xs font-bold font-mono flex items-center gap-1">
              <CheckCircle2 size={14} /> OFFICER CONFIRMED
            </span>
          )}
          {decision === 'REJECTED' && (
            <span className="px-3 py-1 rounded-xl bg-danger/20 text-danger-bright border border-danger/40 text-xs font-bold font-mono flex items-center gap-1">
              <XCircle size={14} /> REJECTED / FALSE LEAD
            </span>
          )}
          {decision === 'NEEDS_FIELD_VERIFICATION' && (
            <span className="px-3 py-1 rounded-xl bg-warning/20 text-warning-bright border border-warning/40 text-xs font-bold font-mono flex items-center gap-1">
              <HelpCircle size={14} /> FIELD VERIFICATION REQD
            </span>
          )}
          {decision === 'PENDING' && (
            <span className="px-3 py-1 rounded-xl bg-surface-2 text-text-dim border border-border text-xs font-bold font-mono">
              VERIFICATION PENDING
            </span>
          )}
        </div>
      </div>

      {/* WHY FLAGGED Section */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-brand font-mono flex items-center gap-1.5">
          <Info size={13} /> Why Flagged (Analytical Justification)
        </h4>
        <ul className="space-y-1.5 pl-1">
          {lead.whyFlagged.map((why, idx) => (
            <li key={idx} className="text-xs text-text flex items-start gap-2">
              <span className="text-success font-bold font-mono">✓</span>
              <span className="leading-snug">{why}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Supporting Records & Evidence */}
      <div className="grid md:grid-cols-2 gap-3 pt-1">
        <div className="p-3 rounded-xl bg-surface-2 border border-border-soft space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-dim font-mono flex items-center gap-1">
            <FileText size={12} /> Grounded Supporting Records
          </span>
          <div className="space-y-1">
            {lead.supportingRecords.map(rec => (
              <div key={rec.id} className="text-xs font-mono font-bold text-text flex items-center justify-between">
                <span>{rec.id} · {rec.title}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-surface border text-text-dim">{rec.type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Not Corroborated / Limitations */}
        <div className="p-3 rounded-xl bg-surface-2 border border-border-soft space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-warning-bright font-mono flex items-center gap-1">
            <AlertTriangle size={12} /> Not Yet Corroborated (Missing Feeds)
          </span>
          <ul className="space-y-1">
            {lead.notCorroborated.map((item, idx) => (
              <li key={idx} className="text-[11px] text-text-dim flex items-center gap-1.5">
                <span className="text-warning-bright">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* OFFICER VERIFICATION BUTTONS */}
      <div className="pt-3 border-t border-border-soft flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-[11px] font-mono text-text-dim">
          <span>Officer Sign-off: </span>
          <strong className="text-text">{lead.decisionBy || 'Pending Action'}</strong>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <button
            onClick={() => handleDecision('CONFIRMED')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center gap-1 ${
              decision === 'CONFIRMED'
                ? 'bg-success text-bg shadow-sm'
                : 'bg-surface-2 text-success hover:bg-success/20 border border-success/30'
            }`}
          >
            <CheckCircle2 size={14} /> CONFIRM LEAD
          </button>

          <button
            onClick={() => handleDecision('NEEDS_FIELD_VERIFICATION')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center gap-1 ${
              decision === 'NEEDS_FIELD_VERIFICATION'
                ? 'bg-warning text-bg shadow-sm'
                : 'bg-surface-2 text-warning-bright hover:bg-warning/20 border border-warning/30'
            }`}
          >
            <HelpCircle size={14} /> FIELD VERIFY
          </button>

          <button
            onClick={() => handleDecision('REJECTED')}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center gap-1 ${
              decision === 'REJECTED'
                ? 'bg-danger text-white shadow-sm'
                : 'bg-surface-2 text-danger-bright hover:bg-danger/20 border border-danger/30'
            }`}
          >
            <XCircle size={14} /> REJECT LEAD
          </button>
        </div>
      </div>
    </div>
  );
}
