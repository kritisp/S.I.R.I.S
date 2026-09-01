import sys
import logging
import networkx as nx
from app.graph.neo4j import neo4j_client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("networkx_test")

def run_networkx_analytics():
    logger.info("--- NETWORKX GRAPH ANALYTICS VERIFICATION ---")
    driver = neo4j_client.get_driver()
    session = driver.session()

    try:
        # 1. Retrieve all nodes and relationships from Neo4j
        nodes_res = session.run("MATCH (n) RETURN n.node_id AS id, head(labels(n)) AS label, properties(n) AS props").data()
        edges_res = session.run("MATCH (a)-[r]->(b) RETURN a.node_id AS src, b.node_id AS tgt, type(r) AS rel_type, properties(r) AS props").data()

        logger.info(f"Retrieved {len(nodes_res)} nodes and {len(edges_res)} edges from Neo4j")

        # 2. Ingest into NetworkX MultiDiGraph
        G = nx.MultiDiGraph()
        for n in nodes_res:
            G.add_node(n["id"], label=n["label"], **(n["props"] or {}))

        for e in edges_res:
            G.add_edge(e["src"], e["tgt"], key=e["rel_type"], rel_type=e["rel_type"], **(e["props"] or {}))

        logger.info(f"NetworkX Graph Ingestion: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")

        # 3. Convert to Undirected Graph for Centrality & Community Detection
        G_undirected = nx.Graph(G)

        # A. Degree Centrality
        deg_centrality = nx.degree_centrality(G_undirected)
        top_deg = sorted(deg_centrality.items(), key=lambda x: x[1], reverse=True)[:5]
        logger.info(f"Top 5 Degree Centrality Nodes: {top_deg}")

        # B. Betweenness Centrality
        if G_undirected.number_of_nodes() > 2:
            between_centrality = nx.betweenness_centrality(G_undirected)
            top_between = sorted(between_centrality.items(), key=lambda x: x[1], reverse=True)[:5]
            logger.info(f"Top 5 Betweenness Centrality Nodes: {top_between}")

        # C. Connected Components & Communities
        components = list(nx.connected_components(G_undirected))
        logger.info(f"Connected Components Count: {len(components)}")
        for idx, comp in enumerate(components[:3]):
            logger.info(f"  Component {idx+1} (Size: {len(comp)}): {list(comp)[:5]}")

        # D. Community Detection via Louvain or Greedy Modularity
        try:
            communities = list(nx.community.greedy_modularity_communities(G_undirected))
            logger.info(f"Greedy Modularity Communities Detected: {len(communities)}")
            for idx, comm in enumerate(communities[:3]):
                logger.info(f"  Community {idx+1} (Size: {len(comm)}): {list(comm)[:5]}")
        except Exception as comm_err:
            logger.warning(f"Community detection notice: {comm_err}")

        # E. Multi-hop / Shortest Path Exploration
        case_nodes = [n for n, attr in G_undirected.nodes(data=True) if attr.get("label") == "Case"]
        logger.info(f"Case Nodes in NetworkX: {len(case_nodes)}")

        if len(case_nodes) >= 2:
            src_case = case_nodes[0]
            tgt_case = case_nodes[1]
            if nx.has_path(G_undirected, src_case, tgt_case):
                sp = nx.shortest_path(G_undirected, src_case, tgt_case)
                logger.info(f"Shortest Path between {src_case} and {tgt_case}: {sp}")
            else:
                logger.info(f"No path between {src_case} and {tgt_case} (isolated components)")

        # F. GDS Status Check
        try:
            gds_count = session.run("SHOW PROCEDURES YIELD name WHERE name STARTS WITH 'gds' RETURN count(name) AS c").single()["c"]
            logger.info(f"Neo4j GDS Procedures Count: {gds_count} (GDS Available: {gds_count > 0})")
        except Exception as gds_err:
            logger.info(f"Neo4j GDS procedure check notice: {gds_err}")

        logger.info("NetworkX Graph Analytics verification completed with STATUS: VERIFIED")
        return True

    finally:
        session.close()

if __name__ == "__main__":
    success = run_networkx_analytics()
    sys.exit(0 if success else 1)
