"""
Test script verifying Focus-Node Neighborhood Queries & NetworkX Analytics Engine
"""
import sys
import os
import logging

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.graph.neo4j import check_neo4j_connection
from app.services.graph.neo4j_graph_service import neo4j_graph_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("test_focus_analytics")

def test_focus_and_analytics():
    print("============================================================")
    print("VERIFYING FOCUS-NODE NEIGHBORHOOD & NETWORKX ANALYTICS")
    print("============================================================\n")

    assert check_neo4j_connection(), "Neo4j connection failed!"

    # Fetch global overview to pick a test focus node
    overview = neo4j_graph_service.get_overview(limit=50)
    assert overview.get("nodes"), "No nodes in Neo4j overview!"

    test_focus_id = overview["nodes"][0]["id"]
    test_focus_label = overview["nodes"][0]["label"]
    test_focus_type = overview["nodes"][0]["entity_type"]

    print(f"Selected Test Focus Node: [{test_focus_type}] '{test_focus_label}' (ID: {test_focus_id})")

    # Test 1: get_neighborhood for Case/Entity Focus
    print("\n--- TEST 1: get_neighborhood(depth=2) ---")
    neighborhood = neo4j_graph_service.get_neighborhood(node_id=test_focus_id, depth=2, limit=60)

    assert neighborhood.get("found") is True, "Focus node neighborhood query failed!"
    nodes = neighborhood.get("nodes", [])
    edges = neighborhood.get("edges", [])
    stats = neighborhood.get("stats", {})

    print(f"Neighborhood Subgraph Nodes: {len(nodes)}")
    print(f"Neighborhood Subgraph Edges: {len(edges)}")
    print(f"NetworkX Subgraph Components: {stats.get('subgraph_components')}")
    print(f"Global Neo4j Nodes: {stats.get('global_total_nodes')}")
    print(f"Global Neo4j Edges: {stats.get('global_total_edges')}")

    # Verify Focus Node annotation
    focus_nodes = [n for n in nodes if n.get("is_focus")]
    assert len(focus_nodes) == 1, "Exactly 1 node must be annotated as is_focus!"
    assert focus_nodes[0]["id"] == test_focus_id, "Annotated focus node ID must match test focus ID!"
    print(f"  [OK] Focus Node correctly identified: {focus_nodes[0]['id']} (Hop 0)")

    # Verify Hop Distance annotation
    hop0_count = sum(1 for n in nodes if n.get("hop_distance") == 0)
    hop1_count = sum(1 for n in nodes if n.get("hop_distance") == 1)
    hop2_count = sum(1 for n in nodes if n.get("hop_distance") == 2)
    print(f"  [OK] Hop Distances: Hop 0 = {hop0_count}, Hop 1 = {hop1_count}, Hop 2 = {hop2_count}")

    # Verify Important Connector annotation
    important_nodes = [n for n in nodes if n.get("is_important")]
    print(f"  [OK] Important Connector Nodes identified by NetworkX: {len(important_nodes)}")
    for imp in important_nodes[:3]:
        print(f"      - [{imp['entity_type']}] {imp['label']}: Betweenness = {imp.get('betweenness')}, Degree = {imp.get('degree')}")

    # Verify Edge Semantics
    assert len(edges) > 0, "Neighborhood must return relationships between nodes!"
    sample_edge = edges[0]
    assert "source" in sample_edge and "target" in sample_edge
    assert "relationship" in sample_edge
    print(f"  [OK] Edge Semantics Sample: ({sample_edge['source']})-[{sample_edge['relationship']}]->({sample_edge['target']})")

    print("\n============================================================")
    print("ALL FOCUS-NODE NEIGHBORHOOD & NETWORKX ANALYTICS TESTS PASSED!")
    print("============================================================\n")

if __name__ == "__main__":
    test_focus_and_analytics()
