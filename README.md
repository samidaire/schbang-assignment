# Influencer AI — Campaign Shortlisting Tool

An AI-powered platform that takes a raw Excel spreadsheet of influencer profiles and produces a **scored, budget-fitted, constraint-satisfying shortlist** with human-readable reasoning for every selection and rejection.

Built for the [Schbang](https://www.schbang.com/) hiring assignment: *AI + Influencer Marketing*.

---

## � Key Features

- **Auto-Loading Roster** — Page loads with optimized default roster, no upload needed
- **Intelligent Scoring** — Composite algorithm (0–100) weighing engagement, content quality, relevance, and more
- **Budget Optimization** — Greedy knapsack algorithm respects ₹15L budget while maximizing value
- **Constraint Satisfaction** — Enforces geographic diversity (Tier 2/3 ≥40%), competitor exclusions, influencer type mix
- **AI-Powered Reviews** — On-demand strategic reviews and personalized creative briefs
- **Campaign Tracking** — Historical snapshots with trends, analytics, and CMO insights
- **Graceful Degradation** — Works fully without API keys (fallback reviews, simulated data)
- **Production-Ready** — Deployed on Render (backend) and Vercel (frontend), free tier compatible

---

## 🏗 Architecture

```
influencer-ai-assignment/          ← monorepo root
├── backend/                       ← FastAPI (Python 3.14, uv)
│   ├── main.py                    ← App entry, lifespan, CORS
│   ├── config.py                  ← Settings from .env
│   ├── routers/
│   │   ├── analyze.py             ← POST /analyze (core pipeline)
│   │   ├── apify.py               ← GET /apify/* (live scraping)
│   │   ├── analytics.py           ← Campaign history & trends
│   │   └── health.py              ← GET /health, /health/ready
│   ├── services/
│   │   ├── excel_parser.py        ← Parse & normalize .xlsx data
│   │   ├── scorer.py              ← Composite scoring (0–100)
│   │   ├── shortlister.py         ← Greedy knapsack + constraints
│   │   ├── ai_service.py          ← OpenRouter AI reviews & briefs
│   │   ├── apify_service.py       ← Instagram/YouTube scraping
│   │   ├── db_service.py          ← SQLite operations
│   │   └── excel_parser.py        ← Data normalization
│   └── models/schemas.py          ← Pydantic response contracts
├── frontend/                      ← Next.js 16 (React 19, Tailwind v4)
│   ├── app/
│   │   ├── page.tsx               ← Full dashboard (3 tabs)
│   │   ├── layout.tsx             ← Root layout
│   │   └── globals.css            ← Global styles
│   ├── components/ui/             ← shadcn UI components
│   ├── lib/utils.ts               ← Utility functions
│   ├── next.config.ts             ← Next.js config
│   ├── package.json               ← Dependencies (npm)
│   └── .env.example               ← Environment template
├── SOLUTION_ARCHITECTURE.md       ← Detailed technical deep-dive
├── DEPLOYMENT.md                  ← Deployment instructions
├── DEPLOYMENT_CHECKLIST.md        ← Pre-deployment verification
├── DEPLOYMENT_QUICK_START.md      ← TL;DR deployment guide
├── part2_workflow_and_ai.md       ← Campaign workflow + curveballs
├── part4_internal_pitch.md        ← Internal pitch to business head
└── assingment/                    ← Original brief + raw data
    └── influencer_database.xlsx   ← Sample data (pre-loaded)
```

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.14+** with [uv](https://docs.astral.sh/uv/) package manager
- **Node.js 18+** with npm

### Backend

```bash
cd backend

# Install dependencies
uv sync

# Set up environment variables (both are optional)
cp .env.example .env
# Edit .env with your API keys (optional)

# Run the dev server
uv run uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000` with auto-docs at `/docs`.

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run the dev server
npm run dev
```

Open `http://localhost:3000` — default roster auto-loads!

---

## 📚 Technology Stack

### Backend

| Layer | Tech | Version | Why |
|-------|------|---------|-----|
| **Runtime** | Python | 3.14+ | Modern features, fast, uv for deterministic builds |
| **Framework** | FastAPI | 0.136+ | Async-first, auto-docs, production-grade |
| **Data** | Pandas | 3.0+ | Industry standard for Excel/DataFrames |
| **Database** | SQLite | 3 | Zero-config, persistent, ideal for free tier |
| **AI** | OpenRouter API | Latest | Multi-model access, free tier available |
| **Scraping** | Apify SDK | Latest | Instagram/YouTube, serverless, free tier available |
| **Server** | Uvicorn | 0.48+ | ASGI, production-ready |
| **Container** | Docker | Latest | Multi-stage build, free tier on Render |

### Frontend

| Layer | Tech | Version | Why |
|-------|------|---------|-----|
| **Framework** | Next.js | 16 | React 19 + RSC, optimized for Vercel |
| **Language** | TypeScript | 5+ | Type safety, better DX |
| **Styling** | Tailwind CSS | 4 | Utility-first, Google-colored theme |
| **Components** | shadcn/ui | Latest | Accessible, composable, customizable |
| **Icons** | Lucide React | 1.16+ | Lightweight, clean SVGs |
| **Deployment** | Vercel | - | Optimal Next.js experience, auto-scaling |

### Infrastructure

| Component | Service | Tier | Cost |
|-----------|---------|------|------|
| **Backend** | Render (Docker) | Free | $0 |
| **Frontend** | Vercel | Free | $0 |
| **Database** | SQLite on Render disk | 1GB | Included |
| **AI Models** | OpenRouter | Free tier | $0 (with key) or fallback |
| **Scraping** | Apify | Free tier | $0 (with key) or simulated |

---

## 🔑 Environment Variables

| Variable | Required | Purpose |
|:---------|:--------:|:--------|
| `OPENROUTER_API_KEY` | No* | AI-generated strategic reviews and creative briefs (free tier available) |
| `APIFY_API_KEY` | No* | Live Instagram/YouTube scraping for competitor audits (free tier available) |
| `CORS_ORIGINS` | No | Comma-separated list of allowed frontend origins (production security) |
| `DATABASE_PATH` | No | SQLite database path (auto-set to `/data/influencer_ai.db` on Render) |

*The tool works fully without any API keys — all features gracefully degrade to local fallbacks.

---

## 📊 How It Works (The Pipeline)

### 5-Step Shortlisting Pipeline

1. **Parse** — Upload `.xlsx` → clean DataFrame, estimate missing rates, classify city tiers and influencer types
2. **Score** — Composite 0–100 score: engagement rate (25%), content quality (20%), category relevance (15%), view-through rate (15%), response time (10%), experience (5%), red flag penalty (deductive)
3. **Shortlist** — Greedy knapsack: stays within ₹15L budget, enforces ≥40% Tier 2/3 city representation, ensures macro/mid/micro/nano diversity, hard-rejects competitor conflicts (Minimalist, mCaffeine, Mamaearth)
4. **Review** — AI-generated strategic reviews per influencer (or instant rule-based fallback if no API key)
5. **Respond** — Structured JSON with shortlisted/rejected lists, reasons, scores, budget summary

**See [SOLUTION_ARCHITECTURE.md](SOLUTION_ARCHITECTURE.md) for detailed algorithm breakdown.**

---

## 🤖 AI & Tools Used

### At Development Time

| Tool | Role |
|------|------|
| **Gemini (via Antigravity IDE)** | Pair-programming partner for architecture, code generation, debugging, and full-stack iteration |
| **Claude** (this one!) | System design, testing, deployment readiness, documentation |

### At Runtime

| Tool | Purpose | How It Works |
|------|---------|--------------|
| **OpenRouter API** | AI reviews & briefs | Calls `z-ai/glm-4.5-air` or `arcee-ai/trinity-large-thinking` to generate insights on-demand |
| **Apify SDK** | Competitor audits | Scrapes Instagram/YouTube posts to verify influencer exclusivity |
| **SQLite** | Campaign history | Stores campaign snapshots, enables trending and analytics |

**Graceful Fallback**: All AI features have intelligent rule-based fallbacks that work instantly without API keys.

---

## 📱 UI/UX

### Dashboard (Auto-Responsive)

- **Tab 1: Roster Optimizer**
  - View shortlisted influencers with scores and reasons
  - Filter by platform, influencer type, city tier
  - Sort by score, followers, or rate
  - Generate AI reviews and personalized creative briefs on-demand
  - Upload custom Excel file for analysis

- **Tab 2: Exclusivity Auditor**
  - Enter influencer handle
  - Scrape recent posts (live or simulated)
  - Check for competitor conflicts
  - See posts that caused conflicts

- **Tab 3: Analytics & Trends**
  - Campaign history table (all uploads)
  - Trends graph over time (weekly/monthly/quarterly)
  - Select metric: budget, engagement, score, creator count
  - Generate AI CMO insights on demand

**Mobile Optimized**: Fully responsive, grid adapts to screen size

---

## 🚢 Deployment

### Current Deployment

- **Backend**: Render (Docker container, free tier)
- **Frontend**: Vercel (serverless, free tier)
- **Database**: SQLite on Render persistent disk (1GB)

### Deployment Status

✅ **Backend**: Live on Render  
✅ **Frontend**: Live on Vercel  
✅ **CORS**: Configured for production  
✅ **Database**: Persistent and seeded  
✅ **Monitoring**: Health checks enabled  

**See [DEPLOYMENT_QUICK_START.md](DEPLOYMENT_QUICK_START.md) for 5-minute setup.**

---

## 📋 Assignment Parts Covered

| Part | Deliverable | Location |
|:-----|:------------|:---------|
| **Part 1** | Shortlist from the data | Automated — upload the spreadsheet, get scored shortlist with reasons |
| **Part 2** | Campaign workflow + AI opportunities | [`part2_workflow_and_ai.md`](part2_workflow_and_ai.md) |
| **Part 3** | Build a working tool | This entire repo — FastAPI backend + Next.js frontend, production-deployed |
| **Part 4** | Sell it internally | [`part4_internal_pitch.md`](part4_internal_pitch.md) |

---

## 🔗 Documentation

- **[SOLUTION_ARCHITECTURE.md](SOLUTION_ARCHITECTURE.md)** — Comprehensive technical deep-dive (system design, algorithms, API reference, database schema)
- **[DEPLOYMENT.md](DEPLOYMENT.md)** — Full deployment guide with environment setup
- **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** — Pre-deployment verification steps
- **[DEPLOYMENT_QUICK_START.md](DEPLOYMENT_QUICK_START.md)** — TL;DR deployment (5 minutes)
- **[part2_workflow_and_ai.md](part2_workflow_and_ai.md)** — Campaign workflow + curveballs
- **[part4_internal_pitch.md](part4_internal_pitch.md)** — Business pitch to leadership

---

## 🎓 Key Insights

### Algorithmic Innovation
- **Greedy Knapsack + Constraints**: Maximizes campaign value (score) while respecting budget and business rules
- **Composite Scoring**: Balanced weights ensure no single metric dominates
- **Graceful Degradation**: AI features work with or without external APIs

### System Design
- **Monorepo**: Unified versioning, shared documentation
- **Async-First**: FastAPI's async handlers for high throughput
- **Type Safety**: TypeScript + Pydantic for runtime validation
- **Production-Ready**: Docker, CORS, error handling, logging from day one

### User Experience
- **Auto-Loading**: Default roster loads instantly (no manual upload)
- **Explainability**: Every decision has human-readable reasoning
- **Progressive Enhancement**: Advanced features (AI reviews, briefs) optional, core works offline

---

## 📊 Performance

| Metric | Value |
|--------|-------|
| **First Page Load** | ~1-2 seconds (static) |
| **Default Roster Load** | ~500ms (API + network) |
| **Excel Upload Processing** | ~2-5 seconds (parsing + scoring + shortlisting) |
| **AI Review Generation** | ~3-5 seconds (OpenRouter) or instant (fallback) |
| **Database Query** | <100ms (SQLite) |
| **Cold Start (Render free tier)** | ~30 seconds (acceptable for free tier) |

---

## 🔒 Security

- ✅ **CORS**: Restricted to production domains (environment-based)
- ✅ **Secrets**: API keys never hardcoded, managed via environment variables
- ✅ **SQL Injection**: Pydantic + parameterized queries prevent injection
- ✅ **File Upload**: Validation on file type and size
- ✅ **HTTPS**: Enforced on production (Render + Vercel handle this)

---

## 🤝 Contributing

This is a portfolio project built for the Schbang hiring assignment. Not open for contributions at this time.

---

## 📜 License

Built for the Schbang hiring assignment. Not licensed for production use without explicit permission.

---

## 📞 Questions?

See [SOLUTION_ARCHITECTURE.md](SOLUTION_ARCHITECTURE.md) for the comprehensive technical guide.

