# Fix Netlify Node Version Issue

## Problem
Netlify is using Node.js 18, but Supabase requires Node.js 20.

## Solution: Set Node Version in Netlify

### Method 1: Via Netlify Dashboard (Recommended)

1. **Go to Netlify Dashboard**
   - https://app.netlify.com
   - Open your site

2. **Go to Site Settings**
   - Click on your site
   - Click **"Site settings"** (gear icon)

3. **Navigate to Build & Deploy**
   - Click **"Build & deploy"** in the left sidebar
   - Scroll to **"Environment"** section

4. **Add Environment Variable**
   - Click **"Add variable"** or **"Edit variables"**
   - **Key**: `NODE_VERSION`
   - **Value**: `20`
   - Click **"Save"**

5. **Redeploy**
   - Go to **"Deploys"** tab
   - Click **"Trigger deploy"** → **"Deploy site"**
   - Or wait for automatic redeploy

### Method 2: Via netlify.toml (Already Fixed Locally)

The `netlify.toml` file has been updated to:
```toml
[build.environment]
  NODE_VERSION = "20"
```

**To apply this:**
- Either allow the GitHub secret and push
- Or manually set it in Netlify UI (Method 1)

---

## After Fixing

1. **Wait for Netlify to redeploy**
2. **Check build logs** - should see:
   - `Now using node v20.x.x`
   - Build should succeed
3. **Verify deployment** - your site should be live

---

## Verification

After redeploy, check the build logs:
- Should see: `v20.x.x is already installed` or `Installing node v20.x.x`
- Should NOT see: `v18.x.x is already installed`
- Build should complete successfully

---

## Summary

**Quick Fix:**
1. Netlify Dashboard → Site Settings → Build & Deploy → Environment
2. Add `NODE_VERSION = 20`
3. Save and redeploy
4. Done! ✅

