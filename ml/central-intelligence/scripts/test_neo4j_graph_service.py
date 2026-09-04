"""
Test script verifying live Neo4j Graph Query Service.
"""
import sys
import os
import logging

# Ensure parent path is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.graph.neo4j import check_neo4j_connection
from app.services.graph.neo4j_graph_service import neo4j_graph_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("test_neo4j_graph_service")

def test_service():
    print("============================================================")
    print("VERIFYING NEO4J GRAPH QUERY SERVICE (DIRECT NEO4J)")
    print("============================================================\n")

    neo_connected = check_neo4j_connection()
    print(f"Neo4j Connected: {neo_connected}")
    assert neo_connected, "Neo4j connection failed!"

    # Test 1: get_overview
    print("\n--- TEST 1: get_overview(150) ---")
    overview = neo4j_graph_service.get_overview(limit=150)
    print(f"Source Tag: {overview.get('source')}")
    print(f"Total Nodes: {overview.get('total_nodes')}")
    print(f"Total Edges: {overview.get('total_edges')}")
    print(f"Sample Node: {overview['nodes'][0] if overview.get('nodes') else 'NONE'}")
    print(f"Sample Edge: {overview['edges'][0] if overview.get('edges') else 'NONE'}")

    assert "nodes" in overview
    assert "edges" in overview
    assert overview.get("source") == "neo4j-live"

    # Verify no duplicate nodes
    node_ids = [n["id"] for n in overview["nodes"]]
    assert len(node_ids) == len(set(node_ids)), "Duplicate nodes found in get_overview!"

    # Verify every edge source and target exists in nodes
    node_id_set = set(node_ids)
    for edge in overview["edges"]:
        assert edge["source"] in node_id_set, f"Edge source {edge['source']} not in returned nodes!"
        assert edge["target"] in node_id_set, f"Edge target {edge['target']} not in returned nodes!"

    print("\n--- TEST 1 RESULT: PASSED CLEANLY ---")

    # Test 2: get_neighbors if nodes present
    if overview["nodes"]:
        target_id = overview["nodes"][0]["id"]
        print(f"\n--- TEST 2: get_neighbors for '{target_id}' ---")
        neighbors = neo4j_graph_service.get_neighbors(target_id, depth=1)
        print(f"Found: {neighbors.get('found')}")
        print(f"Neighbor Nodes Count: {len(neighbors.get('nodes', []))}")
        print(f"Neighbor Edges Count: {len(neighbors.get('edges', []))}")
        assert neighbors.get("found") is True
        print("--- TEST 2 RESULT: PASSED CLEANLY ---")

    print("\n============================================================")
    print("ALL NEO4J GRAPH QUERY SERVICE TESTS PASSED SUCCESSFULLY!")
    print("============================================================\n")

if __name__ == "__main__":
    test_service()
