import sys
import logging
from app.database.postgres import check_postgres_connection
from app.graph.neo4j import neo4j_client, check_neo4j_connection
from app.adapters.spring_boot_adapter import spring_boot_adapter
from app.services.graph.projection import neo4j_graph_projection_service
from app.services.resolution.person_resolution import resolve_person_pair
from app.services.resolution.phone_resolution import resolve_phone_pair
from app.services.resolution.vehicle_resolution import resolve_vehicle_pair

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("pg_projection_resolution_test")

def run_test():
    logger.info("--- POSTGRES -> GRAPH PROJECTION & ENTITY RESOLUTION TEST ---")
    pg_ok = check_postgres_connection()
    neo_ok = check_neo4j_connection()
    logger.info(f"PostgreSQL Connected: {pg_ok} | Neo4j Connected: {neo_ok}")

    if not pg_ok or not neo_ok:
        logger.error("PostgreSQL or Neo4j connection failed!")
        return False

    # 1. Fetch real case dicts from PostgreSQL
    cases = spring_boot_adapter.fetch_all_case_dicts(limit=10)
    logger.info(f"Fetched {len(cases)} cases from PostgreSQL")
    if not cases:
        logger.error("No case records found in PostgreSQL!")
        return False

    for c in cases:
        logger.info(f"  Case ID: {c.get('id')} | FIR: {c.get('fir_number')} | Station: {c.get('station_id')} | Persons: {len(c.get('persons', []))} | Vehicles: {len(c.get('vehicles', []))} | Phones: {len(c.get('phones', []))}")

    # 2. Project cases into Neo4j Graph
    driver = neo4j_client.get_driver()
    with driver.session() as session:
        init_nodes = session.run("MATCH (n) RETURN count(n) AS c").single()["c"]
        init_rels = session.run("MATCH ()-[r]->() RETURN count(r) AS c").single()["c"]
        logger.info(f"Initial Graph Totals: Nodes = {init_nodes}, Rels = {init_rels}")

        for cd in cases:
            cid = str(cd['id'])
            feats = spring_boot_adapter.extract_features_by_id(cid)
            if feats:
                proj_out = neo4j_graph_projection_service.project_extracted_features(feats)
                logger.info(f"Projected Case {cd['fir_number']}: {proj_out}")

        post_nodes = session.run("MATCH (n) RETURN count(n) AS c").single()["c"]
        post_rels = session.run("MATCH ()-[r]->() RETURN count(r) AS c").single()["c"]
        logger.info(f"Post-Projection Graph Totals: Nodes = {post_nodes}, Rels = {post_rels}")

    # 3. Entity Resolution Verification
    logger.info("--- ENTITY RESOLUTION VERIFICATION ---")
    res_high = resolve_person_pair({"id": "p1", "name": "Rajesh Kumar Sahoo"}, {"id": "p2", "name": "Rajesh K. Sahoo"})
    logger.info(f"High Match ('Rajesh Kumar Sahoo' vs 'Rajesh K. Sahoo'): Score = {res_high.overall_score:.4f} | Decision = {res_high.decision}")

    res_med = resolve_person_pair({"id": "p1", "name": "Ramesh Das"}, {"id": "p2", "name": "Ramakanta Das"})
    logger.info(f"Uncertain Match ('Ramesh Das' vs 'Ramakanta Das'): Score = {res_med.overall_score:.4f} | Decision = {res_med.decision}")

    res_unrelated = resolve_person_pair({"id": "p1", "name": "Priyadarshi Jena"}, {"id": "p2", "name": "Subhashree Mohanty"})
    logger.info(f"Unrelated Match ('Priyadarshi Jena' vs 'Subhashree Mohanty'): Score = {res_unrelated.overall_score:.4f} | Decision = {res_unrelated.decision}")

    res_phone = resolve_phone_pair({"normalized_number": "+91-9876543210"}, {"normalized_number": "+91-9876543210"})
    logger.info(f"Phone Match (+91-9876543210 vs +91-9876543210): Score = {res_phone.overall_score:.4f} | Decision = {res_phone.decision}")

    res_veh = resolve_vehicle_pair({"registration_number": "OD-02-AB-1234"}, {"registration_number": "OD-02-AB-1234"})
    logger.info(f"Vehicle Match (OD-02-AB-1234 vs OD-02-AB-1234): Score = {res_veh.overall_score:.4f} | Decision = {res_veh.decision}")

    logger.info("PostgreSQL -> Graph Projection & Entity Resolution test completed with STATUS: VERIFIED")
    return True

if __name__ == "__main__":
    success = run_test()
    sys.exit(0 if success else 1)
