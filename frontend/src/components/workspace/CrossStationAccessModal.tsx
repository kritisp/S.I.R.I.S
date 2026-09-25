import React, { useState } from 'react';
import { Shield, Lock, Send, X, AlertTriangle, CheckCircle2, FileText, Building2 } from 'lucide-react';
import { requestsApi } from '../../services/api';
import { useMockState } from '../../mockServices/MockStateContext';

interface CrossStationAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetCaseId: string;
  targetStationName?: string;
  sourceCaseId: string;
  matchReason?: string;
  onSuccess?: (request: any) => void;
}

export function CrossStationAccessModal({
  isOpen,
  onClose,
  targetCaseId,
  targetStationName = 'Cuttack City Police Station (OP-CTC-CITY)',
  sourceCaseId,
  matchReason = 'Cross-case telephony & ANPR correlation detected by S.I.R.I.S. Central Intelligence Engine',
  onSuccess
}: CrossStationAccessModalProps) {
  const { state, dispatch } = useMockState();
  const [urgency, setUrgency] = useState<'IMMEDIATE' | 'PRIORITY' | 'ROUTINE'>('PRIORITY');
  const [legalBasis, setLegalBasis] = useState<string>('SECTION_91_CRPC');
  const [purpose, setPurpose] = useState<string>(
    `Investigative access required for case ${sourceCaseId} to inspect suspect call records, seized recovery memos, and co-conspirator linkages regarding ${matchReason}.`
  );
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        targetCaseId,
        reason: `[${urgency}] [${legalBasis}] ${purpose}`,
      };

      let createdRequest: any = null;
      try {
        createdRequest = await requestsApi.createRequest(targetCaseId, payload.reason);
      } catch (apiErr) {
        console.warn('Backend requestsApi notice:', apiErr);
      }

      if (!createdRequest) {
        createdRequest = {
          id: `REQ-${Date.now().toString().slice(-6)}`,
          requestingStationId: 'OP-BBSR-CAP',
          requestingOfficerId: 'INV-BBSR-001',
          targetStationId: 'OP-CTC-CITY',
          targetCaseId,
          reason: payload.reason,
          status: 'PENDING',
          createdAt: new Date().toISOString()
        };
      }

      dispatch({ type: 'ADD_ACCESS_REQUEST', payload: createdRequest });
      setSubmitted(true);
      setTimeout(() => {
        if (onSuccess) onSuccess(createdRequest);
        onClose();
        setSubmitted(false);
      }, 1500);
    } catch (err: any) {
      console.error('Access request failed:', err);
      setError(err?.message || 'Failed to submit cross-station access request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-sans select-none">
      <div className="glass bg-surface border border-border-soft rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl space-y-0 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-border-soft flex items-center justify-between bg-surface-2/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Lock size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30 uppercase">
                  SECTION 91 / CR.P.C. NOTICE
                </span>
              </div>
              <h3 className="text-base font-bold font-mono text-text mt-0.5">
                Request Cross-Jurisdiction Dossier Access
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-dim hover:text-text hover:bg-surface-hover transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        {submitted ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-12 h-12 bg-success/20 text-success rounded-full flex items-center justify-center mx-auto border border-success/30 animate-bounce">
              <CheckCircle2 size={24} />
            </div>
            <h4 className="text-sm font-bold font-mono text-text uppercase">
              Access Request Dispatched to Station IIC
            </h4>
            <p className="text-xs text-text-dim max-w-sm mx-auto">
              Formal requisition dispatched to <strong className="text-text">{targetStationName}</strong>. Case intelligence will be unlocked immediately upon IIC endorsement.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Target Case Dossier Card */}
            <div className="p-3.5 bg-surface-2 rounded-xl border border-border-soft space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-text-dim uppercase flex items-center gap-1.5">
                  <Building2 size={13} className="text-brand" /> Target Station Case:
                </span>
                <span className="font-bold text-brand bg-brand/10 px-2 py-0.5 rounded border border-brand/20">
                  {targetCaseId}
                </span>
              </div>
              <div className="text-xs font-mono text-text font-bold">
                {targetStationName}
              </div>
              <div className="text-[11px] text-text-dim leading-snug">
                <strong className="text-warning-bright">Detection Reason: </strong> {matchReason}
              </div>
            </div>

            {/* Legal Provisions & Authority */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase font-mono text-text-dim">
                  Statutory Power
                </label>
                <select
                  value={legalBasis}
                  onChange={(e) => setLegalBasis(e.target.value)}
                  className="w-full bg-surface-2 border border-border-soft rounded-lg px-3 py-2 text-xs font-mono text-text outline-none focus:border-brand"
                >
                  <option value="SECTION_91_CRPC">Sec 91 Cr.P.C. (Summons to produce document/evidence)</option>
                  <option value="SECTION_94_BNSS">Sec 94 BNSS (Production of documents/electronic records)</option>
                  <option value="INTER_DISTRICT_IG_DIRECTIVE">Inter-District IG Special Investigation Directive</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase font-mono text-text-dim">
                  Investigation Urgency
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {(['IMMEDIATE', 'PRIORITY', 'ROUTINE'] as const).map(lvl => (
                    <button
                      type="button"
                      key={lvl}
                      onClick={() => setUrgency(lvl)}
                      className={`px-2 py-2 rounded-lg text-[10px] font-mono font-bold border transition-all cursor-pointer text-center ${
                        urgency === lvl
                          ? lvl === 'IMMEDIATE'
                            ? 'bg-danger/20 text-danger-bright border-danger/40'
                            : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                          : 'bg-surface-2 text-text-dim border-border-soft hover:text-text'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Justification Text Area */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase font-mono text-text-dim">
                Case Diary Justification &amp; Purpose of Requisition
              </label>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows={3}
                required
                className="w-full bg-surface-2 border border-border-soft rounded-lg p-3 text-xs font-mono text-text placeholder:text-text-faint outline-none focus:border-brand resize-none leading-relaxed"
              />
            </div>

            {error && (
              <div className="text-[11px] text-danger-bright bg-danger/10 border border-danger/30 rounded-lg p-2.5 flex items-center gap-2">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-border-soft">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 rounded-lg text-xs font-mono font-bold text-text-dim hover:text-text bg-surface-2 border border-border-soft transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !purpose.trim()}
                className="px-5 py-2 rounded-lg text-xs font-mono font-bold text-bg bg-brand hover:bg-brand-bright transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-md hover:shadow-brand/20"
              >
                <Send size={13} />
                {submitting ? 'Submitting Requisition…' : 'Submit Requisition to Station IIC'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
