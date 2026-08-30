"""
AIRA CrimeLens Local Data Retrieval Layer — Phase 6
Read-only, structured SQLite service layer for case records, evidence, entities, legal sections, and cross-case connections.
"""

import os
import re
import sqlite3
import time
from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional, Tuple


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
    Read-only data access service for CrimeLens SQLite database.
    
    Guarantees:
    - 100% Read-Only: Enforces `PRAGMA query_only = ON;` on all connections.
    - Zero SQL exposure to LLM: Llama 3.2 never generates SQL or accesses the DB directly.
    - Grounded Context: Constructs controlled markdown context blocks for LLM reasoning.
    - Zero Credential Exposure: Case records contain only operational investigation data.
    """

    def __init__(self, db_path: Optional[str] = None):
        if db_path is None:
            # Default to authoritative database in project root: E:\SIH2026\C.R.I.M.E\database\crimelens.db
            project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
            main_db = os.path.join(project_root, "database", "crimelens.db")
            if os.path.exists(main_db):
                self.db_path = main_db
            else:
                fallback_db = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "crimelens.db"))
                self.db_path = fallback_db
        else:
            self.db_path = db_path

        if not os.path.exists(self.db_path):
            raise FileNotFoundError(f"CrimeLens database not found at {self.db_path}")

        # Verify read-only connection
        self._verify_db()

    def _get_connection(self) -> sqlite3.Connection:
        """Create a dedicated read-only connection to SQLite database."""
        conn = sqlite3.connect(f"file:{self.db_path}?mode=ro", uri=True)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute("PRAGMA query_only = ON;")
        return conn

    def _verify_db(self):
        """Verify database connectivity and required tables."""
        conn = self._get_connection()
        try:
            cur = conn.cursor()
            cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = {r["name"] for r in cur.fetchall()}
            expected = {"firs", "entities", "evidence", "documents", "bns_sections", "case_notes"}
            missing = expected - tables
            if missing:
                raise RuntimeError(f"CrimeLens database is missing expected tables: {missing}")
        finally:
            conn.close()

    @staticmethod
    def normalize_fir_number(fir_str: Optional[str]) -> Optional[str]:
        """
        Normalize various FIR identifier inputs (e.g. '541', '00541', 'FIR 541', 'FIR-2026-00541')
        into standard search patterns.
        """
        if not fir_str:
            return None
        cleaned = fir_str.strip().upper()
        # Remove non-alphanumeric except hyphens
        cleaned = re.sub(r"[^A-Z0-9-]", "", cleaned)
        return cleaned

    # -------------------------------------------------------------------------
    # 1. CASE SERVICE
    # -------------------------------------------------------------------------
    def get_case(self, fir_identifier: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve full proforma FIR record by exact or partial identifier.
        Supports: 'FIR-2026-00541', '541', '00541', 'FIR 541'.
        """
        norm = self.normalize_fir_number(fir_identifier)
        if not norm:
            return None

        conn = self._get_connection()
        try:
            cur = conn.cursor()
            # Try exact match first
            cur.execute("SELECT * FROM firs WHERE fir_number = ?", (norm,))
            row = cur.fetchone()

            if not row:
                # Try formatted FIR-2026-... pattern if numeric
                digits = re.search(r"\d+", norm)
                if digits:
                    padded = f"%{digits.group(0)}%"
                    cur.execute("SELECT * FROM firs WHERE fir_number LIKE ?", (padded,))
                    row = cur.fetchone()

            if not row:
                return None

            case_data = dict(row)

            # Enrich with case notes if available
            cur.execute("SELECT timestamp, note, officer FROM case_notes WHERE fir_number = ? ORDER BY id ASC", (case_data["fir_number"],))
            notes = [dict(r) for r in cur.fetchall()]
            case_data["notes"] = notes

            return case_data
        finally:
            conn.close()

    def list_all_cases(self) -> List[Dict[str, Any]]:
        """List summary of all FIR cases in the database."""
        conn = self._get_connection()
        try:
            cur = conn.cursor()
            cur.execute("SELECT fir_number, police_station, district, crime_type, sections_applied, status, assigned_officer FROM firs ORDER BY fir_number ASC")
            return [dict(r) for r in cur.fetchall()]
        finally:
            conn.close()

    # -------------------------------------------------------------------------
    # 2. EVIDENCE SERVICE
    # -------------------------------------------------------------------------
    def get_case_evidence(self, fir_identifier: str) -> List[Dict[str, Any]]:
        """Retrieve all evidence items linked to an FIR case."""
        case = self.get_case(fir_identifier)
        if not case:
            return []

        conn = self._get_connection()
        try:
            cur = conn.cursor()
            cur.execute("SELECT * FROM evidence WHERE fir_number = ? ORDER BY evidence_id ASC", (case["fir_number"],))
            return [dict(r) for r in cur.fetchall()]
        finally:
            conn.close()

    # -------------------------------------------------------------------------
    # 3. ENTITY & GRAPH SERVICE
    # -------------------------------------------------------------------------
    def get_case_entities(self, fir_identifier: str) -> List[Dict[str, Any]]:
        """Retrieve all persons, vehicles, and phone numbers linked to an FIR case."""
        case = self.get_case(fir_identifier)
        if not case:
            return []

        conn = self._get_connection()
        try:
            cur = conn.cursor()
            cur.execute("SELECT entity_type, value, role FROM entities WHERE fir_number = ?", (case["fir_number"],))
            return [dict(r) for r in cur.fetchall()]
        finally:
            conn.close()

    def get_entity_connections(self, entity_value: str) -> Dict[str, Any]:
        """
        Discover cross-case linkages and graph relationships for a vehicle, phone, or person.
        Example: Vehicle 'MH-04-XT-2291' links across FIR-541, FIR-542, FIR-301.
        """
        conn = self._get_connection()
        try:
            cur = conn.cursor()
            # Exact or partial match on entity value
            cur.execute("SELECT fir_number, entity_type, value, role FROM entities WHERE value LIKE ?", (f"%{entity_value.strip()}%",))
            rows = [dict(r) for r in cur.fetchall()]
            if not rows:
                return {"entity_value": entity_value, "total_links": 0, "cases": []}

            fir_numbers = list({r["fir_number"] for r in rows})
            linked_cases = []
            for fir in fir_numbers:
                cur.execute("SELECT fir_number, crime_type, status, police_station, assigned_officer FROM firs WHERE fir_number = ?", (fir,))
                c_row = cur.fetchone()
                if c_row:
                    c_dict = dict(c_row)
                    c_dict["roles_in_case"] = [r["role"] for r in rows if r["fir_number"] == fir]
                    linked_cases.append(c_dict)

            return {
                "entity_value": rows[0]["value"],
                "entity_type": rows[0]["entity_type"],
                "total_links": len(linked_cases),
                "linked_cases": linked_cases,
            }
        finally:
            conn.close()

    # -------------------------------------------------------------------------
    # 4. LEGAL SERVICE (BNS SECTIONS)
    # -------------------------------------------------------------------------
    def get_case_legal_info(self, fir_identifier: str) -> List[Dict[str, Any]]:
        """Resolve legal sections applied in an FIR against the BNS legal section database."""
        case = self.get_case(fir_identifier)
        if not case:
            return []

        sections_applied_str = case.get("sections_applied", "")
        if not sections_applied_str:
            return []

        conn = self._get_connection()
        try:
            cur = conn.cursor()
            cur.execute("SELECT * FROM bns_sections")
            all_bns = [dict(r) for r in cur.fetchall()]

            matched = []
            for bns in all_bns:
                sec_num = bns["section_number"]
                # Match base section code like 'BNS-303' in 'BNS-303(2)' or 'BNS-305'
                clean_sec = re.sub(r"\([^)]*\)", "", sec_num)
                if clean_sec.lower() in sections_applied_str.lower() or sec_num.lower() in sections_applied_str.lower():
                    matched.append(bns)

            return matched
        finally:
            conn.close()

    # -------------------------------------------------------------------------
    # 5. INTELLIGENCE & RELATED CASES
    # -------------------------------------------------------------------------
    def get_related_cases(self, fir_identifier: str) -> List[Dict[str, Any]]:
        """
        Find related cases that share common entities (suspects, vehicles, phone numbers)
        with the given FIR.
        """
        case = self.get_case(fir_identifier)
        if not case:
            return []

        target_fir = case["fir_number"]
        conn = self._get_connection()
        try:
            cur = conn.cursor()
            # Find entities belonging to target FIR
            cur.execute("SELECT value, entity_type FROM entities WHERE fir_number = ?", (target_fir,))
            target_entities = cur.fetchall()

            related = []
            for ent in target_entities:
                val = ent["value"]
                cur.execute(
                    "SELECT e.fir_number, e.role, e.entity_type, f.crime_type, f.status, f.police_station "
                    "FROM entities e JOIN firs f ON e.fir_number = f.fir_number "
                    "WHERE e.value = ? AND e.fir_number != ?",
                    (val, target_fir),
                )
                matches = cur.fetchall()
                for m in matches:
                    related.append({
                        "fir_number": m["fir_number"],
                        "shared_entity": val,
                        "entity_type": m["entity_type"],
                        "role_in_related_case": m["role"],
                        "crime_type": m["crime_type"],
                        "status": m["status"],
                        "police_station": m["police_station"],
                    })

            return related
        finally:
            conn.close()

    # -------------------------------------------------------------------------
    # 6. RETRIEVAL DISPATCHER & GROUNDED CONTEXT BUILDER
    # -------------------------------------------------------------------------
    def retrieve(self, request: RetrievalRequest) -> RetrievalResult:
        """
        Execute a structured retrieval request and format grounded markdown context for Llama 3.2.
        """
        t0 = time.perf_counter()
        ident = request.identifier

        if request.resource == "case" or request.operation == "get_case":
            case = self.get_case(ident) if ident else None
            t1 = time.perf_counter()
            lat = (t1 - t0) * 1000.0

            if not case:
                all_cases = self.list_all_cases()
                avail_firs = ", ".join(c["fir_number"] for c in all_cases[:6])
                context = (
                    f"CRIMELENS DATABASE SEARCH RESULT:\n"
                    f"Status: Case '{ident}' NOT FOUND in the database.\n"
                    f"Available verified cases in system: {avail_firs}...\n"
                    f"Instruction to Assistant: State clearly to the user that FIR '{ident}' was not found in the database. Do not invent case details."
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

            # Retrieve rich linked context
            evidence = self.get_case_evidence(case["fir_number"])
            entities = self.get_case_entities(case["fir_number"])
            legal_info = self.get_case_legal_info(case["fir_number"])
            related = self.get_related_cases(case["fir_number"])

            # Build structured context
            lines = [
                "=== CRIMELENS VERIFIED CASE RECORD ===",
                f"FIR Number:          {case['fir_number']}",
                f"Police Station:      {case['police_station']} ({case['district']})",
                f"Crime Type:          {case['crime_type']}",
                f"Status:              {case['status']}",
                f"Assigned Officer:    {case['assigned_officer']}",
                f"Sections Applied:    {case['sections_applied']}",
                f"Occurrence Time:     {case['occurrence_datetime']}",
                f"Reporting Time:      {case['reporting_datetime']}",
                f"Location:            {case['location']}",
                f"Complainant:         {case['complainant_name']} ({case['complainant_occupation']})",
                f"Accused:             {case['accused_name']}",
                f"Witness:             {case['witness_name']}",
                f"Investigation Notes: {case['progress']}",
                f"Description:         {case['description']}",
            ]

            if evidence:
                lines.append("\n=== LINKED EVIDENCE ITEMS ===")
                for ev in evidence:
                    lines.append(f"- [{ev['evidence_id']}] Type: {ev['evidence_type']} | Description: {ev['description']}")

            if entities:
                lines.append("\n=== LINKED ENTITIES & PERSONS ===")
                for ent in entities:
                    lines.append(f"- [{ent['entity_type']}] {ent['value']} (Role: {ent['role']})")

            if legal_info:
                lines.append("\n=== LEGAL INTELLIGENCE (BNS PROVISIONS) ===")
                for leg in legal_info:
                    lines.append(f"- {leg['section_number']}: {leg['title']} (Summary: {leg['summary']} | Old IPC: {leg['old_ipc_equivalent']})")

            if related:
                lines.append("\n=== CROSS-CASE INTELLIGENCE & LINKAGES ===")
                for rel in related:
                    lines.append(f"- Connected to {rel['fir_number']} via shared {rel['entity_type']} '{rel['shared_entity']}' ({rel['crime_type']} at {rel['police_station']})")

            lines.append("\nInstruction to Assistant: Ground your response strictly in the above verified facts. Answer clearly and concisely.")
            formatted_ctx = "\n".join(lines)

            return RetrievalResult(
                success=True,
                resource="case",
                identifier=case["fir_number"],
                data={
                    "case": case,
                    "evidence": evidence,
                    "entities": entities,
                    "legal_info": legal_info,
                    "related_cases": related,
                },
                raw_records_count=1 + len(evidence) + len(entities) + len(legal_info) + len(related),
                formatted_context=formatted_ctx,
                retrieval_latency_ms=round((time.perf_counter() - t0) * 1000.0, 3),
            )

        elif request.resource == "connections":
            conn_data = self.get_entity_connections(ident or "")
            t1 = time.perf_counter()
            lat = (t1 - t0) * 1000.0

            if conn_data["total_links"] == 0:
                ctx = f"CRIMELENS NETWORK SEARCH: No cross-case linkages found for entity '{ident}'."
            else:
                ctx_lines = [
                    f"=== CRIMELENS NETWORK / GRAPH INTELLIGENCE ===",
                    f"Entity: {conn_data['entity_value']} ({conn_data.get('entity_type', 'UNKNOWN')})",
                    f"Total Connected Cases: {conn_data['total_links']}",
                    "Linked Case Details:",
                ]
                for c in conn_data["linked_cases"]:
                    roles_str = ", ".join(c["roles_in_case"])
                    ctx_lines.append(f"- {c['fir_number']}: {c['crime_type']} at {c['police_station']} (Status: {c['status']}, Role: {roles_str})")
                ctx = "\n".join(ctx_lines)

            return RetrievalResult(
                success=conn_data["total_links"] > 0,
                resource="connections",
                identifier=ident,
                data=conn_data,
                raw_records_count=conn_data["total_links"],
                formatted_context=ctx,
                retrieval_latency_ms=round(lat, 3),
            )

        # Fallback for general queries
        return RetrievalResult(
            success=False,
            resource="general",
            identifier=ident,
            data={},
            raw_records_count=0,
            formatted_context="",
            retrieval_latency_ms=round((time.perf_counter() - t0) * 1000.0, 3),
        )
