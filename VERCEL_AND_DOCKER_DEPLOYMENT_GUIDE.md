# S.I.R.I.S. Production Deployment Guide
## Vercel Frontend (Vite) + Docker Container Backends (Render / Cloud VPS)

This guide walks you through deploying the **S.I.R.I.S.** platform using the recommended architecture:
- ⚡ **Frontend**: Deployed on **Vercel** (Global Edge CDN for Vite React SPA)
- 🐳 **Backend Services**: Deployed as **Docker Containers** on Render (or AWS / DigitalOcean / Railway)

---

## 📍 Step 1: Deploy Backend Docker Containers

Your repository contains a pre-configured [render.yaml](file:///e:/desk/S.I.R.I.S/CrimeLens-SIH-V2-Frontend/render.yaml) file that automatically builds all 3 backend Docker containers:

1. Log in to [Render.com](https://render.com).
2. Click **New +** -> **Blueprint**.
3. Connect your GitHub repository `kritisp/S.I.R.I.S`.
4. Render will automatically detect `render.yaml` and create 3 Docker web services:
   - **`siris-central-intel`** (FastAPI backend Docker image)
   - **`siris-fir-bns-rag`** (ChromaDB statutory legal engine Docker image)
   - **`siris-voice-gateway`** (Node.js WebSocket voice server Docker image)
5. Under Environment Variables in Render, add your API keys:
   - `GROQ_API_KEY`: `gsk_...`
   - `NEO4J_URI`: `neo4j+s://1cb4cc93.databases.neo4j.io`
   - `NEO4J_USERNAME`: `1cb4cc93`
   - `NEO4J_PASSWORD`: `60RbmZa2Mo0j2ENhRf-xKIBkMVTNuR743g2p0DXemTw`
   - `DATABASE_URL`: `postgresql://postgres:Pf7eqEttsmsw8Jdt@db.pbhhuilzqlnwsalgcvbn.supabase.co:5432/postgres`

After deployment, note your live backend URLs:
- Central Backend: `https://siris-central-intel.onrender.com`
- FIR RAG Backend: `https://siris-fir-bns-rag.onrender.com`

---

## ⚡ Step 2: Deploy Vite Frontend to Vercel

1. Log in to [Vercel.com](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository `kritisp/S.I.R.I.S`.
4. Configure Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Select `frontend` (Click Edit -> type `frontend`)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. Add **Environment Variables** in Vercel:

| Key | Value | Description |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `https://siris-central-intel.onrender.com/api/v1` | URL to Central Backend |
| `VITE_INTEL_SERVICE_URL` | `https://siris-central-intel.onrender.com/api/v1/graph` | URL to Graph Backend |
| `VITE_RAG_API_URL` | `https://siris-fir-bns-rag.onrender.com` | URL to FIR RAG Backend |
| `VITE_GROQ_API_KEY` | `<your_groq_api_key>` | Groq AI Key |
| `VITE_BHASHINI_API_KEY` | `-_oVT-BJc9miqpgS6SpTTixyQGXhebibkgsI3CTmelTau7QuQxT_Mnl1R7MgWy8h` | Bhasini NLU Key |
| `VITE_BHASHINI_UDYAT_KEY` | `36bcfef5a1-1c64-4bd1-ba20-329f198c0ed2` | Bhasini Udyat Key |

6. Click **Deploy**.

---

## 🎉 Step 3: Verification

Once Vercel completes building, your application will be live at a custom URL like `https://siris.vercel.app`.
- The Vite UI will serve instantly via Vercel's global CDN.
- All AI queries, evidence processing, BNS RAG legal lookups, and multi-agent analytics will communicate directly with your live Docker backend microservices!
