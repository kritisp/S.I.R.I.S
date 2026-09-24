import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, ShieldAlert, KeyRound, Database, Users, ChevronRight } from 'lucide-react';
import { CaseRecord, AccessRequest, Evidence, User } from '../../mockServices/types';

interface OperationalSummaryRibbonProps {
  cases: CaseRecord[];
  accessRequests: AccessRequest[];
  evidence: Evidence[];
  officers: User[];
  stationName: string;
}

export function OperationalSummaryRibbon({
  cases,
  accessRequests,
  evidence,
  officers,
  stationName,
}: OperationalSummaryRibbonProps) {
  const navigate = useNavigate();

  const totalCases = cases.length;
  const criticalCases = cases.filter((c) => c.priority === 'CRITICAL' || c.priority === 'HIGH').length;
  const investigatingCases = cases.filter((c) => c.status === 'INVESTIGATING').length;
  const pendingReviewCases = cases.filter((c) => c.status === 'PENDING').length;
  const solvedCases = cases.filter((c) => c.status === 'SOLVED' || c.status === 'CLOSED').length;

  const pendingRequests = accessRequests.filter((r) => r.status === 'PENDING').length;
  const approvedRequests = accessRequests.filter((r) => r.status === 'APPROVED').length;

  const activeOfficers = officers.filter((o) => o.status === 'ACTIVE').length;

  const summarySegments = [
    {
      id: 'cases',
      label: 'Station Caseload',
      primaryCount: totalCases,
      unit: 'FIRs',
      detail: `${investigatingCases} Active · ${pendingReviewCases} Pending · ${solvedCases} Solved`,
      icon: FolderKanban,
      iconColor: 'text-brand',
      borderColor: 'border-l-brand',
      onClick: () => navigate('/cases'),
    },
    {
      id: 'watchlist',
      label: 'Priority Watchlist',
      primaryCount: criticalCases,
      unit: 'Cases',
      detail: 'Critical & High Priority Dossiers',
      icon: ShieldAlert,
      iconColor: 'text-rose-600 dark:text-rose-400',
      borderColor: 'border-l-rose-500',
      onClick: () => navigate('/cases'),
    },
    {
      id: 'requests',
      label: 'Inter-Station Access',
      primaryCount: pendingRequests,
      unit: 'Pending',
      detail: `${approvedRequests} Authorized under Sec 105 BNSS`,
      icon: KeyRound,
      iconColor: 'text-amber-600 dark:text-amber-400',
      borderColor: 'border-l-amber-500',
      onClick: () => navigate('/requests'),
    },
    {
      id: 'evidence',
      label: 'Custody Evidence Vault',
      primaryCount: evidence.length,
      unit: 'Assets',
      detail: 'SHA-256 Chain of Custody Verified',
      icon: Database,
      iconColor: 'text-sky-600 dark:text-sky-400',
      borderColor: 'border-l-sky-500',
      onClick: () => navigate('/evidence'),
    },
    {
      id: 'officers',
      label: 'Station Strength',
      primaryCount: activeOfficers,
      unit: 'Officers',
      detail: `Assigned to ${stationName}`,
      icon: Users,
      iconColor: 'text-slate-600 dark:text-slate-300',
      borderColor: 'border-l-slate-400',
      onClick: () => navigate('/performance'),
    },
  ];

  return (
    <div className="bg-surface border border-border-soft rounded-xl shadow-xs overflow-hidden">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-border-soft">
        {summarySegments.map((seg) => {
          const Icon = seg.icon;
          return (
            <button
              key={seg.id}
              onClick={seg.onClick}
              className={`p-3.5 sm:p-4 text-left hover:bg-surface-hover transition-colors flex flex-col justify-between group cursor-pointer border-l-3 ${seg.borderColor}`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-dim truncate">
                  {seg.label}
                </span>
                <Icon size={14} className={`${seg.iconColor} shrink-0`} />
              </div>

              <div className="flex items-baseline gap-1.5 my-0.5">
                <span className="text-2xl font-bold font-mono text-text tracking-tight">
                  {seg.primaryCount}
                </span>
                <span className="text-xs font-mono font-semibold text-text-dim">
                  {seg.unit}
                </span>
              </div>

              <div className="flex items-center justify-between gap-1 mt-1 text-[11px] text-text-dim">
                <span className="truncate font-sans">{seg.detail}</span>
                <ChevronRight size={12} className="text-text-dim opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
