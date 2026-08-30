"""
AIRA Local AI FastAPI Service Test Suite — Phase 7
Tests API endpoints, schemas, CORS configuration, OpenAPI documentation, and local module availability.
"""

import os
import sys
import time
from starlette.testclient import TestClient

# Ensure local-ai root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.api.schemas import RootResponse, HealthResponse, StatusResponse


def test_fastapi_endpoints():
    print("========================================")
    print("AIRA FASTAPI FOUNDATION TEST (PHASE 7)")
    print("========================================")

    client = TestClient(app)

    # -------------------------------------------------------------------------
    # TEST 1: Root Greeting Endpoint (GET /)
    # -------------------------------------------------------------------------
    print("----------------------------------------")
    print("TEST 1: Root Greeting Endpoint (GET /)")
    print("----------------------------------------")
    t0 = time.perf_counter()
    r_root = client.get("/")
    lat_root = (time.perf_counter() - t0) * 1000.0
    print(f"Status: {r_root.status_code} | Latency: {lat_root:.2f} ms")
    assert r_root.status_code == 200, f"Expected 200, got {r_root.status_code}"
    data_root = r_root.json()
    print(f"Response: {data_root}")
    assert data_root["status"] == "running"
    assert "AIRA" in data_root["service"]
    print("-> TEST 1 PASSED: Root endpoint returns valid metadata.\n")

    # -------------------------------------------------------------------------
    # TEST 2: Health Endpoint (GET /api/health)
    # -------------------------------------------------------------------------
    print("----------------------------------------")
    print("TEST 2: Health Endpoint (GET /api/health)")
    print("----------------------------------------")
    t0 = time.perf_counter()
    r_health = client.get("/api/health")
    lat_health = (time.perf_counter() - t0) * 1000.0
    print(f"Status: {r_health.status_code} | Latency: {lat_health:.2f} ms")
    assert r_health.status_code == 200, f"Expected 200, got {r_health.status_code}"
    data_health = r_health.json()
    print(f"Response: {data_health}")
    assert data_health["status"] == "ok"
    assert data_health["service"] == "local-ai"
    assert "timestamp" in data_health
    assert lat_health < 50.0, "Health check should execute in sub-50ms without model loading."
    print("-> TEST 2 PASSED: Health endpoint is fast and accurate.\n")

    # -------------------------------------------------------------------------
    # TEST 3: System Status Endpoint (GET /api/status)
    # -------------------------------------------------------------------------
    print("----------------------------------------")
    print("TEST 3: Status Endpoint (GET /api/status)")
    print("----------------------------------------")
    t0 = time.perf_counter()
    r_status = client.get("/api/status")
    lat_status = (time.perf_counter() - t0) * 1000.0
    print(f"Status: {r_status.status_code} | Latency: {lat_status:.2f} ms")
    assert r_status.status_code == 200, f"Expected 200, got {r_status.status_code}"
    data_status = r_status.json()
    print(f"Response: {data_status}")
    assert data_status["status"] == "ready"
    assert data_status["environment"]["cuda_available"] is True
    assert data_status["environment"]["database_accessible"] is True
    print(f"  GPU Detected: {data_status['environment']['gpu_name']}")
    print(f"  Database Path: {data_status['environment']['database_path']}")
    print("-> TEST 3 PASSED: Status endpoint reports environment readiness.\n")

    # -------------------------------------------------------------------------
    # TEST 4: OpenAPI / Swagger Documentation
    # -------------------------------------------------------------------------
    print("----------------------------------------")
    print("TEST 4: OpenAPI & Swagger Documentation Endpoints")
    print("----------------------------------------")
    r_openapi = client.get("/openapi.json")
    assert r_openapi.status_code == 200
    openapi_doc = r_openapi.json()
    assert "paths" in openapi_doc
    assert "/api/health" in openapi_doc["paths"]
    assert "/api/status" in openapi_doc["paths"]
    print(f"OpenAPI Title: {openapi_doc['info']['title']} v{openapi_doc['info']['version']}")
    print(f"Endpoints Documented: {list(openapi_doc['paths'].keys())}")

    r_docs = client.get("/docs")
    assert r_docs.status_code == 200
    r_redoc = client.get("/redoc")
    assert r_redoc.status_code == 200
    print("-> TEST 4 PASSED: Swagger (/docs), ReDoc (/redoc), and OpenAPI JSON endpoints verified.\n")

    # -------------------------------------------------------------------------
    # TEST 5: CORS Configuration Check
    # -------------------------------------------------------------------------
    print("----------------------------------------")
    print("TEST 5: CORS Middleware Configuration")
    print("----------------------------------------")
    headers = {
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "GET",
    }
    r_cors = client.options("/api/health", headers=headers)
    print(f"OPTIONS /api/health -> Status: {r_cors.status_code}")
    assert "access-control-allow-origin" in r_cors.headers
    print(f"Access-Control-Allow-Origin: {r_cors.headers['access-control-allow-origin']}")
    print("-> TEST 5 PASSED: CORS middleware configured for local frontend clients.\n")

    # -------------------------------------------------------------------------
    # TEST 6: Local AI Modules Importability & Integrity
    # -------------------------------------------------------------------------
    print("----------------------------------------")
    print("TEST 6: Local AI Core Modules Importability")
    print("----------------------------------------")
    from app import (
        LocalSTT,
        LocalLLM,
        LocalTTS,
        LocalVoicePipeline,
        LocalGateway,
        CrimeLensRetriever,
    )
    print("Successfully imported LocalSTT, LocalLLM, LocalTTS, LocalVoicePipeline, LocalGateway, CrimeLensRetriever.")
    print("-> TEST 6 PASSED: All local AI core components remain intact.\n")

    print("========================================")
    print("ALL FASTAPI FOUNDATION TESTS PASSED (PHASE 7)")
    print("========================================")


if __name__ == "__main__":
    test_fastapi_endpoints()
