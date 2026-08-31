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
        query = text("""
            SELECT 
                c.id, 
                c.fir_number, 
                c.station_id, 
                c.police_station, 
                c.district, 
                c.state, 
                c.description, 
                c.crime_type, 
                c.crime_category,
                c.status, 
                c.incident_date,
                c.registration_date,
                c.created_at,
                c.location_id
            FROM cases c
            WHERE CAST(c.id AS VARCHAR) = :case_id OR c.fir_number = :case_id
        """)

        conn = self._get_connection()
        try:
            result = conn.execute(query, {"case_id": case_id_str}).mappings().first()
            if not result:
                return None

            c_dict = dict(result)
            cid = c_dict["id"]

            # Fetch location
            if c_dict.get("location_id"):
                loc_res = conn.execute(
                    text("SELECT address, locality, city, district, state, latitude, longitude FROM locations WHERE id = :loc_id"),
                    {"loc_id": c_dict["location_id"]}
                ).mappings().first()
                if loc_res:
                    c_dict.update(dict(loc_res))

            # Fetch Legal Sections
            sec_res = conn.execute(
                text("""
                    SELECT ls.code, ls.law_name 
                    FROM case_legal_sections cls
                    JOIN legal_sections ls ON cls.legal_section_id = ls.id
                    WHERE cls.case_id = :cid
                """),
                {"cid": cid}
            ).mappings().all()
            c_dict["legal_sections"] = [{"code": s["code"], "law_name": s["law_name"]} for s in sec_res]

            # Fetch Persons
            p_res = conn.execute(
                text("""
                    SELECT p.id, p.name, p.gender, cp.role 
                    FROM case_persons cp
                    JOIN persons p ON cp.person_id = p.id
                    WHERE cp.case_id = :cid
                """),
                {"cid": cid}
            ).mappings().all()
            c_dict["persons"] = [dict(p) for p in p_res]

            # Fetch Vehicles
            v_res = conn.execute(
                text("""
                    SELECT v.id, v.registration_number, v.vehicle_type, v.make, v.model, cv.role 
                    FROM case_vehicles cv
                    JOIN vehicles v ON cv.vehicle_id = v.id
                    WHERE cv.case_id = :cid
                """),
                {"cid": cid}
            ).mappings().all()
            c_dict["vehicles"] = [dict(v) for v in v_res]

            # Fetch Phones
            ph_res = conn.execute(
                text("""
                    SELECT ph.id, ph.normalized_number
                    FROM case_phones cph
                    JOIN phones ph ON cph.phone_id = ph.id
                    WHERE cph.case_id = :cid
                """),
                {"cid": cid}
            ).mappings().all()
            c_dict["phones"] = [dict(ph) for ph in ph_res]

            # Fetch Evidence
            ev_res = conn.execute(
                text("SELECT id, evidence_type, description FROM evidences WHERE case_id = :cid"),
                {"cid": cid}
            ).mappings().all()
            c_dict["evidences"] = [dict(ev) for ev in ev_res]

            return c_dict

        finally:
            if not self.session:
                conn.close()

    def fetch_all_case_dicts(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Fetch multiple CaseRecords from PostgreSQL."""
        query = text("SELECT id FROM cases ORDER BY created_at DESC LIMIT :limit")
        conn = self._get_connection()
        try:
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
