"""Influencer AI Backend — FastAPI application entry point."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers import health, analyze, apify

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

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health.router)
app.include_router(analyze.router)
app.include_router(apify.router)


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
