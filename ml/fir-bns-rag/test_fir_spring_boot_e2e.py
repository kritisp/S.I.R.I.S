import unittest
import os
import sys
import io
import json
from PIL import Image, ImageDraw

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from api_server import app, INTERNAL_API_KEY


class TestFirSpringBootFastApiIntegration(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.api_key = INTERNAL_API_KEY

    def test_01_missing_internal_api_key_returns_401(self):
        """TEST 4: Missing internal API key returns 401 Unauthorized."""
        response = self.client.post("/process-fir", data={"fir_text": "Sample text"})
        self.assertEqual(response.status_code, 401)
        self.assertIn("Invalid or missing X-Internal-API-Key", response.json()["detail"])

    def test_02_invalid_internal_api_key_returns_401(self):
        """TEST 5: Invalid internal API key returns 401 Unauthorized."""
        headers = {"X-Internal-API-Key": "invalid-secret-key-9999"}
        response = self.client.post("/process-fir", data={"fir_text": "Sample text"}, headers=headers)
        self.assertEqual(response.status_code, 401)
        self.assertIn("Invalid or missing X-Internal-API-Key", response.json()["detail"])

    def test_03_valid_internal_api_key_raw_text_succeeds(self):
        """TEST 1: Valid internal API key with raw text FIR returns 200 and intelligence JSON."""
        headers = {"X-Internal-API-Key": self.api_key}
        fir_text = (
            "Complainant John Doe (Ph: 9876543210) reported that two armed suspects "
            "broke the rear window lock of his house in Saheed Nagar at 23:30, "
            "stole a gold chain and Rs 50,000 cash, and fled in vehicle OD-02-AB-1234."
        )
        response = self.client.post("/process-fir", data={"fir_text": fir_text}, headers=headers)
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertIn("bns_sections", data)
        self.assertIn("investigation_actions", data)
        self.assertTrue(len(data["bns_sections"]) > 0)
        self.assertTrue(len(data["investigation_actions"]) > 0)
        self.assertTrue(data.get("masking_used", False))

    def test_04_text_file_upload_succeeds(self):
        """TEST 2: Text file upload forwards and processes correctly."""
        headers = {"X-Internal-API-Key": self.api_key}
        text_bytes = b"FIRST INFORMATION REPORT\nBurglars entered house and stole cash."
        files = {"file": ("fir_report.txt", text_bytes, "text/plain")}
        
        response = self.client.post("/process-fir", files=files, headers=headers)
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertIn("bns_sections", data)
        self.assertTrue(len(data["bns_sections"]) > 0)

    def test_05_image_file_upload_succeeds(self):
        """TEST 3: Image file upload triggers OCR and processes correctly."""
        headers = {"X-Internal-API-Key": self.api_key}
        
        # Create small test image
        img = Image.new('RGB', (400, 200), color=(255, 255, 255))
        d = ImageDraw.Draw(img)
        d.text((20, 20), "FIR: House lock broken and cash stolen.", fill=(0, 0, 0))
        
        img_bytes_io = io.BytesIO()
        img.save(img_bytes_io, format='PNG')
        img_bytes = img_bytes_io.getvalue()
        
        files = {"file": ("sample_fir.png", img_bytes, "image/png")}
        response = self.client.post("/process-fir", files=files, headers=headers)
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertIn("bns_sections", data)


if __name__ == "__main__":
    unittest.main()
