"""
AIRA Local AI FastAPI TTS Endpoint Test — Phase 7.2
Tests POST /api/tts for in-memory WAV generation and zero audio file persistence.
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


def test_api_tts():
    print("========================================")
    print("AIRA FASTAPI TTS ENDPOINT TEST (PHASE 7.2)")
    print("========================================")

    client = TestClient(app)
    existing_audio = glob.glob("*.wav") + glob.glob("*.mp3") + glob.glob("*.ogg") + glob.glob("*.flac")

    t0 = time.perf_counter()
    r = client.post("/api/tts", json={"text": "Hello officer, this is AIRA."})
    lat = (time.perf_counter() - t0) * 1000.0

    print(f"Status: {r.status_code} | Total HTTP: {lat:.2f} ms")
    assert r.status_code == 200
    assert r.headers["content-type"] == "audio/wav"
    assert len(r.content) > 10000, f"WAV content too small: {len(r.content)} bytes"

    # Verify WAV header structure
    wav_io = io.BytesIO(r.content)
    with wave.open(wav_io, "rb") as wf:
        n_channels = wf.getnchannels()
        sampwidth = wf.getsampwidth()
        framerate = wf.getframerate()
        n_frames = wf.getnframes()
        duration_s = n_frames / float(framerate)

    print(f"WAV Audio Info:")
    print(f"  Channels:    {n_channels} ({'Mono' if n_channels == 1 else 'Stereo'})")
    print(f"  Bit Depth:   {sampwidth * 8}-bit")
    print(f"  Sample Rate: {framerate} Hz")
    print(f"  Duration:    {duration_s:.2f} s")
    print(f"  PCM Size:    {len(r.content)} bytes")

    assert n_channels == 1, "Expected mono audio"
    assert framerate == 16000, "Expected 16kHz sample rate"
    assert sampwidth == 2, "Expected 16-bit samples"
    assert duration_s > 1.0, "Expected at least 1.0s of synthesized speech"

    # Verify zero audio files created on disk
    current_audio = glob.glob("*.wav") + glob.glob("*.mp3") + glob.glob("*.ogg") + glob.glob("*.flac")
    new_audio = [f for f in current_audio if f not in existing_audio]
    assert len(new_audio) == 0, f"Unexpected audio files created on disk: {new_audio}"
    print(f"Audio storage: MEMORY ONLY (0 files written to disk)")

    print("========================================")
    print("ALL API TTS TESTS PASSED")
    print("========================================")


if __name__ == "__main__":
    test_api_tts()
