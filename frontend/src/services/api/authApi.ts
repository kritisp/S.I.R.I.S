import { apiClient, setAuthToken, clearAuthState } from './client';
import type { User } from '../../mockServices/types';

export interface LoginPayload {
  userId: string;
  password?: string;
  stationCode?: string;
  role?: string;
}

export interface AuthResponseData {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
  station: {
    id: string;
    name: string;
    district: string;
    city: string;
    status: string;
  };
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<AuthResponseData> => {
    const data = await apiClient.post<AuthResponseData>('/auth/login', payload);
    if (data && data.accessToken) {
      setAuthToken(data.accessToken);
    }
    return data;
  },

  getMe: async (): Promise<AuthResponseData> => {
    return apiClient.get<AuthResponseData>('/auth/me');
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponseData> => {
    const data = await apiClient.post<AuthResponseData>('/auth/refresh', { refreshToken });
    if (data && data.accessToken) {
      setAuthToken(data.accessToken);
    }
    return data;
  },

  logout: (): void => {
    clearAuthState();
  },
};
