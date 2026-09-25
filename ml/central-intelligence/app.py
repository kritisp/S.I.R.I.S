import os
import gradio as gr
from app.main import app

# Create an official S.I.R.I.S API status card for Hugging Face
with gr.Blocks(title="S.I.R.I.S. Central Intelligence API") as demo:
    gr.Markdown("""
    # 🛡️ S.I.R.I.S. Central Intelligence & Graph API Server
    ### Smart Intelligence for Real Time Investigation Support · Odisha Police
    
    🟢 **Server Status**: ONLINE & FULLY OPERATIONAL (24/7 Always Active)
    
    - **Interactive API Documentation**: [/docs](/docs)
    - **Health Check Endpoint**: [/api/v1/health](/api/v1/health)
    - **API Base URL**: `/api/v1`
    - **Connected Databases**: Supabase PostgreSQL & Cloud Neo4j Aura
    """)

# Mount Gradio onto our FastAPI application
app_with_gradio = gr.mount_gradio_app(app, demo, path="/")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 7860))
    print(f"Starting S.I.R.I.S API + Gradio interface on port {port}...")
    uvicorn.run(app_with_gradio, host="0.0.0.0", port=port)
