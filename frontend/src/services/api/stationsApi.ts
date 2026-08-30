import { apiClient } from './client';
import type { Station } from '../../mockServices/types';

export const stationsApi = {
  getStations: async (): Promise<Station[]> => {
    return apiClient.get<Station[]>('/stations');
  },

  createStation: async (payload: Partial<Station>): Promise<Station> => {
    return apiClient.post<Station>('/stations', payload);
  },
};
