import os
import sys
import logging
from typing import Dict, List, Any
from neo4j import GraphDatabase

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("migration_service")

class Neo4jMigrationService:
    def __init__(self, source_uri: str, source_user: str, source_pass: str, source_db: str,
                 target_uri: str, target_user: str, target_pass: str, target_db: str):
        self.source_uri = source_uri
        self.source_user = source_user
        self.source_pass = source_pass
        self.source_db = source_db

        self.target_uri = target_uri
        self.target_user = target_user
        self.target_pass = target_pass
        self.target_db = target_db

    def get_source_driver(self):
        return GraphDatabase.driver(self.source_uri, auth=(self.source_user, self.source_pass))

    def get_target_driver(self):
        return GraphDatabase.driver(self.target_uri, auth=(self.target_user, self.target_pass))

    def inventory(self, driver, db_name: str, label: str) -> Dict[str, Any]:
        with driver.session(database=db_name) as session:
            nodes = session.run("MATCH (n) RETURN count(n) AS c").single()["c"]
            rels = session.run("MATCH ()-[r]->() RETURN count(r) AS c").single()["c"]
            labels = session.run("CALL db.labels() YIELD label RETURN label").value()
            rel_types = session.run("CALL db.relationshipTypes() YIELD relationshipType RETURN relationshipType").value()

            logger.info(f"[{label}] Database '{db_name}': Nodes={nodes}, Relationships={rels}")
            logger.info(f"[{label}] Labels: {labels}")
            logger.info(f"[{label}] Relationship Types: {rel_types}")

            return {
                "nodes": nodes,
                "relationships": rels,
                "labels": labels,
                "relationship_types": rel_types
            }

    def execute_migration(self) -> Dict[str, Any]:
        logger.info("============================================================")
        logger.info("NEO4J LOCAL -> AURA MIGRATION PIPELINE")
        logger.info("============================================================\n")

        src_driver = self.get_source_driver()
        tgt_driver = self.get_target_driver()

        try:
            # 14.1 & 14.2 Inventory
            src_inv_before = self.inventory(src_driver, self.source_db, "LOCAL SOURCE BEFORE")
            tgt_inv_before = self.inventory(tgt_driver, self.target_db, "TARGET AURA BEFORE")

            # 14.3 MERGE-based migration
            logger.info("--- EXECUTING DETERMINISTIC MERGE MIGRATION ---")

            with src_driver.session(database=self.source_db) as src_session:
                # A. Fetch all nodes
                nodes_data = src_session.run(
                    "MATCH (n) RETURN n.node_id AS node_id, labels(n) AS labels, properties(n) AS props"
                ).data()
                logger.info(f"Fetched {len(nodes_data)} nodes from Local Source")

                # B. Fetch all relationships
                rels_data = src_session.run(
                    "MATCH (a)-[r]->(b) RETURN a.node_id AS src_id, b.node_id AS tgt_id, type(r) AS rel_type, properties(r) AS props"
                ).data()
                logger.info(f"Fetched {len(rels_data)} relationships from Local Source")

            # Batch write into Target Aura
            with tgt_driver.session(database=self.target_db) as tgt_session:
                # Migrate Nodes
                migrated_nodes = 0
                for n in nodes_data:
                    node_id = n.get("node_id")
                    if not node_id:
                        continue
                    lbls = n.get("labels", [])
                    label_str = ":" + ":".join(lbls) if lbls else ":Entity"
                    props = n.get("props", {})

                    query = f"""
                    MERGE (n{label_str} {{node_id: $node_id}})
                    SET n += $props
                    """
                    tgt_session.run(query, {"node_id": node_id, "props": props})
                    migrated_nodes += 1

                logger.info(f"Successfully MERGED {migrated_nodes} nodes into Target Aura")

                # Migrate Relationships
                migrated_rels = 0
                for r in rels_data:
                    src_id = r.get("src_id")
                    tgt_id = r.get("tgt_id")
                    rel_type = r.get("rel_type")
                    props = r.get("props", {})

                    if not src_id or not tgt_id or not rel_type:
                        continue

                    query = f"""
                    MATCH (a {{node_id: $src_id}})
                    MATCH (b {{node_id: $tgt_id}})
                    MERGE (a)-[r:{rel_type}]->(b)
                    SET r += $props
                    """
                    tgt_session.run(query, {"src_id": src_id, "tgt_id": tgt_id, "props": props})
                    migrated_rels += 1

                logger.info(f"Successfully MERGED {migrated_rels} relationships into Target Aura")

            # 14.7 Post-Migration Validation
            tgt_inv_after_pass1 = self.inventory(tgt_driver, self.target_db, "TARGET AURA AFTER PASS 1")

            # 14.9 Migration Idempotency Test (Run Pass 2)
            logger.info("--- EXECUTING IDEMPOTENCY PASS 2 MIGRATION ---")
            with tgt_driver.session(database=self.target_db) as tgt_session:
                for n in nodes_data:
                    node_id = n.get("node_id")
                    if not node_id: continue
                    lbls = n.get("labels", [])
                    label_str = ":" + ":".join(lbls) if lbls else ":Entity"
                    props = n.get("props", {})
                    tgt_session.run(f"MERGE (n{label_str} {{node_id: $node_id}}) SET n += $props", {"node_id": node_id, "props": props})

                for r in rels_data:
                    src_id = r.get("src_id")
                    tgt_id = r.get("tgt_id")
                    rel_type = r.get("rel_type")
                    props = r.get("props", {})
                    if not src_id or not tgt_id or not rel_type: continue
                    tgt_session.run(f"MATCH (a {{node_id: $src_id}}), (b {{node_id: $tgt_id}}) MERGE (a)-[r:{rel_type}]->(b) SET r += $props", {"src_id": src_id, "tgt_id": tgt_id, "props": props})

            tgt_inv_after_pass2 = self.inventory(tgt_driver, self.target_db, "TARGET AURA AFTER PASS 2 (IDEMPOTENCY)")

            node_delta = tgt_inv_after_pass2["nodes"] - tgt_inv_after_pass1["nodes"]
            rel_delta = tgt_inv_after_pass2["relationships"] - tgt_inv_after_pass1["relationships"]
            idempotency_pass = (node_delta == 0 and rel_delta == 0)
            logger.info(f"Idempotency Delta Check: Nodes Delta = {node_delta}, Rels Delta = {rel_delta} -> PASS: {idempotency_pass}")

            # 14.10 Local Source Integrity Check
            src_inv_after = self.inventory(src_driver, self.source_db, "LOCAL SOURCE AFTER MIGRATION")
            src_node_change = src_inv_after["nodes"] - src_inv_before["nodes"]
            src_rel_change = src_inv_after["relationships"] - src_inv_before["relationships"]
            source_untouched = (src_node_change == 0 and src_rel_change == 0)
            logger.info(f"Local Source Integrity Check: Node Change = {src_node_change}, Rel Change = {src_rel_change} -> UNTOUCHED: {source_untouched}")

            return {
                "source_before": src_inv_before,
                "target_before": tgt_inv_before,
                "target_after_pass1": tgt_inv_after_pass1,
                "target_after_pass2": tgt_inv_after_pass2,
                "source_after": src_inv_after,
                "idempotency_pass": idempotency_pass,
                "source_untouched": source_untouched
            }

        finally:
            src_driver.close()
            tgt_driver.close()

def main():
    src_uri = os.getenv("LOCAL_NEO4J_URI", "bolt://127.0.0.1:7687")
    src_user = os.getenv("LOCAL_NEO4J_USER", "neo4j")
    src_pass = os.getenv("LOCAL_NEO4J_PASSWORD", "Sreyash@123")
    src_db = os.getenv("LOCAL_NEO4J_DB", "neo4j")

    tgt_uri = os.getenv("NEO4J_AURA_URI", os.getenv("NEO4J_URI", "bolt://127.0.0.1:7687"))
    tgt_user = os.getenv("NEO4J_USERNAME", os.getenv("NEO4J_USER", "neo4j"))
    tgt_pass = os.getenv("NEO4J_PASSWORD", "Sreyash@123")
    tgt_db = os.getenv("NEO4J_DATABASE", "neo4j")

    migrator = Neo4jMigrationService(src_uri, src_user, src_pass, src_db, tgt_uri, tgt_user, tgt_pass, tgt_db)
    res = migrator.execute_migration()
    logger.info(f"Migration Result Summary: {res['idempotency_pass'] and res['source_untouched']}")

if __name__ == "__main__":
    main()
