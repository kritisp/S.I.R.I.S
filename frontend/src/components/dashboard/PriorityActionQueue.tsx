import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, KeyRound, ShieldAlert, FolderKanban,
  FileCheck2, CreditCard, ChevronRight, CheckCircle2,
  Clock, ArrowUpRight, ShieldCheck, Sparkles, Filter
} from 'lucide-react';
import { CaseRecord, AccessRequest, User, Station } from '../../mockServices/types';

export type PriorityActionCategory = 'ALL' | 'REQUESTS' | 'EXTRACTIONS' | 'CRITICAL' | 'FINANCIAL';

interface PriorityActionItem {
  id: string;
  category: 'REQUESTS' | 'EXTRACTIONS' | 'CRITICAL' | 'FINANCIAL';
  title: string;
  subtitle: string;
  badgeText: string;
  badgeColor: string;
  timestamp: string;
  urgency: 'URGENT' | 'HIGH' | 'MEDIUM';
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconColor: string;
  actionLabel: string;
  onAction: () => void;
}

interface PriorityActionQueueProps {
  cases: CaseRecord[];
  accessRequests: AccessRequest[];
  officers: User[];
  stations: Station[];
  onSelectCase?: (caseObj: CaseRecord) => void;
}

export function PriorityActionQueue({
  cases,
  accessRequests,
  officers,
  stations,
  onSelectCase,
}: PriorityActionQueueProps) {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<PriorityActionCategory>('ALL');

  const stationMap = useMemo(() => {
    const map = new Map<string, string>();
    stations.forEach((s) => map.set(s.id, s.name));
    return map;
  }, [stations]);

  const officerMap = useMemo(() => {
    const map = new Map<string, string>();
    officers.forEach((o) => map.set(o.id, o.name));
    return map;
  }, [officers]);

  const items = useMemo(() => {
    const list: PriorityActionItem[] = [];

    // 1. Pending Access Requests (Sec 105 BNSS)
    accessRequests
      .filter((r) => r.status === 'PENDING')
      .forEach((req) => {
        const fromStation = stationMap.get(req.requestingStationId) || 'Khandagiri PS';
        const fromOfficer = officerMap.get(req.requestingOfficerId) || 'SI Ranjan Samal';

        list.push({
          id: `req-${req.id}`,
          category: 'REQUESTS',
          title: `Inter-Station Authorization Request: Case ${req.targetCaseId}`,
          subtitle: `${fromOfficer} (${fromStation}) requested access for jurisdictional link review`,
          badgeText: 'SEC 105 BNSS',
          badgeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
          timestamp: '14m ago',
          urgency: 'URGENT',
          icon: KeyRound,
          iconColor: 'text-amber-500',
          actionLabel: 'Review Request',
          onAction: () => navigate('/requests'),
        });
      });

    // 2. Unverified Extractions (FIRs needing IO review & confirmation)
    cases
      .filter((c) => c.status === 'INVESTIGATION' || !c.status)
      .slice(0, 2)
      .forEach((c) => {
        list.push({
          id: `ext-${c.id}`,
          category: 'EXTRACTIONS',
          title: `Entity Review Pending Confirmation: ${c.firNumber || c.id}`,
          subtitle: `Extracted entities (names, phone numbers, vehicles) from FIR narrative require IO validation`,
          badgeText: 'EXTRACTION REVIEW',
          badgeColor: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
          timestamp: '32m ago',
          urgency: 'HIGH',
          icon: FileCheck2,
          iconColor: 'text-indigo-500',
          actionLabel: 'Verify Entities',
          onAction: () => {
            if (onSelectCase) onSelectCase(c);
            navigate(`/cases/${c.id}`);
          },
        });
      });

    // 3. Critical Priority Cases
    cases
      .filter((c) => c.priority === 'CRITICAL')
      .forEach((c) => {
        const io = officerMap.get(c.investigatorId) || 'SI Ranjan Samal';
        list.push({
          id: `crit-${c.id}`,
          category: 'CRITICAL',
          title: `Critical Watchlist Active: ${c.firNumber || c.id}`,
          subtitle: `${c.crimeType?.replace(/_/g, ' ')} · Assigned IO: ${io} · Statutory timeline active`,
          badgeText: 'CRITICAL PRIORITY',
          badgeColor: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
          timestamp: '1h ago',
          urgency: 'URGENT',
          icon: ShieldAlert,
          iconColor: 'text-rose-500',
          actionLabel: 'Open Case',
          onAction: () => {
            if (onSelectCase) onSelectCase(c);
            navigate(`/cases/${c.id}`);
          },
        });
      });

    // 4. Financial & Mule Account Alerts
    list.push({
      id: 'fin-mule-01',
      category: 'FINANCIAL',
      title: 'Rapid Account Transfer Pattern: Acc. ...8812',
      subtitle: 'Multiple rapid high-value transfers detected across beneficiary accounts in under 30 minutes',
      badgeText: 'FINANCIAL REVIEW',
      badgeColor: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
      timestamp: '2h ago',
      urgency: 'HIGH',
      icon: CreditCard,
      iconColor: 'text-rose-500',
      actionLabel: 'Trace Accounts',
      onAction: () => navigate('/money-trail'),
    });

    return list;
  }, [cases, accessRequests, stationMap, officerMap, navigate, onSelectCase]);

  const filteredItems = useMemo(() => {
    if (activeFilter === 'ALL') return items;
    return items.filter((item) => item.category === activeFilter);
  }, [items, activeFilter]);

  const filterCounts = useMemo(() => {
    return {
      ALL: items.length,
      REQUESTS: items.filter((i) => i.category === 'REQUESTS').length,
      EXTRACTIONS: items.filter((i) => i.category === 'EXTRACTIONS').length,
      CRITICAL: items.filter((i) => i.category === 'CRITICAL').length,
      FINANCIAL: items.filter((i) => i.category === 'FINANCIAL').length,
    };
  }, [items]);

  return (
    <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-4 flex flex-col justify-between shadow-xs dark:shadow-2xl font-sans select-none h-full transition-colors">
      <div>
        {/* Header with Title & Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border-soft dark:border-[#1E293B] mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <h2 className="text-xs sm:text-sm font-bold font-mono uppercase tracking-wider text-text dark:text-[#F8FAFC]">
              PRIORITY ACTION QUEUE
            </h2>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
              {items.length} PENDING ACTIONS
            </span>
          </div>

          <span className="text-[10px] font-mono text-text-dim dark:text-[#94A3B8]">
            STATION INVESTIGATOR WORK QUEUE
          </span>
        </div>

        {/* Filter Navigation Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none text-[11px] font-mono">
          {(
            [
              { key: 'ALL', label: 'ALL ACTIONS' },
              { key: 'REQUESTS', label: 'ACCESS REQUESTS' },
              { key: 'EXTRACTIONS', label: 'EXTRACTION REVIEWS' },
              { key: 'CRITICAL', label: 'CRITICAL CASES' },
              { key: 'FINANCIAL', label: 'FINANCIAL ALERTS' },
            ] as const
          ).map(({ key, label }) => {
            const count = filterCounts[key];
            const isActive = activeFilter === key;
            return (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={`px-2.5 py-1 rounded-lg border transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer font-bold ${
                  isActive
                    ? 'bg-accent/15 dark:bg-[#38BDF8]/15 border-accent dark:border-[#38BDF8] text-accent dark:text-[#38BDF8]'
                    : 'bg-surface-2 dark:bg-[#0E1422] border-border-soft dark:border-[#1E293B] text-text-dim dark:text-[#94A3B8] hover:text-text dark:hover:text-[#F8FAFC]'
                }`}
              >
                <span>{label}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? 'bg-accent/30 dark:bg-[#38BDF8]/30 text-accent dark:text-[#38BDF8]'
                      : 'bg-surface dark:bg-[#070A0F] text-text-dim dark:text-[#64748B]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Action Items List */}
        <div className="space-y-2.5">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-text-dim dark:text-[#64748B] border border-dashed border-border-soft dark:border-[#1E293B] rounded-lg">
              No pending actions. Your station work queue is clear.
            </div>
          ) : (
            filteredItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={item.onAction}
                  className="p-3 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B]/70 hover:border-accent/50 dark:hover:border-[#38BDF8]/50 transition-all cursor-pointer flex items-center justify-between gap-3 group shadow-2xs"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-surface dark:bg-[#070A0F] border border-border-soft dark:border-[#1E293B] flex items-center justify-center shrink-0 mt-0.5">
                      <Icon size={15} className={item.iconColor} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-xs font-bold text-text dark:text-[#F8FAFC] group-hover:text-accent dark:group-hover:text-[#38BDF8] transition-colors">
                          {item.title}
                        </span>
                        <span
                          className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${item.badgeColor}`}
                        >
                          {item.badgeText}
                        </span>
                        <span className="text-[10px] font-mono text-text-dim dark:text-[#64748B] flex items-center gap-1">
                          <Clock size={10} />
                          {item.timestamp}
                        </span>
                      </div>

                      <p className="text-[11px] text-text-dim dark:text-[#94A3B8] truncate">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        item.onAction();
                      }}
                      className="px-2.5 py-1 text-[11px] font-mono font-bold rounded bg-surface dark:bg-[#131B2E] border border-border-soft dark:border-[#1E293B] text-text dark:text-[#E2E8F0] hover:bg-accent/15 dark:hover:bg-[#38BDF8]/20 hover:text-accent dark:hover:text-[#38BDF8] hover:border-accent/40 dark:hover:border-[#38BDF8]/40 transition-all flex items-center gap-1"
                    >
                      <span>{item.actionLabel}</span>
                      <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer Summary Strip */}
      <div className="pt-3 mt-3 border-t border-border-soft dark:border-[#1E293B] flex items-center justify-between text-[11px] font-mono text-text-dim dark:text-[#94A3B8]">
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={13} className="text-emerald-500" />
          <span>Station Caseload &amp; Compliance Verified</span>
        </div>
        <span>High Priority Queue: {items.filter((i) => i.urgency === 'URGENT').length} Items</span>
      </div>
    </div>
  );
}
