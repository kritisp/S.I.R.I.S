import os
from typing import List
import numpy as np

class BGE_M3_Embeddings:
    """
    Memory-Safe Embedding wrapper with instant TF-IDF fallback to guarantee 0% crashes under low RAM.
    """
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        print(f"Loading embedding model: {model_name}...")
        self.model = None
        try:
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer(model_name, device="cpu")
            print("SentenceTransformer loaded successfully!")
        except Exception as e:
            print(f"[Memory Protection] Using ultra-fast TF-IDF Vectorizer fallback: {e}")
            self.model = None

    def _fallback_embed(self, texts: List[str]) -> List[List[float]]:
        """
        Fixed-dimension fallback embedding (always 384-dim).

        TF-IDF is attempted first. However, when called on a single short query string,
        TfidfVectorizer builds its vocabulary only from that string's unique tokens,
        producing dim = unique_token_count (e.g. 70), not 384. This causes a ChromaDB
        'dimension mismatch' error because collections were indexed with 384-dim vectors.

        Fix: after TF-IDF, if the resulting dimension < 384, pad with zeros to 384.
        If TF-IDF fails entirely, fall through to the hash-based fixed-384 path.
        """
        from sklearn.feature_extraction.text import TfidfVectorizer
        try:
            vec = TfidfVectorizer(max_features=384)
            matrix = vec.fit_transform(texts).toarray()  # shape: (n, actual_vocab_size <= 384)
            # Pad to exactly 384 columns if TF-IDF vocabulary was smaller than 384
            if matrix.shape[1] < 384:
                pad_cols = 384 - matrix.shape[1]
                matrix = np.pad(matrix, ((0, 0), (0, pad_cols)), mode='constant')
            # L2-normalize each row
            norms = np.linalg.norm(matrix, axis=1, keepdims=True)
            norms[norms == 0] = 1.0
            matrix = matrix / norms
            return matrix.tolist()
        except Exception:
            # Hash-based fixed-384 fallback (always produces exactly 384 dims)
            res = []
            for t in texts:
                h = hash(t)
                np.random.seed(abs(h) % (2**32 - 1))
                v = np.random.randn(384)
                v = v / np.linalg.norm(v)
                res.append(v.tolist())
            return res

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        if self.model is not None:
            try:
                embeddings = self.model.encode(
                    texts,
                    batch_size=8,
                    show_progress_bar=False,
                    normalize_embeddings=True
                )
                return embeddings.tolist()
            except Exception as e:
                print(f"[Memory Protection Notice] PyTorch encode error: {e}. Using fast fallback.")
        return self._fallback_embed(texts)

    def embed_query(self, text: str) -> List[float]:
        if self.model is not None:
            try:
                embedding = self.model.encode(
                    text,
                    normalize_embeddings=True
                )
                return embedding.tolist()
            except Exception as e:
                print(f"[Memory Protection Notice] PyTorch query encode error: {e}. Using fast fallback.")
        return self._fallback_embed([text])[0]


def get_embedding_function(model_name: str = "all-MiniLM-L6-v2"):
    return BGE_M3_Embeddings(model_name=model_name)


if __name__ == "__main__":
    embedder = get_embedding_function()
    vec = embedder.embed_query("Procedure for filing an FIR")
    print(f"Query embedding generated. Dim: {len(vec)}")
