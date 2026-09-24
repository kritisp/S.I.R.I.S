import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, ShieldAlert, FileText, Lock, CheckCircle2, AlertCircle, HelpCircle, ArrowRight, User } from 'lucide-react';
import { useMockState } from '../mockServices/MockStateContext';
import { AccessRequest } from '../mockServices/types';
import { requestsApi } from '../services/api';

export function AccessRequests() {
  const { state, dispatch, refreshBackendData } = useMockState();
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionInFlight, setActionInFlight] = useState(false);

  const myStationId = state.currentUser?.stationId || 'OP-BBSR-CAP';
  const isSuperAdmin = state.currentUser?.role === 'SUPER_ADMIN';

  // Requests sent BY my station
  const outgoingRequests = state.accessRequests.filter(r => r.requestingOfficerId === state.currentUser?.id || isSuperAdmin);
  
  // Requests received BY my station (Needs approval)
  const incomingRequests = state.accessRequests.filter(r => r.targetStationId === myStationId || isSuperAdmin);

  // Modal / details states
  const [selectedOutgoingRequest, setSelectedOutgoingRequest] = useState<AccessRequest | null>(null);
  const [selectedIncomingRequest, setSelectedIncomingRequest] = useState<AccessRequest | null>(null);
  const [showApprovalConfirmModal, setShowApprovalConfirmModal] = useState(false);

  const getStationLabel = (stId: string) => {
    const found = state.stations.find(s => s.id === stId);
    return found ? `${found.name} (${stId})` : stId;
  };

  const getOfficerLabel = (offId: string) => {
    const found = state.users.find(u => u.id === offId);
    return found ? `${found.name} (${found.rank || 'Officer'})` : offId;
  };

  const handleAction = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setActionInFlight(true);
    setActionError(null);
    try {
      // Server-enforced: PATCH /api/v1/requests/{id}/approve|reject
      // (AccessRequestService.updateRequestStatus verifies the actor is a
      // STATION_ADMIN of the TARGET station or SUPER_ADMIN before applying it —
      // this is not a client-side status flip.)
      if (status === 'APPROVED') {
        await requestsApi.approveRequest(id);
      } else {
        await requestsApi.rejectRequest(id);
      }
    } catch (err: any) {
      console.error('Access request action failed:', err);
      setActionError(err?.message || `Failed to ${status === 'APPROVED' ? 'approve' : 'reject'} request ${id}.`);
      setActionInFlight(false);
      return;
    }

    // Re-sync from the backend rather than assuming the local optimistic update
    // matches server state (it always will here, but this keeps one source of truth
    // instead of two paths that could drift).
    await refreshBackendData();

    dispatch({
      type: 'ADD_ALERT',
      payload: {
        id: `ALT-${Date.now()}`,
        type: 'CROSS_STATION_MATCH',
        message: `${state.currentUser?.name || 'Officer'} ${status.toLowerCase()} access request ${id}.`,
        createdAt: new Date().toISOString(),
        isRead: false
      }
    });

    setActionInFlight(false);
    setShowApprovalConfirmModal(false);
    setSelectedIncomingRequest(null);
  };

  const RequestCard = ({ req, type }: { req: AccessRequest, type: 'INCOMING' | 'OUTGOING' }) => {
    const reqStation = state.stations.find(s => s.id === req.requestingStationId)?.name || req.requestingStationId;
    const tgtStation = state.stations.find(s => s.id === req.targetStationId)?.name || req.targetStationId;

    return (
      <div className="bg-surface-2 dark:bg-[#0E1422] p-3.5 rounded-xl border border-border-soft dark:border-[#1E293B] hover:border-accent/40 dark:hover:border-[#38BDF8]/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group shadow-2xs font-sans">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap font-mono">
            <span className="text-xs font-bold text-accent dark:text-[#38BDF8]">
              {req.id}
            </span>
            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${
              req.status === 'PENDING' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' : 
              req.status === 'APPROVED' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
            }`}>
              {req.status}
            </span>
            <span className="text-[10px] text-text-dim dark:text-[#64748B]">
              Target: <strong className="text-text dark:text-[#F8FAFC]">{req.targetCaseId}</strong>
            </span>
          </div>

          <p className="text-xs text-text dark:text-[#F8FAFC] font-semibold truncate">
            {type === 'INCOMING' ? 
              `Request from ${reqStation} for Case ${req.targetCaseId}` : 
              `Request to ${tgtStation} for Case ${req.targetCaseId}`
            }
          </p>
          <p className="text-[11px] text-text-dim dark:text-[#94A3B8] truncate max-w-sm">Reason: {req.reason}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0 font-mono">
          {type === 'OUTGOING' ? (
            <button
              onClick={() => setSelectedOutgoingRequest(req)}
              className="px-3 py-1.5 text-xs font-bold bg-surface dark:bg-[#070A0F] border border-border-soft dark:border-[#1E293B] text-text-dim dark:text-[#94A3B8] hover:text-text rounded-lg transition-colors cursor-pointer"
            >
              Track Status
            </button>
          ) : (
            <button
              onClick={() => setSelectedIncomingRequest(req)}
              className="px-3 py-1.5 text-xs font-bold bg-accent/15 dark:bg-[#38BDF8]/15 hover:bg-accent/25 border border-accent/30 dark:border-[#38BDF8]/30 text-accent dark:text-[#38BDF8] rounded-lg transition-colors cursor-pointer"
            >
              Review Authorization
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-[1520px] mx-auto space-y-4 animate-fade-in pb-24 font-sans select-none text-text">
      
      {/* ── 1. HEADER ── */}
      <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-3.5 sm:p-4 shadow-xs dark:shadow-2xl font-sans transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-2 dark:bg-[#0E1422] border border-accent/40 dark:border-[#38BDF8]/40 flex items-center justify-center text-accent dark:text-[#38BDF8] shrink-0 shadow-xs">
              <ShieldAlert size={20} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-accent dark:text-[#38BDF8]">
                  INTER-STATION JURISDICTION GOVERNANCE
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  SEC 105 BNSS COMPLIANT
                </span>
                <span className="text-[9px] font-mono font-medium text-text-dim dark:text-[#94A3B8] px-1.5 py-0.2 rounded bg-surface-2 dark:bg-[#131B2E] border border-border-soft dark:border-[#1E293B]">
                  STATION: {myStationId}
                </span>
              </div>

              <div className="flex items-baseline gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold font-mono text-text dark:text-[#F8FAFC] tracking-tight">
                  Cross-Station Access Requests &amp; Authorization Matrix
                </h1>
                <span className="text-xs text-text-dim dark:text-[#94A3B8] font-sans">
                  — Inter-station intelligence sharing, case file access authorizations, and immutable custody audit.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. TWO COLUMN GOVERNANCE PANELS ── */}
      <div className="grid md:grid-cols-2 gap-4">
        
        {/* Incoming Requests */}
        <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-4 shadow-xs dark:shadow-2xl space-y-3 font-sans">
          <div className="flex items-center justify-between border-b border-border-soft dark:border-[#1E293B] pb-2.5">
            <h3 className="text-xs font-mono font-bold text-text dark:text-[#F8FAFC] uppercase tracking-wider flex items-center gap-2">
              <Clock size={14} className="text-amber-500" /> INCOMING AUTHORIZATION REQUESTS ({incomingRequests.length})
            </h3>
            <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.2 rounded">
              ACTION REQUIRED
            </span>
          </div>

          <div className="space-y-2.5">
            {incomingRequests.length > 0 ? (
              incomingRequests.map(r => <RequestCard key={r.id} req={r} type="INCOMING" />)
            ) : (
              <div className="bg-surface-2 dark:bg-[#0E1422] p-8 rounded-xl border border-dashed border-border-soft dark:border-[#1E293B] text-center space-y-2 font-mono">
                <Clock size={24} className="text-text-dim dark:text-[#64748B] mx-auto opacity-60" />
                <p className="text-xs font-bold text-text dark:text-[#F8FAFC] uppercase">No Incoming Requests</p>
                <p className="text-[11px] text-text-dim dark:text-[#94A3B8] font-sans">No pending cross-station authorization requests requiring your review.</p>
              </div>
            )}
          </div>
        </div>

        {/* Outgoing Requests */}
        <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-4 shadow-xs dark:shadow-2xl space-y-3 font-sans">
          <div className="flex items-center justify-between border-b border-border-soft dark:border-[#1E293B] pb-2.5">
            <h3 className="text-xs font-mono font-bold text-text dark:text-[#F8FAFC] uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-500" /> OUTGOING ACCESS REQUESTS ({outgoingRequests.length})
            </h3>
            <span className="text-[10px] font-mono text-text-dim dark:text-[#64748B] bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] px-2 py-0.2 rounded">
              TRACKING
            </span>
          </div>

          <div className="space-y-2.5">
            {outgoingRequests.length > 0 ? (
              outgoingRequests.map(r => <RequestCard key={r.id} req={r} type="OUTGOING" />)
            ) : (
              <div className="bg-surface-2 dark:bg-[#0E1422] p-8 rounded-xl border border-dashed border-border-soft dark:border-[#1E293B] text-center space-y-2 font-mono">
                <CheckCircle2 size={24} className="text-text-dim dark:text-[#64748B] mx-auto opacity-60" />
                <p className="text-xs font-bold text-text dark:text-[#F8FAFC] uppercase">No Outgoing Requests</p>
                <p className="text-[11px] text-text-dim dark:text-[#94A3B8] font-sans">You have not submitted any cross-station case access requests.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ─── Outgoing Request Timeline Tracking Modal ─── */}
      {selectedOutgoingRequest && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#0B0F17] border border-[#1E293B] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden font-mono text-xs space-y-4">
            <div className="p-4 border-b border-[#1E293B] flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <Clock size={15} className="text-accent dark:text-[#38BDF8]" /> REQUEST TIMELINE: {selectedOutgoingRequest.id}
              </h3>
              <button type="button" onClick={() => setSelectedOutgoingRequest(null)} className="text-slate-400 hover:text-white font-bold text-base cursor-pointer">&times;</button>
            </div>
            
            <div className="p-4 space-y-4 font-sans">
              <div className="space-y-3 font-mono">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center text-black font-bold text-[10px]">✓</div>
                    <div className="w-0.5 h-8 bg-emerald-500" />
                  </div>
                  <div>
                    <span className="font-bold text-white text-[11px]">Requested</span>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-sans">Submitted to {getStationLabel(selectedOutgoingRequest.targetStationId)}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center text-black font-bold text-[10px]">✓</div>
                    <div className="w-0.5 h-8 bg-emerald-500" />
                  </div>
                  <div>
                    <span className="font-bold text-white text-[11px]">Governance Review</span>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-sans">Assigned to station supervisory desk</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`h-4 w-4 rounded-full flex items-center justify-center font-bold text-[10px] ${
                      selectedOutgoingRequest.status === 'APPROVED' ? 'bg-emerald-500 text-black' : selectedOutgoingRequest.status === 'REJECTED' ? 'bg-rose-500 text-white' : 'bg-[#1E293B] text-slate-400'
                    }`}>
                      {selectedOutgoingRequest.status === 'APPROVED' ? '✓' : selectedOutgoingRequest.status === 'REJECTED' ? '✕' : '3'}
                    </div>
                  </div>
                  <div>
                    <span className="font-bold text-white text-[11px]">
                      {selectedOutgoingRequest.status === 'APPROVED' ? 'Authorization Granted' : selectedOutgoingRequest.status === 'REJECTED' ? 'Authorization Denied' : 'Pending Authorization'}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-sans">
                      {selectedOutgoingRequest.status === 'APPROVED' 
                        ? 'Case file and entity connections unlocked in Network Explorer' 
                        : selectedOutgoingRequest.status === 'REJECTED'
                        ? 'Request was declined by target station administration'
                        : 'Awaiting station administrator decision'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 border-t border-[#1E293B] flex justify-end bg-[#070A0F]">
              <button type="button" onClick={() => setSelectedOutgoingRequest(null)} className="bg-accent dark:bg-[#38BDF8] text-bg dark:text-[#070A0F] px-4 py-1.5 rounded-lg font-bold text-xs cursor-pointer">Done</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Incoming Request Review Panel Modal ─── */}
      {selectedIncomingRequest && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#0B0F17] border border-[#1E293B] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-xs space-y-3 font-sans">
            <div className="p-4 border-b border-[#1E293B] flex items-center justify-between font-mono">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <Lock size={14} className="text-accent dark:text-[#38BDF8]" /> ACCESS REQUEST SECURITY REVIEW: {selectedIncomingRequest.id}
              </h3>
              <button type="button" onClick={() => setSelectedIncomingRequest(null)} className="text-slate-400 hover:text-white font-bold text-base cursor-pointer">&times;</button>
            </div>
            
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 font-mono text-[11px]">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Requesting Station</span>
                  <span className="text-white font-semibold">{getStationLabel(selectedIncomingRequest.requestingStationId)}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Requesting Officer</span>
                  <span className="text-white font-semibold">{getOfficerLabel(selectedIncomingRequest.requestingOfficerId)}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Target Case</span>
                  <span className="text-accent dark:text-[#38BDF8] font-bold">{selectedIncomingRequest.targetCaseId}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Governance Tier</span>
                  <span className="text-emerald-400 font-bold">Sec 105 BNSS Dual-Auth</span>
                </div>
              </div>

              <div className="bg-[#070A0F] p-3 border border-[#1E293B] rounded-xl">
                <span className="text-[9px] uppercase font-bold text-slate-400 block font-mono">Investigation Justification</span>
                <p className="text-slate-200 mt-1 font-sans leading-relaxed text-xs">{selectedIncomingRequest.reason}</p>
              </div>

              <div className="p-2.5 bg-rose-500/10 border border-rose-500/25 text-rose-400 rounded-xl font-mono text-[11px] text-center font-bold">
                🔒 RESTRICTED: INFORMATION REMAINS SEALED PENDING EXPLICIT APPROVAL.
              </div>

              {actionError && (
                <div className="p-2.5 bg-rose-500/15 border border-rose-500/40 text-rose-400 rounded-lg text-xs font-mono">
                  {actionError}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-[#1E293B] flex justify-end gap-2 bg-[#070A0F] font-mono">
              <button type="button" onClick={() => setSelectedIncomingRequest(null)} className="px-3 py-1.5 font-bold text-slate-400 hover:text-white text-xs cursor-pointer">Cancel</button>
              {selectedIncomingRequest.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => handleAction(selectedIncomingRequest.id, 'REJECTED')}
                    disabled={actionInFlight}
                    className="bg-[#0B0F17] border border-rose-500/30 hover:bg-rose-500/15 text-rose-400 px-3.5 py-1.5 rounded-lg font-bold text-xs disabled:opacity-50 cursor-pointer"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => setShowApprovalConfirmModal(true)}
                    disabled={actionInFlight}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    Approve Access
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Approval Confirmation Dialog Modal ─── */}
      {showApprovalConfirmModal && selectedIncomingRequest && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#0B0F17] border border-[#1E293B] rounded-2xl p-5 max-w-sm w-full space-y-3 shadow-2xl text-center font-sans">
            <h4 className="font-bold text-sm uppercase text-white font-mono">CONFIRM ACCESS AUTHORIZATION?</h4>
            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              You are authorizing <strong className="text-white">{getStationLabel(selectedIncomingRequest.requestingStationId)}</strong> to access investigative records associated with case <strong className="text-accent dark:text-[#38BDF8] font-mono">{selectedIncomingRequest.targetCaseId}</strong>.
            </p>
            <div className="flex gap-2 pt-2 font-mono">
              <button
                type="button"
                onClick={() => setShowApprovalConfirmModal(false)}
                disabled={actionInFlight}
                className="flex-1 bg-[#0E1422] border border-[#1E293B] text-slate-300 font-bold py-2 rounded-lg hover:bg-slate-800 disabled:opacity-50 text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAction(selectedIncomingRequest.id, 'APPROVED')}
                disabled={actionInFlight}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg transition-colors disabled:opacity-50 text-xs cursor-pointer"
              >
                {actionInFlight ? 'Approving…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
