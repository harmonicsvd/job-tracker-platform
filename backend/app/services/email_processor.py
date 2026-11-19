from app.services.gmail_service import GmailService
from app.services.groq_service import GroqAIService
from app.schemas_ai import EmailAnalysisResult
from typing import List, Dict

class EmailProcessor:
    """Service to fetch emails and analyze them with LLM"""
    
    def __init__(self):
        self.gmail_service = GmailService()
        self.ai_service = GroqAIService()
    
    def fetch_and_analyze_emails(self, days_back: int = 7, max_results: int = 50, batch_size: int = 5) -> List[Dict]:
        """
        Fetch emails from Gmail and analyze them with LLM in batches
        
        Args:
            days_back: Number of days to look back
            max_results: Maximum number of emails to fetch
            batch_size: Number of emails to analyze per API call
        
        Returns:
            List of dictionaries with email data + LLM analysis
        """
        print(f"[Processor] Starting fetch and analyze with batch_size={batch_size}...")
        
        # Fetch emails
        emails = self.gmail_service.get_recent_emails(days_back=days_back, max_results=max_results)
        print(f"[Processor] Got {len(emails)} emails from Gmail")

        # Prepare emails for batch analysis
        email_data = [
            {
                'subject': email['subject'],
                'sender': email['sender'],
                'body': email['body'],
                'date': email['date']
            }
            for email in emails
        ]

        # Analyze in batches
        print(f"[Processor] Analyzing {len(email_data)} emails in batches of {batch_size}...")
        analyses = self.ai_service.analyze_emails_batch(email_data, batch_size)
        
        # Combine results
        analyzed_emails = []
        for email, analysis in zip(emails, analyses):
            analyzed_emails.append({
                'email': email,
                'analysis': analysis
            })
            
            print(f"[Processor] Email {email['subject'][:50]}... - Job related: {analysis.is_job_related}, Type: {analysis.email_type}")
            #print(f"[Processor]   Reasoning: {analysis.reasoning}")
        
        print(f"[Processor] Analyzed {len(analyzed_emails)} emails total")
        return analyzed_emails
        
    def get_job_applications_only(self, days_back: int = 7, max_results: int = 50, batch_size: int = 5) -> List[Dict]:
        """
        Fetch and analyze emails in streaming batches, return only job-related ones
        
        Returns:
            List of job application emails with LLM analysis
        """
        analyzed_emails = self.fetch_and_analyze_emails_streaming(days_back, max_results, batch_size)
        
        # Filter for job-related only
        job_emails = [
            item for item in analyzed_emails
            if item['analysis'] and item['analysis'].is_job_related
        ]
        
        return job_emails

    def fetch_and_analyze_emails_streaming(self, days_back: int = 7, max_results: int = 50, groq_batch_size: int = 5, gmail_batch_size: int = 30) -> List[Dict]:
        """
        Fetch and analyze emails in streaming batches to avoid rate limits
        Processes Gmail batches immediately with Groq instead of waiting for all emails
        
        Args:
            days_back: Number of days to look back
            max_results: Maximum number of emails to fetch
            groq_batch_size: Number of emails per Groq API call
            gmail_batch_size: Number of emails per Gmail batch
        
        Returns:
            List of dictionaries with email data + LLM analysis
        """
        print(f"[Processor] Starting streaming fetch-and-analyze...")
        print(f"[Processor] Gmail batch size: {gmail_batch_size}, Groq batch size: {groq_batch_size}")
        
        analyzed_emails = []
        
        # Process Gmail batches as they arrive
        for gmail_batch in self.gmail_service.get_recent_emails_streaming(days_back, max_results, gmail_batch_size):
            print(f"[Processor] Processing Gmail batch of {len(gmail_batch)} emails")
            
            # Prepare emails for Groq analysis
            email_data = [
                {
                    'subject': email['subject'],
                    'sender': email['sender'],
                    'body': email['body'],
                    'date': email['date']
                }
                for email in gmail_batch
            ]
            
            # Analyze this batch with Groq
            print(f"[Processor] Analyzing {len(email_data)} emails with Groq...")
            analyses = self.ai_service.analyze_emails_batch(email_data, groq_batch_size)
            
            # Combine results
            for email, analysis in zip(gmail_batch, analyses):
                analyzed_emails.append({
                    'email': email,
                    'analysis': analysis
                })
                
                if analysis.is_job_related:
                    print(f"[Processor] ✓ {email['subject'][:40]}... - {analysis.email_type} - {analysis.company_name}")
                elif "error" in str(analysis.reasoning).lower():
                    print(f"[Processor] ✗ {email['subject'][:40]}... - ERROR: {analysis.reasoning[:50]}")
        
        print(f"[Processor] Streaming complete: Analyzed {len(analyzed_emails)} emails total")
        return analyzed_emails