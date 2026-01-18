# Fix Railway Build Issues

## Problems Identified

1. **Building from root directory** - Railway is running `npm ci` in root, not backend
2. **Node version mismatch** - Using Node 18, but Supabase requires Node 20
3. **Build failing** - Docker build error

## Solutions Applied

### 1. Created `.nvmrc` file
- Added `backend/.nvmrc` with `20` to specify Node 20

### 2. Created `nixpacks.toml`
- Added `backend/nixpacks.toml` to:
  - Use Node 20
  - Change to backend directory before running commands

## What You Need to Do

### Option 1: Set Root Directory in Railway (Best Solution)

Since the UI won't let you change it, try this:

1. **Delete the current service** in Railway
2. **Create a new service**:
   - Click "New" → "GitHub Repo"
   - Select your repo
   - **IMPORTANT**: Before clicking "Deploy", look for "Root Directory" or "Source" option
   - Set it to `backend` BEFORE deploying
   - Then add environment variables
   - Then deploy

### Option 2: Use the nixpacks.toml (Current Fix)

I've created `backend/nixpacks.toml` that:
- Uses Node 20
- Changes to backend directory before running commands

**Steps:**
1. Commit and push the new files:
   ```bash
   git add backend/.nvmrc backend/nixpacks.toml
   git commit -m "Fix Railway build: Add Node 20 and nixpacks config"
   git push
   ```
2. Railway will automatically redeploy
3. Check if it builds correctly

### Option 3: Update Railway Service Settings

1. Go to Railway → Your service → Settings
2. Look for "Build Command" override
3. Set it to: `cd backend && npm install --legacy-peer-deps && npm run build`
4. Set "Start Command" to: `cd backend && npm start`
5. Add environment variable: `NODE_VERSION=20`

## Files Created

- `backend/.nvmrc` - Specifies Node 20
- `backend/nixpacks.toml` - Nixpacks configuration for Railway

## Next Steps

1. **Commit the new files**:
   ```bash
   git add backend/.nvmrc backend/nixpacks.toml
   git commit -m "Fix Railway build configuration"
   git push
   ```

2. **Railway will auto-redeploy**

3. **Check the build logs** - Should now:
   - Use Node 20
   - Build from backend directory
   - Complete successfully

## If It Still Fails

Try deleting and recreating the service with root directory set to `backend` from the start.

