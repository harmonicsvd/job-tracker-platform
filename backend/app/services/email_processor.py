from app.services.gmail_service import GmailService
from app.services.groq_service import GroqAIService
from app.schemas_ai import EmailAnalysisResult
from typing import List, Dict

class EmailProcessor:
    """Service to fetch emails and analyze them with LLM"""
    
    def __init__(self):
        self.gmail_service = GmailService()
        self.ai_service = GroqAIService()
    
    def fetch_and_analyze_emails(self, days_back: int = 7, max_results: int = 50) -> List[Dict]:
        """
        Fetch emails from Gmail and analyze them with LLM
        
        Returns:
            List of dictionaries with email data + LLM analysis
        """

        print(f"[Processor] Starting fetch and analyze...")
        # Fetch emails
        emails = self.gmail_service.get_recent_emails(days_back=days_back, max_results=max_results)
        print(f"[Processor] Got {len(emails)} emails from Gmail")

        # Analyze each email
        analyzed_emails = []
        for idx, email in enumerate(emails, 1):
            try:
                print(f"[Processor] Analyzing email {idx}/{len(emails)}: {email['subject'][:50]}...")
                analysis = self.ai_service.analyze_email(
                    email_subject=email['subject'],
                    email_sender=email['sender'],
                    email_body=email['body'],
                    email_date=email['date']
                )
                
                analyzed_emails.append({
                    'email': email,
                    'analysis': analysis
                })
                
                print(f"[Processor] Email {idx} - Job related: {analysis.is_job_related}, Type: {analysis.email_type}")
                print(f"[Processor]   Reasoning: {analysis.reasoning}")
            except Exception as e:
                print(f"Error analyzing email {email['id']}: {e}")
                analyzed_emails.append({
                    'email': email,
                    'analysis': None,
                    'error': str(e)
                })
        print(f"[Processor] Analyzed {len(analyzed_emails)} emails total")
        return analyzed_emails
    
    def get_job_applications_only(self, days_back: int = 7, max_results: int = 50) -> List[Dict]:
        """
        Fetch and analyze emails, return only job-related ones
        
        Returns:
            List of job application emails with LLM analysis
        """
        analyzed_emails = self.fetch_and_analyze_emails(days_back, max_results)
        
        # Filter for job-related only
        job_emails = [
            item for item in analyzed_emails
            if item['analysis'] and item['analysis'].is_job_related
        ]
        
        return job_emails