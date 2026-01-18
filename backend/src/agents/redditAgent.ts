import { BaseAgent, AgentResult } from './baseAgent.js';
import { RedditApi, RedditPost } from '../services/apiClients/redditApi.js';
import { PostStorage } from '../services/postStorage.js';
import { Configuration } from '../types/configuration.js';

export class RedditAgent extends BaseAgent {
  private api: RedditApi;

  constructor(config: Configuration, apiKey: string) {
    super(config);
    this.api = new RedditApi(apiKey);
  }

  async execute(): Promise<AgentResult> {
    const result: AgentResult = {
      platform: 'reddit',
      postsFetched: 0,
      postsStored: 0,
      errors: [],
    };

    try {
      if (!this.config.platformConfig.platforms.includes('reddit')) {
        console.log(`[Reddit Agent] Reddit is not enabled in configuration. Skipping.`);
        return result;
      }

      const query = this.buildQuery();
      const limit = 20;

      console.log(`[Reddit Agent] Starting execution for config ${this.config.id}`);
      console.log(`[Reddit Agent] Searching with query: ${query}`);
      console.log(`[Reddit Agent] Configuration platforms:`, this.config.platformConfig.platforms);
      
      // Use 'top' with time='day' to get top posts from last 24 hours
      // Note: 'new' sort doesn't support time parameter, so we use 'top' for time-filtered results
      const posts = await this.api.searchPosts(query, limit, 'top');
      console.log(`[Reddit Agent] Fetched ${posts.length} posts from API`);
      result.postsFetched = posts.length;
      
      if (posts.length === 0) {
        console.warn(`[Reddit Agent] No posts returned from API. This might indicate:
          - API returned empty results
          - Query didn't match any posts
          - API response structure changed
          - Rate limiting or API error`);
      }

      for (const post of posts) {
        try {
          // Store all posts - PostStorage will handle duplicate checking
          console.log(`[Reddit Agent] Storing post ${post.id} for config ${this.config.id}`);
          await PostStorage.storeRedditPost(post, this.config.id);
          result.postsStored++;
        } catch (error: any) {
          console.error(`[Reddit Agent] Error storing post ${post.id}:`, error.message);
          result.errors.push(`Error storing post ${post.id}: ${error.message}`);
        }
      }
      
      console.log(`[Reddit Agent] Summary: Fetched ${result.postsFetched}, Stored ${result.postsStored}, Errors: ${result.errors.length}`);
    } catch (error: any) {
      result.errors.push(`Reddit agent error: ${error.message}`);
    }

    return result;
  }
}
