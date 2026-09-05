import { apiClient } from './client';
import type { Evidence } from '../../mockServices/types';
import type { ChainVerificationResult } from './auditApi';

export const evidenceApi = {
  getEvidence: async (caseId?: string): Promise<Evidence[]> => {
    const url = caseId ? `/evidence?caseId=${encodeURIComponent(caseId)}` : '/evidence';
    return apiClient.get<Evidence[]>(url);
  },

  getEvidenceById: async (evidenceId: string): Promise<Evidence> => {
    return apiClient.get<Evidence>(`/evidence/${encodeURIComponent(evidenceId)}`);
  },

  addEvidence: async (payload: Partial<Evidence>): Promise<Evidence> => {
    return apiClient.post<Evidence>('/evidence', payload);
  },

  verifyEvidenceIntegrity: async (evidenceId: string): Promise<ChainVerificationResult> => {
    return apiClient.get<ChainVerificationResult>(`/evidence/${encodeURIComponent(evidenceId)}/verify`);
  },

  sealEvidence: async (evidenceId: string, reason?: string): Promise<Evidence> => {
    return apiClient.post<Evidence>(`/evidence/${encodeURIComponent(evidenceId)}/seal`, { reason });
  },
};
