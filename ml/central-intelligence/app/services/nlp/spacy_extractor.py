"""
S.I.R.I.S. spaCy NER Extractor
================================
Lazy-loads spaCy pipeline for contextual entity extraction (PERSON, ORG, GPE/LOC, DATE, TIME, EVENT).
Degrades gracefully if spaCy or the requested model is unavailable.
"""

import logging
from typing import Any, Dict, List, Optional, Tuple
from app.config.settings import settings

logger = logging.getLogger(__name__)

# spaCy label to S.I.R.I.S entity type mapping & base confidence
LABEL_MAP: Dict[str, Tuple[str, float]] = {
    "PERSON": ("PERSON", 0.75),
    "ORG": ("ORGANIZATION", 0.70),
    "GPE": ("LOCATION", 0.75),
    "LOC": ("LOCATION", 0.75),
    "FAC": ("LOCATION", 0.70),
    "DATE": ("DATE", 0.80),
    "TIME": ("TIME", 0.80),
    "EVENT": ("EVENT", 0.70),
    "MONEY": ("MONEY", 0.85),
}

_nlp_instance = None
_spacy_attempted: bool = False
_spacy_loaded: bool = False
_load_error: Optional[str] = None


def get_spacy_status() -> Dict[str, Any]:
    """Returns diagnostic status of spaCy NER availability."""
    nlp = _get_nlp()
    enabled = bool(settings.ENABLE_SPACY_NER)
    active = enabled and (nlp is not None)
    return {
        "enabled_by_config": enabled,
        "active": active,
        "model": settings.SPACY_MODEL_NAME if active else "disabled/fallback",
        "error": _load_error,
    }



def _get_nlp():
    """Lazy-loads the spaCy NLP pipeline safely."""
    global _nlp_instance, _spacy_attempted, _spacy_loaded, _load_error

    if _spacy_attempted:
        return _nlp_instance

    _spacy_attempted = True

    if not settings.ENABLE_SPACY_NER:
        logger.info("spaCy NER is disabled by configuration (ENABLE_SPACY_NER=False).")
        return None

    try:
        import spacy
        model_name = settings.SPACY_MODEL_NAME
        logger.info("Loading spaCy NER model '%s'...", model_name)
        _nlp_instance = spacy.load(model_name)
        _spacy_loaded = True
        logger.info("Successfully loaded spaCy NER model '%s'.", model_name)
    except ImportError as ie:
        _load_error = f"spaCy package not installed: {ie}"
        logger.warning(_load_error)
        _nlp_instance = None
    except Exception as exc:
        _load_error = f"Failed to load spaCy model '{settings.SPACY_MODEL_NAME}': {exc}"
        logger.warning("%s — Falling back to Regex extraction tier.", _load_error)
        _nlp_instance = None

    return _nlp_instance


def extract_spacy_entities(text: str) -> List[Dict[str, Any]]:
    """
    Extracts contextual entities from text using spaCy NER.
    Returns entity dicts with: type, value, start_char, end_char, confidence, method='SPACY_NER'.
    """
    if not settings.ENABLE_SPACY_NER:
        return []

    nlp = _get_nlp()
    if nlp is None:
        return []


    if not text or not text.strip():
        return []

    try:
        # Disable heavy unneeded pipeline components for speed
        with nlp.select_pipes(enable=["tok2vec", "ner"] if "tok2vec" in nlp.pipe_names else ["ner"]):
            doc = nlp(text)

        results: List[Dict[str, Any]] = []
        min_conf = settings.SPACY_CONFIDENCE_THRESHOLD

        for ent in doc.ents:
            label = ent.label_
            if label not in LABEL_MAP:
                continue

            siris_type, base_conf = LABEL_MAP[label]
            if base_conf < min_conf:
                continue

            raw_val = ent.text.strip()
            # Ignore 1-character noise
            if len(raw_val) < 2 and siris_type != "MONEY":
                continue

            results.append({
                "type": siris_type,
                "value": raw_val,
                "start_char": ent.start_char,
                "end_char": ent.end_char,
                "confidence": base_conf,
                "method": "SPACY_NER",
                "spacy_label": label,
            })

        return results
    except Exception as exc:
        logger.error("Error running spaCy NER pipeline on text: %s", exc, exc_info=True)
        if not settings.SPACY_FALLBACK_ON_ERROR:
            raise
        return []
