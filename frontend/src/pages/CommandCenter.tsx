/**
 * CommandCenter — S.I.R.I.S Master Police Intelligence Dashboard
 * Production-grade police workstation dashboard featuring:
 * - 4 Focused Primary Operational KPIs with secondary telemetry bar
 * - Action Required operational alert strip
 * - FIR Registration Trend Area Chart with closure rate summary
 * - Cases by Crime Category Donut Chart
 * - Realistic GIS Bhubaneswar Cartographic Crime Hotspot Map
 * - Explainable D3.js Cross-Station Link Analysis Network Graph
 * - High-density Active Investigations Board
 * - Real-time Intelligence Alerts Feed
 * - Investigation Team Performance & Caseload Distribution
 * - Centralized Multilingual Translation & Dual Light/Dark theming
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Filter, UserPlus, ChevronDown
} from 'lucide-react';
import { useMockState } from '../mockServices/MockStateContext';
import { useLanguage } from '../context/LanguageContext';
import { dashboardApi, casesApi } from '../services/api';
import { IntelligenceSummaryKpis } from '../components/dashboard/IntelligenceSummaryKpis';
import { ActionRequiredStrip } from '../components/dashboard/ActionRequiredStrip';
import { FirRegistrationTrendChart } from '../components/dashboard/FirRegistrationTrendChart';
import { CrimeCategoryDonutChart } from '../components/dashboard/CrimeCategoryDonutChart';
import { CrimeHotspotGisMap } from '../components/dashboard/CrimeHotspotGisMap';
import { CrossStationD3Network } from '../components/dashboard/CrossStationD3Network';
import { ActiveInvestigationsTable } from '../components/dashboard/ActiveInvestigationsTable';
import { IntelligenceAlertsFeed } from '../components/dashboard/IntelligenceAlertsFeed';
import { OfficerPerformanceAnalytics } from '../components/dashboard/OfficerPerformanceAnalytics';

export function CommandCenter() {
  const { state, dispatch } = useMockState();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const role = state.currentUser?.role || 'OFFICER';
  const myStationId = state.currentUser?.stationId || 'OP-BBSR-CAP';
  const myStation = state.stations.find((s) => s.id === myStationId) || state.stations[0];

  // ─── Filter & View States ───
  const [dateRange, setDateRange] = useState('18 Aug 2025 - 18 Aug 2025');
  const [showFilters, setShowFilters] = useState(false);
  const [filterDistrict, setFilterDistrict] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');

  // ─── Modals State ───
  const [showAddOfficerModal, setShowAddOfficerModal] = useState(false);
  const [assigningCase, setAssigningCase] = useState<any | null>(null);
  const [newOfficerId, setNewOfficerId] = useState('');

  // Form State for new Officer
  const [newOfficerName, setNewOfficerName] = useState('');
  const [newOfficerRank, setNewOfficerRank] = useState('Sub-Inspector');
  const [newOfficerRole, setNewOfficerRole] = useState<'OFFICER' | 'STATION_ADMIN'>('OFFICER');

  // ─── Filtered Data Calculations ───
  const filteredCases = useMemo(() => {
    return state.cases.filter((c) => {
      if (role !== 'SUPER_ADMIN' && c.stationId !== myStationId) return false;
      if (filterDistrict !== 'ALL') {
        const station = state.stations.find((s) => s.id === c.stationId);
        if (station?.district !== filterDistrict) return false;
      }
      if (filterCategory !== 'ALL' && !c.crimeType.toLowerCase().includes(filterCategory.toLowerCase())) {
        return false;
      }
      if (filterPriority !== 'ALL' && c.priority !== filterPriority) return false;
      return true;
    });
  }, [state.cases, state.stations, role, myStationId, filterDistrict, filterCategory, filterPriority]);

  const [backendStats, setBackendStats] = useState<any | null>(null);

  useEffect(() => {
    dashboardApi.getStats()
      .then((stats) => setBackendStats(stats))
      .catch((err) => console.warn('Dashboard stats backend connection:', err));
  }, []);

  // Statistics
  const totalFirs = backendStats?.totalCases ?? (role === 'SUPER_ADMIN' ? 797 : filteredCases.length);
  const activeCases = backendStats?.activeInvestigations ?? filteredCases.filter((c) => c.status === 'INVESTIGATING').length;
  const casesClosed = (backendStats?.solvedCases ?? 0) + (backendStats?.closedCases ?? 0) || filteredCases.filter((c) => c.status === 'SOLVED' || c.status === 'CLOSED').length;
  const pendingCases = backendStats?.pendingCases ?? filteredCases.filter((c) => c.status === 'PENDING').length;
  const overdueWork = filteredCases.filter((c) => c.priority === 'CRITICAL').length || 15;
  const highPriority = filteredCases.filter((c) => c.priority === 'HIGH' || c.priority === 'CRITICAL').length || 12;
  const activeOfficers = state.users.filter((u) => u.role === 'OFFICER').length || 23;
  const intelAlerts = state.alerts.length || 6;

  // Station Officers list for assignment modal
  const stationOfficers = useMemo(() => {
    return state.users.filter((u) => u.stationId === myStationId);
  }, [state.users, myStationId]);

  // Add Officer Handler
  const handleAddOfficerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOfficerName.trim()) return;
    const newOfficerIdStr = `INV-KHD-${String(state.users.length + 1).padStart(3, '0')}`;
    const newOfficer = {
      id: newOfficerIdStr,
      name: newOfficerName,
      role: newOfficerRole,
      stationId: myStationId,
      status: 'ACTIVE' as const,
      rank: newOfficerRank,
    };
    dispatch({ type: 'ADD_USER', payload: newOfficer });

    dispatch({
      type: 'ADD_ALERT',
      payload: {
        id: `ALT-${Date.now()}`,
        type: 'PATTERN_DETECTED',
        message: `Officer ${newOfficerName} deployed under station ${myStation?.name}.`,
        createdAt: new Date().toISOString(),
        isRead: false,
      },
    });

    setNewOfficerName('');
    setShowAddOfficerModal(false);
  };

  // Reassign Case Handler
  const handleConfirmReassign = () => {
    if (!assigningCase || !newOfficerId) return;
    const updated = { ...assigningCase, investigatorId: newOfficerId };
    dispatch({ type: 'UPDATE_CASE', payload: updated });

    dispatch({
      type: 'ADD_ALERT',
      payload: {
        id: `ALT-${Date.now()}`,
        type: 'PATTERN_DETECTED',
        message: `Case ${assigningCase.id} reassigned to ${
          state.users.find((u) => u.id === newOfficerId)?.name
        }.`,
        relatedCaseId: assigningCase.id,
        createdAt: new Date().toISOString(),
        isRead: false,
      },
    });

    setAssigningCase(null);
    setNewOfficerId('');
  };

  return (
    <div className="space-y-4 max-w-[1680px] mx-auto pb-10 font-sans animate-fade-in select-none">
      {/* ─── 1. PAGE HEADER & GLOBAL CONTROLS ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-sans text-text dark:text-[#F8FAFC] tracking-tight">
              {t('dashboard.title', 'Dashboard')}
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-brand/10 dark:bg-sky-500/15 text-brand dark:text-sky-400 border border-brand/20 dark:border-sky-500/30">
              {myStation?.name} [{myStationId}]
            </span>
          </div>
          <p className="text-xs text-text-dim dark:text-[#94A3B8] mt-0.5 font-medium">
            {t('dashboard.subtitle', 'Real-time overview of investigations and intelligence insights')}
          </p>
        </div>

        {/* Action Controls & Date Picker */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Role specific quick action */}
          {role === 'STATION_ADMIN' && (
            <button
              onClick={() => setShowAddOfficerModal(true)}
              className="bg-surface-2 dark:bg-[#151E31] border border-border dark:border-[#26334A] text-text dark:text-[#F8FAFC] px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-surface-hover dark:hover:bg-[#1E293B] transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <UserPlus size={13} />
              <span>+ Add Officer</span>
            </button>
          )}

          {/* Date Range Selector */}
          <div className="flex items-center gap-2 bg-surface dark:bg-[#0F1726] border border-border dark:border-[#1E293B] px-3 py-1.5 rounded-lg text-xs text-text dark:text-[#F8FAFC] shadow-xs">
            <Calendar size={13} className="text-text-faint dark:text-[#64748B]" />
            <span className="font-mono text-[11px] font-medium">{dateRange}</span>
            <ChevronDown size={12} className="text-text-dim dark:text-[#94A3B8]" />
          </div>

          {/* Filters Toggle Button */}
          <button
            onClick={() => setShowFilters((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-xs border ${
              showFilters
                ? 'bg-brand/10 dark:bg-sky-500/15 border-brand dark:border-sky-500 text-brand dark:text-sky-400'
                : 'bg-surface dark:bg-[#0F1726] border-border dark:border-[#1E293B] text-text dark:text-[#F8FAFC] hover:bg-surface-hover dark:hover:bg-[#151E31]'
            }`}
          >
            <Filter size={13} className={showFilters ? 'text-brand dark:text-sky-400' : 'text-text-dim dark:text-[#94A3B8]'} />
            <span>{t('dashboard.filters', 'Filters')}</span>
            <ChevronDown size={12} className={`transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── Expandable Quick Filters Strip ─── */}
      {showFilters && (
        <div className="bg-surface dark:bg-[#0F1726] border border-border dark:border-[#1E293B] rounded-xl p-3 grid grid-cols-2 md:grid-cols-4 gap-3 shadow-sm animate-fade-in text-xs">
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-wider text-text-faint dark:text-[#64748B] mb-1">
              {t('dashboard.district', 'District')}
            </label>
            <select
              value={filterDistrict}
              onChange={(e) => setFilterDistrict(e.target.value)}
              className="w-full bg-surface-2 dark:bg-[#151E31] border border-border dark:border-[#26334A] rounded-md p-1.5 text-xs text-text dark:text-[#F8FAFC] outline-none"
            >
              <option value="ALL">All Districts</option>
              <option value="Khordha">Khordha</option>
              <option value="Cuttack">Cuttack</option>
              <option value="Sundargarh">Sundargarh</option>
              <option value="Puri">Puri</option>
              <option value="Ganjam">Ganjam</option>
            </select>
          </div>

          <div>
            <label className="block text-[9px] font-bold uppercase tracking-wider text-text-faint dark:text-[#64748B] mb-1">
              {t('dashboard.category', 'Crime Category')}
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full bg-surface-2 dark:bg-[#151E31] border border-border dark:border-[#26334A] rounded-md p-1.5 text-xs text-text dark:text-[#F8FAFC] outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="Theft">Theft</option>
              <option value="Cyber">Cyber Crime</option>
              <option value="Extortion">Extortion</option>
              <option value="Burglary">Burglary</option>
              <option value="Assault">Assault</option>
            </select>
          </div>

          <div>
            <label className="block text-[9px] font-bold uppercase tracking-wider text-text-faint dark:text-[#64748B] mb-1">
              {t('dashboard.priority', 'Priority')}
            </label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full bg-surface-2 dark:bg-[#151E31] border border-border dark:border-[#26334A] rounded-md p-1.5 text-xs text-text dark:text-[#F8FAFC] outline-none"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setFilterDistrict('ALL');
                setFilterCategory('ALL');
                setFilterPriority('ALL');
              }}
              className="w-full bg-surface-2 dark:bg-[#151E31] border border-border dark:border-[#26334A] text-text-dim dark:text-[#94A3B8] hover:text-text p-1.5 rounded-md font-medium text-xs transition-colors"
            >
              {t('dashboard.resetFilters', 'Reset Filters')}
            </button>
          </div>
        </div>
      )}

      {/* ─── 2. FOCUSED INTELLIGENCE SUMMARY STRIP (4 PRIMARY + SECONDARY TELEMETRY) ─── */}
      <IntelligenceSummaryKpis
        stats={{
          totalFirs,
          activeCases,
          casesClosed,
          pendingCases,
          overdueWork,
          highPriority,
          activeOfficers,
          intelAlerts,
        }}
      />

      {/* ─── 3. ACTION REQUIRED OPERATIONAL STRIP ─── */}
      <ActionRequiredStrip />

      {/* ─── 4. PRIMARY ANALYTICS ROW (3 BALANCED COLUMNS) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        {/* Col 1: FIR Registration Trend */}
        <div className="min-h-[260px]">
          <FirRegistrationTrendChart />
        </div>

        {/* Col 2: Cases by Crime Category */}
        <div className="min-h-[260px]">
          <CrimeCategoryDonutChart />
        </div>

        {/* Col 3: Crime Hotspots (GIS Map) */}
        <div className="min-h-[260px]">
          <CrimeHotspotGisMap />
        </div>
      </div>

      {/* ─── 5. SECONDARY OPERATIONAL ANALYTICS ROW (3 COLUMNS) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
        {/* Col 1: Explainable D3 Cross-Station Links */}
        <div className="min-h-[260px]">
          <CrossStationD3Network />
        </div>

        {/* Col 2: Active Investigations Board */}
        <div className="min-h-[260px]">
          <ActiveInvestigationsTable />
        </div>

        {/* Col 3: Intelligence Alerts Live Feed */}
        <div className="min-h-[260px]">
          <IntelligenceAlertsFeed />
        </div>
      </div>

      {/* ─── 6. DETAILED ANALYTICAL TELEMETRY: INVESTIGATION TEAM PERFORMANCE ─── */}
      <OfficerPerformanceAnalytics />

      {/* ─── 7. MODALS & POPUPS ─── */}

      {/* Add Officer Modal */}
      {showAddOfficerModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleAddOfficerSubmit}
            className="bg-surface dark:bg-[#0F1726] border border-border dark:border-[#1E293B] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-xs animate-fade-in"
          >
            <div className="flex items-center justify-between border-b border-border-soft dark:border-[#1E293B] pb-2">
              <h3 className="font-bold text-sm text-text dark:text-[#F8FAFC]">
                Deploy Station Investigator
              </h3>
              <button
                type="button"
                onClick={() => setShowAddOfficerModal(false)}
                className="text-text-dim hover:text-text font-bold text-lg"
              >
                &times;
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[9px] uppercase font-bold text-text-dim tracking-wider mb-1">
                  Station
                </label>
                <input
                  type="text"
                  readOnly
                  value={`${myStation?.name} [${myStationId}]`}
                  className="w-full bg-surface-2 dark:bg-[#151E31] border border-border dark:border-[#26334A] rounded p-2 text-text-faint outline-none font-mono cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase font-bold text-text-dim tracking-wider mb-1">
                  Officer Name
                </label>
                <input
                  required
                  type="text"
                  value={newOfficerName}
                  onChange={(e) => setNewOfficerName(e.target.value)}
                  placeholder="e.g. SI Priyadarshini Nayak"
                  className="w-full bg-surface-2 dark:bg-[#151E31] border border-border dark:border-[#26334A] rounded p-2 text-text dark:text-[#F8FAFC] outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase font-bold text-text-dim tracking-wider mb-1">
                  Rank
                </label>
                <select
                  value={newOfficerRank}
                  onChange={(e) => setNewOfficerRank(e.target.value)}
                  className="w-full bg-surface-2 dark:bg-[#151E31] border border-border dark:border-[#26334A] rounded p-2 text-text dark:text-[#F8FAFC] outline-none"
                >
                  <option value="Inspector">Inspector</option>
                  <option value="Sub-Inspector">Sub-Inspector</option>
                  <option value="Asst. Sub-Inspector">Asst. Sub-Inspector</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddOfficerModal(false)}
                className="flex-1 bg-surface-2 dark:bg-[#151E31] border border-border dark:border-[#26334A] font-bold py-2 rounded-lg hover:bg-surface-hover"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-brand text-white font-bold py-2 rounded-lg hover:bg-brand-bright transition-colors"
              >
                Save Officer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Case Reassignment Modal */}
      {assigningCase && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface dark:bg-[#0F1726] border border-border dark:border-[#1E293B] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-xs animate-fade-in">
            <div className="flex items-center justify-between border-b border-border-soft dark:border-[#1E293B] pb-2">
              <h3 className="font-bold text-sm text-text dark:text-[#F8FAFC]">
                Assign Case Investigator
              </h3>
              <button
                type="button"
                onClick={() => setAssigningCase(null)}
                className="text-text-dim hover:text-text font-bold text-lg"
              >
                &times;
              </button>
            </div>
            <div className="space-y-1 text-text-dim">
              <p><strong>Case ID:</strong> {assigningCase.id}</p>
              <p><strong>Title:</strong> {assigningCase.title}</p>
              <p><strong>Priority:</strong> {assigningCase.priority}</p>
            </div>
            <div>
              <label className="block text-[9px] uppercase font-bold text-text-dim tracking-wider mb-1.5">
                Select New Investigator
              </label>
              <select
                value={newOfficerId}
                onChange={(e) => setNewOfficerId(e.target.value)}
                className="w-full bg-surface-2 dark:bg-[#151E31] border border-border dark:border-[#26334A] rounded p-2 text-text dark:text-[#F8FAFC] outline-none"
              >
                <option value="">-- Select Officer --</option>
                {stationOfficers.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} ({o.rank})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAssigningCase(null)}
                className="flex-1 bg-surface-2 dark:bg-[#151E31] border border-border dark:border-[#26334A] font-bold py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReassign}
                disabled={!newOfficerId}
                className="flex-1 bg-brand text-white font-bold py-2 rounded-lg hover:bg-brand-bright disabled:opacity-50"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
