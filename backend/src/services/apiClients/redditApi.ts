import { RapidApiClient } from './rapidApiClient';

export interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  created_utc: number;
  author: string; // Subreddit name (used as author)
  subreddit: string;
  subreddit_prefixed?: string; // e.g., "r/subreddit"
  post_author?: string; // Individual post author (for reference)
  subscribers?: number; // Subreddit subscribers count
  score: number;
  num_comments: number;
  upvote_ratio: number;
  url: string;
  thumbnail: string;
  is_video: boolean;
  media?: {
    type: string;
    url: string;
  };
  preview?: {
    images: Array<{
      source: { url: string };
      resolutions: Array<{ url: string }>;
    }>;
  };
  gallery_data?: any;
}

export class RedditApi extends RapidApiClient {
  private readonly host = 'reddit34.p.rapidapi.com';

  async searchPosts(query: string, limit: number = 20, sort: 'new' | 'hot' | 'top' = 'new'): Promise<RedditPost[]> {
    try {
      // Build URL path with query parameters (as per API documentation)
      // Note: 'time' parameter can only be used with sort='top'
      let path = `/getSearchPosts?query=${encodeURIComponent(query)}&sort=${sort}`;
      
      // Only add time parameter if sort is 'top' (API requirement)
      if (sort === 'new') {
        path += `&time=day`; // Filter posts from last 24 hours
      }
      // For 'new' and 'hot', we don't use time parameter (API will return recent posts)

      console.log(`[Reddit API] Request path: ${path}`);

      const response = await this.request<any>(
        this.host,
        `https://reddit34.p.rapidapi.com${path}`,
        {} // Empty params object since we're using URL path
      );

      // Check for error response first
      if (response.success === false) {
        console.error('[Reddit API] API returned error:', response.data);
        // If it's "data not found", it might mean no results, return empty array
        if (typeof response.data === 'string' && response.data.includes('not found')) {
          console.warn('[Reddit API] No data found for query - returning empty array');
          return [];
        }
        throw new Error(`Reddit API error: ${response.data}`);
      }

      // Log full response structure for debugging
      console.log('[Reddit API] Full response structure:', {
        hasData: !!response.data,
        hasPosts: !!response.data?.posts,
        hasChildren: !!response.data?.children,
        topLevelKeys: Object.keys(response || {}),
        dataKeys: response.data ? Object.keys(response.data).slice(0, 10) : [],
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
      });

      // Handle case where data is an array-like object with numeric keys
      if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
        const dataKeys = Object.keys(response.data);
        // Check if keys are numeric (array-like object)
        if (dataKeys.length > 0 && dataKeys.every(key => /^\d+$/.test(key))) {
          console.log(`[Reddit API] Found array-like object with ${dataKeys.length} numeric keys`);
          const postsArray = Object.values(response.data) as any[];
          return this.parsePosts(postsArray);
        }
      }

      // Reddit34 API returns { success: true, data: { posts: [...] } }
      if (response.data?.posts && Array.isArray(response.data.posts)) {
        console.log(`[Reddit API] Found ${response.data.posts.length} posts in response.data.posts`);
        return this.parsePosts(response.data.posts);
      }
      if (response.data?.children) {
        console.log(`[Reddit API] Found ${response.data.children.length} posts in response.data.children`);
        return this.parsePosts(response.data.children);
      }
      if (response.children) {
        console.log(`[Reddit API] Found ${response.children.length} posts in response.children`);
        return this.parsePosts(response.children);
      }
      if (Array.isArray(response.data)) {
        console.log(`[Reddit API] Found ${response.data.length} posts in response.data (array)`);
        return this.parsePosts(response.data);
      }
      if (Array.isArray(response)) {
        console.log(`[Reddit API] Found ${response.length} posts in response (array)`);
        return this.parsePosts(response);
      }
      if (response.posts) {
        console.log(`[Reddit API] Found ${response.posts.length} posts in response.posts`);
        return this.parsePosts(response.posts);
      }
      if (response.results) {
        console.log(`[Reddit API] Found ${response.results.length} posts in response.results`);
        return this.parsePosts(response.results);
      }

      console.warn('[Reddit API] Unknown response structure. Full response:', JSON.stringify(response, null, 2).substring(0, 500));
      return [];
    } catch (error) {
      console.error('Reddit API error:', error);
      throw error;
    }
  }

  private parsePosts(data: any[]): RedditPost[] {
    return data
      .map((item: any) => {
        // Handle Reddit API structure: { kind: "t3", data: {...} }
        // Primary path: data.posts[].data.subreddit (use subreddit as author)
        if (item.kind && item.data) {
          return item.data;
        }
        return item.data || item;
      })
      .filter((post: any) => post && post.id)
      .map((post: any) => {
        // Use subreddit as the author (as per Reddit API structure)
        // Primary path: data.posts[].data.subreddit
        const subreddit = post.subreddit || '';
        const subredditPrefixed = post.subreddit_name_prefixed || `r/${subreddit}`;
        const postAuthor = post.author || ''; // Individual post author (for reference)
        const subscribers = post.subreddit_subscribers || 0;
        
        return {
          id: post.id,
          title: post.title || '',
          selftext: post.selftext || '',
          created_utc: post.created_utc || Date.now() / 1000,
          author: subreddit, // Use subreddit as author (not individual post author)
          subreddit: subreddit,
          subreddit_prefixed: subredditPrefixed,
          post_author: postAuthor, // Individual post author (stored for reference)
          subscribers: subscribers,
          score: post.score || 0,
          num_comments: post.num_comments || 0,
          upvote_ratio: post.upvote_ratio || 0,
          url: post.url || '',
          thumbnail: post.thumbnail || '',
          is_video: post.is_video || false,
          media: this.extractMedia(post),
          preview: post.preview,
          gallery_data: post.gallery_data,
        };
      });
  }

  private extractMedia(post: any): RedditPost['media'] {
    if (post.is_video && post.media?.reddit_video) {
      return {
        type: 'video',
        url: post.media.reddit_video.fallback_url || post.media.reddit_video.scrubber_media_url,
      };
    }

    if (post.preview?.images?.[0]?.source?.url) {
      return {
        type: 'image',
        url: post.preview.images[0].source.url.replace(/&amp;/g, '&'),
      };
    }

    if (post.url && /\.(jpg|jpeg|png|gif|webp)$/i.test(post.url)) {
      return {
        type: 'image',
        url: post.url,
      };
    }

    return undefined;
  }
}
