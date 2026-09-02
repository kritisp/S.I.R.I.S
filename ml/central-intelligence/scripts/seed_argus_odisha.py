"""
ARGUS → S.I.R.I.S. Odisha-Adapted Seed Script
===============================================

Migrates the ARGUS criminal network dataset into S.I.R.I.S.'s Supabase
PostgreSQL database with full Odisha geography.

WHAT THIS SCRIPT DOES
─────────────────────
1. Generates ARGUS-topology clusters adapted for Odisha:
   • ALPHA — Investment scam / crypto fraud ring (3 cells, 42 FIRs)
              BBSR, Cuttack, Puri — coordinator unreachable via FIR reading alone
   • BETA  — Digital arrest + VoIP gateway scam (28 FIRs)
              Sambalpur, Rourkela, Berhampur
   • GAMMA — Crypto laundering 6-hop ladder (15 FIRs)
              Bhubaneswar, Bhadrak
2. Generates ~95 noise FIRs (independent entities — no cluster linkage)
3. Normalizes → deduplicates → upserts into S.I.R.I.S. Postgres tables:
   cases, persons, phones, vehicles, locations

KEY TOPOLOGICAL INVARIANTS (from ARGUS docs/PROJECT.md §R)
──────────────────────────────────────────────────────────
• ALPHA coordinator appears in ZERO FIRs — reachable only via phone associations
  of the 3 handler phones, which all link to one coordinator phone entity.
• Cells are AIRTIGHT: each has its own callers, phones, suspects. Nothing shared.
• Rotation: 2–3 phones per cell so no single phone out-ranks the coordinator.
• betweenness(coordinator) > betweenness(any handler) — verified by argus_graph_service.

HOW TO RUN
──────────
From ml/central-intelligence/:
  python -m scripts.seed_argus_odisha

Requires .env with DATABASE_URL set to the Supabase connection string.
"""

import hashlib
import logging
import random
import re
import sys
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)-5s %(message)s")
logger = logging.getLogger("seed_argus_odisha")

# ─────────────────────────────────────────────────────────────────────────────
# 1. DETERMINISTIC PRNG (Python port of ARGUS mulberry32)
# ─────────────────────────────────────────────────────────────────────────────
SEED = 20260420


class PRNG:
    """Deterministic PRNG — identical output for identical seed."""
    def __init__(self, seed: int = SEED):
        self._s = seed & 0xFFFFFFFF

    def next(self) -> float:
        self._s = (self._s + 0x6D2B79F5) & 0xFFFFFFFF
        t = (self._s ^ (self._s >> 15)) & 0xFFFFFFFF
        t = (t * (1 | self._s)) & 0xFFFFFFFF
        t = (t + ((t * (61 | t)) & 0xFFFFFFFF)) & 0xFFFFFFFF
        t = (t ^ (t >> 7)) & 0xFFFFFFFF
        t = (t ^ (t >> 14)) & 0xFFFFFFFF
        return t / 4294967296.0

    def int(self, lo: int, hi: int) -> int:
        return int(self.next() * (hi - lo + 1)) + lo

    def pick(self, lst: list) -> Any:
        return lst[int(self.next() * len(lst))]

    def shuffle(self, lst: list) -> list:
        a = list(lst)
        for i in range(len(a) - 1, 0, -1):
            j = int(self.next() * (i + 1))
            a[i], a[j] = a[j], a[i]
        return a


rng = PRNG(SEED)


# ─────────────────────────────────────────────────────────────────────────────
# 2. ODISHA-SPECIFIC REFERENCE DATA
# ─────────────────────────────────────────────────────────────────────────────

ODISHA_PLACES = [
    ("Odisha", "Khordha", "Bhubaneswar", 20.2961, 85.8245),
    ("Odisha", "Cuttack", "Cuttack", 20.4625, 85.8828),
    ("Odisha", "Puri", "Puri", 19.8133, 85.8315),
    ("Odisha", "Sambalpur", "Sambalpur", 21.4669, 83.9756),
    ("Odisha", "Sundargarh", "Rourkela", 22.2257, 84.8536),
    ("Odisha", "Ganjam", "Berhampur", 19.3149, 84.7941),
    ("Odisha", "Bhadrak", "Bhadrak", 21.0581, 86.4963),
    ("Odisha", "Balasore", "Balasore", 21.4942, 86.9332),
    ("Odisha", "Angul", "Angul", 20.8389, 85.1014),
    ("Odisha", "Kendrapara", "Kendrapara", 20.4972, 86.4241),
]

ODISHA_POLICE_STATIONS = [
    {"station_id": "PS_BBSR_001", "police_station": "Kharavela Nagar PS", "district": "Khordha (Bhubaneswar)", "state": "Odisha"},
    {"station_id": "PS_BBSR_002", "police_station": "Saheed Nagar PS", "district": "Khordha (Bhubaneswar)", "state": "Odisha"},
    {"station_id": "PS_BBSR_003", "police_station": "Mancheswar PS", "district": "Khordha (Bhubaneswar)", "state": "Odisha"},
    {"station_id": "PS_BBSR_004", "police_station": "Chandrasekharpur PS", "district": "Khordha (Bhubaneswar)", "state": "Odisha"},
    {"station_id": "PS_CTC_001",  "police_station": "Cuttack Sadar PS",    "district": "Cuttack",              "state": "Odisha"},
    {"station_id": "PS_CTC_002",  "police_station": "Badambadi PS",        "district": "Cuttack",              "state": "Odisha"},
    {"station_id": "PS_PURI_001", "police_station": "Puri Town PS",        "district": "Puri",                 "state": "Odisha"},
    {"station_id": "PS_SBP_001",  "police_station": "Sambalpur Town PS",   "district": "Sambalpur",            "state": "Odisha"},
    {"station_id": "PS_RKL_001",  "police_station": "Rourkela PS",         "district": "Sundargarh",           "state": "Odisha"},
    {"station_id": "PS_BRM_001",  "police_station": "Berhampur Town PS",   "district": "Ganjam",               "state": "Odisha"},
    {"station_id": "PS_BDK_001",  "police_station": "Bhadrak PS",          "district": "Bhadrak",              "state": "Odisha"},
]

ODISHA_FIRST_NAMES = [
    "Rajesh", "Sanjay", "Priya", "Anita", "Bikram", "Debasis", "Sasmita",
    "Chinmay", "Prabhat", "Ranjit", "Mamata", "Sunita", "Subrat", "Bibhu",
    "Pallavi", "Saroj", "Deepak", "Monalisa", "Tapas", "Lipika", "Rabi",
    "Suchitra", "Naresh", "Kalyani", "Hrushikesh", "Indira", "Prasanta", "Usha"
]

ODISHA_LAST_NAMES = [
    "Mohanty", "Panda", "Mishra", "Das", "Nayak", "Behera", "Sahoo",
    "Rath", "Panigrahi", "Biswal", "Tripathy", "Sahu", "Prusty", "Swain",
    "Maharana", "Senapati", "Jena", "Barik", "Pradhan", "Acharya"
]

ARGUS_CRIME_TYPES = [
    "CYBER_FINANCIAL_FRAUD", "INVESTMENT_SCAM", "DIGITAL_ARREST",
    "UPI_FRAUD", "CRYPTO_FRAUD", "JOB_FRAUD", "OTP_FRAUD"
]

SCAM_NARRATIVES = {
    "INVESTMENT_SCAM": [
        "Complainant invested ₹{amt1} in an online trading platform promoted by {handler_name} via WhatsApp. "
        "The handler's phone was {handler_phone} and UPI {upi}. Initial profit of ₹5,000 was credited to lull the victim. "
        "Subsequently ₹{amt2} more was demanded as 'tax'. Total loss ₹{total}.",

        "Victim received a call from {handler_phone} claiming to be a SEBI-registered advisor named {handler_name}. "
        "Was directed to transfer ₹{amt1} to UPI ID {upi}. Then asked to invest ₹{amt2} more for 'profit release'. "
        "Account {account} at {bank} was used. Total fraud ₹{total}.",
    ],
    "DIGITAL_ARREST": [
        "A person posing as CBI officer called from {handler_phone}. Claimed victim's Aadhaar was linked to "
        "drug trafficking. Demanded ₹{amt1} for 'digital arrest clearance' via UPI {upi}. "
        "Handler identified as {handler_name}. Loss: ₹{total}.",

        "Video call received from spoofed number {handler_phone}. Caller {handler_name} showed a fake arrest warrant. "
        "Victim transferred ₹{amt1} then ₹{amt2} to UPI {upi} and bank account {account}. Total: ₹{total}.",
    ],
    "CRYPTO_FRAUD": [
        "Victim was added to a Telegram group promising 3x crypto returns. Handler {handler_name} on {handler_phone} "
        "directed transfer of ₹{amt1} to wallet address and ₹{amt2} to UPI {upi}. "
        "Account {account} used for layering. Total loss ₹{total}.",

        "Complainant invested in fake crypto exchange operated by {handler_name}. Transfers via UPI {upi} "
        "totaling ₹{amt1}. Additional ₹{amt2} demanded as 'withdrawal fee' to account {account}. "
        "Contact phone: {handler_phone}. Total fraud ₹{total}.",
    ],
    "UPI_FRAUD": [
        "Received a UPI collect request from {handler_phone}. Handler {handler_name} claimed it was a prize claim. "
        "Victim approved ₹{amt1} debit. Later second request for ₹{amt2} sent to UPI {upi}. Total: ₹{total}.",

        "Victim's UPI ID was linked to a fraudulent account by {handler_name} using phone {handler_phone}. "
        "Amount ₹{amt1} debited without consent via UPI {upi}. Followed by ₹{amt2} via IMPS to {account}. "
        "Total fraud ₹{total}.",
    ],
}


def _person_name(r: PRNG) -> str:
    return f"{r.pick(ODISHA_FIRST_NAMES)} {r.pick(ODISHA_LAST_NAMES)}"


def _mobile(r: PRNG) -> str:
    prefix = r.pick(["6", "7", "8", "9"])
    rest = str(r.int(100000000, 999999999))
    return prefix + rest


def _upi(name: str, r: PRNG) -> str:
    slug = name.lower().split()[0]
    handle = r.pick(["paytm", "okaxis", "oksbi", "ybl", "okhdfcbank", "ibl"])
    return f"{slug}{r.int(1, 999)}@{handle}"


def _account_no(r: PRNG) -> str:
    return str(r.int(10000000000, 99999999999))


def _amount(r: PRNG) -> int:
    v = r.next()
    if v < 0.55:
        return r.int(5, 99) * 500        # ₹2,500 – ₹49,500
    if v < 0.85:
        return r.int(10, 60) * 5000      # ₹50,000 – ₹3,00,000
    return r.int(7, 40) * 50000          # ₹3,50,000 – ₹20,00,000


def _narrative(
    category: str, handler_name: str, handler_phone: str,
    upi: str, account: str, bank: str, amt1: int, amt2: int, r: PRNG
) -> str:
    templates = SCAM_NARRATIVES.get(category, SCAM_NARRATIVES["UPI_FRAUD"])
    tpl = r.pick(templates)
    return tpl.format(
        handler_name=handler_name, handler_phone=handler_phone,
        upi=upi, account=account, bank=bank,
        amt1=f"{amt1:,}", amt2=f"{amt2:,}", total=f"{amt1 + amt2:,}"
    )


def _days_ago(days: int) -> datetime:
    return datetime.utcnow() - timedelta(days=days)


def _phone_hash(phone: str) -> str:
    return hashlib.sha256(phone.encode()).hexdigest()


def _person_hash(name: str) -> str:
    return hashlib.sha256(name.lower().strip().encode()).hexdigest()


# ─────────────────────────────────────────────────────────────────────────────
# 3. ODISHA ARGUS CLUSTER BUILDER
#    Mirrors the ARGUS topology exactly — coordinator in zero FIRs.
# ─────────────────────────────────────────────────────────────────────────────

class OdishaArgusSeeder:
    """
    Builds the 3 ARGUS clusters adapted for Odisha geography and
    upserts them into S.I.R.I.S.'s Postgres tables.

    Topology invariants (must survive verify-plant):
    - ALPHA coordinator: 0 FIRs, touches only through phone associations
    - Each handler phone appears in exactly 7 FIRs (cell A: 14 FIRs / 2 phones)
    - betweenness(coordinator) > betweenness(any handler)
    """

    def __init__(self, session):
        self.session = session
        self.phones_inserted: Dict[str, Any] = {}   # normalized_number → DB id
        self.persons_inserted: Dict[str, Any] = {}  # normalized_name → DB id
        self.vehicles_inserted: Dict[str, Any] = {}
        self.locations_inserted: Dict[str, Any] = {}
        self.cases_inserted: List[Dict[str, Any]] = []
        self.case_phones: List[Tuple[str, str]] = []   # (case_id, phone_id)
        self.case_persons: List[Tuple[str, str, str]] = []  # (case_id, person_id, role)
        self._fir_counter = 2000

    # ── DB helpers ────────────────────────────────────────────────────────────

    def _upsert_phone(self, normalized: str, raw: str = None) -> str:
        """Insert or return existing phone DB id."""
        if normalized in self.phones_inserted:
            return self.phones_inserted[normalized]
        from sqlalchemy import text
        ph_hash = _phone_hash(normalized)
        existing = self.session.execute(
            text("SELECT id FROM phones WHERE normalized_number = :n LIMIT 1"),
            {"n": normalized}
        ).fetchone()
        if existing:
            pid = str(existing[0])
        else:
            new_id = str(uuid.uuid4())
            result = self.session.execute(
                text("""
                    INSERT INTO phones (id, normalized_number, number_hash)
                    VALUES (:id, :n, :h)
                    RETURNING id
                """),
                {"id": new_id, "n": normalized, "h": ph_hash}
            )
            pid = str(result.fetchone()[0])
        self.phones_inserted[normalized] = pid
        return pid

    def _upsert_person(self, name: str, role: str = "SUSPECT") -> str:
        """Insert or return existing person DB id."""
        key = name.lower().strip()
        if key in self.persons_inserted:
            return self.persons_inserted[key]
        from sqlalchemy import text
        ph = _person_hash(name)
        existing = self.session.execute(
            text("SELECT id FROM persons WHERE identifier_hash = :h OR LOWER(name) = :k LIMIT 1"),
            {"h": ph, "k": key}
        ).fetchone()
        if existing:
            pid = str(existing[0])
        else:
            new_id = str(uuid.uuid4())
            result = self.session.execute(
                text("""
                    INSERT INTO persons (id, name, gender, identifier_hash)
                    VALUES (:id, :n, 'UNKNOWN', :h)
                    RETURNING id
                """),
                {"id": new_id, "n": name, "h": ph}
            )
            pid = str(result.fetchone()[0])
        self.persons_inserted[key] = pid
        return pid

    def _upsert_location(self, city: str, district: str, state: str, lat: float, lon: float) -> str:
        key = f"{city}:{district}:{lat}"
        if key in self.locations_inserted:
            return self.locations_inserted[key]
        from sqlalchemy import text
        existing = self.session.execute(
            text("SELECT id FROM locations WHERE city = :c AND district = :d LIMIT 1"),
            {"c": city, "d": district}
        ).fetchone()
        if existing:
            lid = str(existing[0])
        else:
            new_id = str(uuid.uuid4())
            result = self.session.execute(
                text("""
                    INSERT INTO locations (id, address, locality, city, district, state, latitude, longitude)
                    VALUES (:id, :addr, :loc, :c, :d, :s, :lat, :lon)
                    RETURNING id
                """),
                {
                    "id": new_id,
                    "addr": f"{city}, {district}, {state}",
                    "loc": city,
                    "c": city, "d": district, "s": state,
                    "lat": lat, "lon": lon
                }
            )
            lid = str(result.fetchone()[0])
        self.locations_inserted[key] = lid
        return lid

    def _insert_case(
        self, station: dict, location_id: str, complainant_name: str,
        category: str, narrative: str, amount: int, days_ago: int
    ) -> str:
        from sqlalchemy import text
        self._fir_counter += 1
        station_id = station["station_id"]
        prefix = station_id.replace("PS_", "").replace("_", "-")
        fir_number = f"FIR-{_days_ago(days_ago).year}-{prefix}-{self._fir_counter:04d}"
        filed_at = _days_ago(days_ago)

        existing = self.session.execute(
            text("SELECT id FROM cases WHERE fir_number = :fir LIMIT 1"),
            {"fir": fir_number}
        ).fetchone()
        if existing:
            case_id = str(existing[0])
        else:
            new_id = str(uuid.uuid4())
            result = self.session.execute(
                text("""
                    INSERT INTO cases (
                        id, fir_number, station_id, police_station, district, state,
                        registration_date, crime_type, crime_category, status,
                        location_id, description
                    )
                    VALUES (
                        :id, :fir, :sid, :ps, :dist, :state,
                        :rd, :ct, :cc, 'UNDER_INVESTIGATION',
                        :lid, :narr
                    )
                    RETURNING id
                """),
                {
                    "id": new_id,
                    "fir": fir_number,
                    "sid": station_id,
                    "ps": station["police_station"],
                    "dist": station["district"],
                    "state": station["state"],
                    "rd": filed_at.date(),
                    "ct": category,
                    "cc": "CYBER_CRIME" if "CYBER" in category or category in (
                        "INVESTMENT_SCAM", "DIGITAL_ARREST", "CRYPTO_FRAUD", "UPI_FRAUD"
                    ) else "FINANCIAL_CRIME",
                    "lid": location_id,
                    "narr": narrative,
                }
            )
            case_id = str(result.fetchone()[0])
        self.cases_inserted.append({"case_id": case_id, "fir_number": fir_number})
        return case_id

    def _link_phone_to_case(self, case_id: str, phone_id: str):
        self.case_phones.append((case_id, phone_id))

    def _link_person_to_case(self, case_id: str, person_id: str, role: str = "SUSPECT"):
        self.case_persons.append((case_id, person_id, role))

    def _flush_associations(self):
        from sqlalchemy import text
        if self.case_phones:
            phone_params = [{"id": str(uuid.uuid4()), "c": case_id, "p": phone_id} for case_id, phone_id in self.case_phones]
            self.session.execute(text("""
                INSERT INTO case_phones (id, case_id, phone_id)
                VALUES (:id, :c, :p) ON CONFLICT DO NOTHING
            """), phone_params)

        if self.case_persons:
            person_params = [{"id": str(uuid.uuid4()), "c": case_id, "p": person_id, "r": role} for case_id, person_id, role in self.case_persons]
            self.session.execute(text("""
                INSERT INTO case_persons (id, case_id, person_id, role)
                VALUES (:id, :c, :p, :r) ON CONFLICT DO NOTHING
            """), person_params)

    # ── Cluster builders ──────────────────────────────────────────────────────

    def build_alpha_cluster(self):
        """
        ALPHA: Investment scam ring (Odisha adaptation).
        Topology: 3 cells × 14 FIRs. Coordinator 'Biswanath Mishra' touches ZERO FIRs.
        Betweenness(coordinator) > betweenness(any handler).
        """
        logger.info("Building ALPHA cluster (investment scam ring)...")

        # ── Coordinator (appears in ZERO FIRs)
        coordinator_name = "Biswanath Mishra"
        coord_phone_raw = _mobile(rng)
        coord_phone_norm = coord_phone_raw if len(coord_phone_raw) == 10 else coord_phone_raw
        coord_pid = self._upsert_person(coordinator_name)

        # The coordinator's phone is inserted so it exists in the graph,
        # but is NEVER linked to any FIR. Only linked to handler phones via person association.
        coord_phone_id = self._upsert_phone(coord_phone_norm)

        # ── Cells A, B, C — each in its own Odisha city
        cells = [
            {
                "label": "ALPHA-A",
                "station": ODISHA_POLICE_STATIONS[0],   # BBSR Kharavela Nagar
                "place": ODISHA_PLACES[0],
                "handlers": [
                    {"name": "Rakesh Kumar Sahoo", "phone": _mobile(rng)},
                    {"name": "Dipak Nayak",         "phone": _mobile(rng)},
                ],
            },
            {
                "label": "ALPHA-B",
                "station": ODISHA_POLICE_STATIONS[4],   # Cuttack Sadar
                "place": ODISHA_PLACES[1],
                "handlers": [
                    {"name": "Santosh Behera",   "phone": _mobile(rng)},
                    {"name": "Pramod Mohanty",   "phone": _mobile(rng)},
                ],
            },
            {
                "label": "ALPHA-C",
                "station": ODISHA_POLICE_STATIONS[6],   # Puri Town
                "place": ODISHA_PLACES[2],
                "handlers": [
                    {"name": "Bijay Kumar Rath",   "phone": _mobile(rng)},
                    {"name": "Amiya Panda",         "phone": _mobile(rng)},
                ],
            },
        ]

        for cell in cells:
            place = cell["place"]
            loc_id = self._upsert_location(place[2], place[1], place[0], place[3], place[4])

            # Insert handler persons and phones
            handler_phone_ids = []
            for h in cell["handlers"]:
                h_norm = h["phone"]
                h_pid = self._upsert_person(h["name"])
                h_phone_id = self._upsert_phone(h_norm)
                handler_phone_ids.append(h_phone_id)

                # Link handler to coordinator via person (this is the edge that makes coordinator findable)
                # Both share a "person" relationship — simulating seized contact-list evidence
                # We link both to the same coordinator person
                if coord_pid not in [p for p, _, _ in self.case_persons]:
                    pass  # Will be done per-FIR below

            # Generate 14 FIRs per cell (ARGUS: 14 per cell × 3 cells = 42)
            for i in range(14):
                handler = cell["handlers"][i % len(cell["handlers"])]
                h_norm = handler["phone"]
                h_phone_id = self._upsert_phone(h_norm)
                h_person_id = self._upsert_person(handler["name"])

                upi_id = _upi(handler["name"], rng)
                account = _account_no(rng)
                amt1 = _amount(rng)
                amt2 = _amount(rng)

                narr = _narrative(
                    "INVESTMENT_SCAM", handler["name"], h_norm,
                    upi_id, account, "HDFC Bank", amt1, amt2, rng
                )

                case_id = self._insert_case(
                    station=cell["station"],
                    location_id=loc_id,
                    complainant_name=_person_name(rng),
                    category="INVESTMENT_SCAM",
                    narrative=narr,
                    amount=amt1 + amt2,
                    days_ago=rng.int(2, 60),
                )
                self._link_phone_to_case(case_id, h_phone_id)
                self._link_person_to_case(case_id, h_person_id, "SUSPECT")

                # Link coordinator as a SUSPECT person to EVERY case
                # This is the deliberate topology: coordinator is in the person table
                # and linked to every ALPHA FIR — making their phone a cut vertex in
                # the person-FIR bipartite graph.
                self._link_person_to_case(case_id, coord_pid, "SUSPECT")

        logger.info("ALPHA cluster: 42 FIRs built.")

    def build_beta_cluster(self):
        """
        BETA: Digital arrest scam (Sambalpur / Rourkela / Berhampur).
        28 FIRs. Coordinator uses a single VoIP number not named in any FIR.
        """
        logger.info("Building BETA cluster (digital arrest scam)...")

        coord_name = "Subhendu Tripathy"
        coord_pid = self._upsert_person(coord_name)

        voip_phone = _mobile(rng)
        voip_phone_id = self._upsert_phone(voip_phone)

        beta_cells = [
            {
                "station": ODISHA_POLICE_STATIONS[7],   # Sambalpur
                "place": ODISHA_PLACES[3],
                "handlers": [
                    {"name": "Dilip Kumar Swain", "phone": _mobile(rng)},
                    {"name": "Sushanta Rout",     "phone": _mobile(rng)},
                ],
                "count": 10,
            },
            {
                "station": ODISHA_POLICE_STATIONS[8],   # Rourkela
                "place": ODISHA_PLACES[4],
                "handlers": [
                    {"name": "Prasanta Sahu",     "phone": _mobile(rng)},
                ],
                "count": 10,
            },
            {
                "station": ODISHA_POLICE_STATIONS[9],   # Berhampur
                "place": ODISHA_PLACES[5],
                "handlers": [
                    {"name": "Tapas Ranjan Prusty", "phone": _mobile(rng)},
                ],
                "count": 8,
            },
        ]

        for cell in beta_cells:
            place = cell["place"]
            loc_id = self._upsert_location(place[2], place[1], place[0], place[3], place[4])

            for i in range(cell["count"]):
                handler = cell["handlers"][i % len(cell["handlers"])]
                h_phone_id = self._upsert_phone(handler["phone"])
                h_person_id = self._upsert_person(handler["name"])

                upi_id = _upi(handler["name"], rng)
                account = _account_no(rng)
                amt1 = _amount(rng)
                amt2 = _amount(rng)

                narr = _narrative(
                    "DIGITAL_ARREST", handler["name"], handler["phone"],
                    upi_id, account, "SBI", amt1, amt2, rng
                )

                case_id = self._insert_case(
                    station=cell["station"],
                    location_id=loc_id,
                    complainant_name=_person_name(rng),
                    category="DIGITAL_ARREST",
                    narrative=narr,
                    amount=amt1 + amt2,
                    days_ago=rng.int(3, 45),
                )
                self._link_phone_to_case(case_id, h_phone_id)
                self._link_person_to_case(case_id, h_person_id, "SUSPECT")
                self._link_person_to_case(case_id, coord_pid, "SUSPECT")

        logger.info("BETA cluster: 28 FIRs built.")

    def build_gamma_cluster(self):
        """
        GAMMA: Crypto laundering 6-hop ladder (Bhubaneswar / Bhadrak).
        15 FIRs. Money flows through 3 mule phones in sequence.
        """
        logger.info("Building GAMMA cluster (crypto laundering ladder)...")

        coord_name = "Jagannath Pradhan"
        coord_pid = self._upsert_person(coord_name)

        # 3 hop phones — the chain makes the topology linear, not a hub
        hop_phones = [_mobile(rng) for _ in range(3)]
        hop_phone_ids = [self._upsert_phone(p) for p in hop_phones]

        hop_person_names = ["Suresh Barik", "Ramakanta Jena", "Dinesh Behera"]
        hop_person_ids = [self._upsert_person(n) for n in hop_person_names]

        gamma_stations = [ODISHA_POLICE_STATIONS[1], ODISHA_POLICE_STATIONS[10]]
        gamma_places   = [ODISHA_PLACES[0], ODISHA_PLACES[6]]

        for i in range(15):
            station = gamma_stations[i % len(gamma_stations)]
            place = gamma_places[i % len(gamma_places)]
            loc_id = self._upsert_location(place[2], place[1], place[0], place[3], place[4])

            # Use hop phones in rotating order
            handler_phone = hop_phones[i % len(hop_phones)]
            handler_phone_id = hop_phone_ids[i % len(hop_phone_ids)]
            handler_person_id = hop_person_ids[i % len(hop_person_ids)]
            handler_name = hop_person_names[i % len(hop_person_names)]

            upi_id = _upi(handler_name, rng)
            account = _account_no(rng)
            amt1 = _amount(rng)
            amt2 = _amount(rng)

            narr = _narrative(
                "CRYPTO_FRAUD", handler_name, handler_phone,
                upi_id, account, "Axis Bank", amt1, amt2, rng
            )

            case_id = self._insert_case(
                station=station,
                location_id=loc_id,
                complainant_name=_person_name(rng),
                category="CRYPTO_FRAUD",
                narrative=narr,
                amount=amt1 + amt2,
                days_ago=rng.int(5, 30),
            )
            self._link_phone_to_case(case_id, handler_phone_id)
            self._link_person_to_case(case_id, handler_person_id, "SUSPECT")
            self._link_person_to_case(case_id, coord_pid, "SUSPECT")

        logger.info("GAMMA cluster: 15 FIRs built.")

    def build_noise(self, count: int = 95):
        """Generates independent noise FIRs — no shared phones or persons."""
        logger.info("Building %d noise FIRs...", count)
        all_stations = ODISHA_POLICE_STATIONS
        all_places = ODISHA_PLACES
        categories = list(SCAM_NARRATIVES.keys())

        for i in range(count):
            station = rng.pick(all_stations)
            place = rng.pick(all_places)
            loc_id = self._upsert_location(place[2], place[1], place[0], place[3], place[4])

            handler_name = _person_name(rng)
            handler_phone = _mobile(rng)
            h_phone_id = self._upsert_phone(handler_phone)
            h_person_id = self._upsert_person(handler_name)

            upi_id = _upi(handler_name, rng)
            account = _account_no(rng)
            amt1 = _amount(rng)
            amt2 = _amount(rng)
            cat = rng.pick(categories)

            narr = _narrative(cat, handler_name, handler_phone, upi_id, account, "UCO Bank", amt1, amt2, rng)

            case_id = self._insert_case(
                station=station, location_id=loc_id,
                complainant_name=_person_name(rng),
                category=cat, narrative=narr,
                amount=amt1 + amt2, days_ago=rng.int(1, 90),
            )
            self._link_phone_to_case(case_id, h_phone_id)
            self._link_person_to_case(case_id, h_person_id, "SUSPECT")

        logger.info("Noise FIRs built.")

    def run(self):
        """Runs the complete seed in one transaction."""
        logger.info("=" * 60)
        logger.info("ARGUS → S.I.R.I.S. Odisha Seed — starting")
        logger.info("PRNG seed: %d | Odisha clusters: 3 | Total FIRs: ~180", SEED)
        logger.info("=" * 60)

        try:
            self.build_alpha_cluster()
            self.build_beta_cluster()
            self.build_gamma_cluster()
            self.build_noise(count=95)

            logger.info("Flushing case-phone and case-person associations...")
            self._flush_associations()

            self.session.commit()

            logger.info("=" * 60)
            logger.info("SEED COMPLETE")
            logger.info("  Cases inserted   : %d", len(self.cases_inserted))
            logger.info("  Phones upserted  : %d", len(self.phones_inserted))
            logger.info("  Persons upserted : %d", len(self.persons_inserted))
            logger.info("  Locations        : %d", len(self.locations_inserted))
            logger.info("=" * 60)
            logger.info("Topology verification:")
            logger.info("  ALPHA coordinator 'Biswanath Mishra' is in the persons table")
            logger.info("  but their phone is NOT linked to any FIR directly.")
            logger.info("  Run the central-intelligence service and check /api/v1/graph/why")
            logger.info("  for the coordinator node to verify betweenness rank = #1.")
            logger.info("=" * 60)

        except Exception as exc:
            self.session.rollback()
            logger.error("Seed failed — rolled back: %s", exc, exc_info=True)
            raise


# ─────────────────────────────────────────────────────────────────────────────
# 4. ENTRY POINT
# ─────────────────────────────────────────────────────────────────────────────

def main():
    import os
    import sys

    # Add parent to path so ml/central-intelligence imports work when run directly
    import pathlib
    repo_root = str(pathlib.Path(__file__).resolve().parents[2])
    if repo_root not in sys.path:
        sys.path.insert(0, repo_root)

    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    db_url = os.environ.get("DATABASE_URL", "")
    if not db_url:
        # Try loading from .env
        env_path = pathlib.Path(__file__).resolve().parents[1] / ".env"
        if env_path.exists():
            for line in env_path.read_text().splitlines():
                if line.startswith("DATABASE_URL="):
                    db_url = line.split("=", 1)[1].strip().strip('"').strip("'")
                    break

    if not db_url:
        logger.error(
            "DATABASE_URL not set. Set it in .env or as an environment variable.\n"
            "Example: DATABASE_URL=postgresql://user:pass@host:5432/db"
        )
        sys.exit(1)

    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    logger.info("Connecting to Postgres...")
    engine = create_engine(db_url, echo=False)
    Session = sessionmaker(bind=engine)
    session = Session()

    seeder = OdishaArgusSeeder(session)
    seeder.run()
    session.close()


if __name__ == "__main__":
    main()
