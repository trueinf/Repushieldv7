import { apiClient } from './api';

export interface MonitoringStatus {
  status: 'running' | 'paused' | 'stopped';
  lastRunTime: string | null;
  nextRunTime: string | null;
  intervalMinutes: number;
}

export const monitoringApi = {
  async getStatus(): Promise<MonitoringStatus> {
    try {
      return await apiClient.get<MonitoringStatus>('/monitoring/status');
    } catch (error) {
      console.error('Error fetching monitoring status:', error);
      throw error;
    }
  },

  async pause(): Promise<MonitoringStatus> {
    try {
      const response = await apiClient.post<{ data: MonitoringStatus; message: string }>('/monitoring/pause', {});
      return response.data;
    } catch (error) {
      console.error('Error pausing monitoring:', error);
      throw error;
    }
  },

  async resume(): Promise<MonitoringStatus> {
    try {
      const response = await apiClient.post<{ data: MonitoringStatus; message: string }>('/monitoring/resume', {});
      return response.data;
    } catch (error) {
      console.error('Error resuming monitoring:', error);
      throw error;
    }
  },

  async stop(): Promise<MonitoringStatus> {
    try {
      const response = await apiClient.post<{ data: MonitoringStatus; message: string }>('/monitoring/stop', {});
      return response.data;
    } catch (error) {
      console.error('Error stopping monitoring:', error);
      throw error;
    }
  },
};

