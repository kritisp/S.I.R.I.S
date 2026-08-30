import os
import sys
import re
from typing import List, Dict, Any, Optional
try:
    from rank_bm25 import BM25Okapi
except ImportError:
    BM25Okapi = None

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from rag.investigation_ingestion import load_and_parse_investigation_knowledge
from rag.investigation_vectorstore import InvestigationVectorStore
from rag.reranker import LegalReranker
from rag.category_registry import CategoryRegistry


class InvestigationKnowledgeRetriever:
    """
    RAG-based retriever for police investigation guidelines.
    Routes validated BNS offences & crime categories via CategoryRegistry to retrieve SOPs.
    """
    def __init__(self, vectorstore: Optional[InvestigationVectorStore] = None, reranker: Optional[LegalReranker] = None):
        print("Initializing Investigation Knowledge Retriever with Category Registry...")
        self.vectorstore = vectorstore or InvestigationVectorStore()
        self.reranker = reranker or LegalReranker()
        self.docs = load_and_parse_investigation_knowledge()

        if self.vectorstore.collection.count() == 0:
            self.vectorstore.add_documents(self.docs)

        if BM25Okapi:
            self.bm25 = BM25Okapi([self._tokenize(doc.page_content) for doc in self.docs])
        else:
            self.bm25 = None
        print("Investigation Knowledge Retriever initialized successfully!")

    def _tokenize(self, text: str) -> List[str]:
        return re.findall(r'\b\w+\b', text.lower())

    def retrieve_guidelines_for_bns(
        self,
        bns_offences: List[Dict[str, Any]],
        case_keywords: List[str] = None,
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Routes validated BNS offences via CategoryRegistry to generate targeted retrieval query.
        """
        target_categories = CategoryRegistry.get_categories_for_bns(bns_offences, case_keywords)
        
        category_names = [CategoryRegistry.CATEGORIES[c]["name"] for c in target_categories if c in CategoryRegistry.CATEGORIES]
        query_str = f"{' '.join(target_categories)} {' '.join(category_names)} investigation procedure evidence collection recovery"

        # Dense Search
        dense_results = self.vectorstore.query(query_text=query_str, top_k=15)

        # Sparse BM25 Search
        sparse_results = []
        if self.bm25:
            scores = self.bm25.get_scores(self._tokenize(query_str))
            top_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:15]
            for rank, idx in enumerate(top_indices, 1):
                doc = self.docs[idx]
                sparse_results.append({
                    "document": doc.page_content,
                    "metadata": doc.metadata,
                    "rank": rank
                })

        # RRF Fusion
        rrf_scores: Dict[int, float] = {}
        doc_store: Dict[int, Dict[str, Any]] = {}

        for rank, res in enumerate(dense_results, 1):
            idx = id(res["metadata"]["action_type"])
            rrf_scores[idx] = rrf_scores.get(idx, 0.0) + (1.0 / (60 + rank))
            doc_store[idx] = res

        for rank, res in enumerate(sparse_results, 1):
            idx = id(res["metadata"]["action_type"])
            rrf_scores[idx] = rrf_scores.get(idx, 0.0) + (1.0 / (60 + rank))
            if idx not in doc_store:
                doc_store[idx] = res

        sorted_idxs = sorted(rrf_scores.keys(), key=lambda i: rrf_scores[i], reverse=True)[:10]
        fused_candidates = [doc_store[i] for i in sorted_idxs]

        # Rerank candidates
        reranked = self.reranker.rerank(query=query_str, candidate_docs=fused_candidates, top_k=top_k)
        return reranked


if __name__ == "__main__":
    retriever = InvestigationKnowledgeRetriever()
    mock_bns = [
        {"section": "Section 111", "title": "Organized crime"},
        {"section": "Section 106", "title": "Hit and run traffic accident"}
    ]
    results = retriever.retrieve_guidelines_for_bns(mock_bns, top_k=3)
    print("\n--- Retrieved Guidelines for BNS Organized Crime / Hit-and-Run ---")
    for r in results:
        m = r["metadata"]
        print(f"Stage: {m.get('investigation_stage')} | Action: {m.get('action_type')[:60]}...")
