import json
import urllib.request
import urllib.error
import time
import re
from typing import Dict, Any, List, Optional
from rag.prompts import POLICE_ASSISTANT_SYSTEM_PROMPT, build_dual_law_investigation_prompt


class OllamaLegalLLM:
    """
    Legal Intelligence LLM interface for Ollama (Qwen2.5 7B) with deterministic legal fallback engine.
    """
    def __init__(self, model_name: str = "qwen2.5:7b", ollama_url: str = "http://localhost:11434/api/generate"):
        self.model_name = model_name
        self.ollama_url = ollama_url

    def is_ollama_available(self) -> bool:
        try:
            req = urllib.request.Request("http://localhost:11434/api/tags", method="GET")
            with urllib.request.urlopen(req, timeout=2) as resp:
                return resp.status == 200
        except Exception:
            return False

    def generate_dual_law_json(
        self,
        analysis: dict,
        verified_bns: List[Dict[str, Any]],
        bnss_docs: List[Dict[str, Any]],
        inv_plan_items: List[Dict[str, str]] = None,
        inv_guidelines: List[Dict[str, Any]] = None,
        missing_questions: List[str] = None,
        uncertainty_notes: List[str] = None
    ) -> Dict[str, Any]:
        inv_plan_items = inv_plan_items or []
        inv_guidelines = inv_guidelines or []
        missing_questions = missing_questions or []
        uncertainty_notes = uncertainty_notes or []

        # Format BNS context
        bns_context_parts = []
        for v in verified_bns:
            doc_item = v.get("doc_item", {})
            meta = doc_item.get("metadata", {})
            bns_context_parts.append(
                f"Statute: BNS Section {meta.get('section_number')}: {meta.get('title')}\n"
                f"Category: {meta.get('crime_category')}\n"
                f"Verification Reason: {v.get('reason')}\n"
                f"Confidence Reason: {v.get('confidence_reason')}\n"
                f"Content:\n{doc_item.get('document', '')}\n"
            )
        bns_context = "\n\n".join(bns_context_parts)

        # Format BNSS context
        bnss_context_parts = []
        for r in bnss_docs:
            meta = r["metadata"]
            bnss_context_parts.append(
                f"Statute: BNSS Section {meta.get('section_number')}: {meta.get('section_title')}\n"
                f"Chapter: {meta.get('chapter')}\n"
                f"Content:\n{r['document']}\n"
            )
        bnss_context = "\n\n".join(bnss_context_parts)

        # Format Investigation Guidelines context
        inv_context_parts = []
        for g in inv_guidelines:
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

        user_prompt = build_dual_law_investigation_prompt(analysis, bns_context, bnss_context, inv_context, element_notes)

        if self.is_ollama_available():
            print(f"Connecting to local Ollama LLM ({self.model_name})...")
            # Task 5: Retry up to 3 attempts
            for attempt in range(1, 4):
                try:
                    payload = {
                        "model": self.model_name,
                        "system": POLICE_ASSISTANT_SYSTEM_PROMPT,
                        "prompt": user_prompt,
                        "stream": False,
                        "format": "json",
                        "options": {
                            "temperature": 0.1
                        }
                    }
                    data = json.dumps(payload).encode("utf-8")
                    req = urllib.request.Request(self.ollama_url, data=data, headers={"Content-Type": "application/json"})
                    with urllib.request.urlopen(req, timeout=120) as resp:
                        result = json.loads(resp.read().decode("utf-8"))
                        response_text = result.get("response", "").strip()
                        
                        # Task 5.C: Attempt JSON repair and parsing
                        res_json = self._repair_and_parse_json(response_text)
                        if res_json:
                            if not res_json.get("investigation_plan") and inv_plan_items:
                                res_json["investigation_plan"] = inv_plan_items
                            if missing_questions and not res_json.get("missing_information"):
                                res_json["missing_information"] = missing_questions
                            return res_json
                        
                        print(f"Malformed JSON returned on attempt {attempt}. Retrying with correction prompt...")
                        user_prompt = (
                            f"{user_prompt}\n\n"
                            f"ERROR: The previous response was not valid JSON. Please correct the formatting "
                            f"and output ONLY the valid JSON matching the schema requirements."
                        )
                except Exception as e:
                    print(f"Ollama execution attempt {attempt} failed: {e}. Retrying...")
                    time.sleep(1)

        print("All Ollama generation attempts exhausted. Utilizing deterministic fallback engine.")
        return self._generate_dual_law_fallback(analysis, verified_bns, bnss_docs, inv_plan_items, inv_guidelines, missing_questions, uncertainty_notes)

    def _repair_and_parse_json(self, raw_str: str) -> Optional[Dict[str, Any]]:
        """Utility to clean and parse JSON response string with fallback recovery (Task 5.C)."""
        cleaned = raw_str.strip()
        # Remove markdown code block wrappers
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\n", "", cleaned)
            cleaned = re.sub(r"\n```$", "", cleaned)
            cleaned = cleaned.strip()

        # Direct JSON load
        try:
            return json.loads(cleaned)
        except Exception:
            pass

        # Regex fallback: find first brace to last brace
        try:
            match = re.search(r"\{.*\}", cleaned, re.DOTALL)
            if match:
                return json.loads(match.group(0))
        except Exception:
            pass

        return None

        return self._generate_dual_law_fallback(analysis, verified_bns, bnss_docs, inv_plan_items, inv_guidelines, missing_questions, uncertainty_notes)

    def _generate_dual_law_fallback(
        self,
        analysis: dict,
        verified_bns: List[Dict[str, Any]],
        bnss_docs: List[Dict[str, Any]],
        inv_plan_items: List[Dict[str, str]],
        inv_guidelines: List[Dict[str, Any]],
        missing_questions: List[str],
        uncertainty_notes: List[str]
    ) -> Dict[str, Any]:
        raw_input = analysis.get("raw_input", "")
        crime_type = analysis.get("crime_type", "Offence")

        # 1. Verified BNS Offences (STRICTLY BNS ONLY)
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

        # 2. BNSS Procedural Actions (STRICTLY BNSS ONLY)
        procedural_actions = []
        for doc_item in bnss_docs[:3]:
            meta = doc_item["metadata"]
            sec_num = str(meta.get("section_number", "N/A"))
            sec_title = meta.get("section_title", "N/A")

            action_desc = f"Invoke BNSS Section {sec_num} ({sec_title}) for investigation procedure."
            if sec_num == "173":
                action_desc = "Register FIR for cognizable offence immediately under BNSS Section 173."
            elif sec_num == "105":
                action_desc = "Conduct mandatory audio-video electronic recording of search and seizure under BNSS Section 105."
            elif sec_num == "185":
                action_desc = "Execute search of premises by police officer during investigation under BNSS Section 185."
            elif sec_num == "35":
                action_desc = "Evaluate powers of police to arrest without warrant under BNSS Section 35."

            procedural_actions.append({
                "law": "BNSS",
                "section": f"Section {sec_num}",
                "action": action_desc
            })
            sources.append(f"BNSS Section {sec_num}: {sec_title}")

        # Add Investigation Guideline sources
        for g in inv_guidelines:
            src = g.get("metadata", {}).get("source", "investigation_guideline.txt")
            stage = g.get("metadata", {}).get("investigation_stage", "Procedure")
            sources.append(f"Investigation SOP ({src}): {stage}")

        missing_info_list = [
            "Exact time frame of house entry / break-in (day vs night)",
            "Estimated total monetary value of stolen goods / jewellery"
        ]
        for q in missing_questions:
            if q not in missing_info_list:
                missing_info_list.append(q)

        case_summary_text = f"Reported criminal incident involving {raw_input.lower()}. Categorized under {crime_type}."
        if uncertainty_notes:
            case_summary_text += f" [Legal Note: {uncertainty_notes[0]}]"

        return {
            "case_summary": case_summary_text,
            "possible_offences": possible_offences,
            "procedural_actions": procedural_actions,
            "investigation_plan": inv_plan_items,
            "evidence_required": [
                "Detailed statement of informant/complainant recorded under Section 173 BNSS",
                "List of stolen property/jewellery with purchase receipts or valuation certificates",
                "Spot inspection map and crime scene photo/video evidence",
                "Audio-video electronic recording of search and seizure under Section 105 BNSS",
                "CCTV camera footage retrieved from scene with Section 63 BSHA electronic certificate"
            ],
            "missing_information": missing_info_list,
            "sources": sources
        }


if __name__ == "__main__":
    llm = OllamaLegalLLM()
    print("Ollama available:", llm.is_ollama_available())
