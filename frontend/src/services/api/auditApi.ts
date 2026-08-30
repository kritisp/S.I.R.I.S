import { apiClient } from './client';

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userRole: string;
  stationId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details: string;
  ipAddress?: string;
}

export interface PagedAuditLogs {
  content: AuditLog[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export const auditApi = {
  getStationLogs: async (stationId: string, page = 0, size = 20): Promise<AuditLog[]> => {
    const res = await apiClient.get<PagedAuditLogs | AuditLog[]>(
      `/audit/station/${encodeURIComponent(stationId)}?page=${page}&size=${size}`
    );
    if (Array.isArray(res)) return res;
    if (res && Array.isArray((res as PagedAuditLogs).content)) return (res as PagedAuditLogs).content;
    return [];
  },

  getUserLogs: async (userId: string): Promise<AuditLog[]> => {
    return apiClient.get<AuditLog[]>(`/audit/user/${encodeURIComponent(userId)}`);
  },
};
