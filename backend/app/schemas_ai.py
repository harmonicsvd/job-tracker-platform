from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class EmailType(str, Enum):
    APPLICATION_CONFIRMATION = "application_confirmation"
    INTERVIEW_INVITATION = "interview_invitation"
    REJECTION = "rejection"
    OFFER = "offer"
    FOLLOW_UP = "follow_up"
    OTHER_JOB_RELATED = "other_job_related"
    NOT_JOB_RELATED = "not_job_related"

class JobStatus(str, Enum):
    APPLIED = "Applied"
    INTERVIEWING = "Interviewing"
    OFFER = "Offer"
    REJECTED = "Rejected"
    WITHDRAWN = "Withdrawn"

class EmailAnalysisResult(BaseModel):
    """Structured output from AI for email analysis"""
    is_job_related: bool = Field(
        ...,
        description="Whether this email is related to a job application"
    )
    email_type: Optional[EmailType] = Field(
        None,
        description="Type of job-related email (null if not job-related)"
    )
    company_name: Optional[str] = Field(
        None,
        description="Company name extracted from email (null if not found)"
    )
    job_title: Optional[str] = Field(
        None,
        description="Job title/role extracted from email (null if not found)"
    )
    application_date: Optional[datetime] = Field(
        None,
        description="Date of application mentioned in email (null if not found or unclear)"
    )
    interview_date: Optional[datetime] = Field(
        None,
        description="Date of interview mentioned in email (null if not applicable)"
    )
    application_status: Optional[JobStatus] = Field(
        None,
        description="Inferred application status (null if cannot determine)"
    )
    requires_review: bool = Field(
        default=True,
        description="Whether this email requires human review (true if uncertain)"
    )
    confidence_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Confidence score of the analysis (0.0 to 1.0)"
    )
    reasoning: Optional[str] = Field(
        None,
        description="Brief explanation of the analysis (for debugging/review)"
    )

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }