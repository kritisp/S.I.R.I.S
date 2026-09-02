/**
 * S.I.R.I.S. — Glass-Box Pro Anomaly Radar Engine
 * 
 * Deterministic statistical scan:
 * - SURGE: Crime type volume >2x baseline
 * - EMERGING: Newly emerging pattern in area
 * - OFFENDER: Burst of 2+ fresh cases tied to offender in short window
 * - BACKLOG: Clearance rate collapse at station
 * - TIMING: High single-weekday concentration (>=55%)
 */

export interface AnomalyItem {
  id: string;
  kind: 'SURGE' | 'EMERGING' | 'OFFENDER' | 'BACKLOG' | 'TIMING';
  severity: number; // 0-100
  title: string;
  detail: string;
  why: string;
  metric: string;
  evidenceCases: { id: string; title: string }[];
}

export const DEMO_ANOMALIES: AnomalyItem[] = [
  {
    id: 'ANOM-01',
    kind: 'SURGE',
    severity: 94,
    title: 'Vehicle Theft Surge in Khandagiri Sub-Division',
    detail: '14 incidents in 30 days vs 4.2/month baseline — 3.3× normal volume.',
    why: 'Recent volume is 3.3× this area\'s 6-month average for vehicle theft.',
    metric: '3.3× baseline',
    evidenceCases: [
      { id: 'FIR-2026-0142', title: 'Unit IV Commercial Vehicle Theft' },
      { id: 'FIR-2026-0042', title: 'Saheed Nagar Commercial Theft' }
    ]
  },
  {
    id: 'ANOM-02',
    kind: 'OFFENDER',
    severity: 88,
    title: 'Offender Burst: Rajesh Kumar (SUS-0142)',
    detail: '3 fresh cases linked in the last 14 days across Khandagiri and Cuttack.',
    why: 'Multiple active robbery cases tied to one person in a short time window.',
    metric: '3 cases in 14 days',
    evidenceCases: [
      { id: 'FIR-2026-0142', title: 'Khandagiri Robbery' },
      { id: 'FIR-2026-00981', title: 'Badambadi Heist' }
    ]
  },
  {
    id: 'ANOM-03',
    kind: 'EMERGING',
    severity: 82,
    title: 'Emerging Pattern: Digital Arrest UPI Extortion',
    detail: '4 new cases in last 30 days with zero historical baseline.',
    why: 'No prior baseline existed for this cyber crime sub-type in Khandagiri PS.',
    metric: '4 new · 0 prior',
    evidenceCases: [
      { id: 'FIR-2026-0201', title: 'Digital Arrest Cyber Fraud' }
    ]
  },
  {
    id: 'ANOM-04',
    kind: 'TIMING',
    severity: 75,
    title: 'Commercial Burglary Clusters on Fridays',
    detail: '62% of commercial burglaries occurred between 02:00 AM - 04:00 AM on Fridays.',
    why: 'Strong single-weekday timing concentration useful for night patrol deployment.',
    metric: '62% on Fri',
    evidenceCases: [
      { id: 'FIR-2026-0142', title: 'Unit IV Warehouse' }
    ]
  }
];

export function getAnomalies(): AnomalyItem[] {
  return DEMO_ANOMALIES;
}
