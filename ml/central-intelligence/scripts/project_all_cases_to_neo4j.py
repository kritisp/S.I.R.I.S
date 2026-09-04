import os
import pathlib
import sys
import time

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

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.case import Case
from app.services.graph.projection import neo4j_graph_projection_service

def main():
    engine = create_engine(db_url, echo=False)
    Session = sessionmaker(bind=engine)
    session = Session()

    cases = session.query(Case).all()
    print(f"Projecting {len(cases)} PostgreSQL cases into Neo4j Aura...")
    success = 0
    failed = 0
    
    for idx, c in enumerate(cases, 1):
        projected = False
        for attempt in range(3):
            try:
                neo4j_graph_projection_service.project_case_graph(c)
                projected = True
                success += 1
                break
            except Exception as e:
                time.sleep(0.5)
        
        if not projected:
            failed += 1
            print(f"Failed projecting case {c.fir_number}")

        if idx % 50 == 0:
            print(f"Projected {idx}/{len(cases)} cases (Success: {success}, Failed: {failed})...")

    print(f"Projection Complete: {success} succeeded, {failed} failed.")
    try:
        session.close()
    except Exception:
        pass

if __name__ == "__main__":
    main()
