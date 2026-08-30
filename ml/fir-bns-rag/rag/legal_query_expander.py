import json
from typing import List, Dict, Any, Optional


class LegalQueryExpander:
    """
    Phase 3: Legal Query Concept Expander.
    Expands plain natural language query into formal statutory legal concepts and terminology.
    """
    CONCEPT_MAP = {
        "kill": ["attempt to murder", "intention to cause death", "overt act towards murder", "culpable homicide"],
        "husband": ["husband or relative of husband", "spousal cruelty", "domestic violence", "marital offence"],
        "stole": ["dishonest taking of movable property", "theft", "stolen property", "out of possession"],
        "house": ["dwelling house", "building used as human dwelling", "house-trespass", "housebreaking"],
        "night": ["lurking house-trespass by night", "night housebreaking"],
        "bike": ["movable property", "means of transportation", "theft of vehicle"],
        "bank": ["cheating by personation", "fraudulent inducement", "financial deception"],
        "scam": ["cheating", "fraudulent inducement", "deception"],
        "stabbed": ["voluntarily causing hurt by dangerous weapon", "attempt to murder", "weapon assault"],
        "dead": ["punishment for murder", "culpable homicide amounting to murder", "causing death"]
    }

    def __init__(self, llm_provider: Optional[Any] = None):
        self.llm_provider = llm_provider

    def expand_query(self, user_input: str, extracted_facts: Optional[Dict[str, Any]] = None) -> List[str]:
        """
        Translates raw input text and extracted legal facts into list of statutory legal terms.
        """
        text_lower = user_input.lower()
        expanded_concepts = set()

        # Rule & Heuristic Concept Expansion
        for trigger, concepts in self.CONCEPT_MAP.items():
            if trigger in text_lower:
                expanded_concepts.update(concepts)

        if extracted_facts:
            domain = extracted_facts.get("crime_domain", "")
            intent = extracted_facts.get("intent", "")
            rel = extracted_facts.get("relationship", "")
            death = extracted_facts.get("death_occurred", False)

            if domain == "violent_crimes":
                if not death and "death" in intent:
                    expanded_concepts.update(["attempt to murder", "intention to cause death", "overt act towards murder"])
                elif death:
                    expanded_concepts.update(["culpable homicide amounting to murder", "punishment for murder"])

            if rel == "spouse":
                expanded_concepts.update(["husband or relative of husband subjecting woman to cruelty", "spousal violence"])

            if domain == "property_crimes":
                expanded_concepts.update(["dishonest taking of movable property", "theft", "unlawful gain"])

        if not expanded_concepts:
            expanded_concepts.update([user_input, "cognizable offence", "penal provision"])

        # Optional LLM Expansion
        if self.llm_provider and self.llm_provider.is_available():
            try:
                system_prompt = (
                    "You are a Legal Concept Expander for Indian Penal Code (BNS). "
                    "Given a user crime description, return ONLY a JSON array of 3-5 statutory legal concepts or phrase synonyms under Indian law. "
                    "Example: ['attempt to murder', 'spousal cruelty', 'intention to cause death']."
                )
                llm_concepts = self.llm_provider.generate_structured(user_input, system_prompt=system_prompt)
                if isinstance(llm_concepts, list):
                    expanded_concepts.update(llm_concepts)
                elif isinstance(llm_concepts, dict) and "concepts" in llm_concepts:
                    expanded_concepts.update(llm_concepts["concepts"])
            except Exception as e:
                print(f"[LegalQueryExpander] LLM expansion fallback: {e}")

        return list(expanded_concepts)


if __name__ == "__main__":
    expander = LegalQueryExpander()
    print("\n--- Legal Query Expander Test ---")
    print("Input: 'my husband tried to kill me'")
    print("Concepts:", expander.expand_query("my husband tried to kill me"))
    print("\nInput: 'someone stole my bike'")
    print("Concepts:", expander.expand_query("someone stole my bike"))
