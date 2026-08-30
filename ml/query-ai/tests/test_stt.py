"""
AIRA Local STT Test Script — Phase 1
Tests LocalSTT with in-memory microphone capture, GPU inference on RTX 3050, and latency measurement.
"""

import os
import sys
import argparse

# Ensure local-ai root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.stt import LocalSTT


def run_stt_test(seconds: float = 5.0, model_size: str = "small"):
    print("========================================")
    print("AIRA LOCAL STT TEST (PHASE 1)")
    print("========================================")

    # 1. Initialize LocalSTT once
    print("Loading Whisper...")
    try:
        stt = LocalSTT(model_size=model_size, device="cuda", compute_type="float16")
    except Exception as e:
        print(f"CUDA initialization failed or unavailable: {e}")
        print("Retrying with CPU fallback for diagnostic comparison...")
        stt = LocalSTT(model_size=model_size, device="cpu", compute_type="int8")

    info = stt.get_device_info()
    print("Whisper loaded.\n")

    # 2. Record audio from microphone into memory (No WAV files on disk)
    print(f"Speak for {seconds:.1f} seconds...")
    try:
        audio = stt.record(seconds=seconds)
        print("Recording complete.\n")
    except Exception as e:
        print(f"ERROR: Microphone recording failed: {e}")
        return

    # 3. Transcribe in-memory audio
    print("Transcribing...")
    try:
        result = stt.transcribe(audio)
    except Exception as e:
        print(f"ERROR: Transcription failed: {e}")
        return

    # 4. Print results & latency summary
    total_ms = (seconds * 1000.0) + result.transcription_time_ms

    print("\n========================================")
    print("TEST RESULTS")
    print("========================================")
    print(f"GPU: {info['gpu_name']}")
    print(f"Whisper device: {info['device'].upper()} ({info['compute_type']})")
    print(f"CUDA status: {'ACTIVE' if info['cuda_available'] and info['device'] == 'cuda' else 'INACTIVE'}")
    print(f"Model: faster-whisper ({info['model_size']})")
    print(f"Model load time: {info['model_load_time_ms']:.1f} ms")
    print("----------------------------------------")
    print(f"Recording: {int(seconds * 1000)} ms")
    print(f"Transcription: {result.transcription_time_ms:.1f} ms")
    print(f"Total: {total_ms:.1f} ms")
    print("----------------------------------------")
    print("Transcript:")
    print(f'"{result.text}"')
    if result.segments:
        print("\nSegments breakdown:")
        for seg in result.segments:
            print(f"  [{seg.start:.2f}s -> {seg.end:.2f}s] {seg.text}")
    print("========================================\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AIRA Local STT Test")
    parser.add_argument("--seconds", type=float, default=5.0, help="Duration to record in seconds (default: 5.0)")
    parser.add_argument("--model", type=str, default="small", help="Whisper model size (default: small)")
    args = parser.parse_args()

    run_stt_test(seconds=args.seconds, model_size=args.model)
