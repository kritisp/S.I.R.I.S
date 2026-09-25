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
import { explainableIntelStore } from '../services/explainableIntelService';
import { graphIntelligenceService, CaseWorkspaceData } from '../services/graphIntelligenceService';
import type { NodeType, NetworkNode, NetworkEdge } from '../mockServices/networkGraphData';
import { NodeDetailPanel } from '../components/graph/NodeDetailPanel';
import { IntelligenceExplainabilityPanel } from '../components/graph/IntelligenceExplainabilityPanel';
import { InvestigationWorkspacePanel } from '../components/workspace/InvestigationWorkspacePanel';
import { CrossStationAccessModal } from '../components/workspace/CrossStationAccessModal';
import { CaseEvidenceVaultTab } from '../components/workspace/CaseEvidenceVaultTab';
import { CaseInvestigationCopilot } from '../components/workspace/CaseInvestigationCopilot';
import { InvestigationTimelineLog } from '../components/workspace/InvestigationTimelineLog';
import { AIIntelligenceInsights } from '../components/workspace/AIIntelligenceInsights';

export function CaseWorkspace() {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch } = useMockState();
  const navigate = useNavigate();
  const location = useLocation();

  // Cross-station "Request Access" submission state, keyed by target case ID
  const [crossCaseRequestState, setCrossCaseRequestState] = useState<Record<string, 'submitting' | 'error'>>({});

  // Cross-Station Section 91 Modal State
  const [accessModalOpen, setAccessModalOpen] = useState(false);
  const [modalTargetCase, setModalTargetCase] = useState<{ id: string; stationName: string; reason: string }>({
    id: 'OD-CTC-2026-00981',
    stationName: 'Cuttack City Police Station (OP-CTC-CITY)',
    reason: 'Shared suspect phone +91 98610 99882 & vehicle OD-02-AB-1234'
  });

  const [workspaceData, setWorkspaceData] = useState<CaseWorkspaceData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<'overview' | 'graph' | 'analytics' | 'evidence' | 'legal' | 'reports'>('overview');

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam === 'overview' || tabParam === 'graph' || tabParam === 'analytics' || tabParam === 'evidence' || tabParam === 'legal' || tabParam === 'reports') {
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

  // Open formal Section 91 CrPC / Section 94 BNSS requisition modal
  const handleOpenAccessModal = (targetCaseId: string, explanation: string) => {
    const stationName = targetCaseId.includes('CTC')
      ? 'Cuttack City Police Station (OP-CTC-CITY)'
      : targetCaseId.includes('PURI')
      ? 'Puri Town Police Station (OP-PURI-TOWN)'
      : targetCaseId.includes('ROU')
      ? 'Rourkela Sector-7 Police Station (OP-ROU-SEC7)'
      : targetCaseId.includes('BER')
      ? 'Berhampur Sadar Police Station (OP-BER-SDR)'
      : 'Odisha Police Jurisdiction Authority';

    setModalTargetCase({
      id: targetCaseId,
      stationName,
      reason: explanation || `Direct entity linkage detected across cases: phone/vehicle overlap with ${workspaceData?.fir_number || id}`
    });
    setAccessModalOpen(true);
  };

  const caseLeads = useMemo(() => {
    return explainableIntelStore.getLeadsForCase(workspaceData?.case_id || id || '', workspaceData);
  }, [workspaceData, id]);

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
      <div className="max-w-[1520px] mx-auto p-4 sm:p-6 space-y-4 font-sans select-none text-text dark:text-[#F8FAFC]">
        <div className="p-10 rounded-xl text-center border border-border-soft dark:border-[#1E293B] bg-surface dark:bg-[#0B0F17] shadow-xs animate-pulse space-y-4">
          <div className="relative inline-flex">
            <Bot className="animate-spin text-accent dark:text-[#38BDF8]" size={36} />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-accent dark:bg-[#38BDF8] rounded-full animate-ping" />
          </div>
          <div>
            <h2 className="text-base font-bold text-text dark:text-[#F8FAFC] font-mono uppercase tracking-wider">
              Loading Case Workspace Data...
            </h2>
            <p className="text-xs font-mono text-text-dim dark:text-[#94A3B8] mt-1.5 max-w-md mx-auto">
              Aggregating PostgreSQL authoritative records, Neo4j investigation graph, NetworkX analytics & intelligence engines for <span className="text-accent dark:text-[#38BDF8] font-bold">{id}</span>
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
        <div className="p-6 rounded-xl border border-amber-500/30 bg-amber-500/5 text-center space-y-4">
          <AlertCircle size={36} className="text-amber-400 mx-auto" />
          <div>
            <h2 className="text-base font-bold text-amber-400 uppercase font-mono tracking-wider">
              Case Not Found (HTTP 404)
            </h2>
            <p className="text-xs text-text-dim dark:text-[#94A3B8] mt-1.5">
              Case ID <code className="text-text dark:text-[#F8FAFC] font-bold bg-surface-2 dark:bg-[#0E1422] px-2 py-0.5 rounded">{id}</code> was not found in the PostgreSQL case registry or Neo4j investigation graph.
            </p>
          </div>
          <button
            onClick={() => navigate('/cases')}
            className="bg-accent hover:bg-accent-bright dark:bg-[#38BDF8] dark:hover:bg-[#0284C7] text-bg dark:text-[#070A0F] px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider font-mono cursor-pointer"
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
        <div className="p-6 rounded-xl border border-rose-500/30 bg-rose-500/5 text-center space-y-4">
          <AlertTriangle size={36} className="text-rose-400 mx-auto" />
          <div>
            <h2 className="text-base font-bold text-rose-400 uppercase font-mono tracking-wider">
              Workspace Data Unavailable
            </h2>
            <p className="text-xs text-text-dim dark:text-[#94A3B8] mt-1.5 leading-relaxed">
              {error || "Failed to retrieve authoritative database records from backend services."}
            </p>
          </div>
          <div className="flex justify-center gap-2.5 pt-1 font-mono">
            <button
              onClick={() => navigate('/cases')}
              className="bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] px-3.5 py-1.5 rounded-lg text-xs font-bold text-text dark:text-[#F8FAFC] hover:bg-surface-hover transition-colors cursor-pointer"
            >
              Return to Cases List
            </button>
            <button
              onClick={loadWorkspace}
              className="bg-accent hover:bg-accent-bright dark:bg-[#38BDF8] dark:hover:bg-[#0284C7] text-bg dark:text-[#070A0F] px-4 py-1.5 rounded-lg font-bold text-xs uppercase transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={12} /> Retry Connection
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
    <div className="max-w-[1520px] mx-auto p-4 sm:p-6 space-y-4 font-sans select-none text-text dark:text-[#F8FAFC] pb-24">
      {/* Dynamic Header */}
      <div className="p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] shadow-xs dark:shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-2 dark:bg-[#0E1422] border border-accent/40 dark:border-[#38BDF8]/40 flex items-center justify-center text-accent dark:text-[#38BDF8] shadow-xs">
            <Shield size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-mono font-bold bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] px-2 py-0.5 rounded text-accent dark:text-[#38BDF8]">
                {workspaceData.fir_number}
              </span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-accent/10 dark:bg-[#38BDF8]/10 text-accent dark:text-[#38BDF8] px-2 py-0.5 rounded-full border border-accent/20 dark:border-[#38BDF8]/20">
                {meta.status || 'UNDER INVESTIGATION'}
              </span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-500/10 border border-rose-500/30 text-rose-400 px-2 py-0.5 rounded-full">
                PRIORITY: {meta.priority || 'HIGH'}
              </span>
              {workspaceData.is_authoritative_postgres && (
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Database size={10} /> Authoritative PostgreSQL
                </span>
              )}
            </div>
            <h1 className="text-base sm:text-lg font-bold text-text dark:text-[#F8FAFC] font-mono">{meta.title}</h1>
            <p className="text-xs text-text-dim dark:text-[#94A3B8] mt-0.5 font-mono">
              Station: <span className="text-text dark:text-[#F8FAFC] font-semibold">{meta.police_station}</span> ({meta.station_id}) · District: <span className="text-text dark:text-[#F8FAFC] font-semibold">{meta.district}</span> · Registered: {meta.registration_date}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
          <button className="bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-surface-hover text-text dark:text-[#F8FAFC] flex items-center gap-1.5 transition-colors cursor-pointer">
            <Share2 size={13} /> Share
          </button>
          <button className="bg-rose-500 hover:bg-rose-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase flex items-center gap-1.5 transition-colors cursor-pointer">
            <AlertTriangle size={13} /> Mark Critical
          </button>
        </div>
      </div>

      {/* Graph Intelligence Status Banner */}
      {workspaceData.graph_status && workspaceData.graph_status !== 'available' && (
        <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 flex-wrap ${
          workspaceData.graph_status === 'failed' || projectError
            ? 'border-rose-500/30 bg-rose-500/5'
            : 'border-amber-500/30 bg-amber-500/5'
        }`}>
          <div className="flex items-center gap-2.5">
            {workspaceData.graph_status === 'failed' || projectError
              ? <AlertTriangle size={18} className="text-rose-400 shrink-0" />
              : <Cpu size={18} className="text-amber-400 shrink-0" />}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-text dark:text-[#F8FAFC] font-mono">
                {workspaceData.graph_status === 'not_projected' && 'Case Intelligence Not Yet Generated'}
                {workspaceData.graph_status === 'stale' && 'Case Intelligence Is Stale'}
                {workspaceData.graph_status === 'failed' && 'Case Intelligence Generation Failed'}
              </div>
              <p className="text-[11px] text-text-dim dark:text-[#94A3B8] mt-0.5">
                {projectError || workspaceData.graph_status_message || 'This case record has changed since the graph was last generated.'}
              </p>
            </div>
          </div>
          <button
            onClick={handleGenerateIntelligence}
            disabled={isProjecting}
            className="bg-accent hover:bg-accent-bright dark:bg-[#38BDF8] dark:hover:bg-[#0284C7] text-bg dark:text-[#070A0F] px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase flex items-center gap-1.5 transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
          >
            {isProjecting
              ? <><RefreshCw size={12} className="animate-spin" /> Generating...</>
              : <><Sparkles size={12} /> {workspaceData.graph_status === 'not_projected' ? 'Generate Case Intelligence' : 'Regenerate Case Intelligence'}</>}
          </button>
        </div>
      )}

      {/* Workspace Navigation Tabs */}
      <div className="flex items-center gap-1 bg-surface-2 dark:bg-[#0E1422] p-1 rounded-lg border border-border-soft dark:border-[#1E293B] text-xs font-semibold font-mono self-start overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-1.5 rounded-md transition-all cursor-pointer whitespace-nowrap text-xs ${
            activeTab === 'overview'
              ? 'bg-accent dark:bg-[#38BDF8] text-bg dark:text-[#070A0F] shadow-xs font-bold'
              : 'text-text-dim dark:text-[#94A3B8] hover:text-text dark:hover:text-[#F8FAFC]'
          }`}
        >
          Overview & Timeline
        </button>
        <button
          onClick={() => setActiveTab('graph')}
          className={`px-3 py-1.5 rounded-md transition-all cursor-pointer whitespace-nowrap text-xs ${
            activeTab === 'graph'
              ? 'bg-accent dark:bg-[#38BDF8] text-bg dark:text-[#070A0F] shadow-xs font-bold'
              : 'text-text-dim dark:text-[#94A3B8] hover:text-text dark:hover:text-[#F8FAFC]'
          }`}
        >
          Knowledge Graph ({graphNeighborhood.total_nodes} Nodes)
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-3 py-1.5 rounded-md transition-all cursor-pointer whitespace-nowrap text-xs ${
            activeTab === 'analytics'
              ? 'bg-accent dark:bg-[#38BDF8] text-bg dark:text-[#070A0F] shadow-xs font-bold'
              : 'text-text-dim dark:text-[#94A3B8] hover:text-text dark:hover:text-[#F8FAFC]'
          }`}
        >
          Graph Analytics
        </button>
        <button
          onClick={() => setActiveTab('evidence')}
          className={`px-3 py-1.5 rounded-md transition-all cursor-pointer whitespace-nowrap text-xs flex items-center gap-1.5 ${
            activeTab === 'evidence'
              ? 'bg-accent dark:bg-[#38BDF8] text-bg dark:text-[#070A0F] shadow-xs font-bold'
              : 'text-text-dim dark:text-[#94A3B8] hover:text-text dark:hover:text-[#F8FAFC]'
          }`}
        >
          <Database size={13} />
          Evidence Vault & AI Agent
        </button>
        <button
          onClick={() => setActiveTab('legal')}
          className={`px-3 py-1.5 rounded-md transition-all cursor-pointer whitespace-nowrap text-xs ${
            activeTab === 'legal'
              ? 'bg-accent dark:bg-[#38BDF8] text-bg dark:text-[#070A0F] shadow-xs font-bold'
              : 'text-text-dim dark:text-[#94A3B8] hover:text-text dark:hover:text-[#F8FAFC]'
          }`}
        >
          Legal Intelligence
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-3 py-1.5 rounded-md transition-all cursor-pointer whitespace-nowrap text-xs ${
            activeTab === 'reports'
              ? 'bg-accent dark:bg-[#38BDF8] text-bg dark:text-[#070A0F] shadow-xs font-bold'
              : 'text-text-dim dark:text-[#94A3B8] hover:text-text dark:hover:text-[#F8FAFC]'
          }`}
        >
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
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand font-mono flex items-center gap-1.5">
                  <Sparkles size={14} /> S.I.R.I.S. Explainable Intelligence Leads ({caseLeads.length})
                </h3>
                <span className="text-[10px] font-mono text-text-dim uppercase">
                  Multi-Source Corroborated Evidence
                </span>
              </div>

              {caseLeads.length > 0 ? (
                <div className={`grid ${caseLeads.length > 1 ? 'md:grid-cols-2' : 'grid-cols-1'} gap-4 w-full`}>
                  {caseLeads.map((lead) => (
                    <ExplainableLeadCard key={lead.id} lead={lead} />
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-surface-2 border border-border-soft rounded-xl text-xs text-text-dim italic">
                  No critical explainable leads requiring officer review at this time.
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Left Column: FIR Narrative, Cross-Case Connections, Intelligence Insights & Timeline */}
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
                    <span className="text-[10px] font-mono text-brand font-bold">STATEWIDE OVERLAP</span>
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
                        const isDirectlyAccessible = state.cases.some(c => c.id === rc.target_case_id);
                        const existingRequest = state.accessRequests.find(r => 
                          r.targetCaseId === rc.target_case_id ||
                          (rc.target_case_id && r.targetCaseId.includes(rc.target_case_id)) ||
                          (rc.target_case_id && rc.target_case_id.includes(r.targetCaseId))
                        );
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
                                className="bg-brand text-bg font-bold px-3 py-1.5 rounded hover:bg-brand-bright transition-colors text-[10px] uppercase font-mono shrink-0 cursor-pointer"
                              >
                                Open Case →
                              </button>
                            ) : existingRequest?.status === 'APPROVED' ? (
                              <button
                                onClick={() => navigate(`/workspace/case/${rc.target_case_id}`)}
                                className="bg-success/20 text-success border border-success/30 font-bold px-3 py-1.5 rounded hover:bg-success/30 transition-colors text-[10px] uppercase font-mono shrink-0 cursor-pointer"
                              >
                                Access Granted →
                              </button>
                            ) : existingRequest?.status === 'PENDING' ? (
                              <span className="bg-warning/15 text-warning border border-warning/30 font-bold px-3 py-1.5 rounded text-[10px] uppercase font-mono shrink-0">
                                Pending Approval
                              </span>
                            ) : (
                              <button
                                onClick={() => handleOpenAccessModal(rc.target_case_id, rc.explanation)}
                                className="bg-danger/20 text-danger-bright border border-danger/30 font-bold px-3 py-1.5 rounded hover:bg-danger/30 transition-colors text-[10px] uppercase font-mono shrink-0 cursor-pointer"
                              >
                                Request Cross-Station Access
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

                {/* Central Intelligence Multi-Hop Analysis Engine */}
                <InvestigationWorkspacePanel caseId={workspaceData.case_id} firNumber={workspaceData.fir_number} />

                {/* AI Strategic Intelligence Insights */}
                <AIIntelligenceInsights caseId={workspaceData.case_id} firNumber={workspaceData.fir_number} />

                {/* Investigation Case Diary & Timeline Log */}
                <InvestigationTimelineLog 
                  caseId={workspaceData.case_id} 
                  firNumber={workspaceData.fir_number} 
                  initialEvents={workspaceData.events}
                />

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

              {/* Right Column: Risk Card, Action Queue, Extracted Entities, Alerts & AI Copilot */}
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

                {/* Dedicated Case Investigation Copilot */}
                <CaseInvestigationCopilot caseId={workspaceData.case_id} firNumber={workspaceData.fir_number} />
              </div>
            </div>
          </div>
        )}

        {/* EVIDENCE VAULT & AI AGENT TAB */}
        {activeTab === 'evidence' && (
          <div className="animate-fade-in">
            <CaseEvidenceVaultTab caseId={workspaceData.case_id} firNumber={workspaceData.fir_number} />
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

      {/* Cross-Station Section 91 CrPC / Section 94 BNSS Access Requisition Modal */}
      <CrossStationAccessModal
        isOpen={accessModalOpen}
        onClose={() => setAccessModalOpen(false)}
        targetCaseId={modalTargetCase.id}
        targetStationName={modalTargetCase.stationName}
        overlapReason={modalTargetCase.reason}
        currentCaseId={workspaceData.case_id}
      />

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
