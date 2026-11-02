from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from app.models import JobStatus

class JobApplicationBase(BaseModel):
    company: str = Field(..., min_length=1, max_length=200)
    role: str = Field(..., min_length=1, max_length=200)
    status: JobStatus = JobStatus.APPLIED
    application_date: datetime
    email_subject: Optional[str] = None
    email_sender: Optional[str] = None
    notes: Optional[str] = None

class JobApplicationCreate(JobApplicationBase):
    pass

class JobApplicationUpdate(BaseModel):
    company: Optional[str] = Field(None, min_length=1, max_length=200)
    role: Optional[str] = Field(None, min_length=1, max_length=200)
    status: Optional[JobStatus] = None
    application_date: Optional[datetime] = None
    notes: Optional[str] = None

class JobApplicationResponse(JobApplicationBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True