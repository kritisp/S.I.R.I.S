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
      <div className="glass p-5 rounded-xl flex items-center justify-between bg-surface border border-border-soft">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-mono bg-surface-2 border border-border-soft px-2 py-0.5 rounded text-text-dim">
              {req.id}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded font-mono border
              ${req.status === 'PENDING' ? 'bg-warning/10 text-warning border-warning/30' : 
                req.status === 'APPROVED' ? 'bg-success/10 text-success border-success/30' : 'bg-danger/10 text-danger-bright border-danger/30'}
            `}>
              {req.status}
            </span>
          </div>
          <p className="text-sm text-text font-semibold">
            {type === 'INCOMING' ? 
              `Request from ${reqStation} for Case ${req.targetCaseId}` : 
              `Request to ${tgtStation} for Case ${req.targetCaseId}`
            }
          </p>
          <p className="text-xs text-text-dim mt-1 truncate max-w-sm">Reason: {req.reason}</p>
        </div>

        <div className="flex gap-2">
          {type === 'OUTGOING' ? (
            <button
              onClick={() => setSelectedOutgoingRequest(req)}
              className="px-3 py-1.5 text-[10px] font-bold bg-surface-2 border border-border text-text rounded-md hover:bg-surface-hover transition-colors"
            >
              Track Request
            </button>
          ) : (
            <button
              onClick={() => setSelectedIncomingRequest(req)}
              className="px-3 py-1.5 text-[10px] font-bold bg-brand/10 hover:bg-brand/20 border border-brand/20 text-brand rounded-md transition-colors"
            >
              Review Request
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      <div>
        <h2 className="text-2xl font-bold text-text font-display flex items-center gap-2">
          <ShieldAlert className="text-brand" /> Access Requests Governance
        </h2>
        <p className="text-sm text-text-dim mt-1">Manage cross-station intelligence access approvals and tracking</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Incoming Requests */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-text uppercase tracking-wider border-b border-border-soft pb-2 flex items-center gap-2">
            <Clock size={16} className="text-warning" /> Incoming Requests (Requires Action)
          </h3>
          <div className="space-y-3">
            {incomingRequests.length > 0 ? (
              incomingRequests.map(r => <RequestCard key={r.id} req={r} type="INCOMING" />)
            ) : (
              <div className="glass p-8 rounded-2xl border border-dashed border-border-soft text-center space-y-2 bg-surface/40">
                <Clock size={28} className="text-text-faint mx-auto opacity-60" />
                <p className="text-xs font-bold text-text-dim uppercase font-mono">No Incoming Requests</p>
                <p className="text-[11px] text-text-faint font-sans">No pending cross-station authorization requests requiring your review.</p>
              </div>
            )}
          </div>
        </div>

        {/* Outgoing Requests */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-text uppercase tracking-wider border-b border-border-soft pb-2 flex items-center gap-2">
            <CheckCircle size={16} className="text-success" /> Outgoing Requests (Tracking)
          </h3>
          <div className="space-y-3">
            {outgoingRequests.length > 0 ? (
              outgoingRequests.map(r => <RequestCard key={r.id} req={r} type="OUTGOING" />)
            ) : (
              <div className="glass p-8 rounded-2xl border border-dashed border-border-soft text-center space-y-2 bg-surface/40">
                <CheckCircle size={28} className="text-text-faint mx-auto opacity-60" />
                <p className="text-xs font-bold text-text-dim uppercase font-mono">No Outgoing Requests</p>
                <p className="text-[11px] text-text-faint font-sans">You have not submitted any cross-station case access requests.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Outgoing Request Timeline Tracking Modal ─── */}
      {selectedOutgoingRequest && (
        <div className="fixed inset-0 bg-bg/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-md shadow-glass overflow-hidden animate-fade-in text-xs space-y-4">
            <div className="p-5 border-b border-border-soft flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-text flex items-center gap-1.5">
                <Clock size={16} className="text-brand" /> REQUEST TIMELINE
              </h3>
              <button type="button" onClick={() => setSelectedOutgoingRequest(null)} className="text-text-dim hover:text-text font-bold text-lg">&times;</button>
            </div>
            
            <div className="p-5 space-y-6">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-4 w-4 rounded-full bg-success flex items-center justify-center text-bg font-bold">✓</div>
                    <div className="w-0.5 h-10 bg-success" />
                  </div>
                  <div>
                    <span className="font-bold text-text text-[11px]">Requested</span>
                    <p className="text-[10px] text-text-dim mt-0.5">Submitted by {getOfficerLabel(selectedOutgoingRequest.requestingOfficerId)} to {getStationLabel(selectedOutgoingRequest.targetStationId)}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-4 w-4 rounded-full bg-success flex items-center justify-center text-bg font-bold">✓</div>
                    <div className="w-0.5 h-10 bg-success" />
                  </div>
                  <div>
                    <span className="font-bold text-text text-[11px]">Under Review</span>
                    <p className="text-[10px] text-text-dim mt-0.5">Assigned to {getStationLabel(selectedOutgoingRequest.targetStationId)} governance desk</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`h-4 w-4 rounded-full flex items-center justify-center text-bg font-bold ${
                      selectedOutgoingRequest.status === 'APPROVED' ? 'bg-success' : selectedOutgoingRequest.status === 'REJECTED' ? 'bg-danger text-white' : 'bg-surface-2 border border-border text-text-faint'
                    }`}>
                      {selectedOutgoingRequest.status === 'APPROVED' ? '✓' : selectedOutgoingRequest.status === 'REJECTED' ? '✕' : '3'}
                    </div>
                    <div className={`w-0.5 h-10 ${selectedOutgoingRequest.status === 'APPROVED' ? 'bg-success' : selectedOutgoingRequest.status === 'REJECTED' ? 'bg-danger' : 'bg-border-soft'}`} />
                  </div>
                  <div>
                    <span className="font-bold text-text text-[11px]">
                      {selectedOutgoingRequest.status === 'APPROVED' ? 'Approved' : selectedOutgoingRequest.status === 'REJECTED' ? 'Rejected' : 'Approval Decision'}
                    </span>
                    <p className="text-[10px] text-text-dim mt-0.5">
                      {selectedOutgoingRequest.status === 'APPROVED' 
                        ? `Authorization confirmed by ${getStationLabel(selectedOutgoingRequest.targetStationId)} Administrator` 
                        : selectedOutgoingRequest.status === 'REJECTED'
                        ? `Access request was rejected by ${getStationLabel(selectedOutgoingRequest.targetStationId)} Administrator`
                        : `Awaiting ${getStationLabel(selectedOutgoingRequest.targetStationId)} administrator approval decision`}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`h-4 w-4 rounded-full flex items-center justify-center text-bg font-bold ${
                      selectedOutgoingRequest.status === 'APPROVED' ? 'bg-success' : selectedOutgoingRequest.status === 'REJECTED' ? 'bg-danger text-white' : 'bg-surface-2 border border-border text-text-faint'
                    }`}>
                      {selectedOutgoingRequest.status === 'APPROVED' ? '✓' : selectedOutgoingRequest.status === 'REJECTED' ? '✕' : '4'}
                    </div>
                  </div>
                  <div>
                    <span className="font-bold text-text text-[11px]">
                      {selectedOutgoingRequest.status === 'APPROVED' ? 'Access Granted' : selectedOutgoingRequest.status === 'REJECTED' ? 'Access Denied' : 'Pending Authorization'}
                    </span>
                    <p className="text-[10px] text-text-dim mt-0.5">
                      {selectedOutgoingRequest.status === 'APPROVED' 
                        ? 'Case linkage unlocked in Knowledge Network Explorer' 
                        : selectedOutgoingRequest.status === 'REJECTED'
                        ? 'Cross-station case file remains restricted'
                        : 'Awaiting station administrator authorization'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-border-soft flex justify-end bg-surface-2">
              <button type="button" onClick={() => setSelectedOutgoingRequest(null)} className="bg-brand text-bg px-6 py-2 rounded-lg font-bold hover:bg-brand-bright">Done</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Incoming Request Review Panel Modal ─── */}
      {selectedIncomingRequest && (
        <div className="fixed inset-0 bg-bg/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-lg shadow-glass overflow-hidden animate-fade-in text-xs space-y-4">
            <div className="p-5 border-b border-border-soft flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-text flex items-center gap-1.5">
                <Lock size={16} className="text-brand" /> ACCESS REQUEST SECURITY REVIEW
              </h3>
              <button type="button" onClick={() => setSelectedIncomingRequest(null)} className="text-text-dim hover:text-text font-bold text-lg">&times;</button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[9px] uppercase font-bold text-text-faint block">Requesting Station</span>
                  <span className="text-text font-semibold">{getStationLabel(selectedIncomingRequest.requestingStationId)}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-text-faint block">Requesting Officer</span>
                  <span className="text-text font-semibold">{getOfficerLabel(selectedIncomingRequest.requestingOfficerId)}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-text-faint block">Target Case</span>
                  <span className="text-text font-semibold font-mono">{selectedIncomingRequest.targetCaseId}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-text-faint block">Security Level</span>
                  <span className="text-brand font-bold">Station Governance Permitted</span>
                </div>
              </div>

              <div className="bg-surface-2 p-3 border border-border-soft rounded-lg">
                <span className="text-[9px] uppercase font-bold text-text-dim block">Justification Reason</span>
                <p className="text-text mt-1 font-sans leading-relaxed">{selectedIncomingRequest.reason}</p>
              </div>

              <div className="p-3.5 bg-danger/10 border border-danger/25 text-danger-bright rounded-xl font-mono font-bold text-center leading-relaxed">
                🔒 CASE INFORMATION REMAINS RESTRICTED UNTIL APPROVAL.
              </div>

              {actionError && (
                <div className="p-3 bg-danger/10 border border-danger/30 text-danger-bright rounded-lg text-[11px] font-mono">
                  {actionError}
                </div>
              )}
            </div>

            <div className="p-5 border-t border-border-soft flex justify-end gap-3 bg-surface-2">
              <button type="button" onClick={() => setSelectedIncomingRequest(null)} className="px-4 py-2 font-bold text-text-dim hover:text-text">Cancel</button>
              {selectedIncomingRequest.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => handleAction(selectedIncomingRequest.id, 'REJECTED')}
                    disabled={actionInFlight}
                    className="bg-surface border border-danger/30 hover:bg-danger/5 text-danger-bright px-4 py-2 rounded-lg font-bold disabled:opacity-50"
                  >
                    Reject Request
                  </button>
                  <button
                    onClick={() => setShowApprovalConfirmModal(true)}
                    disabled={actionInFlight}
                    className="bg-success text-bg px-6 py-2 rounded-lg font-bold hover:bg-success-bright transition-colors disabled:opacity-50"
                  >
                    Approve Request
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Approval Confirmation Dialog Modal ─── */}
      {showApprovalConfirmModal && selectedIncomingRequest && (
        <div className="fixed inset-0 bg-bg/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl p-6 max-w-sm w-full space-y-4 shadow-glass text-xs text-center">
            <h4 className="font-bold text-sm uppercase text-text">APPROVE CASE ACCESS?</h4>
            <p className="text-text-dim font-sans leading-relaxed">
              &quot;You are authorizing {getStationLabel(selectedIncomingRequest.requestingStationId)} to access permitted investigative information associated with case {selectedIncomingRequest.targetCaseId}.&quot;
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowApprovalConfirmModal(false)}
                disabled={actionInFlight}
                className="flex-1 bg-surface-2 border border-border font-bold py-2 rounded-lg hover:bg-surface-hover disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAction(selectedIncomingRequest.id, 'APPROVED')}
                disabled={actionInFlight}
                className="flex-1 bg-success text-bg font-bold py-2 rounded-lg hover:bg-success-bright transition-colors disabled:opacity-50"
              >
                {actionInFlight ? 'Approving…' : 'Approve Access'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
