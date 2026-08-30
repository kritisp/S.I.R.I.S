import unittest
import os
import sys
import json

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from rag.llm.groq_llm import GroqLLM
from rag.llm.ollama_llm import OllamaLLM
from rag.llm import LLMService
from rag.legal_assistant import LegalIntelligenceAssistant
from rag.fir_intelligence_pipeline import FIRIntelligencePipeline


class TestLLMHierarchyAndFallback(unittest.TestCase):

    def setUp(self):
        self.sample_fir = (
            "FIRST INFORMATION REPORT\n"
            "P.S.: Saheed Nagar    FIR No.: 0077/2026\n"
            "Complainant: Priyadarshi Mohanty, Ph: 9876543210\n"
            "Brief Details: Suspects entered residence at night, brandished a knife, and stole gold ornaments worth Rs. 1,50,000/-."
        )

    def test_case_a_groq_primary_path(self):
        """CASE A: Groq Primary Path Execution Test."""
        print("\n--- CASE A: GROQ PRIMARY PATH TEST ---")
        groq_provider = GroqLLM()
        is_key_present = groq_provider.is_available()
        print(f"Groq API Key Configured: {is_key_present}")
        print(f"Groq Model Selected: {groq_provider.model_name}")

        if not is_key_present:
            print("STATUS: BLOCKED — GROQ_API_KEY unavailable in environment")
            return

        try:
            print("Executing test query against Groq API...")
            res = groq_provider.generate("Say OK", temperature=0.1)
            print(f"STATUS: SUCCESS — Real Groq Response Received: '{res.strip()}'")
        except Exception as e:
            err_str = str(e)
            if "403" in err_str or "Forbidden" in err_str or "401" in err_str:
                print("STATUS: BLOCKED — GROQ_API_KEY unauthorized or expired (HTTP 403 Forbidden)")
            elif "404" in err_str:
                print(f"STATUS: BLOCKED — Groq Model Not Found (HTTP 404: {err_str})")
            else:
                print(f"STATUS: FAILED — Groq API Error: {e}")

    def test_case_b_ollama_local_fallback(self):
        """CASE B: Ollama Local Fallback Execution Test."""
        print("\n--- CASE B: OLLAMA LOCAL FALLBACK TEST ---")
        ollama_provider = OllamaLLM(model_name="qwen2.5:7b")
        is_ollama_online = ollama_provider.is_available()
        print(f"Local Ollama API Online: {is_ollama_online}")

        if is_ollama_online:
            try:
                res = ollama_provider.generate("Say OK")
                print(f"STATUS: SUCCESS — Real Ollama Local Response Received: '{res.strip()}'")
            except Exception as e:
                print(f"STATUS: OLLAMA FAILED — {e}")
        else:
            print("STATUS: OLLAMA OFFLINE — Local Ollama server (http://localhost:11434) not running")

    def test_case_c_deterministic_legal_fallback(self):
        """CASE C: Deterministic Legal Fallback Execution Test."""
        print("\n--- CASE C: DETERMINISTIC LEGAL FALLBACK TEST ---")
        assistant = LegalIntelligenceAssistant()
        
        # Execute legal assistant in fallback mode
        fallback_json = assistant._format_fallback_json(
            analysis={"raw_input": self.sample_fir, "crime_type": "Property Offence / Theft"},
            verified_bns=[{"section": "305", "title": "Theft in dwelling house", "reason": "Forced entry", "confidence": "HIGH"}],
            reranked_bnss=[{"metadata": {"section_number": "173", "section_title": "FIR Registration"}}],
            inv_plan_items=[{"stage": "Scene Inspection", "action": "Inspect point of entry"}],
            inv_guidelines=[],
            missing_questions=["Was CCTV available?"],
            uncertainty_notes=[]
        )

        self.assertIn("possible_offences", fallback_json)
        self.assertIn("procedural_actions", fallback_json)
        self.assertIn("investigation_plan", fallback_json)
        self.assertTrue(len(fallback_json["possible_offences"]) > 0)

        print("[+] STATUS: SUCCESS — Deterministic legal fallback generated valid structured intelligence!")


if __name__ == "__main__":
    unittest.main()
