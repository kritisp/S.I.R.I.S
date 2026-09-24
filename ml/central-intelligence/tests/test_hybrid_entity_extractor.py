"""
Unit and Integration Tests for S.I.R.I.S. Hybrid NLP Entity Extractor
======================================================================
Tests regex structured entities, spaCy NER contextual entities, span overlap resolution,
domain normalization (Indian names, Odisha places, dates), fallback handling, and API endpoints.
"""

import pytest
from app.config.settings import settings
from app.services.nlp.normalizers import (
    normalize_entity,
    normalize_person,
    normalize_location,
    normalize_date,
    normalize_vehicle,
)
from app.services.nlp.regex_extractor import extract_regex_entities
from app.services.nlp.spacy_extractor import extract_spacy_entities, get_spacy_status
from app.services.nlp.hybrid_extractor import HybridEntityExtractor
from app.services.graph.graph_intelligence_service import graph_intelligence_service


# ─────────────────────────────────────────────────────────────────────────────
# 1. Normalizer Unit Tests
# ─────────────────────────────────────────────────────────────────────────────

def test_normalize_person_honorific_stripping():
    """Verify honorifics and roles are stripped while preserving name distinction."""
    assert normalize_person("Shri Ramesh Sahoo") == "Ramesh Sahoo"
    assert normalize_person("Smt. Gita Rani Dash") == "Gita Rani Dash"
    assert normalize_person("Accused Ramesh Sahoo") == "Ramesh Sahoo"
    assert normalize_person("Complainant Subash Chandra Pradhan") == "Subash Chandra Pradhan"
    # Ensure distinct names are preserved
    assert normalize_person("Ramesh Sahoo") != normalize_person("Ramesh Kumar Sahoo")


def test_normalize_location_odisha_places():
    """Verify Odisha place names and prepositions are cleaned."""
    assert normalize_location("at Khandagiri Square") == "Khandagiri"
    assert normalize_location("near Saheed Nagar") == "Saheed Nagar"
    assert normalize_location("bbsr") == "Bhubaneswar"
    assert normalize_location("ctc") == "Cuttack"


def test_normalize_date_formats():
    """Verify FIR dates are normalized into ISO format when parseable."""
    assert normalize_date("14.08.2026") == "2026-08-14"
    assert normalize_date("22/09/2026") == "2026-09-22"
    assert normalize_date("2026-09-01") == "2026-09-01"


def test_normalize_vehicle_plates():
    """Verify Indian vehicle registration plates formatting."""
    assert normalize_vehicle("OD-02-AK-4455") == "OD-02-AK-4455"
    assert normalize_vehicle("or02bv9876") == "OR-02-BV-9876"


# ─────────────────────────────────────────────────────────────────────────────
# 2. Regex Extractor Unit Tests
# ─────────────────────────────────────────────────────────────────────────────

def test_regex_extractor_structured_entities():
    """Verify regex extractor captures phones, UPIs, emails, vehicle plates, accounts."""
    narrative = (
        "On 14.08.2026, complainant reported theft of vehicle OD-02-AK-4455 near Janpath. "
        "Fraudulent call received from +91-9861012345, who demanded payment to suspect@upi "
        "and account 123456789012. Wallet 0x1234567890123456789012345678901234567890."
    )
    entities = extract_regex_entities(narrative)
    etypes = {e["type"] for e in entities}

    assert "PHONE" in etypes
    assert "UPI" in etypes
    assert "VEHICLE" in etypes
    assert "BANK_ACCOUNT" in etypes
    assert "WALLET" in etypes

    for e in entities:
        assert "start_char" in e
        assert "end_char" in e
        assert e["end_char"] > e["start_char"]
        assert e["method"] == "REGEX"


# ─────────────────────────────────────────────────────────────────────────────
# 3. Hybrid Extractor & spaCy NER Unit Tests
# ─────────────────────────────────────────────────────────────────────────────

def test_spacy_status_diagnostic():
    """Verify spaCy status diagnostic returns boolean status."""
    status = get_spacy_status()
    assert "enabled_by_config" in status
    assert "active" in status
    assert "model" in status


def test_hybrid_extractor_synthetic_burglary_fir():
    """Test hybrid extraction on a realistic synthetic Burglary FIR narrative."""
    narrative = (
        "On the night of 14.08.2026, Shri Subash Chandra Pradhan reported that unknown intruders "
        "broke into residence at Plot 412, Khandagiri, Bhubaneswar. Stole gold jewellery. "
        "Suspect phone +91-9861012345 and vehicle OD-02-AK-4455 were spotted near Saheed Nagar."
    )
    result = HybridEntityExtractor.extract(narrative)

    assert "entities" in result
    assert "duration_ms" in result
    assert "tiers" in result
    assert result["duration_ms"] >= 0

    entities = result["entities"]
    etypes = {e["type"] for e in entities}

    # Verify structured entities
    assert "PHONE" in etypes
    assert "VEHICLE" in etypes

    # Check offsets
    for e in entities:
        assert "start_char" in e
        assert "end_char" in e
        assert "normalized_value" in e
        assert "confidence" in e
        assert e["confidence"] > 0.0

    # If spaCy is active, check contextual entities
    if result["spacy_active"]:
        assert any(e["type"] in ("PERSON", "LOCATION", "DATE") for e in entities)


def test_hybrid_extractor_span_overlap_resolution():
    """Verify structured regex entities override overlapping spaCy NER spans."""
    # Construct narrative where vehicle plate or UPI could confuse general NER
    narrative = "Contact officer Ramesh Sahoo at test.account@upi or call +91-9437098765."
    result = HybridEntityExtractor.extract(narrative)

    entities = result["entities"]
    upis = [e for e in entities if e["type"] == "UPI"]
    phones = [e for e in entities if e["type"] == "PHONE"]

    assert len(upis) == 1
    assert upis[0]["normalized_value"] == "test.account@upi"
    assert len(phones) == 1
    assert phones[0]["normalized_value"] == "9437098765"


def test_hybrid_extractor_empty_text():
    """Verify handling of empty or whitespace text."""
    result = HybridEntityExtractor.extract("")
    assert result["entities"] == []
    assert result["tiers"]["merged"] == 0

    result_ws = HybridEntityExtractor.extract("   \n\t  ")
    assert result_ws["entities"] == []


def test_hybrid_extractor_disabled_spacy(monkeypatch):
    """Verify graceful fallback when spaCy is disabled via config."""
    monkeypatch.setattr(settings, "ENABLE_SPACY_NER", False)
    narrative = "Shri Ramesh Sahoo called +91-9861012345 from Bhubaneswar on 14.08.2026."

    result = HybridEntityExtractor.extract(narrative)
    assert result["spacy_active"] is False
    assert result["tiers"]["regex"] > 0
    # Phone should still be extracted cleanly by regex tier
    assert any(e["type"] == "PHONE" for e in result["entities"])


# ─────────────────────────────────────────────────────────────────────────────
# 4. End-to-End Service API Contract Test
# ─────────────────────────────────────────────────────────────────────────────

def test_graph_service_extract_entities():
    """Verify graph_intelligence_service.extract_entities contract."""
    narrative = (
        "On 22.08.2026, complainant received fraudulent call from +91-9876543210 "
        "posing as bank manager, sent malicious APK link to user@scam.org."
    )
    response = graph_intelligence_service.extract_entities(narrative)

    assert "entities" in response
    assert "duration_ms" in response
    assert "tiers" in response
    assert "spacy_active" in response
    assert "model_used" in response
    assert isinstance(response["entities"], list)
    assert len(response["entities"]) > 0
