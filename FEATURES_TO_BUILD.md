# Features to Build - Backend & Frontend Integration

## Current Status

### ✅ Already Built
- **Posts API**: GET `/api/posts` - Fetch posts with filtering
- **Configuration API**: CRUD operations for configurations
- **Platform Agents**: Twitter, Reddit, Facebook, News
- **Risk Scoring Agent**: Analyzes posts, generates scores and topics
- **Fact-Checking Agent**: Fact-checks high-risk posts
- **Feeds Page**: Displays posts with filtering and right panel

---

## 🔨 Features to Build

### 1. **Dashboard Page** (NEW - Needs to be created)

#### Backend APIs Needed:

**GET `/api/dashboard/stats`**
```typescript
Response: {
  totalPosts: number;
  postsByPlatform: {
    twitter: number;
    reddit: number;
    facebook: number;
    news: number;
  };
  postsBySentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  riskDistribution: {
    critical: number;    // score >= 8
    escalate: number;    // score 6-7.9
    watch: number;      // score 4-5.9
    informational: number; // score < 4
  };
  highRiskPosts: number; // score > 8
  factCheckedPosts: number;
  totalEngagement: {
    likes: number;
    comments: number;
    shares: number;
  };
  topAuthors: Array<{
    author_name: string;
    author_username: string;
    platform: string;
    post_count: number;
    total_engagement: number;
  }>;
  recentActivity: Array<{
    type: 'post_fetched' | 'post_scored' | 'post_fact_checked';
    timestamp: string;
    details: string;
  }>;
}
```

**GET `/api/dashboard/trends`**
```typescript
Response: {
  postsOverTime: Array<{
    date: string;
    count: number;
    riskScore: number;
  }>;
  sentimentTrends: Array<{
    date: string;
    positive: number;
    neutral: number;
    negative: number;
  }>;
  platformTrends: Array<{
    date: string;
    twitter: number;
    reddit: number;
    facebook: number;
    news: number;
  }>;
}
```

**GET `/api/dashboard/alerts`**
```typescript
Response: {
  criticalAlerts: Array<{
    id: string;
    post_id: string;
    platform: string;
    risk_score: number;
    content: string;
    author: string;
    created_at: string;
    fact_check_status: 'pending' | 'completed' | 'failed';
  }>;
  unverifiedClaims: number;
  trendingNegative: Array<{
    keyword: string;
    count: number;
    risk_score: number;
  }>;
}
```

---

### 2. **Analytics API** (For Dashboard)

**GET `/api/analytics/summary`**
- Overall statistics
- Time range filtering (24h, 7d, 30d, custom)

**GET `/api/analytics/topics`**
- Most mentioned topics
- Topic sentiment analysis
- Topic risk scores

**GET `/api/analytics/authors`**
- Top authors by engagement
- Author credibility scores
- Author risk analysis

---

### 3. **Enhanced Posts API** (For Feeds Page)

**Current**: Basic filtering works
**Needed Enhancements**:

**GET `/api/posts/stats`**
```typescript
Response: {
  total: number;
  byPlatform: Record<string, number>;
  bySentiment: Record<string, number>;
  byRiskScore: Record<string, number>;
  averageRiskScore: number;
}
```

**GET `/api/posts/search`** (Enhanced search)
- Full-text search across content
- Search by author
- Search by topics
- Search by keywords

**GET `/api/posts/export`**
- Export posts to CSV/JSON
- Filtered export

---

### 4. **Narratives Page** (Backend Support)

**GET `/api/narratives`**
```typescript
Response: Array<{
  id: string;
  name: string;
  description: string;
  posts: number;
  risk_score: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  keywords: string[];
  created_at: string;
  updated_at: string;
}>
```

**POST `/api/narratives`** - Create narrative
**PUT `/api/narratives/:id`** - Update narrative
**DELETE `/api/narratives/:id`** - Delete narrative

**GET `/api/narratives/:id/posts`** - Get posts for a narrative

---

### 5. **Topics Page** (Backend Support)

**GET `/api/topics`**
```typescript
Response: Array<{
  topic: string;
  count: number;
  posts: Array<{
    id: string;
    content: string;
    risk_score: number;
    platform: string;
  }>;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  averageRiskScore: number;
  trending: boolean;
}>
```

**GET `/api/topics/:topic/posts`** - Get all posts for a topic

---

### 6. **Compose Page** (Response Generation)

**POST `/api/compose/response`**
```typescript
Request: {
  post_id: string;
  tone: 'professional' | 'defensive' | 'apologetic' | 'neutral';
  key_points: string[];
  custom_instructions?: string;
}

Response: {
  response_text: string;
  key_points: string[];
  suggested_actions: string[];
}
```

**POST `/api/compose/bulk-response`**
- Generate responses for multiple posts

---

### 7. **Research Page** (Deep Analysis)

**GET `/api/research/entity-analysis`**
```typescript
Response: {
  entityName: string;
  overallSentiment: 'positive' | 'neutral' | 'negative';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  keyFindings: Array<{
    finding: string;
    evidence: string[];
    risk_score: number;
  }>;
  topConcerns: Array<{
    concern: string;
    frequency: number;
    severity: number;
  }>;
  recommendations: string[];
}
```

**GET `/api/research/competitor-analysis`**
- Compare with other entities
- Benchmark analysis

---

### 8. **Real-time Updates** (WebSocket/SSE)

**WebSocket `/ws/updates`**
- Real-time post updates
- New posts notifications
- Risk score updates
- Fact-check completion notifications

---

### 9. **Export & Reporting**

**GET `/api/reports/daily`**
- Daily summary report
- PDF/CSV export

**GET `/api/reports/weekly`**
- Weekly analysis report

**GET `/api/reports/custom`**
- Custom date range report

---

### 10. **Post Management**

**POST `/api/posts/:id/mark-reviewed`**
- Mark post as reviewed
- Add review notes

**POST `/api/posts/:id/flag`**
- Flag post for attention
- Add flag reason

**POST `/api/posts/:id/archive`**
- Archive post
- Remove from active feeds

**GET `/api/posts/flagged`**
- Get all flagged posts

**GET `/api/posts/archived`**
- Get archived posts

---

## Frontend Pages Status

### ✅ Built
- **FeedsPage**: Working with filtering, right panel
- **ConfigurationPage**: Working

### 🔨 Needs Backend Integration
- **NarrativesPage**: Exists but needs backend APIs
- **TopicsPage**: Exists but needs backend APIs
- **ComposePage**: Exists but needs backend APIs
- **ResearchPage**: Exists but needs backend APIs

### ❌ Not Created Yet
- **DashboardPage**: Needs to be created + backend APIs

---

## Priority Order

### Phase 1: Essential Features
1. **Dashboard Stats API** (`/api/dashboard/stats`)
2. **Dashboard Page** (Frontend component)
3. **Enhanced Posts Filtering** (risk score, date range)

### Phase 2: Core Features
4. **Narratives API** (`/api/narratives`)
5. **Topics API** (`/api/topics`)
6. **Post Management** (mark reviewed, flag, archive)

### Phase 3: Advanced Features
7. **Compose Response API** (`/api/compose/response`)
8. **Research Analysis API** (`/api/research/entity-analysis`)
9. **Export/Reporting APIs**

### Phase 4: Nice-to-Have
10. **Real-time Updates** (WebSocket)
11. **Advanced Analytics**
12. **Competitor Analysis**

---

## Database Considerations

### May Need New Tables:
- `narratives` - Store narrative definitions
- `post_flags` - Store flagged posts
- `post_reviews` - Store review notes
- `exports` - Track export jobs
- `alerts` - Store alert configurations

### Indexes to Add:
- Index on `posts.risk_score` (already exists)
- Index on `posts.sentiment`
- Index on `posts.topics` (GIN index for JSONB)
- Index on `posts.created_at` (already exists)

---

## Next Steps

1. **Create Dashboard Stats API** - Most important
2. **Build Dashboard Page** - Visual representation
3. **Wire up existing pages** - Narratives, Topics, Compose, Research
4. **Add post management** - Review, flag, archive features







