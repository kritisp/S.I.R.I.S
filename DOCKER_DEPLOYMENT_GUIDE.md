# S.I.R.I.S. Docker Containerization & Cloud Deployment Guide

This guide provides end-to-end instructions for running **S.I.R.I.S. (Smart Intelligence for Real-Time Investigation Support)** locally with Docker Compose, pushing container images to Docker Hub, and deploying to production cloud environments (Render, AWS EC2, DigitalOcean, or any Docker-enabled host).

---

## 🏗️ Architecture Overview

The system consists of **4 microservices**:

| Service Name | Technology Stack | Default Port | Directory |
| :--- | :--- | :--- | :--- |
| **`siris-central-intel`** | FastAPI, NetworkX, Neo4j, Supabase | `8000` | `./ml/central-intelligence` |
| **`siris-fir-bns-rag`** | FastAPI, ChromaDB, BNS Statutory Engine | `8001` | `./ml/fir-bns-rag` |
| **`siris-voice-gateway`** | Node.js WebSocket Bridge | `10000` | `./server` |
| **`siris-frontend`** | React + Vite SPA, Nginx Web Server | `80` | `./frontend` |

---

## 🚀 Option 1: Quick Local Run with Docker Compose

To build and run all 4 services on your local machine using Docker Compose:

### 1. Ensure Environment Variables exist
Ensure `.env` exists in the root directory with mandatory API keys (`GROQ_API_KEY`, `BHASHINI_API_KEY`, etc.).

### 2. Build and Start Containers
```bash
docker compose up --build
```

### 3. Access Services
- **Frontend App**: [http://localhost](http://localhost)
- **Central Intelligence Backend**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **FIR / BNS Statutory RAG API**: [http://localhost:8001/docs](http://localhost:8001/docs)
- **Voice Gateway**: `ws://localhost:10000`

To stop all containers:
```bash
docker compose down
```

---

## 📦 Option 2: Push Images to Docker Hub

You can push all 4 containerized services to Docker Hub using the automated script.

### On Windows (CMD / PowerShell):
```cmd
docker login
.\scripts\docker-push.bat <your_dockerhub_username> v1.0.0
```

### On Linux / macOS:
```bash
docker login
chmod +x ./scripts/docker-push.sh
./scripts/docker-push.sh <your_dockerhub_username> v1.0.0
```

This will automatically build and publish:
- `<your_username>/siris-central-intel:v1.0.0`
- `<your_username>/siris-fir-bns-rag:v1.0.0`
- `<your_username>/siris-voice-gateway:v1.0.0`
- `<your_username>/siris-frontend:v1.0.0`

---

## ☁️ Option 3: Cloud Deployment

### A. Deploying via Render (Render Blueprint)
This repository contains a pre-configured [render.yaml](file:///e:/desk/S.I.R.I.S/CrimeLens-SIH-V2-Frontend/render.yaml) file for Render.
1. Connect your GitHub repository to Render.
2. Select **New + -> Blueprint**.
3. Point to this repository. Render will automatically detect `render.yaml` and deploy all 4 web services.

### B. Deploying on Cloud Virtual Machine (AWS EC2 / DigitalOcean / Linode)
1. SSH into your VM instance.
2. Install Docker & Docker Compose:
   ```bash
   sudo apt update && sudo apt install -y docker.io docker-compose-v2
   ```
3. Clone your repository & create `.env`:
   ```bash
   git clone https://github.com/kritisp/S.I.R.I.S.git
   cd S.I.R.I.S
   nano .env
   ```
4. Run in detached background mode:
   ```bash
   docker compose up -d --build
   ```

---

## 🔍 Health Checking & Diagnostics

Check container status:
```bash
docker compose ps
```

View real-time logs for a specific service:
```bash
docker compose logs -f frontend
docker compose logs -f central-intelligence
docker compose logs -f fir-bns-rag
docker compose logs -f voice-gateway
```
