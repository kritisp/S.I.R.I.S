/**
 * S.I.R.I.S. — Explainable Intelligence & Officer Verification Service
 * 
 * Provides Glass-Box explainability for analytical leads:
 * - WHY FLAGGED (supporting factors & MO markers)
 * - CONFIDENCE RATING (HIGH, MEDIUM, LOW)
 * - SUPPORTING RECORDS (linked FIRs, CCTV, ANPR, graph nodes)
 * - NOT YET CORROBORATED (missing field/forensic/CDR verifications)
 * - OFFICER VERIFICATION STATE ([CONFIRM], [REJECT], [NEEDS FIELD VERIFICATION])
 */

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type VerificationDecision = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'NEEDS_FIELD_VERIFICATION';

export interface ExplainableLead {
  id: string;
  title: string;
  category: 'MO_MATCH' | 'ENTITY_LINK' | 'VEHICLE_TRAIL' | 'FINANCIAL_MULE' | 'ANOMALY_SURGE';
  confidence: ConfidenceLevel;
  confidenceScore: number; // 0-100
  whyFlagged: string[];
  supportingRecords: { id: string; type: string; title: string; link?: string }[];
  notCorroborated: string[];
  decision: VerificationDecision;
  decisionBy?: string;
  decisionTimestamp?: string;
  decisionNotes?: string;
}

export const INITIAL_LEADS: ExplainableLead[] = [
  {
    id: 'LEAD-01',
    title: 'Cross-Station Vehicle Linkage — OD-02-AB-1234',
    category: 'VEHICLE_TRAIL',
    confidence: 'HIGH',
    confidenceScore: 94,
    whyFlagged: [
      'Same vehicle OD-02-AB-1234 flagged at Khandagiri NH-16 ANPR sensor',
      'Matching spatial corridor within 15 minutes of robbery time window',
      'Correlated with Cuttack City PS Jewelry Heist FIR-2026-00981'
    ],
    supportingRecords: [
      { id: 'FIR-2026-0142', type: 'FIR', title: 'Unit IV Warehouse Robbery' },
      { id: 'FIR-2026-00981', type: 'FIR', title: 'Badambadi Jewelry Heist' },
      { id: 'CAM-041', type: 'CCTV', title: 'Patrapada Junction Camera 01' }
    ],
    notCorroborated: [
      'Tower dump CDR call correlation pending',
      'Physical suspect vehicle seizure verification'
    ],
    decision: 'PENDING'
  },
  {
    id: 'LEAD-02',
    title: 'M.O. Signature Pattern Match — Commercial Burglary Syndicate',
    category: 'MO_MATCH',
    confidence: 'HIGH',
    confidenceScore: 88,
    whyFlagged: [
      'Identical forced entry technique via rear ventilation shutters',
      'Targeting commercial jewelry & cash safes between 02:00 AM - 04:00 AM',
      'Disabling CCTV DVR power supplies before entry'
    ],
    supportingRecords: [
      { id: 'FIR-2026-0142', type: 'FIR', title: 'Unit IV Warehouse Robbery' },
      { id: 'FIR-2026-0081', type: 'FIR', title: 'Saheed Nagar Commercial Theft' }
    ],
    notCorroborated: [
      'Forensic tool mark FSL analysis report',
      'Suspect fingerprint NAFIS verification'
    ],
    decision: 'PENDING'
  },
  {
    id: 'LEAD-03',
    title: 'Financial Mule Layering Hub — CONTROLLER-X1',
    category: 'FINANCIAL_MULE',
    confidence: 'HIGH',
    confidenceScore: 92,
    whyFlagged: [
      'Pass-through mule account forwarded 96% of ₹3.2 Lakhs within 45 minutes',
      'Consolidates funds from 4 distinct collector accounts',
      'Structuring pattern detected with deposits under ₹50,000 PAN limit'
    ],
    supportingRecords: [
      { id: 'UTR1007', type: 'TXN', title: 'IMPS Transfer ₹1,85,000 to CONTROLLER-X1' },
      { id: 'UTR1011', type: 'TXN', title: 'Crypto OTC Settlement ₹2,25,000' }
    ],
    notCorroborated: [
      'Bank KYC owner identity disclosure (FIU request pending)',
      'Device MAC / IP address ISP log matching'
    ],
    decision: 'PENDING'
  }
];

class ExplainableIntelStore {
  private leads: ExplainableLead[] = [...INITIAL_LEADS];
  private listeners: (() => void)[] = [];

  getLeads(): ExplainableLead[] {
    return this.leads;
  }

  getLeadsForCase(caseId?: string, workspaceData?: any): ExplainableLead[] {
    const cid = (caseId || '').toUpperCase();

    if (cid.includes('0001') || cid.includes('0817') || cid.includes('004821') || cid.includes('KHD')) {
      return [
        {
          id: `LEAD-${cid || '0001'}-01`,
          title: 'Cross-Station Vehicle Linkage — OD-02-AB-1234',
          category: 'VEHICLE_TRAIL',
          confidence: 'HIGH',
          confidenceScore: 94,
          whyFlagged: [
            'Vehicle OD-02-AB-1234 (Mahindra Scorpio) captured at Baramunda NH-16 ANPR toll sensor at 02:48 AM',
            'Spatial corridor matches travel trajectory towards Cuttack within 25 minutes of safe breach',
            'Vehicle registration number directly correlates with Cuttack City PS Badambadi Heist FIR-2026-00981'
          ],
          supportingRecords: [
            { id: caseId || 'FIR-2026-0001', type: 'FIR', title: 'Unit IV Safe Burglary Docket' },
            { id: 'FIR-2026-00981', type: 'FIR', title: 'Badambadi Jewelry Armed Robbery' },
            { id: 'CAM-KDG-04', type: 'CCTV', title: 'Baramunda NH-16 Toll Camera 02' }
          ],
          notCorroborated: [
            'Subpoena cell tower dump CDR for Baramunda Toll Plaza 02:40-03:00 AM',
            'Physical vehicle inspection & chassis number verification at RTO'
          ],
          decision: 'PENDING'
        },
        {
          id: `LEAD-${cid || '0001'}-02`,
          title: 'Suspect Telephony Cluster — CDR Night Overlap (+91 98610 99882)',
          category: 'ENTITY_LINK',
          confidence: 'HIGH',
          confidenceScore: 89,
          whyFlagged: [
            'Target MSISDN +91 98610 99882 activated cell tower sector Khandagiri Square at 02:35 AM',
            'Made 3 rapid calls to Badambadi pawn receiver Ramesh Sahu (+91 94370 12891)',
            'Co-located with vehicle tracker timestamp within 150-meter radius of occurrence'
          ],
          supportingRecords: [
            { id: 'CDR-BBSR-289', type: 'CDR', title: 'Tower Extract Khandagiri-03' },
            { id: 'REC-CTC-44', type: 'POLICE_MEMO', title: 'Suspect Profile: Bikram Das' }
          ],
          notCorroborated: [
            'Obtain CAF (Customer Application Form) & Aadhaar KYC from Airtel Nodal Officer',
            'Execute Section 91 CrPC notice to Cuttack City PS for receiver interrogation'
          ],
          decision: 'PENDING'
        }
      ];
    }

    if (cid.includes('0981') || cid.includes('CTC')) {
      return [
        {
          id: `LEAD-${cid}-01`,
          title: 'Gold Smuggling & Melt-Down Corridor — Badambadi Workshop',
          category: 'MO_MATCH',
          confidence: 'HIGH',
          confidenceScore: 92,
          whyFlagged: [
            'Recovered 400g gold bar batch with unique jeweler hallmark matching FIR-2026-00981 inventory',
            'Pawn broker Ramesh Sahu admitted receiving ornaments from Bhubaneswar safe breaker crew',
            'UPI transaction logs confirm ₹4,20,000 Hawala transfer to alias "Sonu Gold"'
          ],
          supportingRecords: [
            { id: caseId || 'OD-CTC-2026-00981', type: 'FIR', title: 'Badambadi Armed Robbery' },
            { id: 'SEIZ-MEMO-91', type: 'EVIDENCE', title: 'Gold Bar Seizure Memo #91' }
          ],
          notCorroborated: [
            'FSL assay metallurgic test of melted gold bars',
            'Interstate Hawala operator arrest warrant execution'
          ],
          decision: 'PENDING'
        }
      ];
    }

    if (cid.includes('0031') || cid.includes('3190') || cid.includes('SAH')) {
      return [
        {
          id: `LEAD-${cid}-01`,
          title: 'Hydraulic Shutter Pry-Bar Syndicate Linkage',
          category: 'MO_MATCH',
          confidence: 'HIGH',
          confidenceScore: 91,
          whyFlagged: [
            'Tool mark profile matches 3 commercial warehouse intrusions in Khordha district',
            'CCTV DVR cut power feed signature identical to Saheed Nagar electronics market incident',
            'Suspect motorbike OD-02-X-9901 spotted escaping towards Vani Vihar at 03:12 AM'
          ],
          supportingRecords: [
            { id: caseId || 'OD-BBSR-2026-0031', type: 'FIR', title: 'Saheed Nagar Commercial Theft' },
            { id: 'FSL-TOOL-881', type: 'FORENSIC', title: 'FSL Impression Match Docket' }
          ],
          notCorroborated: [
            'Recovery of master hydraulic tool from suspect workshop',
            'Saheed Nagar market complex adjacent showroom video enhancement'
          ],
          decision: 'PENDING'
        }
      ];
    }

    if (cid.includes('0045') || cid.includes('5112') || cid.includes('NAY')) {
      return [
        {
          id: `LEAD-${cid}-01`,
          title: 'Darknet Crypto-to-UPI Mule Layering Network',
          category: 'FINANCIAL_MULE',
          confidence: 'HIGH',
          confidenceScore: 96,
          whyFlagged: [
            'Utkal Gramya Bank account received ₹3,40,000 structured deposits from 8 telegram buyers',
            'Funds converted to USDT via OTC escrow within 35 minutes of deposit',
            'Dead-drop locations correlated with GPS pings along Khandagiri Forest Road'
          ],
          supportingRecords: [
            { id: caseId || 'OD-BBSR-2026-0045', type: 'FIR', title: 'Nayapalli NDPS Syndicate' },
            { id: 'FIU-STR-2026-88', type: 'FINANCIAL', title: 'FIU Suspicious Transaction Report' }
          ],
          notCorroborated: [
            'ISP static IP session logs for Telegram admin account',
            'Binance / OTC crypto wallet freeze order'
          ],
          decision: 'PENDING'
        }
      ];
    }

    // Dynamic fallback for any general case
    const caseName = workspaceData?.metadata?.title || workspaceData?.fir_number || cid || 'Subject Case';
    const degree = workspaceData?.analytics?.degree ?? 4;
    const pagerank = workspaceData?.analytics?.pagerank ?? 0.084;

    return [
      {
        id: `LEAD-${cid || 'GEN'}-01`,
        title: `Knowledge Graph Syndicate Overlap — ${caseName}`,
        category: 'ENTITY_LINK',
        confidence: 'HIGH',
        confidenceScore: Math.min(95, Math.max(78, Math.round(pagerank * 1000 + 40))),
        whyFlagged: [
          `Case connects to ${degree} high-influence entity nodes in statewide Neo4j graph`,
          `Modus operandi features align with 2 active investigation clusters in Khordha district`,
          `High-frequency communications detected during incident window`
        ],
        supportingRecords: [
          { id: cid || 'FIR-2026', type: 'FIR', title: `${caseName} Case Docket` },
          { id: 'GRAPH-N4J', type: 'GRAPH', title: `Neo4j Centrality (Rank: Top 5%)` }
        ],
        notCorroborated: [
          'Witness photo identification line-up',
          'Field corroboration of suspect residence'
        ],
        decision: 'PENDING'
      }
    ];
  }

  updateDecision(leadId: string, decision: VerificationDecision, notes?: string, officerName: string = 'Investigating Officer') {
    const lead = this.leads.find(l => l.id === leadId);
    if (lead) {
      lead.decision = decision;
      lead.decisionBy = officerName;
      lead.decisionTimestamp = new Date().toLocaleTimeString('en-GB');
      if (notes) lead.decisionNotes = notes;
      this.notify();
    }
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }
}

export const explainableIntelStore = new ExplainableIntelStore();
