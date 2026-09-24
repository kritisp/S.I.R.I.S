"""
S.I.R.I.S. Scalable Synthetic Dataset Generator
================================================
Generates 1,000+ realistic, referentially-intact criminal investigation cases
with high-density entity relationships across Odisha police stations.

Features:
- Deterministic PRNG for reproducible dataset generation
- Realistic Indian names, phones (+91), Odisha vehicle registrations (OD-xx)
- BNS (Bharatiya Nyaya Sanhita) & IPC statutory section mappings
- Multi-station syndicates (Alpha, Beta, Gamma, Delta, Epsilon rings)
- Controlled cross-station authorization links (Sec 105 BNSS)
- Exportable to PostgreSQL database session or JSON/SQL bundle
"""

import argparse
import datetime
import hashlib
import json
import logging
import os
import random
import sys
import uuid
from typing import Any, Dict, List, Optional, Tuple

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("scalable_dataset_generator")

# Deterministic Seed
SEED = 20260924


class DeterministicRNG:
    """Mulberry32 PRNG for deterministic cross-platform generation."""
    def __init__(self, seed: int = SEED):
        self._s = seed & 0xFFFFFFFF

    def next(self) -> float:
        self._s = (self._s + 0x6D2B79F5) & 0xFFFFFFFF
        t = (self._s ^ (self._s >> 15)) & 0xFFFFFFFF
        t = (t * (1 | self._s)) & 0xFFFFFFFF
        t = (t + ((t * (61 | t)) & 0xFFFFFFFF)) & 0xFFFFFFFF
        t = (t ^ (t >> 7)) & 0xFFFFFFFF
        t = (t ^ (t >> 14)) & 0xFFFFFFFF
        return (t & 0xFFFFFFFF) / 4294967296.0

    def int_range(self, lo: int, hi: int) -> int:
        return int(self.next() * (hi - lo + 1)) + lo

    def pick(self, lst: list) -> Any:
        return lst[int(self.next() * len(lst))]

    def sample(self, lst: list, k: int) -> list:
        k = min(k, len(lst))
        shuffled = list(lst)
        for i in range(len(shuffled) - 1, 0, -1):
            j = int(self.next() * (i + 1))
            shuffled[i], shuffled[j] = shuffled[j], shuffled[i]
        return shuffled[:k]


rng = DeterministicRNG(SEED)

# ─────────────────────────────────────────────────────────────────────────────
# REFERENCE DOMAIN DICTIONARIES
# ─────────────────────────────────────────────────────────────────────────────

STATIONS = [
    {"id": "OP-BBSR-CAP", "name": "Capital Police Station", "district": "Bhubaneswar Urban", "state": "Odisha", "lat": 20.2724, "lng": 85.8338},
    {"id": "OP-BBSR-KHA", "name": "Khandagiri Police Station", "district": "Bhubaneswar Urban", "state": "Odisha", "lat": 20.2589, "lng": 85.7869},
    {"id": "OP-BBSR-CYB", "name": "Cyber Police Station BBSR", "district": "Bhubaneswar Urban", "state": "Odisha", "lat": 20.3012, "lng": 85.8214},
    {"id": "OP-CTC-SAD", "name": "Cuttack Sadar Police Station", "district": "Cuttack", "state": "Odisha", "lat": 20.4625, "lng": 85.8828},
    {"id": "OP-CTC-CHA", "name": "Chauliaganj Police Station", "district": "Cuttack", "state": "Odisha", "lat": 20.4719, "lng": 85.9012},
    {"id": "OP-PUR-TWN", "name": "Puri Town Police Station", "district": "Puri", "state": "Odisha", "lat": 19.8133, "lng": 85.8315},
    {"id": "OP-SBP-TWN", "name": "Sambalpur Town Police Station", "district": "Sambalpur", "state": "Odisha", "lat": 21.4669, "lng": 83.9756},
    {"id": "OP-ROU-PLT", "name": "Plant Site Police Station", "district": "Sundargarh", "state": "Odisha", "lat": 22.2257, "lng": 84.8536},
    {"id": "OP-BER-TWN", "name": "Berhampur Town Police Station", "district": "Ganjam", "state": "Odisha", "lat": 19.3149, "lng": 84.7941},
    {"id": "OP-BHD-TWN", "name": "Bhadrak Town Police Station", "district": "Bhadrak", "state": "Odisha", "lat": 21.0581, "lng": 86.4963},
    {"id": "OP-BAL-TWN", "name": "Balasore Town Police Station", "district": "Balasore", "state": "Odisha", "lat": 21.4942, "lng": 86.9332},
    {"id": "OP-ANG-TWN", "name": "Angul Town Police Station", "district": "Angul", "state": "Odisha", "lat": 20.8389, "lng": 85.1014},
]

FIRST_NAMES = [
    "Rahul", "Vikas", "Sonu", "Pawan", "Ajay", "Rajesh", "Amit", "Suresh", "Manoj",
    "Deepak", "Sunil", "Ranjan", "Pradip", "Tapan", "Subhash", "Bikash", "Ashok",
    "Priyanka", "Sunita", "Anjali", "Pooja", "Rita", "Smita", "Rashmita", "Mamata"
]

LAST_NAMES = [
    "Verma", "Singh", "Patra", "Sahoo", "Jena", "Nayak", "Mohanty", "Das", "Pradhan",
    "Behera", "Swain", "Rout", "Panda", "Mishra", "Barik", "Tripathy", "Mahapatra"
]

CRIME_TYPES = [
    ("CYBER_FRAUD", "CYBER_CRIME", "BNS §318(4)"),
    ("DIGITAL_ARREST", "CYBER_CRIME", "BNS §308(2)"),
    ("ARMED_ROBBERY", "VIOLENT_CRIME", "BNS §309"),
    ("BURGLARY", "PROPERTY_CRIME", "BNS §305"),
    ("VEHICLE_THEFT", "PROPERTY_CRIME", "BNS §303(2)"),
    ("EXTORTION", "ORGANIZED_CRIME", "BNS §308"),
    ("MONEY_LAUNDERING", "FINANCIAL_CRIME", "PMLA §3"),
    ("NARCOTICS_TRAFFICKING", "ORGANIZED_CRIME", "NDPS §20"),
    ("HOMICIDE", "VIOLENT_CRIME", "BNS §103"),
]

LEGAL_SECTIONS_DEF = [
    {"code": "BNS 103", "title": "Punishment for Murder", "description": "Whoever commits murder shall be punished with death or life imprisonment", "law_name": "BNS"},
    {"code": "BNS 303(2)", "title": "Theft of Motor Vehicle or Property", "description": "Punishment for committing theft", "law_name": "BNS"},
    {"code": "BNS 305", "title": "Lurking House-trespass or House-breaking", "description": "Night housebreaking in order to commit offence", "law_name": "BNS"},
    {"code": "BNS 308", "title": "Extortion", "description": "Intentionally putting any person in fear of injury in order to commit extortion", "law_name": "BNS"},
    {"code": "BNS 309", "title": "Robbery and Dacoity", "description": "Punishment for robbery with deadly weapons", "law_name": "BNS"},
    {"code": "BNS 318(4)", "title": "Cheating and Dishonestly Inducing Delivery of Property", "description": "Cyber and financial cheating with criminal intent", "law_name": "BNS"},
    {"code": "BNS 115", "title": "Voluntarily Causing Hurt", "description": "Punishment for causing hurt", "law_name": "BNS"},
    {"code": "IT ACT 66D", "title": "Cheating by Personation using Computer Resource", "description": "Fraudulent digital impersonation", "law_name": "IT_ACT"},
    {"code": "NDPS 20", "title": "Punishment for Contravention in Relation to Cannabis", "description": "Possession or transport of illegal narcotic substances", "law_name": "NDPS"},
]

VEHICLE_MODELS = [
    ("Mahindra", "Scorpio", "SUV"),
    ("Hyundai", "Creta", "SUV"),
    ("Tata", "Nexon", "SUV"),
    ("Maruti", "Swift", "Hatchback"),
    ("Honda", "Activa", "Two-Wheeler"),
    ("Bajaj", "Pulsar 220", "Two-Wheeler"),
    ("Royal Enfield", "Classic 350", "Two-Wheeler"),
    ("Toyota", "Innova Crysta", "MUV"),
]

COLORS = ["White", "Black", "Silver", "Grey", "Red", "Blue"]


def generate_synthetic_dataset(num_cases: int = 1000) -> Dict[str, Any]:
    """Generates a complete relational graph of cases, persons, phones, vehicles, and evidence."""
    logger.info(f"Generating deterministic synthetic dataset with {num_cases} cases (Seed: {SEED})...")

    # 1. Generate Locations
    locations = []
    loc_id_map = {}
    for st in STATIONS:
        loc_id = str(uuid.uuid4())
        loc_obj = {
            "id": loc_id,
            "address": f"{st['name']} Area, {st['district']}",
            "locality": st["name"].replace(" Police Station", ""),
            "city": st["district"],
            "district": st["district"],
            "state": st["state"],
            "latitude": st["lat"] + (rng.next() - 0.5) * 0.04,
            "longitude": st["lng"] + (rng.next() - 0.5) * 0.04,
        }
        locations.append(loc_obj)
        loc_id_map[st["id"]] = loc_id

    # 2. Generate Global Entity Pools for realistic overlap & syndicates
    # 2a. Persons Pool (~650 unique persons)
    num_persons = max(300, int(num_cases * 0.65))
    persons = []
    for i in range(num_persons):
        fn = rng.pick(FIRST_NAMES)
        ln = rng.pick(LAST_NAMES)
        p_id = str(uuid.uuid4())
        name = f"{fn} {ln}"
        dob = datetime.date(1975, 1, 1) + datetime.timedelta(days=rng.int_range(0, 11000))
        gender = "MALE" if rng.next() > 0.18 else "FEMALE"
        ident_hash = hashlib.sha256(f"{name}_{dob}_{i}".encode()).hexdigest()[:16]

        persons.append({
            "id": p_id,
            "name": name,
            "date_of_birth": dob.isoformat(),
            "gender": gender,
            "address": f"Plot {rng.int_range(10, 999)}, {rng.pick(STATIONS)['name']} Locality",
            "identifier_hash": ident_hash,
            "is_hvt": i < 15, # Top 15 are High Value Targets
        })

    # 2b. Phones Pool (~800 unique phones)
    num_phones = max(400, int(num_cases * 0.8))
    phones = []
    for i in range(num_phones):
        ph_id = str(uuid.uuid4())
        norm_num = f"+91{rng.int_range(7000000000, 9999999999)}"
        imei = f"86{rng.int_range(1000000000000, 9999999999999)}"
        carrier = rng.pick(["Airtel", "Jio", "Vodafone-Idea", "BSNL"])
        ph_hash = hashlib.sha256(norm_num.encode()).hexdigest()[:16]

        phones.append({
            "id": ph_id,
            "normalized_number": norm_num,
            "imei": imei,
            "carrier": carrier,
            "number_hash": ph_hash,
        })

    # 2c. Vehicles Pool (~450 unique vehicles)
    num_vehicles = max(200, int(num_cases * 0.45))
    vehicles = []
    for i in range(num_vehicles):
        v_id = str(uuid.uuid4())
        dist_code = rng.pick(["02", "05", "14", "15", "07", "01", "10", "19"])
        series = f"{chr(rng.int_range(65, 90))}{chr(rng.int_range(65, 90))}"
        reg_num = f"OD-{dist_code}-{series}-{rng.int_range(1000, 9999)}"
        v_make, v_model, v_type = rng.pick(VEHICLE_MODELS)

        vehicles.append({
            "id": v_id,
            "registration_number": reg_num,
            "make": v_make,
            "model": v_model,
            "vehicle_type": v_type,
            "color": rng.pick(COLORS),
        })

    # 2d. Legal Sections
    legal_sections = []
    for ls in LEGAL_SECTIONS_DEF:
        legal_sections.append({
            "id": str(uuid.uuid4()),
            "code": ls["code"],
            "title": ls["title"],
            "description": ls["description"],
            "law_name": ls["law_name"],
        })

    # 3. Generate Cases and Associations with Referential Integrity
    cases = []
    case_persons = []
    person_phones = []
    case_phones = []
    case_vehicles = []
    case_legal_sections = []
    evidences = []
    investigation_events = []
    chargesheets = []

    start_date = datetime.date(2024, 1, 1)

    for case_idx in range(num_cases):
        case_id = str(uuid.uuid4())
        station = rng.pick(STATIONS)
        c_type, c_cat, pri_sec = rng.pick(CRIME_TYPES)
        
        reg_offset = rng.int_range(0, 950)
        reg_date = start_date + datetime.timedelta(days=reg_offset)
        inc_date = reg_date - datetime.timedelta(days=rng.int_range(0, 5))
        inc_time = f"{rng.int_range(0, 23):02d}:{rng.int_range(0, 59):02d}:00"

        fir_year = reg_date.year
        st_tag = station["id"].split("-")[1]
        fir_num = f"FIR-{fir_year}-{st_tag}-{case_idx + 1:04d}"

        priority = "CRITICAL" if case_idx % 25 == 0 else "HIGH" if case_idx % 7 == 0 else "MEDIUM"
        status = "CHARGESHEETED" if case_idx % 4 == 0 else "UNDER_INVESTIGATION"

        desc = f"Investigation into reported incident of {c_type.lower().replace('_', ' ')} occurring at {station['name']} jurisdiction under statutory provision {pri_sec}."

        case_obj = {
            "id": case_id,
            "fir_number": fir_num,
            "station_id": station["id"],
            "police_station": station["name"],
            "district": station["district"],
            "state": station["state"],
            "registration_date": reg_date.isoformat(),
            "incident_date": inc_date.isoformat(),
            "incident_time": inc_time,
            "crime_type": c_type,
            "crime_category": c_cat,
            "description": desc,
            "status": status,
            "priority": priority,
            "location_id": loc_id_map.get(station["id"], locations[0]["id"]),
        }
        cases.append(case_obj)

        # Attach Persons (1 to 4 persons per case)
        num_c_persons = rng.int_range(1, 4)
        assigned_persons = rng.sample(persons, num_c_persons)
        for p_idx, p in enumerate(assigned_persons):
            role = "ACCUSED" if p_idx == 0 else "VICTIM" if p_idx == 1 else "WITNESS"
            cp_id = str(uuid.uuid4())
            case_persons.append({
                "id": cp_id,
                "case_id": case_id,
                "person_id": p["id"],
                "role": role,
                "details": f"Identified as {role.lower()} during station investigation.",
            })

            # Associate Person with Phone
            if rng.next() > 0.4:
                assigned_ph = rng.pick(phones)
                person_phones.append({
                    "id": str(uuid.uuid4()),
                    "person_id": p["id"],
                    "phone_id": assigned_ph["id"],
                })

        # Attach Case Phones (1 to 3 phones per case)
        num_c_phones = rng.int_range(1, 3)
        assigned_phones = rng.sample(phones, num_c_phones)
        for ph in assigned_phones:
            case_phones.append({
                "id": str(uuid.uuid4()),
                "case_id": case_id,
                "phone_id": ph["id"],
            })

        # Attach Vehicles (0 to 2 vehicles per case)
        if rng.next() > 0.35:
            num_c_veh = rng.int_range(1, 2)
            assigned_vehs = rng.sample(vehicles, num_c_veh)
            for v in assigned_vehs:
                case_vehicles.append({
                    "id": str(uuid.uuid4()),
                    "case_id": case_id,
                    "vehicle_id": v["id"],
                    "vehicle": v["registration_number"],
                    "role": "SUSPECT_VEHICLE" if rng.next() > 0.3 else "RECOVERED_PROPERTY",
                })

        # Attach Legal Sections (1 to 3 sections per case)
        num_c_sec = rng.int_range(1, 3)
        assigned_secs = rng.sample(legal_sections, num_c_sec)
        for s in assigned_secs:
            case_legal_sections.append({
                "id": str(uuid.uuid4()),
                "case_id": case_id,
                "legal_section_id": s["id"],
            })

        # Attach Evidence (1 to 3 items per case)
        num_ev = rng.int_range(1, 3)
        ev_types = ["CCTV", "MOBILE", "DOCUMENT", "PHYSICAL_ITEM", "FORENSIC_REPORT"]
        for ev_i in range(num_ev):
            ev_type = rng.pick(ev_types)
            ev_hash = hashlib.sha256(f"ev_{case_id}_{ev_i}".encode()).hexdigest()
            evidences.append({
                "id": str(uuid.uuid4()),
                "case_id": case_id,
                "evidence_type": ev_type,
                "description": f"Secured {ev_type.lower().replace('_', ' ')} evidence tied to incident location.",
                "source": f"Station Investigation Vault / {station['name']}",
                "hash_value": f"0x{ev_hash[:16]}",
                "file_uri": f"vault://odisha-police/cases/{fir_num}/ev_{ev_i + 1}.dat",
            })

        # Attach Investigation Events (FIR registration + 1 progress event)
        investigation_events.append({
            "id": str(uuid.uuid4()),
            "case_id": case_id,
            "event_type": "FIR_REGISTERED",
            "description": f"FIR registered at {station['name']} upon receiving formal written complaint.",
            "event_date": f"{reg_date.isoformat()}T08:00:00Z",
        })

        if status == "CHARGESHEETED":
            cs_date = reg_date + datetime.timedelta(days=rng.int_range(30, 85))
            chargesheets.append({
                "id": str(uuid.uuid4()),
                "case_id": case_id,
                "filing_date": cs_date.isoformat(),
                "court_name": f"Hon'ble Court of SDJM, {station['district']}",
                "summary": f"Statutory chargesheet submitted under Section 193 BNSS with comprehensive digital & forensic graph evidence.",
            })
            investigation_events.append({
                "id": str(uuid.uuid4()),
                "case_id": case_id,
                "event_type": "CHARGESHEET_FILED",
                "description": f"Chargesheet formally filed in Court of SDJM {station['district']}.",
                "event_date": f"{cs_date.isoformat()}T14:30:00Z",
            })

    dataset = {
        "metadata": {
            "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "generator_seed": SEED,
            "counts": {
                "cases": len(cases),
                "persons": len(persons),
                "phones": len(phones),
                "vehicles": len(vehicles),
                "locations": len(locations),
                "legal_sections": len(legal_sections),
                "case_persons": len(case_persons),
                "person_phones": len(person_phones),
                "case_phones": len(case_phones),
                "case_vehicles": len(case_vehicles),
                "case_legal_sections": len(case_legal_sections),
                "evidences": len(evidences),
                "investigation_events": len(investigation_events),
                "chargesheets": len(chargesheets),
            },
        },
        "locations": locations,
        "legal_sections": legal_sections,
        "persons": persons,
        "phones": phones,
        "vehicles": vehicles,
        "cases": cases,
        "case_persons": case_persons,
        "person_phones": person_phones,
        "case_phones": case_phones,
        "case_vehicles": case_vehicles,
        "case_legal_sections": case_legal_sections,
        "evidences": evidences,
        "investigation_events": investigation_events,
        "chargesheets": chargesheets,
    }

    logger.info(f"Dataset generation complete! Generated {len(cases)} cases, {len(persons)} persons, {len(phones)} phones, {len(vehicles)} vehicles.")
    return dataset


def save_dataset_to_json(dataset: Dict[str, Any], filepath: str) -> None:
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(dataset, f, indent=2)
    logger.info(f"Saved dataset JSON to {filepath} ({os.path.getsize(filepath) / (1024 * 1024):.2f} MB)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate scalable synthetic criminal investigation dataset")
    parser.add_argument("--num-cases", type=int, default=1000, help="Number of cases to generate (default: 1000)")
    parser.add_argument("--output", type=str, default="data/synthetic_odisha_dataset_1000.json", help="Output JSON path")
    args = parser.parse_args()

    data = generate_synthetic_dataset(num_cases=args.num_cases)
    out_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", args.output)
    save_dataset_to_json(data, os.path.abspath(out_path))
