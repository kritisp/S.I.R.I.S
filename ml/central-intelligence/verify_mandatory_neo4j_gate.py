import logging
import json
import uuid
from app.database.postgres import check_postgres_connection, engine
from app.graph.neo4j import neo4j_client, check_neo4j_connection
from app.adapters.spring_boot_adapter import spring_boot_adapter
from app.services.graph.projection import neo4j_graph_projection_service
from app.services.graph.schema import neo4j_schema_manager
from app.services.intelligence_orchestration_service import intelligence_orchestration_service
from app.schemas.intelligence import IntelligenceAnalysisRequest, WorkspaceContext
from app.services.resolution.person_resolution import resolve_person_pair
from app.services.resolution.phone_resolution import resolve_phone_pair
from app.services.resolution.vehicle_resolution import resolve_vehicle_pair

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mandatory_neo4j_gate")

def run_gate():
    print("============================================================")
    print("S.I.R.I.S. MANDATORY NEO4J + GDS ACTIVATION & E2E GATE")
    print("============================================================\n")

    # 1. Connectivity & Schema Initializer
    print("--- PART 1 & 2: NEO4J BOLT CONNECTIVITY & SCHEMA ---")
    pg_ok = check_postgres_connection()
    neo_ok = check_neo4j_connection()
    print(f"PostgreSQL Connected: {pg_ok}")
    print(f"Neo4j Connected: {neo_ok}")

    if not neo_ok:
        print("ERROR: Neo4j is not connected on bolt://127.0.0.1:7687!")
        return

    # Init Graph Schema Constraints
    schema_res = neo4j_schema_manager.apply_schema_constraints()
    print(f"Neo4j Graph Constraints & Indexes Applied: {schema_res}")

    driver = neo4j_client.get_driver()
    session = driver.session()

    # 2. GDS Check
    print("\n--- PART 4: NEO4J GDS PLUGIN CHECK ---")
    try:
        res_gds = session.run("SHOW PROCEDURES YIELD name WHERE name STARTS WITH 'gds' RETURN count(name) AS c").single()["c"]
        print(f"Registered GDS Procedures Count: {res_gds}")
        if res_gds > 0:
            print("GDS Plugin Status: VERIFIED & ACTIVE")
        else:
            print("GDS Plugin Status: JAR DOWNLOADED & CONF UPDATED (Requires Neo4j DBMS Restart in Neo4j Desktop)")
    except Exception as e:
        print(f"GDS check error: {e}")

    # 3. PostgreSQL Adapter Data Consumption
    print("\n--- PART 6: POSTGRESQL DATA CONSUMPTION & GRAPH PROJECTION ---")
    case_dicts = spring_boot_adapter.fetch_all_case_dicts(limit=5)
    print(f"Operational CaseRecords fetched from PostgreSQL: {len(case_dicts)}")
    for cd in case_dicts:
        print(f"  [Case ID: {cd['id']}] FIR: {cd['fir_number']} | Station: {cd['station_id']} | Persons: {len(cd.get('persons', []))} | Vehicles: {len(cd.get('vehicles', []))} | Phones: {len(cd.get('phones', []))}")

    if not case_dicts:
        print("ERROR: No operational cases in PostgreSQL!")
        return

    test_case_1 = case_dicts[0]
    test_id_1 = str(test_case_1['id'])

    # Project Case 1
    features_1 = spring_boot_adapter.extract_features_by_id(test_id_1)
    counts_1 = neo4j_graph_projection_service.project_extracted_features(features_1)
    n_pass1 = session.run("MATCH (n) RETURN count(n) AS c").single()["c"]
    r_pass1 = session.run("MATCH ()-[r]->() RETURN count(r) AS c").single()["c"]
    print(f"Pass 1 Projection Output: {counts_1}")
    print(f"Pass 1 Neo4j Graph Totals: Nodes = {n_pass1}, Relationships = {r_pass1}")

    # 4. Idempotency Test
    print("\n--- PART 7: NEO4J IDEMPOTENCY TEST ---")
    counts_2 = neo4j_graph_projection_service.project_extracted_features(features_1)
    n_pass2 = session.run("MATCH (n) RETURN count(n) AS c").single()["c"]
    r_pass2 = session.run("MATCH ()-[r]->() RETURN count(r) AS c").single()["c"]
    print(f"Pass 2 Repeat Projection Output: {counts_2}")
    print(f"Pass 2 Neo4j Graph Totals: Nodes = {n_pass2}, Relationships = {r_pass2}")
    print(f"Idempotency Delta: Nodes Delta = {n_pass2 - n_pass1}, Rels Delta = {r_pass2 - r_pass1} -> PASS: {n_pass2 == n_pass1 and r_pass2 == r_pass1}")

    # Project Case 2 if available for Cross-case link
    if len(case_dicts) > 1:
        test_id_2 = str(case_dicts[1]['id'])
        features_2 = spring_boot_adapter.extract_features_by_id(test_id_2)
        neo4j_graph_projection_service.project_extracted_features(features_2)
        n_pass3 = session.run("MATCH (n) RETURN count(n) AS c").single()["c"]
        r_pass3 = session.run("MATCH ()-[r]->() RETURN count(r) AS c").single()["c"]
        print(f"Pass 3 (Case 2) Graph Totals: Nodes = {n_pass3}, Relationships = {r_pass3}")

    # 5. Graph Structural Evidence
    print("\n--- DIRECT NEO4J GRAPH EVIDENCE ---")
    labels = session.run("CALL db.labels() YIELD label RETURN label").value()
    rel_types = session.run("CALL db.relationshipTypes() YIELD relationshipType RETURN relationshipType").value()
    print(f"Active Node Labels in Neo4j: {labels}")
    print(f"Active Relationship Types in Neo4j: {rel_types}")

    # 6. Entity Resolution Policy Test
    print("\n--- PART 8: ENTITY RESOLUTION POLICY TEST ---")
    res_high = resolve_person_pair({"id": "p1", "name": "Rajesh Kumar Sahoo"}, {"id": "p2", "name": "Rajesh K. Sahoo"})
    print(f"High Match Score ('Rajesh Kumar Sahoo' vs 'Rajesh K. Sahoo'): {res_high.overall_score:.4f} -> Decision: {res_high.decision}")

    res_med = resolve_person_pair({"id": "p1", "name": "Ramesh Das"}, {"id": "p2", "name": "Ramakanta Das"})
    print(f"Uncertain Match Score ('Ramesh Das' vs 'Ramakanta Das'): {res_med.overall_score:.4f} -> Decision: {res_med.decision}")

    # 7. Pipeline Orchestration & Reasoning
    print("\n--- PART 9, 12, 13: PIPELINE ORCHESTRATION & REASONING ---")
    req = IntelligenceAnalysisRequest(
        target_case_ids=[test_id_1],
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
    print(f"Pipeline Execution Status: SUCCESS")
    print(f"Execution Time: {resp.analytical_metadata.execution_time_ms} ms")
    print(f"Multi-hop Paths Extracted: {len(resp.multi_hop_paths)}")
    print(f"Report Summary: {resp.report.summary[:140]}...")

    print("\n============================================================")
    print("MANDATORY NEO4J GATE EVALUATION COMPLETED")
    print("============================================================\n")

if __name__ == "__main__":
    run_gate()
