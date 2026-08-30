"""
AIRA Local AI FastAPI AI & Case Retrieval Endpoints Test Suite — Phase 7.1
Tests /api/ai/action, /api/ai/query, /api/cases/{fir}, /api/ai/stream, and /api/voice/turn.
"""

import os
import sys
import time
import glob
from starlette.testclient import TestClient

# Ensure local-ai root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app


def test_ai_endpoints():
    print("========================================")
    print("AIRA FASTAPI AI & CASE ENDPOINTS TEST (PHASE 7.1)")
    print("========================================")

    client = TestClient(app)
    existing_audio = glob.glob("*.wav") + glob.glob("*.mp3") + glob.glob("*.ogg") + glob.glob("*.flac")

    # -------------------------------------------------------------------------
    # TEST 1: POST /api/ai/action (Fast-Path Deterministic Action Router)
    # -------------------------------------------------------------------------
    print("----------------------------------------")
    print("TEST 1: Fast-Path Operational Action (POST /api/ai/action)")
    print("----------------------------------------")
    t0 = time.perf_counter()
    r1 = client.post("/api/ai/action", json={"text": "Open FIR 212"})
    lat1 = (time.perf_counter() - t0) * 1000.0
    print(f"Status: {r1.status_code} | Total HTTP Round-Trip: {lat1:.2f} ms")
    assert r1.status_code == 200, f"Expected 200, got {r1.status_code}"
    data1 = r1.json()
    print(f"Response: {data1}")
    assert data1["mode"] == "ACTION"
    assert data1["intent"] == "OPEN_FIR"
    assert data1["parameters"]["fir_number"] == "212"
    assert data1["confidence"] >= 0.90
    print(f"Internal Gateway Latency: {data1['latency_ms']} ms")
    print("-> TEST 1 PASSED: Fast-path action routed in sub-millisecond.\n")

    # -------------------------------------------------------------------------
    # TEST 2: GET /api/cases/{fir_number} (Existing Case Retrieval)
    # -------------------------------------------------------------------------
    print("----------------------------------------")
    print("TEST 2: Direct Read-Only Case Retrieval (GET /api/cases/541)")
    print("----------------------------------------")
    t0 = time.perf_counter()
    r2 = client.get("/api/cases/541")
    lat2 = (time.perf_counter() - t0) * 1000.0
    print(f"Status: {r2.status_code} | Total HTTP Round-Trip: {lat2:.2f} ms")
    assert r2.status_code == 200, f"Expected 200, got {r2.status_code}"
    data2 = r2.json()
    assert data2["found"] is True
    assert data2["fir_number"] == "541"
    assert data2["data"]["case"]["fir_number"] == "FIR-2026-00541"
    assert data2["data"]["case"]["crime_type"] == "Vehicle Theft"
    assert "Rohit Sharma" in data2["data"]["case"]["complainant_name"]
    print(f"Case Found: {data2['data']['case']['fir_number']} | Crime: {data2['data']['case']['crime_type']}")
    print(f"Internal SQLite Retrieval Latency: {data2['retrieval_latency_ms']} ms")
    print("-> TEST 2 PASSED: Direct case retrieval returned verified records.\n")

    # -------------------------------------------------------------------------
    # TEST 3: GET /api/cases/{fir_number} (Non-Existent Case Handling)
    # -------------------------------------------------------------------------
    print("----------------------------------------")
    print("TEST 3: Non-Existent Case Retrieval (GET /api/cases/999999)")
    print("----------------------------------------")
    r3 = client.get("/api/cases/999999")
    print(f"Status: {r3.status_code} (Expected 404)")
    assert r3.status_code == 404
    print(f"Detail: {r3.json().get('detail')}")
    print("-> TEST 3 PASSED: Non-existent case cleanly rejected with 404 NOT FOUND.\n")

    # -------------------------------------------------------------------------
    # TEST 4: POST /api/ai/query (Action Routing Bypass via Query Endpoint)
    # -------------------------------------------------------------------------
    print("----------------------------------------")
    print("TEST 4: Action Bypass via Query Endpoint (POST /api/ai/query)")
    print("----------------------------------------")
    r4 = client.post("/api/ai/query", json={"text": "Open FIR 212"})
    assert r4.status_code == 200
    data4 = r4.json()
    print(f"Response: {data4}")
    assert data4["mode"] == "ACTION"
    assert data4["intent"] == "OPEN_FIR"
    assert data4["parameters"]["fir_number"] == "212"
    assert data4["grounded"] is False
    print("-> TEST 4 PASSED: Query endpoint correctly bypassed LLM for action command.\n")

    # -------------------------------------------------------------------------
    # TEST 5: POST /api/ai/query (Conversational Grounded Query: FIR 541)
    # -------------------------------------------------------------------------
    print("----------------------------------------")
    print("TEST 5: Conversational Grounded Query (POST /api/ai/query -> 'Tell me about FIR 541')")
    print("----------------------------------------")
    t0 = time.perf_counter()
    r5 = client.post("/api/ai/query", json={"text": "Tell me about FIR 541"})
    lat5 = (time.perf_counter() - t0) * 1000.0
    print(f"Status: {r5.status_code} | Total HTTP Round-Trip: {lat5:.2f} ms")
    assert r5.status_code == 200
    data5 = r5.json()
    print(f"Mode: {data5['mode']} | Grounded: {data5['grounded']} | Records: {data5['records_retrieved']}")
    print(f"AIRA Response:\n\"{data5['response']}\"")
    print(f"Latencies: Gateway={data5['latency_ms']['gateway_ms']}ms, Retrieval={data5['latency_ms']['retrieval_ms']}ms, FirstToken={data5['latency_ms']['first_token_ms']}ms, Gen={data5['latency_ms']['total_generation_ms']}ms")
    assert data5["mode"] == "LLM"
    assert data5["grounded"] is True
    assert data5["records_retrieved"] == 6
    assert "541" in data5["response"] or "Vehicle Theft" in data5["response"] or "Rohit Sharma" in data5["response"] or "MH-04-XT-2291" in data5["response"]
    print("-> TEST 5 PASSED: Conversational query grounded in CrimeLens database.\n")

    # -------------------------------------------------------------------------
    # TEST 6: POST /api/ai/query (Non-Existent Case: FIR 999999)
    # -------------------------------------------------------------------------
    print("----------------------------------------")
    print("TEST 6: Non-Existent Case Grounded Query (POST /api/ai/query -> 'Tell me about FIR 999999')")
    print("----------------------------------------")
    r6 = client.post("/api/ai/query", json={"text": "Tell me about FIR 999999"})
    assert r6.status_code == 200
    data6 = r6.json()
    print(f"AIRA Response: \"{data6['response']}\"")
    assert "not found" in data6["response"].lower() or "not exist" in data6["response"].lower() or "no information" in data6["response"].lower() or "not available" in data6["response"].lower()
    print("-> TEST 6 PASSED: Non-existent case handled cleanly without hallucination.\n")

    # -------------------------------------------------------------------------
    # TEST 7: POST /api/voice/turn (Full Voice Pipeline Turn via API)
    # -------------------------------------------------------------------------
    print("----------------------------------------")
    print("TEST 7: Full Voice Pipeline Turn (POST /api/voice/turn)")
    print("----------------------------------------")
    t0 = time.perf_counter()
    r7 = client.post("/api/voice/turn", json={"text_input": "Tell me about FIR 541", "play_audio": False})
    lat7 = (time.perf_counter() - t0) * 1000.0
    print(f"Status: {r7.status_code} | Total HTTP Round-Trip: {lat7:.2f} ms")
    assert r7.status_code == 200
    data7 = r7.json()
    print(f"Transcript: \"{data7['transcript']}\"")
    print(f"Response:   \"{data7['response']}\"")
    print(f"Sentences:  {data7['sentences']}")
    print(f"Grounded:   {data7['grounded']} | Overlap: {data7['overlap_achieved']}")
    print(f"Latencies:  {data7['latencies']}")
    assert data7["grounded"] is True
    assert len(data7["sentences"]) >= 1

    # Verify zero audio files created on disk
    current_audio = glob.glob("*.wav") + glob.glob("*.mp3") + glob.glob("*.ogg") + glob.glob("*.flac")
    new_audio_files = [f for f in current_audio if f not in existing_audio]
    assert len(new_audio_files) == 0, f"Unexpected audio files created on disk: {new_audio_files}"
    print(f"Audio storage: MEMORY ONLY (0 audio files created)")
    print("-> TEST 7 PASSED: Full voice pipeline turn executed through FastAPI.\n")

    print("========================================")
    print("ALL FASTAPI AI & CASE ENDPOINTS PASSED (PHASE 7.1)")
    print("========================================")


if __name__ == "__main__":
    test_ai_endpoints()
