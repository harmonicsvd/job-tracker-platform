from abc import ABC, abstractmethod
from typing import Optional
from app.schemas_ai import EmailAnalysisResult

class AIServiceBase(ABC):
    """Abstract base class for AI services (modular design)"""
    
    @abstractmethod
    def analyze_email(
        self,
        email_subject: str,
        email_sender: str,
        email_body: str,
        email_date: Optional[str] = None
    ) -> EmailAnalysisResult:
        """
        Analyze an email and extract job application information.
        
        Args:
            email_subject: Email subject line
            email_sender: Email sender address
            email_body: Email body content
            email_date: Email date (optional)
        
        Returns:
            EmailAnalysisResult: Structured analysis result
        """
        pass
    
    @abstractmethod
    def health_check(self) -> bool:
        """Check if the AI service is available and working"""
        pass