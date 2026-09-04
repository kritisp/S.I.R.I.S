import os
import pathlib
import sys
import json

central_intel_dir = str(pathlib.Path(__file__).resolve().parents[1])
repo_root = str(pathlib.Path(__file__).resolve().parents[2])

if central_intel_dir not in sys.path:
    sys.path.insert(0, central_intel_dir)
if repo_root not in sys.path:
    sys.path.insert(0, repo_root)

env_path = pathlib.Path(central_intel_dir) / ".env"
db_url = os.environ.get("DATABASE_URL", "")
if not db_url and env_path.exists():
    for line in env_path.read_text().splitlines():
        if line.startswith("DATABASE_URL="):
            db_url = line.split("=", 1)[1].strip().strip('"').strip("'")
            break

if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.services.graph.connection import neo4j_connection_service
from app.services.graph.neo4j_graph_service import neo4j_graph_service
from app.services.graph.networkx_analytics_service import networkx_analytics_service
from app.services.resolution.resolver import EntityResolver
from app.normalization.service import EntityNormalizationService
from app.services.pattern_engine import pattern_intelligence_engine, PatternDetectionRequest
from app.models.case import Case as CaseModel

def main():
    print("=" * 80)
    print("S.I.R.I.S. GRAPH INTELLIGENCE DEEP RECONCILIATION & AUDIT")
    print("=" * 80)

    # 1. PostgreSQL Counts
    engine = create_engine(db_url, echo=False)
    Session = sessionmaker(bind=engine)
    session = Session()

    pg_cases_count = session.execute(text("SELECT count(*) FROM cases")).scalar()
    pg_persons_count = session.execute(text("SELECT count(*) FROM persons")).scalar()
    pg_phones_count = session.execute(text("SELECT count(*) FROM phones")).scalar()
    pg_vehicles_count = session.execute(text("SELECT count(*) FROM vehicles")).scalar()
    pg_locations_count = session.execute(text("SELECT count(*) FROM locations")).scalar()
    pg_evidences_count = session.execute(text("SELECT count(*) FROM evidences")).scalar()

    print(f"\n--- 1. POSTGRESQL AUTHORITATIVE COUNTS ---")
    print(f"Cases        : {pg_cases_count}")
    print(f"Persons      : {pg_persons_count}")
    print(f"Phones       : {pg_phones_count}")
    print(f"Vehicles     : {pg_vehicles_count}")
    print(f"Locations    : {pg_locations_count}")
    print(f"Evidences    : {pg_evidences_count}")

    # 2. Neo4j Counts
    driver = neo4j_connection_service.get_driver()
    with driver.session(database=neo4j_connection_service.database) as n4j:
        n4j_total_nodes = n4j.run("MATCH (n) RETURN count(n) AS c").single()["c"]
        n4j_total_rels = n4j.run("MATCH ()-[r]->() RETURN count(r) AS c").single()["c"]
        
        n4j_cases_count = n4j.run("MATCH (c:Case) RETURN count(c) AS c").single()["c"]
        n4j_persons_count = n4j.run("MATCH (p:Person) RETURN count(p) AS c").single()["c"]
        n4j_phones_count = n4j.run("MATCH (ph:Phone) RETURN count(ph) AS c").single()["c"]
        n4j_vehicles_count = n4j.run("MATCH (v:Vehicle) RETURN count(v) AS c").single()["c"]
        n4j_locations_count = n4j.run("MATCH (l:Location) RETURN count(l) AS c").single()["c"]
        n4j_evidences_count = n4j.run("MATCH (e:Evidence) RETURN count(e) AS c").single()["c"]
        n4j_legal_count = n4j.run("MATCH (s:LegalSection) RETURN count(s) AS c").single()["c"]

        # Check for duplicates or missing
        duplicate_cases = n4j.run("MATCH (c:Case) WITH c.node_id AS nid, count(*) AS cnt WHERE cnt > 1 RETURN count(nid) AS c").single()["c"]
        orphan_nodes = n4j.run("MATCH (n) WHERE NOT (n)--() RETURN count(n) AS c").single()["c"]

    print(f"\n--- 2. NEO4J AURA CLOUD COUNTS ---")
    print(f"Total Nodes  : {n4j_total_nodes}")
    print(f"Total Edges  : {n4j_total_rels}")
    print(f"Case Nodes   : {n4j_cases_count}")
    print(f"Person Nodes : {n4j_persons_count}")
    print(f"Phone Nodes  : {n4j_phones_count}")
    print(f"Vehicle Nodes: {n4j_vehicles_count}")
    print(f"Loc Nodes    : {n4j_locations_count}")
    print(f"Evidence Nodes: {n4j_evidences_count}")
    print(f"LegalSec Nodes: {n4j_legal_count}")
    print(f"Duplicate Cases: {duplicate_cases}")
    print(f"Orphan Nodes  : {orphan_nodes}")

    # 3. Reconciliation Data
    missing_in_neo4j = max(0, pg_cases_count - n4j_cases_count)
    unexpected_in_neo4j = max(0, n4j_cases_count - pg_cases_count)

    print(f"\n--- 3. POSTGRES ↔ NEO4J RECONCILIATION SUMMARY ---")
    print(f"PostgreSQL Cases   : {pg_cases_count}")
    print(f"Neo4j Case Nodes   : {n4j_cases_count}")
    print(f"Missing in Neo4j   : {missing_in_neo4j}")
    print(f"Unexpected in Neo4j: {unexpected_in_neo4j}")
    print(f"Duplicate Case IDs : {duplicate_cases}")
    print(f"Projection Integrity: {'PERFECT (100%)' if missing_in_neo4j == 0 and duplicate_cases == 0 else 'PARTIAL'}")

    # 4. Entity Resolution Verification
    print(f"\n--- 4. ENTITY RESOLUTION VERIFICATION ---")
    p1 = {"id": "person_101", "name": "Biswanath Mishra", "phone": "9861105000"}
    p2 = {"id": "person_101", "name": "B. Mishra", "phone": "9861105000"}
    p3 = {"id": "person_999", "name": "Ramesh Kumar", "phone": "9999999999"}
    
    res_exact = EntityResolver.resolve_person(p1, p2)
    res_diff = EntityResolver.resolve_person(p1, p3)
    
    print(f"Exact Match Test    : {res_exact.decision.value} (score={res_exact.confidence_score})")
    print(f"Negative Match Test : {res_diff.decision.value} (score={res_diff.confidence_score})")

    # 5. Case Connectivity & NetworkX
    overview = neo4j_graph_service.get_overview(limit=150)
    analytics = networkx_analytics_service.compute_graph_analytics(overview["nodes"], overview["edges"])
    stats = analytics.get("stats", {})

    print(f"\n--- 5. GRAPH TOPOLOGY & NETWORKX ANALYTICS ---")
    print(f"Subgraph Nodes     : {len(overview['nodes'])}")
    print(f"Subgraph Edges     : {len(overview['edges'])}")
    print(f"Connected Comps    : {stats.get('subgraph_components')}")
    print(f"Greedy Communities : {stats.get('subgraph_communities')}")
    print(f"Highest Degree Node: {stats.get('highest_degree_node')}")
    print(f"Highest Betweenness: {stats.get('highest_betweenness_node')}")
    print(f"Highest PageRank   : {stats.get('highest_pagerank_node')}")

    session.close()

if __name__ == "__main__":
    main()
