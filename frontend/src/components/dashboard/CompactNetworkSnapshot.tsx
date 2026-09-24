import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { useNavigate } from 'react-router-dom';
import { Network, ZoomIn, ZoomOut, RotateCcw, ArrowUpRight, Shield, Layers } from 'lucide-react';
import { CaseRecord } from '../../mockServices/types';

export interface MiniNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: 'PERSON' | 'PHONE' | 'VEHICLE' | 'CASE' | 'ORGANIZATION';
  role?: string;
  attentionLevel: 'HIGH' | 'MEDIUM' | 'REVIEW';
  color: string;
  icon: string;
  x?: number;
  y?: number;
}

export interface MiniLink extends d3.SimulationLinkDatum<MiniNode> {
  id: string;
  source: string | MiniNode;
  target: string | MiniNode;
  label?: string;
}

interface CompactNetworkSnapshotProps {
  onSelectEntity?: (node: MiniNode) => void;
  selectedEntityId?: string;
}

const SAMPLE_NODES: MiniNode[] = [
  { id: 'p1', name: 'Rahul Verma', type: 'PERSON', role: 'Named Accused', attentionLevel: 'HIGH', color: '#EF4444', icon: '👤' },
  { id: 'p2', name: 'Vikas @ Vicky', type: 'PERSON', role: 'Associated Subject', attentionLevel: 'MEDIUM', color: '#F97316', icon: '👤' },
  { id: 'p3', name: 'Sonu Bhai', type: 'PERSON', role: 'Associated Subject', attentionLevel: 'REVIEW', color: '#F59E0B', icon: '👤' },
  { id: 'ph1', name: '+91 98765 43210', type: 'PHONE', role: 'Associated Number', attentionLevel: 'HIGH', color: '#38BDF8', icon: '📞' },
  { id: 'v1', name: 'OD-02-AK-4455', type: 'VEHICLE', role: 'Observed Vehicle', attentionLevel: 'MEDIUM', color: '#8B5CF6', icon: '🚗' },
  { id: 'c1', name: 'FIR-2026-BBSR-001', type: 'CASE', role: 'Khandagiri Incident', attentionLevel: 'HIGH', color: '#3B82F6', icon: '📁' },
  { id: 'c2', name: 'FIR-2026-CTC-014', type: 'CASE', role: 'Cuttack Investigation', attentionLevel: 'MEDIUM', color: '#3B82F6', icon: '📁' },
  { id: 'o1', name: 'Shivam Traders', type: 'ORGANIZATION', role: 'Associated Commercial Unit', attentionLevel: 'REVIEW', color: '#10B981', icon: '🏢' },
];

const SAMPLE_LINKS: MiniLink[] = [
  { id: 'l1', source: 'p1', target: 'p2', label: 'Reported Associate' },
  { id: 'l2', source: 'p1', target: 'ph1', label: 'Call Log Match' },
  { id: 'l3', source: 'p1', target: 'v1', label: 'Observed User' },
  { id: 'l4', source: 'p1', target: 'c1', label: 'Named in FIR' },
  { id: 'l5', source: 'p2', target: 'o1', label: 'Commercial Signatory' },
  { id: 'l6', source: 'p3', target: 'p1', label: 'Transaction Link' },
  { id: 'l7', source: 'ph1', target: 'c2', label: 'Communication Match' },
];

export function CompactNetworkSnapshot({ onSelectEntity, selectedEntityId }: CompactNetworkSnapshotProps) {
  const navigate = useNavigate();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeNode, setActiveNode] = useState<MiniNode | null>(SAMPLE_NODES[0]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 360;
    const height = 280;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('viewBox', [0, 0, width, height]);

    // Create subtle grid background
    const defs = svg.append('defs');
    const pattern = defs
      .append('pattern')
      .attr('id', 'compact-grid-pattern')
      .attr('width', 20)
      .attr('height', 20)
      .attr('patternUnits', 'userSpaceOnUse');

    pattern
      .append('circle')
      .attr('cx', 10)
      .attr('cy', 10)
      .attr('r', 0.75)
      .attr('fill', 'currentColor')
      .attr('class', 'text-slate-400/20 dark:text-slate-600/30');

    svg
      .append('rect')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('fill', 'url(#compact-grid-pattern)');

    const g = svg.append('g');

    // Zoom setup
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Clone data for simulation
    const nodes: MiniNode[] = SAMPLE_NODES.map((d, i) => {
      const angle = i * 2.39996;
      const radius = 25 * Math.sqrt(i + 1);
      return {
        ...d,
        x: width / 2 + radius * Math.cos(angle),
        y: height / 2 + radius * Math.sin(angle),
      };
    });

    const links: MiniLink[] = SAMPLE_LINKS.map((d) => ({ ...d }));

    const simulation = d3.forceSimulation<MiniNode>(nodes)
      .force('link', d3.forceLink<MiniNode, MiniLink>(links).id((d) => d.id).distance(50))
      .force('charge', d3.forceManyBody().strength(-140))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(24))
      .velocityDecay(0.62)
      .alphaDecay(0.045);

    // Pre-warmed ticks
    for (let i = 0; i < 40; ++i) simulation.tick();

    // Render Links
    const link = g
      .append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#38BDF8')
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '3,3');

    // Render Nodes
    const node = g
      .append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('cursor', 'pointer')
      .call(
        d3.drag<SVGGElement, MiniNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.2).restart();
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
          }) as any
      );

    // Outer ring
    node
      .append('circle')
      .attr('r', 16)
      .attr('fill', (d) => `${d.color}20`)
      .attr('stroke', (d) => d.color)
      .attr('stroke-width', (d) => (d.id === (selectedEntityId || activeNode?.id) ? 2.5 : 1.2));

    // Inner circle
    node
      .append('circle')
      .attr('r', 11)
      .attr('fill', (d) => d.color);

    // Emoji icon
    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', '10px')
      .text((d) => d.icon);

    // Node label
    node
      .append('text')
      .attr('y', 22)
      .attr('text-anchor', 'middle')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .attr('fill', 'currentColor')
      .attr('class', 'text-text dark:text-[#E2E8F0] fill-current drop-shadow-xs')
      .text((d) => (d.name.length > 12 ? `${d.name.slice(0, 11)}…` : d.name));

    node.on('click', (event, d) => {
      event.stopPropagation();
      setActiveNode(d);
      if (onSelectEntity) onSelectEntity(d);
    });

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [selectedEntityId, activeNode?.id, onSelectEntity]);

  return (
    <div className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl p-4 flex flex-col justify-between shadow-xs dark:shadow-2xl font-sans select-none h-full transition-colors">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border-soft dark:border-[#1E293B] mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent dark:bg-[#38BDF8] animate-pulse" />
            <h2 className="text-xs sm:text-sm font-bold font-mono uppercase tracking-wider text-text dark:text-[#F8FAFC]">
              NETWORK ACTIVITY SNAPSHOT
            </h2>
          </div>

          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-accent/15 dark:bg-[#38BDF8]/15 text-accent dark:text-[#38BDF8] border border-accent/30 dark:border-[#38BDF8]/30">
            ASSOCIATION GRAPH
          </span>
        </div>

        {/* Mini Graph Canvas Container */}
        <div ref={containerRef} className="relative w-full h-[240px] rounded-lg bg-surface-2 dark:bg-[#070A0F] border border-border-soft dark:border-[#1E293B] overflow-hidden">
          <svg ref={svgRef} className="w-full h-full text-slate-400 dark:text-slate-600" />

          {/* Overlay Info Card */}
          {activeNode && (
            <div className="absolute bottom-2 left-2 right-2 p-2 rounded-md bg-surface/95 dark:bg-[#0E1422]/95 backdrop-blur-md border border-border-soft dark:border-[#1E293B] flex items-center justify-between font-mono text-[11px] shadow-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeNode.color }} />
                <span className="font-bold text-text dark:text-[#F8FAFC] truncate">{activeNode.name}</span>
                <span className="text-[10px] text-text-dim dark:text-[#94A3B8]">({activeNode.role || activeNode.type})</span>
              </div>
              <span className="text-[10px] font-bold text-accent dark:text-[#38BDF8] shrink-0">
                Attention: {activeNode.attentionLevel}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer link to full network explorer */}
      <div className="pt-3 mt-2 border-t border-border-soft dark:border-[#1E293B] flex items-center justify-between font-mono text-[11px]">
        <span className="text-text-dim dark:text-[#64748B]">Entity associations requiring investigator review</span>
        <button
          onClick={() => navigate('/network')}
          className="text-accent dark:text-[#38BDF8] hover:underline flex items-center gap-1 font-bold cursor-pointer"
        >
          <span>Open Full Interactive Graph</span>
          <ArrowUpRight size={12} />
        </button>
      </div>
    </div>
  );
}
