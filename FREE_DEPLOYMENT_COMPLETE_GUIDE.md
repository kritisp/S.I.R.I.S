# S.I.R.I.S. 100% Free Production Deployment Guide

This guide details how to deploy the entire **S.I.R.I.S.** platform completely for free ($0/month) with **zero cold starts, high performance, and global CDN**.

---

## 🏗️ Deployment Architecture

| Component | Host | Tier | Cost | Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend UI (Vite React SPA)** | **Vercel** | Free Tier | **$0 / month** | Global Edge CDN, Instant Loading, SSL |
| **Backend Microservices (Docker)** | **Oracle Cloud Always Free VM** or **Koyeb** / **Render** | Free Tier | **$0 / month** | 4 Cores, 24 GB RAM, 24/7 Zero Cold Starts |

---

## 📌 STEP 1: GitHub Code Status
Your GitHub repository is **100% up to date**:
- **Repository**: `https://github.com/kritisp/S.I.R.I.S.git`
- **Branch**: `main`
- All source code, Dockerfiles, `docker-compose.yml`, font configurations (Inter), multi-agent pipelines, and deployment scripts are committed and pushed.

---

## 📌 STEP 2: Push Container Images to Docker Hub

To build and upload your Docker images to Docker Hub (`kritisp`):

1. **Open Docker Desktop** on your computer.
2. Open terminal in project folder `e:\desk\S.I.R.I.S\CrimeLens-SIH-V2-Frontend`.
3. Log in to Docker Hub:
   ```cmd
   docker login
   ```
4. Run the automated push script:
   ```cmd
   .\scripts\docker-push.bat kritisp latest
   ```

This uploads:
- `kritisp/siris-central-intel:latest`
- `kritisp/siris-fir-bns-rag:latest`
- `kritisp/siris-voice-gateway:latest`
- `kritisp/siris-frontend:latest`

---

## 📌 STEP 3: Deploy Frontend on Vercel (100% Free)

1. Go to [Vercel.com](https://vercel.com) and log in.
2. Click **Add New... -> Project**.
3. Import your GitHub repository: `kritisp/S.I.R.I.S`.
4. Configure Settings:
   - **Root Directory**: `frontend` (Click Edit -> type `frontend`)
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add **Environment Variables**:
   - `VITE_API_BASE_URL`: `https://YOUR_BACKEND_SERVER_URL/api/v1` (or local/Oracle IP)
   - `VITE_RAG_API_URL`: `https://YOUR_RAG_SERVER_URL`
   - `VITE_GROQ_API_KEY`: `gsk_...`
6. Click **Deploy**. Vercel will build your SPA on their global CDN network.

---

## 📌 STEP 4: Deploy Backends 100% Free (2 Options)

### Option A: Oracle Cloud Always Free VM (Recommended for 24/7 Zero Cold Starts)
1. Sign up at [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/).
2. Create an **Ampere A1 Instance** (Ubuntu 22.04 LTS, 4 Cores, 24 GB RAM).
3. SSH into your instance and run:
   ```bash
   sudo apt update && sudo apt install -y docker.io docker-compose-v2 git
   git clone https://github.com/kritisp/S.I.R.I.S.git
   cd S.I.R.I.S
   cp .env.example .env
   nano .env  # Add your API keys
   docker compose up -d --build
   ```
   All 4 services will run 24/7 with zero sleeping or lag!

### Option B: Render Free Tier
1. Go to [Render Dashboard](https://dashboard.render.com).
2. Click **New + -> Blueprint**.
3. Select `kritisp/S.I.R.I.S`.
4. Render will automatically deploy all services on the **Free Tier** using `render.yaml`.

---

## 🎉 Done!
Your S.I.R.I.S. platform is now fully containerized, version controlled, and ready to be hosted 100% for free!
