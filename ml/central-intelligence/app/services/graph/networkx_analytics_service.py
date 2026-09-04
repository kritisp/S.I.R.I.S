"""
S.I.R.I.S. — NetworkX Application-Side Graph Analytics Service
==============================================================

Computes application-side graph metrics using NetworkX on live Neo4j subgraphs:
- Exact degree centrality, PageRank, betweenness centrality
- Shortest paths & BFS hop distances from focus node
- Connected components (subgraph vs global stats)
- Louvain community detection
- Identifies FOCUS NODE vs IMPORTANT CONNECTOR NODES
"""

import logging
import networkx as nx
from typing import Any, Dict, List, Optional, Set, Tuple

logger = logging.getLogger(__name__)

class NetworkXAnalyticsService:
    """Computes exact NetworkX graph analytics on node/edge structures retrieved from Neo4j."""

    def compute_graph_analytics(
        self,
        nodes: List[Dict[str, Any]],
        edges: List[Dict[str, Any]],
        focus_node_id: Optional[str] = None,
        global_totals: Optional[Dict[str, int]] = None
    ) -> Dict[str, Any]:
        """
        Calculates NetworkX analytics on the provided graph node/edge list.
        Annotates nodes with centrality scores, focus flags, and important connector markers.
        Returns decorated nodes, edges, and statistics payload.
        """
        G = nx.Graph()

        node_map: Dict[str, Dict[str, Any]] = {}
        for n in nodes:
            nid = str(n["id"])
            node_map[nid] = dict(n)
            G.add_node(nid, **n)

        for e in edges:
            src = str(e["source"])
            tgt = str(e["target"])
            if G.has_node(src) and G.has_node(tgt):
                G.add_edge(src, tgt, **e)

        num_nodes = G.number_of_nodes()
        num_edges = G.number_of_edges()

        if num_nodes == 0:
            return {
                "nodes": [],
                "edges": [],
                "stats": {
                    "subgraph_nodes": 0,
                    "subgraph_edges": 0,
                    "subgraph_components": 0,
                    "global_total_nodes": global_totals.get("nodes", 0) if global_totals else 0,
                    "global_total_edges": global_totals.get("edges", 0) if global_totals else 0,
                }
            }

        # 1. Connected Components
        components = list(nx.connected_components(G))
        comp_count = len(components)

        # 2. Centrality Metrics via NetworkX
        degrees = dict(G.degree())
        degree_cent = nx.degree_centrality(G) if num_nodes > 1 else {n: 0.0 for n in G.nodes()}

        try:
            betweenness = nx.betweenness_centrality(G) if num_nodes > 2 else {n: 0.0 for n in G.nodes()}
        except Exception:
            betweenness = {n: 0.0 for n in G.nodes()}

        try:
            pagerank = nx.pagerank(G, alpha=0.85) if num_nodes > 0 else {n: 0.0 for n in G.nodes()}
        except Exception:
            pagerank = {n: 0.0 for n in G.nodes()}

        # 3. Community Detection via NetworkX Louvain / Greedy Modularity
        community_map: Dict[str, int] = {}
        try:
            if num_nodes >= 2:
                comm_sets = list(nx.community.greedy_modularity_communities(G))
                for comm_idx, comm_nodes in enumerate(comm_sets):
                    for cn in comm_nodes:
                        community_map[cn] = comm_idx
        except Exception:
            pass

        # 4. Hop Distance from Focus Node via BFS
        hop_distances: Dict[str, int] = {}
        if focus_node_id and G.has_node(focus_node_id):
            try:
                shortest_paths = nx.single_source_shortest_path_length(G, focus_node_id)
                hop_distances = dict(shortest_paths)
            except Exception:
                hop_distances = {focus_node_id: 0}

        # Determine Highest Score Nodes
        highest_degree = max(degrees.items(), key=lambda x: x[1])[0] if degrees else None
        highest_betweenness = max(betweenness.items(), key=lambda x: x[1])[0] if betweenness else None
        highest_pagerank = max(pagerank.items(), key=lambda x: x[1])[0] if pagerank else None

        # 5. Annotate Nodes with Analytics Results
        annotated_nodes: List[Dict[str, Any]] = []
        for nid, n_data in node_map.items():
            is_focus = (nid == focus_node_id)
            bc_score = round(float(betweenness.get(nid, 0.0)), 4)
            pr_score = round(float(pagerank.get(nid, 0.0)), 4)
            deg_val = int(degrees.get(nid, 0))
            hop = hop_distances.get(nid, 99)

            # Rule for IMPORTANT CONNECTOR NODE:
            # Node with high betweenness centrality OR high degree OR bridging multiple clusters
            is_important = (not is_focus) and (bc_score >= 0.15 or deg_val >= 4 or (pr_score > 0.05 and num_nodes > 10))

            n_data["betweenness"] = bc_score
            n_data["influence"] = pr_score
            n_data["degree"] = deg_val
            n_data["is_focus"] = is_focus
            n_data["is_important"] = is_important
            n_data["hop_distance"] = hop if hop != 99 else None
            n_data["community_id"] = community_map.get(nid, 0)

            annotated_nodes.append(n_data)

        # Sort nodes deterministically: 1. Focus node first, 2. Hop distance, 3. Betweenness desc
        annotated_nodes.sort(key=lambda n: (
            0 if n.get("is_focus") else 1,
            n.get("hop_distance") if n.get("hop_distance") is not None else 99,
            -n.get("betweenness", 0.0)
        ))

        # Statistics summary distinguishing SUBGRAPH vs GLOBAL
        stats_payload = {
            "subgraph_total_nodes": num_nodes,
            "subgraph_total_edges": num_edges,
            "subgraph_components": comp_count,
            "subgraph_communities": len(set(community_map.values())) if community_map else comp_count,
            "focus_node_id": focus_node_id,
            "highest_degree_node": highest_degree,
            "highest_betweenness_node": highest_betweenness,
            "highest_pagerank_node": highest_pagerank,
            "global_total_nodes": global_totals.get("nodes", num_nodes) if global_totals else num_nodes,
            "global_total_edges": global_totals.get("edges", num_edges) if global_totals else num_edges,
            "analytics_engine": "NetworkX (Application-side Python)"
        }

        return {
            "nodes": annotated_nodes,
            "edges": edges,
            "stats": stats_payload
        }

networkx_analytics_service = NetworkXAnalyticsService()
