/**
 * S.I.R.I.S — Odisha Police Intelligence Network
 * Mock BNS Legal Provision Dataset
 *
 * DEMONSTRATION DATA ONLY.
 * These are AI-assisted demonstration summaries for the SIH V2 prototype.
 * They do NOT constitute official statutory text or authoritative legal reference.
 * All legal determinations require authorized officer/legal review.
 */

export type RelevanceLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type ProvisionTier = 'PRIMARY' | 'RELATED' | 'SUPPORTING';

export interface LegalProvision {
  section: string;         // e.g. "BNS §305"
  sectionNumber: string;   // e.g. "305"
  title: string;
  category: string;
  shortDescription: string;
  provisionSummary: string;
  relevance: number;       // 0–100
  relevanceLevel: RelevanceLevel;
  tier: ProvisionTier;
  keyElements: string[];
  punishmentSummary: string;
  bnssClassification: string; // e.g. "Cognizable, Non-bailable"
  caseReason: string;
  supportingEvidence: string[];
  source: string;
  sourceType: 'LEGAL_REFERENCE';
  aiConfidence: number;    // 0.0–1.0
}

// ─── Core Provision Library ──────────────────────────────────────────────────

export const BNS_PROVISIONS: Record<string, LegalProvision> = {
  'BNS §303': {
    section: 'BNS §303',
    sectionNumber: '303',
    title: 'Theft',
    category: 'Property Offence',
    shortDescription: 'Dishonest taking of movable property from a person without consent.',
    provisionSummary:
      'Whoever, intending to take dishonestly any movable property out of the possession of any person without that person\'s consent, moves that property in order to such taking, is said to commit theft. [Demonstration summary — not verbatim statutory text]',
    relevance: 94,
    relevanceLevel: 'HIGH',
    tier: 'PRIMARY',
    keyElements: [
      'Movable property involved',
      'Taken without consent of owner',
      'Dishonest intention established',
      'Property moved from possession',
    ],
    punishmentSummary: 'Imprisonment up to 3 years, or Fine, or both. Aggravated forms carry higher penalties.',
    bnssClassification: 'Cognizable, Bailable (basic form)',
    caseReason:
      'The case narrative describes goods being taken from the premises without the owner\'s consent, which is consistent with the essential elements of theft under BNS §303.',
    supportingEvidence: [
      'Stolen goods inventory documented',
      'Owner testimony confirms lack of consent',
      'Entry/exit recorded on CCTV',
    ],
    source: 'Bharatiya Nyaya Sanhita, 2023',
    sourceType: 'LEGAL_REFERENCE',
    aiConfidence: 0.94,
  },

  'BNS §305': {
    section: 'BNS §305',
    sectionNumber: '305',
    title: 'Theft in dwelling house',
    category: 'Aggravated Property Offence',
    shortDescription: 'Theft committed in a dwelling house or vessel used as dwelling, or from a person in a vessel.',
    provisionSummary:
      'Whoever commits theft in any building, tent, or vessel used as a human dwelling, or in any building used for the custody of property, shall be liable to enhanced punishment. This aggravated form of theft recognizes the heightened violation of personal security. [Demonstration summary — not verbatim statutory text]',
    relevance: 94,
    relevanceLevel: 'HIGH',
    tier: 'PRIMARY',
    keyElements: [
      'Theft committed inside a dwelling or protected structure',
      'Building used for human habitation or property custody',
      'Higher culpability due to breach of domestic security',
      'Intent to steal established at time of entry',
    ],
    punishmentSummary: 'Rigorous imprisonment up to 7 years + Fine.',
    bnssClassification: 'Cognizable, Non-bailable',
    caseReason:
      'The FIR narrative indicates the offence was committed inside a commercial premise used for custody of property, satisfying the conditions for the aggravated provision under BNS §305.',
    supportingEvidence: [
      'Crime occurred inside a secured building',
      'Forced entry point identified',
      'Property removed from within the premises',
    ],
    source: 'Bharatiya Nyaya Sanhita, 2023',
    sourceType: 'LEGAL_REFERENCE',
    aiConfidence: 0.94,
  },

  'BNS §309': {
    section: 'BNS §309',
    sectionNumber: '309',
    title: 'Robbery',
    category: 'Violent Property Offence',
    shortDescription: 'Theft or extortion combined with voluntary use of force or threat of force.',
    provisionSummary:
      'In all robbery there is either theft or extortion. Theft is robbery if the offender voluntarily causes or attempts to cause death, hurt, or wrongful restraint to any person, or fear of instant hurt or death, in order to commit the theft. [Demonstration summary — not verbatim statutory text]',
    relevance: 91,
    relevanceLevel: 'HIGH',
    tier: 'PRIMARY',
    keyElements: [
      'Theft or extortion as base offence',
      'Voluntary force or threat of force applied',
      'Victim experienced imminent fear of hurt or death',
      'Force applied to execute or conceal theft',
    ],
    punishmentSummary: 'Rigorous imprisonment up to 10 years + Fine.',
    bnssClassification: 'Cognizable, Non-bailable',
    caseReason:
      'The case involves an armed confrontation during which property was forcibly removed, satisfying the dual element of theft plus voluntary force that constitutes robbery under BNS §309.',
    supportingEvidence: [
      'Complainant reported being threatened with weapon',
      'Physical confrontation documented by witnesses',
      'Robbery occurred in presence of complainant',
    ],
    source: 'Bharatiya Nyaya Sanhita, 2023',
    sourceType: 'LEGAL_REFERENCE',
    aiConfidence: 0.91,
  },

  'BNS §331': {
    section: 'BNS §331',
    sectionNumber: '331',
    title: 'House-breaking',
    category: 'Property Offence',
    shortDescription: 'Breaking into or breaking out of a building with intent to commit an offence.',
    provisionSummary:
      'A person is said to commit house-breaking if they effect entry into a house or building using any of the prescribed means — including breaking open any door, window, or passage — with the intent to commit any offence therein. [Demonstration summary — not verbatim statutory text]',
    relevance: 88,
    relevanceLevel: 'HIGH',
    tier: 'RELATED',
    keyElements: [
      'Unlawful forced entry into a building',
      'Entry through a door, window, or wall break',
      'Criminal intent present at time of entry',
      'Building constitutes a protected structure',
    ],
    punishmentSummary: 'Imprisonment up to 2 years + Fine.',
    bnssClassification: 'Cognizable, Bailable',
    caseReason:
      'Evidence of a broken entry point (damaged shutter/door/window) at the crime scene is consistent with house-breaking under BNS §331.',
    supportingEvidence: [
      'Forced entry point found and documented',
      'Door/shutter damage photographed',
      'Entry distinct from lawful ingress',
    ],
    source: 'Bharatiya Nyaya Sanhita, 2023',
    sourceType: 'LEGAL_REFERENCE',
    aiConfidence: 0.88,
  },

  'BNS §324': {
    section: 'BNS §324',
    sectionNumber: '324',
    title: 'Criminal Trespass',
    category: 'Trespass Offence',
    shortDescription: 'Entry onto another\'s property with intent to commit an offence or intimidate.',
    provisionSummary:
      'Whoever enters into or upon property in possession of another with intent to commit an offence, or to intimidate, insult, or annoy any person in possession of such property, is said to commit criminal trespass. [Demonstration summary — not verbatim statutory text]',
    relevance: 75,
    relevanceLevel: 'MEDIUM',
    tier: 'RELATED',
    keyElements: [
      'Entry onto property in lawful possession of another',
      'Intent to commit offence or cause annoyance',
      'Trespass is unlawful and without authorization',
    ],
    punishmentSummary: 'Imprisonment up to 3 months, or Fine up to ₹2,500, or both.',
    bnssClassification: 'Cognizable, Bailable',
    caseReason:
      'The suspects entered the premises unlawfully without owner\'s permission, satisfying the trespass element that typically accompanies the primary burglary/theft offence.',
    supportingEvidence: [
      'No authorization for entry granted by owner',
      'Entry occurred outside business hours',
      'Premises access restricted',
    ],
    source: 'Bharatiya Nyaya Sanhita, 2023',
    sourceType: 'LEGAL_REFERENCE',
    aiConfidence: 0.75,
  },

  'BNS §3(5)': {
    section: 'BNS §3(5)',
    sectionNumber: '3(5)',
    title: 'Common Intention',
    category: 'Constructive Liability',
    shortDescription: 'Joint criminal liability for acts done in furtherance of common intention by multiple persons.',
    provisionSummary:
      'When a criminal act is done by several persons in furtherance of the common intention of all, each of such persons is liable for that act in the same manner as if it were done by him alone. This doctrine holds all co-conspirators equally culpable. [Demonstration summary — not verbatim statutory text]',
    relevance: 72,
    relevanceLevel: 'MEDIUM',
    tier: 'SUPPORTING',
    keyElements: [
      'Multiple persons involved in the criminal act',
      'Common intention shared before or during offence',
      'Each person liable as if acting alone',
      'Applicable where individual roles vary',
    ],
    punishmentSummary: 'Same punishment as the principal offender. Applied in conjunction with the primary section.',
    bnssClassification: 'Applied alongside primary cognizable offence',
    caseReason:
      'Multiple suspects were seen acting in coordination during the offence, suggesting shared common intention that makes each party equally liable.',
    supportingEvidence: [
      'Multiple suspects identified from CCTV',
      'Coordinated roles observed (lookout + executor)',
      'Common getaway vehicle used',
    ],
    source: 'Bharatiya Nyaya Sanhita, 2023',
    sourceType: 'LEGAL_REFERENCE',
    aiConfidence: 0.72,
  },

  'BNS §304': {
    section: 'BNS §304',
    sectionNumber: '304',
    title: 'Snatching',
    category: 'Property Offence',
    shortDescription: 'Sudden grabbing or forcibly taking property from a person, distinct from robbery.',
    provisionSummary:
      'Snatching involves the sudden taking of property by force or show of force from another person, without the sustained application of force that characterizes robbery. The distinction carries a distinct non-bailable procedural framework. [Demonstration summary — not verbatim statutory text]',
    relevance: 82,
    relevanceLevel: 'HIGH',
    tier: 'PRIMARY',
    keyElements: [
      'Property grabbed suddenly from person',
      'Victim present at time of taking',
      'Force used momentarily, not sustained',
      'Distinct from robbery in force application',
    ],
    punishmentSummary: 'Imprisonment up to 3 years + Fine.',
    bnssClassification: 'Cognizable, Non-bailable',
    caseReason:
      'The reported incident involves property being suddenly grabbed from the complainant by suspects on a moving vehicle, consistent with snatching under BNS §304.',
    supportingEvidence: [
      'Complainant describes sudden grab',
      'Suspects on two-wheelers',
      'Gold chain taken from person',
    ],
    source: 'Bharatiya Nyaya Sanhita, 2023',
    sourceType: 'LEGAL_REFERENCE',
    aiConfidence: 0.82,
  },

  'BNS §316': {
    section: 'BNS §316',
    sectionNumber: '316',
    title: 'Criminal Breach of Trust',
    category: 'Financial Offence',
    shortDescription: 'Dishonest misappropriation of property entrusted to someone in a position of trust.',
    provisionSummary:
      'Whoever, being in any manner entrusted with property, or with any dominion over property, dishonestly misappropriates or converts to their own use that property, or dishonestly uses or disposes of that property, commits criminal breach of trust. [Demonstration summary — not verbatim statutory text]',
    relevance: 78,
    relevanceLevel: 'MEDIUM',
    tier: 'RELATED',
    keyElements: [
      'Property entrusted to accused',
      'Dishonest misappropriation or conversion',
      'Breach of legal duty of care',
      'Position of trust or special relationship',
    ],
    punishmentSummary: 'Imprisonment up to 3 years, or Fine, or both.',
    bnssClassification: 'Cognizable, Bailable',
    caseReason:
      'The accused had lawful custody of the property before the alleged misappropriation, creating the trust relationship required under BNS §316.',
    supportingEvidence: [
      'Documented entrustment agreement',
      'Discrepancy in accounts identified',
      'No authorization for disposal found',
    ],
    source: 'Bharatiya Nyaya Sanhita, 2023',
    sourceType: 'LEGAL_REFERENCE',
    aiConfidence: 0.78,
  },
  'BNS §318(4)': {
    section: 'BNS §318(4)',
    sectionNumber: '318(4)',
    title: 'Cheating and Dishonestly Inducing Delivery of Property (replaces IPC 420)',
    category: 'Financial & Cyber Offence',
    shortDescription: 'Cheating and dishonestly inducing the delivery of property or valuable security.',
    provisionSummary:
      'Whoever cheats and thereby dishonestly induces the person deceived to deliver any property to any person, or to make, alter or destroy the whole or any part of a valuable security, shall be punished with imprisonment up to seven years and fine.',
    relevance: 96,
    relevanceLevel: 'HIGH',
    tier: 'PRIMARY',
    keyElements: [
      'Deception of complainant via false pretext or malicious digital link',
      'Fraudulent or dishonest inducement to transfer funds or property',
      'Actual wrongful gain to accused and wrongful loss to victim',
      'Digital evidence / transaction trail establishing deceit',
    ],
    punishmentSummary: 'Imprisonment up to 7 years and mandatory fine.',
    bnssClassification: 'Cognizable, Non-bailable',
    caseReason:
      'The case involves fraudulent inducement and unauthorized debit of funds via electronic bank/UPI transfer, satisfying statutory ingredients of BNS § 318(4).',
    supportingEvidence: [
      'Bank statement showing debit transactions',
      'Cyber cell CDR & IP login log',
      'Complainant statement of fraudulent inducement',
    ],
    source: 'Bharatiya Nyaya Sanhita, 2023',
    sourceType: 'LEGAL_REFERENCE',
    aiConfidence: 0.96,
  },

  'IT Act §66D': {
    section: 'IT Act §66D',
    sectionNumber: '66D',
    title: 'Cheating by Personation using Computer Resource',
    category: 'Cyber Offence',
    shortDescription: 'Impersonation using computer device or communication network to defraud.',
    provisionSummary:
      'Whoever, by means for any communication device or computer resource cheats by personation, shall be punished with imprisonment of either description for a term which may extend to three years and shall also be liable to fine which may extend to one lakh rupees.',
    relevance: 92,
    relevanceLevel: 'HIGH',
    tier: 'RELATED',
    keyElements: [
      'Use of mobile phone, computer, or electronic communication',
      'False impersonation of bank official, authority, or agency',
      'Fraudulent outcome through digital medium',
    ],
    punishmentSummary: 'Imprisonment up to 3 years and fine up to ₹1,00,000.',
    bnssClassification: 'Cognizable, Bailable',
    caseReason:
      'The suspect impersonated an authorized entity over cellular/data channels to orchestrate the cyber scam.',
    supportingEvidence: [
      'Spoofed caller ID and SMS header logs',
      'SIM CAF particulars showing non-genuine subscriber',
    ],
    source: 'Information Technology Act, 2000',
    sourceType: 'LEGAL_REFERENCE',
    aiConfidence: 0.92,
  },

  'BNS §103(1)': {
    section: 'BNS §103(1)',
    sectionNumber: '103(1)',
    title: 'Punishment for Murder (replaces IPC 302)',
    category: 'Heinous Violent Offence',
    shortDescription: 'Culpable homicide with intent to cause death or bodily injury likely to cause death.',
    provisionSummary:
      'Whoever commits murder shall be punished with death or imprisonment for life, and shall also be liable to fine.',
    relevance: 98,
    relevanceLevel: 'HIGH',
    tier: 'PRIMARY',
    keyElements: [
      'Death of a human being caused',
      'Intention of causing death or fatal bodily injury',
      'Overt violent act with deadly weapon or lethal force',
    ],
    punishmentSummary: 'Death or Imprisonment for Life + Fine.',
    bnssClassification: 'Cognizable, Non-bailable, Sessions Court Triable',
    caseReason:
      'Fatal bodily injury inflicted intentionally leading to deceased victim demise at the scene of occurrence.',
    supportingEvidence: [
      'Post-mortem Forensic Inquest report',
      'Seizure of lethal weapon with blood stain matching',
      'Eyewitness statement recorded under Sec 180 BNSS',
    ],
    source: 'Bharatiya Nyaya Sanhita, 2023',
    sourceType: 'LEGAL_REFERENCE',
    aiConfidence: 0.98,
  },

  'BNS §109': {
    section: 'BNS §109',
    sectionNumber: '109',
    title: 'Attempt to Murder (replaces IPC 307)',
    category: 'Heinous Violent Offence',
    shortDescription: 'Act done with intent and knowledge that it would cause death.',
    provisionSummary:
      'Whoever does any act with such intention or knowledge, and under such circumstances, that, if he by that act caused death, he would be guilty of murder, shall be punished with imprisonment up to ten years and fine.',
    relevance: 93,
    relevanceLevel: 'HIGH',
    tier: 'PRIMARY',
    keyElements: [
      'Act capable of causing death executed',
      'Intention to cause fatal injury',
      'Intervention or medical survival preventing death',
    ],
    punishmentSummary: 'Imprisonment up to 10 years and fine; if hurt caused, up to Life Imprisonment.',
    bnssClassification: 'Cognizable, Non-bailable',
    caseReason:
      'Assailant struck vital bodily zones with lethal instrument, evincing explicit murderous intent.',
    supportingEvidence: [
      'Doctor MLC certifying grievous danger to life',
      'Weapon recovery Panchnama',
    ],
    source: 'Bharatiya Nyaya Sanhita, 2023',
    sourceType: 'LEGAL_REFERENCE',
    aiConfidence: 0.93,
  },

  'BNS §115(2)': {
    section: 'BNS §115(2)',
    sectionNumber: '115(2)',
    title: 'Voluntarily Causing Hurt (replaces IPC 323)',
    category: 'Bodily Offence',
    shortDescription: 'Doing an act with the intention of thereby causing hurt to any person.',
    provisionSummary:
      'Whoever voluntarily causes hurt shall be punished with imprisonment for a term which may extend to one year, or with fine which may extend to ten thousand rupees, or with both.',
    relevance: 85,
    relevanceLevel: 'HIGH',
    tier: 'PRIMARY',
    keyElements: [
      'Bodily pain, disease or infirmity caused',
      'Act done intentionally without lawful justification',
    ],
    punishmentSummary: 'Imprisonment up to 1 year, or fine up to ₹10,000, or both.',
    bnssClassification: 'Non-cognizable / Cognizable (circumstantial), Bailable',
    caseReason:
      'Physical assault and bodily injury inflicted during confrontation at incident locus.',
    supportingEvidence: [
      'Medical injury report from local Govt hospital',
      'Eyewitness statement',
    ],
    source: 'Bharatiya Nyaya Sanhita, 2023',
    sourceType: 'LEGAL_REFERENCE',
    aiConfidence: 0.85,
  },

  'BNS §117(2)': {
    section: 'BNS §117(2)',
    sectionNumber: '117(2)',
    title: 'Voluntarily Causing Grievous Hurt by Dangerous Weapon (replaces IPC 326)',
    category: 'Aggravated Bodily Offence',
    shortDescription: 'Causing permanent privation, fracture, or severe injury with dangerous weapon.',
    provisionSummary:
      'Whoever voluntarily causes grievous hurt by means of any instrument for shooting, stabbing or cutting, or corrosive substance, shall be punished with imprisonment up to ten years and fine.',
    relevance: 91,
    relevanceLevel: 'HIGH',
    tier: 'PRIMARY',
    keyElements: [
      'Grievous hurt (bone fracture, severe laceration) established',
      'Use of weapon or dangerous instrument',
    ],
    punishmentSummary: 'Imprisonment up to 10 years and mandatory fine.',
    bnssClassification: 'Cognizable, Non-bailable',
    caseReason:
      'Complainant suffered bone fractures and deep lacerations caused by an iron rod / blade instrument.',
    supportingEvidence: [
      'Radiological X-ray report showing bone fracture',
      'Seized blunt/sharp weapon',
    ],
    source: 'Bharatiya Nyaya Sanhita, 2023',
    sourceType: 'LEGAL_REFERENCE',
    aiConfidence: 0.91,
  },

  'BNS §281': {
    section: 'BNS §281',
    sectionNumber: '281',
    title: 'Rash Driving or Riding on a Public Way (replaces IPC 279)',
    category: 'Public Safety & Vehicular Offence',
    shortDescription: 'Driving vehicle on public road in a rash or negligent manner endangering human life.',
    provisionSummary:
      'Whoever drives any vehicle, or rides, on any public way in a manner so rash or negligent as to endanger human life, or to be likely to cause hurt or injury to any other person, shall be punished with imprisonment up to six months, or fine up to ₹1,000, or both.',
    relevance: 92,
    relevanceLevel: 'HIGH',
    tier: 'PRIMARY',
    keyElements: [
      'Vehicle operation on a public roadway',
      'Rash or negligent driving pattern',
      'Endangerment of public safety and pedestrians',
    ],
    punishmentSummary: 'Imprisonment up to 6 months, or fine up to ₹1,000, or both.',
    bnssClassification: 'Cognizable, Bailable',
    caseReason:
      'Speeding vehicle collided with victim on public thoroughfare.',
    supportingEvidence: [
      'Traffic camera footage showing speeding trajectory',
      'MVI vehicle mechanical fitness report',
    ],
    source: 'Bharatiya Nyaya Sanhita, 2023',
    sourceType: 'LEGAL_REFERENCE',
    aiConfidence: 0.92,
  },

  'BNS §106(2)': {
    section: 'BNS §106(2)',
    sectionNumber: '106(2)',
    title: 'Hit & Run — Rash Driving Causing Death/Grievous Injury and Fleeing',
    category: 'Aggravated Vehicular Offence',
    shortDescription: 'Causing death or injury by rash driving and escaping without reporting to police/magistrate.',
    provisionSummary:
      'Whoever causes death of any person by rash and negligent driving and escapes without reporting it to a police officer or a Magistrate soon after the incident, shall be punished with imprisonment of either description of a term which may extend to ten years, and shall also be liable to fine.',
    relevance: 95,
    relevanceLevel: 'HIGH',
    tier: 'PRIMARY',
    keyElements: [
      'Vehicle collision causing severe injury or fatality',
      'Driver fled the locus without rendering aid or notifying police',
    ],
    punishmentSummary: 'Rigorous imprisonment up to 10 years and substantial fine.',
    bnssClassification: 'Cognizable, Non-bailable',
    caseReason:
      'Offending driver immediately fled the collision scene after striking the victim.',
    supportingEvidence: [
      'ANPR camera record of fleeing vehicle',
      'Eyewitness statement confirming immediate departure without stopping',
    ],
    source: 'Bharatiya Nyaya Sanhita, 2023',
    sourceType: 'LEGAL_REFERENCE',
    aiConfidence: 0.95,
  },

  'BNS §308': {
    section: 'BNS §308',
    sectionNumber: '308',
    title: 'Extortion',
    category: 'Property & Intimidation Offence',
    shortDescription: 'Intentionally putting a person in fear of injury to dishonestly induce delivery of property.',
    provisionSummary:
      'Whoever intentionally puts any person in fear of any injury to that person, or to any other, and thereby dishonestly induces the person so put in fear to deliver to any person any property or valuable security, commits extortion.',
    relevance: 90,
    relevanceLevel: 'HIGH',
    tier: 'PRIMARY',
    keyElements: [
      'Fear of injury intentionally induced',
      'Demand for ransom, protection money, or valuable asset',
      'Delivery of property under duress',
    ],
    punishmentSummary: 'Imprisonment up to 3 years, or fine, or both.',
    bnssClassification: 'Cognizable, Non-bailable',
    caseReason:
      'Suspects demanded protection cash accompanied by explicit threats of bodily violence.',
    supportingEvidence: [
      'Audio recording of extortion phone calls',
      'WhatsApp intimidation transcripts',
    ],
    source: 'Bharatiya Nyaya Sanhita, 2023',
    sourceType: 'LEGAL_REFERENCE',
    aiConfidence: 0.90,
  },

  'BNS §351(2)': {
    section: 'BNS §351(2)',
    sectionNumber: '351(2)',
    title: 'Criminal Intimidation (replaces IPC 506)',
    category: 'Threat Offence',
    shortDescription: 'Threatening another with injury to their person, reputation, or property.',
    provisionSummary:
      'Whoever commits the offence of criminal intimidation shall be punished with imprisonment for a term which may extend to two years, or with fine, or with both.',
    relevance: 84,
    relevanceLevel: 'HIGH',
    tier: 'RELATED',
    keyElements: [
      'Threat of violence or harm communicated to victim',
      'Intent to cause alarm or compel act under fear',
    ],
    punishmentSummary: 'Imprisonment up to 2 years, or fine, or both; if threat to cause death, up to 7 years.',
    bnssClassification: 'Non-cognizable / Cognizable (if threat of death), Bailable',
    caseReason:
      'Suspect explicitly threatened victim and family members with severe retaliation.',
    supportingEvidence: [
      'Witness statement of vocal threats',
      'Call recording / digital messages',
    ],
    source: 'Bharatiya Nyaya Sanhita, 2023',
    sourceType: 'LEGAL_REFERENCE',
    aiConfidence: 0.84,
  },
};

// ─── Dynamic Provision Resolver for Any Case ─────────────────────────────────

export function getProvisionsForCase(
  crimeType?: string,
  description?: string,
  explicitSections?: string[]
): LegalProvision[] {
  const combined = `${crimeType || ''} ${description || ''} ${(explicitSections || []).join(' ')}`.toLowerCase();

  const provisions: LegalProvision[] = [];

  // 1. Cyber Crime / Financial Fraud / UPI
  if (/cyber|fraud|upi|phishing|bank|cheating|financial|crypto|online|scam|420|318/i.test(combined)) {
    provisions.push({ ...BNS_PROVISIONS['BNS §318(4)'], tier: 'PRIMARY', relevance: 96 });
    provisions.push({ ...BNS_PROVISIONS['IT Act §66D'], tier: 'RELATED', relevance: 92 });
    provisions.push({ ...BNS_PROVISIONS['BNS §316'], tier: 'SUPPORTING', relevance: 80 });
    provisions.push({ ...BNS_PROVISIONS['BNS §3(5)'], tier: 'SUPPORTING', relevance: 72 });
    return provisions;
  }

  // 2. Murder / Homicide / Fatal Assault
  if (/murder|homicide|killed|dead|corpse|fatal|stabbed to death|302|103/i.test(combined)) {
    provisions.push({ ...BNS_PROVISIONS['BNS §103(1)'], tier: 'PRIMARY', relevance: 98 });
    provisions.push({ ...BNS_PROVISIONS['BNS §109'], tier: 'RELATED', relevance: 88 });
    provisions.push({ ...BNS_PROVISIONS['BNS §3(5)'], tier: 'SUPPORTING', relevance: 85 });
    return provisions;
  }

  // 3. Vehicular Accidents / Hit and Run
  if (/accident|hit and run|rash driving|speeding|collision|ran over|vehicular|279|281|106/i.test(combined)) {
    provisions.push({ ...BNS_PROVISIONS['BNS §281'], tier: 'PRIMARY', relevance: 94 });
    if (/fled|hit and run|escaped/i.test(combined)) {
      provisions.push({ ...BNS_PROVISIONS['BNS §106(2)'], tier: 'PRIMARY', relevance: 95 });
    }
    provisions.push({ ...BNS_PROVISIONS['BNS §115(2)'], tier: 'RELATED', relevance: 80 });
    return provisions;
  }

  // 4. Armed Robbery / Dacoity / Snatching
  if (/robbery|dacoity|looted|snatch|gunpoint|armed|knife threat|392|309|304/i.test(combined)) {
    provisions.push({ ...BNS_PROVISIONS['BNS §309'], tier: 'PRIMARY', relevance: 94 });
    provisions.push({ ...BNS_PROVISIONS['BNS §304'], tier: 'RELATED', relevance: 86 });
    provisions.push({ ...BNS_PROVISIONS['BNS §351(2)'], tier: 'RELATED', relevance: 80 });
    provisions.push({ ...BNS_PROVISIONS['BNS §3(5)'], tier: 'SUPPORTING', relevance: 74 });
    return provisions;
  }

  // 5. Assault / Grievous Hurt / Physical Clash
  if (/assault|hurt|fracture|attacked|beaten|iron rod|grievous|323|326|115|117/i.test(combined)) {
    provisions.push({ ...BNS_PROVISIONS['BNS §117(2)'], tier: 'PRIMARY', relevance: 92 });
    provisions.push({ ...BNS_PROVISIONS['BNS §115(2)'], tier: 'RELATED', relevance: 88 });
    provisions.push({ ...BNS_PROVISIONS['BNS §351(2)'], tier: 'RELATED', relevance: 82 });
    provisions.push({ ...BNS_PROVISIONS['BNS §3(5)'], tier: 'SUPPORTING', relevance: 75 });
    return provisions;
  }

  // 6. Extortion / Threat
  if (/extortion|threat|protection money|gangster|hafta|308|384/i.test(combined)) {
    provisions.push({ ...BNS_PROVISIONS['BNS §308'], tier: 'PRIMARY', relevance: 93 });
    provisions.push({ ...BNS_PROVISIONS['BNS §351(2)'], tier: 'RELATED', relevance: 89 });
    provisions.push({ ...BNS_PROVISIONS['BNS §3(5)'], tier: 'SUPPORTING', relevance: 78 });
    return provisions;
  }

  // 7. Default / Burglary & Theft
  provisions.push({ ...BNS_PROVISIONS['BNS §305'], tier: 'PRIMARY', relevance: 94 });
  provisions.push({ ...BNS_PROVISIONS['BNS §331'], tier: 'RELATED', relevance: 88 });
  provisions.push({ ...BNS_PROVISIONS['BNS §303'], tier: 'RELATED', relevance: 82 });
  provisions.push({ ...BNS_PROVISIONS['BNS §324'], tier: 'SUPPORTING', relevance: 75 });
  provisions.push({ ...BNS_PROVISIONS['BNS §3(5)'], tier: 'SUPPORTING', relevance: 72 });
  return provisions;
}

// ─── Case-Specific Provision Sets (Kept for backward compatibility) ───────────

export const HERO_CASE_PROVISIONS: LegalProvision[] = [
  { ...BNS_PROVISIONS['BNS §305'], tier: 'PRIMARY', relevance: 94 },
  { ...BNS_PROVISIONS['BNS §331'], tier: 'RELATED', relevance: 88 },
  { ...BNS_PROVISIONS['BNS §324'], tier: 'RELATED', relevance: 75 },
  { ...BNS_PROVISIONS['BNS §3(5)'], tier: 'SUPPORTING', relevance: 72 },
];

export const ROBBERY_CASE_PROVISIONS: LegalProvision[] = [
  { ...BNS_PROVISIONS['BNS §309'], tier: 'PRIMARY', relevance: 91 },
  { ...BNS_PROVISIONS['BNS §304'], tier: 'RELATED', relevance: 84 },
  { ...BNS_PROVISIONS['BNS §3(5)'], tier: 'SUPPORTING', relevance: 72 },
];

export const FIR_ANALYSIS_PROVISIONS: LegalProvision[] = [
  { ...BNS_PROVISIONS['BNS §305'], tier: 'PRIMARY', relevance: 94 },
  { ...BNS_PROVISIONS['BNS §331'], tier: 'RELATED', relevance: 86 },
  { ...BNS_PROVISIONS['BNS §3(5)'], tier: 'SUPPORTING', relevance: 72 },
];

export function getProvision(section: string): LegalProvision | undefined {
  return BNS_PROVISIONS[section];
}

export function getTierLabel(tier: ProvisionTier): string {
  return { PRIMARY: 'Primary', RELATED: 'Related', SUPPORTING: 'Supporting' }[tier];
}

export function getRelevanceColor(level: RelevanceLevel): string {
  return {
    HIGH: 'text-success',
    MEDIUM: 'text-warning',
    LOW: 'text-text-dim',
  }[level];
}
