"""Shortlister — budget-fitting selection with campaign constraints."""

import pandas as pd

from config import settings


def build_shortlist(df: pd.DataFrame) -> tuple[list[dict], list[dict]]:
    """
    Build a shortlist from scored influencers.

    Algorithm:
    1. Hard-reject competitor conflicts
    2. Sort by score descending
    3. Greedily pick influencers within budget
    4. Enforce ≥40% Tier 2/3 constraint
    5. Ensure mix of influencer types

    Returns:
        (shortlisted, rejected) — both as lists of dicts
    """
    df = df.copy()
    rate_col = "Rate (INR)"

    # --- Phase 1: Hard rejections ---
    competitor_mask = df["has_competitor_conflict"] == True
    hard_rejected = df[competitor_mask].copy()
    hard_rejected["_rejection_reasons"] = hard_rejected.apply(
        lambda row: _build_rejection_reasons(row, "competitor_conflict"), axis=1
    )
    candidates = df[~competitor_mask].copy()

    # --- Phase 2: Sort by score ---
    candidates = candidates.sort_values("score", ascending=False).reset_index(drop=True)

    # --- Phase 3: Greedy selection with constraints ---
    selected_indices = []
    budget_remaining = settings.BUDGET_LIMIT
    tier23_count = 0
    type_counts = {"Macro": 0, "Mid": 0, "Micro": 0, "Nano": 0}

    # First pass: pick top scorers that fit budget
    for idx, row in candidates.iterrows():
        rate = row.get(rate_col, 0)
        if pd.isna(rate) or rate <= 0:
            continue
        if rate <= budget_remaining:
            selected_indices.append(idx)
            budget_remaining -= rate
            if row["tier"] == "Tier 2/3":
                tier23_count += 1
            itype = row.get("influencer_type", "Micro")
            type_counts[itype] = type_counts.get(itype, 0) + 1

    # --- Phase 4: Enforce Tier 2/3 constraint ---
    total_selected = len(selected_indices)
    if total_selected > 0:
        tier23_pct = (tier23_count / total_selected) * 100
        if tier23_pct < settings.MIN_TIER23_PERCENTAGE:
            # Need more Tier 2/3 — swap lowest-scoring Tier 1 with highest-scoring unselected Tier 2/3
            selected_indices, budget_remaining, tier23_count = _enforce_tier23(
                candidates, selected_indices, budget_remaining, tier23_count, total_selected
            )

    # --- Phase 5: Ensure type diversity ---
    # If we have zero of any type, try to add one
    selected_indices, budget_remaining = _ensure_type_mix(
        candidates, selected_indices, budget_remaining, type_counts
    )

    # --- Build result lists ---
    selected_set = set(selected_indices)
    shortlisted = []
    soft_rejected = []

    for idx, row in candidates.iterrows():
        row_dict = row.to_dict()
        if idx in selected_set:
            row_dict["_selection_reasons"] = _build_selection_reasons(row)
            shortlisted.append(row_dict)
        else:
            row_dict["_rejection_reasons"] = _build_rejection_reasons(row, "not_selected")
            soft_rejected.append(row_dict)

    # Combine hard rejected + soft rejected
    rejected = []
    for _, row in hard_rejected.iterrows():
        rejected.append(row.to_dict())
    rejected.extend(soft_rejected)

    # Sort shortlisted by score descending
    shortlisted.sort(key=lambda x: x.get("score", 0), reverse=True)

    return shortlisted, rejected


def _enforce_tier23(
    candidates: pd.DataFrame,
    selected_indices: list,
    budget_remaining: float,
    tier23_count: int,
    total_selected: int,
) -> tuple[list, float, int]:
    """Swap Tier 1 for Tier 2/3 to meet the minimum percentage."""
    rate_col = "Rate (INR)"
    selected_set = set(selected_indices)

    # Tier 1 in selection (sorted by score ascending — weakest first)
    tier1_selected = [
        idx for idx in selected_indices
        if candidates.loc[idx, "tier"] == "Tier 1"
    ]
    tier1_selected.sort(key=lambda idx: candidates.loc[idx, "score"])

    # Tier 2/3 NOT in selection (sorted by score descending — strongest first)
    tier23_available = [
        idx for idx, row in candidates.iterrows()
        if idx not in selected_set and row["tier"] == "Tier 2/3"
    ]
    tier23_available.sort(key=lambda idx: candidates.loc[idx, "score"], reverse=True)

    for t1_idx in tier1_selected:
        if not tier23_available:
            break
        current_pct = (tier23_count / total_selected) * 100 if total_selected > 0 else 0
        if current_pct >= settings.MIN_TIER23_PERCENTAGE:
            break

        t23_idx = tier23_available.pop(0)
        t1_rate = candidates.loc[t1_idx, rate_col]
        t23_rate = candidates.loc[t23_idx, rate_col]

        # Only swap if the Tier 2/3 influencer fits the budget
        new_budget = budget_remaining + t1_rate - t23_rate
        if new_budget >= 0:
            selected_indices.remove(t1_idx)
            selected_indices.append(t23_idx)
            budget_remaining = new_budget
            tier23_count += 1

    return selected_indices, budget_remaining, tier23_count


def _ensure_type_mix(
    candidates: pd.DataFrame,
    selected_indices: list,
    budget_remaining: float,
    type_counts: dict,
) -> tuple[list, float]:
    """Try to include at least one of each influencer type if budget allows."""
    rate_col = "Rate (INR)"
    selected_set = set(selected_indices)

    for itype in ["Macro", "Mid", "Micro", "Nano"]:
        if type_counts.get(itype, 0) > 0:
            continue

        # Find best unselected influencer of this type
        unselected_of_type = [
            idx for idx, row in candidates.iterrows()
            if idx not in selected_set
            and row.get("influencer_type") == itype
            and not row.get("has_competitor_conflict", False)
        ]
        unselected_of_type.sort(key=lambda idx: candidates.loc[idx, "score"], reverse=True)

        for idx in unselected_of_type:
            rate = candidates.loc[idx, rate_col]
            if pd.notna(rate) and rate <= budget_remaining:
                selected_indices.append(idx)
                selected_set.add(idx)
                budget_remaining -= rate
                type_counts[itype] = type_counts.get(itype, 0) + 1
                break

    return selected_indices, budget_remaining


def _build_selection_reasons(row) -> list[str]:
    """Build human-readable reasons for selecting an influencer."""
    reasons = []

    score = row.get("score", 0)
    engagement = row.get("Engagement Rate (%)", 0)
    quality = row.get("Content Quality", "")
    category = row.get("Category", "")
    tier = row.get("tier", "")
    itype = row.get("influencer_type", "")
    response_hrs = row.get("Avg Response Time (hrs)", 24)

    if score >= 70:
        reasons.append(f"High composite score ({score}/100)")
    elif score >= 50:
        reasons.append(f"Good composite score ({score}/100)")

    if engagement and not pd.isna(engagement) and engagement >= 4.0:
        reasons.append(f"Strong engagement rate ({engagement}%)")

    if quality == "High":
        reasons.append("High content quality rating")

    cat_lower = category.lower() if category else ""
    if any(k in cat_lower for k in ["skincare", "beauty", "dermatology"]):
        reasons.append(f"Relevant category: {category}")

    if tier == "Tier 2/3":
        reasons.append("Tier 2/3 city — helps meet geographic diversity requirement")

    if response_hrs and response_hrs <= 6:
        reasons.append(f"Fast response time ({response_hrs}hrs)")

    if itype:
        reasons.append(f"{itype} influencer — contributes to type mix")

    if not reasons:
        reasons.append("Selected based on overall profile fit")

    return reasons


def _build_rejection_reasons(row, reason_type: str) -> list[str]:
    """Build human-readable reasons for rejecting an influencer."""
    reasons = []

    if reason_type == "competitor_conflict":
        collab = row.get("Competitor Collab?", "")
        reasons.append(f"Competitor exclusivity conflict: {collab}")
        reasons.append("Brand requires no Minimalist, mCaffeine, or Mamaearth collabs in last 90 days")
        return reasons

    # Soft rejection reasons
    score = row.get("score", 0)
    red_flags = row.get("red_flags", [])

    if score < 40:
        reasons.append(f"Low composite score ({score}/100)")

    if red_flags:
        for flag in red_flags:
            reasons.append(f"Red flag: {flag}")

    rate = row.get("Rate (INR)", 0)
    if pd.notna(rate) and rate > 300_000:
        reasons.append(f"High rate (₹{rate:,.0f}) — reduces budget efficiency")

    if not reasons:
        reasons.append("Did not make the cut within budget constraints")

    return reasons
