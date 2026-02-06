import { apiClient } from './api';

export interface DashboardStats {
  reputationScore: {
    value: number;
    max: number;
    trend: number;
  };
  totalMentions: {
    value: number;
    trend: number;
  };
  criticalAlerts: {
    value: number;
    trend: number;
  };
  responseTime: {
    value: number;
    trend: number;
  };
}

export interface SentimentTrend {
  name: string;
  date: string;
  positive: number;
  neutral: number;
  negative: number;
}

export interface PriorityNarrative {
  id: string;
  title: string;
  volume: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  change: number;
  avgRiskScore: number;
}

export interface SourceChannel {
  label: string;
  value: number;
  count: number;
  platforms: string[];
}

export interface RecentPost {
  id: string;
  source: string;
  platform: string;
  content: string;
  timestamp: string;
  viralRisk: 'low' | 'medium' | 'high';
  sentiment: 'positive' | 'neutral' | 'negative';
  riskScore: number;
  postUrl: string;
}

export interface RiskDistributionItem {
  range: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface RiskDistribution {
  distribution: RiskDistributionItem[];
  total: number;
  averageRisk: number;
}

export class DashboardApi {
  static async getStats(
    range: '7d' | '30d' | 'quarter' | 'total' = 'total',
    configurationId?: string
  ): Promise<DashboardStats> {
    try {
      const params: any = { range };
      if (configurationId) params.configuration_id = configurationId;
      return await apiClient.get<DashboardStats>('/dashboard/stats', { params });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  static async getSentimentTrends(
    range: '7d' | '30d' | 'quarter' | 'total' = '7d',
    configurationId?: string
  ): Promise<SentimentTrend[]> {
    try {
      const params: any = { range };
      if (configurationId) params.configuration_id = configurationId;
      const response = await apiClient.get<{ data: SentimentTrend[] }>('/dashboard/sentiment-trends', { params });
      return Array.isArray(response) ? response : response.data || [];
    } catch (error) {
      console.error('Error fetching sentiment trends:', error);
      throw error;
    }
  }

  static async getPriorityNarratives(
    limit: number = 4,
    configurationId?: string
  ): Promise<PriorityNarrative[]> {
    try {
      const params: any = { limit };
      if (configurationId) params.configuration_id = configurationId;
      const response = await apiClient.get<{ data: PriorityNarrative[] }>('/dashboard/priority-narratives', { params });
      return Array.isArray(response) ? response : response.data || [];
    } catch (error) {
      console.error('Error fetching priority narratives:', error);
      throw error;
    }
  }

  static async getSourceChannels(configurationId?: string): Promise<{ channels: SourceChannel[]; total: number }> {
    try {
      const params = configurationId ? { configuration_id: configurationId } : {};
      const response = await apiClient.get<{ data: { channels: SourceChannel[]; total: number } }>('/dashboard/source-channels', { params });
      return Array.isArray(response) ? { channels: [], total: 0 } : response.data || { channels: [], total: 0 };
    } catch (error) {
      console.error('Error fetching source channels:', error);
      throw error;
    }
  }

  static async getRecentPosts(
    limit: number = 10,
    configurationId?: string
  ): Promise<RecentPost[]> {
    try {
      const params: any = { limit };
      if (configurationId) params.configuration_id = configurationId;
      const response = await apiClient.get<{ data: RecentPost[] }>('/dashboard/recent-posts', { params });
      return Array.isArray(response) ? response : response.data || [];
    } catch (error) {
      console.error('Error fetching recent posts:', error);
      throw error;
    }
  }

  static async getRiskDistribution(configurationId?: string): Promise<RiskDistribution> {
    try {
      const params = configurationId ? { configuration_id: configurationId } : {};
      const response = await apiClient.get<RiskDistribution>('/dashboard/risk-distribution', { params });
      return response || {
        distribution: [],
        total: 0,
        averageRisk: 0,
      };
    } catch (error) {
      console.error('Error fetching risk distribution:', error);
      throw error;
    }
  }
}







