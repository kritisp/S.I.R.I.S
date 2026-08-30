from typing import List, Dict, Any, Optional
from vectorstore import BNSSVectorStore


class BNSSRetriever:
    """
    Retriever module for querying BNSS legal sections with metadata filtering and statutory citation formatting.
    """
    def __init__(self, vectorstore: Optional[BNSSVectorStore] = None):
        self.vectorstore = vectorstore or BNSSVectorStore()

    def retrieve(
        self,
        query: str,
        top_k: int = 5,
        section_filter: Optional[str] = None,
        chapter_filter: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieves relevant legal sections for a query.
        """
        where_filter = {}
        if section_filter:
            where_filter["section_number"] = str(section_filter)
        if chapter_filter:
            where_filter["chapter"] = str(chapter_filter)

        results = self.vectorstore.query(
            query_text=query,
            top_k=top_k,
            where_filter=where_filter if where_filter else None
        )
        return results

    def get_formatted_context(self, query: str, top_k: int = 5) -> str:
        """
        Formats retrieved legal context for LLM prompt context injection with explicit statutory citations.
        """
        results = self.retrieve(query, top_k=top_k)
        formatted_chunks = []

        for idx, res in enumerate(results, 1):
            meta = res["metadata"]
            sec_num = meta.get("section_number", "N/A")
            sec_title = meta.get("section_title", "N/A")
            chapter = meta.get("chapter", "N/A")
            score = res.get("similarity_score", 0.0)

            chunk_text = (
                f"--- [RELEVANT STATUTORY CONTEXT #{idx}] ---\n"
                f"Statute: Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023\n"
                f"Section {sec_num}: {sec_title}\n"
                f"Chapter: {chapter}\n"
                f"Relevance Score: {score}\n\n"
                f"{res['document']}\n"
            )
            formatted_chunks.append(chunk_text)

        return "\n\n".join(formatted_chunks)


if __name__ == "__main__":
    retriever = BNSSRetriever()
    context = retriever.get_formatted_context("What are the powers of police to arrest without a warrant?", top_k=2)
    print("\n--- Formatted Legal Context Output ---")
    print(context[:600])
