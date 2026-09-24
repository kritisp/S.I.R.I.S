import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FolderKanban, ShieldAlert, KeyRound, 
  FileText, CheckCircle2, Clock, AlertTriangle 
} from 'lucide-react';
import { CaseRecord, Evidence, AccessRequest, User as UserType } from '../../mockServices/types';

interface OperationalMetricStripProps {
  cases: CaseRecord[];
  evidence: Evidence[];
  accessRequests: AccessRequest[];
  officers: UserType[];
}

export function OperationalMetricStrip({
  cases,
  evidence,
  accessRequests,
  officers,
}: OperationalMetricStripProps) {
  const navigate = useNavigate();

  const activeCasesCount = cases.filter((c) => c.status === 'INVESTIGATION' || !c.status).length || cases.length;
  const criticalCasesCount = cases.filter((c) => c.priority === 'CRITICAL').length;
  const pendingRequestsCount = accessRequests.filter((r) => r.status === 'PENDING').length;
  const pendingEvidenceReviewCount = evidence.filter((e) => !e.tags || e.tags.length === 0).length || Math.min(4, evidence.length);

  const metrics = [
    {
      label: 'ACTIVE INVESTIGATIONS',
      value: activeCasesCount,
      subtext: 'Station Open Caseload',
      status: 'Current Caseload',
      color: 'text-accent dark:text-[#38BDF8]',
      borderColor: 'border-border-soft dark:border-[#1E293B] hover:border-accent/50 dark:hover:border-[#38BDF8]/50',
      onClick: () => navigate('/cases'),
    },
    {
      label: 'CRITICAL PRIORITY CASES',
      value: criticalCasesCount,
      subtext: 'Requires Expedited Action',
      status: criticalCasesCount > 0 ? 'Urgent Attention' : 'Normal',
      color: 'text-rose-600 dark:text-rose-500',
      borderColor: 'border-border-soft dark:border-[#1E293B] hover:border-rose-500/50',
      onClick: () => navigate('/cases'),
    },
    {
      label: 'INTER-STATION REQUESTS',
      value: pendingRequestsCount,
      subtext: 'Sec 105 BNSS Authorizations',
      status: pendingRequestsCount > 0 ? 'Action Required' : 'Up to Date',
      color: 'text-amber-600 dark:text-amber-400',
      borderColor: 'border-border-soft dark:border-[#1E293B] hover:border-amber-500/50',
      onClick: () => navigate('/requests'),
    },
    {
      label: 'EVIDENCE AWAITING REVIEW',
      value: pendingEvidenceReviewCount,
      subtext: 'Custody Locker Items',
      status: 'Pending Verification',
      color: 'text-indigo-600 dark:text-indigo-400',
      borderColor: 'border-border-soft dark:border-[#1E293B] hover:border-indigo-500/50',
      onClick: () => navigate('/evidence'),
    },
    {
      label: 'ASSIGNED OFFICERS',
      value: officers.length || 6,
      subtext: 'Active Investigating Officers',
      status: 'Duty Roster',
      color: 'text-emerald-600 dark:text-emerald-400',
      borderColor: 'border-border-soft dark:border-[#1E293B] hover:border-emerald-500/50',
      onClick: () => navigate('/investigators'),
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 font-mono select-none">
      {metrics.map((m, idx) => (
        <div
          key={idx}
          onClick={m.onClick}
          className={`bg-surface dark:bg-[#0B0F17] border ${m.borderColor} rounded-xl p-3.5 shadow-xs dark:shadow-xl transition-all flex flex-col justify-between cursor-pointer group`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-text-dim dark:text-[#64748B] uppercase tracking-wider group-hover:text-text dark:group-hover:text-[#F8FAFC] transition-colors">
              {m.label}
            </span>
          </div>

          <div className="my-1.5">
            <span className={`text-2xl sm:text-3xl font-bold tracking-tight ${m.color}`}>
              {m.value}
            </span>
          </div>

          <div className="flex items-center justify-between text-[10px]">
            <span className="text-text-dim dark:text-[#94A3B8] font-sans truncate">{m.subtext}</span>
            <span className="text-accent dark:text-[#38BDF8] font-bold text-[9px] shrink-0 ml-1">{m.status}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
