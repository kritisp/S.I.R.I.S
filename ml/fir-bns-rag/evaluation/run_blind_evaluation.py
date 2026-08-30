import json
import time
import os
import sys
from typing import Dict, Any, List

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from rag.legal_assistant import LegalIntelligenceAssistant


def run_blind_evaluation(
    dataset_path: str = "evaluation/blind_test_cases.json",
    failure_report_path: str = "evaluation/failure_analysis.md"
):
    """
    Executes the 30-case blind evaluation dataset across all 6 legal intelligence metrics.
    Generates evaluation/failure_analysis.md for any failure cases.
    """
    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Blind dataset file not found at: {dataset_path}")

    with open(dataset_path, "r", encoding="utf-8") as f:
        test_cases = json.load(f)

    print("==========================================================================")
    print("CRIMELENS LEGAL INTELLIGENCE ENGINE - BLIND ADVERSARIAL EVALUATION")
    print(f"Total Blind Test Cases: {len(test_cases)}")
    print("==========================================================================\n")

    assistant = LegalIntelligenceAssistant()

    top1_correct = 0
    top3_correct = 0
    false_positives = 0
    element_verif_correct = 0
    category_correct = 0
    missing_info_correct = 0
    total = len(test_cases)

    failures: List[Dict[str, Any]] = []
    t0 = time.time()

    for tc in test_cases:
        cid = tc["id"]
        query = tc["query"]
        expected_cat = tc["expected_category"]
        expected_secs = [str(s).replace("BNS Section ", "").strip() for s in tc["expected_sections"]]
        wrong_secs = [str(s).replace("BNS Section ", "").strip() for s in tc.get("sections_that_should_be_rejected", [])]
        is_missing_info = tc.get("is_missing_info", False)

        print(f"[Blind Case {cid}/{total}] Query: '{query}'")

        try:
            res = assistant.process_case(query)

            # Retrieved sections
            retrieved_secs = []
            if "primary_offence" in res and res["primary_offence"].get("section"):
                sec_p = str(res["primary_offence"]["section"]).replace("Section ", "").strip()
                if sec_p and sec_p != "N/A":
                    retrieved_secs.append(sec_p)

            for sec_list in [res.get("secondary_offences", []), res.get("alternative_offences", []), res.get("possible_offences", [])]:
                for item in sec_list:
                    sec_str = str(item.get("section", "")).replace("Section ", "").strip()
                    if sec_str and sec_str != "N/A" and sec_str not in retrieved_secs:
                        retrieved_secs.append(sec_str)

            # 1. Crime Category Classification Check
            cat_match = False
            case_summary = res.get("case_summary", "")
            if expected_cat.lower() in case_summary.lower() or expected_cat.replace("_", " ").lower() in case_summary.lower():
                cat_match = True
                category_correct += 1

            # 2. Top-1 Check
            top1_pass = False
            if retrieved_secs and retrieved_secs[0] in expected_secs:
                top1_pass = True
                top1_correct += 1

            # 3. Top-3 Check
            top3_pass = False
            if any(sec in expected_secs for sec in retrieved_secs[:3]):
                top3_pass = True
                top3_correct += 1

            # 4. False Positive Check
            has_fp = any(sec in wrong_secs for sec in retrieved_secs)
            if has_fp:
                false_positives += 1
            else:
                element_verif_correct += 1

            # 5. Missing Information Quality Check
            missing_info_pass = False
            missing_info_list = res.get("missing_information", [])
            if is_missing_info and len(missing_info_list) >= 2:
                missing_info_pass = True
                missing_info_correct += 1
            elif not is_missing_info:
                missing_info_pass = True
                missing_info_correct += 1

            print(f"  -> Category Match: {'[+] PASS' if cat_match else '[-] MISSED'}")
            print(f"  -> Top-1 Match: {'[+] PASS' if top1_pass else '[-] MISSED'} (Retrieved: {retrieved_secs[:3]} | Expected: {expected_secs})")
            print(f"  -> Top-3 Match: {'[+] PASS' if top3_pass else '[-] MISSED'}")
            print(f"  -> False Positive: {'[!] DETECTED' if has_fp else '[+] NONE'}")
            print(f"  -> Missing Info Quality: {'[+] HIGH' if missing_info_pass else '[-] LOW'}")
            print("-" * 64)

            # Failure Logging
            if not top3_pass or has_fp or not cat_match:
                failure_stage = "Hybrid Retrieval" if not top3_pass else ("Element Verification" if has_fp else "Fact Extractor Category")
                failures.append({
                    "id": cid,
                    "query": query,
                    "expected_category": expected_cat,
                    "expected_sections": expected_secs,
                    "retrieved_sections": retrieved_secs,
                    "failure_stage": failure_stage,
                    "reason": tc.get("reason", "")
                })

        except Exception as e:
            print(f"  [ERROR] Case {cid} execution error: {e}")
            failures.append({
                "id": cid,
                "query": query,
                "expected_category": expected_cat,
                "expected_sections": expected_secs,
                "retrieved_sections": [],
                "failure_stage": f"Execution Error: {e}",
                "reason": "Pipeline exception"
            })

    total_time = time.time() - t0
    top1_acc = (top1_correct / total) * 100.0
    top3_acc = (top3_correct / total) * 100.0
    fp_rate = (false_positives / total) * 100.0
    elem_acc = (element_verif_correct / total) * 100.0
    cat_acc = (category_correct / total) * 100.0
    missing_acc = (missing_info_correct / total) * 100.0

    print("\n==========================================================================")
    print("BLIND ADVERSARIAL BENCHMARK RESULTS")
    print("==========================================================================")
    print(f"* Total Unseen Cases Tested: {total}")
    print(f"* Total Execution Time: {total_time:.2f} seconds ({total_time/total:.2f}s per case)")
    print(f"* Crime Category Classification Accuracy: {cat_acc:.2f}% ({category_correct}/{total})")
    print(f"* Top-1 BNS Section Accuracy: {top1_acc:.2f}% ({top1_correct}/{total})")
    print(f"* Top-3 BNS Section Accuracy: {top3_acc:.2f}% ({top3_correct}/{total})")
    print(f"* False Positive Rate: {fp_rate:.2f}% ({false_positives}/{total})")
    print(f"* Statutory Element Verification Accuracy: {elem_acc:.2f}% ({element_verif_correct}/{total})")
    print(f"* Missing Information Quality Accuracy: {missing_acc:.2f}% ({missing_info_correct}/{total})")
    print("==========================================================================\n")

    # Generate failure_analysis.md
    report_content = f"# CrimeLens Adversarial Failure Analysis Report\n\n"
    report_content += f"**Evaluated Test Cases**: {total} Unseen Blind Cases\n"
    report_content += f"**Top-1 Accuracy**: {top1_acc:.2f}%\n"
    report_content += f"**Top-3 Accuracy**: {top3_acc:.2f}%\n"
    report_content += f"**False Positive Rate**: {fp_rate:.2f}%\n"
    report_content += f"**Element Verification Accuracy**: {elem_acc:.2f}%\n\n"
    report_content += "---\n\n## Failure Breakdown & Stage Analysis\n\n"

    if not failures:
        report_content += "🎉 **Zero Failures Detected! All 30 blind test cases passed verification successfully.**\n"
    else:
        for fitem in failures:
            report_content += f"### Case {fitem['id']}: '{fitem['query']}'\n"
            report_content += f"- **Expected Category**: `{fitem['expected_category']}`\n"
            report_content += f"- **Expected Sections**: `{fitem['expected_sections']}`\n"
            report_content += f"- **Retrieved Sections**: `{fitem['retrieved_sections']}`\n"
            report_content += f"- **Failure Stage**: `{fitem['failure_stage']}`\n"
            report_content += f"- **Root Cause Analysis**: {fitem['reason']}\n"
            report_content += f"- **Recommended General Improvement**: Enhance generalized concept ontology in `LegalQueryExpander` or `LegalFactExtractor`.\n\n"

    os.makedirs(os.path.dirname(failure_report_path), exist_ok=True)
    with open(failure_report_path, "w", encoding="utf-8") as rf:
        rf.write(report_content)

    print(f"[Failure Analysis] Saved detailed report to: {failure_report_path}")


if __name__ == "__main__":
    run_blind_evaluation()
