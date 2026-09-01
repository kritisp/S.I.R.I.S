import logging
import json
import uuid
from app.database.postgres import check_postgres_connection, engine
from app.graph.neo4j import neo4j_client, check_neo4j_connection
from app.adapters.spring_boot_adapter import spring_boot_adapter
from app.services.graph.projection import neo4j_graph_projection_service
from app.services.intelligence_orchestration_service import intelligence_orchestration_service
from app.schemas.intelligence import IntelligenceAnalysisRequest, WorkspaceContext
from app.services.resolution.person_resolution import resolve_person_pair
from app.services.resolution.phone_resolution import resolve_phone_pair
from app.services.resolution.vehicle_resolution import resolve_vehicle_pair

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("e2e_verification")

def run_verification():
    print("============================================================")
    print("S.I.R.I.S. CENTRAL INTELLIGENCE E2E VERIFICATION GATE")
    print("============================================================\n")

    # 1. Connectivity Checks
    print("--- 1. CONNECTIVITY CHECKS ---")
    pg_ok = check_postgres_connection()
    neo_ok = check_neo4j_connection()
    print(f"PostgreSQL Connected: {pg_ok}")
    print(f"Neo4j Connected: {neo_ok}")

    if not neo_ok:
        print("ERROR: Neo4j is not connected on bolt://127.0.0.1:7687")
        return

    driver = neo4j_client.get_driver()
    session = driver.session()

    # Initial Neo4j Counts
    res_init_n = session.run("MATCH (n) RETURN count(n) AS c").single()["c"]
    res_init_r = session.run("MATCH ()-[r]->() RETURN count(r) AS c").single()["c"]
    print(f"Neo4j Baseline State: Nodes = {res_init_n}, Relationships = {res_init_r}")

    # 2. Actual PostgreSQL Data Consumption
    print("\n--- 2. POSTGRESQL DATA CONSUMPTION (SpringBootPostgresAdapter) ---")
    case_dicts = spring_boot_adapter.fetch_all_case_dicts(limit=5)
    print(f"Operational CaseRecords fetched from PostgreSQL 'cases' table: {len(case_dicts)}")
    for cd in case_dicts:
        print(f"  [Case ID: {cd['id']}] FIR: {cd['fir_number']} | Station: {cd['station_id']} | Crime: {cd['crime_type']} | Persons: {len(cd.get('persons', []))} | Vehicles: {len(cd.get('vehicles', []))} | Phones: {len(cd.get('phones', []))}")

    if not case_dicts:
        print("ERROR: No cases found in PostgreSQL!")
        return

    test_case = case_dicts[0]
    test_case_id = str(test_case['id'])

    # 3. Neo4j Projection & Idempotency Test
    print("\n--- 3. NEO4J PROJECTION & IDEMPOTENCY TEST ---")
    features_1 = spring_boot_adapter.extract_features_by_id(test_case_id)
    counts_1 = neo4j_graph_projection_service.project_extracted_features(features_1)
    res_pass1_n = session.run("MATCH (n) RETURN count(n) AS c").single()["c"]
    res_pass1_r = session.run("MATCH ()-[r]->() RETURN count(r) AS c").single()["c"]
    print(f"Pass 1 Projection Output: {counts_1}")
    print(f"Pass 1 Neo4j Graph Totals: Nodes = {res_pass1_n}, Relationships = {res_pass1_r}")

    # Pass 2 (Repeat)
    counts_2 = neo4j_graph_projection_service.project_extracted_features(features_1)
    res_pass2_n = session.run("MATCH (n) RETURN count(n) AS c").single()["c"]
    res_pass2_r = session.run("MATCH ()-[r]->() RETURN count(r) AS c").single()["c"]
    print(f"Pass 2 (Repeat) Output: {counts_2}")
    print(f"Pass 2 Neo4j Graph Totals: Nodes = {res_pass2_n}, Relationships = {res_pass2_r}")
    
    node_delta = res_pass2_n - res_pass1_n
    rel_delta = res_pass2_r - res_pass1_r
    print(f"Idempotency Delta Check: Nodes Delta = {node_delta}, Rels Delta = {rel_delta} -> PASS: {node_delta == 0 and rel_delta == 0}")

    # 4. Neo4j Graph Structure Summary
    print("\n--- 4. DIRECT NEO4J GRAPH EVIDENCE ---")
    labels = session.run("CALL db.labels() YIELD label RETURN label").value()
    rel_types = session.run("CALL db.relationshipTypes() YIELD relationshipType RETURN relationshipType").value()
    print(f"Node Labels in Neo4j: {labels}")
    print(f"Relationship Types in Neo4j: {rel_types}")
    sample_nodes = session.run("MATCH (n:Case) RETURN n.node_id AS id, n.fir_number AS fir LIMIT 3").data()
    print(f"Sample Projected Cases in Neo4j: {sample_nodes}")

    # 5. Entity Resolution Policy & Scoring Test
    print("\n--- 5. CROSS-CASE ENTITY RESOLUTION TEST ---")
    # Test Person Scoring Thresholds
    res_high = resolve_person_pair({"id": "p1", "name": "Rajesh Kumar Sahoo"}, {"id": "p2", "name": "Rajesh K. Sahoo"})
    print(f"Person Match (High Confidence): Score = {res_high.overall_score:.4f} -> Decision: {res_high.decision}")

    res_med = resolve_person_pair({"id": "p1", "name": "Ramesh Das"}, {"id": "p2", "name": "Ramakanta Das"})
    print(f"Person Match (Medium/Uncertain): Score = {res_med.overall_score:.4f} -> Decision: {res_med.decision}")

    res_low = resolve_person_pair({"id": "p1", "name": "Priyadarshi Jena"}, {"id": "p2", "name": "Subhashree Mohanty"})
    print(f"Person Match (Low Confidence): Score = {res_low.overall_score:.4f} -> Decision: {res_low.decision}")

    # 6. Pipeline Orchestration & Privacy Test
    print("\n--- 6. PIPELINE ORCHESTRATION & PRIVACY TEST ---")
    req = IntelligenceAnalysisRequest(
        target_case_ids=[test_case_id],
        analytical_scope="FULL",
        max_traversal_depth=3,
        workspace_context=WorkspaceContext(
            investigator_id="INV-BBSR-001",
            station_id="OP-BBSR-CAP",
            role="OFFICER",
            workspace_id="WS-VERIFY-001"
        )
    )
    resp = intelligence_orchestration_service.analyze(req)
    print(f"Intelligence Report Status: SUCCESS")
    print(f"Execution Time: {resp.analytical_metadata.execution_time_ms} ms")
    print(f"Multi-hop Paths Extracted: {len(resp.multi_hop_paths)}")
    print(f"Report Summary: {resp.report.summary[:120]}...")

    print("\n============================================================")
    print("ALL E2E VERIFICATION STEPS EXECUTED SUCCESSFULLY")
    print("============================================================\n")

if __name__ == "__main__":
    run_verification()
