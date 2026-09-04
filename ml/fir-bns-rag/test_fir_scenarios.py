import os
import sys
import json

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from rag.fir_intelligence_pipeline import FIRIntelligencePipeline

def main():
    print("=" * 80)
    print("S.I.R.I.S — FIR/BNS RAG PIPELINE REAL-DATA SCENARIO VERIFICATION")
    print("=" * 80)

    pipeline = FIRIntelligencePipeline()

    test_cases = [
        {
            "id": "SCENARIO-1",
            "category": "Theft / House Burglary",
            "narrative": "On 14/03/2026 at 02:00 hrs, unknown culprits broke open the rear wooden door of House No. 45, Master Canteen, entered the residential premises, and stole gold jewellery worth Rs 3,50,000 and Rs 40,000 cash from the bedroom almirah."
        },
        {
            "id": "SCENARIO-2",
            "category": "Assault / Attempted Homicide",
            "narrative": "On 12/03/2026 at 21:30 hrs near Khandagiri Square, accused Ramesh Nayak attacked victim Suresh Mohanty with a sharp knife causing deep abdominal injuries. The victim was rushed to AIIMS hospital and survived after emergency surgery."
        },
        {
            "id": "SCENARIO-3",
            "category": "Cyber Financial Fraud",
            "narrative": "Complainant received a phishing call from +91-9876543210 posing as SBI Bank Manager. The caller fraudulently induced complainant to share OTP, resulting in illegal transfer of Rs 1,85,000 to mule account."
        },
        {
            "id": "SCENARIO-4",
            "category": "Criminal Intimidation / Armed Extortion",
            "narrative": "Accused Rahul Das brandished a firearm outside complainant's shop at Saheed Nagar and threatened to kill him unless Rs 50,000 protection money was handed over immediately."
        },
        {
            "id": "SCENARIO-5",
            "category": "Robbery / Chain Snatching",
            "narrative": "On 15/03/2026 at 19:45 hrs near Palasuni Toll Gate, two unknown persons on motorcycle OD-02-MJ-8821 forcibly snatched gold chain weighing 25 grams from complainant's neck using violence and fled."
        },
        {
            "id": "SCENARIO-6",
            "category": "Multi-Provision Armed Offence",
            "narrative": "Two masked men armed with daggers broke into complainant's residence at midnight, assaulted the security guard causing grievous bodily hurt, forced open the safe, and fled with Rs 8,00,000 cash and vehicle OD-02-AB-1234."
        }
    ]

    all_passed = True

    for case in test_cases:
        print("\n" + "-" * 80)
        print(f"TESTING {case['id']}: {case['category']}")
        print(f"FIR Narrative: {case['narrative']}")
        print("-" * 80)

        res = pipeline.process_fir(case['narrative'], source_name=f"test_{case['id'].lower()}")

        bns_sections = res.get("bns_sections", [])
        bnss_actions = res.get("bnss_procedural_actions", [])
        investigation_actions = res.get("investigation_actions", [])
        entities = res.get("entities", {})

        print(f"Summary: {res.get('summary')}")
        print(f"Crime Category: {res.get('crime_category')}")
        print(f"BNS Recommendations Count: {len(bns_sections)}")

        for idx, bns in enumerate(bns_sections, 1):
            print(f"  [{idx}] Law: {bns.get('law')} | Section: {bns.get('section')} | Title: {bns.get('title')}")
            print(f"      Confidence: {bns.get('confidence')} | Reason: {bns.get('confidence_reason')}")
            print(f"      Supporting Evidence: {bns.get('supporting_fir_evidence')}")

        print(f"BNSS Procedural Actions Count: {len(bnss_actions)}")
        for idx, bnss in enumerate(bnss_actions[:2], 1):
            print(f"  [{idx}] Section: {bnss.get('section')} | Action: {bnss.get('action')}")

        print(f"Investigation Actions Count: {len(investigation_actions)}")
        if investigation_actions:
            print(f"  Top Action: {investigation_actions[0].get('action')} (Priority: {investigation_actions[0].get('priority')})")

        if not bns_sections:
            print(f"[FAIL] Scenario {case['id']} produced zero BNS recommendations!")
            all_passed = False
        else:
            print(f"[PASS] Scenario {case['id']} successfully returned verified BNS recommendations.")

    print("\n" + "=" * 80)
    if all_passed:
        print("ALL 6 FIR RAG SCENARIO TESTS PASSED SUCCESSFULLY!")
    else:
        print("SOME SCENARIOS FAILED BNS RAG VERIFICATION!")
    print("=" * 80)

if __name__ == "__main__":
    main()
