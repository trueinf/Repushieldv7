# Agent Orchestration System

This document explains how the multi-agent system orchestrates parallel post fetching from different social media platforms and news sources.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    PostFetchScheduler                        │
│  (Cron-based scheduler running every 10 minutes)          │
└──────────────────────┬──────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  AgentOrchestrator                           │
│  (Manages parallel execution of platform agents)            │
└──────────────────────┬──────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ TwitterAgent│ │ RedditAgent │ │FacebookAgent│ │  NewsAgent  │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
        │             │             │             │
        └─────────────┼─────────────┼─────────────┘
                      │
                      ▼
            ┌──────────────────┐
            │   PostStorage    │
            │   (Supabase)     │
            └──────────────────┘
```

## Components

### 1. PostFetchScheduler (`server/src/services/scheduler.ts`)

**Purpose**: Manages scheduled and manual post fetching

**Key Features**:
- **Cron-based scheduling**: Runs every 10 minutes (configurable via `FETCH_INTERVAL_MINUTES`)
- **Automatic execution**: Fetches posts for all active configurations
- **Manual trigger**: Can be triggered immediately when a configuration is activated

**Methods**:
- `start()`: Starts the cron scheduler
- `stop()`: Stops the scheduler
- `fetchAllActiveConfigurations()`: Fetches posts for all active configs
- `triggerManualFetch(configurationId)`: Triggers immediate fetch for a specific config

**Flow**:
```typescript
// Scheduled execution (every 10 minutes)
cron.schedule('*/10 * * * *', async () => {
  await this.fetchAllActiveConfigurations();
});

// Manual execution (on activation)
await scheduler.triggerManualFetch(configurationId);
```

---

### 2. AgentOrchestrator (`server/src/services/agentOrchestrator.ts`)

**Purpose**: Orchestrates parallel execution of platform-specific agents

**Key Features**:
- **Parallel execution**: All agents run simultaneously using `Promise.allSettled()`
- **Platform selection**: Only creates agents for platforms enabled in configuration
- **Error isolation**: One agent failure doesn't stop others
- **Result aggregation**: Combines results from all agents
- **Job logging**: Logs fetch jobs to Supabase `fetch_jobs` table

**Flow**:
```typescript
async executeParallel(config: Configuration) {
  const agents: Promise<AgentResult>[] = [];
  
  // Create agents only for enabled platforms
  if (config.platformConfig.platforms.includes('twitter')) {
    agents.push(new TwitterAgent(config, apiKey).execute());
  }
  if (config.platformConfig.platforms.includes('reddit')) {
    agents.push(new RedditAgent(config, apiKey).execute());
  }
  if (config.platformConfig.platforms.includes('facebook')) {
    agents.push(new FacebookAgent(config, apiKey).execute());
  }
  if (config.platformConfig.platforms.includes('news')) {
    agents.push(new NewsAgent(config, serpApiKey).execute());
  }
  
  // Execute all agents in parallel
  const results = await Promise.allSettled(agents);
  
  // Aggregate results
  // Log to database
  // Return orchestration result
}
```

**Result Structure**:
```typescript
interface OrchestrationResult {
  configurationId: string;
  totalPostsFetched: number;
  totalPostsStored: number;
  agentResults: AgentResult[];
  errors: string[];
  duration: number; // milliseconds
}
```

---

### 3. BaseAgent (`server/src/agents/baseAgent.ts`)

**Purpose**: Abstract base class providing common functionality for all agents

**Shared Features**:
- **Configuration**: Each agent receives the monitoring configuration
- **Filter criteria**: Builds filter criteria from entity name, keywords, handles
- **Query building**: Constructs search queries from configuration
- **Filter matching**: Checks if posts match the filter criteria

**Abstract Method**:
- `execute()`: Must be implemented by each platform agent

**Filter Criteria**:
```typescript
{
  entityName: "Entity Name",
  alternateNames: ["Alt Name 1", "Alt Name 2"],
  ontologyKeywords: {
    coreKeywords: ["keyword1", "keyword2"],
    relatedTerms: ["term1", "term2"]
  },
  socialHandles: {
    twitter: ["@handle1"],
    reddit: ["u/username"],
    facebook: ["page-name"],
    website: ["domain.com"]
  }
}
```

---

### 4. Platform Agents

Each agent extends `BaseAgent` and implements platform-specific logic:

#### TwitterAgent (`server/src/agents/twitterAgent.ts`)
- **API**: RapidAPI - Twitter241
- **Query**: Built from entity name, keywords, handles
- **Filtering**: Matches against post text, author username, author name
- **Storage**: Stores via `PostStorage.storeTwitterPost()`

#### RedditAgent (`server/src/agents/redditAgent.ts`)
- **API**: RapidAPI - Reddit34
- **Query**: Built from entity name, keywords
- **Filtering**: Matches against post title/text, subreddit name
- **Storage**: Stores via `PostStorage.storeRedditPost()`
- **Note**: Uses subreddit as author (not individual post author)

#### FacebookAgent (`server/src/agents/facebookAgent.ts`)
- **API**: RapidAPI - Facebook Scraper3
- **Query**: Built from entity name, keywords
- **Filtering**: Matches against post message, author name
- **Storage**: Stores via `PostStorage.storeFacebookPost()`

#### NewsAgent (`server/src/agents/newsAgent.ts`)
- **API**: SerpAPI - Google News
- **Query**: Built from entity name, keywords
- **Filtering**: Matches against article title/snippet, source name
- **Storage**: Stores via `PostStorage.storeNewsArticle()`

---

## Execution Flow

### 1. Scheduled Execution (Every 10 Minutes)

```
1. Cron triggers scheduler
   ↓
2. Scheduler fetches all active configurations
   ↓
3. For each active configuration:
   ├─→ Create AgentOrchestrator
   ├─→ Execute parallel agents
   │   ├─→ Twitter Agent (if enabled)
   │   ├─→ Reddit Agent (if enabled)
   │   ├─→ Facebook Agent (if enabled)
   │   └─→ News Agent (if enabled)
   ├─→ Aggregate results
   └─→ Log to fetch_jobs table
```

### 2. Manual Execution (On Activation)

```
1. User activates configuration via API
   POST /api/configurations/:id/activate
   ↓
2. ConfigurationService.activate(id)
   ↓
3. Scheduler.triggerManualFetch(id)
   ↓
4. AgentOrchestrator.executeParallel(config)
   ↓
5. All agents execute in parallel
   ↓
6. Results returned to frontend
```

### 3. Individual Agent Execution

```
1. Agent.execute() called
   ↓
2. Check if platform is enabled in config
   ↓
3. Build search query from configuration
   ↓
4. Call platform API (Twitter/Reddit/Facebook/News)
   ↓
5. Parse API response
   ↓
6. For each post:
   ├─→ Filter post (matchesFilter)
   ├─→ If matches: Store in database
   └─→ Track counts (fetched/stored)
   ↓
7. Return AgentResult
```

---

## Parallel Execution Details

### Promise.allSettled() Pattern

All agents run **simultaneously**, not sequentially:

```typescript
const agents: Promise<AgentResult>[] = [
  twitterAgent.execute(),    // Starts immediately
  redditAgent.execute(),    // Starts immediately
  facebookAgent.execute(),  // Starts immediately
  newsAgent.execute(),      // Starts immediately
];

// Wait for ALL to complete (success or failure)
const results = await Promise.allSettled(agents);
```

**Benefits**:
- **Faster execution**: All platforms fetch simultaneously
- **Error isolation**: One failure doesn't block others
- **Better resource utilization**: Multiple API calls in parallel

**Example Timeline**:
```
Time:  0s    2s    4s    6s    8s
       │     │     │     │     │
Twitter│═════╗     │     │     │
       │     ║     │     │     │
Reddit │     ║═════╗     │     │
       │     ║     ║     │     │
Facebook│     ║     ║═════╗     │
       │     ║     ║     ║     │
News   │     ║     ║     ║═════╗
       │     ║     ║     ║     ║
       └─────┴─────┴─────┴─────┘
       All complete in ~8s (longest agent)
```

---

## Filtering Logic

Each agent filters posts before storing:

1. **Query Building**: Creates search query from:
   - Entity name
   - Alternate names
   - Core keywords
   - Social handles (platform-specific)

2. **Post Filtering**: Checks if post matches:
   - Contains entity name (flexible matching, handles spaces)
   - Contains any core keyword
   - Author username/name matches social handles
   - For Reddit/News: More lenient (stores if contains entity OR keyword)

3. **Storage Decision**: Post is stored if:
   - Matches full filter criteria, OR
   - Contains entity name, OR
   - Contains any core keyword

---

## Error Handling

### Agent-Level Errors
- Individual agent errors are caught and added to `AgentResult.errors`
- Agent continues processing other posts
- Result includes error count and messages

### Orchestration-Level Errors
- `Promise.allSettled()` ensures all agents complete even if some fail
- Failed agents return rejected promises, captured in results
- Orchestration result includes aggregated errors

### Scheduler-Level Errors
- Errors in one configuration don't stop others
- Each configuration fetch is wrapped in try-catch
- Errors are logged but don't crash the scheduler

---

## Database Logging

Each agent execution is logged to `fetch_jobs` table:

```sql
INSERT INTO fetch_jobs (
  configuration_id,
  platform,
  status,              -- 'completed' or 'failed'
  posts_fetched,
  posts_stored,
  error_message,
  started_at,
  completed_at
)
```

---

## Configuration

### Environment Variables
- `RAPIDAPI_KEY`: API key for Twitter, Reddit, Facebook APIs
- `SERPAPI_KEY`: API key for Google News API
- `FETCH_INTERVAL_MINUTES`: Scheduler interval (default: 10)

### Configuration Object
Each agent receives:
- Entity details (name, alternate names, handles)
- Platform configuration (enabled platforms)
- Ontology (keywords, related terms)

---

## Summary

1. **Scheduler** runs every 10 minutes, fetches for all active configs
2. **Orchestrator** creates and runs agents in parallel
3. **Agents** fetch, filter, and store posts independently
4. **Results** are aggregated and logged to database
5. **Errors** are isolated per agent, don't stop others
6. **Manual triggers** can execute immediately on activation

The system is designed for **resilience**, **speed**, and **scalability** through parallel execution and error isolation.







