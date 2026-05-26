"""Apify Router — endpoints to trigger and verify influencer data from social scrapers."""

import logging
from typing import Any

from fastapi import APIRouter, Query, HTTPException

from services.apify_service import verify_competitor_exclusivity, scrape_instagram_profile, scrape_youtube_videos

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/apify", tags=["apify"])


@router.get("/check-competitor")
async def check_competitor(
    username: str = Query(..., description="Influencer handle or channel username"),
    platform: str = Query("instagram", description="Platform: 'instagram' or 'youtube'"),
    lookback_days: int = Query(90, description="Lookback window in days to detect conflicts"),
):
    """
    Run the Apify social media scraper to check for competitor exclusivity conflicts.
    
    This matches Curveball 1 (Week 2): Automatically checks recent posts for mentions
    of competitor brands (Minimalist, mCaffeine, Mamaearth) in the last 90 days.
    """
    try:
        result = await verify_competitor_exclusivity(
            username=username,
            platform=platform,
            lookback_days=lookback_days
        )
        return result
    except Exception as e:
        logger.exception(f"Competitor exclusivity check failed for {username}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Exclusivity check failed: {str(e)}"
        )


@router.get("/instagram/profile")
async def get_instagram_profile(
    username: str = Query(..., description="Instagram username (without @)"),
    max_posts: int = Query(10, description="Max number of posts to scrape"),
):
    """
    Scrape recent Instagram posts for a given profile via Apify's Instagram Scraper.
    
    If no Apify API Key is configured, returns simulation data.
    """
    try:
        posts = await scrape_instagram_profile(username=username, max_posts=max_posts)
        return {
            "username": username,
            "posts_scraped": len(posts),
            "posts": posts
        }
    except Exception as e:
        logger.exception(f"Instagram profile scraping failed for {username}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Instagram scraping failed: {str(e)}"
        )


@router.get("/youtube/videos")
async def get_youtube_videos(
    channel_handle: str = Query(..., description="YouTube channel handle (e.g. @shreyakulkarni or shreyakulkarni)"),
    max_videos: int = Query(5, description="Max number of videos to scrape"),
):
    """
    Scrape recent YouTube videos for a channel via Apify's YouTube Scraper.
    
    If no Apify API Key is configured, returns simulation data.
    """
    try:
        videos = await scrape_youtube_videos(channel_handle=channel_handle, max_videos=max_videos)
        return {
            "channel_handle": channel_handle,
            "videos_scraped": len(videos),
            "videos": videos
        }
    except Exception as e:
        logger.exception(f"YouTube videos scraping failed for {channel_handle}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"YouTube scraping failed: {str(e)}"
        )
