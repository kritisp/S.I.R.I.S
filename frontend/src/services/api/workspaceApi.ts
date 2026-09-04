import { apiClient } from './client';
import type { CaseRecord, User, Station } from '../../mockServices/types';

export interface WorkspaceDTO {
  id: string;
  title: string;
  description: string;
  creator: User;
  station: Station;
  status: 'DRAFT' | 'CONFIRMED' | 'ANALYZING' | 'READY' | 'FAILED' | 'ARCHIVED';
  analyticalScopes: string[];
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
}

export interface TriggerDTO {
  id: string;
  workspaceId: string;
  triggerType: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  requestedBy: User;
  startedAt?: string;
  completedAt?: string;
  failureReason?: string;
  resultMetadata?: string;
  createdAt: string;
}

export interface WorkspaceIntelligenceResultDTO {
  id: string;
  triggerId: string;
  workspaceId: string;
  status: string;
  summary: string;
  relationshipsDiscovered: number;
  patternsDetected: number;
  networkNodesCount: number;
  resultPayload: string;
  generatedAt: string;
}

export const workspaceApi = {
  createWorkspace: async (payload: {
    id?: string;
    title: string;
    description?: string;
    stationId?: string;
    analyticalScopes?: string[];
  }): Promise<WorkspaceDTO> => {
    return apiClient.post<WorkspaceDTO>('/workspaces', payload);
  },

  getWorkspaces: async (): Promise<WorkspaceDTO[]> => {
    return apiClient.get<WorkspaceDTO[]>('/workspaces');
  },

  getWorkspaceById: async (id: string): Promise<WorkspaceDTO> => {
    return apiClient.get<WorkspaceDTO>(`/workspaces/${encodeURIComponent(id)}`);
  },

  getWorkspace: async (id: string): Promise<WorkspaceDTO> => {
    return apiClient.get<WorkspaceDTO>(`/workspaces/${encodeURIComponent(id)}`);
  },

  updateWorkspace: async (
    id: string,
    payload: { title?: string; description?: string; analyticalScopes?: string[] }
  ): Promise<WorkspaceDTO> => {
    return apiClient.put<WorkspaceDTO>(`/workspaces/${encodeURIComponent(id)}`, payload);
  },

  addCaseToWorkspace: async (workspaceId: string, caseId: string): Promise<any> => {
    return apiClient.post(`/workspaces/${encodeURIComponent(workspaceId)}/cases`, { caseId });
  },

  removeCaseFromWorkspace: async (workspaceId: string, caseId: string): Promise<void> => {
    return apiClient.delete(`/workspaces/${encodeURIComponent(workspaceId)}/cases/${encodeURIComponent(caseId)}`);
  },

  getWorkspaceCases: async (workspaceId: string): Promise<any[]> => {
    return apiClient.get(`/workspaces/${encodeURIComponent(workspaceId)}/cases`);
  },

  confirmWorkspace: async (workspaceId: string): Promise<TriggerDTO> => {
    return apiClient.post<TriggerDTO>(`/workspaces/${encodeURIComponent(workspaceId)}/confirm`);
  },

  getTrigger: async (workspaceId: string): Promise<TriggerDTO> => {
    return apiClient.get<TriggerDTO>(`/workspaces/${encodeURIComponent(workspaceId)}/trigger`);
  },

  getResult: async (workspaceId: string): Promise<WorkspaceIntelligenceResultDTO> => {
    return apiClient.get<WorkspaceIntelligenceResultDTO>(`/workspaces/${encodeURIComponent(workspaceId)}/result`);
  },
};
