# Fix Railway PORT Variable Error

## The Error
```
PORT variable must be integer between 0 and 65535
```

## The Problem
You set `PORT = ${{PORT}}` but Railway expects a number, not a template variable.

## Solution

### Option 1: Remove PORT Variable (Recommended)
Railway automatically provides PORT, so you don't need to set it manually!

1. Go to Railway → Your service → **Variables** tab
2. Find the `PORT` variable
3. **Delete it** or remove it
4. Railway will automatically use the correct PORT

### Option 2: Set PORT to a Number
If you must set it manually:

1. Go to Variables tab
2. Find `PORT` variable
3. Change the value from `${{PORT}}` to: `3000` (or any number between 0-65535)
4. Save

**But Option 1 is better** - let Railway handle it automatically!

## Your Code Already Handles This
Your `backend/src/index.ts` has:
```typescript
const PORT = process.env.PORT || 3001;
```

This means:
- If Railway provides PORT, it uses that
- If not, it defaults to 3001
- So you don't need to set PORT in Railway!

## Updated Environment Variables List

Remove PORT from your variables. You only need:

```
NODE_ENV = production
RAPIDAPI_KEY = your_key
SERPAPI_KEY = your_key
OPENAI_API_KEY = your_key
SUPABASE_URL = your_url
SUPABASE_SERVICE_ROLE_KEY = your_key
FRONTEND_URL = http://localhost:5173
FETCH_INTERVAL_MINUTES = 10
```

**Don't include PORT** - Railway provides it automatically!

## After Fixing

1. Remove/delete the PORT variable
2. Save
3. Railway will automatically redeploy
4. The error should be gone!


