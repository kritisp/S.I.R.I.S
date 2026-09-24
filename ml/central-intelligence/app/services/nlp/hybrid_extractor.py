"""
S.I.R.I.S. Hybrid NLP Entity Extractor
======================================
Orchestrates deterministic Regex extraction and spaCy NER into a unified,
domain-normalized, deduplicated entity stream with span overlap resolution.
"""

import logging
import time
from typing import Any, Dict, List, Set, Tuple

from app.config.settings import settings
from app.services.nlp.normalizers import normalize_entity
from app.services.nlp.regex_extractor import extract_regex_entities
from app.services.nlp.spacy_extractor import extract_spacy_entities, get_spacy_status

logger = logging.getLogger(__name__)

# Structured entity types that ALWAYS override spaCy NER if spans overlap
STRUCTURED_REGEX_TYPES = {
    "PHONE", "UPI", "EMAIL", "VEHICLE", "BANK_ACCOUNT", "WALLET", "IP", "TELEGRAM"
}


def _spans_overlap(s1: int, e1: int, s2: int, e2: int) -> bool:
    """Returns True if span (s1, e1) overlaps with span (s2, e2)."""
    return max(s1, s2) < min(e1, e2)


class HybridEntityExtractor:
    """
    Hybrid NLP Entity Extractor combining Regex & spaCy NER.
    """

    @classmethod
    def extract(cls, narrative: str) -> Dict[str, Any]:
        """
        Executes hybrid entity extraction on a FIR narrative text.
        Returns a dict matching the S.I.R.I.S /extract endpoint specification.
        """
        t0 = time.perf_counter()
        text = str(narrative or "")

        if not text.strip():
            return {
                "entities": [],
                "duration_ms": 0.0,
                "tiers": {"regex": 0, "ner": 0, "merged": 0},
                "spacy_active": get_spacy_status()["active"],
                "model_used": settings.SPACY_MODEL_NAME if settings.ENABLE_SPACY_NER else "disabled",
            }

        # Tier 1: Deterministic Regex Extraction
        regex_entities = extract_regex_entities(text)

        # Tier 2: spaCy NER Extraction (if enabled & available)
        spacy_status = get_spacy_status()
        spacy_entities: List[Dict[str, Any]] = []
        if spacy_status["enabled_by_config"]:
            spacy_entities = extract_spacy_entities(text)

        # Tier 3: Span Overlap Resolution & Merger
        merged_raw_entities: List[Dict[str, Any]] = []
        regex_spans = [(item["start_char"], item["end_char"]) for item in regex_entities]

        # Always include all regex entities
        for r_item in regex_entities:
            merged_raw_entities.append(r_item)

        # Filter spaCy entities: drop any spaCy NER span that overlaps a structured regex span
        kept_ner_count = 0
        for s_item in spacy_entities:
            s_start = s_item["start_char"]
            s_end = s_item["end_char"]

            # Overlap check against high-priority regex spans
            if any(_spans_overlap(s_start, s_end, r_s, r_e) for r_s, r_e in regex_spans):
                logger.debug(
                    "Dropping spaCy NER entity '%s' (%s) due to overlap with structured regex span.",
                    s_item["value"], s_item["type"]
                )
                continue

            merged_raw_entities.append(s_item)
            kept_ner_count += 1

        # Tier 4: Domain Normalization & Deduplication
        final_entities: List[Dict[str, Any]] = []
        seen_keys: Set[Tuple[str, str]] = set()

        # Sort merged candidates: highest confidence first, then longer span first
        merged_raw_entities.sort(
            key=lambda x: (-x.get("confidence", 0.5), -(x.get("end_char", 0) - x.get("start_char", 0)))
        )

        for candidate in merged_raw_entities:
            etype = candidate["type"]
            raw_val = candidate["value"]
            norm_val = normalize_entity(etype, raw_val)

            if not norm_val or len(norm_val) < 2:
                continue

            dedup_key = (etype, norm_val)
            if dedup_key in seen_keys:
                continue

            seen_keys.add(dedup_key)
            final_entities.append({
                "type": etype,
                "value": raw_val,
                "normalized_value": norm_val,
                "confidence": round(candidate.get("confidence", 0.70), 2),
                "method": candidate.get("method", "HYBRID"),
                "start_char": candidate.get("start_char", 0),
                "end_char": candidate.get("end_char", 0),
            })

        duration_ms = round((time.perf_counter() - t0) * 1000, 2)

        logger.info(
            "HybridEntityExtractor: Extracted %d entities (Regex: %d, spaCy NER: %d, Final Merged: %d) in %.2fms [spaCy active: %s]",
            len(final_entities),
            len(regex_entities),
            kept_ner_count,
            len(final_entities),
            duration_ms,
            spacy_status["active"],
        )

        return {
            "entities": final_entities,
            "duration_ms": duration_ms,
            "tiers": {
                "regex": len(regex_entities),
                "ner": kept_ner_count,
                "merged": len(final_entities),
            },
            "spacy_active": spacy_status["active"],
            "model_used": settings.SPACY_MODEL_NAME if spacy_status["active"] else "disabled/fallback",
        }
