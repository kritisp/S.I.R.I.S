import { apiClient } from './client';
import type { CaseRecord } from '../../mockServices/types';
import { graphIntelligenceService } from '../graphIntelligenceService';

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
    
    try {
      const res = await apiClient.get<PagedCasesResponse | CaseRecord[]>(`/cases${queryString}`);
      if (Array.isArray(res) && res.length > 0) {
        return res;
      }
      if (res && Array.isArray((res as PagedCasesResponse).content) && (res as PagedCasesResponse).content.length > 0) {
        return (res as PagedCasesResponse).content;
      }
    } catch (err) {
      // Spring Boot endpoint unavailable or failed; seamlessly fall back to Central Intelligence PostgreSQL
    }

    // Direct Authoritative Database Fetch (Central Intelligence PostgreSQL port 8000)
    try {
      const dbRes = await graphIntelligenceService.getWorkspaceCases(params?.size || 200, ((params?.page || 0) * (params?.size || 200)));
      if (dbRes && dbRes.cases && dbRes.cases.length > 0) {
        return dbRes.cases.map((dbc: any) => ({
          id: dbc.case_id || dbc.id,
          firNumber: dbc.fir_number || dbc.case_id || dbc.id,
          stationId: dbc.police_station || 'OP-BBSR-CAP',
          investigatorId: 'INV-BBSR-001',
          title: dbc.crime_type ? `${dbc.crime_type} Incident Report` : `Case ${dbc.fir_number}`,
          description: dbc.description || 'Authoritative PostgreSQL Case Record',
          crimeType: dbc.crime_type || dbc.crime_category || 'General Offence',
          status: (dbc.status || 'INVESTIGATING') as any,
          priority: 'HIGH',
          incidentDate: dbc.incident_date || dbc.registration_date,
          createdAt: dbc.registration_date || dbc.created_at || new Date().toISOString(),
          entities: []
        }));
      }
    } catch (dbErr) {
      console.warn('Database cases fetch notice:', dbErr);
    }

    return [];
  },

  getCaseById: async (id: string): Promise<CaseRecord> => {
    try {
      const res = await apiClient.get<CaseRecord>(`/cases/${encodeURIComponent(id)}`);
      if (res && res.id) return res;
    } catch {
      // Fall back to database workspace case
    }

    const ws = await graphIntelligenceService.getCaseWorkspace(id);
    if (ws && ws.metadata) {
      return {
        id: ws.case_id,
        firNumber: ws.fir_number || ws.metadata.fir_number,
        stationId: ws.metadata.station_id || ws.metadata.police_station || 'OP-BBSR-CAP',
        investigatorId: 'INV-BBSR-001',
        title: ws.metadata.title,
        description: ws.metadata.description,
        crimeType: ws.metadata.crime_type || ws.metadata.crime_category,
        status: (ws.metadata.status || 'INVESTIGATING') as any,
        priority: (ws.metadata.priority || 'HIGH') as any,
        incidentDate: ws.metadata.incident_date,
        createdAt: ws.metadata.created_at || ws.metadata.registration_date,
        entities: [
          ...(ws.entities?.persons || []).map(p => ({ id: p.id, type: 'PERSON' as const, value: p.name })),
          ...(ws.entities?.phones || []).map(ph => ({ id: ph.id, type: 'PHONE' as const, value: ph.normalized_number })),
          ...(ws.entities?.vehicles || []).map(v => ({ id: v.id, type: 'VEHICLE' as const, value: v.registration_number })),
          ...(ws.entities?.locations || []).map(l => ({ id: l.id, type: 'LOCATION' as const, value: `${l.locality}, ${l.city}` })),
        ]
      };
    }
    throw new Error(`Case ${id} not found in database.`);
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

