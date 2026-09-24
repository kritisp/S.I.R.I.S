import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Search, Filter, FileText, ChevronRight, AlertTriangle, ShieldCheck,
  Building, Calendar, User, Tag, Lock, CheckCircle2, SlidersHorizontal,
  Download, ArrowUpDown, LayoutGrid, List, Sparkles, RefreshCw, ArrowUpRight, FolderKanban
} from 'lucide-react';
import { useMockState } from '../mockServices/MockStateContext';
import { useLanguage } from '../context/LanguageContext';
import { CaseRecord } from '../mockServices/types';

export function CaseSearch() {
  const { state } = useMockState();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Search filter criteria
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStation, setSelectedStation] = useState('ALL');
  const [selectedCrimeType, setSelectedCrimeType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  const role = state.currentUser?.role;

  // Filter dynamic dataset
  const filteredCases = useMemo(() => {
    return state.cases.filter(c => {
      // Free text search across FIR, Title, Description, CrimeType, and Entity values
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesFIR = (c.firNumber || c.id).toLowerCase().includes(query);
        const matchesTitle = (c.title || '').toLowerCase().includes(query);
        const matchesDesc = (c.description || '').toLowerCase().includes(query);
        const matchesCrime = (c.crimeType || '').toLowerCase().includes(query);
        const matchesEntities = c.entities?.some(e => e.value.toLowerCase().includes(query) || e.type.toLowerCase().includes(query));

        if (!matchesFIR && !matchesTitle && !matchesDesc && !matchesCrime && !matchesEntities) {
          return false;
        }
      }

      // Station filter
      if (selectedStation !== 'ALL' && c.stationId !== selectedStation) {
        return false;
      }

      // Crime category filter
      if (selectedCrimeType !== 'ALL' && !c.crimeType.toLowerCase().includes(selectedCrimeType.toLowerCase())) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'ALL') {
        const st = (c.status || '').toUpperCase();
        if (selectedStatus === 'INVESTIGATION' && (st === 'CHARGESHEETED' || st === 'CLOSED' || st === 'SOLVED')) return false;
        if (selectedStatus === 'CHARGESHEETED' && st !== 'CHARGESHEETED' && st !== 'CHARGESHEET_FILED' && st !== 'SOLVED') return false;
        if (selectedStatus === 'PENDING' && st !== 'PENDING' && st !== 'PENDING_ACTION') return false;
      }

      // Priority filter
      if (selectedPriority !== 'ALL' && (c.priority || '').toUpperCase() !== selectedPriority) {
        return false;
      }

      return true;
    });
  }, [state.cases, searchTerm, selectedStation, selectedCrimeType, selectedStatus, selectedPriority]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedStation('ALL');
    setSelectedCrimeType('ALL');
    setSelectedStatus('ALL');
    setSelectedPriority('ALL');
  };

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
      
      {/* ── 1. SEARCH REGISTRY HEADER ── */}
      <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-3.5 sm:p-4 shadow-xs dark:shadow-2xl font-sans transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-2 dark:bg-[#0E1422] border border-accent/40 dark:border-[#38BDF8]/40 flex items-center justify-center text-accent dark:text-[#38BDF8] shrink-0 shadow-xs">
              <Search size={20} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-accent dark:text-[#38BDF8]">
                  STATEWIDE CASE REGISTRY
                </span>
                
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {filteredCases.length} RECORDS MATCHING
                </span>

                <span className="text-[9px] font-mono font-medium text-text-dim dark:text-[#94A3B8] px-1.5 py-0.2 rounded bg-surface-2 dark:bg-[#131B2E] border border-border-soft dark:border-[#1E293B]">
                  JURISDICTION: ALL DISTRICTS
                </span>
              </div>

              <div className="flex items-baseline gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold font-mono text-text dark:text-[#F8FAFC] tracking-tight">
                  Cross-Station Case Search & Intelligence Query
                </h1>
                <span className="text-xs text-text-dim dark:text-[#94A3B8] font-sans">
                  — Multi-field investigation query across FIRs, extracted entities, suspects, and state police records.
                </span>
              </div>
            </div>
          </div>

          {/* View Switcher & Link to My Desk */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/cases"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-text-dim dark:text-[#94A3B8] hover:text-text text-xs font-mono font-bold transition-all"
            >
              <FolderKanban size={13} />
              <span>MY DESK</span>
            </Link>

            <div className="flex bg-surface-2 dark:bg-[#0E1422] p-1 rounded-xl border border-border-soft dark:border-[#1E293B]">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs transition-all ${
                  viewMode === 'table'
                    ? 'bg-accent/15 dark:bg-[#38BDF8]/15 text-accent dark:text-[#38BDF8] font-bold shadow-xs'
                    : 'text-text-dim dark:text-[#64748B] hover:text-text'
                }`}
                title="Table View"
              >
                <List size={15} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition-all ${
                  viewMode === 'grid'
                    ? 'bg-accent/15 dark:bg-[#38BDF8]/15 text-accent dark:text-[#38BDF8] font-bold shadow-xs'
                    : 'text-text-dim dark:text-[#64748B] hover:text-text'
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. MULTI-CRITERIA SEARCH & FILTER PANEL ── */}
      <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-4 shadow-xs dark:shadow-2xl space-y-3 font-sans transition-colors">
        
        {/* Main Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-accent dark:text-[#38BDF8]" size={16} />
          <input
            type="text"
            placeholder="Search by FIR number, suspect alias, vehicle plate, phone, location, statutory section..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] rounded-xl pl-10 pr-20 py-2.5 text-xs sm:text-sm text-text dark:text-[#F8FAFC] placeholder:text-text-dim dark:placeholder:text-[#64748B] focus:border-accent dark:focus:border-[#38BDF8] outline-none font-mono transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim dark:text-[#64748B] hover:text-text text-[11px] font-mono bg-surface dark:bg-[#070A0F] border border-border-soft dark:border-[#1E293B] px-2 py-0.5 rounded-md cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Selects Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1 font-mono text-xs">
          {/* Station Filter */}
          <div>
            <label className="block text-[9px] uppercase font-bold text-text-dim dark:text-[#64748B] tracking-wider mb-1">POLICE STATION</label>
            <select
              value={selectedStation}
              onChange={e => setSelectedStation(e.target.value)}
              className="w-full bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-xs text-text dark:text-[#F8FAFC] rounded-lg p-2 outline-none cursor-pointer focus:border-accent dark:focus:border-[#38BDF8]"
            >
              <option value="ALL">All Jurisdictions</option>
              {state.stations.map(st => (
                <option key={st.id} value={st.id}>{st.name}</option>
              ))}
            </select>
          </div>

          {/* Crime Category */}
          <div>
            <label className="block text-[9px] uppercase font-bold text-text-dim dark:text-[#64748B] tracking-wider mb-1">CRIME CATEGORY</label>
            <select
              value={selectedCrimeType}
              onChange={e => setSelectedCrimeType(e.target.value)}
              className="w-full bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-xs text-text dark:text-[#F8FAFC] rounded-lg p-2 outline-none cursor-pointer focus:border-accent dark:focus:border-[#38BDF8]"
            >
              <option value="ALL">All Crime Categories</option>
              <option value="Theft">Vehicle & Property Theft</option>
              <option value="Burglary">House Burglary</option>
              <option value="Robbery">Armed Robbery</option>
              <option value="Assault">Physical Assault</option>
              <option value="Cyber">Cybercrime & Online Fraud</option>
            </select>
          </div>

          {/* Case Status */}
          <div>
            <label className="block text-[9px] uppercase font-bold text-text-dim dark:text-[#64748B] tracking-wider mb-1">STATUS</label>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-xs text-text dark:text-[#F8FAFC] rounded-lg p-2 outline-none cursor-pointer focus:border-accent dark:focus:border-[#38BDF8]"
            >
              <option value="ALL">All Statuses</option>
              <option value="INVESTIGATION">Active Investigation</option>
              <option value="PENDING">Pending Intake</option>
              <option value="CHARGESHEETED">Charge Sheet Filed</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-[9px] uppercase font-bold text-text-dim dark:text-[#64748B] tracking-wider mb-1">PRIORITY</label>
            <select
              value={selectedPriority}
              onChange={e => setSelectedPriority(e.target.value)}
              className="w-full bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-xs text-text dark:text-[#F8FAFC] rounded-lg p-2 outline-none cursor-pointer focus:border-accent dark:focus:border-[#38BDF8]"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical Risk</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium / Normal</option>
            </select>
          </div>

          {/* Reset Filters CTA */}
          <div className="flex items-end">
            <button
              onClick={handleResetFilters}
              className="w-full bg-surface-2 dark:bg-[#0E1422] hover:bg-surface-hover dark:hover:bg-[#131B2E] border border-border-soft dark:border-[#1E293B] text-text-dim dark:text-[#94A3B8] hover:text-text rounded-lg py-2 px-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw size={12} /> Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* ── 3. SEARCH RESULTS (TABLE / GRID) ── */}
      {viewMode === 'table' ? (
        <div className="bg-surface dark:bg-[#0B0F17] rounded-xl border border-border-soft dark:border-[#1E293B] overflow-hidden shadow-xs dark:shadow-2xl font-sans transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-surface-2 dark:bg-[#0E1422] border-b border-border-soft dark:border-[#1E293B] text-text-dim dark:text-[#64748B] text-[10px] uppercase font-mono tracking-wider">
                <tr>
                  <th className="py-3 px-4">FIR Number</th>
                  <th className="py-3 px-4">Case Title / Description</th>
                  <th className="py-3 px-4">Station</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Extracted Entities</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft/40 dark:divide-[#1E293B]/60 font-mono">
                {filteredCases.map(c => {
                  const station = state.stations.find(s => s.id === c.stationId)?.name || c.stationId;

                  return (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/cases/${c.id}`)}
                      className="hover:bg-surface-2/60 dark:hover:bg-[#0E1422]/80 cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-bold text-accent dark:text-[#38BDF8] group-hover:underline">
                        {c.firNumber || c.id}
                      </td>
                      <td className="py-3.5 px-4 font-sans">
                        <div className="font-semibold text-text dark:text-[#F8FAFC] line-clamp-1">{c.title}</div>
                        <div className="text-[10px] text-text-dim dark:text-[#94A3B8] line-clamp-1">{c.crimeType}</div>
                      </td>
                      <td className="py-3.5 px-4 font-sans text-text-dim dark:text-[#94A3B8] text-xs truncate max-w-[140px]">
                        {station}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase border ${getPriorityBadge(c.priority)}`}>
                          {c.priority || 'MEDIUM'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase border ${getStatusBadge(c.status)}`}>
                          {c.status || 'INVESTIGATION'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {c.entities && c.entities.slice(0, 2).map((ent, i) => (
                            <span key={i} className="bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] px-1.5 py-0.2 rounded text-[9px] text-text-dim dark:text-[#94A3B8]">
                              {ent.value}
                            </span>
                          ))}
                          {c.entities && c.entities.length > 2 && (
                            <span className="text-[9px] text-text-dim dark:text-[#64748B]">+{c.entities.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="text-accent dark:text-[#38BDF8] font-bold text-xs inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform font-mono">
                          Inspect <ArrowUpRight size={13} />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredCases.map(c => {
            const station = state.stations.find(s => s.id === c.stationId)?.name || c.stationId;
            return (
              <div
                key={c.id}
                onClick={() => navigate(`/cases/${c.id}`)}
                className="bg-surface dark:bg-[#0B0F17] p-4 rounded-xl border border-border-soft dark:border-[#1E293B] hover:border-accent/50 dark:hover:border-[#38BDF8]/50 transition-all cursor-pointer flex flex-col justify-between space-y-3 group shadow-xs dark:shadow-xl font-sans select-none"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2 font-mono">
                    <span className="text-xs font-bold text-accent dark:text-[#38BDF8] group-hover:underline">
                      {c.firNumber || c.id}
                    </span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase border ${getPriorityBadge(c.priority)}`}>
                      {c.priority || 'MEDIUM'}
                    </span>
                  </div>

                  <h3 className="font-bold text-text dark:text-[#F8FAFC] text-sm group-hover:text-accent dark:group-hover:text-[#38BDF8] transition-colors line-clamp-1">
                    {c.title}
                  </h3>
                  <p className="text-xs text-text-dim dark:text-[#94A3B8] mt-1 line-clamp-2 leading-relaxed font-sans">
                    {c.description}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-border-soft dark:border-[#1E293B] space-y-2 font-mono text-[10px]">
                  <div className="flex justify-between items-center text-text-dim dark:text-[#94A3B8]">
                    <span className="truncate">{station}</span>
                    <span className={`px-1.5 py-0.2 rounded font-bold uppercase border ${getStatusBadge(c.status)}`}>
                      {c.status || 'INVESTIGATION'}
                    </span>
                  </div>

                  {c.entities && c.entities.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {c.entities.slice(0, 3).map((ent, i) => (
                        <span key={i} className="bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] px-1.5 py-0.2 rounded text-text-dim dark:text-[#94A3B8]">
                          {ent.value}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredCases.length === 0 && (
        <div className="bg-surface dark:bg-[#0B0F17] p-12 rounded-xl text-center text-text-dim border border-dashed border-border-soft dark:border-[#1E293B] space-y-3 font-mono">
          <Search size={32} className="mx-auto text-accent dark:text-[#38BDF8]" />
          <p className="text-sm font-bold text-text dark:text-[#F8FAFC] uppercase">No matching case records found</p>
          <p className="text-xs text-text-dim dark:text-[#94A3B8] max-w-sm mx-auto font-sans">
            Try adjusting your keyword query or resetting station and classification filters.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-3.5 py-1.5 bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-accent dark:text-[#38BDF8] font-bold rounded-lg text-xs hover:border-accent transition-colors cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
}
