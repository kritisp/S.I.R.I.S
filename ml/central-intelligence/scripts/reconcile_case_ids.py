import os
import pathlib
import sys

central_intel_dir = str(pathlib.Path(__file__).resolve().parents[1])
repo_root = str(pathlib.Path(__file__).resolve().parents[2])

if central_intel_dir not in sys.path:
    sys.path.insert(0, central_intel_dir)
if repo_root not in sys.path:
    sys.path.insert(0, repo_root)

env_path = pathlib.Path(central_intel_dir) / ".env"
db_url = os.environ.get("DATABASE_URL", "")
if not db_url and env_path.exists():
    for line in env_path.read_text().splitlines():
        if line.startswith("DATABASE_URL="):
            db_url = line.split("=", 1)[1].strip().strip('"').strip("'")
            break

if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

from sqlalchemy import create_engine, text
from app.services.graph.connection import neo4j_connection_service

def main():
    engine = create_engine(db_url)
    with engine.connect() as conn:
        pg_uuids = set(str(row[0]) for row in conn.execute(text("SELECT id FROM cases")).fetchall())
        pg_firs = set(str(row[0]) for row in conn.execute(text("SELECT fir_number FROM cases")).fetchall())

    driver = neo4j_connection_service.get_driver()
    with driver.session(database=neo4j_connection_service.database) as n4j:
        n4j_nodes = n4j.run("MATCH (c:Case) RETURN c.node_id AS id, c.fir_number AS fir").data()

    n4j_ids = set(r["id"] for r in n4j_nodes if r.get("id"))
    n4j_firs = set(r["fir"] for r in n4j_nodes if r.get("fir"))

    in_both_uuids = pg_uuids.intersection(n4j_ids)
    in_both_firs = pg_firs.intersection(n4j_firs)

    print(f"PostgreSQL total cases count : {len(pg_uuids)}")
    print(f"Neo4j total Case nodes count : {len(n4j_nodes)}")
    print(f"PostgreSQL UUIDs in Neo4j   : {len(in_both_uuids)}")
    print(f"PostgreSQL FIRs in Neo4j    : {len(in_both_firs)}")
    print(f"Graph-only Case nodes in N4J: {len(n4j_nodes) - len(in_both_uuids)}")

if __name__ == "__main__":
    main()
