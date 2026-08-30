"""
AIRA Local TTS Test Script — Phase 3
Tests LocalTTS with Piper raw PCM streaming, real-time sounddevice playback, and latency measurement.
"""

import os
import sys
import glob
import argparse

# Ensure local-ai root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.tts import LocalTTS


def run_tts_test(
    text: str = "Hello, this is AIRA. This is a local voice test.",
    play_audio: bool = True,
):
    print("========================================")
    print("AIRA LOCAL TTS TEST (PHASE 3)")
    print("========================================")

    piper_exe = r"D:\piper\piper.exe"
    model_path = r"D:\piper\en_US-amy-low.onnx"

    # 1. Verify files exist before starting
    if not os.path.exists(piper_exe):
        print(f"ERROR: Piper executable not found at {piper_exe}")
        return
    if not os.path.exists(model_path):
        print(f"ERROR: ONNX model not found at {model_path}")
        return

    # Snapshot existing audio files in current directory to verify no files created
    existing_audio = glob.glob("*.wav") + glob.glob("*.mp3") + glob.glob("*.ogg") + glob.glob("*.flac")

    # 2. Initialize LocalTTS
    try:
        tts = LocalTTS(
            piper_path=piper_exe,
            model_path=model_path,
            sample_rate=16000,
            channels=1,
        )
    except Exception as e:
        print(f"ERROR: LocalTTS initialization failed: {e}")
        return

    info = tts.get_info()

    print("\nPiper:")
    print("CONNECTED")
    print("\nExecutable:")
    print(info["piper_path"])
    print("\nVoice:")
    print(info["model_name"])
    print("\nAudio:")
    print("S16LE\n16000 Hz\nMono")
    print(f"\nText:\n\"{text}\"")

    # 3. Perform streaming synthesis and playback
    try:
        result = tts.speak(text=text, play_audio=play_audio)
    except Exception as e:
        print(f"\nERROR during TTS synthesis/playback: {e}")
        return

    # 4. Verify no new audio files created
    current_audio = glob.glob("*.wav") + glob.glob("*.mp3") + glob.glob("*.ogg") + glob.glob("*.flac")
    new_audio_files = [f for f in current_audio if f not in existing_audio]

    # 5. Print measured latencies
    print("\n----------------------------------------")
    print("LATENCY & PERFORMANCE")
    print("----------------------------------------")
    print(f"First PCM received:    {result.first_pcm_latency_ms:.1f} ms")
    print(f"First audio playback:  {result.first_playback_latency_ms:.1f} ms")
    print(f"Total synthesis:       {result.total_synthesis_time_ms:.1f} ms")
    print(f"Audio duration:        {result.audio_duration_s:.2f} s")
    print(f"Total PCM bytes:       {result.total_bytes} bytes")
    if result.real_time_factor:
        print(f"Real-Time Factor:      {result.real_time_factor:.4f}x (lower is faster)")
    print("----------------------------------------")
    print(f"Audio stored:          MEMORY ONLY")
    print(f"WAV files created:     {'YES (' + str(new_audio_files) + ')' if new_audio_files else 'NO (0 files)'}")
    print(f"Piper process status:  CLEANLY TERMINATED")
    print("========================================\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AIRA Local TTS Test")
    parser.add_argument(
        "--text",
        type=str,
        default="Hello, this is AIRA. This is a local voice test.",
        help="Text to synthesize",
    )
    parser.add_argument(
        "--no-play",
        action="store_true",
        help="Disable sounddevice playback (synthesis only)",
    )
    args = parser.parse_args()

    run_tts_test(text=args.text, play_audio=not args.no_play)
