import React, { useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  AlertTriangle, KeyRound, ShieldAlert, FolderKanban,
  ChevronRight, ArrowRight, ShieldCheck
} from 'lucide-react';
import { CaseRecord, AccessRequest, User, Station } from '../../mockServices/types';

interface StationAttentionQueueProps {
  cases: CaseRecord[];
  accessRequests: AccessRequest[];
  officers: User[];
  stations: Station[];
  onAssignCase?: (caseObj: CaseRecord) => void;
}

export function StationAttentionQueue({
  cases,
  accessRequests,
  officers,
  stations,
  onAssignCase,
}: StationAttentionQueueProps) {
  const navigate = useNavigate();

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

  // Aggregate genuine attention items with clean tactical formatting
  const attentionItems = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      subtitle: string;
      badgeText: string;
      time: string;
      icon: React.ComponentType<{ size?: number; className?: string }>;
      iconColor: string;
      onAction: () => void;
    }> = [];

    // 1. Pending Access Requests (Section 105 BNSS)
    accessRequests
      .filter((r) => r.status === 'PENDING')
      .forEach((req) => {
        const requestingStationName = stationMap.get(req.requestingStationId) || 'Khandagiri PS';
        const requestingOfficerName = officerMap.get(req.requestingOfficerId) || 'SI Ranjan Samal';

        items.push({
          id: `req-${req.id}`,
          title: `INTER-STATION AUTHORIZATION: ${req.targetCaseId}`,
          subtitle: `${requestingOfficerName} · ${requestingStationName}`,
          badgeText: 'SEC 105 BNSS',
          time: '20:31',
          icon: KeyRound,
          iconColor: 'text-amber-500',
          onAction: () => navigate('/requests'),
        });
      });

    // 2. Critical Priority Cases
    cases
      .filter((c) => c.priority === 'CRITICAL')
      .slice(0, 2)
      .forEach((c) => {
        const ioName = officerMap.get(c.investigatorId) || 'SI Ranjan Samal';
        items.push({
          id: `crit-${c.id}`,
          title: `CRITICAL WATCHLIST: ${c.firNumber || c.id}`,
          subtitle: `${c.crimeType?.replace(/_/g, ' ').toUpperCase()} · IO: ${ioName}`,
          badgeText: 'CRITICAL',
          time: '19:42',
          icon: ShieldAlert,
          iconColor: 'text-rose-500',
          onAction: () => navigate(`/cases/${c.id}`),
        });
      });

    // 3. Fallback alerts if empty
    if (items.length < 3) {
      items.push({
        id: 'alt-bulk-txn',
        title: 'BULK TRANSACTION / MULE CHAIN',
        subtitle: 'Rahul Verma → 5 Accounts Flagged',
        badgeText: 'AML ALERT',
        time: '18:57',
        icon: AlertTriangle,
        iconColor: 'text-rose-500',
        onAction: () => navigate('/money-trail'),
      });
      items.push({
        id: 'alt-contact-spike',
        title: 'SUDDEN CONTACT FREQUENCY SPIKE',
        subtitle: '+91 98765 43210 (14 Intercepts)',
        badgeText: 'CDR SPIKE',
        time: '18:20',
        icon: AlertTriangle,
        iconColor: 'text-amber-500',
        onAction: () => navigate('/cdr'),
      });
    }

    return items.slice(0, 3);
  }, [cases, accessRequests, stationMap, officerMap, navigate]);

  return (
    <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-4 flex flex-col justify-between shadow-xs dark:shadow-2xl font-sans select-none h-full">
      <div>
        {/* Clean Single-Line Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-border-soft dark:border-[#1E293B] mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-text dark:text-[#F8FAFC]">
              ANOMALY &amp; ATTENTION ALERTS
            </h3>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
              {attentionItems.length}
            </span>
          </div>

          <span className="text-[10px] font-mono text-text-dim dark:text-[#64748B]">
            HIGH PRIORITY
          </span>
        </div>

        {/* Structured Alert Rows matching reference layout */}
        <div className="space-y-2 font-mono">
          {attentionItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                onClick={item.onAction}
                className="p-2.5 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B]/60 hover:border-accent/40 dark:hover:border-[#38BDF8]/40 transition-colors cursor-pointer flex items-center justify-between gap-2.5 group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-surface dark:bg-[#070A0F] border border-border-soft dark:border-[#1E293B] flex items-center justify-center shrink-0">
                    <Icon size={13} className={item.iconColor} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-text dark:text-[#E2E8F0] group-hover:text-accent dark:group-hover:text-[#38BDF8] transition-colors truncate">
                        {item.title}
                      </span>
                    </div>
                    <p className="text-[10px] text-text-dim dark:text-[#94A3B8] truncate mt-0.5 font-sans">
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 text-right">
                  <span className="text-[10px] text-text-dim dark:text-[#64748B]">
                    {item.time}
                  </span>
                  <ChevronRight size={12} className="text-text-dim group-hover:text-text group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Link */}
      <div className="pt-3 border-t border-border-soft dark:border-[#1E293B] mt-3 flex items-center justify-between text-[10px] font-mono text-text-dim dark:text-[#64748B]">
        <span>PRIORITY TRIAGE QUEUE</span>
        <Link to="/requests" className="text-accent dark:text-[#38BDF8] hover:underline font-bold flex items-center gap-1">
          <span>View All Alerts</span>
          <ArrowRight size={11} />
        </Link>
      </div>
    </div>
  );
}
