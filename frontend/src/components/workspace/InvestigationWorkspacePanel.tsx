import React, { useEffect, useState } from 'react';
import { Cpu, Sparkles, RefreshCw, AlertTriangle, CheckCircle2, Plus, Link2 } from 'lucide-react';
import { workspaceApi, WorkspaceDTO, TriggerDTO, WorkspaceIntelligenceResultDTO } from '../../services/api/workspaceApi';

interface InvestigationWorkspacePanelProps {
  caseId: string;
  firNumber?: string;
}

const storageKey = (caseId: string) => `siris_investigation_workspace_for_${caseId}`;

/**
 * Surfaces the Spring Boot "Investigation Workspace -> Trigger -> Intelligence Result"
 * pipeline (InvestigationWorkspaceController/Service/TriggerService — real, already
 * tested by Phase4WorkspaceAndTriggerTest.java, and since this session's fix, backed by
 * real FastAPI central-intelligence analysis rather than MockMlClient). This backend
 * had no frontend consumer at all before this component — workspaceApi.ts's
 * createWorkspace/confirmWorkspace/getResult/etc. were unused dead code.
 *
 * All actions here are explicit, investigator-triggered clicks — never automatic on
 * mount — consistent with the rest of the app's "no silent background writes" rule.
 */
export function InvestigationWorkspacePanel({ caseId, firNumber }: InvestigationWorkspacePanelProps) {
  const [workspace, setWorkspace] = useState<WorkspaceDTO | null>(null);
  const [trigger, setTrigger] = useState<TriggerDTO | null>(null);
  const [result, setResult] = useState<WorkspaceIntelligenceResultDTO | null>(null);

  const [creating, setCreating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [addingCaseId, setAddingCaseId] = useState('');
  const [addingCase, setAddingCase] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

  // Restore a previously-created workspace for this case from this browser's storage —
  // a per-viewer convenience only; the server remains the source of truth for status.
  useEffect(() => {
    let savedId: string | null = null;
    try {
      savedId = localStorage.getItem(storageKey(caseId));
    } catch {
      // localStorage unavailable (private window, blocked storage) — non-fatal.
    }
    if (savedId) {
      workspaceApi.getWorkspaceById(savedId)
        .then((ws) => {
          setWorkspace(ws);
          return refreshTriggerAndResult(savedId!, ws);
        })
        .catch(() => {
          // Saved workspace no longer exists/accessible — clear the stale pointer.
          try { localStorage.removeItem(storageKey(caseId)); } catch { /* ignore */ }
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  const refreshTriggerAndResult = async (workspaceId: string, ws?: WorkspaceDTO) => {
    try {
      const t = await workspaceApi.getTrigger(workspaceId);
      setTrigger(t);
      if (t.status === 'COMPLETED') {
        const r = await workspaceApi.getResult(workspaceId).catch(() => null);
        if (r) setResult(r);
      }
    } catch {
      // No trigger dispatched yet for this workspace — expected before first confirm.
      setTrigger(null);
    }
    if (ws) setWorkspace(ws);
  };

  const handleCreateWorkspace = async () => {
    setCreating(true);
    setError(null);
    try {
      const ws = await workspaceApi.createWorkspace({
        title: `Investigation Workspace — ${firNumber || caseId}`,
        description: `Created from Case Workspace for ${firNumber || caseId}.`,
      });
      await workspaceApi.addCaseToWorkspace(ws.id, caseId);
      setWorkspace(ws);
      try { localStorage.setItem(storageKey(caseId), ws.id); } catch { /* ignore */ }
    } catch (err: any) {
      setError(err?.message || 'Failed to create investigation workspace.');
    } finally {
      setCreating(false);
    }
  };

  const handleAddCase = async () => {
    if (!workspace || !addingCaseId.trim()) return;
    setAddingCase(true);
    setError(null);
    try {
      await workspaceApi.addCaseToWorkspace(workspace.id, addingCaseId.trim());
      setAddingCaseId('');
    } catch (err: any) {
      setError(err?.message || `Failed to add case ${addingCaseId} to workspace.`);
    } finally {
      setAddingCase(false);
    }
  };

  const handleConfirmAndAnalyze = async () => {
    if (!workspace) return;
    setConfirming(true);
    setError(null);
    try {
      const t = await workspaceApi.confirmWorkspace(workspace.id);
      setTrigger(t);
      setResult(null);
      // Analysis runs asynchronously server-side (InvestigationTriggerService.executeTriggerAsync).
      // Poll briefly for completion rather than fabricating a progress animation.
      setPolling(true);
      const poll = async (attemptsLeft: number) => {
        if (attemptsLeft <= 0) {
          setPolling(false);
          return;
        }
        await new Promise((res) => setTimeout(res, 3000));
        try {
          const latest = await workspaceApi.getTrigger(workspace.id);
          setTrigger(latest);
          if (latest.status === 'COMPLETED') {
            const r = await workspaceApi.getResult(workspace.id).catch(() => null);
            if (r) setResult(r);
            setPolling(false);
            return;
          }
          if (latest.status === 'FAILED') {
            setPolling(false);
            return;
          }
        } catch {
          // trigger not readable yet — keep polling
        }
        await poll(attemptsLeft - 1);
      };
      await poll(10);
    } catch (err: any) {
      setError(err?.message || 'Failed to confirm workspace / dispatch analysis trigger.');
      setPolling(false);
    } finally {
      setConfirming(false);
    }
  };

  if (!workspace) {
    return (
      <div className="glass p-6 rounded-xl bg-surface border border-border-soft space-y-3">
        <h3 className="text-xs font-bold text-text uppercase tracking-wider border-b border-border-soft pb-2 flex items-center gap-2">
          <Cpu size={14} className="text-brand" /> Investigation Workspace &amp; Analysis
        </h3>
        <p className="text-xs text-text-dim leading-relaxed">
          No investigation workspace exists yet for this case. A workspace lets you group this
          case with related/cross-station cases and run the Central Intelligence Engine across
          all of them together.
        </p>
        {error && (
          <div className="text-[11px] text-danger-bright bg-danger/10 border border-danger/30 rounded-lg p-2">{error}</div>
        )}
        <button
          onClick={handleCreateWorkspace}
          disabled={creating}
          className="bg-brand text-bg font-bold px-4 py-2 rounded-lg text-xs uppercase font-mono hover:bg-brand-bright transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <Plus size={14} /> {creating ? 'Creating…' : 'Create Investigation Workspace'}
        </button>
      </div>
    );
  }

  return (
    <div className="glass p-6 rounded-xl bg-surface border border-border-soft space-y-4">
      <h3 className="text-xs font-bold text-text uppercase tracking-wider border-b border-border-soft pb-2 flex items-center justify-between">
        <span className="flex items-center gap-2"><Cpu size={14} className="text-brand" /> Investigation Workspace</span>
        <span className="text-[10px] font-mono text-text-dim">{workspace.id} · {workspace.status}</span>
      </h3>

      {error && (
        <div className="text-[11px] text-danger-bright bg-danger/10 border border-danger/30 rounded-lg p-2">{error}</div>
      )}

      {/* Add a related/cross-station case into this workspace before running analysis */}
      <div className="flex items-center gap-2">
        <input
          value={addingCaseId}
          onChange={(e) => setAddingCaseId(e.target.value)}
          placeholder="Add related case ID (e.g. an approved cross-station case)"
          className="flex-1 bg-surface-2 border border-border-soft rounded-lg px-3 py-2 text-xs font-mono text-text placeholder:text-text-faint"
        />
        <button
          onClick={handleAddCase}
          disabled={addingCase || !addingCaseId.trim()}
          className="bg-surface-2 border border-border-soft text-text font-bold px-3 py-2 rounded-lg text-[10px] uppercase font-mono hover:bg-surface-hover transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0"
        >
          <Link2 size={12} /> {addingCase ? 'Adding…' : 'Add Case'}
        </button>
      </div>

      {/* Explicit analysis trigger — never automatic */}
      <button
        onClick={handleConfirmAndAnalyze}
        disabled={confirming || polling}
        className="w-full bg-brand text-bg font-bold px-4 py-2.5 rounded-lg text-xs uppercase font-mono hover:bg-brand-bright transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <Sparkles size={14} />
        {confirming ? 'Dispatching…' : polling ? 'Analysis Running…' : trigger ? 'Re-run Analysis' : 'Run Central Intelligence Analysis'}
      </button>

      {/* Real trigger status — never a fabricated progress animation */}
      {trigger && (
        <div className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
          trigger.status === 'COMPLETED' ? 'bg-success/10 border-success/30 text-success'
          : trigger.status === 'FAILED' ? 'bg-danger/10 border-danger/30 text-danger-bright'
          : 'bg-warning/10 border-warning/30 text-warning'
        }`}>
          {trigger.status === 'COMPLETED' ? <CheckCircle2 size={14} /> : trigger.status === 'FAILED' ? <AlertTriangle size={14} /> : <RefreshCw size={14} className="animate-spin" />}
          <span className="font-bold uppercase font-mono">Trigger {trigger.status}</span>
          {trigger.failureReason && <span className="text-danger-bright">— {trigger.failureReason}</span>}
        </div>
      )}

      {/* Real analysis result from the Central Intelligence Engine (or its documented
          fallback if FastAPI was unreachable — see FastApiCentralIntelligenceClient) */}
      {result && (
        <div className="p-4 bg-surface-2 border border-border-soft rounded-xl space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 bg-surface border border-border-soft rounded-lg">
              <div className="text-[9px] text-text-dim uppercase font-mono">Relationships</div>
              <div className="text-base font-bold text-text mt-0.5">{result.relationshipsDiscovered}</div>
            </div>
            <div className="p-2 bg-surface border border-border-soft rounded-lg">
              <div className="text-[9px] text-text-dim uppercase font-mono">Patterns</div>
              <div className="text-base font-bold text-text mt-0.5">{result.patternsDetected}</div>
            </div>
            <div className="p-2 bg-surface border border-border-soft rounded-lg">
              <div className="text-[9px] text-text-dim uppercase font-mono">Network Nodes</div>
              <div className="text-base font-bold text-text mt-0.5">{result.networkNodesCount}</div>
            </div>
          </div>
          <p className="text-xs text-text-dim leading-relaxed">{result.summary}</p>
        </div>
      )}
    </div>
  );
}
