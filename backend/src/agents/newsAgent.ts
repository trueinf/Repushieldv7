import { BaseAgent, AgentResult } from './baseAgent.js';
import { NewsApi, NewsArticle } from '../services/apiClients/newsApi.js';
import { PostStorage } from '../services/postStorage.js';
import { Configuration } from '../types/configuration.js';

export class NewsAgent extends BaseAgent {
  private api: NewsApi;

  constructor(config: Configuration, apiKey: string) {
    super(config);
    this.api = new NewsApi(apiKey);
  }

  async execute(): Promise<AgentResult> {
    const result: AgentResult = {
      platform: 'news',
      postsFetched: 0,
      postsStored: 0,
      errors: [],
    };

    try {
      if (!this.config.platformConfig.platforms.includes('news')) {
        return result;
      }

      const query = this.buildQuery();
      const num = 20;

      const articles = await this.api.searchNews(query, num);
      result.postsFetched = articles.length;

      console.log(`[News Agent] Fetched ${articles.length} articles`);
      
      for (const article of articles) {
        try {
          // Store all articles - PostStorage will handle duplicate checking
          console.log(`[News Agent] Storing article ${article.link} for config ${this.config.id}`);
          await PostStorage.storeNewsArticle(article, this.config.id);
          result.postsStored++;
        } catch (error: any) {
          console.error(`[News Agent] Error storing article ${article.link}:`, error.message);
          result.errors.push(`Error storing article ${article.link}: ${error.message}`);
        }
      }
      
      console.log(`[News Agent] Summary: Fetched ${result.postsFetched}, Stored ${result.postsStored}, Errors: ${result.errors.length}`);
    } catch (error: any) {
      result.errors.push(`News agent error: ${error.message}`);
    }

    return result;
  }
}
