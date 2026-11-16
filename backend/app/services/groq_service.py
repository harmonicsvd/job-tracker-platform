import os
from groq import Groq
from typing import Optional
from app.services.ai_service import AIServiceBase
from app.schemas_ai import EmailAnalysisResult
from dotenv import load_dotenv

# Load .env from the backend directory
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(backend_dir, '.env'))

class GroqAIService(AIServiceBase):
    """Groq-based AI service implementation"""
    
    def __init__(self, model: str = "openai/gpt-oss-120b"):
        self.model = model
        self.api_key = os.getenv("GROQ_API_KEY")
        if not self.api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables")
        self.client = Groq(api_key=self.api_key)
    
    def analyze_email(
        self,
        email_subject: str,
        email_sender: str,
        email_body: str,
        email_date: Optional[str] = None
    ) -> EmailAnalysisResult:
        """
        Analyze email using Groq LLM
        """
        # Build the prompt
        prompt = self._build_prompt(email_subject, email_sender, email_body, email_date)
        
        try:
            # Call Groq API
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert at analyzing job application emails. Extract information accurately and return ONLY valid JSON. Return null for any missing information."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                response_format={"type": "json_object"},
                temperature=0.1  # Low temperature for more deterministic output
            )
            
            # Parse the response
            result_text = response.choices[0].message.content
            import json
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
        """Check if Groq API is accessible"""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": "test"}],
                max_tokens=1
            )
            return True
        except Exception as e:
            print(f"Health check error: {e}")
            return False
    def _build_prompt(
    self,
    subject: str,
    sender: str,
    body: str,
    date: Optional[str] = None
) -> str:
        """Build the analysis prompt"""
        prompt = f"""You are analyzing emails from the Primary Gmail inbox to identify job application lifecycle events.

Email Details:
- Subject: {subject}
- From: {sender}
- Date: {date or 'Not specified'}
- Body: {body[:3000]}

TASK: Determine if this email is related to a JOB APPLICATION the user has submitted (not job ads or newsletters).

CLASSIFICATION RULES:
- IS JOB APPLICATION (is_job_related=true): Email is a response TO the user's application or a follow-up about an application they submitted.
  Keywords: "your application", "we received your application", "thank you for applying", "interview", "rejection", "offer", "your candidacy", "next steps", "screening call"
  
- IS NOT JOB APPLICATION (is_job_related=false): Job ads, newsletters, invitations to apply, generic job alerts
  Keywords: "apply now", "we're hiring", "job opening", "position available", "click to apply", "new job opportunities", "job alert"

EMAIL_TYPES (only if is_job_related=true):
- application_confirmation: "We received your application", "Application submitted successfully"
- interview_invitation: "Interview scheduled", "Let's schedule", "Screening call", "Technical interview"
- rejection: "We regret to inform", "not selected", "we have decided to move forward", "unfortunately"
- offer: "We are pleased to offer", "Congratulations", "Job offer"
- follow_up: "Checking in", "Update on your application", "Status update"
- other_job_related: Job-related but doesn't fit above categories

Extract the following information and return as JSON:
{{
  "is_job_related": true or false,
  "email_type": "application_confirmation" | "interview_invitation" | "rejection" | "offer" | "follow_up" | "other_job_related" | "not_job_related",
  "company_name": "company name or null",
  "job_title": "job title or null",
  "application_date": "YYYY-MM-DD or null",
  "interview_date": "YYYY-MM-DD or null",
  "application_status": "Applied" | "Interviewing" | "Offer" | "Rejected" | "Withdrawn" or null,
  "requires_review": true or false,
  "confidence_score": 0.0 to 1.0,
  "reasoning": "brief explanation of classification"
}}

IMPORTANT:
- is_job_related=true ONLY if email is a response to a submitted application
- Return null for any missing information
- Do not guess or hallucinate
- application_status should match the email_type: application_confirmation→Applied, interview_invitation→Interviewing, rejection→Rejected, offer→Offer
"""
        return prompt