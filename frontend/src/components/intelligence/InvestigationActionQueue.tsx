import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, ArrowUpRight, Shield, Clock, ExternalLink, Activity, Filter, Check } from 'lucide-react';
import { fetchActionQueue, ActionItem } from '../../services/intelligenceEventService';
import { useNavigate } from 'react-router-dom';

interface InvestigationActionQueueProps {
  caseId?: string;
  onOpenVehicleIntel?: (plate: string) => void;
  onOpenGeoTrail?: () => void;
}

export function InvestigationActionQueue({
  caseId,
  onOpenVehicleIntel,
  onOpenGeoTrail
}: InvestigationActionQueueProps) {
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    fetchActionQueue(caseId)
      .then(res => setActions(res))
      .finally(() => setLoading(false));
  }, [caseId]);

  const handleStatusChange = (id: string, newStatus: 'NEW' | 'IN_REVIEW' | 'VERIFIED' | 'DISMISSED') => {
    setActions(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
  };

  const handleActionClick = (action: ActionItem) => {
    if (action.entityType === 'VEHICLE' && onOpenVehicleIntel) {
      onOpenVehicleIntel(action.entityValue || 'OD-02-AB-1234');
    } else if (action.entityType === 'GEO_TRAIL' && onOpenGeoTrail) {
      onOpenGeoTrail();
    } else if (action.actionRoute) {
      navigate(action.actionRoute);
    }
  };

  return (
    <div className="glass bg-surface border border-border-soft rounded-2xl p-5 space-y-4 shadow-sm select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-soft pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-brand/10 text-brand border border-brand/20">
            <Activity size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono text-text flex items-center gap-2">
              INVESTIGATION ACTION QUEUE
            </h3>
            <p className="text-[11px] text-text-dim">
              Automated intelligence tasks prioritized for investigator review
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono font-bold bg-brand/10 text-brand px-2 py-0.5 rounded border border-brand/20">
          {actions.filter(a => a.status !== 'DISMISSED').length} ACTIVE TASKS
        </span>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="py-8 text-center text-xs text-text-dim font-mono">
          Loading investigation task queue...
        </div>
      ) : (
        <div className="space-y-3">
          {actions.map(item => (
            <div
              key={item.id}
              className={`p-3.5 rounded-xl border transition-all space-y-2 ${
                item.status === 'VERIFIED' ? 'bg-success/5 border-success/30' :
                item.status === 'DISMISSED' ? 'bg-surface-2 opacity-50 border-border-soft' :
                item.priority === 'HIGH' ? 'bg-surface-2 border-brand/40 hover:border-brand' :
                'bg-surface-2 border-border-soft hover:border-border'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${
                      item.priority === 'HIGH' ? 'bg-danger/20 text-danger-bright border-danger/30' :
                      'bg-warning/20 text-warning-bright border-warning/30'
                    }`}>
                      {item.priority} PRIORITY
                    </span>
                    <span className="text-xs font-bold text-text">{item.title}</span>
                  </div>
                  <p className="text-xs text-text-dim leading-snug">{item.reason}</p>
                </div>

                <span className="text-[10px] font-mono text-text-faint shrink-0">
                  {item.relatedCaseId}
                </span>
              </div>

              {/* Task Footer Buttons */}
              <div className="flex items-center justify-between pt-1 border-t border-border-soft text-xs">
                <span className="text-[10px] font-mono text-text-faint">
                  STATUS: <strong className="text-text">{item.status}</strong>
                </span>

                <div className="flex items-center gap-2">
                  {item.status !== 'VERIFIED' && (
                    <button
                      onClick={() => handleStatusChange(item.id, 'VERIFIED')}
                      className="px-2 py-1 rounded text-[10px] font-bold bg-success/10 text-success border border-success/30 hover:bg-success/20 transition-colors flex items-center gap-1"
                    >
                      <Check size={11} /> VERIFY
                    </button>
                  )}

                  {item.status !== 'DISMISSED' && (
                    <button
                      onClick={() => handleStatusChange(item.id, 'DISMISSED')}
                      className="px-2 py-1 rounded text-[10px] font-bold text-text-dim hover:text-text hover:bg-surface-hover transition-colors"
                    >
                      DISMISS
                    </button>
                  )}

                  <button
                    onClick={() => handleActionClick(item)}
                    className="px-2.5 py-1 rounded text-[10px] font-bold bg-brand text-bg hover:bg-brand-bright transition-colors flex items-center gap-1 shadow-xs"
                  >
                    OPEN <ArrowUpRight size={11} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
