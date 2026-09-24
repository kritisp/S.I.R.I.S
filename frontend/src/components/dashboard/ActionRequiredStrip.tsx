import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ChevronRight, Clock, UserX, AlertTriangle, Network } from 'lucide-react';

interface ActionRequiredStripProps {
  stats?: {
    overdueWork?: number;
    inactiveCases?: number;
    overloadedOfficers?: number;
    unresolvedMatches?: number;
  };
}

export function ActionRequiredStrip({ stats }: ActionRequiredStripProps) {
  const navigate = useNavigate();

  const overdueCount = stats?.overdueWork ?? 4;
  const inactiveCount = stats?.inactiveCases ?? 2;
  const overloadedCount = stats?.overloadedOfficers ?? 1;
  const unresolvedCount = stats?.unresolvedMatches ?? 3;

  const items = [
    {
      label: `${overdueCount} Critical / Overdue Dossiers`,
      icon: Clock,
      onClick: () => navigate('/cases'),
      color: 'text-rose-600',
    },
    {
      label: `${inactiveCount} Inactive Cases Pending Review`,
      icon: AlertCircle,
      onClick: () => navigate('/cases'),
      color: 'text-amber-600',
    },
    {
      label: `${overloadedCount} High-Caseload Officer Flagged`,
      icon: UserX,
      onClick: () => navigate('/performance'),
      color: 'text-orange-600',
    },
    {
      label: `${unresolvedCount} Unresolved Intelligence Matches`,
      icon: Network,
      onClick: () => navigate('/intelligence/alerts'),
      color: 'text-sky-600',
    },
  ];

  return (
    <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl px-4 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs font-sans text-xs">
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-amber-500/20 text-amber-600 border border-amber-500/30">
          <AlertTriangle size={13} strokeWidth={2.5} />
        </div>
        <span className="font-mono text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">
          STATION ACTION REQUIRED:
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={item.onClick}
              className="flex items-center gap-1.5 font-medium text-text-dim hover:text-text transition-colors group cursor-pointer"
            >
              <Icon size={13} className={item.color} />
              <span className="group-hover:underline underline-offset-2 font-mono text-[11px]">{item.label}</span>
              {idx < items.length - 1 && (
                <span className="hidden sm:inline text-border-soft ml-2">·</span>
              )}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => navigate('/intelligence/alerts')}
        className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-0.5 shrink-0 ml-auto sm:ml-0"
      >
        <span>REVIEW RADAR</span>
        <ChevronRight size={12} />
      </button>
    </div>
  );
}

