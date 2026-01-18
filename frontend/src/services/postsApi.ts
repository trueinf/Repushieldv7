import { apiClient } from './api';

export interface Post {
  id: string;
  platform: 'twitter' | 'reddit' | 'facebook' | 'news';
  post_id: string;
  content: string;
  title?: string;
  created_at: string;
  post_url: string;
  author_id?: string;
  author_username?: string;
  author_name?: string;
  author_verified?: boolean;
  author_followers?: number;
  author_following?: number;
  author_profile_image?: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  retweets_count?: number;
  upvotes_count?: number;
  media_urls: string[];
  media_types: string[];
  thumbnail_url?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  risk_score?: number;
  narrative?: string;
  topics: string[];
  keywords?: string[];
  fact_check_data?: {
    evidence: {
      sources: Array<{
        title: string;
        url: string;
        snippet: string;
      }>;
      facts: string[];
      verification: string;
    };
    truth_status: 'true' | 'false' | 'partially true' | 'misleading' | 'unverified';
    admin_response: {
      response_text: string;
      tone: string;
      key_points: string[];
    };
  };
  configuration_id: string;
  fetched_at: string;
}

export interface PostsResponse {
  success: boolean;
  data: Post[];
  count: number;
}

export class PostsApi {
  static async getAll(params?: {
    platform?: string;
    configuration_id?: string;
    limit?: number;
    offset?: number;
    sort?: string;
    order?: 'asc' | 'desc';
  }): Promise<Post[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.platform) queryParams.append('platform', params.platform);
      if (params?.configuration_id) queryParams.append('configuration_id', params.configuration_id);
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.offset) queryParams.append('offset', params.offset.toString());
      if (params?.sort) queryParams.append('sort', params.sort);
      if (params?.order) queryParams.append('order', params.order);

      const endpoint = `/posts${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      // apiClient.get may return full response object or just the data array
      const response = await apiClient.get<Post[] | PostsResponse>(endpoint);
      
      // Handle both cases: full response object or just array
      if (Array.isArray(response)) {
        return response;
      }
      
      // If it's a response object with data field, extract the array
      if (response && typeof response === 'object' && 'data' in response) {
        const postsResponse = response as PostsResponse;
        return Array.isArray(postsResponse.data) ? postsResponse.data : [];
      }
      
      console.warn('[PostsApi] Expected array but got:', typeof response, response);
      return [];
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  }

  static async getById(id: string): Promise<Post> {
    try {
      return await apiClient.get<Post>(`/posts/${id}`);
    } catch (error) {
      console.error('Error fetching post:', error);
      throw error;
    }
  }

  static async translate(id: string): Promise<{ originalText: string; translatedText: string }> {
    try {
      // apiClient.post returns data.data from ApiResponse<T> where T = { originalText, translatedText }
      return await apiClient.post<{ originalText: string; translatedText: string }>(`/posts/${id}/translate`, {});
    } catch (error) {
      console.error('Error translating post:', error);
      throw error;
    }
  }
}
