"""
S.I.R.I.S. Ultra-Fast Scale Seeder (1,200+ Cases)
=================================================
Ultra-fast bulk ingestion using psycopg2.extras.execute_values (batch size 1000)
and vectorized Neo4j Aura UNWIND projections. Completes entire 1,200+ dataset in ~15-20s.
"""

import datetime
import hashlib
import json
import logging
import os
import random
import sys
import time
import uuid
from pathlib import Path
from typing import Any, Dict, List, Tuple

# Add project root directory to python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

import psycopg2
from psycopg2.extras import execute_values
from app.data.stations import POLICE_STATIONS
from app.data.generators.location_generator import generate_synthetic_locations
from app.data.generators.person_generator import generate_synthetic_persons
from app.data.generators.vehicle_generator import generate_synthetic_vehicles
from app.data.generators.phone_generator import generate_synthetic_phones
from app.data.generators.cluster_builder import build_synthetic_dataset_v2
from app.models.legal_section import LegalSection
from app.services.graph.connection import neo4j_connection_service

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("ultra_fast_seed")


def ultra_fast_seed(total_cases: int = 1200):
    start_time = time.time()
    logger.info(f"=== INITIALIZING S.I.R.I.S. ULTRA-FAST SEEDER ({total_cases} Cases) ===")
    rng = random.Random(20260420)

    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        raise RuntimeError("DATABASE_URL is not configured in .env!")

    conn = psycopg2.connect(db_url)
    conn.autocommit = True
    cur = conn.cursor()

    # 1. Clear Old Development Records
    logger.info("1. Clearing tables...")
    tables = [
        "workspace_cases", "case_suspects", "case_vehicles", "case_locations",
        "case_bns_sections", "case_evidence_refs", "case_cctv_refs", "case_linked_ids",
        "case_extracted_entities", "case_records",
        "case_legal_sections", "case_persons", "case_phones",
        "evidences", "investigation_events", "chargesheets", "cases",
        "person_phones", "persons", "vehicles", "phones", "locations"
    ]
    for t in tables:
        try:
            cur.execute(f"DELETE FROM {t};")
        except Exception:
            pass
    logger.info("Tables cleared.")

    # 2. Populate Police Stations
    logger.info("2. Seeding police stations...")
    st_tuples = [
        (st["station_id"], st["police_station"], st.get("district", "Khordha (Bhubaneswar)"), st.get("city", "Bhubaneswar"), st.get("state", "Odisha"), "ACTIVE")
        for st in POLICE_STATIONS
    ]
    execute_values(
        cur,
        """
        INSERT INTO police_stations (id, name, district, city, state, status)
        VALUES %s
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, district = EXCLUDED.district
        """,
        st_tuples
    )

    # 3. Populate Legal Sections
    logger.info("3. Seeding legal sections...")
    sections_raw = [
        ("BNS 303(2)", "Theft", "Punishment for committing theft in ordinary circumstances", "BNS"),
        ("BNS 305(a)", "Theft in Dwelling House", "Theft in building, tent, or vessel used as human dwelling or for custody of property", "BNS"),
        ("BNS 309(4)", "Robbery with Attempt to Cause Death", "Robbery or dacoity with attempt to cause death or grievous hurt", "BNS"),
        ("BNS 310(2)", "Dacoity", "Dacoity committed by five or more persons conjointly", "BNS"),
        ("BNS 316(2)", "Criminal Breach of Trust", "Dishonest misappropriation of property entrusted", "BNS"),
        ("BNS 318(4)", "Cheating and Dishonestly Inducing Delivery", "Cheating and dishonestly inducing delivery of property", "BNS"),
        ("BNS 331(4)", "Lurking House-Trespass by Night", "House-trespass or house-breaking by night in order to commit offense", "BNS"),
        ("BNS 103(1)", "Murder", "Punishment for murder committed with premeditation or knowledge", "BNS"),
        ("BNS 111(1)", "Organized Crime", "Continuing unlawful activity including extortion, contract killing, land grabbing", "BNS"),
        ("BNS 112(1)", "Petty Organized Crime", "Theft, snatching, cheating through organized gang", "BNS"),
        ("IPC 379", "Punishment for Theft", "Theft under Indian Penal Code legacy section", "IPC"),
        ("IPC 392", "Punishment for Robbery", "Robbery under Indian Penal Code", "IPC"),
        ("IPC 420", "Cheating and Dishonesty", "Cheating and dishonestly inducing delivery of property", "IPC"),
        ("IPC 302", "Punishment for Murder", "Murder under Indian Penal Code", "IPC"),
        ("NDPS 20(b)", "Narcotic Drugs & Psychotropic Substances", "Possession, sale, transit of commercial quantity contraband", "NDPS Act"),
        ("IT 66D", "Cheating by Personation using Computer", "Cheating by personation by using computer resource", "IT Act"),
    ]
    cur.execute("SELECT code FROM legal_sections")
    existing_codes = set(r[0] for r in cur.fetchall())
    to_insert_secs = [
        (str(uuid.uuid4()), code, title, desc, law)
        for code, title, desc, law in sections_raw if code not in existing_codes
    ]
    if to_insert_secs:
        execute_values(
            cur,
            "INSERT INTO legal_sections (id, code, title, description, law_name) VALUES %s",
            to_insert_secs
        )

    cur.execute("SELECT id, code, title, description, law_name FROM legal_sections")
    db_sections = cur.fetchall()
    legal_sections = [
        LegalSection(id=uuid.UUID(str(r[0])), code=r[1], title=r[2], description=r[3], law_name=r[4])
        for r in db_sections
    ]

    # 4. Generate Synthetic Base Entities
    logger.info("4. Generating entities (Locations, Persons, Vehicles, Phones)...")
    locations = generate_synthetic_locations(rng, count=350)
    persons, name_variations = generate_synthetic_persons(rng, count=950)
    vehicles = generate_synthetic_vehicles(rng, count=650)
    phones = generate_synthetic_phones(rng, count=850)

    for l in locations:
        if not l.id: l.id = uuid.uuid4()
    for p in persons:
        if not p.id: p.id = uuid.uuid4()
        if not p.identifier_hash:
            p.identifier_hash = hashlib.sha256(p.name.encode()).hexdigest()[:32]
    for v in vehicles:
        if not v.id: v.id = uuid.uuid4()
    for ph in phones:
        if not ph.id: ph.id = uuid.uuid4()
        if not ph.number_hash:
            ph.number_hash = hashlib.sha256(ph.normalized_number.encode()).hexdigest()[:32]

    # Fast Insert Locations
    loc_tuples = [
        (str(l.id), l.address, l.locality, l.city, l.district, l.state, l.latitude, l.longitude)
        for l in locations
    ]
    execute_values(cur, "INSERT INTO locations (id, address, locality, city, district, state, latitude, longitude) VALUES %s", loc_tuples)

    # Fast Insert Persons
    person_tuples = [
        (str(p.id), p.name, p.gender or "UNKNOWN", p.date_of_birth, p.address, p.identifier_hash)
        for p in persons
    ]
    execute_values(cur, "INSERT INTO persons (id, name, gender, date_of_birth, address, identifier_hash) VALUES %s", person_tuples)

    # Fast Insert Vehicles
    veh_tuples = [
        (str(v.id), v.registration_number, v.vehicle_type, v.make, v.model)
        for v in vehicles
    ]
    execute_values(cur, "INSERT INTO vehicles (id, registration_number, vehicle_type, make, model) VALUES %s", veh_tuples)

    # Fast Insert Phones
    phone_tuples = [
        (str(p.id), p.normalized_number, p.number_hash)
        for p in phones
    ]
    execute_values(cur, "INSERT INTO phones (id, normalized_number, number_hash) VALUES %s", phone_tuples)

    # 5. Build Interconnected Cases
    logger.info(f"5. Generating {total_cases} multi-district interconnected cases...")
    cases, ground_truth, style_counts = build_synthetic_dataset_v2(
        rng=rng,
        locations=locations,
        persons=persons,
        name_variations=name_variations,
        vehicles=vehicles,
        phones=phones,
        legal_sections=legal_sections,
        total_cases=total_cases,
    )

    for c in cases:
        if not c.id:
            c.id = uuid.uuid4()

    # 6. Fast Insert Cases & Case Records
    logger.info("6. Fast bulk inserting cases and case_records...")
    case_records_tuples = []
    cases_tuples = []

    for c in cases:
        c_id = str(c.id)
        priority = "HIGH" if "BURGLARY" in (c.crime_type or "") or "MURDER" in (c.crime_type or "") or "ORGANIZED" in (c.crime_type or "") else "MEDIUM"
        case_records_tuples.append((
            c_id, c.fir_number, c.station_id, f"{c.crime_type} - {c.police_station}",
            c.description, c.crime_type, c.status or "UNDER_INVESTIGATION", priority,
            c.incident_date, datetime.datetime.now(), datetime.datetime.now()
        ))
        cases_tuples.append((
            c_id, c.fir_number, c.station_id, c.police_station, c.district, c.state,
            c.registration_date, c.incident_date, c.incident_time, c.crime_type,
            c.crime_category, c.description, c.status or "UNDER_INVESTIGATION",
            str(c.location_id) if c.location_id else None, datetime.datetime.now(), datetime.datetime.now()
        ))

    execute_values(
        cur,
        """
        INSERT INTO case_records (id, fir_number, station_id, title, description, crime_type, status, priority, incident_date, created_at, updated_at)
        VALUES %s ON CONFLICT (id) DO NOTHING
        """,
        case_records_tuples
    )
    execute_values(
        cur,
        """
        INSERT INTO cases (id, fir_number, station_id, police_station, district, state, registration_date, incident_date, incident_time, crime_type, crime_category, description, status, location_id, created_at, updated_at)
        VALUES %s ON CONFLICT (id) DO NOTHING
        """,
        cases_tuples
    )

    # 7. Fast Insert Junction & Evidence Tables
    logger.info("7. Fast bulk inserting junction tables and evidences...")
    cp_tuples = []
    cph_tuples = []
    cv_tuples = []
    cls_tuples = []
    ev_tuples = []
    ie_tuples = []

    case_suspects_tuples = []
    case_locations_tuples = []
    case_bns_tuples = []
    case_evidence_tuples = []

    person_map = {p.id: p for p in persons}
    phone_map = {p.id: p for p in phones}
    location_map = {l.id: l for l in locations}
    section_map = {s.id: s for s in legal_sections}

    for c in cases:
        c_id = str(c.id)

        for cp in getattr(c, "person_associations", []):
            role_str = cp.role.value if hasattr(cp.role, "value") else str(cp.role)
            if role_str not in ["ACCUSED", "SUSPECT", "VICTIM", "WITNESS", "COMPLAINANT", "OTHER"]:
                role_str = "SUSPECT"
            cp_tuples.append((str(uuid.uuid4()), c_id, str(cp.person_id), role_str, getattr(cp, "statement_summary", None)))
            if role_str in ["ACCUSED", "SUSPECT"] and cp.person_id in person_map:
                case_suspects_tuples.append((c_id, person_map[cp.person_id].name))

        for cph in getattr(c, "phone_associations", []):
            cph_tuples.append((str(uuid.uuid4()), c_id, str(cph.phone_id)))

        for cv in getattr(c, "vehicle_associations", []):
            role_str = cv.role.value if hasattr(cv.role, "value") else str(cv.role)
            if role_str not in ["SUSPECT_VEHICLE", "STOLEN_VEHICLE", "RECOVERED_VEHICLE", "VICTIM_VEHICLE", "OTHER"]:
                role_str = "SUSPECT_VEHICLE"
            veh_str = cv.vehicle or "OD02A1234"
            cv_tuples.append((c_id, str(cv.vehicle_id) if cv.vehicle_id else None, veh_str, role_str))

        for cls in getattr(c, "legal_section_associations", []):
            cls_tuples.append((str(uuid.uuid4()), c_id, str(cls.legal_section_id)))
            if cls.legal_section_id in section_map:
                case_bns_tuples.append((c_id, section_map[cls.legal_section_id].code))

        for ev in getattr(c, "evidences", []):
            ev_type = ev.evidence_type.value if hasattr(ev.evidence_type, "value") else str(ev.evidence_type)
            ev_date = getattr(ev, 'collected_at', None) or getattr(ev, 'collection_date', None) or datetime.date.today()
            ev_id = str(ev.id or uuid.uuid4())
            ev_tuples.append((ev_id, c_id, ev_type, ev.description, ev.source or "SCENE_OF_CRIME", str(ev_date), "SECURED"))
            case_evidence_tuples.append((c_id, f"{ev_type}: {ev.description[:60]}"))

        for ie in getattr(c, "investigation_events", []):
            ie_type = ie.event_type.value if hasattr(ie.event_type, "value") else str(ie.event_type)
            ie_tuples.append((str(ie.id or uuid.uuid4()), c_id, ie_type, ie.description, str(ie.event_date or datetime.date.today()), "SI_ODISHA_POLICE"))

        if c.location_id and c.location_id in location_map:
            loc_obj = location_map[c.location_id]
            case_locations_tuples.append((c_id, f"{loc_obj.locality or loc_obj.city}, {loc_obj.district}"))

    if cp_tuples:
        execute_values(cur, "INSERT INTO case_persons (id, case_id, person_id, role, details) VALUES %s ON CONFLICT DO NOTHING", cp_tuples)
    if cph_tuples:
        execute_values(cur, "INSERT INTO case_phones (id, case_id, phone_id) VALUES %s ON CONFLICT DO NOTHING", cph_tuples)
    if cv_tuples:
        execute_values(cur, "INSERT INTO case_vehicles (case_id, vehicle_id, vehicle, role) VALUES %s", cv_tuples)
    if cls_tuples:
        execute_values(cur, "INSERT INTO case_legal_sections (id, case_id, legal_section_id) VALUES %s ON CONFLICT DO NOTHING", cls_tuples)
    if ev_tuples:
        execute_values(cur, "INSERT INTO evidences (id, case_id, evidence_type, description, source, collected_at, status) VALUES %s ON CONFLICT DO NOTHING", ev_tuples)
    if ie_tuples:
        execute_values(cur, "INSERT INTO investigation_events (id, case_id, event_type, description, event_date, officer_reference) VALUES %s ON CONFLICT DO NOTHING", ie_tuples)

    if case_suspects_tuples:
        execute_values(cur, "INSERT INTO case_suspects (case_id, suspect) VALUES %s", case_suspects_tuples)
    if case_locations_tuples:
        execute_values(cur, "INSERT INTO case_locations (case_id, location) VALUES %s", case_locations_tuples)
    if case_bns_tuples:
        execute_values(cur, "INSERT INTO case_bns_sections (case_id, section) VALUES %s", case_bns_tuples)
    if case_evidence_tuples:
        execute_values(cur, "INSERT INTO case_evidence_refs (case_id, evidence_ref) VALUES %s", case_evidence_tuples)

    # Verify counts in Supabase
    cur.execute("SELECT count(*) FROM cases")
    db_c = cur.fetchone()[0]
    cur.execute("SELECT count(*) FROM case_records")
    db_cr = cur.fetchone()[0]
    cur.execute("SELECT count(*) FROM persons")
    db_p = cur.fetchone()[0]
    cur.execute("SELECT count(*) FROM phones")
    db_ph = cur.fetchone()[0]
    cur.execute("SELECT count(*) FROM vehicles")
    db_v = cur.fetchone()[0]
    cur.execute("SELECT count(*) FROM evidences")
    db_e = cur.fetchone()[0]
    cur.execute("SELECT count(*) FROM case_persons")
    db_cp = cur.fetchone()[0]
    cur.execute("SELECT count(*) FROM case_suspects")
    db_cs = cur.fetchone()[0]

    conn.close()

    logger.info(f"Supabase Ingestion Finished: {db_c} Cases, {db_cr} CaseRecords, {db_p} Persons, {db_ph} Phones, {db_v} Vehicles, {db_e} Evidences, {db_cp} Person-Case Links, {db_cs} Suspects")

    # 8. Project Graph into Cloud Neo4j Aura
    logger.info("8. Projecting full investigation network into Neo4j Aura Cloud...")
    with neo4j_connection_service.get_session() as neo_session:
        logger.info("Resetting Neo4j graph space...")
        neo_session.run("MATCH (n) DETACH DELETE n")

        # 8a. Case Nodes
        case_nodes_payload = [{
            "node_id": f"case:{c.fir_number}",
            "fir_number": c.fir_number,
            "station_id": c.station_id,
            "police_station": c.police_station,
            "district": c.district,
            "crime_type": c.crime_type,
            "crime_category": c.crime_category,
            "incident_date": str(c.incident_date),
            "status": c.status
        } for c in cases]
        neo_session.run("""
            UNWIND $batch AS row
            MERGE (c:Case:CASE {node_id: row.node_id})
            SET c.fir_number = row.fir_number,
                c.station_id = row.station_id,
                c.police_station = row.police_station,
                c.district = row.district,
                c.crime_type = row.crime_type,
                c.crime_category = row.crime_category,
                c.incident_date = row.incident_date,
                c.status = row.status
        """, {"batch": case_nodes_payload})

        # 8b. Person Nodes
        person_nodes_payload = [{
            "node_id": f"person:{p.name.lower().replace(' ', '_')}",
            "name": p.name,
            "normalized_name": p.name.upper(),
            "gender": p.gender or "UNKNOWN",
            "identifier_hash": p.identifier_hash or ""
        } for p in persons]
        neo_session.run("""
            UNWIND $batch AS row
            MERGE (p:Person:PERSON {node_id: row.node_id})
            SET p.name = row.name,
                p.normalized_name = row.normalized_name,
                p.gender = row.gender,
                p.identifier_hash = row.identifier_hash
        """, {"batch": person_nodes_payload})

        # 8c. Phone Nodes
        phone_nodes_payload = [{
            "node_id": f"phone:{p.normalized_number}",
            "normalized_number": p.normalized_number,
            "raw_number": p.normalized_number
        } for p in phones]
        neo_session.run("""
            UNWIND $batch AS row
            MERGE (p:Phone:PHONE {node_id: row.node_id})
            SET p.normalized_number = row.normalized_number,
                p.raw_number = row.raw_number
        """, {"batch": phone_nodes_payload})

        # 8d. Vehicle Nodes
        vehicle_nodes_payload = [{
            "node_id": f"vehicle:{v.registration_number}",
            "registration_number": v.registration_number,
            "vehicle_type": str(v.vehicle_type) if v.vehicle_type else "TWO_WHEELER",
            "make": v.make or "",
            "model": v.model or ""
        } for v in vehicles]
        neo_session.run("""
            UNWIND $batch AS row
            MERGE (v:Vehicle:VEHICLE {node_id: row.node_id})
            SET v.registration_number = row.registration_number,
                v.vehicle_type = row.vehicle_type,
                v.make = row.make,
                v.model = row.model
        """, {"batch": vehicle_nodes_payload})

        # 8e. Location Nodes
        location_nodes_payload = [{
            "node_id": f"location:{l.city.lower()}_{l.district.lower().replace(' ', '_')}",
            "city": l.city,
            "district": l.district,
            "state": l.state,
            "locality": l.locality or l.city,
            "latitude": l.latitude,
            "longitude": l.longitude
        } for l in locations]
        neo_session.run("""
            UNWIND $batch AS row
            MERGE (l:Location:LOCATION {node_id: row.node_id})
            SET l.city = row.city,
                l.district = row.district,
                l.state = row.state,
                l.locality = row.locality,
                l.latitude = row.latitude,
                l.longitude = row.longitude
        """, {"batch": location_nodes_payload})

        # 8f. Legal Section Nodes
        legal_sec_nodes_payload = [{
            "node_id": f"section:{s.code.lower().replace(' ', '_').replace('(', '').replace(')', '')}",
            "code": s.code,
            "title": s.title,
            "law_name": s.law_name
        } for s in legal_sections]
        neo_session.run("""
            UNWIND $batch AS row
            MERGE (s:LegalSection:LEGALSECTION {node_id: row.node_id})
            SET s.code = row.code,
                s.title = row.title,
                s.law_name = row.law_name
        """, {"batch": legal_sec_nodes_payload})

        # 8g. Relationships
        case_loc_rels = []
        person_case_rels = []
        phone_case_rels = []
        veh_case_rels = []
        sec_case_rels = []
        person_phone_rels = []

        for c in cases:
            c_node_id = f"case:{c.fir_number}"

            if c.location_id and c.location_id in location_map:
                l = location_map[c.location_id]
                case_loc_rels.append({
                    "case_node_id": c_node_id,
                    "loc_node_id": f"location:{l.city.lower()}_{l.district.lower().replace(' ', '_')}"
                })

            for cp in getattr(c, "person_associations", []):
                if cp.person_id in person_map:
                    p = person_map[cp.person_id]
                    p_node_id = f"person:{p.name.lower().replace(' ', '_')}"
                    role_val = cp.role.value if hasattr(cp.role, "value") else str(cp.role)
                    person_case_rels.append({
                        "person_node_id": p_node_id,
                        "case_node_id": c_node_id,
                        "role": role_val
                    })

                    if getattr(p, "phone", None):
                        person_phone_rels.append({
                            "person_node_id": p_node_id,
                            "phone_node_id": f"phone:{p.phone}"
                        })

            for cph in getattr(c, "phone_associations", []):
                if cph.phone_id in phone_map:
                    ph = phone_map[cph.phone_id]
                    phone_case_rels.append({
                        "phone_node_id": f"phone:{ph.normalized_number}",
                        "case_node_id": c_node_id
                    })

            for cv in getattr(c, "vehicle_associations", []):
                v_num = cv.vehicle or (vehicles[0].registration_number if vehicles else "OD02A1234")
                veh_case_rels.append({
                    "veh_node_id": f"vehicle:{v_num}",
                    "case_node_id": c_node_id,
                    "role": cv.role.value if hasattr(cv.role, "value") else str(cv.role)
                })

            for cls in getattr(c, "legal_section_associations", []):
                if cls.legal_section_id in section_map:
                    sec = section_map[cls.legal_section_id]
                    sec_case_rels.append({
                        "case_node_id": c_node_id,
                        "sec_node_id": f"section:{sec.code.lower().replace(' ', '_').replace('(', '').replace(')', '')}"
                    })

        logger.info("Executing Cypher UNWIND relationship projections in batches...")
        if case_loc_rels:
            neo_session.run("""
                UNWIND $batch AS row
                MATCH (c:Case {node_id: row.case_node_id}), (l:Location {node_id: row.loc_node_id})
                MERGE (c)-[:OCCURRED_AT]->(l)
            """, {"batch": case_loc_rels})

        if person_case_rels:
            neo_session.run("""
                UNWIND $batch AS row
                MATCH (p:Person {node_id: row.person_node_id}), (c:Case {node_id: row.case_node_id})
                MERGE (p)-[r:INVOLVED_IN]->(c)
                SET r.role = row.role
            """, {"batch": person_case_rels})

        if phone_case_rels:
            neo_session.run("""
                UNWIND $batch AS row
                MATCH (p:Phone {node_id: row.phone_node_id}), (c:Case {node_id: row.case_node_id})
                MERGE (p)-[:USED_PHONE]->(c)
                MERGE (p)-[:ASSOCIATED_WITH_CASE]->(c)
            """, {"batch": phone_case_rels})

        if veh_case_rels:
            neo_session.run("""
                UNWIND $batch AS row
                MATCH (v:Vehicle {node_id: row.veh_node_id}), (c:Case {node_id: row.case_node_id})
                MERGE (v)-[r:OPERATES_VEHICLE]->(c)
                MERGE (v)-[r2:INVOLVED_IN_CASE]->(c)
                SET r.role = row.role
            """, {"batch": veh_case_rels})

        if sec_case_rels:
            neo_session.run("""
                UNWIND $batch AS row
                MATCH (c:Case {node_id: row.case_node_id}), (s:LegalSection {node_id: row.sec_node_id})
                MERGE (c)-[:CHARGED_UNDER]->(s)
            """, {"batch": sec_case_rels})

        if person_phone_rels:
            neo_session.run("""
                UNWIND $batch AS row
                MATCH (p:Person {node_id: row.person_node_id}), (ph:Phone {node_id: row.phone_node_id})
                MERGE (p)-[:USED_PHONE]->(ph)
            """, {"batch": person_phone_rels})

        logger.info("Projecting cross-case syndicated relationships...")
        neo_session.run("""
            MATCH (c1:Case), (c2:Case)
            WHERE c1.node_id < c2.node_id AND c1.crime_type = c2.crime_type AND c1.district = c2.district
            WITH c1, c2 LIMIT 1500
            MERGE (c1)-[:SIMILAR_MODUS_OPERANDI {similarity_score: 0.88, basis: 'Same District & Crime Pattern'}]->(c2)
        """)

        neo_session.run("""
            MATCH (p1:Person)-[:INVOLVED_IN]->(c:Case)<-[:INVOLVED_IN]-(p2:Person)
            WHERE p1.node_id < p2.node_id
            MERGE (p1)-[:ASSOCIATED_WITH {relationship: 'CO_ACCUSED_IN_CASE'}]->(p2)
        """)

        n_nodes = neo_session.run("MATCH (n) RETURN count(n) as c").single()["c"]
        n_rels = neo_session.run("MATCH ()-[r]->() RETURN count(r) as c").single()["c"]
        n_cases = neo_session.run("MATCH (c:Case) RETURN count(c) as c").single()["c"]
        n_persons = neo_session.run("MATCH (p:Person) RETURN count(p) as c").single()["c"]
        n_phones = neo_session.run("MATCH (p:Phone) RETURN count(p) as c").single()["c"]
        n_vehicles = neo_session.run("MATCH (v:Vehicle) RETURN count(v) as c").single()["c"]
        n_locations = neo_session.run("MATCH (l:Location) RETURN count(l) as c").single()["c"]
        n_sections = neo_session.run("MATCH (s:LegalSection) RETURN count(s) as c").single()["c"]

    elapsed = round(time.time() - start_time, 2)
    logger.info("==================================================")
    logger.info("S.I.R.I.S. 1,000+ CASE SCALE INGESTION COMPLETED")
    logger.info(f"Elapsed Time: {elapsed} seconds")
    logger.info(f"Supabase PostgreSQL : {db_c} Cases, {db_p} Persons, {db_ph} Phones, {db_v} Vehicles, {db_e} Evidences")
    logger.info(f"Neo4j Aura Cloud    : {n_nodes} Nodes, {n_rels} Relationships")
    logger.info(f"  • Cases in Graph   : {n_cases}")
    logger.info(f"  • Persons in Graph : {n_persons}")
    logger.info(f"  • Phones in Graph  : {n_phones}")
    logger.info(f"  • Vehicles in Graph: {n_vehicles}")
    logger.info(f"  • Locations in Graph: {n_locations}")
    logger.info(f"  • Sections in Graph: {n_sections}")
    logger.info("==================================================")


if __name__ == "__main__":
    ultra_fast_seed(total_cases=1200)
