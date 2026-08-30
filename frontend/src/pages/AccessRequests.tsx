import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, ShieldAlert, FileText, Lock, CheckCircle2, AlertCircle, HelpCircle, ArrowRight, User } from 'lucide-react';
import { useMockState } from '../mockServices/MockStateContext';
import { AccessRequest } from '../mockServices/types';
import { requestsApi } from '../services/api';

export function AccessRequests() {
  const { state, dispatch } = useMockState();

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

  const handleAction = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      if (status === 'APPROVED') {
        await requestsApi.approveRequest(id);
      } else {
        await requestsApi.rejectRequest(id);
      }
    } catch (err) {
      console.warn('Access request action API notice:', err);
    }

    dispatch({ type: 'UPDATE_ACCESS_REQUEST_STATUS', payload: { id, status } });
    
    // Add audit logs/alerts
    dispatch({
      type: 'ADD_ALERT',
      payload: {
        id: `ALT-${Date.now()}`,
        type: 'CROSS_STATION_MATCH',
        message: `${state.currentUser?.name || 'IIC Ramesh'} ${status.toLowerCase()} access request ${id}.`,
        createdAt: new Date().toISOString(),
        isRead: false
      }
    });

    setShowApprovalConfirmModal(false);
    setSelectedIncomingRequest(null);
  };

  const RequestCard = ({ req, type }: { req: AccessRequest, type: 'INCOMING' | 'OUTGOING' }) => {
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
              `Request from Station ${req.requestingStationId} for Case ${req.targetCaseId}` : 
              `Request to Station ${req.targetStationId} for Case ${req.targetCaseId}`
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
            {incomingRequests.map(r => <RequestCard key={r.id} req={r} type="INCOMING" />)}
            {incomingRequests.length === 0 && <p className="text-sm text-text-faint italic font-sans">No incoming requests.</p>}
          </div>
        </div>

        {/* Outgoing Requests */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-text uppercase tracking-wider border-b border-border-soft pb-2 flex items-center gap-2">
            <CheckCircle size={16} className="text-success" /> Outgoing Requests (Tracking)
          </h3>
          <div className="space-y-3">
            {outgoingRequests.map(r => <RequestCard key={r.id} req={r} type="OUTGOING" />)}
            {outgoingRequests.length === 0 && <p className="text-sm text-text-faint italic font-sans">No outgoing requests.</p>}
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
                    <p className="text-[10px] text-text-dim mt-0.5">Submitted by Insp. Vikram to {selectedOutgoingRequest.targetStationId}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-4 w-4 rounded-full bg-success flex items-center justify-center text-bg font-bold">✓</div>
                    <div className="w-0.5 h-10 bg-success" />
                  </div>
                  <div>
                    <span className="font-bold text-text text-[11px]">Under Review</span>
                    <p className="text-[10px] text-text-dim mt-0.5">Assigned to Cuttack PS station governance desk</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`h-4 w-4 rounded-full flex items-center justify-center text-bg font-bold ${
                      selectedOutgoingRequest.status === 'APPROVED' ? 'bg-success' : 'bg-surface-2 border border-border text-text-faint'
                    }`}>
                      {selectedOutgoingRequest.status === 'APPROVED' ? '✓' : '3'}
                    </div>
                    <div className={`w-0.5 h-10 ${selectedOutgoingRequest.status === 'APPROVED' ? 'bg-success' : 'bg-border-soft'}`} />
                  </div>
                  <div>
                    <span className="font-bold text-text text-[11px]">Approved</span>
                    <p className="text-[10px] text-text-dim mt-0.5">
                      {selectedOutgoingRequest.status === 'APPROVED' 
                        ? 'Authorization credentials confirmed by Cuttack Administrator' 
                        : 'Awaiting Cuttack administrator approval decision'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`h-4 w-4 rounded-full flex items-center justify-center text-bg font-bold ${
                      selectedOutgoingRequest.status === 'APPROVED' ? 'bg-success' : 'bg-surface-2 border border-border text-text-faint'
                    }`}>
                      {selectedOutgoingRequest.status === 'APPROVED' ? '✓' : '4'}
                    </div>
                  </div>
                  <div>
                    <span className="font-bold text-text text-[11px]">Access Granted</span>
                    <p className="text-[10px] text-text-dim mt-0.5">
                      {selectedOutgoingRequest.status === 'APPROVED' 
                        ? 'Case linkage unlocked in Knowledge Network Explorer' 
                        : 'Awaiting approval trigger'}
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
                  <span className="text-text font-semibold">{selectedIncomingRequest.requestingStationId}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-text-faint block">Requesting Officer</span>
                  <span className="text-text font-semibold">{selectedIncomingRequest.requestingOfficerId === 'INV-BBSR-001' ? 'Insp. Vikram' : selectedIncomingRequest.requestingOfficerId}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-text-faint block">Target Case</span>
                  <span className="text-text font-semibold font-mono">{selectedIncomingRequest.targetCaseId}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-text-faint block">Relationship Match</span>
                  <span className="text-brand font-bold">94% Confidence Relationship</span>
                </div>
              </div>

              <div className="bg-surface-2 p-3 border border-border-soft rounded-lg">
                <span className="text-[9px] uppercase font-bold text-text-dim block">Justification Reason</span>
                <p className="text-text mt-1 font-sans leading-relaxed">{selectedIncomingRequest.reason}</p>
              </div>

              <div className="p-3.5 bg-danger/10 border border-danger/25 text-danger-bright rounded-xl font-mono font-bold text-center leading-relaxed">
                🔒 CASE INFORMATION REMAINS RESTRICTED UNTIL APPROVAL.
              </div>
            </div>

            <div className="p-5 border-t border-border-soft flex justify-end gap-3 bg-surface-2">
              <button type="button" onClick={() => setSelectedIncomingRequest(null)} className="px-4 py-2 font-bold text-text-dim hover:text-text">Cancel</button>
              {selectedIncomingRequest.status === 'PENDING' && (
                <>
                  <button 
                    onClick={() => handleAction(selectedIncomingRequest.id, 'REJECTED')}
                    className="bg-surface border border-danger/30 hover:bg-danger/5 text-danger-bright px-4 py-2 rounded-lg font-bold"
                  >
                    Reject Request
                  </button>
                  <button 
                    onClick={() => setShowApprovalConfirmModal(true)}
                    className="bg-success text-bg px-6 py-2 rounded-lg font-bold hover:bg-success-bright transition-colors"
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
              "You are authorizing Khandagiri Police Station to access the permitted information associated with {selectedIncomingRequest.targetCaseId}."
            </p>
            <div className="flex gap-2 pt-2">
              <button 
                type="button" 
                onClick={() => setShowApprovalConfirmModal(false)} 
                className="flex-1 bg-surface-2 border border-border font-bold py-2 rounded-lg hover:bg-surface-hover"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={() => handleAction(selectedIncomingRequest.id, 'APPROVED')} 
                className="flex-1 bg-success text-bg font-bold py-2 rounded-lg hover:bg-success-bright transition-colors"
              >
                Approve Access
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
