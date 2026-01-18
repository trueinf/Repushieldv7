import { RapidApiClient } from './rapidApiClient';

export interface TwitterPost {
  id: string;
  text: string;
  created_at: string;
  author: {
    id: string;
    username: string;
    name: string;
    verified: boolean;
    followers_count: number;
    following_count: number;
    profile_image_url: string;
  };
  public_metrics: {
    retweet_count: number;
    like_count: number;
    reply_count: number;
    quote_count: number;
  };
  media?: Array<{
    type: string;
    url?: string;
    preview_image_url?: string;
    media_key?: string;
  }>;
  entities?: {
    hashtags?: Array<{ tag: string }>;
    mentions?: Array<{ username: string }>;
    urls?: Array<{ url: string }>;
  };
}

export class TwitterApi extends RapidApiClient {
  private readonly host = 'twitter241.p.rapidapi.com';

  async searchRecentTweets(query: string, maxResults: number = 20): Promise<TwitterPost[]> {
    try {
      const response = await this.request<any>(
        this.host,
        'https://twitter241.p.rapidapi.com/search',
        {
          type: 'Latest',
          count: maxResults,
          query: query,
        }
      );

      // Parse response based on actual API structure
      // Twitter241 API returns { result: { tweets: [...] } } or { result: [...] }
      if (response.result) {
        // Check if result has tweets array
        if (response.result.tweets && Array.isArray(response.result.tweets)) {
          return this.parseTweets(response.result.tweets);
        }
        // Check if result is directly an array
        if (Array.isArray(response.result)) {
          return this.parseTweets(response.result);
        }
        // Check if result has data array
        if (response.result.data && Array.isArray(response.result.data)) {
          return this.parseTweets(response.result.data);
        }
        // If result is an object, search for any array property
        if (typeof response.result === 'object' && !Array.isArray(response.result)) {
          // Twitter241 API returns { result: { timeline: { instructions: [...], responseObjects: {...} } } }
          if (response.result.timeline) {
            const timeline = response.result.timeline;
            // Extract tweets from instructions array
            if (timeline.instructions && Array.isArray(timeline.instructions)) {
              const tweets: any[] = [];
              for (const instruction of timeline.instructions) {
                if (instruction.entries && Array.isArray(instruction.entries)) {
                  for (const entry of instruction.entries) {
                    if (entry.content?.entryType === 'TimelineTimelineItem' || 
                        entry.content?.itemContent?.tweet_results) {
                      const tweetResult = entry.content?.itemContent?.tweet_results?.result;
                      if (tweetResult) {
                        tweets.push(tweetResult);
                      }
                    }
                  }
                }
              }
              if (tweets.length > 0) {
                return this.parseTweets(tweets);
              }
            }
            // Try responseObjects
            if (timeline.responseObjects && typeof timeline.responseObjects === 'object') {
              const tweets: any[] = [];
              for (const key in timeline.responseObjects) {
                const obj = timeline.responseObjects[key];
                if (obj.tweet && typeof obj.tweet === 'object') {
                  tweets.push(obj.tweet);
                }
              }
              if (tweets.length > 0) {
                return this.parseTweets(tweets);
              }
            }
          }
          // Check other common keys
          const keys = Object.keys(response.result);
          for (const key of keys) {
            if (Array.isArray(response.result[key]) && response.result[key].length > 0) {
              console.log(`[Twitter API] Found tweets in result.${key}`);
              return this.parseTweets(response.result[key]);
            }
          }
        }
      }
      if (response.statuses) {
        return this.parseTweets(response.statuses);
      }
      if (response.data?.statuses) {
        return this.parseTweets(response.data.statuses);
      }
      if (Array.isArray(response.data)) {
        return this.parseTweets(response.data);
      }
      if (Array.isArray(response)) {
        return this.parseTweets(response);
      }
      if (response.tweets) {
        return this.parseTweets(response.tweets);
      }
      if (response.results) {
        return this.parseTweets(response.results);
      }

      // Log the actual structure for debugging
      console.warn('[Twitter API] Unknown response structure. Keys:', Object.keys(response || {}));
      if (response.result) {
        console.warn('[Twitter API] Result type:', typeof response.result, 'Is array:', Array.isArray(response.result));
        if (typeof response.result === 'object') {
          console.warn('[Twitter API] Result keys:', Object.keys(response.result));
        }
      }
      return [];
    } catch (error) {
      console.error('Twitter API error:', error);
      throw error;
    }
  }

  private parseTweets(data: any[]): TwitterPost[] {
    return data
      .filter((tweet: any) => tweet && (tweet.id_str || tweet.id || tweet.legacy?.id_str))
      .map((tweet: any) => {
        // Handle Twitter241 nested structure
        // Primary path: tweet.core.user_results.result.core.name
        // Full path: result.timeline.instructions[].entries[].content.itemContent.tweet_results.result.core.user_results.result.core.name
        const tweetData = tweet.legacy || tweet.tweet?.legacy || tweet;
        const userCore = tweet.core?.user_results?.result?.core || {};
        const userLegacy = tweet.core?.user_results?.result?.legacy || {};
        const userData = userLegacy || 
                        tweet.user_results?.result?.legacy ||
                        tweet.user || 
                        tweetData?.user ||
                        {};
        
        // Extract author info using correct paths
        const authorName = userCore.name || userLegacy.name || userData.name || tweet.author_name || '';
        const authorUsername = userCore.screen_name || userLegacy.screen_name || userData.screen_name || userData.username || tweet.author_username || '';
        const authorId = userCore.id_str || userLegacy.id_str || userData.id_str || userData.id || tweet.author_id || '';
        const followersCount = userLegacy.followers_count || userData.followers_count || tweet.followers_count || 0;
        const verified = userCore.verified !== undefined ? userCore.verified : (userLegacy.verified || userData.verified || tweet.verified || false);
        
        return {
          id: tweetData.id_str || tweet.id_str || tweet.id || String(tweet.id || ''),
          text: tweetData.full_text || tweetData.text || tweet.text || tweet.content || '',
          created_at: tweetData.created_at || tweet.created_at || new Date().toISOString(),
          author: {
            id: authorId,
            username: authorUsername,
            name: authorName,
            verified: verified,
            followers_count: followersCount,
            following_count: userLegacy.friends_count || userData.friends_count || userData.following_count || tweet.following_count || 0,
            profile_image_url: userLegacy.profile_image_url_https || userData.profile_image_url_https || userData.profile_image_url || tweet.profile_image_url || '',
          },
          public_metrics: {
            retweet_count: tweetData.retweet_count || tweet.retweet_count || 0,
            like_count: tweetData.favorite_count || tweetData.like_count || tweet.like_count || 0,
            reply_count: tweetData.reply_count || tweet.reply_count || 0,
            quote_count: tweetData.quote_count || tweet.quote_count || 0,
          },
          media: this.extractMedia(tweetData),
          entities: {
            hashtags: (tweetData.entities?.hashtags || tweet.entities?.hashtags || []).map((h: any) => ({ tag: h.text || h.tag })),
            mentions: (tweetData.entities?.user_mentions || tweet.entities?.user_mentions || []).map((m: any) => ({ username: m.screen_name || m.username })),
            urls: (tweetData.entities?.urls || tweet.entities?.urls || []).map((u: any) => ({ url: u.expanded_url || u.url })),
          },
        };
      });
  }

  private extractMedia(tweet: any): TwitterPost['media'] {
    if (!tweet.entities?.media) return undefined;

    return tweet.entities.media.map((m: any) => ({
      type: m.type || 'photo',
      url: m.media_url_https || m.media_url,
      preview_image_url: m.media_url_https || m.media_url,
      media_key: m.id_str || m.id,
    }));
  }
}
