import os
import pathlib
import sys
import time

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

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.models.case import Case as CaseModel
from app.api.v1.workspace import get_case_workspace

def main():
    print("=" * 80)
    print("S.I.R.I.S. ALL-CASE WORKSPACE RECONCILIATION & VERIFICATION PIPELINE")
    print("=" * 80)

    if not db_url:
        print("[ERROR] DATABASE_URL not set or found.")
        sys.exit(1)

    engine = create_engine(db_url)
    Session = sessionmaker(bind=engine)
    session = Session()

    # 1. Fetch ALL Authoritative Cases from PostgreSQL
    print("[1/3] Querying all authoritative cases from PostgreSQL database...")
    c_items = session.execute(text("SELECT id::text, fir_number FROM cases ORDER BY registration_date DESC")).fetchall()
    total_authoritative_count = len(c_items)
    print(f"[+] Found {total_authoritative_count} Authoritative Cases in PostgreSQL cases table.")

    if total_authoritative_count == 0:
        print("[ERROR] No authoritative cases found in PostgreSQL database!")
        sys.exit(1)

    # 2. Iterate through case IDs and verify workspace resolution
    sample_limit = int(os.environ.get("VERIFY_LIMIT", "25"))
    test_cases = c_items[:sample_limit]
    print(f"\n[2/3] Executing Workspace Aggregation across {len(test_cases)} sample cases (Total registered: {total_authoritative_count})...")
    start_time = time.time()

    workspaces_resolved = 0
    workspaces_failed = 0
    case_id_mismatches = 0
    non_authoritative_cases_returned = 0
    cross_case_contamination = 0
    failed_details = []

    for idx, (c_id, fir_num) in enumerate(test_cases, 1):
        try:
            ws = get_case_workspace(case_id=c_id, db=session)
            
            # Validation Check A: Correct case ID returned
            returned_id = ws.get("case_id")
            returned_fir = ws.get("fir_number")
            if returned_id != c_id and returned_fir != fir_num:
                case_id_mismatches += 1
                failed_details.append(f"Case #{idx} ({c_id}): ID Mismatch - Expected {c_id}, Got {returned_id}")

            # Validation Check B: Marked as Authoritative PostgreSQL Case
            is_auth = ws.get("is_authoritative_postgres")
            if not is_auth:
                non_authoritative_cases_returned += 1
                failed_details.append(f"Case #{idx} ({c_id}): Returned non-authoritative flag.")

            # Validation Check C: Metadata belongs to requested case (No cross-case contamination)
            meta_fir = ws.get("metadata", {}).get("fir_number")
            if meta_fir != fir_num:
                cross_case_contamination += 1
                failed_details.append(f"Case #{idx} ({c_id}): Cross-Case Contamination - FIR Expected {fir_num}, Got {meta_fir}")

            # Validation Check D: Schema structure integrity
            has_valid_schema = (
                "metadata" in ws and
                "entities" in ws and
                "graph_neighborhood" in ws and
                "analytics" in ws and
                "cross_case_intelligence" in ws
            )
            if not has_valid_schema:
                workspaces_failed += 1
                failed_details.append(f"Case #{idx} ({c_id}): Missing required workspace schema keys.")
            else:
                workspaces_resolved += 1

        except Exception as exc:
            workspaces_failed += 1
            session.rollback()
            failed_details.append(f"Case #{idx} ({c_id} / {fir_num}): Exception - {exc}")

        # Progress telemetry
        if idx % 10 == 0 or idx == len(test_cases):
            elapsed = time.time() - start_time
            print(f"  -> Progress: {idx}/{len(test_cases)} cases processed ({elapsed:.1f}s) | Resolved: {workspaces_resolved} | Failed: {workspaces_failed}")

    # 3. Print Final Reconciliation Report
    elapsed_total = time.time() - start_time
    print("\n" + "=" * 80)
    print("S.I.R.I.S. ALL-CASE WORKSPACE VERIFICATION & RECONCILIATION SUMMARY")
    print("=" * 80)
    print(f"Total Time Taken                  : {elapsed_total:.2f} seconds")
    print(f"SAMPLE CASES EVALUATED            : {len(test_cases)}")
    print(f"TOTAL REGISTERED CASES            : {total_authoritative_count}")
    print(f"WORKSPACES RESOLVED               : {workspaces_resolved}")
    print(f"WORKSPACES FAILED                 : {workspaces_failed}")
    print(f"CASE ID MISMATCHES                : {case_id_mismatches}")
    print(f"NON-AUTHORITATIVE CASES RETURNED  : {non_authoritative_cases_returned}")
    print(f"CROSS-CASE CONTAMINATION          : {cross_case_contamination}")
    print("-" * 80)

    if failed_details:
        print("\nFAILURE DETAILS:")
        for fd in failed_details[:10]:
            print(f" - {fd}")
        if len(failed_details) > 10:
            print(f" - ... and {len(failed_details) - 10} more failures.")

    print("\nFINAL STATUS:")
    if workspaces_resolved == len(test_cases) and workspaces_failed == 0 and case_id_mismatches == 0 and cross_case_contamination == 0:
        print(f"SUCCESS: {workspaces_resolved}/{len(test_cases)} CASE WORKSPACES VERIFIED")
    else:
        print(f"VERIFICATION INCOMPLETE: {workspaces_resolved}/{len(test_cases)} RESOLVED ({workspaces_failed} FAILED)")

    print("=" * 80)
    session.close()

    if workspaces_failed > 0 or case_id_mismatches > 0 or cross_case_contamination > 0:
        sys.exit(1)

if __name__ == "__main__":
    main()
