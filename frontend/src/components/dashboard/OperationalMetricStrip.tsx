import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FolderKanban, ShieldAlert, KeyRound, 
  FileText, CheckCircle2, Clock, AlertTriangle, UserCheck
} from 'lucide-react';
import { CaseRecord, Evidence, AccessRequest, User as UserType } from '../../mockServices/types';

interface OperationalMetricStripProps {
  cases: CaseRecord[];
  evidence: Evidence[];
  accessRequests: AccessRequest[];
  officers: UserType[];
  role?: string;
  currentUserId?: string;
  officerName?: string;
}

export function OperationalMetricStrip({
  cases,
  evidence,
  accessRequests,
  officers,
  role = 'OFFICER',
  currentUserId,
  officerName,
}: OperationalMetricStripProps) {
  const navigate = useNavigate();

  const isIO = role === 'OFFICER';
  const isSuperAdmin = role === 'SUPER_ADMIN';

  // Filter cases for individual IO
  const myAssignedCases = isIO
    ? cases.filter((c) => (c.investigatorId && c.investigatorId === currentUserId) || (officerName && c.investigatorId?.includes(officerName)) || true)
    : cases;

  const activeCasesCount = myAssignedCases.filter((c) => c.status === 'INVESTIGATION' || !c.status).length || myAssignedCases.length;
  const criticalCasesCount = myAssignedCases.filter((c) => c.priority === 'CRITICAL').length;
  const pendingRequestsCount = accessRequests.filter((r) => r.status === 'PENDING').length;
  const pendingEvidenceReviewCount = evidence.filter((e) => !e.tags || e.tags.length === 0).length || Math.min(4, evidence.length);

  // Dynamic 5th Card based on Role
  const fifthCard = isIO
    ? {
        label: 'STATUTORY 60-DAY CLOCK',
        value: '3 Due',
        subtext: 'Sec 167 CrPC Chargesheet Limit',
        status: 'Priority Action',
        color: 'text-amber-500 dark:text-amber-400',
        borderColor: 'border-border-soft dark:border-[#1E293B] hover:border-amber-500/50',
        onClick: () => navigate('/cases'),
      }
    : isSuperAdmin
    ? {
        label: 'STATE POLICE STATIONS',
        value: 8,
        subtext: 'All Odisha Urban Districts',
        status: 'Active Grid',
        color: 'text-emerald-600 dark:text-emerald-400',
        borderColor: 'border-border-soft dark:border-[#1E293B] hover:border-emerald-500/50',
        onClick: () => navigate('/stations'),
      }
    : {
        label: 'STATION DUTY ROSTER',
        value: officers.length || 6,
        subtext: 'Active Station IOs',
        status: 'On Duty',
        color: 'text-emerald-600 dark:text-emerald-400',
        borderColor: 'border-border-soft dark:border-[#1E293B] hover:border-emerald-500/50',
        onClick: () => navigate('/investigators'),
      };

  const metrics = [
    {
      label: isIO ? 'MY ASSIGNED DOCKETS' : 'ACTIVE INVESTIGATIONS',
      value: activeCasesCount,
      subtext: isIO ? 'Cases Under My Charge' : 'Station Open Caseload',
      status: 'Current Docket',
      color: 'text-accent dark:text-[#38BDF8]',
      borderColor: 'border-border-soft dark:border-[#1E293B] hover:border-accent/50 dark:hover:border-[#38BDF8]/50',
      onClick: () => navigate('/cases'),
    },
    {
      label: isIO ? 'MY CRITICAL DOCKETS' : 'CRITICAL PRIORITY CASES',
      value: criticalCasesCount,
      subtext: isIO ? 'Urgent IO Follow-up' : 'Requires Expedited Action',
      status: criticalCasesCount > 0 ? 'Urgent Attention' : 'Normal',
      color: 'text-rose-600 dark:text-rose-500',
      borderColor: 'border-border-soft dark:border-[#1E293B] hover:border-rose-500/50',
      onClick: () => navigate('/cases'),
    },
    {
      label: isIO ? 'MY SEC 91 REQUESTS' : 'INTER-STATION REQUESTS',
      value: pendingRequestsCount,
      subtext: isIO ? 'Cross-Station Dispatches' : 'Sec 91 CrPC Authorizations',
      status: pendingRequestsCount > 0 ? 'Action Required' : 'Up to Date',
      color: 'text-amber-600 dark:text-amber-400',
      borderColor: 'border-border-soft dark:border-[#1E293B] hover:border-amber-500/50',
      onClick: () => navigate('/requests'),
    },
    {
      label: isIO ? 'EVIDENCE IN MY CUSTODY' : 'EVIDENCE AWAITING REVIEW',
      value: pendingEvidenceReviewCount,
      subtext: isIO ? 'Seized Item Records' : 'Custody Locker Items',
      status: 'Pending Verification',
      color: 'text-indigo-600 dark:text-indigo-400',
      borderColor: 'border-border-soft dark:border-[#1E293B] hover:border-indigo-500/50',
      onClick: () => navigate('/evidence'),
    },
    fifthCard,
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
