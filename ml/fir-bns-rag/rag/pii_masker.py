import re
from typing import Dict, Any, List, Tuple, Optional, Union


class FIRPIIMasker:
    """
    Step 3: Lightweight, Reversible FIR Sensitive Data (PII) Masking & Unmasking Layer.
    
    Protects privacy before transmitting FIR data to external/cloud LLM providers:
    - Person names (complainant, victims, witnesses, named suspects)
    - Phone numbers (Indian 10-digit mobile & landlines)
    - Vehicle registration numbers (Indian formats)
    - Sensitive addresses / house details
    - Personal identifiers (Aadhaar / PAN / email)
    
    Maintains an ephemeral, in-memory reversible mapping that is NEVER sent to the LLM.
    Provides unmasking functions to restore original entities in the final response JSON.
    """

    def __init__(self):
        # Compiled patterns for structured identifiers
        self.phone_pattern = re.compile(r"(?:\+91[\-\s]?)?[6-9]\d{9}\b")
        self.vehicle_pattern = re.compile(r"\b([A-Z]{2}[-\s]?[0-9]{1,2}[-\s]?[A-Z]{1,3}[-\s]?[0-9]{4})\b")
        self.email_pattern = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b")
        self.aadhaar_pattern = re.compile(r"\b\d{4}\s?\d{4}\s?\d{4}\b")
        self.pan_pattern = re.compile(r"\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b")

    def mask_text(
        self,
        text: str,
        extracted_entities: Optional[Dict[str, Any]] = None,
        existing_map: Optional[Dict[str, str]] = None
    ) -> Tuple[str, Dict[str, str]]:
        """
        Masks plain text using regex patterns and extracted entity references.
        Returns:
            (masked_text, reversible_mapping) where mapping maps placeholder -> original_value
        """
        if not text:
            return "", {}

        mapping: Dict[str, str] = existing_map.copy() if existing_map else {}
        # Reverse lookup for deduplicating identical values
        value_to_placeholder: Dict[str, str] = {v: k for k, v in mapping.items()}

        counters = {
            "PERSON": sum(1 for k in mapping if k.startswith("PERSON_")),
            "PHONE": sum(1 for k in mapping if k.startswith("PHONE_")),
            "VEHICLE": sum(1 for k in mapping if k.startswith("VEHICLE_")),
            "ADDRESS": sum(1 for k in mapping if k.startswith("ADDRESS_")),
            "ID": sum(1 for k in mapping if k.startswith("ID_")),
            "EMAIL": sum(1 for k in mapping if k.startswith("EMAIL_"))
        }

        def get_or_create_placeholder(prefix: str, original_val: str) -> str:
            val_clean = original_val.strip()
            if not val_clean:
                return original_val
            if val_clean in value_to_placeholder:
                return value_to_placeholder[val_clean]

            counters[prefix] += 1
            placeholder = f"{prefix}_{counters[prefix]:03d}"
            mapping[placeholder] = val_clean
            value_to_placeholder[val_clean] = placeholder
            return placeholder

        masked = text

        # 1. Mask Person Names from extracted_entities if provided
        if extracted_entities:
            people = extracted_entities.get("people", {})
            # Complainant
            comp = people.get("complainant")
            if comp and isinstance(comp, dict) and comp.get("name"):
                name = comp["name"]
                # Avoid masking generic terms
                if len(name) > 2 and not name.lower().startswith("unknown"):
                    ph = get_or_create_placeholder("PERSON", name)
                    masked = re.sub(re.escape(name), ph, masked, flags=re.IGNORECASE)

            # Victims
            for v in people.get("victims", []):
                if isinstance(v, dict) and v.get("name"):
                    name = v["name"]
                    if len(name) > 2 and not name.lower().startswith("unknown"):
                        ph = get_or_create_placeholder("PERSON", name)
                        masked = re.sub(re.escape(name), ph, masked, flags=re.IGNORECASE)

            # Named Accused
            for a in people.get("accused", []):
                if isinstance(a, dict) and a.get("name") and a.get("is_identified"):
                    name = a["name"]
                    if len(name) > 2:
                        ph = get_or_create_placeholder("PERSON", name)
                        masked = re.sub(re.escape(name), ph, masked, flags=re.IGNORECASE)

            # Witnesses
            for w in people.get("witnesses", []):
                if isinstance(w, dict) and w.get("name"):
                    name = w["name"]
                    if len(name) > 2 and name.lower() not in ["none", "nil", "n/a"]:
                        ph = get_or_create_placeholder("PERSON", name)
                        masked = re.sub(re.escape(name), ph, masked, flags=re.IGNORECASE)

        # 2. Mask Phone Numbers
        for m in self.phone_pattern.finditer(masked):
            orig = m.group(0)
            ph = get_or_create_placeholder("PHONE", orig)
            masked = masked.replace(orig, ph)

        # 3. Mask Vehicle Numbers
        for m in self.vehicle_pattern.finditer(masked):
            orig = m.group(0)
            ph = get_or_create_placeholder("VEHICLE", orig)
            masked = masked.replace(orig, ph)

        # 4. Mask Emails
        for m in self.email_pattern.finditer(masked):
            orig = m.group(0)
            ph = get_or_create_placeholder("EMAIL", orig)
            masked = masked.replace(orig, ph)

        # 5. Mask Aadhaar / PAN Identifiers
        for m in self.pan_pattern.finditer(masked):
            orig = m.group(0)
            ph = get_or_create_placeholder("ID", orig)
            masked = masked.replace(orig, ph)

        # 6. Mask Specific Residential Addresses (e.g. "House 42, Daryaganj", "Flat No. 102...")
        addr_matches = re.finditer(r"\b(?:House\s*(?:No\.?|#)?\s*\d+[A-Za-z0-9\s,\/\-]+?|Flat\s*(?:No\.?|#)?\s*\d+[A-Za-z0-9\s,\/\-]+?|r\/o\s+[A-Za-z0-9\s,\/\-]+?)(?=\s*(?:\n|,|\.|\bPh\b|\bPhone\b|\bPIN\b))", masked, re.IGNORECASE)
        for am in addr_matches:
            orig = am.group(0).strip()
            if len(orig) > 4:
                ph = get_or_create_placeholder("ADDRESS", orig)
                masked = masked.replace(orig, ph)

        return masked, mapping

    def mask_fir_entities(self, fir_entity_dict: Dict[str, Any]) -> Tuple[Dict[str, Any], Dict[str, str]]:
        """
        Deeply masks a structured FIR entity dictionary (output of FIREntityExtractor).
        Returns a tuple of (masked_dict, reversible_mapping).
        """
        import copy
        masked_dict = copy.deepcopy(fir_entity_dict)
        mapping: Dict[str, str] = {}

        # 1. Mask Phone list
        masked_phones = []
        for p in masked_dict.get("phones", []):
            m_p, mapping = self.mask_text(p, existing_map=mapping)
            masked_phones.append(m_p)
        masked_dict["phones"] = masked_phones

        # 2. Mask Vehicle list
        masked_vehicles = []
        for v in masked_dict.get("vehicles", []):
            m_v, mapping = self.mask_text(v, existing_map=mapping)
            masked_vehicles.append(m_v)
        masked_dict["vehicles"] = masked_vehicles

        # 3. Mask People records
        people = masked_dict.get("people", {})
        if people.get("complainant"):
            comp = people["complainant"]
            if comp.get("name"):
                comp["name"], mapping = self.mask_text(comp["name"], existing_map=mapping)
            if comp.get("details"):
                comp["details"], mapping = self.mask_text(comp["details"], existing_map=mapping)

        for vic in people.get("victims", []):
            if vic.get("name"):
                vic["name"], mapping = self.mask_text(vic["name"], existing_map=mapping)

        for acc in people.get("accused", []):
            if acc.get("name") and acc.get("is_identified"):
                acc["name"], mapping = self.mask_text(acc["name"], existing_map=mapping)
            if acc.get("description"):
                acc["description"], mapping = self.mask_text(acc["description"], existing_map=mapping)

        for wit in people.get("witnesses", []):
            if wit.get("name"):
                wit["name"], mapping = self.mask_text(wit["name"], existing_map=mapping)

        # 4. Mask Timeline event descriptions
        for item in masked_dict.get("timeline", []):
            if item.get("event_description"):
                item["event_description"], mapping = self.mask_text(item["event_description"], existing_map=mapping)

        # 5. Mask Property supporting text spans
        for prop in masked_dict.get("property", []):
            if prop.get("supporting_text"):
                prop["supporting_text"], mapping = self.mask_text(prop["supporting_text"], existing_map=mapping)

        return masked_dict, mapping

    def unmask_text(self, text: str, mapping: Dict[str, str]) -> str:
        """
        Restores all placeholders in text back to original sensitive values.
        """
        if not text or not mapping:
            return text

        unmasked = text
        # Sort placeholders in reverse length order to prevent sub-string collision (e.g. PERSON_010 before PERSON_001)
        for placeholder in sorted(mapping.keys(), key=lambda x: len(x), reverse=True):
            orig_value = mapping[placeholder]
            unmasked = unmasked.replace(placeholder, orig_value)

        return unmasked

    def unmask_data(self, data: Union[Dict[str, Any], List[Any], str], mapping: Dict[str, str]) -> Any:
        """
        Recursively unmasks any JSON-serializable structure (dict, list, string).
        """
        if not mapping:
            return data

        if isinstance(data, str):
            return self.unmask_text(data, mapping)
        elif isinstance(data, list):
            return [self.unmask_data(item, mapping) for item in data]
        elif isinstance(data, dict):
            return {k: self.unmask_data(v, mapping) for k, v in data.items()}
        else:
            return data


if __name__ == "__main__":
    masker = FIRPIIMasker()

    sample_text = (
        "Complainant Rajesh Kumar (Ph: 9876543210, r/o House 42, Daryaganj) reported that "
        "suspect fled in car DL-01-AB-1234. Witness Suresh saw the incident."
    )

    print("--- 1. Original Text ---")
    print(sample_text)

    # Test Masking
    masked_text, pii_map = masker.mask_text(
        sample_text,
        extracted_entities={
            "people": {
                "complainant": {"name": "Rajesh Kumar"},
                "witnesses": [{"name": "Suresh"}]
            }
        }
    )

    print("\n--- 2. Masked Text (Safe for External LLM) ---")
    print(masked_text)

    print("\n--- 3. In-Memory Ephemeral Mapping (Kept Local) ---")
    import json
    print(json.dumps(pii_map, indent=2))

    # Test Unmasking
    unmasked_text = masker.unmask_text(masked_text, pii_map)
    print("\n--- 4. Restored Unmasked Text ---")
    print(unmasked_text)

    # Verification Assertion
    is_exact_match = (sample_text == unmasked_text)
    print(f"\nExact Restoration Verified: {is_exact_match}")
