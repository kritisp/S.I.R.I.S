import json
import time
import os
from typing import Dict, Any, List
from rag.legal_assistant import LegalIntelligenceAssistant


def run_evaluation(dataset_path: str = "legal_test_cases.json"):
    """
    Automated Benchmark Evaluation Suite for CrimeLens Legal Intelligence Retrieval Engine.
    Evaluates Top-1 Section Accuracy, Top-3 Section Accuracy, False Positive Rate, and Element Verification Accuracy.
    """
    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Test cases dataset not found at: {dataset_path}")

    with open(dataset_path, "r", encoding="utf-8") as f:
        test_cases = json.load(f)

    print(f"================================================================")
    print(f"CRIMELENS LEGAL INTELLIGENCE ENGINE - BENCHMARK EVALUATION")
    print(f"Total Benchmark Test Cases: {len(test_cases)}")
    print(f"================================================================\n")

    assistant = LegalIntelligenceAssistant()

    top1_correct = 0
    top3_correct = 0
    false_positives = 0
    element_verification_correct = 0
    total = len(test_cases)

    t0 = time.time()

    for idx, tc in enumerate(test_cases, 1):
        query = tc["query"]
        expected_secs = [str(s).strip() for s in tc["expected_sections"]]
        wrong_secs = [str(s).strip() for s in tc.get("wrong_sections", [])]

        print(f"[Case {idx}/{total}] Query: '{query}'")

        try:
            result = assistant.process_case(query)
            retrieved_secs = []
            for off in result.get("possible_offences", []):
                sec_str = str(off.get("section", "")).replace("Section ", "").strip()
                if sec_str:
                    retrieved_secs.append(sec_str)

            print(f"  -> Expected Sections: {expected_secs}")
            print(f"  -> Retrieved Sections: {retrieved_secs}")

            # Top-1 Check
            if retrieved_secs and retrieved_secs[0] in expected_secs:
                top1_correct += 1
                print("  [+] Top-1 Match: SUCCESS")
            else:
                print("  [-] Top-1 Match: MISSED")

            # Top-3 Check
            if any(sec in expected_secs for sec in retrieved_secs[:3]):
                top3_correct += 1
                print("  [+] Top-3 Match: SUCCESS")
            else:
                print("  [-] Top-3 Match: MISSED")

            # False Positive Check
            has_false_positive = any(sec in wrong_secs for sec in retrieved_secs)
            if has_false_positive:
                false_positives += 1
                print(f"  [!] False Positive Detected (Wrong section included)")

            # Element Verification Check (Rejected wrong section)
            if not has_false_positive:
                element_verification_correct += 1

            print("-" * 64)

        except Exception as e:
            print(f"  [ERROR] Case {idx} failed: {e}")

    total_time = time.time() - t0
    top1_acc = (top1_correct / total) * 100.0
    top3_acc = (top3_correct / total) * 100.0
    fp_rate = (false_positives / total) * 100.0
    elem_verif_acc = (element_verification_correct / total) * 100.0

    print("\n================================================================")
    print("FINAL BENCHMARK ACCURACY REPORT")
    print("================================================================")
    print(f"* Total Test Cases Evaluated: {total}")
    print(f"* Total Execution Time: {total_time:.2f} seconds ({total_time/total:.2f}s per case)")
    print(f"* Top-1 Section Accuracy: {top1_acc:.2f}% ({top1_correct}/{total})")
    print(f"* Top-3 Section Accuracy: {top3_acc:.2f}% ({top3_correct}/{total})")
    print(f"* False Positive Rate: {fp_rate:.2f}% ({false_positives}/{total})")
    print(f"* Statutory Element Verification Accuracy: {elem_verif_acc:.2f}% ({element_verification_correct}/{total})")
    print("================================================================\n")


if __name__ == "__main__":
    run_evaluation()
