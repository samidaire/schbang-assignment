"""Application configuration loaded from environment variables."""

import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Central configuration for the backend."""

    # --- OpenRouter ---
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENROUTER_MODELS: list[str] = [
        "z-ai/glm-4.5-air:free",
        "arcee-ai/trinity-large-thinking:free",
    ]
    # Primary model to use (first in the list)
    PRIMARY_MODEL: str = OPENROUTER_MODELS[0]

    # --- Apify ---
    APIFY_API_KEY: str = os.getenv("APIFY_API_KEY", "")

    # --- Campaign constraints ---
    BUDGET_LIMIT: float = 1_500_000  # ₹15 lakhs
    COMPETITOR_BRANDS: list[str] = ["Minimalist", "mCaffeine", "Mamaearth"]
    COMPETITOR_LOOKBACK_DAYS: int = 90
    MIN_TIER23_PERCENTAGE: float = 40.0

    # --- City tier classification ---
    TIER1_CITIES: list[str] = [
        "Mumbai", "Delhi", "Bangalore", "Hyderabad",
        "Chennai", "Kolkata", "Pune", "Ahmedabad",
        "Gurgaon", "Noida",
    ]

    # --- Influencer type thresholds ---
    MACRO_MIN_FOLLOWERS: int = 500_000
    MID_MIN_FOLLOWERS: int = 100_000
    MICRO_MIN_FOLLOWERS: int = 10_000
    # Below MICRO_MIN → Nano

    # --- App ---
    APP_VERSION: str = "0.1.0"
    APP_TITLE: str = "Influencer AI Backend"


settings = Settings()
