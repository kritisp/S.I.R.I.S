import os
import sys
from typing import List, Dict, Any, Optional
import chromadb
from langchain_core.documents import Document

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from embedding import get_embedding_function, BGE_M3_Embeddings


class InvestigationVectorStore:
    """
    ChromaDB vector store manager for police investigation guidelines collection 'investigation_knowledge'.
    """
    def __init__(
        self,
        db_path: str = "chroma_db_bge_m3",
        collection_name: str = "investigation_knowledge",
        embedder: Optional[BGE_M3_Embeddings] = None
    ):
        self.db_path = db_path
        self.collection_name = collection_name
        self.chroma_client = chromadb.PersistentClient(path=db_path)
        self.embedder = embedder or get_embedding_function()

        self.collection = self.chroma_client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"}
        )

    def add_documents(self, documents: List[Document], batch_size: int = 32):
        print(f"Indexing {len(documents)} investigation guidelines into Chroma collection '{self.collection_name}'...")

        for i in range(0, len(documents), batch_size):
            batch_docs = documents[i : i + batch_size]
            texts = [doc.page_content for doc in batch_docs]
            metadatas = [doc.metadata for doc in batch_docs]
            ids = [f"inv_guideline_{idx}" for idx in range(i, i + len(batch_docs))]

            embeddings = self.embedder.embed_documents(texts)

            self.collection.add(
                ids=ids,
                documents=texts,
                embeddings=embeddings,
                metadatas=metadatas
            )

        print(f"Successfully indexed total {self.collection.count()} investigation guidelines in Chroma vectorstore!")

    def query(self, query_text: str, top_k: int = 5, where_filter: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        query_embedding = self.embedder.embed_query(query_text)
        query_kwargs: Dict[str, Any] = {
            "query_embeddings": [query_embedding],
            "n_results": top_k
        }

        if where_filter:
            query_kwargs["where"] = where_filter

        results = self.collection.query(**query_kwargs)
        output = []
        if results and results.get("documents"):
            docs = results["documents"][0]
            metas = results["metadatas"][0] if results.get("metadatas") else [{}] * len(docs)
            distances = results["distances"][0] if results.get("distances") else [0.0] * len(docs)

            for doc, meta, dist in zip(docs, metas, distances):
                output.append({
                    "document": doc,
                    "metadata": meta,
                    "distance": dist,
                    "similarity_score": round(1.0 - dist, 4)
                })
        return output


if __name__ == "__main__":
    from rag.investigation_ingestion import load_and_parse_investigation_knowledge
    docs = load_and_parse_investigation_knowledge()
    store = InvestigationVectorStore()
    if store.collection.count() == 0:
        store.add_documents(docs)

    res = store.query("property crime investigation evidence collection recovery procedure", top_k=3)
    print("\n--- Investigation Vector Query Results ---")
    for r in res:
        m = r["metadata"]
        print(f"[Score: {r['similarity_score']}] Stage: {m.get('investigation_stage')} ({m.get('source')})")
