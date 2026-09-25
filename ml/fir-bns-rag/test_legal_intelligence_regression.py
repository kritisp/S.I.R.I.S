"""
S.I.R.I.S. End-to-End Legal Intelligence Pipeline Regression Test Suite
=======================================================================
Verifies statutory BNS/BNSS accuracy, Mens Rea distinctions (Intentional vs. Rash/Negligent driving),
Actus Reus verification, conditional applicability badges, and BNSS procedural action separation.
"""

import sys
import os
import unittest

# Ensure ml/fir-bns-rag is in python path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from rag.fir_intelligence_pipeline import FIRIntelligencePipeline
from rag.element_verifier import StatutoryElementVerifier


class TestLegalIntelligenceRegression(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        print("\n=== Initializing S.I.R.I.S. Legal Intelligence Regression Suite ===")
        cls.verifier = StatutoryElementVerifier()
        cls.pipeline = FIRIntelligencePipeline()

    def test_01_road_accident_fictional_scenario(self):
        """
        Scenario 1: Fictional Road Accident
        A vehicle collides with a motorcycle on a public road due to rash/negligent driving.
        Rider suffers injuries with a suspected fracture. Driver fled the scene.
        """
        fir_text = """
        FIRST INFORMATION REPORT
        P.S. Capital Police Station, Bhubaneswar, District: Khordha
        On 15/08/2026 at about 14:30 hrs near Master Canteen Square, a speeding car OD-02-AK-9999 driven in a rash and negligent manner collided with complainant's motorcycle from behind. The motorcycle rider sustained severe bodily injuries with suspected left leg fracture. The car driver fled the scene immediately without stopping or reporting to the police.
        """
        result = self.pipeline.process_fir(fir_text)
        bns_sections = result.get("bns_sections", [])
        bnss_actions = result.get("bnss_procedural_actions", [])
        sec_numbers = [s.get("section_number") or s.get("section", "").replace("Section ", "") for s in bns_sections]

        print("\n[Scenario 1 Results: Road Accident]")
        print("Recommended BNS Sections:", [f"{s['section']}: {s['title']} ({s.get('applicability_status', 'N/A')})" for s in bns_sections])

        # 1. MUST recommend BNS 281 (Rash driving on public way)
        self.assertIn("281", sec_numbers, "Road accident MUST recommend BNS Section 281 (Rash driving)")

        # 2. MUST NOT recommend BNS 115 (Voluntarily Causing Hurt) or BNS 117 (Voluntarily Causing Grievous Hurt)
        self.assertNotIn("115", sec_numbers, "Road accident MUST NOT recommend BNS 115 (Voluntarily Causing Hurt)")
        self.assertNotIn("117", sec_numbers, "Road accident MUST NOT recommend BNS 117 (Voluntarily Causing Grievous Hurt)")

        # 3. MUST recommend BNS 125(a) or 125(b)
        has_125 = any(s.startswith("125") for s in sec_numbers)
        self.assertTrue(has_125, "Road accident with injury MUST recommend BNS Section 125")

        # 4. Verify BNSS Section 53 is NOT misapplied as victim medical exam
        for act in bnss_actions:
            if act.get("section_number") == "53":
                self.assertIn("accused", act.get("action", "").lower(), "BNSS Section 53 MUST be labeled as examination of accused, NOT victim medical exam")

    def test_02_dwelling_house_theft(self):
        """Scenario 2: Theft inside a dwelling house."""
        fir_text = "Complainant reported that on 10/08/2026, unknown intruders entered his residential house at Saheed Nagar and stole gold jewellery worth Rs 2,00,000 from the bedroom almirah."
        result = self.pipeline.process_fir(fir_text)
        bns_sections = result.get("bns_sections", [])
        sec_numbers = [s.get("section_number") or s.get("section", "").replace("Section ", "") for s in bns_sections]

        print("\n[Scenario 2 Results: Theft in Dwelling]")
        print("Recommended BNS Sections:", [f"{s['section']}: {s['title']}" for s in bns_sections])

        self.assertTrue(any(s.startswith("303") or s.startswith("305") for s in sec_numbers), "MUST recommend BNS 303/305 for theft in dwelling house")

    def test_03_receiving_stolen_property(self):
        """Scenario 3: Receiving stolen property."""
        fir_text = "Police recovered stolen motorcycle from suspect Bikram who bought and received stolen property knowing it was stolen from primary burglar."
        result = self.pipeline.process_fir(fir_text)
        bns_sections = result.get("bns_sections", [])
        sec_numbers = [s.get("section_number") or s.get("section", "").replace("Section ", "") for s in bns_sections]

        print("\n[Scenario 3 Results: Receiving Stolen Property]")
        print("Recommended BNS Sections:", [f"{s['section']}: {s['title']}" for s in bns_sections])

        self.assertTrue(any(s.startswith("317") for s in sec_numbers), "MUST evaluate BNS Section 317 for receiving/retaining stolen property")

    def test_04_intentional_assault(self):
        """Scenario 4: Intentional assault & battery."""
        fir_text = "During an argument at Rasulgarh, accused Ramesh intentionally struck complainant with an iron rod causing head injury and severe pain."
        result = self.pipeline.process_fir(fir_text)
        bns_sections = result.get("bns_sections", [])
        sec_numbers = [s.get("section_number") or s.get("section", "").replace("Section ", "") for s in bns_sections]

        print("\n[Scenario 4 Results: Intentional Assault]")
        print("Recommended BNS Sections:", [f"{s['section']}: {s['title']}" for s in bns_sections])

        self.assertTrue(any(s.startswith("115") or s.startswith("117") for s in sec_numbers), "Intentional assault MUST recommend BNS Section 115 or 117")
        self.assertFalse(any(s.startswith("281") for s in sec_numbers), "Intentional assault MUST NOT recommend rash driving BNS 281")

    def test_05_road_accident_without_injury(self):
        """Scenario 5: Road accident without injury (property damage only)."""
        fir_text = "A truck collided with complainant's parked car on Janpath road due to rash driving. No person was injured."
        result = self.pipeline.process_fir(fir_text)
        bns_sections = result.get("bns_sections", [])
        sec_numbers = [s.get("section_number") or s.get("section", "").replace("Section ", "") for s in bns_sections]

        print("\n[Scenario 5 Results: Accident Without Injury]")
        print("Recommended BNS Sections:", [f"{s['section']}: {s['title']}" for s in bns_sections])

        self.assertTrue(any(s.startswith("281") for s in sec_numbers), "Road accident without injury MUST recommend BNS 281")
        self.assertFalse(any(s.startswith("115") for s in sec_numbers), "MUST NOT recommend BNS 115")

    def test_06_road_accident_confirmed_grievous_hurt(self):
        """Scenario 6: Road accident with confirmed grievous hurt (fracture confirmed by doctor)."""
        fir_text = "Rash driving car hit pedestrian on public road causing severe bone fracture confirmed by attending hospital surgeon."
        result = self.pipeline.process_fir(fir_text)
        bns_sections = result.get("bns_sections", [])
        sec_numbers = [s.get("section_number") or s.get("section", "").replace("Section ", "") for s in bns_sections]

        print("\n[Scenario 6 Results: Accident With Confirmed Fracture]")
        print("Recommended BNS Sections:", [f"{s['section']}: {s['title']}" for s in bns_sections])

        has_125b = any(s.startswith("125") for s in sec_numbers)
        self.assertTrue(has_125b, "MUST recommend BNS 125(b) for rash driving causing grievous hurt")

    def test_07_night_housebreaking(self):
        """Scenario 7: Housebreaking at night."""
        fir_text = "On the night of 12.08.2026 at 02:30 AM, unknown intruders broke the door lock of residence at Puri and committed burglary."
        result = self.pipeline.process_fir(fir_text)
        bns_sections = result.get("bns_sections", [])
        sec_numbers = [s.get("section_number") or s.get("section", "").replace("Section ", "") for s in bns_sections]

        print("\n[Scenario 7 Results: Night Housebreaking]")
        print("Recommended BNS Sections:", [f"{s['section']}: {s['title']}" for s in bns_sections])

        self.assertTrue(any(s.startswith("331") for s in sec_numbers), "MUST recommend BNS 331 for night housebreaking")

    def test_08_insufficient_particulars(self):
        """Scenario 8: Unknown offender / insufficient particulars."""
        fir_text = "Unclear statement with no acts specified."
        result = self.pipeline.process_fir(fir_text)
        bnss_actions = result.get("bnss_procedural_actions", [])
        sec_numbers = [str(a.get("section_number") or a.get("section", "")) for a in bnss_actions]

        print("\n[Scenario 8 Results: Insufficient Particulars]")
        print("Procedural Actions:", [f"{a['section']}: {a['action']}" for a in bnss_actions])

        has_173 = any("173" in s for s in sec_numbers)
        self.assertTrue(has_173, "Insufficient text MUST invoke BNSS Section 173(3) Preliminary Inquiry mandate")


if __name__ == "__main__":
    unittest.main()
