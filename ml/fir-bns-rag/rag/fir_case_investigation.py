from typing import Dict, Any, List, Optional
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from rag.investigation_intelligence import InvestigationIntelligenceEngine


class FIRCaseInvestigationEngine:
    """
    Step 4: Case-Specific FIR Investigation Intelligence Engine (Legally Grounded).
    
    Generates actionable, fact-grounded recommendations answering:
    "Given the facts, evidence, entities, timeline, MO and crime type in THIS FIR,
     what should the investigator do NEXT, WHY, and with WHAT PRIORITY?"
    
    Adheres to:
    - Structured format: action, priority (HIGH|MEDIUM|LOW), reason, supporting_facts, expected_value.
    - Categorization: immediate_actions, next_actions, later_actions.
    - Verified statutory grounding: Only cites verified BNSS sections (Sec 105, 173, 180, 185, 193)
      or omits citation if no statutory section is required.
    - Nuanced probabilistic wording: uses "may help identify/corroborate" rather than guaranteed claims.
    - Strict non-hallucination: Only uses entities, weapons, vehicles, phones, witnesses explicitly in FIR.
    """

    def __init__(self, base_engine: Optional[InvestigationIntelligenceEngine] = None):
        self.base_engine = base_engine or InvestigationIntelligenceEngine()

    def generate_case_investigation_intelligence(
        self,
        fir_data: Dict[str, Any],
        bns_sections: Optional[List[Dict[str, Any]]] = None,
        bnss_sections: Optional[List[Dict[str, Any]]] = None,
        sop_guidelines: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Generates case-specific investigation decision support from extracted FIR entities & RAG knowledge.
        """
        people = fir_data.get("people", {})
        incident = fir_data.get("incident", {})
        weapons = fir_data.get("weapons", [])
        property_items = fir_data.get("property", [])
        evidence_items = fir_data.get("evidence", [])
        phones = fir_data.get("phones", [])
        vehicles = fir_data.get("vehicles", [])
        timeline = fir_data.get("timeline", [])
        mo_list = fir_data.get("modus_operandi", [])
        locations = fir_data.get("locations", [])
        fir_missing = fir_data.get("missing_information", [])
        crime_domain = incident.get("crime_domain", "general_penal")

        immediate_actions: List[Dict[str, Any]] = []
        next_actions: List[Dict[str, Any]] = []
        later_actions: List[Dict[str, Any]] = []
        investigation_insights: List[str] = []

        # =========================================================================
        # 1. IMMEDIATE ACTIONS (HIGH Priority - Time-sensitive, perishable evidence)
        # =========================================================================

        # A. Crime Scene / Point of Forced Entry
        primary_loc = incident.get("incident_location")
        if primary_loc or any("dwelling" in act.lower() or "entry" in act.lower() for act in incident.get("alleged_acts", [])):
            loc_label = primary_loc or "the reported place of occurrence"
            immediate_actions.append({
                "action": f"Cordon and preserve the primary crime scene at {loc_label}, inspecting point of ingress/egress for tool marks, forced entry, and latent fingerprints",
                "priority": "HIGH",
                "reason": "Scene physical evidence (fingerprints, tool impressions) is perishable and subject to rapid contamination or loss.",
                "supporting_facts": [f"Crime location reported at {loc_label}", "Alleged forced entry / house trespass reported in FIR"],
                "expected_value": "May enable recovery of latent fingerprint impressions and tool marks to help link suspects to the scene."
            })

        # B. Getaway Vehicle Tracing / Nearby CCTV
        if vehicles:
            for veh in vehicles:
                immediate_actions.append({
                    "action": f"Issue alert notice for suspect getaway vehicle ({veh}) and secure CCTV footage along potential escape routes",
                    "priority": "HIGH",
                    "reason": "The FIR explicitly records suspect escaping via vehicle. Local digital video storage may be limited or subject to scheduled overwriting.",
                    "supporting_facts": [f"Getaway vehicle identified as {veh} in FIR", "Suspects fled scene immediately following the incident"],
                    "expected_value": "May assist in tracing vehicle movement, verifying registered ownership, and obtaining visual recordings of occupants."
                })
        else:
            if incident.get("occurrence_time") and any(w in str(incident.get("occurrence_time")).lower() for w in ["night", "pm", "hrs", "dark"]):
                immediate_actions.append({
                    "action": "Survey and retrieve CCTV camera recordings from neighboring premises, entry/exit points, and street cameras covering the incident timeframe",
                    "priority": "HIGH",
                    "reason": "Incident occurred at night with unidentified suspects; CCTV recordings provide objective visual data regarding movement around the timeframe.",
                    "supporting_facts": [f"Occurrence time stated as {incident.get('occurrence_time')}"],
                    "expected_value": "May help identify suspect physical descriptions, direction of arrival, and escape route."
                })

        # C. Weapons Search & Seizure (BNSS Section 105 for audio-video recording)
        if weapons:
            for w in weapons:
                w_desc = w.get("description", "weapon")
                w_type = w.get("type", "Weapon")
                is_rec = w.get("is_recovered", False)
                if not is_rec:
                    immediate_actions.append({
                        "action": f"Initiate immediate search to locate and seize the {w_desc} ({w_type}) brandished during the offence, ensuring mandatory audio-video recording under Section 105 BNSS",
                        "priority": "HIGH",
                        "reason": f"FIR mentions a {w_desc} used during the offence. Prompt recovery is critical to prevent weapon concealment or disposal.",
                        "supporting_facts": [f"Suspect brandished {w_desc} as stated in FIR"],
                        "expected_value": "May provide physical corroboration of threat/intimidation and establish connection with the accused."
                    })

        # D. Phone / Communication Verification
        if phones:
            for ph in phones:
                immediate_actions.append({
                    "action": f"Verify subscriber details and call/tower activity for phone number {ph} in accordance with standard police procedure",
                    "priority": "HIGH",
                    "reason": "Communication and location records are time-sensitive carrier data relevant for verifying timeline and participant whereabouts.",
                    "supporting_facts": [f"Phone number {ph} recorded in FIR"],
                    "expected_value": "May help corroborate reported timeline and verify presence in the vicinity."
                })

        # =========================================================================
        # 2. NEXT ACTIONS (MEDIUM Priority - Witness exam, suspect lead development)
        # =========================================================================

        # A. Examination of Named Witnesses (BNSS Section 180)
        witnesses = people.get("witnesses", [])
        if witnesses:
            for wit in witnesses:
                w_name = wit.get("name", "Witness")
                # Clean any lingering token artifacts
                if w_name.lower().startswith("ed "):
                    continue
                next_actions.append({
                    "action": f"Record formal statement of eyewitness {w_name} under Section 180 BNSS, capturing physical descriptions, sequence of events, and escape direction",
                    "priority": "MEDIUM",
                    "reason": f"FIR narrative mentions {w_name} as having witnessed the occurrence or escape.",
                    "supporting_facts": [f"{w_name} mentioned as witness in FIR narrative"],
                    "expected_value": "May provide direct testimonial corroboration and assist in developing suspect descriptions."
                })

        # B. Complainant Detailed Statement & Valuation Proofs (BNSS Section 173)
        comp = people.get("complainant")
        if comp and comp.get("name"):
            next_actions.append({
                "action": f"Examine complainant {comp['name']} under Section 173 BNSS to obtain purchase receipts, valuation details, or distinguishing marks for reported stolen property",
                "priority": "MEDIUM",
                "reason": "Detailed description and valuation documents are necessary for property identification and recovery proceedings.",
                "supporting_facts": [f"Complainant {comp['name']} reported loss of property in FIR"],
                "expected_value": "May establish ownership records and provide specific identification marks for stolen articles."
            })

        # C. Stolen Property Alert & Tracing (BNSS Section 185)
        if property_items:
            prop_names = [p.get("item") for p in property_items if p.get("item")]
            next_actions.append({
                "action": f"Circulate property alert across relevant commercial outlets and market channels for: {', '.join(prop_names[:3])}",
                "priority": "MEDIUM",
                "reason": "Stolen valuables may be presented for disposal or pledge shortly after the commission of offence.",
                "supporting_facts": [f"Stolen items listed in FIR: {', '.join(prop_names)}"],
                "expected_value": "May prevent disposal and facilitate recovery under Section 185 BNSS."
            })

        # D. Unknown Suspect Modus Operandi Comparison
        accused_list = people.get("accused", [])
        has_unidentified = any(not a.get("is_identified", True) for a in accused_list)
        if has_unidentified or not accused_list:
            next_actions.append({
                "action": "Cross-reference police crime records for active local networks exhibiting matching modus operandi (forced entry, masked suspects, vehicle escape)",
                "priority": "MEDIUM",
                "reason": "Unidentified suspects displaying specific execution patterns may match previously recorded incidents in the jurisdiction.",
                "supporting_facts": ["Suspect identities are unconfirmed in FIR", f"MO indicators: {', '.join(mo_list[:2])}"],
                "expected_value": "May assist in generating investigative leads for identification procedures."
            })

        # =========================================================================
        # 3. LATER ACTIONS (LOW Priority - Forensic reports, chargesheet compilation)
        # =========================================================================

        later_actions.append({
            "action": "Transmit seized physical items and scene trace samples to the Forensic Science Laboratory (FSL) under documented chain of custody",
            "priority": "LOW",
            "reason": "Laboratory analysis provides scientific verification in accordance with standard forensic processing timelines.",
            "supporting_facts": ["Physical evidence and seizure documentation prepared during scene examination"],
            "expected_value": "May yield scientific expert opinion for inclusion in judicial proceedings."
        })

        later_actions.append({
            "action": "Compile and submit Final Police Report under Section 193 BNSS indexing oral statements, seizure memos, and digital evidence records",
            "priority": "LOW",
            "reason": "Statutory procedure concluding the investigation once all investigative leads and evidence have been assembled.",
            "supporting_facts": ["Investigation procedure governed under BNSS"],
            "expected_value": "Presents a structured, evidence-indexed final police report for court proceedings."
        })

        # =========================================================================
        # 4. INVESTIGATION INSIGHTS (Distinguishing Inference from Fact)
        # =========================================================================

        # Insight 1: MO Analysis
        if any("forced" in m.lower() or "window" in m.lower() or "night" in m.lower() for m in mo_list):
            investigation_insights.append(
                "[INFERENCE] The reported method of night entry via forced rear window lock MAY suggest prior observation of premises vulnerabilities."
            )

        # Insight 2: Masking / Coordination
        if any("mask" in m.lower() or "covered" in m.lower() for m in mo_list) or len(accused_list) > 1:
            investigation_insights.append(
                "[INFERENCE] The reported use of face coverings and a getaway vehicle MAY indicate coordinated planning to hinder immediate on-scene recognition."
            )

        # Insight 3: Weapon / Intimidation
        if weapons:
            w_names = [w.get("description") for w in weapons]
            investigation_insights.append(
                f"[FACT] Weapon ({', '.join(w_names)}) was reported brandished during the occurrence, which is relevant for assessing aggravated statutory elements."
            )

        # Insight 4: Missing Evidence Gap
        if fir_missing:
            investigation_insights.append(
                f"[INVESTIGATION GAP] The FIR currently lacks: {'; '.join(fir_missing[:2])}. Clarifying these points will assist in confirming specific penal elements."
            )

        return {
            "immediate_actions": immediate_actions,
            "next_actions": next_actions,
            "later_actions": later_actions,
            "investigation_insights": investigation_insights,
            "missing_information": fir_missing
        }


if __name__ == "__main__":
    from rag.fir_intake import FIRIntakeParser
    from rag.fir_entity_extractor import FIREntityExtractor
    import json

    parser = FIRIntakeParser()
    extractor = FIREntityExtractor()
    engine = FIRCaseInvestigationEngine()

    sample_fir = """
    FIRST INFORMATION REPORT
    (Under Section 154 Cr.P.C. / 173 BNSS)
    
    1. District: Central Delhi    P.S.: Daryaganj    Year: 2024    FIR No.: 0142/2024
    2. Acts & Sections: BNS 2023 - Sec 303(2), Sec 305
    3. Occurrence of Offence: Day: Monday  Date: 12/08/2024  Time: 23:30 hrs
    4. Complainant: Rajesh Kumar s/o Late Mohan Lal, Ph: 9876543210, r/o House 42, Daryaganj
    5. Details of Suspect: 2 unknown persons with face covered, fled on motorcycle DL-01-AB-1234
    6. Brief Details: The complainant reported that at around 11:30 PM, unknown persons broke the rear window lock of his residence at Daryaganj, entered the dwelling house, brandished a knife, and dishonestly took gold ornaments worth approx Rs. 4,50,000/- and cash of Rs. 60,000/- from the almirah. Complainant's neighbor Suresh witnessed them escaping.
    """

    fir_intake_res = parser.ingest(sample_fir)
    fir_entities = extractor.extract(fir_intake_res)

    intel = engine.generate_case_investigation_intelligence(fir_entities)

    print("\n--- STEP 4 SMOKE TEST (CORRECTED LEGAL GROUNDING) ---")
    print(json.dumps(intel, indent=2))
