"""
AIRA CrimeLens Data Retrieval Layer — Live Database Integration
Queries live PostgreSQL (Supabase) database and live Neo4j Aura graph DB for authoritative cases, entities, evidence, and cross-case linkages.
"""

import os
import re
import time
import logging
from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional, Tuple

import psycopg2
from psycopg2.extras import RealDictCursor
from neo4j import GraphDatabase

logger = logging.getLogger(__name__)


@dataclass
class RetrievalRequest:
    """Structured internal data retrieval request."""
    resource: str                  # "case", "evidence", "entity", "legal", "connections", "general"
    operation: str                 # "get_case", "get_evidence", "get_entities", "get_legal", "get_connections", "list_cases"
    identifier: Optional[str] = None
    parameters: Dict[str, Any] = field(default_factory=dict)


@dataclass
class RetrievalResult:
    """Structured result from CrimeLens data retrieval."""
    success: bool
    resource: str
    identifier: Optional[str]
    data: Dict[str, Any] = field(default_factory=dict)
    raw_records_count: int = 0
    formatted_context: str = ""
    retrieval_latency_ms: float = 0.0
    error: Optional[str] = None


class CrimeLensRetriever:
    """
    Read-only live data access service for S.I.R.I.S PostgreSQL & Neo4j databases.
    """

    def __init__(self, database_url: Optional[str] = None, neo4j_uri: Optional[str] = None):
        self.db_url = database_url or os.getenv("DATABASE_URL", "postgresql://postgres:Pf7eqEttsmsw8Jdt@db.pbhhuilzqlnwsalgcvbn.supabase.co:5432/postgres")
        self.neo4j_uri = neo4j_uri or os.getenv("NEO4J_URI", "neo4j+s://1cb4cc93.databases.neo4j.io")
        self.neo4j_user = os.getenv("NEO4J_USERNAME", "1cb4cc93")
        self.neo4j_password = os.getenv("NEO4J_PASSWORD", "60RbmZa2Mo0j2ENhRf-xKIBkMVTNuR743g2p0DXemTw")

    def _get_pg_connection(self):
        """Create read-only connection to Supabase PostgreSQL."""
        return psycopg2.connect(self.db_url, cursor_factory=RealDictCursor)

    def _get_neo4j_driver(self):
        """Create Neo4j Aura driver."""
        return GraphDatabase.driver(self.neo4j_uri, auth=(self.neo4j_user, self.neo4j_password))

    @staticmethod
    def normalize_fir_number(fir_str: Optional[str]) -> Optional[str]:
        if not fir_str:
            return None
        cleaned = fir_str.strip().upper()
        cleaned = re.sub(r"[^A-Z0-9-]", "", cleaned)
        return cleaned

    # -------------------------------------------------------------------------
    # 1. LIVE POSTGRESQL CASE SERVICE
    # -------------------------------------------------------------------------
    def get_case(self, fir_identifier: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve live case record from PostgreSQL cases table.
        """
        norm = self.normalize_fir_number(fir_identifier)
        if not norm:
            return None

        try:
            with self._get_pg_connection() as conn:
                with conn.cursor() as cur:
                    # Query by exact fir_number or UUID or partial match
                    cur.execute("""
                        SELECT id::text, fir_number, police_station, district, state,
                               registration_date::text, incident_date::text, crime_type,
                               crime_category, status, priority, description, title, created_at::text
                        FROM cases
                        WHERE fir_number = %s OR id::text = %s OR fir_number ILIKE %s
                        LIMIT 1
                    """, (norm, norm, f"%{norm}%"))
                    row = cur.fetchone()
                    if row:
                        return dict(row)
        except Exception as exc:
            logger.warning("[CrimeLensRetriever] PostgreSQL lookup error: %s", exc)

        return None

    def list_all_cases(self, limit: int = 50) -> List[Dict[str, Any]]:
        """List summary of authoritative cases from PostgreSQL."""
        try:
            with self._get_pg_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        SELECT id::text, fir_number, police_station, district, crime_type, status, priority, registration_date::text
                        FROM cases
                        ORDER BY registration_date DESC
                        LIMIT %s
                    """, (limit,))
                    return [dict(r) for r in cur.fetchall()]
        except Exception as exc:
            logger.warning("[CrimeLensRetriever] PostgreSQL list cases error: %s", exc)
            return []

    # -------------------------------------------------------------------------
    # 2. LIVE NEO4J GRAPH ENTITY CONNECTIONS SERVICE
    # -------------------------------------------------------------------------
    def get_entity_connections(self, entity_value: str) -> Dict[str, Any]:
        """
        Queries live Neo4j Aura graph to find connected cases and multi-hop entity relationships.
        """
        driver = self._get_neo4j_driver()
        linked_cases = []
        try:
            with driver.session() as session:
                cypher = """
                MATCH (e:Entity) WHERE e.value CONTAINS $val OR e.normalized_value CONTAINS $val
                MATCH (e)-[r]-(c:Case)
                RETURN c.id AS case_id, c.fir_number AS fir_number, c.crime_type AS crime_type,
                       c.police_station AS police_station, type(r) AS relationship, e.type AS entity_type
                LIMIT 20
                """
                res = session.run(cypher, val=entity_value.strip())
                for record in res:
                    linked_cases.append({
                        "case_id": record["case_id"],
                        "fir_number": record["fir_number"],
                        "crime_type": record["crime_type"],
                        "police_station": record["police_station"],
                        "relationship": record["relationship"],
                        "entity_type": record["entity_type"],
                    })
        except Exception as exc:
            logger.warning("[CrimeLensRetriever] Neo4j graph query error: %s", exc)
        finally:
            driver.close()

        return {
            "entity_value": entity_value,
            "total_links": len(linked_cases),
            "linked_cases": linked_cases,
        }

    # -------------------------------------------------------------------------
    # 3. GROUNDED CONTEXT RETRIEVAL DISPATCHER
    # -------------------------------------------------------------------------
    def retrieve(self, request: RetrievalRequest) -> RetrievalResult:
        t0 = time.perf_counter()
        ident = request.identifier

        if request.resource == "case" or request.operation == "get_case":
            case = self.get_case(ident) if ident else None
            t1 = time.perf_counter()
            lat = (t1 - t0) * 1000.0

            if not case:
                all_cases = self.list_all_cases(limit=5)
                avail_firs = ", ".join(c["fir_number"] for c in all_cases)
                context = (
                    f"CRIMELENS DATABASE SEARCH RESULT:\n"
                    f"Status: Case '{ident}' NOT FOUND in the live PostgreSQL cases table.\n"
                    f"Available verified cases in database: {avail_firs}...\n"
                    f"Instruction to Assistant: State clearly to the user that FIR '{ident}' was not found in the live database."
                )
                return RetrievalResult(
                    success=False,
                    resource="case",
                    identifier=ident,
                    data={},
                    raw_records_count=0,
                    formatted_context=context,
                    retrieval_latency_ms=round(lat, 3),
                    error=f"FIR '{ident}' not found.",
                )

            # Build rich grounded context from live PostgreSQL record
            graph_links = self.get_entity_connections(case["fir_number"])

            lines = [
                "=== CRIMELENS AUTHORITATIVE LIVE POSTGRESQL CASE RECORD ===",
                f"FIR Number:          {case['fir_number']}",
                f"Police Station:      {case['police_station']} ({case['district']}, {case['state']})",
                f"Crime Type:          {case['crime_type']} ({case['crime_category']})",
                f"Status:              {case['status']} | Priority: {case['priority']}",
                f"Registration Date:   {case['registration_date']}",
                f"Title:               {case.get('title', 'N/A')}",
                f"Description:         {case['description']}",
            ]

            if graph_links["total_links"] > 0:
                lines.append("\n=== LIVE NEO4J GRAPH KNOWLEDGE CONNECTIONS ===")
                for link in graph_links["linked_cases"]:
                    lines.append(f"- Linked to {link['fir_number']} ({link['crime_type']} at {link['police_station']}) via {link['relationship']}")

            lines.append("\nInstruction: Ground your response strictly in the above live PostgreSQL & Neo4j database facts.")
            formatted_ctx = "\n".join(lines)

            return RetrievalResult(
                success=True,
                resource="case",
                identifier=case["fir_number"],
                data={"case": case, "graph_links": graph_links},
                raw_records_count=1 + graph_links["total_links"],
                formatted_context=formatted_ctx,
                retrieval_latency_ms=round((time.perf_counter() - t0) * 1000.0, 3),
            )

        elif request.resource == "connections":
            conn_data = self.get_entity_connections(ident or "")
            t1 = time.perf_counter()
            lat = (t1 - t0) * 1000.0

            ctx_lines = [
                f"=== LIVE NEO4J GRAPH INTELLIGENCE SEARCH ===",
                f"Query Target: {conn_data['entity_value']}",
                f"Total Connected Cases Found: {conn_data['total_links']}",
            ]
            for c in conn_data["linked_cases"]:
                ctx_lines.append(f"- {c['fir_number']}: {c['crime_type']} at {c['police_station']} ({c['relationship']})")

            return RetrievalResult(
                success=conn_data["total_links"] > 0,
                resource="connections",
                identifier=ident,
                data=conn_data,
                raw_records_count=conn_data["total_links"],
                formatted_context="\n".join(ctx_lines),
                retrieval_latency_ms=round(lat, 3),
            )

        return RetrievalResult(
            success=False,
            resource="general",
            identifier=ident,
            data={},
            raw_records_count=0,
            formatted_context="",
            retrieval_latency_ms=round((time.perf_counter() - t0) * 1000.0, 3),
        )
