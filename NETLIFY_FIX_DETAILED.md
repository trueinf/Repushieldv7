# Fix Netlify Build - Node Version Issue

## Problem
Netlify is using Node 18, but Supabase requires Node 20. Also, Netlify is detecting yarn workspaces and trying to install backend dependencies.

## Solutions Applied

### 1. Added .nvmrc files
- Created `frontend/.nvmrc` with `20`
- Created root `.nvmrc` with `20`
- Netlify will read these to determine Node version

### 2. Updated netlify.toml
- Changed build command to explicitly use npm in frontend directory
- Set `NODE_VERSION = "20"` in environment
- Added npm flags for compatibility

### 3. Force npm instead of yarn
- Updated build command to use `npm install` explicitly
- This prevents Netlify from auto-detecting yarn workspaces

## What to Do in Netlify

### Option 1: Set in Netlify UI (Still Needed)

1. **Go to Netlify Dashboard**
2. **Site Settings → Build & Deploy → Environment**
3. **Add/Edit these variables:**
   - `NODE_VERSION` = `20`
   - `NPM_FLAGS` = `--legacy-peer-deps`
4. **Build Settings:**
   - **Base directory**: `frontend` (or leave empty if using netlify.toml)
   - **Build command**: Leave as default (netlify.toml will override)
   - **Publish directory**: `frontend/dist`
5. **Save and Redeploy**

### Option 2: Clear Cache and Redeploy

1. **Go to Deploys tab**
2. **Click "Clear cache and deploy site"**
3. **This will:**
   - Clear cached dependencies
   - Use Node 20 from .nvmrc
   - Reinstall everything fresh

## Verification

After redeploy, check build logs for:
- ✅ `v20.x.x is already installed` or `Installing node v20.x.x`
- ✅ `npm install` (not yarn)
- ✅ Building only frontend
- ✅ Build succeeds

## If Still Failing

### Check Build Logs For:
1. **Node version** - Should be 20.x.x
2. **Package manager** - Should be npm, not yarn
3. **Install location** - Should be in frontend directory
4. **Errors** - Any specific error messages

### Alternative: Use Netlify Build Image

In Netlify Settings → Build & Deploy:
- **Build image selection**: Choose "Ubuntu 22" (supports Node 20)

---

## Summary

**Files Updated:**
- ✅ `frontend/.nvmrc` - Specifies Node 20
- ✅ `.nvmrc` - Root Node version
- ✅ `frontend/netlify.toml` - Updated build command

**Next Steps:**
1. Set `NODE_VERSION = 20` in Netlify UI (if not already)
2. Clear cache and redeploy
3. Check build logs


