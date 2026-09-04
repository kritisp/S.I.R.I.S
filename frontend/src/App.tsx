import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LanguageProvider } from './context/LanguageContext';

// SIH Layout & Pages
import { SIHLayout } from './components/layout/SIHLayout';
import { Login } from './pages/Login';
import { CommandCenter } from './pages/CommandCenter';
import { RegisterFIR } from './pages/RegisterFIR';
import { CaseWorkspace } from './pages/CaseWorkspace';
import { EvidenceVault } from './pages/EvidenceVault';
import { AccessRequests } from './pages/AccessRequests';
import { InvestigationAssistant } from './pages/InvestigationAssistant';
import { Analytics } from './pages/Analytics';
import { NetworkExplorer } from './pages/NetworkExplorer';
import { Stations } from './pages/Stations';
import { Investigators } from './pages/Investigators';
import { Cases } from './pages/Cases';
import { CaseSearch } from './pages/CaseSearch';
import { LiveNews } from './pages/LiveNews';
import { LegalIntelligence } from './pages/LegalIntelligence';
import { CCTVModule } from './pages/CCTVModule';
import { GeoTrailPage } from './pages/GeoTrailPage';
import { MoneyTrailWorkspace } from './components/intelligence/MoneyTrailWorkspace';
import { IdentityReviewPage } from './pages/IdentityReviewPage';
import { AnomalyRadarPage } from './pages/AnomalyRadarPage';
import { GisCrimeMapPage } from './pages/GisCrimeMapPage';
import { CdrIntelligencePage } from './pages/CdrIntelligencePage';
import { IntelligenceFusionPage } from './pages/IntelligenceFusionPage';
import { PredictiveRiskPage } from './pages/PredictiveRiskPage';
import { ResourceOptimizationPage } from './pages/ResourceOptimizationPage';
import { StateCommandSupervisorPage } from './pages/StateCommandSupervisorPage';
import { SupervisorFleetDispatchPage } from './pages/SupervisorFleetDispatchPage';
import { SupervisorPerformancePage } from './pages/SupervisorPerformancePage';
import { SupervisorAssignmentPage } from './pages/SupervisorAssignmentPage';
import { SupervisorApprovalsPage } from './pages/SupervisorApprovalsPage';
import { SupervisorEscalationsPage } from './pages/SupervisorEscalationsPage';
import { SupervisorAuditPage } from './pages/SupervisorAuditPage';
import { useMockState } from './mockServices/MockStateContext';

function DashboardRouter() {
  const { state } = useMockState();
  const role = state.currentUser?.role;
  if (role === 'SUPER_ADMIN') {
    return <Navigate to="/supervisor/ops" replace />;
  }
  return <CommandCenter />;
}

function CaseAssignmentRouter() {
  const { state } = useMockState();

  const role = state.currentUser?.role;
  if (role === 'SUPER_ADMIN') {
    return <Navigate to="/supervisor/assignment" replace />;
  }
  return <Cases />;
}

function SanctionsRouter() {
  const { state } = useMockState();
  const role = state.currentUser?.role;
  if (role === 'SUPER_ADMIN') {
    return <Navigate to="/supervisor/approvals" replace />;
  }
  return <AccessRequests />;
}

function EmergencyBroadcastRouter() {
  const { state } = useMockState();
  const role = state.currentUser?.role;
  if (role === 'SUPER_ADMIN') {
    return <Navigate to="/supervisor/escalations" replace />;
  }
  return <CommandCenter />;
}

function AuditReportsRouter() {
  const { state } = useMockState();
  const role = state.currentUser?.role;
  if (role === 'SUPER_ADMIN') {
    return <Navigate to="/supervisor/audit" replace />;
  }
  return <Analytics />;
}

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <LanguageProvider>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route element={<SIHLayout />}>
              <Route path="/dashboard" element={<DashboardRouter />} />
              <Route path="/supervisor" element={<StateCommandSupervisorPage />} />
              <Route path="/supervisor/:tabId" element={<StateCommandSupervisorPage />} />

              {/* Legacy paths (kept for backward compatibility) */}
              <Route path="/dispatch" element={<SupervisorFleetDispatchPage />} />
              <Route path="/performance" element={<SupervisorPerformancePage />} />
              <Route path="/assignment" element={<SupervisorAssignmentPage />} />
              <Route path="/approvals" element={<SupervisorApprovalsPage />} />
              <Route path="/escalations" element={<SupervisorEscalationsPage />} />
              <Route path="/audit" element={<SupervisorAuditPage />} />
              {/* Super Admin Routes */}
              <Route path="/stations" element={<Stations />} />

              {/* IIC Routes */}
              <Route path="/investigators" element={<SupervisorPerformancePage />} />


              {/* Investigations */}
              <Route path="/cases" element={<CaseAssignmentRouter />} />

              <Route path="/case-search" element={<CaseSearch />} />
              <Route path="/cases/search" element={<Navigate to="/case-search" replace />} />
              <Route path="/cases/new" element={<RegisterFIR />} />
              <Route path="/cases/:id" element={<CaseWorkspace />} />
              <Route path="/workspace/case/:id" element={<CaseWorkspace />} />
              <Route path="/investigations" element={<Navigate to="/cases" replace />} />
              <Route path="/investigations/:id" element={<Navigate to="/cases/:id" replace />} />

              {/* Intelligence */}
              <Route path="/intelligence/alerts" element={<EmergencyBroadcastRouter />} />
              <Route path="/intelligence-fusion" element={<IntelligenceFusionPage />} />
              <Route path="/predictive-risk" element={<PredictiveRiskPage />} />
              <Route path="/resource-optimization" element={<ResourceOptimizationPage />} />
              <Route path="/network" element={<NetworkExplorer />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/news" element={<LiveNews />} />
              <Route path="/knowledge" element={<Navigate to="/network" replace />} />
              <Route path="/assistant" element={<InvestigationAssistant />} />
              <Route path="/legal" element={<LegalIntelligence />} />
              <Route path="/trail" element={<GeoTrailPage />} />
              <Route path="/map" element={<GisCrimeMapPage />} />
              <Route path="/money-trail" element={<MoneyTrailWorkspace />} />
              <Route path="/cdr" element={<CdrIntelligencePage />} />
              <Route path="/identity-review" element={<IdentityReviewPage />} />
              <Route path="/anomalies" element={<AnomalyRadarPage />} />




              {/* Operations & Reports */}
              <Route path="/requests" element={<SanctionsRouter />} />

              <Route path="/evidence" element={<EvidenceVault />} />
              <Route path="/reports" element={<AuditReportsRouter />} />
              <Route path="/cctv" element={<CCTVModule />} />
            </Route>
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>

        </LanguageProvider>
      </ErrorBoundary>

    </BrowserRouter>
  );
}

export default App;
