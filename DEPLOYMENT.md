# 🚀 Deployment Checklist

## Backend (Render)

### ✅ Pre-Deployment Checklist

- [x] **Render Blueprint** (`render.yaml`) configured with:
  - Docker build from `./backend/Dockerfile`
  - Persistent disk mounted at `/data` (1GB free tier)
  - Health check path: `/health`
  - Environment variables set for secrets

- [x] **Dockerfile** production-ready:
  - Multi-stage build (dependencies + runtime)
  - Removes `.env` and `influencer_ai.db` from image
  - Sets `DATABASE_PATH=/data/influencer_ai.db`
  - Uses Python 3.14-slim

- [x] **Dependencies** (`pyproject.toml`):
  - All required packages listed
  - Uses `uv` for fast, deterministic builds

### ⚠️ **CRITICAL: Environment Variables**

Set these in **Render Dashboard** → Project Settings → Environment:

```
OPENROUTER_API_KEY=sk-or-v1-...
APIFY_API_KEY=apify_api_...
```

Both are optional — the app gracefully degrades without them.

### ⚠️ **IMPORTANT: CORS Configuration**

**Current:** `allow_origins=["*"]` (too permissive)

**Action:** Update in `backend/main.py` after you have your Vercel URL:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-vercel-deployment.vercel.app",  # Your Vercel URL
        "http://localhost:3000",                        # Local dev
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Once Vercel deployment is live, update this with your actual Vercel URL.

---

## Frontend (Vercel)

### ✅ Pre-Deployment Checklist

- [x] **Build Configuration** (`next.config.ts`):
  - Ready for production

- [x] **Environment Variables**:
  - `.env.example` shows example values
  - `.env.local` is for local development only

### ⚠️ **CRITICAL: Vercel Environment Setup**

Set this in **Vercel Dashboard** → Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL=https://influencer-ai-backend.onrender.com
```

**Important:** The `NEXT_PUBLIC_` prefix makes this available at build time.

### ✅ Local Build Test

Before pushing:

```bash
cd frontend
npm run build
npm run start
```

Ensure no build errors.

---

## Deployment Flow

### 1. Push Backend First

```bash
git add backend/
git commit -m "Deploy backend to Render"
git push origin main
```

Render will auto-build and deploy from `render.yaml`.

**Get your Render URL:**

- Render Dashboard → Services → influencer-ai-backend
- Copy the URL (e.g., `https://influencer-ai-backend.onrender.com`)

### 2. Update CORS in Backend

After you have the Render URL:

```python
# backend/main.py
allow_origins=[
    "https://your-vercel-app.vercel.app",  # ← Update with your Vercel URL
    "http://localhost:3000",
]
```

Push this change:

```bash
git add backend/main.py
git commit -m "Fix CORS for production"
git push origin main
```

### 3. Deploy Frontend to Vercel

```bash
# Set environment variable in Vercel Dashboard first:
# NEXT_PUBLIC_API_URL=https://influencer-ai-backend.onrender.com

git add frontend/
git commit -m "Deploy frontend to Vercel"
git push origin main
```

Vercel will auto-deploy from GitHub.

---

## Post-Deployment Verification

### 1. Backend Health Check

```bash
curl https://influencer-ai-backend.onrender.com/health
# Should return: {"status": "ok"}
```

### 2. Frontend Connectivity

Visit your Vercel URL and check:

- Page loads
- Default roster loads automatically
- No CORS errors in browser DevTools Console

### 3. Database Persistence

- Upload a test file
- Refresh the page
- Check Analytics tab → Campaign history should persist

---

## Troubleshooting

### CORS Error in Frontend

**Symptom:** "Access-Control-Allow-Origin header is missing"

**Fix:** Ensure your Vercel URL is in `allow_origins` in `backend/main.py`

### Default Roster Not Loading

**Symptom:** "Default influencer database spreadsheet not found"

**Fix:** Ensure `assingment/influencer_database.xlsx` is in git repo and deployed

### Database Errors on Render

**Symptom:** "unable to open database file"

**Fix:**

- Render dashboard → Services → influencer-ai-backend → Disks
- Verify disk is mounted at `/data`
- Check `DATABASE_PATH` env var is set to `/data/influencer_ai.db`

---

## Environment Variables Reference

| Service      | Variable              | Value                                        | Required |
| ------------ | --------------------- | -------------------------------------------- | -------- |
| **Backend**  | `OPENROUTER_API_KEY`  | Your OpenRouter key                          | No\*     |
| **Backend**  | `APIFY_API_KEY`       | Your Apify key                               | No\*     |
| **Backend**  | `DATABASE_PATH`       | `/data/influencer_ai.db`                     | Auto-set |
| **Frontend** | `NEXT_PUBLIC_API_URL` | `https://influencer-ai-backend.onrender.com` | Yes      |

\*App runs with graceful degradation if keys are missing

---

## Final Checklist Before Pushing to Main

- [ ] Backend `.env` not committed (in `.gitignore`)
- [ ] Frontend `.env.local` not committed (in `.gitignore`)
- [ ] No hardcoded localhost/127.0.0.1 in code (except test files)
- [ ] Render.yaml has correct environment variable placeholders
- [ ] Database path handles production (`/data/` mount)
- [ ] CORS is configured (or about to be after Render URL known)
- [ ] All secrets in `.env.example` with dummy values, not actual keys
- [ ] Production dependencies are pinned in `pyproject.toml`
- [ ] Node modules and `.next/` build not committed
