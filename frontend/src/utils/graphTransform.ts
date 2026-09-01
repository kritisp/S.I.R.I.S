import type { NetworkNode, NetworkEdge, NodeType } from '../mockServices/networkGraphData';

export interface GraphTransformResult {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  summary: {
    totalCases: number;
    totalEntities: number;
    totalStations: number;
    crossStationLinks: number;
    restrictedRecords: number;
    aiDiscoveredLinks: number;
    relationships: number;
  };
}

export function transformResultPayloadToGraph(resultPayloadJson: string): GraphTransformResult {
  const nodeMap = new Map<string, NetworkNode>();
  const edgeMap = new Map<string, NetworkEdge>();

  try {
    const payload = JSON.parse(resultPayloadJson || '{}');
    const multiHopPaths = payload.multi_hop_paths || [];

    for (const path of multiHopPaths) {
      const rawNodes = path.nodes || [];
      const rawEdges = path.edges || [];

      for (const n of rawNodes) {
        const nodeId = n.node_id || n.id;
        if (!nodeId) continue;

        const rawLabel = (n.label || 'Entity').toUpperCase();
        let nodeType: NodeType = 'EVIDENCE';

        if (rawLabel === 'CASE') nodeType = 'CASE';
        else if (rawLabel === 'PERSON') nodeType = 'PERSON';
        else if (rawLabel === 'PHONE') nodeType = 'PHONE';
        else if (rawLabel === 'VEHICLE') nodeType = 'VEHICLE';
        else if (rawLabel === 'LOCATION') nodeType = 'LOCATION';
        else if (rawLabel === 'STATION') nodeType = 'STATION';

        const props = n.properties || {};
        const labelText = props.fir_number || props.name || props.normalized_number || props.registration_number || props.locality || props.code || nodeId;
        const sublabelText = props.crime_type || props.station_id || props.vehicle_type || rawLabel;

        if (!nodeMap.has(nodeId)) {
          nodeMap.set(nodeId, {
            id: nodeId,
            type: nodeType,
            label: labelText,
            sublabel: sublabelText,
            stationId: props.station_id || 'OP-BBSR-CAP',
            caseId: nodeType === 'CASE' ? nodeId : props.case_id,
            accessStatus: 'AUTHORIZED',
            isLocal: true,
            isCrossStation: Boolean(props.is_cross_station),
            isAiDiscovered: Boolean(props.is_ai_discovered),
            metadata: props,
          });
        }
      }

      for (const e of rawEdges) {
        const src = e.source_id || e.source;
        const tgt = e.target_id || e.target;
        if (!src || !tgt) continue;

        const edgeId = e.id || `${src}->${tgt}`;
        const relType = e.type || e.relationship || 'LINKED_CASE';
        const props = e.properties || {};

        if (!edgeMap.has(edgeId)) {
          edgeMap.set(edgeId, {
            id: edgeId,
            source: src,
            target: tgt,
            relationship: relType,
            label: relType.replace(/_/g, ' '),
            isCrossStation: Boolean(props.is_cross_station),
            isAiDiscovered: Boolean(props.is_ai_discovered),
            confidence: props.confidence_score ? Math.round(props.confidence_score * 100) : 90,
            discoveredAt: props.created_at || new Date().toISOString(),
          });
        }
      }
    }
  } catch (err) {
    console.error('Error transforming resultPayload to graph:', err);
  }

  const nodes = Array.from(nodeMap.values());
  const edges = Array.from(edgeMap.values());

  const totalCases = nodes.filter(n => n.type === 'CASE').length;
  const totalEntities = nodes.filter(n => n.type !== 'STATION' && n.type !== 'CASE').length;
  const totalStations = new Set(nodes.map(n => n.stationId).filter(Boolean)).size || 1;
  const crossStationLinks = edges.filter(e => e.isCrossStation).length;
  const restrictedRecords = nodes.filter(n => n.accessStatus === 'RESTRICTED').length;
  const aiDiscoveredLinks = edges.filter(e => e.isAiDiscovered).length;

  return {
    nodes,
    edges,
    summary: {
      totalCases,
      totalEntities,
      totalStations,
      crossStationLinks,
      restrictedRecords,
      aiDiscoveredLinks,
      relationships: edges.length,
    },
  };
}
