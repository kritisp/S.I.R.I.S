"""
S.I.R.I.S. Fast Bulk Scale Seeder (1,200+ Cases)
================================================
Generates 1,200+ structured FIR cases across all 30 districts of Odisha with interconnected
criminal syndicates, bulk-inserts them into Supabase PostgreSQL, and projects the entire
multi-hop knowledge graph into Cloud Neo4j Aura in seconds using vectorized UNWIND Cypher queries.
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

from sqlalchemy import create_engine, text
from app.data.stations import POLICE_STATIONS
from app.data.generators.location_generator import generate_synthetic_locations
from app.data.generators.person_generator import generate_synthetic_persons
from app.data.generators.vehicle_generator import generate_synthetic_vehicles
from app.data.generators.phone_generator import generate_synthetic_phones
from app.data.generators.cluster_builder import build_synthetic_dataset_v2
from app.models.legal_section import LegalSection
from app.services.graph.connection import neo4j_connection_service

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("fast_bulk_seed_1000")


def fast_seed(total_cases: int = 1200):
    start_time = time.time()
    logger.info(f"=== INITIALIZING S.I.R.I.S. FAST BULK SEEDER (Target: {total_cases} Cases) ===")
    rng = random.Random(20260420)

    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        raise RuntimeError("DATABASE_URL is not configured in .env!")

    engine = create_engine(db_url, pool_pre_ping=True, pool_recycle=300)
    
    # ---------------------------------------------------------
    # 1. Clear Old Development Records
    # ---------------------------------------------------------
    logger.info("Step 1: Clearing old development records from Supabase...")
    tables = [
        "workspace_cases", "case_suspects", "case_vehicles", "case_locations",
        "case_bns_sections", "case_evidence_refs", "case_cctv_refs", "case_linked_ids",
        "case_extracted_entities", "case_records",
        "case_legal_sections", "case_persons", "case_phones",
        "evidences", "investigation_events", "chargesheets", "cases",
        "person_phones", "persons", "vehicles", "phones", "locations"
    ]
    with engine.begin() as conn:
        for t in tables:
            try:
                conn.execute(text(f"DELETE FROM {t};"))
            except Exception as e:
                logger.debug(f"Table clear notice for {t}: {e}")
    logger.info("Supabase tables cleared successfully.")

    # ---------------------------------------------------------
    # 2. Populate Police Stations
    # ---------------------------------------------------------
    logger.info("Step 2: Populating police_stations...")
    stations_data = []
    for st in POLICE_STATIONS:
        stations_data.append({
            "id": st["station_id"],
            "name": st["police_station"],
            "district": st.get("district", "Khordha (Bhubaneswar)"),
            "city": st.get("city", "Bhubaneswar"),
            "state": st.get("state", "Odisha")
        })
    
    with engine.begin() as conn:
        conn.execute(
            text("""
                INSERT INTO police_stations (id, name, district, city, state, status, created_at, updated_at)
                VALUES (:id, :name, :district, :city, :state, 'ACTIVE', NOW(), NOW())
                ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, district = EXCLUDED.district
            """),
            stations_data
        )
    logger.info(f"Populated {len(stations_data)} police stations.")

    # ---------------------------------------------------------
    # 3. Populate Legal Sections
    # ---------------------------------------------------------
    logger.info("Step 3: Populating BNS & IPC Legal Sections...")
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

    with engine.begin() as conn:
        existing_codes = set(r[0] for r in conn.execute(text("SELECT code FROM legal_sections")).fetchall())
        to_insert_secs = []
        for code, title, desc, law in sections_raw:
            if code not in existing_codes:
                to_insert_secs.append({
                    "id": str(uuid.uuid4()),
                    "code": code,
                    "title": title,
                    "description": desc,
                    "law_name": law
                })
        if to_insert_secs:
            conn.execute(
                text("""
                    INSERT INTO legal_sections (id, code, title, description, law_name, created_at, updated_at)
                    VALUES (:id, :code, :title, :description, :law_name, NOW(), NOW())
                """),
                to_insert_secs
            )

    # Fetch all legal sections with IDs
    with engine.connect() as conn:
        db_sections = conn.execute(text("SELECT id, code, title, description, law_name FROM legal_sections")).fetchall()
        legal_sections = [
            LegalSection(id=uuid.UUID(str(r[0])), code=r[1], title=r[2], description=r[3], law_name=r[4])
            for r in db_sections
        ]
    logger.info(f"Loaded {len(legal_sections)} authoritative legal sections.")

    # ---------------------------------------------------------
    # 4. Generate Synthetic Entities
    # ---------------------------------------------------------
    logger.info("Step 4: Generating entities (Locations, Persons, Vehicles, Phones)...")
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

    # Bulk insert locations
    loc_rows = [{
        "id": str(l.id), "address": l.address, "locality": l.locality,
        "city": l.city, "district": l.district, "state": l.state,
        "latitude": l.latitude, "longitude": l.longitude
    } for l in locations]
    with engine.begin() as conn:
        conn.execute(
            text("""
                INSERT INTO locations (id, address, locality, city, district, state, latitude, longitude, created_at, updated_at)
                VALUES (:id, :address, :locality, :city, :district, :state, :latitude, :longitude, NOW(), NOW())
            """),
            loc_rows
        )
    logger.info(f"Inserted {len(loc_rows)} locations.")

    # Bulk insert persons
    person_rows = [{
        "id": str(p.id), "name": p.name, "gender": p.gender or "UNKNOWN",
        "date_of_birth": p.date_of_birth,
        "address": p.address, "identifier_hash": p.identifier_hash
    } for p in persons]
    with engine.begin() as conn:
        conn.execute(
            text("""
                INSERT INTO persons (id, name, gender, date_of_birth, address, identifier_hash, created_at, updated_at)
                VALUES (:id, :name, :gender, :date_of_birth, :address, :identifier_hash, NOW(), NOW())
            """),
            person_rows
        )
    logger.info(f"Inserted {len(person_rows)} persons.")

    # Bulk insert vehicles
    veh_rows = [{
        "id": str(v.id), "registration_number": v.registration_number,
        "vehicle_type": v.vehicle_type, "make": v.make, "model": v.model
    } for v in vehicles]
    with engine.begin() as conn:
        conn.execute(
            text("""
                INSERT INTO vehicles (id, registration_number, vehicle_type, make, model, created_at, updated_at)
                VALUES (:id, :registration_number, :vehicle_type, :make, :model, NOW(), NOW())
            """),
            veh_rows
        )
    logger.info(f"Inserted {len(veh_rows)} vehicles.")

    # Bulk insert phones
    phone_rows = [{
        "id": str(p.id), "normalized_number": p.normalized_number,
        "number_hash": p.number_hash
    } for p in phones]
    with engine.begin() as conn:
        conn.execute(
            text("""
                INSERT INTO phones (id, normalized_number, number_hash, created_at, updated_at)
                VALUES (:id, :normalized_number, :number_hash, NOW(), NOW())
            """),
            phone_rows
        )
    logger.info(f"Inserted {len(phone_rows)} phones.")

    # ---------------------------------------------------------
    # 5. Build Interconnected Cases & Clusters V2
    # ---------------------------------------------------------
    logger.info(f"Step 5: Building {total_cases} interconnected cases across all 30 districts...")
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

    logger.info(f"Generated {len(cases)} case structures.")

    # ---------------------------------------------------------
    # 6. Bulk Insert case_records and cases
    # ---------------------------------------------------------
    logger.info("Step 6: Bulk inserting into case_records and cases tables...")
    case_records_rows = []
    cases_rows = []
    
    for c in cases:
        c_id = str(c.id)
        priority = "HIGH" if "BURGLARY" in (c.crime_type or "") or "MURDER" in (c.crime_type or "") or "ORGANIZED" in (c.crime_type or "") else "MEDIUM"
        
        case_records_rows.append({
            "id": c_id,
            "fir_number": c.fir_number,
            "station_id": c.station_id,
            "title": f"{c.crime_type} - {c.police_station}",
            "description": c.description,
            "crime_type": c.crime_type,
            "status": c.status or "UNDER_INVESTIGATION",
            "priority": priority,
            "incident_date": c.incident_date,
        })

        cases_rows.append({
            "id": c_id,
            "fir_number": c.fir_number,
            "station_id": c.station_id,
            "police_station": c.police_station,
            "district": c.district,
            "state": c.state,
            "registration_date": c.registration_date,
            "incident_date": c.incident_date,
            "incident_time": c.incident_time,
            "crime_type": c.crime_type,
            "crime_category": c.crime_category,
            "description": c.description,
            "status": c.status or "UNDER_INVESTIGATION",
            "location_id": str(c.location_id) if c.location_id else None
        })

    with engine.begin() as conn:
        conn.execute(
            text("""
                INSERT INTO case_records (id, fir_number, station_id, title, description, crime_type, status, priority, incident_date, created_at, updated_at)
                VALUES (:id, :fir_number, :station_id, :title, :description, :crime_type, :status, :priority, :incident_date, NOW(), NOW())
                ON CONFLICT (id) DO NOTHING
            """),
            case_records_rows
        )
        conn.execute(
            text("""
                INSERT INTO cases (id, fir_number, station_id, police_station, district, state, registration_date, incident_date, incident_time, crime_type, crime_category, description, status, location_id, created_at, updated_at)
                VALUES (:id, :fir_number, :station_id, :police_station, :district, :state, :registration_date, :incident_date, :incident_time, :crime_type, :crime_category, :description, :status, :location_id, NOW(), NOW())
                ON CONFLICT (id) DO NOTHING
            """),
            cases_rows
        )
    logger.info(f"Bulk-inserted {len(cases_rows)} cases into Supabase PostgreSQL.")

    # ---------------------------------------------------------
    # 7. Bulk Insert Junction & Evidence Tables
    # ---------------------------------------------------------
    logger.info("Step 7: Bulk inserting case relationships (persons, phones, vehicles, legal sections, evidences)...")
    
    cp_rows = []
    cph_rows = []
    cv_rows = []
    cls_rows = []
    ev_rows = []
    ie_rows = []

    case_suspects_rows = []
    case_vehicles_rows = []
    case_locations_rows = []
    case_bns_rows = []
    case_evidence_rows = []

    person_map = {p.id: p for p in persons}
    phone_map = {p.id: p for p in phones}
    location_map = {l.id: l for l in locations}
    section_map = {s.id: s for s in legal_sections}

    for c in cases:
        c_id = str(c.id)

        # 7a. Persons
        for cp in getattr(c, "person_associations", []):
            role_str = cp.role.value if hasattr(cp.role, "value") else str(cp.role)
            if role_str not in ["ACCUSED", "SUSPECT", "VICTIM", "WITNESS", "COMPLAINANT", "OTHER"]:
                role_str = "SUSPECT"
            cp_rows.append({
                "id": str(uuid.uuid4()),
                "case_id": c_id,
                "person_id": str(cp.person_id),
                "role": role_str,
                "details": getattr(cp, "statement_summary", None)
            })
            if role_str in ["ACCUSED", "SUSPECT"] and cp.person_id in person_map:
                case_suspects_rows.append({
                    "case_id": c_id,
                    "suspect": person_map[cp.person_id].name
                })

        # 7b. Phones
        for cph in getattr(c, "phone_associations", []):
            cph_rows.append({
                "id": str(uuid.uuid4()),
                "case_id": c_id,
                "phone_id": str(cph.phone_id)
            })

        # 7c. Vehicles
        for cv in getattr(c, "vehicle_associations", []):
            role_str = cv.role.value if hasattr(cv.role, "value") else str(cv.role)
            if role_str not in ["SUSPECT_VEHICLE", "STOLEN_VEHICLE", "RECOVERED_VEHICLE", "VICTIM_VEHICLE", "OTHER"]:
                role_str = "SUSPECT_VEHICLE"
            veh_str = cv.vehicle or "OD02A1234"
            cv_rows.append({
                "case_id": c_id,
                "vehicle_id": str(cv.vehicle_id) if cv.vehicle_id else None,
                "vehicle": veh_str,
                "role": role_str
            })

        # 7d. Legal Sections
        for cls in getattr(c, "legal_section_associations", []):
            cls_rows.append({
                "id": str(uuid.uuid4()),
                "case_id": c_id,
                "legal_section_id": str(cls.legal_section_id)
            })
            if cls.legal_section_id in section_map:
                case_bns_rows.append({
                    "case_id": c_id,
                    "section": section_map[cls.legal_section_id].code
                })

        # 7e. Evidences
        for ev in getattr(c, "evidences", []):
            ev_type = ev.evidence_type.value if hasattr(ev.evidence_type, "value") else str(ev.evidence_type)
            ev_date = getattr(ev, 'collected_at', None) or getattr(ev, 'collection_date', None) or datetime.date.today()
            ev_id = str(ev.id or uuid.uuid4())
            ev_rows.append({
                "id": ev_id,
                "case_id": c_id,
                "evidence_type": ev_type,
                "description": ev.description,
                "source": ev.source or "SCENE_OF_CRIME",
                "collected_at": str(ev_date),
                "status": "SECURED"
            })
            case_evidence_rows.append({
                "case_id": c_id,
                "evidence_ref": f"{ev_type}: {ev.description[:60]}"
            })

        # 7f. Investigation Events
        for ie in getattr(c, "investigation_events", []):
            ie_type = ie.event_type.value if hasattr(ie.event_type, "value") else str(ie.event_type)
            ie_rows.append({
                "id": str(ie.id or uuid.uuid4()),
                "case_id": c_id,
                "event_type": ie_type,
                "description": ie.description,
                "event_date": str(ie.event_date or datetime.date.today()),
                "officer_reference": "SI_ODISHA_POLICE"
            })

        # 7g. Case Locations
        if c.location_id and c.location_id in location_map:
            loc_obj = location_map[c.location_id]
            case_locations_rows.append({
                "case_id": c_id,
                "location": f"{loc_obj.locality or loc_obj.city}, {loc_obj.district}"
            })

    def chunked_insert(table_name: str, ddl: str, rows: list, chunk_size: int = 500):
        if not rows: return
        for i in range(0, len(rows), chunk_size):
            chunk = rows[i : i + chunk_size]
            with engine.begin() as conn:
                conn.execute(text(ddl), chunk)

    logger.info("Writing junction and entity tables to Supabase...")
    chunked_insert("case_persons", "INSERT INTO case_persons (id, case_id, person_id, role, details, created_at, updated_at) VALUES (:id, :case_id, :person_id, :role, :details, NOW(), NOW()) ON CONFLICT DO NOTHING", cp_rows)
    chunked_insert("case_phones", "INSERT INTO case_phones (id, case_id, phone_id, created_at, updated_at) VALUES (:id, :case_id, :phone_id, NOW(), NOW()) ON CONFLICT DO NOTHING", cph_rows)
    chunked_insert("case_vehicles", "INSERT INTO case_vehicles (case_id, vehicle_id, vehicle, role) VALUES (:case_id, :vehicle_id, :vehicle, :role) ON CONFLICT DO NOTHING", cv_rows)
    chunked_insert("case_legal_sections", "INSERT INTO case_legal_sections (id, case_id, legal_section_id, created_at, updated_at) VALUES (:id, :case_id, :legal_section_id, NOW(), NOW()) ON CONFLICT DO NOTHING", cls_rows)
    chunked_insert("evidences", "INSERT INTO evidences (id, case_id, evidence_type, description, source, collected_at, status, created_at, updated_at) VALUES (:id, :case_id, :evidence_type, :description, :source, :collected_at, :status, NOW(), NOW()) ON CONFLICT DO NOTHING", ev_rows)
    chunked_insert("investigation_events", "INSERT INTO investigation_events (id, case_id, event_type, description, event_date, officer_reference, created_at, updated_at) VALUES (:id, :case_id, :event_type, :description, :event_date, :officer_reference, NOW(), NOW()) ON CONFLICT DO NOTHING", ie_rows)

    chunked_insert("case_suspects", "INSERT INTO case_suspects (case_id, suspect) VALUES (:case_id, :suspect)", case_suspects_rows)
    chunked_insert("case_locations", "INSERT INTO case_locations (case_id, location) VALUES (:case_id, :location)", case_locations_rows)
    chunked_insert("case_bns_sections", "INSERT INTO case_bns_sections (case_id, section) VALUES (:case_id, :section)", case_bns_rows)
    chunked_insert("case_evidence_refs", "INSERT INTO case_evidence_refs (case_id, evidence_ref) VALUES (:case_id, :evidence_ref)", case_evidence_rows)

    logger.info("All PostgreSQL tables populated and indexed successfully.")

    # Verification from Supabase
    with engine.connect() as conn:
        db_c = conn.execute(text("SELECT count(*) FROM cases")).scalar()
        db_cr = conn.execute(text("SELECT count(*) FROM case_records")).scalar()
        db_p = conn.execute(text("SELECT count(*) FROM persons")).scalar()
        db_ph = conn.execute(text("SELECT count(*) FROM phones")).scalar()
        db_v = conn.execute(text("SELECT count(*) FROM vehicles")).scalar()
        db_e = conn.execute(text("SELECT count(*) FROM evidences")).scalar()
        db_cp = conn.execute(text("SELECT count(*) FROM case_persons")).scalar()
        db_cph = conn.execute(text("SELECT count(*) FROM case_phones")).scalar()
        db_cv = conn.execute(text("SELECT count(*) FROM case_vehicles")).scalar()

    logger.info("==================================================")
    logger.info(f"SUPABASE POSTGRESQL LIVE VERIFIED:")
    logger.info(f"  • Total Cases: {db_c} ({db_cr} case_records)")
    logger.info(f"  • Total Persons: {db_p} (Person-Case Links: {db_cp})")
    logger.info(f"  • Total Phones: {db_ph} (Phone-Case Links: {db_cph})")
    logger.info(f"  • Total Vehicles: {db_v} (Vehicle-Case Links: {db_cv})")
    logger.info(f"  • Total Evidences: {db_e}")
    logger.info("==================================================")

    # ---------------------------------------------------------
    # 8. High-Speed Vectorized UNWIND Projection into Neo4j Aura
    # ---------------------------------------------------------
    logger.info("Step 8: Projecting full investigation network into Neo4j Aura Cloud...")
    with neo4j_connection_service.get_session() as neo_session:
        logger.info("Resetting Neo4j graph space...")
        neo_session.run("MATCH (n) DETACH DELETE n")

        # 8a. Unwind Case Nodes
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
        logger.info(f"Projected {len(case_nodes_payload)} (:Case) nodes into Neo4j.")

        # 8b. Unwind Person Nodes
        person_nodes_payload = [{
            "node_id": f"person:{p.name.lower().replace(' ', '_')}",
            "name": p.name,
            "normalized_name": p.normalized_name or p.name.upper(),
            "role": p.primary_role.value if hasattr(p.primary_role, "value") else str(p.primary_role),
            "is_flagged": p.is_flagged or False,
            "phone": p.phone or "",
            "alias": p.alias or ""
        } for p in persons]
        neo_session.run("""
            UNWIND $batch AS row
            MERGE (p:Person:PERSON {node_id: row.node_id})
            SET p.name = row.name,
                p.normalized_name = row.normalized_name,
                p.role = row.role,
                p.is_flagged = row.is_flagged,
                p.phone = row.phone,
                p.alias = row.alias
        """, {"batch": person_nodes_payload})
        logger.info(f"Projected {len(person_nodes_payload)} (:Person) nodes into Neo4j.")

        # 8c. Unwind Phone Nodes
        phone_nodes_payload = [{
            "node_id": f"phone:{p.normalized_number}",
            "normalized_number": p.normalized_number,
            "raw_number": p.raw_number,
            "carrier": p.carrier,
            "is_burner": p.is_burner or False
        } for p in phones]
        neo_session.run("""
            UNWIND $batch AS row
            MERGE (p:Phone:PHONE {node_id: row.node_id})
            SET p.normalized_number = row.normalized_number,
                p.raw_number = row.raw_number,
                p.carrier = row.carrier,
                p.is_burner = row.is_burner
        """, {"batch": phone_nodes_payload})
        logger.info(f"Projected {len(phone_nodes_payload)} (:Phone) nodes into Neo4j.")

        # 8d. Unwind Vehicle Nodes
        vehicle_nodes_payload = [{
            "node_id": f"vehicle:{v.registration_number}",
            "registration_number": v.registration_number,
            "vehicle_type": v.vehicle_type.value if hasattr(v.vehicle_type, "value") else str(v.vehicle_type),
            "make": v.make,
            "model": v.model
        } for v in vehicles]
        neo_session.run("""
            UNWIND $batch AS row
            MERGE (v:Vehicle:VEHICLE {node_id: row.node_id})
            SET v.registration_number = row.registration_number,
                v.vehicle_type = row.vehicle_type,
                v.make = row.make,
                v.model = row.model
        """, {"batch": vehicle_nodes_payload})
        logger.info(f"Projected {len(vehicle_nodes_payload)} (:Vehicle) nodes into Neo4j.")

        # 8e. Unwind Location Nodes
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
        logger.info(f"Projected {len(location_nodes_payload)} (:Location) nodes into Neo4j.")

        # 8f. Unwind Legal Section Nodes
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
        logger.info(f"Projected {len(legal_sec_nodes_payload)} (:LegalSection) nodes into Neo4j.")

        # 8g. Unwind Relationships
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

                    # Link person to their primary phone
                    if p.phone:
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

        # Batch write relationships into Neo4j
        logger.info("Executing Cypher UNWIND relationship projections...")
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

        # Inter-syndicate cross-case similarity links (SIMILAR_MODUS_OPERANDI)
        logger.info("Synthesizing multi-hop cross-case syndicate relationships in Neo4j...")
        neo_session.run("""
            MATCH (c1:Case), (c2:Case)
            WHERE c1.node_id < c2.node_id AND c1.crime_type = c2.crime_type AND c1.district = c2.district
            WITH c1, c2 LIMIT 1500
            MERGE (c1)-[:SIMILAR_MODUS_OPERANDI {similarity_score: 0.88, basis: 'Same District & Crime Pattern'}]->(c2)
        """)

        # Multi-hop Person-Person syndicate links (ASSOCIATED_WITH)
        neo_session.run("""
            MATCH (p1:Person)-[:INVOLVED_IN]->(c:Case)<-[:INVOLVED_IN]-(p2:Person)
            WHERE p1.node_id < p2.node_id
            MERGE (p1)-[:ASSOCIATED_WITH {relationship: 'CO_ACCUSED_IN_CASE'}]->(p2)
        """)

        # Final Verification from Neo4j Aura
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
    logger.info("S.I.R.I.S. 1,000+ CASE SCALE INGESTION ACCOMPLISHED")
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
    fast_seed(total_cases=1200)
