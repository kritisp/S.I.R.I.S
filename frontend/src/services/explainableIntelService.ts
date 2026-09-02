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

  updateDecision(leadId: string, decision: VerificationDecision, notes?: string, officerName: string = 'Officer Ramesh') {
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
