# Agent Flow Diagram

This document provides a detailed step-by-step flow of how agents execute from start to finish.

## Complete Agent Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        1. TRIGGER PHASE                                 │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
            ┌───────▼───────┐   ┌───────▼───────┐
            │  Scheduled    │   │  Manual       │
            │  (Every 10min)│   │  (On Activate)│
            └───────┬───────┘   └───────┬───────┘
                    │                   │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │ PostFetchScheduler │
                    │  - Get active      │
                    │    configs         │
                    └─────────┬─────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────────────┐
│                   2. ORCHESTRATION PHASE                                 │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │ AgentOrchestrator  │
                    │  - Create agents   │
                    │  - Execute parallel│
                    └─────────┬─────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼───────┐   ┌─────────▼─────────┐   ┌───────▼───────┐
│ TwitterAgent  │   │  RedditAgent      │   │ FacebookAgent │
│  (Parallel)   │   │  (Parallel)      │   │  (Parallel)   │
└───────┬───────┘   └─────────┬─────────┘   └───────┬───────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   NewsAgent       │
                    │   (Parallel)      │
                    └─────────┬─────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────────────┐
│                   3. INDIVIDUAL AGENT EXECUTION                         │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  Agent.execute()  │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │ Initialize Result │
                    │ - platform        │
                    │ - postsFetched: 0 │
                    │ - postsStored: 0  │
                    │ - errors: []      │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │ Check if platform │
                    │ is enabled?      │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │   YES / NO        │
                    └─────────┬─────────┘
                    ┌─────────┴─────────┐
                    │                   │
            ┌───────▼───────┐   ┌───────▼───────┐
            │     NO        │   │     YES       │
            │  Return empty │   │  Continue     │
            │    result     │   │               │
            └───────────────┘   └───────┬───────┘
                                        │
┌───────────────────────────────────────▼─────────────────────────────────┐
│                   4. QUERY BUILDING PHASE                                │
└──────────────────────────────────────────────────────────────────────────┘
                                        │
                            ┌───────────▼───────────┐
                            │  buildQuery()         │
                            │  (from BaseAgent)     │
                            └───────────┬───────────┘
                                        │
                            ┌───────────▼───────────┐
                            │ Extract from config:  │
                            │ - Entity name         │
                            │ - Alternate names     │
                            │ - Core keywords       │
                            │ - Social handles      │
                            └───────────┬───────────┘
                                        │
                            ┌───────────▼───────────┐
                            │ Build search query:   │
                            │ "EntityName OR        │
                            │  keyword1 OR          │
                            │  keyword2 OR          │
                            │  @handle"             │
                            └───────────┬───────────┘
                                        │
┌───────────────────────────────────────▼─────────────────────────────────┐
│                   5. API FETCHING PHASE                                 │
└──────────────────────────────────────────────────────────────────────────┘
                                        │
                            ┌───────────▼───────────┐
                            │ Call Platform API     │
                            │ - Twitter: RapidAPI   │
                            │ - Reddit: RapidAPI    │
                            │ - Facebook: RapidAPI  │
                            │ - News: SerpAPI       │
                            └───────────┬───────────┘
                                        │
                            ┌───────────▼───────────┐
                            │ Parse API Response     │
                            │ - Extract posts       │
                            │ - Parse JSON          │
                            │ - Handle errors       │
                            └───────────┬───────────┘
                                        │
                            ┌───────────▼───────────┐
                            │ Update result:        │
                            │ postsFetched = count  │
                            └───────────┬───────────┘
                                        │
┌───────────────────────────────────────▼─────────────────────────────────┐
│                   6. FILTERING & STORAGE PHASE                           │
└──────────────────────────────────────────────────────────────────────────┘
                                        │
                            ┌───────────▼───────────┐
                            │ For each post:        │
                            │ Loop through posts   │
                            └───────────┬───────────┘
                                        │
                            ┌───────────▼───────────┐
                            │ Extract post data:    │
                            │ - text/content        │
                            │ - author username     │
                            │ - author name         │
                            └───────────┬───────────┘
                                        │
                            ┌───────────▼───────────┐
                            │ matchesFilter()        │
                            │ (from BaseAgent)       │
                            └───────────┬───────────┘
                                        │
                    ┌───────────────────┴───────────────────┐
                    │                                       │
        ┌───────────▼───────────┐           ┌──────────────▼───────────┐
        │  Check Filter Criteria│           │  Additional Checks       │
        │  - Entity name match   │           │  (Reddit/News only)      │
        │  - Keyword match       │           │  - Contains entity?      │
        │  - Handle match        │           │  - Contains keyword?     │
        │  - Exclusion check     │           │                          │
        └───────────┬───────────┘           └──────────────┬───────────┘
                    │                                       │
                    └───────────────────┬───────────────────┘
                                        │
                            ┌───────────▼───────────┐
                            │   Matches Filter?     │
                            └───────────┬───────────┘
                    ┌───────────────────┴───────────────────┐
                    │                                       │
        ┌───────────▼───────────┐           ┌──────────────▼───────────┐
        │         YES            │           │           NO              │
        │                        │           │                           │
        │  ┌──────────────────┐ │           │  ┌──────────────────┐   │
        │  │ PostStorage.     │ │           │  │ Skip post         │   │
        │  │ storeXXXPost()   │ │           │  │ Log: "filtered out"│   │
        │  └────────┬─────────┘ │           │  └──────────────────┘   │
        │           │            │           │                         │
        │  ┌─────────▼─────────┐│           │                         │
        │  │ Transform post    ││           │                         │
        │  │ to StoredPost     ││           │                         │
        │  │ format            ││           │                         │
        │  └─────────┬─────────┘│           │                         │
        │            │           │           │                         │
        │  ┌─────────▼─────────┐│           │                         │
        │  │ Validate data     ││           │                         │
        │  │ - post_id         ││           │                         │
        │  │ - created_at      ││           │                         │
        │  │ - config_id       ││           │                         │
        │  └─────────┬─────────┘│           │                         │
        │            │           │           │                         │
        │  ┌─────────▼─────────┐│           │                         │
        │  │ Upsert to DB      ││           │                         │
        │  │ (Supabase)        ││           │                         │
        │  └─────────┬─────────┘│           │                         │
        │            │           │           │                         │
        │  ┌─────────▼─────────┐│           │                         │
        │  │ Update result:    ││           │                         │
        │  │ postsStored++     ││           │                         │
        │  └─────────┬─────────┘│           │                         │
        │            │           │           │                         │
        └────────────┼───────────┴───────────┴─────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────────────┐
│                   7. RESULT AGGREGATION PHASE                           │
└─────────────────────────────────────────────────────────────────────────┘
                     │
         ┌───────────▼───────────┐
         │ All posts processed?  │
         └───────────┬───────────┘
                     │
         ┌───────────▼───────────┐
         │ Log Summary:          │
         │ "Fetched: X,           │
         │  Stored: Y,            │
         │  Errors: Z"           │
         └───────────┬───────────┘
                     │
         ┌───────────▼───────────┐
         │ Return AgentResult    │
         │ - platform            │
         │ - postsFetched        │
         │ - postsStored         │
         │ - errors              │
         └───────────┬───────────┘
                     │
┌────────────────────▼────────────────────────────────────────────────────┐
│                   8. ORCHESTRATION COMPLETION                            │
└──────────────────────────────────────────────────────────────────────────┘
                     │
         ┌───────────▼───────────┐
         │ Wait for all agents   │
         │ (Promise.allSettled)  │
         └───────────┬───────────┘
                     │
         ┌───────────▼───────────┐
         │ Aggregate Results:    │
         │ - Sum postsFetched    │
         │ - Sum postsStored     │
         │ - Collect all errors   │
         └───────────┬───────────┘
                     │
         ┌───────────▼───────────┐
         │ Log to fetch_jobs     │
         │ table (Supabase)      │
         └───────────┬───────────┘
                     │
         ┌───────────▼───────────┐
         │ Return                │
         │ OrchestrationResult   │
         └───────────┬───────────┘
                     │
         ┌───────────▼───────────┐
         │ Complete              │
         └───────────────────────┘
```

## Detailed Step-by-Step Flow

### Phase 1: Trigger Phase

**Scheduled Execution:**
```
1. Cron job triggers every 10 minutes
2. PostFetchScheduler.fetchAllActiveConfigurations()
3. Get all configurations where isActive = true
4. For each active configuration → proceed to Phase 2
```

**Manual Execution:**
```
1. User clicks "Activate Monitor" in frontend
2. POST /api/configurations/:id/activate
3. ConfigurationService.activate(id)
4. PostFetchScheduler.triggerManualFetch(id)
5. Proceed to Phase 2
```

---

### Phase 2: Orchestration Phase

```
1. AgentOrchestrator.executeParallel(config)
2. Create agent instances for enabled platforms:
   - If 'twitter' enabled → new TwitterAgent(config, rapidApiKey)
   - If 'reddit' enabled → new RedditAgent(config, rapidApiKey)
   - If 'facebook' enabled → new FacebookAgent(config, rapidApiKey)
   - If 'news' enabled → new NewsAgent(config, serpApiKey)
3. Start all agents in parallel using Promise.allSettled()
4. Each agent executes independently → proceed to Phase 3
```

---

### Phase 3: Individual Agent Execution

**For each agent (Twitter, Reddit, Facebook, News):**

```
Step 1: Initialize
├─ Create AgentResult object
│  ├─ platform: 'twitter' | 'reddit' | 'facebook' | 'news'
│  ├─ postsFetched: 0
│  ├─ postsStored: 0
│  └─ errors: []

Step 2: Platform Check
├─ if (!config.platformConfig.platforms.includes(platform))
│  └─ return empty result (skip)
└─ else → continue

Step 3: Build Query
├─ Call this.buildQuery() (inherited from BaseAgent)
├─ Extract from configuration:
│  ├─ Entity name: "Shashi Tharoor"
│  ├─ Alternate names: ["ShashiTharoor", "Tharoor"]
│  ├─ Core keywords: ["politics", "MP", "Kerala"]
│  └─ Social handles: ["@ShashiTharoor", "u/username"]
└─ Build query: "Shashi Tharoor OR ShashiTharoor OR politics OR MP OR @ShashiTharoor"

Step 4: API Call
├─ Call platform-specific API:
│  ├─ Twitter: api.searchRecentTweets(query, 20)
│  ├─ Reddit: api.searchPosts(query, 20, 'new')
│  ├─ Facebook: api.searchPosts(query, 20)
│  └─ News: api.searchNews(query, 20)
├─ Parse API response
├─ Extract posts array
└─ Update: result.postsFetched = posts.length

Step 5: Filter & Store Loop
└─ For each post:
   ├─ Extract post data:
   │  ├─ text/content
   │  ├─ author username
   │  └─ author name
   │
   ├─ Check filter (this.matchesFilter()):
   │  ├─ Check exclusion keywords → if found, skip
   │  ├─ Check entity name match (flexible)
   │  ├─ Check alternate names match
   │  ├─ Check keyword match
   │  ├─ Check handle match
   │  └─ For Reddit/News: also check if contains entity OR keyword
   │
   ├─ If matches filter:
   │  ├─ Transform to StoredPost format
   │  ├─ Validate required fields
   │  ├─ Call PostStorage.storeXXXPost(post, configId)
   │  │  ├─ Transform platform-specific post to StoredPost
   │  │  ├─ Validate post_id, created_at, config_id
   │  │  ├─ Upsert to Supabase 'posts' table
   │  │  └─ Handle errors gracefully
   │  ├─ Update: result.postsStored++
   │  └─ Log: "Storing post {id}"
   │
   └─ Else:
      └─ Log: "Post {id} filtered out"

Step 6: Error Handling
├─ Catch individual post errors
├─ Add to result.errors array
└─ Continue processing other posts

Step 7: Summary
├─ Log: "Summary: Fetched X, Stored Y, Errors: Z"
└─ Return AgentResult
```

---

### Phase 4: Filtering Logic Details

**matchesFilterCriteria() function:**

```
Input: text, authorUsername, authorName, criteria

1. Check Exclusion Keywords
   ├─ If text contains any exclusion keyword
   └─ Return false (exclude post)

2. Normalize Text
   ├─ Convert to lowercase
   ├─ Remove spaces for flexible matching
   └─ Normalize entity names

3. Entity Name Matching
   ├─ Check if text contains entity name
   ├─ Check if author name contains entity name
   ├─ Check flexible matching (no spaces)
   └─ Check alternate names

4. Keyword Matching
   ├─ Check core keywords
   ├─ Check associated keywords
   └─ Check narrative keywords

5. Handle Matching
   ├─ Check Twitter handles (@username)
   ├─ Check Reddit handles (u/username)
   ├─ Check Facebook handles
   └─ Check website domains

6. Return Result
   └─ true if any match, false otherwise
```

---

### Phase 5: Storage Details

**PostStorage.storeXXXPost() flow:**

```
1. Transform Platform Post → StoredPost
   ├─ Extract post_id
   ├─ Extract content/text
   ├─ Extract author info (id, username, name)
   ├─ Extract engagement (likes, comments, shares)
   ├─ Extract media URLs
   └─ Extract timestamps

2. Validate Required Fields
   ├─ post_id must not be empty
   ├─ created_at must be valid date
   └─ configuration_id must be present

3. Upsert to Database
   ├─ Use Supabase .upsert()
   ├─ Handle duplicate post_id (update if exists)
   ├─ Store all post data
   └─ Store raw_data (original API response)

4. Error Handling
   ├─ Log errors with context
   └─ Don't crash on individual post failures
```

---

### Phase 6: Result Aggregation

**AgentOrchestrator aggregates results:**

```
1. Wait for all agents (Promise.allSettled)
   ├─ All agents complete (success or failure)
   └─ No agent blocks others

2. Process Results
   ├─ For each fulfilled promise:
   │  ├─ Add agentResult to results
   │  ├─ Sum postsFetched
   │  ├─ Sum postsStored
   │  └─ Collect errors
   └─ For each rejected promise:
      └─ Add error message

3. Log to Database
   ├─ For each agent result:
   │  ├─ Insert into fetch_jobs table
   │  ├─ platform, status, counts
   │  └─ error_message (if any)
   └─ Track job execution

4. Return OrchestrationResult
   ├─ configurationId
   ├─ totalPostsFetched
   ├─ totalPostsStored
   ├─ agentResults[]
   ├─ errors[]
   └─ duration (milliseconds)
```

---

## Example Execution Timeline

**Configuration:** Entity: "Shashi Tharoor", Platforms: [Twitter, Reddit, News]

```
Time:  0s    2s    4s    6s    8s    10s
       │     │     │     │     │     │
Twitter│═════╗     │     │     │     │
       │     ║     │     │     │     │
       │     ║ Query: "Shashi Tharoor OR politics"
       │     ║ API Call: searchRecentTweets()
       │     ║ Fetched: 20 posts
       │     ║ Filtering: 15 match, 5 filtered
       │     ║ Storing: 15 posts
       │     ║ Complete: 2s
       │     ║
Reddit │     ║═════╗     │     │     │
       │     ║     ║     │     │     │
       │     ║     ║ Query: "Shashi Tharoor OR politics"
       │     ║     ║ API Call: searchPosts()
       │     ║     ║ Fetched: 25 posts
       │     ║     ║ Filtering: 20 match, 5 filtered
       │     ║     ║ Storing: 20 posts
       │     ║     ║ Complete: 4s
       │     ║     ║
News   │     ║     ║═════╗     │     │
       │     ║     ║     ║     │     │
       │     ║     ║     ║ Query: "Shashi Tharoor OR politics"
       │     ║     ║     ║ API Call: searchNews()
       │     ║     ║     ║ Fetched: 100 articles
       │     ║     ║     ║ Filtering: 18 match, 82 filtered
       │     ║     ║     ║ Storing: 18 articles
       │     ║     ║     ║ Complete: 6s
       │     ║     ║     ║
       └─────┴─────┴─────┴─────┴─────┴─────┘
       Total: 6s (parallel) vs 10s (sequential)

Result:
- Total Fetched: 145 (20 + 25 + 100)
- Total Stored: 53 (15 + 20 + 18)
- Duration: 6 seconds
```

---

## Key Points

1. **Parallel Execution**: All agents run simultaneously, not sequentially
2. **Error Isolation**: One agent failure doesn't affect others
3. **Filtering**: Each post is checked against filter criteria before storage
4. **Validation**: All posts are validated before database insertion
5. **Logging**: Every step is logged for debugging
6. **Resilience**: Errors are caught and collected, not thrown
7. **Efficiency**: Only enabled platforms create agents
8. **Flexibility**: Filtering is lenient for Reddit/News (stores if contains entity OR keyword)

This flow ensures **fast**, **reliable**, and **scalable** post fetching across multiple platforms.







