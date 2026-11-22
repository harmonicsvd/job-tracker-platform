from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.services.email_processor import EmailProcessor
from app.database import get_db
from app.models import JobApplication, JobStatus
from app.schemas import JobApplicationCreate, JobApplicationResponse
from app.schemas_ai import EmailType
from dateutil import parser as dateutil_parser
from app.auth import get_current_user
from app.models import User

router = APIRouter(prefix="/api/gmail", tags=["gmail"])

@router.post("/sync", response_model=List[JobApplicationResponse])
def sync_gmail_emails(
    days_back: int = 7,
    max_results: int = 50,
    batch_size: int = 5,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetch emails from Gmail, analyze with AI, and save job applications to database
    """
    try:
        # Initialize processor
        processor = EmailProcessor(user_id=current_user.id, db=db)

        # Get already processed Gmail message IDs for this user
        processed_message_ids = set(
            row.gmail_message_id for row in
            db.query(JobApplication.gmail_message_id)
            .filter(JobApplication.user_id == current_user.id)
            .filter(JobApplication.gmail_message_id.isnot(None))
            .all()
        )
        print(f"Found {len(processed_message_ids)} already processed message IDs")

        # Fetch and analyze emails, filter for job applications only
        job_emails = processor.get_job_applications_only(days_back=days_back, max_results=max_results, batch_size=batch_size)
        print(f"Found {len(job_emails)} job-related emails")

        saved_applications = []

        for item in job_emails:
            email = item['email']
            analysis = item['analysis']

            # Skip if already processed this Gmail message
            if email['id'] in processed_message_ids:
                print(f"Skipping already processed message: {email['subject'][:50]}...")
                continue

            print(f"Email: {email['subject'][:50]}...")
            print(f"Type: {analysis.email_type}")

            # Skip if not a real application (job ads, etc.)
            if analysis.email_type in ['other_job_related', 'not_job_related']:
                print("  -> Skipping (job ad)")
                continue

            # Check if this company already has an application for THIS USER
            existing = db.query(JobApplication).filter(
                JobApplication.company == analysis.company_name,
                JobApplication.email_subject == email['subject'],
                JobApplication.user_id == current_user.id  # Filter by user
            ).first()

            print(f"  -> Checking for existing company: '{analysis.company_name}', found: {existing is not None}")
            # Create new job application
            # Convert application date if available
            app_date = analysis.application_date
            if not app_date:
                # Parse email date if available
                try:
                    # Gmail date format is like "Fri, 13 Nov 2026 12:00:51 +0000"
                    email_date_str = email['date']
                    # Try to parse it - this is a simple approach
                    # For production, use dateutil.parser for robust parsing
                    #app_date = datetime.strptime(email_date_str.split(',')[1:4].strip(), '%d %b %Y %H:%M:%S')
                    app_date = dateutil_parser.parse(email_date_str)
                except:
                    app_date = None
            
            if existing:
                # Update existing application with new status
                print("  -> Updating existing application")
                # Map AI status to our JobStatus enum
                status_mapping = {
                    'Applied': JobStatus.APPLIED,
                    'Interviewing': JobStatus.INTERVIEWING,
                    'Offer': JobStatus.OFFER,
                    'Rejected': JobStatus.REJECTED,
                    'Withdrawn': JobStatus.WITHDRAWN
                }
                
                # Use AI application_status if available, otherwise infer from email_type
                if analysis.application_status:
                    new_status = status_mapping.get(analysis.application_status.value, existing.status)
                else:
                    # Infer status from email_type when AI doesn't provide application_status
                    email_type_mapping = {
                        EmailType.APPLICATION_CONFIRMATION: JobStatus.APPLIED,
                        EmailType.INTERVIEW_INVITATION: JobStatus.INTERVIEWING,
                        EmailType.REJECTION: JobStatus.REJECTED,
                        EmailType.OFFER: JobStatus.OFFER,
                        EmailType.FOLLOW_UP: JobStatus.APPLIED,
                    }
                    new_status = email_type_mapping.get(analysis.email_type, existing.status)
                
                # Status hierarchy - don't downgrade status
                status_hierarchy = {
                    JobStatus.APPLIED: 1,
                    JobStatus.INTERVIEWING: 2,
                    JobStatus.OFFER: 3,
                    JobStatus.REJECTED: 4,
                    JobStatus.WITHDRAWN: 5
                }

                # Only update if new status is higher priority
                if status_hierarchy.get(new_status, 0) >= status_hierarchy.get(existing.status, 0):
                    existing.status = new_status
                    existing.notes = f"AI analysis: {analysis.reasoning}"
                    existing.updated_at = datetime.now()
                    db.commit()
                    db.refresh(existing)
                    saved_applications.append(existing)
                    continue
                else:
                    print(f"  -> Skipping status update (keeping {existing.status} instead of {new_status})")
                            
            # Map AI status to our JobStatus enum
            status_mapping = {
                'Applied': JobStatus.APPLIED,
                'Interviewing': JobStatus.INTERVIEWING,
                'Offer': JobStatus.OFFER,
                'Rejected': JobStatus.REJECTED,
                'Withdrawn': JobStatus.WITHDRAWN
            }
            
            # Use AI application_status if available, otherwise infer from email_type
            if analysis.application_status:
                status = status_mapping.get(analysis.application_status.value, JobStatus.APPLIED)
            else:
                # Infer status from email_type when AI doesn't provide application_status
                email_type_mapping = {
                    EmailType.APPLICATION_CONFIRMATION: JobStatus.APPLIED,
                    EmailType.INTERVIEW_INVITATION: JobStatus.INTERVIEWING,
                    EmailType.REJECTION: JobStatus.REJECTED,
                    EmailType.OFFER: JobStatus.OFFER,
                    EmailType.FOLLOW_UP: JobStatus.APPLIED,  # Keep as Applied for follow-ups
                }
                status = email_type_mapping.get(analysis.email_type, JobStatus.APPLIED)
            
            new_application = JobApplication(
                user_id=current_user.id,  # Associate with authenticated user
                gmail_message_id=email['id'],  # Track Gmail message ID
                company=analysis.company_name or "Unknown",
                role=analysis.job_title or "Unknown",
                status=status,
                application_date=app_date,
                email_subject=email['subject'],
                email_sender=email['sender'],
                notes=f"AI analysis: {analysis.reasoning}"
            )
            
            db.add(new_application)
            db.commit()
            db.refresh(new_application)
            
            saved_applications.append(new_application)
        
        return saved_applications
        
    except Exception as e:
        db.rollback()
        error_str = str(e)
        # Detect quota errors
        if "Quota exceeded" in error_str or "rateLimitExceeded" in error_str:
            if "gmail.googleapis.com" in error_str:
                raise HTTPException(
                    status_code=429,
                    detail={
                        "error_type": "gmail_quota_exceeded",
                        "message": "Gmail API quota exceeded. Please wait a few minutes and try again."
                    }
                )
            elif "groq" in error_str.lower():
                raise HTTPException(
                    status_code=429,
                    detail={
                        "error_type": "groq_quota_exceeded",
                        "message": "Groq AI quota exceeded. Please change API key or wait for daily reset."
                    }
                )
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
def gmail_health_check():
    """Check if Gmail service is accessible"""
    try:
        from app.services.gmail_service import GmailService
        gmail_service = GmailService()
        return {"status": "healthy", "service": "gmail"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))