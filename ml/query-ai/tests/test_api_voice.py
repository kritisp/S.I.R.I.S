"""
AIRA Local AI FastAPI Voice Query Endpoint Test — Phase 7.2
Tests POST /api/voice/query with in-memory uploaded audio and verifies STT -> Gateway -> Grounded LLM.
"""

import os
import sys
import io
import wave
import time
import glob
from starlette.testclient import TestClient

# Ensure local-ai root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.api.deps import get_tts


def _create_synthetic_wav(text: str) -> bytes:
    """Generate in-memory WAV bytes from text using LocalTTS/Piper."""
    tts = get_tts()
    pcm_bytes, _ = tts.synthesize_to_memory(text)
    
    wav_buf = io.BytesIO()
    with wave.open(wav_buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(16000)
        wf.writeframes(pcm_bytes)
    return wav_buf.getvalue()


def test_api_voice():
    print("========================================")
    print("AIRA FASTAPI VOICE QUERY TEST (PHASE 7.2)")
    print("========================================")

    client = TestClient(app)
    existing_audio = glob.glob("*.wav") + glob.glob("*.mp3") + glob.glob("*.ogg") + glob.glob("*.flac")

    # 1. Synthesize in-memory test audio: "Open FIR 212"
    print("Generating in-memory audio for 'Open FIR 212'...")
    wav_action = _create_synthetic_wav("Open FIR 212")

    print("\n----------------------------------------")
    print("TEST 1: Voice Action Query (POST /api/voice/query -> 'Open FIR 212')")
    print("----------------------------------------")
    t0 = time.perf_counter()
    r1 = client.post(
        "/api/voice/query",
        files={"audio": ("action.wav", wav_action, "audio/wav")},
    )
    lat1 = (time.perf_counter() - t0) * 1000.0
    print(f"Status: {r1.status_code} | Total HTTP: {lat1:.2f} ms")
    assert r1.status_code == 200
    data1 = r1.json()
    print(f"Transcript: \"{data1['transcript']}\"")
    print(f"Mode: {data1['mode']} | Intent: {data1['intent']} | Params: {data1['parameters']}")
    print(f"Latencies: {data1['latency_ms']}")
    assert data1["success"] is True
    assert "212" in data1["transcript"] or "open" in data1["transcript"].lower()
    assert data1["mode"] == "ACTION"
    assert data1["intent"] == "OPEN_FIR"
    print("-> Test 1 Passed: In-memory uploaded audio transcribed and routed as ACTION.\n")

    # 2. Synthesize in-memory test audio: "Tell me about FIR 541"
    print("Generating in-memory audio for 'Tell me about FIR 541'...")
    wav_grounded = _create_synthetic_wav("Tell me about FIR 541")

    print("\n----------------------------------------")
    print("TEST 2: Voice Grounded Case Query (POST /api/voice/query -> 'Tell me about FIR 541')")
    print("----------------------------------------")
    t0 = time.perf_counter()
    r2 = client.post(
        "/api/voice/query",
        files={"audio": ("grounded.wav", wav_grounded, "audio/wav")},
    )
    lat2 = (time.perf_counter() - t0) * 1000.0
    print(f"Status: {r2.status_code} | Total HTTP: {lat2:.2f} ms")
    assert r2.status_code == 200
    data2 = r2.json()
    print(f"Transcript: \"{data2['transcript']}\"")
    print(f"Mode: {data2['mode']} | Grounded: {data2['grounded']}")
    print(f"AIRA Response:\n\"{data2['response']}\"")
    print(f"Latencies: {data2['latency_ms']}")
    assert data2["success"] is True
    assert data2["mode"] == "LLM"
    assert data2["grounded"] is True
    assert "541" in data2["response"] or "Vehicle Theft" in data2["response"] or "Rohit Sharma" in data2["response"] or "MH-04-XT-2291" in data2["response"]
    print("-> Test 2 Passed: In-memory uploaded audio transcribed, grounded in SQLite, and answered by LLM.\n")

    # Verify zero audio files created on disk
    current_audio = glob.glob("*.wav") + glob.glob("*.mp3") + glob.glob("*.ogg") + glob.glob("*.flac")
    new_audio = [f for f in current_audio if f not in existing_audio]
    assert len(new_audio) == 0, f"Unexpected audio files created on disk: {new_audio}"
    print(f"Audio storage: MEMORY ONLY (0 files written to disk)")

    print("========================================")
    print("ALL API VOICE QUERY TESTS PASSED")
    print("========================================")


if __name__ == "__main__":
    test_api_voice()
