from fastapi import APIRouter
from app.api.v1 import health, intelligence, graph, workspace

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(intelligence.router, prefix="/intelligence", tags=["Intelligence"])
api_router.include_router(graph.router, prefix="/graph", tags=["S.I.R.I.S. Graph Intelligence"])
api_router.include_router(workspace.router, prefix="/workspace", tags=["S.I.R.I.S. Case Workspace"])

