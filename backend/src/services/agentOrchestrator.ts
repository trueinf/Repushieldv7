import { Configuration } from '../types/configuration';
import { TwitterAgent } from '../agents/twitterAgent';
import { RedditAgent } from '../agents/redditAgent';
import { FacebookAgent } from '../agents/facebookAgent';
import { NewsAgent } from '../agents/newsAgent';
import { RiskScoringAgent } from '../agents/riskScoringAgent';
import { FactCheckingAgent } from '../agents/factCheckingAgent';
import { AgentResult } from '../agents/baseAgent';
import { supabase } from '../config/supabase';

export interface OrchestrationResult {
  configurationId: string;
  totalPostsFetched: number;
  totalPostsStored: number;
  agentResults: AgentResult[];
  errors: string[];
  duration: number;
}

export class AgentOrchestrator {
  private rapidApiKey: string;
  private serpApiKey: string;
  private openaiApiKey: string;

  constructor(rapidApiKey: string, serpApiKey: string, openaiApiKey: string) {
    this.rapidApiKey = rapidApiKey;
    this.serpApiKey = serpApiKey;
    this.openaiApiKey = openaiApiKey;
  }

  async executeParallel(config: Configuration): Promise<OrchestrationResult> {
    const startTime = Date.now();
    const result: OrchestrationResult = {
      configurationId: config.id,
      totalPostsFetched: 0,
      totalPostsStored: 0,
      agentResults: [],
      errors: [],
      duration: 0,
    };

    const agents: Promise<AgentResult>[] = [];

    if (config.platformConfig.platforms.includes('twitter')) {
      const twitterAgent = new TwitterAgent(config, this.rapidApiKey);
      agents.push(twitterAgent.execute());
    }

    if (config.platformConfig.platforms.includes('reddit')) {
      const redditAgent = new RedditAgent(config, this.rapidApiKey);
      agents.push(redditAgent.execute());
    }

    if (config.platformConfig.platforms.includes('facebook')) {
      const facebookAgent = new FacebookAgent(config, this.rapidApiKey);
      agents.push(facebookAgent.execute());
    }

    if (config.platformConfig.platforms.includes('news')) {
      const newsAgent = new NewsAgent(config, this.serpApiKey);
      agents.push(newsAgent.execute());
    }

    try {
      // Step 1: Execute platform agents in parallel
      const platformResults = await Promise.allSettled(agents);

      for (const settledResult of platformResults) {
        if (settledResult.status === 'fulfilled') {
          const agentResult = settledResult.value;
          result.agentResults.push(agentResult);
          result.totalPostsFetched += agentResult.postsFetched;
          result.totalPostsStored += agentResult.postsStored;
          result.errors.push(...agentResult.errors);
        } else {
          result.errors.push(`Agent failed: ${settledResult.reason}`);
        }
      }

      // Step 2: Run risk scoring and fact-checking agents in parallel (after platform agents)
      // Note: Fact-checking depends on risk scores, but we can start risk scoring immediately
      const analysisAgents: Promise<AgentResult>[] = [];

      if (this.openaiApiKey) {
        console.log(`[Orchestrator] Starting risk scoring agent...`);
        const riskScoringAgent = new RiskScoringAgent(config, this.openaiApiKey);
        analysisAgents.push(
          riskScoringAgent.execute().catch((error: any) => {
            console.error(`[Orchestrator] Risk scoring agent error:`, error);
            return {
              platform: 'risk_scoring',
              postsFetched: 0,
              postsStored: 0,
              errors: [`Risk scoring error: ${error.message}`],
            };
          })
        );
      }

      // Wait for risk scoring to complete, then start fact-checking
      const analysisResults = await Promise.allSettled(analysisAgents);
      
      for (const settledResult of analysisResults) {
        if (settledResult.status === 'fulfilled') {
          result.agentResults.push(settledResult.value);
          result.errors.push(...settledResult.value.errors);
        }
      }

      // Step 3: Validate post completeness and re-run risk scoring for incomplete posts
      if (this.openaiApiKey) {
        await this.validateAndRetryIncompletePosts(config);
      }

      // Step 4: Run fact-checking agent (after risk scoring completes)
      // This needs risk scores, so it runs after risk scoring
      try {
        console.log(`[Orchestrator] Starting fact-checking agent...`);
        const factCheckingAgent = new FactCheckingAgent(config, this.openaiApiKey, this.serpApiKey);
        const factCheckResult = await factCheckingAgent.execute();
        result.agentResults.push(factCheckResult);
        result.errors.push(...factCheckResult.errors);
      } catch (error: any) {
        console.error(`[Orchestrator] Fact-checking agent error:`, error);
        result.errors.push(`Fact-checking error: ${error.message}`);
      }

      await this.logFetchJob(config.id, result);

      result.duration = Date.now() - startTime;
      return result;
    } catch (error: any) {
      result.errors.push(`Orchestration error: ${error.message}`);
      result.duration = Date.now() - startTime;
      return result;
    }
  }

  /**
   * Validate that all posts have complete information and re-run risk scoring for incomplete posts
   */
  private async validateAndRetryIncompletePosts(config: Configuration): Promise<void> {
    try {
      console.log(`[Orchestrator] Validating post completeness for config ${config.id}`);

      // Fetch posts that are missing critical information (for this configuration)
      const { data: incompletePosts, error: fetchError } = await supabase
        .from('posts')
        .select('id, platform, post_id, risk_score, topics, likes_count, upvotes_count')
        .eq('configuration_id', config.id)
        .or('risk_score.is.null,topics.is.null,topics.eq.[]')
        .limit(100); // Limit to avoid processing too many at once

      if (fetchError) {
        console.error(`[Orchestrator] Error fetching incomplete posts:`, fetchError);
        return;
      }

      if (!incompletePosts || incompletePosts.length === 0) {
        console.log(`[Orchestrator] All posts have complete information`);
        
        // Also check for Reddit posts with 0.0 score (user mentioned this issue)
        const { data: redditZeroScorePosts, error: redditError } = await supabase
          .from('posts')
          .select('id, platform, post_id, likes_count, upvotes_count')
          .eq('configuration_id', config.id)
          .eq('platform', 'reddit')
          .or('likes_count.eq.0,upvotes_count.eq.0');

        if (!redditError && redditZeroScorePosts && redditZeroScorePosts.length > 0) {
          console.log(`[Orchestrator] Found ${redditZeroScorePosts.length} Reddit posts with 0 score - these may need re-fetching`);
          // Note: We can't re-fetch individual posts easily, but we log this for awareness
        }
        
        return;
      }

      console.log(`[Orchestrator] Found ${incompletePosts.length} posts missing critical information (risk_score or topics)`);
      console.log(`[Orchestrator] Post IDs:`, incompletePosts.map(p => p.id).slice(0, 10), incompletePosts.length > 10 ? '...' : '');

      // Re-run risk scoring for incomplete posts
      const riskScoringAgent = new RiskScoringAgent(config, this.openaiApiKey);
      const incompletePostIds = incompletePosts.map(p => p.id);
      const retryResult = await riskScoringAgent.scoreSpecificPosts(incompletePostIds);

      if (retryResult.postsStored > 0) {
        console.log(`[Orchestrator] ✅ Successfully re-scored ${retryResult.postsStored} incomplete posts`);
      }

      if (retryResult.errors.length > 0) {
        console.error(`[Orchestrator] ⚠️ Errors during re-scoring:`, retryResult.errors);
      }

      // Check again if there are still incomplete posts after retry
      const { data: stillIncomplete, error: recheckError } = await supabase
        .from('posts')
        .select('id')
        .eq('configuration_id', config.id)
        .or('risk_score.is.null,topics.is.null,topics.eq.[]')
        .limit(5);

      if (!recheckError && stillIncomplete && stillIncomplete.length > 0) {
        console.warn(`[Orchestrator] ⚠️ ${stillIncomplete.length} posts still incomplete after retry. These may need manual review.`);
      } else {
        console.log(`[Orchestrator] ✅ All posts now have complete information`);
      }
    } catch (error: any) {
      console.error(`[Orchestrator] Error validating post completeness:`, error);
      // Don't throw - this is a validation step, not critical
    }
  }

  private async logFetchJob(configId: string, result: OrchestrationResult): Promise<void> {
    try {
      for (const agentResult of result.agentResults) {
        await supabase.from('fetch_jobs').insert({
          configuration_id: configId,
          platform: agentResult.platform,
          status: agentResult.errors.length > 0 ? 'failed' : 'completed',
          posts_fetched: agentResult.postsFetched,
          posts_stored: agentResult.postsStored,
          error_message: agentResult.errors.length > 0 ? agentResult.errors.join('; ') : null,
          started_at: new Date(Date.now() - result.duration).toISOString(),
          completed_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error logging fetch job:', error);
    }
  }
}


