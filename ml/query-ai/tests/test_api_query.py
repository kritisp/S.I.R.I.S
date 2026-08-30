"""
AIRA Local AI FastAPI Text Query Endpoint Test — Phase 7.2
Tests POST /api/query for action routing bypass and conversational reasoning.
"""

import os
import sys
import time
from starlette.testclient import TestClient

# Ensure local-ai root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app


def test_api_query():
    print("========================================")
    print("AIRA FASTAPI TEXT QUERY TEST (PHASE 7.2)")
    print("========================================")

    client = TestClient(app)

    # 1. Action query through /api/query -> Bypasses LLM
    print("----------------------------------------")
    print("TEST 1: Action Command via /api/query ('Open FIR 212')")
    print("----------------------------------------")
    t0 = time.perf_counter()
    r1 = client.post("/api/query", json={"query": "Open FIR 212"})
    lat1 = (time.perf_counter() - t0) * 1000.0
    print(f"Status: {r1.status_code} | Total HTTP: {lat1:.2f} ms")
    assert r1.status_code == 200
    data1 = r1.json()
    print(f"Response: {data1}")
    assert data1["success"] is True
    assert data1["mode"] == "ACTION"
    assert data1["intent"] == "OPEN_FIR"
    assert data1["parameters"]["fir_number"] == "212"
    assert data1["grounded"] is False
    print("-> Test 1 Passed: Action command correctly bypassed LLM.\n")

    # 2. Conversational query: "What is an FIR?"
    print("----------------------------------------")
    print("TEST 2: Conversational Question ('What is an FIR?')")
    print("----------------------------------------")
    t0 = time.perf_counter()
    r2 = client.post("/api/query", json={"query": "What is an FIR?"})
    lat2 = (time.perf_counter() - t0) * 1000.0
    print(f"Status: {r2.status_code} | Total HTTP: {lat2:.2f} ms")
    assert r2.status_code == 200
    data2 = r2.json()
    print(f"Response: \"{data2['response']}\"")
    print(f"Latencies: {data2['latency_ms']}")
    assert data2["mode"] == "LLM"
    assert data2["intent"] == "CONVERSATIONAL"
    assert len(data2["response"]) > 20
    print("-> Test 2 Passed: Conversational query answered by Local LLM.\n")

    # 3. Grounded query: "Tell me about FIR 541"
    print("----------------------------------------")
    print("TEST 3: Grounded Case Query ('Tell me about FIR 541')")
    print("----------------------------------------")
    t0 = time.perf_counter()
    r3 = client.post("/api/query", json={"query": "Tell me about FIR 541"})
    lat3 = (time.perf_counter() - t0) * 1000.0
    print(f"Status: {r3.status_code} | Total HTTP: {lat3:.2f} ms")
    assert r3.status_code == 200
    data3 = r3.json()
    print(f"Response: \"{data3['response']}\"")
    print(f"Grounded: {data3['grounded']} | Records: {data3['records_retrieved']}")
    assert data3["mode"] == "LLM"
    assert data3["grounded"] is True
    assert data3["records_retrieved"] == 6
    assert "541" in data3["response"] or "Vehicle Theft" in data3["response"] or "Rohit Sharma" in data3["response"] or "MH-04-XT-2291" in data3["response"]
    print("-> Test 3 Passed: Grounded case query answered accurately from SQLite.\n")

    print("========================================")
    print("ALL API TEXT QUERY TESTS PASSED")
    print("========================================")


if __name__ == "__main__":
    test_api_query()
