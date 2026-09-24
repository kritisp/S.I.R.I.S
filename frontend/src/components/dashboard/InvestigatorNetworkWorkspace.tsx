import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  Network, Table, Search, Filter, ZoomIn, ZoomOut, RotateCcw, 
  ShieldAlert, User, Phone, Car, Building2, AlertTriangle, 
  ChevronRight, ArrowUpRight, CheckCircle2, Shield, Eye
} from 'lucide-react';
import { CaseRecord } from '../../mockServices/types';
import { useNavigate } from 'react-router-dom';

export interface GraphEntityNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: 'PERSON' | 'PHONE' | 'VEHICLE' | 'ORGANIZATION' | 'CASE';
  role?: string;
  riskScore: number;
  pagerank: number;
  highlighted?: boolean;
  phone?: string;
  aliases?: string[];
  casesLinked?: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphEntityLink extends d3.SimulationLinkDatum<GraphEntityNode> {
  id: string;
  source: string | GraphEntityNode;
  target: string | GraphEntityNode;
  type: 'CALL' | 'ASSOCIATION' | 'FINANCIAL' | 'VEHICLE' | 'CASE_LINK';
  strength: number;
  label?: string;
}

const DEFAULT_NODES: GraphEntityNode[] = [
  {
    id: 'per-01',
    name: 'RAHUL VERMA',
    type: 'PERSON',
    role: 'HIGH VALUE TARGET',
    riskScore: 92,
    pagerank: 0.89,
    highlighted: true,
    phone: '+91 98765 43210',
    aliases: ['R.V.', 'Rahul Bhai', 'R. Verma'],
    casesLinked: 17,
  },
  {
    id: 'per-02',
    name: 'VIKAS @ VICKY',
    type: 'PERSON',
    role: 'Associate / Mule Operator',
    riskScore: 78,
    pagerank: 0.72,
    phone: '+91 98610 99881',
    aliases: ['Vicky Patra'],
    casesLinked: 8,
  },
  {
    id: 'per-03',
    name: 'SONU BHAI',
    type: 'PERSON',
    role: 'Pawn Broker / Fencer',
    riskScore: 72,
    pagerank: 0.68,
    phone: '+91 94370 11223',
    aliases: ['Sonu Sahoo'],
    casesLinked: 6,
  },
  {
    id: 'per-04',
    name: 'PAWAN K.',
    type: 'PERSON',
    role: 'Safehouse Operator',
    riskScore: 65,
    pagerank: 0.61,
    phone: '+91 98612 33445',
    aliases: ['Pawan Kumar Jena'],
    casesLinked: 4,
  },
  {
    id: 'per-05',
    name: 'AJAY SINGH',
    type: 'PERSON',
    role: 'Transport Logistics',
    riskScore: 60,
    pagerank: 0.55,
    phone: '+91 98765 43219',
    aliases: ['Ajay Driver'],
    casesLinked: 5,
  },
  {
    id: 'ph-01',
    name: '+91 98765 43210',
    type: 'PHONE',
    riskScore: 85,
    pagerank: 0.65,
    phone: '+91 98765 43210',
    casesLinked: 12,
  },
  {
    id: 'ph-02',
    name: '+91 98765 56789',
    type: 'PHONE',
    riskScore: 50,
    pagerank: 0.45,
    phone: '+91 98765 56789',
    casesLinked: 3,
  },
  {
    id: 'veh-01',
    name: 'OD-02-AK-4455',
    type: 'VEHICLE',
    role: 'Getaway Vehicle (Black SUV)',
    riskScore: 75,
    pagerank: 0.58,
    casesLinked: 4,
  },
  {
    id: 'veh-02',
    name: 'ACB1234',
    type: 'VEHICLE',
    role: 'Motorcycle Reg',
    riskScore: 60,
    pagerank: 0.42,
    casesLinked: 2,
  },
  {
    id: 'org-01',
    name: 'SHIVAM TRADERS',
    type: 'ORGANIZATION',
    role: 'Front Shell Entity',
    riskScore: 88,
    pagerank: 0.74,
    casesLinked: 9,
  },
];

const DEFAULT_LINKS: GraphEntityLink[] = [
  { id: 'l1', source: 'per-01', target: 'per-02', type: 'ASSOCIATION', strength: 0.85, label: 'Direct Syndicate Link' },
  { id: 'l2', source: 'per-01', target: 'per-03', type: 'FINANCIAL', strength: 0.78, label: 'Jewelry Fencing Flow' },
  { id: 'l3', source: 'per-01', target: 'per-04', type: 'ASSOCIATION', strength: 0.68, label: 'Safehouse Log' },
  { id: 'l4', source: 'per-01', target: 'ph-01', type: 'CALL', strength: 0.95, label: 'Primary IMEI Registered' },
  { id: 'l5', source: 'per-01', target: 'veh-01', type: 'VEHICLE', strength: 0.82, label: 'Registered Owner' },
  { id: 'l6', source: 'per-01', target: 'org-01', type: 'FINANCIAL', strength: 0.90, label: 'Bank Signatory' },
  { id: 'l7', source: 'per-02', target: 'per-04', type: 'CALL', strength: 0.62, label: 'Night CDR Match' },
  { id: 'l8', source: 'per-04', target: 'per-05', type: 'ASSOCIATION', strength: 0.55, label: 'Transport Link' },
  { id: 'l9', source: 'per-05', target: 'ph-02', type: 'CALL', strength: 0.70, label: 'CDR Intercept' },
  { id: 'l10', source: 'per-05', target: 'veh-02', type: 'VEHICLE', strength: 0.65, label: 'Rider Log' },
];

interface InvestigatorNetworkWorkspaceProps {
  cases: CaseRecord[];
  onSelectEntity: (entity: GraphEntityNode | CaseRecord) => void;
  selectedEntityId?: string;
}

export function InvestigatorNetworkWorkspace({
  cases,
  onSelectEntity,
  selectedEntityId,
}: InvestigatorNetworkWorkspaceProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'network' | 'docket'>('network');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'COURT' | 'CLOSED'>('ALL');

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphEntityNode, GraphEntityLink> | null>(null);
  const [dimensions, setDimensions] = useState({ width: 700, height: 420 });

  // Filtered docket cases
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      const q = searchQuery.toLowerCase();
      const matchQuery =
        !searchQuery ||
        c.firNumber?.toLowerCase().includes(q) ||
        c.title?.toLowerCase().includes(q) ||
        c.crimeType?.toLowerCase().includes(q) ||
        c.complainant?.name?.toLowerCase().includes(q) ||
        c.accused?.some((a) => a.name.toLowerCase().includes(q));

      if (!matchQuery) return false;
      if (filterStatus === 'ACTIVE' && c.status !== 'INVESTIGATION') return false;
      if (filterStatus === 'COURT' && c.status !== 'CHARGESHEET') return false;
      if (filterStatus === 'CLOSED' && c.status !== 'CLOSED') return false;

      return true;
    });
  }, [cases, searchQuery, filterStatus]);

  // Handle Resize
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height: Math.max(380, height) });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Initial selection
  useEffect(() => {
    if (DEFAULT_NODES.length > 0 && !selectedEntityId) {
      onSelectEntity(DEFAULT_NODES[0]);
    }
  }, []);

  // Build D3 Force Simulation
  useEffect(() => {
    if (activeTab !== 'network' || !svgRef.current) return;

    const isDark = document.documentElement.classList.contains('dark') || document.documentElement.classList.contains('theme-dark');
    const { width, height } = dimensions;
    const cx = width / 2;
    const cy = height / 2;

    const nodes: GraphEntityNode[] = DEFAULT_NODES.map((n) => {
      if (n.highlighted) return { ...n, x: cx, y: cy };
      if (n.id === 'per-02') return { ...n, x: cx - 110, y: cy - 70 };
      if (n.id === 'per-03') return { ...n, x: cx - 140, y: cy + 60 };
      if (n.id === 'per-04') return { ...n, x: cx + 110, y: cy - 75 };
      if (n.id === 'per-05') return { ...n, x: cx + 160, y: cy + 30 };
      if (n.id === 'ph-01') return { ...n, x: cx - 60, y: cy + 100 };
      if (n.id === 'ph-02') return { ...n, x: cx + 180, y: cy + 110 };
      if (n.id === 'veh-01') return { ...n, x: cx - 160, y: cy - 30 };
      if (n.id === 'veh-02') return { ...n, x: cx + 120, y: cy + 110 };
      if (n.id === 'org-01') return { ...n, x: cx - 40, y: cy - 120 };
      return { ...n, x: cx + (Math.random() - 0.5) * 200, y: cy + (Math.random() - 0.5) * 200 };
    });

    const links: GraphEntityLink[] = DEFAULT_LINKS.map((l) => ({ ...l }));

    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    const simulation = d3
      .forceSimulation<GraphEntityNode, GraphEntityLink>(nodes)
      .force(
        'link',
        d3
          .forceLink<GraphEntityNode, GraphEntityLink>(links)
          .id((d) => d.id)
          .distance((d) => (d.strength > 0.8 ? 95 : 125))
      )
      .force('charge', d3.forceManyBody().strength(-280))
      .force('center', d3.forceCenter(cx, cy))
      .force('collide', d3.forceCollide().radius(38));

    simulationRef.current = simulation;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Background tactical grid
    const defs = svg.append('defs');
    const pattern = defs
      .append('pattern')
      .attr('id', 'graph-grid')
      .attr('width', 24)
      .attr('height', 24)
      .attr('patternUnits', 'userSpaceOnUse');

    pattern
      .append('path')
      .attr('d', 'M 24 0 L 0 0 0 24')
      .attr('fill', 'none')
      .attr('stroke', isDark ? '#1E293B' : '#E2E8F0')
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.6);

    svg.append('rect').attr('width', width).attr('height', height).attr('fill', 'url(#graph-grid)');

    // Zoom container
    const g = svg.append('g').attr('class', 'main-layer');

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.6, 2.5])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Links
    const linkGroup = g
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', (d) => {
        if (d.type === 'CALL') return '#10B981';
        if (d.type === 'FINANCIAL') return '#F59E0B';
        if (d.type === 'VEHICLE') return '#8B5CF6';
        return '#38BDF8';
      })
      .attr('stroke-width', (d) => (d.strength > 0.8 ? 2 : 1.25))
      .attr('stroke-dasharray', (d) => (d.strength > 0.8 ? null : '4 3'))
      .attr('opacity', isDark ? 0.7 : 0.85);

    // Nodes
    const nodeGroup = g
      .append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('cursor', 'pointer')
      .call(
        d3
          .drag<SVGGElement, GraphEntityNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
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
        onSelectEntity(d);
      });

    // High Value Target Pulse Ring
    nodeGroup
      .filter((d) => Boolean(d.highlighted))
      .append('circle')
      .attr('r', 28)
      .attr('fill', 'none')
      .attr('stroke', '#EF4444')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4 2')
      .attr('class', 'animate-spin')
      .attr('opacity', 0.8);

    // Node Circle Outer Glow
    nodeGroup
      .append('circle')
      .attr('r', (d) => (d.highlighted ? 20 : 15))
      .attr('fill', (d) => {
        if (d.highlighted) return '#EF4444';
        if (d.type === 'PERSON') return '#10B981';
        if (d.type === 'PHONE') return '#F59E0B';
        if (d.type === 'VEHICLE') return '#8B5CF6';
        return '#06B6D4';
      })
      .attr('stroke', (d) => (d.id === selectedEntityId ? (isDark ? '#FFFFFF' : '#1E293B') : (isDark ? '#0B0F17' : '#FFFFFF')))
      .attr('stroke-width', (d) => (d.id === selectedEntityId ? 3 : 2))
      .attr('filter', 'drop-shadow(0 2px 6px rgba(0,0,0,0.25))');

    // Node Centered Icon/Text
    nodeGroup
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 4)
      .attr('font-size', (d) => (d.highlighted ? 9 : 8))
      .attr('font-weight', 'bold')
      .attr('font-family', 'ui-monospace, monospace')
      .attr('fill', '#FFFFFF')
      .text((d) => {
        if (d.type === 'PERSON') return '👤';
        if (d.type === 'PHONE') return '📞';
        if (d.type === 'VEHICLE') return '🚗';
        return '🏢';
      });

    // Node Name Label
    nodeGroup
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => (d.highlighted ? 34 : 28))
      .attr('font-size', 9)
      .attr('font-weight', 'bold')
      .attr('font-family', 'ui-monospace, Consolas, monospace')
      .attr('fill', (d) => (d.highlighted ? '#EF4444' : (isDark ? '#E2E8F0' : '#1E293B')))
      .text((d) => d.name);

    // Node Subtext / Role
    nodeGroup
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => (d.highlighted ? 45 : 38))
      .attr('font-size', 7.5)
      .attr('font-family', 'Inter, sans-serif')
      .attr('fill', isDark ? '#94A3B8' : '#64748B')
      .text((d) => `PR: ${d.pagerank.toFixed(2)}`);

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
  }, [activeTab, dimensions, selectedEntityId]);

  return (
    <div
      ref={containerRef}
      className="bg-surface dark:bg-[#0B0F17] border border-border-soft dark:border-[#1E293B] rounded-xl flex flex-col h-full min-h-[460px] overflow-hidden shadow-xs dark:shadow-2xl relative select-none font-sans"
    >
      {/* ── TOP WORKSPACE CONTROLS BAR ── */}
      <div className="p-3 border-b border-border-soft dark:border-[#1E293B] bg-surface-2 dark:bg-[#0E1422] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* View Mode Toggle Buttons */}
          <div className="flex items-center bg-surface dark:bg-[#070A0F] p-1 rounded-lg border border-border-soft dark:border-[#1E293B] font-mono text-xs">
            <button
              onClick={() => setActiveTab('network')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                activeTab === 'network'
                  ? 'bg-accent/15 dark:bg-[#1E293B] text-accent dark:text-[#38BDF8] shadow-xs border border-accent/30 dark:border-[#38BDF8]/40'
                  : 'text-text-dim dark:text-[#94A3B8] hover:text-text dark:hover:text-[#F8FAFC]'
              }`}
            >
              <Network size={13} />
              <span>CASE NETWORK VIEW</span>
            </button>

            <button
              onClick={() => setActiveTab('docket')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                activeTab === 'docket'
                  ? 'bg-accent/15 dark:bg-[#1E293B] text-accent dark:text-[#38BDF8] shadow-xs border border-accent/30 dark:border-[#38BDF8]/40'
                  : 'text-text-dim dark:text-[#94A3B8] hover:text-text dark:hover:text-[#F8FAFC]'
              }`}
            >
              <Table size={13} />
              <span>ACTIVE INVESTIGATIONS ({cases.length})</span>
            </button>
          </div>

          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            LIVE ANALYSIS
          </span>
        </div>

        {/* Legend / Filter Stats */}
        {activeTab === 'network' ? (
          <div className="hidden sm:flex items-center gap-3 text-[10px] font-mono text-text-dim dark:text-[#94A3B8]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#10B981]" /> Call
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B]" /> Financial
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#38BDF8]" /> Association
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" /> Vehicle
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-dim dark:text-[#64748B]" />
              <input
                type="text"
                placeholder="Search FIR, suspect, IO..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 pr-3 py-1 rounded-lg bg-surface dark:bg-[#070A0F] border border-border-soft dark:border-[#1E293B] text-xs font-mono text-text dark:text-[#F8FAFC] placeholder-text-dim outline-none w-48 focus:border-accent dark:focus:border-[#38BDF8]"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── WORKSPACE BODY ── */}
      <div className="flex-1 relative overflow-hidden bg-surface-2 dark:bg-[#070A0F]">
        {activeTab === 'network' ? (
          <>
            {/* D3 SVG Canvas */}
            <svg ref={svgRef} className="w-full h-full min-h-[380px] cursor-crosshair block" />

            {/* Tactical Graph Floating Legend Box */}
            <div className="absolute top-3 left-3 bg-surface/90 dark:bg-[#0B0F17]/90 border border-border-soft dark:border-[#1E293B] rounded-lg p-2.5 backdrop-blur-md text-[10px] font-mono space-y-1.5 pointer-events-none shadow-sm dark:shadow-xl">
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

            {/* Quick Mini Map / Instructions */}
            <div className="absolute bottom-3 left-3 bg-surface/90 dark:bg-[#0B0F17]/90 border border-border-soft dark:border-[#1E293B] rounded-lg px-2.5 py-1 text-[9px] font-mono text-text-dim dark:text-[#64748B] pointer-events-none">
              Click any node to inspect dossier · Scroll to zoom · Drag to rearrange
            </div>
          </>
        ) : (
          /* High-Density Case Docket Table */
          <div className="h-full overflow-y-auto p-2">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-border-soft dark:border-[#1E293B] text-[10px] text-text-dim dark:text-[#64748B] uppercase tracking-wider bg-surface-2 dark:bg-[#0E1422]/60 sticky top-0">
                  <th className="p-2.5">FIR REFERENCE</th>
                  <th className="p-2.5">STATUTORY OFFENCE</th>
                  <th className="p-2.5">COMPLAINANT / ACCUSED</th>
                  <th className="p-2.5">PRIORITY</th>
                  <th className="p-2.5">LEAD IO</th>
                  <th className="p-2.5 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft/60 dark:divide-[#1E293B]/60">
                {filteredCases.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => onSelectEntity(c)}
                    className="hover:bg-surface-hover dark:hover:bg-[#131B2E] transition-colors cursor-pointer group"
                  >
                    <td className="p-2.5">
                      <span className="font-bold text-accent dark:text-[#38BDF8] group-hover:underline">
                        {c.firNumber || c.id}
                      </span>
                    </td>
                    <td className="p-2.5 text-text dark:text-[#E2E8F0] capitalize">
                      {c.crimeType?.replace(/_/g, ' ')}
                    </td>
                    <td className="p-2.5 text-text-dim dark:text-[#94A3B8]">
                      {c.complainant?.name || 'State Complainant'}
                    </td>
                    <td className="p-2.5">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                          c.priority === 'CRITICAL'
                            ? 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30'
                            : c.priority === 'HIGH'
                            ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30'
                            : 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                        }`}
                      >
                        {c.priority}
                      </span>
                    </td>
                    <td className="p-2.5 text-text-dim dark:text-[#94A3B8]">SI Ranjan Samal</td>
                    <td className="p-2.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/cases/${c.id}`);
                        }}
                        className="px-2.5 py-1 rounded bg-surface-2 dark:bg-[#1E293B] hover:bg-brand dark:hover:bg-[#38BDF8] hover:text-bg dark:hover:text-[#0B0F17] text-text dark:text-[#E2E8F0] text-[10px] font-bold transition-all inline-flex items-center gap-1 border border-border-soft dark:border-transparent"
                      >
                        <span>Inspect</span>
                        <ChevronRight size={10} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
