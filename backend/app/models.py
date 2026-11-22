from sqlalchemy import Column, Integer, String, DateTime, Text, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

class JobStatus(str, enum.Enum):
    APPLIED = "Applied"
    INTERVIEWING = "Interviewing"
    OFFER = "Offer"
    REJECTED = "Rejected"
    WITHDRAWN = "Withdrawn"

class JobApplication(Base):
    __tablename__ = "job_applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    gmail_message_id = Column(String(255), nullable=True, index=True)  # Track Gmail message ID
    company = Column(String, nullable=False)
    role = Column(String, nullable=False)
    status = Column(SQLEnum(JobStatus), default=JobStatus.APPLIED, nullable=False)
    application_date = Column(DateTime, nullable=True)
    email_subject = Column(Text)
    email_sender = Column(String)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationship to User
    user = relationship("User", backref="job_applications")

    def __repr__(self):
        return f"<JobApplication {self.company} - {self.role}>"


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    google_id = Column(String(255), unique=True, nullable=True)
    name = Column(String(255), nullable=True)
    picture = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<User {self.email}>"

class GmailToken(Base):
    __tablename__ = "gmail_tokens"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=False)  # Will add ForeignKey relationship later
    access_token = Column(Text, nullable=False)
    refresh_token = Column(Text, nullable=False)
    token_uri = Column(String(255), nullable=False)
    client_id = Column(String(255), nullable=False)
    client_secret = Column(String(255), nullable=False)
    scopes = Column(Text, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<GmailToken for user_id={self.user_id}>"