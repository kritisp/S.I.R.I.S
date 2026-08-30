export type UserRole = 'OFFICER' | 'STATION_ADMIN' | 'SUPER_ADMIN';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  stationId?: string;
  status: 'ACTIVE' | 'INACTIVE';
  rank?: string;
}

export interface Station {
  id: string;
  name: string;
  district: string;
  city: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Entity {
  id: string;
  type: 'PERSON' | 'PHONE' | 'VEHICLE' | 'LOCATION' | 'DOCUMENT';
  value: string;
}

export interface Evidence {
  id: string;
  caseId: string;
  description: string;
  type: string;
  uploadedAt: string;
  entitiesExtracted: Entity[];
}

export type CaseStatus = 'PENDING' | 'INVESTIGATING' | 'SOLVED' | 'CLOSED';

export interface CaseRecord {
  id: string;
  firNumber: string;
  stationId: string;
  investigatorId: string;
  title: string;
  description: string;
  crimeType: string;
  status: CaseStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: string;
  entities: Entity[];
  bnsSections?: string[];
  suspects?: string[];
  vehicles?: string[];
  locations?: string[];
  evidenceRefs?: string[];
  cctvRefs?: string[];
  linkedCaseIds?: string[];
}

export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface AccessRequest {
  id: string;
  requestingStationId: string;
  requestingOfficerId: string;
  targetStationId: string;
  targetCaseId: string;
  reason: string;
  status: RequestStatus;
  createdAt: string;
}

export interface IntelligenceAlert {
  id: string;
  type: 'CROSS_STATION_MATCH' | 'PATTERN_DETECTED' | 'NEW_HOTSPOT';
  message: string;
  relatedCaseId?: string;
  targetCaseId?: string;
  targetStationId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AppState {
  currentUser: User | null;
  users: User[];
  stations: Station[];
  cases: CaseRecord[];
  evidence: Evidence[];
  accessRequests: AccessRequest[];
  alerts: IntelligenceAlert[];
  isProcessingIntelligence: boolean;
  isLoading: boolean;
}
