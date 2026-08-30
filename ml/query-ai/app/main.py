"""
AIRA Local AI FastAPI Service — Phase 7
Production-structured FastAPI foundation for AIRA and CrimeLens local intelligence.
"""

import os
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Ensure local-ai root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from .api.router import api_router
from .api.schemas import RootResponse, ErrorResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan context manager.
    Clean startup and shutdown without loading heavy AI models prematurely.
    """
    # Startup
    print("[FASTAPI] AIRA Local AI API starting up...")
    yield
    # Shutdown
    print("[FASTAPI] AIRA Local AI API shutting down cleanly...")


# ---------------------------------------------------------------------------
# FastAPI Application Instantiation
# ---------------------------------------------------------------------------
app = FastAPI(
    title="AIRA Local AI Intelligence API",
    description=(
        "High-performance local voice intelligence and CrimeLens retrieval backend for C.R.I.M.E. "
        "Operates 100% offline with zero cloud AI dependencies."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS Middleware Configuration
# ---------------------------------------------------------------------------
# Configured for future local frontend development (Vite @ 5173 / Next.js @ 3000)
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Global Exception Handlers (Clean Error Responses)
# ---------------------------------------------------------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Clean error handler to prevent exposing internal stack traces or paths."""
    print(f"[ERROR] Unhandled API exception on {request.url.path}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "InternalServerError",
            "message": "An unexpected error occurred while processing the request.",
            "status_code": 500,
        },
    )


# ---------------------------------------------------------------------------
# Root Greeting Endpoint
# ---------------------------------------------------------------------------
@app.get("/", response_model=RootResponse, summary="API Root")
async def root():
    """Root metadata greeting endpoint."""
    return RootResponse(
        service="AIRA Local AI API",
        status="running",
        version="1.0.0",
        docs_url="/docs",
    )


# ---------------------------------------------------------------------------
# Mount API Sub-Routers
# ---------------------------------------------------------------------------
app.include_router(api_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
