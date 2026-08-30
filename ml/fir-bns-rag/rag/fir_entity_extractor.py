import re
from typing import Dict, Any, List, Optional, Union

# Try importing LLMService if available in the project, else handle gracefully
try:
    from rag.llm import LLMService
except Exception:
    LLMService = None


class FIREntityExtractor:
    """
    Step 2: FIR Entity Extraction & NER Layer.
    Extracts structured legal metadata, entities, evidence, timeline, and MO
    from clean FIR text or FIRIntakeParser output.
    """

    def __init__(self, use_llm_fallback: bool = False):
        self.use_llm_fallback = use_llm_fallback

    def extract(self, fir_input: Union[str, Dict[str, Any]]) -> Dict[str, Any]:
        """
        Main extraction entrypoint. Accepts raw text string or output dict from FIRIntakeParser.
        """
        if isinstance(fir_input, dict):
            text = fir_input.get("full_text", "")
            source_name = fir_input.get("source_name", "unknown")
            total_pages = fir_input.get("total_pages", 1)
        else:
            text = str(fir_input)
            source_name = "raw_text"
            total_pages = 1

        # 1. Regex & Deterministic Extractions
        fir_metadata = self._extract_fir_metadata(text)
        phones = self._extract_phone_numbers(text)
        vehicles = self._extract_vehicle_numbers(text)
        people = self._extract_people(text)
        incident = self._extract_incident(text)
        evidence_dict = self._extract_evidence_and_objects(text)
        timeline = self._extract_timeline(text)
        mo = self._extract_modus_operandi(text)
        locations = self._extract_locations(text, incident.get("incident_location"))

        # 2. Missing Information Tracker
        missing_information = self._identify_missing_information(
            fir_metadata, people, incident, evidence_dict, timeline
        )

        result = {
            "source_metadata": {
                "source_name": source_name,
                "total_pages": total_pages,
                "text_length": len(text)
            },
            "fir_metadata": fir_metadata,
            "people": people,
            "incident": incident,
            "timeline": timeline,
            "modus_operandi": mo,
            "weapons": evidence_dict["weapons"],
            "property": evidence_dict["property"],
            "evidence": evidence_dict["evidence"],
            "phones": phones,
            "vehicles": vehicles,
            "locations": locations,
            "missing_information": missing_information
        }

        return result

    # -------------------------------------------------------------------------
    # Internal Extractors
    # -------------------------------------------------------------------------

    def _extract_fir_metadata(self, text: str) -> Dict[str, Any]:
        """Extract FIR No, Police Station, Date, and Sections Mentioned."""
        fir_no = None
        m_fir = re.search(r"(?:FIR\s*(?:No\.?|Number|#)\s*[:\-]?\s*)([A-Z0-9\/\-\_]+)", text, re.IGNORECASE)
        if m_fir:
            fir_no = m_fir.group(1).strip().rstrip(".,")

        ps = None
        m_ps = re.search(r"(?:P\.?S\.?|Police\s*Station|Thana)\s*[:\-]?\s*([A-Za-z\s]+?)(?=\s*(?:District|Dist\.?|City|Year|State|FIR|Date|\n|,|\.))", text, re.IGNORECASE)
        if m_ps:
            ps = m_ps.group(1).strip()

        fir_date = None
        m_date = re.search(r"(?:FIR\s*Date|Date\s*of\s*FIR|Date\s*:\s*|Dated\s*:\s*)(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})", text, re.IGNORECASE)
        if m_date:
            fir_date = m_date.group(1).strip()
        else:
            m_date_gen = re.search(r"\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b", text[:500])
            if m_date_gen:
                fir_date = m_date_gen.group(1).strip()

        # Sections mentioned in FIR text
        sections_mentioned = []
        sec_matches = re.findall(
            r"(?:(?:Sec\.?|Section|u\/s|under\s+section)\s*(\d{1,3}(?:\([a-zA-Z0-9]+\))*))",
            text,
            re.IGNORECASE
        )
        for s in sec_matches:
            sec_formatted = f"Section {s}"
            if sec_formatted not in sections_mentioned:
                sections_mentioned.append(sec_formatted)

        law_mentions = []
        if re.search(r"\bBNS\b|Bharatiya\s*Nyaya\s*Sanhita", text, re.IGNORECASE):
            law_mentions.append("BNS")
        if re.search(r"\bIPC\b|Indian\s*Penal\s*Code", text, re.IGNORECASE):
            law_mentions.append("IPC")
        if re.search(r"\bBNSS\b|Bharatiya\s*Nagarik\s*Suraksha", text, re.IGNORECASE):
            law_mentions.append("BNSS")
        if re.search(r"\bNDPS\b", text, re.IGNORECASE):
            law_mentions.append("NDPS Act")
        if re.search(r"\bArms\s*Act\b", text, re.IGNORECASE):
            law_mentions.append("Arms Act")

        return {
            "fir_number": fir_no,
            "police_station": ps,
            "fir_date": fir_date,
            "laws_mentioned": law_mentions,
            "sections_mentioned": sections_mentioned
        }

    def _extract_phone_numbers(self, text: str) -> List[str]:
        """Extract valid Indian phone numbers."""
        phones = []
        pattern = r"(?:\+91[\-\s]?)?[6-9]\d{9}\b"
        matches = re.findall(pattern, text)
        for p in matches:
            clean_p = re.sub(r"[\s\-]", "", p)
            if clean_p not in phones:
                phones.append(clean_p)
        return phones

    def _extract_vehicle_numbers(self, text: str) -> List[str]:
        """Extract Indian Vehicle Registration numbers (e.g. DL-01-AB-1234, HR26DQ5555)."""
        vehicles = []
        pattern = r"\b([A-Z]{2}[-\s]?[0-9]{1,2}[-\s]?[A-Z]{1,3}[-\s]?[0-9]{4})\b"
        matches = re.findall(pattern, text)
        for v in matches:
            norm_v = re.sub(r"[\s\-]", "", v).upper()
            if norm_v not in vehicles:
                vehicles.append(norm_v)
        return vehicles

    def _extract_people(self, text: str) -> Dict[str, Any]:
        """Extract Complainant, Victims, Accused/Suspects, and Witnesses with descriptions/relationships."""
        people = {
            "complainant": None,
            "victims": [],
            "accused": [],
            "witnesses": []
        }

        # 1. Complainant Extraction — structured field first, then narrative fallback
        m_comp = re.search(
            r"(?:4\.\s*)?(?:Complainant\s*(?:\/Informant)?|Informant)\s*[:\-]?\s*([^\n\r]+)",
            text,
            re.IGNORECASE
        )
        if m_comp:
            line_val = m_comp.group(1).strip()
            name_part = re.split(r"(?:,\s*(?:Ph|Phone|Mob|Mobile|Age|r\/o|Address|s\/o|d\/o|w\/o)|;\s*)", line_val, flags=re.IGNORECASE)[0].strip()
            if name_part:
                people["complainant"] = {
                    "name": name_part,
                    "details": line_val,
                    "role": "Complainant / Informant",
                    "relationship": self._detect_relationship(name_part, text)
                }

        # Narrative fallback: "NAME reported that" / "NAME, the complainant, stated"
        if not people["complainant"]:
            m_narr_comp = re.search(
                r"\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})\s*(?:,\s*the\s*complainant[,\s]|reported\s*that|lodged\s*a\s*complaint|stated\s*that|deposed\s*that)",
                text
            )
            if m_narr_comp:
                narr_name = m_narr_comp.group(1).strip()
                people["complainant"] = {
                    "name": narr_name,
                    "details": narr_name,
                    "role": "Complainant / Informant",
                    "relationship": self._detect_relationship(narr_name, text)
                }

        # 2. Accused / Suspects Extraction
        m_acc = re.search(
            r"(?:5\.\s*)?(?:Details\s*of\s*Suspect(?:s)?|Accused\s*(?:Details)?|Suspect(?:s)?)\s*[:\-]?\s*([^\n\r]+)",
            text,
            re.IGNORECASE
        )
        if m_acc:
            acc_line = m_acc.group(1).strip()
            if re.search(r"unknown|unidentified|not\s*known|untraced", acc_line, re.IGNORECASE):
                people["accused"].append({
                    "name": "Unknown / Unidentified person(s)",
                    "description": acc_line,
                    "is_identified": False,
                    "relationship": "stranger"
                })
            else:
                # Validate that the accused line starts with a plausible proper name
                # (a capitalized word). Reject verb/preposition phrases like "leaving the area"
                candidate_name = acc_line.split(",")[0].strip()
                is_proper_name = bool(re.match(r"[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*", candidate_name))
                if is_proper_name:
                    people["accused"].append({
                        "name": candidate_name,
                        "description": acc_line,
                        "is_identified": True,
                        "relationship": self._detect_relationship(acc_line, text)
                    })
                else:
                    # Not a valid name — treat as unknown
                    people["accused"].append({
                        "name": "Unknown / Unidentified person(s)",
                        "description": acc_line,
                        "is_identified": False,
                        "relationship": "stranger"
                    })

        # Narrative fallback: unknown suspects mentioned in body text
        if not people["accused"]:
            if re.search(r"\b(?:unknown\s*(?:persons?|men|thief|attackers?|assailants?)|unidentified\s*suspects?|untraced\s*accused)\b", text, re.IGNORECASE):
                people["accused"].append({
                    "name": "Unknown / Unidentified person(s)",
                    "description": "Suspects mentioned as unknown in narrative",
                    "is_identified": False,
                    "relationship": "stranger"
                })

        # 3. Victims
        if people["complainant"]:
            people["victims"].append({
                "name": people["complainant"]["name"],
                "description": "Complainant is the direct aggrieved party/victim",
                "relationship_to_accused": people["complainant"]["relationship"]
            })
        m_vic = re.search(r"(?:Victim(?:s)?|Injured\s*Person(?:s)?)\s*[:\-]?\s*([^\n\r\.]+)", text, re.IGNORECASE)
        if m_vic:
            vic_name = m_vic.group(1).strip()
            if not any(v["name"] == vic_name for v in people["victims"]):
                people["victims"].append({
                    "name": vic_name,
                    "description": "Named victim in FIR",
                    "relationship_to_accused": self._detect_relationship(vic_name, text)
                })

        # 4. Witnesses: Dedicated field or narrative mentions
        # Use re.finditer (not re.search) so all "Witness X" mentions in the FIR are captured,
        # not just the first occurrence. Word boundary prevents matching mid-word "witnessed".
        for m_wit_field in re.finditer(
            r"\b(?:Witness(?:es)?|Eyewitness(?:es)?)\b\s*[:\-]?\s*([^\n\r\.]+)", text, re.IGNORECASE
        ):
            raw_w = m_wit_field.group(1).strip()
            if raw_w and raw_w.lower() not in ["none", "nil", "n/a"]:
                # Strip leading label word if the captured group starts with "Witness"/"Eyewitness"
                # e.g. "Witness Suresh saw..." -> "Suresh saw..."
                raw_w = re.sub(r"^(?:Eyewitness(?:es)?|Witness(?:es)?)\s+", "", raw_w, flags=re.IGNORECASE).strip()
                # Extract only the name portion — stop at the first verb or non-name word
                # e.g. "Suresh saw the suspects" -> "Suresh"
                name_only_m = re.match(r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})", raw_w)
                clean_w = name_only_m.group(1).strip() if name_only_m else raw_w.split()[0]
                # Require at least 3 chars to reject partial-match artifacts like "ed"
                if clean_w and len(clean_w) >= 3 and clean_w.lower() not in ["none", "nil", "n/a"]:
                    people["witnesses"].append({
                        "name": clean_w,
                        "role": "Eyewitness / Spot Witness"
                    })

        # Narrative witness patterns:
        # Pattern A: "neighbor/neighbour/eyewitness NAME witnessed/saw"
        # NOTE: "by" is intentionally excluded — too broad and causes false matches.
        m_narr_wit = re.findall(
            r"(?:neighbor|neighbour|eyewitness)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:witnessed|saw|noticed|spotted)",
            text
        )
        for nw in m_narr_wit:
            clean_nw = nw.strip()
            if len(clean_nw) > 2 and clean_nw.lower() not in ["the", "who", "which", "and", "they", "he", "she"]:
                if not any(w["name"].lower() == clean_nw.lower() for w in people["witnesses"]):
                    people["witnesses"].append({"name": clean_nw, "role": "Eyewitness (from narrative)"})

        # Pattern B: "NAME witnessed/saw them" (name before verb)
        m_narr_wit2 = re.findall(
            r"\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:witnessed|saw|noticed|spotted)\s+(?:them|the|accused|suspects)",
            text
        )
        for nw in m_narr_wit2:
            clean_nw = nw.strip()
            if clean_nw and not any(w["name"].lower() == clean_nw.lower() for w in people["witnesses"]):
                people["witnesses"].append({"name": clean_nw, "role": "Eyewitness (from narrative)"})

        # Deduplicate witnesses by their normalized full name.
        # Normalization strips leading label words ("Witness", "Eyewitness") before comparison
        # so "Witness Suresh" and "Suresh" are treated as the same person.
        def _norm_witness_name(raw: str) -> str:
            cleaned = re.sub(r"^(?:Eyewitness(?:es)?|Witness(?:es)?)\s+", "", raw, flags=re.IGNORECASE).strip()
            return cleaned.lower()

        seen_names: set = set()
        deduped = []
        for w in people["witnesses"]:
            norm = _norm_witness_name(w["name"])
            if norm not in seen_names:
                seen_names.add(norm)
                # Also store the cleaner (shorter) version of the name
                w["name"] = re.sub(r"^(?:Eyewitness(?:es)?|Witness(?:es)?)\s+", "", w["name"], flags=re.IGNORECASE).strip()
                deduped.append(w)
        people["witnesses"] = deduped

        return people

    def _detect_relationship(self, entity_text: str, full_text: str) -> str:
        """
        Detect relationship using a LOCAL context window around the entity name.

        Using the entire FIR text caused false positives because relationship words
        appearing anywhere in the document (e.g. "persons" containing "son",
        "neighbor Suresh" when checking Rajesh Kumar) were incorrectly assigned.

        Fix: extract a ±250 char window around the entity name and apply
        word-boundary regex matches within that window only.
        """
        LOCAL_WINDOW = 250

        # Locate the entity in the text (case-insensitive)
        entity_lower = entity_text.lower()
        text_lower = full_text.lower()
        pos = text_lower.find(entity_lower)
        if pos >= 0:
            start = max(0, pos - LOCAL_WINDOW)
            end = min(len(full_text), pos + len(entity_text) + LOCAL_WINDOW)
            context = text_lower[start:end]
        else:
            # Entity not found verbatim — fall back to the entity text itself only
            context = entity_lower

        def _word_in(word: str, ctx: str) -> bool:
            """True if 'word' appears as a whole word in ctx."""
            return bool(re.search(r"\b" + re.escape(word) + r"\b", ctx))

        if any(_word_in(w, context) for w in ["husband", "wife", "spouse", "partner"]):
            return "spouse"
        if any(_word_in(w, context) for w in ["in-law", "father-in-law", "mother-in-law",
                                               "brother-in-law", "sister-in-law"]):
            return "in-law"
        if any(_word_in(w, context) for w in ["relative", "uncle", "aunt", "cousin",
                                               "brother", "sister", "son", "daughter",
                                               "father", "mother"]):
            return "relative"
        if any(_word_in(w, context) for w in ["neighbour", "neighbor"]):
            return "neighbour"
        if any(_word_in(w, context) for w in ["employee", "employer", "servant",
                                               "worker", "colleague"]):
            return "employment"
        return "stranger"

    def _extract_incident(self, text: str) -> Dict[str, Any]:
        """Extract Crime Category, Alleged Acts, Occurrence Date/Time, and Location."""
        text_lower = text.lower()

        # Crime Domain / Category
        if any(w in text_lower for w in ["kill", "murder", "dead", "stab", "shoot", "homicide", "attempt to murder", "strangle", "beat"]):
            crime_domain = "violent_crimes"
            crime_type = "Violent Offence / Homicide / Assault"
        elif any(w in text_lower for w in ["stole", "stolen", "theft", "burgle", "jewellery", "cash", "housebreak", "trespass", "robbed", "snatched"]):
            crime_domain = "property_crimes"
            crime_type = "Property Offence / Theft / Housebreaking / Robbery"
        elif any(w in text_lower for w in ["cyber", "phishing", "online", "bank scam", "hacked", "otp", "fraud link"]):
            crime_domain = "cyber_crimes"
            crime_type = "Cyber / Digital Fraud"
        elif any(w in text_lower for w in ["narcotics", "drugs", "ndps", "ganja", "heroin", "contraband"]):
            crime_domain = "narcotics_ndps"
            crime_type = "Narcotics & Psychotropic Substances"
        elif any(w in text_lower for w in ["cheated", "fraud", "forged", "counterfeit", "misappropriation"]):
            crime_domain = "financial_crimes"
            crime_type = "Financial Fraud / Forgery / Cheating"
        elif any(w in text_lower for w in ["rape", "molest", "dowry", "modesty", "cruelty by husband", "domestic violence"]):
            crime_domain = "offences_against_women"
            crime_type = "Offences Against Women / Domestic Cruelty"
        else:
            crime_domain = "general_penal"
            crime_type = "General Penal Offence"

        # Alleged Acts
        alleged_acts = []
        if re.search(r"\b(?:stole|theft|dishonestly\s*took|snatched|robbed)\b", text_lower):
            alleged_acts.append("Unlawful taking of property / Theft")
        if re.search(r"\b(?:broke|broken\s*lock|housebreak|trespass|entered\s*dwelling)\b", text_lower):
            alleged_acts.append("Forced dwelling entry / House-trespass")
        if re.search(r"\b(?:stabbed|hit|beat|assaulted|injured|slapped|shot)\b", text_lower):
            alleged_acts.append("Physical violence / Bodily injury")
        if re.search(r"\b(?:tried\s*to\s*kill|attempted\s*murder|threatened\s*to\s*kill)\b", text_lower):
            alleged_acts.append("Attempted homicide / Life threat")
        if re.search(r"\b(?:forged|fake\s*document|cheated|fraudulent\s*transfer)\b", text_lower):
            alleged_acts.append("Deceptive financial transfer / Forgery")
        if not alleged_acts:
            alleged_acts.append("Unspecified reported criminal conduct")

        # Incident Date / Time of Occurrence
        occurrence_date = None
        occurrence_time = None

        # Priority 1: Structured FIR header field ("3. Occurrence of Offence: Date: 12/08/2024 Time: 23:30 hrs")
        m_occ = re.search(
            r"(?:Occurrence\s*of\s*Offence|Date\s*(?:and\s*Time\s*)?of\s*Occurrence|Time\s*of\s*Occurrence)\s*[:\-]?\s*([^\n\r]+)",
            text, re.IGNORECASE
        )
        if m_occ:
            occ_str = m_occ.group(1).strip()
            m_d = re.search(r"(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})", occ_str)
            if m_d:
                occurrence_date = m_d.group(1)
            m_t = re.search(r"(\d{1,2}(?::\d{2})?\s*(?:hrs|hours|am|pm|AM|PM)|\b\d{1,2}:\d{2}\b)", occ_str)
            if m_t:
                occurrence_time = m_t.group(1)
            else:
                m_rel = re.search(r"(around\s*\d{1,2}(?::\d{2})?\s*(?:am|pm|hours)?|at\s*night|midnight|evening|morning)", occ_str, re.IGNORECASE)
                if m_rel:
                    occurrence_time = m_rel.group(1)

        # Priority 2: Narrative date — "On DD/MM/YYYY" / "on the night of DD/MM/YYYY"
        if not occurrence_date:
            m_narr_date = re.search(
                r"\bOn\s+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b",
                text, re.IGNORECASE
            )
            if m_narr_date:
                occurrence_date = m_narr_date.group(1)

        # Priority 3: Any standalone date in first 600 chars as last resort
        if not occurrence_date:
            m_any_date = re.search(r"\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})\b", text[:600])
            if m_any_date:
                occurrence_date = m_any_date.group(1)

        # Narrative time fallback
        # IMPORTANT: the optional preamble "at about" / "at around" is placed OUTSIDE
        # the capture group so occurrence_time contains only the clock value (e.g. "23:30 hrs"),
        # not the full phrase "at about 23:30 hrs".
        if not occurrence_time:
            m_narr_time = re.search(
                r"\b(?:at\s+(?:about|around)\s+)?(\d{1,2}(?::\d{2})?\s*(?:hrs|am|pm))"
                r"|\b(around\s+\d{1,2}(?::\d{2})?\s*(?:am|pm|hours)?|at\s*night|midnight)\b",
                text, re.IGNORECASE
            )
            if m_narr_time:
                # Group 1 = clock value (preferred); group 2 = relative phrase
                occurrence_time = (m_narr_time.group(1) or m_narr_time.group(2)).strip()

        # Incident Location
        incident_location = None

        # Priority 1: Explicit place-of-occurrence field
        m_loc = re.search(
            r"(?:Place\s*of\s*Occurrence|Location\s*of\s*Incident|Place\s*of\s*Incident)\s*[:\-]?\s*([^\n\r\.]+)",
            text, re.IGNORECASE
        )
        if m_loc:
            raw_loc = m_loc.group(1).strip()
            # Strip leading "Police Station" / "P.S." prefix if present
            raw_loc = re.sub(r"^(?:Police\s*Station|P\.?S\.?)\s*[:\-]?\s*", "", raw_loc, flags=re.IGNORECASE).strip()
            incident_location = raw_loc or None

        # Priority 2: Extract location name from "P.S.: <Location>" / "Police Station <Location>" header
        if not incident_location:
            m_ps = re.search(
                r"(?:P\.?S\.?|Police\s*Station)\s*[:\-]?\s*([A-Za-z][A-Za-z\s\-]+?)(?=\s*(?:District|Dist\.?|City|Year|State|FIR|Date|\n|,|\.|$))",
                text, re.IGNORECASE
            )
            if m_ps:
                incident_location = m_ps.group(1).strip()

        # Priority 3: Narrative premises reference ("residence at Daryaganj")
        if not incident_location:
            m_res = re.search(
                r"\b(?:residence\s*at|house\s*at|premises\s*at|flat\s*at)\s*([A-Za-z0-9][A-Za-z0-9\s,\-]+?)(?=\s*(?:,|entered|stole|where|on|\.|\n))",
                text, re.IGNORECASE
            )
            if m_res:
                loc_cand = m_res.group(1).strip()
                if len(loc_cand) > 3:
                    incident_location = loc_cand

        return {
            "crime_domain": crime_domain,
            "crime_type": crime_type,
            "alleged_acts": alleged_acts,
            "occurrence_date": occurrence_date,
            "occurrence_time": occurrence_time,
            "incident_location": incident_location
        }

    def _extract_evidence_and_objects(self, text: str) -> Dict[str, Any]:
        """Extract Weapons, Property/Stolen items, Physical, and Digital evidence with supporting text."""
        weapons = []
        property_items = []
        evidence = []

        # 1. Weapons
        weapon_patterns = [
            (r"\b(knife|dagger|blade|chopper)\b", "Edged weapon / Knife"),
            (r"\b(gun|pistol|revolver|firearm|rifle|country\s*made\s*pistol|katta)\b", "Firearm / Pistol"),
            (r"\b(iron\s*rod|stick|lathi|bat|club|metal\s*pipe)\b", "Blunt weapon / Rod / Lathi"),
            (r"\b(acid|chemical)\b", "Corrosive substance / Acid"),
            (r"\b(rope|strangulation\s*wire|cloth)\b", "Ligature / Strangulation material")
        ]
        for pat, w_type in weapon_patterns:
            m = re.search(pat, text, re.IGNORECASE)
            if m:
                weapons.append({
                    "type": w_type,
                    "description": m.group(0),
                    "is_recovered": bool(re.search(r"seized|recovered|custody", text, re.IGNORECASE))
                })

        # 2. Property / Stolen Items
        prop_patterns = [
            r"gold\s*(?:ornaments|jewellery|chains?|rings?|necklace)",
            r"silver\s*(?:articles|ornaments|coins?)",
            # "cash of Rs. X/-" format
            r"cash\s*(?:of\s*)?(?:Rs\.?|INR)?\s*[\d,]+(?:\/-)?",
            # "Rs. X cash" format (amount before the word cash)
            r"(?:Rs\.?|INR)\s*[\d,]+(?:\/\-)?\s*cash",
            r"mobile\s*(?:phone)?|laptop|electronic\s*items?",
            r"wrist\s*watch|wallet|bag|purse"
        ]
        for pat in prop_patterns:
            matches = re.finditer(pat, text, re.IGNORECASE)
            for m in matches:
                # Clean item text: strip trailing punctuation and whitespace
                item_text = re.sub(r"[,;.\s]+$", "", m.group(0)).strip()
                # Normalize to canonical item labels:
                # 1. "Rs. X cash" (reverse pattern) -> "cash"
                # 2. "cash of Rs. X/-" / "cash of Rs. X" -> "cash"
                if re.match(r"(?:Rs\.?|INR)\s*[\d,]+", item_text, re.IGNORECASE):
                    item_text = "cash"
                elif re.match(r"cash\b", item_text, re.IGNORECASE):
                    item_text = "cash"
                if not any(p["item"].lower() == item_text.lower() for p in property_items):
                    # Strategy 1: value inline in the matched text (e.g. "cash of Rs. 60,000/-")
                    inline_val = re.search(r"(?:Rs\.?|INR)\s*([\d,]+(?:/-)?)", m.group(0), re.IGNORECASE)
                    if inline_val:
                        est_value = inline_val.group(1)
                    else:
                        # Strategy 2: forward context only (up to 60 chars), avoids backward bleed
                        forward_window = text[m.end():min(len(text), m.end() + 60)]
                        val_match = re.search(
                            r"(?:worth|approx|value|amount\s*of)\s*(?:Rs\.?|INR)?\s*([\d,]+(?:/-)?)",
                            forward_window, re.IGNORECASE
                        )
                        if val_match:
                            est_value = val_match.group(1)
                        else:
                            # Strategy 3: small backward window (30 chars) for "worth approx Rs." before item
                            back_window = text[max(0, m.start() - 30):m.start()]
                            val_match_back = re.search(
                                r"(?:worth|approx|value|amount\s*of)\s*(?:Rs\.?|INR)?\s*([\d,]+(?:/-)?)",
                                back_window, re.IGNORECASE
                            )
                            est_value = val_match_back.group(1) if val_match_back else None
                    property_items.append({
                        "item": item_text,
                        "estimated_value": est_value,
                        "supporting_text": text[max(0, m.start()-20):min(len(text), m.end()+30)].strip()
                    })

        # 3. Physical & Forensic Evidence
        if re.search(r"\b(?:broken\s*lock|forced\s*entry|tampered\s*window|door\s*broken)\b", text, re.IGNORECASE):
            evidence.append({
                "type": "Physical / Scene Trace",
                "item": "Broken lock / Tool mark impressions at entry point",
                "significance": "Demonstrates forced entry / Housebreaking"
            })
        if re.search(r"\b(?:blood|fingerprint|footprint|dna|hair|sample)\b", text, re.IGNORECASE):
            evidence.append({
                "type": "Forensic / Biological",
                "item": "Biological traces / Fingerprints at scene",
                "significance": "Suspect identity verification"
            })
        if re.search(r"\b(?:cctv|camera|footage|video\s*recording|dvr)\b", text, re.IGNORECASE):
            evidence.append({
                "type": "Digital / Video",
                "item": "CCTV camera footage / DVR recording",
                "significance": "Visual timeline and suspect identification"
            })
        if re.search(r"\b(?:bank\s*statement|transaction\s*id|receipt|invoice|forged\s*cheque|agreement)\b", text, re.IGNORECASE):
            evidence.append({
                "type": "Documentary / Financial",
                "item": "Bank statements / Transaction records / Forged documents",
                "significance": "Financial trail and deceptive inducement proof"
            })

        return {
            "weapons": weapons,
            "property": property_items,
            "evidence": evidence
        }

    def _extract_timeline(self, text: str) -> List[Dict[str, Any]]:
        """Extract sequence of events preserving relative or exact timestamps."""
        timeline = []
        sentences = [s.strip() for s in re.split(r"[\n\.]+", text) if len(s.strip()) > 15]

        time_markers = [
            r"\b(?:at\s*around|at\s*about|around|at)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm|hrs|hours))\b",
            r"\b(at\s*night|midnight|in\s*the\s*morning|in\s*the\s*evening|on\s*\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b",
            r"\b(thereafter|subsequently|later|then|immediately\s*after)\b"
        ]

        step_idx = 1
        for sent in sentences:
            found_time = None
            for tm in time_markers:
                m = re.search(tm, sent, re.IGNORECASE)
                if m:
                    found_time = m.group(1) if m.groups() else m.group(0)
                    break

            if found_time or any(kw in sent.lower() for kw in ["entered", "stole", "attacked", "threatened", "fled", "escaped", "reported", "called"]):
                timeline.append({
                    "sequence_order": step_idx,
                    "timestamp_or_marker": found_time or "Sequential event",
                    "event_description": sent
                })
                step_idx += 1

        return timeline

    def _extract_modus_operandi(self, text: str) -> List[str]:
        """Extract modus operandi (MO) indicators explicitly evidenced by the FIR."""
        text_lower = text.lower()
        mo_list = []

        if re.search(r"rear\s*window|cut\s*grill|broken\s*lock|latch\s*tampered|night\s*trespass", text_lower):
            mo_list.append("Night housebreaking via forced entry at point of ingress")
        if re.search(r"face\s*covered|mask|helmet|muffler", text_lower):
            mo_list.append("Concealment of identity using mask / covered face")
        if re.search(r"gunpoint|knifepoint|threatened\s*death", text_lower):
            mo_list.append("Armed intimidation at weapon point to overcome resistance")
        if re.search(r"phishing|fake\s*link|apk|screen\s*share|anydesk|otp\s*fraud", text_lower):
            mo_list.append("Social engineering deceptive inducement via malicious link/OTP")
        if re.search(r"recce|prior\s*visit|knew\s*routine", text_lower):
            mo_list.append("Prior reconnaissance of victim premises and schedule")

        if not mo_list:
            mo_list.append("Standard direct offence execution (no complex MO noted)")

        return mo_list

    def _extract_locations(self, text: str, primary_loc: Optional[str]) -> List[Dict[str, str]]:
        """Extract primary and other relevant location landmarks mentioned."""
        locations = []
        if primary_loc:
            locations.append({
                "location": primary_loc,
                "role": "Primary Crime Scene / Place of Occurrence"
            })

        m_hosp = re.search(r"\b([A-Za-z\s]+(?:Hospital|Clinic|Dispensary|Nursing\s*Home))\b", text, re.IGNORECASE)
        if m_hosp:
            locations.append({
                "location": m_hosp.group(1).strip(),
                "role": "Medical Examination / Treatment Facility"
            })

        m_bank = re.search(r"\b([A-Za-z\s]+(?:Bank|Branch))\b", text, re.IGNORECASE)
        if m_bank:
            locations.append({
                "location": m_bank.group(1).strip(),
                "role": "Financial Institution / Account Branch"
            })

        return locations

    def _identify_missing_information(
        self,
        fir_metadata: Dict[str, Any],
        people: Dict[str, Any],
        incident: Dict[str, Any],
        evidence_dict: Dict[str, Any],
        timeline: List[Dict[str, Any]]
    ) -> List[str]:
        """Identifies critical missing facts from FIR required for legal evaluation."""
        missing = []

        if not fir_metadata.get("fir_number"):
            missing.append("FIR Number is not explicitly stated in document header")
        if not incident.get("occurrence_time"):
            missing.append("Exact or approximate time of offence occurrence is missing")
        if not incident.get("incident_location"):
            missing.append("Exact address/spot of occurrence is unspecified")

        if people.get("accused"):
            for acc in people["accused"]:
                if not acc.get("is_identified"):
                    missing.append("Suspect identities/names are unknown (CCTV, witness descriptions, or CDR tracing required)")
        else:
            missing.append("No named or described suspect found in FIR")

        domain = incident.get("crime_domain")
        if domain == "property_crimes":
            if not evidence_dict.get("property"):
                missing.append("Detailed itemized list of stolen property with purchase proofs / valuation is missing")
        elif domain == "violent_crimes":
            if not evidence_dict.get("weapons"):
                missing.append("Weapon details / instrument of assault is not specified")

        return missing


if __name__ == "__main__":
    extractor = FIREntityExtractor()

    sample_fir = """
    FIRST INFORMATION REPORT
    (Under Section 154 Cr.P.C. / 173 BNSS)
    
    1. District: Central Delhi    P.S.: Daryaganj    Year: 2024    FIR No.: 0142/2024
    2. Acts & Sections: BNS 2023 - Sec 303(2), Sec 305
    3. Occurrence of Offence: Day: Monday  Date: 12/08/2024  Time: 23:30 hrs
    4. Complainant: Rajesh Kumar s/o Late Mohan Lal, Ph: 9876543210, r/o House 42, Daryaganj
    5. Details of Suspect: 2 unknown persons with face covered, fled on motorcycle DL-01-AB-1234
    6. Brief Details: The complainant reported that at around 11:30 PM, unknown persons broke the rear window lock of his residence at Daryaganj, entered the dwelling house, brandished a knife, and dishonestly took gold ornaments worth approx Rs. 4,50,000/- and cash of Rs. 60,000/- from the almirah. Complainant's neighbor Suresh witnessed them escaping.
    """

    res = extractor.extract(sample_fir)
    import json
    print("\n--- Final Step 2 Smoke Test Output ---")
    print(json.dumps(res, indent=2))
