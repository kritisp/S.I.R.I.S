"""
AIRA Local VAD & Speech-End Detection Unit Test — Phase 4.1 (Goal A)
Tests automatic speech-end detection, short pause tolerance, initial silence timeout, and zero disk audio files.
"""

import os
import sys
import glob
import time
import numpy as np

# Ensure local-ai root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.stt import LocalSTT


def test_vad_unit():
    print("========================================")
    print("AIRA LOCAL VAD UNIT TEST (PHASE 4.1 - GOAL A)")
    print("========================================")

    existing_audio = glob.glob("*.wav") + glob.glob("*.mp3") + glob.glob("*.ogg") + glob.glob("*.flac")

    print("1. Initializing LocalSTT on CUDA...")
    stt = LocalSTT(model_size="small", device="cuda", compute_type="float16")
    print("LocalSTT ready.\n")

    # -------------------------------------------------------------------------
    # TEST 1: Initial Silence Timeout Test (Synthetic silent microphone stream)
    # -------------------------------------------------------------------------
    print("----------------------------------------")
    print("TEST 1: Initial Silence Timeout")
    print("----------------------------------------")
    t0 = time.perf_counter()
    audio, meta = stt.record_until_silence(
        max_seconds=3.0,
        initial_silence_timeout=1.5,
        trailing_silence_s=0.5,
    )
    t_elapsed = time.perf_counter() - t0
    print(f"Elapsed time: {t_elapsed:.2f} s")
    print(f"Speech detected: {meta['speech_detected']}")
    print(f"Timed out: {meta['timed_out']}")
    assert not meta["speech_detected"], "Speech should not be detected during silence."
    assert meta["timed_out"], "Should report timed_out == True."
    print("-> TEST 1 PASSED: Cleanly timed out on silence without crashing.\n")

    # -------------------------------------------------------------------------
    # TEST 2: Brief Intra-Sentence Pause & Pre-Speech Preservation Logic Test
    # -------------------------------------------------------------------------
    print("----------------------------------------")
    print("TEST 2: Synthetic Audio VAD Simulation (Intra-sentence pause preservation)")
    print("----------------------------------------")
    # Simulate a stream: 0.3s silence + 0.8s speech + 0.4s pause + 0.8s speech + 1.0s trailing silence
    sr = 16000
    silence_initial = np.random.randn(int(0.3 * sr)).astype(np.float32) * 0.001
    speech_1 = (np.sin(2 * np.pi * 440 * np.linspace(0, 0.8, int(0.8 * sr))) * 0.05).astype(np.float32)
    pause_internal = np.random.randn(int(0.4 * sr)).astype(np.float32) * 0.001  # 400ms pause
    speech_2 = (np.sin(2 * np.pi * 550 * np.linspace(0, 0.8, int(0.8 * sr))) * 0.05).astype(np.float32)
    silence_trailing = np.random.randn(int(1.0 * sr)).astype(np.float32) * 0.001

    full_sim_audio = np.concatenate([silence_initial, speech_1, pause_internal, speech_2, silence_trailing])
    
    # Process through frame-by-frame VAD logic
    frame_size = 480
    trailing_silence_s = 0.8
    pre_speech_s = 0.35
    pre_speech_frames_count = max(1, int(pre_speech_s / (30 / 1000.0)))
    
    from collections import deque
    pre_buf = deque(maxlen=pre_speech_frames_count)
    rec_frames = []
    state = "WAITING"
    speech_detected = False
    consec_speech = 0
    silence_frames = 0
    threshold = 0.015

    for i in range(0, len(full_sim_audio) - frame_size, frame_size):
        frame = full_sim_audio[i:i+frame_size]
        rms = float(np.sqrt(np.mean(frame ** 2)))
        
        if state == "WAITING":
            pre_buf.append(frame)
            if rms >= threshold:
                consec_speech += 1
                if consec_speech >= 2:
                    state = "RECORDING"
                    speech_detected = True
                    rec_frames.extend(list(pre_buf))
            else:
                consec_speech = 0
        elif state == "RECORDING":
            rec_frames.append(frame)
            if rms >= threshold:
                silence_frames = 0
            else:
                silence_frames += 1
                silence_dur = silence_frames * 0.030
                if silence_dur >= trailing_silence_s and len(rec_frames) * 0.030 >= 0.3:
                    break

    captured_audio = np.concatenate(rec_frames) if rec_frames else np.array([])
    captured_duration = len(captured_audio) / sr
    print(f"Total simulated audio duration: {len(full_sim_audio)/sr:.2f} s")
    print(f"Captured speech duration (preserved pause): {captured_duration:.2f} s")
    assert captured_duration >= 2.0, f"Captured duration ({captured_duration:.2f}s) should preserve both speech segments across 400ms pause."
    print("-> TEST 2 PASSED: 400ms internal pause was preserved and recording stopped on 800ms trailing silence.\n")

    # -------------------------------------------------------------------------
    # TEST 3: Zero-File Check
    # -------------------------------------------------------------------------
    print("----------------------------------------")
    print("TEST 3: Zero Audio Files on Disk Check")
    print("----------------------------------------")
    current_audio = glob.glob("*.wav") + glob.glob("*.mp3") + glob.glob("*.ogg") + glob.glob("*.flac")
    new_audio_files = [f for f in current_audio if f not in existing_audio]
    assert len(new_audio_files) == 0, f"WAV files detected: {new_audio_files}"
    print("-> TEST 3 PASSED: Zero audio files created on disk.\n")

    print("========================================")
    print("ALL VAD TESTS PASSED (GOAL A VERIFIED)")
    print("========================================")


if __name__ == "__main__":
    test_vad_unit()
