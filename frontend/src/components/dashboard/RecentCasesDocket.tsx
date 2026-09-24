import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FolderKanban, Search, Filter, ArrowUpRight, ShieldAlert,
  Clock, CheckCircle2, User, ChevronRight, AlertCircle, FileText
} from 'lucide-react';
import { CaseRecord } from '../../mockServices/types';

interface RecentCasesDocketProps {
  cases: CaseRecord[];
  onSelectCase?: (caseObj: CaseRecord) => void;
}

export function RecentCasesDocket({ cases, onSelectCase }: RecentCasesDocketProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'INVESTIGATION' | 'CHARGESHEET' | 'CRITICAL'>('ALL');

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      // Status filter
      if (statusFilter === 'CRITICAL' && c.priority !== 'CRITICAL') return false;
      if (statusFilter === 'INVESTIGATION' && c.status === 'CHARGESHEETED') return false;
      if (statusFilter === 'CHARGESHEET' && c.status !== 'CHARGESHEETED') return false;

      // Text Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesFir = (c.firNumber || c.id).toLowerCase().includes(q);
        const matchesTitle = (c.title || '').toLowerCase().includes(q);
        const matchesType = (c.crimeType || '').toLowerCase().includes(q);
        const matchesDesc = (c.description || '').toLowerCase().includes(q);
        return matchesFir || matchesTitle || matchesType || matchesDesc;
      }
      return true;
    });
  }, [cases, statusFilter, search]);

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30';
      case 'HIGH':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'MEDIUM':
        return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30';
      default:
        return 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30';
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'CHARGESHEETED':
      case 'CHARGESHEET_FILED':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case 'CLOSED':
        return 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30';
      default:
        return 'bg-accent/15 text-accent dark:text-[#38BDF8] border-accent/30 dark:border-[#38BDF8]/30';
    }
  };

  return (
    <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-4 flex flex-col justify-between shadow-xs dark:shadow-2xl font-sans select-none h-full transition-colors">
      <div>
        {/* Header with Title and Search/Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-soft dark:border-[#1E293B] mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-accent/40 dark:border-[#38BDF8]/40 flex items-center justify-center text-accent dark:text-[#38BDF8]">
              <FolderKanban size={16} />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold font-mono uppercase tracking-wider text-text dark:text-[#F8FAFC]">
                STATION ACTIVE CASE DOCKET
              </h2>
              <span className="text-[10px] font-mono text-text-dim dark:text-[#94A3B8]">
                {cases.length} Total Registered Files · Real-Time Repository
              </span>
            </div>
          </div>

          {/* Quick Search */}
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-48">
              <input
                type="text"
                placeholder="Filter FIR / Section..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-7 pr-2.5 py-1 text-xs rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-text dark:text-[#F8FAFC] placeholder:text-text-dim dark:placeholder:text-[#64748B] focus:outline-none focus:border-accent dark:focus:border-[#38BDF8] font-mono"
              />
              <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-dim dark:text-[#64748B]" />
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2.5 font-mono text-[11px] scrollbar-none">
          {[
            { id: 'ALL', label: 'ALL CASES', count: cases.length },
            { id: 'INVESTIGATION', label: 'UNDER INVESTIGATION', count: cases.filter((c) => c.status !== 'CHARGESHEETED').length },
            { id: 'CRITICAL', label: 'CRITICAL PRIORITY', count: cases.filter((c) => c.priority === 'CRITICAL').length },
            { id: 'CHARGESHEET', label: 'CHARGESHEET FILED', count: cases.filter((c) => c.status === 'CHARGESHEETED').length },
          ].map(({ id, label, count }) => (
            <button
              key={id}
              onClick={() => setStatusFilter(id as any)}
              className={`px-2.5 py-1 rounded-lg border transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer font-bold ${
                statusFilter === id
                  ? 'bg-accent/15 dark:bg-[#38BDF8]/15 border-accent dark:border-[#38BDF8] text-accent dark:text-[#38BDF8]'
                  : 'bg-surface-2 dark:bg-[#0E1422] border-border-soft dark:border-[#1E293B] text-text-dim dark:text-[#94A3B8] hover:text-text'
              }`}
            >
              <span>{label}</span>
              <span className="text-[9px] px-1 py-0.2 rounded-full bg-surface dark:bg-[#070A0F] text-text-dim dark:text-[#64748B]">
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Table / List View */}
        <div className="space-y-2">
          {filteredCases.slice(0, 5).map((c) => (
            <div
              key={c.id}
              onClick={() => {
                if (onSelectCase) onSelectCase(c);
                navigate(`/cases/${c.id}`);
              }}
              className="p-3 rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B]/70 hover:border-accent/50 dark:hover:border-[#38BDF8]/50 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group shadow-2xs"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-mono text-xs font-bold text-accent dark:text-[#38BDF8] group-hover:underline">
                    {c.firNumber || c.id}
                  </span>
                  <span className={`font-mono text-[9px] font-bold px-1.5 py-0.2 rounded border ${getPriorityBadge(c.priority)}`}>
                    {c.priority || 'MEDIUM'}
                  </span>
                  <span className={`font-mono text-[9px] font-bold px-1.5 py-0.2 rounded border ${getStatusBadge(c.status)}`}>
                    {c.status || 'UNDER INVESTIGATION'}
                  </span>
                </div>

                <h3 className="text-xs font-semibold text-text dark:text-[#F8FAFC] truncate">
                  {c.title || c.description || 'Statutory Investigation Record'}
                </h3>

                <div className="flex items-center gap-3 text-[10px] font-mono text-text-dim dark:text-[#94A3B8] mt-1">
                  <span>Type: <strong className="text-text dark:text-[#E2E8F0]">{c.crimeType?.replace(/_/g, ' ') || 'GENERAL'}</strong></span>
                  <span>·</span>
                  <span>Date: {c.dateOfOccurrence || c.createdAt?.split('T')[0] || '2026-09-24'}</span>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/cases/${c.id}`);
                  }}
                  className="px-3 py-1.5 text-xs font-mono font-bold rounded-lg bg-surface dark:bg-[#131B2E] border border-border-soft dark:border-[#1E293B] text-text dark:text-[#E2E8F0] hover:bg-accent/15 dark:hover:bg-[#38BDF8]/20 hover:text-accent dark:hover:text-[#38BDF8] hover:border-accent/40 dark:hover:border-[#38BDF8]/40 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Workspace</span>
                  <ArrowUpRight size={13} />
                </button>
              </div>
            </div>
          ))}

          {filteredCases.length === 0 && (
            <div className="py-8 text-center text-xs font-mono text-text-dim dark:text-[#64748B] border border-dashed border-border-soft dark:border-[#1E293B] rounded-lg">
              No matching investigation cases found in docket.
            </div>
          )}
        </div>
      </div>

      {/* Footer Strip */}
      <div className="pt-3 mt-3 border-t border-border-soft dark:border-[#1E293B] flex items-center justify-between font-mono text-[11px] text-text-dim dark:text-[#94A3B8]">
        <span>Displaying Top Active Records</span>
        <Link
          to="/cases"
          className="text-accent dark:text-[#38BDF8] hover:underline flex items-center gap-1 font-bold"
        >
          <span>View All Cases Docket</span>
          <ChevronRight size={13} />
        </Link>
      </div>
    </div>
  );
}
