import json
import time
import os
import sys
from typing import Dict, Any, List

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from rag.legal_assistant import LegalIntelligenceAssistant


def run_investigation_evaluation(
    dataset_path: str = "evaluation/investigation_intelligence_tests.json"
):
    """
    Evaluates the Investigation Intelligence Layer across 5 key metrics:
    1. Recommendation Relevance (immediate actions match expected keywords)
    2. Evidence Completeness (expected evidence types present)
    3. BNSS Compliance Accuracy (expected BNSS sections present in checklist)
    4. Category-Specific Accuracy (priority level matches expected)
    5. Explainability Quality (every recommendation has a purpose/reason)
    """
    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Investigation test dataset not found: {dataset_path}")

    with open(dataset_path, "r", encoding="utf-8") as f:
        test_cases = json.load(f)

    print("==========================================================================")
    print("CRIMELENS INVESTIGATION INTELLIGENCE LAYER - EVALUATION SUITE")
    print(f"Total Test Cases: {len(test_cases)}")
    print("==========================================================================\n")

    assistant = LegalIntelligenceAssistant()

    total = len(test_cases)
    recommendation_scores = []
    evidence_scores = []
    compliance_scores = []
    category_scores = []
    explainability_scores = []

    t0 = time.time()

    for tc in test_cases:
        cid = tc["id"]
        query = tc["query"]
        expected_priority = tc["expected_priority"]
        expected_actions = tc["expected_immediate_actions"]
        expected_evidence = tc["expected_evidence_types"]
        expected_bnss = tc["expected_bnss_compliance"]
        expected_witnesses = tc["expected_witness_types"]
        has_digital = tc["has_digital_strategy"]

        print(f"[Case {cid}/{total}] Query: '{query}'")

        try:
            result = assistant.process_case(query)
            intel = result.get("investigation_intelligence", {})

            # 1. Recommendation Relevance (immediate actions keywords match)
            actions_text = " ".join([a.get("action", "").lower() for a in intel.get("immediate_actions", [])])
            matched_actions = sum(1 for kw in expected_actions if kw.lower() in actions_text)
            action_score = (matched_actions / len(expected_actions)) * 100.0 if expected_actions else 100.0
            recommendation_scores.append(action_score)

            # 2. Evidence Completeness
            evidence_text = " ".join([e.get("evidence_type", "").lower() + " " + e.get("items_to_collect", "").lower()
                                      for e in intel.get("evidence_strategy", [])])
            matched_evidence = sum(1 for ev in expected_evidence if ev.lower() in evidence_text)
            evidence_score = (matched_evidence / len(expected_evidence)) * 100.0 if expected_evidence else 100.0
            evidence_scores.append(evidence_score)

            # 3. BNSS Compliance Accuracy
            compliance_refs = " ".join([c.get("related_BNSS_section", "") for c in intel.get("legal_compliance_checklist", [])])
            matched_bnss = sum(1 for sec in expected_bnss if sec in compliance_refs)
            compliance_score = (matched_bnss / len(expected_bnss)) * 100.0 if expected_bnss else 100.0
            compliance_scores.append(compliance_score)

            # 4. Category-Specific Accuracy (priority level match)
            actual_priority = intel.get("investigation_priority", {}).get("level", "UNKNOWN")
            cat_match = 100.0 if actual_priority == expected_priority else 0.0
            category_scores.append(cat_match)

            # 5. Explainability Quality (every immediate action and evidence item has purpose/reason)
            total_items = len(intel.get("immediate_actions", [])) + len(intel.get("evidence_strategy", []))
            items_with_purpose = sum(1 for a in intel.get("immediate_actions", []) if a.get("purpose"))
            items_with_purpose += sum(1 for e in intel.get("evidence_strategy", []) if e.get("legal_relevance"))
            explain_score = (items_with_purpose / total_items) * 100.0 if total_items > 0 else 100.0
            explainability_scores.append(explain_score)

            print(f"  -> Priority: {actual_priority} (Expected: {expected_priority}) {'[+] PASS' if cat_match == 100.0 else '[-] MISSED'}")
            print(f"  -> Recommendation Relevance: {action_score:.0f}%")
            print(f"  -> Evidence Completeness: {evidence_score:.0f}%")
            print(f"  -> BNSS Compliance: {compliance_score:.0f}%")
            print(f"  -> Explainability: {explain_score:.0f}%")
            print(f"  -> Immediate Actions: {len(intel.get('immediate_actions', []))}")
            print(f"  -> Evidence Items: {len(intel.get('evidence_strategy', []))}")
            print(f"  -> Witness Types: {len(intel.get('witness_strategy', []))}")
            print(f"  -> BNSS Checklist Items: {len(intel.get('legal_compliance_checklist', []))}")
            print(f"  -> Timeline Stages: {len(intel.get('investigation_timeline', []))}")
            print(f"  -> Digital Forensic Actions: {len(intel.get('digital_forensic_strategy', []))}")
            print("-" * 64)

        except Exception as e:
            print(f"  [ERROR] Case {cid} failed: {e}")
            recommendation_scores.append(0.0)
            evidence_scores.append(0.0)
            compliance_scores.append(0.0)
            category_scores.append(0.0)
            explainability_scores.append(0.0)

    total_time = time.time() - t0

    avg_rec = sum(recommendation_scores) / total if total > 0 else 0.0
    avg_ev = sum(evidence_scores) / total if total > 0 else 0.0
    avg_comp = sum(compliance_scores) / total if total > 0 else 0.0
    avg_cat = sum(category_scores) / total if total > 0 else 0.0
    avg_exp = sum(explainability_scores) / total if total > 0 else 0.0

    print("\n==========================================================================")
    print("INVESTIGATION INTELLIGENCE LAYER - EVALUATION RESULTS")
    print("==========================================================================")
    print(f"* Total Test Cases: {total}")
    print(f"* Total Execution Time: {total_time:.2f} seconds ({total_time/total:.2f}s per case)")
    print(f"* Recommendation Relevance: {avg_rec:.2f}%")
    print(f"* Evidence Completeness: {avg_ev:.2f}%")
    print(f"* BNSS Compliance Accuracy: {avg_comp:.2f}%")
    print(f"* Category-Specific Accuracy: {avg_cat:.2f}%")
    print(f"* Explainability Quality: {avg_exp:.2f}%")
    print("==========================================================================\n")


if __name__ == "__main__":
    run_investigation_evaluation()
