import { apiClient } from './api';

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString();
}

export interface Topic {
  id: string;
  name: string;
  status: 'emerging' | 'active' | 'stabilizing' | 'dormant';
  summary: string;
  mentions: number;
  riskScore: number;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  velocity: 'rising' | 'stable' | 'declining';
  platforms: {
    news: number;
    social: number;
    forums: number;
  };
  platformDetails?: {
    twitter: number;
    reddit: number;
    facebook: number;
    news: number;
  };
  entities: string[];
  firstDetected: string;
  lastUpdated: string;
  narratives: string[];
  trendData: number[];
  posts?: any[];
}

export interface TopicsResponse {
  success: boolean;
  data: Topic[];
  count: number;
  error?: string;
}

export const topicsApi = {
  async getAll(params?: {
    configuration_id?: string;
    status?: string;
    sort_by?: string;
    order?: 'asc' | 'desc';
  }): Promise<TopicsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.configuration_id) {
      queryParams.append('configuration_id', params.configuration_id);
    }
    if (params?.status) {
      queryParams.append('status', params.status);
    }
    if (params?.sort_by) {
      queryParams.append('sort_by', params.sort_by);
    }
    if (params?.order) {
      queryParams.append('order', params.order);
    }

    // Use fetch directly to get full response with count
    const endpoint = `/topics?${queryParams.toString()}`;
    const baseUrl = import.meta.env.VITE_API_URL || '/api';
    // Ensure /api is appended to full URLs
    const apiBaseUrl = baseUrl.startsWith('http') 
      ? (baseUrl.endsWith('/api') ? baseUrl : `${baseUrl.replace(/\/$/, '')}/api`)
      : baseUrl;
    const url = `${apiBaseUrl}${endpoint}`;
    const response = await fetch(url);
    const result: TopicsResponse = await response.json();
    
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to fetch topics');
    }
    
    return result;
  },

  async getById(id: string): Promise<{ success: boolean; data: Topic }> {
    const response = await apiClient.get<{ success: boolean; data: Topic }>(`/topics/${id}`);
    return response;
  },

  async getPosts(id: string, limit = 50, offset = 0): Promise<{ success: boolean; data: any[]; count: number }> {
    const response = await apiClient.get<{ success: boolean; data: any[]; count: number }>(`/topics/${id}/posts?limit=${limit}&offset=${offset}`);
    return response;
  },
};

