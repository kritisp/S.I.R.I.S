from fastapi import APIRouter
from app.api.v1 import health, intelligence, graph, workspace, auth, requests, evidence, audit, stations, dashboard, users, cases

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(cases.router, prefix="/cases", tags=["FIR Intake & Legal RAG"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & Officers"])
api_router.include_router(users.router, prefix="/users", tags=["Odisha Police Officers"])
api_router.include_router(requests.router, prefix="/requests", tags=["Section 91 Access Requests"])
api_router.include_router(evidence.router, prefix="/evidence", tags=["Evidence Custody & Locker"])
api_router.include_router(audit.router, prefix="/audit", tags=["Audit & Cryptographic Chain"])
api_router.include_router(stations.router, prefix="/stations", tags=["Police Stations"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Statewide Command Dashboard"])
api_router.include_router(intelligence.router, prefix="/intelligence", tags=["Intelligence"])
api_router.include_router(graph.router, prefix="/graph", tags=["S.I.R.I.S. Graph Intelligence"])
api_router.include_router(workspace.router, prefix="/workspace", tags=["S.I.R.I.S. Case Workspace"])


