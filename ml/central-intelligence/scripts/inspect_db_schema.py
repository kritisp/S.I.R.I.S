import os
import pathlib
import sys
from sqlalchemy import create_engine, text

repo_root = str(pathlib.Path(__file__).resolve().parents[2])
central_intel_dir = str(pathlib.Path(__file__).resolve().parents[1])
sys.path.insert(0, central_intel_dir)

env_path = pathlib.Path(central_intel_dir) / ".env"
db_url = os.environ.get("DATABASE_URL", "")
if not db_url and env_path.exists():
    for line in env_path.read_text().splitlines():
        if line.startswith("DATABASE_URL="):
            db_url = line.split("=", 1)[1].strip().strip('"').strip("'")
            break

if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

engine = create_engine(db_url)
with engine.connect() as conn:
    tables = ["cases", "persons", "phones", "vehicles", "locations", "case_persons", "case_phones", "case_vehicles"]
    for t in tables:
        cols = conn.execute(text(f"SELECT column_name FROM information_schema.columns WHERE table_name='{t}'")).fetchall()
        print(f"Table '{t}': {[c[0] for c in cols]}")
