"""
ARGUS Graph Intelligence API endpoints.

Registered on the central-intelligence FastAPI app under /api/v1/graph/*.
These endpoints are consumed by the S.I.R.I.S. NetworkExplorer frontend.

Endpoint contract (consumed by frontend graphIntelligenceService.ts):
  GET  /api/v1/graph/overview?limit=150      → nodes + edges + components
  GET  /api/v1/graph/neighbors/{node_id}     → subgraph expansion
  GET  /api/v1/graph/why/{node_id}           → explainability panel
  GET  /api/v1/graph/path?from=&to=          → shortest path
  GET  /api/v1/graph/common?a=&b=            → shared neighbors
  GET  /api/v1/graph/alerts                  → live alert rules
  POST /api/v1/graph/extract                 → entity extraction from narrative
"""

import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.postgres import get_db
from app.services.graph.argus_graph_service import argus_graph_service
from app.services.graph.neo4j_graph_service import neo4j_graph_service

logger = logging.getLogger(__name__)

router = APIRouter()


# ─────────────────────────────────────────────────────────────────────────────
# Request / Response schemas
# ─────────────────────────────────────────────────────────────────────────────

class ExtractRequest(BaseModel):
    narrative: str = Field(..., min_length=10, max_length=20_000)
    complaint_id: Optional[str] = None


# ─────────────────────────────────────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/overview",
    summary="Neo4j Graph Network Overview",
    description=(
        "Returns top investigation entity and case nodes from live Neo4j database "
        "for the NetworkExplorer D3 force graph."
    ),
)
def graph_overview(
    limit: int = Query(default=150, ge=10, le=600),
    focus_node_id: Optional[str] = Query(default=None),
):
    try:
        return neo4j_graph_service.get_overview(limit=limit, focus_node_id=focus_node_id)
    except Exception as exc:
        logger.error("graph_overview error: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Neo4j graph overview failed: {exc}",
        )


@router.get(
    "/neighborhood/{node_id:path}",
    summary="Get bounded focus-node neighborhood in Neo4j",
    description="Returns a bounded subgraph centered on the selected focus node up to `depth` hops in Neo4j.",
)
def graph_neighborhood(
    node_id: str,
    depth: int = Query(default=2, ge=1, le=3),
    limit: int = Query(default=80, ge=10, le=300),
):
    try:
        result = neo4j_graph_service.get_neighborhood(node_id, depth=depth, limit=limit)
        if not result.get("found"):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Focus node '{node_id}' not found in Neo4j graph.",
            )
        return result
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("graph_neighborhood error for %s: %s", node_id, exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Neo4j focus-node neighborhood query failed: {exc}",
        )


@router.get(
    "/neighbors/{node_id:path}",
    summary="Expand node neighborhood in Neo4j",
    description="Returns Cypher BFS subgraph around a node up to `depth` hops in Neo4j.",
)
def graph_neighbors(
    node_id: str,
    depth: int = Query(default=1, ge=1, le=3),
    limit: int = Query(default=50, ge=10, le=200),
):
    try:
        result = neo4j_graph_service.get_neighbors(node_id, depth=depth, limit=limit)
        if not result.get("found"):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Node '{node_id}' not found in Neo4j graph.",
            )
        return result
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("graph_neighbors error for %s: %s", node_id, exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Neo4j neighborhood expansion failed: {exc}",
        )


@router.get(
    "/why/{node_id:path}",
    summary="ARGUS explainability panel",
    description=(
        "Returns why a node is significant: betweenness rank, influence score, "
        "bridge paths through the node, and removal test (how many components "
        "the network breaks into if this node is removed)."
    ),
)
def graph_why(
    node_id: str,
    db: Session = Depends(get_db),
):
    try:
        result = argus_graph_service.get_why(db, node_id)
        if not result.get("found"):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Node '{node_id}' not found in graph.",
            )
        return result
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("graph_why error for %s: %s", node_id, exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Why-panel computation failed: {exc}",
        )


@router.get(
    "/path",
    summary="Shortest path between two nodes in Neo4j",
    description="Cypher shortest path from `from` to `to` node IDs.",
)
def graph_path(
    from_id: str = Query(..., alias="from"),
    to_id: str = Query(..., alias="to"),
):
    try:
        return neo4j_graph_service.get_path(from_id, to_id)
    except Exception as exc:
        logger.error("graph_path error: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Neo4j path computation failed: {exc}",
        )


@router.get(
    "/common",
    summary="Shared neighbors of two nodes in Neo4j",
)
def graph_common(
    a: str = Query(...),
    b: str = Query(...),
):
    try:
        return neo4j_graph_service.get_common(a, b)
    except Exception as exc:
        logger.error("graph_common error: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Neo4j common-neighbors computation failed: {exc}",
        )


@router.get(
    "/alerts",
    summary="Live ARGUS alert rules",
    description=(
        "Runs ARGUS alert rules (ENTITY_REUSE, MASTERMIND_IDENTIFIED, "
        "SHARED_INFRASTRUCTURE, HIGH_BETWEENNESS_BRIDGE) against the "
        "current in-memory graph and returns fired alerts."
    ),
)
def graph_alerts(db: Session = Depends(get_db)):
    try:
        alerts = argus_graph_service.get_alerts(db)
        return {"alerts": alerts, "count": len(alerts)}
    except Exception as exc:
        logger.error("graph_alerts error: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Alert rules failed: {exc}",
        )


@router.post(
    "/extract",
    summary="Entity extraction from FIR narrative",
    description=(
        "Applies the ARGUS regex pipeline to extract identifiers "
        "(PHONE, UPI, WALLET, EMAIL, BANK_ACCOUNT, IP, TELEGRAM) "
        "from a FIR complaint narrative. Fast synchronous call (~5ms)."
    ),
)
def graph_extract(body: ExtractRequest):
    try:
        return argus_graph_service.extract_entities(body.narrative)
    except Exception as exc:
        logger.error("graph_extract error: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Entity extraction failed: {exc}",
        )
