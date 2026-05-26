"""AI service — OpenRouter SDK for influencer reviews and analysis.

Handles free-tier rate limits with:
- Sequential processing with delays between requests
- Exponential backoff retry on per-minute rate limits
- Model rotation across multiple free models
- Circuit breaker: skips API on daily limit exhaustion
"""

import asyncio
import logging
import time

from openrouter import OpenRouter

from config import settings

logger = logging.getLogger(__name__)

# Delay between sequential API calls (seconds)
REQUEST_DELAY = 2.5
MAX_RETRIES = 2
BASE_BACKOFF = 4.0  # seconds

# Circuit breaker state — when daily limit is hit, skip all further calls
_circuit_open = False
_circuit_opened_at: float = 0


def _is_circuit_open() -> bool:
    """Check if the circuit breaker is open (daily limit hit)."""
    global _circuit_open, _circuit_opened_at
    if not _circuit_open:
        return False
    # Auto-reset after 1 hour (in case rate limit window resets)
    if time.time() - _circuit_opened_at > 3600:
        _circuit_open = False
        logger.info("Circuit breaker auto-reset after 1 hour")
        return False
    return True


def _trip_circuit():
    """Trip the circuit breaker when daily limit is detected."""
    global _circuit_open, _circuit_opened_at
    if not _circuit_open:
        _circuit_open = True
        _circuit_opened_at = time.time()
        logger.warning(
            "Circuit breaker TRIPPED — daily rate limit hit. "
            "All remaining reviews will use rule-based fallback."
        )


def _build_review_prompt(influencer: dict) -> str:
    """Build a review prompt for a single influencer."""
    return f"""You are an expert influencer marketing analyst for a D2C skincare brand launching a serum line.

Analyze this influencer profile and write a concise 2-3 sentence review covering:
- Brand fit for a skincare/serum campaign
- Any risk flags or concerns
- Your recommendation (strong pick, good pick, risky, or avoid)

Influencer Profile:
- Name: {influencer.get('Name', 'Unknown')}
- Handle: {influencer.get('Handle', 'N/A')}
- Platform: {influencer.get('Platform', 'N/A')}
- Category: {influencer.get('Category', 'N/A')}
- City: {influencer.get('City', 'N/A')}
- Followers: {influencer.get('Followers', 0):,}
- Engagement Rate: {influencer.get('Engagement Rate (%)', 'N/A')}%
- Avg Reel Views: {influencer.get('Avg Reel Views', 'N/A')}
- Rate (INR): ₹{influencer.get('Rate (INR)', 'N/A')}
- Content Quality: {influencer.get('Content Quality', 'N/A')}
- Past Brand Collabs: {influencer.get('Past Brand Collabs', 'None')}
- Competitor Collab: {influencer.get('Competitor Collab?', 'No')}
- Avg Response Time: {influencer.get('Avg Response Time (hrs)', 'N/A')} hrs
- Notes: {influencer.get('Notes', 'None')}

Write ONLY the review — no headings, no bullet points, just 2-3 sentences."""


async def generate_review_async(
    influencer: dict,
    model: str | None = None,
) -> str:
    """
    Generate an AI review for a single influencer with retry logic.
    Falls back to rule-based review if API fails or circuit is open.
    """
    if not settings.OPENROUTER_API_KEY or _is_circuit_open():
        return _fallback_review(influencer)

    use_model = model or settings.PRIMARY_MODEL

    for attempt in range(MAX_RETRIES):
        try:
            async with OpenRouter(api_key=settings.OPENROUTER_API_KEY) as client:
                response = await client.chat.send_async(
                    model=use_model,
                    messages=[
                        {
                            "role": "system",
                            "content": "You are a concise influencer marketing analyst. Keep reviews to 2-3 sentences.",
                        },
                        {
                            "role": "user",
                            "content": _build_review_prompt(influencer),
                        },
                    ],
                    temperature=0.7,
                    max_tokens=200,
                )

                content = response.choices[0].message.content if response.choices else None
                if content:
                    return content.strip()
                return _fallback_review(influencer)

        except Exception as e:
            error_str = str(e).lower()
            is_rate_limit = "429" in str(e) or "rate limit" in error_str

            # Check if it's a DAILY limit (not per-minute)
            if "per-day" in error_str or "per_day" in error_str:
                _trip_circuit()
                return _fallback_review(influencer)

            if is_rate_limit and attempt < MAX_RETRIES - 1:
                backoff = BASE_BACKOFF * (2 ** attempt)
                logger.info(
                    f"Rate limited for {influencer.get('Name')} on {use_model}, "
                    f"retrying in {backoff}s (attempt {attempt + 1}/{MAX_RETRIES})"
                )
                await asyncio.sleep(backoff)

                # Rotate to next model on retry
                models = settings.OPENROUTER_MODELS
                current_idx = models.index(use_model) if use_model in models else 0
                use_model = models[(current_idx + 1) % len(models)]
                continue
            else:
                logger.warning(
                    f"OpenRouter call failed for {influencer.get('Name')}: {e}"
                )
                return _fallback_review(influencer)

    return _fallback_review(influencer)


async def generate_reviews_batch(
    influencers: list[dict],
    model: str | None = None,
) -> list[str]:
    """
    Generate AI reviews for multiple influencers.

    Uses sequential processing with delays for API calls,
    or instant fallback if circuit breaker is open.
    """
    reviews = []
    models = settings.OPENROUTER_MODELS
    total = len(influencers)

    for i, inf in enumerate(influencers):
        current_model = model or models[i % len(models)]

        if _is_circuit_open():
            # Skip API entirely — use fallback
            reviews.append(_fallback_review(inf))
            continue

        logger.info(
            f"Generating review {i + 1}/{total}: {inf.get('Name', '?')} "
            f"(model: {current_model.split('/')[-1]})"
        )

        review = await generate_review_async(inf, model=current_model)
        reviews.append(review)

        # Delay between requests to avoid per-minute rate limits
        if i < total - 1 and not _is_circuit_open():
            await asyncio.sleep(REQUEST_DELAY)

    return reviews


def _fallback_review(influencer: dict) -> str:
    """Generate a rule-based review when the API is unavailable."""
    name = influencer.get("Name", "This influencer")
    category = influencer.get("Category", "")
    engagement = influencer.get("Engagement Rate (%)", 0) or 0
    followers = influencer.get("Followers", 0)
    quality = influencer.get("Content Quality", "Unknown")
    competitor = influencer.get("Competitor Collab?", "No")
    notes = influencer.get("Notes", "")
    response_time = influencer.get("Avg Response Time (hrs)", 24)

    parts = []

    # Brand fit
    skincare_keywords = ["skincare", "beauty", "dermatology", "serum", "skin"]
    is_relevant = any(kw in category.lower() for kw in skincare_keywords)
    if is_relevant:
        parts.append(
            f"{name} operates in {category}, making them a strong category fit "
            f"for a skincare serum campaign."
        )
    else:
        parts.append(
            f"{name} focuses on {category}, which has limited direct relevance "
            f"to a skincare serum launch."
        )

    # Risk assessment
    risks = []
    if competitor and str(competitor).lower() != "no":
        risks.append(f"competitor conflict ({competitor})")
    if engagement < 1.5 and followers > 500_000:
        risks.append("suspiciously low engagement for their follower count")
    if response_time and response_time > 48:
        risks.append(f"slow response time ({response_time}hrs)")
    if notes and any(
        w in str(notes).lower() for w in ["deadline", "suspicious", "ghost"]
    ):
        risks.append(f"flagged in notes: {str(notes).strip()}")

    if risks:
        parts.append(f"Risk flags: {', '.join(risks)}.")
    else:
        parts.append(
            f"Quality is rated {quality} with {engagement}% engagement — "
            f"no major red flags."
        )

    # Recommendation
    if competitor and str(competitor).lower() != "no":
        parts.append("Recommendation: Avoid due to competitor exclusivity conflict.")
    elif engagement >= 4.0 and quality == "High":
        parts.append("Recommendation: Strong pick for the campaign.")
    elif engagement >= 2.0 and quality in ("High", "Medium"):
        parts.append("Recommendation: Good pick with acceptable metrics.")
    else:
        parts.append("Recommendation: Risky — verify data before committing.")

    return " ".join(parts)


def is_api_available() -> bool:
    """Check if the OpenRouter API key is configured."""
    return bool(settings.OPENROUTER_API_KEY)


def reset_circuit_breaker():
    """Manually reset the circuit breaker (e.g., after adding credits)."""
    global _circuit_open
    _circuit_open = False
    logger.info("Circuit breaker manually reset")
