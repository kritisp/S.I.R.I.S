"""
AIRA Local LLM Test Script — Phase 2
Tests LocalLLM streaming tokens from Ollama (llama3.2:latest), measuring first-token and total generation latency.
"""

import os
import sys
import time
import argparse

# Ensure local-ai root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.llm import LocalLLM


def run_llm_test(prompt: str = "Explain what an FIR is in two sentences."):
    system_prompt = (
        "You are AIRA, a local police investigation assistant. "
        "Answer clearly and concisely. Do not invent facts."
    )

    print("========================================")
    print("AIRA LOCAL LLM TEST (PHASE 2)")
    print("========================================")

    # 1. Initialize and verify connection & model
    t_conn_start = time.perf_counter()
    try:
        llm = LocalLLM(
            host="http://127.0.0.1:11434",
            model="llama3.2:latest",
            default_system_prompt=system_prompt,
        )
    except Exception as e:
        print(f"ERROR: {e}")
        return

    t_conn_end = time.perf_counter()
    conn_time_ms = (t_conn_end - t_conn_start) * 1000.0

    runtime_info = llm.get_runtime_info()

    print(f"Ollama: CONNECTED ({conn_time_ms:.1f} ms)")
    print(f"Model: {llm.model}")
    print(f"Streaming: ENABLED")
    if runtime_info.get("vram_mb"):
        print(f"GPU VRAM Allocated: {runtime_info['vram_mb']} MB (offload: {runtime_info['gpu_offload']})")
    print("\nPrompt:")
    print(prompt)
    print("\nResponse:")

    # 2. Measure streaming generation in real time
    t_req_start = time.perf_counter()
    t_first_token = None
    chunks_received = 0

    stream = llm.stream_response(
        prompt=prompt,
        system_prompt=system_prompt,
    )

    try:
        while True:
            try:
                chunk = next(stream)
                if t_first_token is None:
                    t_first_token = time.perf_counter()
                chunks_received += 1
                sys.stdout.write(chunk)
                sys.stdout.flush()
            except StopIteration as e:
                result = e.value
                break
    except Exception as e:
        print(f"\nERROR during streaming: {e}")
        return

    t_req_end = time.perf_counter()
    first_token_ms = ((t_first_token - t_req_start) * 1000.0) if t_first_token else 0.0
    total_gen_ms = (t_req_end - t_req_start) * 1000.0

    print("\n\n========================================")
    print("LATENCY & METRICS")
    print("========================================")
    print(f"Request start:            0.0 ms")
    print(f"First token latency:      {first_token_ms:.1f} ms")
    print(f"Total generation latency: {total_gen_ms:.1f} ms")
    print(f"Chunks received:          {chunks_received}")
    if result.eval_count:
        print(f"Tokens evaluated:         {result.eval_count}")
    if result.tokens_per_second:
        print(f"Throughput:               {result.tokens_per_second} tokens/sec")
    print("========================================\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AIRA Local LLM Streaming Test")
    parser.add_argument(
        "--prompt",
        type=str,
        default="Explain what an FIR is in two sentences.",
        help="Prompt to send to local Llama 3.2",
    )
    args = parser.parse_args()

    run_llm_test(prompt=args.prompt)
