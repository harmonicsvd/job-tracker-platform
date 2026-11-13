import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.email_processor import EmailProcessor

from dotenv import load_dotenv
load_dotenv()

def test_email_processor():
    """Test email processor - fetch emails and analyze with AI"""
    
    # Initialize the processor
    processor = EmailProcessor()
    
    print("Fetching and analyzing emails...")
    print("="*50)
    
    # Fetch and analyze recent emails
    analyzed_emails = processor.fetch_and_analyze_emails(days_back=7, max_results=5)
    
    print(f"\nAnalyzed {len(analyzed_emails)} emails")
    print("="*50)
    
    for i, item in enumerate(analyzed_emails, 1):
        email = item['email']
        analysis = item['analysis']
        
        print(f"\nEmail {i}:")
        print(f"Subject: {email['subject']}")
        print(f"From: {email['sender']}")
        
        if analysis:
            print(f"Is Job Related: {analysis.is_job_related}")
            if analysis.is_job_related:
                print(f"Company: {analysis.company_name}")
                print(f"Job Title: {analysis.job_title}")
                print(f"Status: {analysis.application_status}")
                print(f"Confidence: {analysis.confidence_score}")
            print(f"Reasoning: {analysis.reasoning}")
        else:
            print(f"Analysis failed: {item.get('error', 'Unknown error')}")
        
        print("-"*50)
    
    # Now test filtering for job applications only
    print("\n\n" + "="*50)
    print("JOB APPLICATIONS ONLY:")
    print("="*50)
    
    job_emails = processor.get_job_applications_only(days_back=7, max_results=5)
    
    print(f"\nFound {len(job_emails)} job application emails")
    
    for i, item in enumerate(job_emails, 1):
        email = item['email']
        analysis = item['analysis']
        
        print(f"\nJob Application {i}:")
        print(f"Company: {analysis.company_name}")
        print(f"Role: {analysis.job_title}")
        print(f"Status: {analysis.application_status}")
        print(f"Email Type: {analysis.email_type}")
        print(f"Confidence: {analysis.confidence_score}")
        print("-"*50)

if __name__ == "__main__":
    test_email_processor()