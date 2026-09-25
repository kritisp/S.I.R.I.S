import os
import sys

# Ensure current directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Auto-download spacy model if needed
try:
    import spacy
    try:
        spacy.load("en_core_web_sm")
    except Exception:
        import subprocess
        subprocess.run([sys.executable, "-m", "spacy", "download", "en_core_web_sm"], check=True)
except Exception as e:
    print(f"Spacy initialization notice: {e}")

import gradio as gr
from app.main import app

with gr.Blocks(title="S.I.R.I.S. Central Intelligence API") as demo:
    gr.Markdown("""
    # 🛡️ S.I.R.I.S. Central Intelligence & Graph API Server
    ### Smart Intelligence for Real Time Investigation Support · Odisha Police
    
    🟢 **Server Status**: ONLINE & FULLY OPERATIONAL (24/7 Always Active)
    
    - **Interactive API Documentation (Swagger)**: [/docs](/docs)
    - **Health Check Endpoint**: [/api/v1/health](/api/v1/health)
    - **API Base URL**: `/api/v1`
    - **Connected Databases**: Supabase PostgreSQL & Cloud Neo4j Aura
    """)

# Mount Gradio onto our FastAPI application
app_with_gradio = gr.mount_gradio_app(app, demo, path="/ui")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 7860))
    print(f"Starting S.I.R.I.S API + Gradio interface on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)

