"""
Audit Script: Inspect Live Neo4j Graph Topology & NetworkX Analytics
"""
import sys
import os
import logging
import networkx as nx
from typing import Dict, Any

# Add parent dir to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.graph.neo4j import neo4j_client, check_neo4j_connection

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("audit_graph_topology")

def audit_topology():
    print("============================================================")
    print("TASK 1: AUDITING LIVE NEO4J GRAPH TOPOLOGY & NETWORKX ANALYTICS")
    print("============================================================\n")

    assert check_neo4j_connection(), "Neo4j connection failed!"
    driver = neo4j_client.get_driver()

    with driver.session() as session:
        # 1. Total Nodes & Total Relationships
        total_nodes = session.run("MATCH (n) RETURN count(n) AS c").single()["c"]
        total_rels = session.run("MATCH ()-[r]->() RETURN count(r) AS c").single()["c"]
        print(f"Global Neo4j Totals: {total_nodes} Nodes, {total_rels} Relationships")

        # 2. Node Counts by Label
        label_counts = {}
        labels = session.run("CALL db.labels() YIELD label RETURN label").value()
        for lbl in labels:
            cnt = session.run(f"MATCH (n:{lbl}) RETURN count(n) AS c").single()["c"]
            label_counts[lbl] = cnt
        print("\nNode Counts by Label:")
        for lbl, cnt in sorted(label_counts.items(), key=lambda x: x[1], reverse=True):
            print(f"  - {lbl}: {cnt}")

        # 3. Relationship Counts by Type
        rel_type_counts = {}
        rel_types = session.run("CALL db.relationshipTypes() YIELD relationshipType RETURN relationshipType").value()
        for rt in rel_types:
            cnt = session.run(f"MATCH ()-[r:{rt}]->() RETURN count(r) AS c").single()["c"]
            rel_type_counts[rt] = cnt
        print("\nRelationship Counts by Type:")
        for rt, cnt in sorted(rel_type_counts.items(), key=lambda x: x[1], reverse=True):
            print(f"  - {rt}: {cnt}")

        # 4. Fetch full graph into NetworkX for exact component and centrality calculation
        nodes_res = session.run("MATCH (n) RETURN n.node_id AS id, labels(n) AS labels, properties(n) AS props").data()
        rels_res = session.run("MATCH (a)-[r]->(b) RETURN a.node_id AS source, b.node_id AS target, type(r) AS type, properties(r) AS props").data()

        G = nx.Graph()
        for n in nodes_res:
            nid = n.get("id")
            if nid:
                lbls = n.get("labels", [])
                primary = lbls[0] if lbls else "Entity"
                G.add_node(nid, label=primary, props=n.get("props", {}))

        for r in rels_res:
            src = r.get("source")
            tgt = r.get("target")
            if src and tgt and G.has_node(src) and G.has_node(tgt):
                G.add_edge(src, tgt, type=r.get("type"), props=r.get("props", {}))

        print(f"\nNetworkX Loaded Graph: {G.number_of_nodes()} Nodes, {G.number_of_edges()} Edges")

        # 5. Connected Component Analysis
        components = list(nx.connected_components(G))
        print(f"\nConnected Components Count: {len(components)}")
        comp_sizes = sorted([len(c) for c in components], reverse=True)
        print(f"Component Sizes Distribution: {comp_sizes[:10]} ...")

        # Case Distribution Across Components
        print("\nLargest Components Case Composition:")
        for idx, comp in enumerate(sorted(components, key=len, reverse=True)[:5]):
            case_nodes = [n for n in comp if G.nodes[n].get("label") == "Case"]
            entity_nodes = [n for n in comp if G.nodes[n].get("label") != "Case"]
            print(f"  - Component {idx+1} (Size {len(comp)}): {len(case_nodes)} Cases, {len(entity_nodes)} Entities")

        # 6. Centrality & Importance Metrics via NetworkX
        print("\nTop 5 Nodes by Degree:")
        degrees = dict(G.degree())
        top_deg = sorted(degrees.items(), key=lambda x: x[1], reverse=True)[:5]
        for nid, deg in top_deg:
            lbl = G.nodes[nid].get("label")
            fir = G.nodes[nid].get("props", {}).get("fir_number") or G.nodes[nid].get("props", {}).get("name") or nid
            print(f"  - [{lbl}] {fir} ({nid}): Degree = {deg}")

        print("\nTop 5 Nodes by Betweenness Centrality (NetworkX):")
        bc = nx.betweenness_centrality(G)
        top_bc = sorted(bc.items(), key=lambda x: x[1], reverse=True)[:5]
        for nid, score in top_bc:
            lbl = G.nodes[nid].get("label")
            fir = G.nodes[nid].get("props", {}).get("fir_number") or G.nodes[nid].get("props", {}).get("name") or nid
            print(f"  - [{lbl}] {fir} ({nid}): Betweenness = {score:.4f}")

        print("\nTop 5 Nodes by PageRank (NetworkX):")
        try:
            pr = nx.pagerank(G)
            top_pr = sorted(pr.items(), key=lambda x: x[1], reverse=True)[:5]
            for nid, score in top_pr:
                lbl = G.nodes[nid].get("label")
                fir = G.nodes[nid].get("props", {}).get("fir_number") or G.nodes[nid].get("props", {}).get("name") or nid
                print(f"  - [{lbl}] {fir} ({nid}): PageRank = {score:.4f}")
        except Exception as e:
            print(f"  PageRank computation error: {e}")

        # 7. Check Cross-Case Linkage
        case_nodes_all = [n for n in G.nodes if G.nodes[n].get("label") == "Case"]
        print(f"\nTotal Case Nodes: {len(case_nodes_all)}")
        cross_case_count = 0
        for i in range(len(case_nodes_all)):
            for j in range(i+1, len(case_nodes_all)):
                c1, c2 = case_nodes_all[i], case_nodes_all[j]
                if nx.has_path(G, c1, c2):
                    cross_case_count += 1
        print(f"Pairs of Cases with Paths between them: {cross_case_count} / {(len(case_nodes_all)*(len(case_nodes_all)-1))//2 if len(case_nodes_all)>1 else 0}")

    print("\n============================================================")
    print("TASK 1 AUDIT COMPLETED")
    print("============================================================\n")

if __name__ == "__main__":
    audit_topology()
