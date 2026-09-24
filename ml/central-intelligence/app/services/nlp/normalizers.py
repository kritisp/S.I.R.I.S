"""
S.I.R.I.S Domain-Aware Normalizers
===================================
Canonical normalization dispatchers for FIR entities:
- Indian person names (honorific & role stripping, title casing)
- Odisha & Indian location names
- FIR incident dates & timestamps
- Vehicle registration plates
- Phones, UPI IDs, emails, bank accounts, crypto wallets
"""

import re
from typing import Optional

# Common Indian honorifics, titles, and legal role prefixes in FIRs
_HONORIFIC_PREFIXES_RE = re.compile(
    r"^(?:shri|sh\.|smt\.|smt|mr\.|mr|mrs\.|mrs|ms\.|ms|dr\.|dr|adv\.|advocate|accused|complainant|informant|victim|witness|suspect|sri|sree|p\.c\.|constable|inspector|sub-inspector|si|iic|asi)\b\s*",
    re.IGNORECASE
)

# Common FIR location filler prefixes/suffixes
_LOC_FILLER_RE = re.compile(
    r"^(?:at|near|opposite|opp\.|adj\.|adjacent to|in front of|ps|police station)\s+",
    re.IGNORECASE
)
_LOC_SUFFIX_RE = re.compile(
    r"\s+(?:square|sq\.|chhak|chowk|ps|police station)$",
    re.IGNORECASE
)


# Known Odisha & major Indian location canonical mappings
_KNOWN_LOCATIONS = {
    "bbsr": "Bhubaneswar",
    "bhubaneswar": "Bhubaneswar",
    "ctc": "Cuttack",
    "cuttack": "Cuttack",
    "puri": "Puri",
    "khandagiri": "Khandagiri",
    "saheed nagar": "Saheed Nagar",
    "shaheed nagar": "Saheed Nagar",
    "rasulgarh": "Rasulgarh",
    "khordha": "Khordha",
    "khurda": "Khordha",
    "janpath": "Janpath",
    "master canteen": "Master Canteen",
    "vani vihar": "Vani Vihar",
    "sambalpur": "Sambalpur",
    "berhampur": "Berhampur",
    "rourkela": "Rourkela",
    "balasore": "Balasore",
}

# Indian Vehicle Registration Number regex pattern
_VEHICLE_REG_RE = re.compile(r"^[A-Z]{2}[-\s]?\d{1,2}[-\s]?[A-Z]{1,3}[-\s]?\d{4}$", re.IGNORECASE)


def normalize_person(raw: str) -> str:
    """
    Normalizes Indian person names by stripping honorifics and roles,
    collapsing whitespace, and applying clean title-casing.
    Preserves full distinct names (e.g. 'Ramesh Sahoo' != 'Ramesh Kumar Sahoo').
    """
    if not raw or not raw.strip():
        return ""

    text = raw.strip()
    # Strip leading honorifics/roles
    cleaned = _HONORIFIC_PREFIXES_RE.sub("", text).strip()
    if not cleaned:
        cleaned = text.strip()

    # Remove non-alphabetical leading/trailing symbols
    cleaned = re.sub(r"^[^\w]+|[^\w]+$", "", cleaned)
    # Collapse multiple spaces
    cleaned = re.sub(r"\s+", " ", cleaned)

    return cleaned.title() if cleaned else raw.strip()


def normalize_location(raw: str) -> str:
    """
    Normalizes location names by removing common prepended FIR prepositions,
    location suffixes (square, sq, chhak), and mapping known Odisha district/city names.
    """
    if not raw or not raw.strip():
        return ""

    text = raw.strip()

    # Remove prepositions like 'at', 'near', 'opposite' and suffixes like 'square', 'chhak'
    cleaned = _LOC_FILLER_RE.sub("", text).strip()
    cleaned = _LOC_SUFFIX_RE.sub("", cleaned).strip()

    # Clean punctuation
    cleaned = re.sub(r"^[^\w]+|[^\w]+$", "", cleaned).strip()
    cleaned_lower = cleaned.lower()

    if cleaned_lower in _KNOWN_LOCATIONS:
        return _KNOWN_LOCATIONS[cleaned_lower]

    return cleaned.title() if cleaned else raw.strip()



def normalize_date(raw: str) -> str:
    """
    Converts common Indian FIR date formats (DD.MM.YYYY, DD/MM/YYYY, YYYY-MM-DD)
    into standard ISO format 'YYYY-MM-DD' when parseable.
    """
    if not raw or not raw.strip():
        return ""

    text = raw.strip()

    # Check YYYY-MM-DD
    m = re.search(r"\b(\d{4})[-/.](\d{2})[-/.](\d{2})\b", text)
    if m:
        return f"{m.group(1)}-{m.group(2)}-{m.group(3)}"

    # Check DD.MM.YYYY or DD/MM/YYYY
    m = re.search(r"\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})\b", text)
    if m:
        day = int(m.group(1))
        month = int(m.group(2))
        year = int(m.group(3))
        if 1 <= day <= 31 and 1 <= month <= 12:
            return f"{year:04d}-{month:02d}-{day:02d}"

    return text


def normalize_vehicle(raw: str) -> str:
    """
    Normalizes Indian vehicle registration plates (e.g. 'OD-02-AK-4455').
    """
    if not raw or not raw.strip():
        return ""

    clean = re.sub(r"[^A-Za-z0-9]", "", raw).upper()

    m = re.match(r"^([A-Z]{2})(\d{2})([A-Z]{1,3})(\d{4})$", clean)
    if m:
        return f"{m.group(1)}-{m.group(2)}-{m.group(3)}-{m.group(4)}"

    return clean if clean else raw.strip().upper()


def normalize_phone(raw: str) -> str:
    """Strips country-code prefix and returns 10-digit Indian mobile."""
    digits = re.sub(r"\D", "", raw or "")
    if len(digits) == 10:
        return digits
    if len(digits) == 12 and digits.startswith("91"):
        return digits[2:]
    if len(digits) == 11 and digits.startswith("0"):
        return digits[1:]
    return digits


def normalize_upi(raw: str) -> str:
    return (raw or "").strip().lower()


def normalize_email(raw: str) -> str:
    return (raw or "").strip().lower()


def normalize_wallet(raw: str) -> str:
    return (raw or "").strip().lower()


def normalize_bank_account(raw: str) -> str:
    return re.sub(r"\D", "", raw or "")


def normalize_entity(entity_type: str, raw: str) -> str:
    """Canonical domain-aware normalization dispatcher."""
    t = (entity_type or "").upper()
    if t == "PHONE":
        return normalize_phone(raw)
    if t == "UPI":
        return normalize_upi(raw)
    if t == "EMAIL":
        return normalize_email(raw)
    if t == "PERSON":
        return normalize_person(raw)
    if t == "LOCATION":
        return normalize_location(raw)
    if t == "DATE":
        return normalize_date(raw)
    if t == "VEHICLE":
        return normalize_vehicle(raw)
    if t == "WALLET":
        return normalize_wallet(raw)
    if t == "BANK_ACCOUNT":
        return normalize_bank_account(raw)
    return (raw or "").strip()
