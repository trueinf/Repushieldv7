import { BaseAgent, AgentResult } from './baseAgent.js';
import { FacebookApi, FacebookPost } from '../services/apiClients/facebookApi.js';
import { PostStorage } from '../services/postStorage.js';
import { Configuration } from '../types/configuration.js';

export class FacebookAgent extends BaseAgent {
  private api: FacebookApi;

  constructor(config: Configuration, apiKey: string) {
    super(config);
    this.api = new FacebookApi(apiKey);
  }

  async execute(): Promise<AgentResult> {
    const result: AgentResult = {
      platform: 'facebook',
      postsFetched: 0,
      postsStored: 0,
      errors: [],
    };

    try {
      if (!this.config.platformConfig.platforms.includes('facebook')) {
        return result;
      }

      const query = this.buildQuery();
      const limit = 20;

      console.log(`[Facebook Agent] Searching with query: ${query}`);
      const posts = await this.api.searchPosts(query, limit);
      console.log(`[Facebook Agent] Fetched ${posts.length} posts`);
      result.postsFetched = posts.length;

      for (const post of posts) {
        try {
          // Store all posts - PostStorage will handle duplicate checking
          console.log(`[Facebook Agent] Storing post ${post.id} for config ${this.config.id}`);
          await PostStorage.storeFacebookPost(post, this.config.id);
          result.postsStored++;
        } catch (error: any) {
          console.error(`[Facebook Agent] Error storing post ${post.id}:`, error.message);
          result.errors.push(`Error storing post ${post.id}: ${error.message}`);
        }
      }
      
      console.log(`[Facebook Agent] Summary: Fetched ${result.postsFetched}, Stored ${result.postsStored}, Errors: ${result.errors.length}`);
    } catch (error: any) {
      result.errors.push(`Facebook agent error: ${error.message}`);
    }

    return result;
  }
}
