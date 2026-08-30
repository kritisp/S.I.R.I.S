import unittest
import json
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from rag.fir_entity_extractor import FIREntityExtractor
from rag.pii_masker import FIRPIIMasker
from rag.fir_intelligence_pipeline import FIRIntelligencePipeline


class TestPIIPipelineProof(unittest.TestCase):

    def setUp(self):
        self.extractor = FIREntityExtractor()
        self.masker = FIRPIIMasker()
        self.pipeline = FIRIntelligencePipeline()

    def test_end_to_end_pii_masking_and_unmasking(self):
        raw_fir = """
        On 12-08-2024 at around 10:45 PM, Priyadarshi Mohanty (Mob: 9876543210, r/o House 42, Saheed Nagar) lodged a complaint at Saheed Nagar Police Station.
        He stated that while returning home, two unknown motorcycle riders on getaway vehicle OD-02-AB-1234 blocked his path,
        threatened him at gunpoint with a pistol, and snatched his wallet containing Rs. 15,000 cash.
        Eyewitness Amit Kumar witnessed the crime from a nearby shop.
        """

        # Step 1: Fact & Entity Extraction
        entities = self.extractor.extract(raw_fir)
        self.assertEqual(entities["people"]["complainant"]["name"], "Priyadarshi Mohanty")
        self.assertIn("9876543210", entities["phones"])
        self.assertIn("OD02AB1234", entities["vehicles"])

        # Step 2: Masking before LLM input
        masked_text, pii_map = self.masker.mask_text(raw_fir, extracted_entities=entities)

        print("\n--- INSTRUMENTED PII MASKING PROOF ---")
        print(f"Original Text Length: {len(raw_fir)}")
        print(f"Masked Text Length: {len(masked_text)}")
        print("PII Map Keys:", list(pii_map.keys()))

        # Assert sensitive items are NOT present in masked LLM payload
        self.assertNotIn("Priyadarshi Mohanty", masked_text)
        self.assertNotIn("9876543210", masked_text)
        self.assertNotIn("OD-02-AB-1234", masked_text)

        # Assert masked placeholders ARE present
        self.assertTrue(any(k.startswith("PERSON_") for k in pii_map.keys()))
        self.assertTrue(any(k.startswith("PHONE_") for k in pii_map.keys()))
        self.assertTrue(any(k.startswith("VEHICLE_") for k in pii_map.keys()))

        # Assert analytical facts ARE preserved for legal reasoning
        self.assertIn("Saheed Nagar", masked_text)
        self.assertIn("10:45 PM", masked_text)
        self.assertIn("pistol", masked_text)
        self.assertIn("15,000", masked_text)

        # Step 3: Unmasking / Back-Masking
        restored_data = self.masker.unmask_text(masked_text, pii_map)
        self.assertEqual(raw_fir, restored_data)
        print("[+] SUCCESS: Exact PII restoration verified!")

    def test_pipeline_cloud_masking_flag(self):
        # Force cloud mode flag to True for verification
        self.pipeline.is_cloud_provider = True
        raw_fir = "Complainant Sunita Sharma (Mob: 9123456789) reported theft of vehicle OD-01-A-1111 at Khandagiri."
        
        result = self.pipeline.process_fir(raw_fir)
        self.assertTrue(result.get("masking_used", False))
        
        # User facing output must have unmasked identities
        self.assertIn("Sunita Sharma", str(result["entities"]["people"]))


if __name__ == "__main__":
    unittest.main()
