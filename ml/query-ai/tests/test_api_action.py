"""
AIRA Local AI FastAPI Action Endpoint Test — Phase 7.2
Tests POST /api/action for deterministic fast-path command dispatch and sub-millisecond latency.
"""

import os
import sys
import time
from starlette.testclient import TestClient

# Ensure local-ai root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app


def test_api_action():
    print("========================================")
    print("AIRA FASTAPI ACTION ENDPOINT TEST (PHASE 7.2)")
    print("========================================")

    client = TestClient(app)

    # 1. Action: "Open FIR 212"
    t0 = time.perf_counter()
    r1 = client.post("/api/action", json={"query": "Open FIR 212"})
    lat1 = (time.perf_counter() - t0) * 1000.0
    print(f"POST /api/action ('Open FIR 212') -> Status: {r1.status_code} | Total HTTP: {lat1:.2f} ms")
    assert r1.status_code == 200
    data1 = r1.json()
    print(f"Response: {data1}")
    assert data1["success"] is True
    assert data1["mode"] == "ACTION"
    assert data1["intent"] == "OPEN_FIR"
    assert data1["parameters"]["fir_number"] == "212"
    assert data1["confidence"] >= 0.90
    print("-> Test 1 Passed: 'Open FIR 212' correctly identified as OPEN_FIR action.\n")

    # 2. Action: "Open Evidence Vault"
    t0 = time.perf_counter()
    r2 = client.post("/api/action", json={"query": "Open Evidence Vault"})
    lat2 = (time.perf_counter() - t0) * 1000.0
    print(f"POST /api/action ('Open Evidence Vault') -> Status: {r2.status_code} | Total HTTP: {lat2:.2f} ms")
    assert r2.status_code == 200
    data2 = r2.json()
    print(f"Response: {data2}")
    assert data2["mode"] == "ACTION"
    assert data2["intent"] == "OPEN_EVIDENCE_VAULT"
    print("-> Test 2 Passed: 'Open Evidence Vault' correctly identified.\n")

    # 3. Action: "Show network operations"
    r3 = client.post("/api/action", json={"text": "Show network operations"})
    assert r3.status_code == 200
    assert r3.json()["intent"] == "OPEN_NETWORK_OPS"
    print("-> Test 3 Passed: 'Show network operations' correctly identified.\n")

    print("========================================")
    print("ALL API ACTION TESTS PASSED")
    print("========================================")


if __name__ == "__main__":
    test_api_action()
