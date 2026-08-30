import os
import re
from typing import List, Dict
import pypdf
from langchain_core.documents import Document


def load_and_parse_bnss(pdf_path: str = "documents/BNSS_2023.pdf") -> List[Document]:
    """
    Legal-aware parser for Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023.
    Extracts all 531 structured sections with Section Number, Section Title, Chapter, and Text.
    """
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF file not found at: {pdf_path}")

    reader = pypdf.PdfReader(pdf_path)
    full_text = "\n".join([page.extract_text() for page in reader.pages if page.extract_text()])

    # Skip initial Table of Contents / Index to parse actual body text
    body_offset = 12000
    body_text = full_text[body_offset:]

    # 1. Locate all section headings in body text: \n{num}. {Title}
    section_pattern = r'\n(\d{1,3})\.\s+([A-Z][^\n]+?)(?=\.\s*[\(—\n]|\s*—|\s*\n)'
    matches = list(re.finditer(section_pattern, body_text))

    # 2. Locate all Chapter headings with position
    chapter_pattern = r'(CHAPTER\s+[I|V|X|L|C|D|M]+\b[^\n]*)'
    chapter_matches = list(re.finditer(chapter_pattern, body_text))

    documents: List[Document] = []

    for i, match in enumerate(matches):
        sec_num = match.group(1)
        sec_title = match.group(2).strip().rstrip('.').rstrip('—')
        start_idx = match.start()
        end_idx = matches[i + 1].start() if i + 1 < len(matches) else len(body_text)

        section_raw_text = body_text[start_idx:end_idx].strip()

        # Identify active chapter
        current_chapter = "CHAPTER I - PRELIMINARY"
        for ch_match in chapter_matches:
            if ch_match.start() < start_idx:
                current_chapter = ch_match.group(1).strip()
            else:
                break

        # Attach statutory header for high-precision retrieval
        structured_content = (
            f"BNSS Section {sec_num}: {sec_title}\n"
            f"Chapter: {current_chapter}\n\n"
            f"{section_raw_text}"
        )

        metadata = {
            "section_number": str(sec_num),
            "section_title": sec_title,
            "chapter": current_chapter,
            "source": os.path.basename(pdf_path)
        }

        doc = Document(
            page_content=structured_content,
            metadata=metadata
        )
        documents.append(doc)

    print(f"Successfully parsed {len(documents)} structured BNSS legal sections from PDF.")
    return documents


if __name__ == "__main__":
    docs = load_and_parse_bnss()
    if docs:
        print("\n--- Sample Parsed Legal Section ---")
        print("Metadata:", docs[0].metadata)
        print("Content Header:\n", docs[0].page_content[:300])
