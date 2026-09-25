/**
 * S.I.R.I.S. — Graph Intelligence Service Client
 *
 * TypeScript API client for the central-intelligence FastAPI service's
 * /api/v1/graph/* endpoints.
 *
 * Endpoint base: http://localhost:8000/api/v1/graph  (central-intelligence)
 */

const BASE_URL = import.meta.env.VITE_INTEL_SERVICE_URL || 'https://siris-backend-duzn.onrender.com/api/v1/graph';
const TIMEOUT_MS = 30000;

// ─── Types ──────────────────────────────────────────────────────────────────

export interface GraphNode {
  id: string;
  label: string;
  entity_type: 'PHONE' | 'PERSON' | 'VEHICLE' | 'CASE' | 'UPI' | 'WALLET' | 'EMAIL' | 'BANK_ACCOUNT' | 'IP' | 'TELEGRAM' | 'LOCATION' | 'EVIDENCE' | 'LEGAL_SECTION' | 'UNKNOWN';
  node_type: 'entity' | 'case';
  betweenness: number;
  influence: number;
  complaint_count: number;
  is_flagged: boolean;
  cluster_id?: string;
  district?: string;
  station_id?: string;
  is_center?: boolean;
  is_focus?: boolean;
  is_important?: boolean;
  hop_distance?: number;
  degree?: number;
  community_id?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  weight: number;
  relationship?: string;
}

export interface GraphOverview {
  nodes: GraphNode[];
  edges: GraphEdge[];
  total_nodes: number;
  total_edges: number;
  components: number;
  built_at: number;
  found?: boolean;
  stats?: Record<string, any>;
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

/** Thrown by getCaseWorkspace()/projectCaseToGraph() so callers can distinguish
 * "case genuinely not found" (404) from "service unreachable" (network/timeout). */
export class WorkspaceApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'WorkspaceApiError';
    this.status = status;
  }
}

/** Fetch that preserves HTTP status / distinguishes network failure from a real error
 * response, instead of collapsing everything to null like fetchWithTimeout(). */
async function fetchStatusAware<T>(url: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url, { ...options, signal: controller.signal });
  } catch (err: any) {
    clearTimeout(timer);
    throw new WorkspaceApiError(
      err?.name === 'AbortError' ? 'Central intelligence service timed out.' : `Central intelligence service unreachable: ${err?.message || err}`
    );
  }
  clearTimeout(timer);
  if (!res.ok) {
    let detail = '';
    try {
      const body = await res.json();
      detail = typeof body?.detail === 'string' ? body.detail : JSON.stringify(body?.detail ?? body);
    } catch {
      // response body wasn't JSON; fall through with empty detail
    }
    throw new WorkspaceApiError(detail || `Request failed with status ${res.status}`, res.status);
  }
  return (await res.json()) as T;
}

// ─── Service API ──────────────────────────────────────────────────────────────

export const graphIntelligenceService = {

  async getOverview(limit = 150): Promise<GraphOverview | null> {
    const result = await fetchWithTimeout<GraphOverview>(`${BASE_URL}/overview?limit=${limit}`);
    if (result && Array.isArray(result.nodes)) return result;

    console.error('[graphIntelligenceService] Real Neo4j graph service unreachable or returned error.');
    return null;
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
   * Fetches a bounded focus-node neighborhood (depth 2) for Case-centric or Entity-centric views.
   */
  async getNeighborhood(nodeId: string, depth = 2, limit = 80): Promise<GraphOverview | null> {
    const enc = encodeURIComponent(nodeId);
    return fetchWithTimeout<GraphOverview>(
      `${BASE_URL}/neighborhood/${enc}?depth=${depth}&limit=${limit}`
    );
  },

  /**
   * S.I.R.I.S explainability panel for a node: betweenness rank, bridge paths, removal test.
   */
  async getWhy(nodeId: string): Promise<WhyResult | null> {
    const enc = encodeURIComponent(nodeId);
    return fetchWithTimeout<WhyResult>(`${BASE_URL}/why/${enc}`);
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
   * Live S.I.R.I.S alert rules results.
   */
  async getAlerts(): Promise<AlertsResult> {
    const result = await fetchWithTimeout<AlertsResult>(`${BASE_URL}/alerts`);
    if (result && Array.isArray(result.alerts)) return result;
    return { alerts: [], count: 0 };
  },

  /**
   * Entity extraction from FIR narrative — S.I.R.I.S regex pipeline.
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

  /**
   * Loads the READ-ONLY case workspace: saved PostgreSQL case data plus whatever has
   * already been projected into Neo4j. Never triggers extraction or graph writes.
   * Throws WorkspaceApiError (with `.status` set to 404 when the case genuinely does
   * not exist) instead of ever returning fabricated data.
   */
  async getCaseWorkspace(caseId: string): Promise<CaseWorkspaceData> {
    const enc = encodeURIComponent(caseId);
    const workspaceUrl = BASE_URL.replace('/graph', '/workspace');
    return fetchStatusAware<CaseWorkspaceData>(`${workspaceUrl}/case/${enc}`);
  },

  /**
   * Explicit, investigator-triggered action that (re)projects a case's PostgreSQL data
   * into the Neo4j intelligence graph. This is the ONLY call in this client that causes
   * a graph write — call it after registering a new FIR, or to refresh a stale/failed
   * projection. Never call this automatically from a page-load/GET flow.
   */
  async projectCaseToGraph(caseId: string): Promise<{ status: string; graph_status: string; counts: Record<string, number> }> {
    const enc = encodeURIComponent(caseId);
    const workspaceUrl = BASE_URL.replace('/graph', '/workspace');
    return fetchStatusAware(`${workspaceUrl}/case/${enc}/project`, { method: 'POST' });
  },

  /**
   * Authoritative PostgreSQL case list for case selection.
   */
  async getWorkspaceCases(limit = 100, offset = 0): Promise<{ total: number; count: number; cases: any[] } | null> {
    const workspaceUrl = BASE_URL.replace('/graph', '/workspace');
    return fetchWithTimeout<{ total: number; count: number; cases: any[] }>(`${workspaceUrl}/cases?limit=${limit}&offset=${offset}`);
  },
};

export interface CaseWorkspaceData {
  case_id: string;
  fir_number: string;
  is_authoritative_postgres: boolean;
  /** available | not_projected | stale | failed — see workspace.py graph_status computation. */
  graph_status?: 'available' | 'not_projected' | 'stale' | 'failed' | 'processing';
  graph_status_message?: string | null;
  metadata: {
    title: string;
    fir_number: string;
    status: string;
    priority: string;
    police_station: string;
    station_id: string;
    district: string;
    state: string;
    registration_date: string;
    incident_date?: string;
    crime_type: string;
    crime_category: string;
    description: string;
    created_at: string;
  };
  location?: {
    id: string;
    locality: string;
    city: string;
    district: string;
    state: string;
    latitude?: number;
    longitude?: number;
  };
  entities: {
    persons: Array<{ id: string; name: string; role: string; gender?: string; identifier_hash?: string }>;
    phones: Array<{ id: string; normalized_number: string; number_hash?: string }>;
    vehicles: Array<{ id: string; registration_number: string; make?: string; model?: string; vehicle_type?: string; role?: string }>;
    locations: Array<{ id: string; locality: string; city: string; district: string; state: string }>;
    evidences: Array<{ id: string; evidence_type: string; source?: string; status?: string }>;
    legal_sections: Array<{ id: string; code: string; title: string; law_name: string }>;
  };
  graph_neighborhood: {
    nodes: GraphNode[];
    edges: GraphEdge[];
    total_nodes: number;
    total_edges: number;
    focus_node_id: string;
  };
  analytics: {
    degree: number;
    pagerank: number;
    betweenness: number;
    community_id: number;
    connected_components: number;
    is_important_connector: boolean;
  };
  cross_case_intelligence: {
    related_cases: Array<{
      target_case_id: string;
      confidence_score: number;
      relationship_type: string;
      explanation: string;
    }>;
    shared_counts: {
      persons: number;
      phones: number;
      vehicles: number;
      locations: number;
    };
  };
  patterns: Array<{
    pattern_id: string;
    pattern_name: string;
    confidence_score: number;
    supporting_evidence: string;
    cases_involved: string[];
  }>;
  alerts: Array<{
    id: string;
    severity: string;
    alert_type?: string;
    title?: string;
    message?: string;
    details?: Record<string, unknown>;
  }>;
  explainability?: Record<string, any>;
}
