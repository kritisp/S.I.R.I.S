"""
AIRA Local AI Gateway / Intent Router Test Script — Phase 5
Tests deterministic operational action routing, parameter extraction, conversational fallback, and latency.
"""

import os
import sys
import time

# Ensure local-ai root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.gateway import LocalGateway, IntentResult


def run_gateway_tests():
    print("========================================")
    print("AIRA LOCAL AI GATEWAY TEST (PHASE 5)")
    print("========================================")

    gateway = LocalGateway(action_threshold=0.85)

    test_cases = [
        # ---------------------------------------------------------------------
        # 1. ACTION TESTS
        # ---------------------------------------------------------------------
        {
            "category": "ACTION",
            "query": "Open Evidence Vault",
            "expected_mode": "ACTION",
            "expected_intent": "OPEN_EVIDENCE_VAULT",
            "expected_params": {},
        },
        {
            "category": "ACTION",
            "query": "Open the evidence vault",
            "expected_mode": "ACTION",
            "expected_intent": "OPEN_EVIDENCE_VAULT",
            "expected_params": {},
        },
        {
            "category": "ACTION",
            "query": "Show network operations",
            "expected_mode": "ACTION",
            "expected_intent": "OPEN_NETWORK_OPS",
            "expected_params": {},
        },
        {
            "category": "ACTION",
            "query": "Show hotspots",
            "expected_mode": "ACTION",
            "expected_intent": "SHOW_HOTSPOTS",
            "expected_params": {},
        },
        {
            "category": "ACTION",
            "query": "Open FIR 212",
            "expected_mode": "ACTION",
            "expected_intent": "OPEN_FIR",
            "expected_params": {"fir_number": "212"},
        },
        {
            "category": "ACTION",
            "query": "Show FIR 212",
            "expected_mode": "ACTION",
            "expected_intent": "OPEN_FIR",
            "expected_params": {"fir_number": "212"},
        },
        # ---------------------------------------------------------------------
        # 2. CONVERSATIONAL TESTS
        # ---------------------------------------------------------------------
        {
            "category": "CONVERSATIONAL",
            "query": "What is an FIR?",
            "expected_mode": "LLM",
            "expected_intent": "CONVERSATIONAL",
            "expected_params": {},
        },
        {
            "category": "CONVERSATIONAL",
            "query": "Tell me about FIR 212.",
            "expected_mode": "LLM",
            "expected_intent": "CONVERSATIONAL",
            "expected_params": {},
        },
        {
            "category": "CONVERSATIONAL",
            "query": "Give me a summary of this case.",
            "expected_mode": "LLM",
            "expected_intent": "CONVERSATIONAL",
            "expected_params": {},
        },
        {
            "category": "CONVERSATIONAL",
            "query": "Why is evidence important in an investigation?",
            "expected_mode": "LLM",
            "expected_intent": "CONVERSATIONAL",
            "expected_params": {},
        },
        # ---------------------------------------------------------------------
        # 3. AMBIGUOUS / POLITE TESTS
        # ---------------------------------------------------------------------
        {
            "category": "AMBIGUOUS",
            "query": "Can you tell me about the evidence vault?",
            "expected_mode": "LLM",
            "expected_intent": "CONVERSATIONAL",
            "expected_params": {},
        },
        {
            "category": "AMBIGUOUS",
            "query": "Could you open FIR 212 for me?",
            "expected_mode": "ACTION",
            "expected_intent": "OPEN_FIR",
            "expected_params": {"fir_number": "212"},
        },
        {
            "category": "AMBIGUOUS",
            "query": "Explain FIR 212",
            "expected_mode": "LLM",
            "expected_intent": "CONVERSATIONAL",
            "expected_params": {},
        },
        # ---------------------------------------------------------------------
        # 4. FALSE POSITIVE PREVENTION TESTS
        # ---------------------------------------------------------------------
        {
            "category": "FALSE POSITIVE GUARD",
            "query": "Why is evidence important?",
            "expected_mode": "LLM",
            "expected_intent": "CONVERSATIONAL",
            "expected_params": {},
        },
        {
            "category": "FALSE POSITIVE GUARD",
            "query": "What are network hotspots?",
            "expected_mode": "LLM",
            "expected_intent": "CONVERSATIONAL",
            "expected_params": {},
        },
    ]

    passed = 0
    total = len(test_cases)
    latencies = []

    print(f"Running {total} test cases across Action, Conversational, Ambiguous, and False-Positive categories...\n")

    for idx, tc in enumerate(test_cases, 1):
        res = gateway.route(tc["query"])
        latencies.append(res.latency_ms)

        mode_ok = res.mode == tc["expected_mode"]
        intent_ok = res.intent == tc["expected_intent"]
        params_ok = res.parameters == tc["expected_params"]

        success = mode_ok and intent_ok and params_ok

        status_tag = "[PASS]" if success else "[FAIL]"
        if success:
            passed += 1

        print(f"{status_tag} Test {idx:2d} ({tc['category']}): \"{tc['query']}\"")
        print(f"       -> Mode: {res.mode} | Intent: {res.intent} | Conf: {res.confidence:.2f} | Params: {res.parameters} ({res.latency_ms:.3f} ms)")

        if not success:
            print(f"       EXPECTED: Mode={tc['expected_mode']}, Intent={tc['expected_intent']}, Params={tc['expected_params']}")

    avg_lat = sum(latencies) / len(latencies) if latencies else 0.0

    print("\n========================================")
    print("GATEWAY TEST SUMMARY")
    print("========================================")
    print(f"Passed:            {passed} / {total} ({passed/total*100:.1f}%)")
    print(f"Average Latency:   {avg_lat:.3f} ms")
    print(f"Max Latency:       {max(latencies):.3f} ms")
    print(f"Min Latency:       {min(latencies):.3f} ms")
    print(f"Cloud APIs used:   NONE (100% Local Deterministic Routing)")
    print("========================================\n")

    assert passed == total, f"{total - passed} test cases failed!"


if __name__ == "__main__":
    run_gateway_tests()
