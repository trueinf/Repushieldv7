# Setup Instructions - RepuShield v5

## Step 1: Install Dependencies

Navigate to the server directory and install the new OpenAI package:

```bash
cd server
npm install
```

This will install the `openai` package that was added for risk scoring.

---

## Step 2: Update Database Schema

You need to add the `fact_check_data` column to your existing `posts` table.

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run this SQL command:

```sql
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS fact_check_data JSONB;
```

### Option B: Using psql or Database Client

Run the same SQL command in your database client.

---

## Step 3: Add Environment Variables

Add the OpenAI API key to your `server/.env` file:

```env
# Existing keys
SERPAPI_KEY=your_serpapi_key_here
RAPIDAPI_KEY=your_rapidapi_key_here

# Add this new key
OPENAI_API_KEY=your_openai_api_key_here

# Other existing variables
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PORT=3001
NODE_ENV=development
FETCH_INTERVAL_MINUTES=10
```

**To get an OpenAI API key:**
1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key and add it to your `.env` file

---

## Step 4: Verify Your Setup

### Check Environment Variables

Make sure all required keys are in `server/.env`:
- ✅ `RAPIDAPI_KEY`
- ✅ `SERPAPI_KEY`
- ✅ `OPENAI_API_KEY` (NEW)
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`

### Check Database

Verify the `fact_check_data` column exists:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'posts' AND column_name = 'fact_check_data';
```

---

## Step 5: Start the Servers

### Start Backend Server

```bash
cd server
npm run dev
```

You should see:
```
🚀 RepuShield API server running on http://localhost:3001
📡 Health check: http://localhost:3001/health
⏰ Post fetcher scheduled every 10 minutes
```

### Start Frontend Server (in a new terminal)

```bash
npm run dev
```

Or if you want both running together:
```bash
npm run dev:all
```

---

## Step 6: Test the System

### 1. Create a Configuration

1. Open http://localhost:5173 in your browser
2. Navigate to the **Configuration** page
3. Fill in:
   - Entity name (e.g., "Shashi Tharoor")
   - Social handles
   - Ontology keywords
   - Select platforms (Twitter, Reddit, Facebook, News)
4. Click **"Activate Monitor"**

### 2. Monitor the Process

Watch the backend console. You should see:

```
[Twitter Agent] Searching with query: ...
[Twitter Agent] Fetched 20 posts
[Reddit Agent] Searching with query: ...
[Reddit Agent] Fetched 25 posts
...
[Orchestrator] Starting risk scoring agent...
[Risk Scoring Agent] Found 50 posts to score
[Risk Scoring Agent] Completed scoring 50 posts
[Orchestrator] Starting fact-checking agent...
[Fact-Checking Agent] Found 5 high-risk posts to fact-check
[Fact-Checking Agent] Completed fact-checking 5 posts
```

### 3. View Results

1. Go to the **Feeds** page
2. You should see posts with:
   - Risk scores (1-10)
   - Sentiment (positive/neutral/negative)
   - Topics (for each post)
3. Click on a post (chevron button) to see:
   - Evidence (for high-risk posts)
   - Admin response (for fact-checked posts)
   - Topics

---

## Step 7: Verify Features

### ✅ Check These Features:

1. **Posts are fetched** from all selected platforms
2. **Risk scores** appear (1-10 scale)
3. **Topics** are generated for each post
4. **High-risk posts** (score > 8) have fact-check data
5. **Right panel** opens when clicking a post
6. **Evidence** and **Admin Response** show for fact-checked posts
7. **Auto-refresh is removed** (no Start/Stop Stream buttons)

---

## Troubleshooting

### Issue: "OPENAI_API_KEY not found" warning

**Solution:** Add `OPENAI_API_KEY` to `server/.env` file. Risk scoring will be disabled without it.

### Issue: "fact_check_data column does not exist"

**Solution:** Run the SQL migration from Step 2.

### Issue: Posts don't have risk scores

**Check:**
- Is `OPENAI_API_KEY` set correctly?
- Check backend logs for risk scoring errors
- Verify posts were fetched successfully first

### Issue: No fact-check data for high-risk posts

**Check:**
- Do posts have `risk_score > 8`?
- Check backend logs for fact-checking errors
- Verify `SERPAPI_KEY` is valid

### Issue: Right panel doesn't open

**Check:**
- Open browser console for errors
- Verify post has `factCheckData` in the response
- Check if post risk score is above 8

---

## System Flow Summary

```
1. User activates configuration
   ↓
2. Platform Agents (Parallel)
   ├─ Twitter: Fetch 20 posts
   ├─ Reddit: Fetch 20 posts
   ├─ Facebook: Fetch 20 posts
   └─ News: Fetch 20 posts
   ↓
3. Risk Scoring Agent (Parallel processing)
   ├─ Analyze all posts with OpenAI
   ├─ Generate risk scores (1-10)
   ├─ Generate topics (3-5 per post)
   └─ Flag critical negative claims
   ↓
4. Fact-Checking Agent (Parallel processing)
   ├─ Select posts with risk_score > 8
   ├─ Fact-check using SerpAPI
   ├─ Collect evidence
   ├─ Generate admin response
   └─ Store in fact_check_data JSON
   ↓
5. Frontend displays posts
   ├─ Show risk scores, sentiment, topics
   └─ Right panel shows evidence & admin response
```

---

## Next Steps After Setup

1. **Monitor the first fetch** - Watch console logs
2. **Check database** - Verify posts have risk_score and topics
3. **Test fact-checking** - Wait for high-risk posts to be fact-checked
4. **Review results** - Check the Feeds page and right panel

---

## Support

If you encounter any issues:
1. Check backend console logs
2. Check browser console for frontend errors
3. Verify all environment variables are set
4. Ensure database schema is updated

Good luck! 🚀
