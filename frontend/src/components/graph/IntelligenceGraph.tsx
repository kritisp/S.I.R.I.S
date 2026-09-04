/**
 * IntelligenceGraph — S.I.R.I.S Law Enforcement Intelligence Network Graph
 * Production-grade D3-Force interactive link-analysis visualization with
 * collision avoidance, progressive label disclosure, dynamic focus mode,
 * and dual Light / Dark Mode support tailored for police workstations.
 */
import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import {
  NetworkNode, NetworkEdge, NodeType,
  getConnectedNodes, getNodeEdges
} from '../../mockServices/networkGraphData';
import {
  Shield, Lock, AlertTriangle, Sparkles, ZoomIn, ZoomOut,
  Maximize2, RotateCcw, Crosshair, Radio, Eye
} from 'lucide-react';

// ─── Semantic Node Configuration (Light & Dark) ───────────────────────────────

export const LIGHT_NODE_COLORS: Record<NodeType, { base: string; light: string; border: string; bg: string }> = {
  STATION:  { base: '#C08A18', light: '#936608', border: '#C08A18', bg: '#FEF9C3' },
  CASE:     { base: '#2563EB', light: '#1D4ED8', border: '#2563EB', bg: '#EFF6FF' },
  PERSON:   { base: '#DB2777', light: '#BE185D', border: '#DB2777', bg: '#FDF2F8' },
  PHONE:    { base: '#059669', light: '#047857', border: '#059669', bg: '#ECFDF5' },
  VEHICLE:  { base: '#7C3AED', light: '#6D28D9', border: '#7C3AED', bg: '#F5F3FF' },
  LOCATION: { base: '#EA580C', light: '#C2410C', border: '#EA580C', bg: '#FFF7ED' },
  EVIDENCE: { base: '#64748B', light: '#475569', border: '#64748B', bg: '#F8FAFC' },
};

export const DARK_NODE_COLORS: Record<NodeType, { base: string; light: string; border: string; bg: string }> = {
  STATION:  { base: '#2563eb', light: '#60a5fa', border: '#3b82f6', bg: '#1e3a8a' },
  CASE:     { base: '#0284c7', light: '#38bdf8', border: '#0ea5e9', bg: '#0c4a6e' },
  PERSON:   { base: '#d97706', light: '#fbbf24', border: '#f59e0b', bg: '#78350f' },
  PHONE:    { base: '#059669', light: '#34d399', border: '#10b981', bg: '#064e3b' },
  VEHICLE:  { base: '#7c3aed', light: '#a78bfa', border: '#8b5cf6', bg: '#4c1d95' },
  LOCATION: { base: '#ea580c', light: '#fb923c', border: '#f97316', bg: '#7c2d12' },
  EVIDENCE: { base: '#475569', light: '#94a3b8', border: '#64748b', bg: '#1e293b' },
};

export const NODE_ICONS: Record<NodeType, string> = {
  STATION: 'M3 21h18M6 21V7l6-4 6 4v14M9 21V11h6v10',
  CASE: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  PERSON: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8',
  PHONE: 'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.18 6.18l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z',
  VEHICLE: 'M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v9a2 2 0 01-2 2h-3M16 17a2 2 0 11-4 0 2 2 0 014 0M9 17a2 2 0 11-4 0 2 2 0 014 0',
  LOCATION: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
  EVIDENCE: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
};

// Simulation Node interface extending d3.SimulationNodeDatum
interface SimNode extends d3.SimulationNodeDatum, NetworkNode {
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  degree: number;
  radius: number;
  is_focus?: boolean;
  is_important?: boolean;
  hop_distance?: number;
  betweenness?: number;
}

// Simulation Link interface extending d3.SimulationLinkDatum
interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  id: string;
  source: SimNode | string;
  target: SimNode | string;
  relationship: string;
  label: string;
  isCrossStation?: boolean;
  isAiDiscovered?: boolean;
  confidence?: number;
  discoveredAt?: string;
}

export interface IntelligenceGraphProps {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  selectedNodeId: string | null;
  highlightedNodeIds?: Set<string>;
  onNodeClick?: (node: NetworkNode) => void;
  onSelectNode?: (nodeId: string) => void;
  width?: number;
  height?: number;
}

// Dynamic radius calculation
function computeNodeRadius(type: NodeType, degree: number, isSelected: boolean): number {
  let baseR = 18;
  if (type === 'STATION') baseR = 28;
  else if (type === 'CASE') baseR = 24;
  else if (degree >= 4) baseR = 23;
  else if (degree >= 2) baseR = 19;
  else baseR = 16;

  return isSelected ? baseR + 3 : baseR;
}

// Station cluster geographic centroids for organic layout separation
const STATION_CENTROIDS: Record<string, { x: number; y: number }> = {
  'OP-BBSR-CAP': { x: -220, y: -40 },
  'OP-CTC-CITY': { x: 220, y: -40 },
  'OP-RKL-CEN':  { x: 180, y: -190 },
  'OP-BAM-TWN':  { x: -180, y: 190 },
  'OP-PURI-TWN': { x: 150, y: 190 },
};

// ─── Main IntelligenceGraph Component ─────────────────────────────────────────

export function IntelligenceGraph({
  nodes,
  edges,
  selectedNodeId,
  highlightedNodeIds,
  onNodeClick,
  onSelectNode,
  width: initialWidth,
  height: initialHeight,
}: IntelligenceGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const simulationRef = useRef<d3.Simulation<SimNode, SimLink> | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Theme detection
  const [isLight, setIsLight] = useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('theme-light') || !document.documentElement.classList.contains('theme-dark');
    }
    return true;
  });

  useEffect(() => {
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains('theme-dark') || document.documentElement.classList.contains('dark');
      setIsLight(!isDark);
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const colorPalette = isLight ? LIGHT_NODE_COLORS : DARK_NODE_COLORS;

  // Dimensions & Simulation state
  const [dimensions, setDimensions] = useState({ width: initialWidth || 900, height: initialHeight || 600 });
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [simNodes, setSimNodes] = useState<SimNode[]>([]);
  const [simLinks, setSimLinks] = useState<SimLink[]>([]);
  const [hoveredNode, setHoveredNode] = useState<SimNode | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<SimLink | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [isSimulationActive, setIsSimulationActive] = useState(true);

  // Observe container dimensions dynamically
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Degree calculation map
  const degreeMap = useMemo(() => {
    const map = new Map<string, number>();
    nodes.forEach(n => map.set(n.id, 0));
    edges.forEach(e => {
      map.set(e.source, (map.get(e.source) || 0) + 1);
      map.set(e.target, (map.get(e.target) || 0) + 1);
    });
    return map;
  }, [nodes, edges]);

  // Focus Mode & 1-Hop Neighborhood Calculation
  const focusContext = useMemo(() => {
    const activeFocusId = selectedNodeId || (hoveredNode ? hoveredNode.id : null);
    if (!activeFocusId) {
      return {
        isFocused: false,
        activeId: null,
        neighborNodeIds: new Set<string>(),
        incidentEdgeIds: new Set<string>(),
      };
    }

    const neighborIds = new Set<string>([activeFocusId]);
    const incidentEdgeIds = new Set<string>();

    edges.forEach(e => {
      const srcId = typeof e.source === 'object' ? (e.source as any).id : e.source;
      const tgtId = typeof e.target === 'object' ? (e.target as any).id : e.target;
      if (srcId === activeFocusId) {
        neighborIds.add(tgtId);
        incidentEdgeIds.add(e.id);
      } else if (tgtId === activeFocusId) {
        neighborIds.add(srcId);
        incidentEdgeIds.add(e.id);
      }
    });

    return {
      isFocused: true,
      activeId: activeFocusId,
      neighborNodeIds: neighborIds,
      incidentEdgeIds,
    };
  }, [selectedNodeId, hoveredNode, edges]);

  // Initialize & Update D3 Force Simulation
  useEffect(() => {
    const { width, height } = dimensions;
    const cx = width / 2;
    const cy = height / 2;

    const existingPos = new Map<string, { x: number; y: number; vx?: number; vy?: number }>();
    if (simulationRef.current) {
      simulationRef.current.nodes().forEach(n => {
        existingPos.set(n.id, { x: n.x, y: n.y, vx: n.vx, vy: n.vy });
      });
    }

    const newSimNodes: SimNode[] = nodes.map((n, idx) => {
      const degree = degreeMap.get(n.id) || 0;
      const radius = computeNodeRadius(n.type, degree, n.id === selectedNodeId);
      const prev = existingPos.get(n.id);

      if (prev) {
        return {
          ...n,
          degree,
          radius,
          x: prev.x,
          y: prev.y,
          vx: prev.vx || 0,
          vy: prev.vy || 0,
        };
      }

      let initX = cx;
      let initY = cy;

      if (n.stationId && STATION_CENTROIDS[n.stationId]) {
        const offset = STATION_CENTROIDS[n.stationId];
        initX = cx + offset.x + (Math.random() - 0.5) * 60;
        initY = cy + offset.y + (Math.random() - 0.5) * 60;
      } else if (n.isCrossStation) {
        initX = cx + (Math.random() - 0.5) * 80;
        initY = cy + (idx % 5 - 2) * 50;
      } else {
        const angle = (idx / Math.max(1, nodes.length)) * 2 * Math.PI;
        const dist = Math.min(width, height) * 0.35;
        initX = cx + Math.cos(angle) * dist + (Math.random() - 0.5) * 30;
        initY = cy + Math.sin(angle) * dist + (Math.random() - 0.5) * 30;
      }

      return {
        ...n,
        degree,
        radius,
        x: initX,
        y: initY,
        vx: 0,
        vy: 0,
      };
    });

    const newSimLinks: SimLink[] = edges.map(e => ({
      ...e,
      source: e.source,
      target: e.target,
    }));

    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    const simulation = d3.forceSimulation<SimNode, SimLink>(newSimNodes)
      .force('charge', d3.forceManyBody<SimNode>()
        .strength(d => (d.id === selectedNodeId ? -1200 : d.type === 'STATION' ? -800 : d.type === 'CASE' ? -500 : -320))
        .distanceMin(30)
        .distanceMax(650)
      )
      .force('link', d3.forceLink<SimNode, SimLink>(newSimLinks)
        .id(d => d.id)
        .distance(l => (l.isCrossStation ? 220 : l.isAiDiscovered ? 170 : 120))
        .strength(l => (l.isCrossStation ? 0.25 : 0.45))
      )
      .force('collide', d3.forceCollide<SimNode>()
        .radius(d => d.radius + 36)
        .strength(0.85)
        .iterations(3)
      )
      .force('center', d3.forceCenter(cx, cy).strength(0.06));

    if (selectedNodeId) {
      simulation.force('radialFocus', d3.forceRadial<SimNode>(
        d => (d.id === selectedNodeId ? 0 : d.hop_distance === 1 ? 170 : 320),
        cx,
        cy
      ).strength(d => (d.id === selectedNodeId ? 0.95 : 0.45)));
    }

    simulation.on('tick', () => {
      const pad = 40;
      newSimNodes.forEach(n => {
        n.x = Math.max(pad, Math.min(width - pad, n.x));
        n.y = Math.max(pad, Math.min(height - pad, n.y));
      });
      setSimNodes([...newSimNodes]);
      setSimLinks([...newSimLinks]);
    });

    simulation.on('end', () => {
      setIsSimulationActive(false);
    });

    simulationRef.current = simulation;
    setIsSimulationActive(true);

    return () => {
      simulation.stop();
    };
  }, [nodes, edges, dimensions, degreeMap, selectedNodeId]);

  // Setup D3 Zoom & Pan
  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);

    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3.5])
      .on('zoom', (event) => {
        g.attr('transform', event.transform.toString());
        setZoomLevel(event.transform.k);
      });

    svg.call(zoomBehavior);
    zoomBehaviorRef.current = zoomBehavior;
    svg.on('dblclick.zoom', null);
  }, []);

  // Controls Handlers
  const handleZoomIn = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(250).call(zoomBehaviorRef.current.scaleBy, 1.3);
  }, []);

  const handleZoomOut = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(250).call(zoomBehaviorRef.current.scaleBy, 1 / 1.3);
  }, []);

  const handleResetView = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(350).call(
      zoomBehaviorRef.current.transform,
      d3.zoomIdentity
    );
  }, []);

  const handleFitView = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current || simNodes.length === 0) return;
    const { width, height } = dimensions;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    simNodes.forEach(n => {
      minX = Math.min(minX, n.x - n.radius - 40);
      maxX = Math.max(maxX, n.x + n.radius + 40);
      minY = Math.min(minY, n.y - n.radius - 40);
      maxY = Math.max(maxY, n.y + n.radius + 40);
    });

    const graphWidth = maxX - minX || 1;
    const graphHeight = maxY - minY || 1;
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    const scale = Math.max(0.4, Math.min(2.0, 0.85 / Math.max(graphWidth / width, graphHeight / height)));
    const translateX = width / 2 - scale * midX;
    const translateY = height / 2 - scale * midY;

    d3.select(svgRef.current).transition().duration(500).call(
      zoomBehaviorRef.current.transform,
      d3.zoomIdentity.translate(translateX, translateY).scale(scale)
    );
  }, [simNodes, dimensions]);

  const handleCenterSelected = useCallback(() => {
    if (!selectedNodeId || !svgRef.current || !zoomBehaviorRef.current) return;
    const target = simNodes.find(n => n.id === selectedNodeId);
    if (!target) return;

    const { width, height } = dimensions;
    const scale = Math.max(1.2, zoomLevel);
    const translateX = width / 2 - scale * target.x;
    const translateY = height / 2 - scale * target.y;

    d3.select(svgRef.current).transition().duration(400).call(
      zoomBehaviorRef.current.transform,
      d3.zoomIdentity.translate(translateX, translateY).scale(scale)
    );
  }, [selectedNodeId, simNodes, dimensions, zoomLevel]);

  // Node Drag Handlers
  const handleNodeDragStart = (e: React.MouseEvent, node: SimNode) => {
    e.stopPropagation();
    if (!simulationRef.current) return;

    node.fx = node.x;
    node.fy = node.y;
    simulationRef.current.alphaTarget(0.2).restart();
    setIsSimulationActive(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const initX = node.x;
    const initY = node.y;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - startX) / zoomLevel;
      const dy = (moveEvent.clientY - startY) / zoomLevel;
      node.fx = initX + dx;
      node.fy = initY + dy;
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (simulationRef.current) {
        simulationRef.current.alphaTarget(0);
        node.fx = null;
        node.fy = null;
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Hover Handlers
  const handleNodeMouseEnter = (e: React.MouseEvent, node: SimNode) => {
    setHoveredNode(node);
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleNodeMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleNodeMouseLeave = () => {
    setHoveredNode(null);
    setTooltipPos(null);
  };

  const handleEdgeMouseEnter = (e: React.MouseEvent, edge: SimLink) => {
    setHoveredEdge(edge);
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleEdgeMouseLeave = () => {
    setHoveredEdge(null);
    setTooltipPos(null);
  };

  // Progressive Label Disclosure
  const isLabelVisible = (node: SimNode) => {
    const isSelected = node.id === selectedNodeId;
    const isHovered = hoveredNode?.id === node.id;
    const isHighPriority = node.type === 'STATION' || node.type === 'CASE';
    const isNeighbor = focusContext.isFocused && focusContext.neighborNodeIds.has(node.id);

    if (isSelected || isHovered || isNeighbor) return true;

    if (zoomLevel < 0.7) {
      return isHighPriority;
    } else if (zoomLevel <= 1.3) {
      return isHighPriority || node.degree >= 2 || node.isCrossStation;
    } else {
      return true;
    }
  };

  const formatNodeLabel = (node: SimNode) => {
    if (node.accessStatus === 'RESTRICTED') {
      return node.id;
    }
    if (node.type === 'STATION') {
      return node.label.replace(' Police Station', ' PS');
    }
    if (node.label.length > 18) {
      return node.label.slice(0, 16) + '…';
    }
    return node.label;
  };

  const isHighlighted = (nodeId: string) => {
    if (!highlightedNodeIds || highlightedNodeIds.size === 0) return true;
    return highlightedNodeIds.has(nodeId);
  };

  const nodeMap = useMemo(() => {
    const map = new Map<string, SimNode>();
    simNodes.forEach(n => map.set(n.id, n));
    return map;
  }, [simNodes]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none font-sans ${
        isLight ? 'bg-[#F8FAFC]' : 'bg-[#070b14]'
      }`}
      onMouseMove={hoveredNode ? handleNodeMouseMove : undefined}
    >
      {/* ── Top Left Tactical Telemetry HUD ── */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2 pointer-events-none">
        <div className={`px-3 py-1.5 rounded-lg border shadow-sm flex items-center gap-2.5 backdrop-blur-md ${
          isLight ? 'bg-white/95 border-[#D9E0E8] text-[#172033]' : 'bg-[#0b1222]/90 border-[#1e293b] text-slate-300'
        }`}>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isSimulationActive ? (isLight ? 'bg-emerald-600 animate-pulse' : 'bg-emerald-400 animate-pulse') : 'bg-slate-400'}`} />
            <span className={`text-[10px] font-mono font-bold tracking-wider uppercase ${isLight ? 'text-[#172033]' : 'text-slate-300'}`}>
              GRID: STATE-INTEL-NET
            </span>
          </div>
          <span className={`${isLight ? 'text-slate-300' : 'text-slate-600'} text-xs font-mono`}>|</span>
          <div className={`text-[10px] font-mono ${isLight ? 'text-[#5B6678]' : 'text-slate-400'}`}>
            <span className={`font-bold ${isLight ? 'text-[#B88922]' : 'text-amber-400'}`}>{nodes.length}</span> NODES · <span className={`font-bold ${isLight ? 'text-[#1D4ED8]' : 'text-sky-400'}`}>{edges.length}</span> LINKS
          </div>
          <span className={`${isLight ? 'text-slate-300' : 'text-slate-600'} text-xs font-mono`}>|</span>
          <div className={`text-[10px] font-mono ${isLight ? 'text-[#5B6678]' : 'text-slate-400'}`}>
            ZOOM: <span className={`font-bold ${isLight ? 'text-[#172033]' : 'text-slate-200'}`}>{Math.round(zoomLevel * 100)}%</span>
          </div>
          {focusContext.isFocused && (
            <>
              <span className={`${isLight ? 'text-slate-300' : 'text-slate-600'} text-xs font-mono`}>|</span>
              <div className={`flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                isLight ? 'text-[#1D4ED8] bg-blue-50 border-blue-200 font-semibold' : 'text-sky-400 bg-sky-950/60 border-sky-800/60'
              }`}>
                <Radio size={10} className="animate-pulse" />
                <span>FOCUS: {focusContext.neighborNodeIds.size - 1} NEIGHBORS</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Top Right HUD Navigation Controls ── */}
      <div className={`absolute top-3 right-3 z-20 flex items-center gap-1 p-1 rounded-lg border shadow-sm backdrop-blur-md ${
        isLight ? 'bg-white/95 border-[#D9E0E8]' : 'bg-[#0b1222]/90 border-[#1e293b]'
      }`}>
        <button
          onClick={handleZoomIn}
          title="Zoom In (+)"
          className={`p-1.5 rounded transition-colors ${
            isLight ? 'text-[#5B6678] hover:bg-[#F1F5F9] hover:text-[#172033]' : 'text-slate-300 hover:bg-[#1e293b] hover:text-white'
          }`}
          aria-label="Zoom In"
        >
          <ZoomIn size={14} />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out (−)"
          className={`p-1.5 rounded transition-colors ${
            isLight ? 'text-[#5B6678] hover:bg-[#F1F5F9] hover:text-[#172033]' : 'text-slate-300 hover:bg-[#1e293b] hover:text-white'
          }`}
          aria-label="Zoom Out"
        >
          <ZoomOut size={14} />
        </button>
        <div className={`w-[1px] h-4 ${isLight ? 'bg-[#D9E0E8]' : 'bg-[#1e293b]'}`} />
        <button
          onClick={handleFitView}
          title="Fit Graph to View"
          className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono font-medium transition-colors ${
            isLight ? 'text-[#5B6678] hover:bg-[#F1F5F9] hover:text-[#172033]' : 'text-slate-300 hover:bg-[#1e293b] hover:text-white'
          }`}
          aria-label="Fit View"
        >
          <Maximize2 size={12} />
          <span>Fit</span>
        </button>
        <button
          onClick={handleResetView}
          title="Reset Zoom & Pan"
          className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono font-medium transition-colors ${
            isLight ? 'text-[#5B6678] hover:bg-[#F1F5F9] hover:text-[#172033]' : 'text-slate-300 hover:bg-[#1e293b] hover:text-white'
          }`}
          aria-label="Reset View"
        >
          <RotateCcw size={12} />
          <span>Reset</span>
        </button>
        {selectedNodeId && (
          <>
            <div className={`w-[1px] h-4 ${isLight ? 'bg-[#D9E0E8]' : 'bg-[#1e293b]'}`} />
            <button
              onClick={handleCenterSelected}
              title="Center on Selected Node"
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono font-medium transition-colors ${
                isLight ? 'bg-blue-50 border border-blue-200 text-[#1D4ED8] hover:bg-blue-100' : 'bg-sky-950/70 border border-sky-800 text-sky-300 hover:bg-sky-900'
              }`}
              aria-label="Center Selected"
            >
              <Crosshair size={12} />
              <span>Center</span>
            </button>
          </>
        )}
      </div>

      {/* ── Bottom Left Station Cluster Legend Indicator ── */}
      <div className={`absolute bottom-3 left-3 z-20 flex items-center gap-3 rounded-lg px-2.5 py-1 text-[10px] font-mono border shadow-xs pointer-events-none ${
        isLight ? 'bg-white/90 border-[#D9E0E8] text-[#5B6678]' : 'bg-[#0b1222]/80 border-[#1e293b] text-slate-400'
      }`}>
        <div className="flex items-center gap-1">
          <span className={`w-2 h-0.5 inline-block ${isLight ? 'bg-[#98A2B3]' : 'bg-slate-500'}`} />
          <span>Local Link</span>
        </div>
        <div className="flex items-center gap-1">
          <span className={`w-2.5 h-0.5 border-t border-dashed inline-block ${isLight ? 'border-[#DC2626]' : 'border-red-500'}`} />
          <span className={`font-semibold ${isLight ? 'text-[#B91C1C]' : 'text-red-400'}`}>Cross-PS Match</span>
        </div>
        <div className="flex items-center gap-1">
          <span className={`w-2.5 h-0.5 border-t border-dashed inline-block ${isLight ? 'border-[#0891B2]' : 'border-cyan-400'}`} />
          <span className={`font-semibold ${isLight ? 'text-[#0891B2]' : 'text-cyan-400'}`}>AI Link</span>
        </div>
      </div>

      {/* ── Main SVG Visualization Canvas ── */}
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full cursor-grab active:cursor-grabbing select-none"
      >
        <defs>
          {/* Subtle Tactical Grid Pattern */}
          <pattern id="tactical-grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke={isLight ? '#E8EDF3' : '#162036'}
              strokeWidth="0.75"
              opacity={isLight ? '0.7' : '0.6'}
            />
            <circle
              cx="0"
              cy="0"
              r="1.2"
              fill={isLight ? '#D9E0E8' : '#253554'}
              opacity={isLight ? '0.9' : '0.8'}
            />
          </pattern>

          {/* Directional Arrowhead Markers */}
          <marker
            id="marker-arrow-default"
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="4"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M 0 1 L 6 4 L 0 7 Z" fill={isLight ? '#98A2B3' : '#64748b'} opacity="0.75" />
          </marker>
          <marker
            id="marker-arrow-cross"
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="4"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M 0 1 L 6 4 L 0 7 Z" fill={isLight ? '#DC2626' : '#ef4444'} opacity="0.95" />
          </marker>
          <marker
            id="marker-arrow-ai"
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="4"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M 0 1 L 6 4 L 0 7 Z" fill={isLight ? '#0891B2' : '#06b6d4'} opacity="0.9" />
          </marker>

          {/* Focus Selection Glow */}
          <filter id="focus-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Tactical Background Canvas */}
        <rect width={dimensions.width} height={dimensions.height} fill={isLight ? '#F8FAFC' : '#070b14'} />
        <rect width={dimensions.width} height={dimensions.height} fill="url(#tactical-grid-pattern)" />

        {/* Tactical Corner HUD Accents */}
        <g stroke={isLight ? '#D9E0E8' : '#1e293b'} strokeWidth="1.5" fill="none" opacity="0.7">
          <path d="M 16 32 L 16 16 L 32 16" />
          <path d={`M ${dimensions.width - 32} 16 L ${dimensions.width - 16} 16 L ${dimensions.width - 16} 32`} />
          <path d={`M 16 ${dimensions.height - 32} L 16 ${dimensions.height - 16} L 32 ${dimensions.height - 16}`} />
          <path d={`M ${dimensions.width - 32} ${dimensions.height - 16} L ${dimensions.width - 16} ${dimensions.height - 16} L ${dimensions.width - 16} ${dimensions.height - 32}`} />
        </g>

        {/* ── Graph World Container (Zoomable/Pannable) ── */}
        <g ref={gRef} className="graph-world">

          {/* ════════════════════════════════════════════════════════════════
              1. EDGES LAYER
             ════════════════════════════════════════════════════════════════ */}
          <g className="edges-layer">
            {simLinks.map(edge => {
              const src = typeof edge.source === 'object' ? edge.source : nodeMap.get(edge.source as string);
              const tgt = typeof edge.target === 'object' ? edge.target : nodeMap.get(edge.target as string);
              if (!src || !tgt || src.x === undefined || tgt.x === undefined) return null;

              const isCS = edge.isCrossStation;
              const isAI = edge.isAiDiscovered;

              const isIncidentToFocus = focusContext.isFocused && focusContext.incidentEdgeIds.has(edge.id);
              const isHovered = hoveredEdge?.id === edge.id;
              const isEdgeHighlighted = isHighlighted(src.id) && isHighlighted(tgt.id);

              let opacity = isLight ? 0.55 : 0.45;
              if (focusContext.isFocused) {
                opacity = isIncidentToFocus ? 0.95 : 0.08;
              } else if (!isEdgeHighlighted) {
                opacity = 0.12;
              }

              const strokeColor = isIncidentToFocus
                ? (isLight ? '#1D4ED8' : '#38bdf8')
                : isCS
                ? (isLight ? '#DC2626' : '#ef4444')
                : isAI
                ? (isLight ? '#0891B2' : '#06b6d4')
                : (isLight ? '#98A2B3' : '#64748b');

              const strokeWidth = (isIncidentToFocus || isHovered) ? 2.5 : isCS ? 2.0 : isAI ? 1.8 : 1.2;
              const dashArray = isCS ? '6 4' : isAI ? '4 3' : undefined;
              const marker = isCS ? 'url(#marker-arrow-cross)' : isAI ? 'url(#marker-arrow-ai)' : 'url(#marker-arrow-default)';

              const dx = tgt.x - src.x;
              const dy = tgt.y - src.y;
              const dist = Math.sqrt(dx * dx + dy * dy) || 1;

              const srcRadius = src.radius + 3;
              const tgtRadius = tgt.radius + 7;

              const sx = src.x + (dx / dist) * srcRadius;
              const sy = src.y + (dy / dist) * srcRadius;
              const tx = tgt.x - (dx / dist) * tgtRadius;
              const ty = tgt.y - (dy / dist) * tgtRadius;

              const mx = (sx + tx) / 2;
              const my = (sy + ty) / 2;

              const showEdgeLabel = isIncidentToFocus || isHovered || (zoomLevel > 1.4 && (isCS || isAI));

              return (
                <g
                  key={edge.id}
                  opacity={opacity}
                  className="transition-opacity duration-200"
                  onMouseEnter={(e) => handleEdgeMouseEnter(e, edge)}
                  onMouseLeave={handleEdgeMouseLeave}
                  style={{ cursor: 'pointer' }}
                >
                  <line
                    x1={sx}
                    y1={sy}
                    x2={tx}
                    y2={ty}
                    stroke="transparent"
                    strokeWidth="14"
                  />

                  <line
                    x1={sx}
                    y1={sy}
                    x2={tx}
                    y2={ty}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={dashArray}
                    markerEnd={marker}
                  />

                  {showEdgeLabel && (
                    <g transform={`translate(${mx}, ${my})`} className="pointer-events-none">
                      <rect
                        x={-Math.max(38, (edge.label.length * 5.5 + 16) / 2)}
                        y="-9"
                        width={Math.max(76, edge.label.length * 5.5 + 16)}
                        height="18"
                        rx="9"
                        fill={isLight ? '#FFFFFF' : '#0b1222'}
                        stroke={strokeColor}
                        strokeWidth="1"
                        opacity="0.96"
                      />
                      <text
                        y="3"
                        textAnchor="middle"
                        fontSize="8.5"
                        fontWeight="bold"
                        fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
                        fill={isLight ? (isCS ? '#B91C1C' : isAI ? '#0369A1' : '#334155') : (isCS ? '#fca5a5' : isAI ? '#67e8f9' : '#cbd5e1')}
                      >
                        {isCS ? `⚡ ${edge.label}` : isAI ? `✦ ${edge.label}` : edge.label}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>

          {/* ════════════════════════════════════════════════════════════════
              2. NODES LAYER
             ════════════════════════════════════════════════════════════════ */}
          <g className="nodes-layer">
            {simNodes.map(node => {
              const colors = colorPalette[node.type] || colorPalette.EVIDENCE;
              const isSelected = node.id === selectedNodeId;
              const isHovered = hoveredNode?.id === node.id;
              const isRestricted = node.accessStatus === 'RESTRICTED';
              const r = node.radius;

              const isNeighbor = focusContext.isFocused && focusContext.neighborNodeIds.has(node.id);
              const isQueryHighlighted = isHighlighted(node.id);

              let nodeOpacity = 1.0;
              if (focusContext.isFocused) {
                nodeOpacity = (isSelected || isNeighbor) ? 1.0 : 0.18;
              } else if (!isQueryHighlighted) {
                nodeOpacity = 0.20;
              }

              const labelVisible = isLabelVisible(node);
              const labelText = formatNodeLabel(node);
              const labelWidth = Math.max(64, labelText.length * 6.5 + 16);

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  opacity={nodeOpacity}
                  className="transition-opacity duration-200"
                  style={{ cursor: 'pointer' }}
                  onMouseDown={(e) => handleNodeDragStart(e, node)}
                  onClick={() => {
                    onNodeClick?.(node);
                    onSelectNode?.(node.id);
                  }}
                  onMouseEnter={(e) => handleNodeMouseEnter(e, node)}
                  onMouseLeave={handleNodeMouseLeave}
                >
                  {/* ── Selection Outer Halo & Tactical Crosshairs ── */}
                  {isSelected && (
                    <g className="pointer-events-none">
                      <circle
                        r={r + 9}
                        fill="none"
                        stroke={isLight ? '#1D4ED8' : colors.border}
                        strokeWidth="2"
                        strokeDasharray="4 2"
                        opacity="0.85"
                        className="animate-spin"
                        style={{ animationDuration: '10s' }}
                      />
                      <circle
                        r={r + 14}
                        fill="none"
                        stroke={isLight ? '#3B82F6' : colors.light}
                        strokeWidth="1.5"
                        opacity="0.4"
                        filter="url(#focus-glow)"
                      />
                      {/* Corner Bracket Crosshairs */}
                      <path
                        d={`M ${-r - 12} ${-r - 6} L ${-r - 12} ${-r - 12} L ${-r - 6} ${-r - 12}`}
                        stroke={isLight ? '#1D4ED8' : colors.light}
                        strokeWidth="1.5"
                        fill="none"
                      />
                      <path
                        d={`M ${r + 6} ${-r - 12} L ${r + 12} ${-r - 12} L ${r + 12} ${-r - 6}`}
                        stroke={isLight ? '#1D4ED8' : colors.light}
                        strokeWidth="1.5"
                        fill="none"
                      />
                      <path
                        d={`M ${-r - 12} ${r + 6} L ${-r - 12} ${r + 12} L ${-r - 6} ${r + 12}`}
                        stroke={isLight ? '#1D4ED8' : colors.light}
                        strokeWidth="1.5"
                        fill="none"
                      />
                      <path
                        d={`M ${r + 6} ${r + 12} L ${r + 12} ${r + 12} L ${r + 12} ${r + 6}`}
                        stroke={isLight ? '#1D4ED8' : colors.light}
                        strokeWidth="1.5"
                        fill="none"
                      />
                    </g>
                  )}

                  {/* ── Cross-Station Dashed Orbit ── */}
                  {node.isCrossStation && !isRestricted && (
                    <circle
                      r={r + 5}
                      fill="none"
                      stroke={isLight ? '#DC2626' : '#ef4444'}
                      strokeWidth="1.2"
                      strokeDasharray="4 3"
                      opacity="0.75"
                      className="pointer-events-none"
                    />
                  )}

                  {/* ── AI Discovered Sparkle Orbit ── */}
                  {node.isAiDiscovered && !isRestricted && !node.isCrossStation && (
                    <circle
                      r={r + 4}
                      fill="none"
                      stroke={isLight ? '#0891B2' : '#06b6d4'}
                      strokeWidth="1.2"
                      strokeDasharray="3 2"
                      opacity="0.75"
                      className="pointer-events-none"
                    />
                  )}

                  {/* ── Main Node Circle ── */}
                  <circle
                    r={r}
                    fill={
                      isRestricted
                        ? (isLight ? '#FEF2F2' : '#1a1016')
                        : isSelected
                        ? (isLight ? '#EFF6FF' : colors.base)
                        : (isLight ? '#FFFFFF' : '#0f172a')
                    }
                    stroke={
                      isRestricted
                        ? (isLight ? '#DC2626' : '#ef4444')
                        : isSelected
                        ? (isLight ? '#1D4ED8' : '#ffffff')
                        : colors.border
                    }
                    strokeWidth={isSelected ? 2.5 : isRestricted ? 2.0 : 1.75}
                    className="transition-transform duration-150"
                    style={{ transform: isHovered ? 'scale(1.1)' : 'scale(1)' }}
                  />

                  {/* Inner Tint for Non-Restricted Nodes */}
                  {!isRestricted && (
                    <circle
                      r={r - 3}
                      fill={colors.base}
                      opacity={isLight ? '0.12' : '0.22'}
                      className="pointer-events-none"
                    />
                  )}

                  {/* ── Node Icon ── */}
                  {isRestricted ? (
                    <g transform="translate(-7, -8)" className="pointer-events-none">
                      <path
                        d="M3 10H1V7a5 5 0 0110 0v3h-2V7a3 3 0 00-6 0v3zm9 0H2a1 1 0 00-1 1v6a1 1 0 001 1h10a1 1 0 001-1v-6a1 1 0 00-1-1zm-5 4a1 1 0 11.001 2.001A1 1 0 016 14z"
                        fill={isLight ? '#DC2626' : '#ef4444'}
                        transform="scale(0.75)"
                      />
                    </g>
                  ) : (
                    <g transform="translate(-8, -8)" className="pointer-events-none">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={isLight ? (isSelected ? '#1D4ED8' : colors.light) : (isSelected ? '#ffffff' : colors.light)}
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d={NODE_ICONS[node.type] || NODE_ICONS.EVIDENCE} />
                      </svg>
                    </g>
                  )}

                  {/* ── Degree Badge (Mini Indicator) ── */}
                  {node.degree > 1 && (
                    <g transform={`translate(${r - 2}, ${-r + 2})`} className="pointer-events-none">
                      <circle
                        r="6.5"
                        fill={isLight ? '#FFFFFF' : '#0b1222'}
                        stroke={colors.border}
                        strokeWidth="1"
                      />
                      <text
                        y="2.5"
                        textAnchor="middle"
                        fontSize="7"
                        fontWeight="bold"
                        fontFamily="ui-monospace, monospace"
                        fill={isLight ? colors.light : colors.light}
                      >
                        {node.degree}
                      </text>
                    </g>
                  )}

                  {/* ── Progressive Label Pill ── */}
                  {labelVisible && (
                    <g transform={`translate(0, ${r + 5})`} className="pointer-events-none">
                      <rect
                        x={-labelWidth / 2}
                        y="0"
                        width={labelWidth}
                        height={node.sublabel && zoomLevel > 1.3 ? "24" : "15"}
                        rx="4"
                        fill={isLight ? '#FFFFFF' : '#0b1222'}
                        stroke={isSelected ? (isLight ? '#1D4ED8' : colors.light) : isRestricted ? (isLight ? '#DC2626' : '#ef4444') : (isLight ? '#D9E0E8' : '#1e293b')}
                        strokeWidth={isSelected ? "1.5" : "1"}
                        opacity="0.96"
                        className={isLight ? 'shadow-xs' : ''}
                      />
                      <text
                        y="10.5"
                        textAnchor="middle"
                        fontSize="8.5"
                        fontWeight="bold"
                        fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
                        fill={
                          isRestricted
                            ? (isLight ? '#B91C1C' : '#f87171')
                            : isSelected
                            ? (isLight ? '#1D4ED8' : '#ffffff')
                            : (isLight ? '#172033' : '#e2e8f0')
                        }
                      >
                        {labelText}
                      </text>
                      {node.sublabel && zoomLevel > 1.3 && (
                        <text
                          y="20"
                          textAnchor="middle"
                          fontSize="7"
                          fontFamily="ui-monospace, monospace"
                          fill={isLight ? '#5B6678' : '#94a3b8'}
                        >
                          {node.sublabel.length > 18 ? node.sublabel.slice(0, 16) + '…' : node.sublabel}
                        </text>
                      )}
                    </g>
                  )}
                </g>
              );
            })}
          </g>

        </g>
      </svg>

      {/* ════════════════════════════════════════════════════════════════
          3. RICH TACTICAL HOVER TOOLTIP (Zero Authorization Leak)
         ════════════════════════════════════════════════════════════════ */}
      {hoveredNode && tooltipPos && (
        <div
          className="absolute z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3"
          style={{
            left: `${Math.max(140, Math.min(dimensions.width - 140, tooltipPos.x))}px`,
            top: `${tooltipPos.y - 12}px`,
          }}
        >
          <div className={`p-3 rounded-xl border shadow-xl w-64 text-left backdrop-blur-md ${
            isLight ? 'bg-white/95 border-[#D9E0E8] text-[#172033]' : 'bg-[#0b1222]/95 border-[#1e293b] text-slate-100'
          }`}>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span
                className="text-[9px] font-bold font-mono uppercase tracking-wider px-2 py-0.5 rounded border"
                style={{
                  color: colorPalette[hoveredNode.type].light,
                  borderColor: colorPalette[hoveredNode.type].border,
                  backgroundColor: colorPalette[hoveredNode.type].bg,
                }}
              >
                {hoveredNode.type}
              </span>
              {hoveredNode.accessStatus === 'RESTRICTED' ? (
                <span className={`flex items-center gap-1 text-[9px] font-bold font-mono px-1.5 py-0.5 rounded border ${
                  isLight ? 'text-[#B91C1C] bg-red-50 border-red-200' : 'text-red-400 bg-red-950/60 border-red-800/60'
                }`}>
                  <Lock size={9} /> RESTRICTED
                </span>
              ) : (
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                  isLight ? 'text-[#15803D] bg-emerald-50 border-emerald-200' : 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40'
                }`}>
                  AUTHORIZED
                </span>
              )}
            </div>

            <div className={`font-mono text-xs font-bold mb-0.5 truncate ${isLight ? 'text-[#172033]' : 'text-slate-100'}`}>
              {hoveredNode.label}
            </div>
            {hoveredNode.sublabel && (
              <div className={`text-[10px] mb-2 truncate ${isLight ? 'text-[#5B6678]' : 'text-slate-400'}`}>
                {hoveredNode.sublabel}
              </div>
            )}

            <div className={`border-t pt-2 space-y-1 text-[10px] ${isLight ? 'border-[#E4E7EC]' : 'border-[#1e293b]'}`}>
              {hoveredNode.stationId && (
                <div className={`flex items-center justify-between ${isLight ? 'text-[#5B6678]' : 'text-slate-400'}`}>
                  <span>Station:</span>
                  <span className={`font-mono ${isLight ? 'text-[#172033]' : 'text-slate-200'}`}>{hoveredNode.stationId}</span>
                </div>
              )}
              <div className={`flex items-center justify-between ${isLight ? 'text-[#5B6678]' : 'text-slate-400'}`}>
                <span>Connections:</span>
                <span className={`font-mono font-bold ${isLight ? 'text-[#1D4ED8]' : 'text-sky-400'}`}>{hoveredNode.degree} links</span>
              </div>
              {hoveredNode.isCrossStation && (
                <div className={`flex items-center justify-between font-semibold ${isLight ? 'text-[#B91C1C]' : 'text-red-400'}`}>
                  <span>Intel Overlap:</span>
                  <span>Cross-Station Link</span>
                </div>
              )}
              {hoveredNode.isAiDiscovered && (
                <div className={`flex items-center justify-between font-semibold ${isLight ? 'text-[#0891B2]' : 'text-cyan-400'}`}>
                  <span>Detection:</span>
                  <span>AI Pattern Match</span>
                </div>
              )}
            </div>

            {hoveredNode.accessStatus === 'RESTRICTED' && (
              <div className={`mt-2 pt-1.5 border-t text-[9px] flex items-start gap-1 ${
                isLight ? 'border-red-100 text-[#B91C1C]' : 'border-red-900/40 text-red-300'
              }`}>
                <AlertTriangle size={11} className={`shrink-0 mt-0.5 ${isLight ? 'text-[#DC2626]' : 'text-red-400'}`} />
                <span>Confidential Record · Request station authorization to inspect details.</span>
              </div>
            )}

            <div className={`mt-2 text-[8.5px] font-mono text-center ${isLight ? 'text-[#7A8699]' : 'text-slate-500'}`}>
              Click node to inspect intelligence dossier
            </div>
          </div>
        </div>
      )}

      {/* Edge Hover Tooltip */}
      {hoveredEdge && tooltipPos && (
        <div
          className="absolute z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3"
          style={{
            left: `${Math.max(120, Math.min(dimensions.width - 120, tooltipPos.x))}px`,
            top: `${tooltipPos.y - 10}px`,
          }}
        >
          <div className={`p-3 rounded-lg border shadow-xl text-left font-mono text-[10px] backdrop-blur-md ${
            isLight ? 'bg-white/95 border-[#D9E0E8] text-[#172033]' : 'bg-[#0b1222]/95 border-[#1e293b] text-slate-100'
          }`}>
            <div className="flex items-center gap-1.5 font-bold mb-1" style={{
              color: hoveredEdge.isCrossStation
                ? (isLight ? '#B91C1C' : '#f87171')
                : hoveredEdge.isAiDiscovered
                ? (isLight ? '#0369A1' : '#67e8f9')
                : (isLight ? '#172033' : '#cbd5e1')
            }}>
              {hoveredEdge.isCrossStation ? '⚡ CROSS-STATION MATCH' : hoveredEdge.isAiDiscovered ? '✦ AI PATTERN LINK' : '🔗 LOCAL RELATIONSHIP'}
            </div>
            <div className={isLight ? 'text-[#5B6678]' : 'text-slate-300'}>{hoveredEdge.label}</div>
            {hoveredEdge.confidence && (
              <div className={`text-[9px] mt-0.5 font-semibold ${isLight ? 'text-[#B45309]' : 'text-amber-400'}`}>
                Confidence: {hoveredEdge.confidence}%
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
