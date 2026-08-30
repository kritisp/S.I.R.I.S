import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import { AppState, User, Station, CaseRecord, Evidence, AccessRequest, IntelligenceAlert } from './types';
import { initialState } from './initialData';
import {
  authApi,
  casesApi,
  evidenceApi,
  alertsApi,
  requestsApi,
  usersApi,
  stationsApi,
  getAuthToken,
} from '../services/api';

type Action =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_CASES'; payload: CaseRecord[] }
  | { type: 'ADD_CASE'; payload: CaseRecord }
  | { type: 'UPDATE_CASE'; payload: CaseRecord }
  | { type: 'SET_EVIDENCE'; payload: Evidence[] }
  | { type: 'ADD_EVIDENCE'; payload: Evidence }
  | { type: 'SET_ALERTS'; payload: IntelligenceAlert[] }
  | { type: 'ADD_ALERT'; payload: IntelligenceAlert }
  | { type: 'MARK_ALERT_READ'; payload: string }
  | { type: 'SET_ACCESS_REQUESTS'; payload: AccessRequest[] }
  | { type: 'ADD_ACCESS_REQUEST'; payload: AccessRequest }
  | { type: 'UPDATE_ACCESS_REQUEST_STATUS'; payload: { id: string; status: 'APPROVED' | 'REJECTED' } }
  | { type: 'SET_STATIONS'; payload: Station[] }
  | { type: 'ADD_STATION'; payload: Station }
  | { type: 'SET_USERS'; payload: User[] }
  | { type: 'ADD_USER'; payload: User }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean };

const reducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, currentUser: action.payload };
    case 'SET_CASES':
      return { ...state, cases: action.payload };
    case 'ADD_CASE':
      return { ...state, cases: [...state.cases.filter(c => c.id !== action.payload.id), action.payload] };
    case 'UPDATE_CASE':
      return {
        ...state,
        cases: state.cases.map((c) => (c.id === action.payload.id ? action.payload : c)),
      };
    case 'SET_EVIDENCE':
      return { ...state, evidence: action.payload };
    case 'ADD_EVIDENCE':
      return { ...state, evidence: [...state.evidence.filter(e => e.id !== action.payload.id), action.payload] };
    case 'SET_ALERTS':
      return { ...state, alerts: action.payload };
    case 'ADD_ALERT':
      return { ...state, alerts: [action.payload, ...state.alerts.filter(a => a.id !== action.payload.id)] };
    case 'MARK_ALERT_READ':
      return {
        ...state,
        alerts: state.alerts.map((a) => (a.id === action.payload ? { ...a, isRead: true } : a)),
      };
    case 'SET_ACCESS_REQUESTS':
      return { ...state, accessRequests: action.payload };
    case 'ADD_ACCESS_REQUEST':
      return { ...state, accessRequests: [...state.accessRequests.filter(r => r.id !== action.payload.id), action.payload] };
    case 'UPDATE_ACCESS_REQUEST_STATUS':
      return {
        ...state,
        accessRequests: state.accessRequests.map((r) =>
          r.id === action.payload.id ? { ...r, status: action.payload.status } : r
        ),
      };
    case 'SET_STATIONS':
      return { ...state, stations: action.payload };
    case 'ADD_STATION':
      return { ...state, stations: [...state.stations.filter(s => s.id !== action.payload.id), action.payload] };
    case 'SET_USERS':
      return { ...state, users: action.payload };
    case 'ADD_USER':
      return { ...state, users: [...state.users.filter(u => u.id !== action.payload.id), action.payload] };
    case 'UPDATE_USER':
      return {
        ...state,
        users: state.users.map((u) => (u.id === action.payload.id ? action.payload : u)),
      };
    case 'SET_PROCESSING':
      return { ...state, isProcessingIntelligence: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
};

const MockStateContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
  refreshBackendData: () => Promise<void>;
} | undefined>(undefined);

export const MockStateProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const refreshBackendData = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }

    try {
      // 1. Fetch user profile if not set
      if (!state.currentUser) {
        const me = await authApi.getMe();
        if (me && me.user) {
          dispatch({ type: 'SET_USER', payload: me.user });
        }
      }

      // 2. Fetch Cases
      const cases = await casesApi.getCases();
      if (cases && cases.length > 0) {
        dispatch({ type: 'SET_CASES', payload: cases });
      }

      // 3. Fetch Alerts
      const alerts = await alertsApi.getAlerts();
      if (alerts && alerts.length > 0) {
        dispatch({ type: 'SET_ALERTS', payload: alerts });
      }

      // 4. Fetch Evidence
      const evidence = await evidenceApi.getEvidence();
      if (evidence && evidence.length > 0) {
        dispatch({ type: 'SET_EVIDENCE', payload: evidence });
      }

      // 5. Fetch Access Requests
      const [incoming, outgoing] = await Promise.all([
        requestsApi.getIncomingRequests().catch(() => []),
        requestsApi.getOutgoingRequests().catch(() => []),
      ]);
      const combinedRequests = [...incoming, ...outgoing];
      if (combinedRequests.length > 0) {
        dispatch({ type: 'SET_ACCESS_REQUESTS', payload: combinedRequests });
      }

      // 6. Fetch Stations
      const stations = await stationsApi.getStations().catch(() => []);
      if (stations && stations.length > 0) {
        dispatch({ type: 'SET_STATIONS', payload: stations });
      }

      // 7. Fetch Users
      const users = await usersApi.getUsers().catch(() => []);
      if (users && users.length > 0) {
        dispatch({ type: 'SET_USERS', payload: users });
      }
    } catch (err) {
      console.warn('Backend connection unavailable, using local initial state:', err);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.currentUser]);

  useEffect(() => {
    refreshBackendData();
  }, [refreshBackendData]);

  return (
    <MockStateContext.Provider value={{ state, dispatch, refreshBackendData }}>
      {children}
    </MockStateContext.Provider>
  );
};

export const useMockState = () => {
  const context = useContext(MockStateContext);
  if (!context) {
    throw new Error('useMockState must be used within a MockStateProvider');
  }
  return context;
};
