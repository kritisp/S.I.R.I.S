/**
 * S.I.R.I.S — Odisha Police Intelligence Network
 * Network Graph Mock Dataset
 *
 * This is the centralized intelligence graph used by:
 * - Network Explorer (/network)
 * - Case Knowledge Graph (CaseWorkspace)
 * - AI Assistant intelligence responses
 *
 * DEMONSTRATION DATA ONLY.
 * All persons, cases, numbers, and events are entirely fictional.
 */

export type NodeType =
  | 'CASE'
  | 'PERSON'
  | 'PHONE'
  | 'VEHICLE'
  | 'LOCATION'
  | 'EVIDENCE'
  | 'STATION';

export type AccessStatus = 'AUTHORIZED' | 'RESTRICTED' | 'PENDING';

export type RelationshipType =
  | 'SHARED_PHONE'
  | 'SHARED_VEHICLE'
  | 'SHARED_LOCATION'
  | 'SHARED_PERSON'
  | 'LINKED_CASE'
  | 'MATCHED_ENTITY'
  | 'COMMON_ASSOCIATE'
  | 'ENTITY_REFERENCE'
  | 'TEMPORAL_PROXIMITY'
  | 'AI_DISCOVERED'
  | 'CONTAINS'
  | 'INVOLVES'
  | 'OWNS'
  | 'USED_IN'
  | 'LOCATED_AT';

export interface NetworkNode {
  id: string;
  type: NodeType;
  label: string;
  sublabel?: string;
  stationId?: string;
  caseId?: string;          // if this node is a case
  accessStatus: AccessStatus;
  isLocal?: boolean;        // belongs to logged-in user's station
  isCrossStation?: boolean;
  isAiDiscovered?: boolean;
  is_focus?: boolean;       // focus node selected by investigator
  is_important?: boolean;   // structurally important connector node (high betweenness/degree)
  hop_distance?: number;    // topological hop distance from focus node
  x?: number;               // layout position
  y?: number;
  metadata?: Record<string, string | number>;
}

export interface NetworkEdge {
  id: string;
  source: string;           // node id
  target: string;           // node id
  relationship: RelationshipType;
  label: string;
  isCrossStation?: boolean;
  isAiDiscovered?: boolean;
  confidence?: number;      // 0–100
  discoveredAt?: string;
}

// ─── Hero Network Data ────────────────────────────────────────────────────────
// Stations involved in the hero demo:
// OP-BBSR-CAP  = Bhubaneswar Capital PS
// OP-CTC-CITY  = Cuttack City PS
// OP-RKL-CEN   = Rourkela Central PS
// OP-BAM-TWN   = Berhampur Town PS
// OP-PURI-TWN  = Puri Town PS

export const NETWORK_NODES: NetworkNode[] = [
  // ── Stations ────────────────────────────────────────────────────────────────
  { id: 'STA-BBSR', type: 'STATION', label: 'Khandagiri Police Station', sublabel: 'KHD-KND-014', stationId: 'OP-BBSR-CAP', accessStatus: 'AUTHORIZED', isLocal: true },
  { id: 'STA-CTC',  type: 'STATION', label: 'Cuttack City PS',        sublabel: 'OP-CTC-CITY', stationId: 'OP-CTC-CITY', accessStatus: 'AUTHORIZED' },
  { id: 'STA-RKL',  type: 'STATION', label: 'Rourkela Central PS',    sublabel: 'OP-RKL-CEN',  stationId: 'OP-RKL-CEN',  accessStatus: 'AUTHORIZED' },
  { id: 'STA-BAM',  type: 'STATION', label: 'Berhampur Town PS',      sublabel: 'OP-BAM-TWN',  stationId: 'OP-BAM-TWN',  accessStatus: 'AUTHORIZED' },
  { id: 'STA-PURI', type: 'STATION', label: 'Puri Town PS',           sublabel: 'OP-PURI-TWN', stationId: 'OP-PURI-TWN', accessStatus: 'AUTHORIZED' },

  // ── Cases ───────────────────────────────────────────────────────────────────
  {
    id: 'CASE-BBSR-01',
    type: 'CASE',
    label: 'OD-BBSR-2026-0001',
    sublabel: 'High-Value Burglary (Unit IV)',
    stationId: 'OP-BBSR-CAP',
    caseId: 'OD-BBSR-2026-0001',
    accessStatus: 'AUTHORIZED',
    isLocal: true,
    metadata: { status: 'INVESTIGATING', priority: 'HIGH', station: 'Khandagiri Police Station' }
  },
  {
    id: 'CASE-CTC-01',
    type: 'CASE',
    label: 'OD-CTC-2026-00981',
    sublabel: 'Jewelry Heist (Badambadi)',
    stationId: 'OP-CTC-CITY',
    caseId: 'OD-CTC-2026-00981',
    accessStatus: 'RESTRICTED',
    isCrossStation: true,
    metadata: { status: 'INVESTIGATING', priority: 'CRITICAL', station: 'Cuttack City PS', confidence: 96 }
  },
  {
    id: 'CASE-BBSR-02',
    type: 'CASE',
    label: 'OD-BBSR-2026-0042',
    sublabel: 'Vehicle Theft — Saheed Nagar',
    stationId: 'OP-BBSR-CAP',
    caseId: 'OD-BBSR-2026-0042',
    accessStatus: 'AUTHORIZED',
    isLocal: true,
    metadata: { status: 'INVESTIGATING', priority: 'MEDIUM', station: 'Khandagiri Police Station' }
  },
  {
    id: 'CASE-RKL-01',
    type: 'CASE',
    label: 'OD-RKL-2026-0117',
    sublabel: 'Armed Robbery — Sector-4',
    stationId: 'OP-RKL-CEN',
    caseId: 'OD-RKL-2026-0117',
    accessStatus: 'RESTRICTED',
    isCrossStation: true,
    metadata: { status: 'INVESTIGATING', priority: 'HIGH', station: 'Rourkela Central PS', confidence: 88 }
  },
  {
    id: 'CASE-BAM-01',
    type: 'CASE',
    label: 'OD-BAM-2026-0033',
    sublabel: 'Chain Snatching Network',
    stationId: 'OP-BAM-TWN',
    caseId: 'OD-BAM-2026-0033',
    accessStatus: 'AUTHORIZED',
    isCrossStation: true,
    metadata: { status: 'SOLVING', priority: 'HIGH', station: 'Berhampur Town PS' }
  },
  {
    id: 'CASE-PURI-01',
    type: 'CASE',
    label: 'OD-PURI-2026-0061',
    sublabel: 'Tourist Area Fraud',
    stationId: 'OP-PURI-TWN',
    caseId: 'OD-PURI-2026-0061',
    accessStatus: 'AUTHORIZED',
    isCrossStation: true,
    metadata: { status: 'INVESTIGATING', priority: 'MEDIUM', station: 'Puri Town PS' }
  },

  // ── Persons ─────────────────────────────────────────────────────────────────
  { id: 'PERSON-01', type: 'PERSON', label: 'Unknown Subject', sublabel: 'Alias "Ranga"', accessStatus: 'AUTHORIZED', isAiDiscovered: true,
    metadata: { firstSeen: '12 Jan 2026', lastSeen: '18 Aug 2026', cases: 3, stations: 2 } },
  { id: 'PERSON-02', type: 'PERSON', label: 'Unknown Associate', sublabel: 'Alias "Billa"', accessStatus: 'AUTHORIZED', isAiDiscovered: true,
    metadata: { firstSeen: '14 Feb 2026', lastSeen: '15 Aug 2026', cases: 2, stations: 3 } },
  { id: 'PERSON-03', type: 'PERSON', label: 'Unidentified Male', sublabel: 'FIR-2026-BBSR-0001 witness', accessStatus: 'AUTHORIZED',
    metadata: { firstSeen: '20 Jul 2026', cases: 1, stations: 1 } },

  // ── Phone Numbers ───────────────────────────────────────────────────────────
  { id: 'PHONE-01', type: 'PHONE', label: '+91-9876543210', sublabel: 'HERO entity', accessStatus: 'AUTHORIZED',
    metadata: { carrier: 'Airtel', circle: 'Odisha', firstSeen: '2026-07-12', cases: 2, stations: 2, relationships: 4 } },
  { id: 'PHONE-02', type: 'PHONE', label: '+91-9999988888', sublabel: 'Cross-station match', accessStatus: 'AUTHORIZED', isCrossStation: true,
    metadata: { carrier: 'Jio', circle: 'Odisha', firstSeen: '2026-08-01', cases: 2, stations: 2 } },
  { id: 'PHONE-03', type: 'PHONE', label: '+91-8888877777', sublabel: 'Local entity', accessStatus: 'AUTHORIZED',
    metadata: { carrier: 'BSNL', circle: 'Odisha', firstSeen: '2026-06-22', cases: 1 } },

  // ── Vehicles ─────────────────────────────────────────────────────────────────
  { id: 'VEH-01', type: 'VEHICLE', label: 'OD-02-AB-1234', sublabel: 'White van (HERO)', accessStatus: 'AUTHORIZED',
    metadata: { type: 'Van', color: 'White', firstSeen: '2026-07-12', cases: 2, stations: 2 } },
  { id: 'VEH-02', type: 'VEHICLE', label: 'OD-05-XY-7777', sublabel: 'Black SUV', accessStatus: 'AUTHORIZED', isCrossStation: true, isAiDiscovered: true,
    metadata: { type: 'SUV', color: 'Black', firstSeen: '2026-08-03', cases: 3, stations: 3 } },
  { id: 'VEH-03', type: 'VEHICLE', label: 'OD-09-CD-3344', sublabel: 'Two-wheeler', accessStatus: 'AUTHORIZED',
    metadata: { type: 'Motorcycle', color: 'Red', firstSeen: '2026-07-28', cases: 1 } },

  // ── Locations ─────────────────────────────────────────────────────────────────
  { id: 'LOC-01', type: 'LOCATION', label: 'Unit IV, Bhubaneswar', sublabel: 'Crime scene 1', accessStatus: 'AUTHORIZED',
    metadata: { lat: '20.2961', lon: '85.8245', cases: 2 } },
  { id: 'LOC-02', type: 'LOCATION', label: 'Badambadi, Cuttack', sublabel: 'Crime scene 2', accessStatus: 'AUTHORIZED', isCrossStation: true,
    metadata: { lat: '20.4625', lon: '85.8828', cases: 1 } },
  { id: 'LOC-03', type: 'LOCATION', label: 'Saheed Nagar, BBSR', sublabel: 'Vehicle spotted', accessStatus: 'AUTHORIZED',
    metadata: { lat: '20.2915', lon: '85.8442', cases: 2 } },
  { id: 'LOC-04', type: 'LOCATION', label: 'Sector-4, Rourkela', sublabel: 'Crime scene 3', accessStatus: 'AUTHORIZED', isCrossStation: true,
    metadata: { lat: '22.2604', lon: '84.8536', cases: 1 } },

  // ── Evidence ─────────────────────────────────────────────────────────────────
  { id: 'EV-01', type: 'EVIDENCE', label: 'CCTV Footage', sublabel: 'Unit IV warehouse', accessStatus: 'AUTHORIZED',
    metadata: { caseId: 'OD-BBSR-2026-0001', uploadedAt: '2026-08-20', entities: 2 } },
  { id: 'EV-02', type: 'EVIDENCE', label: 'Parking Receipt', sublabel: 'OD-02-AB-1234 spotted', accessStatus: 'AUTHORIZED',
    metadata: { caseId: 'OD-BBSR-2026-0001', uploadedAt: '2026-08-20', entities: 1 } },
];

// ─── Edges ─────────────────────────────────────────────────────────────────────

export const NETWORK_EDGES: NetworkEdge[] = [
  // BBSR Case → Entities
  { id: 'E01', source: 'CASE-BBSR-01', target: 'PHONE-01', relationship: 'CONTAINS', label: 'Contains', confidence: 99, discoveredAt: '2026-08-20T09:35:00Z' },
  { id: 'E02', source: 'CASE-BBSR-01', target: 'VEH-01',   relationship: 'CONTAINS', label: 'Contains', confidence: 99, discoveredAt: '2026-08-20T09:35:00Z' },
  { id: 'E03', source: 'CASE-BBSR-01', target: 'LOC-01',   relationship: 'LOCATED_AT', label: 'Scene', confidence: 99, discoveredAt: '2026-08-20T09:35:00Z' },
  { id: 'E04', source: 'CASE-BBSR-01', target: 'EV-01',    relationship: 'CONTAINS', label: 'Evidence', confidence: 99, discoveredAt: '2026-08-20T09:40:00Z' },
  { id: 'E05', source: 'CASE-BBSR-01', target: 'EV-02',    relationship: 'CONTAINS', label: 'Evidence', confidence: 99, discoveredAt: '2026-08-20T09:42:00Z' },
  { id: 'E06', source: 'CASE-BBSR-01', target: 'PERSON-03', relationship: 'INVOLVES', label: 'Involves', confidence: 80, discoveredAt: '2026-08-20T09:44:00Z' },

  // CROSS-STATION HERO LINK: Phone → Cuttack Case
  {
    id: 'E07', source: 'PHONE-01', target: 'CASE-CTC-01',
    relationship: 'MATCHED_ENTITY',
    label: 'Cross-Station Match',
    isCrossStation: true,
    isAiDiscovered: true,
    confidence: 96,
    discoveredAt: '2026-08-20T09:42:00Z'
  },
  // CROSS-STATION: Vehicle → Cuttack Case
  {
    id: 'E08', source: 'VEH-01', target: 'CASE-CTC-01',
    relationship: 'SHARED_VEHICLE',
    label: 'Shared Vehicle',
    isCrossStation: true,
    isAiDiscovered: true,
    confidence: 91,
    discoveredAt: '2026-08-20T09:42:00Z'
  },

  // Cuttack Case entities (partial — restricted)
  { id: 'E09', source: 'CASE-CTC-01', target: 'LOC-02',   relationship: 'LOCATED_AT', label: 'Scene', confidence: 99, isCrossStation: true, discoveredAt: '2026-08-20T09:42:00Z' },

  // BBSR Case 2 (vehicle theft)
  { id: 'E10', source: 'CASE-BBSR-02', target: 'VEH-01',   relationship: 'INVOLVES', label: 'Involves', confidence: 94, discoveredAt: '2026-08-18T14:20:00Z' },
  { id: 'E11', source: 'CASE-BBSR-02', target: 'LOC-03',   relationship: 'LOCATED_AT', label: 'Scene', confidence: 99, discoveredAt: '2026-08-18T14:20:00Z' },
  { id: 'E12', source: 'CASE-BBSR-02', target: 'PHONE-03', relationship: 'CONTAINS', label: 'Contains', confidence: 88, discoveredAt: '2026-08-18T14:22:00Z' },
  { id: 'E13', source: 'CASE-BBSR-02', target: 'PERSON-01', relationship: 'INVOLVES', label: 'Suspect Link', confidence: 73, isAiDiscovered: true, discoveredAt: '2026-08-19T10:05:00Z' },

  // Person network
  { id: 'E14', source: 'PERSON-01', target: 'PHONE-01', relationship: 'OWNS', label: 'Owns', confidence: 80, isAiDiscovered: true, discoveredAt: '2026-08-19T10:05:00Z' },
  { id: 'E15', source: 'PERSON-01', target: 'VEH-02',   relationship: 'OWNS', label: 'Owns', confidence: 76, isAiDiscovered: true, discoveredAt: '2026-08-19T10:06:00Z' },
  { id: 'E16', source: 'PERSON-01', target: 'PERSON-02', relationship: 'COMMON_ASSOCIATE', label: 'Associate', confidence: 71, isAiDiscovered: true, discoveredAt: '2026-08-19T10:07:00Z' },

  // Rourkela (cross-station restricted)
  {
    id: 'E17', source: 'VEH-02', target: 'CASE-RKL-01',
    relationship: 'SHARED_VEHICLE',
    label: 'Shared Vehicle',
    isCrossStation: true,
    isAiDiscovered: true,
    confidence: 88,
    discoveredAt: '2026-08-19T11:00:00Z'
  },
  { id: 'E18', source: 'PHONE-02', target: 'CASE-RKL-01', relationship: 'MATCHED_ENTITY', label: 'Cross-Station Match', isCrossStation: true, confidence: 84, discoveredAt: '2026-08-19T11:02:00Z' },
  { id: 'E19', source: 'CASE-RKL-01', target: 'LOC-04',   relationship: 'LOCATED_AT', label: 'Scene', confidence: 99, isCrossStation: true, discoveredAt: '2026-08-19T11:00:00Z' },
  { id: 'E20', source: 'PERSON-02', target: 'CASE-RKL-01', relationship: 'INVOLVES', label: 'Suspect Link', confidence: 68, isAiDiscovered: true, discoveredAt: '2026-08-19T11:05:00Z' },

  // Berhampur authorized case
  { id: 'E21', source: 'VEH-03', target: 'CASE-BAM-01', relationship: 'USED_IN', label: 'Used In', confidence: 91, discoveredAt: '2026-08-17T08:30:00Z' },
  { id: 'E22', source: 'PHONE-02', target: 'CASE-BAM-01', relationship: 'MATCHED_ENTITY', label: 'Entity Match', isCrossStation: true, confidence: 85, discoveredAt: '2026-08-17T08:32:00Z' },
  { id: 'E23', source: 'PERSON-02', target: 'CASE-BAM-01', relationship: 'INVOLVES', label: 'Suspect Link', confidence: 72, isAiDiscovered: true, discoveredAt: '2026-08-17T09:00:00Z' },

  // Puri authorized case
  { id: 'E24', source: 'PHONE-02', target: 'CASE-PURI-01', relationship: 'CONTAINS', label: 'Contains', confidence: 88, discoveredAt: '2026-08-15T13:00:00Z' },
  { id: 'E25', source: 'CASE-PURI-01', target: 'LOC-03',   relationship: 'TEMPORAL_PROXIMITY', label: 'Near Location', confidence: 62, isAiDiscovered: true, discoveredAt: '2026-08-15T13:05:00Z' },

  // Vehicle→Location links
  { id: 'E26', source: 'VEH-01', target: 'LOC-03',   relationship: 'LOCATED_AT', label: 'Spotted', confidence: 92, discoveredAt: '2026-08-20T09:38:00Z' },
  { id: 'E27', source: 'VEH-02', target: 'LOC-04',   relationship: 'LOCATED_AT', label: 'Spotted', confidence: 88, discoveredAt: '2026-08-19T11:00:00Z' },
];

// ─── Intelligence Activity Timeline ────────────────────────────────────────────
export interface ActivityEvent {
  id: string;
  time: string;
  description: string;
  type: 'MATCH' | 'EXTRACTION' | 'EXPANSION' | 'ANALYSIS' | 'REQUEST';
  relatedNodeId?: string;
}

export const ACTIVITY_TIMELINE: ActivityEvent[] = [
  { id: 'ACT-01', time: '09:42', description: 'Cross-station match: Phone → OD-CTC-2026-00981', type: 'MATCH', relatedNodeId: 'CASE-CTC-01' },
  { id: 'ACT-02', time: '09:40', description: 'Evidence EV-01 processed — 2 entities extracted', type: 'EXTRACTION', relatedNodeId: 'EV-01' },
  { id: 'ACT-03', time: '09:38', description: 'Vehicle OD-02-AB-1234 spotted at Saheed Nagar', type: 'ANALYSIS', relatedNodeId: 'VEH-01' },
  { id: 'ACT-04', time: '09:35', description: 'Case network expanded — 6 relationships mapped', type: 'EXPANSION', relatedNodeId: 'CASE-BBSR-01' },
  { id: 'ACT-05', time: '09:30', description: 'FIR analysis complete — entities extracted', type: 'ANALYSIS', relatedNodeId: 'CASE-BBSR-01' },
  { id: 'ACT-06', time: '08:50', description: 'AI discovered vehicle link — OD-05-XY-7777 → Rourkela', type: 'MATCH', relatedNodeId: 'CASE-RKL-01' },
  { id: 'ACT-07', time: '08:32', description: 'Phone +91-9999988888 matched across 3 stations', type: 'MATCH', relatedNodeId: 'PHONE-02' },
  { id: 'ACT-08', time: '08:20', description: 'AI associate link: "Ranga" ↔ "Billa" identified', type: 'ANALYSIS', relatedNodeId: 'PERSON-01' },
];

// ─── Graph Summary ──────────────────────────────────────────────────────────────
export const GRAPH_SUMMARY = {
  totalCases: 6,
  totalEntities: NETWORK_NODES.filter(n => n.type !== 'STATION' && n.type !== 'CASE').length,
  totalStations: 5,
  crossStationLinks: NETWORK_EDGES.filter(e => e.isCrossStation).length,
  restrictedRecords: NETWORK_NODES.filter(n => n.accessStatus === 'RESTRICTED').length,
  aiDiscoveredLinks: NETWORK_EDGES.filter(e => e.isAiDiscovered).length,
  relationships: NETWORK_EDGES.length,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Get all nodes connected to a given node by one hop */
export function getConnectedNodes(nodeId: string): string[] {
  const connected: string[] = [];
  NETWORK_EDGES.forEach(e => {
    if (e.source === nodeId) connected.push(e.target);
    if (e.target === nodeId) connected.push(e.source);
  });
  return [...new Set(connected)];
}

/** Get all edges involving a node */
export function getNodeEdges(nodeId: string): NetworkEdge[] {
  return NETWORK_EDGES.filter(e => e.source === nodeId || e.target === nodeId);
}

/** Search nodes by label/sublabel */
export function searchNodes(query: string): NetworkNode[] {
  const q = query.toLowerCase();
  return NETWORK_NODES.filter(n =>
    n.label.toLowerCase().includes(q) ||
    (n.sublabel?.toLowerCase().includes(q)) ||
    n.id.toLowerCase().includes(q)
  );
}

/** Get node by id */
export function getNode(id: string): NetworkNode | undefined {
  return NETWORK_NODES.find(n => n.id === id);
}
