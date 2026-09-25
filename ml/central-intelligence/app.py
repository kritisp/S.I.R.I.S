import os
import uvicorn
from app.main import app

# Entry point for Hugging Face Spaces (Gradio / Standard Python SDK)
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7860))
    print(f"Starting S.I.R.I.S FastAPI Intelligence Server on port {port}...")
    uvicorn.run("app.main:app", host="0.0.0.0", port=port)
