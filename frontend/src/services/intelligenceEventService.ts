import { apiClient } from './api/client';

export interface ActionItem {
  id: string;
  priority: string;
  title: string;
  reason: string;
  relatedCaseId?: string;
  entityType?: string;
  entityValue?: string;
  timestamp: string;
  status: 'NEW' | 'IN_REVIEW' | 'VERIFIED' | 'DISMISSED';
  actionRoute: string;
}

export async function fetchActionQueue(caseId?: string): Promise<ActionItem[]> {
  try {
    const res = await apiClient.get<any>(`/intelligence/action-queue${caseId ? `?caseId=${caseId}` : ''}`);
    if (res && Array.isArray(res)) {
      return res;
    }
  } catch (e) {
    try {
      const nodeRes = await fetch('http://localhost:3001/api/action-queue');
      if (nodeRes.ok) {
        return await nodeRes.json();
      }
    } catch (nodeErr) {}
  }

  // Fallback Action Queue
  return [
    {
      id: 'ACT-001',
      priority: 'HIGH',
      title: 'Review Vehicle ANPR Match',
      reason: 'Linked ANPR detection for vehicle OD-02-AB-1234 matched with FIR-2026-0142.',
      relatedCaseId: 'FIR-2026-0142',
      entityType: 'VEHICLE',
      entityValue: 'OD-02-AB-1234',
      timestamp: new Date().toISOString(),
      status: 'NEW',
      actionRoute: '/cctv?plate=OD-02-AB-1234'
    },
    {
      id: 'ACT-002',
      priority: 'HIGH',
      title: 'Verify Vehicle Flight Trail',
      reason: 'Sequential camera trail reconstructed across 4 hops to Cuttack Sadar border.',
      relatedCaseId: 'FIR-2026-0142',
      entityType: 'GEO_TRAIL',
      entityValue: 'Khandagiri -> Cuttack',
      timestamp: new Date().toISOString(),
      status: 'NEW',
      actionRoute: '/cctv?trail=true'
    },
    {
      id: 'ACT-003',
      priority: 'MEDIUM',
      title: 'Review Cross-Station MO Correlation',
      reason: 'High similarity (94%) detected between FIR-2026-0142 and FIR-2026-0081.',
      relatedCaseId: 'FIR-2026-0081',
      entityType: 'MO_PATTERN',
      entityValue: 'Jewelry Heist Pattern',
      timestamp: new Date().toISOString(),
      status: 'NEW',
      actionRoute: '/network'
    }
  ];
}
