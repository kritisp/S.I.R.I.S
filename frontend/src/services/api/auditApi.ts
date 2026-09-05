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

export interface AuditChainRecord {
  recordId: string;
  chainScope: string;
  sequenceIndex: number;
  caseId?: string;
  evidenceId?: string;
  eventType: string;
  actorId?: string;
  actorName?: string;
  actorRole?: string;
  stationId?: string;
  timestamp: string;
  canonicalPayload: string;
  contentHash?: string;
  previousHash: string;
  currentHash: string;
  verificationStatus: string;
}

export interface RecordVerificationItem {
  recordId: string;
  sequenceIndex: number;
  eventType: string;
  storedPreviousHash: string;
  expectedPreviousHash: string;
  storedCurrentHash: string;
  calculatedCurrentHash: string;
  previousHashValid: boolean;
  currentHashValid: boolean;
  contentHashValid: boolean;
  status: string;
  failureDetails?: string;
}

export interface ChainVerificationResult {
  chainScope: string;
  status: 'VERIFIED' | 'COMPROMISED';
  totalRecords: number;
  verifiedRecords: number;
  brokenRecordId?: string;
  brokenSequenceIndex?: number;
  failureReason?: string;
  verifiedAt: string;
  items: RecordVerificationItem[];
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

  verifyGlobalChain: async (scope = 'GLOBAL'): Promise<ChainVerificationResult> => {
    return apiClient.get<ChainVerificationResult>(`/audit/chain/verify?scope=${encodeURIComponent(scope)}`);
  },

  verifyCaseChain: async (caseId: string): Promise<ChainVerificationResult> => {
    return apiClient.get<ChainVerificationResult>(`/audit/chain/case/${encodeURIComponent(caseId)}/verify`);
  },

  verifyEvidenceIntegrity: async (evidenceId: string): Promise<ChainVerificationResult> => {
    return apiClient.get<ChainVerificationResult>(`/audit/chain/evidence/${encodeURIComponent(evidenceId)}/verify`);
  },

  getChainRecords: async (scope = 'GLOBAL'): Promise<AuditChainRecord[]> => {
    return apiClient.get<AuditChainRecord[]>(`/audit/chain/records?scope=${encodeURIComponent(scope)}`);
  },

  getCaseChainRecords: async (caseId: string): Promise<AuditChainRecord[]> => {
    return apiClient.get<AuditChainRecord[]>(`/audit/chain/case/${encodeURIComponent(caseId)}/records`);
  },
};
