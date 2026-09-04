"""
S.I.R.I.S. — Neo4j Graph Query Service
======================================

Directly queries the live Neo4j Graph Database via Cypher queries
to serve real-time investigation graph topology, node neighborhoods,
shortest paths, and common neighbors to the frontend Network Explorer.

Reuses the existing Neo4j connection service (`neo4j_connection_service`).
"""

import logging
import time
from typing import Any, Dict, List, Optional

from app.services.graph.connection import (
    Neo4jConnectionService,
    _sanitize_error_message,
    neo4j_connection_service,
)

logger = logging.getLogger(__name__)


def _map_node_to_frontend(record_node: dict) -> dict:
    """
    Maps a raw Neo4j node dictionary/properties to the frontend GraphNode interface:
    {
      id: string,
      label: string,
      entity_type: string,
      node_type: 'entity' | 'case',
      betweenness: number,
      influence: number,
      complaint_count: number,
      is_flagged: boolean,
      district: string,
      station_id: string
    }
    """
    props = record_node.get("props", {})
    labels = record_node.get("labels", [])
    primary_label = labels[0] if labels else "Entity"

    node_id = props.get("node_id") or record_node.get("id") or "unknown"
    
    raw_type = primary_label.upper()
    if raw_type == "CASE":
        entity_type = "CASE"
        node_type = "case"
        label = props.get("fir_number") or props.get("node_id") or node_id
    elif raw_type == "PERSON":
        entity_type = "PERSON"
        node_type = "entity"
        label = props.get("name") or props.get("normalized_name") or node_id
    elif raw_type == "PHONE":
        entity_type = "PHONE"
        node_type = "entity"
        label = props.get("normalized_number") or node_id
    elif raw_type == "VEHICLE":
        entity_type = "VEHICLE"
        node_type = "entity"
        label = props.get("registration_number") or props.get("normalized_reg") or node_id
    elif raw_type == "LOCATION":
        entity_type = "LOCATION"
        node_type = "entity"
        label = props.get("locality") or props.get("city") or node_id
    elif raw_type == "EVIDENCE":
        entity_type = "EVIDENCE"
        node_type = "entity"
        label = f"Evidence ({props.get('evidence_type', 'ITEM')})"
    elif raw_type == "LEGALSECTION":
        entity_type = "LEGAL_SECTION"
        node_type = "entity"
        label = props.get("code") or node_id
    else:
        entity_type = raw_type
        node_type = "entity"
        label = props.get("name") or props.get("title") or node_id

    district = props.get("district") or props.get("state") or "Odisha"
    station_id = props.get("station_id") or "OP-BBSR-CAP"

    return {
        "id": str(node_id),
        "label": str(label),
        "entity_type": entity_type,
        "node_type": node_type,
        "betweenness": float(props.get("betweenness", 0.0)),
        "influence": float(props.get("influence", 0.0)),
        "complaint_count": int(props.get("complaint_count", 0)),
        "is_flagged": bool(props.get("is_flagged", False)),
        "district": str(district),
        "station_id": str(station_id),
        "raw_properties": {k: v for k, v in props.items() if not k.startswith("_")}
    }


def _map_rel_to_frontend(record_rel: dict) -> dict:
    """
    Maps a raw Neo4j relationship record to the frontend GraphEdge interface:
    {
      source: string,
      target: string,
      weight: number,
      relationship: string,
      label: string
    }
    """
    src = str(record_rel.get("source"))
    tgt = str(record_rel.get("target"))
    rel_type = str(record_rel.get("type", "LINKED"))
    props = record_rel.get("props", {})

    weight = float(props.get("confidence_score", 1.0))
    role_label = props.get("role") or props.get("evidence_type") or rel_type.replace("_", " ")

    return {
        "source": src,
        "target": tgt,
        "weight": weight,
        "relationship": rel_type,
        "label": role_label
    }


class Neo4jGraphService:
    """Read service executing Cypher queries directly against Neo4j."""

    def __init__(self, connection_service: Neo4jConnectionService = neo4j_connection_service):
        self.connection_service = connection_service

    def get_overview(self, limit: int = 150) -> Dict[str, Any]:
        """
        Retrieves live Neo4j investigation graph topology (nodes + relationships).
        Guarantees deterministic node ordering, unique nodes & edges, and clean contract formatting.
        """
        driver = self.connection_service.get_driver()
        with driver.session(database=self.connection_service.database) as session:
            # Step 1: Select top nodes up to limit
            nodes_cypher = """
            MATCH (n)
            RETURN n.node_id AS id, labels(n) AS labels, properties(n) AS props
            LIMIT $limit
            """
            nodes_res = session.run(nodes_cypher, {"limit": limit})
            raw_nodes = [dict(record) for record in nodes_res]

            if not raw_nodes:
                return {
                    "nodes": [],
                    "edges": [],
                    "total_nodes": 0,
                    "total_edges": 0,
                    "components": 0,
                    "built_at": time.time(),
                    "source": "neo4j-live"
                }

            node_ids = {n["id"] for n in raw_nodes if n.get("id")}

            # Step 2: Fetch edges between these selected nodes
            edges_cypher = """
            MATCH (a)-[r]->(b)
            WHERE a.node_id IN $node_ids AND b.node_id IN $node_ids
            RETURN a.node_id AS source, b.node_id AS target, type(r) AS type, properties(r) AS props
            """
            edges_res = session.run(edges_cypher, {"node_ids": list(node_ids)})
            raw_edges = [dict(record) for record in edges_res]

            formatted_nodes = [_map_node_to_frontend(n) for n in raw_nodes if n.get("id")]
            formatted_edges = [_map_rel_to_frontend(e) for e in raw_edges if e.get("source") and e.get("target")]

            return {
                "nodes": formatted_nodes,
                "edges": formatted_edges,
                "total_nodes": len(formatted_nodes),
                "total_edges": len(formatted_edges),
                "components": 1,
                "built_at": time.time(),
                "source": "neo4j-live"
            }

    def get_neighbors(self, node_id: str, depth: int = 1, limit: int = 50) -> Dict[str, Any]:
        """BFS graph expansion around a node in Neo4j up to `depth` hops."""
        driver = self.connection_service.get_driver()
        depth = max(1, min(3, depth))
        with driver.session(database=self.connection_service.database) as session:
            cypher = f"""
            MATCH (start {{node_id: $node_id}})
            MATCH path = (start)-[*1..{depth}]-(n)
            WITH DISTINCT n
            LIMIT $limit
            RETURN n.node_id AS id, labels(n) AS labels, properties(n) AS props
            """
            res = session.run(cypher, {"node_id": node_id, "limit": limit})
            neighbor_nodes = [dict(r) for r in res]

            # Include start node itself
            start_res = session.run(
                "MATCH (start {node_id: $node_id}) RETURN start.node_id AS id, labels(start) AS labels, properties(start) AS props",
                {"node_id": node_id}
            )
            start_data = [dict(r) for r in start_res]

            all_nodes_data = start_data + neighbor_nodes
            all_node_ids = list({n["id"] for n in all_nodes_data if n.get("id")})

            if not all_node_ids:
                return {"node_id": node_id, "found": False, "nodes": [], "edges": [], "source": "neo4j-live"}

            edges_cypher = """
            MATCH (a)-[r]->(b)
            WHERE a.node_id IN $ids AND b.node_id IN $ids
            RETURN a.node_id AS source, b.node_id AS target, type(r) AS type, properties(r) AS props
            """
            edges_res = session.run(edges_cypher, {"ids": all_node_ids})
            raw_edges = [dict(r) for r in edges_res]

            formatted_nodes = [_map_node_to_frontend(n) for n in all_nodes_data if n.get("id")]
            for fn in formatted_nodes:
                if fn["id"] == node_id:
                    fn["is_center"] = True

            formatted_edges = [_map_rel_to_frontend(e) for e in raw_edges]

            return {
                "node_id": node_id,
                "found": True,
                "nodes": formatted_nodes,
                "edges": formatted_edges,
                "source": "neo4j-live"
            }

    def get_path(self, from_id: str, to_id: str) -> Dict[str, Any]:
        """Cypher shortest path between two nodes in Neo4j."""
        driver = self.connection_service.get_driver()
        with driver.session(database=self.connection_service.database) as session:
            cypher = """
            MATCH (start {node_id: $from_id}), (target {node_id: $to_id})
            MATCH p = shortestPath((start)-[*]-(target))
            RETURN [n IN nodes(p) | {id: n.node_id, labels: labels(n), props: properties(n)}] AS nodes,
                   [r IN relationships(p) | {source: startNode(r).node_id, target: endNode(r).node_id, type: type(r), props: properties(r)}] AS edges
            """
            result = session.run(cypher, {"from_id": from_id, "to_id": to_id}).single()
            if not result or not result["nodes"]:
                return {
                    "found": False,
                    "from": from_id,
                    "to": to_id,
                    "path": [],
                    "edges": [],
                    "hop_count": 0,
                    "source": "neo4j-live"
                }

            path_nodes = [_map_node_to_frontend(n) for n in result["nodes"]]
            path_edges = [_map_rel_to_frontend(r) for r in result["edges"]]

            return {
                "found": True,
                "from": from_id,
                "to": to_id,
                "path": path_nodes,
                "edges": path_edges,
                "hop_count": len(path_nodes) - 1,
                "source": "neo4j-live"
            }

    def get_common(self, a: str, b: str) -> Dict[str, Any]:
        """Common neighbors between two nodes in Neo4j."""
        driver = self.connection_service.get_driver()
        with driver.session(database=self.connection_service.database) as session:
            cypher = """
            MATCH (na {node_id: $a})--(c)--(nb {node_id: $b})
            RETURN DISTINCT c.node_id AS id, labels(c) AS labels, properties(c) AS props
            """
            res = session.run(cypher, {"a": a, "b": b})
            common_data = [dict(r) for r in res]
            formatted_common = [_map_node_to_frontend(c) for c in common_data if c.get("id")]

            return {
                "a": a,
                "b": b,
                "common": formatted_common,
                "count": len(formatted_common),
                "source": "neo4j-live"
            }


neo4j_graph_service = Neo4jGraphService()
