import logging
import uuid
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database.postgres import get_db
from app.models.case import Case as CaseModel
from app.services.graph.neo4j_graph_service import neo4j_graph_service
from app.services.graph.graph_intelligence_service import graph_intelligence_service
from app.services.graph.networkx_analytics_service import networkx_analytics_service
from app.services.pattern_engine import pattern_intelligence_engine, PatternDetectionRequest

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/cases", summary="Retrieves list of all authoritative cases for case workspace selection")
def get_workspace_cases(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Returns authoritative S.I.R.I.S case registry records from PostgreSQL for case selection.
    """
    try:
        total_cnt = db.execute(text("SELECT count(*) FROM cases")).scalar()
        query = text("""
            SELECT c.id::text, c.fir_number, c.police_station, c.district, c.state,
                   c.registration_date::text, c.crime_type, c.crime_category, c.status,
                   c.description
            SELECT_CASE:
            FROM cases c
            ORDER BY c.registration_date DESC, c.created_at DESC
            LIMIT :limit OFFSET :offset
        """.replace("SELECT_CASE:", ""))
        rows = db.execute(query, {"limit": limit, "offset": offset}).fetchall()

        cases_list = []
        for r in rows:
            cases_list.append({
                "id": str(r[0]),
                "case_id": str(r[0]),
                "fir_number": str(r[1]),
                "police_station": str(r[2]),
                "district": str(r[3]),
                "state": str(r[4]),
                "registration_date": str(r[5]),
                "crime_type": str(r[6]),
                "crime_category": str(r[7]),
                "status": str(r[8]),
                "description": r[9] or ""
            })

        return {
            "total": total_cnt,
            "count": len(cases_list),
            "cases": cases_list
        }
    except Exception as exc:
        db.rollback()
        logger.error("Failed fetching workspace cases list: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed retrieving workspace cases: {exc}"
        )


@router.get("/case/{case_id}", summary="Retrieves complete, database-driven workspace for a single unique case")
def get_case_workspace(
    case_id: str,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Primary database-driven case workspace endpoint.
    Aggregates PostgreSQL case/FIR records, extracted entities, Neo4j graph neighborhood,
    NetworkX graph analytics, cross-case connections, pattern engine findings, live alerts, and explainability.
    """
    clean_id = case_id.strip()

    # 1. Lookup case in PostgreSQL (by UUID or fir_number)
    db_case = None
    try:
        try:
            val_uuid = uuid.UUID(clean_id)
            db_case = db.query(CaseModel).filter(CaseModel.id == val_uuid).first()
        except ValueError:
            db_case = db.query(CaseModel).filter(CaseModel.fir_number == clean_id).first()
    except Exception as exc:
        db.rollback()
        logger.warning("PostgreSQL lookup exception for case %s: %s", clean_id, exc)

    # 2. Check if case exists in Neo4j if PostgreSQL record is missing
    target_node_id = str(db_case.id) if db_case else clean_id
    if not target_node_id.startswith("case:"):
        n4j_search_id = f"case:{target_node_id}"
    else:
        n4j_search_id = target_node_id

    # 3. Retrieve Neo4j Neighborhood centered at target case
    neighborhood = neo4j_graph_service.get_neighborhood(node_id=n4j_search_id, depth=2, limit=80)
    if not neighborhood.get("found"):
        # Try raw target_node_id without prefix
        neighborhood = neo4j_graph_service.get_neighborhood(node_id=target_node_id, depth=2, limit=80)

    is_authoritative = db_case is not None
    is_in_neo4j = neighborhood.get("found", False)

    if not is_authoritative and not is_in_neo4j:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case ID or FIR number '{clean_id}' not found in PostgreSQL or Neo4j Aura."
        )

    # 4. Extract Entities from PostgreSQL
    persons = []
    phones = []
    vehicles = []
    locations = []
    evidences = []
    legal_sections = []

    if db_case:
        if db_case.person_associations:
            for assoc in db_case.person_associations:
                if assoc.person:
                    p = assoc.person
                    role_str = assoc.role.value if hasattr(assoc.role, "value") else str(assoc.role)
                    persons.append({
                        "id": str(p.id),
                        "name": p.name,
                        "role": role_str,
                        "gender": p.gender or "UNKNOWN",
                        "identifier_hash": p.identifier_hash
                    })

        if db_case.phone_associations:
            for assoc in db_case.phone_associations:
                if assoc.phone:
                    ph = assoc.phone
                    phones.append({
                        "id": str(ph.id),
                        "normalized_number": ph.normalized_number,
                        "number_hash": ph.number_hash
                    })

        if db_case.vehicle_associations:
            for assoc in db_case.vehicle_associations:
                if assoc.vehicle:
                    v = assoc.vehicle
                    role_str = assoc.role.value if hasattr(assoc.role, "value") else str(assoc.role)
                    vehicles.append({
                        "id": str(v.id),
                        "registration_number": v.registration_number,
                        "make": v.make,
                        "model": v.model,
                        "vehicle_type": v.vehicle_type,
                        "role": role_str
                    })

        if db_case.location:
            loc = db_case.location
            locations.append({
                "id": str(loc.id),
                "locality": loc.locality,
                "city": loc.city,
                "district": loc.district,
                "state": loc.state,
                "latitude": loc.latitude,
                "longitude": loc.longitude
            })

        if db_case.evidences:
            for ev in db_case.evidences:
                type_str = ev.evidence_type.value if hasattr(ev.evidence_type, "value") else str(ev.evidence_type)
                evidences.append({
                    "id": str(ev.id),
                    "evidence_type": type_str,
                    "source": ev.source,
                    "status": ev.status
                })

        if db_case.legal_section_associations:
            for assoc in db_case.legal_section_associations:
                if assoc.legal_section:
                    ls = assoc.legal_section
                    legal_sections.append({
                        "id": str(ls.id),
                        "code": ls.code,
                        "title": ls.title,
                        "law_name": ls.law_name
                    })

    # 5. Extract NetworkX Analytics & Focus Node Centrality
    nodes_list = neighborhood.get("nodes", [])
    edges_list = neighborhood.get("edges", [])
    analytics_res = networkx_analytics_service.compute_graph_analytics(
        nodes=nodes_list,
        edges=edges_list,
        focus_node_id=n4j_search_id
    )

    focus_node = None
    for n in analytics_res.get("nodes", []):
        if n.get("is_focus") or n.get("id") == n4j_search_id or n.get("id") == target_node_id:
            focus_node = n
            break

    analytics_summary = {
        "degree": focus_node.get("degree", 0) if focus_node else 0,
        "pagerank": focus_node.get("influence", 0.0) if focus_node else 0.0,
        "betweenness": focus_node.get("betweenness", 0.0) if focus_node else 0.0,
        "community_id": focus_node.get("community_id", 0) if focus_node else 0,
        "connected_components": analytics_res.get("stats", {}).get("subgraph_components", 1),
        "is_important_connector": focus_node.get("is_important", False) if focus_node else False
    }

    # 6. Pattern Engine Findings & Live Alerts
    pattern_findings = []
    try:
        cases_to_eval = [db_case] if db_case else []
        if cases_to_eval:
            pat_res = pattern_intelligence_engine.detect_patterns(PatternDetectionRequest(cases=cases_to_eval, minimum_recurrence=2))
            for obs in pat_res.observations:
                pattern_findings.append({
                    "pattern_id": obs.pattern_type.value,
                    "pattern_name": obs.pattern_type.value.replace("_", " ").title(),
                    "confidence_score": obs.confidence_score,
                    "supporting_evidence": obs.evidence_summary,
                    "cases_involved": obs.affected_case_ids
                })
    except Exception as exc:
        logger.warning("Pattern engine evaluation warning: %s", exc)

    case_alerts = []
    try:
        all_alerts = graph_intelligence_service.get_alerts(db)
        case_fir = db_case.fir_number if db_case else clean_id
        case_id_str = str(db_case.id) if db_case else clean_id
        for alt in all_alerts:
            rel_cases = alt.get("related_cases", [])
            msg = alt.get("message", "")
            if case_fir in rel_cases or case_id_str in rel_cases or case_fir in msg or case_id_str in msg:
                case_alerts.append(alt)
    except Exception as exc:
        logger.warning("Alert engine warning: %s", exc)

    # 7. Explainability
    why_summary = {}
    try:
        why_res = graph_intelligence_service.get_why(db, n4j_search_id)
        if why_res.get("found"):
            why_summary = why_res
    except Exception as exc:
        logger.warning("Explainability engine warning: %s", exc)

    # 8. Cross-Case Relationship Links
    cross_case_related = []
    seen_related = set()
    for e in edges_list:
        rel_type = e.get("relationship", "")
        if rel_type == "RELATED_TO" or e.get("node_type") == "case":
            other_id = e.get("target") if e.get("source") in (n4j_search_id, target_node_id) else e.get("source")
            if other_id and other_id not in seen_related:
                seen_related.add(other_id)
                cross_case_related.append({
                    "target_case_id": other_id,
                    "confidence_score": e.get("weight", 1.0),
                    "relationship_type": rel_type,
                    "explanation": e.get("explanation") or "Shared entity connection"
                })

    # Metadata payload
    fir_num = db_case.fir_number if db_case else clean_id
    station = db_case.police_station if db_case else "Odisha Police Station"
    dist = db_case.district if db_case else "Odisha"
    st = db_case.state if db_case else "Odisha"
    crime_t = db_case.crime_type if db_case else "INVESTIGATION"
    crime_c = db_case.crime_category if db_case else "CYBER_CRIME"
    desc = db_case.description if db_case else f"Live investigation case workspace for {fir_num}."

    return {
        "case_id": str(db_case.id) if db_case else clean_id,
        "fir_number": fir_num,
        "is_authoritative_postgres": is_authoritative,
        "metadata": {
            "title": f"{crime_t.replace('_', ' ')} - {fir_num}",
            "fir_number": fir_num,
            "status": db_case.status if db_case else "UNDER_INVESTIGATION",
            "priority": "HIGH" if "FRAUD" in crime_t or "HEIST" in crime_t else "MEDIUM",
            "police_station": station,
            "station_id": db_case.station_id if db_case else "PS_BBSR_001",
            "district": dist,
            "state": st,
            "registration_date": str(db_case.registration_date) if db_case and db_case.registration_date else "2026-01-01",
            "incident_date": str(db_case.incident_date) if db_case and db_case.incident_date else None,
            "crime_type": crime_t,
            "crime_category": crime_c,
            "description": desc,
            "created_at": str(db_case.created_at) if db_case and hasattr(db_case, "created_at") else "2026-01-01T00:00:00Z"
        },
        "location": locations[0] if locations else None,
        "entities": {
            "persons": persons,
            "phones": phones,
            "vehicles": vehicles,
            "locations": locations,
            "evidences": evidences,
            "legal_sections": legal_sections
        },
        "graph_neighborhood": {
            "nodes": analytics_res.get("nodes", []),
            "edges": analytics_res.get("edges", []),
            "total_nodes": len(analytics_res.get("nodes", [])),
            "total_edges": len(analytics_res.get("edges", [])),
            "focus_node_id": n4j_search_id
        },
        "analytics": analytics_summary,
        "cross_case_intelligence": {
            "related_cases": cross_case_related,
            "shared_counts": {
                "persons": len(persons),
                "phones": len(phones),
                "vehicles": len(vehicles),
                "locations": len(locations)
            }
        },
        "patterns": pattern_findings,
        "alerts": case_alerts,
        "explainability": why_summary
    }
