# Database Setup Instructions

## What You Need to Do

You need to add one new column to your existing `posts` table: `fact_check_data`

This column will store the fact-checking results (evidence, admin response, truth status) for high-risk posts.

---

## Method 1: Using Supabase Dashboard (Easiest)

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click on **"SQL Editor"** in the left sidebar

### Step 2: Run the Migration SQL
1. Click **"New query"**
2. Copy and paste this SQL:

```sql
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS fact_check_data JSONB;
```

3. Click **"Run"** or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

### Step 3: Verify (Optional)
Run this to check if the column was added:

```sql
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'posts' 
  AND column_name = 'fact_check_data';
```

You should see:
```
column_name      | data_type | is_nullable
fact_check_data  | jsonb     | YES
```

---

## Method 2: Using psql Command Line

If you have `psql` installed:

```bash
psql -h your-supabase-host.supabase.co \
     -U postgres \
     -d postgres \
     -c "ALTER TABLE posts ADD COLUMN IF NOT EXISTS fact_check_data JSONB;"
```

---

## Method 3: Using Database Client (DBeaver, pgAdmin, etc.)

1. Connect to your Supabase database
2. Open SQL editor
3. Run:

```sql
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS fact_check_data JSONB;
```

4. Execute the query

---

## What This Column Does

The `fact_check_data` column stores JSON data like this:

```json
{
  "evidence": {
    "sources": [
      {
        "title": "Source Title",
        "url": "https://...",
        "snippet": "Evidence snippet..."
      }
    ],
    "facts": ["Fact 1", "Fact 2"],
    "verification": "true/false/partially true/misleading"
  },
  "truth_status": "true" | "false" | "partially true" | "misleading" | "unverified",
  "admin_response": {
    "response_text": "Professional response text...",
    "tone": "professional",
    "key_points": ["Point 1", "Point 2"]
  }
}
```

This data is automatically populated by the Fact-Checking Agent for posts with `risk_score > 8`.

---

## Verification Checklist

After running the migration:

- [ ] Column `fact_check_data` exists in `posts` table
- [ ] Column type is `JSONB`
- [ ] Column allows NULL values (for posts that haven't been fact-checked yet)

---

## Troubleshooting

### Error: "column already exists"
✅ **Good!** The column is already there. You can skip this step.

### Error: "permission denied"
- Make sure you're using the **service role key** or have admin permissions
- In Supabase, use the SQL Editor with your admin account

### Error: "relation posts does not exist"
- Make sure you're connected to the correct database
- Check that the `posts` table exists first:
  ```sql
  SELECT * FROM posts LIMIT 1;
  ```

---

## That's It!

Once you've added the column, you're ready to:
1. Start the backend server
2. Activate a configuration
3. Watch the agents fetch, score, and fact-check posts!

The `fact_check_data` will be automatically populated for high-risk posts.







