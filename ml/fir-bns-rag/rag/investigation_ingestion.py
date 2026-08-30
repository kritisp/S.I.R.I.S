import os
import re
from typing import List, Dict, Any
from langchain_core.documents import Document


def load_and_parse_investigation_knowledge(
    dir_path: str = "documents/investigation_knowledge"
) -> List[Document]:
    """
    Parses police investigation guidelines from documents/investigation_knowledge/ into structured LangChain Document objects.
    Extracts metadata: document_type, crime_category, investigation_stage, action_type, source.
    """
    if not os.path.exists(dir_path):
        # Check relative path from root if script is executed from subfolder
        dir_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "documents", "investigation_knowledge")

    if not os.path.exists(dir_path):
        raise FileNotFoundError(f"Investigation knowledge directory not found at: {dir_path}")

    documents: List[Document] = []

    for fname in os.listdir(dir_path):
        if not fname.endswith(".txt"):
            continue

        fpath = os.path.join(dir_path, fname)
        with open(fpath, "r", encoding="utf-8") as f:
            content = f.read()

        # Parse header metadata
        category_match = re.search(r'CRIME_CATEGORY:\s*([^\n]+)', content)
        crime_category = category_match.group(1).strip() if category_match else fname.replace(".txt", "")

        # Parse individual [STAGE: ...] blocks
        stage_blocks = re.findall(r'\[STAGE:\s*([^\]]+)\]\s*\nACTION:\s*([^\n]+)\nPURPOSE:\s*([^\n]+)\nEVIDENCE_GENERATED:\s*([^\n]+)', content)

        for stage, action, purpose, evidence in stage_blocks:
            stage_str = stage.strip()
            action_str = action.strip()
            purpose_str = purpose.strip()
            evidence_str = evidence.strip()

            page_content = (
                f"Investigation Stage: {stage_str}\n"
                f"Crime Category: {crime_category}\n"
                f"Action Required: {action_str}\n"
                f"Purpose: {purpose_str}\n"
                f"Evidence Generated: {evidence_str}"
            )

            metadata = {
                "document_type": "investigation_guideline",
                "crime_category": crime_category,
                "investigation_stage": stage_str,
                "action_type": action_str,
                "purpose": purpose_str,
                "evidence_generated": evidence_str,
                "source": fname
            }

            doc = Document(page_content=page_content, metadata=metadata)
            documents.append(doc)

    print(f"Successfully parsed {len(documents)} investigation knowledge guideline stages across category files.")
    return documents


if __name__ == "__main__":
    docs = load_and_parse_investigation_knowledge()
    if docs:
        print("\n--- Sample Parsed Investigation Guideline ---")
        print("Metadata:", docs[0].metadata)
        print("Content:\n", docs[0].page_content)
