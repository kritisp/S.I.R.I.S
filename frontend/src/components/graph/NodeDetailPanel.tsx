import React, { useState } from 'react';
import { 
  X, Lock, ExternalLink, Shield, TrendingUp, Eye, Radio, 
  AlertTriangle, User, Phone, Car, Building2, MapPin, 
  Database, ArrowUpRight, ShieldAlert 
} from 'lucide-react';
import { NetworkNode, getNodeEdges, getNode, NETWORK_NODES, NETWORK_EDGES } from '../../mockServices/networkGraphData';
import { useMockState } from '../../mockServices/MockStateContext';
import { requestsApi } from '../../services/api';
import { useNavigate } from 'react-router-dom';

interface NodeDetailPanelProps {
  node: NetworkNode | null;
  onClose: () => void;
  onExpandNode?: (nodeId: string) => void;
}

// Type color badge
function TypeBadge({ type }: { type: NetworkNode['type'] }) {
  const styles: Record<string, string> = {
    CASE: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    PERSON: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    PHONE: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    VEHICLE: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
    LOCATION: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30',
    EVIDENCE: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30',
    STATION: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
  };
  return (
    <span className={`text-[9px] font-bold uppercase tracking-[0.15em] px-2 py-0.5 rounded border ${styles[type] || 'bg-surface-2 text-text-dim border-border'}`}>
      {type}
    </span>
  );
}

export function NodeDetailPanel({ node, onClose, onExpandNode }: NodeDetailPanelProps) {
  const { state, dispatch } = useMockState();
  const navigate = useNavigate();

  if (!node) return null;

  const edges = getNodeEdges(node.id);
  const connectedIds = [...new Set(edges.flatMap(e => [e.source, e.target]).filter(id => id !== node.id))];
  const connectedNodes = connectedIds.map(id => getNode(id)).filter(Boolean) as NetworkNode[];

  const existingRequest = node.caseId
    ? state.accessRequests.find(r => r.targetCaseId === node.caseId && r.requestingStationId === state.currentUser?.stationId)
    : null;

  const isRestricted = node.accessStatus === 'RESTRICTED' && !existingRequest?.status.includes('APPROVED');
  const hasPendingRequest = existingRequest?.status === 'PENDING';
  const hasApprovedRequest = existingRequest?.status === 'APPROVED';

  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  // Cross-station confidence from the edges connecting this node
  const crossEdge = NETWORK_EDGES.find(e =>
    (e.source === node.id || e.target === node.id) && e.isCrossStation
  );
  const confidence = crossEdge?.confidence ?? (node.metadata?.confidence as number) ?? 88;

  const handleRequestAccess = async () => {
    if (!node.caseId) return;
    setRequestSubmitting(true);
    setRequestError(null);
    try {
      const created = await requestsApi.createRequest(
        node.caseId,
        `Cross-station entity match detected via Network Explorer (confidence: ${confidence}%).`
      );
      dispatch({ type: 'ADD_ACCESS_REQUEST', payload: created });
    } catch (err: any) {
      console.error('Access request submission failed:', err);
      setRequestError(err?.message || 'Failed to submit access request.');
    } finally {
      setRequestSubmitting(false);
    }
  };

  const handleOpenCase = () => {
    if (node.caseId) navigate(`/cases/${node.caseId}?from=network`);
  };

  const riskScore = node.type === 'PERSON' ? 92 : node.type === 'VEHICLE' ? 75 : 65;

  return (
    <div className="w-80 sm:w-96 bg-surface dark:bg-[#0B0F17] border-l border-border-soft dark:border-[#1E293B] flex flex-col h-full font-sans select-none overflow-hidden animate-in slide-in-from-right duration-200">
      
      {/* Top Header */}
      <div className="p-3.5 border-b border-border-soft dark:border-[#1E293B] bg-surface-2 dark:bg-[#0E1422] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span className="text-[10px] font-mono font-bold text-accent dark:text-[#38BDF8] uppercase tracking-wider">
            ENTITY DOSSIER DETAILS
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono font-bold text-text-dim dark:text-[#64748B] px-2 py-0.5 rounded bg-surface dark:bg-[#070A0F] border border-border-soft dark:border-[#1E293B]">
            ID: {node.id}
          </span>
          <button onClick={onClose} className="p-1 rounded hover:bg-surface-hover text-text-dim hover:text-text transition-colors">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
        {/* Profile Card */}
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0 shadow-sm">
            {node.type === 'PERSON' && <User size={22} />}
            {node.type === 'PHONE' && <Phone size={22} />}
            {node.type === 'VEHICLE' && <Car size={22} />}
            {node.type === 'LOCATION' && <MapPin size={22} />}
            {node.type === 'CASE' && <ShieldAlert size={22} />}
            {['FINANCIAL', 'BANK_ACCOUNT', 'UPI'].includes(node.type) && <Building2 size={22} />}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-text dark:text-[#F8FAFC] tracking-tight truncate uppercase">
              {node.label}
            </h3>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <TypeBadge type={node.type} />
              {node.isCrossStation && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-warning/10 border border-warning/30 text-warning uppercase">
                  Cross-Station
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Structured Metadata Field List */}
        <div className="space-y-2 border-t border-b border-border-soft dark:border-[#1E293B] py-3 text-[11px]">
          {node.stationId && (
            <div className="flex justify-between items-center py-0.5">
              <span className="text-text-dim dark:text-[#64748B] uppercase">Station Code</span>
              <span className="text-text dark:text-[#E2E8F0] font-semibold">{node.stationId}</span>
            </div>
          )}

          <div className="flex justify-between items-center py-0.5">
            <span className="text-text-dim dark:text-[#64748B] uppercase">Connected Links</span>
            <span className="text-accent dark:text-[#38BDF8] font-bold">{edges.length} Graph Relationships</span>
          </div>

          <div className="flex justify-between items-center py-0.5">
            <span className="text-text-dim dark:text-[#64748B] uppercase">Linked Cases</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">
              {connectedNodes.filter(n => n.type === 'CASE').length || 1} Active Dockets
            </span>
          </div>

          <div className="flex justify-between items-center py-0.5">
            <span className="text-text-dim dark:text-[#64748B] uppercase">Sublabel / Role</span>
            <span className="text-text-dim truncate max-w-[180px]">{node.sublabel || 'Active Surveillance'}</span>
          </div>
        </div>

        {/* Risk Score Gauge */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-text-dim dark:text-[#64748B] uppercase font-bold tracking-wider">
              CRIMINAL RISK SCORE
            </span>
            <span className="text-sm font-bold text-rose-500">{riskScore}%</span>
          </div>

          <div className="h-2 w-full bg-surface-2 dark:bg-[#1E293B] rounded-full overflow-hidden flex border border-border-soft dark:border-transparent">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-600 transition-all duration-500 rounded-full"
              style={{ width: `${riskScore}%` }}
            />
          </div>
          <div className="flex justify-between text-[8px] text-text-dim dark:text-[#64748B]">
            <span>0% (LOW)</span>
            <span>50% (MODERATE)</span>
            <span>100% (CRITICAL)</span>
          </div>
        </div>

        {/* Top Syndicate / Associate Connections */}
        {connectedNodes.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold text-text-dim dark:text-[#64748B] uppercase">
              <span>CONNECTED TOPOLOGY NODES</span>
              <span>TYPE</span>
            </div>

            <div className="space-y-1 text-[11px]">
              {connectedNodes.slice(0, 5).map((cn, idx) => (
                <div
                  key={cn.id}
                  className="flex items-center justify-between p-1.5 rounded bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B]/60 hover:border-accent/40 dark:hover:border-[#38BDF8]/40 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] text-text-dim dark:text-[#64748B] w-3">{idx + 1}</span>
                    <span className="font-bold text-text dark:text-[#E2E8F0] truncate max-w-[140px]">{cn.label}</span>
                  </div>
                  <span className="text-[9px] font-bold text-accent dark:text-[#38BDF8] uppercase px-1 rounded bg-accent/10 border border-accent/20">
                    {cn.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Intelligence Activities */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-bold text-text-dim dark:text-[#64748B] uppercase block">
            RECENT INTELLIGENCE ACTIVITIES
          </span>
          <div className="space-y-1.5 text-[10px]">
            <div className="flex items-start gap-2 text-text-dim dark:text-[#94A3B8]">
              <span className="text-accent dark:text-[#38BDF8] font-bold shrink-0">20:47</span>
              <span>Linked to case by Hybrid NLP Entity Resolver</span>
            </div>
            <div className="flex items-start gap-2 text-text-dim dark:text-[#94A3B8]">
              <span className="text-rose-500 dark:text-rose-400 font-bold shrink-0">20:31</span>
              <span>Anomaly detected: Cross-station vehicle correlation</span>
            </div>
            <div className="flex items-start gap-2 text-text-dim dark:text-[#94A3B8]">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">19:58</span>
              <span>Entity projected to Cloud Neo4j Aura Graph</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-border-soft dark:border-[#1E293B] bg-surface-2 dark:bg-[#0E1422] space-y-2">
        {node.type === 'CASE' && !isRestricted && (
          <button
            onClick={handleOpenCase}
            className="w-full py-2 rounded-lg bg-brand dark:bg-[#38BDF8] hover:bg-brand-bright dark:hover:bg-[#0284C7] text-bg dark:text-[#0B0F17] font-mono font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span>OPEN CASE WORKSPACE</span>
            <ArrowUpRight size={13} />
          </button>
        )}

        {node.type === 'CASE' && isRestricted && (
          <button
            onClick={handleRequestAccess}
            disabled={requestSubmitting}
            className="w-full py-2 rounded-lg bg-danger/20 text-danger-bright border border-danger/30 hover:bg-danger/30 text-xs font-mono font-bold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Lock size={13} />
            <span>{requestSubmitting ? 'SUBMITTING...' : 'REQUEST CROSS-STATION ACCESS'}</span>
          </button>
        )}

        {onExpandNode && (
          <button
            onClick={() => onExpandNode(node.id)}
            className="w-full py-1.5 rounded-lg bg-surface dark:bg-[#1E293B] border border-border-soft dark:border-transparent text-text dark:text-[#E2E8F0] font-mono font-bold text-xs hover:bg-surface-hover transition-colors"
          >
            EXPAND NEIGHBORHOOD
          </button>
        )}
      </div>

    </div>
  );
}
