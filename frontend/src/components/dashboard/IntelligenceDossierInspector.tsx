import React from 'react';
import { 
  User, ShieldAlert, Phone, Car, Building2, 
  ExternalLink, ChevronRight, Activity, Clock, 
  ShieldCheck, AlertTriangle, GitBranch, ArrowUpRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GraphEntityNode } from './InvestigatorNetworkWorkspace';
import { CaseRecord } from '../../mockServices/types';

interface IntelligenceDossierInspectorProps {
  entity: GraphEntityNode | CaseRecord | null;
  onOpenWorkspace?: () => void;
}

export function IntelligenceDossierInspector({
  entity,
  onOpenWorkspace,
}: IntelligenceDossierInspectorProps) {
  const navigate = useNavigate();

  if (!entity) {
    return (
      <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-6 h-full flex flex-col items-center justify-center text-center font-mono text-xs text-text-dim dark:text-[#64748B]">
        <ShieldAlert size={36} className="text-text-dim/40 dark:text-[#334155] mb-2" />
        <span className="text-text dark:text-[#94A3B8] font-bold">NO ENTITY SELECTED</span>
        <p className="text-[10px] mt-1 text-text-dim dark:text-[#475569]">
          Click any suspect, vehicle, or FIR in the network to inspect its intelligence dossier.
        </p>
      </div>
    );
  }

  // Check if it's a CaseRecord or GraphEntityNode
  const isCase = 'firNumber' in entity;
  const name = isCase ? (entity as CaseRecord).firNumber || entity.id : (entity as GraphEntityNode).name;
  const role = isCase
    ? (entity as CaseRecord).crimeType?.replace(/_/g, ' ').toUpperCase()
    : (entity as GraphEntityNode).role || (entity as GraphEntityNode).type;
  const riskScore = isCase
    ? (entity as CaseRecord).priority === 'CRITICAL'
      ? 94
      : (entity as CaseRecord).priority === 'HIGH'
      ? 78
      : 55
    : (entity as GraphEntityNode).riskScore || 75;
  const phone = isCase ? '+91 98610 12345' : (entity as GraphEntityNode).phone || '+91 98765 43210';
  const aliases = isCase ? ['Case Docket OD-2026'] : (entity as GraphEntityNode).aliases || ['R.V.', 'Rahul Bhai'];
  const casesLinked = isCase ? 1 : (entity as GraphEntityNode).casesLinked || 17;

  return (
    <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl h-full flex flex-col justify-between overflow-hidden shadow-xs dark:shadow-2xl font-sans select-none">
      {/* Top Header */}
      <div className="p-3 border-b border-border-soft dark:border-[#1E293B] bg-surface-2 dark:bg-[#0E1422] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span className="text-[10px] font-mono font-bold text-accent dark:text-[#38BDF8] uppercase tracking-wider">
            ENTITY DOSSIER DETAILS
          </span>
        </div>
        <span className="text-[9px] font-mono font-bold text-text-dim dark:text-[#64748B] px-2 py-0.5 rounded bg-surface dark:bg-[#070A0F] border border-border-soft dark:border-[#1E293B]">
          ID: {entity.id}
        </span>
      </div>

      <div className="p-4 space-y-4 flex-1 overflow-y-auto font-mono text-xs">
        {/* Entity Title & High-Value Badge */}
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/40 flex items-center justify-center text-rose-500 dark:text-rose-400 shrink-0 shadow-sm">
            {isCase ? <ShieldAlert size={22} /> : <User size={22} />}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-text dark:text-[#F8FAFC] tracking-tight truncate uppercase">
              {name}
            </h3>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 uppercase">
                {role}
              </span>
              <span className="text-[9px] text-text-dim dark:text-[#64748B]">Active Surveillance</span>
            </div>
          </div>
        </div>

        {/* Structured Metadata Field List */}
        <div className="space-y-2 border-t border-b border-border-soft dark:border-[#1E293B] py-3 text-[11px]">
          <div className="flex justify-between items-center py-0.5">
            <span className="text-text-dim dark:text-[#64748B] uppercase">Aliases</span>
            <span className="text-text dark:text-[#E2E8F0] font-semibold">{aliases.join(', ')}</span>
          </div>

          <div className="flex justify-between items-center py-0.5">
            <span className="text-text-dim dark:text-[#64748B] uppercase">Known Phone</span>
            <span className="text-accent dark:text-[#38BDF8] font-bold">{phone}</span>
          </div>

          <div className="flex justify-between items-center py-0.5">
            <span className="text-text-dim dark:text-[#64748B] uppercase">Associations</span>
            <span className="text-text dark:text-[#E2E8F0]">12 People, 3 Orgs, 4 Vehicles</span>
          </div>

          <div className="flex justify-between items-center py-0.5">
            <span className="text-text-dim dark:text-[#64748B] uppercase">Cases Linked</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">{casesLinked} Active FIRs</span>
          </div>

          <div className="flex justify-between items-center py-0.5">
            <span className="text-text-dim dark:text-[#64748B] uppercase">First Seen</span>
            <span className="text-text-dim dark:text-[#94A3B8]">12 Jan 2026 · Khandagiri</span>
          </div>

          <div className="flex justify-between items-center py-0.5">
            <span className="text-text-dim dark:text-[#64748B] uppercase">Last Seen</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">24 Sep 2026 · CCTNS-II</span>
          </div>
        </div>

        {/* Priority / Risk Score Gauge */}
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

        {/* Top Syndicate Connections (Ranked Table) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold text-text-dim dark:text-[#64748B] uppercase">
            <span>TOP ASSOCIATE CONNECTIONS</span>
            <span>PAGERANK</span>
          </div>

          <div className="space-y-1 text-[11px]">
            {[
              { id: 1, name: 'VIKAS @ VICKY', score: '0.72', color: 'text-emerald-600 dark:text-emerald-400' },
              { id: 2, name: 'SONU BHAI', score: '0.68', color: 'text-emerald-600 dark:text-emerald-400' },
              { id: 3, name: 'PAWAN K.', score: '0.61', color: 'text-amber-600 dark:text-amber-400' },
              { id: 4, name: 'AJAY SINGH', score: '0.55', color: 'text-amber-600 dark:text-amber-400' },
              { id: 5, name: '+91 98765 43219', score: '0.49', color: 'text-sky-600 dark:text-sky-400' },
            ].map((conn) => (
              <div
                key={conn.id}
                className="flex items-center justify-between p-1.5 rounded bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B]/60 hover:border-accent/40 dark:hover:border-[#38BDF8]/40 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-text-dim dark:text-[#64748B] w-3">{conn.id}</span>
                  <span className="font-bold text-text dark:text-[#E2E8F0]">{conn.name}</span>
                </div>
                <span className={`text-[10px] font-bold ${conn.color}`}>{conn.score}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Timeline Activities */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-bold text-text-dim dark:text-[#64748B] uppercase block">
            RECENT INTELLIGENCE ACTIVITIES
          </span>
          <div className="space-y-1.5 text-[10px]">
            <div className="flex items-start gap-2 text-text-dim dark:text-[#94A3B8]">
              <span className="text-accent dark:text-[#38BDF8] font-bold shrink-0">20:47</span>
              <span>Linked to case FIR_2026_118 via Incident Extraction</span>
            </div>
            <div className="flex items-start gap-2 text-text-dim dark:text-[#94A3B8]">
              <span className="text-rose-500 dark:text-rose-400 font-bold shrink-0">20:31</span>
              <span>Anomaly detected: Bulk UPI transactions to mule account</span>
            </div>
            <div className="flex items-start gap-2 text-text-dim dark:text-[#94A3B8]">
              <span className="text-accent dark:text-[#38BDF8] font-bold shrink-0">20:15</span>
              <span>New CDR cellular records linked to investigation dossier</span>
            </div>
            <div className="flex items-start gap-2 text-text-dim dark:text-[#94A3B8]">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">19:58</span>
              <span>Identity resolved: R.V. ↔ Rahul Verma via Alias Matcher</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="p-3 border-t border-border-soft dark:border-[#1E293B] bg-surface-2 dark:bg-[#0E1422]">
        <button
          onClick={() => {
            if (isCase) {
              navigate(`/cases/${entity.id}`);
            } else {
              navigate('/network');
            }
          }}
          className="w-full py-2 rounded-lg bg-brand dark:bg-[#38BDF8] hover:bg-brand-bright dark:hover:bg-[#0284C7] text-bg dark:text-[#0B0F17] font-mono font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
        >
          <span>OPEN INVESTIGATION WORKSPACE</span>
          <ArrowUpRight size={13} />
        </button>
      </div>
    </div>
  );
}
