"""
S.I.R.I.S. 1,000+ Case Scale Generator & Multi-Database Synchronizer
===================================================================
Seeds 1,200+ structured cases with deep cross-district criminal syndicates
into Supabase PostgreSQL and projects the complete knowledge graph into Neo4j Aura Cloud.
"""

import logging
import os
import random
import sys
import time
import uuid
from pathlib import Path
from typing import List, Dict, Any

# Add project root directory to python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.database.postgres import SessionLocal, engine
from app.config.settings import settings
from app.models import (
    Base, Case, Person, Phone, Vehicle, Location, LegalSection,
    CasePerson, CasePhone, CaseLegalSection, Evidence,
    InvestigationEvent, Chargesheet
)
from app.data.stations import POLICE_STATIONS
from app.data.generators.location_generator import generate_synthetic_locations
from app.data.generators.person_generator import generate_synthetic_persons
from app.data.generators.vehicle_generator import generate_synthetic_vehicles
from app.data.generators.phone_generator import generate_synthetic_phones
from app.data.generators.cluster_builder import build_synthetic_dataset_v2
from app.services.graph.connection import neo4j_connection_service
from app.services.graph.projection import neo4j_graph_projection_service

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("seed_1000_plus_cases")


def run_full_scale_seed(total_cases: int = 1200):
    logger.info(f"=== STARTING S.I.R.I.S. 1000+ CASE GENERATION & INGESTION (Target: {total_cases} Cases) ===")
    rng = random.Random(20260420)

    # 1. Connect to PostgreSQL
    SessionClass = sessionmaker(bind=engine)
    session = SessionClass()

    try:
        logger.info("Step 1: Clearing old development records from Supabase...")
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
                session.execute(text(f"DELETE FROM {t};"))
            except Exception as e:
                logger.debug(f"Table clear notice for {t}: {e}")
        session.commit()
        logger.info("Supabase tables cleared successfully.")

        # 2. Ensure Police Stations are registered
        logger.info("Step 2: Ensuring all Police Stations are registered in police_stations table...")
        for st in POLICE_STATIONS:
            session.execute(
                text("""
                    INSERT INTO police_stations (id, name, district, city, state, status, created_at, updated_at)
                    VALUES (:id, :name, :district, :city, :state, 'ACTIVE', NOW(), NOW())
                    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, district = EXCLUDED.district
                """),
                {
                    "id": st["station_id"],
                    "name": st["police_station"],
                    "district": st.get("district", "Khordha (Bhubaneswar)"),
                    "city": st.get("city", "Bhubaneswar"),
                    "state": st.get("state", "Odisha")
                }
            )
        session.commit()

        # 3. Base Legal Sections
        logger.info("Step 3: Populating BNS & IPC Legal Sections...")
        existing_sections = {s.code: s for s in session.query(LegalSection).all()}
        sections_data = [
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
        legal_sections = list(existing_sections.values())
        for code, title, desc, law in sections_data:
            if code not in existing_sections:
                sec = LegalSection(code=code, title=title, description=desc, law_name=law)
                session.add(sec)
                legal_sections.append(sec)
                existing_sections[code] = sec
        session.flush()

        # 4. Generate Entities
        logger.info("Step 4: Generating realistic entities (Persons, Vehicles, Phones, Locations)...")
        locations = generate_synthetic_locations(rng, count=350)
        persons, name_variations = generate_synthetic_persons(rng, count=950)
        vehicles = generate_synthetic_vehicles(rng, count=650)
        phones = generate_synthetic_phones(rng, count=850)

        session.add_all(locations)
        session.add_all(persons)
        session.add_all(vehicles)
        session.add_all(phones)
        session.flush()

        # 5. Generate 1,200+ Cases with Interconnected Multi-Station Syndicates
        logger.info(f"Step 5: Building interconnected crime network with {total_cases} cases...")
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

        # Ensure every Case has an explicit UUID before staging
        logger.info("Ensuring explicit UUIDs for all cases...")
        for c in cases:
            if not c.id:
                c.id = uuid.uuid4()

        # Pre-insert into case_records table in chunks of 100
        logger.info(f"Step 5b: Synchronizing {len(cases)} case records into case_records table...")
        chunk_size = 100
        for i in range(0, len(cases), chunk_size):
            chunk = cases[i : i + chunk_size]
            for c in chunk:
                session.execute(
                    text("""
                        INSERT INTO case_records (id, fir_number, station_id, title, description, crime_type, status, priority, incident_date)
                        VALUES (:id, :fir_number, :station_id, :title, :description, :crime_type, :status, :priority, :incident_date)
                        ON CONFLICT (id) DO UPDATE SET fir_number = EXCLUDED.fir_number
                    """),
                    {
                        "id": str(c.id),
                        "fir_number": c.fir_number,
                        "station_id": c.station_id,
                        "title": f"{c.crime_type} - {c.police_station}",
                        "description": c.description,
                        "crime_type": c.crime_type,
                        "status": c.status or "UNDER_INVESTIGATION",
                        "priority": "HIGH" if "BURGLARY" in (c.crime_type or "") or "MURDER" in (c.crime_type or "") or "ORGANIZED" in (c.crime_type or "") else "MEDIUM",
                        "incident_date": c.incident_date,
                    }
                )
            session.flush()

        logger.info(f"Step 5c: Staging and committing all {len(cases)} cases into Supabase...")
        for i in range(0, len(cases), chunk_size):
            chunk = cases[i : i + chunk_size]
            session.add_all(chunk)
            session.commit()
            logger.info(f"Committed {min(i + chunk_size, len(cases))}/{len(cases)} cases to Supabase PostgreSQL...")

        # Verify DB Counts
        c_count = session.query(text("COUNT(*) FROM cases")).scalar()
        cr_count = session.query(text("COUNT(*) FROM case_records")).scalar()
        p_count = session.query(text("COUNT(*) FROM persons")).scalar()
        v_count = session.query(text("COUNT(*) FROM vehicles")).scalar()
        ph_count = session.query(text("COUNT(*) FROM phones")).scalar()
        l_count = session.query(text("COUNT(*) FROM locations")).scalar()
        e_count = session.query(text("COUNT(*) FROM evidences")).scalar()

        logger.info("==================================================")
        logger.info(f"SUPABASE SEEDED: {c_count} Cases (cases), {cr_count} Case Records (case_records)")
        logger.info(f"  -> {p_count} Persons, {v_count} Vehicles, {ph_count} Phones, {l_count} Locations, {e_count} Evidences")
        logger.info("==================================================")

        # 6. Project into Neo4j Aura Cloud
        logger.info("Step 6: Projecting all cases into Neo4j Aura Cloud...")
        with neo4j_connection_service.get_session() as neo_session:
            logger.info("Clearing previous test nodes in Neo4j Aura...")
            neo_session.run("MATCH (n) DETACH DELETE n")

        # Project in batches for performance
        batch_size = 50
        all_cases = session.query(Case).all()
        total = len(all_cases)
        logger.info(f"Projecting {total} cases into Neo4j Aura in batches of {batch_size}...")

        projected = 0
        for i in range(0, total, batch_size):
            batch = all_cases[i : i + batch_size]
            for case_obj in batch:
                try:
                    neo4j_graph_projection_service.project_case_graph(case_obj)
                    projected += 1
                except Exception as proj_err:
                    logger.warning(f"Projection notice for {case_obj.fir_number}: {proj_err}")
            logger.info(f"Projected {min(i + batch_size, total)}/{total} cases into Neo4j Aura...")

        # Final Verification from Neo4j Aura
        with neo4j_connection_service.get_session() as s:
            n_nodes = s.run("MATCH (n) RETURN count(n) as c").single()["c"]
            n_rels = s.run("MATCH ()-[r]->() RETURN count(r) as c").single()["c"]
            n_cases = s.run("MATCH (c:Case) RETURN count(c) as c").single()["c"]
            n_persons = s.run("MATCH (p:Person) RETURN count(p) as c").single()["c"]
            n_phones = s.run("MATCH (p:Phone) RETURN count(p) as c").single()["c"]
            n_vehicles = s.run("MATCH (v:Vehicle) RETURN count(v) as c").single()["c"]

        logger.info("==================================================")
        logger.info(f"NEO4J AURA GRAPH LIVE: {n_nodes} Total Nodes, {n_rels} Relationships")
        logger.info(f"  -> {n_cases} Cases, {n_persons} Persons, {n_phones} Phones, {n_vehicles} Vehicles")
        logger.info("==================================================")
        logger.info("1,000+ CASE SCALE INGESTION COMPLETED SUCCESSFULLY!")

    except Exception as exc:
        session.rollback()
        logger.error(f"Seeding failed: {exc}", exc_info=True)
        raise
    finally:
        session.close()


if __name__ == "__main__":
    run_full_scale_seed(total_cases=1200)
