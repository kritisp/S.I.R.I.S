import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, Search, ShieldAlert, FolderKanban, Calendar,
  UserCheck, ArrowUpRight, AlertTriangle
} from 'lucide-react';
import { useMockState } from '../../mockServices/MockStateContext';
import { useLanguage } from '../../context/LanguageContext';
import { CaseRecord, User } from '../../mockServices/types';

interface ActiveInvestigationsTableProps {
  cases?: CaseRecord[];
  stationOfficers?: User[];
  onAssignCase?: (caseObj: CaseRecord) => void;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '21 Aug 2026';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function ActiveInvestigationsTable({
  cases: propCases,
  stationOfficers = [],
  onAssignCase,
}: ActiveInvestigationsTableProps) {
  const navigate = useNavigate();
  const { state } = useMockState();
  const { t } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CRITICAL' | 'INVESTIGATING' | 'PENDING' | 'SOLVED'>('ALL');

  const sourceCases = useMemo(() => {
    return propCases && propCases.length > 0 ? propCases : state.cases;
  }, [propCases, state.cases]);

  // Compute officer map for fast lookup
  const officerMap = useMemo(() => {
    const map = new Map<string, User>();
    state.users.forEach((u) => map.set(u.id, u));
    stationOfficers.forEach((u) => map.set(u.id, u));
    return map;
  }, [state.users, stationOfficers]);

  // Filter cases
  const filteredCases = useMemo(() => {
    return sourceCases.filter((c) => {
      // Status filter
      if (statusFilter === 'CRITICAL' && c.priority !== 'CRITICAL') return false;
      if (statusFilter === 'INVESTIGATING' && c.status !== 'INVESTIGATING') return false;
      if (statusFilter === 'PENDING' && c.status !== 'PENDING') return false;
      if (statusFilter === 'SOLVED' && c.status !== 'SOLVED' && c.status !== 'CLOSED') return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const firMatch = (c.firNumber || '').toLowerCase().includes(q);
        const titleMatch = (c.title || '').toLowerCase().includes(q);
        const crimeMatch = (c.crimeType || '').toLowerCase().includes(q);
        const officerName = officerMap.get(c.investigatorId)?.name?.toLowerCase() || '';
        const officerMatch = officerName.includes(q);
        const idMatch = (c.id || '').toLowerCase().includes(q);
        return firMatch || titleMatch || crimeMatch || officerMatch || idMatch;
      }
      return true;
    });
  }, [sourceCases, statusFilter, searchQuery, officerMap]);

  return (
    <div className="bg-surface border border-border-soft rounded-xl p-4 shadow-xs flex flex-col justify-between font-sans">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-soft">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-brand/10 border border-brand/20 flex items-center justify-center text-brand shrink-0">
            <FolderKanban size={14} />
          </div>
          <div>
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-text flex items-center gap-2">
              <span>Station Investigation Docket</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-2 border border-border-soft text-text-dim">
                {filteredCases.length} Active Dossiers
              </span>
            </h3>
            <p className="text-[11px] text-text-dim">
              Verified CCTNS First Information Reports under station jurisdiction
            </p>
          </div>
        </div>

        {/* Search Input & Action */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-dim" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search FIR, IO, or Crime..."
              className="pl-7 pr-2.5 py-1 rounded-lg bg-surface-2 border border-border-soft text-xs text-text placeholder:text-text-dim outline-none focus:border-brand w-44 sm:w-52 font-mono transition-all"
            />
          </div>

          <button
            onClick={() => navigate('/cases')}
            className="px-2.5 py-1 rounded-lg bg-surface-2 hover:bg-surface-hover text-text border border-border-soft text-xs font-mono font-bold transition-all flex items-center gap-1 shrink-0"
          >
            <span>Full Registry</span>
            <ArrowUpRight size={12} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 pt-2.5 pb-1 overflow-x-auto text-[10px] font-mono scrollbar-none">
        {(
          [
            { id: 'ALL', label: 'All Station Cases' },
            { id: 'CRITICAL', label: 'Critical Watchlist' },
            { id: 'INVESTIGATING', label: 'Under Investigation' },
            { id: 'PENDING', label: 'Pending Review' },
            { id: 'SOLVED', label: 'Solved / Chargesheeted' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === tab.id
                ? 'bg-surface-2 text-text font-bold border border-border-soft shadow-2xs'
                : 'text-text-dim hover:text-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto mt-1.5">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border-soft text-[10px] uppercase font-mono tracking-wider text-text-dim bg-surface-2/40">
              <th className="py-2 px-2.5 font-bold">FIR Record</th>
              <th className="py-2 px-2.5 font-bold">Offence Classification</th>
              <th className="py-2 px-2.5 font-bold">Investigating Officer</th>
              <th className="py-2 px-2 font-bold text-center">Priority</th>
              <th className="py-2 px-2.5 font-bold text-center">Date Filed</th>
              <th className="py-2 px-2.5 font-bold text-center">Status</th>
              <th className="py-2 px-2.5 font-bold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-soft/60">
            {filteredCases.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-xs font-mono text-text-dim">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <AlertTriangle size={16} className="text-amber-500" />
                    <p>No investigation records matched the selected filter.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredCases.slice(0, 6).map((item) => {
                const io = officerMap.get(item.investigatorId);

                return (
                  <tr
                    key={item.id}
                    onClick={() => navigate(`/cases/${item.id}`)}
                    className="hover:bg-surface-hover/70 cursor-pointer transition-colors group"
                  >
                    {/* FIR ID */}
                    <td className="py-2.5 px-2.5 font-mono">
                      <span className="font-bold text-text group-hover:text-brand transition-colors text-xs">
                        {item.firNumber || item.id}
                      </span>
                    </td>

                    {/* Offence & Title */}
                    <td className="py-2.5 px-2.5 max-w-[180px]">
                      <p className="font-semibold text-text truncate text-xs">
                        {item.title || item.crimeType}
                      </p>
                      <p className="text-[10px] text-text-dim capitalize truncate font-mono">
                        {item.crimeType?.replace(/_/g, ' ')}
                      </p>
                    </td>

                    {/* IO */}
                    <td className="py-2.5 px-2.5 max-w-[140px]">
                      <p className="font-medium text-text text-xs truncate">
                        {io?.name || 'SI Ranjan Samal'}
                      </p>
                      <p className="text-[10px] text-text-dim font-mono truncate">
                        {io?.rank || 'Sub-Inspector'}
                      </p>
                    </td>

                    {/* Priority Badge */}
                    <td className="py-2.5 px-2 text-center">
                      <span
                        className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
                          item.priority === 'CRITICAL'
                            ? 'text-rose-600 bg-rose-500/10 border-rose-500/30'
                            : item.priority === 'HIGH'
                            ? 'text-amber-600 bg-amber-500/10 border-amber-500/30'
                            : item.priority === 'MEDIUM'
                            ? 'text-sky-600 bg-sky-500/10 border-sky-500/30'
                            : 'text-slate-500 bg-slate-500/10 border-slate-500/30'
                        }`}
                      >
                        {item.priority === 'CRITICAL' && <ShieldAlert size={9} />}
                        {item.priority}
                      </span>
                    </td>

                    {/* Date Filed */}
                    <td className="py-2.5 px-2.5 text-center font-mono text-[11px] text-text-dim">
                      <div className="flex items-center justify-center gap-1">
                        <Calendar size={11} className="text-text-dim" />
                        <span>{formatDate(item.createdAt)}</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-2.5 px-2.5 text-center">
                      <span
                        className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                          item.status === 'SOLVED' || item.status === 'CLOSED'
                            ? 'text-emerald-600 bg-emerald-500/10 border border-emerald-500/25'
                            : item.status === 'PENDING'
                            ? 'text-amber-600 bg-amber-500/10 border border-amber-500/25'
                            : 'text-brand bg-brand/10 border border-brand/25'
                        }`}
                      >
                        {item.status?.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {onAssignCase && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAssignCase(item);
                            }}
                            title="Reassign IO"
                            className="p-1 rounded-md bg-surface-2 hover:bg-brand/10 hover:text-brand text-text-dim border border-border-soft transition-colors"
                          >
                            <UserCheck size={11} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/cases/${item.id}`);
                          }}
                          className="px-2 py-1 rounded-md bg-surface-2 hover:bg-brand hover:text-bg text-text text-[10px] font-mono font-bold transition-all border border-border-soft flex items-center gap-0.5"
                        >
                          <span>Workspace</span>
                          <ChevronRight size={10} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer info */}
      <div className="pt-2.5 mt-1 border-t border-border-soft flex items-center justify-between text-[10px] text-text-dim font-mono">
        <span>
          Displaying <strong>{Math.min(filteredCases.length, 6)}</strong> of{' '}
          <strong>{sourceCases.length}</strong> station records
        </span>

        <button
          onClick={() => navigate('/cases')}
          className="text-brand hover:underline font-bold flex items-center gap-1"
        >
          <span>Open Full FIR Registry</span>
          <ChevronRight size={11} />
        </button>
      </div>
    </div>
  );
}

