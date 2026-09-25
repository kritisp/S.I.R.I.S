import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FolderKanban, Search, Filter, FileText, ChevronRight, AlertTriangle, 
  ShieldCheck, Clock, CheckCircle2, ArrowUpRight, Activity, Plus,
  Layers, UserCheck, Calendar, Shield, Sparkles, Scale, RefreshCw
} from 'lucide-react';
import { useMockState } from '../mockServices/MockStateContext';
import { useLanguage } from '../context/LanguageContext';
import { CaseRecord } from '../mockServices/types';
import { graphIntelligenceService } from '../services/graphIntelligenceService';

export function Cases() {
  const { state, refreshBackendData } = useMockState();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'CRITICAL' | 'HIGH' | 'CHARGESHEETED' | 'PENDING'>('ALL');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedCrimeType, setSelectedCrimeType] = useState('ALL');
  const [dbCases, setDbCases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  const currentUser = state.currentUser;
  const officerName = currentUser?.name || 'SI Ranjan Samal';
  const officerRank = currentUser?.rank || 'Sub-Inspector of Police';
  const stationId = currentUser?.stationId || 'OP-BBSR-CAP';

  useEffect(() => {
    setIsLoading(true);
    graphIntelligenceService.getWorkspaceCases(1500, 0)
      .then((res) => {
        if (res && res.cases) {
          setDbCases(res.cases);
        }
      })
      .catch((err) => console.warn('Workspace cases fetch notice:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (refreshBackendData) await refreshBackendData();
      const res = await graphIntelligenceService.getWorkspaceCases(1500, 0);
      if (res?.cases) setDbCases(res.cases);
    } catch (err) {
      console.warn('Cases refresh error:', err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchFilter, selectedCrimeType, pageSize]);

  // Combined assigned cases from state and PostgreSQL backend
  const assignedCases: CaseRecord[] = useMemo(() => {
    const combinedMap = new Map<string, any>();
    
    // Add DB cases first
    dbCases.forEach(dbc => {
      combinedMap.set(dbc.case_id, {
        id: dbc.case_id,
        firNumber: dbc.fir_number || dbc.case_id,
        title: dbc.title || `Case ${dbc.fir_number}`,
        description: dbc.description || 'Authoritative PostgreSQL Case Record',
        status: dbc.status || 'INVESTIGATION',
        priority: dbc.priority || 'HIGH',
        crimeType: dbc.crime_type || 'Investigation',
        stationId: dbc.police_station || stationId,
        createdAt: dbc.created_at || new Date().toISOString(),
        entities: []
      });
    });

    // Add state cases
    state.cases.forEach(c => {
      if (!combinedMap.has(c.id)) {
        combinedMap.set(c.id, c);
      }
    });

    return Array.from(combinedMap.values());
  }, [state.cases, dbCases, stationId]);

  // Tab & search filtering with normalized status checks
  const filteredCases = useMemo(() => {
    return assignedCases.filter(c => {
      const statusUpper = (c.status || '').toUpperCase();
      const priorityUpper = (c.priority || '').toUpperCase();

      if (activeTab === 'ACTIVE' && (statusUpper === 'CHARGESHEETED' || statusUpper === 'CLOSED')) return false;
      if (activeTab === 'CRITICAL' && priorityUpper !== 'CRITICAL') return false;
      if (activeTab === 'HIGH' && priorityUpper !== 'HIGH' && priorityUpper !== 'CRITICAL') return false;
      if (activeTab === 'CHARGESHEETED' && statusUpper !== 'CHARGESHEETED' && statusUpper !== 'CHARGESHEET_FILED' && statusUpper !== 'SOLVED') return false;
      if (activeTab === 'PENDING' && statusUpper !== 'PENDING' && statusUpper !== 'PENDING_ACTION') return false;

      if (selectedCrimeType !== 'ALL' && !c.crimeType.toLowerCase().includes(selectedCrimeType.toLowerCase())) {
        return false;
      }

      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase();
        const matchesFir = (c.firNumber || c.id).toLowerCase().includes(q);
        const matchesTitle = (c.title || '').toLowerCase().includes(q);
        const matchesType = (c.crimeType || '').toLowerCase().includes(q);
        const matchesDesc = (c.description || '').toLowerCase().includes(q);
        return matchesFir || matchesTitle || matchesType || matchesDesc;
      }
      return true;
    });
  }, [assignedCases, activeTab, selectedCrimeType, searchFilter]);

  // Paginated slice
  const totalPages = Math.max(1, Math.ceil(filteredCases.length / pageSize));
  const paginatedCases = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCases.slice(start, start + pageSize);
  }, [filteredCases, currentPage, pageSize]);

  // Robust Counts
  const activeCount = assignedCases.filter(c => {
    const st = (c.status || '').toUpperCase();
    return st !== 'CHARGESHEETED' && st !== 'CLOSED' && st !== 'SOLVED';
  }).length;
  const criticalCount = assignedCases.filter(c => (c.priority || '').toUpperCase() === 'CRITICAL').length;
  const highCount = assignedCases.filter(c => (c.priority || '').toUpperCase() === 'HIGH').length;
  const chargesheetCount = assignedCases.filter(c => {
    const st = (c.status || '').toUpperCase();
    return st === 'CHARGESHEETED' || st === 'CHARGESHEET_FILED' || st === 'SOLVED';
  }).length;
  const pendingCount = assignedCases.filter(c => {
    const st = (c.status || '').toUpperCase();
    return st === 'PENDING' || st === 'PENDING_ACTION';
  }).length;

  const getPriorityBadge = (priority?: string) => {
    switch ((priority || '').toUpperCase()) {
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
    const st = (status || '').toUpperCase();
    if (st === 'CHARGESHEETED' || st === 'CHARGESHEET_FILED' || st === 'SOLVED') {
      return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
    }
    if (st === 'CLOSED') {
      return 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30';
    }
    if (st === 'PENDING' || st === 'PENDING_ACTION') {
      return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
    }
    return 'bg-accent/15 text-accent dark:text-[#38BDF8] border-accent/30 dark:border-[#38BDF8]/30';
  };

  return (
    <div className="space-y-4 animate-fade-in max-w-[1520px] mx-auto pb-24 font-sans select-none text-text">
      
      {/* ── 1. INVESTIGATION COMMAND & DESK HEADER ── */}
      <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-3.5 sm:p-4 shadow-xs dark:shadow-2xl font-sans transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          
          {/* Left: Desk Context */}
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-2 dark:bg-[#0E1422] border border-accent/40 dark:border-[#38BDF8]/40 flex items-center justify-center text-accent dark:text-[#38BDF8] shrink-0 shadow-xs">
              <FolderKanban size={20} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-accent dark:text-[#38BDF8]">
                  OPERATIONAL INVESTIGATION DESK
                </span>
                
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  STATION NETWORK CONNECTED
                </span>

                <span className="text-[9px] font-mono font-medium text-text-dim dark:text-[#94A3B8] px-1.5 py-0.2 rounded bg-surface-2 dark:bg-[#131B2E] border border-border-soft dark:border-[#1E293B]">
                  PS: {stationId}
                </span>

                <span className="text-[9px] font-mono font-medium text-text-dim dark:text-[#94A3B8] px-1.5 py-0.2 rounded bg-surface-2 dark:bg-[#131B2E] border border-border-soft dark:border-[#1E293B]">
                  IO: {officerName} ({officerRank})
                </span>
              </div>

              <div className="flex items-baseline gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold font-mono text-text dark:text-[#F8FAFC] tracking-tight">
                  My Active Investigation Docket
                </h1>
                <span className="text-xs text-text-dim dark:text-[#94A3B8] font-sans">
                  — Primary case records, evidence tracking, statutory checklists, and prosecution progress.
                </span>
              </div>
            </div>
          </div>

          {/* Right: Quick Actions */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-text-dim dark:text-[#94A3B8] hover:text-text hover:border-accent/40 transition-all cursor-pointer"
              title="Refresh Caseload"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-accent' : ''} />
            </button>

            <Link
              to="/cases/search"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-text-dim dark:text-[#94A3B8] hover:text-text text-xs font-mono font-bold transition-all"
            >
              <Search size={13} />
              <span>CASE REGISTRY</span>
            </Link>

            <button
              onClick={() => navigate('/cases/new')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-accent dark:bg-[#38BDF8] hover:bg-accent-bright dark:hover:bg-[#0284C7] text-bg dark:text-[#070A0F] font-mono font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Plus size={14} />
              <span>REGISTER FIR</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. OPERATIONAL METRIC STRIP (4 KPI TILES) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono select-none">
        
        {/* Tile 1: Active Caseload */}
        <div
          onClick={() => setActiveTab('ACTIVE')}
          className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] hover:border-accent/50 dark:hover:border-[#38BDF8]/50 rounded-xl p-3.5 shadow-xs dark:shadow-xl transition-all flex flex-col justify-between cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-text-dim dark:text-[#64748B] uppercase tracking-wider group-hover:text-text transition-colors">
              ACTIVE CASELOAD
            </span>
            <Activity size={14} className="text-accent dark:text-[#38BDF8]" />
          </div>
          <div className="my-1.5">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-accent dark:text-[#38BDF8]">
              {activeCount}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-text-dim dark:text-[#94A3B8] font-sans">Under Investigation</span>
            <span className="text-accent dark:text-[#38BDF8] font-bold text-[9px]">Live Caseload</span>
          </div>
        </div>

        {/* Tile 2: Critical Risk */}
        <div
          onClick={() => setActiveTab('CRITICAL')}
          className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] hover:border-rose-500/50 rounded-xl p-3.5 shadow-xs dark:shadow-xl transition-all flex flex-col justify-between cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-text-dim dark:text-[#64748B] uppercase tracking-wider group-hover:text-text transition-colors">
              CRITICAL PRIORITY
            </span>
            <AlertTriangle size={14} className="text-rose-500" />
          </div>
          <div className="my-1.5">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-rose-600 dark:text-rose-500">
              {criticalCount}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-text-dim dark:text-[#94A3B8] font-sans">Expedited Action</span>
            <span className="text-rose-500 font-bold text-[9px]">{criticalCount > 0 ? 'Urgent' : 'Nominal'}</span>
          </div>
        </div>

        {/* Tile 3: High Priority */}
        <div
          onClick={() => setActiveTab('HIGH')}
          className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] hover:border-amber-500/50 rounded-xl p-3.5 shadow-xs dark:shadow-xl transition-all flex flex-col justify-between cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-text-dim dark:text-[#64748B] uppercase tracking-wider group-hover:text-text transition-colors">
              HIGH PRIORITY
            </span>
            <Clock size={14} className="text-amber-500" />
          </div>
          <div className="my-1.5">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
              {highCount}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-text-dim dark:text-[#94A3B8] font-sans">Statutory Review</span>
            <span className="text-amber-500 font-bold text-[9px]">Pending Step</span>
          </div>
        </div>

        {/* Tile 4: Charge Sheets Filed */}
        <div
          onClick={() => setActiveTab('CHARGESHEETED')}
          className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] hover:border-emerald-500/50 rounded-xl p-3.5 shadow-xs dark:shadow-xl transition-all flex flex-col justify-between cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-text-dim dark:text-[#64748B] uppercase tracking-wider group-hover:text-text transition-colors">
              PROSECUTION READY
            </span>
            <CheckCircle2 size={14} className="text-emerald-500" />
          </div>
          <div className="my-1.5">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {chargesheetCount}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-text-dim dark:text-[#94A3B8] font-sans">Charge Sheet Filed</span>
            <span className="text-emerald-500 font-bold text-[9px]">Court Docket</span>
          </div>
        </div>

      </div>

      {/* ── 3. MAIN INVESTIGATION DOCKET PANEL ── */}
      <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-4 shadow-xs dark:shadow-2xl font-sans select-none transition-colors">
        
        {/* Controls Ribbon: Filter Tabs & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border-soft dark:border-[#1E293B] mb-3">
          
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none font-mono text-[11px]">
            {[
              { id: 'ALL', label: 'ALL FILES', count: assignedCases.length },
              { id: 'ACTIVE', label: 'UNDER INVESTIGATION', count: activeCount },
              { id: 'CRITICAL', label: 'CRITICAL RISK', count: criticalCount },
              { id: 'HIGH', label: 'HIGH PRIORITY', count: highCount },
              { id: 'CHARGESHEETED', label: 'PROSECUTION READY', count: chargesheetCount },
              { id: 'PENDING', label: 'PENDING INTAKE', count: pendingCount },
            ].map(({ id, label, count }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`px-2.5 py-1 rounded-lg border transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer font-bold ${
                  activeTab === id
                    ? 'bg-accent/15 dark:bg-[#38BDF8]/15 border-accent dark:border-[#38BDF8] text-accent dark:text-[#38BDF8]'
                    : 'bg-surface-2 dark:bg-[#0E1422] border-border-soft dark:border-[#1E293B] text-text-dim dark:text-[#94A3B8] hover:text-text'
                }`}
              >
                <span>{label}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-surface dark:bg-[#070A0F] text-text-dim dark:text-[#64748B]">
                  {count}
                </span>
              </button>
            ))}
          </div>

          {/* Search and Category Filter */}
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Filter FIR / Title / Crime..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-7 pr-3 py-1 text-xs rounded-lg bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-text dark:text-[#F8FAFC] placeholder:text-text-dim dark:placeholder:text-[#64748B] focus:outline-none focus:border-accent dark:focus:border-[#38BDF8] font-mono"
              />
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-dim dark:text-[#64748B]" />
            </div>
          </div>
        </div>

        {/* Case Rows Grid */}
        <div className="space-y-2.5">
          {isLoading && dbCases.length === 0 ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-4 rounded-xl bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] animate-pulse space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-32 bg-slate-700/30 rounded" />
                    <div className="h-4 w-16 bg-slate-700/30 rounded" />
                  </div>
                  <div className="h-4 w-3/4 bg-slate-700/20 rounded" />
                  <div className="h-3 w-1/2 bg-slate-700/10 rounded" />
                </div>
              ))}
            </div>
          ) : (
            paginatedCases.map((c) => {
            const isSolved = (c.status || '').toUpperCase() === 'CHARGESHEETED' || (c.status || '').toUpperCase() === 'SOLVED';
            const progressPercent = isSolved ? 100 : c.priority === 'CRITICAL' ? 82 : c.priority === 'HIGH' ? 65 : 40;
            const stageLabel = isSolved ? 'Charge Sheet Ready (Court Submission)' : 'Evidence Collection & Link Analysis';

            return (
              <div
                key={c.id}
                onClick={() => navigate(`/cases/${c.id}`)}
                className="p-3.5 rounded-xl bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B]/70 hover:border-accent/50 dark:hover:border-[#38BDF8]/50 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group shadow-2xs"
              >
                {/* Left Case Info */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-accent dark:text-[#38BDF8] group-hover:underline">
                      {c.firNumber || c.id}
                    </span>
                    <span className={`font-mono text-[9px] font-bold px-1.5 py-0.2 rounded border ${getPriorityBadge(c.priority)}`}>
                      {c.priority || 'MEDIUM'}
                    </span>
                    <span className={`font-mono text-[9px] font-bold px-1.5 py-0.2 rounded border ${getStatusBadge(c.status)}`}>
                      {c.status || 'INVESTIGATION'}
                    </span>
                    <span className="text-[10px] font-mono text-text-dim dark:text-[#64748B] truncate">
                      Stage: <span className="text-text dark:text-[#F8FAFC] font-semibold">{stageLabel}</span>
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-text dark:text-[#F8FAFC] group-hover:text-accent dark:group-hover:text-[#38BDF8] transition-colors truncate">
                    {c.title || `Investigation Docket #${c.firNumber || c.id}`}
                  </h3>

                  <p className="text-xs text-text-dim dark:text-[#94A3B8] line-clamp-2 leading-relaxed font-sans">
                    {c.description || 'Primary investigation record filed at Odisha Police station. Pending evidentiary analysis and entity link verification.'}
                  </p>

                  {/* Progress & Metadata Row */}
                  <div className="pt-1 flex items-center gap-4 flex-wrap text-[11px] font-mono text-text-dim dark:text-[#64748B]">
                    <div className="flex items-center gap-2 w-48">
                      <div className="flex-1 h-1.5 bg-surface dark:bg-[#070A0F] rounded-full overflow-hidden border border-border-soft dark:border-[#1E293B]">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isSolved ? 'bg-emerald-500' : c.priority === 'CRITICAL' ? 'bg-rose-500' : 'bg-accent dark:bg-[#38BDF8]'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-text dark:text-[#F8FAFC]">
                        {progressPercent}%
                      </span>
                    </div>

                    <span>PS: <strong className="text-text dark:text-[#F8FAFC]">{c.stationId || stationId}</strong></span>
                    <span>Category: <strong className="text-text dark:text-[#F8FAFC]">{c.crimeType}</strong></span>
                  </div>
                </div>

                {/* Right Action Button */}
                <div className="flex md:flex-col items-end justify-between gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border-soft dark:border-[#1E293B]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/cases/${c.id}`);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface dark:bg-[#070A0F] hover:bg-accent hover:text-bg dark:hover:bg-[#38BDF8] dark:hover:text-[#0B0F17] border border-border-soft dark:border-[#1E293B] text-accent dark:text-[#38BDF8] text-xs font-mono font-bold transition-all cursor-pointer shadow-xs"
                  >
                    <span>Open Workspace</span>
                    <ArrowUpRight size={13} />
                  </button>
                  <span className="text-[9px] font-mono text-text-dim dark:text-[#64748B]">
                    Updated Today
                  </span>
                </div>
              </div>
            );
          }))}

          {filteredCases.length === 0 && (
            <div className="bg-surface-2 dark:bg-[#0E1422] p-12 rounded-xl text-center border border-dashed border-border-soft dark:border-[#1E293B] space-y-3">
              <FolderKanban size={32} className="mx-auto text-text-dim dark:text-[#64748B]" />
              <p className="text-sm font-bold text-text dark:text-[#F8FAFC] font-mono uppercase">
                No matching investigation dockets found
              </p>
              <p className="text-xs text-text-dim dark:text-[#94A3B8] max-w-sm mx-auto font-sans">
                Adjust your filter tabs or search keywords, or register a new FIR docket to initiate a case workspace.
              </p>
              <button
                onClick={() => { setActiveTab('ALL'); setSearchFilter(''); }}
                className="px-3.5 py-1.5 rounded-lg bg-surface dark:bg-[#070A0F] border border-border-soft dark:border-[#1E293B] text-accent dark:text-[#38BDF8] font-mono text-xs font-bold hover:border-accent transition-all cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          )}

          {/* ── PAGINATION CONTROLS ── */}
          {filteredCases.length > 0 && (
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono border-t border-border-soft dark:border-[#1E293B]/70">
              <div className="text-text-dim dark:text-[#94A3B8] flex items-center gap-2">
                <span>
                  Showing <strong className="text-text dark:text-[#F8FAFC]">{(currentPage - 1) * pageSize + 1}</strong> to <strong className="text-text dark:text-[#F8FAFC]">{Math.min(currentPage * pageSize, filteredCases.length)}</strong> of <strong className="text-accent dark:text-[#38BDF8]">{filteredCases.length}</strong> dockets
                  {dbCases.length > 0 && ` (${dbCases.length} Total in Supabase)`}
                </span>
                <span className="text-border-soft dark:text-[#1E293B]">|</span>
                <div className="flex items-center gap-1.5">
                  <span>Per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="px-2 py-1 rounded bg-surface dark:bg-[#070A0F] border border-border-soft dark:border-[#1E293B] text-text dark:text-[#F8FAFC] font-mono text-xs focus:outline-none focus:border-accent"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              {/* Page Navigator */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-2 py-1 rounded bg-surface dark:bg-[#070A0F] border border-border-soft dark:border-[#1E293B] text-text dark:text-[#F8FAFC] hover:border-accent disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  &laquo;
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 rounded bg-surface dark:bg-[#070A0F] border border-border-soft dark:border-[#1E293B] text-text dark:text-[#F8FAFC] hover:border-accent disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Prev
                </button>

                {/* Visible Page Numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-2.5 py-1 rounded font-bold cursor-pointer transition-all ${
                        currentPage === pageNum
                          ? 'bg-accent dark:bg-[#38BDF8] text-bg dark:text-[#070A0F] shadow-xs'
                          : 'bg-surface dark:bg-[#070A0F] border border-border-soft dark:border-[#1E293B] text-text dark:text-[#F8FAFC] hover:border-accent'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1 rounded bg-surface dark:bg-[#070A0F] border border-border-soft dark:border-[#1E293B] text-text dark:text-[#F8FAFC] hover:border-accent disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Next
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 rounded bg-surface dark:bg-[#070A0F] border border-border-soft dark:border-[#1E293B] text-text dark:text-[#F8FAFC] hover:border-accent disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  &raquo;
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
