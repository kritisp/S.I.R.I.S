import unittest
import json
from rag.fir_entity_extractor import FIREntityExtractor


class TestFIREntityExtractor(unittest.TestCase):

    def setUp(self):
        self.extractor = FIREntityExtractor()

    def test_structured_header_fir(self):
        fir_text = """
        FIRST INFORMATION REPORT
        (Under Section 154 Cr.P.C. / 173 BNSS)
        
        1. District: Khordha    P.S.: Khandagiri    Year: 2026    FIR No.: 0048/2026
        2. Acts & Sections: BNS 2023 - Sec 303(2), Sec 305
        3. Occurrence of Offence: Date: 15/08/2026 Time: 23:30 hrs
        4. Complainant: Rajesh Kumar s/o Mohan Lal, Mob: 9876543210, r/o Plot 42, Khandagiri
        5. Details of Suspect: Ramesh and Suresh
        6. Details of Witnesses: Witness Suresh saw suspects fleeing
        7. Brief Details: The complainant reported that at around 11:30 PM, suspects broke rear door lock, entered his residence at Khandagiri, brandished a knife, and stole gold ornaments worth Rs. 2,00,000/- and cash of Rs. 50,000/-. Getaway vehicle was OD-02-AB-1234.
        """
        res = self.extractor.extract(fir_text)
        
        self.assertEqual(res["fir_metadata"]["fir_number"], "0048/2026")
        self.assertIn("9876543210", res["phones"])
        self.assertIn("OD02AB1234", res["vehicles"])
        self.assertIsNotNone(res["people"]["complainant"])
        self.assertIn("Rajesh Kumar", res["people"]["complainant"]["name"])
        self.assertTrue(len(res["people"]["accused"]) > 0)
        self.assertTrue(len(res["weapons"]) > 0)
        self.assertTrue(len(res["property"]) > 0)

    def test_narrative_style_fir(self):
        fir_text = """
        On 12-08-2024 at around 10:45 PM, Priyadarshi Mohanty lodged a complaint at Saheed Nagar Police Station.
        He stated that while returning home near Saheed Nagar, two unknown motorcycle riders on OR-02-X-9999 blocked his path,
        threatened him at gunpoint with a pistol, and snatched his iPhone and wallet containing Rs. 15,000 cash.
        Eyewitness Amit Kumar witnessed the crime from a nearby shop.
        """
        res = self.extractor.extract(fir_text)

        self.assertIsNotNone(res["people"]["complainant"])
        self.assertIn("Priyadarshi Mohanty", res["people"]["complainant"]["name"])
        self.assertTrue(any(a["name"] == "Unknown / Unidentified person(s)" for a in res["people"]["accused"]))
        self.assertTrue(len(res["people"]["witnesses"]) > 0)
        self.assertIn("OR02X9999", res["vehicles"])

    def test_cyber_fraud_fir_with_cash_amount(self):
        fir_text = """
        FIR Date: 20/08/2026
        P.S.: Cyber Crime PS
        Complainant: Sunita Sharma, Phone: 9123456789
        Details: Complainant received a phishing link on WhatsApp. Fraudsters deceptively transferred Rs. 1,50,000 from her bank account at SBI Main Branch.
        """
        res = self.extractor.extract(fir_text)

        self.assertEqual(res["incident"]["crime_domain"], "cyber_crimes")
        self.assertIsNotNone(res["people"]["complainant"])

    def test_missing_fields_fir(self):
        fir_text = """
        Unidentified dead body found near railway tracks on 10/08/2026. No FIR number or suspect details specified.
        """
        res = self.extractor.extract(fir_text)

        self.assertTrue(len(res["missing_information"]) > 0)
        self.assertIsNone(res["fir_metadata"]["fir_number"])

    def test_multiple_accused_and_victims(self):
        fir_text = """
        FIR No.: 0112/2026
        P.S.: Cuttack City PS
        Complainant: Anita Roy
        Accused: Ramesh and Suresh
        Victims: Anita Roy and Deepak Roy
        Details: Accused Ramesh and Suresh assaulted Anita Roy and Deepak Roy with an iron rod over a land dispute.
        """
        res = self.extractor.extract(fir_text)

        self.assertEqual(res["fir_metadata"]["fir_number"], "0112/2026")
        self.assertIsNotNone(res["people"]["complainant"])
        self.assertTrue(len(res["people"]["victims"]) >= 1)
        self.assertTrue(len(res["weapons"]) > 0)

    def test_dowry_cruelty_offence_against_women(self):
        fir_text = """
        P.S.: Mahila Police Station, Bhubaneswar
        Complainant: Meena Kumari
        Details: Complainant reported that her husband Rajesh and in-laws harassed her for dowry demanding a luxury car and Rs. 5,00,000 in cash.
        """
        res = self.extractor.extract(fir_text)

        self.assertEqual(res["incident"]["crime_domain"], "offences_against_women")
        self.assertIsNotNone(res["people"]["complainant"])
        self.assertEqual(res["people"]["complainant"]["relationship"], "spouse")

    def test_financial_forgery_and_cheating(self):
        fir_text = """
        FIR No.: 0099/2026
        P.S.: Capital Police Station
        Complainant: Subhash Chandra
        Details: Employee forged medical bills and cheated company amounting to Rs. 3,50,000/-.
        """
        res = self.extractor.extract(fir_text)

        self.assertEqual(res["incident"]["crime_domain"], "financial_crimes")
        self.assertTrue(len(res["evidence"]) > 0)


if __name__ == "__main__":
    unittest.main()
