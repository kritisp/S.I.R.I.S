import os
import sys
import json
from typing import Dict, Any, Optional, List

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from rag.query_analyzer import QueryAnalyzer
from rag.legal_fact_extractor import LegalFactExtractor
from rag.legal_query_expander import LegalQueryExpander
from rag.multi_law_retriever import MultiLawRetriever
from rag.reranker import LegalReranker
from rag.element_verifier import StatutoryElementVerifier
from rag.investigation_retriever import InvestigationKnowledgeRetriever
from rag.investigation_planner import InvestigationPlanner
from rag.investigation_intelligence import InvestigationIntelligenceEngine
from rag.prompts import POLICE_ASSISTANT_SYSTEM_PROMPT, build_dual_law_investigation_prompt
from rag.llm import LLMService


class LegalIntelligenceAssistant:
    """
    CrimeLens Legal Intelligence Assistant Engine.
    
    Multi-Stage Intelligence Pipeline:
    1. Legal Fact Extraction Layer (`rag/legal_fact_extractor.py`)
    2. Legal Query Concept Expansion Layer (`rag/legal_query_expander.py`)
    3. Multi-Factor Hybrid BNS Retrieval (BGE-M3 + BM25 + Expanded Concepts)
    4. Statutory Element Verification (Fact-vs-Element matching & exclusions)
    5. BNSS Procedural Action RAG
    6. Investigation SOP RAG & SOP Plan Generation
    7. Investigation Intelligence Decision Support (`rag/investigation_intelligence.py`)
    8. LLM Reasoning Report Generation (Ollama Qwen2.5 7B / Remote Service)
    """
    def __init__(
        self,
        retriever: Optional[MultiLawRetriever] = None,
        reranker: Optional[LegalReranker] = None,
        verifier: Optional[StatutoryElementVerifier] = None,
        inv_retriever: Optional[InvestigationKnowledgeRetriever] = None,
        inv_planner: Optional[InvestigationPlanner] = None
    ):
        print("Initializing CrimeLens Multi-Law Legal Intelligence Assistant Engine...")
        self.query_analyzer = QueryAnalyzer()
        self.fact_extractor = LegalFactExtractor()
        self.query_expander = LegalQueryExpander()
        self.retriever = retriever or MultiLawRetriever()
        self.reranker = reranker or LegalReranker()
        self.verifier = verifier or StatutoryElementVerifier()
        self.inv_retriever = inv_retriever or InvestigationKnowledgeRetriever()
        self.inv_planner = inv_planner or InvestigationPlanner()
        self.inv_intelligence = InvestigationIntelligenceEngine()
        print("CrimeLens Legal Intelligence Assistant Engine initialized successfully!")

    def process_case(self, user_input: str) -> Dict[str, Any]:
        """
        Processes case input through Legal Intelligence Pipeline and returns structured JSON output.
        """
        print(f"\n[LegalAssistant] Processing case input: '{user_input}'")

        # 1. Query Analysis & Legal Fact Extraction (Phase 2)
        analysis = self.query_analyzer.analyze(user_input)
        extracted_facts = self.fact_extractor.extract_facts(user_input)
        print(f"[LegalFactExtractor] Facts: Domain='{extracted_facts.get('crime_domain')}', Intent='{extracted_facts.get('intent')}', DeathOccurred={extracted_facts.get('death_occurred')}")

        # 2. Legal Query Concept Expansion (Phase 3)
        expanded_concepts = self.query_expander.expand_query(user_input, extracted_facts)
        print(f"[LegalQueryExpander] Expanded concepts: {expanded_concepts}")

        # 3. Stage 1: Multi-Factor Hybrid BNS RAG (Phase 4)
        bns_candidates = self.retriever.search_bns_offences(
            query=user_input,
            expanded_concepts=expanded_concepts,
            crime_category=extracted_facts.get("crime_domain"),
            top_k=8
        )
        reranked_bns = self.reranker.rerank(
            query=user_input,
            candidate_docs=bns_candidates,
            top_k=5
        )

        # 4. Stage 2: Statutory Element Verification (Phase 5)
        verified_bns, missing_questions, uncertainty_notes = self.verifier.verify_bns_candidates(
            analysis=analysis,
            candidate_docs=reranked_bns,
            extracted_facts=extracted_facts
        )

        # 4. Stage 3: BNSS Procedural Actions RAG
        bnss_candidates = self.retriever.search_bnss_procedures(
            query=analysis["search_query"],
            top_k=8
        )
        reranked_bnss = self.reranker.rerank(
            query=user_input,
            candidate_docs=bnss_candidates,
            top_k=3
        )

        # 5. Stage 4: Investigation Knowledge RAG & Plan Generation
        bns_offences_summary = [{"title": v["title"]} for v in verified_bns]
        inv_guidelines = self.inv_retriever.retrieve_guidelines_for_bns(
            bns_offences=bns_offences_summary,
            case_keywords=analysis.get("keywords", []),
            top_k=3
        )
        inv_plan_items = self.inv_planner.generate_plan(inv_guidelines)

        # 6. Stage 5: Investigation Intelligence Decision Support
        bns_for_intel = [{"section": v["section"], "title": v["title"], "confidence": v["confidence"]} for v in verified_bns]
        bnss_for_intel = [{"metadata": r["metadata"]} for r in reranked_bnss]
        inv_intelligence_report = self.inv_intelligence.generate_investigation_strategy(
            crime_category=extracted_facts.get("crime_domain", "general_penal"),
            bns_sections=bns_for_intel,
            bnss_sections=bnss_for_intel,
            extracted_facts=extracted_facts,
            missing_information=missing_questions,
            investigation_sop_items=inv_plan_items,
        )

        # 6. Stage 5: Pass retrieved context (BNS + BNSS + Investigation SOPs) to Remote Qwen via LLMService
        print("[LegalAssistant] Generating final report...")

        # Task 5.A: Context Compressor
        compressed_bns = verified_bns[:3]
        compressed_bnss = reranked_bnss[:2]
        compressed_inv = inv_guidelines[:2]

        bns_context_parts = []
        for v in compressed_bns:
            doc_item = v.get("doc_item", {})
            meta = doc_item.get("metadata", {})
            raw_doc = doc_item.get("document", "")
            # Limit BNS content to first 500 characters
            doc_content = raw_doc[:500] + ("..." if len(raw_doc) > 500 else "")
            bns_context_parts.append(
                f"Statute: BNS Section {meta.get('section_number')}: {meta.get('title')}\n"
                f"Category: {meta.get('crime_category')}\n"
                f"Verification Reason: {v.get('reason')}\n"
                f"Confidence Reason: {v.get('confidence_reason')}\n"
                f"Content:\n{doc_content}\n"
            )
        bns_context = "\n\n".join(bns_context_parts)

        bnss_context_parts = []
        for r in compressed_bnss:
            meta = r["metadata"]
            raw_doc = r.get("document", "")
            # Limit BNSS content to first 500 characters
            doc_content = raw_doc[:500] + ("..." if len(raw_doc) > 500 else "")
            bnss_context_parts.append(
                f"Statute: BNSS Section {meta.get('section_number')}: {meta.get('section_title')}\n"
                f"Chapter: {meta.get('chapter')}\n"
                f"Content:\n{doc_content}\n"
            )
        bnss_context = "\n\n".join(bnss_context_parts)

        inv_context_parts = []
        for g in compressed_inv:
            meta = g.get("metadata", {})
            inv_context_parts.append(
                f"Stage: {meta.get('investigation_stage')}\n"
                f"Action: {meta.get('action_type')}\n"
                f"Purpose: {meta.get('purpose')}\n"
                f"Evidence Generated: {meta.get('evidence_generated')}\n"
                f"Source Guideline: {meta.get('source')}\n"
            )
        inv_context = "\n\n".join(inv_context_parts)

        element_notes = ""
        if uncertainty_notes:
            element_notes += "Uncertainty Notes:\n- " + "\n- ".join(uncertainty_notes) + "\n"
        if missing_questions:
            element_notes += "Missing Statutory Fact Questions:\n- " + "\n- ".join(missing_questions) + "\n"

        prompt = build_dual_law_investigation_prompt(analysis, bns_context, bnss_context, inv_context, element_notes)

        # Call LLMService Abstraction Layer (routes to RemoteQwenLLM)
        response_json = LLMService.generate_structured(
            prompt=prompt,
            system_prompt=POLICE_ASSISTANT_SYSTEM_PROMPT
        )

        # Fallback formatting if raw dict returned
        is_fallback_placeholder = (
            "possible_offences" not in response_json 
            or not response_json.get("possible_offences")
            or "note" in response_json
        )
        if is_fallback_placeholder:
            response_json = self._format_fallback_json(
                analysis, verified_bns, reranked_bnss, inv_plan_items, inv_guidelines, missing_questions, uncertainty_notes
            )

        # Enforce Guardrails
        self._enforce_legal_guardrails(response_json)

        # Attach Investigation Intelligence Report
        response_json["investigation_intelligence"] = inv_intelligence_report
        # Backward compatibility: keep investigation_plan
        if "investigation_plan" not in response_json:
            response_json["investigation_plan"] = inv_plan_items

        # Tasks 2 & 3: Validate and enrich BNSS citations with source tracking
        self._validate_and_enrich_bnss_citations(response_json)

        # Task 6: Legal Quality Validator
        quality_ok = self._run_final_quality_check(response_json, verified_bns, extracted_facts.get("crime_domain", "general_penal"))
        if not quality_ok:
            print("[LegalAssistant] Quality check failed. Executing deterministic fallback engine for safety.")
            response_json = self._format_fallback_json(
                analysis, verified_bns, reranked_bnss, inv_plan_items, inv_guidelines, missing_questions, uncertainty_notes
            )
            self._enforce_legal_guardrails(response_json)
            response_json["investigation_intelligence"] = inv_intelligence_report
            self._validate_and_enrich_bnss_citations(response_json)

        return response_json

    def _format_fallback_json(
        self, analysis, verified_bns, reranked_bnss, inv_plan_items, inv_guidelines, missing_questions, uncertainty_notes
    ) -> Dict[str, Any]:
        raw_input = analysis.get("raw_input", "")
        crime_type = analysis.get("crime_type", "Offence")

        possible_offences = []
        sources = []
        for v in verified_bns:
            possible_offences.append({
                "law": "BNS",
                "section": v["section"],
                "title": v["title"],
                "reason": v["reason"],
                "confidence": v["confidence"],
                "confidence_reason": v.get("confidence_reason", "Statutory elements matched against reported facts.")
            })
            sources.append(f"BNS {v['section']}: {v['title']}")

        procedural_actions = []
        for doc_item in reranked_bnss[:3]:
            meta = doc_item["metadata"]
            sec_num = str(meta.get("section_number", "N/A"))
            sec_title = meta.get("section_title", "N/A")
            if sec_num in ["531", "530", "529"]:  # Ignore repeal & saving administrative sections
                continue
            action_desc = f"Invoke BNSS Section {sec_num} ({sec_title}) for investigation procedure."
            if sec_num == "173":
                action_desc = "Register FIR for cognizable offence immediately under BNSS Section 173."
            elif sec_num == "105":
                action_desc = "Conduct mandatory audio-video electronic recording of search and seizure under BNSS Section 105."
            elif sec_num == "185":
                action_desc = "Execute search of premises by police officer during investigation under BNSS Section 185."
            elif sec_num == "35":
                action_desc = "Arrest accused without warrant if statutory cognizable requirements under BNSS Section 35 are met."

            procedural_actions.append({
                "law": "BNSS",
                "section": f"Section {sec_num}",
                "action": action_desc
            })
            sources.append(f"BNSS Section {sec_num}: {sec_title}")

        for g in inv_guidelines:
            src = g.get("metadata", {}).get("source", "investigation_guideline.txt")
            stage = g.get("metadata", {}).get("investigation_stage", "Procedure")
            sources.append(f"Investigation SOP ({src}): {stage}")

        missing_info_list = []
        if missing_questions:
            missing_info_list.extend(missing_questions)

        # Task 7: Domain-Specific Missing Information Intelligence
        if "violent_crimes" in crime_type or "Homicide" in crime_type or "Attempt" in crime_type or "Violent" in crime_type:
            missing_info_list.extend([
                "Was any weapon (knife, iron rod, firearm) used during the assault?",
                "What is the severity of injuries recorded in the Medical Legal Certificate (MLC)?",
                "Are there eyewitnesses or CCTV footage covering the incident?",
                "Were there prior death threats or history of violent disputes?"
            ])
        elif "cyber_crimes" in crime_type or "cyber" in raw_input.lower() or "phishing" in raw_input.lower():
            missing_info_list.extend([
                "What is the transaction ID, UPI ID, or bank account number used in the fraudulent transfer?",
                "What website URL, phone number, or social media handle was used by the fraudster?",
                "Is electronic communication evidence (SMS, email, WhatsApp chat) preserved?",
                "What device IP address or device type was targeted?"
            ])
        elif "property_crimes" in crime_type or "Theft" in crime_type or "Property" in crime_type:
            missing_info_list.extend([
                "What is the proof of ownership or purchase receipts for stolen items?",
                "Are there CCTV cameras covering the point of entry/exit?",
                "Was there forced entry, broken lock, or window tampering?",
                "What are the serial numbers or distinguishing marks of stolen property?"
            ])
        elif "financial_crimes" in crime_type or "cheating" in raw_input.lower() or "fraud" in raw_input.lower():
            missing_info_list.extend([
                "Are bank account statements and transaction receipts available?",
                "Is there a written agreement, cheque copy, or forged document available?",
                "Has a financial audit or forensic accounting report been conducted?"
            ])
        elif "offences_against_women" in crime_type or "Domestic" in crime_type or "husband" in raw_input.lower():
            missing_info_list.extend([
                "What is the specific marital relationship with the accused (husband, in-laws)?",
                "What is the timeline and frequency of physical or mental harassment?",
                "Is a Medical Legal Certificate (MLC) or injury report available?",
                "Were previous complaints filed with police or Women Cell?"
            ])
        else:
            missing_info_list.extend([
                "What is the exact timeline and identity of witnesses present?",
                "What specific physical or digital evidence is available?"
            ])

        # Deduplicate missing information list
        seen = set()
        deduped_missing_info = []
        for q in missing_info_list:
            if q not in seen:
                seen.add(q)
                deduped_missing_info.append(q)

        evidence_required_list = [
            "Detailed statement of informant/complainant recorded under Section 173 BNSS"
        ]
        if "violent_crimes" in crime_type or "Homicide" in crime_type or "Attempt" in crime_type or "Violent" in crime_type:
            evidence_required_list.extend([
                "Medical Legal Certificate (MLC) / Doctor's opinion on injuries",
                "Seizure of weapon/instrument of offence under Section 105 BNSS",
                "Spot inspection map and crime scene photo/video recording under Section 105 BNSS",
                "Statements of eyewitnesses/neighbors under Section 180 BNSS"
            ])
        elif "property_crimes" in crime_type or "Theft" in crime_type or "Property" in crime_type:
            evidence_required_list.extend([
                "List of stolen property/jewellery with purchase receipts or valuation certificates",
                "Spot inspection map and crime scene photo/video evidence",
                "Audio-video electronic recording of search and seizure under Section 105 BNSS",
                "CCTV camera footage retrieved from scene with Section 63 BSHA electronic certificate"
            ])
        elif "cyber_crimes" in crime_type or "financial_crimes" in crime_type:
            evidence_required_list.extend([
                "Bank transaction statements / Payment gateway ledger",
                "Electronic evidence certificate under Section 63 BSHA",
                "IP log details and server communication records"
            ])
        else:
            evidence_required_list.extend([
                "Spot inspection map and crime scene photo/video evidence",
                "CCTV camera footage or digital evidence with Section 63 BSHA certificate"
            ])

        # Task 6: Legal Hierarchy Output (Primary, Secondary, Alternative)
        primary_offence = possible_offences[0] if possible_offences else {
            "law": "BNS", "section": "N/A", "title": "General Penal Offence", "reason": "Requires additional facts"
        }
        secondary_offences = possible_offences[1:2] if len(possible_offences) > 1 else []
        alternative_offences = possible_offences[2:] if len(possible_offences) > 2 else []

        case_summary_text = f"Reported criminal incident involving {raw_input.lower()}. Categorized under {crime_type}."
        if uncertainty_notes:
            case_summary_text += f" [Legal Note: {uncertainty_notes[0]}]"

        return {
            "case_summary": case_summary_text,
            "primary_offence": primary_offence,
            "secondary_offences": secondary_offences,
            "alternative_offences": alternative_offences,
            "possible_offences": possible_offences,  # Backward compatibility
            "procedural_actions": procedural_actions,
            "investigation_plan": inv_plan_items,
            "evidence_required": evidence_required_list,
            "missing_information": deduped_missing_info,
            "sources": sources
        }

    def _validate_and_enrich_bnss_citations(self, response_json: Dict[str, Any]):
        """Verify generated BNSS sections against DB and append source tracking metadata (Tasks 2 & 3)."""
        import re
        # Build lookup table from the retriever's BNSS documents
        bnss_lookup = {}
        if hasattr(self.retriever, "bnss_docs"):
            for doc in self.retriever.bnss_docs:
                sec_num = str(doc.metadata.get("section_number", "")).strip()
                if sec_num:
                    bnss_lookup[sec_num] = doc

        # 1. Validate and enrich response_json["procedural_actions"]
        validated_actions = []
        for item in response_json.get("procedural_actions", []):
            section_str = str(item.get("section", ""))
            
            # Find the section number from section string
            match = re.search(r'\d+', section_str)
            if match:
                sec_num = match.group(0)
                if sec_num in bnss_lookup:
                    doc = bnss_lookup[sec_num]
                    item["law"] = "BNSS"
                    item["section"] = f"Section {sec_num}"
                    item["source_verified"] = True
                    item["source_text"] = doc.page_content[:400] + ("..." if len(doc.page_content) > 400 else "")
                else:
                    item["section"] = f"Section {sec_num} (BNSS citation requires verification)"
                    item["source_verified"] = False
                    item["source_text"] = "BNSS citation requires verification"
            else:
                item["source_verified"] = False
                item["source_text"] = "BNSS citation requires verification"
            validated_actions.append(item)
        response_json["procedural_actions"] = validated_actions

        # 2. Validate and enrich response_json["investigation_intelligence"]["legal_compliance_checklist"]
        intel = response_json.get("investigation_intelligence", {})
        if intel and "legal_compliance_checklist" in intel:
            validated_checklist = []
            for item in intel.get("legal_compliance_checklist", []):
                section_str = str(item.get("related_BNSS_section", ""))
                
                match = re.search(r'\d+', section_str)
                if match:
                    sec_num = match.group(0)
                    if sec_num in bnss_lookup:
                        doc = bnss_lookup[sec_num]
                        item["law"] = "BNSS"
                        item["related_BNSS_section"] = f"BNSS Section {sec_num}"
                        item["source_verified"] = True
                        item["source_text"] = doc.page_content[:400] + ("..." if len(doc.page_content) > 400 else "")
                    else:
                        item["related_BNSS_section"] = f"BNSS Section {sec_num} (BNSS citation requires verification)"
                        item["source_verified"] = False
                        item["source_text"] = "BNSS citation requires verification"
                else:
                    item["source_verified"] = False
                    item["source_text"] = "BNSS citation requires verification"
                validated_checklist.append(item)
            intel["legal_compliance_checklist"] = validated_checklist

    def _run_final_quality_check(
        self,
        response_json: Dict[str, Any],
        verified_bns: List[Dict[str, Any]],
        crime_category: str
    ) -> bool:
        """Task 6: Legal Quality Validator to reject hallucinated or irrelevant LLM recommendations."""
        import re
        try:
            # 1. Are all BNS sections in possible_offences retrieved from BNS RAG?
            retrieved_bns_secs = {str(v.get("section", "")).replace("Section ", "").strip() for v in verified_bns}
            for off in response_json.get("possible_offences", []):
                sec_num = str(off.get("section", "")).replace("Section ", "").replace("BNS Section ", "").strip()
                if sec_num and sec_num != "N/A" and sec_num not in retrieved_bns_secs:
                    print(f"[Quality Check Failed] Unverified BNS Section {sec_num} found in response!")
                    return False

            # 2. Are all BNSS sections in procedural_actions retrieved from BNSS RAG?
            bnss_lookup_nums = set()
            if hasattr(self.retriever, "bnss_docs"):
                bnss_lookup_nums = {str(doc.metadata.get("section_number", "")).strip() for doc in self.retriever.bnss_docs}
                
            for act in response_json.get("procedural_actions", []):
                sec_str = str(act.get("section", ""))
                match = re.search(r'\d+', sec_str)
                if match:
                    sec_num = match.group(0)
                    if bnss_lookup_nums and sec_num not in bnss_lookup_nums:
                        print(f"[Quality Check Failed] Unverified BNSS Section {sec_num} found in response!")
                        return False

            # 3. Does evidence strategy match crime category?
            evidence_text = " ".join([e.get("items_to_collect", "").lower() for e in response_json.get("evidence_required", [])])
            if "narcotics" in crime_category or "ndps" in crime_category:
                if not any(w in evidence_text for w in ["substance", "narcotics", "drug", "contraband", "powder", "chemical", "sample", "memo"]):
                    print("[Quality Check Failed] Narcotics case evidence strategy is missing drug recovery items!")
                    return False
            elif "cyber" in crime_category:
                if "murder" in evidence_text or "post-mortem" in evidence_text:
                    print("[Quality Check Failed] Cyber case contains homicide-related evidence strategy!")
                    return False

            return True
        except Exception as e:
            print(f"[Quality Check Exception] Error during validation: {e}")
            return False

    def _enforce_legal_guardrails(self, response_json: Dict[str, Any]):
        for item in response_json.get("possible_offences", []):
            item["law"] = "BNS"
        for item in response_json.get("procedural_actions", []):
            item["law"] = "BNSS"

    # =========================================================================
    # Future CrimeLens Module Extension Connectors
    # =========================================================================
    def connect_fir_rag_module(self, fir_vectorstore_uri: str):
        print(f"[Extensibility Interface] FIR RAG module connected: {fir_vectorstore_uri}")

    def connect_case_similarity_engine(self, similarity_engine_uri: str):
        print(f"[Extensibility Interface] Case Similarity search engine connected: {similarity_engine_uri}")

    def connect_neo4j_criminal_network(self, neo4j_bolt_uri: str):
        print(f"[Extensibility Interface] Neo4j Criminal Network Analysis graph connected: {neo4j_bolt_uri}")


if __name__ == "__main__":
    assistant = LegalIntelligenceAssistant()
    
    test_case = "Someone entered my house and stole jewellery"
    print(f"\n=======================================================")
    print(f"INPUT CASE: {test_case}")
    print(f"=======================================================")

    output = assistant.process_case(test_case)
    print("\n--- REMOTE QWEN ASSISTANT OUTPUT (JSON) ---\n")
    print(json.dumps(output, indent=2))
