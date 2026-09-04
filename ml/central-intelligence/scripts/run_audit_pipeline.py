"""
Comprehensive Read-Only SIRIS Audit Script
Tests database, Neo4j, case connectivity, focus neighborhood, and NetworkX analytics.
"""
import sys
import os
import json
import logging

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.graph.neo4j import neo4j_client, check_neo4j_connection
from app.services.graph.neo4j_graph_service import neo4j_graph_service
from app.services.graph.networkx_analytics_service import networkx_analytics_service

logging.basicConfig(level=logging.INFO)

def run_audit():
    print("=================================================================")
    print("S.I.R.I.S — DEEP READ-ONLY AUDIT EXECUTION")
    print("=================================================================\n")

    assert check_neo4j_connection(), "Neo4j connection failed!"
    driver = neo4j_client.get_driver()

    with driver.session() as session:
        # PART 2: Node & Relationship counts
        print("--- PART 2: NEO4J TOPOLOGY COUNTS ---")
        node_counts = session.run("""
            MATCH (n)
            RETURN labels(n)[0] AS label, count(n) AS cnt
            ORDER BY cnt DESC
        """).data()
        print("Node Labels:", json.dumps(node_counts, indent=2))

        rel_counts = session.run("""
            MATCH ()-[r]->()
            RETURN type(r) AS rel_type, count(r) AS cnt
            ORDER BY cnt DESC
        """).data()
        print("Relationship Types:", json.dumps(rel_counts, indent=2))

        comp_res = session.run("""
            MATCH (n)
            OPTIONAL MATCH (n)-[r]-(m)
            WITH n, collect(id(m)) AS neighbors
            RETURN n.id AS id, labels(n)[0] AS label
        """).data()

        # Build NetworkX graph of full Neo4j DB
        # Use neo4j_graph_service for overview data to handle fallback node IDs properly
        overview = neo4j_graph_service.get_overview(limit=500)
        nodes_list = overview.get("nodes", [])
        edges_list = overview.get("edges", [])

        full_analytics = networkx_analytics_service.compute_graph_analytics(nodes_list, edges_list)
        print("\nGlobal Component Summary:")
        print(f"Total Nodes: {full_analytics['stats']['subgraph_total_nodes']}")
        print(f"Total Edges: {full_analytics['stats']['subgraph_total_edges']}")
        print(f"Connected Components: {full_analytics['stats']['subgraph_components']}")

        # Inspect property keys on nodes
        sample_keys = session.run("""
            MATCH (n)
            RETURN labels(n)[0] AS label, keys(n) AS keys, elementId(n) AS elem_id
            LIMIT 10
        """).data()
        print("\nSample Node Property Keys in Neo4j:")
        for sk in sample_keys[:5]:
            print(f"  Label [{sk['label']}]: keys = {sk['keys']}, elementId = {sk['elem_id']}")

        # Fetch cases with property resolution
        cases_res = session.run("""
            MATCH (c:Case)
            RETURN coalesce(c.node_id, c.id, c.case_id, elementId(c)) AS id,
                   coalesce(c.fir_number, c.label, c.name, c.title, c.id, elementId(c)) AS label
        """).data()
        print(f"Total Unique Case Nodes: {len(cases_res)}")

        isolated_cases = 0
        cases_with_1_entity = 0
        connected_cases = 0
        case_network_details = []

        for case in cases_res:
            cid = case["id"]
            neighbors = session.run("""
                MATCH (c:Case)-[r]-(e)
                WHERE c.node_id = $cid OR c.id = $cid OR elementId(c) = $cid
                RETURN coalesce(e.node_id, e.id, elementId(e)) AS id, labels(e)[0] AS label, type(r) AS rel_type
            """, cid=cid).data()

            direct_cnt = len(neighbors)
            persons = [n["id"] for n in neighbors if n["label"] == "Person"]
            phones = [n["id"] for n in neighbors if n["label"] == "Phone"]
            vehicles = [n["id"] for n in neighbors if n["label"] == "Vehicle"]
            locations = [n["id"] for n in neighbors if n["label"] == "Location"]
            evidences = [n["id"] for n in neighbors if n["label"] == "Evidence"]
            legalsections = [n["id"] for n in neighbors if n["label"] == "LegalSection"]
            other_cases = [n["id"] for n in neighbors if n["label"] == "Case"]

            if direct_cnt == 0:
                isolated_cases += 1
            elif direct_cnt == 1:
                cases_with_1_entity += 1
            else:
                connected_cases += 1

            case_network_details.append({
                "id": cid,
                "label": case["label"],
                "direct_cnt": direct_cnt,
                "persons": len(persons),
                "phones": len(phones),
                "vehicles": len(vehicles),
                "locations": len(locations),
                "evidences": len(evidences),
                "legalsections": len(legalsections),
                "other_cases": len(other_cases)
            })

        print(f"  - Isolated Cases (0 direct links): {isolated_cases}")
        print(f"  - Cases with only 1 entity: {cases_with_1_entity}")
        print(f"  - Cases connected to multi-entity networks: {connected_cases}")
        print("\nSample Case Breakdown (First 5):")
        for cdet in case_network_details[:5]:
            print(f"    * [{cdet['id']}] '{cdet['label']}': Direct Links = {cdet['direct_cnt']} (Persons: {cdet['persons']}, Phones: {cdet['phones']}, Vehicles: {cdet['vehicles']}, Locations: {cdet['locations']}, Cases: {cdet['other_cases']})")

        # PART 4: Focus-Node / Neighborhood Verification
        print("\n--- PART 4: FOCUS-NODE / NEIGHBORHOOD VERIFICATION ---")
        test_types = ["Case", "Person", "Phone", "Vehicle", "Location"]
        for ttype in test_types:
            sample_node = session.run(f"MATCH (n:{ttype}) RETURN coalesce(n.id, n.node_id, elementId(n)) AS id, coalesce(n.label, n.name, n.id, elementId(n)) AS label LIMIT 1").single()
            if not sample_node or not sample_node["id"]:
                print(f"  [WARN] No node found for type {ttype}")
                continue
            nid = sample_node["id"]
            nlabel = sample_node["label"]
            print(f"\nTesting Focus Type [{ttype}] ID: {nid} ('{nlabel}')")

            # depth=1
            nb1 = neo4j_graph_service.get_neighborhood(node_id=nid, depth=1, limit=50)
            # depth=2
            nb2 = neo4j_graph_service.get_neighborhood(node_id=nid, depth=2, limit=50)

            print(f"  Depth 1: Nodes = {len(nb1.get('nodes', []))}, Edges = {len(nb1.get('edges', []))}")
            print(f"  Depth 2: Nodes = {len(nb2.get('nodes', []))}, Edges = {len(nb2.get('edges', []))}")

            focus_in_nb2 = [n for n in nb2.get('nodes', []) if n.get('is_focus')]
            print(f"  Focus Node in Depth 2 returned: {len(focus_in_nb2)} (hop_distance = {focus_in_nb2[0].get('hop_distance') if focus_in_nb2 else 'N/A'})")

        print("\n================================================ deliverance completed!")

if __name__ == "__main__":
    run_audit()
