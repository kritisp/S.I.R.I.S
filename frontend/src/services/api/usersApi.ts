import { apiClient } from './client';
import type { User } from '../../mockServices/types';

export interface OfficerCaseload {
  officerId: string;
  officerName: string;
  rank?: string;
  stationId?: string;
  totalCases: number;
  activeCases: number;
  pendingCases: number;
  solvedCases: number;
}

export const usersApi = {
  getUsers: async (stationId?: string): Promise<User[]> => {
    const url = stationId ? `/users?stationId=${encodeURIComponent(stationId)}` : '/users';
    return apiClient.get<User[]>(url);
  },

  createUser: async (payload: Partial<User>): Promise<User> => {
    return apiClient.post<User>('/users', payload);
  },

  toggleUserStatus: async (id: string): Promise<User> => {
    return apiClient.patch<User>(`/users/${encodeURIComponent(id)}/status`);
  },

  getOfficerCaseload: async (id: string): Promise<OfficerCaseload> => {
    return apiClient.get<OfficerCaseload>(`/users/${encodeURIComponent(id)}/caseload`);
  },
};
