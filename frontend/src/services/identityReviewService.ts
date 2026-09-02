/**
 * S.I.R.I.S. — Glass-Box Pro Identity Resolution & Review Service
 * 
 * Detects possible identity candidate matches:
 * - Candidate pairs (Same person under different spellings vs Namesake warning)
 * - Matching reasons (Name Levenshtein distance, age overlap, station radius, phone match)
 * - OFFICER DECISION: Never auto-merged! Officer confirms or marks keep separate.
 */

export interface IdentityCandidatePair {
  id: string;
  verdict: 'LIKELY_SAME' | 'NAMESAKE_WARNING' | 'CONFIRMED_SAME' | 'KEPT_SEPARATE';
  confidenceScore: number;
  personA: {
    id: string;
    name: string;
    alias?: string;
    age: number;
    station: string;
    caseId: string;
    phone?: string;
  };
  personB: {
    id: string;
    name: string;
    alias?: string;
    age: number;
    station: string;
    caseId: string;
    phone?: string;
  };
  matchingReasons: string[];
  warningNote?: string;
  decisionBy?: string;
  decisionTimestamp?: string;
}

export const DEMO_IDENTITY_PAIRS: IdentityCandidatePair[] = [
  {
    id: 'IDP-01',
    verdict: 'LIKELY_SAME',
    confidenceScore: 92,
    personA: {
      id: 'SUS-0142',
      name: 'Rajesh Kumar',
      alias: 'Bullet Rajesh',
      age: 34,
      station: 'Khandagiri PS',
      caseId: 'FIR-2026-0142',
      phone: '+91-9876543210'
    },
    personB: {
      id: 'SUS-0842',
      name: 'Ramesh Kumar',
      alias: 'Bullet Ramesh',
      age: 35,
      station: 'Cuttack City PS',
      caseId: 'FIR-2024-BBSR-0842',
      phone: '+91-9876543210'

    },
    matchingReasons: [
      'Identical registered mobile phone number +91-9876543210',
      'Name Levenshtein distance = 2 (Rajesh vs Ramesh)',
      'Matching alias "Bullet"',
      'Co-linked to silver Swift vehicle OD-02-AB-1234'
    ],
    warningNote: 'High confidence candidate pair — officer confirmation required before entity merge.'
  },
  {
    id: 'IDP-02',
    verdict: 'NAMESAKE_WARNING',
    confidenceScore: 45,
    personA: {
      id: 'PER-8821',
      name: 'Suresh Mohanty',
      age: 28,
      station: 'Khandagiri PS',
      caseId: 'FIR-2026-0042'
    },
    personB: {
      id: 'PER-9912',
      name: 'Suresh Mohanty',
      age: 52,
      station: 'Berhampur Town PS',
      caseId: 'FIR-2026-0033'
    },
    matchingReasons: [
      'Exact string name match ("Suresh Mohanty")'
    ],
    warningNote: 'NAMESAKE WARNING: Age disparity (28 vs 52) and separate station jurisdictions. DO NOT MERGE.'
  }
];

class IdentityReviewStore {
  private pairs: IdentityCandidatePair[] = [...DEMO_IDENTITY_PAIRS];
  private listeners: (() => void)[] = [];

  getPairs(): IdentityCandidatePair[] {
    return this.pairs;
  }

  confirmMerge(pairId: string, officerName: string = 'Officer Ramesh') {
    const pair = this.pairs.find(p => p.id === pairId);
    if (pair) {
      pair.verdict = 'CONFIRMED_SAME';
      pair.decisionBy = officerName;
      pair.decisionTimestamp = new Date().toLocaleTimeString('en-GB');
      this.notify();
    }
  }

  keepSeparate(pairId: string, officerName: string = 'Officer Ramesh') {
    const pair = this.pairs.find(p => p.id === pairId);
    if (pair) {
      pair.verdict = 'KEPT_SEPARATE';
      pair.decisionBy = officerName;
      pair.decisionTimestamp = new Date().toLocaleTimeString('en-GB');
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

export const identityReviewStore = new IdentityReviewStore();
