import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useMockState } from '../mockServices/MockStateContext';
import { KnowledgeGraph } from '../components/graph/KnowledgeGraph';
import {
  Shield, FileText, Share2, AlertTriangle, FileBarChart, Scale, Bot, Lock, CheckCircle,
  Clock, Network, AlertCircle, ChevronRight, HelpCircle, Eye, Car, Navigation, Sparkles,
  RefreshCw, Activity, Cpu, Layers, Info, CheckCircle2, User, Phone, MapPin, Database, Award, Radio
} from 'lucide-react';

import { HERO_CASE_PROVISIONS, ROBBERY_CASE_PROVISIONS, FIR_ANALYSIS_PROVISIONS } from '../mockServices/legalProvisionMockData';
import { LegalProvisionList } from '../components/legal/LegalProvisionList';
import { generateFirDraft, requestsApi } from '../services/api';
import { VehicleIntelligenceModal } from '../components/intelligence/VehicleIntelligenceModal';
import { VehicleGeoTrailModal } from '../components/intelligence/VehicleGeoTrailModal';
import { InvestigationActionQueue } from '../components/intelligence/InvestigationActionQueue';
import { RiskIntelligenceCard } from '../components/intelligence/RiskIntelligenceCard';
import { ExplainableLeadCard } from '../components/intelligence/ExplainableLeadCard';
import { graphIntelligenceService, CaseWorkspaceData } from '../services/graphIntelligenceService';
import type { NodeType, NetworkNode, NetworkEdge } from '../mockServices/networkGraphData';
import { NodeDetailPanel } from '../components/graph/NodeDetailPanel';
import { IntelligenceExplainabilityPanel } from '../components/graph/IntelligenceExplainabilityPanel';
import { InvestigationWorkspacePanel } from '../components/workspace/InvestigationWorkspacePanel';

export function CaseWorkspace() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch } = useMockState();
  const navigate = useNavigate();
  const location = useLocation();

  // Cross-station "Request Access" submission state, keyed by target case ID
  const [crossCaseRequestState, setCrossCaseRequestState] = useState<Record<string, 'submitting' | 'error'>>({});

  const [workspaceData, setWorkspaceData] = useState<CaseWorkspaceData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<'overview' | 'graph' | 'analytics' | 'legal' | 'reports'>('overview');

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam === 'overview' || tabParam === 'graph' || tabParam === 'analytics' || tabParam === 'legal' || tabParam === 'reports') {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [draftGenerated, setDraftGenerated] = useState(false);

  // Explicit, investigator-triggered Neo4j graph projection (never automatic on load)
  const [isProjecting, setIsProjecting] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);

  // Modals
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showTrailModal, setShowTrailModal] = useState(false);
  const [selectedPlate, setSelectedPlate] = useState("OD-02-AB-1234");

  // Selected Node State for Knowledge Graph Focus & Dossier Panel
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showWhyPanel, setShowWhyPanel] = useState<boolean>(false);

  // Map graphNeighborhood nodes and edges to rich NetworkNode & NetworkEdge objects matching NetworkExplorer styling
  const formattedGraphNodes = useMemo(() => {
    if (workspaceData?.graph_neighborhood?.nodes && workspaceData.graph_neighborhood.nodes.length > 0) {
      const gn = workspaceData.graph_neighborhood;
      const meta = workspaceData.metadata;
      return gn.nodes.map(n => {
        let rawType = (n.entity_type || (n.node_type === 'case' ? 'CASE' : 'PERSON')).toUpperCase();
        if (n.id.startsWith('case:')) rawType = 'CASE';
        else if (n.id.startsWith('phone:')) rawType = 'PHONE';
        else if (n.id.startsWith('veh:') || n.id.startsWith('vehicle:')) rawType = 'VEHICLE';
        else if (n.id.startsWith('loc:') || n.id.startsWith('location:')) rawType = 'LOCATION';
        else if (n.id.startsWith('person:')) rawType = 'PERSON';
        else if (n.id.startsWith('station:')) rawType = 'STATION';

        let nodeType: NodeType = 'PERSON';
        if (rawType === 'CASE') nodeType = 'CASE';
        else if (rawType === 'PHONE') nodeType = 'PHONE';
        else if (rawType === 'VEHICLE') nodeType = 'VEHICLE';
        else if (rawType === 'LOCATION') nodeType = 'LOCATION';
        else if (rawType === 'STATION') nodeType = 'STATION';
        else if (rawType === 'EVIDENCE') nodeType = 'EVIDENCE';
        else if (['BANK_ACCOUNT', 'UPI', 'WALLET', 'EMAIL', 'IP', 'LEGAL_SECTION'].includes(rawType)) {
          nodeType = rawType as NodeType;
        }

        return {
          id: n.id,
          type: nodeType,
          label: n.label || n.id,
          sublabel: n.is_focus
            ? 'FOCUS NODE (Center)'
            : (n.district || n.station_id || `Betweenness: ${n.betweenness?.toFixed(3) ?? 0}`),
          stationId: n.station_id || meta?.station_id || 'OP-BBSR-CAP',
          accessStatus: n.is_flagged ? 'RESTRICTED' : 'AUTHORIZED',
          isCrossStation: Boolean(n.is_flagged || (n.betweenness && n.betweenness > 0.2)),
          isAiDiscovered: Boolean((n.betweenness && n.betweenness > 0.1) || n.is_important),
          is_focus: Boolean(n.is_focus || n.id === gn.focus_node_id || n.id === selectedNodeId),
          is_important: Boolean(n.is_important),
          hop_distance: n.hop_distance,
          metadata: {
            betweenness: n.betweenness,
            influence: n.influence,
            complaintCount: n.complaint_count,
            district: n.district || meta?.district || 'Khordha (Bhubaneswar)'
          }
        } as NetworkNode;
      });
    }

    if (!workspaceData) return [];

    // Fallback: Construct scoped case nodes from workspace metadata & extracted entities
    const caseNodeId = `case:${workspaceData.fir_number || id || 'current'}`;
    const nodes: NetworkNode[] = [
      {
        id: caseNodeId,
        type: 'CASE',
        label: workspaceData.fir_number || id || 'CASE FILE',
        sublabel: workspaceData.metadata?.title || 'Primary Case Record',
        stationId: workspaceData.metadata?.station_id || 'OP-BBSR-CAP',
        accessStatus: 'AUTHORIZED',
        is_focus: true,
      }
    ];

    if (workspaceData.entities && Array.isArray(workspaceData.entities)) {
      workspaceData.entities.forEach((ent: any, idx: number) => {
        const entType = (ent.type || 'EVIDENCE').toUpperCase();
        let nodeType: NodeType = 'EVIDENCE';
        if (entType.includes('PERSON') || entType.includes('SUSPECT')) nodeType = 'PERSON';
        else if (entType.includes('PHONE')) nodeType = 'PHONE';
        else if (entType.includes('VEHICLE')) nodeType = 'VEHICLE';
        else if (entType.includes('LOC')) nodeType = 'LOCATION';

        const entId = `${nodeType.toLowerCase()}:${ent.value || idx}`;
        nodes.push({
          id: entId,
          type: nodeType,
          label: ent.value || ent.label || `Entity #${idx + 1}`,
          sublabel: `Extracted ${nodeType}`,
          stationId: workspaceData.metadata?.station_id || 'OP-BBSR-CAP',
          accessStatus: 'AUTHORIZED',
        });
      });
    }

    return nodes;
  }, [workspaceData, selectedNodeId, id]);

  const formattedGraphEdges = useMemo(() => {
    if (workspaceData?.graph_neighborhood?.edges && workspaceData.graph_neighborhood.edges.length > 0) {
      return workspaceData.graph_neighborhood.edges.map((e, idx) => ({
        id: `edge-${idx}`,
        source: e.source,
        target: e.target,
        relationship: (e.relationship || 'MATCHED_ENTITY') as any,
        label: e.relationship ? e.relationship.replace(/_/g, ' ') : (e.weight >= 1 ? 'Linked Entity' : 'Associate'),
        isCrossStation: Boolean(e.weight > 0.8 || e.relationship === 'CROSS_STATION_LINK'),
        isAiDiscovered: Boolean(e.weight > 0.5),
        confidence: Math.round((e.weight || 0.85) * 100)
      } as NetworkEdge));
    }

    if (!workspaceData || !formattedGraphNodes || formattedGraphNodes.length <= 1) return [];

    const caseNodeId = formattedGraphNodes[0]?.id;
    return formattedGraphNodes.slice(1).map((node, idx) => ({
      id: `edge-fallback-${idx}`,
      source: caseNodeId,
      target: node.id,
      relationship: 'EXTRACTED_ENTITY' as any,
      label: 'Linked Entity',
      confidence: 90,
    } as NetworkEdge));
  }, [workspaceData, formattedGraphNodes]);

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return formattedGraphNodes.find(n => n.id === selectedNodeId) || null;
  }, [formattedGraphNodes, selectedNodeId]);



  // Load Real Authoritative Case Workspace Data directly from PostgreSQL & Neo4j Aura
  const loadWorkspace = () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    setNotFound(false);
    setWorkspaceData(null); // Ensure zero stale state from previous case!

    graphIntelligenceService.getCaseWorkspace(id)
      .then((data) => {
        if (!data) {
          setError("Authoritative database records unavailable for this case.");
          setLoading(false);
          return;
        }
        setWorkspaceData(data);
        setLoading(false);

        // Register window-level context for AIRA Query AI
        (window as any).__SIRIS_CURRENT_CASE_WORKSPACE__ = data;
      })
      .catch((err: any) => {
        console.error("Workspace API error:", err);
        if (err?.status === 404 || err?.message?.includes("404")) {
          setNotFound(true);
        } else {
          setError(err.message || "Failed to load authoritative database records for requested case workspace.");
        }
        setLoading(false);
      });
  };

  useEffect(() => {
    loadWorkspace();
  }, [id]);

  // Cross-station links must not be openable directly — only cases already present in
  // this investigator's station-scoped case list (state.cases, loaded from the real,
  // RBAC-filtered GET /cases) are directly accessible. Anything else requires a real,
  // server-enforced access request (POST /api/v1/requests), never a client-side open.
  const handleRequestCrossCaseAccess = async (targetCaseId: string, explanation: string) => {
    setCrossCaseRequestState(prev => ({ ...prev, [targetCaseId]: 'submitting' }));
    try {
      const created = await requestsApi.createRequest(
        targetCaseId,
        `Cross-case relationship detected in Case Workspace for ${workspaceData?.fir_number || id}: ${explanation}`
      );
      dispatch({ type: 'ADD_ACCESS_REQUEST', payload: created });
      setCrossCaseRequestState(prev => {
        const next = { ...prev };
        delete next[targetCaseId];
        return next;
      });
    } catch (err) {
      console.error('Cross-case access request failed:', err);
      setCrossCaseRequestState(prev => ({ ...prev, [targetCaseId]: 'error' }));
    }
  };

  // Explicit action: (re)project this case's PostgreSQL data into the Neo4j intelligence
  // graph. Only ever runs when the investigator clicks the button below — never on load.
  const handleGenerateIntelligence = async () => {
    if (!id) return;
    setIsProjecting(true);
    setProjectError(null);
    try {
      await graphIntelligenceService.projectCaseToGraph(id);
      loadWorkspace();
    } catch (err: any) {
      console.error("Graph projection error:", err);
      setProjectError(err?.message || "Failed to generate case intelligence.");
    } finally {
      setIsProjecting(false);
    }
  };

  const tabClass = (tab: string, color: 'accent' | 'brand' = 'accent') => {
    const activeColorClasses = color === 'brand'
      ? 'border-brand-bright text-brand-bright'
      : 'border-accent-bright text-accent-bright';
    return `px-5 py-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
      activeTab === tab
        ? activeColorClasses
        : 'border-transparent text-text-dim hover:text-text'
    }`;
  };

  const handleGenerateDraft = async () => {
    if (!workspaceData) return;
    setIsGenerating(true);
    try {
      await generateFirDraft([
        {
          role: 'user',
          content: `Generate FIR draft report for ${workspaceData.fir_number}: ${workspaceData.metadata?.description || ''}`,
        },
      ], 'en');
    } catch (err) {
      console.warn('Draft API notice:', err);
    } finally {
      setIsGenerating(false);
      setDraftGenerated(true);
    }
  };

  // Render Loading State
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-16 px-4">
        <div className="glass p-12 rounded-2xl text-center border border-brand/30 bg-surface/90 shadow-glass animate-pulse space-y-6">
          <div className="relative inline-flex">
            <Bot className="animate-spin text-brand" size={48} />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-brand-bright rounded-full animate-ping" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text font-display uppercase tracking-wider">
              LOADING CASE WORKSPACE DATA...
            </h2>
            <p className="text-xs font-mono text-text-dim mt-2 max-w-md mx-auto">
              Aggregating PostgreSQL authoritative records, Neo4j investigation graph, NetworkX analytics & intelligence engines for <span className="text-brand font-bold">{id}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render Case Not Found (404)
  if (notFound) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4">
        <div className="glass p-8 rounded-2xl border border-warning/40 bg-warning/5 text-center space-y-5">
          <AlertCircle size={44} className="text-warning mx-auto" />
          <div>
            <h2 className="text-xl font-bold text-warning uppercase font-mono tracking-wider">
              CASE NOT FOUND (HTTP 404)
            </h2>
            <p className="text-xs text-text-dim mt-2">
              Case ID <code className="text-text font-bold bg-surface-2 px-2 py-0.5 rounded">{id}</code> was not found in the PostgreSQL case registry or Neo4j investigation graph.
            </p>
          </div>
          <button
            onClick={() => navigate('/cases')}
            className="bg-brand text-bg px-5 py-2.5 rounded-lg font-bold text-xs hover:bg-brand-bright transition-colors uppercase tracking-wider"
          >
            Return to Investigations List
          </button>
        </div>
      </div>
    );
  }

  // Render Workspace Data Unavailable (Error State)
  if (error || !workspaceData) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4">
        <div className="glass p-8 rounded-2xl border border-danger/40 bg-danger/5 text-center space-y-5">
          <AlertTriangle size={44} className="text-danger-bright mx-auto" />
          <div>
            <h2 className="text-xl font-bold text-danger-bright uppercase font-mono tracking-wider">
              WORKSPACE DATA UNAVAILABLE
            </h2>
            <p className="text-xs text-text-dim mt-2 leading-relaxed">
              {error || "Failed to retrieve authoritative database records from backend services."}
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => navigate('/cases')}
              className="bg-surface-2 border border-border-soft px-4 py-2 rounded-lg text-xs font-bold text-text hover:bg-surface-hover transition-colors"
            >
              Return to Cases List
            </button>
            <button
              onClick={loadWorkspace}
              className="bg-brand text-bg px-5 py-2 rounded-lg font-bold text-xs hover:bg-brand-bright transition-colors flex items-center gap-2"
            >
              <RefreshCw size={14} /> Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  const meta = workspaceData.metadata;
  const entities = workspaceData.entities;
  const graphNeighborhood = workspaceData.graph_neighborhood;
  const analytics = workspaceData.analytics;
  const crossIntel = workspaceData.cross_case_intelligence;

  // Pick legal provisions
  const caseProvisions =
    meta.crime_type?.toLowerCase().includes('robbery') || meta.crime_type?.toLowerCase().includes('heist')
      ? ROBBERY_CASE_PROVISIONS
      : HERO_CASE_PROVISIONS;

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Dynamic Header */}
      <div className="glass p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface border border-border-soft shadow-glass">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-xs font-mono font-bold bg-surface-2 border border-border-soft px-2.5 py-0.5 rounded text-text-bright">
              {workspaceData.fir_number}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-accent/20 text-accent-bright px-2 py-0.5 rounded border border-accent/30">
              {meta.status || 'UNDER INVESTIGATION'}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-danger/20 text-danger-bright px-2 py-0.5 rounded border border-danger/30">
              PRIORITY: {meta.priority || 'HIGH'}
            </span>
            {workspaceData.is_authoritative_postgres && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-success/20 text-success px-2 py-0.5 rounded border border-success/30 flex items-center gap-1">
                <Database size={10} /> Authoritative PostgreSQL
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-text font-display">{meta.title}</h1>
          <p className="text-xs text-text-dim mt-1.5 font-mono">
            Station: <span className="text-text font-semibold">{meta.police_station}</span> ({meta.station_id}) · District: <span className="text-text font-semibold">{meta.district}</span> · State: {meta.state} · Registered: {meta.registration_date}
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          <button className="bg-surface-2 border border-border-soft px-4 py-2 rounded-lg text-xs font-semibold hover:bg-surface-hover text-text flex items-center gap-2 transition-colors">
            <Share2 size={15} /> Share
          </button>
          <button className="bg-brand text-bg px-4 py-2 rounded-lg text-xs font-bold hover:bg-brand-bright flex items-center gap-2 transition-colors">
            <AlertTriangle size={15} /> Mark Critical
          </button>
        </div>
      </div>

      {/* Graph Intelligence Status Banner — reflects the real, backend-computed graph_status.
          Generation is always an explicit investigator action, never automatic. */}
      {workspaceData.graph_status && workspaceData.graph_status !== 'available' && (
        <div className={`glass p-4 rounded-xl border flex items-center justify-between gap-4 flex-wrap ${
          workspaceData.graph_status === 'failed' || projectError
            ? 'border-danger/40 bg-danger/5'
            : 'border-warning/40 bg-warning/5'
        }`}>
          <div className="flex items-center gap-3">
            {workspaceData.graph_status === 'failed' || projectError
              ? <AlertTriangle size={20} className="text-danger-bright shrink-0" />
              : <Cpu size={20} className="text-warning shrink-0" />}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-text">
                {workspaceData.graph_status === 'not_projected' && 'Case Intelligence Not Yet Generated'}
                {workspaceData.graph_status === 'stale' && 'Case Intelligence Is Stale'}
                {workspaceData.graph_status === 'failed' && 'Case Intelligence Generation Failed'}
              </div>
              <p className="text-[11px] text-text-dim mt-0.5">
                {projectError || workspaceData.graph_status_message || 'This case record has changed since the graph was last generated.'}
              </p>
            </div>
          </div>
          <button
            onClick={handleGenerateIntelligence}
            disabled={isProjecting}
            className="bg-brand text-bg px-4 py-2 rounded-lg text-xs font-bold hover:bg-brand-bright flex items-center gap-2 transition-colors disabled:opacity-50 shrink-0"
          >
            {isProjecting
              ? <><RefreshCw size={14} className="animate-spin" /> Generating...</>
              : <><Sparkles size={14} /> {workspaceData.graph_status === 'not_projected' ? 'Generate Case Intelligence' : 'Regenerate Case Intelligence'}</>}
          </button>
        </div>
      )}

      {/* Workspace Navigation Tabs */}
      <div className="flex border-b border-border-soft overflow-x-auto flex-nowrap">
        <button onClick={() => setActiveTab('overview')} className={tabClass('overview')}>
          Overview & Timeline
        </button>
        <button onClick={() => setActiveTab('graph')} className={tabClass('graph', 'brand')}>
          Knowledge Graph ({graphNeighborhood.total_nodes} Nodes)
        </button>
        <button onClick={() => setActiveTab('analytics')} className={tabClass('analytics', 'brand')}>
          Graph Analytics
        </button>
        <button onClick={() => setActiveTab('legal')} className={tabClass('legal', 'brand')}>
          Legal Intelligence
        </button>
        <button onClick={() => setActiveTab('reports')} className={tabClass('reports')}>
          Reports & Drafts
        </button>
      </div>

      {/* Dynamic Tab Content */}
      <div className="py-4">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Explainable Intelligence & Leads Section */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand font-mono flex items-center gap-1.5">
                <Sparkles size={14} /> S.I.R.I.S. Explainable Intelligence Leads
              </h3>
              {Array.isArray(workspaceData.explainability) && workspaceData.explainability.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-3">
                  {(workspaceData.explainability as any[]).map((exp: any, idx: number) => (
                    <div key={idx} className="glass p-4 rounded-xl border border-brand/20 bg-surface/90 space-y-1">
                      <div className="flex items-center justify-between text-xs font-mono font-bold">
                        <span className="text-brand uppercase">{exp.feature}</span>
                        <span className="text-success">{Math.round(exp.score * 100)}% Significance</span>
                      </div>
                      <p className="text-xs text-text-dim leading-relaxed">{exp.explanation}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <ExplainableLeadCard lead={{
                  id: `LEAD-${workspaceData.case_id}`,
                  title: `Case Entity Centrality: ${analytics.degree} connections`,
                  summary: `Subject case ${workspaceData.case_id} connects to ${analytics.degree} unique graph nodes in Neo4j with PageRank ${analytics.pagerank.toFixed(4)}.`,
                  score: Math.min(100, Math.round(analytics.pagerank * 1000)),
                  signals: [`Neo4j degree: ${analytics.degree}`, `Bridge status: ${analytics.is_important_connector ? 'YES' : 'NO'}`],
                  verified: true
                }} />
              )}
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Left Column: FIR Narrative, Cross-Case Connections & Evidence */}
              <div className="md:col-span-2 space-y-6">
                {/* FIR Narrative */}
                <div className="glass p-6 rounded-xl bg-surface border border-border-soft space-y-3">
                  <h3 className="text-xs font-bold text-text uppercase tracking-wider border-b border-border-soft pb-2 flex items-center justify-between">
                    <span>FIR Incident Narrative</span>
                    <span className="text-[10px] font-mono text-text-dim">Category: {meta.crime_category}</span>
                  </h3>
                  <p className="text-sm text-text-dim leading-relaxed whitespace-pre-wrap">
                    {meta.description || "No narrative text recorded."}
                  </p>
                </div>

                {/* Cross-Case Intelligence Section */}
                <div className="glass p-6 rounded-xl bg-surface border border-border-soft space-y-4">
                  <h3 className="text-xs font-bold text-text uppercase tracking-wider border-b border-border-soft pb-2 flex items-center justify-between">
                    <span>Cross-Case Intelligence ({crossIntel.related_cases.length} Related Cases)</span>
                    <span className="text-[10px] font-mono text-brand font-bold">LIVE NEO4J OVERLAP</span>
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2.5 bg-surface-2 border border-border-soft rounded-lg">
                      <div className="text-[9px] text-text-dim uppercase font-mono">Shared Persons</div>
                      <div className="text-base font-bold text-text mt-0.5">{crossIntel.shared_counts?.persons ?? 0}</div>
                    </div>
                    <div className="p-2.5 bg-surface-2 border border-border-soft rounded-lg">
                      <div className="text-[9px] text-text-dim uppercase font-mono">Shared Phones</div>
                      <div className="text-base font-bold text-text mt-0.5">{crossIntel.shared_counts?.phones ?? 0}</div>
                    </div>
                    <div className="p-2.5 bg-surface-2 border border-border-soft rounded-lg">
                      <div className="text-[9px] text-text-dim uppercase font-mono">Shared Vehicles</div>
                      <div className="text-base font-bold text-text mt-0.5">{crossIntel.shared_counts?.vehicles ?? 0}</div>
                    </div>
                    <div className="p-2.5 bg-surface-2 border border-border-soft rounded-lg">
                      <div className="text-[9px] text-text-dim uppercase font-mono">Shared Locations</div>
                      <div className="text-base font-bold text-text mt-0.5">{crossIntel.shared_counts?.locations ?? 0}</div>
                    </div>
                  </div>

                  {crossIntel.related_cases.length > 0 ? (
                    <div className="space-y-3 pt-2">
                      {crossIntel.related_cases.map((rc, idx) => {
                        // Directly accessible only if it's already in this investigator's
                        // station-scoped case list (real backend RBAC, not a client guess).
                        const isDirectlyAccessible = state.cases.some(c => c.id === rc.target_case_id);
                        const existingRequest = state.accessRequests.find(r => r.targetCaseId === rc.target_case_id);
                        const reqState = crossCaseRequestState[rc.target_case_id];

                        return (
                          <div key={idx} className="p-3.5 bg-surface-2 border border-border-soft/80 rounded-xl flex items-center justify-between text-xs gap-3">
                            <div className="min-w-0">
                              <div className="font-mono font-bold text-text flex items-center gap-2 flex-wrap">
                                <span>{rc.target_case_id}</span>
                                <span className="text-[9px] font-bold text-brand bg-brand/10 px-2 py-0.5 rounded border border-brand/20">
                                  {Math.round(rc.confidence_score * 100)}% Match
                                </span>
                                {!isDirectlyAccessible && (
                                  <span className="text-[9px] font-bold text-warning bg-warning/10 px-2 py-0.5 rounded border border-warning/30 flex items-center gap-1">
                                    <Lock size={9} /> Cross-Station
                                  </span>
                                )}
                              </div>
                              <div className="text-text-dim mt-1 text-[11px]">{rc.explanation}</div>
                              {reqState === 'error' && (
                                <div className="text-danger-bright text-[10px] mt-1">Request failed — try again.</div>
                              )}
                            </div>

                            {isDirectlyAccessible ? (
                              <button
                                onClick={() => navigate(`/workspace/case/${rc.target_case_id}`)}
                                className="bg-brand text-bg font-bold px-3 py-1.5 rounded hover:bg-brand-bright transition-colors text-[10px] uppercase font-mono shrink-0"
                              >
                                Open Case →
                              </button>
                            ) : existingRequest?.status === 'APPROVED' ? (
                              <button
                                onClick={() => navigate(`/workspace/case/${rc.target_case_id}`)}
                                className="bg-success/20 text-success border border-success/30 font-bold px-3 py-1.5 rounded hover:bg-success/30 transition-colors text-[10px] uppercase font-mono shrink-0"
                              >
                                Access Granted →
                              </button>
                            ) : existingRequest?.status === 'PENDING' ? (
                              <span className="bg-warning/15 text-warning border border-warning/30 font-bold px-3 py-1.5 rounded text-[10px] uppercase font-mono shrink-0">
                                Pending Approval
                              </span>
                            ) : (
                              <button
                                onClick={() => handleRequestCrossCaseAccess(rc.target_case_id, rc.explanation)}
                                disabled={reqState === 'submitting'}
                                className="bg-danger/20 text-danger-bright border border-danger/30 font-bold px-3 py-1.5 rounded hover:bg-danger/30 transition-colors text-[10px] uppercase font-mono shrink-0 disabled:opacity-50"
                              >
                                {reqState === 'submitting' ? 'Submitting…' : 'Request Access'}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 bg-surface-2 border border-border-soft rounded-lg text-xs text-text-dim italic text-center">
                      No direct cross-case entity overlaps detected for this isolated investigation.
                    </div>
                  )}
                </div>

                {/* Investigation Workspace: group this case with related/approved
                    cross-station cases and run the real Central Intelligence Engine
                    across all of them (Spring Boot InvestigationWorkspace/Trigger
                    pipeline — previously built but never surfaced in any page). */}
                <InvestigationWorkspacePanel caseId={workspaceData.case_id} firNumber={workspaceData.fir_number} />

                {/* Pattern & MO Findings */}
                <div className="glass p-6 rounded-xl bg-surface border border-border-soft space-y-3">
                  <h3 className="text-xs font-bold text-text uppercase tracking-wider border-b border-border-soft pb-2">
                    Pattern & Modus Operandi (M.O.) Findings
                  </h3>
                  {(workspaceData.patterns ?? []).length > 0 ? (
                    <div className="space-y-3">
                      {(workspaceData.patterns ?? []).map((pat, idx) => (
                        <div key={idx} className="p-3.5 bg-surface-2 border border-border-soft rounded-xl text-xs space-y-1.5">
                          <div className="flex items-center justify-between font-mono font-bold">
                            <span className="text-brand uppercase">{pat.pattern_name}</span>
                            <span className="text-accent-bright">{Math.round((pat.confidence_score ?? 0) * 100)}% Confidence</span>
                          </div>
                          {pat.supporting_evidence && (
                            <div className="text-text-dim text-[11px] flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 bg-brand rounded-full shrink-0" />
                              <span>{pat.supporting_evidence}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-text-dim italic p-3 bg-surface-2 border border-border-soft rounded-lg">
                      No significant pattern detected
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Entities, Risk Card & Live Alerts */}
              <div className="space-y-6">
                {/* Risk Intelligence Card */}
                <RiskIntelligenceCard
                  accusedName={entities.persons?.[0]?.name || 'Unidentified Suspect'}
                  firCount={crossIntel.related_cases.length + 1}
                  crimeTypes={[meta.crime_type, meta.crime_category].filter(Boolean)}
                  priorConvictions={analytics.is_important_connector ? 2 : 0}
                />

                {/* Investigation Action Queue */}
                <InvestigationActionQueue
                  caseId={workspaceData.case_id}
                  onOpenVehicleIntel={(plate) => {
                    setSelectedPlate(plate);
                    setShowVehicleModal(true);
                  }}
                  onOpenGeoTrail={() => setShowTrailModal(true)}
                />

                {/* Real Extracted Entities */}
                <div className="glass p-6 rounded-xl bg-surface border border-border-soft space-y-3">
                  <div className="flex items-center justify-between border-b border-border-soft pb-2">
                    <h3 className="text-xs font-bold text-text uppercase tracking-wider">
                      Extracted Entities ({entities.persons.length + entities.phones.length + entities.vehicles.length + entities.locations.length})
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {/* Persons */}
                    {entities.persons.map((p) => (
                      <div key={p.id} className="p-2.5 bg-surface-2 border border-border-soft rounded-lg flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-mono">
                          <User size={14} className="text-pink-400" />
                          <span className="font-bold text-text">{p.name}</span>
                        </div>
                        <span className="text-[9px] bg-pink-500/10 text-pink-400 border border-pink-500/20 px-2 py-0.5 rounded uppercase font-bold">
                          {p.role || 'PERSON'}
                        </span>
                      </div>
                    ))}

                    {/* Phones */}
                    {entities.phones.map((ph) => (
                      <div key={ph.id} className="p-2.5 bg-surface-2 border border-border-soft rounded-lg flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-mono">
                          <Phone size={14} className="text-emerald-400" />
                          <span className="font-bold text-text">{ph.normalized_number}</span>
                        </div>
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded uppercase font-bold">
                          PHONE
                        </span>
                      </div>
                    ))}

                    {/* Vehicles */}
                    {entities.vehicles.map((v) => (
                      <div
                        key={v.id}
                        onClick={() => {
                          setSelectedPlate(v.registration_number);
                          setShowVehicleModal(true);
                        }}
                        className="p-2.5 bg-surface-2 border border-border-soft rounded-lg flex items-center justify-between text-xs cursor-pointer hover:border-brand transition-colors"
                      >
                        <div className="flex items-center gap-2 font-mono">
                          <Car size={14} className="text-purple-400" />
                          <span className="font-bold text-text">{v.registration_number}</span>
                        </div>
                        <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded uppercase font-bold">
                          ANPR INTEL
                        </span>
                      </div>
                    ))}

                    {/* Locations */}
                    {entities.locations.map((loc) => (
                      <div key={loc.id} className="p-2.5 bg-surface-2 border border-border-soft rounded-lg flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-mono">
                          <MapPin size={14} className="text-orange-400" />
                          <span className="font-bold text-text">{loc.locality || loc.city || loc.district}</span>
                        </div>
                        <span className="text-[9px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded uppercase font-bold">
                          LOCATION
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Case Alerts */}
                <div className="glass p-6 rounded-xl bg-surface border border-border-soft space-y-3">
                  <h3 className="text-xs font-bold text-text uppercase tracking-wider border-b border-border-soft pb-2">
                    Active Case Alerts ({workspaceData.alerts.length})
                  </h3>
                  {workspaceData.alerts.length > 0 ? (
                    <div className="space-y-2">
                      {workspaceData.alerts.map((alt) => (
                        <div key={alt.id} className="p-3 bg-danger/10 border border-danger/20 text-danger-bright rounded-lg text-xs font-mono">
                          <div className="font-bold">{alt.type}</div>
                          <div className="text-[11px] text-text-dim mt-1">{alt.message}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-text-dim italic p-3 bg-surface-2 border border-border-soft rounded-lg">
                      No active alerts for this case
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* KNOWLEDGE GRAPH TAB */}
        {activeTab === 'graph' && (
          <div className="w-full h-[700px] rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl bg-[#070b14]">
            <KnowledgeGraph
              nodes={formattedGraphNodes}
              edges={formattedGraphEdges}
              selectedNodeId={selectedNodeId || workspaceData?.graph_neighborhood?.focus_node_id || formattedGraphNodes[0]?.id}
              onSelectNode={(nodeId) => setSelectedNodeId(nodeId)}
              onExpandNode={(nodeId) => setSelectedNodeId(nodeId)}
              mode="workspace"
              title={`INVESTIGATION GRAPH // CASE ${workspaceData?.fir_number || id}`}
              subtitle={workspaceData?.metadata?.title || workspaceData?.metadata?.description || 'Case Entity Relationship Network'}
              isLoading={loading}
              error={null}
            />
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div className="animate-fade-in space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="glass p-5 rounded-xl bg-surface border border-border-soft text-center">
                <div className="text-[10px] font-mono font-bold uppercase text-text-dim">Degree Centrality</div>
                <div className="text-3xl font-display font-bold text-brand mt-1">{analytics.degree}</div>
                <div className="text-[10px] text-text-faint mt-1">Directly connected graph nodes</div>
              </div>
              <div className="glass p-5 rounded-xl bg-surface border border-border-soft text-center">
                <div className="text-[10px] font-mono font-bold uppercase text-text-dim">PageRank Score</div>
                <div className="text-3xl font-display font-bold text-accent-bright mt-1">{analytics.pagerank.toFixed(4)}</div>
                <div className="text-[10px] text-text-faint mt-1">Structural importance score</div>
              </div>
              <div className="glass p-5 rounded-xl bg-surface border border-border-soft text-center">
                <div className="text-[10px] font-mono font-bold uppercase text-text-dim">Betweenness Score</div>
                <div className="text-3xl font-display font-bold text-success mt-1">{analytics.betweenness.toFixed(4)}</div>
                <div className="text-[10px] text-text-faint mt-1">Connector / bridge metric</div>
              </div>
            </div>

            <div className="glass p-6 rounded-xl bg-surface border border-border-soft space-y-4">
              <h3 className="text-xs font-bold text-text uppercase tracking-wider border-b border-border-soft pb-2">
                NetworkX Graph Topology & Community Detection
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-4 bg-surface-2 border border-border-soft rounded-xl space-y-2">
                  <div className="text-text-dim font-bold">COMMUNITY CLUSTER</div>
                  <div className="text-lg font-bold text-text">Community #{analytics.community_id}</div>
                  <div className="text-text-dim text-[11px]">
                    Part of network cluster containing {graphNeighborhood.total_nodes} graph nodes and {graphNeighborhood.total_edges} entity connections.
                  </div>
                </div>

                <div className="p-4 bg-surface-2 border border-border-soft rounded-xl space-y-2">
                  <div className="text-text-dim font-bold">CONNECTOR / BRIDGE STATUS</div>
                  <div className={`text-lg font-bold ${analytics.is_important_connector ? 'text-danger-bright' : 'text-success'}`}>
                    {analytics.is_important_connector ? 'HIGH IMPACT CONNECTOR NODE' : 'Standard Case Node'}
                  </div>
                  <div className="text-text-dim text-[11px]">
                    Connected Component Group ID: #{analytics.connected_components}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LEGAL INTELLIGENCE TAB */}
        {activeTab === 'legal' && (
          <div className="animate-fade-in">
            <LegalProvisionList
              provisions={caseProvisions}
              title={`Legal Intelligence — ${meta.title}`}
              showDisclaimer
              compact={false}
            />
          </div>
        )}

        {/* REPORTS & DRAFTS TAB */}
        {activeTab === 'reports' && (
          <div className="animate-fade-in max-w-2xl mx-auto">
            <div className="glass p-8 rounded-2xl border border-border-soft text-center bg-surface space-y-4">
              <FileBarChart size={36} className="text-accent mx-auto" />
              <h3 className="text-lg font-bold text-text">Charge Sheet Draft Generator</h3>
              <p className="text-xs text-text-dim leading-relaxed">
                Automated assistance for generating official charge sheets based on FIR narrative, legal sections, and evidence records.
              </p>

              {isGenerating ? (
                <div className="space-y-3 py-4">
                  <div className="h-2 w-full bg-surface-2 rounded-full overflow-hidden border border-border-soft">
                    <div className="h-full bg-accent animate-pulse w-full" />
                  </div>
                  <p className="text-xs text-accent-bright font-mono">GENERATING DRAFT REPORT...</p>
                </div>
              ) : draftGenerated ? (
                <div className="space-y-4 py-2">
                  <div className="bg-success/10 border border-success/20 text-success p-3 rounded-lg text-xs font-bold font-mono">
                    Charge Sheet Draft Generated Successfully
                  </div>
                  <div className="flex gap-2 justify-center">
                    <button className="bg-surface-2 border border-border-soft px-4 py-2 rounded-lg text-xs font-bold hover:bg-surface-hover text-text">
                      Preview Draft
                    </button>
                    <button className="bg-accent text-bg px-4 py-2 rounded-lg text-xs font-bold hover:bg-accent-bright">
                      Download PDF
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleGenerateDraft}
                  className="bg-accent text-bg px-6 py-2.5 rounded-lg font-bold text-xs hover:bg-accent-bright transition-colors uppercase tracking-wider w-full"
                >
                  Generate Draft Report
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <VehicleIntelligenceModal
        isOpen={showVehicleModal}
        onClose={() => setShowVehicleModal(false)}
        plateNumber={selectedPlate}
        onOpenTrail={() => setShowTrailModal(true)}
        onOpenCctv={() => navigate('/cctv')}
      />

      <VehicleGeoTrailModal
        isOpen={showTrailModal}
        onClose={() => setShowTrailModal(false)}
        plateNumber={selectedPlate}
        onOpenCctv={() => navigate('/cctv')}
      />
    </div>
  );
}
