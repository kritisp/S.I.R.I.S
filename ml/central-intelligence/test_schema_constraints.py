import sys
import logging
from app.services.graph.schema import neo4j_schema_manager
from app.graph.neo4j import neo4j_client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("schema_test")

def verify_schema():
    logger.info("Applying and verifying schema constraints...")
    res = neo4j_schema_manager.apply_schema_constraints()
    logger.info(f"Schema DDL Output: {res}")

    status = neo4j_schema_manager.verify_schema_status()
    logger.info(f"Active Constraints & Indexes Status: {status}")

    driver = neo4j_client.get_driver()
    with driver.session() as session:
        labels = session.run("CALL db.labels() YIELD label RETURN label").value()
        rel_types = session.run("CALL db.relationshipTypes() YIELD relationshipType RETURN relationshipType").value()
        logger.info(f"Existing Graph Labels: {labels}")
        logger.info(f"Existing Relationship Types: {rel_types}")

    logger.info("Schema verification completed successfully.")
    return True

if __name__ == "__main__":
    success = verify_schema()
    sys.exit(0 if success else 1)
