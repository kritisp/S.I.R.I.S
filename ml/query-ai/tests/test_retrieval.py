"""
AIRA CrimeLens Local Data Retrieval Unit Test — Phase 6 & Phase 6.1
Tests relocated database integrity, read-only SQLite retrieval, case extraction, entity linkages, legal provisions, non-existent entity handling, and read-only enforcement.
"""

import os
import sys
import sqlite3
import time

# Ensure local-ai root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.retriever import CrimeLensRetriever, RetrievalRequest, RetrievalResult


def test_retrieval_layer():
    print("========================================")
    print("CRIMELENS DATA RETRIEVAL TEST (PHASE 6 & 6.1)")
    print("========================================")

    retriever = CrimeLensRetriever()
    print(f"Active SQLite Database Path: {retriever.db_path}\n")

    # -------------------------------------------------------------------------
    # TEST 0: Verify Single Authoritative Relocated Database Location
    # -------------------------------------------------------------------------
    print("----------------------------------------")
    print("TEST 0: Verify Database Location & Single Active Instance")
    print("----------------------------------------")
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    expected_relocated_db = os.path.join(project_root, "database", "crimelens.db")
    old_db_path = os.path.join(project_root, "local-ai", "crimelens.db")

    assert os.path.exists(expected_relocated_db), f"Relocated database not found at {expected_relocated_db}"
    assert not os.path.exists(old_db_path), f"Old database duplicate still exists at {old_db_path}"
    assert os.path.normpath(retriever.db_path) == os.path.normpath(expected_relocated_db), "Retriever is not using the relocated database."

    print(f"Relocated Database: {expected_relocated_db} [EXISTS]")
    print(f"Old Database Path:  {old_db_path} [REMOVED/INACTIVE]")
    print("-> TEST 0 PASSED: Verified exactly ONE authoritative database in project database/ directory.\n")

    # -------------------------------------------------------------------------
    # TEST 1: Retrieve Existing FIR (FIR-2026-00541 / "541")
    # -------------------------------------------------------------------------
    print("----------------------------------------")
    print("TEST 1: Retrieve Existing FIR Case (541)")
    print("----------------------------------------")
    res1 = retriever.retrieve(RetrievalRequest(resource="case", operation="get_case", identifier="541"))
    print(f"Success: {res1.success} | Records: {res1.raw_records_count} | Latency: {res1.retrieval_latency_ms:.3f} ms")
    assert res1.success, "Failed to retrieve existing FIR-2026-00541."
    assert res1.data["case"]["fir_number"] == "FIR-2026-00541", "FIR number mismatch."
    assert res1.data["case"]["crime_type"] == "Vehicle Theft", "Crime type mismatch."
    assert "Rohit Sharma" in res1.data["case"]["complainant_name"], "Complainant mismatch."
    print(f"Case Number:   {res1.data['case']['fir_number']}")
    print(f"Crime Type:    {res1.data['case']['crime_type']}")
    print(f"Complainant:   {res1.data['case']['complainant_name']}")
    print(f"Sections:      {res1.data['case']['sections_applied']}")
    print("-> TEST 1 PASSED: Successfully retrieved existing FIR proforma record.\n")

    # -------------------------------------------------------------------------
    # TEST 2: Retrieve Non-Existent FIR (FIR-212 / "212")
    # -------------------------------------------------------------------------
    print("----------------------------------------")
    print("TEST 2: Retrieve Non-Existent FIR Case (212)")
    print("----------------------------------------")
    res2 = retriever.retrieve(RetrievalRequest(resource="case", operation="get_case", identifier="212"))
    print(f"Success: {res2.success} | Records: {res2.raw_records_count} | Latency: {res2.retrieval_latency_ms:.3f} ms")
    assert not res2.success, "Non-existent FIR 212 should report success=False."
    assert "NOT FOUND" in res2.formatted_context, "Context should explicitly state NOT FOUND."
    print(f"Clean Error:   {res2.error}")
    print("-> TEST 2 PASSED: Non-existent case correctly flagged without fabricating facts.\n")

    # -------------------------------------------------------------------------
    # TEST 3: Retrieve Evidence for FIR-2026-00542
    # -------------------------------------------------------------------------
    print("----------------------------------------")
    print("TEST 3: Retrieve Evidence Items for FIR-2026-00542")
    print("----------------------------------------")
    evidence = retriever.get_case_evidence("FIR-2026-00542")
    print(f"Evidence items found: {len(evidence)}")
    assert len(evidence) >= 2, "Expected at least 2 evidence items for FIR-542."
    for ev in evidence:
        print(f"  - [{ev['evidence_id']}] Type: {ev['evidence_type']} | Desc: {ev['description']}")
    print("-> TEST 3 PASSED: Linked CCTV and physical evidence items retrieved.\n")

    # -------------------------------------------------------------------------
    # TEST 4: Cross-Case Entity & Graph Linkages (Vehicle MH-04-XT-2291)
    # -------------------------------------------------------------------------
    print("----------------------------------------")
    print("TEST 4: Discover Cross-Case Linkages for Vehicle 'MH-04-XT-2291'")
    print("----------------------------------------")
    links = retriever.get_entity_connections("MH-04-XT-2291")
    print(f"Entity: {links['entity_value']} | Linked Cases: {links['total_links']}")
    assert links["total_links"] == 3, f"Expected 3 linked cases for vehicle, got {links['total_links']}."
    linked_firs = [c["fir_number"] for c in links["linked_cases"]]
    print(f"Linked FIRs: {linked_firs}")
    assert "FIR-2026-00541" in linked_firs and "FIR-2026-00542" in linked_firs and "FIR-2026-00301" in linked_firs
    print("-> TEST 4 PASSED: Cross-case graph connections discovered across 3 FIRs.\n")

    # -------------------------------------------------------------------------
    # TEST 5: Legal Intelligence (BNS Sections)
    # -------------------------------------------------------------------------
    print("----------------------------------------")
    print("TEST 5: Retrieve BNS Legal Sections for FIR-2026-00541")
    print("----------------------------------------")
    legal = retriever.get_case_legal_info("FIR-2026-00541")
    print(f"BNS sections matched: {len(legal)}")
    assert len(legal) > 0, "Expected BNS section match for BNS-303(2)."
    print(f"Section: {legal[0]['section_number']} - {legal[0]['title']} (Old IPC: {legal[0]['old_ipc_equivalent']})")
    print("-> TEST 5 PASSED: BNS legal provisions and IPC equivalents resolved.\n")

    # -------------------------------------------------------------------------
    # TEST 6: Read-Only Enforcement
    # -------------------------------------------------------------------------
    print("----------------------------------------")
    print("TEST 6: Verify Read-Only Connection Enforcement")
    print("----------------------------------------")
    conn = retriever._get_connection()
    read_only_blocked = False
    try:
        cur = conn.cursor()
        cur.execute("INSERT INTO case_notes (fir_number, note) VALUES ('TEST', 'ILLEGAL WRITE')")
    except sqlite3.OperationalError as e:
        read_only_blocked = True
        print(f"Attempted write blocked with SQLite exception: {e}")
    finally:
        conn.close()

    assert read_only_blocked, "Database connection must reject write operations."
    print("-> TEST 6 PASSED: Read-only enforcement verified (PRAGMA query_only = ON).\n")

    print("========================================")
    print("ALL RETRIEVAL & RELOCATION TESTS PASSED")
    print("========================================")


if __name__ == "__main__":
    test_retrieval_layer()
