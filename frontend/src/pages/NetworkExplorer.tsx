import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Network, Search, Filter, Radio, Clock, Shield,
  AlertTriangle, ChevronDown, RefreshCw, X, Info,
  Lock, CheckCircle2, FolderGit2
} from 'lucide-react';
import {
  NetworkNode, NetworkEdge, NodeType
} from '../mockServices/networkGraphData';
import { IntelligenceGraph } from '../components/graph/IntelligenceGraph';
import { NodeDetailPanel } from '../components/graph/NodeDetailPanel';
import { useMockState } from '../mockServices/MockStateContext';
import { workspaceApi, WorkspaceDTO } from '../services/api/workspaceApi';
import { transformResultPayloadToGraph } from '../utils/graphTransform';

// ─── Filter types ─────────────────────────────────────────────────────────────
type StationFilter = 'ALL' | string;
type EntityFilter = 'ALL' | NodeType;
type RelFilter = 'ALL' | 'CROSS_STATION' | 'AI_DISCOVERED' | 'SHARED_PHONE' | 'SHARED_VEHICLE' | 'LINKED_CASE';
type AccessFilter = 'ALL' | 'AUTHORIZED' | 'RESTRICTED';

// ─── Legend ───────────────────────────────────────────────────────────────────
function GraphLegend() {
  const nodeTypes = [
    { color: '#C08A18', label: 'Station' },
    { color: '#2563EB', label: 'Case' },
    { color: '#DB2777', label: 'Person' },
    { color: '#059669', label: 'Phone' },
    { color: '#7C3AED', label: 'Vehicle' },
    { color: '#EA580C', label: 'Location' },
    { color: '#64748B', label: 'Evidence' },
  ];

  return (
    <div className="bg-surface border border-border-soft rounded-xl p-3">
      <div className="text-[10px] uppercase font-bold text-text-faint tracking-wider mb-2">Legend</div>
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-1">
          {nodeTypes.map(t => (
            <div key={t.label} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
              <span className="text-[10px] text-text-dim">{t.label}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-border-soft pt-2 space-y-1">
          <div className="flex items-center gap-2">
            <svg width="28" height="4"><line x1="0" y1="2" x2="28" y2="2" stroke="var(--border-soft)" strokeWidth="1.5"/></svg>
            <span className="text-[10px] text-text-dim">Local link</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="28" height="4"><line x1="0" y1="2" x2="28" y2="2" stroke="var(--danger-bright)" strokeWidth="2" strokeDasharray="6 3"/></svg>
            <span className="text-[10px] text-text-dim">Cross-station</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="28" height="4"><line x1="0" y1="2" x2="28" y2="2" stroke="var(--accent-bright)" strokeWidth="1.5" strokeDasharray="4 3"/></svg>
            <span className="text-[10px] text-text-dim">AI discovered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Lock size={12} className="text-danger-bright" />
            <span className="text-[10px] text-text-dim">Restricted</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={12} className="text-success" />
            <span className="text-[10px] text-text-dim">Authorized</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Graph Summary ─────────────────────────────────────────────────────────────
function SummaryPanel({ summary }: { summary: any }) {
  const items = [
    { label: 'Connected Cases', value: summary.totalCases },
    { label: 'Entities', value: summary.totalEntities },
    { label: 'Stations', value: summary.totalStations },
    { label: 'Cross-Station Links', value: summary.crossStationLinks, highlight: 'text-danger-bright' },
    { label: 'Restricted Records', value: summary.restrictedRecords, highlight: 'text-warning' },
    { label: 'AI Discovered Links', value: summary.aiDiscoveredLinks, highlight: 'text-accent-bright' },
  ];

  return (
    <div className="bg-surface border border-border-soft rounded-xl p-3">
      <div className="text-[10px] uppercase font-bold text-text-faint tracking-wider mb-2 flex items-center gap-1.5">
        <Radio size={10} className="text-brand" /> Network Summary
      </div>
      <div className="space-y-1.5">
        {items.map(item => (
          <div key={item.label} className="flex items-center justify-between text-xs">
            <span className="text-text-dim">{item.label}</span>
            <span className={`font-bold tabular-nums ${item.highlight || 'text-text'}`}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Activity Timeline ─────────────────────────────────────────────────────────
function ActivityPanel() {
  const typeColor: Record<string, string> = {
    MATCH: 'text-danger-bright bg-danger/10',
    EXTRACTION: 'text-success bg-success/10',
    EXPANSION: 'text-brand bg-brand/10',
    ANALYSIS: 'text-accent-bright bg-accent/10',
    REQUEST: 'text-warning bg-warning/10',
  };

  return (
    <div className="bg-surface border border-border-soft rounded-xl p-3">
      <div className="text-[10px] uppercase font-bold text-text-faint tracking-wider mb-2 flex items-center gap-1.5">
        <Clock size={10} /> Intelligence Activity
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {/* Real activity timeline goes here based on analytical_metadata */}
        <div className="flex gap-2 items-start">
          <span className="text-[9px] font-mono text-text-faint shrink-0 mt-0.5 w-8">Now</span>
          <div>
            <span className="text-[8px] font-bold uppercase px-1 rounded text-accent-bright bg-accent/10">ANALYSIS</span>
            <p className="text-[10px] text-text-dim leading-snug mt-0.5">Real intelligence report loaded.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Select Dropdown ──────────────────────────────────────────────────────────
function FilterSelect({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: any) => void;
}) {
  return (
    <div className="relative">
      <select
        aria-label={label}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none bg-surface border border-border-soft text-xs text-text rounded-lg pl-3 pr-7 py-2 focus:border-brand outline-none cursor-pointer"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export function NetworkExplorer() {
  const { state } = useMockState();

  // Real backend workspace state
  const [workspaces, setWorkspaces] = useState<WorkspaceDTO[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('ALL');
  const [realGraph, setRealGraph] = useState<{ nodes: NetworkNode[]; edges: NetworkEdge[] } | null>(null);
  const [isLoadingRealGraph, setIsLoadingRealGraph] = useState<boolean>(false);

  // Filters
  const [stationFilter, setStationFilter] = useState<StationFilter>('ALL');
  const [entityFilter, setEntityFilter] = useState<EntityFilter>('ALL');
  const [relFilter, setRelFilter] = useState<RelFilter>('ALL');
  const [accessFilter, setAccessFilter] = useState<AccessFilter>('ALL');

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NetworkNode[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // Selected node
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);

  // Highlighted set (from search/filter)
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set());

  // Load real workspaces on mount
  useEffect(() => {
    workspaceApi.getWorkspaces()
      .then(wsList => {
        if (wsList && wsList.length > 0) {
          setWorkspaces(wsList);
        }
      })
      .catch(err => console.error('Could not fetch real workspaces:', err));
  }, []);

  // Fetch real graph data when a workspace is selected
  useEffect(() => {
    if (selectedWorkspaceId && selectedWorkspaceId !== 'ALL') {
      setIsLoadingRealGraph(true);
      workspaceApi.getResult(selectedWorkspaceId)
        .then(result => {
          if (result && result.resultPayload) {
            const transformed = transformResultPayloadToGraph(result.resultPayload);
            setRealGraph({ nodes: transformed.nodes, edges: transformed.edges });
          } else {
            setRealGraph(null);
          }
        })
        .catch(err => {
          console.warn('Workspace intelligence result not ready or unavailable:', err);
          setRealGraph(null);
        })
        .finally(() => setIsLoadingRealGraph(false));
    } else {
      setRealGraph(null);
    }
  }, [selectedWorkspaceId]);

  // Active base nodes & edges (real graph if available, fallback to default graph)
  const baseNodes = realGraph && realGraph.nodes.length > 0 ? realGraph.nodes : [];
  const baseEdges = realGraph && realGraph.nodes.length > 0 ? realGraph.edges : [];

  // ── Override access status ──
  const resolvedNodes = useMemo((): NetworkNode[] => {
    return baseNodes.map(n => {
      if (!n.caseId) return n;
      const req = state.accessRequests.find(r => r.targetCaseId === n.caseId);
      if (req?.status === 'APPROVED') return { ...n, accessStatus: 'AUTHORIZED' as const };
      if (req?.status === 'PENDING')  return { ...n, accessStatus: 'PENDING' as const };
      return n;
    });
  }, [baseNodes, state.accessRequests]);

  // ── Filtered nodes & edges ──────────────────────────────────────────────────
  const filteredNodes = useMemo(() => {
    return resolvedNodes.filter(n => {
      if (stationFilter !== 'ALL' && n.stationId !== stationFilter) return false;
      if (entityFilter !== 'ALL' && n.type !== entityFilter) return false;
      if (accessFilter === 'AUTHORIZED' && n.accessStatus !== 'AUTHORIZED') return false;
      if (accessFilter === 'RESTRICTED' && n.accessStatus !== 'RESTRICTED') return false;
      return true;
    });
  }, [resolvedNodes, stationFilter, entityFilter, accessFilter]);

  const filteredEdges = useMemo(() => {
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    return baseEdges.filter(e => {
      if (!nodeIds.has(e.source) || !nodeIds.has(e.target)) return false;
      if (relFilter === 'CROSS_STATION' && !e.isCrossStation) return false;
      if (relFilter === 'AI_DISCOVERED' && !e.isAiDiscovered) return false;
      if (relFilter === 'SHARED_PHONE' && e.relationship !== 'SHARED_PHONE' && e.relationship !== 'MATCHED_ENTITY') return false;
      if (relFilter === 'SHARED_VEHICLE' && e.relationship !== 'SHARED_VEHICLE') return false;
      if (relFilter === 'LINKED_CASE' && e.relationship !== 'LINKED_CASE') return false;
      return true;
    });
  }, [filteredNodes, baseEdges, relFilter]);

  // Dynamic graph summary
  const dynamicSummary = useMemo(() => ({
    totalCases: filteredNodes.filter(n => n.type === 'CASE').length,
    totalEntities: filteredNodes.filter(n => n.type !== 'STATION' && n.type !== 'CASE').length,
    totalStations: new Set(filteredNodes.map(n => n.stationId).filter(Boolean)).size,
    crossStationLinks: filteredEdges.filter(e => e.isCrossStation).length,
    restrictedRecords: filteredNodes.filter(n => n.accessStatus === 'RESTRICTED').length,
    aiDiscoveredLinks: filteredEdges.filter(e => e.isAiDiscovered).length,
    relationships: filteredEdges.length,
  }), [filteredNodes, filteredEdges]);

  // ── Search ──────────────────────────────────────────────────────────────────
  const searchNodes = useCallback((query: string) => {
    const q = query.toLowerCase();
    return baseNodes.filter(n =>
      n.label.toLowerCase().includes(q) ||
      (n.sublabel?.toLowerCase().includes(q)) ||
      n.id.toLowerCase().includes(q)
    );
  }, [baseNodes]);

  const getConnectedNodes = useCallback((nodeId: string) => {
    const connected: string[] = [];
    baseEdges.forEach(e => {
      if (e.source === nodeId) connected.push(e.target);
      if (e.target === nodeId) connected.push(e.source);
    });
    return [...new Set(connected)];
  }, [baseEdges]);

  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      setHighlightedIds(new Set());
      setShowSearchDropdown(false);
      return;
    }
    const results = searchNodes(q);
    setSearchResults(results);
    setShowSearchDropdown(results.length > 0);
  }, [searchNodes]);

  const handleSelectSearchResult = (node: NetworkNode) => {
    setSelectedNode(node);
    setShowSearchDropdown(false);
    setSearchQuery(node.label);
    // Highlight the node and its 1-hop neighbours
    const neighbours = getConnectedNodes(node.id);
    setHighlightedIds(new Set([node.id, ...neighbours]));
  };

  const handleReset = () => {
    setStationFilter('ALL');
    setEntityFilter('ALL');
    setRelFilter('ALL');
    setAccessFilter('ALL');
    setSearchQuery('');
    setSearchResults([]);
    setHighlightedIds(new Set());
    setSelectedNode(null);
    setShowSearchDropdown(false);
  };

  // Station options from mock state
  const stationOptions = [
    { value: 'ALL', label: 'All Stations' },
    ...state.stations.slice(0, 5).map(s => ({ value: s.id, label: s.name.split(' ').slice(0, 2).join(' ') })),
  ];

  const entityOptions: { value: string; label: string }[] = [
    { value: 'ALL', label: 'All Entities' },
    { value: 'CASE', label: 'Cases' },
    { value: 'PERSON', label: 'Persons' },
    { value: 'PHONE', label: 'Phone Numbers' },
    { value: 'VEHICLE', label: 'Vehicles' },
    { value: 'LOCATION', label: 'Locations' },
    { value: 'EVIDENCE', label: 'Evidence' },
  ];

  const relOptions = [
    { value: 'ALL', label: 'All Relationships' },
    { value: 'CROSS_STATION', label: 'Cross-Station' },
    { value: 'AI_DISCOVERED', label: 'AI Discovered' },
    { value: 'SHARED_PHONE', label: 'Shared Phone' },
    { value: 'SHARED_VEHICLE', label: 'Shared Vehicle' },
    { value: 'LINKED_CASE', label: 'Linked Case' },
  ];

  const accessOptions = [
    { value: 'ALL', label: 'All Access' },
    { value: 'AUTHORIZED', label: 'Authorized' },
    { value: 'RESTRICTED', label: 'Restricted' },
  ];

  const crossStationAlert = baseEdges.filter(e => e.isCrossStation).length > 0;

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col animate-fade-in gap-0 max-w-[1600px] mx-auto">

      {/* ── Top bar ── */}
      <div className="flex flex-col gap-3 pb-3 shrink-0">
        {/* Title row */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-text font-display flex items-center gap-2">
              <Network className="text-brand" /> Network Intelligence Explorer
            </h2>
            <p className="text-sm text-text-dim mt-1">
              Cross-station entity relationship graph · Explore discovered intelligence connections
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {crossStationAlert && (
              <div className="flex items-center gap-2 bg-danger/10 border border-danger/30 text-danger-bright text-xs font-bold px-3 py-2 rounded-lg">
                <AlertTriangle size={13} />
                {dynamicSummary.crossStationLinks} cross-station link{dynamicSummary.crossStationLinks !== 1 ? 's' : ''} detected
              </div>
            )}
            <div className="flex items-center gap-1.5 bg-success/10 border border-success/30 text-success text-xs font-bold px-3 py-2 rounded-lg">
              <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
              Graph Engine Active
            </div>
          </div>
        </div>

        {/* Search + Filters row */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative">
            <div className="flex items-center gap-2 bg-surface border border-border-soft rounded-lg px-3 py-2 min-w-64 focus-within:border-brand transition-colors">
              <Search size={14} className="text-text-dim shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowSearchDropdown(true)}
                placeholder="Search case, phone, vehicle, person..."
                className="bg-transparent border-none outline-none text-sm text-text placeholder-text-faint flex-1 min-w-40"
              />
              {searchQuery && (
                <button onClick={() => handleSearch('')} className="text-text-dim hover:text-text">
                  <X size={12} />
                </button>
              )}
            </div>
            {/* Search dropdown */}
            {showSearchDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-xl shadow-glass z-50 max-h-48 overflow-y-auto">
                {searchResults.map(r => (
                  <button
                    key={r.id}
                    onClick={() => handleSelectSearchResult(r)}
                    className="w-full text-left px-3 py-2.5 hover:bg-surface-hover transition-colors flex items-center gap-3 border-b border-border-soft last:border-0"
                  >
                    <span className="text-[10px] font-bold uppercase text-text-faint w-12 shrink-0">{r.type}</span>
                    <div>
                      <div className="text-xs font-semibold text-text font-mono">{r.label}</div>
                      {r.sublabel && <div className="text-[10px] text-text-dim">{r.sublabel}</div>}
                    </div>
                    {r.accessStatus === 'RESTRICTED' && <Lock size={10} className="text-danger-bright ml-auto shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter row */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={14} className="text-text-dim shrink-0" />
            {workspaces.length > 0 && (
              <div className="flex items-center gap-1.5 bg-brand/10 border border-brand/30 rounded-lg px-2.5 py-1.5 text-xs text-brand font-semibold">
                <FolderGit2 size={13} />
                <select
                  aria-label="Workspace"
                  value={selectedWorkspaceId}
                  onChange={e => setSelectedWorkspaceId(e.target.value)}
                  className="bg-transparent text-text font-medium border-none outline-none cursor-pointer text-xs"
                >
                  <option value="ALL">Global Demo Graph</option>
                  {workspaces.map(w => (
                    <option key={w.id} value={w.id}>Workspace: {w.title}</option>
                  ))}
                </select>
              </div>
            )}
            <FilterSelect label="Station" value={stationFilter} options={stationOptions} onChange={setStationFilter} />
            <FilterSelect label="Entity" value={entityFilter} options={entityOptions} onChange={setEntityFilter} />
            <FilterSelect label="Relationship" value={relFilter} options={relOptions} onChange={setRelFilter} />
            <FilterSelect label="Access" value={accessFilter} options={accessOptions} onChange={setAccessFilter} />
          </div>

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-text-dim border border-border-soft rounded-lg px-3 py-2 hover:bg-surface-hover hover:text-text transition-colors"
          >
            <RefreshCw size={12} /> Reset
          </button>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 flex gap-3 min-h-0 overflow-hidden">

        {/* Left sidebar */}
        <div className="w-52 shrink-0 flex flex-col gap-3 overflow-y-auto">
          <SummaryPanel summary={dynamicSummary} />
          <GraphLegend />
          <ActivityPanel />
        </div>

        {/* Graph canvas */}
        <div className="flex-1 bg-bg-elev border border-border-soft rounded-xl overflow-hidden relative min-w-0">
          {/* DISCOVERY ≠ ACCESS banner */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-surface/90 backdrop-blur-sm border border-brand/30 rounded-full px-4 py-1.5 flex items-center gap-2 text-[10px] font-bold text-brand uppercase tracking-wider pointer-events-none">
            <Shield size={11} /> Discovery ≠ Access · Restricted records show existence only
          </div>

          <IntelligenceGraph
            nodes={filteredNodes}
            edges={filteredEdges}
            selectedNodeId={selectedNode?.id || null}
            highlightedNodeIds={highlightedIds.size > 0 ? highlightedIds : undefined}
            onNodeClick={node => {
              setSelectedNode(node);
              const neighbours = getConnectedNodes(node.id);
              setHighlightedIds(new Set([node.id, ...neighbours]));
            }}
          />
        </div>

        {/* Right: Node Detail Panel */}
        {selectedNode && (
          <NodeDetailPanel
            node={selectedNode}
            onClose={() => { setSelectedNode(null); setHighlightedIds(new Set()); }}
            onExpandNode={nodeId => {
              const neighbours = getConnectedNodes(nodeId);
              setHighlightedIds(new Set([nodeId, ...neighbours]));
            }}
          />
        )}
      </div>

      {/* ── Disclaimer ── */}
      <div className="shrink-0 pt-2">
        <div className="flex items-center gap-2 text-[10px] text-text-faint">
          <Info size={11} />
          AI-assisted intelligence graph · Relationships are probabilistic discoveries — require authorized officer verification.
          No sensitive case details are disclosed for restricted records.
        </div>
      </div>
    </div>
  );
}
