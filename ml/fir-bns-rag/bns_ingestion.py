import os
import re
import json
from typing import List, Dict, Any
import pypdf
from langchain_core.documents import Document

# High-Precision Statutory Metadata Registry for BNS Sections
BNS_INTELLIGENCE_REGISTRY = {
    "109": {
        "title": "Attempt to murder",
        "crime_category": "violent_crimes",
        "legal_elements": ["intention to cause death", "knowledge that act may cause death", "overt act towards murder", "victim survives"],
        "acts": ["stab", "shoot", "poison", "strangle", "attack", "burn", "choke"],
        "intent_keywords": ["kill", "murder", "death", "life threat"],
        "exclusions": ["death occurred", "suicide", "self harm"]
    },
    "103": {
        "title": "Punishment for murder",
        "crime_category": "violent_crimes",
        "legal_elements": ["intention to cause death", "death occurred", "culpable homicide amounting to murder"],
        "acts": ["stab", "shoot", "poison", "strangle", "fatal assault", "beating to death"],
        "intent_keywords": ["murder", "fatal harm", "killing"],
        "exclusions": ["victim alive", "suicide", "accidental death"]
    },
    "106": {
        "title": "Abetment of suicide",
        "crime_category": "violent_crimes",
        "legal_elements": ["abetment of suicide", "victim committed suicide", "instigation/encouragement"],
        "acts": ["instigate suicide", "drive to suicide", "abet suicide"],
        "intent_keywords": ["suicide", "self harm", "end life"],
        "exclusions": ["murder", "attempt to murder", "victim alive", "physical homicide by accused"]
    },
    "85": {
        "title": "Husband or relative of husband of a woman subjecting her to cruelty",
        "crime_category": "offences_against_women",
        "legal_elements": ["husband or relative of husband", "subjecting woman to cruelty", "physical or mental harm", "dowry harassment"],
        "acts": ["assault wife", "harass for dowry", "domestic violence", "beat spouse"],
        "intent_keywords": ["cruelty", "domestic harm", "harassment", "dowry"],
        "exclusions": ["stranger accused", "no marital relationship"]
    },
    "303": {
        "title": "Theft",
        "crime_category": "property_crimes",
        "legal_elements": ["dishonest intention to take movable property", "property taken out of possession", "without consent"],
        "acts": ["stole", "take property", "snatch", "pickpocket", "housebreak"],
        "intent_keywords": ["theft", "stolen", "unlawful gain"],
        "exclusions": ["violent force against person", "extortion under threat"]
    },
    "305": {
        "title": "Theft in dwelling house, etc.",
        "crime_category": "property_crimes",
        "legal_elements": ["theft committed in dwelling house/building/vessel", "movable property stolen"],
        "acts": ["enter house and steal", "burgle dwelling", "stole from residence"],
        "intent_keywords": ["dwelling theft", "house theft", "residence burglary"],
        "exclusions": ["open street snatching"]
    },
    "318": {
        "title": "Cheating",
        "crime_category": "financial_crimes",
        "legal_elements": ["deceiving any person", "fraudulent or dishonest inducement", "delivery of property"],
        "acts": ["fake banking link", "phishing", "online scam", "fraudulent transaction", "impersonate"],
        "intent_keywords": ["cheating", "fraud", "deceit", "scam"],
        "exclusions": ["physical force", "burglary"]
    },
    "319": {
        "title": "Cheating by personation",
        "crime_category": "financial_crimes",
        "legal_elements": ["cheating by pretending to be another person", "substituting one person for another"],
        "acts": ["fake profile", "impersonate bank officer", "fake caller"],
        "intent_keywords": ["personation", "fake identity", "impersonation"],
        "exclusions": ["theft without deception"]
    },
    "115": {
        "title": "Voluntarily causing hurt",
        "crime_category": "violent_crimes",
        "legal_elements": ["doing act with intention of causing hurt", "bodily pain, disease or infirmity"],
        "acts": ["slap", "punch", "beat", "hit with hand"],
        "intent_keywords": ["cause hurt", "bodily pain", "injury"],
        "exclusions": ["death", "grievous weapon injury"]
    },
    "118": {
        "title": "Voluntarily causing hurt or grievous hurt by dangerous weapons or means",
        "crime_category": "violent_crimes",
        "legal_elements": ["causing hurt or grievous hurt", "using dangerous weapon/instrument"],
        "acts": ["stab with knife", "hit with iron rod", "acid attack", "firearm injury"],
        "intent_keywords": ["dangerous weapon", "grievous hurt", "weapon attack"],
        "exclusions": ["unarmed simple hurt"]
    },
    "281": {
        "title": "Rash driving or riding on a public way",
        "crime_category": "traffic_accidents",
        "legal_elements": ["driving vehicle on public way", "rash or negligent manner", "endangering human life"],
        "acts": ["speeding car", "run red light", "rash driving", "reckless driving", "car crash"],
        "intent_keywords": ["rash driving", "negligent driving", "traffic accident"],
        "exclusions": ["intentional homicide", "premeditated murder"]
    },
    "125": {
        "title": "Act endangering life or personal safety of others",
        "crime_category": "traffic_accidents",
        "legal_elements": ["doing act so rashly or negligently as to endanger human life"],
        "acts": ["fire gun in air", "reckless act", "drunk driving", "dangerous stunt"],
        "intent_keywords": ["endangering life", "negligent act", "reckless safety violation"],
        "exclusions": ["premeditated murder"]
    },
    "336": {
        "title": "Forgery",
        "crime_category": "financial_crimes",
        "legal_elements": ["making false document or electronic record", "intent to cause damage or fraud"],
        "acts": ["forge document", "fake deed", "forged signature", "fake certificate"],
        "intent_keywords": ["forgery", "fake document", "fraudulent record"],
        "exclusions": ["theft without document creation"]
    },
    "338": {
        "title": "Forgery of valuable security, will, etc.",
        "crime_category": "financial_crimes",
        "legal_elements": ["forging valuable security, will, or authority to receive money"],
        "acts": ["forge property deed", "forge cheque", "forge power of attorney"],
        "intent_keywords": ["valuable security forgery", "deed forgery"],
        "exclusions": ["simple physical theft"]
    },
    "308": {
        "title": "Extortion",
        "crime_category": "organized_crime",
        "legal_elements": ["intentionally putting person in fear of injury", "dishonestly inducing delivery of property"],
        "acts": ["demand extortion money", "hafta demand", "ransom threat", "blackmail"],
        "intent_keywords": ["extortion", "blackmail", "injury threat"],
        "exclusions": ["taking without knowledge or consent"]
    },
    "309": {
        "title": "Robbery",
        "crime_category": "property_crimes",
        "legal_elements": ["theft or extortion accompanied by causing or threatening death or hurt"],
        "acts": ["rob at gunpoint", "snatch at knifepoint", "hold up family", "forceful looting"],
        "intent_keywords": ["robbery", "gunpoint snatch", "armed looting"],
        "exclusions": ["simple theft without force or fear"]
    },
    "310": {
        "title": "Dacoity",
        "crime_category": "property_crimes",
        "legal_elements": ["five or more persons conjointly committing robbery"],
        "acts": ["gang robbery", "dacoity", "armed gang loot"],
        "intent_keywords": ["dacoity", "gang robbery"],
        "exclusions": ["individual thief"]
    },
    "111": {
        "title": "Organized crime",
        "crime_category": "organized_crime",
        "legal_elements": ["continuing unlawful activity by syndicate/gang", "violence, extortion, land grabbing"],
        "acts": ["gangster syndicate", "mafia extortion", "organized racket", "land grabbing"],
        "intent_keywords": ["organized crime", "syndicate", "gangster"],
        "exclusions": ["isolated single offender crime"]
    },
    "112": {
        "title": "Petty organized crime",
        "crime_category": "organized_crime",
        "legal_elements": ["snatching, pickpocketing, card skimming by gang/group"],
        "acts": ["snatching gang", "card skimming racket", "touting gang"],
        "intent_keywords": ["petty organized crime", "snatching gang"],
        "exclusions": ["homicide"]
    },
    "69": {
        "title": "Sexual intercourse by employing deceitful means, etc.",
        "crime_category": "offences_against_women",
        "legal_elements": ["sexual intercourse by deceitful means", "false promise of employment or marriage"],
        "acts": ["fake promise of marriage", "deceitful sexual relationship", "abandon after false promise"],
        "intent_keywords": ["deceitful promise of marriage", "false marriage promise"],
        "exclusions": ["valid legal marriage"]
    },
    "137": {
        "title": "Kidnapping",
        "crime_category": "offences_against_children",
        "legal_elements": ["taking or enticing minor out of keeping of lawful guardian"],
        "acts": ["kidnap minor", "lure child into car", "abduct child"],
        "intent_keywords": ["kidnapping", "abduction of minor"],
        "exclusions": ["lawful custody by parent"]
    },
    "140": {
        "title": "Kidnapping or abducting for ransom, etc.",
        "crime_category": "offences_against_children",
        "legal_elements": ["kidnapping or abducting person", "demanding ransom under threat of death"],
        "acts": ["child ransom kidnap", "demand ransom for victim"],
        "intent_keywords": ["ransom kidnapping", "child hostage"],
        "exclusions": ["simple property dispute"]
    },
    "178": {
        "title": "Counterfeiting coin, government stamp, currency-notes or bank-notes",
        "crime_category": "financial_crimes",
        "legal_elements": ["counterfeiting currency notes or government stamps"],
        "acts": ["print fake notes", "counterfeit currency", "fake 500 note"],
        "intent_keywords": ["counterfeit currency", "fake notes"],
        "exclusions": ["legitimate money transaction"]
    },
    "179": {
        "title": "Using as genuine, forged or counterfeit coin, government stamp, currency-notes or bank-notes",
        "crime_category": "financial_crimes",
        "legal_elements": ["using as genuine forged/counterfeit currency or stamp"],
        "acts": ["spend fake note", "pass fake currency at market"],
        "intent_keywords": ["fake note circulation", "counterfeit usage"],
        "exclusions": ["unknowing accidental possession"]
    },
    "189": {
        "title": "Unlawful assembly",
        "crime_category": "public_order",
        "legal_elements": ["assembly of five or more persons with common unlawful object"],
        "acts": ["mob attack", "unlawful mob gathering", "violently attack government office"],
        "intent_keywords": ["unlawful assembly", "mob violence"],
        "exclusions": ["peaceful lawful gathering"]
    },
    "191": {
        "title": "Rioting",
        "crime_category": "public_order",
        "legal_elements": ["force or violence used by unlawful assembly"],
        "acts": ["pelt stones", "throw petrol bombs", "rioting"],
        "intent_keywords": ["rioting", "mob riot"],
        "exclusions": ["peaceful protest"]
    },
    "324": {
        "title": "Mischief by fire or explosive substance",
        "crime_category": "property_crimes",
        "legal_elements": ["causing destruction of property by fire or explosive"],
        "acts": ["set fire to house", "arson", "burn storehouse"],
        "intent_keywords": ["arson", "mischief by fire"],
        "exclusions": ["accidental fire"]
    },
    "326": {
        "title": "Mischief causing damage to property",
        "crime_category": "property_crimes",
        "legal_elements": ["destroying property or causing damage"],
        "acts": ["damage vehicle", "break property", "destroy crops"],
        "intent_keywords": ["mischief", "property damage"],
        "exclusions": ["accidental damage"]
    },
    "316": {
        "title": "Criminal breach of trust",
        "crime_category": "financial_crimes",
        "legal_elements": ["dishonest misappropriation of property entrusted"],
        "acts": ["employee siphon funds", "misappropriate entrusted account", "cashier steal funds"],
        "intent_keywords": ["criminal breach of trust", "entrusted property theft"],
        "exclusions": ["stranger theft without entrustment"]
    },
    "317": {
        "title": "Dishonestly receiving stolen property",
        "crime_category": "property_crimes",
        "legal_elements": ["receiving or retaining property knowing it to be stolen"],
        "acts": ["buy stolen bike", "scrap dealer receive stolen property"],
        "intent_keywords": ["stolen property receiving", "retaining stolen goods"],
        "exclusions": ["original thief"]
    },
    "117": {
        "title": "Voluntarily causing grievous hurt",
        "crime_category": "violent_crimes",
        "legal_elements": ["causing grievous hurt (fracture, disfigurement, dangerous injury)"],
        "acts": ["fracture arm with rod", "hit with hockey stick", "cause severe injury"],
        "intent_keywords": ["grievous hurt", "fracture", "severe physical harm"],
        "exclusions": ["simple bruise without fracture"]
    },
    "124": {
        "title": "Voluntarily causing grievous hurt by use of acid, etc.",
        "crime_category": "violent_crimes",
        "legal_elements": ["throwing acid causing permanent or partial damage or disfigurement"],
        "acts": ["throw acid on face", "acid attack"],
        "intent_keywords": ["acid attack", "acid disfigurement"],
        "exclusions": ["accidental chemical spill"]
    },
    "74": {
        "title": "Assault or use of criminal force to woman with intent to outrage her modesty",
        "crime_category": "offences_against_women",
        "legal_elements": ["assaulting woman with intent to outrage modesty"],
        "acts": ["molest woman", "groping woman", "outrage modesty"],
        "intent_keywords": ["outrage modesty", "molestation"],
        "exclusions": ["verbal dispute without criminal force"]
    },
    "78": {
        "title": "Stalking",
        "crime_category": "offences_against_women",
        "legal_elements": ["following or contacting woman repeatedly despite clear disinterest"],
        "acts": ["stalk female student", "follow woman constantly", "cyber stalk"],
        "intent_keywords": ["stalking", "follow woman"],
        "exclusions": ["single accidental encounter"]
    },
    "304": {
        "title": "Snatching",
        "crime_category": "property_crimes",
        "legal_elements": ["suddenly, quickly or forcibly seizing or taking away movable property"],
        "acts": ["snatch gold chain", "snatch mobile on road"],
        "intent_keywords": ["snatching", "chain snatching"],
        "exclusions": ["pickpocketing without sudden force"]
    },
    "351": {
        "title": "Criminal intimidation",
        "crime_category": "general_penal",
        "legal_elements": ["threatening person with injury to person, reputation or property"],
        "acts": ["threaten neighbour", "verbal death threat", "intimidate victim"],
        "intent_keywords": ["criminal intimidation", "threat"],
        "exclusions": ["physical attack already committed"]
    },
    "274": {
        "title": "Adulteration of food or drink intended for sale",
        "crime_category": "public_order",
        "legal_elements": ["adulterating food or drink to make it noxious"],
        "acts": ["adulterate milk with chemicals", "sell toxic food"],
        "intent_keywords": ["adulteration of food", "noxious food"],
        "exclusions": ["pure unadulterated food"]
    },
    "275": {
        "title": "Sale of noxious food or drink",
        "crime_category": "public_order",
        "legal_elements": ["selling food or drink known to be noxious or unfit"],
        "acts": ["sell adulterated milk", "sell expired poisonous food"],
        "intent_keywords": ["noxious food sale", "adulterated food"],
        "exclusions": ["unintentional accidental sale"]
    }
}


def extract_section_legal_metadata(sec_num: str, sec_title: str, section_raw_text: str, current_chapter: str) -> Dict[str, Any]:
    """Generates enriched legal metadata dictionary for a given BNS section."""
    sec_key = str(sec_num).strip()
    if sec_key in BNS_INTELLIGENCE_REGISTRY:
        meta = BNS_INTELLIGENCE_REGISTRY[sec_key]
        return {
            "crime_category": meta["crime_category"],
            "legal_elements": meta["legal_elements"],
            "acts": meta["acts"],
            "intent_keywords": meta["intent_keywords"],
            "exclusions": meta["exclusions"]
        }

    # Heuristic metadata extraction for unlisted sections
    text_lower = (sec_title + " " + section_raw_text).lower()
    ch_lower = current_chapter.lower()

    if any(k in text_lower for k in ["theft", "stolen", "robbery", "dacoity", "trespass", "house", "extortion", "cheating"]):
        crime_category = "property_crimes"
    elif any(k in text_lower for k in ["murder", "homicide", "hurt", "assault", "kidnapping", "death", "injury"]):
        crime_category = "violent_crimes"
    elif any(k in text_lower for k in ["woman", "rape", "marriage", "modesty", "dowry", "sexual", "female"]):
        crime_category = "offences_against_women"
    elif any(k in text_lower for k in ["child", "minor", "pocso", "juvenile"]):
        crime_category = "offences_against_children"
    elif any(k in text_lower for k in ["fraud", "forgery", "counterfeit", "bank", "cheating"]):
        crime_category = "financial_crimes"
    elif any(k in text_lower for k in ["cyber", "computer", "digital"]):
        crime_category = "cyber_crimes"
    else:
        crime_category = "general_penal"

    legal_elements = []
    if "intention" in text_lower or "dishonest" in text_lower:
        legal_elements.append("Criminal Intention (Mens Rea)")
    if "property" in text_lower:
        legal_elements.append("Property Involved")
    if "hurt" in text_lower or "injury" in text_lower:
        legal_elements.append("Bodily Hurt / Injury")
    if "death" in text_lower:
        legal_elements.append("Death Caused")

    acts = [w for w in ["stole", "hit", "attacked", "forged", "cheated", "damaged"] if w in text_lower]
    intent_keywords = [w for w in ["unlawful gain", "hurt", "harm", "death", "fraud"] if w in text_lower]
    exclusions = []

    return {
        "crime_category": crime_category,
        "legal_elements": legal_elements or ["Statutory offence provisions"],
        "acts": acts or [sec_title.lower()],
        "intent_keywords": intent_keywords or ["criminal intent"],
        "exclusions": exclusions
    }


def load_and_parse_bns(pdf_path: str = "documents/BNS_2023.pdf") -> List[Document]:
    """
    Legal-aware parser for Bharatiya Nyaya Sanhita (BNS), 2023 (Substantive Penal Offences).
    Extracts structured Section Number, Section Title, Chapter, Crime Category, Legal Ingredients, Acts, Intent, and Exclusions.
    """
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"BNS PDF file not found at: {pdf_path}")

    reader = pypdf.PdfReader(pdf_path)
    full_text = "\n".join([page.extract_text() for page in reader.pages if page.extract_text()])

    body_offset = 10000
    body_text = full_text[body_offset:]

    section_pattern = r'\n(\d{1,3})\.\s+([A-Z][^\n]+?)(?=\.\s*[\(—\n]|\s*—|\s*\n)'
    matches = list(re.finditer(section_pattern, body_text))

    chapter_pattern = r'(CHAPTER\s+[I|V|X|L|C|D|M]+\b[^\n]*)'
    chapter_matches = list(re.finditer(chapter_pattern, body_text))

    documents: List[Document] = []

    for i, match in enumerate(matches):
        sec_num = match.group(1)
        sec_title = match.group(2).strip().rstrip('.').rstrip('—')
        start_idx = match.start()
        end_idx = matches[i + 1].start() if i + 1 < len(matches) else len(body_text)

        section_raw_text = body_text[start_idx:end_idx].strip()

        current_chapter = "CHAPTER I - PRELIMINARY"
        for ch_match in chapter_matches:
            if ch_match.start() < start_idx:
                current_chapter = ch_match.group(1).strip()
            else:
                break

        legal_meta = extract_section_legal_metadata(sec_num, sec_title, section_raw_text, current_chapter)

        elements_str = "; ".join(legal_meta["legal_elements"])
        acts_str = ", ".join(legal_meta["acts"])
        intent_str = ", ".join(legal_meta["intent_keywords"])
        exclusions_str = ", ".join(legal_meta["exclusions"]) if legal_meta["exclusions"] else "None"

        keywords_str = f"{sec_title}, {legal_meta['crime_category']}, {acts_str}, {intent_str}, {elements_str}"

        structured_content = (
            f"BNS (Bharatiya Nyaya Sanhita, 2023) Section {sec_num}: {sec_title}\n"
            f"Law: BNS (Substantive Penal Code)\n"
            f"Chapter: {current_chapter}\n"
            f"Category: {legal_meta['crime_category']}\n"
            f"Legal Elements: {elements_str}\n"
            f"Acts: {acts_str}\n"
            f"Intent Keywords: {intent_str}\n"
            f"Exclusions: {exclusions_str}\n\n"
            f"{section_raw_text}"
        )

        metadata = {
            "law": "BNS",
            "section_number": str(sec_num),
            "title": sec_title,
            "crime_category": legal_meta["crime_category"],
            "keywords": keywords_str,
            "legal_elements": json.dumps(legal_meta["legal_elements"]),
            "acts": json.dumps(legal_meta["acts"]),
            "intent_keywords": json.dumps(legal_meta["intent_keywords"]),
            "exclusions": json.dumps(legal_meta["exclusions"]),
            "chapter": current_chapter,
            "source": os.path.basename(pdf_path)
        }

        doc = Document(
            page_content=structured_content,
            metadata=metadata
        )
        documents.append(doc)

    print(f"Successfully parsed {len(documents)} structured BNS substantive offence sections with enriched legal metadata.")
    return documents


if __name__ == "__main__":
    docs = load_and_parse_bns()
    if docs:
        print("\n--- Sample Parsed BNS Section ---")
        print("Metadata:", docs[0].metadata)
        print("Content Header:\n", docs[0].page_content[:350])
