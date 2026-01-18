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

export interface Narrative {
  id: string;
  title: string;
  type: 'reputational' | 'political' | 'operational' | 'ethical' | 'safety' | 'misinformation';
  status: 'emerging' | 'established' | 'entrenched' | 'declining';
  summary: string;
  strengthScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  intentSignal: 'organic' | 'opportunistic' | 'coordinated';
  volumeOfMentions: number;
  persistenceDays: number;
  amplificationVelocity: number;
  affectedEntities: string[];
  platforms: {
    news: number;
    social: number;
    forums: number;
  };
  contributingTopics: number;
  reinforcingPosts: number;
  influencerInvolvement: boolean;
  firstEmergence: string;
  lastUpdated: string;
  confidence: number;
  trendData: number[];
  keyFrames: string[];
  geographicSpread: string[];
  posts?: any[];
}

export interface NarrativesResponse {
  success: boolean;
  data: Narrative[];
  count: number;
}

export const narrativesApi = {
  async getAll(params?: {
    configuration_id?: string;
    status?: string;
    type?: string;
    sort_by?: string;
    order?: 'asc' | 'desc';
  }): Promise<NarrativesResponse> {
    const queryParams = new URLSearchParams();
    if (params?.configuration_id) {
      queryParams.append('configuration_id', params.configuration_id);
    }
    if (params?.status) {
      queryParams.append('status', params.status);
    }
    if (params?.type) {
      queryParams.append('type', params.type);
    }
    if (params?.sort_by) {
      queryParams.append('sort_by', params.sort_by);
    }
    if (params?.order) {
      queryParams.append('order', params.order);
    }

    // Use fetch directly to get full response with count
    const endpoint = `/narratives?${queryParams.toString()}`;
    const url = `${import.meta.env.VITE_API_URL || '/api'}${endpoint}`;
    const response = await fetch(url);
    const result: NarrativesResponse = await response.json();
    
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to fetch narratives');
    }
    
    return result;
  },

  async getById(id: string): Promise<{ success: boolean; data: Narrative }> {
    const response = await apiClient.get<{ success: boolean; data: Narrative }>(`/narratives/${id}`);
    return response;
  },

  async getPosts(id: string, limit = 50, offset = 0): Promise<{ success: boolean; data: any[]; count: number }> {
    const response = await apiClient.get<{ success: boolean; data: any[]; count: number }>(`/narratives/${id}/posts?limit=${limit}&offset=${offset}`);
    return response;
  },
};

