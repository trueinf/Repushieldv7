import cron from 'node-cron';
import { ConfigurationService } from './configurationService';
import { AgentOrchestrator } from './agentOrchestrator';
import dotenv from 'dotenv';

dotenv.config();

export class PostFetchScheduler {
  private orchestrator: AgentOrchestrator;
  private intervalMinutes: number;
  private cronJob: cron.ScheduledTask | null = null;

  constructor(
    rapidApiKey: string,
    serpApiKey: string,
    openaiApiKey: string,
    intervalMinutes: number = 10
  ) {
    this.orchestrator = new AgentOrchestrator(rapidApiKey, serpApiKey, openaiApiKey);
    this.intervalMinutes = intervalMinutes;
  }

  start(): void {
    const cronExpression = `*/${this.intervalMinutes} * * * *`;

    this.cronJob = cron.schedule(cronExpression, async () => {
      console.log(`[Scheduler] Running fetch job at ${new Date().toISOString()}`);
      await this.fetchAllActiveConfigurations();
    });

    console.log(`[Scheduler] Started. Fetching every ${this.intervalMinutes} minutes.`);
  }

  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log('[Scheduler] Stopped.');
    }
  }

  async fetchAllActiveConfigurations(): Promise<void> {
    try {
      const configs = ConfigurationService.getAll();
      const activeConfigs = configs.filter(c => c.isActive);

      if (activeConfigs.length === 0) {
        console.log('[Scheduler] No active configurations found.');
        return;
      }

      console.log(`[Scheduler] Found ${activeConfigs.length} active configuration(s).`);

      for (const config of activeConfigs) {
        try {
          console.log(`[Scheduler] Fetching posts for configuration: ${config.id}`);
          const result = await this.orchestrator.executeParallel(config);
          
          console.log(`[Scheduler] Completed for ${config.id}:`, {
            fetched: result.totalPostsFetched,
            stored: result.totalPostsStored,
            errors: result.errors.length,
          });

          if (result.errors.length > 0) {
            console.error(`[Scheduler] Errors for ${config.id}:`, result.errors);
          }
        } catch (error: any) {
          console.error(`[Scheduler] Error processing config ${config.id}:`, error.message);
        }
      }
    } catch (error: any) {
      console.error('[Scheduler] Fatal error:', error.message);
    }
  }

  async triggerManualFetch(configurationId: string): Promise<void> {
    const config = ConfigurationService.getById(configurationId);
    if (!config) {
      throw new Error(`Configuration ${configurationId} not found`);
    }
    
    if (!config.isActive) {
      console.warn(`[Scheduler] Configuration ${configurationId} is not active. Activating it...`);
      ConfigurationService.activate(configurationId);
    }

    console.log(`[Scheduler] Manual fetch triggered for ${configurationId}`);
    console.log(`[Scheduler] Configuration details:`, {
      id: config.id,
      entityName: config.entityDetails.name,
      platforms: config.platformConfig.platforms,
      keywords: config.ontology.coreKeywords.slice(0, 3),
    });
    
    const result = await this.orchestrator.executeParallel(config);
    
    console.log(`[Scheduler] ✅ Manual fetch completed for ${configurationId}:`, {
      totalFetched: result.totalPostsFetched,
      totalStored: result.totalPostsStored,
      errors: result.errors.length,
      duration: `${result.duration}ms`,
    });
    
    if (result.errors.length > 0) {
      console.error(`[Scheduler] Errors during fetch:`, result.errors);
    }
  }
}

