# ✅ Pre-Deployment Verification Checklist

Run this checklist before pushing `main`:

## 1. Git Status Check

```bash
git status
```

**Should show:**

- ✅ `.gitignore` is ignoring `.env`, `.env.local`, `.venv`, `node_modules`, `.next/`, `*.db`
- ❌ Do NOT see `.env` files in the changes
- ❌ Do NOT see `node_modules/` in the changes
- ❌ Do NOT see `.next/` in the changes

## 2. Sensitive Files Check

```bash
# Verify .env files are NOT staged
git ls-files --cached | grep -i ".env"
# Should return NOTHING

# Verify API keys are NOT in code
grep -r "sk-or-v1-" backend/ --include="*.py"
grep -r "apify_api_" backend/ --include="*.py"
# Should return NOTHING (only in .env.example with dummy values)
```

## 3. Backend Build Test

```bash
cd backend

# Install dependencies
uv sync

# Test the app locally
uv run uvicorn main:app --reload --port 8000

# In another terminal, test health endpoint
curl http://localhost:8000/health

# Should return: {"status": "ok"}

# CTRL+C to stop
```

## 4. Frontend Build Test

```bash
cd frontend

# Install dependencies (if not already done)
npm install

# Build for production
npm run build

# Should complete with NO errors
# Watch for warnings about unused imports (can ignore)
```

## 5. Production URL Validation

Once you have both deployment URLs, verify:

**Render Backend URL:**

```
https://influencer-ai-backend.onrender.com/health
```

Should return `{"status": "ok"}`

**Vercel Frontend URL:**
Visit the URL and check DevTools Console for:

- ✅ No CORS errors
- ✅ Default roster loads
- ✅ API calls succeed

## 6. Environment Variables Check

### Backend (Render Dashboard)

Set these environment variables in Render:

```
OPENROUTER_API_KEY=sk-or-v1-... (or leave empty)
APIFY_API_KEY=apify_api_... (or leave empty)
DATABASE_PATH=/data/influencer_ai.db (auto-set)
CORS_ORIGINS=https://your-vercel-app.vercel.app,http://localhost:3000
```

### Frontend (Vercel Dashboard)

Set this environment variable in Vercel:

```
NEXT_PUBLIC_API_URL=https://influencer-ai-backend.onrender.com
```

## 7. Final Commit Check

```bash
# Verify what's being pushed
git diff --cached

# Should show ONLY:
# - Code changes in backend/ and frontend/
# - New files: DEPLOYMENT.md
# - Updated: render.yaml, .env.example, main.py

# Should NOT show:
# - .env or .env.local
# - node_modules/
# - .next/
# - __pycache__/
# - API keys
```

## 8. Deployment Order

1. **Push backend first:**

   ```bash
   git push origin main
   # Render will auto-build from render.yaml
   ```

2. **Get Render URL from Render Dashboard**

3. **Update Render dashboard with CORS_ORIGINS:**

   ```
   CORS_ORIGINS=https://your-vercel-app.vercel.app,http://localhost:3000
   ```

4. **Push frontend:**

   ```bash
   git push origin main
   # Vercel will auto-build
   ```

5. **Set Vercel environment variable:**
   ```
   NEXT_PUBLIC_API_URL=https://influencer-ai-backend.onrender.com
   ```

## 9. Post-Deployment Tests

### Backend Health

```bash
curl https://influencer-ai-backend.onrender.com/health
```

### Frontend Load

Visit `https://your-vercel-app.vercel.app` and:

- [ ] Page loads without errors
- [ ] Default roster auto-loads
- [ ] Can upload Excel file
- [ ] Can view analytics

### Database Persistence

- [ ] Upload test file
- [ ] Refresh page
- [ ] File still shows in analytics history

## 10. Troubleshooting Checklist

| Issue                             | Solution                                                      |
| --------------------------------- | ------------------------------------------------------------- |
| CORS error in browser console     | Update `CORS_ORIGINS` in Render environment variables         |
| Default roster won't load         | Check `assingment/influencer_database.xlsx` is in git repo    |
| Database errors on Render         | Check disk is mounted at `/data` in Render dashboard          |
| Frontend can't connect to backend | Verify `NEXT_PUBLIC_API_URL` is set correctly in Vercel       |
| Slow first load                   | Render free tier takes ~30s to wake up from sleep             |
| API keys not working              | Verify environment variables are set in respective dashboards |

---

## Critical Reminders

⚠️ **DO NOT COMMIT:**

- `.env` files with real API keys
- `.env.local` files
- `node_modules/` directory
- `.next/` build directory
- `__pycache__/` directories

✅ **DO COMMIT:**

- `.env.example` with dummy values
- All source code in `backend/` and `frontend/`
- `DEPLOYMENT.md` (this file)
- `render.yaml`

---

## Success Indicators

After deployment, you should see:

1. ✅ Backend running on Render
2. ✅ Frontend running on Vercel
3. ✅ Frontend can call backend API
4. ✅ Default roster loads automatically
5. ✅ File upload works
6. ✅ Analytics persists across sessions
7. ✅ No CORS errors in console
8. ✅ Health check endpoint responds
