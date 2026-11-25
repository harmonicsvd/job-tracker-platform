from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import JobApplication, JobStatus
from app.schemas import JobApplicationCreate, JobApplicationUpdate, JobApplicationResponse
from app.auth import get_current_user
from app.models import User


router = APIRouter(prefix="/api/jobs", tags=["jobs"])

@router.post("/", response_model=JobApplicationResponse)
def create_job(job: JobApplicationCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_job = JobApplication(**job.model_dump(), user_id=current_user.id)
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job

@router.get("/", response_model=List[JobApplicationResponse])
def get_jobs(current_user: User = Depends(get_current_user), skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    jobs = db.query(JobApplication).filter(JobApplication.user_id == current_user.id).order_by(JobApplication.application_date.desc()).offset(skip).limit(limit).all()
    return jobs

@router.get("/sync-status")
def get_sync_status(current_user: User = Depends(get_current_user)):
    """Get the current sync status"""
    from app.scheduler import get_sync_status
    return get_sync_status()

@router.get("/{job_id}", response_model=JobApplicationResponse)
def get_job(job_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    job = db.query(JobApplication).filter(
        JobApplication.id == job_id,
        JobApplication.user_id == current_user.id
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.patch("/{job_id}", response_model=JobApplicationResponse)
def update_job(job_id: int, job_update: JobApplicationUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    job = db.query(JobApplication).filter(
        JobApplication.id == job_id,
        JobApplication.user_id == current_user.id
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    update_data = job_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(job, field, value)
    
    db.commit()
    db.refresh(job)
    return job

@router.delete("/{job_id}")
def delete_job(job_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    job = db.query(JobApplication).filter(
        JobApplication.id == job_id,
        JobApplication.user_id == current_user.id
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    db.delete(job)
    db.commit()
    return {"message": "Job deleted successfully"}


