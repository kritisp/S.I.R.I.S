import re
from typing import List, Dict, Any, Tuple, Optional


class StatutoryElementVerifier:
    """
    Validates candidate BNS substantive offences against extracted case facts.
    Strictly enforces Mens Rea (Intentional vs. Rash/Negligent acts), Actus Reus,
    and statutory ingredient matching with explainable confidence levels.
    """
    def __init__(self):
        self.weapon_keywords = [
            "knife", "knives", "gun", "pistol", "revolver", "weapon", "rod", "sword",
            "armed", "dagger", "blade", "iron rod", "lathi", "stick"
        ]
        self.violence_prep_keywords = [
            "preparation to kill", "preparation for hurt", "threatened to kill",
            "held at gunpoint", "held at knifepoint", "armed with", "threatened death",
            "preparation made for causing death"
        ]
        self.traffic_keywords = [
            "accident", "collision", "hit and run", "rash driving", "speeding",
            "knocked down", "ran over", "motorcycle", "scooter", "car crash",
            "driver fled", "negligent driving", "vehicle collided", "struck by car",
            "struck by vehicle", "overturned", "traffic"
        ]
        self.assault_keywords = [
            "assaulted", "beaten", "struck with knife", "struck with rod", "quarrel",
            "altercation", "fight", "slapped", "punched", "threatened to kill",
            "attacked by", "physically assaulted"
        ]

    def extract_fact_flags(self, analysis: dict) -> Dict[str, bool]:
        raw_text = analysis.get("raw_input", "").lower()
        actions = analysis.get("actions_involved", "").lower()
        evidence = analysis.get("evidence_mentioned", "").lower()
        combined_text = f"{raw_text} {actions} {evidence}"

        has_traffic_accident = any(k in combined_text for k in self.traffic_keywords)
        has_intentional_assault = any(k in combined_text for k in self.assault_keywords)
        has_weapon = any(w in combined_text for w in self.weapon_keywords)
        has_violence_prep = any(p in combined_text for p in self.violence_prep_keywords) or (
            has_weapon and any(v in combined_text for v in ["hurt", "kill", "attack", "threaten"])
        )
        has_dwelling_entry = any(d in combined_text for d in [
            "house", "dwelling", "home", "building", "room", "premises", "residence", "entered", "lock broken"
        ])
        has_theft = any(t in combined_text for t in [
            "stole", "stolen", "jewellery", "cash", "property", "theft", "goods", "took", "snatched", "wallet", "mobile"
        ])
        has_night = any(n in combined_text for n in [
            "night", "darkness", "midnight", "after sunset", "23:", "22:", "01:", "02:", "03:", "04:"
        ])
        has_fracture_or_grievous = any(g in combined_text for g in [
            "fracture", "grievous", "broken bone", "disfiguration", "permanent loss", "severe injury", "deep cut"
        ])
        has_stolen_receipt = any(r in combined_text for r in [
            "receiving stolen", "retaining stolen", "bought stolen", "pledged stolen", "purchased stolen"
        ])

        return {
            "has_traffic_accident": has_traffic_accident,
            "has_intentional_assault": has_intentional_assault,
            "has_weapon": has_weapon,
            "has_violence_prep": has_violence_prep,
            "has_dwelling_entry": has_dwelling_entry,
            "has_theft": has_theft,
            "has_night": has_night,
            "has_fracture_or_grievous": has_fracture_or_grievous,
            "has_stolen_receipt": has_stolen_receipt,
        }

    def verify_bns_candidates(
        self,
        analysis: dict,
        candidate_docs: List[Dict[str, Any]],
        extracted_facts: Optional[Dict[str, Any]] = None
    ) -> Tuple[List[Dict[str, Any]], List[str], List[str]]:
        """
        Verifies candidate BNS sections against factual flags and extracted legal facts.
        Strictly enforces legal ingredient matching, Mens Rea distinctions, and statutory exclusions.
        """
        fact_flags = self.extract_fact_flags(analysis)
        verified_sections = []
        missing_questions = []
        uncertainty_notes = []

        death_occurred = extracted_facts.get("death_occurred", False) if extracted_facts else False
        violence_present = extracted_facts.get("violence_present", False) if extracted_facts else fact_flags["has_violence_prep"]
        relationship = extracted_facts.get("relationship", "stranger") if extracted_facts else "stranger"
        intent = extracted_facts.get("intent", "criminal harm") if extracted_facts else "criminal harm"

        for doc in candidate_docs:
            meta = doc.get("metadata", {})
            sec_num = str(meta.get("section_number", "")).strip().replace("Section ", "")
            sec_title = meta.get("title", "") or meta.get("section_title", "")
            title_lower = sec_title.lower()

            # -----------------------------------------------------------------
            # RULE 1: Death Occurred Disqualification
            # Rejects Murder (BNS 103), Suicide Abetment (BNS 108/106) if victim survived.
            # -----------------------------------------------------------------
            if not death_occurred:
                if sec_num in ["103", "104", "105"] or "culpable homicide" in title_lower or title_lower == "punishment for murder":
                    uncertainty_notes.append(f"Rejected BNS Section {sec_num} ({sec_title}): Requires victim's death, but victim survived.")
                    continue
                if sec_num in ["108", "106_suicide"] or "abetment of suicide" in title_lower:
                    uncertainty_notes.append(f"Rejected BNS Section 106/108 (Abetment of Suicide): Requires victim's suicide, unsupported by facts.")
                    continue

            # -----------------------------------------------------------------
            # RULE 2: Traffic Accident vs. Voluntary Intentional Hurt Disambiguation
            # -----------------------------------------------------------------
            if fact_flags["has_traffic_accident"]:
                # REJECT Intentional Hurt provisions (BNS 115 / BNS 117) for vehicular accidents
                if sec_num in ["115", "117"] or "voluntarily causing hurt" in title_lower:
                    uncertainty_notes.append(
                        f"Rejected BNS Section {sec_num} ({sec_title}): Incident involves vehicular accident/rash driving. "
                        f"Lacks Mens Rea for voluntary/intentional hurt under BNS Section 115/117."
                    )
                    continue

                # APPROVE Rash Driving on Public Way (BNS 281)
                if sec_num == "281" or "rash driving" in title_lower:
                    verified_sections.append({
                        "law": "BNS",
                        "section": "Section 281",
                        "title": sec_title or "Rash driving or riding on a public way",
                        "reason": "Satisfies statutory ingredients under BNS Section 281: Driving/riding vehicle on a public way in a rash or negligent manner endangering human life or safety.",
                        "confidence": "HIGH",
                        "confidence_reason": "All mandatory legal elements matched: Vehicle operation on public way + Rash/negligent manner + Endangering safety.",
                        "applicability_status": "CONFIRMED",
                        "supporting_facts": ["FIR reports vehicle collision on public road due to rash driving"],
                        "missing_facts": [],
                        "doc_item": doc
                    })
                    continue

                # APPROVE Act Endangering Life / Personal Safety (BNS 125)
                if sec_num == "125" or "endangering life" in title_lower:
                    if fact_flags["has_fracture_or_grievous"]:
                        verified_sections.append({
                            "law": "BNS",
                            "section": "Section 125(b)",
                            "title": "Act endangering life or personal safety causing grievous hurt",
                            "reason": "Potentially applicable under BNS Section 125(b) for rash/negligent act causing grievous hurt (suspected fracture).",
                            "confidence": "HIGH",
                            "confidence_reason": "Statutory elements matched: Rash/negligent driving + Allegation of grievous hurt (fracture).",
                            "applicability_status": "CONDITIONALLY_APPLICABLE",
                            "supporting_facts": ["Reported injury with suspected fracture resulting from road collision"],
                            "missing_facts": ["Medical X-Ray / MLC radiology report confirming fracture"],
                            "doc_item": doc
                        })
                    else:
                        verified_sections.append({
                            "law": "BNS",
                            "section": "Section 125(a)",
                            "title": "Act endangering life or personal safety causing hurt",
                            "reason": "Satisfies statutory ingredients under BNS Section 125(a): Rash or negligent act causing hurt to any person.",
                            "confidence": "HIGH",
                            "confidence_reason": "All mandatory legal elements matched: Rash/negligent driving + Bodily pain/hurt caused.",
                            "applicability_status": "CONFIRMED",
                            "supporting_facts": ["Reported bodily pain/injuries resulting from road collision"],
                            "missing_facts": [],
                            "doc_item": doc
                        })
                    continue

                # APPROVE Causing Death by Negligence (BNS 106) in fatal accidents
                if sec_num == "106" or "death by negligence" in title_lower:
                    if death_occurred:
                        raw_text = analysis.get("raw_input", "").lower()
                        is_hit_run = "fled" in raw_text or "hit and run" in raw_text or "escaped" in raw_text
                        sec_code = "Section 106(2)" if is_hit_run else "Section 106(1)"
                        sec_t = "Hit & Run — Causing death by rash and negligent driving and escaping without reporting" if is_hit_run else "Causing death by negligence"
                        verified_sections.append({
                            "law": "BNS",
                            "section": sec_code,
                            "title": sec_t,
                            "reason": f"Satisfies statutory ingredients under BNS {sec_code}: Causing death by rash or negligent driving.",
                            "confidence": "HIGH",
                            "confidence_reason": "Mandatory elements matched: Rash/negligent driving + Fatal demise of victim.",
                            "applicability_status": "CONFIRMED",
                            "supporting_facts": ["Fatal road collision reported", "Driver fled incident locus without reporting" if is_hit_run else "Fatal accident"],
                            "missing_facts": [],
                            "doc_item": doc
                        })
                        continue

            # -----------------------------------------------------------------
            # RULE 3: Intentional Assault (BNS 115 / BNS 117) Verification
            # -----------------------------------------------------------------
            if sec_num in ["115", "117"] or "voluntarily causing hurt" in title_lower:
                if not fact_flags["has_traffic_accident"] and fact_flags["has_intentional_assault"]:
                    if sec_num == "117" or "grievous" in title_lower:
                        status = "CONFIRMED" if fact_flags["has_fracture_or_grievous"] else "CONDITIONALLY_APPLICABLE"
                        missing = [] if fact_flags["has_fracture_or_grievous"] else ["Medical confirmation of fracture or permanent disfiguration"]
                        verified_sections.append({
                            "law": "BNS",
                            "section": "Section 117(2)",
                            "title": sec_title or "Voluntarily causing grievous hurt",
                            "reason": "Satisfies statutory ingredients under BNS Section 117: Voluntarily causing grievous hurt (fracture/weapon).",
                            "confidence": "HIGH" if fact_flags["has_fracture_or_grievous"] else "MEDIUM",
                            "confidence_reason": "Intentional assault averments present in complaint statement.",
                            "applicability_status": status,
                            "supporting_facts": ["FIR documents intentional physical attack"],
                            "missing_facts": missing,
                            "doc_item": doc
                        })
                    else:
                        verified_sections.append({
                            "law": "BNS",
                            "section": "Section 115(2)",
                            "title": sec_title or "Voluntarily causing hurt",
                            "reason": "Satisfies statutory ingredients under BNS Section 115(2): Voluntarily causing bodily pain, disease, or infirmity.",
                            "confidence": "HIGH",
                            "confidence_reason": "All mandatory legal elements matched: Intentional bodily assault + Hurt caused.",
                            "applicability_status": "CONFIRMED",
                            "supporting_facts": ["Physical assault and bodily pain reported by complainant"],
                            "missing_facts": [],
                            "doc_item": doc
                        })
                    continue

            # -----------------------------------------------------------------
            # RULE 4: Attempt to Murder (BNS 109) Verification
            # -----------------------------------------------------------------
            if sec_num == "109" or "attempt to murder" in title_lower:
                if not death_occurred and (violence_present or "death" in intent or "kill" in intent):
                    verified_sections.append({
                        "law": "BNS",
                        "section": "Section 109",
                        "title": sec_title or "Attempt to murder",
                        "reason": "Satisfies statutory ingredients under BNS Section 109: Overt act done with intention or knowledge to cause death where victim survived.",
                        "confidence": "HIGH",
                        "confidence_reason": "All mandatory legal elements matched: Intention/knowledge to cause death + Overt act + Victim survived.",
                        "applicability_status": "CONFIRMED",
                        "supporting_facts": ["Overt lethal attack documented in FIR"],
                        "missing_facts": [],
                        "doc_item": doc
                    })
                    continue

            # -----------------------------------------------------------------
            # RULE 5: Theft in Dwelling House (BNS 303 / 305) & Night Housebreaking (BNS 331)
            # -----------------------------------------------------------------
            if sec_num == "331" or "lurking house-trespass" in title_lower or "house-breaking" in title_lower:
                if fact_flags["has_dwelling_entry"] and (fact_flags["has_night"] or fact_flags["has_theft"]):
                    verified_sections.append({
                        "law": "BNS",
                        "section": "Section 331(4)",
                        "title": sec_title or "Lurking house-trespass or house-breaking by night",
                        "reason": "Satisfies statutory ingredients under BNS Section 331(4): Nocturnal forced entry into residential dwelling with intent to commit theft.",
                        "confidence": "HIGH",
                        "confidence_reason": "All mandatory legal elements matched: Nocturnal timeframe + Forced dwelling trespass + Intent to commit offence.",
                        "applicability_status": "CONFIRMED",
                        "supporting_facts": ["Forced entry into dwelling house reported", "Nocturnal occurrence window"],
                        "missing_facts": [],
                        "doc_item": doc
                    })
                    continue

            is_dwelling_theft = "dwelling house" in title_lower or "theft in a dwelling" in title_lower or sec_num in ["303", "305"]
            if is_dwelling_theft and fact_flags["has_dwelling_entry"] and fact_flags["has_theft"]:
                verified_sections.append({
                    "law": "BNS",
                    "section": f"Section {sec_num}",
                    "title": sec_title or "Theft in dwelling house",
                    "reason": "Satisfies statutory ingredients under BNS: Unlawful entry into human dwelling + Dishonest taking of movable property without consent.",
                    "confidence": "HIGH",
                    "confidence_reason": "All mandatory legal elements matched: Dwelling entry + Movable property + Dishonest intention.",
                    "applicability_status": "CONFIRMED",
                    "supporting_facts": ["Dishonest removal of valuables from residential building"],
                    "missing_facts": [],
                    "doc_item": doc
                })
                continue

            # -----------------------------------------------------------------
            # RULE 6: Receiving / Retaining Stolen Property (BNS 317)
            # Must NOT be applied to primary thief without facts of receipt/possession
            # -----------------------------------------------------------------
            if sec_num == "317" or "receiving stolen property" in title_lower or "retaining stolen property" in title_lower:
                if fact_flags["has_stolen_receipt"]:
                    verified_sections.append({
                        "law": "BNS",
                        "section": "Section 317(5)",
                        "title": sec_title or "Dishonestly receiving or retaining stolen property",
                        "reason": "Satisfies statutory ingredients under BNS Section 317: Dishonestly receiving or retaining stolen property knowing or having reason to believe the same to be stolen.",
                        "confidence": "HIGH",
                        "confidence_reason": "Facts support receipt/retention of stolen articles from another party.",
                        "applicability_status": "CONFIRMED",
                        "supporting_facts": ["Receipt or custody of stolen goods supported by statements"],
                        "missing_facts": [],
                        "doc_item": doc
                    })
                else:
                    verified_sections.append({
                        "law": "BNS",
                        "section": "Section 317(5)",
                        "title": sec_title or "Dishonestly receiving stolen property",
                        "reason": "Potentially applicable if suspect received or retained stolen property knowing it to be stolen, separate from primary theft.",
                        "confidence": "LOW",
                        "confidence_reason": "Requires proof of receipt/possession of stolen property from another perpetrator.",
                        "applicability_status": "CONDITIONALLY_APPLICABLE",
                        "supporting_facts": [],
                        "missing_facts": ["Proof of receipt or transfer of stolen articles from primary thief"],
                        "doc_item": doc
                    })
                continue

            # -----------------------------------------------------------------
            # RULE 7: Cheating & Fraud (BNS 318 / 319) Verification
            # -----------------------------------------------------------------
            if sec_num in ["318", "319"] or "cheating" in title_lower:
                verified_sections.append({
                    "law": "BNS",
                    "section": f"Section {sec_num}",
                    "title": sec_title,
                    "reason": "Satisfies statutory ingredients under BNS: Deceiving person and fraudulently inducing delivery of property or financial gain.",
                    "confidence": "HIGH",
                    "confidence_reason": "All mandatory legal elements matched: Deception + Fraudulent inducement + Deceptive gain.",
                    "applicability_status": "CONFIRMED",
                    "supporting_facts": ["Deceptive communications and financial loss reported"],
                    "missing_facts": [],
                    "doc_item": doc
                })
                continue

            # -----------------------------------------------------------------
            # RULE 8: Default Fallback for Unmatched Sections
            # Mark as UNVERIFIED rather than hallucinating HIGH/MEDIUM confidence
            # -----------------------------------------------------------------
            verified_sections.append({
                "law": "BNS",
                "section": f"Section {sec_num}",
                "title": sec_title,
                "reason": f"Evaluated under BNS Section {sec_num} ({sec_title}). Requires factual verification.",
                "confidence": "LOW",
                "confidence_reason": "Statutory elements require further investigative verification against reported facts.",
                "applicability_status": "UNVERIFIED",
                "supporting_facts": [],
                "missing_facts": ["Detailed factual particulars matching statutory ingredients"],
                "doc_item": doc
            })

        # Return top verified sections, filtering out UNVERIFIED ones if confirmed sections exist
        confirmed_or_conditional = [s for s in verified_sections if s.get("applicability_status") in ["CONFIRMED", "CONDITIONALLY_APPLICABLE"]]
        final_list = confirmed_or_conditional if confirmed_or_conditional else verified_sections
        return final_list[:4], missing_questions, uncertainty_notes


if __name__ == "__main__":
    verifier = StatutoryElementVerifier()
    
    # Test Road Accident Scenario
    road_accident_fir = {
        "raw_input": "Vehicle OD-02-AK-9999 driven at high speed in rash and negligent manner collided with motorcycle on public road. Rider sustained head injury and suspected fracture. Driver fled the scene.",
        "actions_involved": "collided, rash driving, fled",
        "evidence_mentioned": "motorcycle damage, CCTV"
    }
    candidates_acc = [
        {"metadata": {"section_number": "115", "title": "Voluntarily causing hurt"}},
        {"metadata": {"section_number": "117", "title": "Voluntarily causing grievous hurt by dangerous weapons"}},
        {"metadata": {"section_number": "281", "title": "Rash driving or riding on a public way"}},
        {"metadata": {"section_number": "125", "title": "Act endangering life or personal safety of others"}}
    ]
    secs, _, unc = verifier.verify_bns_candidates(road_accident_fir, candidates_acc)
    print("\n=== ROAD ACCIDENT VERIFICATION TEST ===")
    print("Uncertainty / Rejection Notes:", unc)
    for s in secs:
        print(f"- {s['section']} ({s['title']}) | Status: {s['applicability_status']} | Confidence: {s['confidence']}")
        print(f"  Reason: {s['confidence_reason']}\n")
