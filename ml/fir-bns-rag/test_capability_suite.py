import unittest
import json
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from rag.fir_intake import FIRIntakeParser
from rag.fir_entity_extractor import FIREntityExtractor
from rag.pii_masker import FIRPIIMasker
from rag.fir_intelligence_pipeline import FIRIntelligencePipeline
from rag.legal_assistant import LegalIntelligenceAssistant


class TestFIRCapabilitySuite(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.intake = FIRIntakeParser()
        cls.extractor = FIREntityExtractor()
        cls.masker = FIRPIIMasker()
        cls.pipeline = FIRIntelligencePipeline()
        cls.assistant = LegalIntelligenceAssistant()
        
        with open(os.path.join(os.path.dirname(__file__), "test_corpus.json"), "r", encoding="utf-8") as f:
            cls.corpus = json.load(f)

    # -------------------------------------------------------------------------
    # 1. Input Format Support Tests
    # -------------------------------------------------------------------------
    def test_input_formats(self):
        # A. One-line short input
        res_short = self.intake.ingest("Burglars broke house main door lock at night and stole cash locker")
        self.assertEqual(res_short["source_type"], "text")
        self.assertTrue(len(res_short["full_text"]) > 0)

        # B. Multi-line structured text
        res_struct = self.intake.ingest(self.corpus[0]["text"])
        self.assertEqual(res_struct["source_type"], "text")
        self.assertTrue(res_struct["char_count"] > 100)

        # C. Digital PDF input (using existing project PDF if available)
        pdf_path = os.path.join(os.path.dirname(__file__), "documents", "BNSS_2023.pdf")
        if os.path.exists(pdf_path):
            res_pdf = self.intake.process_pdf(pdf_path)
            self.assertEqual(res_pdf["source_type"], "pdf")
            self.assertTrue(res_pdf["total_pages"] > 0)

        # D. Image file fallback
        dummy_img_res = self.intake.process_image("non_existent_image.png")
        self.assertIn("source_type", dummy_img_res)

    # -------------------------------------------------------------------------
    # 2. Fact Extraction & Normalization Tests
    # -------------------------------------------------------------------------
    def test_fact_extraction_and_normalization(self):
        # Test on FIR_001
        fir1 = self.corpus[0]
        ext1 = self.extractor.extract(fir1["text"])

        self.assertEqual(ext1["fir_metadata"]["fir_number"], "0048/2026")
        self.assertIn("9876543210", ext1["phones"])
        self.assertIn("OD02AB1234", ext1["vehicles"])
        self.assertIsNotNone(ext1["people"]["complainant"])
        self.assertEqual(ext1["people"]["complainant"]["name"], "Rajesh Kumar")
        self.assertTrue(len(ext1["people"]["accused"]) > 0)
        self.assertTrue(len(ext1["weapons"]) > 0)
        self.assertTrue(len(ext1["property"]) > 0)

    # -------------------------------------------------------------------------
    # 3. Privacy Masking & Back-Masking Tests
    # -------------------------------------------------------------------------
    def test_privacy_masking_and_unmasking(self):
        raw_text = (
            "Complainant Rajesh Kumar (Ph: 9876543210, r/o House 42, Daryaganj) reported that "
            "suspect fled in vehicle OD-02-AB-1234. Witness Suresh saw the incident."
        )
        entities = {
            "people": {
                "complainant": {"name": "Rajesh Kumar"},
                "witnesses": [{"name": "Suresh"}]
            }
        }

        # 1. Masking
        masked_text, pii_map = self.masker.mask_text(raw_text, extracted_entities=entities)

        self.assertNotIn("Rajesh Kumar", masked_text)
        self.assertNotIn("9876543210", masked_text)
        self.assertNotIn("OD-02-AB-1234", masked_text)
        self.assertIn("PERSON_", masked_text)
        self.assertIn("PHONE_", masked_text)
        self.assertIn("VEHICLE_", masked_text)

        # Non-identifying context preservation check
        self.assertIn("Complainant", masked_text)
        self.assertIn("Witness", masked_text)

        # 2. Back-Masking / Unmasking
        restored_text = self.masker.unmask_text(masked_text, pii_map)
        self.assertEqual(raw_text, restored_text)

    # -------------------------------------------------------------------------
    # 4. BNS Substantive RAG & Statutory Element Verification Tests
    # -------------------------------------------------------------------------
    def test_bns_rag_and_statutory_verification(self):
        theft_input = "Someone entered house at night by breaking lock and stole gold necklace and cash"
        analysis = self.assistant.process_case(theft_input)

        self.assertIn("possible_offences", analysis)
        self.assertTrue(len(analysis["possible_offences"]) > 0)
        
        # Verify BNS sections matched
        sections = [str(off.get("section", "")) for off in analysis["possible_offences"]]
        self.assertTrue(any("303" in s or "305" in s for s in sections))

    # -------------------------------------------------------------------------
    # 5. Investigation & Evidence Recommendations Tests
    # -------------------------------------------------------------------------
    def test_investigation_and_evidence_recommendations(self):
        fir_text = self.corpus[0]["text"]
        result = self.pipeline.process_fir(fir_text)

        self.assertIn("bns_sections", result)
        self.assertIn("investigation_actions", result)
        self.assertIn("investigation_intelligence", result)
        self.assertTrue(len(result["investigation_actions"]) > 0)

        # Verify investigation actions contain expected priority, reason, supporting_facts
        act = result["investigation_actions"][0]
        self.assertIn("action", act)
        self.assertIn("priority", act)
        self.assertIn("reason", act)

    # -------------------------------------------------------------------------
    # 6. End-to-End Pipeline Evaluation on Full Test Corpus
    # -------------------------------------------------------------------------
    def test_corpus_end_to_end_pipeline(self):
        print(f"\n=======================================================")
        print(f" EVALUATING PIPELINE ACROSS {len(self.corpus)} REALISTIC TEST FIRS")
        print(f"=======================================================")

        for idx, item in enumerate(self.corpus, start=1):
            print(f"[{idx}/{len(self.corpus)}] Processing {item['id']}: {item['description']}...")
            res = self.pipeline.process_fir(item["text"], source_name=item["id"])

            self.assertIsNotNone(res.get("fir_metadata"))
            self.assertIsNotNone(res.get("crime_category"))
            self.assertTrue(len(res.get("bns_sections", [])) > 0)
            self.assertTrue(len(res.get("investigation_actions", [])) > 0)
            print(f"  -> Category: {res['crime_category']}, BNS Sections: {[b['section'] for b in res['bns_sections']]}")

        print("=======================================================\n")


if __name__ == "__main__":
    unittest.main()
