import ollama
import json
from typing import Optional
from app.services.ai_service import AIServiceBase
from app.schemas_ai import EmailAnalysisResult, EmailType, JobStatus

class OllamaAIService(AIServiceBase):
    """Ollama-based AI service implementation"""
    
    def __init__(self, model: str = "llama3.2:3b"):
        self.model = model
        self.client = ollama.Client()
    
    def analyze_email(
        self,
        email_subject: str,
        email_sender: str,
        email_body: str,
        email_date: Optional[str] = None
    ) -> EmailAnalysisResult:
        """
        Analyze email using Ollama LLM
        """
        # Build the prompt
        prompt = self._build_prompt(email_subject, email_sender, email_body, email_date)
        
        try:
            # Call Ollama API
            response = self.client.chat(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert at analyzing job application emails. Extract information accurately and return structured JSON."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                format="json"  # Request JSON output
            )
            
            # Parse the response
            result_text = response.message.content
            result_dict = json.loads(result_text)
            
            # Validate with Pydantic
            return EmailAnalysisResult(**result_dict)
            
        except Exception as e:
            # Return a safe default on error
            return EmailAnalysisResult(
                is_job_related=False,
                email_type=None,
                company_name=None,
                job_title=None,
                application_date=None,
                interview_date=None,
                application_status=None,
                requires_review=True,
                confidence_score=0.0,
                reasoning=f"Error during analysis: {str(e)}"
            )
    
    def health_check(self) -> bool:
        """Check if Ollama is running"""
        try:
            self.client.list()
            return True
        except Exception:
            return False
    
    def _build_prompt(
        self,
        subject: str,
        sender: str,
        body: str,
        date: Optional[str] = None
    ) -> str:
        """Build the analysis prompt"""
        prompt = f"""Analyze this email and determine if it's related to a job application.

Email Details:
- Subject: {subject}
- From: {sender}
- Date: {date or 'Not specified'}
- Body: {body[:2000]}  # Truncate if too long

Extract the following information and return as JSON:
{{
  "is_job_related": true/false,
  "email_type": "application_confirmation" | "interview_invitation" | "rejection" | "offer" | "follow_up" | "other_job_related" | "not_job_related",
  "company_name": "company name or null",
  "job_title": "job title or null",
  "application_date": "YYYY-MM-DD or null",
  "interview_date": "YYYY-MM-DD or null",
  "application_status": "Applied" | "Interviewing" | "Offer" | "Rejected" | "Withdrawn" or null,
  "requires_review": true/false,
  "confidence_score": 0.0 to 1.0,
  "reasoning": "brief explanation"
}}

Important:
- Return null for any missing information
- Do not guess or hallucinate
- Be conservative with confidence scores
- Set requires_review=true if uncertain
"""
        return prompt