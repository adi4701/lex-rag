from sentence_transformers import SentenceTransformer

# Load model once globally
model = SentenceTransformer("BAAI/bge-small-en-v1.5")

def embed_text(text: str) -> list[float]:
    # Normalize embeddings is critical for cosine similarity / L2 distance thresholding
    embedding = model.encode(text, normalize_embeddings=True).tolist()
    return embedding
