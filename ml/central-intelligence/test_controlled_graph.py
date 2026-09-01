import sys
import logging
from app.graph.neo4j import neo4j_client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("controlled_graph_test")

def run_controlled_test():
    driver = neo4j_client.get_driver()
    session = driver.session()

    try:
        logger.info("--- CONTROLLED GRAPH WRITE TEST ---")

        # Baseline counts
        init_nodes = session.run("MATCH (n) RETURN count(n) AS c").single()["c"]
        init_rels = session.run("MATCH ()-[r]->() RETURN count(r) AS c").single()["c"]
        logger.info(f"Baseline Graph State: Nodes = {init_nodes}, Relationships = {init_rels}")

        cypher_pass1 = """
        MERGE (c:Case {node_id: 'TEST_CASE_001'})
        ON CREATE SET c.fir_number = 'TEST_FIR_001', c.station_id = 'OP-TEST-01'
        MERGE (p:Person {node_id: 'TEST_PERSON_001'})
        ON CREATE SET p.name = 'TEST PERSON'
        MERGE (ph:Phone {node_id: 'TEST_PHONE_001'})
        ON CREATE SET ph.normalized_number = '+91-9999999999'
        MERGE (v:Vehicle {node_id: 'TEST_VEHICLE_001'})
        ON CREATE SET v.registration_number = 'OD-00-TEST-0001'

        MERGE (c)-[:INVOLVES]->(p)
        MERGE (c)-[:USED_PHONE]->(ph)
        MERGE (c)-[:OPERATED_VEHICLE]->(v)
        """

        # Pass 1 Write
        session.run(cypher_pass1)
        nodes_pass1 = session.run("MATCH (n) RETURN count(n) AS c").single()["c"]
        rels_pass1 = session.run("MATCH ()-[r]->() RETURN count(r) AS c").single()["c"]
        logger.info(f"Pass 1 Write Totals: Nodes = {nodes_pass1}, Relationships = {rels_pass1}")

        # Pass 2 (Repeat Write - Idempotency Check)
        session.run(cypher_pass1)
        nodes_pass2 = session.run("MATCH (n) RETURN count(n) AS c").single()["c"]
        rels_pass2 = session.run("MATCH ()-[r]->() RETURN count(r) AS c").single()["c"]
        logger.info(f"Pass 2 Repeat Write Totals: Nodes = {nodes_pass2}, Relationships = {rels_pass2}")

        node_delta = nodes_pass2 - nodes_pass1
        rel_delta = rels_pass2 - rels_pass1
        idempotency_pass = (node_delta == 0 and rel_delta == 0)
        logger.info(f"Idempotency Delta Check: Nodes Delta = {node_delta}, Rels Delta = {rel_delta} -> PASS: {idempotency_pass}")

        if not idempotency_pass:
            logger.error("Idempotency check failed!")
            return False

        # Cleanup ONLY TEST_* nodes
        session.run("MATCH (n) WHERE n.node_id STARTS WITH 'TEST_' DETACH DELETE n")
        final_nodes = session.run("MATCH (n) RETURN count(n) AS c").single()["c"]
        final_rels = session.run("MATCH ()-[r]->() RETURN count(r) AS c").single()["c"]
        logger.info(f"After Cleanup Totals: Nodes = {final_nodes}, Relationships = {final_rels}")
        logger.info(f"Pre/Post Node Delta: {final_nodes - init_nodes}, Rel Delta: {final_rels - init_rels}")

        return True

    finally:
        session.close()

if __name__ == "__main__":
    success = run_controlled_test()
    sys.exit(0 if success else 1)
