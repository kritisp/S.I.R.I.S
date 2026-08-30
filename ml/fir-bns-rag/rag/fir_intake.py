import os
import io
import re
import unicodedata
from typing import Union, List, Dict, Any, Optional

try:
    import pypdf
except ImportError:
    pypdf = None

# Optional OCR support (only imported if available)
try:
    import pytesseract
    from PIL import Image
except ImportError:
    pytesseract = None
    Image = None

try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None

try:
    from pdf2image import convert_from_bytes, convert_from_path
except ImportError:
    convert_from_bytes = None
    convert_from_path = None


class FIRIntakeParser:
    """
    Step 1: FIR Intake & OCR Layer.
    Handles intake of raw FIR text strings, file paths, or PDF bytes.
    Extracts text per page, falls back to OCR if scanned PDF is detected,
    and performs text normalization and cleaning while preserving page boundaries.
    """

    def __init__(self, tesseract_cmd: Optional[str] = None):
        cmd = tesseract_cmd or os.getenv("TESSERACT_CMD")
        if cmd and pytesseract:
            pytesseract.pytesseract.tesseract_cmd = cmd

    def clean_text(self, text: str) -> str:
        """
        Normalizes unicode characters, standardizes whitespaces,
        removes non-printable noise, while preserving punctuation and line breaks.
        """
        if not text:
            return ""

        # Normalize unicode (NFKC)
        normalized = unicodedata.normalize("NFKC", text)

        # Replace excessive carriage returns or non-standard spaces
        normalized = normalized.replace("\r\n", "\n").replace("\r", "\n")
        normalized = re.sub(r"[\t\f\v ]+", " ", normalized)

        # Remove repetitive dashes, underscores or header junk
        normalized = re.sub(r"[-_=]{4,}", "---", normalized)

        # Remove control characters except standard whitespace / newline
        cleaned = "".join(ch for ch in normalized if ch == "\n" or not unicodedata.category(ch).startswith("C"))

        # Consolidate multiple consecutive newlines (max 2)
        cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)

        return cleaned.strip()

    def process_raw_text(self, raw_text: str, source_name: str = "raw_input") -> Dict[str, Any]:
        """
        Processes a plain text FIR input.
        """
        cleaned = self.clean_text(raw_text)
        return {
            "source_type": "text",
            "source_name": source_name,
            "total_pages": 1,
            "is_ocr_applied": False,
            "pages": [
                {
                    "page_number": 1,
                    "text": cleaned,
                    "char_count": len(cleaned),
                    "is_ocr": False
                }
            ],
            "full_text": cleaned,
            "char_count": len(cleaned)
        }

    def process_pdf(
        self,
        pdf_input: Union[str, bytes, io.BytesIO],
        source_name: str = "document.pdf",
        min_chars_per_page: int = 40
    ) -> Dict[str, Any]:
        """
        Extracts text from PDF (file path, bytes, or BytesIO stream).
        If digital text per page is below `min_chars_per_page`, triggers OCR fallback if available.
        """
        pages_data: List[Dict[str, Any]] = []
        is_ocr_triggered = False

        # Prepare stream / reader
        if isinstance(pdf_input, str):
            source_name = os.path.basename(pdf_input)
            if not os.path.exists(pdf_input):
                raise FileNotFoundError(f"PDF file not found at: {pdf_input}")
            with open(pdf_input, "rb") as f:
                pdf_bytes = f.read()
        elif isinstance(pdf_input, io.BytesIO):
            pdf_bytes = pdf_input.getvalue()
        elif isinstance(pdf_input, bytes):
            pdf_bytes = pdf_input
        else:
            raise ValueError(f"Unsupported pdf_input type: {type(pdf_input)}")

        # 1. Primary Extraction using pypdf
        if pypdf:
            try:
                reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
                for page_idx, page in enumerate(reader.pages, start=1):
                    raw_page_text = page.extract_text() or ""
                    cleaned_page = self.clean_text(raw_page_text)

                    # Check if page is empty / scanned
                    if len(cleaned_page) < min_chars_per_page:
                        # Attempt OCR fallback on this page
                        ocr_text = self._attempt_page_ocr(pdf_bytes, page_idx)
                        if ocr_text:
                            is_ocr_triggered = True
                            cleaned_page = self.clean_text(ocr_text)
                            pages_data.append({
                                "page_number": page_idx,
                                "text": cleaned_page,
                                "char_count": len(cleaned_page),
                                "is_ocr": True
                            })
                            continue

                    pages_data.append({
                        "page_number": page_idx,
                        "text": cleaned_page,
                        "char_count": len(cleaned_page),
                        "is_ocr": False
                    })
            except Exception as e:
                # If pypdf fails to parse, fallback to full-document OCR
                full_ocr = self._attempt_full_pdf_ocr(pdf_bytes)
                if full_ocr:
                    return self.process_raw_text(full_ocr, source_name=f"{source_name} (OCR)")
                raise RuntimeError(f"Failed to extract text from PDF: {e}")
        else:
            # If pypdf is not available, try PyMuPDF or OCR
            full_ocr = self._attempt_full_pdf_ocr(pdf_bytes)
            if full_ocr:
                return self.process_raw_text(full_ocr, source_name=f"{source_name} (OCR)")
            raise ImportError("Neither 'pypdf' nor an OCR engine is available for PDF processing.")

        full_text = "\n\n--- Page Break ---\n\n".join(p["text"] for p in pages_data if p["text"]).strip()
        if not full_text:
            # Final attempt if all pages were empty
            full_ocr = self._attempt_full_pdf_ocr(pdf_bytes)
            if full_ocr:
                return self.process_raw_text(full_ocr, source_name=f"{source_name} (OCR)")

        return {
            "source_type": "pdf",
            "source_name": source_name,
            "total_pages": len(pages_data),
            "is_ocr_applied": is_ocr_triggered,
            "pages": pages_data,
            "full_text": full_text,
            "char_count": len(full_text)
        }

    def _attempt_page_ocr(self, pdf_bytes: bytes, page_number: int) -> Optional[str]:
        """
        Attempts OCR on a specific page using PyMuPDF (fitz) or pdf2image + pytesseract if installed.
        """
        if not pytesseract:
            return None

        try:
            # Method A: PyMuPDF rasterization (fastest, no poppler needed)
            if fitz:
                doc = fitz.open(stream=pdf_bytes, filetype="pdf")
                if page_number <= len(doc):
                    page = doc[page_number - 1]
                    pix = page.get_pixmap(dpi=200)
                    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                    return pytesseract.image_to_string(img)
            # Method B: pdf2image
            elif convert_from_bytes:
                images = convert_from_bytes(pdf_bytes, first_page=page_number, last_page=page_number)
                if images:
                    return pytesseract.image_to_string(images[0])
        except Exception:
            return None

        return None

    def _attempt_full_pdf_ocr(self, pdf_bytes: bytes) -> Optional[str]:
        """
        Attempts full document OCR if text extraction yields no content.
        """
        if not pytesseract:
            return None

        extracted_pages = []
        try:
            if fitz:
                doc = fitz.open(stream=pdf_bytes, filetype="pdf")
                for page in doc:
                    pix = page.get_pixmap(dpi=200)
                    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                    text = pytesseract.image_to_string(img)
                    extracted_pages.append(text)
                return "\n\n".join(extracted_pages)
            elif convert_from_bytes:
                images = convert_from_bytes(pdf_bytes)
                for img in images:
                    extracted_pages.append(pytesseract.image_to_string(img))
                return "\n\n".join(extracted_pages)
        except Exception:
            return None

        return None

    def process_image(self, image_input: Union[str, bytes, io.BytesIO], source_name: str = "image.png") -> Dict[str, Any]:
        """
        Processes image files (.png, .jpg, .jpeg, .bmp, .tiff) via pytesseract OCR if available.
        """
        if not Image:
            return self.process_raw_text(
                "[OCR Warning] Image processing library (PIL) is unavailable.",
                source_name=source_name
            )

        try:
            if isinstance(image_input, str):
                source_name = os.path.basename(image_input)
                img = Image.open(image_input)
            elif isinstance(image_input, (bytes, io.BytesIO)):
                img_bytes = image_input if isinstance(image_input, bytes) else image_input.getvalue()
                img = Image.open(io.BytesIO(img_bytes))
            else:
                raise ValueError(f"Unsupported image_input type: {type(image_input)}")

            if pytesseract:
                ocr_text = pytesseract.image_to_string(img)
                cleaned = self.clean_text(ocr_text)
                return {
                    "source_type": "image",
                    "source_name": source_name,
                    "total_pages": 1,
                    "is_ocr_applied": True,
                    "pages": [{"page_number": 1, "text": cleaned, "char_count": len(cleaned), "is_ocr": True}],
                    "full_text": cleaned,
                    "char_count": len(cleaned)
                }
            else:
                return {
                    "source_type": "image",
                    "source_name": source_name,
                    "total_pages": 1,
                    "is_ocr_applied": False,
                    "pages": [{"page_number": 1, "text": "", "char_count": 0, "is_ocr": False}],
                    "full_text": "",
                    "char_count": 0,
                    "warning": "Tesseract OCR engine (pytesseract) is not installed in the environment."
                }
        except Exception as e:
            return self.process_raw_text(f"[OCR Error] Image processing failed: {e}", source_name=source_name)

    def ingest(self, input_data: Union[str, bytes, io.BytesIO], source_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Universal intake dispatcher.
        Automatically detects whether input is a file path (.pdf/.txt/.png/.jpg), raw text string, or binary stream.
        """
        if isinstance(input_data, str):
            # Check if it's an existing file path
            if os.path.isfile(input_data):
                ext = os.path.splitext(input_data)[1].lower()
                if ext == ".pdf":
                    return self.process_pdf(input_data, source_name=source_name or os.path.basename(input_data))
                elif ext in [".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".webp"]:
                    return self.process_image(input_data, source_name=source_name or os.path.basename(input_data))
                else:
                    with open(input_data, "r", encoding="utf-8", errors="replace") as f:
                        text_content = f.read()
                    return self.process_raw_text(text_content, source_name=source_name or os.path.basename(input_data))
            else:
                # Raw text string
                return self.process_raw_text(input_data, source_name=source_name or "raw_text_input")

        elif isinstance(input_data, (bytes, io.BytesIO)):
            return self.process_pdf(input_data, source_name=source_name or "uploaded_stream.pdf")

        else:
            raise ValueError(f"Unsupported intake data type: {type(input_data)}")


if __name__ == "__main__":
    parser = FIRIntakeParser()

    # Test 1: Raw Text Normalization
    sample_fir_text = """
    FIRST INFORMATION REPORT
    (Under Section 154 Cr.P.C. / 173 BNSS)
    
    1. District: Central Delhi    P.S.: Daryaganj    Year: 2024    FIR No.: 0142/2024
    2. Acts & Sections: BNS 2023 - Sec 303(2), Sec 305
    3. Occurrence of Offence: Day: Monday  Date: 12/08/2024  Time: 23:30 hrs
    4. Complainant / Informant: Rajesh Kumar s/o Late Mohan Lal
    5. Details of Suspect: Unknown persons (approx 2-3 men with face covered)
    6. Brief Details: The complainant reported that at around 11:30 PM, unknown persons broke the rear window lock of his residence at Daryaganj, entered the dwelling house, and dishonestly took gold ornaments worth approx Rs. 4,50,000/- and cash of Rs. 60,000/- from the almirah.
    """

    res = parser.ingest(sample_fir_text)
    print("--- Test 1: Raw Text Intake ---")
    print(f"Source: {res['source_name']}, Pages: {res['total_pages']}, Chars: {res['char_count']}")
    print(res["full_text"][:250], "...\n")

    # Test 2: Ingest existing PDF in project if present
    bnss_pdf = "documents/BNSS_2023.pdf"
    if os.path.exists(bnss_pdf):
        print("--- Test 2: Ingest Existing Project PDF ---")
        pdf_res = parser.process_pdf(bnss_pdf)
        print(f"Source: {pdf_res['source_name']}, Total Pages: {pdf_res['total_pages']}, Total Chars: {pdf_res['char_count']}")
        print("First Page Content Sample:")
        print(pdf_res["pages"][0]["text"][:200], "...")
