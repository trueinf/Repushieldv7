# Manual Netlify Fix (Since GitHub Push is Blocked)

## The Situation
- ✅ Fixes are committed locally (`.nvmrc` files, updated `netlify.toml`)
- ❌ Can't push to GitHub (secret protection blocking)
- ✅ You can fix it manually in Netlify UI

---

## Manual Fix Steps

### Step 1: Set Node Version in Netlify

1. **Go to Netlify Dashboard**
   - https://app.netlify.com
   - Open your site

2. **Site Settings → Build & Deploy → Environment**
   - Click **"Site settings"** (gear icon)
   - Click **"Build & deploy"** in left sidebar
   - Scroll to **"Environment"** section

3. **Add/Edit Variable:**
   - **Key**: `NODE_VERSION`
   - **Value**: `20`
   - Click **"Save"**

### Step 2: Update Build Settings

1. **Still in Build & Deploy settings**
2. **Scroll to "Build settings"**
3. **Update:**
   - **Base directory**: `frontend`
   - **Build command**: `cd frontend && npm install && npm run build`
   - **Publish directory**: `frontend/dist`
4. **Click "Save"**

### Step 3: Clear Cache and Redeploy

1. **Go to "Deploys" tab**
2. **Click "Clear cache and deploy site"**
3. **Wait for deployment** (2-5 minutes)

---

## What This Does

- Forces Node 20 (via `NODE_VERSION` environment variable)
- Uses npm instead of yarn (via build command)
- Builds only frontend (not backend)
- Clears old cached dependencies

---

## Verification

After redeploy, check build logs:
- ✅ Should see: `v20.x.x is already installed`
- ✅ Should see: `npm install` (not yarn)
- ✅ Should see: Building in `frontend` directory
- ✅ Build should succeed

---

## Alternative: Allow GitHub Secret

If you want to push the fixes to GitHub:

1. **Visit**: https://github.com/trueinf/Repushieldv7/security/secret-scanning/unblock-secret/38QohJYEn4v2oYiukH41Aigxz6R
2. **Click "Allow secret"**
3. **Then I can push the fixes**
4. **Netlify will auto-redeploy from GitHub**

---

## Summary

**Quick Fix (Recommended):**
1. Set `NODE_VERSION = 20` in Netlify UI
2. Update build command to: `cd frontend && npm install && npm run build`
3. Clear cache and redeploy
4. Done! ✅

This will work even without pushing to GitHub!


