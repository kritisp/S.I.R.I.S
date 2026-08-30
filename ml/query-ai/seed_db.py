import os
import sqlite3

db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "database", "crimelens.db"))
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# --- Clean slate on every run ---
for t in ["firs", "entities", "evidence", "documents", "bns_sections", "case_notes"]:
    cursor.execute(f"DROP TABLE IF EXISTS {t}")

cursor.execute("""
CREATE TABLE firs (
    fir_number TEXT PRIMARY KEY,
    police_station TEXT,
    district TEXT,
    crime_type TEXT,
    sections_applied TEXT,
    occurrence_datetime TEXT,
    reporting_datetime TEXT,
    gd_number TEXT,
    location TEXT,
    description TEXT,
    complainant_name TEXT,
    complainant_address TEXT,
    complainant_occupation TEXT,
    accused_name TEXT,
    witness_name TEXT,
    status TEXT,
    assigned_officer TEXT,
    progress TEXT
);
""")

cursor.execute("""
CREATE TABLE entities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fir_number TEXT,
    entity_type TEXT,
    value TEXT,
    role TEXT
);
""")

cursor.execute("""
CREATE TABLE evidence (
    evidence_id TEXT PRIMARY KEY,
    fir_number TEXT,
    evidence_type TEXT,
    description TEXT,
    metadata TEXT
);
""")

cursor.execute("""
CREATE TABLE documents (
    doc_id TEXT PRIMARY KEY,
    fir_number TEXT,
    doc_type TEXT,
    title TEXT,
    content TEXT
);
""")

cursor.execute("""
CREATE TABLE bns_sections (
    section_number TEXT PRIMARY KEY,
    title TEXT,
    summary TEXT,
    old_ipc_equivalent TEXT
);
""")

cursor.execute("""
CREATE TABLE case_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fir_number TEXT,
    timestamp TEXT,
    note TEXT,
    officer TEXT
);
""")

# =========================================================
# FIR RECORDS (15) — realistic proforma style
# =========================================================
firs = [
("FIR-2026-00541","Andheri East","Mumbai Suburban","Vehicle Theft","BNS-303(2)",
 "2026-08-12 21:30","2026-08-13 09:15","GD-114/13-08-2026","Sector 12, Andheri East",
 "That the complainant is a resident of the above address. That on 12/08/2026 at about "
 "2130 hrs he had parked his vehicle, a Maruti Suzuki Dzire bearing registration "
 "MH-04-XT-2291, outside his residence as is his usual practice. That on the following "
 "morning at about 0800 hrs he found the said vehicle missing from the place where it "
 "had been parked. That a neighbour, Smt. Priya Nair, has stated she heard the sound of "
 "a vehicle engine starting at about 2135 hrs on the said night but did not see the "
 "vehicle or any person. Case registered and investigation taken up.",
 "Rohit Sharma","Flat 4B, Shree Krupa CHS, Sector 12, Andheri East, Mumbai - 400069",
 "Private Service","Unidentified","Priya Nair","Investigating","Insp. A. Rao",
 "Vehicle flagged in ANPR database, awaiting hits"),

("FIR-2026-00542","Andheri East","Mumbai Suburban","Burglary","BNS-305, BNS-331",
 "2026-08-14 02:45","2026-08-14 06:20","GD-041/14-08-2026","Sector 12 Warehouse Complex",
 "That the complainant is the proprietor of a warehouse used for storage of electronic "
 "goods. That on 14/08/2026 at about 0600 hrs the night watchman, Shri K. Singh, informed "
 "him telephonically that the rear shutter lock of the warehouse had been found forcibly "
 "broken. That on reaching the spot the complainant found electronic goods and cash "
 "amounting to approximately Rs. 3,40,000 missing from the premises. That CCTV cameras "
 "installed at the rear entrance had partially captured the movement of an unidentified "
 "person and a four-wheeler resembling registration MH-04-XT-2291 near the gate at "
 "about 0255 hrs. Case registered and investigation taken up.",
 "S. Iyer","Plot 14, Sector 12 Industrial Area, Andheri East, Mumbai",
 "Business (Warehouse Owner)","R. Malhotra","K. Singh (Night Watchman)","Investigating",
 "Insp. A. Rao","Suspect identified via CCTV and phone tower records; phone number "
 "traced to R. Malhotra"),

("FIR-2026-00301","MG Road","Mumbai Suburban","Vehicle Theft","BNS-303(2)",
 "2026-07-28 22:00","2026-07-29 08:30","GD-078/29-07-2026","MG Road, near Shivaji Market",
 "That the complainant had parked her vehicle, registration MH-04-XT-2291, outside a "
 "shop on MG Road at about 2200 hrs on 28/07/2026 while she went to meet an acquaintance. "
 "That on returning at about 2230 hrs she found the vehicle missing. That a nearby "
 "shopkeeper, on being enquired, stated that he had noticed a man standing near the "
 "vehicle speaking on a mobile phone for several minutes prior to its disappearance, "
 "though he could not describe the man's face clearly. Case registered and investigation "
 "taken up.",
 "Anjali Deshmukh","B-22, Om Sai Apartments, MG Road, Mumbai","Homemaker",
 "Unidentified","Shopkeeper (name withheld, statement on file)","Pending","Insp. R. Verma",
 "Vehicle registration later found linked to FIR-2026-00542; prepaid SIM near scene "
 "traced to number also associated with R. Malhotra"),

("FIR-2026-00560","Bandra","Mumbai Suburban","Cyber Fraud (UPI)","BNS-318, IT Act 66D",
 "2026-08-18 10:40","2026-08-18 15:10","GD-091/18-08-2026","Online / Bandra West",
 "That the complainant received a phone call from a person representing himself to be a "
 "bank official and stating that her debit card was about to be blocked. That believing "
 "the said representation to be true, she shared a one-time password received on her "
 "registered mobile number. That immediately thereafter an amount of Rs. 48,000 was "
 "debited from her account through a UPI transaction she did not authorise. Case "
 "registered and referred to Cyber Cell for transaction trace.",
 "Meera Joshi","702, Silver Oak, Hill Road, Bandra West, Mumbai","Marketing Executive",
 "Unidentified","-","Investigating","Insp. S. Verma","Transaction trace in progress "
 "with bank; caller number flagged"),

("FIR-2026-00577","Kurla","Mumbai Suburban","Cyber Stalking","BNS-78",
 "2026-08-20 16:00","2026-08-20 19:45","GD-102/20-08-2026","Online / Kurla",
 "That the complainant has been receiving repeated calls and messages of a threatening "
 "nature from an unknown mobile number over the past several days. That the said calls "
 "have continued despite the complainant blocking the number on more than one occasion, "
 "as the caller appears to use different numbers. That she apprehends harm to her "
 "person and reputation. Case registered and referred to Cyber Cell.",
 "Meera Joshi","702, Silver Oak, Hill Road, Bandra West, Mumbai","Marketing Executive",
 "Unidentified","-","Investigating","Insp. S. Verma","Caller number matches number "
 "flagged in FIR-2026-00560; same complainant, escalating pattern"),

("FIR-2026-00590","Powai","Mumbai Suburban","Cyber Fraud (UPI)","BNS-318, IT Act 66D",
 "2026-08-22 12:15","2026-08-22 14:00","GD-055/22-08-2026","Online / Powai",
 "That the complainant received a call from a person claiming to represent a courier "
 "company and requesting a small verification payment to release a parcel. That the "
 "complainant made a payment of Rs. 10 through a link sent by the caller, following "
 "which unauthorised transactions totalling Rs. 62,500 were made from her linked bank "
 "account. Case registered and referred to Cyber Cell.",
 "Kavita Rao","14, Lake View CHS, Powai, Mumbai","Software Professional",
 "Unidentified","-","Investigating","Insp. S. Verma","Caller number identical to that "
 "used in FIR-2026-00560 and FIR-2026-00577 — suspected common fraud operation"),

("FIR-2026-00612","Andheri East","Mumbai Suburban","Assault","BNS-115",
 "2026-08-21 19:30","2026-08-21 21:00","GD-127/21-08-2026",
 "Adjacent lane, Sector 12 Warehouse Complex",
 "That the complainant states that on 21/08/2026 at about 1930 hrs he was walking near "
 "the warehouse complex when he was accosted by two unknown men following a verbal "
 "altercation, and was struck on the shoulder and face. That a bystander present at the "
 "scene, later identified as Shri R. Malhotra, witnessed the incident and assisted the "
 "complainant to the nearest hospital. Case registered and investigation taken up.",
 "Vikram Rao","Sai Nagar, Andheri East, Mumbai","Delivery Executive",
 "Unidentified (two unknown males)","R. Malhotra","Pending","Insp. A. Rao",
 "Witness R. Malhotra is the same individual named as person of interest in "
 "FIR-2026-00542 — flagged for cross-verification"),

("FIR-2026-00620","Ghatkopar","Mumbai Suburban","Chain Snatching","BNS-304 (approx., verify)",
 "2026-08-10 20:15","2026-08-10 21:00","GD-066/10-08-2026","LBS Road, Ghatkopar West",
 "That the complainant states that while walking along LBS Road at about 2015 hrs, a "
 "man riding an unregistered black motorcycle, wearing a black full-face helmet, "
 "approached from behind and snatched her gold chain before speeding away towards "
 "Vikhroli. She was unable to note the registration number as the plate was not "
 "visible. Case registered and investigation taken up.",
 "Sunita Pillai","4th Floor, Radhika Apartments, LBS Road, Ghatkopar West, Mumbai",
 "Teacher","Unidentified","-","Pending","Insp. D. Kulkarni","Suspect description "
 "circulated to neighbouring stations"),

("FIR-2026-00621","Vikhroli","Mumbai Suburban","Chain Snatching","BNS-304 (approx., verify)",
 "2026-08-13 20:40","2026-08-13 21:20","GD-071/13-08-2026","Godrej Hill Road, Vikhroli",
 "That the complainant states that while returning home at about 2040 hrs, a man riding "
 "an unregistered black motorcycle, wearing a black full-face helmet, snatched her gold "
 "chain from close range and fled towards LBS Road. The description of the assailant "
 "and vehicle closely matches an incident reported three days earlier in the "
 "neighbouring jurisdiction. Case registered and investigation taken up.",
 "Deepa Nair","201, Hill Crest CHS, Vikhroli, Mumbai","Bank Employee",
 "Unidentified","-","Pending","Insp. D. Kulkarni","Matches MO and suspect description "
 "of FIR-2026-00620 filed at Ghatkopar PS three days prior — likely same offender"),

("FIR-2026-00450","Dadar","Mumbai City","Cheating / Criminal Breach of Trust","BNS-316, BNS-318",
 "2026-07-05 00:00","2026-07-15 11:30","GD-033/15-07-2026","Dadar West",
 "That the complainant had entrusted a sum of Rs. 2,00,000 to the accused, a known "
 "acquaintance, for the purpose of a business investment, on the assurance of returns "
 "within thirty days. That the accused has since failed to return the said amount nor "
 "furnished any explanation despite repeated requests, and has since become "
 "unreachable. Case registered and investigation taken up.",
 "Prakash Bhatia","12, Matunga Road, Dadar West, Mumbai","Shop Owner",
 "Sanjay Kamble","-","Investigating","Insp. M. Fernandes","Accused's last known "
 "address under verification"),

("FIR-2026-00470","Chembur","Mumbai Suburban","Criminal Trespass / Intimidation",
 "BNS-329, BNS-351 (approx., verify)","2026-07-19 22:10","2026-07-20 10:00",
 "GD-088/20-07-2026","Chembur Colony",
 "That the complainant states that on the night of 19/07/2026 an unknown person "
 "trespassed into the compound of his residence and, upon being confronted, threatened "
 "him with dire consequences before fleeing over the compound wall. That the "
 "complainant apprehends further harm. Case registered and investigation taken up.",
 "Ramesh Iyer","Plot 9, Chembur Colony, Mumbai","Retired Government Employee",
 "Unidentified","-","Pending","Insp. K. Shinde","Area patrol increased pending leads"),

("FIR-2026-00488","Kurla","Mumbai Suburban","Mobile Phone Theft","BNS-303(1)",
 "2026-08-02 18:20","2026-08-02 19:00","GD-059/02-08-2026","Kurla Railway Station",
 "That the complainant states that while boarding a suburban train at Kurla station at "
 "about 1820 hrs, in the resultant crowd, his mobile phone was removed from his trouser "
 "pocket without his knowledge. That he noticed the loss upon alighting at the next "
 "station. Case registered and investigation taken up.",
 "Ashok Yadav","Nehru Nagar, Kurla, Mumbai","Clerk","Unidentified","-",
 "Investigating","Insp. P. Naik","IMEI number circulated to service providers for "
 "tracking"),

("FIR-2026-00502","Vikhroli","Mumbai Suburban","Missing Person","BNSS-Proc (missing person)",
 "2026-07-25 00:00","2026-07-26 09:00","GD-045/26-07-2026","Vikhroli West",
 "That the complainant states that her son, aged 17 years, did not return home after "
 "leaving for tuition classes on the evening of 25/07/2026 and his mobile phone has "
 "since remained switched off. Case registered under standard missing person procedure "
 "and search initiated.",
 "Sarita Desai","Hill Crest CHS, Vikhroli, Mumbai","Homemaker","-","-",
 "Closed","Insp. D. Kulkarni","Minor traced and safely reunited with family on "
 "28/07/2026; case closed"),

("FIR-2026-00515","Sion","Mumbai City","Rash Driving Causing Hurt","BNS-281, BNS-125",
 "2026-08-09 08:45","2026-08-09 09:30","GD-021/09-08-2026","Sion Circle",
 "That the complainant states that while crossing the road at Sion Circle he was struck "
 "by a speeding two-wheeler being ridden in a rash and negligent manner, resulting in a "
 "fracture to his left leg. That the rider did not stop and fled the scene. Case "
 "registered and investigation taken up.",
 "Faisal Sheikh","Sion Koliwada, Mumbai","Auto Driver","Unidentified","Two bystanders "
 "(statements on file)","Investigating","Insp. M. Fernandes","CCTV footage from "
 "nearby signal being reviewed"),

("FIR-2026-00530","Dharavi","Mumbai City","Counterfeit Currency","BNS-178 (approx., verify)",
 "2026-08-16 13:00","2026-08-16 17:40","GD-062/16-08-2026","Dharavi Main Road",
 "That the complainant, a shopkeeper, states that he received a Rs. 500 currency note "
 "from a customer which, on subsequent verification at his bank, was found to be "
 "counterfeit. That he is unable to identify the customer as the transaction occurred "
 "amid a busy period at his shop. Case registered and investigation taken up.",
 "Ganesh More","Shop No. 7, Dharavi Main Road, Mumbai","Shopkeeper","Unidentified",
 "-","Pending","Insp. K. Shinde","Note forwarded for forensic currency verification"),
]

cursor.executemany("INSERT INTO firs VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", firs)

# =========================================================
# ENTITIES — deliberate cross-case links
# =========================================================
entities = [
    # Cluster A — vehicle plate ring
    ("FIR-2026-00541","VEHICLE","MH-04-XT-2291","stolen_vehicle"),
    ("FIR-2026-00542","VEHICLE","MH-04-XT-2291","seen_at_crime_scene"),
    ("FIR-2026-00301","VEHICLE","MH-04-XT-2291","stolen_vehicle"),
    ("FIR-2026-00542","PERSON","R. Malhotra","person_of_interest"),
    ("FIR-2026-00542","PHONE","+91 98xxxx9676","registered_line"),
    ("FIR-2026-00301","PHONE","+91 98xxxx3210","prepaid_sim_near_scene"),

    # Cluster B — fraud caller number reused
    ("FIR-2026-00560","PHONE","+91 90xxxx1122","caller_number"),
    ("FIR-2026-00577","PHONE","+91 90xxxx1122","caller_number"),
    ("FIR-2026-00590","PHONE","+91 90xxxx1122","caller_number"),
    ("FIR-2026-00560","PERSON","Meera Joshi","victim"),
    ("FIR-2026-00577","PERSON","Meera Joshi","victim"),
    ("FIR-2026-00590","PERSON","Kavita Rao","victim"),

    # Cluster C — witness/suspect role overlap
    ("FIR-2026-00612","PERSON","R. Malhotra","witness"),
    ("FIR-2026-00612","LOCATION","Sector 12 Warehouse","incident_location"),
    ("FIR-2026-00542","LOCATION","Sector 12 Warehouse","crime_scene"),

    # Cluster D — MO/description match, no exact ID
    ("FIR-2026-00620","VEHICLE_DESC","unregistered black motorcycle, black full-face helmet","suspect_vehicle"),
    ("FIR-2026-00621","VEHICLE_DESC","unregistered black motorcycle, black full-face helmet","suspect_vehicle"),
    ("FIR-2026-00620","LOCATION","Ghatkopar West","incident_location"),
    ("FIR-2026-00621","LOCATION","Vikhroli","incident_location"),
]

cursor.executemany(
    "INSERT INTO entities (fir_number, entity_type, value, role) VALUES (?,?,?,?)",
    entities
)

# =========================================================
# EVIDENCE
# =========================================================
evidence = [
    ("EVD-1001","FIR-2026-00542","cctv",
     "Rear entrance footage, 02:45-03:10 AM, partial vehicle and suspect view",
     '{"duration_min":25,"camera_id":"CAM-WH-04","quality":"medium"}'),
    ("EVD-1002","FIR-2026-00542","document","Forced-entry lock examination report",
     '{"pages":2,"filed_by":"forensics"}'),
    ("EVD-1003","FIR-2026-00541","physical","Tire impression near residence gate",
     '{"photographed":true}'),
    ("EVD-1004","FIR-2026-00301","audio","Shopkeeper statement recording",
     '{"duration_sec":310,"transcribed":true}'),
    ("EVD-1005","FIR-2026-00560","document","UPI transaction log from bank",
     '{"bank":"HDFC","txn_id":"TXN88213"}'),
    ("EVD-1006","FIR-2026-00612","photo","Scene photograph, adjacent lane",
     '{"timestamp":"2026-08-21 20:05","gps_tagged":true}'),
    ("EVD-1007","FIR-2026-00620","cctv","ATM camera footage showing motorcycle passing",
     '{"duration_min":3,"camera_id":"ATM-LBS-02","quality":"low"}'),
    ("EVD-1008","FIR-2026-00621","cctv","Society gate camera, motorcycle sighting",
     '{"duration_min":2,"camera_id":"CAM-HC-01","quality":"medium"}'),
    ("EVD-1009","FIR-2026-00515","cctv","Traffic signal camera at Sion Circle",
     '{"duration_min":5,"camera_id":"TRF-SION-01","quality":"high"}'),
]
cursor.executemany("INSERT INTO evidence VALUES (?,?,?,?,?)", evidence)

# =========================================================
# DOCUMENTS
# =========================================================
documents = [
    ("DOC-01","FIR-2026-00542","witness_statement","Statement of K. Singh (Night Watchman)",
     "I was on duty near the front gate. At about 0255 hrs I heard a noise from the "
     "rear of the premises. By the time I reached, the shutter lock was found broken "
     "and the door ajar. I did not see anyone leave the premises."),
    ("DOC-02","FIR-2026-00301","witness_statement","Statement of shopkeeper (unnamed, on file)",
     "A man was standing near the parked vehicle speaking on a mobile phone for "
     "several minutes before the vehicle was no longer there. I did not get a clear "
     "view of his face."),
    ("DOC-03","FIR-2026-00612","witness_statement","Statement of R. Malhotra",
     "I was passing by when I heard raised voices and saw two men near the warehouse "
     "entrance. One of them struck the complainant. I helped him to the hospital "
     "afterward but did not recognise either of the two men involved."),
    ("DOC-04","FIR-2026-00450","investigation_report","Preliminary investigation note",
     "Accused's registered address found vacant on visit dated 14/08/2026. Neighbours "
     "state he vacated the premises approximately two weeks prior without forwarding "
     "address. Bank account under scrutiny."),
]
cursor.executemany("INSERT INTO documents VALUES (?,?,?,?,?)", documents)

# =========================================================
# LEGAL DATA (BNS) — summaries paraphrased for mock use.
# VERIFY exact section numbers/text against india code (indiacode.nic.in)
# before using in the actual submission — some below are approximate.
# =========================================================
bns_sections = [
    ("BNS-303","Theft",
     "Dishonestly taking movable property out of another's possession without consent.",
     "IPC-378"),
    ("BNS-305","Theft in a building/vessel",
     "Enhanced punishment where theft is committed in a dwelling, building used for "
     "custody of property, or similar premises.","IPC-380"),
    ("BNS-331","House-breaking",
     "Committing house-trespass in order to commit an offence.","IPC-445-454 (range)"),
    ("BNS-318","Cheating",
     "Fraudulently or dishonestly inducing a person to deliver property through "
     "deception.","IPC-420"),
    ("BNS-316","Criminal breach of trust",
     "Dishonest misappropriation of property entrusted to a person's care.","IPC-405-406"),
    ("BNS-115","Voluntarily causing hurt",
     "Intentionally causing bodily pain, disease or infirmity to another person.","IPC-323"),
    ("BNS-78","Stalking (approx., verify exact number)",
     "Repeated contact or monitoring of a person despite indication of disinterest.",
     "IPC-354D"),
    ("BNS-304","Snatching (approx., verify exact number)",
     "Theft committed by suddenly or forcibly seizing property from a person.",
     "New provision, no direct IPC equivalent"),
    ("BNS-281","Rash driving",
     "Driving a vehicle in a manner endangering human life or likely to cause hurt.",
     "IPC-279"),
    ("BNS-125","Causing hurt by act endangering life",
     "Causing hurt through an act done rashly or negligently.","IPC-337-338 (range)"),
]
cursor.executemany("INSERT INTO bns_sections VALUES (?,?,?,?)", bns_sections)

# =========================================================
# CASE NOTES
# =========================================================
case_notes = [
    ("FIR-2026-00542","2026-08-14 09:00","CCTV footage requested from warehouse management.","Insp. A. Rao"),
    ("FIR-2026-00542","2026-08-15 14:30","Phone number +91 98xxxx9676 traced to R. Malhotra via telecom records.","Insp. A. Rao"),
    ("FIR-2026-00301","2026-07-29 10:00","Vehicle plate cross-checked; matches FIR-2026-00542.","Insp. R. Verma"),
    ("FIR-2026-00577","2026-08-20 20:15","Caller number found identical to that flagged in FIR-2026-00560.","Insp. S. Verma"),
    ("FIR-2026-00590","2026-08-22 15:30","Same caller number pattern as FIR-2026-00560 and FIR-2026-00577 — suspected common operation.","Insp. S. Verma"),
    ("FIR-2026-00612","2026-08-22 11:00","Witness R. Malhotra cross-referenced against FIR-2026-00542; flagged for further verification.","Insp. A. Rao"),
    ("FIR-2026-00621","2026-08-13 22:00","Suspect description matches FIR-2026-00620 filed at Ghatkopar three days prior.","Insp. D. Kulkarni"),
]
cursor.executemany(
    "INSERT INTO case_notes (fir_number, timestamp, note, officer) VALUES (?,?,?,?)",
    case_notes
)

conn.commit()
conn.close()
print("crimelens.db created: 15 FIRs, entities, evidence, documents, BNS sections, case notes.")