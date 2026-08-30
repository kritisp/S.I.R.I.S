"""
AIRA Local AI FastAPI Dedicated Health Test — Phase 7
Validates GET /api/health and GET /api/status response contracts and speed.
"""

import os
import sys
import time
from starlette.testclient import TestClient

# Ensure local-ai root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app


def test_health_and_status():
    print("========================================")
    print("AIRA FASTAPI HEALTH & STATUS TEST")
    print("========================================")

    client = TestClient(app)

    # 1. Health check
    t0 = time.perf_counter()
    r = client.get("/api/health")
    lat_ms = (time.perf_counter() - t0) * 1000.0
    print(f"GET /api/health: {r.status_code} in {lat_ms:.2f} ms")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["service"] == "local-ai"
    assert "timestamp" in body

    # 2. Status check
    t0 = time.perf_counter()
    r2 = client.get("/api/status")
    lat2_ms = (time.perf_counter() - t0) * 1000.0
    print(f"GET /api/status: {r2.status_code} in {lat2_ms:.2f} ms")
    assert r2.status_code == 200
    body2 = r2.json()
    assert body2["status"] == "ready"
    assert body2["api"] == "fastapi"
    assert body2["environment"]["cuda_available"] is True
    assert body2["environment"]["database_accessible"] is True

    print("========================================")
    print("HEALTH & STATUS TESTS PASSED")
    print("========================================")


if __name__ == "__main__":
    test_health_and_status()
