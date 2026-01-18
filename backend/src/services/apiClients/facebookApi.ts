import { RapidApiClient } from './rapidApiClient.js';

export interface FacebookPost {
  id: string;
  message: string;
  created_time: string;
  from: {
    id: string;
    name: string;
    username?: string;
    category?: string;
    followers?: number;
  };
  likes?: {
    summary: {
      total_count: number;
    };
  };
  comments?: {
    summary: {
      total_count: number;
    };
  };
  shares?: {
    count: number;
  };
  attachments?: {
    data: Array<{
      type: string;
      media?: {
        image?: { src: string };
        source?: string;
      };
      subattachments?: any;
    }>;
  };
  full_picture?: string;
}

export class FacebookApi extends RapidApiClient {
  private readonly host = 'facebook-scraper3.p.rapidapi.com';

  async searchPosts(query: string, limit: number = 20): Promise<FacebookPost[]> {
    try {
      const response = await this.request<any>(
        this.host,
        'https://facebook-scraper3.p.rapidapi.com/search/posts',
        {
          query: query,
          limit: limit,
        }
      );

      // Facebook Scraper3 API returns { results: [...posts], cursor: ... }
      // Note: results is actually an array, not an object
      if (Array.isArray(response.results)) {
        return this.parsePosts(response.results);
      }
      if (response.results) {
        // Sometimes results might be an object with posts array
        if (response.results.posts && Array.isArray(response.results.posts)) {
          return this.parsePosts(response.results.posts);
        }
        if (response.results.data && Array.isArray(response.results.data)) {
          return this.parsePosts(response.results.data);
        }
        // Log structure for debugging
        console.warn('[Facebook API] Results is object, keys:', Object.keys(response.results));
      }
      if (Array.isArray(response.data)) {
        return this.parsePosts(response.data);
      }
      if (Array.isArray(response.posts)) {
        return this.parsePosts(response.posts);
      }
      if (Array.isArray(response)) {
        return this.parsePosts(response);
      }

      console.warn('[Facebook API] Unknown response structure. Keys:', Object.keys(response || {}));
      return [];
    } catch (error) {
      console.error('Facebook API error:', error);
      throw error;
    }
  }

  private parsePosts(data: any[]): FacebookPost[] {
    return data
      .filter((post: any) => post && (post.post_id || post.id))
      .map((post: any) => {
        // Facebook Scraper3 uses post_id, not id
        // Primary path: results[].from.name
        // Fallback paths: results[].author.name or results[].user.name
        const postId = post.post_id || post.id;
        
        // Extract author info using correct paths
        // Primary: post.from.name
        // Fallback: post.author.name or post.user.name
        const from = post.from || {};
        const author = post.author || {};
        const user = post.user || {};
        
        const authorName = from.name || author.name || user.name || post.author_name || post.author_title || '';
        const authorId = from.id || author.id || user.id || post.author_id || '';
        const authorUsername = from.username || author.username || user.username || post.author_username || '';
        const authorCategory = from.category || author.category || user.category || post.author_category || '';
        const authorFollowers = from.followers || author.followers || user.followers || post.author_followers || 0;
        
        return {
          id: postId,
          message: post.message || post.message_rich || post.text || '',
          created_time: post.timestamp ? new Date(post.timestamp * 1000).toISOString() : 
                       (post.created_time || post.created_at || new Date().toISOString()),
          from: {
            id: authorId,
            name: authorName,
            username: authorUsername,
            category: authorCategory,
            followers: authorFollowers,
          },
          likes: {
            summary: {
              total_count: post.reactions_count || post.likes_count || 
                          (post.reactions ? Object.values(post.reactions).reduce((sum: number, val: any) => sum + (val || 0), 0) : 0) ||
                          (post.likes?.summary?.total_count || 0),
            },
          },
          comments: {
            summary: {
              total_count: post.comments_count || post.comments?.summary?.total_count || 0,
            },
          },
          shares: {
            count: post.reshare_count || post.shares_count || post.shares?.count || 0,
          },
          attachments: post.attachments || (post.image || post.video ? [{
            type: post.video ? 'video' : 'photo',
            media: {
              image: post.image ? { src: post.image } : undefined,
              source: post.video,
            },
          }] : undefined),
          full_picture: post.image || post.video_thumbnail || post.picture || post.full_picture,
        };
      });
  }
}
