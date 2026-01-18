import { BaseAgent, AgentResult } from './baseAgent';
import { Configuration } from '../types/configuration';
import { supabase } from '../config/supabase';
import OpenAI from 'openai';
import { GroupingService } from '../services/groupingService.js';

export interface RiskScoreResult {
  topics: string[]; // 3 main topics
  keywords: string[]; // 3 main hashtags/keywords
  sentiment: 'positive' | 'neutral' | 'negative';
  riskScore: number; // 1-10
  crispSummary: string; // Exactly 5 words
}

export class RiskScoringAgent extends BaseAgent {
  private openai: OpenAI;
  private groupingService: GroupingService;

  constructor(config: Configuration, openaiApiKey: string) {
    super(config);
    this.openai = new OpenAI({ apiKey: openaiApiKey });
    this.groupingService = new GroupingService(openaiApiKey);
  }

  async execute(): Promise<AgentResult> {
    const result: AgentResult = {
      platform: 'risk_scoring',
      postsFetched: 0,
      postsStored: 0,
      errors: [],
    };

    try {
      console.log(`[Risk Scoring Agent] Starting risk scoring for config ${this.config.id}`);

      // Fetch all posts for this configuration (process all posts, not just those without risk_score)
      const { data: posts, error: fetchError } = await supabase
        .from('posts')
        .select('*')
        .eq('configuration_id', this.config.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (fetchError) {
        throw new Error(`Failed to fetch posts: ${fetchError.message}`);
      }

      if (!posts || posts.length === 0) {
        console.log(`[Risk Scoring Agent] No posts to score for config ${this.config.id}`);
        return result;
      }

      console.log(`[Risk Scoring Agent] Found ${posts.length} posts to score`);

      result.postsFetched = posts.length;

      // Process all posts in parallel (with concurrency limit to avoid rate limits)
      const concurrencyLimit = 10;
      const batches: any[][] = [];
      for (let i = 0; i < posts.length; i += concurrencyLimit) {
        batches.push(posts.slice(i, i + concurrencyLimit));
      }

      // Process batches in parallel, posts within batch in parallel
      await Promise.all(
        batches.map(batch =>
          Promise.all(batch.map(post => this.scorePost(post).catch(err => {
            console.error(`[Risk Scoring Agent] Error scoring post ${post.id}:`, err);
            result.errors.push(`Error scoring post ${post.id}: ${err.message}`);
            return null;
          })))
        )
      );

      result.postsStored = posts.length;

      console.log(`[Risk Scoring Agent] Completed scoring ${result.postsStored} posts`);
    } catch (error: any) {
      console.error(`[Risk Scoring Agent] Error:`, error);
      result.errors.push(`Risk scoring error: ${error.message}`);
    }

    return result;
  }

  /**
   * Score specific posts by their IDs (for re-running incomplete posts)
   */
  async scoreSpecificPosts(postIds: string[]): Promise<AgentResult> {
    const result: AgentResult = {
      platform: 'risk_scoring_retry',
      postsFetched: 0,
      postsStored: 0,
      errors: [],
    };

    try {
      if (postIds.length === 0) {
        return result;
      }

      console.log(`[Risk Scoring Agent] Re-scoring ${postIds.length} incomplete posts`);

      const { data: posts, error: fetchError } = await supabase
        .from('posts')
        .select('*')
        .eq('configuration_id', this.config.id)
        .in('id', postIds);

      if (fetchError) {
        throw new Error(`Failed to fetch posts: ${fetchError.message}`);
      }

      if (!posts || posts.length === 0) {
        console.log(`[Risk Scoring Agent] No posts found for re-scoring`);
        return result;
      }

      result.postsFetched = posts.length;

      // Process posts in parallel with concurrency limit
      const concurrencyLimit = 10;
      const batches: any[][] = [];
      for (let i = 0; i < posts.length; i += concurrencyLimit) {
        batches.push(posts.slice(i, i + concurrencyLimit));
      }

      await Promise.all(
        batches.map(batch =>
          Promise.all(batch.map(post => this.scorePost(post).catch(err => {
            console.error(`[Risk Scoring Agent] Error re-scoring post ${post.id}:`, err);
            result.errors.push(`Error re-scoring post ${post.id}: ${err.message}`);
            return null;
          })))
        )
      );

      result.postsStored = posts.length;
      console.log(`[Risk Scoring Agent] Completed re-scoring ${result.postsStored} posts`);
    } catch (error: any) {
      console.error(`[Risk Scoring Agent] Re-scoring error:`, error);
      result.errors.push(`Re-scoring error: ${error.message}`);
    }

    return result;
  }

  private async scorePost(post: any): Promise<void> {
    try {
      const content = post.content || post.title || '';
      const entityName = this.config.entityDetails.name;

      const prompt = `You are a social media post / news analyst who can read through posts and extract context and meaning and intelligence out of the posts / content.

Read through the content provided to you with respect to the entity ${entityName} and extract the following:

1. Topics - Extract the three main topics of the post
2. Keywords - Extract the three main hashtags / keywords of the post
3. Sentiment - Return the sentiment of the post (positive, negative or neutral)
4. Risk Score - Return a risk score out of 10 based on the reputational risk for the entity with 10 being the highest.
5. Crisp Summary - Return a crisp 5 word summary of the post

Post Content: "${content}"

Respond in JSON format with exactly these fields:
{
  "topics": ["topic1", "topic2", "topic3"],
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "sentiment": "positive" | "neutral" | "negative",
  "riskScore": <number 1-10>,
  "crispSummary": "<exactly 5 words>"
}`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a social media post / news analyst who can read through posts and extract context and meaning and intelligence out of the posts / content. Always respond in valid JSON format.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      const responseText = completion.choices[0]?.message?.content || '{}';
      const analysis: RiskScoreResult = JSON.parse(responseText);

      // Validate and clamp risk score
      const riskScore = Math.max(1, Math.min(10, Math.round((analysis.riskScore || 5) * 10) / 10));
      
      // Ensure exactly 3 topics
      const topics = (analysis.topics || []).slice(0, 3);
      
      // Ensure exactly 3 keywords
      const keywords = (analysis.keywords || []).slice(0, 3);
      
      // Validate sentiment
      const sentiment = ['positive', 'neutral', 'negative'].includes(analysis.sentiment) 
        ? analysis.sentiment 
        : 'neutral';
      
      // Ensure crisp summary is exactly 5 words
      const crispSummary = (analysis.crispSummary || '').trim();
      const words = crispSummary.split(/\s+/).filter(w => w.length > 0);
      const finalSummary = words.slice(0, 5).join(' ');

      // Update post in database
      const { error: updateError } = await supabase
        .from('posts')
        .update({
          risk_score: riskScore,
          sentiment: sentiment,
          topics: topics,
          keywords: keywords,
          narrative: finalSummary || null,
        })
        .eq('id', post.id);

      if (updateError) {
        console.error(`[Risk Scoring Agent] Error updating post ${post.id}:`, updateError);
        throw updateError;
      }

      console.log(`[Risk Scoring Agent] Scored post ${post.id}: ${riskScore}/10 (${sentiment}) - Summary: ${finalSummary}`);

      // Group post into topics and narratives after scoring
      try {
        await this.groupingService.groupPost(post.id, this.config.id);
      } catch (groupError: any) {
        console.error(`[Risk Scoring Agent] Error grouping post ${post.id}:`, groupError.message);
        // Don't throw - grouping is non-critical
      }
    } catch (error: any) {
      console.error(`[Risk Scoring Agent] Error scoring post ${post.id}:`, error.message);
      throw error;
    }
  }
}

