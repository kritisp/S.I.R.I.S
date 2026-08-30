import { apiClient } from './client';
import type { IntelligenceAlert } from '../../mockServices/types';
import type { OfficerCaseload } from './usersApi';

export interface DashboardStats {
  totalCases: number;
  pendingCases: number;
  activeInvestigations: number;
  solvedCases: number;
  closedCases: number;
  crimeTypeCounts: Record<string, number>;
  recentAlerts: IntelligenceAlert[];
  caseloads: OfficerCaseload[];
}

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    return apiClient.get<DashboardStats>('/dashboard/stats');
  },
};
