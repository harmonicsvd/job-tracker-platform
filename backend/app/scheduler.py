
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from app.services.email_processor import EmailProcessor
from app.database import SessionLocal
from app.models import JobApplication
import os
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# Global scheduler instance
scheduler = AsyncIOScheduler(timezone="Europe/Berlin")

# Sync history (in-memory for now, can move to database later)
sync_history = {
    "last_sync": None,
    "last_sync_status": None,
    "last_sync_message": None,
    "next_sync": None
}


async def scheduled_sync():
    """Scheduled sync job that runs automatically"""
    try:
        logger.info("Starting scheduled sync...")
        sync_history["last_sync_status"] = "running"
        sync_history["last_sync_message"] = "Sync in progress..."

        # Get sync config from environment
        days_back = int(os.getenv("SYNC_DAYS_BACK", "7"))
        max_results = int(os.getenv("SYNC_MAX_RESULTS", "100"))

        # Create email processor and sync
        processor = EmailProcessor()
        result = await processor.fetch_and_analyze_emails(
            days_back=days_back,
            max_results=max_results,
            batch_size=5
        )

        # Update sync history
        sync_history["last_sync"] = datetime.now()
        sync_history["last_sync_status"] = "success"
        sync_history["last_sync_message"] = (
            f"Synced {result.get('total_emails', 0)} emails, "
            f"found {result.get('job_applications_found', 0)} job applications"
        )

        logger.info(f"Scheduled sync completed: {sync_history['last_sync_message']}")

    except Exception as e:
        logger.error(f"Scheduled sync failed: {e}")
        sync_history["last_sync_status"] = "failed"
        sync_history["last_sync_message"] = f"Error: {str(e)}"


def start_scheduler():
    """Start the APScheduler with configured schedule"""

    schedule = os.getenv("SYNC_SCHEDULE", "0 18 * * *")

    print(f"DEBUG: Starting scheduler with schedule: {schedule}")

    # Add scheduled job
    scheduler.add_job(
        scheduled_sync,
        trigger=CronTrigger.from_crontab(
            schedule,
            timezone="Europe/Berlin"
        ),
        id="gmail_sync",
        name="Gmail Sync",
        replace_existing=True
    )

    print("DEBUG: Job added to scheduler")

    # Start scheduler if not already running
    if not scheduler.running:
        scheduler.start()

    print(f"DEBUG: Scheduler started, running: {scheduler.running}")

    # Get next execution time directly from APScheduler
    job = scheduler.get_job("gmail_sync")

    if job:
        sync_history["next_sync"] = job.next_run_time
        print(f"DEBUG: Next sync at: {sync_history['next_sync']}")

    logger.info(f"Scheduler started with schedule: {schedule}")
    logger.info(f"Next sync at: {sync_history['next_sync']}")


def get_sync_status():
    """Get current sync status"""

    job = scheduler.get_job("gmail_sync")

    if job:
        sync_history["next_sync"] = job.next_run_time
    else:
        sync_history["next_sync"] = None

    return {
        "last_sync": (
            sync_history["last_sync"].isoformat()
            if sync_history["last_sync"] else None
        ),
        "last_sync_status": sync_history["last_sync_status"],
        "last_sync_message": sync_history["last_sync_message"],
        "next_sync": (
            sync_history["next_sync"].isoformat()
            if sync_history["next_sync"] else None
        ),
        "scheduler_running": scheduler.running
    }
