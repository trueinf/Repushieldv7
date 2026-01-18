# RepuShield - Complete Setup Guide

## ✅ What Has Been Built

### Backend System
1. **API Clients** - For Twitter, Reddit, Facebook, and News APIs
2. **4 Parallel Agents** - Each platform has its own agent that runs in parallel
3. **Filtering System** - Filters posts by entity name, keywords, ontology, and social handles
4. **Supabase Integration** - Stores posts with all metadata
5. **Scheduler** - Fetches posts every 10 minutes automatically
6. **Immediate Fetch** - Triggers fetch when configuration is activated

### Frontend Integration
1. **Feeds Page** - Displays posts from Supabase
2. **Media Display** - Shows images and videos in feed cards
3. **Real-time Updates** - Auto-refresh every minute when enabled
4. **Error Handling** - Clear error messages and retry functionality

## 🗄️ Database Setup

### Step 1: Run SQL Schema in Supabase

1. Go to your Supabase project: https://jlmcpkihlirppsaqehaq.supabase.co
2. Navigate to SQL Editor
3. Run the SQL from `server/src/database/schema.sql`

This creates:
- `posts` table - Stores all fetched posts
- `authors` table - Stores author analytics
- `fetch_jobs` table - Tracks fetch job history

## 🚀 Running the System

### Step 1: Install Backend Dependencies
```bash
cd server
npm install
```

### Step 2: Environment Variables
The `.env` file is already created with your API keys. Make sure it exists in `server/.env`

### Step 3: Start Backend
```bash
cd server
npm run dev
```

The backend will:
- Start on port 3001
- Begin fetching posts every 10 minutes for active configurations
- Log all fetch operations

### Step 4: Start Frontend
```bash
npm run dev
```

## 📋 How It Works

### 1. Configuration Activation Flow
```
User fills Configuration Page
    ↓
Clicks "Activate Monitoring"
    ↓
Backend saves configuration
    ↓
Immediately triggers 4 parallel agents:
    - Twitter Agent (RapidAPI)
    - Reddit Agent (RapidAPI)
    - Facebook Agent (RapidAPI)
    - News Agent (SerpAPI)
    ↓
Each agent:
    1. Builds search query from entity name + keywords
    2. Fetches latest posts from API
    3. Filters posts by ontology keywords
    4. Stores matching posts in Supabase
    ↓
Posts appear in Feeds Page
```

### 2. Automatic Fetching
- Every 10 minutes, scheduler runs
- Checks all active configurations
- Runs agents in parallel for each platform
- Stores new posts in Supabase
- Feeds page auto-refreshes to show new posts

### 3. Filtering Logic
Posts are stored ONLY if they match:
- Entity name OR
- Alternate names OR
- Core keywords OR
- Associated keywords OR
- Narrative keywords OR
- Social handles (Twitter/Facebook usernames)

Posts are EXCLUDED if they contain exclusion keywords.

## 🔍 API Endpoints

### Posts
- `GET /api/posts` - Get all posts (with filters)
- `GET /api/posts/:id` - Get specific post

### Configurations
- `GET /api/configurations` - List all
- `GET /api/configurations/active` - Get active config
- `POST /api/configurations` - Create new
- `PUT /api/configurations/:id` - Update
- `POST /api/configurations/:id/activate` - Activate (triggers immediate fetch)

## 📊 Data Stored in Supabase

For each post:
- **Content**: Post text, title
- **Author**: Name, username, verified status, followers, following
- **Engagement**: Likes, comments, shares, retweets, upvotes
- **Media**: URLs, types, thumbnails
- **Metadata**: Platform, timestamps, raw API response
- **Analysis**: Sentiment, risk score, narrative, topics (when available)

## 🎨 Feeds Page Features

- **Real-time Display**: Shows posts from Supabase
- **Media Support**: Images and videos displayed in cards
- **Filtering**: By platform, sentiment, search query
- **Sorting**: Latest, risk, engagement
- **Auto-refresh**: Every 60 seconds when enabled
- **Manual Refresh**: Button to manually reload

## ⚙️ Configuration

### Fetch Interval
Change in `server/.env`:
```
FETCH_INTERVAL_MINUTES=10
```

### Rate Limiting
The system handles:
- API rate limits (429 errors)
- Network errors
- Invalid responses
- Missing data

All errors are logged and don't crash the system.

## 🐛 Troubleshooting

### No posts appearing?
1. Check if configuration is activated
2. Check backend logs for API errors
3. Verify API keys are correct
4. Check Supabase connection
5. Verify database schema is created

### API errors?
- Check API key validity
- Check rate limits (may need to wait)
- Verify API endpoints are correct
- Check network connectivity

### Database errors?
- Verify Supabase credentials
- Check if tables exist
- Verify RLS policies (if enabled)

## 📝 Next Steps

1. **Test the APIs** - The actual API responses may differ, adjust parsers if needed
2. **Add Sentiment Analysis** - Integrate AI for sentiment scoring
3. **Add Risk Scoring** - Calculate risk scores based on content
4. **Add Notifications** - Alert on high-risk posts
5. **Add Analytics** - Dashboard with trends and insights

## 🔐 Security Notes

- API keys are in `.env` (not committed to git)
- Supabase service role key has full access
- Consider adding RLS policies for production
- Rate limiting should be implemented for production

---

**System is ready to use!** Activate a configuration and posts will start appearing in the Feeds page.








