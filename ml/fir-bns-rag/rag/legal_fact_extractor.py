import re
import json
from typing import Dict, Any, List, Optional


class LegalFactExtractor:
    """
    Phase 2: Legal Fact Extractor.
    Extracts objective legal facts from natural language crime narratives without assigning legal section numbers.
    """
    def __init__(self, llm_provider: Optional[Any] = None):
        self.llm_provider = llm_provider

    def extract_facts(self, user_input: str) -> Dict[str, Any]:
        """
        Extracts structured legal facts dictionary from user incident report.
        """
        text_lower = user_input.lower()

        # 1. Death Occurred Flag
        death_terms = ["death", "killed", "dead", "murdered", "body found", "expired", "passed away", "homicide"]
        survival_terms = ["survived", "alive", "tried to kill", "attempt to kill", "attempted to kill", "attempted murder", "escaped"]
        
        death_occurred = any(term in text_lower for term in death_terms)
        if any(term in text_lower for term in survival_terms):
            death_occurred = False

        # 2. Violence Present Flag
        violence_terms = ["hit", "beat", "stab", "shoot", "kill", "attack", "slap", "injure", "weapon", "knife", "rod", "gun", "strangle", "choke", "acid", "blood", "force"]
        violence_present = any(term in text_lower for term in violence_terms)

        # 3. Relationship Identification
        relationship = "stranger"
        if any(w in text_lower for w in ["husband", "wife", "spouse", "partner"]):
            relationship = "spouse"
        elif any(w in text_lower for w in ["in-law", "mother-in-law", "father-in-law", "brother-in-law", "sister-in-law"]):
            relationship = "in-law"
        elif any(w in text_lower for w in ["neighbor", "neighbour"]):
            relationship = "neighbor"
        elif any(w in text_lower for w in ["friend", "relative", "uncle", "cousin"]):
            relationship = "relative"
        elif any(w in text_lower for w in ["employer", "boss", "servant", "worker"]):
            relationship = "employment"

        # 4. Victim Type
        victim_type = "general"
        if any(w in text_lower for w in ["woman", "wife", "mother", "sister", "daughter", "female", "lady", "girl", "me", "my husband"]):
            victim_type = "woman"
        elif any(w in text_lower for w in ["child", "minor", "boy", "infant", "kid", "baby"]):
            victim_type = "minor"

        # 5. Crime Domain Classification
        if any(w in text_lower for w in ["kill", "murder", "dead", "homicide", "stab", "shoot", "strangle", "beat", "hurt", "injury", "assault"]):
            crime_domain = "violent_crimes"
        elif any(w in text_lower for w in ["narcotics", "drugs", "ndps", "contraband", "ganja", "heroin", "smuggling", "powder", "substance", "opium", "cocaine", "meth"]):
            crime_domain = "narcotics_ndps"
        elif any(w in text_lower for w in ["stole", "stolen", "theft", "burgle", "jewellery", "cash", "housebreak", "trespass", "robbed"]):
            crime_domain = "property_crimes"
        elif any(w in text_lower for w in ["phishing", "link", "online", "bank scam", "hacked", "cyber"]):
            crime_domain = "cyber_crimes"
        elif any(w in text_lower for w in ["cheated", "fraud", "forged", "counterfeit", "financial"]):
            crime_domain = "financial_crimes"
        elif any(w in text_lower for w in ["rape", "molest", "dowry", "modesty", "cruelty"]):
            crime_domain = "offences_against_women"
        else:
            crime_domain = "general_penal"

        # 6. Possible Acts
        possible_acts = []
        if "tried to kill" in text_lower or "attempt" in text_lower or "kill" in text_lower:
            possible_acts.append("attempted killing")
        if any(w in text_lower for w in ["hit", "beat", "attacked", "stabbed", "strangled"]):
            possible_acts.append("physical assault")
        if any(w in text_lower for w in ["stole", "stolen", "took"]):
            possible_acts.append("unlawful taking of property")
        if any(w in text_lower for w in ["entered", "break-in", "trespass"]):
            possible_acts.append("unlawful house entry")
        if any(w in text_lower for w in ["link", "scam", "cheated", "fraud"]):
            possible_acts.append("deceptive financial inducement")

        if not possible_acts:
            possible_acts.append("unspecified criminal act")

        # 7. Intent Inferred
        if any(w in text_lower for w in ["kill", "murder", "death", "tried to kill"]):
            intent = "cause death"
        elif any(w in text_lower for w in ["stole", "take", "robbed", "money", "jewellery"]):
            intent = "unlawful gain"
        elif any(w in text_lower for w in ["cheated", "fraud", "link", "scam"]):
            intent = "deception / fraudulent gain"
        else:
            intent = "criminal harm"

        extracted_facts = {
            "crime_domain": crime_domain,
            "possible_act": possible_acts,
            "intent": intent,
            "relationship": relationship,
            "victim_type": victim_type,
            "violence_present": violence_present,
            "death_occurred": death_occurred
        }

        # Optional LLM enhancement if provider is available
        if self.llm_provider and self.llm_provider.is_available():
            try:
                system_prompt = (
                    "You are a Legal Fact Extraction Assistant. Extract objective factual details from the incident report. "
                    "Return ONLY a JSON object with keys: crime_domain, possible_act (list), intent, relationship, victim_type, violence_present (bool), death_occurred (bool)."
                )
                llm_res = self.llm_provider.generate_structured(user_input, system_prompt=system_prompt)
                if isinstance(llm_res, dict) and "crime_domain" in llm_res:
                    return llm_res
            except Exception as e:
                print(f"[LegalFactExtractor] LLM extraction fallback to rules: {e}")

        return extracted_facts


if __name__ == "__main__":
    extractor = LegalFactExtractor()
    test_inputs = [
        "My husband tried to kill me",
        "Someone entered my house at night and stole my jewellery",
        "A person stabbed another person with a knife but victim survived"
    ]
    print("\n--- Legal Fact Extractor Test ---")
    for inp in test_inputs:
        print(f"\nInput: '{inp}'")
        facts = extractor.extract_facts(inp)
        print("Extracted Facts:", json.dumps(facts, indent=2))
