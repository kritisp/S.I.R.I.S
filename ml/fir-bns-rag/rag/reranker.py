from typing import List, Dict, Any


class LegalReranker:
    """
    Memory-Safe Reranker module. Performs reranking if memory allows, or vector rank fallback instantly.
    """
    def __init__(self, model_name: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"):
        print(f"Loading Legal Reranker model: {model_name}...")
        self.model = None
        try:
            from sentence_transformers import CrossEncoder
            self.model = CrossEncoder(model_name, device="cpu")
            print("CrossEncoder loaded successfully!")
        except Exception as e:
            print(f"[Memory Protection] Reranker offline mode active ({e})")
            self.model = None

    def rerank(self, query: str, candidate_docs: List[Dict[str, Any]], top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Reranks top candidate documents.
        """
        if not candidate_docs:
            return []

        if self.model is not None:
            try:
                pairs = [[query, doc["document"]] for doc in candidate_docs]
                scores = self.model.predict(pairs)

                for doc, score in zip(candidate_docs, scores):
                    doc["rerank_score"] = float(score)

                reranked = sorted(candidate_docs, key=lambda d: d["rerank_score"], reverse=True)[:top_k]
                return reranked
            except Exception as e:
                print(f"[Memory Protection Notice] Reranker predict error ({e}). Returning top candidates.")

        return candidate_docs[:top_k]


if __name__ == "__main__":
    reranker = LegalReranker()
    res = reranker.rerank("test query", [{"document": "test doc", "metadata": {"section_number": "1"}}])
    print("Rerank output count:", len(res))
