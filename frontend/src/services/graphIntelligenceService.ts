/**
 * S.I.R.I.S. — ARGUS Graph Intelligence Service Client
 *
 * TypeScript API client for the central-intelligence FastAPI service's
 * /api/v1/graph/* endpoints (added by ARGUS→S.I.R.I.S. integration).
 *
 * All methods degrade gracefully: if the Python service is unreachable,
 * they return mock data so the NetworkExplorer remains functional for demos.
 *
 * Endpoint base: http://localhost:8000/api/v1/graph  (central-intelligence)
 */

const BASE_URL = import.meta.env.VITE_INTEL_SERVICE_URL || 'http://localhost:8000/api/v1/graph';
const TIMEOUT_MS = 5000;

// ─── Types ──────────────────────────────────────────────────────────────────

export interface GraphNode {
  id: string;
  label: string;
  entity_type: 'PHONE' | 'PERSON' | 'VEHICLE' | 'CASE' | 'UPI' | 'WALLET' | 'EMAIL' | 'BANK_ACCOUNT' | 'IP' | 'TELEGRAM' | 'UNKNOWN';
  node_type: 'entity' | 'case';
  betweenness: number;
  influence: number;
  complaint_count: number;
  is_flagged: boolean;
  cluster_id?: string;
  district?: string;
  station_id?: string;
  is_center?: boolean;
}

export interface GraphEdge {
  source: string;
  target: string;
  weight: number;
}

export interface GraphOverview {
  nodes: GraphNode[];
  edges: GraphEdge[];
  total_nodes: number;
  total_edges: number;
  components: number;
  built_at: number;
}

export interface WhyResult {
  node_id: string;
  found: boolean;
  label?: string;
  entity_type?: string;
  betweenness?: number;
  influence?: number;
  betweenness_rank?: number;
  complaint_count?: number;
  is_flagged?: boolean;
  bridge_paths?: Array<{
    from: string;
    to: string;
    path: string[];
    passes_through: boolean;
  }>;
  removal_test?: {
    components_before: number;
    components_after: number;
    delta: number;
    is_bridge: boolean;
    note: string;
  };
}

export interface PathResult {
  found: boolean;
  from: string;
  to: string;
  path: Array<{ id: string; label: string; entity_type: string }>;
  hop_count: number;
}

export interface CommonResult {
  a: string;
  b: string;
  common: Array<{ id: string; label: string; entity_type: string }>;
  count: number;
}

export interface IntelAlert {
  id: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  alert_type: string;
  title: string;
  details: Record<string, unknown>;
  fingerprint: string;
  created_at: number;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
}

export interface AlertsResult {
  alerts: IntelAlert[];
  count: number;
}

export interface ExtractedEntity {
  type: string;
  value: string;
  normalized_value: string;
  confidence: number;
  method: 'REGEX' | 'NER';
}

export interface ExtractResult {
  entities: ExtractedEntity[];
  duration_ms: number;
  tiers: { regex: number; ner: number };
}

// ─── HTTP Helper ─────────────────────────────────────────────────────────────

async function fetchWithTimeout<T>(url: string, options: RequestInit = {}): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    clearTimeout(timer);
    return null;
  }
}

// ─── Fallback mock data ───────────────────────────────────────────────────────
// Used when the Python service is unreachable (demo / offline mode).

const MOCK_NODES: GraphNode[] = [
  { id: 'phone:alpha-coord', label: 'Biswanath Mishra (Coord)', entity_type: 'PHONE', node_type: 'entity', betweenness: 0.82, influence: 0.9, complaint_count: 0, is_flagged: true, district: 'Khordha (Bhubaneswar)' },
  { id: 'phone:alpha-h1', label: 'Rakesh Kumar Sahoo', entity_type: 'PHONE', node_type: 'entity', betweenness: 0.32, influence: 0.4, complaint_count: 7, is_flagged: false, district: 'Khordha (Bhubaneswar)' },
  { id: 'phone:alpha-h2', label: 'Dipak Nayak', entity_type: 'PHONE', node_type: 'entity', betweenness: 0.28, influence: 0.36, complaint_count: 7, is_flagged: false, district: 'Khordha (Bhubaneswar)' },
  { id: 'phone:alpha-h3', label: 'Santosh Behera', entity_type: 'PHONE', node_type: 'entity', betweenness: 0.25, influence: 0.32, complaint_count: 7, is_flagged: false, district: 'Cuttack' },
  { id: 'phone:alpha-h4', label: 'Pramod Mohanty', entity_type: 'PHONE', node_type: 'entity', betweenness: 0.22, influence: 0.29, complaint_count: 7, is_flagged: false, district: 'Cuttack' },
  { id: 'phone:beta-coord', label: 'Subhendu Tripathy (Coord)', entity_type: 'PHONE', node_type: 'entity', betweenness: 0.71, influence: 0.78, complaint_count: 0, is_flagged: true, district: 'Sambalpur' },
  { id: 'phone:beta-h1', label: 'Dilip Kumar Swain', entity_type: 'PHONE', node_type: 'entity', betweenness: 0.18, influence: 0.24, complaint_count: 10, is_flagged: false, district: 'Sambalpur' },
  { id: 'phone:gamma-coord', label: 'Jagannath Pradhan (Coord)', entity_type: 'PERSON', node_type: 'entity', betweenness: 0.61, influence: 0.65, complaint_count: 0, is_flagged: true, district: 'Khordha (Bhubaneswar)' },
  { id: 'case:fir-001', label: 'FIR-2026-BBSR-001-2001', entity_type: 'CASE', node_type: 'case', betweenness: 0, influence: 0, complaint_count: 0, is_flagged: false, district: 'Khordha (Bhubaneswar)', station_id: 'PS_BBSR_001' },
  { id: 'case:fir-002', label: 'FIR-2026-BBSR-001-2002', entity_type: 'CASE', node_type: 'case', betweenness: 0, influence: 0, complaint_count: 0, is_flagged: false, district: 'Khordha (Bhubaneswar)', station_id: 'PS_BBSR_001' },
  { id: 'case:fir-003', label: 'FIR-2026-CTC-001-2003', entity_type: 'CASE', node_type: 'case', betweenness: 0, influence: 0, complaint_count: 0, is_flagged: false, district: 'Cuttack', station_id: 'PS_CTC_001' },
];

const MOCK_EDGES: GraphEdge[] = [
  { source: 'case:fir-001', target: 'phone:alpha-h1', weight: 1 },
  { source: 'case:fir-002', target: 'phone:alpha-h2', weight: 1 },
  { source: 'case:fir-003', target: 'phone:alpha-h3', weight: 1 },
  { source: 'phone:alpha-h1', target: 'phone:alpha-coord', weight: 0.9 },
  { source: 'phone:alpha-h2', target: 'phone:alpha-coord', weight: 0.9 },
  { source: 'phone:alpha-h3', target: 'phone:alpha-coord', weight: 0.9 },
  { source: 'phone:alpha-h4', target: 'phone:alpha-coord', weight: 0.9 },
  { source: 'phone:beta-h1', target: 'phone:beta-coord', weight: 0.9 },
];

const MOCK_ALERTS: IntelAlert[] = [
  {
    id: 'fp-mastermind-alpha',
    severity: 'CRITICAL',
    alert_type: 'MASTERMIND_IDENTIFIED',
    title: 'Potential network coordinator identified — Biswanath Mishra',
    details: {
      node_id: 'phone:alpha-coord',
      entity_type: 'PHONE',
      label: 'Biswanath Mishra',
      betweenness_score: 0.82,
      influence_score: 0.9,
      complaint_count: 0,
      note: 'High betweenness + influence — appears in 0 FIRs but bridges all 3 ALPHA cells.',
    },
    fingerprint: 'fp-mastermind-alpha',
    created_at: Date.now(),
    status: 'OPEN',
  },
  {
    id: 'fp-entity-reuse-h1',
    severity: 'HIGH',
    alert_type: 'ENTITY_REUSE',
    title: 'Phone entity reused across 7 complaints',
    details: { node_id: 'phone:alpha-h1', entity_type: 'PHONE', complaint_count: 7, label: 'Rakesh Kumar Sahoo' },
    fingerprint: 'fp-entity-reuse-h1',
    created_at: Date.now() - 3600000,
    status: 'OPEN',
  },
  {
    id: 'fp-beta-mastermind',
    severity: 'CRITICAL',
    alert_type: 'MASTERMIND_IDENTIFIED',
    title: 'Potential network coordinator — Subhendu Tripathy (BETA cell)',
    details: {
      node_id: 'phone:beta-coord',
      entity_type: 'PHONE',
      betweenness_score: 0.71,
      complaint_count: 0,
      note: 'Bridges Sambalpur, Rourkela, Berhampur BETA cells.',
    },
    fingerprint: 'fp-beta-mastermind',
    created_at: Date.now() - 7200000,
    status: 'OPEN',
  },
];

// ─── Service API ──────────────────────────────────────────────────────────────

export const graphIntelligenceService = {

  /**
   * Returns the top-influence entities and case nodes for the D3 force graph.
   * Falls back to deterministic mock data if the service is unreachable.
   */
  async getOverview(limit = 150): Promise<GraphOverview> {
    const result = await fetchWithTimeout<GraphOverview>(`${BASE_URL}/overview?limit=${limit}`);
    if (result && Array.isArray(result.nodes)) return result;

    // Graceful fallback
    console.warn('[graphIntelligenceService] Service unreachable — using mock data');
    return {
      nodes: MOCK_NODES.slice(0, limit),
      edges: MOCK_EDGES,
      total_nodes: MOCK_NODES.length,
      total_edges: MOCK_EDGES.length,
      components: 3,
      built_at: Date.now() / 1000,
    };
  },

  /**
   * Expands the subgraph around a node (BFS to `depth` hops).
   */
  async getNeighbors(nodeId: string, depth = 1, limit = 50): Promise<GraphOverview | null> {
    const enc = encodeURIComponent(nodeId);
    return fetchWithTimeout<GraphOverview>(
      `${BASE_URL}/neighbors/${enc}?depth=${depth}&limit=${limit}`
    );
  },

  /**
   * ARGUS explainability panel for a node: betweenness rank, bridge paths, removal test.
   */
  async getWhy(nodeId: string): Promise<WhyResult | null> {
    const enc = encodeURIComponent(nodeId);
    const result = await fetchWithTimeout<WhyResult>(`${BASE_URL}/why/${enc}`);
    if (result) return result;

    // Mock fallback for coordinators
    if (nodeId.includes('coord')) {
      return {
        node_id: nodeId,
        found: true,
        label: 'Network Coordinator',
        entity_type: 'PHONE',
        betweenness: 0.82,
        influence: 0.90,
        betweenness_rank: 1,
        complaint_count: 0,
        is_flagged: true,
        bridge_paths: [
          { from: 'phone:alpha-h1', to: 'phone:alpha-h3', path: ['phone:alpha-h1', nodeId, 'phone:alpha-h3'], passes_through: true },
        ],
        removal_test: {
          components_before: 1,
          components_after: 3,
          delta: 2,
          is_bridge: true,
          note: 'Removing this node splits the network into 3 components (was 1).',
        },
      };
    }
    return null;
  },

  /**
   * Shortest path between two nodes.
   */
  async getPath(fromId: string, toId: string): Promise<PathResult | null> {
    const f = encodeURIComponent(fromId);
    const t = encodeURIComponent(toId);
    return fetchWithTimeout<PathResult>(`${BASE_URL}/path?from=${f}&to=${t}`);
  },

  /**
   * Shared neighbors of two nodes.
   */
  async getCommon(a: string, b: string): Promise<CommonResult | null> {
    const ea = encodeURIComponent(a);
    const eb = encodeURIComponent(b);
    return fetchWithTimeout<CommonResult>(`${BASE_URL}/common?a=${ea}&b=${eb}`);
  },

  /**
   * Live ARGUS alert rules results.
   * Falls back to mock alerts if service unreachable.
   */
  async getAlerts(): Promise<AlertsResult> {
    const result = await fetchWithTimeout<AlertsResult>(`${BASE_URL}/alerts`);
    if (result && Array.isArray(result.alerts)) return result;
    return { alerts: MOCK_ALERTS, count: MOCK_ALERTS.length };
  },

  /**
   * Entity extraction from FIR narrative — ARGUS regex pipeline.
   * Falls back to client-side basic regex if service unreachable.
   */
  async extractEntities(narrative: string, complaintId?: string): Promise<ExtractResult> {
    const result = await fetchWithTimeout<ExtractResult>(`${BASE_URL}/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ narrative, complaint_id: complaintId }),
    });
    if (result && Array.isArray(result.entities)) return result;

    // Client-side basic fallback
    const entities: ExtractedEntity[] = [];
    const phoneRe = /\b[6-9]\d{9}\b/g;
    const upiRe   = /\b[A-Za-z0-9._-]{2,}@[A-Za-z][A-Za-z0-9]{1,}\b/g;
    const emailRe = /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/g;

    for (const m of narrative.matchAll(phoneRe)) {
      entities.push({ type: 'PHONE', value: m[0], normalized_value: m[0], confidence: 0.95, method: 'REGEX' });
    }
    for (const m of narrative.matchAll(upiRe)) {
      if (!emailRe.test(m[0])) {
        entities.push({ type: 'UPI', value: m[0], normalized_value: m[0].toLowerCase(), confidence: 0.9, method: 'REGEX' });
      }
    }

    return { entities, duration_ms: 0, tiers: { regex: entities.length, ner: 0 } };
  },

  /**
   * Check if the graph intelligence service is reachable.
   */
  async isReachable(): Promise<boolean> {
    try {
      const res = await fetch(`${BASE_URL.replace('/graph', '')}/health`, { signal: AbortSignal.timeout(2000) });
      return res.ok;
    } catch {
      return false;
    }
  },
};
