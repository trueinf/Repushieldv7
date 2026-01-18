import axios, { AxiosInstance } from 'axios';

export class RapidApiClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = axios.create({
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': '',
      },
      timeout: 30000,
    });
  }

  protected async request<T>(
    host: string,
    endpoint: string,
    params: Record<string, any> = {}
  ): Promise<T> {
    try {
      console.log(`[API Request] ${endpoint}`, { params, host });
      const response = await this.client.get(endpoint, {
        headers: {
          'X-RapidAPI-Host': host,
        },
        params,
      });
      console.log(`[API Response] ${endpoint} - Status: ${response.status}`);
      return response.data;
    } catch (error: any) {
      console.error(`[API Error] ${endpoint}:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (error.response?.status === 401) {
        throw new Error('Invalid API key');
      }
      if (error.response?.status === 403) {
        throw new Error('Access forbidden. Check your subscription plan.');
      }
      if (error.response?.status === 404) {
        throw new Error(`Endpoint not found: ${endpoint}. Check API documentation.`);
      }
      throw new Error(`API request failed: ${error.response?.statusText || error.message}`);
    }
  }
}
