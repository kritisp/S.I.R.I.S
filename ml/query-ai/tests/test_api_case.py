"""
AIRA Local AI FastAPI Grounded Case Query Test — Phase 7.2
Tests POST /api/query/case for deterministic SQLite grounding and non-existent case handling.
"""

import os
import sys
import time
from starlette.testclient import TestClient

# Ensure local-ai root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app


def test_api_case():
    print("========================================")
    print("AIRA FASTAPI CASE QUERY TEST (PHASE 7.2)")
    print("========================================")

    client = TestClient(app)

    # 1. Existing case query: "Tell me about FIR 541"
    print("----------------------------------------")
    print("TEST 1: Grounded Existing Case ('Tell me about FIR 541')")
    print("----------------------------------------")
    t0 = time.perf_counter()
    r1 = client.post("/api/query/case", json={"query": "Tell me about FIR 541"})
    lat1 = (time.perf_counter() - t0) * 1000.0
    print(f"Status: {r1.status_code} | Total HTTP: {lat1:.2f} ms")
    assert r1.status_code == 200
    data1 = r1.json()
    print(f"Response: \"{data1['response']}\"")
    print(f"Case ID: {data1['case_id']} | Found: {data1['found']} | Grounded: {data1['grounded']}")
    print(f"Retrieval Latency: {data1['retrieval_latency_ms']} ms | LLM Token Latency: {data1['llm_first_token_ms']} ms")
    assert data1["success"] is True
    assert data1["found"] is True
    assert data1["grounded"] is True
    assert data1["case_id"] == "541"
    assert data1["data"] is not None
    print("-> Test 1 Passed: Grounded case retrieved accurately.\n")

    # 2. Non-existent case query: "Tell me about FIR 999999"
    print("----------------------------------------")
    print("TEST 2: Non-Existent Case ('Tell me about FIR 999999')")
    print("----------------------------------------")
    t0 = time.perf_counter()
    r2 = client.post("/api/query/case", json={"query": "Tell me about FIR 999999"})
    lat2 = (time.perf_counter() - t0) * 1000.0
    print(f"Status: {r2.status_code} | Total HTTP: {lat2:.2f} ms")
    assert r2.status_code == 200
    data2 = r2.json()
    print(f"Response: \"{data2['response']}\"")
    print(f"Case ID: {data2['case_id']} | Found: {data2['found']} | Grounded: {data2['grounded']}")
    assert data2["success"] is True
    assert data2["found"] is False
    assert data2["grounded"] is False
    assert data2["case_id"] == "999999"
    assert "not found" in data2["response"].lower() or "not exist" in data2["response"].lower() or "no information" in data2["response"].lower()
    print("-> Test 2 Passed: Non-existent case cleanly rejected without hallucination.\n")

    print("========================================")
    print("ALL API CASE QUERY TESTS PASSED")
    print("========================================")


if __name__ == "__main__":
    test_api_case()
