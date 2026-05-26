"""Analytics Router — endpoints to query database campaign records and aggregate trends."""

import logging
from collections import defaultdict
from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Query, HTTPException

from services.db_service import get_all_campaigns, delete_campaign
from services.ai_service import generate_analytics_insights_async

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/campaigns")
async def list_campaigns():
    """Retrieve all campaign records saved in local database history."""
    try:
        campaigns = get_all_campaigns()
        return campaigns
    except Exception as e:
        logger.exception(f"Failed to fetch campaign records: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/campaigns/{campaign_id}")
async def remove_campaign(campaign_id: int):
    """Delete a campaign record from SQLite history."""
    try:
        delete_campaign(campaign_id)
        return {"status": "success", "message": f"Campaign ID {campaign_id} deleted"}
    except Exception as e:
        logger.exception(f"Failed to delete campaign {campaign_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/trends")
async def get_trends(
    interval: Literal["weekly", "monthly", "quarterly"] = Query(
        "monthly", description="Trend grouping interval: weekly, monthly, quarterly"
    )
):
    """
    Query database campaign history and group them dynamically by interval (weekly, monthly, quarterly).
    
    Returns structured data points tailored for responsive SVG graphs.
    """
    try:
        raw_campaigns = get_all_campaigns()
        if not raw_campaigns:
            return []

        # Period grouping dictionary
        # period_key -> list of campaign dicts
        groups = defaultdict(list)

        for camp in raw_campaigns:
            try:
                # Parse ISO timestamp
                dt = datetime.fromisoformat(camp["uploaded_at"].replace("Z", "+00:00"))
            except Exception:
                # Fallback parse
                try:
                    dt = datetime.strptime(camp["uploaded_at"].split(".")[0], "%Y-%m-%dT%H:%M:%S")
                except Exception:
                    dt = datetime.utcnow()

            # Determine key based on interval
            if interval == "weekly":
                year, week, _ = dt.isocalendar()
                period_key = f"{year}-W{week:02d}"
                label = f"W{week:02d} {year}"
            elif interval == "quarterly":
                quarter = (dt.month - 1) // 3 + 1
                period_key = f"{dt.year}-Q{quarter}"
                label = f"Q{quarter} {dt.year}"
            else:  # monthly (default)
                period_key = f"{dt.year}-{dt.month:02d}"
                label = dt.strftime("%b %Y")

            groups[period_key].append((label, camp))

        # Compile and sort aggregated trends
        sorted_keys = sorted(groups.keys())
        trends = []

        for p_key in sorted_keys:
            items = groups[p_key]
            label = items[0][0]  # Get human-readable label
            
            camps = [item[1] for item in items]
            count = len(camps)
            
            # Aggregate stats
            total_budget = sum(c["budget_used"] for c in camps)
            avg_budget = total_budget / count
            
            avg_er = sum(c["avg_engagement_rate"] for c in camps) / count
            avg_score = sum(c["avg_score"] for c in camps) / count
            avg_shortlisted = sum(c["total_shortlisted"] for c in camps) / count
            
            trends.append({
                "key": p_key,
                "period": label,
                "campaigns_count": count,
                "budget_used": round(avg_budget, 2),  # Plotting average campaign stats for that period
                "avg_engagement_rate": round(avg_er, 2),
                "avg_score": round(avg_score, 1),
                "total_shortlisted": round(avg_shortlisted, 1)
            })

        return trends

    except Exception as e:
        logger.exception(f"Failed to compile trends: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/ai-insights")
async def get_ai_insights():
    """
    Generate predictive and strategic campaign forecasts using OpenRouter and historical SQLite data.
    """
    try:
        campaigns = get_all_campaigns()
        if not campaigns:
            return {"insights": "No historical campaign snapshots found to audit."}
        
        insights = await generate_analytics_insights_async(campaigns)
        return {"insights": insights}
    except Exception as e:
        logger.exception(f"Failed to compile AI insights: {e}")
        raise HTTPException(status_code=500, detail=str(e))

