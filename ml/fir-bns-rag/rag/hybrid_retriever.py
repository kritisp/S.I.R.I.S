import os
import sys
from typing import List, Dict, Any, Optional
import re
from rank_bm25 import BM25Okapi

# Add parent directory to path to import ingestion, vectorstore, embedding modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ingestion import load_and_parse_bnss
from vectorstore import BNSSVectorStore


class HybridRetriever:
    """
    Hybrid Retriever combining BGE-M3 Dense Vector Search with BM25 Sparse Keyword Search using Reciprocal Rank Fusion (RRF).
    """
    def __init__(self, vectorstore: Optional[BNSSVectorStore] = None):
        self.vectorstore = vectorstore or BNSSVectorStore()
        
        # Load all documents to build BM25 index
        print("Initializing BM25 Sparse Index over BNSS sections...")
        self.docs = load_and_parse_bnss()
        self.doc_map = {doc.metadata["section_number"]: doc for doc in self.docs}
        
        # Tokenize documents for BM25
        self.corpus_tokens = [self._tokenize(doc.page_content) for doc in self.docs]
        self.bm25 = BM25Okapi(self.corpus_tokens)
        print(f"BM25 Sparse Index built over {len(self.docs)} legal section documents.")

    def _tokenize(self, text: str) -> List[str]:
        """Simple lower-case word tokenization for legal BM25."""
        return re.findall(r'\b\w+\b', text.lower())

    def dense_search(self, query: str, top_k: int = 20) -> List[Dict[str, Any]]:
        """Dense similarity search via ChromaDB BGE-M3."""
        return self.vectorstore.query(query_text=query, top_k=top_k)

    def sparse_search(self, query: str, top_k: int = 20) -> List[Dict[str, Any]]:
        """Sparse keyword search via BM25."""
        query_tokens = self._tokenize(query)
        scores = self.bm25.get_scores(query_tokens)
        
        # Top-k document indices
        top_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:top_k]
        
        results = []
        for rank, idx in enumerate(top_indices, 1):
            doc = self.docs[idx]
            results.append({
                "document": doc.page_content,
                "metadata": doc.metadata,
                "sparse_score": float(scores[idx]),
                "rank": rank
            })
        return results

    def hybrid_search(self, query: str, top_k: int = 20, rrf_k: int = 60) -> List[Dict[str, Any]]:
        """
        Merges Dense & Sparse Search using Reciprocal Rank Fusion (RRF).
        RRF Score(d) = 1 / (rrf_k + r_dense) + 1 / (rrf_k + r_sparse)
        """
        dense_results = self.dense_search(query, top_k=top_k)
        sparse_results = self.sparse_search(query, top_k=top_k)

        rrf_scores: Dict[str, float] = {}
        doc_store: Dict[str, Dict[str, Any]] = {}

        # 1. Process Dense Ranks
        for rank, res in enumerate(dense_results, 1):
            sec_num = res["metadata"].get("section_number")
            if not sec_num:
                continue
            rrf_scores[sec_num] = rrf_scores.get(sec_num, 0.0) + (1.0 / (rrf_k + rank))
            doc_store[sec_num] = res

        # 2. Process Sparse Ranks
        for rank, res in enumerate(sparse_results, 1):
            sec_num = res["metadata"].get("section_number")
            if not sec_num:
                continue
            rrf_scores[sec_num] = rrf_scores.get(sec_num, 0.0) + (1.0 / (rrf_k + rank))
            if sec_num not in doc_store:
                doc_store[sec_num] = res

        # 3. Sort by combined RRF score
        sorted_sec_nums = sorted(rrf_scores.keys(), key=lambda s: rrf_scores[s], reverse=True)[:top_k]

        fused_results = []
        for sec_num in sorted_sec_nums:
            item = doc_store[sec_num]
            item["rrf_score"] = round(rrf_scores[sec_num], 6)
            fused_results.append(item)

        return fused_results


if __name__ == "__main__":
    retriever = HybridRetriever()
    res = retriever.hybrid_search("house trespass stolen property night theft", top_k=5)
    print("\n--- Hybrid Search RRF Top Results ---")
    for r in res:
        print(f"[RRF Score: {r['rrf_score']}] Sec {r['metadata']['section_number']}: {r['metadata']['section_title']}")
