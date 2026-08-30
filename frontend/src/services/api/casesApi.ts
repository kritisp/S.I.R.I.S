import { apiClient } from './client';
import type { CaseRecord } from '../../mockServices/types';

export interface PagedCasesResponse {
  content: CaseRecord[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export const casesApi = {
  getCases: async (params?: {
    stationId?: string;
    investigatorId?: string;
    status?: string;
    priority?: string;
    crimeType?: string;
    query?: string;
    page?: number;
    size?: number;
  }): Promise<CaseRecord[]> => {
    const queryParts: string[] = [];
    if (params) {
      if (params.stationId && params.stationId !== 'ALL') queryParts.push(`stationId=${encodeURIComponent(params.stationId)}`);
      if (params.investigatorId) queryParts.push(`investigatorId=${encodeURIComponent(params.investigatorId)}`);
      if (params.status && params.status !== 'ALL') queryParts.push(`status=${encodeURIComponent(params.status)}`);
      if (params.priority && params.priority !== 'ALL') queryParts.push(`priority=${encodeURIComponent(params.priority)}`);
      if (params.crimeType && params.crimeType !== 'ALL') queryParts.push(`crimeType=${encodeURIComponent(params.crimeType)}`);
      if (params.query) queryParts.push(`query=${encodeURIComponent(params.query)}`);
      if (params.page !== undefined) queryParts.push(`page=${params.page}`);
      if (params.size !== undefined) queryParts.push(`size=${params.size}`);
    }

    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    const res = await apiClient.get<PagedCasesResponse | CaseRecord[]>(`/cases${queryString}`);

    if (Array.isArray(res)) {
      return res;
    }
    if (res && Array.isArray((res as PagedCasesResponse).content)) {
      return (res as PagedCasesResponse).content;
    }
    return [];
  },

  getCaseById: async (id: string): Promise<CaseRecord> => {
    return apiClient.get<CaseRecord>(`/cases/${encodeURIComponent(id)}`);
  },

  createCase: async (payload: Partial<CaseRecord>): Promise<CaseRecord> => {
    return apiClient.post<CaseRecord>('/cases', payload);
  },

  updateCase: async (id: string, payload: Partial<CaseRecord>): Promise<CaseRecord> => {
    return apiClient.put<CaseRecord>(`/cases/${encodeURIComponent(id)}`, payload);
  },

  assignInvestigator: async (id: string, investigatorId: string): Promise<CaseRecord> => {
    return apiClient.patch<CaseRecord>(`/cases/${encodeURIComponent(id)}/assign`, { investigatorId });
  },
};
