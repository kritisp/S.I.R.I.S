import { apiClient } from './client';
import type { IntelligenceAlert } from '../../mockServices/types';

export const alertsApi = {
  getAlerts: async (): Promise<IntelligenceAlert[]> => {
    return apiClient.get<IntelligenceAlert[]>('/alerts');
  },

  markAsRead: async (id: string): Promise<IntelligenceAlert> => {
    return apiClient.patch<IntelligenceAlert>(`/alerts/${encodeURIComponent(id)}/read`);
  },
};
