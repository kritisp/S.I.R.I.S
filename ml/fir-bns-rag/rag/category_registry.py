from typing import Dict, List, Any


class CategoryRegistry:
    """
    Centralized Investigation Knowledge Category Registry.
    Scalable directory of all police investigation SOP domains (12 total categories).
    """
    CATEGORIES: Dict[str, Dict[str, Any]] = {
        # --- Existing Categories ---
        "property_crimes": {
            "name": "Property Crimes",
            "description": "Housebreaking, theft, burglary, stolen property recovery under BNSS 107",
            "bns_keywords": ["theft", "stolen", "burglary", "trespass", "house", "dwelling", "goods", "jewellery", "property"],
            "bns_sections": ["301", "302", "303", "304", "305", "327", "328", "329", "330", "331"]
        },
        "violent_crimes": {
            "name": "Violent Crimes & Homicide",
            "description": "Homicide, murder, attempt to murder (Sec 109 BNS), assault, bodily injuries, weapon seizure, post-mortem/MLC procedures",
            "bns_keywords": ["murder", "homicide", "kill", "tried to kill", "attempt to murder", "hurt", "injury", "assault", "weapon", "blood", "stabbed", "beaten", "death", "poison", "strangled"],
            "bns_sections": ["99", "101", "102", "103", "104", "109", "114", "115", "117", "118"]
        },
        "cyber_crimes": {
            "name": "Cyber & Digital Crimes",
            "description": "Digital evidence preservation, IP tracing, ISP freeze notices, crypto/phishing logs",
            "bns_keywords": ["cyber", "phishing", "online", "hacked", "computer", "mobile", "digital", "internet", "data"],
            "bns_sections": ["202"]
        },
        "financial_crimes": {
            "name": "Financial & White-Collar Crimes",
            "description": "Bank fraud, forensic accounting, shell companies, handwriting forgery (SEQD)",
            "bns_keywords": ["cheating", "fraud", "forgery", "bank", "scam", "counterfeit", "money", "audit", "account"],
            "bns_sections": ["318", "336", "337", "338"]
        },
        "offences_against_women": {
            "name": "Offences Against Women & Domestic Violence",
            "description": "Cruelty by husband/relatives (Sec 85 BNS), sexual assault, modesty violations, female officer recording (Sec 183 BNSS)",
            "bns_keywords": ["husband", "wife", "spouse", "cruelty", "woman", "modesty", "rape", "molest", "dowry", "stalking", "harassment", "female"],
            "bns_sections": ["63", "64", "74", "75", "76", "77", "84", "85", "86"]
        },
        "missing_persons": {
            "name": "Missing Persons & Kidnapping",
            "description": "TrackChild portal registration, ZIPNET alerts, tower location & CDR tracing",
            "bns_keywords": ["missing", "kidnapped", "abducted", "disappeared", "runaway", "untraced"],
            "bns_sections": ["137", "138", "140"]
        },
        "evidence_management": {
            "name": "Evidence Management & Chain of Custody",
            "description": "Malkhana register chain of custody (Form 108), FSL dispatch protocols",
            "bns_keywords": ["evidence", "malkhana", "seizure", "chain of custody", "fsl", "sample", "parcel"],
            "bns_sections": []
        },
        "crime_scene_investigation": {
            "name": "Crime Scene Investigation (General)",
            "description": "Spot inspection grid search, 360° photography/videography (Sec 105 BNSS)",
            "bns_keywords": ["crime scene", "spot inspection", "photography", "videography", "grid search", "panchnama"],
            "bns_sections": []
        },

        # --- New High-Priority Categories ---
        "organized_crime": {
            "name": "Organized Crime & Gangster Operations",
            "description": "Syndicate operations, extortion rackets, land grabbing, snatching gangs (BNS Sec 111/112)",
            "bns_keywords": ["organized crime", "gangster", "syndicate", "extortion", "racket", "gang", "mafia", "land grabbing"],
            "bns_sections": ["111", "112", "308", "311"]
        },
        "traffic_accidents": {
            "name": "Traffic Accidents & Hit-and-Run",
            "description": "Hit-and-run, fatal road accidents, rash driving, vehicle mechanical inspection (BNS Sec 106(2)/281)",
            "bns_keywords": ["accident", "hit and run", "vehicle", "rash driving", "car crash", "speeding", "collision"],
            "bns_sections": ["106", "281"]
        },
        "offences_against_children": {
            "name": "Offences Against Children & POCSO",
            "description": "Child abuse, child trafficking (Sec 143 BNS), POCSO Act, child welfare committee procedures",
            "bns_keywords": ["child", "minor", "pocso", "trafficking of child", "juvenile", "infant", "child abuse"],
            "bns_sections": ["93", "94", "139", "143"]
        },
        "narcotics_ndps": {
            "name": "Narcotics & Psychotropic Substances",
            "description": "Drug seizures, NDPS Act, field testing kits, magistrate sample inventory under BNSS 105/185",
            "bns_keywords": ["narcotics", "drugs", "psychotropic", "ndps", "contraband", "ganja", "heroin", "smuggling", "powder", "substance", "opium", "cocaine", "meth"],
            "bns_sections": []
        }
    }

    @classmethod
    def get_categories_for_bns(cls, bns_offences: List[Dict[str, Any]], case_keywords: List[str] = None) -> List[str]:
        """
        Routes BNS offences and case keywords to matching investigation categories.
        """
        matched_categories = set()
        case_text = " ".join(case_keywords or []).lower()

        for off in bns_offences:
            sec_num = str(off.get("section", "")).replace("Section ", "").strip()
            title_lower = off.get("title", "").lower()

            for cat_id, cat_info in cls.CATEGORIES.items():
                if sec_num in cat_info["bns_sections"]:
                    matched_categories.add(cat_id)
                elif any(kw in title_lower for kw in cat_info["bns_keywords"]):
                    matched_categories.add(cat_id)

        for cat_id, cat_info in cls.CATEGORIES.items():
            if any(kw in case_text for kw in cat_info["bns_keywords"]):
                matched_categories.add(cat_id)

        # Defaults for comprehensive coverage
        if not matched_categories:
            matched_categories.add("property_crimes")

        matched_categories.update(["crime_scene_investigation", "evidence_management"])
        return list(matched_categories)


if __name__ == "__main__":
    mock_bns = [
        {"section": "Section 111", "title": "Organized crime"},
        {"section": "Section 106", "title": "Causing death by negligence"}
    ]
    routed = CategoryRegistry.get_categories_for_bns(mock_bns)
    print("\n--- Routed Categories for Mock BNS Offences ---")
    for r in routed:
        print(f"  • {r}: {CategoryRegistry.CATEGORIES[r]['name']}")
