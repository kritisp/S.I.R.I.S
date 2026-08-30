import { apiClient } from './client';
import type { AccessRequest } from '../../mockServices/types';

export const requestsApi = {
  createRequest: async (targetCaseId: string, reason: string): Promise<AccessRequest> => {
    return apiClient.post<AccessRequest>('/requests', { targetCaseId, reason });
  },

  getIncomingRequests: async (): Promise<AccessRequest[]> => {
    return apiClient.get<AccessRequest[]>('/requests/incoming');
  },

  getOutgoingRequests: async (): Promise<AccessRequest[]> => {
    return apiClient.get<AccessRequest[]>('/requests/outgoing');
  },

  approveRequest: async (id: string): Promise<AccessRequest> => {
    return apiClient.patch<AccessRequest>(`/requests/${encodeURIComponent(id)}/approve`);
  },

  rejectRequest: async (id: string): Promise<AccessRequest> => {
    return apiClient.patch<AccessRequest>(`/requests/${encodeURIComponent(id)}/reject`);
  },
};
