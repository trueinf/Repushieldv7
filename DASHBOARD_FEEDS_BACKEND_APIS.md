# Backend APIs Needed for Dashboard & Feeds Pages

## 📊 DASHBOARD PAGE Features & Required APIs

### Current Frontend Features (Using Mock Data):

#### 1. **Summary Stat Cards** (4 cards)
- **Reputation Score**: "84/100" with trend "+4.2%"
- **Total Mentions**: "12,402" with trend "+18.5%"
- **Critical Alerts**: "03" with trend "-12.0%"
- **Response Time**: "42m" with trend "-5.2%"

**Backend API Needed:**
```
GET /api/dashboard/stats
Response: {
  reputationScore: {
    value: 84,
    max: 100,
    trend: 4.2  // percentage change
  },
  totalMentions: {
    value: 12402,
    trend: 18.5
  },
  criticalAlerts: {
    value: 3,
    trend: -12.0
  },
  responseTime: {
    value: 42,  // minutes
    trend: -5.2
  }
}
```

---

#### 2. **Sentiment Overview Chart**
- Area chart showing positive/negative sentiment over time
- Time range selector: "Last 7 Days", "Last 30 Days", "Last Quarter"
- Data points for each day with positive and negative counts

**Backend API Needed:**
```
GET /api/dashboard/sentiment-trends?range=7d|30d|quarter
Response: {
  data: [
    {
      date: "2024-01-01",
      positive: 65,
      neutral: 20,
      negative: 15
    },
    {
      date: "2024-01-02",
      positive: 72,
      neutral: 18,
      negative: 10
    },
    // ... more days
  ]
}
```

---

#### 3. **Priority Narratives** (High Risk)
- List of narratives with:
  - Title
  - Volume (mentions count)
  - Sentiment (positive/neutral/negative)
  - Change percentage
- "View Full Report" button

**Backend API Needed:**
```
GET /api/dashboard/priority-narratives?limit=4
Response: {
  narratives: [
    {
      id: "narrative-id",
      title: "Product Reliability Issues",
      volume: 1250,
      sentiment: "negative",
      change: 12.0,  // percentage
      riskScore: 8.5
    },
    // ... more narratives
  ]
}
```

**Note:** Narratives can be derived from posts with high risk scores or common topics.

---

#### 4. **Source Channels Distribution**
- Percentage breakdown by channel:
  - Social Media: 65%
  - News Outlets: 20%
  - Forums & Blogs: 10%
  - Internal Comms: 5%

**Backend API Needed:**
```
GET /api/dashboard/source-channels
Response: {
  channels: [
    {
      label: "Social Media",  // Twitter + Facebook + Reddit
      value: 65,
      count: 8061
    },
    {
      label: "News Outlets",
      value: 20,
      count: 2480
    },
    {
      label: "Forums & Blogs",  // Reddit
      value: 10,
      count: 1240
    },
    {
      label: "Internal Comms",  // Can be 0 or custom
      value: 5,
      count: 621
    }
  ]
}
```

---

#### 5. **Real-time Feed**
- List of recent posts (3 shown, but should be more)
- Each post shows:
  - Source name
  - Time ago
  - Content snippet
  - Viral Risk level
  - Sentiment

**Backend API Needed:**
```
GET /api/dashboard/recent-posts?limit=10
Response: {
  posts: [
    {
      id: "post-id",
      source: "Global Finance Today",
      platform: "news",
      content: "Analysis shows a 15% increase...",
      timestamp: "2m ago",
      viralRisk: "low" | "medium" | "high",
      sentiment: "positive",
      riskScore: 3.2
    },
    // ... more posts
  ]
}
```

**Note:** This can use the existing `/api/posts` endpoint with limit and sort.

---

## 📰 FEEDS PAGE Features & Required APIs

### Current Frontend Features:

#### 1. **Search Bar**
- Search across: keywords, entities, handles, narratives
- Currently filters client-side

**Backend API Enhancement Needed:**
```
GET /api/posts?search=keyword&limit=100
```
**Current:** Basic filtering works
**Enhancement:** Add full-text search support in database query

---

#### 2. **Date Range Filter**
- Options: "Last 24h", "7d", "custom"
- Currently not functional (UI only)

**Backend API Enhancement Needed:**
```
GET /api/posts?date_from=2024-01-01&date_to=2024-01-02&limit=100
```
**Enhancement:** Add date range filtering to existing endpoint

---

#### 3. **Platform Filters**
- Filter by: Twitter, News, Reddit, Facebook
- Currently works (uses existing API)

**Backend API:**
```
GET /api/posts?platform=twitter&limit=100
```
**Status:** ✅ Already working

---

#### 4. **Sentiment Filters**
- Filter by: Negative, High Risk (>8)
- Currently works (client-side filtering)

**Backend API Enhancement Needed:**
```
GET /api/posts?sentiment=negative&limit=100
GET /api/posts?risk_score_min=8&limit=100
```
**Enhancement:** Add sentiment and risk_score filtering to existing endpoint

---

#### 5. **Sort Options**
- Latest (by created_at)
- Highest Risk (by risk_score)
- Most Engagement (by likes + comments + shares)
- Fastest Amplifying (by velocity - not yet implemented)

**Backend API:**
```
GET /api/posts?sort=created_at&order=desc
GET /api/posts?sort=risk_score&order=desc
GET /api/posts?sort=engagement&order=desc
```
**Status:** ✅ Latest and Risk work
**Needed:** Add `engagement` sort option (calculate: likes + comments + shares)

---

#### 6. **Post Display**
- Post cards with all details
- Right panel with evidence/admin response
- **Status:** ✅ Already working

---

## 🎯 Summary: Backend APIs to Build

### Priority 1: Dashboard APIs (All New)

1. **GET `/api/dashboard/stats`**
   - Reputation score calculation
   - Total mentions count
   - Critical alerts count (risk_score >= 8)
   - Response time calculation

2. **GET `/api/dashboard/sentiment-trends?range=7d|30d|quarter`**
   - Group posts by date
   - Count by sentiment
   - Return time series data

3. **GET `/api/dashboard/priority-narratives?limit=4`**
   - Get high-risk posts (risk_score >= 8)
   - Group by narrative/topic
   - Calculate volume and trends

4. **GET `/api/dashboard/source-channels`**
   - Count posts by platform
   - Calculate percentages
   - Map platforms to channel types

5. **GET `/api/dashboard/recent-posts?limit=10`**
   - Get latest posts
   - Calculate "time ago"
   - Include viral risk and sentiment

---

### Priority 2: Feeds Page Enhancements

1. **Enhanced `/api/posts` endpoint:**
   - Add `search` query parameter (full-text search)
   - Add `date_from` and `date_to` parameters
   - Add `sentiment` filter parameter
   - Add `risk_score_min` and `risk_score_max` parameters
   - Add `sort=engagement` option

---

## 📋 Implementation Checklist

### Dashboard APIs:
- [ ] Create `server/src/routes/dashboardRoutes.ts`
- [ ] Implement `/api/dashboard/stats` endpoint
- [ ] Implement `/api/dashboard/sentiment-trends` endpoint
- [ ] Implement `/api/dashboard/priority-narratives` endpoint
- [ ] Implement `/api/dashboard/source-channels` endpoint
- [ ] Implement `/api/dashboard/recent-posts` endpoint
- [ ] Register routes in `server/src/index.ts`
- [ ] Create frontend API service `src/services/dashboardApi.ts`
- [ ] Wire up Dashboard page to use real APIs

### Feeds Page Enhancements:
- [ ] Enhance `/api/posts` with search parameter
- [ ] Add date range filtering
- [ ] Add sentiment filtering
- [ ] Add risk score range filtering
- [ ] Add engagement sorting
- [ ] Update frontend to use new filters

---

## 🔧 Quick Implementation Guide

### Dashboard Stats Calculation:

```typescript
// Reputation Score: Calculate from average sentiment and risk scores
// Formula: (positive_posts * 100 + neutral_posts * 50 - negative_posts * risk_score) / total_posts

// Total Mentions: COUNT(*) from posts

// Critical Alerts: COUNT(*) WHERE risk_score >= 8

// Response Time: Average time between post creation and fact-check completion
```

### Sentiment Trends:

```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) FILTER (WHERE sentiment = 'positive') as positive,
  COUNT(*) FILTER (WHERE sentiment = 'neutral') as neutral,
  COUNT(*) FILTER (WHERE sentiment = 'negative') as negative
FROM posts
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date;
```

### Priority Narratives:

```sql
SELECT 
  narrative,
  COUNT(*) as volume,
  AVG(risk_score) as avg_risk,
  COUNT(*) FILTER (WHERE sentiment = 'negative') as negative_count
FROM posts
WHERE risk_score >= 8
  AND narrative IS NOT NULL
GROUP BY narrative
ORDER BY volume DESC
LIMIT 4;
```

---

## That's It!

These are the **only** backend APIs needed for Dashboard and Feeds pages. Everything else is already working!







