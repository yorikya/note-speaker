import re
import numpy as np

def normalize_text(text):
    # Lowercase, remove non-alphanumeric (except spaces), collapse spaces
    text = text.lower()
    text = re.sub(r'[^a-z0-9 ]+', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

class VectorUtils:
    def __init__(self, embed_model):
        self.embed_model = embed_model

    def embed_text(self, text):
        if self.embed_model and hasattr(self.embed_model, 'embed_content'):
            try:
                return self.embed_model.embed_content(text).embedding
            except Exception as e:
                print(f"[DEBUG] Error embedding text: {e}")
        return np.random.rand(512)

    def embed_texts(self, texts):
        if self.embed_model and hasattr(self.embed_model, 'embed_content'):
            try:
                return [self.embed_model.embed_content(text).embedding for text in texts]
            except Exception as e:
                print(f"[DEBUG] Error embedding texts: {e}")
        return [np.random.rand(512) for _ in texts]

    @staticmethod
    def cosine_similarity(a, b):
        a = np.array(a)
        b = np.array(b)
        return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)) 