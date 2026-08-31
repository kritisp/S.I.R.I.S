import logging
from typing import Any, Dict, List, Optional
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database.postgres import engine
from app.services.case_similarity.feature_extractor import CaseFeatureExtractor
from app.services.case_similarity.models import ExtractedCaseFeatures

logger = logging.getLogger(__name__)


class SpringBootPostgresAdapter:
    """
    Read-only Database Adapter reading operational PostgreSQL schema
    (cases, locations, persons, vehicles, phones, evidences, legal_sections)
    and projecting them into Central Intelligence normalized features without modifying PostgreSQL.
    """

    def __init__(self, session: Optional[Session] = None):
        self.session = session

    def _get_connection(self):
        if self.session:
            return self.session
        return engine.connect()

    def fetch_case_dict_by_id(self, case_id: Any) -> Optional[Dict[str, Any]]:
        """Fetch a single CaseRecord by string or UUID ID or FIR number from PostgreSQL."""
        case_id_str = str(case_id).strip()
        conn = self._get_connection()
        try:
            from sqlalchemy import inspect
            has_case_records = False
            try:
                has_case_records = inspect(conn).has_table("case_records")
            except Exception:
                pass

            result = None
            if has_case_records:
                query_sb = text("""
                    SELECT 
                        c.id, 
                        c.fir_number, 
                        c.station_id, 
                        ps.name as police_station, 
                        ps.district, 
                        ps.state, 
                        c.description, 
                        c.crime_type, 
                        c.status, 
                        c.priority,
                        c.incident_date,
                        c.created_at as registration_date,
                        c.created_at
                    FROM case_records c
                    LEFT JOIN police_stations ps ON c.station_id = ps.id
                    WHERE CAST(c.id AS VARCHAR) = :case_id OR c.fir_number = :case_id
                """)
                try:
                    result = conn.execute(query_sb, {"case_id": case_id_str}).mappings().first()
                except Exception:
                    result = None

            # Fallback to legacy schema table 'cases' if 'case_records' does not exist or yields no result
            if not result:
                query_legacy = text("""
                    SELECT 
                        c.id, c.fir_number, c.station_id, c.police_station, 
                        c.district, c.state, c.description, c.crime_type, 
                        c.crime_category, c.status, c.incident_date, 
                        c.registration_date, c.created_at, c.location_id
                    FROM cases c
                    WHERE CAST(c.id AS VARCHAR) = :case_id OR c.fir_number = :case_id
                """)
                try:
                    result = conn.execute(query_legacy, {"case_id": case_id_str}).mappings().first()
                except Exception:
                    result = None

            if not result:
                return None

            c_dict = dict(result)
            cid = c_dict["id"]

            # Populate Spring Boot collection tables if querying case_records
            # A. BNS Legal Sections
            try:
                sec_res = conn.execute(
                    text("SELECT section FROM case_bns_sections WHERE case_id = :cid"),
                    {"cid": cid}
                ).scalars().all()
                c_dict["legal_sections"] = [{"code": s, "law_name": "BNS"} for s in sec_res if s]
            except Exception:
                c_dict["legal_sections"] = c_dict.get("legal_sections", [])

            # B. Suspects
            persons = []
            try:
                suspects = conn.execute(
                    text("SELECT suspect FROM case_suspects WHERE case_id = :cid"),
                    {"cid": cid}
                ).scalars().all()
                for s in suspects:
                    if s:
                        persons.append({"name": s, "role": "SUSPECT"})
            except Exception:
                pass

            # C. Vehicles
            vehicles = []
            try:
                vehs = conn.execute(
                    text("SELECT vehicle FROM case_vehicles WHERE case_id = :cid"),
                    {"cid": cid}
                ).scalars().all()
                for v in vehs:
                    if v:
                        vehicles.append({"registration_number": v, "role": "SUSPECT_VEHICLE"})
            except Exception:
                pass

            # D. Extracted Entities (Persons, Vehicles, Phones)
            phones = []
            try:
                ents = conn.execute(
                    text("SELECT entity_type, entity_value, role FROM case_extracted_entities WHERE case_id = :cid"),
                    {"cid": cid}
                ).mappings().all()
                for e in ents:
                    etype = (e.get("entity_type") or "").upper()
                    eval = (e.get("entity_value") or "").strip()
                    erole = e.get("role") or "OTHER"
                    if etype in ("PERSON", "SUSPECT", "COMPLAINANT", "WITNESS") and eval:
                        persons.append({"name": eval, "role": erole})
                    elif etype in ("VEHICLE", "CAR", "BIKE") and eval:
                        vehicles.append({"registration_number": eval, "role": erole})
                    elif etype in ("PHONE", "MOBILE", "CONTACT") and eval:
                        phones.append({"normalized_number": eval, "role": erole})
            except Exception:
                pass

            c_dict["persons"] = persons
            c_dict["vehicles"] = vehicles
            c_dict["phones"] = phones

            # E. Locations
            try:
                locs = conn.execute(
                    text("SELECT location FROM case_locations WHERE case_id = :cid"),
                    {"cid": cid}
                ).scalars().all()
                if locs:
                    c_dict["address"] = ", ".join([l for l in locs if l])
            except Exception:
                pass

            # F. Evidences
            try:
                evs = conn.execute(
                    text("SELECT evidence_ref FROM case_evidence_refs WHERE case_id = :cid"),
                    {"cid": cid}
                ).scalars().all()
                c_dict["evidences"] = [{"id": str(i), "evidence_type": "DOCUMENT", "description": e} for i, e in enumerate(evs) if e]
            except Exception:
                c_dict["evidences"] = c_dict.get("evidences", [])

            return c_dict

        finally:
            if not self.session:
                conn.close()

    def fetch_all_case_dicts(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Fetch multiple CaseRecords from PostgreSQL."""
        conn = self._get_connection()
        try:
            from sqlalchemy import inspect
            has_case_records = False
            try:
                has_case_records = inspect(conn).has_table("case_records")
            except Exception:
                pass

            query = text("SELECT id FROM case_records ORDER BY created_at DESC LIMIT :limit") if has_case_records else text("SELECT id FROM cases ORDER BY created_at DESC LIMIT :limit")
            case_ids = conn.execute(query, {"limit": limit}).scalars().all()
            
            case_dicts = []
            for cid in case_ids:
                cd = self.fetch_case_dict_by_id(str(cid))
                if cd:
                    case_dicts.append(cd)
            return case_dicts
        finally:
            if not self.session:
                conn.close()

    def extract_features_by_id(self, case_id: str) -> Optional[ExtractedCaseFeatures]:
        """Fetch case dict from PostgreSQL and project into ExtractedCaseFeatures."""
        c_dict = self.fetch_case_dict_by_id(case_id)
        if not c_dict:
            return None
        return CaseFeatureExtractor.extract_from_dict(c_dict)


spring_boot_adapter = SpringBootPostgresAdapter()
