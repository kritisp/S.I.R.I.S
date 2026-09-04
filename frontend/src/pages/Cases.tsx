import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, Search, Filter, FileText, ChevronRight, AlertTriangle, 
  ShieldCheck, Clock, CheckCircle2, ArrowUpRight, Activity, Plus,
  Layers, UserCheck, Calendar
} from 'lucide-react';
import { useMockState } from '../mockServices/MockStateContext';
import { useLanguage } from '../context/LanguageContext';
import { CaseRecord } from '../mockServices/types';
import { graphIntelligenceService } from '../services/graphIntelligenceService';

export function Cases() {
  const { state } = useMockState();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'OVERDUE' | 'HIGH PRIORITY'>('ALL');
  const [searchFilter, setSearchFilter] = useState('');
  const [dbCases, setDbCases] = useState<any[]>([]);

  useEffect(() => {
    graphIntelligenceService.getWorkspaceCases(500, 0)
      .then((res) => {
        if (res && res.cases) {
          setDbCases(res.cases);
        }
      })
      .catch((err) => console.warn('Workspace cases fetch notice:', err));
  }, []);

  const currentUser = state.currentUser;
  const officerName = currentUser?.name || 'Insp. Vikram';
  const stationId = currentUser?.stationId || 'OP-BBSR-CAP';

  // Combined assigned cases from state and PostgreSQL backend
  const assignedCases = useMemo(() => {
    const combinedMap = new Map<string, any>();
    
    // Add DB cases first
    dbCases.forEach(dbc => {
      combinedMap.set(dbc.case_id, {
        id: dbc.case_id,
        firNumber: dbc.fir_number || dbc.case_id,
        title: dbc.title || `Case ${dbc.fir_number}`,
        description: dbc.description || 'Authoritative PostgreSQL Case Record',
        status: dbc.status || 'INVESTIGATING',
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

  // Tab filtering
  const filteredCases = useMemo(() => {
    return assignedCases.filter(c => {
      if (activeTab === 'ACTIVE' && c.status !== 'INVESTIGATING') return false;
      if (activeTab === 'PENDING' && c.status !== 'PENDING') return false;
      if (activeTab === 'OVERDUE' && c.priority !== 'CRITICAL') return false;
      if (activeTab === 'HIGH PRIORITY' && c.priority !== 'HIGH' && c.priority !== 'CRITICAL') return false;

      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase();
        return c.firNumber.toLowerCase().includes(q) || c.title.toLowerCase().includes(q) || c.crimeType.toLowerCase().includes(q);
      }
      return true;
    });
  }, [assignedCases, activeTab, searchFilter]);

  // Quick stats
  const activeCount = assignedCases.filter(c => c.status === 'INVESTIGATING').length;
  const criticalCount = assignedCases.filter(c => c.priority === 'CRITICAL').length;
  const highPriorityCount = assignedCases.filter(c => c.priority === 'HIGH').length;
  const pendingCount = assignedCases.filter(c => c.status === 'PENDING').length;

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-soft pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-brand/10 text-brand px-2 py-0.5 rounded border border-brand/30">
              OPERATIONAL DESK
            </span>
            <span className="text-[10px] font-mono text-text-dim">
              {officerName} · {stationId}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-text font-display flex items-center gap-2">
            <Briefcase className="text-brand" size={24} /> {t('nav.myInvestigations', 'My Investigations')}
          </h2>
          <p className="text-sm text-text-dim mt-1">
            Active caseload, investigation milestones, evidence checklists, and prosecution progress.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/cases/new')}
            className="bg-brand text-bg px-4 py-2 rounded-lg font-bold text-xs hover:bg-brand-bright transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus size={15} /> {t('btn.registerFIR', 'Register FIR')}
          </button>
        </div>
      </div>

      {/* Desk Caseload KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass p-4 rounded-xl bg-surface border border-border-soft flex items-center justify-between">
          <div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-text-dim">Active Caseload</div>
            <div className="text-2xl font-display font-bold text-text mt-0.5">{activeCount}</div>
          </div>
          <div className="h-9 w-9 rounded-lg bg-brand/10 text-brand flex items-center justify-center border border-brand/30">
            <Activity size={18} />
          </div>
        </div>

        <div className="glass p-4 rounded-xl bg-surface border border-danger/20 flex items-center justify-between">
          <div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-danger-bright">Critical Risk</div>
            <div className="text-2xl font-display font-bold text-danger-bright mt-0.5">{criticalCount}</div>
          </div>
          <div className="h-9 w-9 rounded-lg bg-danger/10 text-danger-bright flex items-center justify-center border border-danger/30">
            <AlertTriangle size={18} />
          </div>
        </div>

        <div className="glass p-4 rounded-xl bg-surface border border-warning/20 flex items-center justify-between">
          <div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-warning">High Priority</div>
            <div className="text-2xl font-display font-bold text-warning mt-0.5">{highPriorityCount}</div>
          </div>
          <div className="h-9 w-9 rounded-lg bg-warning/10 text-warning flex items-center justify-center border border-warning/30">
            <Clock size={18} />
          </div>
        </div>

        <div className="glass p-4 rounded-xl bg-surface border border-border-soft flex items-center justify-between">
          <div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-text-dim">Pending Intake</div>
            <div className="text-2xl font-display font-bold text-text mt-0.5">{pendingCount}</div>
          </div>
          <div className="h-9 w-9 rounded-lg bg-surface-2 text-text-dim flex items-center justify-center border border-border-soft">
            <Layers size={18} />
          </div>
        </div>
      </div>

      {/* Filter Tabs and Quick Search */}
      <div className="glass p-4 rounded-xl bg-surface border border-border-soft flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
        <div className="flex flex-wrap gap-1.5">
          {(['ALL', 'ACTIVE', 'PENDING', 'OVERDUE', 'HIGH PRIORITY'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${
                activeTab === tab
                  ? 'bg-brand text-bg shadow-sm'
                  : 'bg-surface-2 text-text-dim hover:text-text hover:bg-surface-hover border border-border-soft'
              }`}
            >
              {tab === 'HIGH PRIORITY' ? 'High Priority' : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" size={15} />
          <input
            type="text"
            placeholder="Filter desk cases..."
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
            className="w-full bg-surface-2 border border-border-soft rounded-lg pl-9 pr-3 py-1.5 text-xs text-text focus:border-brand outline-none"
          />
        </div>
      </div>

      {/* Case List Cards */}
      <div className="space-y-3">
        {filteredCases.map(c => {
          const progressPercent = c.id === 'OD-BBSR-2026-0001' ? 78 : c.id === 'OD-BBSR-2026-0042' ? 45 : 60;
          const stage = c.status === 'SOLVED' ? 'Charge Sheet Ready' : 'Network Intelligence / Evidence';

          return (
            <div
              key={c.id}
              onClick={() => navigate(`/cases/${c.id}`)}
              className="glass p-5 rounded-2xl bg-surface border border-border-soft hover:border-brand transition-all cursor-pointer group shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-accent-bright bg-accent/10 px-2.5 py-0.5 rounded border border-accent/20">
                    {c.firNumber}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                    c.priority === 'CRITICAL' ? 'text-danger-bright bg-danger/10 border-danger/30' :
                    c.priority === 'HIGH' ? 'text-warning bg-warning/10 border-warning/30' :
                    'text-text-dim bg-surface-2 border-border-soft'
                  }`}>
                    {c.priority}
                  </span>
                  <span className="text-[10px] font-mono text-text-faint">
                    Stage: <span className="text-text font-semibold">{stage}</span>
                  </span>
                </div>

                <h3 className="text-base font-bold text-text group-hover:text-brand transition-colors">
                  {c.title}
                </h3>
                <p className="text-xs text-text-dim line-clamp-2 leading-relaxed">
                  {c.description}
                </p>

                {/* Progress bar */}
                <div className="pt-2 flex items-center gap-3 max-w-md">
                  <div className="flex-1 h-2 bg-surface-2 rounded-full overflow-hidden border border-border-soft/60">
                    <div
                      className={`h-full rounded-full transition-all ${
                        c.status === 'SOLVED' ? 'bg-success' : 'bg-brand'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-text-dim tabular-nums">
                    {progressPercent}% Complete
                  </span>
                </div>
              </div>

              {/* Action Buttons Column */}
              <div className="flex md:flex-col items-end justify-between gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-border-soft">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/cases/${c.id}`);
                  }}
                  className="bg-brand/10 hover:bg-brand text-brand hover:text-bg border border-brand/30 px-3.5 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5"
                >
                  Open Workspace <ArrowUpRight size={14} />
                </button>
                <span className="text-[10px] font-mono text-text-faint">
                  Updated: Today
                </span>
              </div>
            </div>
          );
        })}

        {filteredCases.length === 0 && (
          <div className="glass p-12 rounded-2xl text-center text-text-dim flex flex-col items-center justify-center border-dashed">
            <Briefcase size={36} className="mb-4 text-brand/40" />
            <p className="text-lg font-bold text-text">No assigned investigations match this filter.</p>
            <p className="text-xs text-text-dim mt-1">
              Switch tabs or click "Register FIR" to create a new case workspace.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
