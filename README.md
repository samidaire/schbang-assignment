# Influencer AI — Campaign Shortlisting Tool

An AI-powered platform that takes a raw Excel spreadsheet of influencer profiles and produces a **scored, budget-fitted, constraint-satisfying shortlist** with human-readable reasoning for every selection and rejection.

Built for the [Schbang](https://www.schbang.com/) hiring assignment: *AI + Influencer Marketing*.

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
│   │   └── health.py              ← GET /health, /health/ready
│   ├── services/
│   │   ├── excel_parser.py        ← Parse & normalize .xlsx data
│   │   ├── scorer.py              ← Composite scoring (0–100)
│   │   ├── shortlister.py         ← Greedy knapsack + constraints
│   │   ├── ai_service.py          ← OpenRouter AI reviews & briefs
│   │   └── apify_service.py       ← Instagram/YouTube scraping
│   └── models/schemas.py          ← Pydantic response contracts
├── frontend/                      ← Next.js 15 (React, Tailwind v4)
│   └── app/page.tsx               ← Full dashboard UI
├── part2_workflow_and_ai.md       ← Campaign workflow + curveballs
├── part4_internal_pitch.md        ← Internal pitch to business head
└── assingment/                    ← Original brief + raw data
    └── influencer_database.xlsx
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

# Set up environment variables (both are optional — see below)
cp .env.example .env
# Edit .env with your API keys

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

Open `http://localhost:3000` and upload the Excel file.

---

## 🔑 Environment Variables

| Variable | Required | Purpose |
|:---------|:--------:|:--------|
| `OPENROUTER_API_KEY` | No | Powers AI-generated strategic reviews and creative briefs via [OpenRouter](https://openrouter.ai). Without it, the app uses rule-based fallback reviews that are still detailed and accurate. |
| `APIFY_API_KEY` | No | Enables live Instagram/YouTube scraping for competitor exclusivity audits via [Apify](https://apify.com). Without it, the app returns realistic simulated data for demo purposes. |

**The tool works fully without any API keys** — all features gracefully degrade to local fallbacks.

---

## 📊 How It Works (The Pipeline)

1. **Parse** — Upload `.xlsx` → clean DataFrame, estimate missing rates, classify city tiers and influencer types
2. **Score** — Composite 0–100 score: engagement rate (25%), content quality (20%), category relevance (15%), view-through rate (15%), response time (10%), experience (5%), red flag penalty (deductive)
3. **Shortlist** — Greedy knapsack: stays within ₹15L budget, enforces ≥40% Tier 2/3 city representation, ensures macro/mid/micro/nano diversity, hard-rejects competitor conflicts (Minimalist, mCaffeine, Mamaearth)
4. **Review** — AI-generated strategic reviews per influencer (or instant rule-based fallback)
5. **Respond** — Structured JSON with shortlisted/rejected lists, reasons, scores, budget summary

---

## 🤖 AI Tools Used

This project was built with significant AI assistance. Here's exactly what was used and how:

| Tool | How It Was Used |
|:-----|:----------------|
| **Gemini (via Antigravity IDE)** | Pair-programming partner for architecture design, code generation, debugging, and iterating on the full-stack implementation |
| **OpenRouter API** (free tier) | Runtime AI — generates strategic influencer reviews and personalized creative briefs using `z-ai/glm-4.5-air` and `arcee-ai/trinity-large-thinking` models |
| **Apify** | Runtime scraping — fetches recent Instagram posts and YouTube videos to verify competitor exclusivity (solves Curveball 1 from Part 2) |

The codebase was written collaboratively with AI, with human judgment applied to architecture decisions, constraint logic, and assignment alignment.

---

## 📋 Assignment Parts Covered

| Part | Deliverable | Location |
|:-----|:------------|:---------|
| **Part 1** | Shortlist from the data | Automated via the tool — upload the spreadsheet, get scored shortlist with reasons |
| **Part 2** | Campaign workflow + AI opportunities | [`part2_workflow_and_ai.md`](part2_workflow_and_ai.md) |
| **Part 3** | Build a working tool | This entire repo — FastAPI backend + Next.js frontend |
| **Part 4** | Sell it internally | [`part4_internal_pitch.md`](part4_internal_pitch.md) |

---

## 📜 License

Built for the Schbang hiring assignment. Not licensed for production use.
