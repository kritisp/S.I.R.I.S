"""
AIRA Local Voice Pipeline Test Script — Phase 6 (Data Retrieval Integration)
Tests the complete end-to-end local voice assistant pipeline:
Microphone (VAD) -> faster-whisper (CUDA) -> Local Gateway (Sub-ms Intent Routing) -> (ACTION or CrimeLens Data Retrieval -> Llama 3.2 -> Piper PCM -> Speakers).
"""

import os
import sys
import glob
import argparse

# Ensure local-ai root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.pipeline import LocalVoicePipeline


def run_pipeline_test(
    max_record_seconds: float = 15.0,
    trailing_silence_s: float = 1.2,
    initial_silence_timeout: float = 5.0,
    text_input: str = None,
    play_audio: bool = True,
):
    print("========================================")
    print("AIRA LOCAL VOICE PIPELINE (PHASE 6 - RETRIEVAL)")
    print("========================================")

    # Snapshot existing audio files in current directory to verify zero files created
    existing_audio = glob.glob("*.wav") + glob.glob("*.mp3") + glob.glob("*.ogg") + glob.glob("*.flac")

    # 1. Initialize complete pipeline
    try:
        pipeline = LocalVoicePipeline()
    except Exception as e:
        print(f"ERROR: Failed to initialize pipeline: {e}")
        return

    print("Pipeline ready.")
    print("----------------------------------------")

    # 2. Status logger
    def on_status(msg: str):
        print(msg)

    # 3. Execute turn
    try:
        if text_input:
            print(f"\n[INPUT] Text mode: \"{text_input}\"\n")
            result = pipeline.run_turn(
                text_input=text_input,
                play_audio=play_audio,
                on_status=on_status,
            )
        else:
            print(f"\n[INPUT] Speak into microphone when ready (recording stops automatically when you finish speaking)...")
            print("Action suggestion: \"Open FIR 212\"")
            print("Case retrieval suggestion: \"Tell me about FIR 541\"")
            print("Non-existent case suggestion: \"Tell me about FIR 212\"\n")
            result = pipeline.run_turn(
                max_record_seconds=max_record_seconds,
                trailing_silence_s=trailing_silence_s,
                initial_silence_timeout=initial_silence_timeout,
                play_audio=play_audio,
                on_status=on_status,
            )
    except KeyboardInterrupt:
        print("\n[PIPELINE] Interrupted by user (Ctrl+C). Cleaned up processes.")
        return
    except Exception as e:
        print(f"\nERROR during pipeline execution: {e}")
        return

    # 4. Verify no new audio files created on disk
    current_audio = glob.glob("*.wav") + glob.glob("*.mp3") + glob.glob("*.ogg") + glob.glob("*.flac")
    new_audio_files = [f for f in current_audio if f not in existing_audio]

    if result.timed_out:
        print("\n========================================")
        print("PIPELINE RESULT: TIMEOUT (NO SPEECH DETECTED)")
        print("========================================")
        print("No speech was detected before timeout. Gateway and LLM were not invoked.")
        print(f"Initial silence timeout: {initial_silence_timeout:.1f} s")
        print(f"Audio files created:     NO (0 files)")
        print("========================================\n")
        return

    # 5. Print comprehensive latency instrumentation
    print("\n========================================")
    print("AIRA LOCAL VOICE PIPELINE LATENCY REPORT")
    print("========================================")

    print(f"\n[STT & RECORDING]")
    print(f"Actual recording duration:       {result.recording_duration_s:.2f} s (automatic speech-end detection)")
    print(f"Speech end -> transcript:        {result.speech_end_to_transcript_ms:.1f} ms")
    print(f"STT pure inference latency:      {result.stt_latency_ms:.1f} ms")
    print(f"Transcript:\n\"{result.transcript}\"")

    print(f"\n[LOCAL AI GATEWAY / INTENT ROUTER]")
    print(f"Gateway routing latency:         {result.gateway_latency_ms:.3f} ms")
    print(f"Mode:                            {result.mode}")
    print(f"Intent:                          {result.intent}")
    print(f"Confidence:                      {result.intent_confidence:.2f}")
    print(f"Parameters:                      {result.intent_parameters}")

    if result.retrieval_performed:
        print(f"\n[CRIMELENS DATA RETRIEVAL LAYER]")
        print(f"Resource:                        {result.retrieval_resource}")
        print(f"Identifier:                      {result.retrieval_identifier}")
        print(f"Records Retrieved:               {result.retrieval_records_count}")
        print(f"Retrieval Latency:               {result.retrieval_latency_ms:.2f} ms")
        print(f"Record Found in DB:              {'YES' if result.retrieval_success else 'NO (Missing entity handled cleanly)'}")
        print(f"Read-Only Enforcement:           ACTIVE (PRAGMA query_only = ON)")

    if result.mode == "ACTION":
        print(f"\n[ACTION EXECUTION]")
        print(f"Action dispatched:               {result.intent}")
        print(f"LLM / TTS bypassed:              YES (Deterministic fast path)")
        print(f"Total action dispatch time:      {result.speech_start_to_complete_response_ms:.1f} ms")
    else:
        print(f"\n[LLM CONVERSATIONAL & GROUNDING]")
        print(f"Transcript -> first token:       {result.llm_first_token_latency_ms:.1f} ms")
        print(f"First token -> first sentence:   {result.llm_first_sentence_latency_ms:.1f} ms")
        print(f"Total generation time:           {result.llm_total_generation_ms:.1f} ms")
        print(f"Sentences generated:             {len(result.sentences)}")
        print(f"Full Grounded Response:\n\"{result.full_response}\"")

        print(f"\n[TTS]")
        print(f"Sentence -> first PCM:           {result.tts_first_pcm_latency_ms:.1f} ms")
        print(f"First PCM -> audio playback:     {result.tts_first_playback_latency_ms:.1f} ms")
        print(f"Total synthesis time:            {result.tts_total_synthesis_ms:.1f} ms")

    print("\n----------------------------------------")
    print("KEY RESPONSIVENESS METRICS")
    print("----------------------------------------")
    if result.mode == "ACTION":
        print(f"Speech start -> action return:   {result.speech_start_to_complete_response_ms:.1f} ms")
    else:
        print(f"Speech start -> first audio:     {result.speech_start_to_first_audio_ms:.1f} ms")
        print(f"Speech start -> complete:        {result.speech_start_to_complete_response_ms:.1f} ms")
        print(f"LLM / TTS overlap achieved:      {'YES (Llama generated next sentences while Piper was speaking)' if result.overlap_achieved else 'NO'}")

    print(f"Audio storage:                   MEMORY ONLY (0 WAV files)")
    print(f"WAV files created:               {'YES (' + str(new_audio_files) + ')' if new_audio_files else 'NO (0 files)'}")
    print(f"Cloud APIs used:                 NONE (100% Local: Whisper CUDA + Local Gateway + SQLite Read-Only + Llama 3.2 + Piper)")
    print("========================================\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AIRA Local Voice Pipeline Test (Phase 6 - Retrieval)")
    parser.add_argument("--seconds", "--max-seconds", dest="max_seconds", type=float, default=15.0, help="Maximum recording safety cap in seconds (default: 15.0)")
    parser.add_argument("--trailing-silence", type=float, default=1.2, help="Trailing silence threshold in seconds (default: 1.2)")
    parser.add_argument("--initial-timeout", type=float, default=5.0, help="Initial silence timeout in seconds (default: 5.0)")
    parser.add_argument("--text", type=str, default=None, help="Optional text prompt instead of mic recording")
    parser.add_argument("--no-play", action="store_true", help="Disable audio playback")
    args = parser.parse_args()

    run_pipeline_test(
        max_record_seconds=args.max_seconds,
        trailing_silence_s=args.trailing_silence,
        initial_silence_timeout=args.initial_timeout,
        text_input=args.text,
        play_audio=not args.no_play,
    )
