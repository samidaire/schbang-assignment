"""Influencer AI Backend — FastAPI application entry point."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers import health, analyze, apify, analytics

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle — runs on startup and shutdown."""
    logger.info(f"🚀 {settings.APP_TITLE} v{settings.APP_VERSION} starting up")
    
    try:
        from services.db_service import init_db
        init_db()
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        
    logger.info(f"   OpenRouter API key: {'✅ configured' if settings.OPENROUTER_API_KEY else '❌ missing'}")
    logger.info(f"   Apify API key:      {'✅ configured' if settings.APIFY_API_KEY else '❌ missing'}")
    logger.info(f"   Budget limit:       ₹{settings.BUDGET_LIMIT:,.0f}")
    logger.info(f"   Primary model:      {settings.PRIMARY_MODEL}")
    yield
    logger.info("👋 Shutting down gracefully")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_TITLE,
    version=settings.APP_VERSION,
    description="AI-powered influencer shortlisting and analysis platform",
    lifespan=lifespan,
)

# CORS — configured for production security
import os
default_origins = "http://localhost:3000,https://schbang-assignment-omega.vercel.app"
cors_origins = os.getenv("CORS_ORIGINS", default_origins).split(",")
cors_origins = [origin.strip() for origin in cors_origins]

logger.info(f"CORS allowed origins: {cors_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health.router)
app.include_router(analyze.router)
app.include_router(apify.router)
app.include_router(analytics.router)


@app.get("/")
async def root():
    """Root endpoint — basic info."""
    return {
        "name": settings.APP_TITLE,
        "version": settings.APP_VERSION,
        "docs": "/docs",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
