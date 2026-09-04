@echo off
echo ===================================================
echo   Starting S.I.R.I.S. Core Intelligence & RAG Services
echo ===================================================

echo [1/2] Launching Central Intelligence Database API on port 8000...
start "SIRIS Central Intelligence (Port 8000)" cmd /k "cd /d "%~dp0ml\central-intelligence" && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"

echo [2/2] Launching Real FIR BNS RAG Pipeline on port 8001...
start "SIRIS FIR BNS RAG (Port 8001)" cmd /k "cd /d "%~dp0ml\fir-bns-rag" && python -m uvicorn api_server:app --host 0.0.0.0 --port 8001"

echo.
echo All S.I.R.I.S services are active:
echo   - Central Intelligence (PostgreSQL/Neo4j): http://localhost:8000
echo   - FIR BNS Statutory RAG Engine:          http://localhost:8001
echo ===================================================
