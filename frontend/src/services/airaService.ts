import { CaseRecord, Station, Evidence } from '../mockServices/types';
import { groqService } from './groqService';

export interface AiraContext {
  currentUser?: string;
  station?: string;
  currentCaseId?: string;
  currentPage?: string;
  selectedEntity?: string;
  role?: string;
  cases?: CaseRecord[];
  stations?: Station[];
  evidence?: Evidence[];
}

export interface AiraAction {
  label: string;
  route: string;
  primary?: boolean;
}

export interface AiraStructuredData {
  title: string;
  stats: { label: string; value: string }[];
  listTitle?: string;
  items?: {
    id: string;
    location: string;
    date: string;
    accused?: string;
    riskScore?: number;
    description: string;
  }[];
  connectedDockets?: {
    id: string;
    type: string;
    station: string;
  }[];
}

export interface AiraResponse {
  intent: string;
  response: string;
  structuredData?: AiraStructuredData;
  actions?: AiraAction[];
  route?: string;
  caseData?: CaseRecord;
}

/**
 * Asynchronous Intelligence Assistant Processor.
 * Integrates Groq LLM Cloud Reasoning (`openai/gpt-oss-120b`) for FIR Registration parsing
 * and fallback AI reasoning alongside deterministic command routing.
 */
export async function processAiraQueryAsync(query: string, context: AiraContext): Promise<AiraResponse> {
  const qTrim = query.trim();

  // 1. Check for FIR Registration Intent via Groq LLM / Natural Language Parser
  try {
    const parsedFir = await groqService.parseFirFromNaturalLanguage(qTrim);
    if (parsedFir.isFirRequest && parsedFir.narrative) {
      const pStation = parsedFir.policeStation || 'Saheed Nagar PS';
      const cType = parsedFir.incidentType || 'Reported BNS Offence';
      const sections = parsedFir.suggestedBnsSections?.length 
        ? parsedFir.suggestedBnsSections.join(', ')
        : 'BNS Section 304, Section 317';
      
      const draftUrl = `/cases/new?narrative=${encodeURIComponent(parsedFir.narrative)}&crime_type=${encodeURIComponent(cType)}&location=${encodeURIComponent(parsedFir.incidentLocation || '')}&station=${encodeURIComponent(pStation)}`;

      return {
        intent: 'REGISTER_FIR',
        response: parsedFir.summaryResponse || `S.I.R.I.S. AI Investigator has drafted an FIR for **${cType}** under **${sections}**. Redirecting to official FIR intake console for statutory digital seal.`,
        structuredData: {
          title: `FIR DRAFT: ${cType.toUpperCase()}`,
          stats: [
            { label: "Police Station", value: pStation },
            { label: "Complainant", value: parsedFir.complainantName || "Informant / Officer" },
            { label: "Recommended BNS", value: sections }
          ],
          listTitle: "Extracted Narrative Details:",
          items: [
            {
              id: "NARRATIVE",
              location: parsedFir.incidentLocation || "Jurisdiction Area",
              date: parsedFir.incidentDate || new Date().toLocaleDateString(),
              description: parsedFir.narrative
            }
          ]
        },
        actions: [
          { label: 'CONFIRM & SUBMIT DIGITAL FIR', route: draftUrl, primary: true },
          { label: 'OPEN STATUTORY RAG', route: '/cases/new' }
        ],
        route: draftUrl
      };
    }
  } catch (e) {
    console.warn("[AiraService] Groq FIR parsing fallback:", e);
  }

  // 2. Deterministic Intent Routing
  const deterministicRes = processAiraQuery(qTrim, context);
  if (deterministicRes.intent !== 'GENERAL_ASSISTANCE') {
    return deterministicRes;
  }

  // 3. Groq LLM Fallback for General Reasoning Queries
  try {
    const systemPrompt = `You are S.I.R.I.S. AI Co-Pilot, an intelligent police investigator assistant for Indian Law Enforcement (Odisha Police / BNS 2023 / BNSS 2023 / BSA 2023).
Provide a concise, authoritative, professional 2-3 sentence answer to the officer's query. Use bullet points or crisp statutory references if needed. Do not use generic AI greetings.`;

    const groqAnswer = await groqService.chatCompletion([
      { role: "system", content: systemPrompt },
      { role: "user", content: qTrim }
    ]);

    if (groqAnswer && groqAnswer.trim()) {
      return {
        intent: 'GROQ_REASONING',
        response: groqAnswer.trim(),
        actions: [
          { label: 'REGISTER FIR', route: '/cases/new', primary: true },
          { label: 'VIEW INVESTIGATIONS', route: '/cases' }
        ]
      };
    }
  } catch (err) {
    console.warn("[AiraService] Groq reasoning fallback to deterministic assistance:", err);
  }

  return deterministicRes;
}

/**
 * Deterministic Natural Language Command Router & Intelligence Synthesizer for AIRA.
 * Maps voice transcripts directly to validated intents, mock investigation records, and navigation paths.
 */
export function processAiraQuery(query: string, context: AiraContext): AiraResponse {
  const q = query.trim().toLowerCase();
  const cases = context.cases || [];
  const stations = context.stations || [];

  // ===========================================================================
  // 0. ROUND 3 PROACTIVE INTEL & RESOURCE OPTIMIZATION INTENTS
  // ===========================================================================
  
  if (q.includes('how many entities') || q.includes('entities were discovered') || q.includes('entities discovered')) {
    return {
      intent: 'ROUND3_ENTITIES_COUNT',
      response: "42 entities were discovered across 5 ingested evidence sources for Operation Nightfall, including canonical suspects, phone lines, vehicle plates, CCTV nodes, and bank accounts.",
      structuredData: {
        title: "Knowledge Graph Summary",
        stats: [
          { label: "Entities Discovered", value: "42 Nodes" },
          { label: "Total Relationships", value: "67 Edges" },
          { label: "Evidence Feeds", value: "5 Ingested Sources" }
        ]
      },
      actions: [
        { label: 'OPEN KNOWLEDGE GRAPH', route: '/intelligence-fusion', primary: true }
      ],
      route: '/intelligence-fusion'
    };
  }

  if (q.includes('what connections were found') || q.includes('connections were found') || q.includes('what connections') || q.includes('hidden connection')) {
    return {
      intent: 'ROUND3_CONNECTIONS_FOUND',
      response: "6 cross-source correlations were identified linking Rahul S. to vehicle OD-02-MJ-8821, CCTV KDG-04, Mule Account M-204, and a 92% confidence cross-case match with FIR-2025-114.",
      structuredData: {
        title: "Intelligence Discovery",
        stats: [
          { label: "Primary Correlation", value: "Rahul S. ↔ OD-02-MJ-8821" },
          { label: "Cross-Case Match", value: "FIR-2025-114 (92% Conf.)" },
          { label: "Financial Link", value: "Mule Account M-204" }
        ]
      },
      actions: [
        { label: 'VIEW INTELLIGENCE FUSION', route: '/intelligence-fusion', primary: true }
      ],
      route: '/intelligence-fusion'
    };
  }

  if (q.includes('2026-0817') || q.includes('threat for case 2026-0817') || q.includes('summarize the threat')) {
    return {
      intent: 'ROUND3_CASE_THREAT_SUMMARY',
      response: "Case 2026-0817 (Organized Vehicle Theft) has a Threat Score of 91 out of 100 with HIGH threat level. 6 independent corroborating signals connect subject Rahul S., vehicle OD-02-MJ-8821, CCTV KDG-04, and Mule Account M-204.",
      structuredData: {
        title: "Intelligence Fusion: CASE #2026-0817",
        stats: [
          { label: "Threat Score", value: "91 / 100 (HIGH)" },
          { label: "Corroborating Feeds", value: "06 Independent Signals" },
          { label: "Primary Suspect", value: "Rahul S. (+91-9199370000)" }
        ],
        listTitle: "Connected Key Entities:",
        items: [
          { id: "VEHICLE", location: "Khandagiri Square", date: "2026-09-02", description: "Mahindra Thar (OD-02-MJ-8821) ANPR Flagged" },
          { id: "MULE_ACC", location: "Utkal Gramya Bank", date: "2026-09-01", description: "Mule Account M-204 (₹2,45,000 structured volume)" }
        ]
      },
      actions: [
        { label: 'OPEN INTELLIGENCE FUSION', route: '/intelligence-fusion', primary: true },
        { label: 'FORECAST AREA RISK', route: '/predictive-risk' }
      ],
      route: '/intelligence-fusion'
    };
  }

  if (q.includes('highest predicted risk') || q.includes('highest risk area') || q.includes('which area has')) {
    return {
      intent: 'ROUND3_HIGHEST_RISK_AREA',
      response: "Khandagiri currently has the highest simulated risk score at 87 out of 100. Vehicle theft is the dominant predicted category during the 19:00 to 22:00 IST peak window.",
      structuredData: {
        title: "Predictive Risk: Top Risk Zones",
        stats: [
          { label: "Top Risk Zone", value: "Khandagiri (87/100 - CRITICAL)" },
          { label: "Dominant Category", value: "Vehicle Theft (82% Probability)" },
          { label: "Peak Risk Window", value: "19:00 — 22:00 IST" }
        ]
      },
      actions: [
        { label: 'VIEW PREDICTIVE RISK', route: '/predictive-risk', primary: true },
        { label: 'VIEW RISK TERRAIN MAP', route: '/map?mode=risk-terrain' }
      ],
      route: '/predictive-risk'
    };
  }

  if (q.includes('why is khandagiri') || q.includes('why khandagiri')) {
    return {
      intent: 'ROUND3_WHY_KHANDAGIRI_RISK',
      response: "Khandagiri is flagged high risk due to a 32% historical baseline, recent surge (+32%), 3 nearby repeat offenders including Rahul S., 5 recent CCTV alerts, and high evening transit activity.",
      actions: [
        { label: 'VIEW PREDICTIVE BREAKDOWN', route: '/predictive-risk', primary: true },
        { label: 'OPTIMIZE RESOURCES', route: '/resource-optimization' }
      ],
      route: '/predictive-risk'
    };
  }

  if (q.includes('patrol unit do you recommend') || q.includes('recommend patrol unit') || q.includes('what patrol unit')) {
    return {
      intent: 'ROUND3_PATROL_RECOMMENDATION',
      response: "Unit B-17 is recommended for Khandagiri between 19:00 and 22:00 due to elevated vehicle theft risk and recent CCTV activity.",
      structuredData: {
        title: "AI Resource Optimization",
        stats: [
          { label: "Recommended Unit", value: "Unit B-17 (QRT Interceptor)" },
          { label: "Target Zone", value: "Khandagiri Square" },
          { label: "Time Window", value: "19:00 — 22:00 IST" }
        ]
      },
      actions: [
        { label: 'OPEN RESOURCE OPTIMIZATION', route: '/resource-optimization', primary: true }
      ],
      route: '/resource-optimization'
    };
  }

  if (q.includes('intelligence network for this case') || q.includes('intelligence network')) {
    return {
      intent: 'ROUND3_INTELLIGENCE_NETWORK',
      response: "Opening Intelligence Fusion Network for Case 2026-0817 displaying 9 linked entity nodes and cross-station corroborating feeds.",
      actions: [
        { label: 'VIEW INTELLIGENCE FUSION', route: '/intelligence-fusion', primary: true },
        { label: 'GLOBAL NETWORK EXPLORER', route: '/network' }
      ],
      route: '/intelligence-fusion'
    };
  }

  // ===========================================================================
  // 0. HERO SUGGESTION CARD QUERIES (In-Chat Insights, NO Redirect)
  // ===========================================================================
  
  if (q.includes('vehicle thefts in bhubaneswar')) {
    return {
      intent: 'VEHICLE_THEFT_ANALYSIS',
      response: "Here is the CCTNS Crime Report for Vehicle Thefts in Bhubaneswar Urban.",
      structuredData: {
        title: "CCTNS Crime Report: Vehicle Theft",
        stats: [
          { label: "Total Registered Dockets", value: "142 cases indexed across Bhubaneswar Urban." },
          { label: "Primary Crime Distribution", value: "Two-Wheeler Theft (98), Car Jacking (22), Commercial (15)." },
          { label: "Jurisdictional Police Stations", value: "Khandagiri PS, Nayapalli PS, Saheed Nagar PS, Capital PS." }
        ],
        listTitle: "Latest Indexed Vehicle Theft FIRs:",
        items: [
          {
            id: "OD/BBS/2026/1001",
            location: "Bhubaneswar Urban (Khandagiri PS)",
            date: "2026-08-28",
            accused: "Unknown",
            description: "Silver Maruti Swift (OD-02-AB-1234) stolen from Khandagiri Square parking lot overnight."
          },
          {
            id: "OD/BBS/2026/1042",
            location: "Bhubaneswar Urban (Nayapalli PS)",
            date: "2026-08-29",
            accused: "Rajesh Behera",
            riskScore: 68,
            description: "Two-wheelers stolen from CRPF Square parking zone."
          }
        ],
        connectedDockets: [
          { id: "OD/BBS/2026/1001", type: "Vehicle Theft", station: "Khandagiri PS" },
          { id: "OD/BBS/2026/1042", type: "Vehicle Theft", station: "Nayapalli PS" }
        ]
      },
      actions: [
        { label: 'OPEN GIS CRIME MAP', route: '/map', primary: true }
      ]
    };
  }

  if (q.includes('ଗତ ମାସର') || q.includes('ଡକାୟତି ମାମଲା')) {
    return {
      intent: 'ODIA_CASE_QUERY',
      response: "Here is the CCTNS Crime Report for Robberies in Cuttack-Bhubaneswar.",
      structuredData: {
        title: "CCTNS Crime Report: Robbery (ଡକାୟତି)",
        stats: [
          { label: "Total Registered Dockets", value: "୪୫ଟି ଡକାୟତି ମାମଲା (45 Robbery Cases)." },
          { label: "Top Affected Districts", value: "Bhubaneswar Urban, Cuttack Sadar, Khordha." },
          { label: "Primary Crime Distribution", value: "Highway Robbery (20), Armed Robbery (12), Chain Snatching (8)." }
        ],
        listTitle: "Latest Indexed Robbery FIRs:",
        items: [
          {
            id: "OD/CTC/2026/0401",
            location: "Cuttack (Pahala PS)",
            date: "2026-08-30",
            accused: "Ramesh \"Bullet\" Nayak",
            riskScore: 88,
            description: "ଗତ ରାତିରେ ଜାତୀୟ ରାଜପଥ-୧୬ (NH-16) ପାହାଳ ନିକଟରେ ସଶସ୍ତ୍ର ଡକାୟତି। (Armed robbery near Pahala on NH-16 last night.)"
          },
          {
            id: "OD/BBS/2026/0542",
            location: "Bhubaneswar Urban (Khandagiri PS)",
            date: "2026-08-31",
            accused: "Unknown",
            description: "ଖଣ୍ଡଗିରି ଛକ ନିକଟରେ ମହିଳାଙ୍କଠାରୁ ସୁନା ଚେନ୍ ଲୁଟ୍। (Gold chain snatched from a woman near Khandagiri Square.)"
          }
        ],
        connectedDockets: [
          { id: "OD/CTC/2026/0401", type: "Highway Robbery", station: "Pahala PS" },
          { id: "OD/BBS/2026/0542", type: "Chain Snatching", station: "Khandagiri PS" }
        ]
      },
      actions: [
        { label: 'VIEW ANOMALY RADAR', route: '/anomalies', primary: true }
      ]
    };
  }

  if (q.includes('repeat offenders') || q.includes('risk score > 70') || q.includes('risk score >')) {
    return {
      intent: 'REPEAT_OFFENDER_INTEL',
      response: "Here is the Intelligence Brief for High-Risk Repeat Offenders.",
      structuredData: {
        title: "Intelligence Brief: High-Risk Subjects",
        stats: [
          { label: "Total High-Risk Subjects", value: "8 active subjects with Risk Score > 70." },
          { label: "Primary Modus Operandi (M.O.)", value: "Armed Robbery (3), Cyber Fraud (2), Vehicle Theft Syndicate (2)." },
          { label: "Recent Sighting Hotspots", value: "Master Canteen Square, Khandagiri Checkpoint, Palasuni Toll Gate." }
        ],
        listTitle: "Top High-Risk Dockets:",
        items: [
          {
            id: "CR-KHD-2026-00504",
            location: "Bhubaneswar Urban (Khandagiri PS)",
            date: "2026-09-01",
            accused: "Ramesh \"Bullet\" Nayak",
            riskScore: 88,
            description: "M.O.: Armed Highway Robbery. Last detected by ANPR Camera CAM-BBSR-0012 near Master Canteen Square at 23:45 IST."
          },
          {
            id: "CR-KHD-2026-00541",
            location: "Bhubaneswar Urban (Cyber Cell)",
            date: "2026-09-01",
            accused: "Vikram \"Shadow\" Das",
            riskScore: 82,
            description: "M.O.: Financial Spear-Phishing. Linked to pass-through mule account OD-MULE-441."
          }
        ]
      },
      actions: [
        { label: 'OPEN IDENTITY REVIEW', route: '/identity-review', primary: true },
        { label: 'TRIGGER CCTV ALERT', route: '/cctv' }
      ]
    };
  }

  if (q.includes('fir-2026-bbsr-4921')) {
    return {
      intent: 'SPECIFIC_CASE_INSPECT',
      response: "Here is the CCTNS Docket Viewer for FIR-2026-BBSR-4921.",
      structuredData: {
        title: "CCTNS Docket Viewer: FIR-2026-BBSR-4921",
        stats: [
          { label: "Case Title", value: "Commercial Burglary & Pass-Through Money Trail" },
          { label: "Jurisdiction", value: "Khandagiri PS (Code: OP-KHD-01)" },
          { label: "Investigating Officer", value: "Inspector S. Mohanty" },
          { label: "Current Status", value: "UNDER INVESTIGATION (Priority: HIGH)" }
        ],
        listTitle: "Case Summary & Intelligence:",
        items: [
          {
            id: "FIR-2026-BBSR-4921",
            location: "Bhubaneswar Urban (Khandagiri PS)",
            date: "2026-09-01",
            description: "Extensive burglary reported at a commercial complex. Primary suspect vehicle (Silver Maruti Swift OD-02-AB-1234) intercepted via ANPR on NH-16. Financial Intelligence Unit (FIU) has traced structured deposits under ₹50k to mule account OD-MULE-441, suggesting a coordinated money laundering effort by the syndicate."
          }
        ],
        connectedDockets: [
          { id: "OD-MULE-441", type: "Suspicious Account", station: "Cyber Cell" },
          { id: "OD-02-AB-1234", type: "Flagged Vehicle", station: "Traffic PS" }
        ]
      },
      actions: [
        { label: 'OPEN CASE WORKSPACE', route: '/cases/CR-KHD-2026-00504', primary: true }
      ]
    };
  }

  // Helper to extract case references or numbers (e.g. 504, 541, 0001, 00981)
  const findMatchingCase = (searchQuery: string = q): CaseRecord | undefined => {
    // 1. Look for standard case ID prefixes (CR-..., OD-..., FIR/...)
    const idMatch = searchQuery.match(/(cr|od|fir)[a-z0-9-]+/i);
    if (idMatch) {
      const matchId = idMatch[0].toUpperCase();
      const found = cases.find(
        (c) =>
          c.id.toUpperCase() === matchId ||
          c.id.replace(/-/g, '').toUpperCase() === matchId.replace(/-/g, '') ||
          c.firNumber.replace(/[\/\s-]/g, '').toUpperCase().includes(matchId.replace(/[\/\s-]/g, ''))
      );
      if (found) return found;
    }

    // 2. Numerical matches (e.g. 504, 541, 0001)
    const numberMatches = searchQuery.match(/\d+/g);
    if (numberMatches) {
      for (const numStr of numberMatches) {
        if (numStr.length >= 2) {
          const found = cases.find(
            (c) =>
              c.firNumber.includes(numStr) ||
              c.id.includes(numStr) ||
              c.id.replace(/[^0-9]/g, '').includes(numStr)
          );
          if (found) return found;
        }
      }
    }

    // 3. Fallback to active case in workspace
    if (context.currentCaseId) {
      const found = cases.find((c) => c.id === context.currentCaseId);
      if (found) return found;
    }

    return undefined;
  };

  const getCaseRoute = (caseId: string) => `/cases/${caseId}`;

  // ===========================================================================
  // 1. DIRECT FIR / CASE SPECIFIC COMMANDS (Priority 1)
  // ===========================================================================

  // Knowledge Graph for a specific FIR
  if (
    q.includes('knowledge graph') ||
    q.includes('graph for fir') ||
    q.includes('graph of fir') ||
    q.includes('relationships for fir') ||
    q.includes('relationships in fir') ||
    q.includes('relationships of fir') ||
    q.includes('investigation graph') ||
    q.includes('visualize fir') ||
    q.includes('connections for fir') ||
    q.includes('connections in fir') ||
    (q.includes('graph') && (q.includes('504') || q.includes('541') || q.includes('fir') || q.includes('case')))
  ) {
    const targetCase = findMatchingCase() || cases.find((c) => c.id === 'CR-KHD-2026-00504') || cases[0];
    if (targetCase) {
      const graphRoute = `/cases/${targetCase.id}?tab=graph`;
      return {
        intent: 'OPEN_FIR_KNOWLEDGE_GRAPH',
        response: `Opening knowledge graph for ${targetCase.firNumber} (${targetCase.title}).`,
        actions: [
          { label: 'OPEN KNOWLEDGE GRAPH', route: graphRoute, primary: true },
          { label: 'GLOBAL NETWORK EXPLORER', route: '/network' },
        ],
        route: graphRoute,
        caseData: targetCase,
      };
    }
  }

  // Case lookup / "Tell me about FIR 504 / 541"
  if (
    q.includes('tell me about') ||
    q.includes('tell me everything about') ||
    q.includes('what is fir') ||
    q.includes('details of fir') ||
    q.includes('details about fir') ||
    q.includes('explain fir') ||
    q.includes('summary of fir') ||
    q.includes('information on fir') ||
    q.includes('info on fir')
  ) {
    const targetCase = findMatchingCase() || cases.find((c) => c.id === 'CR-KHD-2026-00504') || cases[0];
    if (targetCase) {
      const station = stations.find((s) => s.id === targetCase.stationId);
      const stationName = station?.name || 'Khandagiri Police Station';
      const entityCount = targetCase.entities?.length || (targetCase.linkedCaseIds?.length || 0) + 1;
      const suspectStr = targetCase.suspects && targetCase.suspects.length > 0 ? targetCase.suspects.join(', ') : 'Under identification';

      return {
        intent: 'CASE_SUMMARY',
        response: `FIR ${targetCase.firNumber.replace(/^FIR\s*/i, '')} is a ${targetCase.crimeType.toLowerCase()} investigation registered at ${stationName}. The case is currently ${targetCase.status.toLowerCase()}. I found ${entityCount} linked intelligence records and suspect reference (${suspectStr}).`,
        actions: [
          { label: 'OPEN CASE FILE', route: getCaseRoute(targetCase.id), primary: true },
          { label: 'VIEW NETWORK GRAPH', route: `/network` },
          { label: 'VIEW EVIDENCE', route: `/evidence` }
        ],
        route: getCaseRoute(targetCase.id),
        caseData: targetCase
      };
    }
  }

  // "Open FIR 504" / "Take me to FIR 504" / "Show me FIR 504" / "Open case 541"
  if (
    q.includes('open fir') ||
    q.includes('open case') ||
    q.includes('take me to fir') ||
    q.includes('take me to case') ||
    q.includes('show me fir') ||
    q.includes('show fir') ||
    q.includes('view fir') ||
    q.includes('view case') ||
    q.includes('case ') ||
    q.includes('fir ') ||
    q.includes('504') ||
    q.includes('541') ||
    q.includes('0142') ||
    q.includes('0081')
  ) {
    const targetCase = findMatchingCase() || cases.find((c) => c.id === 'CR-KHD-2026-00541' || c.id === 'CR-KHD-2026-00504') || {
      id: 'CR-KHD-2026-00541',
      firNumber: 'FIR 541',
      title: 'Commercial Heist & Pass-Through Money Trail',
      crimeType: 'Armed Robbery',
      status: 'INVESTIGATING',
      priority: 'HIGH'
    } as any;


    const caseRoute = getCaseRoute(targetCase.id);
    return {
      intent: 'OPEN_CASE',
      response: `Opening case workspace for ${targetCase.firNumber} (${targetCase.title}).`,
      actions: [
        { label: 'OPEN CASE WORKSPACE', route: caseRoute, primary: true }
      ],
      route: caseRoute,
      caseData: targetCase
    };
  }

  // ===========================================================================
  // 2. CORE DEMO NAVIGATION COMMANDS & ADVANCED MODULES
  // ===========================================================================

  // Money Trail Module
  if (q.includes('money trail') || q.includes('money') || q.includes('mule') || q.includes('aml') || q.includes('bank') || q.includes('transaction')) {
    return {
      intent: 'OPEN_MONEY_TRAIL',
      response: 'Opening Money Trail Workspace. Analyzing multi-layered pass-through transactions and mule account candidates.',
      actions: [
        { label: 'GO TO MONEY TRAIL', route: '/money-trail', primary: true }
      ],
      route: '/money-trail'
    };
  }

  // Vehicle Geo-Trail Module
  if (q.includes('vehicle trail') || q.includes('geo trail') || q.includes('geo-trail') || q.includes('trail') || q.includes('camera hopping') || q.includes('anpr trail')) {
    return {
      intent: 'OPEN_GEO_TRAIL',
      response: 'Opening Vehicle Geo-Trail Tracker. Reconstructing sequential camera sighting hops for OD-02-AB-1234.',
      actions: [
        { label: 'GO TO VEHICLE GEO-TRAIL', route: '/trail', primary: true }
      ],
      route: '/trail'
    };
  }

  // GIS Crime Map Page
  if (q.includes('gis crime map') || q.includes('crime map') || q.includes('gis map') || q.includes('hotspot map') || q.includes('map')) {
    return {
      intent: 'OPEN_GIS_CRIME_MAP',
      response: 'Opening GIS Crime Density Map for Bhubaneswar-Cuttack corridor.',
      actions: [
        { label: 'GO TO GIS CRIME MAP', route: '/map', primary: true }
      ],
      route: '/map'
    };
  }

  // Identity Review Module
  if (q.includes('identity review') || q.includes('identity') || q.includes('entity resolution') || q.includes('canonical person')) {
    return {
      intent: 'OPEN_IDENTITY_REVIEW',
      response: 'Opening Glass-Box Identity Review & Entity Resolution Desk.',
      actions: [
        { label: 'GO TO IDENTITY REVIEW', route: '/identity-review', primary: true }
      ],
      route: '/identity-review'
    };
  }

  // Anomaly Radar Module
  if (q.includes('anomaly radar') || q.includes('anomalies') || q.includes('anomaly') || q.includes('spikes') || q.includes('outliers')) {
    return {
      intent: 'OPEN_ANOMALY_RADAR',
      response: 'Opening Glass-Box Anomaly Radar. Scanning jurisdictional crime surges and M.O. deviations.',
      actions: [
        { label: 'GO TO ANOMALY RADAR', route: '/anomalies', primary: true }
      ],
      route: '/anomalies'
    };
  }

  // "Show my cases" / "Show assigned cases"


  // "Show my cases" / "Show assigned cases"
  if (q.includes('show my cases') || q.includes('my cases') || q.includes('assigned cases') || q.includes('show my investigations')) {
    const myCases = cases.filter((c) => c.investigatorId === 'INV-BBSR-001' || c.investigatorId === context.currentUser);
    const count = myCases.length || 5;
    return {
      intent: 'SHOW_MY_CASES',
      response: `Opening your active case desk. You have ${count} assigned investigations at your station.`,
      actions: [
        { label: 'OPEN CASE DESK', route: '/cases', primary: true }
      ],
      route: '/cases'
    };
  }

  // "Show pending cases" / "What cases are pending"
  if (
    q.includes('pending cases') ||
    q.includes('show pending') ||
    q.includes('what cases are pending') ||
    q.includes('pending investigations') ||
    q.includes('open pending')
  ) {
    const pendingCount = cases.filter((c) => c.status === 'INVESTIGATING' || c.status === 'PENDING').length;
    return {
      intent: 'SHOW_PENDING_CASES',
      response: `Displaying ${pendingCount} pending investigations across active police stations.`,
      actions: [
        { label: 'VIEW PENDING CASES', route: '/cases?filter=pending', primary: true }
      ],
      route: '/cases?filter=pending'
    };
  }

  // "Open Evidence Vault"
  if (
    q.includes('evidence vault') ||
    q.includes('open evidence') ||
    q.includes('evidence locker') ||
    q.includes('show evidence') ||
    q.includes('vault')
  ) {
    return {
      intent: 'OPEN_EVIDENCE_VAULT',
      response: 'Opening the Evidence Vault. Ingest unstructured documents, logs, and extract vehicle or phone entities.',
      actions: [
        { label: 'GO TO EVIDENCE VAULT', route: '/evidence', primary: true }
      ],
      route: '/evidence'
    };
  }

  // "Open Network Explorer" / "Show knowledge graph"
  if (
    q.includes('network explorer') ||
    q.includes('open network') ||
    q.includes('knowledge graph') ||
    q.includes('entity graph') ||
    q.includes('relationship graph') ||
    q.includes('link graph') ||
    q.includes('network graph')
  ) {
    return {
      intent: 'OPEN_NETWORK_EXPLORER',
      response: 'Opening Network Explorer. Statewide multi-hop entity relationships and cross-station links are loaded.',
      actions: [
        { label: 'VIEW NETWORK EXPLORER', route: '/network', primary: true }
      ],
      route: '/network'
    };
  }

  // "Open Legal Intelligence" / "Scan applicable BNS provisions"
  if (
    q.includes('legal intelligence') ||
    q.includes('open legal') ||
    q.includes('bns provisions') ||
    q.includes('bns sections') ||
    q.includes('applicable bns') ||
    q.includes('what bns') ||
    q.includes('legal charges') ||
    q.includes('bnss')
  ) {
    return {
      intent: 'OPEN_LEGAL_INTELLIGENCE',
      response: 'Accessing Bharatiya Nyaya Sanhita (BNS) intelligence and procedural recommendations.',
      actions: [
        { label: 'EXPLORE BNS PROVISIONS', route: '/legal', primary: true },
        { label: 'GENERATE CHARGE SHEET DRAFT', route: '/reports' }
      ],
      route: '/legal'
    };
  }

  // "Show crime hotspots" / "Show hotspots"
  if (
    q.includes('crime hotspots') ||
    q.includes('show hotspots') ||
    q.includes('hotspots') ||
    q.includes('hotspot') ||
    q.includes('crime map') ||
    q.includes('workload trends')
  ) {
    return {
      intent: 'SHOW_CRIME_HOTSPOTS',
      response: 'Opening crime hotspot and district intelligence analytics. Khordha and Cuttack corridors show elevated burglary indices.',
      actions: [
        { label: 'VIEW CRIME HOTSPOTS', route: '/reports', primary: true }
      ],
      route: '/reports'
    };
  }

  // "Find similar crimes" / "Similar cases"
  if (
    q.includes('similar crimes') ||
    q.includes('similar cases') ||
    q.includes('find similar') ||
    q.includes('matching modus operandi') ||
    q.includes('crime similarity')
  ) {
    const activeCase = findMatchingCase() || cases.find((c) => c.id === 'CR-KHD-2026-00504');
    const titleStr = activeCase ? ` for ${activeCase.firNumber}` : '';
    return {
      intent: 'FIND_SIMILAR_CRIMES',
      response: `Searching multi-jurisdiction pattern matrix${titleStr}. Identified cross-station match with Case OD-CTC-2026-00981 (Cuttack City PS).`,
      actions: [
        { label: 'VIEW SIMILARITY GRAPH', route: '/network?mode=similarity', primary: true },
        { label: 'REQUEST ACCESS', route: '/requests' }
      ],
      route: '/network?mode=similarity'
    };
  }

  // "Open CCTV"
  if (q.includes('open cctv') || q.includes('cctv feeds') || q.includes('cctv') || q.includes('surveillance') || q.includes('camera')) {
    return {
      intent: 'OPEN_CCTV',
      response: 'Accessing live CCTV traffic and surveillance feeds for Bhubaneswar and Cuttack junctions.',
      actions: [
        { label: 'OPEN CCTV MODULE', route: '/cctv', primary: true }
      ],
      route: '/cctv'
    };
  }

  // "Generate report" / "Draft charge sheet"
  if (
    q.includes('generate report') ||
    q.includes('create report') ||
    q.includes('draft report') ||
    q.includes('charge sheet') ||
    q.includes('investigation report') ||
    q.includes('case report')
  ) {
    return {
      intent: 'GENERATE_REPORT',
      response: 'Opening the Case Reports and Automated Charge-Sheet Drafting desk.',
      actions: [
        { label: 'OPEN REPORT GENERATOR', route: '/reports', primary: true }
      ],
      route: '/reports'
    };
  }

  // "Show case timeline" / "Case progress"
  if (q.includes('timeline') || q.includes('case timeline') || q.includes('investigation progress') || q.includes('progress')) {
    const targetCase = findMatchingCase() || cases.find((c) => c.id === 'CR-KHD-2026-00504') || cases[0];
    return {
      intent: 'SHOW_CASE_TIMELINE',
      response: `Opening chronological investigation timeline for ${targetCase.firNumber}.`,
      actions: [
        { label: 'VIEW TIMELINE', route: `${getCaseRoute(targetCase.id)}?tab=overview`, primary: true }
      ],
      route: `${getCaseRoute(targetCase.id)}?tab=overview`,
      caseData: targetCase
    };
  }

  // "Check cross-station matches" / "State alerts"
  if (
    q.includes('cross-station') ||
    q.includes('cross station') ||
    q.includes('state alerts') ||
    q.includes('intelligence alerts') ||
    q.includes('alerts')
  ) {
    return {
      intent: 'CHECK_CROSS_STATION_MATCHES',
      response: 'Cross-station intelligence scan active: Vehicle plate OD-02-AB-1234 and phone +91-9876543210 matched between Khandagiri PS and Cuttack City PS.',
      actions: [
        { label: 'VIEW INTELLIGENCE ALERTS', route: '/intelligence/alerts', primary: true },
        { label: 'VIEW NETWORK LINK', route: '/network' }
      ],
      route: '/intelligence/alerts'
    };
  }

  // "Register FIR" / "New case"
  if (
    q.includes('register fir') ||
    q.includes('new fir') ||
    q.includes('register case') ||
    q.includes('file case') ||
    q.includes('file fir') ||
    q.includes('new case')
  ) {
    return {
      intent: 'REGISTER_FIR',
      response: 'Opening smart FIR registration intake with real-time AI entity extraction.',
      actions: [
        { label: 'REGISTER NEW FIR', route: '/cases/new', primary: true }
      ],
      route: '/cases/new'
    };
  }

  // "Open Stations" / "Police stations"
  if (q.includes('stations') || q.includes('police stations') || q.includes('station registry')) {
    return {
      intent: 'OPEN_STATIONS',
      response: 'Opening Statewide Police Stations Registry overview.',
      actions: [
        { label: 'VIEW STATIONS', route: '/stations', primary: true }
      ],
      route: '/stations'
    };
  }

  // "Open Investigators" / "Officers"
  if (q.includes('investigators') || q.includes('officers') || q.includes('police officers') || q.includes('station staff')) {
    return {
      intent: 'OPEN_OFFICERS',
      response: 'Opening Station Investigators Roster and workload assignment desk.',
      actions: [
        { label: 'VIEW OFFICERS', route: '/investigators', primary: true }
      ],
      route: '/investigators'
    };
  }

  // "Open Access Requests"
  if (q.includes('access requests') || q.includes('requests') || q.includes('dossier access') || q.includes('permission')) {
    return {
      intent: 'OPEN_ACCESS_REQUESTS',
      response: 'Opening Cross-Station Access Requests and jurisdictional authorizations desk.',
      actions: [
        { label: 'VIEW ACCESS REQUESTS', route: '/requests', primary: true }
      ],
      route: '/requests'
    };
  }

  // "Open Dashboard" / "Command Center"
  if (q.includes('dashboard') || q.includes('command center') || q.includes('home') || q.includes('main screen')) {
    return {
      intent: 'OPEN_DASHBOARD',
      response: 'Navigating to Odisha Police State Command Center Dashboard.',
      actions: [
        { label: 'GO TO DASHBOARD', route: '/dashboard', primary: true }
      ],
      route: '/dashboard'
    };
  }

  // ===========================================================================
  // 3. VEHICLE & TELECOM ENTITY LOOKUP
  // ===========================================================================

  if (q.includes('vehicle') || q.includes('car') || q.includes('plate') || q.includes('od-02') || q.includes('od-')) {
    return {
      intent: 'ENTITY_VEHICLE_LOOKUP',
      response: `Vehicle Intelligence: Vehicle registration **OD-02-AB-1234** is linked across 3 active investigations (Khandagiri PS & Cuttack City PS). Cross-station match is verified with 96% confidence.`,
      actions: [
        { label: 'VIEW IN NETWORK GRAPH', route: '/network', primary: true },
        { label: 'VIEW EVIDENCE', route: '/evidence' },
        { label: 'REQUEST DOSSIER ACCESS', route: '/requests' }
      ],
      route: '/network'
    };
  }

  if (q.includes('phone') || q.includes('mobile') || q.includes('number') || q.includes('call') || q.includes('9876')) {
    return {
      intent: 'ENTITY_PHONE_LOOKUP',
      response: `Telecom Intelligence: Mobile number **+91-9876543210** detected in CDR logs for Burglary (Case OD-BBSR-2026-0001) and Badambadi Armed Heist (Case OD-CTC-2026-00981).`,
      actions: [
        { label: 'VIEW IN NETWORK GRAPH', route: '/network', primary: true },
        { label: 'REQUEST DOSSIER ACCESS', route: '/requests' }
      ],
      route: '/network'
    };
  }

  // Generic fallback with case matches if any case ID was referenced
  const matchedCase = findMatchingCase();
  if (matchedCase) {
    const station = stations.find((s) => s.id === matchedCase.stationId);
    const stationName = station?.name || 'Khandagiri Police Station';
    return {
      intent: 'CASE_LOOKUP',
      response: `Case Record **${matchedCase.firNumber}**: ${matchedCase.title} registered at ${stationName}. Current status: **${matchedCase.status}** with priority **${matchedCase.priority}**.`,
      actions: [
        { label: 'OPEN CASE WORKSPACE', route: getCaseRoute(matchedCase.id), primary: true },
        { label: 'VIEW NETWORK', route: '/network' }
      ],
      route: getCaseRoute(matchedCase.id),
      caseData: matchedCase
    };
  }

  // Default Operational Greeting & Command Suggestions
  return {
    intent: 'GENERAL_ASSISTANCE',
    response: `I am AIRA, your S.I.R.I.S Intelligence Assistant. I am connected to the Odisha Police investigation network. You can ask me to open cases (e.g. "Tell me about FIR 504"), show pending cases, open the Evidence Vault, or check cross-station hotspots.`,
    actions: [
      { label: 'SHOW MY CASES', route: '/cases', primary: true },
      { label: 'OPEN EVIDENCE VAULT', route: '/evidence' },
      { label: 'VIEW NETWORK GRAPH', route: '/network' }
    ]
  };
}
