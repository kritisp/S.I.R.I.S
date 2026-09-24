"""
S.I.R.I.S. Synthetic Dataset Integrity & Topological Validator
==============================================================
Validates referential integrity, foreign key relations, unique constraints,
and graph topological properties across the generated dataset.
"""

import argparse
import json
import logging
import os
import sys
from typing import Any, Dict, List, Set

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("validate_dataset")


def validate_dataset_dict(data: Dict[str, Any]) -> bool:
    """Performs deep relational integrity verification and topological analysis."""
    logger.info("Starting comprehensive dataset validation...")

    cases = data.get("cases", [])
    persons = data.get("persons", [])
    phones = data.get("phones", [])
    vehicles = data.get("vehicles", [])
    locations = data.get("locations", [])
    legal_sections = data.get("legal_sections", [])
    case_persons = data.get("case_persons", [])
    person_phones = data.get("person_phones", [])
    case_phones = data.get("case_phones", [])
    case_vehicles = data.get("case_vehicles", [])
    case_legal_sections = data.get("case_legal_sections", [])
    evidences = data.get("evidences", [])
    investigation_events = data.get("investigation_events", [])
    chargesheets = data.get("chargesheets", [])

    errors = []

    # 1. Primary Key Maps
    case_ids: Set[str] = {c["id"] for c in cases}
    person_ids: Set[str] = {p["id"] for p in persons}
    phone_ids: Set[str] = {ph["id"] for ph in phones}
    vehicle_ids: Set[str] = {v["id"] for v in vehicles}
    location_ids: Set[str] = {loc["id"] for loc in locations}
    legal_section_ids: Set[str] = {ls["id"] for ls in legal_sections}

    # 2. Uniqueness Checks
    fir_numbers = [c["fir_number"] for c in cases]
    if len(fir_numbers) != len(set(fir_numbers)):
        errors.append(f"Duplicate FIR numbers detected: {len(fir_numbers)} total vs {len(set(fir_numbers))} unique")

    phone_numbers = [ph["normalized_number"] for ph in phones]
    if len(phone_numbers) != len(set(phone_numbers)):
        errors.append(f"Duplicate phone numbers detected: {len(phone_numbers)} total vs {len(set(phone_numbers))} unique")

    vehicle_regs = [v["registration_number"] for v in vehicles]
    if len(vehicle_regs) != len(set(vehicle_regs)):
        errors.append(f"Duplicate vehicle registrations detected: {len(vehicle_regs)} total vs {len(set(vehicle_regs))} unique")

    # 3. Foreign Key Integrity Checks
    # Case -> Location
    for c in cases:
        if c.get("location_id") and c["location_id"] not in location_ids:
            errors.append(f"Case {c['fir_number']} references missing location_id {c['location_id']}")

    # CasePerson -> Case, Person
    for cp in case_persons:
        if cp["case_id"] not in case_ids:
            errors.append(f"CasePerson {cp['id']} references missing case_id {cp['case_id']}")
        if cp["person_id"] not in person_ids:
            errors.append(f"CasePerson {cp['id']} references missing person_id {cp['person_id']}")

    # PersonPhone -> Person, Phone
    for pp in person_phones:
        if pp["person_id"] not in person_ids:
            errors.append(f"PersonPhone {pp['id']} references missing person_id {pp['person_id']}")
        if pp["phone_id"] not in phone_ids:
            errors.append(f"PersonPhone {pp['id']} references missing phone_id {pp['phone_id']}")

    # CasePhone -> Case, Phone
    for cph in case_phones:
        if cph["case_id"] not in case_ids:
            errors.append(f"CasePhone {cph['id']} references missing case_id {cph['case_id']}")
        if cph["phone_id"] not in phone_ids:
            errors.append(f"CasePhone {cph['id']} references missing phone_id {cph['phone_id']}")

    # CaseVehicle -> Case, Vehicle
    for cv in case_vehicles:
        if cv["case_id"] not in case_ids:
            errors.append(f"CaseVehicle {cv['id']} references missing case_id {cv['case_id']}")
        if cv["vehicle_id"] not in vehicle_ids:
            errors.append(f"CaseVehicle {cv['id']} references missing vehicle_id {cv['vehicle_id']}")

    # CaseLegalSection -> Case, LegalSection
    for cls in case_legal_sections:
        if cls["case_id"] not in case_ids:
            errors.append(f"CaseLegalSection {cls['id']} references missing case_id {cls['case_id']}")
        if cls["legal_section_id"] not in legal_section_ids:
            errors.append(f"CaseLegalSection {cls['id']} references missing legal_section_id {cls['legal_section_id']}")

    # Evidence -> Case
    for ev in evidences:
        if ev["case_id"] not in case_ids:
            errors.append(f"Evidence {ev['id']} references missing case_id {ev['case_id']}")

    # Chargesheet -> Case
    for cs in chargesheets:
        if cs["case_id"] not in case_ids:
            errors.append(f"Chargesheet {cs['id']} references missing case_id {cs['case_id']}")

    # InvestigationEvent -> Case
    for ie in investigation_events:
        if ie["case_id"] not in case_ids:
            errors.append(f"InvestigationEvent {ie['id']} references missing case_id {ie['case_id']}")

    # 4. Print Summary & Topological Metrics
    print("\n" + "=" * 60)
    print("           S.I.R.I.S. DATASET VALIDATION REPORT")
    print("=" * 60)
    print(f"Total Cases:                   {len(cases):,}")
    print(f"Total Persons:                 {len(persons):,}")
    print(f"Total Phone Numbers:           {len(phones):,}")
    print(f"Total Vehicles:                {len(vehicles):,}")
    print(f"Total Locations:               {len(locations):,}")
    print(f"Total Legal Sections:          {len(legal_sections):,}")
    print("-" * 60)
    print(f"Case-Person Associations:      {len(case_persons):,}")
    print(f"Person-Phone Associations:     {len(person_phones):,}")
    print(f"Case-Phone Associations:       {len(case_phones):,}")
    print(f"Case-Vehicle Associations:     {len(case_vehicles):,}")
    print(f"Case-Section Associations:     {len(case_legal_sections):,}")
    print(f"Forensic Evidence Items:       {len(evidences):,}")
    print(f"Investigation Events:          {len(investigation_events):,}")
    print(f"Chargesheets Filed:            {len(chargesheets):,}")
    print("-" * 60)

    # Multi-Case Linking Stats
    person_case_counts: Dict[str, int] = {}
    for cp in case_persons:
        person_case_counts[cp["person_id"]] = person_case_counts.get(cp["person_id"], 0) + 1

    multi_case_persons = sum(1 for cnt in person_case_counts.values() if cnt > 1)
    max_cases_per_person = max(person_case_counts.values()) if person_case_counts else 0

    print(f"Repeat Suspects (Multi-Case):  {multi_case_persons} persons ({multi_case_persons / len(persons) * 100:.1f}%)")
    print(f"Max Cases Linked to 1 Person:  {max_cases_per_person}")
    print("=" * 60)

    if errors:
        logger.error(f"Validation FAILED with {len(errors)} errors:")
        for err in errors[:10]:
            logger.error(f"  - {err}")
        if len(errors) > 10:
            logger.error(f"  ... and {len(errors) - 10} more errors.")
        return False
    else:
        logger.info("PASS: 100% Referential Integrity & Zero Constraint Violations!")
        return True


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Validate synthetic dataset")
    parser.add_argument("--file", type=str, default="data/synthetic_odisha_dataset_1000.json", help="Path to dataset JSON")
    args = parser.parse_args()

    full_path = os.path.abspath(args.file)
    if not os.path.exists(full_path):
        from app.seeds.scalable_dataset_generator import generate_synthetic_dataset
        data = generate_synthetic_dataset(1000)
    else:
        with open(full_path, "r", encoding="utf-8") as f:
            data = json.load(f)

    is_valid = validate_dataset_dict(data)
    sys.exit(0 if is_valid else 1)
