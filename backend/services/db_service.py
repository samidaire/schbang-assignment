"""SQLite Database Service — manages connection lifecycle, migrations, and trends tracking."""

import sqlite3
import os
import logging
from datetime import datetime, timedelta
import random

logger = logging.getLogger(__name__)

DB_PATH = os.environ.get(
    "DATABASE_PATH",
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "influencer_ai.db"),
)


def get_db_connection():
    """Create a connection to the SQLite database."""
    try:
        conn = sqlite3.connect(DB_PATH, timeout=10.0)
        conn.row_factory = sqlite3.Row
        return conn
    except sqlite3.OperationalError as e:
        logger.error(f"Failed to connect to database at {DB_PATH}: {e}")
        raise


def init_db():
    """Initialize SQLite tables and seed historical data if empty."""
    logger.info(f"💾 Initializing database at {DB_PATH}")
    
    # Ensure database directory exists
    db_dir = os.path.dirname(DB_PATH)
    if db_dir and not os.path.exists(db_dir):
        try:
            os.makedirs(db_dir, exist_ok=True)
            logger.info(f"Created database directory: {db_dir}")
        except Exception as e:
            logger.error(f"Failed to create database directory {db_dir}: {e}")
            raise
    
    # Check if database file is corrupted
    if os.path.exists(DB_PATH):
        try:
            # Try to open and verify database integrity
            test_conn = sqlite3.connect(DB_PATH, timeout=10.0)
            test_cursor = test_conn.cursor()
            test_cursor.execute("SELECT 1")
            test_conn.close()
            logger.info("✅ Existing database file is valid")
        except sqlite3.DatabaseError as e:
            logger.warning(f"Database file is corrupted ({e}), recreating...")
            try:
                os.remove(DB_PATH)
                logger.info("Removed corrupted database file")
            except Exception as remove_err:
                logger.error(f"Failed to remove corrupted database: {remove_err}")
                raise
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
    except Exception as e:
        logger.error(f"Failed to get database connection: {e}")
        raise
    
    # Create Campaigns Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS campaigns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        campaign_name TEXT NOT NULL,
        uploaded_at TEXT NOT NULL,
        total_shortlisted INTEGER NOT NULL,
        total_rejected INTEGER NOT NULL,
        budget_used REAL NOT NULL,
        remaining_budget REAL NOT NULL,
        tier23_percentage REAL NOT NULL,
        avg_engagement_rate REAL NOT NULL,
        avg_score REAL NOT NULL
    )
    """)
    
    conn.commit()
    
    # Check if empty to seed mock trends
    cursor.execute("SELECT COUNT(*) FROM campaigns")
    count = cursor.fetchone()[0]
    
    if count == 0:
        logger.info("🌱 Seeding database with historical campaign data points...")
        seed_historical_campaigns(cursor)
        conn.commit()
        
    conn.close()
    logger.info("✅ Database initialization complete")


def save_campaign(
    campaign_name: str,
    total_shortlisted: int,
    total_rejected: int,
    budget_used: float,
    remaining_budget: float,
    tier23_percentage: float,
    avg_engagement_rate: float,
    avg_score: float,
    uploaded_at: str = None
):
    """Save a campaign roster snapshot into the database."""
    if not uploaded_at:
        uploaded_at = datetime.utcnow().isoformat()
        
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
        INSERT INTO campaigns (
            campaign_name, uploaded_at, total_shortlisted, total_rejected,
            budget_used, remaining_budget, tier23_percentage, avg_engagement_rate, avg_score
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            campaign_name, uploaded_at, total_shortlisted, total_rejected,
            budget_used, remaining_budget, tier23_percentage, avg_engagement_rate, avg_score
        ))
        
        conn.commit()
        conn.close()
        logger.info(f"💾 Campaign '{campaign_name}' saved to local SQLite history")
    except sqlite3.OperationalError as e:
        logger.error(f"Database error when saving campaign '{campaign_name}': {e}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error when saving campaign '{campaign_name}': {e}")
        raise


def get_all_campaigns():
    """Retrieve all campaign records sorted by date."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM campaigns ORDER BY uploaded_at ASC")
    rows = cursor.fetchall()
    
    campaigns = [dict(row) for row in rows]
    conn.close()
    return campaigns


def delete_campaign(campaign_id: int):
    """Delete a campaign record from history."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("DELETE FROM campaigns WHERE id = ?", (campaign_id,))
    conn.commit()
    conn.close()
    logger.info(f"🗑️ Campaign ID {campaign_id} deleted from history")


def seed_historical_campaigns(cursor):
    """Seed 12 campaign uploads spreading across the last 11 months."""
    now = datetime.utcnow()
    
    # Dynamic seed points spreading back in time
    seed_points = [
        # 2025 Points
        {"name": "D2C Serum Q3-Launch", "days_ago": 300, "short": 18, "rej": 8, "budget": 920000.0, "er": 4.2, "score": 75.2, "t23": 44.4},
        {"name": "Festive Beauty Push", "days_ago": 270, "short": 24, "rej": 11, "budget": 1150000.0, "er": 4.8, "score": 76.5, "t23": 41.7},
        {"name": "Organic Retinol Micro-Boost", "days_ago": 240, "short": 16, "rej": 6, "budget": 840000.0, "er": 5.1, "score": 78.0, "t23": 43.8},
        {"name": "Winter Skincare Blast", "days_ago": 210, "short": 27, "rej": 14, "budget": 1280000.0, "er": 4.5, "score": 74.8, "t23": 40.7},
        {"name": "Glow Cream Launch", "days_ago": 180, "short": 31, "rej": 16, "budget": 1420000.0, "er": 5.3, "score": 79.5, "t23": 45.2},
        {"name": "Year-End Roster Sweep", "days_ago": 150, "short": 22, "rej": 10, "budget": 1050000.0, "er": 4.9, "score": 77.2, "t23": 40.9},
        # 2026 Points
        {"name": "New Year Premium Serum", "days_ago": 120, "short": 29, "rej": 13, "budget": 1320000.0, "er": 5.5, "score": 81.0, "t23": 41.4},
        {"name": "Valentine Hydration Special", "days_ago": 90, "short": 33, "rej": 17, "budget": 1480000.0, "er": 5.8, "score": 82.4, "t23": 42.4},
        {"name": "Holi Brightening Roster", "days_ago": 60, "short": 25, "rej": 12, "budget": 1120000.0, "er": 5.2, "score": 80.5, "t23": 40.0},
        {"name": "Summer Sunscreen Launch", "days_ago": 45, "short": 28, "rej": 15, "budget": 1250000.0, "er": 5.4, "score": 79.8, "t23": 42.9},
        {"name": "May Serum Optimization", "days_ago": 20, "short": 30, "rej": 16, "budget": 1380000.0, "er": 5.7, "score": 82.1, "t23": 43.3},
        {"name": "Dynamic Pre-Audit Roster", "days_ago": 5, "short": 32, "rej": 18, "budget": 1475000.0, "er": 5.9, "score": 83.2, "t23": 43.8},
    ]
    
    for pt in seed_points:
        upload_date = (now - timedelta(days=pt["days_ago"])).isoformat()
        remaining = 1500000.0 - pt["budget"]
        
        cursor.execute("""
        INSERT INTO campaigns (
            campaign_name, uploaded_at, total_shortlisted, total_rejected,
            budget_used, remaining_budget, tier23_percentage, avg_engagement_rate, avg_score
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            pt["name"], upload_date, pt["short"], pt["rej"],
            pt["budget"], remaining, pt["t23"], pt["er"], pt["score"]
        ))
