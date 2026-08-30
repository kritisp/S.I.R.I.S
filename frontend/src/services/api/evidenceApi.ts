import { apiClient } from './client';
import type { Evidence } from '../../mockServices/types';

export const evidenceApi = {
  getEvidence: async (caseId?: string): Promise<Evidence[]> => {
    const url = caseId ? `/evidence?caseId=${encodeURIComponent(caseId)}` : '/evidence';
    return apiClient.get<Evidence[]>(url);
  },

  addEvidence: async (payload: Partial<Evidence>): Promise<Evidence> => {
    return apiClient.post<Evidence>('/evidence', payload);
  },
};
