import os
import sys
import logging
from dotenv import load_dotenv
from neo4j import GraphDatabase

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("aura_connectivity")

def test_connection():
    uri = os.getenv("NEO4J_URI", "neo4j+s://1cb4cc93.databases.neo4j.io")
    username = os.getenv("NEO4J_USERNAME", "1cb4cc93")
    password = os.getenv("NEO4J_PASSWORD", "60RbmZa2Mo0j2ENhRf-xKIBkMVTNuR743g2p0DXemTw")
    database = os.getenv("NEO4J_DATABASE", "neo4j")

    masked_uri = uri.split("@")[-1] if "@" in uri else uri
    logger.info(f"Testing Neo4j connection to URI: {masked_uri} | User: {username} | DB: {database}")

    try:
        driver = GraphDatabase.driver(uri, auth=(username, password))
        driver.verify_connectivity()
        logger.info("1. Driver connectivity verified successfully!")

        session = None
        for db_opt in [database, "1cb4cc93", None]:
            try:
                session_kwargs = {"database": db_opt} if db_opt else {}
                session = driver.session(**session_kwargs)
                res_health = session.run("RETURN 1 AS health").single()
                if res_health and res_health["health"] == 1:
                    logger.info(f"2. Cypher query 'RETURN 1 AS health' executed successfully on db '{db_opt}'! Status: HEALTHY")
                    database = db_opt
                    break
            except Exception as db_err:
                logger.info(f"Session try for db '{db_opt}' failed: {db_err}")
                if session:
                    session.close()
                session = None

        if not session:
            logger.error("Could not establish session on any database target!")
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
