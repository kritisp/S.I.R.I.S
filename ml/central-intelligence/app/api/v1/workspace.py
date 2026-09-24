import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database.postgres import get_db
from app.models.case import Case as CaseModel
from app.services.graph.neo4j_graph_service import neo4j_graph_service
from app.services.graph.graph_intelligence_service import graph_intelligence_service
from app.services.graph.networkx_analytics_service import networkx_analytics_service
from app.services.graph.projection import neo4j_graph_projection_service
from app.services.pattern_engine import pattern_intelligence_engine, PatternDetectionRequest
from app.adapters.spring_boot_adapter import spring_boot_adapter
from app.services.case_similarity.feature_extractor import CaseFeatureExtractor

logger = logging.getLogger(__name__)

router = APIRouter()


def _resolve_case_record(case_id: str, db: Session) -> Tuple[Optional[str], Any, Optional[str]]:
    """
    READ-ONLY case resolution. Tries FastAPI's own `cases` table first (legacy/demo-seeded
    cases), then falls back to Spring Boot's authoritative `case_records` table via the
    read-only SpringBootPostgresAdapter, matched by ID or FIR number.

    Returns (source, record, updated_at) where source is one of:
      "fastapi_cases_table" -> record is a CaseModel ORM instance
      "case_records"        -> record is a plain dict (from SpringBootPostgresAdapter)
      None                  -> not found anywhere
    """
    clean_id = case_id.strip()

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

    if db_case:
        updated_at = str(getattr(db_case, "updated_at", None)) if getattr(db_case, "updated_at", None) else None
        return "fastapi_cases_table", db_case, updated_at

    c_dict = None
    try:
        c_dict = spring_boot_adapter.fetch_case_dict_by_id(clean_id)
    except Exception as exc:
        logger.warning("SpringBootPostgresAdapter lookup exception for case %s: %s", clean_id, exc)

    if c_dict:
        updated_at = str(c_dict.get("updated_at")) if c_dict.get("updated_at") else None
        return "case_records", c_dict, updated_at

    return None, None, None


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


@router.get("/case/{case_id}", summary="Retrieves complete, database-driven workspace for a single unique case (READ-ONLY)")
def get_case_workspace(
    case_id: str,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Primary database-driven case workspace endpoint. STRICTLY READ-ONLY:
    loads saved case data from PostgreSQL (FastAPI's own `cases` table, falling back to
    Spring Boot's authoritative `case_records`) and the already-persisted graph from Neo4j.
    Never runs extraction, entity resolution, or Neo4j projection — use
    POST /case/{case_id}/project for that, as an explicit, auditable action.
    """
    clean_id = case_id.strip()

    # 1. Lookup case in PostgreSQL (read-only; FastAPI `cases` table, then Spring Boot `case_records`)
    source, resolved, case_updated_at = _resolve_case_record(clean_id, db)
    db_case: Optional[CaseModel] = resolved if source == "fastapi_cases_table" else None
    c_dict: Optional[Dict[str, Any]] = resolved if source == "case_records" else None

    # 2. Determine Neo4j focus node id
    if db_case:
        target_node_id = str(db_case.id)
    elif c_dict:
        target_node_id = str(c_dict.get("id"))
    else:
        target_node_id = clean_id
    if not target_node_id.startswith("case:"):
        n4j_search_id = f"case:{target_node_id}"
    else:
        n4j_search_id = target_node_id

    # 3. Retrieve Neo4j Neighborhood centered at target case (READ-ONLY — MATCH only, no writes)
    neighborhood = neo4j_graph_service.get_neighborhood(node_id=n4j_search_id, depth=2, limit=80)
    if not neighborhood.get("found"):
        # Try raw target_node_id without prefix
        neighborhood = neo4j_graph_service.get_neighborhood(node_id=target_node_id, depth=2, limit=80)

    is_authoritative = source is not None
    is_in_neo4j = neighborhood.get("found", False)

    if not is_authoritative and not is_in_neo4j:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case ID or FIR number '{clean_id}' not found in PostgreSQL or Neo4j Aura."
        )

    # 4. Extract Entities from PostgreSQL (ORM path for FastAPI-native cases, adapter dict for Spring Boot cases)
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
    elif c_dict:
        cid_str = str(c_dict.get("id"))
        for p in c_dict.get("persons") or []:
            persons.append({
                "id": p.get("id") or f"{cid_str}-person",
                "name": p.get("name"),
                "role": p.get("role", "OTHER"),
                "gender": p.get("gender") or "UNKNOWN",
                "identifier_hash": None
            })
        for ph in c_dict.get("phones") or []:
            phones.append({
                "id": ph.get("id") or f"{cid_str}-phone",
                "normalized_number": ph.get("normalized_number"),
                "number_hash": None
            })
        for v in c_dict.get("vehicles") or []:
            vehicles.append({
                "id": v.get("id") or f"{cid_str}-vehicle",
                "registration_number": v.get("registration_number"),
                "make": None,
                "model": None,
                "vehicle_type": None,
                "role": v.get("role", "OTHER")
            })
        if c_dict.get("address"):
            locations.append({
                "id": f"{cid_str}-location",
                "locality": c_dict.get("address"),
                "city": c_dict.get("police_station") or "",
                "district": c_dict.get("district") or "",
                "state": c_dict.get("state") or "",
                "latitude": None,
                "longitude": None
            })
        for idx, ev in enumerate(c_dict.get("evidences") or []):
            evidences.append({
                "id": ev.get("id") or f"{cid_str}-evidence-{idx}",
                "evidence_type": ev.get("evidence_type", "DOCUMENT"),
                "source": ev.get("description"),
                "status": "LOGGED"
            })
        for idx, ls in enumerate(c_dict.get("legal_sections") or []):
            legal_sections.append({
                "id": f"{cid_str}-legal-{idx}",
                "code": ls.get("code"),
                "title": ls.get("code"),
                "law_name": ls.get("law_name", "BNS")
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
        case_fir = db_case.fir_number if db_case else (c_dict.get("fir_number") if c_dict else clean_id)
        case_id_str = str(db_case.id) if db_case else (str(c_dict.get("id")) if c_dict else clean_id)
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

    # Metadata payload — prefer db_case (FastAPI cases table), then c_dict (Spring Boot case_records),
    # and only fall back to generic placeholders when the case is known solely via a Neo4j node
    # (Postgres record missing/deleted on both sides).
    if db_case:
        fir_num = db_case.fir_number
        station = db_case.police_station
        dist = db_case.district
        st = db_case.state
        crime_t = db_case.crime_type
        crime_c = db_case.crime_category
        desc = db_case.description or f"Live investigation case workspace for {fir_num}."
        case_status = db_case.status
        station_id_val = db_case.station_id
        reg_date = str(db_case.registration_date) if db_case.registration_date else "2026-01-01"
        inc_date = str(db_case.incident_date) if db_case.incident_date else None
        created_at_val = str(db_case.created_at) if hasattr(db_case, "created_at") else "2026-01-01T00:00:00Z"
        resolved_case_id = str(db_case.id)
    elif c_dict:
        fir_num = c_dict.get("fir_number") or clean_id
        station = c_dict.get("police_station") or "Odisha Police Station"
        dist = c_dict.get("district") or "Odisha"
        st = c_dict.get("state") or "Odisha"
        crime_t = c_dict.get("crime_type") or "INVESTIGATION"
        crime_c = "GENERAL"
        desc = c_dict.get("description") or f"Live investigation case workspace for {fir_num}."
        case_status = c_dict.get("status") or "UNDER_INVESTIGATION"
        station_id_val = c_dict.get("station_id") or "PS_BBSR_001"
        reg_date = str(c_dict.get("registration_date")) if c_dict.get("registration_date") else "2026-01-01"
        inc_date = str(c_dict.get("incident_date")) if c_dict.get("incident_date") else None
        created_at_val = str(c_dict.get("created_at")) if c_dict.get("created_at") else "2026-01-01T00:00:00Z"
        resolved_case_id = str(c_dict.get("id"))
    else:
        fir_num = clean_id
        station = "Odisha Police Station"
        dist = "Odisha"
        st = "Odisha"
        crime_t = "INVESTIGATION"
        crime_c = "CYBER_CRIME"
        desc = f"Live investigation case workspace for {fir_num}."
        case_status = "UNDER_INVESTIGATION"
        station_id_val = "PS_BBSR_001"
        reg_date = "2026-01-01"
        inc_date = None
        created_at_val = "2026-01-01T00:00:00Z"
        resolved_case_id = clean_id

    # 9. Graph projection status — READ-ONLY classification, never triggers a write.
    #    available:     Neo4j has a projected neighborhood for this case.
    #    stale:         Neo4j has a projection, but the Postgres record was updated after it.
    #    not_projected: Case exists in Postgres but has never been projected into Neo4j.
    #    failed:        Reserved for the explicit POST .../project endpoint's response; a GET
    #                    never reports "failed" or "processing" since it does no work itself.
    if is_in_neo4j and nodes_list:
        last_projected_at = neo4j_graph_projection_service.get_case_projection_timestamp(n4j_search_id)
        graph_status = "available"
        if last_projected_at and case_updated_at:
            try:
                if datetime.fromisoformat(case_updated_at.replace("Z", "+00:00")) > datetime.fromisoformat(last_projected_at.replace("Z", "+00:00")):
                    graph_status = "stale"
            except (ValueError, TypeError):
                pass
        graph_status_message = None
    elif is_authoritative:
        graph_status = "not_projected"
        graph_status_message = "This case has not yet been projected into the intelligence graph. Use 'Generate Case Intelligence' to build it."
    else:
        graph_status = "available"
        graph_status_message = None

    return {
        "case_id": resolved_case_id,
        "fir_number": fir_num,
        "is_authoritative_postgres": is_authoritative,
        "graph_status": graph_status,
        "graph_status_message": graph_status_message,
        "metadata": {
            "title": f"{crime_t.replace('_', ' ')} - {fir_num}",
            "fir_number": fir_num,
            "status": case_status,
            "priority": "HIGH" if "FRAUD" in crime_t or "HEIST" in crime_t else "MEDIUM",
            "police_station": station,
            "station_id": station_id_val,
            "district": dist,
            "state": st,
            "registration_date": reg_date,
            "incident_date": inc_date,
            "crime_type": crime_t,
            "crime_category": crime_c,
            "description": desc,
            "created_at": created_at_val
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


@router.post("/case/{case_id}/project", summary="Explicitly (re)projects a case's PostgreSQL data into the Neo4j intelligence graph")
def project_case_workspace(
    case_id: str,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    The ONLY endpoint in this router that writes to Neo4j. Controlled, idempotent
    (Cypher MERGE), case-scoped, and logged for audit purposes. Must be triggered
    explicitly by the investigator (e.g. after registering a new FIR, or to refresh a
    stale/failed projection) — never invoked automatically by a GET workspace request.
    """
    clean_id = case_id.strip()
    source, resolved, _ = _resolve_case_record(clean_id, db)

    if source is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case ID or FIR number '{clean_id}' not found in PostgreSQL. Cannot project a case that does not exist."
        )

    triggered_at = datetime.now(timezone.utc).isoformat()

    try:
        if source == "fastapi_cases_table":
            counts = neo4j_graph_projection_service.project_case_graph(resolved)
            resolved_case_id = str(resolved.id)
        else:
            features = CaseFeatureExtractor.extract_from_dict(resolved)
            counts = neo4j_graph_projection_service.project_extracted_features(features)
            resolved_case_id = str(resolved.get("id"))

        logger.info(
            "Case graph projection succeeded: case_id=%s source=%s triggered_at=%s counts=%s",
            resolved_case_id, source, triggered_at, counts
        )
        return {
            "case_id": resolved_case_id,
            "source": source,
            "status": "success",
            "graph_status": "available",
            "triggered_at": triggered_at,
            "counts": counts
        }
    except Exception as exc:
        # Do not fabricate a success response — surface the real failure reason.
        sanitized_reason = str(exc)
        logger.error(
            "Case graph projection failed: case_id=%s source=%s triggered_at=%s reason=%s",
            clean_id, source, triggered_at, sanitized_reason
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={
                "case_id": clean_id,
                "source": source,
                "status": "failed",
                "graph_status": "failed",
                "triggered_at": triggered_at,
                "reason": sanitized_reason
            }
        )
