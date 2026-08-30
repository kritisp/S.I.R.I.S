import os
import sys
from typing import Dict, Any, List, Optional

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class InvestigationIntelligenceEngine:
    """
    CrimeLens Investigation Intelligence Layer.

    Transforms generic SOP retrieval into domain-specific, legally-grounded,
    explainable investigation decision support. Every recommendation is tied to:
      - BNS section (substantive offence)
      - BNSS section (procedural authority)
      - Crime category (domain intelligence)

    This module does NOT use hardcoded case rules, sentence-level regex, or
    individual query matching. All strategies are generated from crime category,
    extracted facts, and verified legal sections.
    """

    # -------------------------------------------------------------------------
    # BNSS Procedural Authority Registry
    # -------------------------------------------------------------------------
    BNSS_COMPLIANCE = {
        "fir_registration": {"section": "BNSS Section 173", "requirement": "Register First Information Report for cognizable offence"},
        "search_seizure": {"section": "BNSS Section 185", "requirement": "Search of premises during investigation"},
        "audio_video_recording": {"section": "BNSS Section 105", "requirement": "Mandatory audio-video recording of search and seizure"},
        "witness_examination": {"section": "BNSS Section 180", "requirement": "Examination of witnesses by police officer"},
        "arrest_without_warrant": {"section": "BNSS Section 35", "requirement": "Arrest of person in cognizable offence without warrant"},
        "female_officer_recording": {"section": "BNSS Section 183", "requirement": "Statement of woman to be recorded by woman officer at residence"},
        "inquest_procedure": {"section": "BNSS Section 194", "requirement": "Inquest by police officer in case of death"},
        "medical_examination": {"section": "BNSS Section 184", "requirement": "Medical examination of accused at time of arrest"},
        "electronic_evidence": {"section": "BSHA Section 63", "requirement": "Electronic evidence certificate for digital records"},
        "spot_inspection": {"section": "BNSS Section 185", "requirement": "Spot inspection map and scene documentation"},
    }

    # -------------------------------------------------------------------------
    # Category-Specific Intelligence Templates
    # -------------------------------------------------------------------------
    CATEGORY_INTELLIGENCE = {
        "violent_crimes": {
            "priority_level": "CRITICAL",
            "priority_reason": "Violent offence involving threat to life or bodily integrity. Requires immediate victim safety and forensic scene preservation.",
            "immediate_actions": [
                {"priority": "P1", "action": "Ensure victim safety and arrange emergency medical aid", "purpose": "Preserve life and obtain MLC for injury documentation", "timeframe": "0-1 hour"},
                {"priority": "P1", "action": "Cordon and preserve crime scene", "purpose": "Prevent contamination of biological evidence (blood, DNA, weapon traces)", "timeframe": "0-2 hours"},
                {"priority": "P2", "action": "Locate and seize weapon/instrument of offence under BNSS Section 105", "purpose": "Link physical weapon to injuries documented in MLC", "timeframe": "0-4 hours"},
                {"priority": "P2", "action": "Record FIR under BNSS Section 173", "purpose": "Legally commence cognizable investigation", "timeframe": "0-2 hours"},
            ],
            "evidence_strategy": [
                {"evidence_type": "Medical", "items_to_collect": "Medical Legal Certificate (MLC) / Post-mortem report", "legal_relevance": "Establishes nature and severity of injuries, directly linked to BNS penal section determination", "source": "Government/empanelled hospital"},
                {"evidence_type": "Biological/Forensic", "items_to_collect": "Blood samples, DNA swabs, hair strands, fibre traces", "legal_relevance": "DNA profile match between accused and crime scene strengthens prosecution case", "source": "Crime scene via FSL team"},
                {"evidence_type": "Weapon/Instrument", "items_to_collect": "Assault weapon seizure memo (Panchnama) with BNSS 105 audio-video recording", "legal_relevance": "Weapon recovery establishes connection between accused and offence", "source": "Crime scene / accused possession"},
                {"evidence_type": "Digital/CCTV", "items_to_collect": "CCTV footage with BSHA Section 63 electronic certificate", "legal_relevance": "Visual evidence of assault sequence and accused identification", "source": "Premises cameras, traffic cameras, ATM cameras"},
                {"evidence_type": "Testimonial", "items_to_collect": "Eyewitness statements recorded under BNSS Section 180", "legal_relevance": "Corroborates victim account and establishes facts in issue", "source": "Neighbours, bystanders, family members"},
            ],
            "witness_strategy": [
                {"witness_type": "Eyewitness", "importance": "CRITICAL", "questions_to_capture": "Exact sequence of events, accused description, weapon details, time of incident, direction of escape"},
                {"witness_type": "Neighbour/Bystander", "importance": "HIGH", "questions_to_capture": "Sounds heard, prior disputes, accused seen entering/leaving, vehicle used"},
                {"witness_type": "Family member", "importance": "HIGH", "questions_to_capture": "Relationship details, history of threats, motive, prior complaints filed"},
                {"witness_type": "Medical professional", "importance": "CRITICAL", "questions_to_capture": "Nature of injuries, weapon consistency, timeline of treatment, prognosis"},
            ],
            "accused_strategy": [
                {"action": "Identify accused through victim statement, CCTV, and witness descriptions", "purpose": "Establish identity of suspect for arrest proceedings under BNSS Section 35"},
                {"action": "Investigate prior criminal history and pending cases", "purpose": "Determine pattern of violent behaviour and bail opposition grounds"},
                {"action": "Determine motive through relationship, financial disputes, or prior threats", "purpose": "Establish mens rea (criminal intent) element for prosecution"},
                {"action": "Collect alibi-breaking evidence (call records, tower locations)", "purpose": "Disprove false alibis presented by accused"},
            ],
            "digital_forensic_strategy": [
                {"action": "Retrieve call detail records (CDR) and cell tower location of accused", "purpose": "Place accused at crime scene at time of incident"},
                {"action": "Extract threatening messages/calls from victim and accused devices", "purpose": "Establish prior premeditation or motive documentation"},
            ],
            "compliance_keys": ["fir_registration", "search_seizure", "audio_video_recording", "witness_examination", "arrest_without_warrant", "spot_inspection"],
            "timeline": [
                {"stage": "Immediate Response", "recommended_action": "Victim safety, scene preservation, FIR registration", "time_window": "0-2 hours"},
                {"stage": "Evidence Collection", "recommended_action": "MLC, forensic collection, weapon seizure, CCTV retrieval", "time_window": "2-12 hours"},
                {"stage": "Witness Examination", "recommended_action": "Record statements of all eyewitnesses under BNSS 180", "time_window": "12-24 hours"},
                {"stage": "Accused Apprehension", "recommended_action": "Arrest under BNSS 35, medical examination under BNSS 184", "time_window": "24-72 hours"},
                {"stage": "Case File Preparation", "recommended_action": "Compile chargesheet documents under BNSS Section 193", "time_window": "Timeline should follow applicable statutory provisions and investigation progress."},
            ],
        },
        "property_crimes": {
            "priority_level": "HIGH",
            "priority_reason": "Property offence involving loss of movable/immovable property. Requires scene inspection and property recovery strategy.",
            "immediate_actions": [
                {"priority": "P1", "action": "Record FIR under BNSS Section 173", "purpose": "Legally commence cognizable investigation for property offence", "timeframe": "0-2 hours"},
                {"priority": "P1", "action": "Inspect crime scene for point of entry, forced entry marks, tool impressions", "purpose": "Determine method of entry and number of suspects involved", "timeframe": "0-4 hours"},
                {"priority": "P2", "action": "Retrieve CCTV footage from premises and surrounding areas", "purpose": "Identify suspect appearance, vehicle used, and timeline of crime", "timeframe": "0-6 hours"},
                {"priority": "P2", "action": "Collect fingerprint and footprint impressions from entry/exit points", "purpose": "Match against fingerprint database (AFIS) for suspect identification", "timeframe": "0-6 hours"},
            ],
            "evidence_strategy": [
                {"evidence_type": "Physical/Scene", "items_to_collect": "Fingerprint lifts, footprint casts, tool mark impressions", "legal_relevance": "Physical trace evidence linking accused to crime scene", "source": "Crime scene entry/exit points"},
                {"evidence_type": "Documentary", "items_to_collect": "Ownership proof, purchase receipts, valuation certificates for stolen property", "legal_relevance": "Establishes complainant's lawful possession and value of stolen items", "source": "Complainant documents"},
                {"evidence_type": "Digital/CCTV", "items_to_collect": "CCTV footage with BSHA Section 63 electronic certificate", "legal_relevance": "Visual identification of suspect and modus operandi", "source": "Building CCTV, traffic cameras, nearby establishments"},
                {"evidence_type": "Recovery", "items_to_collect": "Stolen property recovery memo (Panchnama) with audio-video recording under BNSS 105", "legal_relevance": "Recovery of stolen property from accused custody is strong corroborative evidence", "source": "Accused premises or pawn shop/scrap dealer"},
            ],
            "witness_strategy": [
                {"witness_type": "Complainant", "importance": "CRITICAL", "questions_to_capture": "Exact list of stolen items with description, last time property seen, suspicious persons noticed"},
                {"witness_type": "Neighbour/Security guard", "importance": "HIGH", "questions_to_capture": "Unusual activity observed, unfamiliar persons/vehicles, sounds heard at time of incident"},
                {"witness_type": "Shop/Market witness", "importance": "MEDIUM", "questions_to_capture": "Any person attempting to sell items matching stolen property description"},
            ],
            "accused_strategy": [
                {"action": "Check local criminal records for known property offenders with similar MO", "purpose": "Identify repeat offenders operating in the jurisdiction"},
                {"action": "Monitor pawn shops, scrap dealers, and online marketplaces for stolen items", "purpose": "Recover stolen property and establish chain of possession"},
                {"action": "Analyze CCTV footage for suspect identification and getaway vehicle", "purpose": "Build visual evidence for arrest and prosecution"},
            ],
            "digital_forensic_strategy": [
                {"action": "Retrieve CCTV server recordings and extract suspect frames", "purpose": "Facial recognition and visual identification of accused"},
                {"action": "Check online classifieds and marketplace listings for stolen items", "purpose": "Digital trail of attempted sale of stolen property"},
            ],
            "compliance_keys": ["fir_registration", "search_seizure", "audio_video_recording", "witness_examination", "spot_inspection"],
            "timeline": [
                {"stage": "Immediate Response", "recommended_action": "FIR registration, scene inspection, CCTV retrieval", "time_window": "0-4 hours"},
                {"stage": "Evidence Collection", "recommended_action": "Fingerprints, footprints, tool marks, ownership documents", "time_window": "4-12 hours"},
                {"stage": "Property Recovery", "recommended_action": "Monitor markets, pawn shops, online listings for stolen items", "time_window": "1-7 days"},
                {"stage": "Suspect Identification", "recommended_action": "CCTV analysis, informer activation, AFIS fingerprint match", "time_window": "1-14 days"},
            ],
        },
        "cyber_crimes": {
            "priority_level": "HIGH",
            "priority_reason": "Cyber offence involving digital fraud, phishing, or electronic data breach. Requires immediate transaction freeze and digital evidence preservation.",
            "immediate_actions": [
                {"priority": "P1", "action": "Record FIR under BNSS Section 173 and report to National Cyber Crime Portal (cybercrime.gov.in)", "purpose": "Commence investigation and activate inter-agency coordination", "timeframe": "0-2 hours"},
                {"priority": "P1", "action": "Issue bank/payment gateway hold notice on suspect account", "purpose": "Freeze fraudulent transactions and prevent further monetary loss", "timeframe": "0-2 hours"},
                {"priority": "P2", "action": "Preserve digital communication evidence (emails, SMS, WhatsApp, screenshots)", "purpose": "Prevent deletion of electronic evidence by suspect", "timeframe": "0-4 hours"},
                {"priority": "P2", "action": "Request IP logs and server access records from ISP/platform", "purpose": "Trace geographic origin and device identity of suspect", "timeframe": "0-12 hours"},
            ],
            "evidence_strategy": [
                {"evidence_type": "Digital/Transaction", "items_to_collect": "Bank statements, UPI transaction receipts, payment gateway ledger", "legal_relevance": "Establishes financial loss and fraudulent money trail", "source": "Victim bank, payment platform"},
                {"evidence_type": "Digital/Communication", "items_to_collect": "Phishing email headers, SMS messages, WhatsApp chats with BSHA Sec 63 certificate", "legal_relevance": "Establishes deception/personation element under BNS 318/319", "source": "Victim device"},
                {"evidence_type": "Digital/Network", "items_to_collect": "IP address logs, server access records, domain registration details", "legal_relevance": "Traces suspect identity and geographic location", "source": "ISP, hosting provider, CERT-In"},
                {"evidence_type": "Digital/Device", "items_to_collect": "Suspect device forensic image, browser history, email account access logs", "legal_relevance": "Establishes accused direct involvement in fraudulent communication", "source": "Accused device seized under BNSS 105"},
            ],
            "witness_strategy": [
                {"witness_type": "Victim/Complainant", "importance": "CRITICAL", "questions_to_capture": "Exact URL/phone/email used by fraudster, transaction amounts and dates, how contact was initiated"},
                {"witness_type": "Bank officer", "importance": "HIGH", "questions_to_capture": "Account holder KYC details, transaction reversal status, CCTV of ATM withdrawal if applicable"},
            ],
            "accused_strategy": [
                {"action": "Trace suspect through IP address, device IMEI, and SIM registration", "purpose": "Identify real-world identity behind digital persona"},
                {"action": "Coordinate with CERT-In and payment platforms for account freeze", "purpose": "Prevent further fraudulent activity and preserve digital evidence"},
            ],
            "digital_forensic_strategy": [
                {"action": "Forensic imaging of suspect device (mobile/laptop) preserving chain of custody", "purpose": "Extract browser history, app data, communication records without tampering"},
                {"action": "Trace money flow through UPI/NEFT/IMPS transaction chain", "purpose": "Identify beneficiary accounts and mule account network"},
                {"action": "Analyze email headers and domain WHOIS for phishing infrastructure", "purpose": "Identify fraudulent domain registration and hosting provider for takedown"},
            ],
            "compliance_keys": ["fir_registration", "search_seizure", "audio_video_recording", "electronic_evidence"],
            "timeline": [
                {"stage": "Golden Hour Response", "recommended_action": "FIR, bank freeze notice, digital evidence preservation", "time_window": "0-2 hours"},
                {"stage": "Digital Evidence Collection", "recommended_action": "IP logs, transaction records, communication evidence", "time_window": "2-24 hours"},
                {"stage": "Suspect Identification", "recommended_action": "IP tracing, SIM/IMEI lookup, account KYC analysis", "time_window": "1-7 days"},
                {"stage": "Device Forensics", "recommended_action": "Suspect device seizure, forensic imaging, data extraction", "time_window": "7-30 days"},
            ],
        },
        "financial_crimes": {
            "priority_level": "HIGH",
            "priority_reason": "Financial offence involving fraud, forgery, breach of trust, or counterfeiting. Requires documentary evidence preservation and forensic accounting.",
            "immediate_actions": [
                {"priority": "P1", "action": "Record FIR under BNSS Section 173", "purpose": "Commence cognizable investigation for financial offence", "timeframe": "0-2 hours"},
                {"priority": "P1", "action": "Seize and preserve forged/fraudulent documents under BNSS Section 185", "purpose": "Prevent destruction of documentary evidence by accused", "timeframe": "0-6 hours"},
                {"priority": "P2", "action": "Obtain bank account statements and transaction trail", "purpose": "Establish money flow and extent of misappropriation", "timeframe": "0-12 hours"},
            ],
            "evidence_strategy": [
                {"evidence_type": "Documentary", "items_to_collect": "Forged documents, contracts, agreements, power of attorney, cheques", "legal_relevance": "Establishes forgery element under BNS 336/338 or breach of trust under BNS 316", "source": "Accused premises, banks, registry offices"},
                {"evidence_type": "Financial", "items_to_collect": "Bank statements, audit reports, company ledgers, tax returns", "legal_relevance": "Quantifies misappropriation amount and establishes dishonest intent", "source": "Banks, chartered accountant, company records"},
                {"evidence_type": "Forensic/Handwriting", "items_to_collect": "Handwriting samples and expert opinion under SEQD", "legal_relevance": "Establishes that forged signature was made by accused hand", "source": "Government handwriting expert"},
            ],
            "witness_strategy": [
                {"witness_type": "Complainant/Victim", "importance": "CRITICAL", "questions_to_capture": "Nature of entrustment, amount misappropriated, timeline of discovery, documentary proof of original agreement"},
                {"witness_type": "Bank manager", "importance": "HIGH", "questions_to_capture": "Account transaction details, KYC of account holder, cheque clearance records"},
                {"witness_type": "Chartered accountant", "importance": "HIGH", "questions_to_capture": "Forensic audit findings, discrepancy amounts, document authenticity opinion"},
            ],
            "accused_strategy": [
                {"action": "Freeze accused bank accounts through court order", "purpose": "Prevent dissipation of misappropriated funds"},
                {"action": "Obtain handwriting sample of accused for forensic comparison", "purpose": "Prove accused authored forged documents"},
            ],
            "digital_forensic_strategy": [
                {"action": "Retrieve electronic banking records and email communication", "purpose": "Trace digital trail of fraudulent instructions and approvals"},
            ],
            "compliance_keys": ["fir_registration", "search_seizure", "audio_video_recording", "witness_examination"],
            "timeline": [
                {"stage": "Immediate Response", "recommended_action": "FIR registration, document seizure, account freeze application", "time_window": "0-6 hours"},
                {"stage": "Documentary Evidence", "recommended_action": "Bank statements, forged document seizure, audit report", "time_window": "1-7 days"},
                {"stage": "Forensic Analysis", "recommended_action": "Handwriting expert opinion, digital forensic examination", "time_window": "7-30 days"},
            ],
        },
        "offences_against_women": {
            "priority_level": "CRITICAL",
            "priority_reason": "Offence against woman involving cruelty, assault, or sexual violence. Requires victim-centric investigation with statutory protections.",
            "immediate_actions": [
                {"priority": "P1", "action": "Ensure immediate safety of victim and arrange safe shelter if needed", "purpose": "Protection of victim from further harm by accused", "timeframe": "0-1 hour"},
                {"priority": "P1", "action": "Record FIR under BNSS Section 173, statement by woman officer under BNSS Section 183", "purpose": "Statutory requirement: woman's statement must be recorded by female police officer at her residence", "timeframe": "0-2 hours"},
                {"priority": "P1", "action": "Arrange medical examination (MLC) at government/empanelled hospital", "purpose": "Document physical injuries, collect SAEC kit if sexual assault", "timeframe": "0-4 hours"},
                {"priority": "P2", "action": "Issue protection order / DV Act notice if domestic violence", "purpose": "Legal safeguard preventing accused from approaching victim", "timeframe": "0-12 hours"},
            ],
            "evidence_strategy": [
                {"evidence_type": "Medical", "items_to_collect": "MLC injury report, SAEC kit (if sexual assault), psychological assessment", "legal_relevance": "Establishes physical/mental cruelty element under BNS 85 or sexual assault evidence", "source": "Government hospital / One-Stop Centre"},
                {"evidence_type": "Communication", "items_to_collect": "Threatening messages, call recordings, social media harassment evidence", "legal_relevance": "Establishes continuous cruelty pattern and mens rea of accused", "source": "Victim's phone, social media screenshots with BSHA Sec 63 certificate"},
                {"evidence_type": "Documentary", "items_to_collect": "Marriage certificate, dowry demand evidence, previous complaint copies", "legal_relevance": "Establishes marital relationship and pattern of harassment", "source": "Victim's documents, Women Cell records"},
            ],
            "witness_strategy": [
                {"witness_type": "Victim", "importance": "CRITICAL", "questions_to_capture": "Timeline of harassment, specific incidents of cruelty, dowry demands made, injuries sustained"},
                {"witness_type": "Family/Neighbours", "importance": "HIGH", "questions_to_capture": "Incidents witnessed, sounds heard, victim condition observed, prior complaints known"},
                {"witness_type": "Women Cell counsellor", "importance": "MEDIUM", "questions_to_capture": "Previous complaints, counselling sessions, accused behaviour during mediation"},
            ],
            "accused_strategy": [
                {"action": "Arrest accused under BNSS Section 35 if cognizable non-bailable offence", "purpose": "Prevent further harassment or influence on victim/witnesses"},
                {"action": "Collect dowry receipt evidence and financial transaction trail", "purpose": "Establish dowry demand element for BNS 85 prosecution"},
            ],
            "digital_forensic_strategy": [
                {"action": "Preserve WhatsApp/SMS threatening messages with timestamps", "purpose": "Document pattern of continuous mental cruelty and threats"},
            ],
            "compliance_keys": ["fir_registration", "female_officer_recording", "witness_examination", "arrest_without_warrant", "audio_video_recording"],
            "timeline": [
                {"stage": "Immediate Response", "recommended_action": "Victim safety, FIR by woman officer, MLC", "time_window": "0-4 hours"},
                {"stage": "Protection Measures", "recommended_action": "Protection order, shelter arrangement, DV Act application", "time_window": "4-24 hours"},
                {"stage": "Evidence Collection", "recommended_action": "Communication evidence, dowry documents, witness statements", "time_window": "1-7 days"},
                {"stage": "Prosecution", "recommended_action": "Accused arrest, chargesheet preparation", "time_window": "Timeline should follow applicable statutory provisions and investigation progress."},
            ],
        },
        "offences_against_children": {
            "priority_level": "CRITICAL",
            "priority_reason": "Offence against minor child. Requires child-friendly investigation procedures, CWC notification, and POCSO compliance.",
            "immediate_actions": [
                {"priority": "P1", "action": "Ensure immediate safety of child and notify Child Welfare Committee (CWC)", "purpose": "Statutory POCSO requirement: CWC must be informed within 24 hours", "timeframe": "0-2 hours"},
                {"priority": "P1", "action": "Record FIR under BNSS Section 173 and POCSO Act", "purpose": "Dual statutory registration under BNS and POCSO", "timeframe": "0-2 hours"},
                {"priority": "P1", "action": "Arrange child-friendly statement recording (no uniform, familiar environment, guardian present)", "purpose": "POCSO compliance: child must be comfortable during statement, recorded by female/specially trained officer", "timeframe": "0-6 hours"},
                {"priority": "P2", "action": "Medical examination by female doctor in guardian presence", "purpose": "Document injuries, collect forensic samples with child's dignity maintained", "timeframe": "0-12 hours"},
            ],
            "evidence_strategy": [
                {"evidence_type": "Medical", "items_to_collect": "Paediatric medical examination report, forensic samples", "legal_relevance": "Establishes physical harm and nature of offence against minor", "source": "Government hospital paediatric wing"},
                {"evidence_type": "Testimonial", "items_to_collect": "Child statement in child-friendly language (audio-video recorded)", "legal_relevance": "Primary evidence under POCSO, must be recorded in non-threatening environment", "source": "CWC/child-friendly room at police station"},
            ],
            "witness_strategy": [
                {"witness_type": "Child victim", "importance": "CRITICAL", "questions_to_capture": "What happened in child's own words (no leading questions), who was involved, when and where"},
                {"witness_type": "Parent/Guardian", "importance": "CRITICAL", "questions_to_capture": "When incident was discovered, child's behavioural changes, prior contact with accused"},
                {"witness_type": "School teacher/Caretaker", "importance": "HIGH", "questions_to_capture": "Child's attendance pattern, behavioural changes noticed, any disclosures made"},
            ],
            "accused_strategy": [
                {"action": "Identify accused through child's disclosure and guardian information", "purpose": "Build accused profile without exposing child to confrontation"},
                {"action": "Check accused criminal history for prior child offences", "purpose": "Establish repeat offender pattern for bail opposition"},
            ],
            "digital_forensic_strategy": [
                {"action": "Examine accused devices for communication with minor", "purpose": "Establish grooming pattern or inappropriate contact evidence"},
            ],
            "compliance_keys": ["fir_registration", "female_officer_recording", "witness_examination", "audio_video_recording"],
            "timeline": [
                {"stage": "Immediate Response", "recommended_action": "Child safety, CWC notification, FIR under POCSO", "time_window": "0-4 hours"},
                {"stage": "Child Statement", "recommended_action": "Child-friendly recording by trained officer", "time_window": "4-24 hours"},
                {"stage": "Medical & Forensic", "recommended_action": "Paediatric examination, forensic sample collection", "time_window": "0-24 hours"},
                {"stage": "Prosecution", "recommended_action": "Accused arrest, fast-track court referral", "time_window": "Timeline should follow applicable statutory provisions and investigation progress."},
            ],
        },
        "narcotics_ndps": {
            "priority_level": "CRITICAL",
            "priority_reason": "Narcotics / NDPS offence involving recovery of suspected contraband substance. Requires strict seizure, sampling, and chain-of-custody protocols.",
            "immediate_actions": [
                {"priority": "P1", "action": "Secure the seized substance and prevent any contamination, leakage, or loss", "purpose": "Preserve chemical integrity of contraband", "timeframe": "0-1 hour"},
                {"priority": "P1", "action": "Weigh and pack the contraband under independent witness supervision", "purpose": "Follow mandatory search and seizure procedures to prevent tampering accusations", "timeframe": "0-2 hours"},
                {"priority": "P1", "action": "Record FIR under BNSS Section 173 and relevant NDPS provisions", "purpose": "Commence formal cognizable investigation", "timeframe": "0-2 hours"},
                {"priority": "P2", "action": "Conduct search of suspect premises under BNSS Section 185", "purpose": "Identify source network and stash locations", "timeframe": "0-6 hours"},
                {"priority": "P2", "action": "Identify accused, supplier links, and source network details", "purpose": "Expose distribution channels", "timeframe": "0-12 hours"},
            ],
            "evidence_strategy": [
                {"evidence_type": "Physical", "items_to_collect": "Seized contraband substance, packaging material, weighing records, and seizure memo (Panchnama)", "legal_relevance": "Establishes corpus delicti (physical body of crime) of narcotics offence", "source": "Recovery site / suspect possession"},
                {"evidence_type": "Forensic", "items_to_collect": "FSL chemical examination report, representative sample collection, and chain of custody logs", "legal_relevance": "Proves composition and quantity of contraband under NDPS guidelines", "source": "FSL lab / magistrate certification"},
                {"evidence_type": "Digital", "items_to_collect": "Phone communication records, chats, financial transaction statements, supplier/buyer ledger with BSHA Sec 63 certificate", "legal_relevance": "Establishes conspiracy and drug syndication networks", "source": "Suspect device / bank gateway"},
                {"evidence_type": "Testimonial", "items_to_collect": "Statements of independent recovery witnesses and informant/source statements under BNSS Section 180", "legal_relevance": "Corroborates recovery process and authenticity of seizure", "source": "Independent witnesses, informants"},
            ],
            "witness_strategy": [
                {"witness_type": "Independent witness", "importance": "CRITICAL", "questions_to_capture": "Presence during search, observation of recovery, verification of weighing and sealing process"},
                {"witness_type": "Recovery officer", "importance": "HIGH", "questions_to_capture": "Source of information, search execution details, recovery sequence"},
                {"witness_type": "Accused / Carrier", "importance": "HIGH", "questions_to_capture": "Source of supply, destination, delivery agent details, monetary arrangements"},
            ],
            "accused_strategy": [
                {"action": "Arrest suspect under BNSS Section 35", "purpose": "Apprehend carrier/dealer and initiate interrogation"},
                {"action": "Trace financial transactions and assets of accused", "purpose": "Establish drug money laundering and syndicate links"},
            ],
            "digital_forensic_strategy": [
                {"action": "Extract messaging apps and call logs from seized mobile devices", "purpose": "Map supplier and buyer networks"},
            ],
            "compliance_keys": ["fir_registration", "search_seizure", "audio_video_recording", "witness_examination", "arrest_without_warrant"],
            "timeline": [
                {"stage": "Immediate Recovery", "recommended_action": "Substance securing, weighing, sealing with independent witnesses", "time_window": "0-4 hours"},
                {"stage": "Forensic Sampling", "recommended_action": "Magistrate inventory under BNSS 105/185, FSL sample dispatch", "time_window": "4-24 hours"},
                {"stage": "Supply Network Tracing", "recommended_action": "Trace chats, financial transactions, and supplier details", "time_window": "Timeline should follow applicable statutory provisions and investigation progress."},
            ],
        },
    }

    # Fallback for categories not explicitly listed
    DEFAULT_INTELLIGENCE = {
        "priority_level": "MEDIUM",
        "priority_reason": "General penal offence requiring standard investigation procedures.",
        "immediate_actions": [
            {"priority": "P1", "action": "Record FIR under BNSS Section 173", "purpose": "Commence cognizable investigation", "timeframe": "0-2 hours"},
            {"priority": "P2", "action": "Conduct spot inspection and scene documentation", "purpose": "Gather physical evidence and scene photographs", "timeframe": "0-6 hours"},
        ],
        "evidence_strategy": [
            {"evidence_type": "Physical/Scene", "items_to_collect": "Spot inspection map, scene photographs, physical evidence", "legal_relevance": "Establishes facts and circumstances of reported offence", "source": "Crime scene"},
            {"evidence_type": "Testimonial", "items_to_collect": "Witness statements under BNSS Section 180", "legal_relevance": "Corroborates complainant account and identifies accused", "source": "Witnesses present at scene"},
        ],
        "witness_strategy": [
            {"witness_type": "Complainant", "importance": "CRITICAL", "questions_to_capture": "Detailed account of incident, accused identification, timeline"},
            {"witness_type": "Eyewitness", "importance": "HIGH", "questions_to_capture": "What was observed, description of persons involved, sequence of events"},
        ],
        "accused_strategy": [
            {"action": "Identify accused through complainant and witness descriptions", "purpose": "Establish suspect identity for investigation proceedings"},
        ],
        "digital_forensic_strategy": [],
        "compliance_keys": ["fir_registration", "witness_examination", "spot_inspection"],
        "timeline": [
            {"stage": "Immediate Response", "recommended_action": "FIR registration, spot inspection", "time_window": "0-4 hours"},
            {"stage": "Evidence Collection", "recommended_action": "Witness statements, physical evidence collection", "time_window": "4-24 hours"},
            {"stage": "Investigation", "recommended_action": "Suspect identification, arrest proceedings", "time_window": "1-14 days"},
        ],
    }

    def __init__(self):
        pass

    def generate_investigation_strategy(
        self,
        crime_category: str,
        bns_sections: List[Dict[str, Any]],
        bnss_sections: List[Dict[str, Any]],
        extracted_facts: Dict[str, Any],
        missing_information: List[str],
        investigation_sop_items: List[Dict[str, str]],
    ) -> Dict[str, Any]:
        """
        Generate a structured Investigation Intelligence report.

        Args:
            crime_category: Classified crime domain (e.g. 'violent_crimes', 'property_crimes').
            bns_sections: Verified BNS offence sections with metadata.
            bnss_sections: Retrieved BNSS procedural action sections.
            extracted_facts: Legal facts from LegalFactExtractor.
            missing_information: Questions already identified as missing.
            investigation_sop_items: Retrieved SOP plan items from InvestigationPlanner.

        Returns:
            Structured investigation intelligence JSON.
        """
        # Resolve category intelligence template
        cat_key = self._resolve_category(crime_category, extracted_facts)
        intel = self.CATEGORY_INTELLIGENCE.get(cat_key, self.DEFAULT_INTELLIGENCE)

        # Build investigation priority
        investigation_priority = {
            "level": intel["priority_level"],
            "reason": self._enrich_priority_reason(intel["priority_reason"], bns_sections, extracted_facts)
        }

        # Build immediate actions with BNS context
        immediate_actions = self._enrich_immediate_actions(intel["immediate_actions"], bns_sections, extracted_facts)

        # Build evidence strategy with legal relevance
        evidence_strategy = self._enrich_evidence_strategy(intel["evidence_strategy"], bns_sections, investigation_sop_items)

        # Build witness strategy
        witness_strategy = intel["witness_strategy"]

        # Build accused investigation strategy
        accused_strategy = intel["accused_strategy"]

        # Build digital forensic strategy
        digital_forensic_strategy = intel.get("digital_forensic_strategy", [])

        # Build BNSS legal compliance checklist
        legal_compliance_checklist = self._build_compliance_checklist(intel.get("compliance_keys", []), bnss_sections)

        # Build investigation timeline
        investigation_timeline = intel.get("timeline", [])

        # Build pending information (merge missing_information with category-specific gaps)
        pending_information = list(set(missing_information))

        return {
            "investigation_priority": investigation_priority,
            "immediate_actions": immediate_actions,
            "evidence_strategy": evidence_strategy,
            "witness_strategy": witness_strategy,
            "accused_investigation_strategy": accused_strategy,
            "digital_forensic_strategy": digital_forensic_strategy,
            "legal_compliance_checklist": legal_compliance_checklist,
            "investigation_timeline": investigation_timeline,
            "pending_information": pending_information,
        }

    def _resolve_category(self, crime_category: str, extracted_facts: Dict[str, Any]) -> str:
        """Resolve the best matching category intelligence template."""
        if crime_category in self.CATEGORY_INTELLIGENCE:
            return crime_category

        # Map common variations
        mapping = {
            "organized_crime": "property_crimes",
            "public_order": "violent_crimes",
            "traffic_accidents": "violent_crimes",
            "general_penal": None,  # will use DEFAULT_INTELLIGENCE
        }
        mapped = mapping.get(crime_category)
        if mapped and mapped in self.CATEGORY_INTELLIGENCE:
            return mapped

        # Infer from facts
        if extracted_facts.get("violence_present"):
            return "violent_crimes"
        if extracted_facts.get("crime_domain") in self.CATEGORY_INTELLIGENCE:
            return extracted_facts["crime_domain"]

        return crime_category  # fallback to DEFAULT_INTELLIGENCE via .get()

    def _enrich_priority_reason(self, base_reason: str, bns_sections: List[Dict], facts: Dict) -> str:
        """Enrich priority reason with specific BNS section context."""
        section_names = [f"BNS {s.get('section', '')} ({s.get('title', '')})" for s in bns_sections[:2]]
        reason = base_reason
        if section_names:
            reason += f" Identified offences: {', '.join(section_names)}."
        if facts.get("death_occurred"):
            reason += " DEATH REPORTED - highest investigation priority mandated."
        return reason

    def _enrich_immediate_actions(self, base_actions: List[Dict], bns_sections: List[Dict], facts: Dict) -> List[Dict]:
        """Enrich immediate actions with offence-specific context."""
        enriched = []
        for action in base_actions:
            enriched_action = dict(action)
            # Add BNS reference to purpose if relevant
            if "weapon" in action["action"].lower() and bns_sections:
                sec = bns_sections[0]
                enriched_action["purpose"] += f" (supports prosecution under BNS {sec.get('section', '')})"
            enriched.append(enriched_action)

        # Add murder-specific immediate actions
        if facts.get("death_occurred"):
            enriched.insert(0, {
                "priority": "P0",
                "action": "Initiate inquest proceedings under BNSS Section 194 and arrange post-mortem examination",
                "purpose": "Statutory requirement when death is reported - establish cause and manner of death",
                "timeframe": "0-1 hour"
            })

        return enriched

    def _enrich_evidence_strategy(self, base_strategy: List[Dict], bns_sections: List[Dict], sop_items: List[Dict]) -> List[Dict]:
        """Enrich evidence strategy with SOP-derived evidence items."""
        enriched = list(base_strategy)

        # Merge unique SOP evidence items not already covered
        existing_types = {e["evidence_type"].lower() for e in enriched}
        for sop in sop_items:
            ev_gen = sop.get("evidence_generated", "")
            stage = sop.get("stage", "")
            if ev_gen and stage.lower() not in existing_types:
                enriched.append({
                    "evidence_type": f"SOP/{stage}",
                    "items_to_collect": ev_gen,
                    "legal_relevance": f"Investigation SOP requirement for {stage} stage",
                    "source": "Investigation Knowledge SOP"
                })

        return enriched

    def _build_compliance_checklist(self, compliance_keys: List[str], bnss_sections: List[Dict]) -> List[Dict]:
        """Build BNSS legal compliance checklist from compliance keys."""
        checklist = []
        for key in compliance_keys:
            if key in self.BNSS_COMPLIANCE:
                entry = self.BNSS_COMPLIANCE[key]
                checklist.append({
                    "requirement": entry["requirement"],
                    "related_BNSS_section": entry["section"],
                    "status": "PENDING"
                })

        # Add any extra BNSS sections from retrieval not already in checklist
        existing_secs = {c["related_BNSS_section"] for c in checklist}
        for bnss_item in bnss_sections:
            meta = bnss_item.get("metadata", {})
            sec_num = str(meta.get("section_number", ""))
            sec_title = meta.get("section_title", "")
            sec_ref = f"BNSS Section {sec_num}"
            if sec_ref not in existing_secs and sec_num not in ["531", "530", "529"]:
                checklist.append({
                    "requirement": f"Apply {sec_title} procedure",
                    "related_BNSS_section": sec_ref,
                    "status": "PENDING"
                })

        return checklist


if __name__ == "__main__":
    engine = InvestigationIntelligenceEngine()

    # Test: Violent crime scenario
    result = engine.generate_investigation_strategy(
        crime_category="violent_crimes",
        bns_sections=[
            {"section": "Section 109", "title": "Attempt to murder", "confidence": "HIGH"},
            {"section": "Section 85", "title": "Cruelty by husband", "confidence": "HIGH"},
        ],
        bnss_sections=[{"metadata": {"section_number": "173", "section_title": "Information in cognizable cases"}}],
        extracted_facts={"crime_domain": "violent_crimes", "intent": "cause death", "death_occurred": False, "violence_present": True},
        missing_information=["Was any weapon used during the assault?"],
        investigation_sop_items=[{"stage": "Crime Scene Cordon", "evidence_generated": "Crime scene log sheet"}],
    )

    import json
    print(json.dumps(result, indent=2))
