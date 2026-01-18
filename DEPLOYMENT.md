# Deployment Guide - RepuShield v7

This guide covers deploying the RepuShield application with:
- **Frontend**: Netlify
- **Backend**: Railway

## Prerequisites

1. **GitHub Repository**: Push your code to GitHub
2. **Netlify Account**: Sign up at https://netlify.com
3. **Railway Account**: Sign up at https://railway.app
4. **API Keys**: Ensure you have all required API keys ready

## Part 1: Backend Deployment (Railway)

### Step 1: Prepare Backend for Railway

1. **Verify Build Configuration**:
   - Ensure `backend/package.json` has `build` and `start` scripts
   - Build script: `tsc` (compiles TypeScript)
   - Start script: `node dist/index.js`
   - `backend/railway.json` is already configured

2. **Create Railway Project**:
   - Go to https://railway.app
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your GitHub account and select the repository

3. **Configure Railway Service**:
   - Railway will auto-detect it's a Node.js project
   - **Root Directory**: Set to `backend` (in service settings)
   - **Build Command**: `npm install --legacy-peer-deps && npm run build` (or Railway will use railway.json)
   - **Start Command**: `npm start` (or Railway will use railway.json)
   - Railway will automatically use the `railway.json` configuration

4. **Set Environment Variables in Railway**:
   Go to your service → Variables tab and add:

   ```
   NODE_ENV=production
   PORT=${{PORT}}
   RAPIDAPI_KEY=your_rapidapi_key
   SERPAPI_KEY=your_serpapi_key
   OPENAI_API_KEY=your_openai_key
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   FRONTEND_URL=https://your-netlify-app.netlify.app
   FETCH_INTERVAL_MINUTES=10
   ```

   **Important**: 
   - Railway automatically provides `PORT` via `${{PORT}}` variable
   - Replace `your-netlify-app.netlify.app` with your actual Netlify URL (you'll get this after deploying frontend)
   - You can update `FRONTEND_URL` later if needed

5. **Deploy**:
   - Railway will automatically start building and deploying
   - Wait for deployment to complete
   - Note the service URL (e.g., `https://repushield-backend-production.up.railway.app`)
   - You can also set a custom domain in Railway settings

6. **Verify Backend**:
   - Visit: `https://your-backend-url.up.railway.app/health`
   - Should return JSON with `success: true` and database connection status

### Step 2: Update CORS (if needed)

If you need to allow multiple frontend URLs, update `FRONTEND_URL` in Railway:
```
FRONTEND_URL=https://your-app.netlify.app,https://staging.netlify.app
```

The backend now supports comma-separated URLs.

## Part 2: Frontend Deployment (Netlify)

### Step 1: Prepare Frontend for Netlify

1. **Create Environment File** (optional, can also set in Netlify dashboard):
   - Create `frontend/.env.production` (or set in Netlify)
   - Add: `VITE_API_URL=https://your-backend-url.up.railway.app/api`

2. **Verify Build Configuration**:
   - `frontend/netlify.toml` is already configured
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Base directory: `frontend`

### Step 2: Deploy to Netlify

**Option A: Using Netlify Dashboard**

1. Go to https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub and select your repository
4. **Configure build settings**:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
5. **Set Environment Variables**:
   - Go to Site settings → Environment variables
   - Add: `VITE_API_URL` = `https://your-backend-url.up.railway.app/api`
6. Click "Deploy site"

**Option B: Using Netlify CLI**

```bash
cd frontend
npm install -g netlify-cli
netlify login
netlify init
# Follow prompts:
# - Base directory: frontend
# - Build command: npm run build
# - Publish directory: dist
netlify env:set VITE_API_URL https://your-backend-url.up.railway.app/api
netlify deploy --prod
```

### Step 3: Update Backend CORS

After getting your Netlify URL:
1. Go to Railway dashboard → Your service → Variables
2. Update `FRONTEND_URL` to your Netlify URL:
   ```
   FRONTEND_URL=https://your-app-name.netlify.app
   ```
3. Railway will automatically redeploy

## Part 3: Post-Deployment Checklist

### Backend (Railway)
- [ ] Health endpoint works: `https://your-backend.up.railway.app/health`
- [ ] Database connection is successful
- [ ] CORS is configured correctly
- [ ] Environment variables are set
- [ ] Scheduler is running (check logs)

### Frontend (Netlify)
- [ ] Site is accessible
- [ ] API calls work (check browser console)
- [ ] Environment variable `VITE_API_URL` is set
- [ ] No CORS errors in browser console

### Testing
1. **Test API Connection**:
   - Open browser console on your Netlify site
   - Check for API errors
   - Verify API calls go to correct backend URL

2. **Test Features**:
   - Create a configuration
   - View feeds
   - Check if posts are being fetched

## Troubleshooting

### Backend Issues

**Problem**: Build fails on Railway
- **Solution**: Check build logs in Railway dashboard
- Ensure `npm install --legacy-peer-deps` is used (configured in railway.json)
- Verify TypeScript compiles: `cd backend && npm run build`

**Problem**: Backend starts but returns 502
- **Solution**: Check Railway logs, verify `PORT` environment variable
- Railway automatically provides PORT, ensure your code uses `process.env.PORT`
- Check that the service is listening on the correct port

**Problem**: CORS errors
- **Solution**: Verify `FRONTEND_URL` in Railway matches your Netlify URL exactly
- Check backend logs in Railway dashboard for CORS errors

**Problem**: Database connection fails
- **Solution**: Verify Supabase credentials in Railway environment variables
- Check Supabase dashboard for connection issues

**Problem**: Service goes to sleep (free tier)
- **Solution**: Railway free tier may sleep after inactivity
- Consider upgrading to a paid plan for always-on service
- Or use Railway's sleep prevention features

### Frontend Issues

**Problem**: API calls fail
- **Solution**: Verify `VITE_API_URL` in Netlify environment variables
- Check browser console for errors
- Ensure backend URL is correct and accessible
- If Railway service is sleeping, first request may be slow

**Problem**: Build fails on Netlify
- **Solution**: Check build logs
- Verify base directory is set to `frontend`
- Ensure all dependencies are in `package.json`

**Problem**: 404 errors on routes
- **Solution**: Verify `netlify.toml` has redirect rule for SPA routing
- Check that `[[redirects]]` section is present

## Environment Variables Reference

### Backend (Railway)
```
NODE_ENV=production
PORT=${{PORT}}
RAPIDAPI_KEY=***
SERPAPI_KEY=***
OPENAI_API_KEY=***
SUPABASE_URL=***
SUPABASE_SERVICE_ROLE_KEY=***
FRONTEND_URL=https://your-app.netlify.app
FETCH_INTERVAL_MINUTES=10
```

**Note**: Railway automatically provides `PORT` via `${{PORT}}` variable. You can also use `process.env.PORT` directly in code.

### Frontend (Netlify)
```
VITE_API_URL=https://your-backend.up.railway.app/api
```

## Custom Domains

### Netlify Custom Domain
1. Go to Site settings → Domain management
2. Add custom domain
3. Update `FRONTEND_URL` in Railway to match

### Railway Custom Domain
1. Go to Service settings → Networking
2. Add custom domain and configure DNS
3. Update `VITE_API_URL` in Netlify if needed

## Monitoring

### Railway
- View logs: Service → Deployments → Select deployment → View logs
- Monitor metrics: Service → Metrics
- Set up alerts: Service → Settings → Notifications

### Netlify
- View build logs: Deploys → Select deploy → Build log
- View function logs: Functions → Logs
- Monitor analytics: Analytics tab

## Continuous Deployment

Both platforms support automatic deployments:
- **Railway**: Auto-deploys on push to main branch (default)
- **Netlify**: Auto-deploys on push to main branch (configurable)

To disable auto-deploy:
- Railway: Service → Settings → Source → Disable auto-deploy
- Netlify: Site settings → Build & deploy → Stop auto publishing

## Rollback

### Railway
- Go to Deployments → Select previous deployment → Redeploy

### Netlify
- Go to Deploys → Select previous deploy → Publish deploy

## Railway-Specific Tips

1. **Sleep Prevention**: Railway free tier services may sleep. Consider:
   - Using Railway Pro for always-on service
   - Setting up a cron job to ping your service
   - Using Railway's sleep prevention features

2. **Build Optimization**: Railway caches `node_modules` between builds for faster deployments

3. **Environment Variables**: Railway supports:
   - Plain text variables
   - Secret variables (encrypted)
   - Reference variables (`${{PORT}}`)

4. **Logs**: Railway provides real-time logs in the dashboard

## Support

For issues:
1. Check platform-specific documentation
2. Review application logs
3. Verify environment variables
4. Test locally with production environment variables
