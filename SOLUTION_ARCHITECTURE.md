# Influencer AI — Solution Architecture & Technical Deep Dive

## Table of Contents

1. [Executive Overview](#executive-overview)
2. [Tech Stack](#tech-stack)
3. [System Architecture](#system-architecture)
4. [Core Pipeline](#core-pipeline)
5. [API Reference](#api-reference)
6. [Database Schema](#database-schema)
7. [UI/UX Flow](#uiux-flow)
8. [Deployment Architecture](#deployment-architecture)
9. [Performance & Scalability](#performance--scalability)
10. [Graceful Degradation](#graceful-degradation)

---

## Executive Overview

**Influencer AI** is a full-stack AI-powered platform that automates influencer campaign shortlisting. It solves the core problem:

> _"Given a messy spreadsheet of influencer profiles, produce a budget-optimized, constraint-satisfying shortlist with explainable reasoning for every decision."_

**Key Innovation**: Uses a **greedy knapsack algorithm** with **composite AI scoring** to maximize campaign value while satisfying rigid business constraints (budget, geographic diversity, competitor exclusivity).

---

## Tech Stack

### Backend

| Layer               | Technology         | Why                                                                 |
| ------------------- | ------------------ | ------------------------------------------------------------------- |
| **Runtime**         | Python 3.14 + `uv` | Fast, deterministic dependency management; modern Python features   |
| **Framework**       | FastAPI 0.136+     | Async-first, auto-documentation, production-ready                   |
| **Data Processing** | Pandas 3.0+        | Industry-standard for Excel parsing and DataFrames                  |
| **Database**        | SQLite 3           | Zero-config, persistent, file-based (ideal for Render free tier)    |
| **AI Integration**  | OpenRouter API     | Access multiple LLM models via single API (fallback-friendly)       |
| **Web Scraping**    | Apify SDK          | Serverless Instagram/YouTube scraping (optional, graceful fallback) |
| **Server**          | Uvicorn 0.48+      | ASGI server, production-grade                                       |
| **Deployment**      | Docker + Render    | Container-native, free tier available                               |

### Frontend

| Layer                | Technology                | Why                                          |
| -------------------- | ------------------------- | -------------------------------------------- |
| **Framework**        | Next.js 16 (React 19)     | Server-side rendering, optimized for Vercel  |
| **Language**         | TypeScript                | Type safety, better DX                       |
| **Styling**          | Tailwind CSS v4           | Utility-first, production-optimized          |
| **UI Components**    | shadcn/ui + custom        | Accessible, composable, Google-colored theme |
| **State Management** | React hooks + local state | Minimal dependencies, fast client-side logic |
| **Icons**            | Lucide React + custom SVG | Lightweight, customizable                    |
| **Deployment**       | Vercel                    | Optimal Next.js experience, auto-scaling     |

### Infrastructure

| Component            | Service                          | Cost                |
| -------------------- | -------------------------------- | ------------------- |
| **Backend Compute**  | Render (Docker)                  | Free tier           |
| **Frontend Hosting** | Vercel                           | Free tier           |
| **Database**         | SQLite on Render persistent disk | Included (1GB)      |
| **AI Models**        | OpenRouter (free tier)           | Free tier available |
| **Web Scraping**     | Apify (free tier)                | Free tier available |

---

## System Architecture

### Monorepo Structure

```
influencer-ai-assignment/
├── backend/
│   ├── main.py                          ← FastAPI app + lifespan + CORS
│   ├── config.py                        ← Settings + environment vars
│   ├── routers/
│   │   ├── analyze.py                   ← Core shortlisting pipeline
│   │   ├── apify.py                     ← Competitor scraping endpoints
│   │   ├── analytics.py                 ← Campaign history & trends
│   │   └── health.py                    ← Health checks
│   ├── services/
│   │   ├── excel_parser.py              ← Parse & normalize data
│   │   ├── scorer.py                    ← Composite scoring algorithm
│   │   ├── shortlister.py               ← Greedy knapsack optimization
│   │   ├── ai_service.py                ← OpenRouter API integration
│   │   ├── apify_service.py             ← Apify SDK integration
│   │   ├── db_service.py                ← SQLite operations
│   │   └── shortlister.py               ← Knapsack + constraints
│   ├── models/
│   │   └── schemas.py                   ← Pydantic response contracts
│   ├── Dockerfile                       ← Production image (multi-stage)
│   ├── pyproject.toml                   ← Dependencies (uv)
│   └── .env.example                     ← Environment template
├── frontend/
│   ├── app/
│   │   ├── page.tsx                     ← Full dashboard (3 tabs)
│   │   ├── layout.tsx                   ← Root layout
│   │   └── globals.css                  ← Global styles
│   ├── components/
│   │   ├── ui/                          ← shadcn UI components
│   │   └── ...                          ← Custom components
│   ├── lib/
│   │   └── utils.ts                     ← Utility functions
│   ├── next.config.ts                   ← Next.js configuration
│   ├── tailwind.config.ts               ← Tailwind configuration
│   ├── package.json                     ← Dependencies (npm)
│   └── .env.example                     ← Environment template
├── DEPLOYMENT.md                        ← Full deployment guide
├── DEPLOYMENT_CHECKLIST.md              ← Pre-deployment checks
├── SOLUTION_ARCHITECTURE.md             ← This file
├── part2_workflow_and_ai.md             ← Campaign workflow
├── part4_internal_pitch.md              ← Business pitch
└── assingment/
    └── influencer_database.xlsx         ← Sample data
```

### Request Flow Diagram

```
┌─────────────────┐
│   User (Web)    │
└────────┬────────┘
         │
         ↓ (HTTPS)
┌─────────────────────────────────────┐
│   Frontend (Vercel/Next.js)         │
│ - Auto-load default roster          │
│ - Upload Excel file                 │
│ - Filter & sort results             │
│ - Manage analytics                  │
└────────┬────────────────────────────┘
         │
         ↓ (REST API + CORS)
┌─────────────────────────────────────┐
│   Backend (Render/FastAPI)          │
│                                     │
│ [1] POST /analyze                   │
│     └→ Excel → Parse → Score →      │
│        Shortlist → AI Review        │
│                                     │
│ [2] GET /analyze/default            │
│     └→ Load default Excel file      │
│                                     │
│ [3] POST /live-review               │
│     └→ Generate AI review on-demand │
│                                     │
│ [4] POST /live-brief                │
│     └→ Generate creative brief      │
│                                     │
│ [5] GET /analytics/campaigns        │
│     └→ Fetch campaign history       │
│                                     │
│ [6] GET /apify/audit                │
│     └→ Scrape Instagram/YouTube     │
└────────┬────────────────────────────┘
         │
         ↓
┌─────────────────┐
│  Integrations   │
├─────────────────┤
│ OpenRouter API  │ (AI reviews)
│ Apify SDK       │ (Scraping)
│ SQLite          │ (Database)
└─────────────────┘
```

---

## Core Pipeline

### 1. Excel Parsing (`excel_parser.py`)

**Input**: Excel file (`.xlsx` or `.xls`)

**Process**:

- Read all sheets, find one with influencer profiles
- Normalize column names (handle variations)
- Extract core fields: Name, Handle, Platform, Followers, Engagement Rate, etc.
- **Missing rate estimation**: If rate not provided, estimate from engagement proxy
- **City tier classification**: Map city to Tier 1 or Tier 2/3
- **Influencer type classification**: Based on follower count:
  - Macro: 500K+ followers
  - Mid: 100K–500K followers
  - Micro: 10K–100K followers
  - Nano: <10K followers

**Output**: Clean Pandas DataFrame ready for scoring

### 2. Scoring (`scorer.py`)

**Algorithm**: Weighted composite score (0–100)

```python
score = (
    engagement_rate_score * 0.25 +          # 25%
    content_quality_score * 0.20 +          # 20%
    category_relevance_score * 0.15 +       # 15%
    view_through_rate_score * 0.15 +        # 15%
    response_time_score * 0.10 +            # 10%
    experience_score * 0.05 -               # 5%
    red_flag_penalty                        # Deductive
)
```

**Component Scores** (each 0–100):

- **Engagement Rate**: Linear mapping (2% → 50 pts, 5% → 100 pts)
- **Content Quality**: Hardcoded categories (Excellent → 100, Good → 80, etc.)
- **Category Relevance**: Exact match → 100, partial → 50, none → 0
- **View-Through Rate**: Linear mapping from avg reel views
- **Response Time**: Faster response → higher score
- **Experience**: Years in industry + past collabs
- **Red Flags**: Competitor conflicts (hard-reject), ethical issues (penalty)

**Output**: Each influencer has a `score` field (0–100)

### 3. Shortlisting (`shortlister.py`)

**Algorithm**: Greedy knapsack with constraints

**Constraints**:

1. **Budget**: Total spend ≤ ₹15 Lakhs (1,500,000)
2. **Tier 2/3 representation**: ≥40% of shortlist from Tier 2/3 cities
3. **Influencer diversity**: Mix of Macro, Mid, Micro, Nano
4. **Competitor exclusion**: Hard-reject anyone who collaborated with:
   - Minimalist
   - mCaffeine
   - Mamaearth
     (last 90 days)

**Greedy Strategy**:

1. Sort by score (descending)
2. Iterate: Add influencer if:
   - Budget remaining ≥ influencer's rate
   - Tier 2/3 constraint not violated (look-ahead)
   - No competitor conflicts
   - Diversity maintained
3. Return shortlisted and rejected lists with reasons

**Output**:

```json
{
  "shortlisted": [
    {
      "Name": "...",
      "score": 85.5,
      "reasons": ["High engagement", "Budget fit", ...],
      ...
    }
  ],
  "rejected": [
    {
      "Name": "...",
      "score": 45.0,
      "rejection_reasons": ["Competitor conflict", ...],
      ...
    }
  ],
  "total_shortlisted": 25,
  "total_rejected": 15,
  "budget_used": 1200000,
  "remaining_budget": 300000,
  "tier23_percentage": 42.5
}
```

### 4. AI Reviews (`ai_service.py`)

**Fallback Reviews** (Rule-Based):

- Generated instantly without API calls
- Detailed, contextual, based on influencer data
- Example: _"Strong performer with 4.2% engagement rate and proven brand collaboration history. Recommended for mainstream awareness campaigns."_

**Live AI Reviews** (On-Demand, OpenRouter):

- User clicks "Generate AI Review"
- Calls OpenRouter with influencer context
- Models: `z-ai/glm-4.5-air` (fast, free) or `arcee-ai/trinity-large-thinking` (thoughtful)
- Response: Strategic positioning, risk factors, brand fit assessment

**Creative Briefs** (On-Demand, OpenRouter):

- User clicks "Generate Brief" on shortlisted influencer
- Generates personalized script + visual directions + tonality guidance
- Structured with sections: Hook, Brand Claims, Script, Tonality, Compliance

### 5. Analytics & Trends (`analytics.py`)

**Campaign History**:

- Stores each upload as a campaign snapshot
- Tracks: upload date, shortlist size, budget used, engagement metrics, Tier 2/3 %
- Persists in SQLite

**Trends**:

- Aggregates campaigns by interval (weekly, monthly, quarterly)
- Computes average metrics per period
- Shows budget trends, engagement trends, creator count over time

---

## API Reference

### Core Endpoints

#### `POST /analyze`

Upload Excel file and get instant shortlist.

**Request**:

```
POST /analyze
Content-Type: multipart/form-data

file: [Excel file]
```

**Response** (200):

```json
{
  "shortlisted": [...],
  "rejected": [...],
  "total_shortlisted": 25,
  "total_rejected": 15,
  "budget_used": 1200000,
  "remaining_budget": 300000,
  "tier23_percentage": 42.5
}
```

**Status Codes**:

- `200`: Success
- `400`: Invalid file format
- `500`: Parsing/scoring error

---

#### `GET /analyze/default`

Load pre-optimized roster from default Excel file.

**Response** (200):
Same as `POST /analyze`

**Use Case**: Auto-loads on page load (no upload needed)

---

#### `POST /live-review`

Generate AI review for a single influencer.

**Request**:

```json
{
  "influencer": {
    "Name": "...",
    "Handle": "...",
    "Platform": "Instagram",
    "Followers": 150000,
    "Engagement Rate (%)": 4.2,
    ...
  }
}
```

**Response** (200):

```json
{
  "ai_review": "Strategic positioning for mainstream awareness..."
}
```

---

#### `POST /live-brief`

Generate personalized creative brief.

**Request**:

```json
{
  "influencer": {
    "Name": "...",
    ...
  }
}
```

**Response** (200):

```json
{
  "brief": "## Campaign Creative Brief\n\n### 1. Hook & Angle\n..."
}
```

---

#### `GET /analytics/campaigns`

Fetch all campaign snapshots.

**Response** (200):

```json
[
  {
    "id": 1,
    "campaign_name": "Campaign - influencer_database.xlsx",
    "uploaded_at": "2026-05-20T10:30:00",
    "total_shortlisted": 25,
    "total_rejected": 15,
    "budget_used": 1200000,
    "remaining_budget": 300000,
    "tier23_percentage": 42.5,
    "avg_engagement_rate": 4.1,
    "avg_score": 78.5
  }
]
```

---

#### `GET /analytics/trends?interval=monthly`

Fetch campaign trends over time.

**Query Parameters**:

- `interval`: `weekly`, `monthly`, or `quarterly`

**Response** (200):

```json
[
  {
    "period": "May 2026",
    "avg_budget_used": 1150000,
    "avg_engagement_rate": 4.0,
    "avg_score": 77.8,
    "num_campaigns": 4
  }
]
```

---

#### `GET /apify/audit?handle=USERNAME&platform=instagram&lookback=90`

Audit an influencer for competitor conflicts.

**Query Parameters**:

- `handle`: Instagram/YouTube handle
- `platform`: `instagram` or `youtube`
- `lookback`: Days to search (default 90)

**Response** (200):

```json
{
  "username": "USERNAME",
  "platform": "instagram",
  "has_competitor_conflict": false,
  "conflict_count": 0,
  "conflicts": [],
  "posts_scraped": 45
}
```

**Falls back to simulated data if Apify key missing**

---

#### `GET /health`

Health check endpoint.

**Response** (200):

```json
{
  "status": "ok"
}
```

---

## Database Schema

### SQLite: `influencer_ai.db`

#### Table: `campaigns`

```sql
CREATE TABLE campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_name TEXT NOT NULL,
  uploaded_at TEXT NOT NULL,           -- ISO 8601 timestamp
  total_shortlisted INTEGER NOT NULL,
  total_rejected INTEGER NOT NULL,
  budget_used REAL NOT NULL,           -- ₹ (Rupees)
  remaining_budget REAL NOT NULL,
  tier23_percentage REAL NOT NULL,     -- Percentage
  avg_engagement_rate REAL NOT NULL,   -- Percentage
  avg_score REAL NOT NULL              -- 0-100
);
```

**Auto-Seeded**: Historical campaign data from the last 11 months (12 seed points)

**Persistence**: Stored on Render persistent disk at `/data/influencer_ai.db`

---

## UI/UX Flow

### Tab 1: Roster Optimizer

**Initial Load**:

1. Page loads
2. Auto-fetches default roster via `GET /analyze/default`
3. Shows loading spinner while fetching
4. Displays results dashboard

**User Actions**:

- View shortlisted/rejected influencers
- Filter by platform, influencer type, city tier
- Sort by score, followers, or rate
- Expand individual cards for details
- Click "Generate AI Review" for live AI insights
- Click "Generate Brief" for personalized creative script
- Click "Upload Different File" to analyze custom Excel

### Tab 2: Exclusivity Auditor

**Workflow**:

1. User enters influencer handle
2. Selects platform (Instagram/YouTube)
3. Clicks "Audit"
4. System scrapes recent posts (live via Apify or simulated)
5. Checks for competitor mentions
6. Returns conflict assessment

### Tab 3: Analytics & Trends

**Campaign History**:

- Table of all uploaded campaigns
- Sortable by date, budget, engagement
- Delete button per campaign

**Trends Graph**:

- Timeline of average metrics
- Toggle between weekly/monthly/quarterly
- Select metric: budget, engagement, score, creator count
- Hover for details

**AI CMO Insights**:

- Click button to generate strategic insights
- Uses campaign history to provide recommendations

### Mobile Responsive

- Dashboard grid adapts to mobile
- Cards collapse on small screens
- Tabs remain accessible

---

## Deployment Architecture

### Backend (Render)

**Infrastructure**:

- Docker container (Python 3.14-slim)
- Free tier: 750 hours/month
- Region: Oregon
- Auto-scaling: Yes (free tier)

**Configuration** (`render.yaml`):

- Multi-stage Docker build (deps + runtime)
- Persistent disk at `/data` (1GB, free tier)
- Health check every 10 minutes
- Environment variables managed via Render dashboard

**Startup**:

1. Docker image built
2. Virtualenv copied from build stage
3. Database initialized at `/data/influencer_ai.db`
4. Uvicorn server starts on port 10000 (Render default)
5. Health endpoint verified

**Cold Start**: ~30 seconds (free tier sleeps after inactivity)

### Frontend (Vercel)

**Infrastructure**:

- Serverless Next.js deployment
- Free tier: Unlimited deployments
- Auto-scaling: Serverless functions
- CDN: Global edge network

**Configuration**:

- Environment variable: `NEXT_PUBLIC_API_URL`
- Set to your Render backend URL
- Rebuilt on every push to main

**Build**:

1. Git push triggers Vercel
2. Next.js build: `npm run build`
3. Static assets optimized
4. Deployed to edge locations

**Performance**:

- First page load: ~1-2 seconds (static)
- API call: ~500ms (Render backend + network)

---

## Performance & Scalability

### Current Constraints (Free Tier)

| Constraint          | Limit                       | Mitigation                                 |
| ------------------- | --------------------------- | ------------------------------------------ |
| **Backend Compute** | 750 hrs/month (Render free) | Sufficient for demo/MVP                    |
| **Database**        | 1GB disk (Render free)      | ~100K campaign records possible            |
| **API Calls**       | OpenRouter free tier        | Limited requests/month (graceful fallback) |
| **Cold Start**      | ~30s wake-up time           | Users accept delay for free tier           |

### Optimization Strategies

1. **Lazy Loading**: Analytics only fetched when tab opened
2. **Caching**: Campaign history cached in browser state
3. **AI Fallback**: Rule-based reviews generated instantly (no API wait)
4. **Database Indexing**: Could add on timestamp, campaign_name
5. **Image Optimization**: Next.js automatic image optimization

### Scaling Path (Production)

To scale to production:

1. **Backend**: Render Starter plan ($7/month) → Standard plan ($12+)
2. **Database**: Migrate to PostgreSQL (RDS/Neon)
3. **AI**: Use cached reviews, batch API calls
4. **CDN**: Add Cloudflare for caching
5. **Load Testing**: Use k6 or JMeter

---

## Graceful Degradation

### Missing API Keys

The app is designed to work **without** external API keys:

| Feature               | With Key               | Without Key                    |
| --------------------- | ---------------------- | ------------------------------ |
| **Live AI Reviews**   | ✅ Real LLM responses  | ✅ Detailed rule-based reviews |
| **Creative Briefs**   | ✅ AI-generated        | ✅ Template-based              |
| **Competitor Audits** | ✅ Live scraping       | ✅ Simulated data (realistic)  |
| **Shortlisting**      | ✅ AI-enhanced scoring | ✅ Rule-based scoring (same)   |

### Error Handling

**Backend**:

- Database connection fails → Logs error, continues
- Excel parsing error → Returns 400 with message
- AI API timeout → Falls back to rule-based review
- Missing environment variables → Gracefully degrades

**Frontend**:

- API unreachable → Shows error message + fallback option
- Browser disconnects → Saves state to localStorage
- File upload fails → Shows error with retry option

---

## Key Features

### 1. Auto-Loading Default Roster

- Page loads → immediately fetches optimized roster
- No manual upload needed for demo
- User can still upload custom files

### 2. Explainable Decisions

- Every shortlisted influencer has a reasoning list
- Every rejection has explicit rejection reasons
- Scores broken down by component

### 3. Budget Optimization

- Greedy algorithm respects ₹15L budget
- Shows remaining budget in real-time
- Prevents over-committing

### 4. Constraint Satisfaction

- Tier 2/3 geographic diversity enforced
- Competitor exclusions applied
- Influencer type mix maintained

### 5. Campaign Tracking

- Historical campaign snapshots saved
- Analytics dashboard shows trends
- Compare performance across uploads

### 6. AI-Powered Insights

- On-demand strategic reviews
- Personalized creative briefs
- CMO-level strategic recommendations

---

## Testing & Debugging

### Local Testing

```bash
# Backend
cd backend
uv sync
uv run uvicorn main:app --reload

# Test endpoint
curl http://localhost:8000/health

# Test with sample file
curl -F "file=@../assingment/influencer_database.xlsx" http://localhost:8000/analyze
```

### Frontend Testing

```bash
cd frontend
npm run dev
# Open http://localhost:3000
```

### Production Testing

- Render: Check backend logs in dashboard
- Vercel: Check frontend logs in dashboard
- Use browser DevTools Network tab to debug API calls

---

## Future Enhancements

1. **Batch Processing**: Upload multiple files, compare results
2. **Custom Constraints**: User-defined budget, city preferences
3. **A/B Testing**: Compare different shortlisting algorithms
4. **Real-Time Collaboration**: Multiple users edit same roster
5. **Export**: PDF reports, CSV downloads
6. **Integration**: Slack notifications, HubSpot sync
7. **Advanced Analytics**: Cohort analysis, retention modeling
8. **Competitor Tracking**: Continuous monitoring of influencer exclusivity

---

## Summary

**Influencer AI** demonstrates:

- ✅ Full-stack system design (frontend + backend + DB)
- ✅ Complex algorithmic thinking (knapsack + constraints)
- ✅ AI integration (OpenRouter, Apify)
- ✅ Production-ready architecture (Docker, CORS, error handling)
- ✅ User experience (auto-loading, responsive UI, explanations)
- ✅ Graceful degradation (works without API keys)
- ✅ Scalable foundation (can grow from free tier to production)

Built with **Python, FastAPI, React, Next.js, Tailwind CSS, and TypeScript** on **Render + Vercel** infrastructure.
