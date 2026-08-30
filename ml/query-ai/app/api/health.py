"""
AIRA Local AI FastAPI Health & Status Endpoints — Phase 7
Fast, non-blocking operational endpoints with zero model loading overhead.
"""

import os
import time
import subprocess
import sqlite3
from typing import Optional
from fastapi import APIRouter

import ctranslate2
from .schemas import HealthResponse, StatusResponse, EnvironmentInfo

router = APIRouter(tags=["Health & Diagnostics"])


def _check_database_accessible() -> tuple[bool, str]:
    """Lightweight check to verify that authoritative database exists and is readable."""
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    db_path = os.path.join(project_root, "database", "crimelens.db")
    
    if not os.path.exists(db_path):
        return False, db_path

    try:
        conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM firs")
        cur.fetchone()
        conn.close()
        return True, db_path
    except Exception:
        return False, db_path


def _get_gpu_device_name() -> Optional[str]:
    """Query GPU model name via nvidia-smi if available."""
    try:
        out = subprocess.check_output(
            ["nvidia-smi", "--query-gpu=name", "--format=csv,noheader"],
            text=True,
            stderr=subprocess.DEVNULL,
        ).strip()
        if out:
            return out.splitlines()[0].strip()
    except Exception:
        pass
    return "NVIDIA GPU (CUDA Active)" if ctranslate2.get_cuda_device_count() > 0 else None


@router.get("/health", response_model=HealthResponse, summary="Service Health Check")
async def get_health():
    """
    Lightweight health check endpoint.
    Guaranteed sub-millisecond execution without loading ML models.
    """
    return HealthResponse(
        status="ok",
        service="local-ai",
        timestamp=time.time(),
    )


@router.get("/status", response_model=StatusResponse, summary="System Operational Status")
async def get_status():
    """
    Report environment diagnostic details (CUDA, GPU, and SQLite storage availability)
    without instantiating heavy AI models.
    """
    cuda_count = ctranslate2.get_cuda_device_count()
    cuda_avail = cuda_count > 0
    gpu_name = _get_gpu_device_name() if cuda_avail else None
    db_ok, db_path = _check_database_accessible()

    overall_status = "ready" if (cuda_avail and db_ok) else "degraded"

    return StatusResponse(
        status=overall_status,
        service="local-ai",
        api="fastapi",
        version="1.0.0",
        environment=EnvironmentInfo(
            cuda_available=cuda_avail,
            gpu_name=gpu_name,
            database_accessible=db_ok,
            database_path=db_path if db_ok else None,
        ),
    )
