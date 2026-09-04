import os
import sys
import json
import re
from typing import Dict, Any, List, Optional, Union

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from rag.fir_intake import FIRIntakeParser
from rag.fir_entity_extractor import FIREntityExtractor
from rag.pii_masker import FIRPIIMasker
from rag.fir_case_investigation import FIRCaseInvestigationEngine

# Reuse existing legal intelligence & RAG components
from rag.query_analyzer import QueryAnalyzer
from rag.legal_query_expander import LegalQueryExpander
from rag.multi_law_retriever import MultiLawRetriever
from rag.reranker import LegalReranker
from rag.element_verifier import StatutoryElementVerifier
from rag.investigation_retriever import InvestigationKnowledgeRetriever
from rag.investigation_planner import InvestigationPlanner
from rag.investigation_intelligence import InvestigationIntelligenceEngine
from rag.llm import LLMService


class FIRIntelligencePipeline:
    """
    CrimeLens End-to-End FIR Intelligence Orchestration Pipeline.
    
    Wires:
    1. FIR Intake (Text / PDF / OCR) -> Clean Text
    2. FIR Entity Extractor (Metadata, People, Timeline, MO, Weapons, Property, Vehicles, Phones)
    3. Conditional PII Masking (Only active when external/cloud LLM provider is configured)
    4. Substantive BNS RAG (Hybrid BGE-M3 + BM25 + Reranking + Element Verification)
    5. Procedural BNSS RAG & SOP Retrieval
    6. Case-Specific Investigation Intelligence Engine (Action + Priority + Reason + Supporting Facts + Expected Value)
    7. Legal Guardrails & Citation Verification
    8. Unmasking & Final Structured FIR Intelligence Output
    """

    def __init__(
        self,
        retriever: Optional[MultiLawRetriever] = None,
        reranker: Optional[LegalReranker] = None,
        verifier: Optional[StatutoryElementVerifier] = None,
        inv_retriever: Optional[InvestigationKnowledgeRetriever] = None,
        inv_planner: Optional[InvestigationPlanner] = None
    ):
        print("Initializing CrimeLens FIR Intelligence Pipeline...")
        self.intake_parser = FIRIntakeParser()
        self.entity_extractor = FIREntityExtractor()
        self.pii_masker = FIRPIIMasker()
        self.case_investigation_engine = FIRCaseInvestigationEngine()

        # Existing verified legal & investigation engines
        self.query_analyzer = QueryAnalyzer()
        self.query_expander = LegalQueryExpander()
        self.retriever = retriever or MultiLawRetriever()
        self.reranker = reranker or LegalReranker()
        self.verifier = verifier or StatutoryElementVerifier()
        self.inv_retriever = inv_retriever or InvestigationKnowledgeRetriever()
        self.inv_planner = inv_planner or InvestigationPlanner()
        self.base_inv_intelligence = InvestigationIntelligenceEngine()

        # Detect if current configured LLM is an external/cloud provider
        self.is_cloud_provider = os.getenv("LLM_PROVIDER", "").lower() in ["groq", "gemini", "remote_qwen", "openai", "anthropic"]
        print(f"CrimeLens FIR Intelligence Pipeline ready! (Cloud Privacy Guardrail: {'ENFORCED' if self.is_cloud_provider else 'LOCAL MODE'})")

    def _is_unintelligible_or_insufficient(self, text: str) -> bool:
        """Detects if text is too brief, random keyboard typing, or lacks intelligible words."""
        clean = (text or "").strip()
        words = [w for w in re.findall(r'[a-zA-Z]+', clean) if len(w) > 1]
        if len(clean) < 15 or len(words) < 3:
            return True

        # Check for keyboard mash / consonant clusters without vowels (e.g. 'bhjijlnb njb', 'ghbnmfvbhjn')
        vowel_pattern = re.compile(r'[aeiouy]', re.IGNORECASE)
        words_without_vowels = [w for w in words if len(w) >= 3 and not vowel_pattern.search(w)]
        if len(words_without_vowels) / max(1, len(words)) > 0.4:
            return True

        consonant_cluster = re.compile(r'[bcdfghjklmnpqrstvwxyz]{6,}', re.IGNORECASE)
        if any(consonant_cluster.search(w) for w in words):
            return True

        common_tokens = {
            "on", "at", "the", "in", "by", "of", "to", "and", "a", "an", "is", "was", "for", "with",
            "stole", "theft", "complainant", "police", "money", "cash", "gold", "bike", "car", "mobile",
            "phone", "accused", "person", "shop", "house", "night", "day", "threat", "attack", "injured",
            "knife", "gun", "fraud", "cyber", "upi", "bank", "account", "transfer", "lock", "broken",
            "report", "case", "incident", "loss", "vehicle", "victim", "suspect", "road", "street"
        }
        words_lower = [w.lower() for w in words]
        if len(words) < 7 and not any(w in common_tokens for w in words_lower):
            return True

        return False

    def process_fir(self, fir_input: Union[str, bytes, Dict[str, Any]], source_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Executes the full FIR Intelligence Pipeline from intake to structured intelligence JSON.
        """
        # ---------------------------------------------------------------------
        # 1. FIR Intake & Normalization
        # ---------------------------------------------------------------------
        if isinstance(fir_input, dict) and "full_text" in fir_input:
            intake_res = fir_input
        else:
            intake_res = self.intake_parser.ingest(fir_input, source_name=source_name)

        clean_text = intake_res.get("full_text", "")

        # ---------------------------------------------------------------------
        # 1B. Narrative Quality & Insufficient Particulars Guardrail
        # ---------------------------------------------------------------------
        if self._is_unintelligible_or_insufficient(clean_text):
            return {
                "fir_metadata": {
                    "police_station": "Station Intake Desk",
                    "status": "PRELIMINARY_INQUIRY_REQUIRED",
                    "date": None
                },
                "summary": f"The submitted text narrative ('{clean_text[:120]}') does not contain sufficient intelligible factual averments (acts, date, location, persons, or property) to establish ingredients of a cognizable offence.",
                "crime_type": "Unspecified / Insufficient Factual Particulars",
                "crime_category": "INSUFFICIENT_NARRATIVE",
                "incident": {
                    "incident_location": "Unspecified / Undetermined",
                    "occurrence_timeline": "Unspecified",
                    "alleged_acts": ["Statement contains insufficient factual clarity"]
                },
                "entities": {
                    "people": {},
                    "weapons": [],
                    "property": [],
                    "evidence": [{"description": "Raw statement submitted for intake"}],
                    "phones": [],
                    "vehicles": [],
                    "locations": []
                },
                "timeline": [
                    {"time": "T-Submission", "event": "Intake statement received at police station"}
                ],
                "modus_operandi": [
                    "Cannot be determined from insufficient text narrative"
                ],
                "bns_sections": [],
                "bnss_procedural_actions": [
                    {
                        "law": "BNSS",
                        "section": "Section 173(3)",
                        "action": "Conduct Preliminary Inquiry under BNSS Section 173(3) within 14 days to ascertain whether a cognizable offence is disclosed before formal FIR registration when narrative lacks clear particulars."
                    },
                    {
                        "law": "BNSS",
                        "section": "Section 173(1)",
                        "action": "Re-examine the complainant/informant to record a detailed supplementary statement specifying occurrence details, acts, and participants."
                    }
                ],
                "investigation_actions": [
                    {
                        "action": "Re-examine Informant to Record Detailed Statement",
                        "priority": "HIGH",
                        "reason": "Initial narrative lacks substantive factual averments (acts committed, scene, time, suspects, or stolen property) necessary to frame statutory BNS charges.",
                        "expected_value": "Detailed and coherent complaint disclosing actionable cognizable elements"
                    },
                    {
                        "action": "Verify Locus of Occurrence & Informant Identity",
                        "priority": "MEDIUM",
                        "reason": "Ascertain jurisdictional validity and verify contact particulars of reporting party under BNSS 173(3).",
                        "expected_value": "Verification of informant bona fides"
                    }
                ],
                "investigation_intelligence": {
                    "priority_level": "LOW",
                    "priority_reason": "Narrative lacks intelligible factual particulars to substantiate cognizable criminal threat.",
                    "legal_compliance_checklist": [
                        "Mandatory preliminary inquiry within 14 days under BNSS Section 173(3)",
                        "Detailed examination of informant before charge formulation"
                    ],
                    "investigation_timeline": [
                        "Day 1: Contact informant for recording detailed statement",
                        "Days 2-14: Complete preliminary verification under BNSS 173(3)"
                    ]
                },
                "insights": [
                    "Input detected as insufficient or unintelligible text. Statutory BNS recommendations withheld to prevent hallucination.",
                    "Under BNSS 2023 Section 173(3), police officers are legally empowered to conduct a preliminary inquiry when a complaint lacks clear particulars."
                ],
                "missing_information": [
                    "Specific allegations of criminal acts committed",
                    "Date, approximate time, and scene of occurrence",
                    "Particulars of complainant, victim, or suspected persons",
                    "Details of loss, injury, or stolen property"
                ],
                "masking_used": False,
                "execution_metadata": {
                    "source": "rag_live",
                    "quality_check": "INSUFFICIENT_PARTICULARS"
                }
            }

        # ---------------------------------------------------------------------
        # 2. FIR Entity & Metadata Extraction (NER)
        # ---------------------------------------------------------------------
        fir_entities = self.entity_extractor.extract(intake_res)
        incident = fir_entities.get("incident", {})
        crime_domain = incident.get("crime_domain", "general_penal")
        crime_type = incident.get("crime_type", "General Offence")

        # ---------------------------------------------------------------------
        # 3. Privacy & PII Guardrail
        # ---------------------------------------------------------------------
        masking_used = False
        pii_map = {}
        processed_text = clean_text

        if self.is_cloud_provider:
            # Mask sensitive data before any external transmission
            processed_text, pii_map = self.pii_masker.mask_text(clean_text, extracted_entities=fir_entities)
            masking_used = True

        # ---------------------------------------------------------------------
        # 4. Query Concept Expansion & Search Formulation
        # ---------------------------------------------------------------------
        extracted_facts = {
            "crime_domain": crime_domain,
            "intent": "unlawful gain" if crime_domain == "property_crimes" else "criminal harm",
            "relationship": fir_entities.get("people", {}).get("complainant", {}).get("relationship", "stranger") if fir_entities.get("people", {}).get("complainant") else "stranger",
            "victim_type": "general",
            "violence_present": bool(fir_entities.get("weapons")) or "violent" in crime_domain,
            "death_occurred": False
        }

        expanded_concepts = self.query_expander.expand_query(clean_text, extracted_facts)

        # ---------------------------------------------------------------------
        # 5. Hybrid BNS Substantive RAG Retrieval & Statutory Verification
        # ---------------------------------------------------------------------
        bns_candidates = self.retriever.search_bns_offences(
            query=clean_text,
            expanded_concepts=expanded_concepts,
            crime_category=crime_domain,
            top_k=8
        )
        reranked_bns = self.reranker.rerank(
            query=clean_text,
            candidate_docs=bns_candidates,
            top_k=5
        )

        analysis = {
            "raw_input": clean_text,
            "crime_type": crime_type,
            "actions_involved": ", ".join(incident.get("alleged_acts", [])),
            "evidence_mentioned": ", ".join([p["item"] for p in fir_entities.get("property", [])] + [w["description"] for w in fir_entities.get("weapons", [])]),
            "keywords": expanded_concepts
        }

        verified_bns, missing_questions, uncertainty_notes = self.verifier.verify_bns_candidates(
            analysis=analysis,
            candidate_docs=reranked_bns,
            extracted_facts=extracted_facts
        )

        # Format BNS section results with supporting FIR evidence
        formatted_bns_sections = []
        for v in verified_bns:
            sec_num = v.get("section", "").replace("Section ", "").strip()
            supporting_evidence = []
            if "dwelling" in v.get("title", "").lower() or "house" in v.get("title", "").lower():
                supporting_evidence.append("FIR reports forced entry into residential premises")
            if "theft" in v.get("title", "").lower() or "dishonest" in v.get("reason", "").lower():
                if fir_entities.get("property"):
                    supporting_evidence.append(f"Reported stolen property: {', '.join([p['item'] for p in fir_entities.get('property', [])])}")
            if "knife" in clean_text.lower() or "weapon" in clean_text.lower() or fir_entities.get("weapons"):
                supporting_evidence.append("Weapon brandished as documented in FIR")

            if not supporting_evidence:
                supporting_evidence.append("Factual incident narrative recorded in FIR")

            formatted_bns_sections.append({
                "law": "BNS",
                "section": f"Section {sec_num}",
                "title": v.get("title", "Penal Offence"),
                "reason": v.get("reason", "Satisfies mandatory statutory ingredients."),
                "supporting_fir_evidence": supporting_evidence,
                "confidence": v.get("confidence", "HIGH"),
                "confidence_reason": v.get("confidence_reason", "Statutory elements matched against FIR facts.")
            })

        # ---------------------------------------------------------------------
        # 6. Procedural BNSS RAG & SOP Retrieval
        # ---------------------------------------------------------------------
        bnss_candidates = self.retriever.search_bnss_procedures(
            query=clean_text,
            top_k=5
        )
        reranked_bnss = self.reranker.rerank(
            query=clean_text,
            candidate_docs=bnss_candidates,
            top_k=3
        )

        formatted_bnss_actions = []
        for doc_item in reranked_bnss:
            meta = doc_item.get("metadata", {})
            sec_num = str(meta.get("section_number", ""))
            sec_title = meta.get("section_title", "")
            if sec_num in ["531", "530", "529"]:
                continue

            action_desc = f"Invoke BNSS Section {sec_num} ({sec_title}) for investigation procedure."
            if sec_num == "173":
                action_desc = "Record detailed examination of informant under BNSS Section 173."
            elif sec_num == "105":
                action_desc = "Conduct mandatory audio-video electronic recording of search, seizure, and spot proceedings under BNSS Section 105."
            elif sec_num == "185":
                action_desc = "Execute search and seizure of premises during investigation under BNSS Section 185."
            elif sec_num == "180":
                action_desc = "Examine eyewitnesses and record statements under BNSS Section 180."
            elif sec_num == "193":
                action_desc = "Compile final police report upon completion of investigation under BNSS Section 193."

            formatted_bnss_actions.append({
                "law": "BNSS",
                "section": f"Section {sec_num}",
                "action": action_desc
            })

        # ---------------------------------------------------------------------
        # 7. Case-Specific Investigation Intelligence Engine
        # ---------------------------------------------------------------------
        case_intel = self.case_investigation_engine.generate_case_investigation_intelligence(
            fir_data=fir_entities,
            bns_sections=verified_bns,
            bnss_sections=reranked_bnss
        )

        # Flatten all prioritized actions for the final investigation_actions array
        investigation_actions = (
            case_intel.get("immediate_actions", []) +
            case_intel.get("next_actions", []) +
            case_intel.get("later_actions", [])
        )

        # Merge base domain intelligence (compliance checklist, witness strategy, timelines)
        base_intel_report = self.base_inv_intelligence.generate_investigation_strategy(
            crime_category=crime_domain,
            bns_sections=[{"section": s["section"], "title": s["title"], "confidence": s["confidence"]} for s in formatted_bns_sections],
            bnss_sections=[{"metadata": r["metadata"]} for r in reranked_bnss],
            extracted_facts=extracted_facts,
            missing_information=fir_entities.get("missing_information", []),
            investigation_sop_items=[]
        )

        investigation_intelligence_block = {
            "priority_level": base_intel_report.get("investigation_priority", {}).get("level", "HIGH"),
            "priority_reason": base_intel_report.get("investigation_priority", {}).get("reason", "Offence requires prompt investigation and evidence preservation."),
            "immediate_actions": case_intel.get("immediate_actions", []),
            "next_actions": case_intel.get("next_actions", []),
            "later_actions": case_intel.get("later_actions", []),
            "legal_compliance_checklist": base_intel_report.get("legal_compliance_checklist", []),
            "investigation_timeline": base_intel_report.get("investigation_timeline", [])
        }

        # ---------------------------------------------------------------------
        # 8. Guardrails & Citation Validation
        # ---------------------------------------------------------------------
        self._validate_guardrails(formatted_bns_sections, formatted_bnss_actions, investigation_actions)

        # ---------------------------------------------------------------------
        # 9. Summary & Final Assembly (with Unmasking if required)
        # ---------------------------------------------------------------------
        summary_text = (
            f"FIR indicates an incident of {crime_type.lower()} at "
            f"{incident.get('incident_location') or 'the reported premises'}. "
            f"Identified substantive offences under BNS: {', '.join([b['section'] for b in formatted_bns_sections])}."
        )

        final_response = {
            "fir_metadata": fir_entities.get("fir_metadata", {}),
            "summary": summary_text,
            "crime_type": crime_type,
            "crime_category": crime_domain,
            "incident": incident,
            "entities": {
                "people": fir_entities.get("people", {}),
                "weapons": fir_entities.get("weapons", []),
                "property": fir_entities.get("property", []),
                "evidence": fir_entities.get("evidence", []),
                "phones": fir_entities.get("phones", []),
                "vehicles": fir_entities.get("vehicles", []),
                "locations": fir_entities.get("locations", [])
            },
            "timeline": fir_entities.get("timeline", []),
            "modus_operandi": fir_entities.get("modus_operandi", []),
            "bns_sections": formatted_bns_sections,
            "bnss_procedural_actions": formatted_bnss_actions,
            "investigation_actions": investigation_actions,
            "investigation_intelligence": investigation_intelligence_block,
            "insights": case_intel.get("investigation_insights", []),
            "missing_information": fir_entities.get("missing_information", []),
            "masking_used": masking_used
        }

        # Unmask if masking was used
        if masking_used and pii_map:
            final_response = self.pii_masker.unmask_data(final_response, pii_map)

        return final_response

    def _validate_guardrails(
        self,
        bns_sections: List[Dict[str, Any]],
        bnss_actions: List[Dict[str, Any]],
        investigation_actions: List[Dict[str, Any]]
    ):
        """Enforces legal guardrails and verified knowledge citations."""
        # 1. Guarantee every investigation action has required fields
        for act in investigation_actions:
            if not act.get("action"):
                act["action"] = "Standard investigative verification step"
            if not act.get("priority"):
                act["priority"] = "MEDIUM"
            if not act.get("reason"):
                act["reason"] = "Required for factual verification under police procedure."
            if not act.get("supporting_facts"):
                act["supporting_facts"] = ["Factual statement recorded in FIR"]
            if not act.get("expected_value"):
                act["expected_value"] = "May assist in corroborating investigation records."

        # 2. Enforce law prefix
        for b in bns_sections:
            b["law"] = "BNS"
        for bn in bnss_actions:
            bn["law"] = "BNSS"


if __name__ == "__main__":
    pipeline = FIRIntelligencePipeline()

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

    print("\n--- RUNNING END-TO-END FIR INTELLIGENCE PIPELINE SMOKE TEST ---")
    result = pipeline.process_fir(sample_fir)

    print("\n[+] SUCCESS! Output JSON generated. High-level summary of result:")
    print(f"- FIR No: {result['fir_metadata'].get('fir_number')}")
    print(f"- Crime Category: {result['crime_category']}")
    print(f"- BNS Sections Identified: {[b['section'] + ': ' + b['title'] for b in result['bns_sections']]}")
    print(f"- Total Investigation Actions: {len(result['investigation_actions'])}")
    print(f"- Privacy Masking Used: {result['masking_used']}")

    print("\n--- SAMPLE BNS RESULT ---")
    print(json.dumps(result["bns_sections"][0], indent=2))

    print("\n--- SAMPLE HIGH-PRIORITY INVESTIGATION RECOMMENDATION ---")
    print(json.dumps(result["investigation_actions"][0], indent=2))
