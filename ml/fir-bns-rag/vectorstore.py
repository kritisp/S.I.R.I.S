import os
from typing import List, Dict, Any, Optional
import chromadb
from langchain_core.documents import Document
from embedding import get_embedding_function, BGE_M3_Embeddings


class BNSSVectorStore:
    """
    ChromaDB vector database manager for storing BNSS legal sections with BGE-M3 embeddings and metadata.
    """
    def __init__(
        self,
        db_path: str = "chroma_db_bge_m3",
        collection_name: str = "bnss_legal_bge_m3",
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
        """
        Extracts page_content, metadata, generates BGE-M3 embeddings, and stores in ChromaDB.
        """
        print(f"Indexing {len(documents)} legal sections into ChromaDB collection '{self.collection_name}'...")
        
        for i in range(0, len(documents), batch_size):
            batch_docs = documents[i : i + batch_size]
            texts = [doc.page_content for doc in batch_docs]
            metadatas = [doc.metadata for doc in batch_docs]
            ids = [f"sec_{doc.metadata.get('section_number', idx)}" for idx, doc in enumerate(batch_docs, i)]
            
            embeddings = self.embedder.embed_documents(texts)
            
            self.collection.add(
                ids=ids,
                documents=texts,
                embeddings=embeddings,
                metadatas=metadatas
            )
            print(f"Indexed batch {i // batch_size + 1}/{(len(documents) + batch_size - 1) // batch_size} ({len(batch_docs)} sections)...")

        print(f"Successfully indexed total {self.collection.count()} sections in ChromaDB vectorstore!")

    def query(self, query_text: str, top_k: int = 5, where_filter: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Queries ChromaDB vector database using BGE-M3 query embedding and optional metadata filters.
        """
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
    from ingestion import load_and_parse_bnss
    
    docs = load_and_parse_bnss()
    store = BNSSVectorStore()
    if store.collection.count() == 0:
        store.add_documents(docs)
    
    results = store.query("What is the procedure for reporting a cognizable offence?", top_k=3)
    print("\n--- Query Test Results ---")
    for r in results:
        print(f"[Score: {r['similarity_score']}] Section {r['metadata'].get('section_number')}: {r['metadata'].get('section_title')}")
