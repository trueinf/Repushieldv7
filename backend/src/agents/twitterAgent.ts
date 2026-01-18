import { BaseAgent, AgentResult } from './baseAgent';
import { TwitterApi, TwitterPost } from '../services/apiClients/twitterApi';
import { PostStorage } from '../services/postStorage';
import { Configuration } from '../types/configuration';

export class TwitterAgent extends BaseAgent {
  private api: TwitterApi;

  constructor(config: Configuration, apiKey: string) {
    super(config);
    this.api = new TwitterApi(apiKey);
  }

  async execute(): Promise<AgentResult> {
    const result: AgentResult = {
      platform: 'twitter',
      postsFetched: 0,
      postsStored: 0,
      errors: [],
    };

    try {
      if (!this.config.platformConfig.platforms.includes('twitter')) {
        return result;
      }

      const query = this.buildQuery();
      const maxResults = 20;

      console.log(`[Twitter Agent] Searching with query: ${query}`);
      const posts = await this.api.searchRecentTweets(query, maxResults);
      console.log(`[Twitter Agent] Fetched ${posts.length} posts`);
      result.postsFetched = posts.length;

      for (const post of posts) {
        try {
          // Store all posts - PostStorage will handle duplicate checking
          console.log(`[Twitter Agent] Storing post ${post.id} for config ${this.config.id}`);
          await PostStorage.storeTwitterPost(post, this.config.id);
          result.postsStored++;
        } catch (error: any) {
          console.error(`[Twitter Agent] Error storing post ${post.id}:`, error.message);
          result.errors.push(`Error storing post ${post.id}: ${error.message}`);
        }
      }
      
      console.log(`[Twitter Agent] Summary: Fetched ${result.postsFetched}, Stored ${result.postsStored}, Errors: ${result.errors.length}`);
    } catch (error: any) {
      result.errors.push(`Twitter agent error: ${error.message}`);
    }

    return result;
  }
}
