import os
import sys
import logging
from neo4j import GraphDatabase

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("aura_connectivity")

def test_connection():
    uri = os.getenv("NEO4J_URI", "bolt://127.0.0.1:7687")
    username = os.getenv("NEO4J_USERNAME", os.getenv("NEO4J_USER", "neo4j"))
    password = os.getenv("NEO4J_PASSWORD", "Sreyash@123")
    database = os.getenv("NEO4J_DATABASE", "neo4j")

    masked_uri = uri.split("@")[-1] if "@" in uri else uri
    logger.info(f"Testing Neo4j connection to URI: {masked_uri} | User: {username} | DB: {database}")

    try:
        driver = GraphDatabase.driver(uri, auth=(username, password))
        driver.verify_connectivity()
        logger.info("1. Driver connectivity verified successfully!")

        with driver.session(database=database) as session:
            # Cypher Return 1 AS health
            res_health = session.run("RETURN 1 AS health").single()
            if res_health and res_health["health"] == 1:
                logger.info("2. Cypher query 'RETURN 1 AS health' executed successfully! Status: HEALTHY")
            else:
                logger.error("2. Cypher health check query failed!")
                return False

            # Read operation
            n_count = session.run("MATCH (n) RETURN count(n) AS c").single()["c"]
            r_count = session.run("MATCH ()-[r]->() RETURN count(r) AS c").single()["c"]
            logger.info(f"3. Read operation successful! Current Nodes: {n_count}, Relationships: {r_count}")

            # Write & Read-after-write test
            session.run("CREATE (n:HealthCheckTest {id: 'HEALTH_CHECK_TEST_001', timestamp: timestamp()})")
            written_node = session.run("MATCH (n:HealthCheckTest {id: 'HEALTH_CHECK_TEST_001'}) RETURN n.id AS id").single()
            if written_node and written_node["id"] == "HEALTH_CHECK_TEST_001":
                logger.info("4. Write & Read-after-write test successful!")
            else:
                logger.error("4. Read-after-write test failed!")
                return False

            # Cleanup test node
            session.run("MATCH (n:HealthCheckTest {id: 'HEALTH_CHECK_TEST_001'}) DELETE n")
            logger.info("5. Health check test node cleaned up successfully!")

        driver.close()
        logger.info("Neo4j connection test completed with STATUS: VERIFIED")
        return True
    except Exception as e:
        logger.error(f"Neo4j connection test failed: {e}")
        return False

if __name__ == "__main__":
    success = test_connection()
    sys.exit(0 if success else 1)
