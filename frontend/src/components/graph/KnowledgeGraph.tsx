import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { NetworkNode, NetworkEdge } from '../../mockServices/networkGraphData';
import { GraphNode, GraphEdge } from '../../services/graphIntelligenceService';
import { GraphHeaderControls, InvestigationToolMode, PresetFilter } from './GraphHeaderControls';
import { NodeDetailPanel } from './NodeDetailPanel';
import { AlertTriangle, RefreshCw, Network, Loader2, ZoomIn, ZoomOut, RotateCcw, Maximize2 } from 'lucide-react';

export interface KnowledgeGraphProps {
  nodes: (NetworkNode | GraphNode)[];
  edges: (NetworkEdge | GraphEdge)[];
  selectedNodeId?: string | null;
  onSelectNode?: (nodeId: string | null) => void;
  onNodeClick?: (node: NetworkNode) => void;
  onExpandNode?: (nodeId: string) => void;
  mode?: 'explorer' | 'workspace';
  title?: string;
  subtitle?: string;
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

interface D3GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: string;
  rawType: string;
  stationId?: string;
  isCrossStation?: boolean;
  isAiDiscovered?: boolean;
  isFocus?: boolean;
  isFlagged?: boolean;
  color: string;
  icon: string;
  subtext?: string;
  rawNodeObject: any;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface D3GraphLink extends d3.SimulationLinkDatum<D3GraphNode> {
  id: string;
  source: string | D3GraphNode;
  target: string | D3GraphNode;
  relationship: string;
  color: string;
  isCrossStation?: boolean;
  isAiDiscovered?: boolean;
  isDashed?: boolean;
}

function getNodeIconAndColor(rawType?: string): { color: string; icon: string } {
  if (!rawType) return { color: '#06B6D4', icon: '👤' };
  const upper = rawType.toUpperCase();
  if (upper.includes('PHONE') || upper.includes('CALL')) return { color: '#F59E0B', icon: '📞' };
  if (upper.includes('VEHICLE') || upper.includes('CAR')) return { color: '#8B5CF6', icon: '🚗' };
  if (upper.includes('LOC') || upper.includes('ADDRESS')) return { color: '#F97316', icon: '📍' };
  if (upper.includes('CASE') || upper.includes('FIR')) return { color: '#3B82F6', icon: '📁' };
  if (upper.includes('ORG') || upper.includes('COMPANY') || upper.includes('TRAD')) return { color: '#06B6D4', icon: '🏢' };
  if (upper.includes('BANK') || upper.includes('UPI') || upper.includes('WALLET') || upper.includes('FINAN')) return { color: '#10B981', icon: '💳' };
  if (upper.includes('EVIDENCE')) return { color: '#64748B', icon: '🔍' };
  if (upper.includes('SUSPECT') || upper.includes('ACCUSED') || upper.includes('TARGET')) return { color: '#EF4444', icon: '👤' };
  return { color: '#10B981', icon: '👤' };
}

function getLinkColorAndStyle(rel?: string): { color: string; isDashed: boolean } {
  if (!rel) return { color: '#38BDF8', isDashed: false };
  const upper = rel.toUpperCase();
  if (upper.includes('CALL') || upper.includes('COMMUNICAT') || upper.includes('PHONE')) {
    return { color: '#10B981', isDashed: true };
  }
  if (upper.includes('FINAN') || upper.includes('TRANSACT') || upper.includes('BANK') || upper.includes('UPI')) {
    return { color: '#F59E0B', isDashed: false };
  }
  if (upper.includes('VEHICLE') || upper.includes('DRIVES') || upper.includes('OPERATES')) {
    return { color: '#8B5CF6', isDashed: true };
  }
  if (upper.includes('INVOLV') || upper.includes('SUSPECT') || upper.includes('CHARGED')) {
    return { color: '#EF4444', isDashed: false };
  }
  if (upper.includes('ASSOC') || upper.includes('MEMBER') || upper.includes('ACCOMPLICE')) {
    return { color: '#38BDF8', isDashed: true };
  }
  return { color: '#6366F1', isDashed: false };
}

export function KnowledgeGraph({
  nodes,
  edges,
  selectedNodeId: externalSelectedNodeId,
  onSelectNode,
  onNodeClick,
  onExpandNode,
  mode = 'explorer',
  title = 'S.I.R.I.S CYBER INTELLIGENCE GRAPH',
  subtitle,
  isLoading = false,
  error = null,
  onRefresh,
}: KnowledgeGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const simulationRef = useRef<d3.Simulation<D3GraphNode, D3GraphLink> | null>(null);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(externalSelectedNodeId || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [presetFilter, setPresetFilter] = useState<PresetFilter>('ALL');
  const [toolMode, setToolMode] = useState<InvestigationToolMode>('EXPLORE');
  const [showLabels, setShowLabels] = useState(true);
  const [hoveredNode, setHoveredNode] = useState<D3GraphNode | null>(null);
  const [hoveredPos, setHoveredPos] = useState<{ x: number; y: number } | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [currentZoomScale, setCurrentZoomScale] = useState(1);

  // Sync external selection
  useEffect(() => {
    if (externalSelectedNodeId !== undefined) {
      setSelectedNodeId(externalSelectedNodeId);
    }
  }, [externalSelectedNodeId]);

  // ResizeObserver for responsive canvas
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height: Math.max(450, height) });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Format D3 Nodes & Links
  const { d3Nodes, d3Links } = useMemo(() => {
    const nodeMap = new Map<string, D3GraphNode>();

    nodes.forEach((n, idx) => {
      const rawId = n.id || `node-${idx}`;
      if (!rawId || nodeMap.has(rawId)) return;

      const label = n.label || (n as any).name || (n as any).title || rawId;
      const rawType = (n as any).entity_type || n.type || (n as any).node_type || 'OTHER';
      const isFlagged = Boolean((n as any).is_flagged || (n as any).is_important);
      const isFocus = Boolean((n as any).is_focus || idx === 0);

      const { color, icon } = getNodeIconAndColor(rawType);

      nodeMap.set(rawId, {
        id: rawId,
        label,
        type: rawType,
        rawType,
        stationId: (n as any).station_id || n.stationId,
        isCrossStation: Boolean(n.isCrossStation),
        isAiDiscovered: Boolean(n.isAiDiscovered),
        isFocus,
        isFlagged,
        color: isFlagged ? '#EF4444' : color,
        icon,
        subtext: (n as any).district || (n as any).sublabel || rawType,
        rawNodeObject: n,
      });
    });

    const linksList: D3GraphLink[] = [];
    const edgeSet = new Set<string>();

    edges.forEach((e, idx) => {
      const src = typeof e.source === 'object' ? (e.source as any).id : e.source;
      const tgt = typeof e.target === 'object' ? (e.target as any).id : e.target;

      if (!src || !tgt || !nodeMap.has(src) || !nodeMap.has(tgt) || src === tgt) return;

      const edgeKey = `${src}---${tgt}`;
      if (edgeSet.has(edgeKey)) return;
      edgeSet.add(edgeKey);

      const rel = e.relationship || (e as any).label || 'CONNECTED_TO';
      const { color, isDashed } = getLinkColorAndStyle(rel);

      linksList.push({
        id: e.id || `edge-${idx}`,
        source: src,
        target: tgt,
        relationship: rel,
        color,
        isCrossStation: Boolean((e as any).isCrossStation),
        isAiDiscovered: Boolean((e as any).isAiDiscovered),
        isDashed,
      });
    });

    return { d3Nodes: Array.from(nodeMap.values()), d3Links: linksList };
  }, [nodes, edges]);

  // Statistics
  const stats = useMemo(() => {
    return {
      entityCount: d3Nodes.length,
      edgeCount: d3Links.length,
      caseCount: d3Nodes.filter((n) => n.type.toUpperCase().includes('CASE')).length,
    };
  }, [d3Nodes, d3Links]);

  // Selected Node Object
  const selectedNodeObject = useMemo(() => {
    if (!selectedNodeId) return null;
    const found = d3Nodes.find((n) => n.id === selectedNodeId);
    if (!found) return null;
    return (found.rawNodeObject as NetworkNode) || {
      id: found.id,
      label: found.label,
      type: (found.type as any) || 'PERSON',
      stationId: found.stationId || 'OP-BBSR-CAP',
      accessStatus: 'AUTHORIZED',
      isCrossStation: found.isCrossStation,
      isAiDiscovered: found.isAiDiscovered,
      sublabel: found.subtext,
    };
  }, [selectedNodeId, d3Nodes]);

  // Zoom controls
  const handleZoomIn = () => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 1.3);
  };

  const handleZoomOut = () => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 0.7);
  };

  const handleResetView = () => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(400)
      .call(zoomRef.current.transform, d3.zoomIdentity);
  };

  // Run D3 Force Simulation
  useEffect(() => {
    if (!svgRef.current || d3Nodes.length === 0) return;

    const isDark =
      document.documentElement.classList.contains('dark') ||
      document.documentElement.classList.contains('theme-dark');
    const { width, height } = dimensions;
    const cx = width / 2;
    const cy = height / 2;

    const isLarge = d3Nodes.length > 35;

    // Golden spiral phyllotaxis for balanced initial distribution
    const simNodes: D3GraphNode[] = d3Nodes.map((n, idx) => {
      const phi = idx * 2.39996; // Golden angle
      const spread = isLarge ? 28 : 38;
      const r = n.isFocus ? 0 : spread * Math.sqrt(idx + 1);
      return {
        ...n,
        x: cx + Math.cos(phi) * r,
        y: cy + Math.sin(phi) * r,
      };
    });

    const simLinks: D3GraphLink[] = d3Links.map((l) => ({ ...l }));

    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    const chargeStrength = isLarge ? -90 : -320;
    const linkDistance = (d: D3GraphLink) => (d.isCrossStation ? 120 : (isLarge ? 75 : 95));
    const collideRadius = (d: D3GraphNode) => (d.isFocus ? 26 : (isLarge ? 17 : 22));

    const simulation = d3
      .forceSimulation<D3GraphNode, D3GraphLink>(simNodes)
      .force(
        'link',
        d3
          .forceLink<D3GraphNode, D3GraphLink>(simLinks)
          .id((d) => d.id)
          .distance(linkDistance)
      )
      .force('charge', d3.forceManyBody().strength(chargeStrength).distanceMax(500))
      .force('center', d3.forceCenter(cx, cy).strength(isLarge ? 0.03 : 0.05))
      .force('collide', d3.forceCollide<D3GraphNode>().radius(collideRadius).strength(0.85))
      .velocityDecay(0.62)
      .alphaDecay(0.045)
      .alphaMin(0.001);

    // Pre-warm simulation ticks so the graph renders already settled (eliminates violent wobbling!)
    for (let i = 0; i < 45; ++i) {
      simulation.tick();
    }

    simulationRef.current = simulation;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Tactical Grid Pattern
    const defs = svg.append('defs');
    const pattern = defs
      .append('pattern')
      .attr('id', 'kg-grid-pattern')
      .attr('width', 28)
      .attr('height', 28)
      .attr('patternUnits', 'userSpaceOnUse');

    pattern
      .append('path')
      .attr('d', 'M 28 0 L 0 0 0 28')
      .attr('fill', 'none')
      .attr('stroke', isDark ? '#1E293B' : '#E2E8F0')
      .attr('stroke-width', 0.6)
      .attr('opacity', 0.65);

    svg.append('rect').attr('width', width).attr('height', height).attr('fill', 'url(#kg-grid-pattern)');

    // Main Zoom Group
    const g = svg.append('g').attr('class', 'graph-layer');
    gRef.current = g;

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.25, 4.0])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setCurrentZoomScale(event.transform.k);
      });

    zoomRef.current = zoom;
    svg.call(zoom);

    // Links (Lines)
    const linkGroup = g
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(simLinks)
      .enter()
      .append('line')
      .attr('stroke', (d) => d.color)
      .attr('stroke-width', (d) => (d.isCrossStation ? 2.25 : 1.5))
      .attr('stroke-dasharray', (d) => (d.isDashed ? '4 3' : null))
      .attr('opacity', isDark ? 0.7 : 0.85);

    // Nodes (Groups)
    const nodeGroup = g
      .append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(simNodes)
      .enter()
      .append('g')
      .attr('class', 'node-item')
      .attr('cursor', 'pointer')
      .call(
        d3
          .drag<SVGGElement, D3GraphNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.25).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      )
      .on('click', (_, d) => {
        setSelectedNodeId(d.id);
        if (onSelectNode) onSelectNode(d.id);
        if (onNodeClick) onNodeClick(d.rawNodeObject);
      })
      .on('mouseenter', (event, d) => {
        setHoveredNode(d);
        const [mx, my] = d3.pointer(event, containerRef.current);
        setHoveredPos({ x: mx, y: my });

        // Highlight connected links & neighbors
        const neighborSet = new Set<string>([d.id]);
        linkGroup.each((l: any) => {
          const sId = typeof l.source === 'object' ? l.source.id : l.source;
          const tId = typeof l.target === 'object' ? l.target.id : l.target;
          if (sId === d.id) neighborSet.add(tId);
          if (tId === d.id) neighborSet.add(sId);
        });

        nodeGroup.attr('opacity', (n: any) => (neighborSet.has(n.id) ? 1 : 0.22));
        linkGroup.attr('opacity', (l: any) => {
          const sId = typeof l.source === 'object' ? l.source.id : l.source;
          const tId = typeof l.target === 'object' ? l.target.id : l.target;
          return sId === d.id || tId === d.id ? 1 : 0.12;
        });
      })
      .on('mousemove', (event) => {
        const [mx, my] = d3.pointer(event, containerRef.current);
        setHoveredPos({ x: mx, y: my });
      })
      .on('mouseleave', () => {
        setHoveredNode(null);
        setHoveredPos(null);
        nodeGroup.attr('opacity', 1);
        linkGroup.attr('opacity', isDark ? 0.7 : 0.85);
      });

    // High Value / Focus Pulse Ring
    nodeGroup
      .filter((d) => Boolean(d.isFlagged || d.isFocus))
      .append('circle')
      .attr('r', isLarge ? 22 : 26)
      .attr('fill', 'none')
      .attr('stroke', (d) => (d.isFlagged ? '#EF4444' : '#38BDF8'))
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4 2')
      .attr('class', 'animate-spin')
      .attr('opacity', 0.85);

    // Search query halo ring
    nodeGroup
      .filter((d) => Boolean(searchQuery && d.label.toLowerCase().includes(searchQuery.toLowerCase())))
      .append('circle')
      .attr('r', 24)
      .attr('fill', 'none')
      .attr('stroke', '#F59E0B')
      .attr('stroke-width', 3.5)
      .attr('opacity', 0.9);

    // Main Node Circle
    nodeGroup
      .append('circle')
      .attr('r', (d) => (d.isFocus ? 17 : (isLarge ? 13 : 15)))
      .attr('fill', (d) => d.color)
      .attr('stroke', (d) => (d.id === selectedNodeId ? (isDark ? '#FFFFFF' : '#1E293B') : (isDark ? '#0B0F17' : '#FFFFFF')))
      .attr('stroke-width', (d) => (d.id === selectedNodeId ? 3.5 : 2))
      .attr('filter', 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))');

    // Centered Node Icon / Emoji
    nodeGroup
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 4)
      .attr('font-size', (d) => (d.isFocus ? 10 : (isLarge ? 8.5 : 9)))
      .attr('font-weight', 'bold')
      .attr('fill', '#FFFFFF')
      .text((d) => d.icon);

    // Node Name Label — with Smart Level-of-Detail (LOD) Anti-Clutter
    if (showLabels) {
      nodeGroup
        .filter((d) => {
          if (!isLarge) return true;
          // In dense graphs (>35 nodes), only show labels for focus, flagged, or selected nodes
          return Boolean(d.isFocus || d.isFlagged || d.id === selectedNodeId);
        })
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', (d) => (d.isFocus ? 30 : 25))
        .attr('font-size', isLarge ? 8.5 : 9.5)
        .attr('font-weight', 'bold')
        .attr('font-family', 'ui-monospace, Consolas, monospace')
        .attr('fill', (d) => (d.isFlagged ? '#EF4444' : isDark ? '#E2E8F0' : '#1E293B'))
        .text((d) => (d.label.length > 15 ? d.label.slice(0, 13) + '…' : d.label));
    }

    simulation.on('tick', () => {
      linkGroup
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      nodeGroup.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [d3Nodes, d3Links, dimensions, selectedNodeId, showLabels, searchQuery]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[580px] flex flex-col bg-surface dark:bg-[#070A0F] border border-border-soft dark:border-[#1E293B] rounded-2xl shadow-xs dark:shadow-2xl overflow-hidden select-none font-sans"
    >
      {/* ── Top Header Controls ── */}
      <GraphHeaderControls
        title={title}
        subtitle={subtitle}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedEntityType={null}
        onEntityTypeChange={() => {}}
        layoutName="force"
        onLayoutChange={() => {}}
        showLabels={showLabels}
        onToggleLabels={() => setShowLabels(!showLabels)}
        onFitView={handleResetView}
        onResetView={handleResetView}
        toolMode={toolMode}
        onToolModeChange={setToolMode}
        presetFilter={presetFilter}
        onPresetFilterChange={setPresetFilter}
        stats={stats}
        isLoading={isLoading}
      />

      {/* ── Main Canvas & Inspector Area ── */}
      <div className="relative flex-1 w-full h-full flex overflow-hidden bg-surface-2 dark:bg-[#070A0F]">
        
        {/* Floating Relationship Legend Box */}
        <div className="absolute top-3 left-3 z-10 bg-surface/90 dark:bg-[#0B0F17]/90 border border-border-soft dark:border-[#1E293B] rounded-xl p-2.5 backdrop-blur-md text-[10px] font-mono space-y-1.5 shadow-sm dark:shadow-xl pointer-events-none">
          <span className="font-bold text-accent dark:text-[#38BDF8] uppercase tracking-wider block text-[9px]">
            RELATIONSHIP TYPES
          </span>
          <div className="space-y-1 text-text-dim dark:text-[#94A3B8]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10B981]" />
              <span>CALL</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
              <span>FINANCIAL</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
              <span>ASSOCIATION</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
              <span>VEHICLE</span>
            </div>
          </div>
        </div>

        {/* Tactical Canvas Controls (Zoom In/Out, Reset) */}
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 bg-surface/90 dark:bg-[#0B0F17]/90 p-1 rounded-xl border border-border-soft dark:border-[#1E293B] shadow-sm">
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg text-text-dim dark:text-[#94A3B8] hover:text-text dark:hover:text-[#F8FAFC] transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg text-text-dim dark:text-[#94A3B8] hover:text-text dark:hover:text-[#F8FAFC] transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>
          <button
            onClick={handleResetView}
            className="p-1.5 rounded-lg text-text-dim dark:text-[#94A3B8] hover:text-text dark:hover:text-[#F8FAFC] transition-colors"
            title="Reset Fit"
          >
            <RotateCcw size={14} />
          </button>
        </div>

        {/* D3 SVG Canvas */}
        <svg ref={svgRef} className="w-full h-full flex-1 cursor-grab active:cursor-grabbing block" />

        {/* Interactive Hover HUD Tooltip */}
        {hoveredNode && hoveredPos && (
          <div
            className="absolute pointer-events-none z-30 bg-surface/95 dark:bg-[#0F172A]/95 border border-border-soft dark:border-cyan-500/30 p-2.5 rounded-xl shadow-2xl backdrop-blur-md text-xs font-mono max-w-xs transition-opacity duration-150 space-y-1"
            style={{
              left: `${Math.min(hoveredPos.x + 16, dimensions.width - 240)}px`,
              top: `${Math.max(12, hoveredPos.y - 45)}px`,
            }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-border-soft dark:border-slate-800 pb-1">
              <span className="font-bold text-text dark:text-white truncate">{hoveredNode.label}</span>
              <span
                className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                style={{ backgroundColor: `${hoveredNode.color}20`, color: hoveredNode.color }}
              >
                {hoveredNode.type}
              </span>
            </div>
            <div className="text-[10px] text-text-dim dark:text-slate-400 space-y-0.5">
              <div>Station: <span className="text-text dark:text-slate-200 font-semibold">{hoveredNode.stationId || 'OP-BBSR-CAP'}</span></div>
              {hoveredNode.subtext && <div>Detail: <span className="text-text dark:text-slate-200">{hoveredNode.subtext}</span></div>}
            </div>
            <div className="text-[9px] text-accent dark:text-cyan-400 font-bold uppercase tracking-wider pt-0.5">
              Click node to open dossier
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-surface/80 dark:bg-[#070A0F]/80 backdrop-blur-xs">
            <div className="p-4 rounded-xl bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] flex items-center gap-2.5 font-mono text-xs text-text shadow-xl">
              <Loader2 size={16} className="text-accent dark:text-[#38BDF8] animate-spin" />
              <span>SYNCHRONIZING GRAPH TOPOLOGY...</span>
            </div>
          </div>
        )}

        {/* Error / Empty State */}
        {error && !isLoading && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-surface/80 dark:bg-[#070A0F]/80 backdrop-blur-xs">
            <div className="p-5 rounded-xl bg-surface-2 dark:bg-[#0E1422] border border-border-soft dark:border-[#1E293B] text-center font-mono text-xs space-y-2 max-w-sm shadow-xl">
              <AlertTriangle size={24} className="text-amber-500 mx-auto" />
              <p className="font-bold text-text">{error}</p>
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  className="px-3 py-1.5 rounded-lg bg-brand text-bg font-bold hover:bg-brand-bright transition-colors"
                >
                  Retry Loading
                </button>
              )}
            </div>
          </div>
        )}

        {/* Right-Side Node Details / Dossier Inspector Panel */}
        {selectedNodeObject && (
          <div className="z-20 h-full">
            <NodeDetailPanel
              node={selectedNodeObject}
              onClose={() => setSelectedNodeId(null)}
              onExpandNode={onExpandNode}
            />
          </div>
        )}
      </div>

      {/* ── Bottom Telemetry Footer ── */}
      <div className="w-full px-4 py-2 bg-surface-2 dark:bg-[#0E1422] border-t border-border-soft dark:border-[#1E293B] flex items-center justify-between text-[10px] font-mono text-text-dim dark:text-[#64748B] z-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>D3 FORCE-DIRECTED GRAPH ENGINE // ACTIVE</span>
          <span>|</span>
          <span>RENDERED: {stats.entityCount} NODES · {stats.edgeCount} LINKS</span>
        </div>
        <div>
          <span>CCTNS-II SYNC: ONLINE</span>
        </div>
      </div>
    </div>
  );
}
