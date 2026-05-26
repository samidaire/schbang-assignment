"""Excel parser — reads uploaded .xlsx files and normalizes the data."""

import pandas as pd
from io import BytesIO

from config import settings


def parse_excel(file_bytes: bytes) -> pd.DataFrame:
    """
    Parse an uploaded Excel file into a cleaned DataFrame.

    Handles:
    - Missing rate estimation from category/follower averages
    - City tier classification
    - Influencer type classification by follower count
    - NaN normalization
    """
    df = pd.read_excel(BytesIO(file_bytes), engine="openpyxl")

    # --- Normalize column names (strip whitespace) ---
    df.columns = df.columns.str.strip()

    # --- Classify influencer type ---
    df["influencer_type"] = df["Followers"].apply(_classify_type)

    # --- Classify city tier ---
    df["tier"] = df["City"].apply(_classify_tier)

    # --- Estimate missing rates ---
    df = _fill_missing_rates(df)

    # --- Fill NaN in string columns ---
    string_cols = ["Past Brand Collabs", "Notes", "Handle"]
    for col in string_cols:
        if col in df.columns:
            df[col] = df[col].fillna("")

    return df


def _classify_type(followers: int) -> str:
    """Classify influencer by follower count."""
    if followers >= settings.MACRO_MIN_FOLLOWERS:
        return "Macro"
    elif followers >= settings.MID_MIN_FOLLOWERS:
        return "Mid"
    elif followers >= settings.MICRO_MIN_FOLLOWERS:
        return "Micro"
    return "Nano"


def _classify_tier(city: str) -> str:
    """Classify city as Tier 1 or Tier 2/3."""
    if city and city.strip() in settings.TIER1_CITIES:
        return "Tier 1"
    return "Tier 2/3"


def _fill_missing_rates(df: pd.DataFrame) -> pd.DataFrame:
    """
    Estimate missing rates using the median rate for the same influencer type.
    If still missing, use overall median.
    """
    rate_col = "Rate (INR)"
    if rate_col not in df.columns:
        return df

    # Group median by influencer type
    type_medians = df.groupby("influencer_type")[rate_col].median()
    overall_median = df[rate_col].median()

    def estimate_rate(row):
        if pd.notna(row[rate_col]):
            return row[rate_col]
        type_median = type_medians.get(row["influencer_type"])
        if pd.notna(type_median):
            return type_median
        return overall_median

    df[rate_col] = df.apply(estimate_rate, axis=1)
    return df
