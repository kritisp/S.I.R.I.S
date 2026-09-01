import sys
import logging
import json
from app.adapters.spring_boot_adapter import spring_boot_adapter
from app.services.graph.projection import neo4j_graph_projection_service
from app.services.intelligence_orchestration_service import intelligence_orchestration_service
from app.schemas.intelligence import IntelligenceAnalysisRequest, WorkspaceContext

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ci_live_path_test")

def run_live_path_test():
    logger.info("--- CENTRAL INTELLIGENCE LIVE ORCHESTRATION PATH TEST ---")

    # 1. Fetch case from PostgreSQL
    cases = spring_boot_adapter.fetch_all_case_dicts(limit=5)
    if not cases:
        logger.error("No case records found in PostgreSQL!")
        return False

    test_case = cases[0]
    test_case_id = str(test_case["id"])
    fir_number = test_case.get("fir_number")
    logger.info(f"Selected Target Case: ID={test_case_id} | FIR={fir_number}")

    # 2. Ensure case features are projected in Neo4j
    feats = spring_boot_adapter.extract_features_by_id(test_case_id)
    if feats:
        proj = neo4j_graph_projection_service.project_extracted_features(feats)
        logger.info(f"Projected Features in Neo4j: {proj}")

    # 3. Construct Orchestration Request
    req = IntelligenceAnalysisRequest(
        target_case_ids=[test_case_id],
        analytical_scope="FULL",
        max_traversal_depth=3,
        workspace_context=WorkspaceContext(
            workspace_id="WS-AURA-TEST-001",
            investigator_id="INV-BBSR-001",
            station_id="OP-BBSR-CAP",
            role="OFFICER",
        ),
    )

    # 4. Execute Live Intelligence Orchestration
    res = intelligence_orchestration_service.analyze(req)
    logger.info("Live Orchestration Pipeline Execution: SUCCESS")
    logger.info(f"Analytical Metadata: Execution Time = {res.analytical_metadata.execution_time_ms} ms, Cases Evaluated = {res.analytical_metadata.cases_evaluated_count}")
    logger.info(f"Graph Traversal: Multi-hop Paths Extracted = {len(res.multi_hop_paths)}")
    logger.info(f"Report Summary: {res.report.summary[:150]}...")
    logger.info(f"Key Observations Count: {len(res.report.key_observations)}")
    logger.info(f"Recommended Followups Count: {len(res.report.recommended_followups)}")

    logger.info("Central Intelligence Live Path verification completed with STATUS: VERIFIED")
    return True

if __name__ == "__main__":
    success = run_live_path_test()
    sys.exit(0 if success else 1)
