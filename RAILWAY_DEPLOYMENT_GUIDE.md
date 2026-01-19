# Railway Deployment Guide - Step by Step

This guide will walk you through deploying the RepuShield backend to Railway.

## Prerequisites

1. ✅ GitHub account with the repository: https://github.com/trueinf/Repushieldv7
2. ✅ Railway account (sign up at https://railway.app if you don't have one)
3. ✅ All your API keys ready:
   - RAPIDAPI_KEY
   - SERPAPI_KEY
   - OPENAI_API_KEY
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY

---

## Step 1: Sign In to Railway

1. Go to **https://railway.app**
2. Click **"Login"** or **"Start a New Project"**
3. Sign in with your GitHub account (recommended for easy repo access)

---

## Step 2: Create a New Project

1. Once logged in, you'll see your dashboard
2. Click the **"New Project"** button (usually a big green button or "+" icon)
3. Select **"Deploy from GitHub repo"**
4. Railway will show you a list of your GitHub repositories
5. Find and select **"Repushieldv7"** (or search for it)
6. Click on it to select

---

## Step 3: Configure the Service

After selecting the repository, Railway will automatically detect it's a Node.js project.

1. **Set Root Directory**:
   - Railway might auto-detect, but you need to set it manually
   - Click on the service (it might be named "repushieldv7" or similar)
   - Go to **Settings** tab
   - Find **"Root Directory"** or **"Source"** section
   - Set it to: `backend`
   - Click **Save**

2. **Verify Build Settings**:
   - Railway will automatically use `backend/railway.json` which has:
     - Build command: `npm install --legacy-peer-deps && npm run build`
     - Start command: `npm start`
   - You don't need to change these unless you want to customize

---

## Step 4: Add Environment Variables

This is the most important step!

1. In your Railway service, click on the **"Variables"** tab
2. Click **"New Variable"** or **"Add Variable"**
3. Add each variable one by one:

### Required Variables:

**1. NODE_ENV**
- Key: `NODE_ENV`
- Value: `production`
- Click **Add**

**2. PORT**
- Key: `PORT`
- Value: `${{PORT}}`
- **Important**: Railway provides PORT automatically, use `${{PORT}}` or just leave it (Railway auto-sets it)
- Click **Add**

**3. RAPIDAPI_KEY**
- Key: `RAPIDAPI_KEY`
- Value: `your_actual_rapidapi_key_here`
- Click **Add**

**4. SERPAPI_KEY**
- Key: `SERPAPI_KEY`
- Value: `your_actual_serpapi_key_here`
- Click **Add**

**5. OPENAI_API_KEY**
- Key: `OPENAI_API_KEY`
- Value: `your_actual_openai_key_here`
- Click **Add**

**6. SUPABASE_URL**
- Key: `SUPABASE_URL`
- Value: `https://your-project.supabase.co`
- Click **Add**

**7. SUPABASE_SERVICE_ROLE_KEY**
- Key: `SUPABASE_SERVICE_ROLE_KEY`
- Value: `your_service_role_key_here`
- Click **Add**

**8. FRONTEND_URL**
- Key: `FRONTEND_URL`
- Value: `https://your-netlify-app.netlify.app`
- **Note**: You'll update this after deploying frontend to Netlify
- For now, you can use: `http://localhost:5173` (temporary)
- Click **Add**

**9. FETCH_INTERVAL_MINUTES**
- Key: `FETCH_INTERVAL_MINUTES`
- Value: `10`
- Click **Add**

### Environment Variables Summary:

```
NODE_ENV=production
PORT=${{PORT}}
RAPIDAPI_KEY=your_key
SERPAPI_KEY=your_key
OPENAI_API_KEY=your_key
SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key
FRONTEND_URL=https://your-app.netlify.app
FETCH_INTERVAL_MINUTES=10
```

---

## Step 5: Deploy

1. After adding all environment variables, Railway will **automatically start deploying**
2. You can see the deployment progress in the **"Deployments"** tab
3. Watch the build logs:
   - Click on the current deployment
   - You'll see the build process
   - Wait for it to complete (usually 2-5 minutes)

---

## Step 6: Get Your Backend URL

1. Once deployment is complete, go to the **"Settings"** tab
2. Scroll down to **"Networking"** or **"Domains"** section
3. You'll see your Railway URL, something like:
   - `https://repushieldv7-production.up.railway.app`
   - Or `https://repushieldv7-production.railway.app`
4. **Copy this URL** - you'll need it for:
   - Frontend deployment (Netlify)
   - Testing the API

---

## Step 7: Test Your Backend

1. Open a new browser tab
2. Go to: `https://your-backend-url.up.railway.app/health`
3. You should see a JSON response like:
   ```json
   {
     "success": true,
     "message": "RepuShield API is running",
     "timestamp": "2026-01-18T...",
     "database": {
       "connected": true
     }
   }
   ```

### If you see this, your backend is working! ✅

---

## Step 8: Update CORS (After Frontend Deployment)

After you deploy your frontend to Netlify:

1. Go back to Railway → Your service → **Variables** tab
2. Find `FRONTEND_URL`
3. Click **Edit** or the pencil icon
4. Update the value to your Netlify URL:
   - Example: `https://repushieldv7.netlify.app`
5. Click **Save**
6. Railway will automatically redeploy with the new CORS settings

---

## Troubleshooting

### Problem: Build Fails

**Solution:**
1. Check the deployment logs in Railway
2. Look for error messages
3. Common issues:
   - Missing environment variables
   - TypeScript compilation errors
   - npm install failures

**Fix:**
- Ensure all environment variables are set
- Check that `backend/railway.json` exists
- Verify `backend/package.json` has `build` and `start` scripts

### Problem: Service Returns 502 Error

**Solution:**
1. Check Railway logs
2. Verify `PORT` environment variable is set (Railway provides it automatically)
3. Check that your code uses `process.env.PORT` (it does in `backend/src/index.ts`)

### Problem: Database Connection Fails

**Solution:**
1. Verify `SUPABASE_URL` is correct
2. Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
3. Check Supabase dashboard to ensure your project is active
4. Test connection locally first

### Problem: CORS Errors

**Solution:**
1. Ensure `FRONTEND_URL` is set correctly
2. Make sure it matches your Netlify URL exactly (no trailing slash)
3. Check backend logs for CORS error messages

### Problem: Service Goes to Sleep (Free Tier)

**Solution:**
- Railway free tier services may sleep after 5 minutes of inactivity
- First request after sleep may take 30-60 seconds
- Consider upgrading to Railway Pro for always-on service
- Or set up a cron job to ping your service

---

## Viewing Logs

1. Go to your service in Railway
2. Click on **"Deployments"** tab
3. Click on a deployment to see logs
4. Or click **"View Logs"** for real-time logs

---

## Monitoring

1. **Metrics**: Railway shows CPU, Memory, and Network usage
2. **Logs**: Real-time application logs
3. **Deployments**: History of all deployments
4. **Settings**: Configure domains, environment variables, etc.

---

## Custom Domain (Optional)

1. Go to **Settings** → **Networking**
2. Click **"Generate Domain"** or **"Add Custom Domain"**
3. Follow the DNS configuration instructions
4. Update `VITE_API_URL` in Netlify if you use a custom domain

---

## Quick Checklist

Before deploying, make sure:
- [ ] Railway account created
- [ ] GitHub repository connected
- [ ] Root directory set to `backend`
- [ ] All environment variables added
- [ ] Build completes successfully
- [ ] Health endpoint works: `/health`
- [ ] Database connection successful

---

## Next Steps

After Railway deployment:
1. ✅ Note your Railway backend URL
2. ✅ Test the health endpoint
3. ✅ Deploy frontend to Netlify (see Netlify deployment guide)
4. ✅ Update `FRONTEND_URL` in Railway
5. ✅ Test the full application

---

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Check deployment logs for specific errors

---

**Your backend URL will look like:**
`https://repushieldv7-production.up.railway.app`

**Health Check:**
`https://repushieldv7-production.up.railway.app/health`

Good luck with your deployment! 🚀








