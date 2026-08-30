import re
from typing import Dict, List, Any


class QueryAnalyzer:
    """
    Analyzes raw user case descriptions prior to retrieval to extract structured criminal facts and targeted legal keywords.
    """
    def __init__(self):
        # Rule-based legal ontology keywords for Indian Criminal Law (BNS / BNSS / IPC / CrPC)
        self.crime_patterns = {
            "theft_burglary": [r"stole", r"stolen", r"jewellery", r"theft", r"entered.*house", r"break-in", r"housebreaking", r"trespass", r"cash"],
            "assault_hurt": [r"hit", r"beat", r"slapped", r"injured", r"hurt", r"grievous", r"attacked", r"weapon", r"knife", r"stick", r"rod"],
            "cheating_fraud": [r"cheated", r"fraud", r"forged", r"money.*scam", r"bank", r"phishing", r"fake", r"impersonat"],
            "homicide_attempt_murder": [r"kill", r"killed", r"dead", r"murder", r"tried.*kill", r"attempt.*kill", r"attempt.*murder", r"strangled", r"stabbed", r"poison"],
            "domestic_violence_cruelty": [r"husband", r"wife", r"spouse", r"cruelty", r"dowry", r"in-laws", r"domestic violence"],
            "extortion_robbery": [r"extort", r"robbed", r"snaffled", r"snatched", r"gunpoint", r"knifepoint", r"threatened.*money"],
            "sexual_offence": [r"molested", r"assaulted.*woman", r"rape", r"harass", r"stalked"],
            "custody_arrest_procedure": [r"arrest", r"police.*custody", r"detained", r"bail", r"warrant", r"fir", r"search"]
        }

    def analyze(self, user_input: str) -> Dict[str, Any]:
        """
        Extracts structured crime analysis dictionary from user case input.
        """
        text_lower = user_input.lower()

        # 1. Identify Crime Type
        detected_crimes = []
        for crime, patterns in self.crime_patterns.items():
            for p in patterns:
                if re.search(p, text_lower):
                    detected_crimes.append(crime.replace("_", " ").title())
                    break

        crime_type = ", ".join(detected_crimes) if detected_crimes else "General Offence / Procedure"

        # 2. Extract Actions Involved
        action_words = []
        action_keywords = ["entered", "stole", "broke", "snatched", "hit", "attacked", "threatened", "fled", "demanded", "took", "forged", "tried to kill", "kill", "strangled"]
        for act in action_keywords:
            if act in text_lower:
                action_words.append(act)
        actions_involved = ", ".join(action_words) if action_words else "Unspecified actions"

        # 3. Infer Intent
        intent = "Unlawful gain / Dishonest intention" if any(w in text_lower for w in ["stole", "stolen", "took", "extort", "robbed", "money", "jewellery", "cheat"]) else "Criminal intent / Voluntary harm"

        # 4. Extract Victim Information
        victim_info = "Informant / Homeowner / Aggrieved person" if any(w in text_lower for w in ["my", "me", "our", "house", "victim"]) else "Complainant"

        # 5. Extract Accused Information
        if "husband" in text_lower:
            accused_info = "Husband / Relative of husband"
        elif "unknown" in text_lower or "someone" in text_lower or "unidentified" in text_lower or "thief" in text_lower:
            accused_info = "Unknown / Unidentified person(s)"
        else:
            accused_info = "Named / Known suspect(s)"

        # 6. Extract Evidence Mentioned
        evidence_list = []
        if any(w in text_lower for w in ["jewellery", "cash", "property", "goods", "mobile", "car", "bike"]):
            evidence_list.append("Stolen property / Physical assets")
        if any(w in text_lower for w in ["cctv", "camera", "footage", "video"]):
            evidence_list.append("CCTV Video Footage")
        if any(w in text_lower for w in ["night", "darkness", "lock"]):
            evidence_list.append("Physical break-in marks / Broken lock")
        if any(w in text_lower for w in ["blood", "fingerprint", "weapon", "knife", "rod", "injury", "medical", "mlc"]):
            evidence_list.append("Forensic / Weapon / MLC Medical evidence")

        evidence_mentioned = ", ".join(evidence_list) if evidence_list else "Physical & Oral evidence to be collected"

        # 7. Generate Targeted Legal Keywords
        keywords_set = set()
        if "kill" in text_lower or "tried to kill" in text_lower or "attempt" in text_lower or "murder" in text_lower:
            keywords_set.update(["attempt to murder", "murder", "culpable homicide", "section 109 BNS", "section 103 BNS"])
        if "husband" in text_lower or "cruelty" in text_lower or "dowry" in text_lower:
            keywords_set.update(["cruelty by husband", "husband or relative of husband", "section 85 BNS", "domestic violence"])
        if "house" in text_lower or "entered" in text_lower or "night" in text_lower:
            keywords_set.update(["house trespass", "lurking house-trespass by night", "housebreaking"])
        if "stole" in text_lower or "jewellery" in text_lower or "theft" in text_lower:
            keywords_set.update(["theft", "stolen property", "dishonest intention"])
        if "arrest" in text_lower or "police" in text_lower:
            keywords_set.update(["cognizable offence", "arrest without warrant", "investigation procedure"])

        keywords = list(keywords_set) if keywords_set else ["cognizable offence", "investigation", "police report"]

        # Combined query text for hybrid dense/sparse search
        combined_search_query = f"{crime_type} {' '.join(keywords)} {user_input}"

        return {
            "raw_input": user_input,
            "crime_type": crime_type,
            "actions_involved": actions_involved,
            "intent": intent,
            "victim_info": victim_info,
            "accused_info": accused_info,
            "evidence_mentioned": evidence_mentioned,
            "keywords": keywords,
            "search_query": combined_search_query
        }


if __name__ == "__main__":
    analyzer = QueryAnalyzer()
    res = analyzer.analyze("Someone entered my house at night and stole my jewellery")
    print("\n--- Query Analyzer Test Output ---")
    for k, v in res.items():
        print(f"{k}: {v}")
