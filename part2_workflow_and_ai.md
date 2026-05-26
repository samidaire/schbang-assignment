# Part 2: Campaign Workflow Mapping & AI Opportunities

This document maps the end-to-end influencer campaign workflow for the skincare brand's serum launch, identifying high-leverage AI opportunities and addressing the mid-campaign curveballs.

---

## 1. End-to-End Campaign Workflow

We have mapped the workflow into 6 distinct stages, categorizing each step by its level of automation:
1. **Fully Automatable (AI-Only)**: Zero human effort needed.
2. **AI-Assisted (Co-Pilot)**: AI does the heavy lifting, humans review and approve.
3. **Human-Only**: Creative oversight, relationships, and strategic signing where AI is inappropriate.

### Stage 1: Discovery & Shortlisting
| Step | Category | Input | Output | Tools/Models | Human Check / Why Human? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1.1 Data Cleaning & Parsing** | **Fully Automatable** | Raw Excel spreadsheet from databases | Normalized database with estimated rates | Python, Pandas, OpenPyXL | None. Pure mathematical and parsing logic. |
| **1.2 Multi-Weighted Scoring** | **Fully Automatable** | Cleared influencer profiles | Composite scores (0-100) and flagged red flags | Python Scorer Service | None. Scoring follows brand-fit rules. |
| **1.3 Exclusivity Verification** | **AI-Assisted** | Social handles (IG/YT) | Exclusivity report (competitor posts in 90 days) | Apify Scrapers (`apify~instagram-scraper`, `apify~youtube-scraper`) + LLM | **Human check**: Review LLM-flagged posts to verify if they are paid collabs or organic reviews. |
| **1.4 Optimization & Selection** | **Fully Automatable** | Scored database, budget limit (₹15L), city tier (≥40% Tier 2/3), diversity constraints | Optimal shortlisted roster | Greedy Knapsack Roster Optimizer | None. Solved via programmatic constraint satisfaction. |

### Stage 2: Strategy & Creative Briefing
| Step | Category | Input | Output | Tools/Models | Human Check / Why Human? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **2.1 Roster Review & Selection** | **Human-Only** | Shortlisted roster and AI reviews | Final approved signing list | None | **Human-Only**: Brand manager reviews AI recommendations to ensure perfect subjective "vibe" fit. |
| **2.2 Personalized Brief Generation** | **AI-Assisted** | Brand guidelines + Influencer's historical top posts | Highly tailored creative brief per influencer | OpenRouter (Gemini 1.5 Pro / GPT-4o) | **Human check**: Influencer managers verify the briefs match the brand's exact skincare medical claims. |

### Stage 3: Outreach & Contracting
| Step | Category | Input | Output | Tools/Models | Human Check / Why Human? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **3.1 High-Volume Outreach** | **AI-Assisted** | Personalized brief, influencer contact info | Drafted outreach emails/DMs | OpenRouter (GPT-4o Mini) + Lemlist | **Human check**: Review and click "send" to maintain personal rapport with key macro creators. |
| **3.2 Rate Negotiation** | **Human-Only** | Counter-offers from influencers | Final agreed contract and price | None | **Human-Only**: Negotiation requires emotional intelligence, relationship building, and long-term brand equity. |

### Stage 4: Content Production & Approvals
| Step | Category | Input | Output | Tools/Models | Human Check / Why Human? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **4.1 Script & Draft Pre-Screening** | **AI-Assisted** | Influencer scripts/video drafts | Compliance scorecard (skincare claims, brand guidelines) | OpenRouter (Gemini 1.5 Pro for video multimodal review) | **Human check**: Human compliance officer does final review before giving a green light. |
| **4.2 Multimodal Quality Control** | **AI-Assisted** | Video file submitted by influencer | Automated transcript, caption check, logo placement check | Whisperspeech + Gemini 1.5 Pro | **Human check**: Brand manager reviews the actual pacing, aesthetic quality, and human feel of the reel/video. |

### Stage 5: Campaign Launch & Mid-Campaign Monitoring
| Step | Category | Input | Output | Tools/Models | Human Check / Why Human? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **5.1 Post-Live Exclusivity Audits** | **Fully Automatable** | Signed influencers' active handles | Active breach alarms | Apify Scrapers + Keyword checking | **Human check**: Only required if a breach alarm fires, triggering contract suspension review. |
| **5.2 Silent Creator Detection** | **Fully Automatable** | Contract signing date, due dates, social media activity | Activity status tracker (active/silent alert) | Apify Profile Scrapers | **Human check**: Account manager picks up the phone to call creator if the system triggers a silence alarm. |

### Stage 6: Reporting & Performance Analytics
| Step | Category | Input | Output | Tools/Models | Human Check / Why Human? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **6.1 Data Aggregation** | **Fully Automatable** | Live video URLs, likes, shares, comments | Aggregated engagement and VTR metrics | Apify + Python Pandas | None. Automated metric harvesting. |
| **6.2 Performance Report Draft** | **AI-Assisted** | Campaign metrics, ROI charts | Synthesized D2C performance report | OpenRouter (Claude 3.5 Sonnet) | **Human check**: Agency head translates AI findings into executive recommendations for the brand client. |

---

## 2. Resolving the Mid-Campaign Curveballs

### 🔴 Curveball 1: Exclusivity Breach (Week 2)
> *Scenario: You discover that 4 influencers from your shortlist posted competitor content (Minimalist) in the last 10 days—after you'd already signed them.*

#### **Systemic Response:**
1. **Automated Detection (The Shield)**: Our backend system runs a weekly scheduled task calling `services/apify_service.py` to scrape the last 10 posts of all signed influencers. 
2. **Immediate Alerting**: If the tilde-scrapers detect a keyword match ("Minimalist", "mCaffeine", "Mamaearth") in their caption, the backend fires an high-priority Slack/Email alert to the account manager with the exact post URL, brand, and date.
3. **Contractual Quarantine (Human Action)**: The account manager pauses active payments and briefs. Because of the contract's "90-day strict competitor exclusivity clause," this represents a legal breach.
4. **AI-Enabled Contingency (Roster Swap)**: The system recalculates the optimal knapsack from the original unselected list, identifying the next best-scoring candidates who fit the remaining budget and city-tier constraints, enabling an instant, data-backed replacement strategy.

---

### 🔴 Curveball 2: Silent/Ghosting Influencers (Week 2)
> *Scenario: 3 influencers go silent after accepting the brief. No content submitted, no response to messages. What's your contingency, and could AI have predicted this risk earlier?*

#### **Systemic Response:**
1. **Contingency Plan (The Back-up Pool)**:
   * **Active Monitoring**: When the due date for the content draft approaches, if no draft has been uploaded to our Portal, the system triggers the **Silent Creator Protocol**.
   * **Social Activity Scraping**: Using our `apify_service.py`, the system scrapes the silent influencers' feeds. If their profile shows *active personal posts* in the last 48 hours but they are ignoring agency messages, the system automatically marks them as **High Risk: Deliberate Ghosting**.
   * **Roster Replacement**: We instantly swap them out with top candidates from our **Contingency Buffer** (a pre-scored reserve list generated by our optimizer during Part 1).

#### **Predicting Risk Earlier (The Preventive AI):**
Yes, AI could have predicted this risk during the shortlisting stage:
* **Scraping Historic Collaboration Behavior**: We can feed their past brand collaboration notes and comments into an LLM sentiment analyzer. Influencers with repetitive comments like *"where is the giveaway winner?"* or *"never replied to my DM"* have a high correlation with poor professionalism.
* **Scraping Post Consistency**: By analyzing the timeline of their posts using Apify, we calculate their **Consistency Score**. Influencers with erratic posting schedules (e.g., posting 5 times one week, then going silent for 20 days) are programmatically penalized in our composite score.
* **Average Response Time Tracking**: Influencers with `Avg Response Time > 48 hrs` are already penalized in our scorer (line 128 of `scorer.py`) because slow initial communication is the strongest leading indicator of mid-campaign ghosting.

---

### 🔴 Curveball 3: Brand Tone Rejections (Week 3)
> *Scenario: The brand rejects 40% of first-draft content for "not matching brand tone." How do you prevent this from happening in the first place?*

#### **Systemic Prevention:**
1. **Pre-brief AI Co-Pilot (Alignment)**:
   * Instead of sending a generic PDF brief, we scrape the influencer's top 5 highest-engagement historical videos using Apify.
   * Our AI model reads these transcripts and synthesizes a **Tailored Script Brief**. This brief guides the influencer on how to incorporate the brand’s medical claims (e.g. "active hyaluronic acid serum") *in their exact personal style* (e.g., using their typical camera transitions, humor, or catchphrases).
2. **Pre-Screening Compliance Portal**:
   * We require influencers to upload a **rough text script/outline** or a raw 15-second draft to our compliance portal before filming.
   * An automated LLM pre-screens the script against a compliance checklist (e.g., checks for mandatory skin safety warnings, correct brand pronounciation, and tone alignment). If a script scores <80% on brand tone, the platform automatically flags suggestions for improvement *before* the influencer shoots, saving massive time and reshoots.
