"""Health check endpoints."""

from fastapi import APIRouter

from config import settings
from services.ai_service import is_api_available

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
async def health():
    """Basic health check — is the server running?"""
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
    }


@router.get("/ready")
async def readiness():
    """
    Readiness check — are all dependencies available?

    Checks:
    - OpenRouter API key configured
    - Apify API key configured
    - pandas importable
    """
    checks = {
        "openrouter_api_key": is_api_available(),
        "apify_api_key": bool(settings.APIFY_API_KEY),
        "pandas": _check_pandas(),
    }

    all_ready = all(checks.values())

    return {
        "ready": all_ready,
        "checks": checks,
    }


def _check_pandas() -> bool:
    """Check if pandas is importable."""
    try:
        import pandas  # noqa: F401
        return True
    except ImportError:
        return False
