# Pre-Deployment Checklist

Use this checklist before deploying to ensure everything is ready.

## Code Preparation

### Backend
- [ ] All TypeScript files compile without errors (`cd backend && npm run build`)
- [ ] No hardcoded localhost URLs in code
- [ ] Environment variables are documented in `.env.example`
- [ ] CORS configuration supports production URLs
- [ ] Database connection works with production credentials
- [ ] All API routes are tested
- [ ] Error handling is in place

### Frontend
- [ ] Build completes successfully (`cd frontend && npm run build`)
- [ ] No hardcoded API URLs (using `VITE_API_URL`)
- [ ] Environment variables are documented
- [ ] All API calls use the API client
- [ ] No console errors in production build
- [ ] Routes work correctly (SPA routing)

## Configuration Files

### Backend
- [ ] `backend/package.json` has correct `build` and `start` scripts
- [ ] `backend/railway.json` is configured (Railway will use automatically)
- [ ] `backend/.env.example` exists with all required variables
- [ ] TypeScript configuration is correct

### Frontend
- [ ] `frontend/netlify.toml` is configured
- [ ] `frontend/package.json` has correct `build` script
- [ ] `frontend/.env.example` exists
- [ ] Vite configuration is correct

## Environment Variables

### Backend (Railway)
- [ ] `NODE_ENV=production`
- [ ] `PORT=${{PORT}}` (Railway provides automatically)
- [ ] `RAPIDAPI_KEY` - Valid key
- [ ] `SERPAPI_KEY` - Valid key
- [ ] `OPENAI_API_KEY` - Valid key (optional but recommended)
- [ ] `SUPABASE_URL` - Production Supabase URL
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Valid service role key
- [ ] `FRONTEND_URL` - Will be set after Netlify deployment
- [ ] `FETCH_INTERVAL_MINUTES=10`

### Frontend (Netlify)
- [ ] `VITE_API_URL` - Will be set to Railway backend URL

## Git Repository

- [ ] Code is pushed to GitHub
- [ ] `.env` files are in `.gitignore` (not committed)
- [ ] `.env.example` files are committed
- [ ] `node_modules` are in `.gitignore`
- [ ] Build artifacts (`dist`) are in `.gitignore`
- [ ] No sensitive data in code

## Testing

### Local Testing
- [ ] Backend runs locally with production-like settings
- [ ] Frontend builds and runs locally
- [ ] API connection works from frontend to backend
- [ ] All major features work:
  - [ ] Configuration creation
  - [ ] Post fetching
  - [ ] Dashboard display
  - [ ] Topics and narratives

### Production Testing (After Deployment)
- [ ] Backend health check works
- [ ] Frontend loads without errors
- [ ] API calls succeed
- [ ] No CORS errors
- [ ] Database operations work
- [ ] Scheduler runs correctly

## Documentation

- [ ] `DEPLOYMENT.md` is reviewed
- [ ] Environment variables are documented
- [ ] API endpoints are documented
- [ ] Setup instructions are clear

## Security

- [ ] No API keys in code
- [ ] Environment variables are secure
- [ ] CORS is properly configured
- [ ] Database credentials are secure
- [ ] HTTPS is enabled (both platforms)

## Performance

- [ ] Frontend build is optimized
- [ ] Images are optimized (if any)
- [ ] Bundle size is reasonable
- [ ] Backend response times are acceptable

## Monitoring

- [ ] Error logging is in place
- [ ] Health check endpoint works
- [ ] Logs are accessible
- [ ] Alerts are configured (optional)

## Backup Plan

- [ ] Know how to rollback deployments
- [ ] Have backup of environment variables
- [ ] Database backups are configured (Supabase)

## Quick Commands

### Test Backend Build
```bash
cd backend
npm install --legacy-peer-deps
npm run build
npm start  # Test in another terminal
```

### Test Frontend Build
```bash
cd frontend
npm install
npm run build
npm run preview  # Test production build
```

### Verify Environment Variables
```bash
# Backend
cd backend
cat .env.example

# Frontend
cd frontend
cat .env.example
```

## Deployment Order

1. **Deploy Backend First** (Railway)
   - Get backend URL (e.g., `https://your-app.up.railway.app`)
   - Verify health endpoint
   - Test API endpoints

2. **Deploy Frontend** (Netlify)
   - Set `VITE_API_URL` to backend URL
   - Get frontend URL

3. **Update Backend CORS**
   - Set `FRONTEND_URL` in Railway to Netlify URL
   - Railway will auto-redeploy

4. **Test Everything**
   - Verify frontend can connect to backend
   - Test all features
   - Check for errors

## Post-Deployment

- [ ] Update `FRONTEND_URL` in Railway
- [ ] Verify CORS works
- [ ] Test all features
- [ ] Monitor logs for errors
- [ ] Set up custom domains (if needed)
- [ ] Configure monitoring/alerts

