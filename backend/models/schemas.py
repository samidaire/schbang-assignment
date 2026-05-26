"""Pydantic schemas matching the frontend interface contract."""

from pydantic import BaseModel, Field


class InfluencerResult(BaseModel):
    """Single influencer result — matches the frontend `Influencer` interface."""

    Name: str
    Handle: str | None = None
    Platform: str
    Category: str
    City: str | None = None
    Followers: int
    # Frontend accesses these via bracket notation
    engagement_rate: float = Field(0.0, alias="Engagement Rate (%)")
    avg_reel_views: float | None = Field(None, alias="Avg Reel Views")
    rate_inr: float | None = Field(None, alias="Rate (INR)")
    past_brand_collabs: str | None = Field(None, alias="Past Brand Collabs")
    content_quality: str | None = Field(None, alias="Content Quality")

    score: float = 0.0
    reasons: list[str] = []
    rejection_reasons: list[str] | None = None
    ai_review: str = ""
    influencer_type: str = ""  # Macro / Mid / Micro / Nano
    tier: str = ""  # "Tier 1" or "Tier 2/3"

    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "Name": "Priya Sharma",
                "Handle": "@priyasharma_beauty",
                "Platform": "Instagram",
                "Category": "Beauty",
                "Followers": 850000,
                "score": 78.5,
                "influencer_type": "Macro",
                "tier": "Tier 1",
            }
        },
    }


class AnalysisResponse(BaseModel):
    """Top-level response for POST /analyze — matches frontend `AnalysisResults`."""

    shortlisted: list[InfluencerResult]
    rejected: list[InfluencerResult]
    total_shortlisted: int
    total_rejected: int
    budget_used: float
    remaining_budget: float
    tier23_percentage: float


class HealthResponse(BaseModel):
    """Response for GET /health."""

    status: str = "healthy"
    version: str = ""


class ReadinessCheck(BaseModel):
    """Response for GET /health/ready."""

    ready: bool
    checks: dict[str, bool]
