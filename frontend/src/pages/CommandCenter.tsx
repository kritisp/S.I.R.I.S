import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMockState } from '../mockServices/MockStateContext';
import { useLanguage } from '../context/LanguageContext';
import { StationOperationalHeader } from '../components/dashboard/StationOperationalHeader';
import { OperationalMetricStrip } from '../components/dashboard/OperationalMetricStrip';
import { PriorityActionQueue } from '../components/dashboard/PriorityActionQueue';
import { CentralIntelligenceFindings } from '../components/dashboard/CentralIntelligenceFindings';
import { RecentCasesDocket } from '../components/dashboard/RecentCasesDocket';
import { CompactNetworkSnapshot } from '../components/dashboard/CompactNetworkSnapshot';
import { StructuredActivityTimeline } from '../components/dashboard/StructuredActivityTimeline';
import { StatutoryOffenceRankings } from '../components/dashboard/StatutoryOffenceRankings';
import { InfrastructureHealthPanel } from '../components/dashboard/InfrastructureHealthPanel';
import { CaseRecord } from '../mockServices/types';

export function CommandCenter() {
  const { state, refreshBackendData } = useMockState();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const role = state.currentUser?.role || 'OFFICER';
  const myStationId = state.currentUser?.stationId || 'OP-BBSR-CAP';
  const myStation = state.stations.find((s) => s.id === myStationId) || state.stations[0];

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Station Filtered Cases with safe fallback
  const stationCases = useMemo(() => {
    const filtered = state.cases.filter((c) => {
      if (role !== 'SUPER_ADMIN' && c.stationId && c.stationId !== myStationId) return false;
      return true;
    });
    return filtered.length > 0 ? filtered : state.cases;
  }, [state.cases, role, myStationId]);

  const stationOfficers = useMemo(() => {
    const filtered = state.users.filter((u) => u.stationId === myStationId);
    return filtered.length > 0 ? filtered : state.users;
  }, [state.users, myStationId]);

  const pendingRequestsCount = useMemo(() => {
    return state.accessRequests.filter((r) => r.status === 'PENDING').length;
  }, [state.accessRequests]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (refreshBackendData) {
        await refreshBackendData();
      }
    } catch (err) {
      console.warn('Manual refresh notice:', err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in max-w-[1520px] mx-auto pb-24 font-sans select-none text-text">
      
      {/* ── 1. STATION OPERATIONAL COMMAND & IDENTITY HEADER ── */}
      <StationOperationalHeader
        user={state.currentUser}
        station={myStation}
        isRefreshing={isRefreshing}
        onRefresh={handleManualRefresh}
        pendingRequestsCount={pendingRequestsCount}
      />

      {/* ── 2. ACTIONABLE OPERATIONAL METRIC STRIP (5 KPI TILES) ── */}
      <OperationalMetricStrip
        cases={stationCases}
        evidence={state.evidence}
        accessRequests={state.accessRequests}
        officers={stationOfficers}
      />

      {/* ── 3. MAIN INVESTIGATION WORKSPACE GRID (7 COLS : 5 COLS) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left 7 Cols: Priority Action Queue & Active Cases Docket */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <PriorityActionQueue
            cases={stationCases}
            accessRequests={state.accessRequests}
            officers={state.users}
            stations={state.stations}
            onSelectCase={(caseObj) => navigate(`/cases/${caseObj.id}`)}
          />
          <RecentCasesDocket
            cases={stationCases}
            onSelectCase={(caseObj) => navigate(`/cases/${caseObj.id}`)}
          />
        </div>

        {/* Right 5 Cols: Central AI Intel Findings & Live Network Snapshot */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <CentralIntelligenceFindings />
          <CompactNetworkSnapshot />
        </div>
      </div>

      {/* ── 4. LOWER 3-PANEL OPERATIONAL GRID (4 : 4 : 4 COLS) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Panel 1: Activity & Forensic Audit Stream */}
        <div className="lg:col-span-4 h-full">
          <StructuredActivityTimeline />
        </div>

        {/* Panel 2: Statutory Offence Distribution */}
        <div className="lg:col-span-4 h-full">
          <StatutoryOffenceRankings cases={stationCases} />
        </div>

        {/* Panel 3: Microservice & Infrastructure Status */}
        <div className="lg:col-span-4 h-full">
          <InfrastructureHealthPanel />
        </div>
      </div>

    </div>
  );
}
