"""
S.I.R.I.S. Deterministic Regex Extractor
==========================================
Extracts structured identifiers (PHONE, UPI, EMAIL, VEHICLE, BANK_ACCOUNT, WALLET, IP, TELEGRAM)
with precise character offsets and high confidence scores.
"""

import re
from typing import Any, Dict, List, Tuple

_WALLET_RE  = re.compile(r"\b0x[a-fA-F0-9]{40}\b")
_IFSC_RE    = re.compile(r"\b[A-Z]{4}0[A-Z0-9]{6}\b")
_EMAIL_RE   = re.compile(r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b")
_UPI_RE     = re.compile(r"\b[A-Za-z0-9._\-]{2,}@[A-Za-z][A-Za-z0-9]{1,}\b")
_TELE_RE    = re.compile(r"(?<![A-Za-z0-9._%+\-])@([A-Za-z][A-Za-z0-9_]{3,31})\b")
_IP_RE      = re.compile(r"\b(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\b")
_PHONE_RE   = re.compile(r"(?<!\d)(?:\+?91[\s\-]?|0)?([6-9](?:[\s\-]?\d){9})(?!\d)")
_ACCT_RE    = re.compile(r"(?<!\d)(\d{11,18})(?!\d)")
_VEHICLE_RE = re.compile(r"\b[A-Z]{2}[-\s]?\d{1,2}[-\s]?[A-Z]{1,3}[-\s]?\d{4}\b", re.IGNORECASE)

# Priority order list: (pattern, entity_type, confidence, match_group)
_PIPELINE = [
    (_WALLET_RE,  "WALLET",       0.99, 0),
    (_IFSC_RE,    None,           0.0,  0),   # Claimed to avoid partial account number match
    (_EMAIL_RE,   "EMAIL",        0.98, 0),
    (_UPI_RE,     "UPI",          0.97, 0),
    (_TELE_RE,    "TELEGRAM",     0.94, 1),
    (_IP_RE,      "IP",           0.96, 0),
    (_VEHICLE_RE, "VEHICLE",      0.96, 0),
    (_PHONE_RE,   "PHONE",        0.97, 1),
    (_ACCT_RE,    "BANK_ACCOUNT", 0.95, 1),
]


def extract_regex_entities(narrative: str) -> List[Dict[str, Any]]:
    """
    Extracts structured entities from narrative using priority-ordered regex pipeline.
    Returns list of dicts: {type, value, start_char, end_char, confidence, method='REGEX'}.
    """
    text = str(narrative or "")
    if not text:
        return []

    claimed: List[Tuple[int, int]] = []

    def is_claimed(s: int, e: int) -> bool:
        return any(s < ce and e > cs for cs, ce in claimed)

    entities: List[Dict[str, Any]] = []

    for pattern, etype, conf, grp in _PIPELINE:
        for m in pattern.finditer(text):
            s, e = m.span()
            if is_claimed(s, e):
                continue
            claimed.append((s, e))
            if etype is None:
                continue

            raw = m.group(grp).strip()
            if not raw:
                continue

            entities.append({
                "type": etype,
                "value": raw,
                "start_char": s,
                "end_char": e,
                "confidence": conf,
                "method": "REGEX",
            })

    return entities
