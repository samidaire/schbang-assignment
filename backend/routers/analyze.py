"""Analyze endpoint — the core influencer shortlisting pipeline."""

import logging
import math

import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel

from config import settings
from services.excel_parser import parse_excel
from services.scorer import score_influencers
from services.shortlister import build_shortlist
from services.ai_service import (
    generate_review_async,
    generate_brief_async,
    _fallback_review,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["analyze"])


class ReviewRequest(BaseModel):
    influencer: dict


@router.post("/live-review")
async def get_live_review(request: ReviewRequest):
    """
    Generate a live strategic review for a single creator on-demand.
    This avoids upfront bulk latency and saves OpenRouter free-tier rate limits.
    """
    try:
        review = await generate_review_async(request.influencer)
        return {"ai_review": review}
    except Exception as e:
        logger.error(f"Live review generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class BriefRequest(BaseModel):
    influencer: dict


@router.post("/live-brief")
async def get_live_brief(request: BriefRequest):
    """
    Generate a personalized creative brief for a single shortlisted creator on-demand.
    This avoids upfront bulk latency and provides tailored script instructions.
    """
    try:
        brief = await generate_brief_async(request.influencer)
        return {"brief": brief}
    except Exception as e:
        logger.error(f"Live brief generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze")
async def analyze_influencers(file: UploadFile = File(...)):
    """
    Upload an Excel file of influencer profiles and get a scored,
    shortlisted result with AI reviews.

    Pipeline:
    1. Parse Excel → clean DataFrame
    2. Score each influencer (composite 0–100)
    3. Build shortlist (budget + constraints)
    4. Generate instant fallback reviews (live reviews available on-demand)
    5. Return structured response matching frontend contract
    """
    # --- Validate file ---
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")

    valid_extensions = (".xlsx", ".xls")
    if not any(file.filename.lower().endswith(ext) for ext in valid_extensions):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Expected Excel file ({', '.join(valid_extensions)})",
        )

    try:
        file_bytes = await file.read()
        if len(file_bytes) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")

        logger.info(f"Processing file: {file.filename} ({len(file_bytes)} bytes)")

        # --- Step 1: Parse ---
        df = parse_excel(file_bytes)
        logger.info(f"Parsed {len(df)} influencer profiles")

        # --- Step 2: Score ---
        df = score_influencers(df)
        logger.info("Scoring complete")

        # --- Step 3: Shortlist ---
        shortlisted, rejected = build_shortlist(df)
        logger.info(f"Shortlisted: {len(shortlisted)}, Rejected: {len(rejected)}")

        # --- Step 4: AI Reviews ---
        # Generate the high-quality local fallback review instantly to prevent
        # blocking sheet upload. The user can request live AI reviews on-demand.
        for i, inf in enumerate(shortlisted):
            shortlisted[i]["ai_review"] = _fallback_review(inf)

        for i, inf in enumerate(rejected):
            rejected[i]["ai_review"] = _fallback_review(inf)

        # --- Step 5: Build response ---
        budget_used = sum(
            inf.get("Rate (INR)", 0) for inf in shortlisted
            if pd.notna(inf.get("Rate (INR)"))
        )
        remaining_budget = settings.BUDGET_LIMIT - budget_used

        tier23_in_shortlist = sum(
            1 for inf in shortlisted if inf.get("tier") == "Tier 2/3"
        )
        tier23_percentage = (
            (tier23_in_shortlist / len(shortlisted) * 100)
            if shortlisted
            else 0.0
        )

        response = {
            "shortlisted": [_format_influencer(inf, selected=True) for inf in shortlisted],
            "rejected": [_format_influencer(inf, selected=False) for inf in rejected],
            "total_shortlisted": len(shortlisted),
            "total_rejected": len(rejected),
            "budget_used": round(budget_used, 2),
            "remaining_budget": round(remaining_budget, 2),
            "tier23_percentage": round(tier23_percentage, 1),
        }

        logger.info(
            f"Analysis complete — Budget: ₹{budget_used:,.0f} / ₹{settings.BUDGET_LIMIT:,.0f}, "
            f"Tier 2/3: {tier23_percentage:.1f}%"
        )

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


def _format_influencer(inf: dict, selected: bool) -> dict:
    """Format an influencer dict to match the frontend Influencer interface."""
    return {
        "Name": inf.get("Name", ""),
        "Handle": inf.get("Handle", ""),
        "Platform": inf.get("Platform", ""),
        "Category": inf.get("Category", ""),
        "City": inf.get("City", ""),
        "Followers": int(inf.get("Followers", 0) or 0),
        "Engagement Rate (%)": _safe_float(inf.get("Engagement Rate (%)")) or 0.0,
        "Avg Reel Views": _safe_float(inf.get("Avg Reel Views")),
        "Rate (INR)": _safe_float(inf.get("Rate (INR)")),
        "Past Brand Collabs": str(inf.get("Past Brand Collabs", "") or ""),
        "Content Quality": str(inf.get("Content Quality", "") or ""),
        "score": _safe_float(inf.get("score")) or 0.0,
        "reasons": inf.get("_selection_reasons", []) if selected else [],
        "rejection_reasons": inf.get("_rejection_reasons", []) if not selected else None,
        "ai_review": inf.get("ai_review", ""),
        "influencer_type": inf.get("influencer_type", ""),
        "tier": inf.get("tier", ""),
        "red_flags": inf.get("red_flags", []),
        "ResponseTime": _safe_float(inf.get("Avg Response Time (hrs)")),
    }


def _safe_float(val) -> float | None:
    """Convert value to float, returning None for NaN/None."""
    if val is None:
        return None
    try:
        f = float(val)
        return None if math.isnan(f) else f
    except (ValueError, TypeError):
        return None
