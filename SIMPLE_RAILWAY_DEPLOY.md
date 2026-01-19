# Simple Railway Backend Deployment - Step by Step

This is the **easiest way** to deploy your backend. Follow these steps exactly.

---

## Step 1: Open Railway Website

1. Open your web browser
2. Go to: **https://railway.app**
3. **Log in** with your GitHub account

---

## Step 2: Go to Your Project

1. You should see your project: **"graceful-creation"** or **"repushield-backend"**
2. **Click on it** to open

---

## Step 3: Open the Backend Service

1. You should see a service called **"repushield-backend"**
2. **Click on it**

---

## Step 4: Check Settings

1. Click on the **"Settings"** tab (gear icon or "Settings" link)
2. Look for **"Root Directory"**
3. **If it says `/` or is empty:**
   - Try to change it to: `backend`
   - **If you can't change it**, that's okay - we'll work around it

---

## Step 5: Add Environment Variables (IMPORTANT!)

1. Click on the **"Variables"** tab
2. Click **"New Variable"** button
3. Add these **one by one**:

### Variable 1:
- **Name**: `NODE_ENV`
- **Value**: `production`
- Click **"Add"**

### Variable 2:
- **Name**: `RAPIDAPI_KEY`
- **Value**: `f9513d88bemsh78000d428cce2d3p1d08e5jsn328d2231f921`
- Click **"Add"**

### Variable 3:
- **Name**: `SERPAPI_KEY`
- **Value**: `fa9960c5ac91ca0381fea345d0a164abb8a3f22b0ca4626fcf4eeffb88b4401d`
- Click **"Add"**

### Variable 4:
- **Name**: `OPENAI_API_KEY`
- **Value**: `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`
- Click **"Add"`

### Variable 5:
- **Name**: `SUPABASE_URL`
- **Value**: `https://jlmcpkihlirppsaqehaq.supabase.co`
- Click **"Add"**

### Variable 6:
- **Name**: `SUPABASE_SERVICE_ROLE_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsbWNwa2lobGlycHBzYXFlaGFxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTkwNjkxNCwiZXhwIjoyMDc3NDgyOTE0fQ.FLSMP2CWFlKBYq9o6U52pBGX8wg4-EFyRoI7cevEymk`
- Click **"Add"**

### Variable 7:
- **Name**: `FRONTEND_URL`
- **Value**: `http://localhost:5173`
- Click **"Add"**

### Variable 8:
- **Name**: `FETCH_INTERVAL_MINUTES`
- **Value**: `10`
- Click **"Add"**

### Variable 9 (IMPORTANT for Node version):
- **Name**: `NODE_VERSION`
- **Value**: `20`
- Click **"Add"**

---

## Step 6: Override Build Commands (If Root Directory is `/`)

If you couldn't change Root Directory to `backend`, do this:

1. Go to **Settings** tab
2. Look for **"Build Command"** or **"Override Build"**
3. Set it to:
   ```
   cd backend && npm install --legacy-peer-deps && npm run build
   ```
4. Look for **"Start Command"** or **"Override Start"**
5. Set it to:
   ```
   cd backend && npm start
   ```
6. Click **"Save"**

---

## Step 7: Deploy

1. Go to **"Deployments"** tab
2. Click **"Redeploy"** or **"Deploy"** button
3. **Wait** for it to build (2-5 minutes)
4. Watch the logs to see progress

---

## Step 8: Get Your Backend URL

1. Go to **Settings** tab
2. Scroll to **"Networking"** or **"Domains"** section
3. You'll see your URL like: `https://repushield-backend-production.up.railway.app`
4. **Copy this URL**

---

## Step 9: Test Your Backend

1. Open a new browser tab
2. Go to: `https://your-url.up.railway.app/health`
3. You should see JSON with `"success": true`

**If you see this, your backend is working! 🎉**

---

## Troubleshooting

### If build fails:
- Check the **Deployments** tab → Click on the failed deployment → Read the error
- Make sure all environment variables are added
- Make sure `NODE_VERSION=20` is set

### If you see "502 Bad Gateway":
- Check the **Logs** tab for errors
- Make sure all environment variables are correct

### If Root Directory can't be changed:
- Use Step 6 to override build commands instead
- This will work the same way

---

## Summary Checklist

- [ ] Logged into Railway
- [ ] Opened repushield-backend service
- [ ] Added all 9 environment variables
- [ ] Set NODE_VERSION=20
- [ ] Override build/start commands (if needed)
- [ ] Clicked Deploy/Redeploy
- [ ] Got backend URL
- [ ] Tested /health endpoint

---

**That's it! Follow these steps and your backend will deploy.**







