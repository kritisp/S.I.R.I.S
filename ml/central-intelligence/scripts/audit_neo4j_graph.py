"""
Comprehensive Cypher / Neo4j Graph Audit Script
=================================================
Connects to the live S.I.R.I.S. Neo4j Aura Cloud instance and runs safe,
read-only Cypher queries to produce full audit statistics.
"""

import sys
import pathlib

repo_root = str(pathlib.Path(__file__).resolve().parents[2])
if repo_root not in sys.path:
    sys.path.insert(0, repo_root)

from neo4j import GraphDatabase
from app.config import settings


def main():
    print("=" * 70)
    print("S.I.R.I.S. NEO4J AURA CLOUD GRAPH AUDIT REPORT")
    print("=" * 70)
    print(f"URI: {settings.NEO4J_URI}")
    print(f"User: {settings.NEO4J_USER}")

    driver = GraphDatabase.driver(
        settings.NEO4J_URI,
        auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD)
    )

    with driver.session() as session:
        # Total nodes
        r = session.run("MATCH (n) RETURN count(n) AS total_nodes")
        total_nodes = r.single()["total_nodes"]

        # Total relationships
        r = session.run("MATCH ()-[r]->() RETURN count(r) AS total_rels")
        total_rels = r.single()["total_rels"]

        # Node labels (entity types)
        r = session.run("""
            MATCH (n)
            UNWIND labels(n) AS label
            RETURN label, count(*) AS count
            ORDER BY count DESC
        """)
        labels_count = {rec["label"]: rec["count"] for rec in r}

        # Relationship types
        r = session.run("""
            MATCH ()-[r]->()
            RETURN type(r) AS rel_type, count(*) AS count
            ORDER BY count DESC
        """)
        rels_count = {rec["rel_type"]: rec["count"] for rec in r}

        # Orphan nodes
        r = session.run("MATCH (n) WHERE NOT (n)-[]-() RETURN count(n) AS orphans")
        orphans = r.single()["orphans"]

        # Sample nodes
        r = session.run("""
            MATCH (n)
            RETURN labels(n)[0] AS type, coalesce(n.name, n.id, n.fir_number, n.normalized_number, 'Unknown') AS identifier
            LIMIT 10
        """)
        sample_nodes = [f"[{rec['type']}] {rec['identifier']}" for rec in r]

    driver.close()

    print(f"\n[OK] TOTAL NODES         : {total_nodes}")
    print(f"[OK] TOTAL RELATIONSHIPS : {total_rels}")
    print(f"[OK] ORPHAN NODES        : {orphans}")

    print("\n[OK] ENTITY TYPES BREAKDOWN:")
    for lbl, cnt in labels_count.items():
        print(f"    - {lbl:<20}: {cnt}")

    print("\n[OK] RELATIONSHIP TYPES BREAKDOWN:")
    for rt, cnt in rels_count.items():
        print(f"    - {rt:<20}: {cnt}")

    print("\n[OK] SAMPLE ENTITY IDENTIFIERS:")
    for sn in sample_nodes:
        print(f"    - {sn}")

    print("\n" + "=" * 70)
    print("NEO4J AUDIT COMPLETE — CONNECTION VERIFIED")
    print("=" * 70)


if __name__ == "__main__":
    main()
