# Railway Deployment - Complete Guide from Scratch

This is a **complete step-by-step guide** to deploy your backend to Railway from the very beginning.

---

## 🎯 What We're Doing

We're deploying the **backend** folder of your project to Railway. The backend is a Node.js/Express API that will run on Railway's servers.

---

## Step 1: Go to Railway Website

1. Open your web browser
2. Go to: **https://railway.app**
3. Click **"Login"** or **"Start a New Project"**
4. Sign in with your **GitHub account** (recommended)

---

## Step 2: Create a New Project

1. After logging in, you'll see your Railway dashboard
2. Click the big **"New Project"** button (usually green, top right or center)
3. You'll see options:
   - **"Deploy from GitHub repo"** ← Click this one
   - (Other options like "Empty Project" - ignore these)

---

## Step 3: Connect Your GitHub Repository

1. Railway will show you a list of your GitHub repositories
2. **Search for**: `Repushieldv7` or `trueinf/Repushieldv7`
3. **Click on it** to select it
4. Railway will start setting up the project

---

## Step 4: Configure the Service (IMPORTANT!)

After selecting your repo, Railway will create a service. Now you need to configure it:

### 4.1: Set Root Directory

1. Click on the **service** that was created (it might be named "repushieldv7" or similar)
2. Click on the **"Settings"** tab (gear icon or "Settings" link)
3. Scroll down to find **"Root Directory"** or **"Source"** section
4. In the Root Directory field, type: **`backend`**
5. Click **"Save"** or **"Update"**

**Why?** Your backend code is in the `backend` folder, not the root folder.

### 4.2: Verify Build Settings

Railway should automatically detect:
- **Build Command**: `npm install --legacy-peer-deps && npm run build`
- **Start Command**: `npm start`

These are already configured in `backend/railway.json`, so Railway will use them automatically.

---

## Step 5: Add Environment Variables (CRITICAL!)

This is the most important step! Without these, your backend won't work.

1. In your Railway service, click on the **"Variables"** tab
2. You'll see a list (might be empty at first)
3. Click **"New Variable"** or **"Add Variable"** button
4. Add each variable one by one:

### Variable 1: NODE_ENV
- **Name**: `NODE_ENV`
- **Value**: `production`
- Click **"Add"**

### Variable 2: PORT
- **Name**: `PORT`
- **Value**: `${{PORT}}`
- Click **"Add"**
- **Note**: Railway provides PORT automatically, but we set it explicitly

### Variable 3: RAPIDAPI_KEY
- **Name**: `RAPIDAPI_KEY`
- **Value**: `f9513d88bemsh78000d428cce2d3p1d08e5jsn328d2231f921`
- Click **"Add"**

### Variable 4: SERPAPI_KEY
- **Name**: `SERPAPI_KEY`
- **Value**: `fa9960c5ac91ca0381fea345d0a164abb8a3f22b0ca4626fcf4eeffb88b4401d`
- Click **"Add"**

### Variable 5: OPENAI_API_KEY
- **Name**: `OPENAI_API_KEY`
- **Value**: `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`
- Click **"Add"**

### Variable 6: SUPABASE_URL
- **Name**: `SUPABASE_URL`
- **Value**: `https://jlmcpkihlirppsaqehaq.supabase.co`
- Click **"Add"**

### Variable 7: SUPABASE_SERVICE_ROLE_KEY
- **Name**: `SUPABASE_SERVICE_ROLE_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsbWNwa2lobGlycHBzYXFlaGFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTkwNjkxNCwiZXhwIjoyMDc3NDgyOTE0fQ.FLSMP2CWFlKBYq9o6U52pBGX8wg4-EFyRoI7cevEymk`
- Click **"Add"**

### Variable 8: FRONTEND_URL
- **Name**: `FRONTEND_URL`
- **Value**: `http://localhost:5173` (temporary - update after Netlify deployment)
- Click **"Add"**

### Variable 9: FETCH_INTERVAL_MINUTES
- **Name**: `FETCH_INTERVAL_MINUTES`
- **Value**: `10`
- Click **"Add"**

---

## Step 6: Deploy!

1. After adding all environment variables, Railway will **automatically start deploying**
2. Go to the **"Deployments"** tab to watch the progress
3. You'll see:
   - "Building..." 
   - "Deploying..."
   - "Deployed" ✅

**This usually takes 2-5 minutes**

---

## Step 7: Get Your Backend URL

1. Once deployment is complete, go to **"Settings"** tab
2. Scroll to **"Networking"** or **"Domains"** section
3. You'll see your Railway URL, something like:
   - `https://repushieldv7-production.up.railway.app`
   - Or `https://repushieldv7-production.railway.app`
4. **Copy this URL** - you'll need it!

---

## Step 8: Test Your Backend

1. Open a new browser tab
2. Go to: `https://your-backend-url.up.railway.app/health`
3. You should see JSON like:
   ```json
   {
     "success": true,
     "message": "RepuShield API is running",
     "database": {
       "connected": true
     }
   }
   ```

**If you see this, your backend is working! 🎉**

---

## Step 9: Update CORS (After Frontend Deployment)

After you deploy your frontend to Netlify:

1. Go back to Railway → Your service → **Variables** tab
2. Find `FRONTEND_URL`
3. Click **Edit** (pencil icon)
4. Change the value to your Netlify URL:
   - Example: `https://repushieldv7.netlify.app`
5. Click **Save**
6. Railway will automatically redeploy

---

## 📋 Quick Checklist

Before deploying, make sure:
- [ ] Logged into Railway
- [ ] Created new project from GitHub repo
- [ ] Root directory set to `backend`
- [ ] All 9 environment variables added
- [ ] Deployment completed successfully
- [ ] Health endpoint works: `/health`
- [ ] Backend URL copied

---

## 🎯 Summary of What Happens

1. **Railway connects** to your GitHub repo
2. **Railway builds** your backend (runs `npm install` and `npm run build`)
3. **Railway starts** your backend (runs `npm start`)
4. **Railway gives you** a public URL
5. **Your backend is live!** 🚀

---

## 🔍 Where to Find Things in Railway Dashboard

- **Deployments**: See build progress and logs
- **Variables**: Add/edit environment variables
- **Settings**: Configure root directory, build commands
- **Metrics**: See CPU, memory usage
- **Logs**: View real-time application logs

---

## ⚠️ Common Issues

### Issue: "Build Failed"
- Check the deployment logs
- Make sure root directory is set to `backend`
- Verify all environment variables are set

### Issue: "Service not found"
- Make sure you created a service from GitHub repo
- Check that root directory is `backend`

### Issue: "502 Bad Gateway"
- Check logs for errors
- Verify PORT environment variable
- Make sure backend code is correct

### Issue: "Database connection failed"
- Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are correct
- Check Supabase dashboard

---

## 🎉 You're Done!

Once your backend is deployed and the health check works, you can:
1. Deploy frontend to Netlify
2. Update `FRONTEND_URL` in Railway
3. Start using your application!

---

**Need Help?**
- Check Railway logs in the dashboard
- Railway Docs: https://docs.railway.app
- Your backend URL: Check Settings → Networking

Good luck! 🚀


