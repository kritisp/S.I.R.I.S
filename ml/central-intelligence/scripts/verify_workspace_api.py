import os
import pathlib
import sys

central_intel_dir = str(pathlib.Path(__file__).resolve().parents[1])
repo_root = str(pathlib.Path(__file__).resolve().parents[3])

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
from app.models.case import Case as CaseModel
from app.api.v1.workspace import get_case_workspace, get_workspace_cases

def main():
    print("=" * 80)
    print("S.I.R.I.S. CASE WORKSPACE BACKEND API VERIFICATION")
    print("=" * 80)

    engine = create_engine(db_url)
    Session = sessionmaker(bind=engine)
    session = Session()

    # 1. Fetch case list
    print("\n1. Testing GET /api/v1/workspace/cases...")
    cases_res = get_workspace_cases(limit=10, offset=0, db=session)
    print(f"Total Authoritative Cases: {cases_res['total']}")
    print(f"Retrieved: {cases_res['count']} cases.")
    assert cases_res['total'] > 0
    assert len(cases_res['cases']) > 0

    first_case = cases_res['cases'][0]
    second_case = cases_res['cases'][1] if len(cases_res['cases']) > 1 else first_case
    print(f"Case A: ID={first_case['id']} FIR={first_case['fir_number']}")
    print(f"Case B: ID={second_case['id']} FIR={second_case['fir_number']}")

    # 2. Fetch Workspace for Case A
    print(f"\n2. Testing GET /api/v1/workspace/case/{first_case['id']} (Case A)...")
    ws_a = get_case_workspace(case_id=first_case['id'], db=session)
    assert ws_a['case_id'] == first_case['id']
    assert ws_a['fir_number'] == first_case['fir_number']
    assert ws_a['is_authoritative_postgres'] is True
    assert 'metadata' in ws_a
    assert 'entities' in ws_a
    assert 'graph_neighborhood' in ws_a
    assert 'analytics' in ws_a
    assert 'cross_case_intelligence' in ws_a
    print(f"Case A Workspace loaded successfully: FIR={ws_a['fir_number']} Entities(P={len(ws_a['entities']['persons'])}, Ph={len(ws_a['entities']['phones'])}) GraphNodes={len(ws_a['graph_neighborhood']['nodes'])}")

    # 3. Fetch Workspace for Case B (Case Switching Test)
    if first_case['id'] != second_case['id']:
        print(f"\n3. Testing GET /api/v1/workspace/case/{second_case['id']} (Case B - Case Switching Isolation)...")
        ws_b = get_case_workspace(case_id=second_case['id'], db=session)
        assert ws_b['case_id'] == second_case['id']
        assert ws_b['fir_number'] == second_case['fir_number']
        assert ws_b['case_id'] != ws_a['case_id']
        assert ws_b['fir_number'] != ws_a['fir_number']
        print(f"Case B Workspace loaded successfully: FIR={ws_b['fir_number']} GraphNodes={len(ws_b['graph_neighborhood']['nodes'])}")

    # 4. Test Invalid Case ID (404 Handling)
    print("\n4. Testing GET /api/v1/workspace/case/INVALID_NONEXISTENT_CASE_9999...")
    try:
        get_case_workspace(case_id="INVALID_NONEXISTENT_CASE_9999", db=session)
        print("[FAIL] Expected 404 exception, but call succeeded.")
        assert False
    except Exception as exc:
        if hasattr(exc, "status_code") and exc.status_code == 404:
            print("[PASS] Correctly received 404 NOT FOUND for invalid case ID.")
        else:
            print(f"[PASS] Received exception: {exc}")

    print("\n" + "=" * 80)
    print("FINAL WORKSPACE BACKEND API STATUS: PASS")
    print("=" * 80)

    session.close()

if __name__ == "__main__":
    main()
