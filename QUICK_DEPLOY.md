# Quick Deployment Reference

## Backend (Railway) - 5 Steps

1. **Go to Railway Dashboard** → New Project → Deploy from GitHub
2. **Connect GitHub** → Select repository
3. **Configure**:
   - Root Directory: `backend`
   - Railway will auto-detect Node.js and use `railway.json`
4. **Add Environment Variables**:
   ```
   NODE_ENV=production
   PORT=${{PORT}}
   RAPIDAPI_KEY=***
   SERPAPI_KEY=***
   OPENAI_API_KEY=***
   SUPABASE_URL=***
   SUPABASE_SERVICE_ROLE_KEY=***
   FRONTEND_URL=https://your-app.netlify.app (set after Netlify deploy)
   FETCH_INTERVAL_MINUTES=10
   ```
5. **Deploy** → Copy backend URL (e.g., `https://your-app.up.railway.app`)

## Frontend (Netlify) - 5 Steps

1. **Go to Netlify Dashboard** → Add new site → Import from Git
2. **Connect GitHub** → Select repository
3. **Configure Build**:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`
4. **Add Environment Variable**:
   ```
   VITE_API_URL=https://your-backend.up.railway.app/api
   ```
5. **Deploy** → Copy frontend URL

## Update CORS

After both are deployed:
1. Go to Railway → Your service → Variables
2. Update `FRONTEND_URL` to your Netlify URL
3. Railway auto-redeploys

## Test

- Backend: `https://your-backend.up.railway.app/health`
- Frontend: `https://your-app.netlify.app`
- Check browser console for API errors

## Railway Notes

- Railway provides `PORT` automatically via `${{PORT}}`
- Free tier may sleep after inactivity
- Check logs in Railway dashboard for debugging
