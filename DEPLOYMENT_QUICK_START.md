# 🚀 Quick Deployment Summary

## What Changed

- ✅ Fixed CORS to be production-safe (environment variable based)
- ✅ Updated `render.yaml` to include `CORS_ORIGINS` env var
- ✅ Updated `.env.example` with CORS documentation
- ✅ Created `DEPLOYMENT.md` with full instructions
- ✅ Created `DEPLOYMENT_CHECKLIST.md` with verification steps

## Before You Push to Main

```bash
# 1. Verify git status (no secrets)
git status

# 2. Test backend locally
cd backend
uv run uvicorn main:app --reload
# Test: curl http://localhost:8000/health

# 3. Test frontend build
cd ../frontend
npm run build
# Should complete with NO errors
```

## Deployment Steps (In Order)

### Step 1: Push Backend to Render

```bash
git push origin main
# Render auto-builds from render.yaml
```

Wait for Render to finish building. Get your backend URL from Render Dashboard.

**Example:** `https://influencer-ai-backend.onrender.com`

### Step 2: Configure Render Environment

In **Render Dashboard** → **influencer-ai-backend** → **Environment**:

```
OPENROUTER_API_KEY=sk-or-v1-... (optional)
APIFY_API_KEY=apify_api_... (optional)
CORS_ORIGINS=https://your-vercel-app.vercel.app,http://localhost:3000
```

### Step 3: Deploy Frontend to Vercel

Frontend will auto-deploy if connected to GitHub.

Get your Vercel URL from Vercel Dashboard.

**Example:** `https://your-app.vercel.app`

### Step 4: Configure Vercel Environment

In **Vercel Dashboard** → **Settings** → **Environment Variables**:

```
NEXT_PUBLIC_API_URL=https://influencer-ai-backend.onrender.com
```

### Step 5: Verify Deployment

```bash
# Backend health check
curl https://influencer-ai-backend.onrender.com/health
# Should return: {"status": "ok"}

# Frontend check
Visit https://your-app.vercel.app
# Should load default roster automatically
```

## That's It! 🎉

Your app is now live and production-ready.

---

## Quick Troubleshooting

**"CORS error in console?"**
→ Update `CORS_ORIGINS` in Render environment variables

**"Default roster won't load?"**
→ Ensure `assingment/influencer_database.xlsx` is committed and check backend logs

**"Can't upload files?"**
→ Verify Vercel `NEXT_PUBLIC_API_URL` matches your Render backend URL

**"Database errors?"**
→ Check Render disk is mounted at `/data` in dashboard

---

## Important Notes

- ⏰ Render free tier takes ~30s to wake up from sleep (first request slower)
- 🔄 `.next/` and `node_modules/` are NOT committed (rebuilt on each deploy)
- 🔑 API keys optional - app works with fallbacks
- 📊 Database persists on Render disk (`/data/influencer_ai.db`)
- 🌍 CORS is now restricted to your Vercel domain

See `DEPLOYMENT.md` for detailed documentation.
See `DEPLOYMENT_CHECKLIST.md` for full verification steps.
