import os
import sys
from typing import List, Dict, Any, Optional
import re
try:
    from rank_bm25 import BM25Okapi
except ImportError:
    BM25Okapi = None

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ingestion import load_and_parse_bnss
from vectorstore import BNSSVectorStore
from bns_ingestion import load_and_parse_bns
from bns_vectorstore import BNSVectorStore


class MultiLawRetriever:
    """
    Dual-Law Hybrid Retriever managing distinct RAG search pipelines:
    1. BNS Substantive Offences RAG ('bns_legal_sections')
    2. BNSS Procedural Law RAG ('bnss_legal_bge_m3')
    """
    def __init__(self):
        print("Initializing Dual-Law Retriever (BNS Substantive + BNSS Procedural)...")

        # 1. BNSS Procedural VectorStore & BM25
        self.bnss_vectorstore = BNSSVectorStore()
        self.bnss_docs = load_and_parse_bnss()
        if BM25Okapi:
            self.bnss_bm25 = BM25Okapi([self._tokenize(doc.page_content) for doc in self.bnss_docs])
        else:
            self.bnss_bm25 = None

        # 2. BNS Substantive VectorStore & BM25
        self.bns_vectorstore = BNSVectorStore()
        self.bns_docs = load_and_parse_bns()
        if self.bns_vectorstore.collection.count() == 0:
            self.bns_vectorstore.add_documents(self.bns_docs)

        if BM25Okapi:
            self.bns_bm25 = BM25Okapi([self._tokenize(doc.page_content) for doc in self.bns_docs])
        else:
            self.bns_bm25 = None
        print("Dual-Law Retriever initialized successfully!")

    def _tokenize(self, text: str) -> List[str]:
        return re.findall(r'\b\w+\b', text.lower())

    def search_bns_offences(
        self,
        query: str,
        expanded_concepts: Optional[List[str]] = None,
        crime_category: Optional[str] = None,
        top_k: int = 15,
        rrf_k: int = 60
    ) -> List[Dict[str, Any]]:
        """
        Retrieves top candidate BNS Substantive Offences (BNS 2023) using Multi-Factor Hybrid Retrieval.
        Combines User Query + Expanded Legal Concepts across BGE-M3 Dense Search and BM25 Sparse Search.
        """
        search_phrases = [query]
        if expanded_concepts:
            search_phrases.extend(expanded_concepts)
        
        combined_query_text = " ".join(search_phrases)

        # Optional metadata category filter
        where_filter = None
        if crime_category and crime_category not in ["general_penal", "General Offence / Procedure"]:
            where_filter = {"crime_category": crime_category}

        # 1. Dense Search with Combined Legal Query
        try:
            dense_results = self.bns_vectorstore.query(query_text=combined_query_text, top_k=top_k, where_filter=where_filter)
        except Exception:
            dense_results = self.bns_vectorstore.query(query_text=combined_query_text, top_k=top_k)

        # 2. BM25 Sparse Search on BNS
        sparse_results = []
        if self.bns_bm25:
            query_tokens = self._tokenize(combined_query_text)
            scores = self.bns_bm25.get_scores(query_tokens)
            top_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:top_k]
            for rank, idx in enumerate(top_indices, 1):
                doc = self.bns_docs[idx]
                sparse_results.append({
                    "document": doc.page_content,
                    "metadata": doc.metadata,
                    "rank": rank
                })

        # 3. RRF Fusion
        rrf_scores: Dict[str, float] = {}
        doc_store: Dict[str, Dict[str, Any]] = {}

        for rank, res in enumerate(dense_results, 1):
            sec = res["metadata"].get("section_number")
            if sec:
                rrf_scores[sec] = rrf_scores.get(sec, 0.0) + (1.0 / (rrf_k + rank))
                doc_store[sec] = res

        for rank, res in enumerate(sparse_results, 1):
            sec = res["metadata"].get("section_number")
            if sec:
                rrf_scores[sec] = rrf_scores.get(sec, 0.0) + (1.0 / (rrf_k + rank))
                if sec not in doc_store:
                    doc_store[sec] = res

        sorted_secs = sorted(rrf_scores.keys(), key=lambda s: rrf_scores[s], reverse=True)[:top_k]
        return [doc_store[sec] for sec in sorted_secs]

    def search_bnss_procedures(self, query: str, top_k: int = 15, rrf_k: int = 60) -> List[Dict[str, Any]]:
        """
        Retrieves top candidate BNSS Procedural Actions (BNSS 2023).
        """
        dense_results = self.bnss_vectorstore.query(query_text=query, top_k=top_k)

        sparse_results = []
        if self.bnss_bm25:
            query_tokens = self._tokenize(query)
            scores = self.bnss_bm25.get_scores(query_tokens)
            top_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:top_k]
            for rank, idx in enumerate(top_indices, 1):
                doc = self.bnss_docs[idx]
                sparse_results.append({
                    "document": doc.page_content,
                    "metadata": doc.metadata,
                    "rank": rank
                })

        # RRF Fusion
        rrf_scores: Dict[str, float] = {}
        doc_store: Dict[str, Dict[str, Any]] = {}

        for rank, res in enumerate(dense_results, 1):
            sec = res["metadata"].get("section_number")
            if sec:
                rrf_scores[sec] = rrf_scores.get(sec, 0.0) + (1.0 / (rrf_k + rank))
                doc_store[sec] = res

        for rank, res in enumerate(sparse_results, 1):
            sec = res["metadata"].get("section_number")
            if sec:
                rrf_scores[sec] = rrf_scores.get(sec, 0.0) + (1.0 / (rrf_k + rank))
                if sec not in doc_store:
                    doc_store[sec] = res

        sorted_secs = sorted(rrf_scores.keys(), key=lambda s: rrf_scores[s], reverse=True)[:top_k]
        return [doc_store[sec] for sec in sorted_secs]


if __name__ == "__main__":
    retriever = MultiLawRetriever()
    bns_res = retriever.search_bns_offences("house trespass stolen jewellery night theft", top_k=3)
    bnss_res = retriever.search_bnss_procedures("FIR investigation audio video search seizure", top_k=3)

    print("\n--- BNS Substantive Offences Results ---")
    for r in bns_res:
        print(f"[{r['metadata']['law']}] Sec {r['metadata']['section_number']}: {r['metadata']['title']}")

    print("\n--- BNSS Procedural Actions Results ---")
    for r in bnss_res:
        print(f"[{r['metadata'].get('source')}] Sec {r['metadata']['section_number']}: {r['metadata']['section_title']}")
