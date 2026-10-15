"""
Project All PostgreSQL Entities and Relationships directly into Cloud Neo4j Aura.
Fast, vectorized UNWIND execution without clearing or modifying PostgreSQL data.
"""

import os
import sys
import time
import logging
from pathlib import Path
from sqlalchemy import create_engine, text

# Add central-intelligence to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from app.services.graph.connection import neo4j_connection_service

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("pg_to_neo4j_projection")

def project_data():
    t0 = time.time()
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        raise RuntimeError("DATABASE_URL is not set!")

    logger.info("Connecting to Supabase PostgreSQL...")
    engine = create_engine(db_url, pool_pre_ping=True)

    with engine.connect() as conn:
        logger.info("Reading cases from PostgreSQL...")
        cases = conn.execute(text("""
            SELECT id, fir_number, station_id, police_station, district, crime_type, crime_category, incident_date, status
            FROM cases
        """)).fetchall()

        logger.info("Reading persons from PostgreSQL...")
        persons = conn.execute(text("""
            SELECT id, name, gender, address, identifier_hash
            FROM persons
        """)).fetchall()

        logger.info("Reading phones from PostgreSQL...")
        phones = conn.execute(text("""
            SELECT id, normalized_number, number_hash
            FROM phones
        """)).fetchall()

        logger.info("Reading vehicles from PostgreSQL...")
        vehicles = conn.execute(text("""
            SELECT id, registration_number, vehicle_type, make, model
            FROM vehicles
        """)).fetchall()

        logger.info("Reading case_persons from PostgreSQL...")
        case_persons = conn.execute(text("""
            SELECT cp.case_id, c.fir_number, cp.person_id, p.name, cp.role, cp.details
            FROM case_persons cp
            JOIN cases c ON cp.case_id::text = c.id::text
            JOIN persons p ON cp.person_id::text = p.id::text
        """)).fetchall()

        logger.info("Reading case_phones from PostgreSQL...")
        case_phones = conn.execute(text("""
            SELECT cph.case_id, c.fir_number, ph.normalized_number
            FROM case_phones cph
            JOIN cases c ON cph.case_id::text = c.id::text
            JOIN phones ph ON cph.phone_id::text = ph.id::text
        """)).fetchall()

        logger.info("Reading case_vehicles from PostgreSQL...")
        case_vehicles = conn.execute(text("""
            SELECT cv.case_id, c.fir_number, v.registration_number, cv.role
            FROM case_vehicles cv
            JOIN cases c ON cv.case_id::text = c.id::text
            JOIN vehicles v ON cv.vehicle_id::text = v.id::text
        """)).fetchall()

        logger.info("Reading locations from PostgreSQL...")
        locations = conn.execute(text("""
            SELECT DISTINCT locality, city, district, state
            FROM locations
            WHERE city IS NOT NULL AND district IS NOT NULL
        """)).fetchall()

    logger.info(f"Loaded from Supabase: {len(cases)} cases, {len(persons)} persons, {len(phones)} phones, {len(vehicles)} vehicles")
    logger.info(f"Loaded relationships: {len(case_persons)} person links, {len(case_phones)} phone links, {len(case_vehicles)} vehicle links")

    with neo4j_connection_service.get_session() as session:
        logger.info("Creating graph indexes and constraints in Neo4j Aura...")
        session.run("CREATE CONSTRAINT case_node_id IF NOT EXISTS FOR (c:Case) REQUIRE c.node_id IS UNIQUE")
        session.run("CREATE CONSTRAINT person_node_id IF NOT EXISTS FOR (p:Person) REQUIRE p.node_id IS UNIQUE")
        session.run("CREATE CONSTRAINT phone_node_id IF NOT EXISTS FOR (p:Phone) REQUIRE p.node_id IS UNIQUE")
        session.run("CREATE CONSTRAINT vehicle_node_id IF NOT EXISTS FOR (v:Vehicle) REQUIRE v.node_id IS UNIQUE")
        session.run("CREATE CONSTRAINT location_node_id IF NOT EXISTS FOR (l:Location) REQUIRE l.node_id IS UNIQUE")

        # 1. Project Case Nodes
        logger.info("Projecting Case nodes...")
        case_payload = [{
            "node_id": f"case:{c.fir_number}",
            "fir_number": c.fir_number,
            "station_id": c.station_id,
            "police_station": c.police_station,
            "district": c.district,
            "crime_type": c.crime_type,
            "crime_category": c.crime_category,
            "incident_date": str(c.incident_date) if c.incident_date else "",
            "status": c.status
        } for c in cases]

        session.run("""
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
        """, {"batch": case_payload})
        logger.info(f"✓ Projected {len(case_payload)} Case nodes.")

        # 2. Project Person Nodes
        logger.info("Projecting Person nodes...")
        person_payload = [{
            "node_id": f"person:{p.name.lower().replace(' ', '_')}",
            "name": p.name,
            "normalized_name": p.name.upper(),
            "gender": p.gender or "",
            "address": p.address or ""
        } for p in persons]

        session.run("""
            UNWIND $batch AS row
            MERGE (p:Person:PERSON {node_id: row.node_id})
            SET p.name = row.name,
                p.normalized_name = row.normalized_name,
                p.gender = row.gender,
                p.address = row.address
        """, {"batch": person_payload})
        logger.info(f"✓ Projected {len(person_payload)} Person nodes.")

        # 3. Project Phone Nodes
        logger.info("Projecting Phone nodes...")
        phone_payload = [{
            "node_id": f"phone:{p.normalized_number}",
            "normalized_number": p.normalized_number,
            "raw_number": p.normalized_number
        } for p in phones]

        session.run("""
            UNWIND $batch AS row
            MERGE (p:Phone:PHONE {node_id: row.node_id})
            SET p.normalized_number = row.normalized_number,
                p.raw_number = row.raw_number
        """, {"batch": phone_payload})
        logger.info(f"✓ Projected {len(phone_payload)} Phone nodes.")

        # 4. Project Vehicle Nodes
        logger.info("Projecting Vehicle nodes...")
        vehicle_payload = [{
            "node_id": f"vehicle:{v.registration_number}",
            "registration_number": v.registration_number,
            "vehicle_type": v.vehicle_type or "VEHICLE",
            "make": v.make or "",
            "model": v.model or ""
        } for v in vehicles]

        session.run("""
            UNWIND $batch AS row
            MERGE (v:Vehicle:VEHICLE {node_id: row.node_id})
            SET v.registration_number = row.registration_number,
                v.vehicle_type = row.vehicle_type,
                v.make = row.make,
                v.model = row.model
        """, {"batch": vehicle_payload})
        logger.info(f"✓ Projected {len(vehicle_payload)} Vehicle nodes.")

        # 5. Project Location Nodes
        logger.info("Projecting Location nodes...")
        loc_payload = [{
            "node_id": f"location:{l.city.lower()}_{l.district.lower().replace(' ', '_')}",
            "locality": l.locality or "",
            "city": l.city,
            "district": l.district,
            "state": l.state or "Odisha"
        } for l in locations]

        session.run("""
            UNWIND $batch AS row
            MERGE (l:Location:LOCATION {node_id: row.node_id})
            SET l.locality = row.locality,
                l.city = row.city,
                l.district = row.district,
                l.state = row.state
        """, {"batch": loc_payload})
        logger.info(f"✓ Projected {len(loc_payload)} Location nodes.")

        # 6. Relationships: Person -> Case
        logger.info("Projecting Person -> Case relationships...")
        cp_payload = [{
            "person_node_id": f"person:{row.name.lower().replace(' ', '_')}",
            "case_node_id": f"case:{row.fir_number}",
            "role": row.role or "Suspect"
        } for row in case_persons]

        session.run("""
            UNWIND $batch AS row
            MATCH (p:Person {node_id: row.person_node_id})
            MATCH (c:Case {node_id: row.case_node_id})
            MERGE (p)-[r:INVOLVED_IN]->(c)
            SET r.role = row.role
        """, {"batch": cp_payload})
        logger.info(f"✓ Projected {len(cp_payload)} Person -> Case relationships.")

        # 7. Relationships: Phone -> Case
        logger.info("Projecting Phone -> Case relationships...")
        cph_payload = [{
            "phone_node_id": f"phone:{row.normalized_number}",
            "case_node_id": f"case:{row.fir_number}"
        } for row in case_phones]

        session.run("""
            UNWIND $batch AS row
            MATCH (p:Phone {node_id: row.phone_node_id})
            MATCH (c:Case {node_id: row.case_node_id})
            MERGE (p)-[:USED_PHONE]->(c)
            MERGE (p)-[:ASSOCIATED_WITH_CASE]->(c)
        """, {"batch": cph_payload})
        logger.info(f"✓ Projected {len(cph_payload)} Phone -> Case relationships.")

        # 8. Relationships: Vehicle -> Case
        logger.info("Projecting Vehicle -> Case relationships...")
        cv_payload = [{
            "veh_node_id": f"vehicle:{row.registration_number}",
            "case_node_id": f"case:{row.fir_number}",
            "role": row.role or "Suspect Vehicle"
        } for row in case_vehicles]

        session.run("""
            UNWIND $batch AS row
            MATCH (v:Vehicle {node_id: row.veh_node_id})
            MATCH (c:Case {node_id: row.case_node_id})
            MERGE (v)-[r:OPERATES_VEHICLE]->(c)
            MERGE (v)-[r2:INVOLVED_IN_CASE]->(c)
            SET r.role = row.role
        """, {"batch": cv_payload})
        logger.info(f"✓ Projected {len(cv_payload)} Vehicle -> Case relationships.")

        # 9. Cross-case Modus Operandi links (SIMILAR_MODUS_OPERANDI)
        logger.info("Computing cross-case syndicate relationships in Neo4j...")
        session.run("""
            MATCH (c1:Case), (c2:Case)
            WHERE c1.node_id < c2.node_id AND c1.crime_type = c2.crime_type AND c1.district = c2.district
            WITH c1, c2 LIMIT 2500
            MERGE (c1)-[:SIMILAR_MODUS_OPERANDI {similarity_score: 0.88, basis: 'Same District & Crime Pattern'}]->(c2)
        """)

        # 10. Person-Person Co-Accused links (ASSOCIATED_WITH)
        logger.info("Computing Person-to-Person syndicate co-accused links...")
        session.run("""
            MATCH (p1:Person)-[:INVOLVED_IN]->(c:Case)<-[:INVOLVED_IN]-(p2:Person)
            WHERE p1.node_id < p2.node_id
            MERGE (p1)-[:ASSOCIATED_WITH {relationship: 'CO_ACCUSED_IN_CASE'}]->(p2)
        """)

        # Verification
        n_nodes = session.run("MATCH (n) RETURN count(n) as c").single()["c"]
        n_rels = session.run("MATCH ()-[r]->() RETURN count(r) as c").single()["c"]
        n_cases = session.run("MATCH (c:Case) RETURN count(c) as c").single()["c"]
        n_persons = session.run("MATCH (p:Person) RETURN count(p) as c").single()["c"]
        n_phones = session.run("MATCH (p:Phone) RETURN count(p) as c").single()["c"]
        n_vehicles = session.run("MATCH (v:Vehicle) RETURN count(v) as c").single()["c"]

    elapsed = round(time.time() - t0, 2)
    logger.info("==================================================")
    logger.info("PROJECTED SUPABASE DATA INTO NEO4J AURA SUCCESSFULLY!")
    logger.info(f"Time Taken: {elapsed} seconds")
    logger.info(f"Neo4j Aura Cloud Total Nodes: {n_nodes}")
    logger.info(f"Neo4j Aura Cloud Total Rels : {n_rels}")
    logger.info(f"  • Cases in Graph   : {n_cases}")
    logger.info(f"  • Persons in Graph : {n_persons}")
    logger.info(f"  • Phones in Graph  : {n_phones}")
    logger.info(f"  • Vehicles in Graph: {n_vehicles}")
    logger.info("==================================================")

if __name__ == "__main__":
    project_data()
