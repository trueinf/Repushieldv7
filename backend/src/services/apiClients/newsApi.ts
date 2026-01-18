import axios from 'axios';

export interface NewsArticle {
  position: number;
  title: string;
  link: string;
  source: string;
  date: string;
  snippet: string;
  thumbnail?: string;
  date_parsed?: string;
  source_info?: {
    name: string;
    favicon?: string;
    icon?: string;
  };
}

export class NewsApi {
  private apiKey: string;
  private baseUrl = 'https://serpapi.com/search';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchNews(query: string, num: number = 20): Promise<NewsArticle[]> {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          engine: 'google_news',
          q: query,
          num,
          sort: 1, // Sort by date (1 = Date, 0 = Relevance)
          tbs: 'qdr:d', // Time filter: past 24 hours (qdr:d = day)
          api_key: this.apiKey,
        },
        timeout: 30000,
      });

      console.log('[News API] Response structure:', {
        hasNewsResults: !!response.data?.news_results,
        hasOrganicResults: !!response.data?.organic_results,
        keys: Object.keys(response.data || {}),
      });

      const articles: NewsArticle[] = [];

      // Parse news_results
      if (response.data?.news_results && Array.isArray(response.data.news_results)) {
        articles.push(...this.parseArticles(response.data.news_results));
      }

      // Parse organic_results (sometimes news appears here)
      if (response.data?.organic_results && Array.isArray(response.data.organic_results)) {
        const newsFromOrganic = response.data.organic_results
          .filter((item: any) => item.link && item.title)
          .map((item: any) => {
            // Handle source - can be string or object with name/icon
            let source = '';
            if (typeof item.source === 'string') {
              source = item.source;
            } else if (item.source_info?.name) {
              source = item.source_info.name;
            } else if (item.source?.name) {
              source = item.source.name;
            }

            // Handle source_info - normalize icon/favicon
            let source_info = item.source_info;
            if (item.source && typeof item.source === 'object' && item.source.name) {
              source_info = {
                name: item.source.name,
                icon: item.source.icon || item.source.favicon,
                favicon: item.source.favicon || item.source.icon,
              };
            } else if (item.source_info) {
              source_info = {
                name: item.source_info.name || source,
                icon: item.source_info.icon || item.source_info.favicon,
                favicon: item.source_info.favicon || item.source_info.icon,
              };
            }

            return {
              position: item.position || 0,
              title: item.title,
              link: item.link,
              source: source,
              date: item.date || '',
              snippet: item.snippet || '',
              thumbnail: item.thumbnail,
              date_parsed: item.date_parsed,
              source_info: source_info,
            };
          });
        articles.push(...newsFromOrganic);
      }

      // Limit total results to the requested number (max 20)
      return articles.slice(0, num);
    } catch (error: any) {
      if (error.response?.status === 429) {
        throw new Error('SerpAPI rate limit exceeded. Please try again later.');
      }
      if (error.response?.status === 401) {
        throw new Error('Invalid SerpAPI key');
      }
      console.error('News API error:', error);
      throw new Error(`News API request failed: ${error.message}`);
    }
  }

  private parseArticles(data: any[]): NewsArticle[] {
    return data
      .filter((item: any) => item.title && item.link)
      .map((item: any) => {
        // Primary path: news_results[].source.name
        // Fallback: news_results[].source (if it's a string)
        let source = '';
        if (typeof item.source === 'string') {
          source = item.source;
        } else if (item.source?.name) {
          source = item.source.name;
        } else if (item.source_info?.name) {
          source = item.source_info.name;
        }

        // Handle source_info - normalize icon/favicon
        let source_info = item.source_info;
        if (item.source && typeof item.source === 'object' && item.source.name) {
          source_info = {
            name: item.source.name,
            icon: item.source.icon || item.source.favicon,
            favicon: item.source.favicon || item.source.icon,
          };
        } else if (item.source_info) {
          source_info = {
            name: item.source_info.name || source,
            icon: item.source_info.icon || item.source_info.favicon,
            favicon: item.source_info.favicon || item.source_info.icon,
          };
        }

        return {
          position: item.position || 0,
          title: item.title,
          link: item.link,
          source: source,
          date: item.date || '',
          snippet: item.snippet || '',
          thumbnail: item.thumbnail,
          date_parsed: item.date_parsed,
          source_info: source_info,
        };
      });
  }
}
