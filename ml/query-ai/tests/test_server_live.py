"""
AIRA Local AI FastAPI Live Server Test — Phase 7.2
Spawns Uvicorn on 127.0.0.1:8000 in a background process, queries live HTTP endpoints via httpx, and shuts down cleanly.
"""

import os
import sys
import io
import wave
import time
import subprocess
import httpx

# Ensure local-ai root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

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


def test_live_server():
    print("========================================")
    print("AIRA FASTAPI LIVE SERVER TEST (PHASE 7.2)")
    print("========================================")

    py_exe = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "venv", "Scripts", "python.exe"))
    if not os.path.exists(py_exe):
        py_exe = sys.executable

    cmd = [
        py_exe,
        "-m",
        "uvicorn",
        "app.main:app",
        "--host",
        "127.0.0.1",
        "--port",
        "8000",
    ]

    print(f"Starting server command: {' '.join(cmd)}")
    proc = subprocess.Popen(
        cmd,
        cwd=os.path.abspath(os.path.join(os.path.dirname(__file__), "..")),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )

    try:
        # Wait up to 5 seconds for server to be ready
        base_url = "http://127.0.0.1:8000"
        ready = False
        client = httpx.Client(base_url=base_url, timeout=30.0)

        for _ in range(25):
            time.sleep(0.2)
            try:
                r = client.get("/api/health")
                if r.status_code == 200:
                    ready = True
                    break
            except Exception:
                pass

        assert ready, "FastAPI server failed to start on 127.0.0.1:8000"
        print("Server is UP and answering HTTP requests on http://127.0.0.1:8000\n")

        # 1. GET /
        r1 = client.get("/")
        print(f"1. GET / -> {r1.status_code}: {r1.json()}")
        assert r1.status_code == 200

        # 2. GET /api/health
        r2 = client.get("/api/health")
        print(f"2. GET /api/health -> {r2.status_code}: {r2.json()}")
        assert r2.status_code == 200

        # 3. GET /api/status
        r3 = client.get("/api/status")
        print(f"3. GET /api/status -> {r3.status_code}: status='{r3.json()['status']}', gpu='{r3.json()['environment']['gpu_name']}'")
        assert r3.status_code == 200

        # 4. POST /api/action (Fast-path command routing)
        r4 = client.post("/api/action", json={"query": "Open FIR 212"})
        print(f"4. POST /api/action -> {r4.status_code}: mode={r4.json()['mode']}, intent={r4.json()['intent']}, params={r4.json()['parameters']}")
        assert r4.status_code == 200
        assert r4.json()["intent"] == "OPEN_FIR"

        # 5. POST /api/query (Conversational question)
        r5 = client.post("/api/query", json={"query": "What is an FIR?"})
        print(f"5. POST /api/query -> {r5.status_code}: mode={r5.json()['mode']}, intent={r5.json()['intent']}")
        assert r5.status_code == 200
        assert r5.json()["mode"] == "LLM"

        # 6. POST /api/query/case (Grounded FIR 541 query)
        r6 = client.post("/api/query/case", json={"query": "Tell me about FIR 541"})
        print(f"6. POST /api/query/case (541) -> {r6.status_code}: found={r6.json()['found']}, grounded={r6.json()['grounded']}")
        print(f"   Response: \"{r6.json()['response']}\"")
        assert r6.status_code == 200
        assert r6.json()["found"] is True

        # 7. POST /api/query/case (Non-existent FIR 999999)
        r7 = client.post("/api/query/case", json={"query": "Tell me about FIR 999999"})
        print(f"7. POST /api/query/case (999999) -> {r7.status_code}: found={r7.json()['found']}")
        assert r7.status_code == 200
        assert r7.json()["found"] is False

        # 8. POST /api/tts (In-memory WAV synthesis)
        r8 = client.post("/api/tts", json={"text": "Hello officer, this is AIRA."})
        print(f"8. POST /api/tts -> {r8.status_code}: content-type='{r8.headers['content-type']}', bytes={len(r8.content)}")
        assert r8.status_code == 200
        assert r8.headers["content-type"] == "audio/wav"

        # 9. POST /api/voice/query (Uploaded audio voice query)
        wav_data = _create_synthetic_wav("Tell me about FIR 541")
        r9 = client.post(
            "/api/voice/query",
            files={"audio": ("voice_input.wav", wav_data, "audio/wav")},
        )
        print(f"9. POST /api/voice/query -> {r9.status_code}: transcript='{r9.json()['transcript']}', mode={r9.json()['mode']}")
        assert r9.status_code == 200
        assert r9.json()["grounded"] is True

        # 10. GET /docs & /openapi.json
        r_docs = client.get("/docs")
        assert r_docs.status_code == 200
        r_openapi = client.get("/openapi.json")
        assert r_openapi.status_code == 200
        print(f"10. OpenAPI & Docs -> Verified (200 OK)")

        print("\n========================================")
        print("ALL LIVE SERVER HTTP ENDPOINTS VERIFIED")
        print("========================================")

    finally:
        print("\nStopping live server process...")
        proc.terminate()
        try:
            proc.wait(timeout=3.0)
        except Exception:
            proc.kill()
        print("Server process stopped cleanly.")


if __name__ == "__main__":
    test_live_server()
