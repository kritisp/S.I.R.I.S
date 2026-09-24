"""
S.I.R.I.S End-to-End Hybrid Entity Extraction Verification Script
==================================================================
Runs the hybrid NLP entity extraction pipeline on realistic synthetic FIR narratives.
"""

import json
from app.services.graph.graph_intelligence_service import graph_intelligence_service

SAMPLE_FIRS = [
    {
        "title": "Night Burglary (BNS 305/331)",
        "narrative": "On the night of 14.08.2026, Shri Subash Chandra Pradhan reported that unknown intruders broke the rear latch of residence at Plot 412, Khandagiri, Bhubaneswar, and stole 40 grams of gold jewellery and Rs 85,000 cash. Suspect phone +91-9861012345 and getaway vehicle OD-02-AK-4455 were spotted near Saheed Nagar."
    },
    {
        "title": "Cyber UPI Scam (BNS 318(4))",
        "narrative": "On 22.08.2026, complainant Smt. Gita Rani Dash received a fraudulent call from +91-9876543210 posing as bank manager, sent a malicious APK link, and unauthorizedly debited Rs 1,50,000 via UPI suspect.mule@okaxis to bank account 987654321012."
    },
    {
        "title": "Armed Robbery (BNS 309)",
        "narrative": "On 01.09.2026 near Saheed Nagar flyover in Cuttack, two masked men on motorcycle OR-02-BV-9876 brandished a sharp knife, physically threatened complainant Rahul Kumar Sahoo, and snatched a mobile phone. Suspect crypto wallet 0x71C7656EC7ab88b098defB751B7401B5f6d8976F flagged by FIU."
    }
]

def main():
    print("======================================================================")
    print(" S.I.R.I.S. HYBRID NLP ENTITY EXTRACTION PIPELINE - E2E VERIFICATION")
    print("======================================================================")

    for i, fir in enumerate(SAMPLE_FIRS, 1):
        print(f"\n--- Scenario {i}: {fir['title']} ---")
        print(f"Narrative: {fir['narrative']}")
        res = graph_intelligence_service.extract_entities(fir['narrative'])
        print(f"\nExtraction Performance: {res['duration_ms']}ms")
        print(f"spaCy Active: {res['spacy_active']} (Model: {res['model_used']})")
        print(f"Tiers: {res['tiers']}")
        print("Extracted Entities:")
        print(json.dumps(res['entities'], indent=2))

if __name__ == "__main__":
    main()
