# Deploy Frontend to Netlify - Step by Step

## ✅ Backend is Working!

Your backend is deployed and responding correctly! Now let's deploy the frontend.

---

## Step 1: Get Your Backend URL

You already tested it! Copy the URL you used (the one that returned the success message).

Example: `https://repushield-backend-production-xxxx.up.railway.app`

---

## Step 2: Deploy Frontend to Netlify

### Option A: Via Netlify Dashboard (Recommended)

1. **Go to Netlify**: https://app.netlify.com
2. **Click "Add new site"** → **"Import an existing project"**
3. **Connect to GitHub**:
   - Select your repository: `trueinf/Repushieldv7`
   - Click **"Connect"**
4. **Configure build settings**:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
5. **Add environment variable**:
   - Click **"Show advanced"** → **"New variable"**
   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-backend-url.up.railway.app` (your Railway backend URL)
   - Click **"Add variable"**
6. **Click "Deploy site"**
7. **Wait for deployment** (2-5 minutes)

### Option B: Via Netlify CLI

```bash
cd frontend
npm install -g netlify-cli
netlify login
netlify init
# When asked, set:
# - Build command: npm run build
# - Publish directory: dist
# - Add environment variable: VITE_API_URL=https://your-backend-url.up.railway.app
netlify deploy --prod
```

---

## Step 3: Get Your Frontend URL

After deployment:

1. Netlify will give you a URL like: `https://random-name-12345.netlify.app`
2. Or you can set a custom domain
3. **Copy this URL** - you'll need it for the next step

---

## Step 4: Update Backend CORS

1. **Go to Railway Dashboard**
2. **Open repushield-backend service**
3. **Go to Variables tab**
4. **Find `FRONTEND_URL` variable**
5. **Update it** to your Netlify frontend URL:
   - Example: `https://your-app.netlify.app`
   - Or if you have multiple: `https://your-app.netlify.app,http://localhost:5173`
6. **Click "Save"**
7. **Railway will automatically redeploy** (takes 1-2 minutes)

---

## Step 5: Test Everything

1. **Open your Netlify frontend URL**
2. **Open browser DevTools** (F12) → Console tab
3. **Test the application**:
   - Try logging in
   - Check if API calls work
   - Look for any errors in console

### Expected Results:
- ✅ Frontend loads
- ✅ API calls succeed
- ✅ No CORS errors
- ✅ Data loads from backend

---

## Troubleshooting

### Frontend can't connect to backend?
- Check `VITE_API_URL` in Netlify environment variables
- Make sure it matches your Railway backend URL exactly
- Redeploy frontend after changing environment variables

### CORS errors?
- Make sure `FRONTEND_URL` in Railway includes your Netlify URL
- Check that Railway has redeployed after updating `FRONTEND_URL`
- Verify the URL format is correct (no trailing slashes)

### Build fails on Netlify?
- Check Netlify build logs
- Make sure base directory is set to `frontend`
- Verify build command is `npm run build`
- Check that all dependencies are in `package.json`

---

## Quick Checklist

- [ ] Backend URL copied
- [ ] Frontend deployed to Netlify
- [ ] `VITE_API_URL` set in Netlify
- [ ] Frontend URL obtained
- [ ] `FRONTEND_URL` updated in Railway
- [ ] Tested full application

---

## Summary

1. ✅ Backend deployed (DONE!)
2. ⏭️ Deploy frontend to Netlify
3. ⏭️ Set `VITE_API_URL` in Netlify
4. ⏭️ Update `FRONTEND_URL` in Railway
5. ⏭️ Test everything!

**You're almost there!** 🚀

