# Railway CLI Setup Instructions

## ✅ Railway CLI is Installed

The Railway CLI has been installed on your system via npm.

## 🔐 Step 1: Login to Railway

Open PowerShell or Command Prompt in your project directory and run:

```bash
railway login
```

This will:
- Open your default browser
- Ask you to authorize Railway CLI
- Complete the login process

**Note**: You must be logged into Railway in your browser first (https://railway.app)

## 🔗 Step 2: Link Your Project

After logging in, link your project:

```bash
railway link -p 908ab09a-b915-4c0f-a3f1-5bca2219d999
```

This connects your local project to your Railway project.

## ✅ Step 3: Verify Connection

Check if everything is connected:

```bash
railway status
```

You should see your project information.

## 🚀 Step 4: Deploy

Once linked, you can deploy your backend:

```bash
railway up
```

This will:
- Build your backend
- Deploy it to Railway
- Show you the deployment URL

## 📋 Quick Command Reference

```bash
# Login
railway login

# Link project
railway link -p 908ab09a-b915-4c0f-a3f1-5bca2219d999

# Check status
railway status

# Deploy
railway up

# View logs
railway logs

# Open Railway dashboard
railway open
```

## 🔧 Troubleshooting

### Problem: "Unauthorized. Please login"
**Solution**: Run `railway login` first

### Problem: "Project not found"
**Solution**: 
- Make sure you're logged in: `railway login`
- Verify the project ID is correct
- Check that you have access to the project in Railway dashboard

### Problem: "Command not found: railway"
**Solution**: 
- Railway CLI might not be in your PATH
- Try: `npm install -g @railway/cli` again
- Or use: `npx @railway/cli` instead of `railway`

## 📝 Environment Variables

After linking, you can set environment variables via CLI:

```bash
# Set a variable
railway variables set RAPIDAPI_KEY=your_key_here

# View all variables
railway variables

# Or set them in Railway dashboard (recommended)
```

## 🎯 Next Steps After Linking

1. ✅ Set environment variables in Railway dashboard
2. ✅ Deploy: `railway up`
3. ✅ Get your backend URL from Railway dashboard
4. ✅ Test: `https://your-url.up.railway.app/health`
5. ✅ Deploy frontend to Netlify
6. ✅ Update `FRONTEND_URL` in Railway

---

**Your Project ID**: `908ab09a-b915-4c0f-a3f1-5bca2219d999`

Run these commands in order:
1. `railway login`
2. `railway link -p 908ab09a-b915-4c0f-a3f1-5bca2219d999`
3. `railway up`

Good luck! 🚀



