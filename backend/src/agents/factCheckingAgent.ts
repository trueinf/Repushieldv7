import { BaseAgent, AgentResult } from './baseAgent';
import { Configuration } from '../types/configuration';
import { supabase } from '../config/supabase';
import axios from 'axios';
import OpenAI from 'openai';

export interface FactCheckResult {
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
}

export class FactCheckingAgent extends BaseAgent {
  private openai: OpenAI;
  private serpApiKey: string;

  constructor(config: Configuration, openaiApiKey: string, serpApiKey: string) {
    super(config);
    this.openai = new OpenAI({ apiKey: openaiApiKey });
    this.serpApiKey = serpApiKey;
  }

  async execute(): Promise<AgentResult> {
    const result: AgentResult = {
      platform: 'fact_checking',
      postsFetched: 0,
      postsStored: 0,
      errors: [],
    };

    try {
      console.log(`[Fact-Checking Agent] Starting fact-checking for config ${this.config.id}`);

      // Fetch posts with risk_score >= 7 (7.0 to 10.0) that don't have fact_check_data yet
      const { data: posts, error: fetchError } = await supabase
        .from('posts')
        .select('*')
        .eq('configuration_id', this.config.id)
        .gte('risk_score', 7)
        .is('fact_check_data', null)
        .order('risk_score', { ascending: false });

      if (fetchError) {
        throw new Error(`Failed to fetch posts: ${fetchError.message}`);
      }

      if (!posts || posts.length === 0) {
        console.log(`[Fact-Checking Agent] No high-risk posts to fact-check for config ${this.config.id}`);
        return result;
      }

      console.log(`[Fact-Checking Agent] Found ${posts.length} high-risk posts to fact-check (risk_score >= 7)`);
      result.postsFetched = posts.length;

      // Process ALL posts in parallel simultaneously (no concurrency limit)
      // Each post is processed independently, so if one fails, others continue
      await Promise.all(
        posts.map(post => 
          this.factCheckPost(post)
            .then(() => {
              result.postsStored++;
              console.log(`[Fact-Checking Agent] ✅ Successfully fact-checked post ${post.id}`);
            })
            .catch((error: any) => {
              console.error(`[Fact-Checking Agent] ❌ Error fact-checking post ${post.id}:`, error.message);
              result.errors.push(`Error fact-checking post ${post.id}: ${error.message}`);
              // Continue processing other posts - don't throw
            })
        )
      );

      console.log(`[Fact-Checking Agent] Completed fact-checking ${result.postsStored} posts`);
    } catch (error: any) {
      console.error(`[Fact-Checking Agent] Error:`, error);
      result.errors.push(`Fact-checking error: ${error.message}`);
    }

    return result;
  }

  private async factCheckPost(post: any): Promise<void> {
    try {
      const content = post.content || post.title || '';
      const entityName = this.config.entityDetails.name;

      // Step 1: Use SerpAPI to gather evidence via web search
      const query = `fact check: "${content}" about ${entityName}`;

      let sources: Array<{ title: string; url: string; snippet: string }> = [];
      let facts: string[] = [];

      try {
        const response = await axios.get('https://serpapi.com/search.json', {
          params: {
            engine: 'google',
            q: query,
            api_key: this.serpApiKey,
            num: 10,
          },
          timeout: 30000,
        });

        // Extract evidence from search results
        const organicResults = response.data?.organic_results || [];
        sources = organicResults.slice(0, 5).map((result: any) => ({
          title: result.title || '',
          url: result.link || '',
          snippet: result.snippet || '',
        }));

        // Generate facts from snippets
        facts = sources.map((s: any) => s.snippet).filter(Boolean);
      } catch (searchError: any) {
        console.warn(`[Fact-Checking Agent] Web search error for post ${post.id}:`, searchError.message);
        // Continue with empty sources - OpenAI will still generate a response
      }

      // Step 2: Use OpenAI to analyze evidence and generate tweet-ready admin response
      const evidenceText = sources.length > 0
        ? sources.map((s, i) => `${i + 1}. ${s.title}: ${s.snippet} (${s.url})`).join('\n')
        : 'No evidence found from web search.';

      const prompt = `You are an admin managing the reputation of ${entityName}. A high-risk post (risk score >= 7) has been flagged that requires a response.

Post Content: "${content}"

Evidence from Web Search:
${evidenceText}

Your task:
1. Analyze the post content and the evidence gathered
2. Generate a professional, tweet-ready admin response (maximum 280 characters)
3. The response should be appropriate for posting on social media (Twitter/X style)
4. Include key evidence or facts if relevant
5. Maintain a professional but approachable tone
6. If the post contains false information, gently correct it with evidence
7. If the post is accurate, acknowledge it professionally

Respond in JSON format:
{
  "response_text": "<tweet-ready response, max 280 characters>",
  "tone": "professional" | "conciliatory" | "factual" | "defensive",
  "key_points": ["point1", "point2", "point3"]
}`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a professional social media admin managing the reputation of ${entityName}. Generate concise, tweet-ready responses that are professional, factual, and appropriate for public communication.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.5,
      });

      const responseText = completion.choices[0]?.message?.content || '{}';
      const adminResponse = JSON.parse(responseText);

      // Determine truth status based on evidence
      const verification = this.determineTruthStatus(sources, content);

      const factCheckData: FactCheckResult = {
        evidence: {
          sources,
          facts,
          verification: verification,
        },
        truth_status: verification as any,
        admin_response: {
          response_text: adminResponse.response_text || 'We are reviewing this post and will provide a response shortly.',
          tone: adminResponse.tone || 'professional',
          key_points: adminResponse.key_points || [],
        },
      };

      // Update post in database
      const { error: updateError } = await supabase
        .from('posts')
        .update({
          fact_check_data: factCheckData,
        })
        .eq('id', post.id);

      if (updateError) {
        console.error(`[Fact-Checking Agent] Error updating post ${post.id}:`, updateError);
        throw updateError;
      }

      console.log(`[Fact-Checking Agent] Fact-checked post ${post.id}: ${verification} - Response generated`);
    } catch (error: any) {
      console.error(`[Fact-Checking Agent] Error fact-checking post ${post.id}:`, error.message);
      throw error;
    }
  }

  private determineTruthStatus(sources: any[], content: string): string {
    if (sources.length === 0) {
      return 'unverified';
    }

    // Simple heuristic: if multiple sources contradict, it's likely false or misleading
    const positiveIndicators = ['true', 'confirmed', 'verified', 'accurate', 'correct'];
    const negativeIndicators = ['false', 'misleading', 'untrue', 'incorrect', 'debunked', 'hoax'];

    let positiveCount = 0;
    let negativeCount = 0;

    const allText = sources.map(s => s.snippet).join(' ').toLowerCase();

    positiveIndicators.forEach(indicator => {
      if (allText.includes(indicator)) positiveCount++;
    });

    negativeIndicators.forEach(indicator => {
      if (allText.includes(indicator)) negativeCount++;
    });

    if (negativeCount > positiveCount && negativeCount > 0) {
      return 'false';
    } else if (positiveCount > negativeCount && positiveCount > 0) {
      return 'true';
    } else if (negativeCount > 0 || positiveCount > 0) {
      return 'misleading';
    }

    return 'unverified';
  }
}

