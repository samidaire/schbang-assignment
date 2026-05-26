"""Scorer — composite scoring system for influencer evaluation."""

import pandas as pd
import math

from config import settings


def score_influencers(df: pd.DataFrame) -> pd.DataFrame:
    """
    Score each influencer on a 0–100 composite scale.

    Weights:
      - Engagement Rate:        25%
      - Content Quality:        20%
      - Category Relevance:     15%
      - View-through Rate:      15%
      - Response Time:          10%
      - Past Collab Experience: 5%
      - Red Flag Penalty:       -10% (deductive)

    Also adds:
      - 'red_flags': list of detected red flags
      - 'has_competitor_conflict': bool
    """
    df = df.copy()

    df["s_engagement"] = df["Engagement Rate (%)"].apply(_score_engagement)
    df["s_quality"] = df["Content Quality"].apply(_score_quality)
    df["s_category"] = df["Category"].apply(_score_category)
    df["s_views"] = df.apply(_score_views, axis=1)
    df["s_response"] = df["Avg Response Time (hrs)"].apply(_score_response)
    df["s_experience"] = df["Past Brand Collabs"].apply(_score_experience)

    # Red flags
    df["red_flags"] = df.apply(_detect_red_flags, axis=1)
    df["s_penalty"] = df["red_flags"].apply(lambda flags: min(len(flags) * 15, 100))

    # Competitor conflict (hard flag)
    df["has_competitor_conflict"] = df["Competitor Collab?"].apply(_has_competitor_conflict)

    # Composite score
    df["score"] = (
        df["s_engagement"] * 0.25
        + df["s_quality"] * 0.20
        + df["s_category"] * 0.15
        + df["s_views"] * 0.15
        + df["s_response"] * 0.10
        + df["s_experience"] * 0.05
    )

    # Apply penalty
    df["score"] = (df["score"] - df["s_penalty"] * 0.10).clip(lower=0)

    # Round to 1 decimal
    df["score"] = df["score"].round(1)

    return df


# --- Component scoring functions ---


def _score_engagement(rate) -> float:
    """Score engagement rate (0–100). Higher is better."""
    if pd.isna(rate):
        return 30.0  # Unknown — neutral-low
    if rate >= 7.0:
        return 100.0
    if rate >= 5.0:
        return 85.0
    if rate >= 3.0:
        return 65.0
    if rate >= 2.0:
        return 45.0
    if rate >= 1.0:
        return 25.0
    return 10.0


def _score_quality(quality) -> float:
    """Score content quality."""
    mapping = {"High": 100.0, "Medium": 55.0, "Low": 15.0}
    return mapping.get(quality, 30.0)


def _score_category(category: str) -> float:
    """Score category relevance to a skincare serum campaign."""
    if not category:
        return 30.0

    cat = category.lower()
    # Perfect fit
    if any(k in cat for k in ["skincare", "dermatology", "skin"]):
        return 100.0
    # Strong fit
    if "beauty" in cat:
        return 80.0
    # Moderate fit
    if any(k in cat for k in ["lifestyle", "wellness", "ayurveda"]):
        return 55.0
    # Weak fit
    if any(k in cat for k in ["fashion", "fitness", "travel"]):
        return 35.0
    return 25.0


def _score_views(row) -> float:
    """Score view-through rate (avg reel views / followers)."""
    views = row.get("Avg Reel Views")
    followers = row.get("Followers", 1)

    if pd.isna(views) or followers == 0:
        return 40.0  # Unknown — neutral

    vtr = views / followers
    if vtr >= 0.20:
        return 100.0
    if vtr >= 0.12:
        return 80.0
    if vtr >= 0.08:
        return 60.0
    if vtr >= 0.04:
        return 40.0
    return 20.0


def _score_response(hours) -> float:
    """Score average response time. Faster is better."""
    if pd.isna(hours):
        return 40.0
    if hours <= 4:
        return 100.0
    if hours <= 8:
        return 80.0
    if hours <= 24:
        return 60.0
    if hours <= 48:
        return 35.0
    return 10.0


def _score_experience(collabs) -> float:
    """Score based on past brand collaboration experience."""
    if pd.isna(collabs) or not collabs:
        return 20.0  # First-timer — not necessarily bad, just unproven
    # Count comma-separated collabs
    count = len(str(collabs).split(","))
    if count >= 3:
        return 100.0
    if count >= 2:
        return 75.0
    return 50.0


# --- Red flag detection ---


def _detect_red_flags(row) -> list[str]:
    """Detect data red flags for an influencer."""
    flags = []

    followers = row.get("Followers", 0)
    engagement = row.get("Engagement Rate (%)", None)
    views = row.get("Avg Reel Views", None)
    notes = str(row.get("Notes", "")).lower()
    rate = row.get("Rate (INR)", None)
    response_hrs = row.get("Avg Response Time (hrs)", 0)
    quality = row.get("Content Quality", "")

    # Suspicious engagement: very low for high followers
    if engagement is not None and not pd.isna(engagement):
        if engagement < 1.5 and followers > 500_000:
            flags.append("Suspiciously low engagement rate for follower count — possible bought followers")

    # Extremely high engagement might be fake too
    if engagement is not None and not pd.isna(engagement):
        if engagement > 15.0:
            flags.append("Unusually high engagement rate — verify authenticity")

    # Very slow response
    if response_hrs >= 72:
        flags.append(f"Very slow response time ({response_hrs}hrs) — high ghosting risk")
    elif response_hrs >= 48:
        flags.append(f"Slow response time ({response_hrs}hrs)")

    # Notes-based flags
    if "deadline" in notes:
        flags.append("Known to miss deadlines (from notes)")
    if "suspicious" in notes:
        flags.append("Suspicious activity flagged in notes")
    if "ghost" in notes:
        flags.append("History of ghosting flagged in notes")
    if "not shared" in notes or "rate not" in notes:
        flags.append("Rate not shared — needs verification")

    # Low quality
    if quality == "Low":
        flags.append("Low content quality rating")

    # Missing critical data
    if pd.isna(rate):
        flags.append("Rate data missing — budget impact unknown")

    # Views way below expected for followers
    if views is not None and not pd.isna(views) and followers > 0:
        vtr = views / followers
        if vtr < 0.03:
            flags.append(f"Very low view-through rate ({vtr:.1%}) — audience may not be genuine")

    return flags


def _has_competitor_conflict(collab_str) -> bool:
    """Check if the influencer has a competitor collaboration conflict."""
    if pd.isna(collab_str) or not collab_str:
        return False
    collab_lower = str(collab_str).lower()
    if collab_lower == "no":
        return False
    # Check for any competitor brand name
    return any(
        brand.lower() in collab_lower
        for brand in settings.COMPETITOR_BRANDS
    )
