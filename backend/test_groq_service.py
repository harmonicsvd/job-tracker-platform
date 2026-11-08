import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.groq_service import GroqAIService
from dotenv import load_dotenv
# Load .env from current directory
load_dotenv()

#print(f"Current directory: {os.getcwd()}")
#print(f".env file exists: {os.path.exists('.env')}")
#print(f"GROQ_API_KEY loaded: {'Yes' if os.getenv('GROQ_API_KEY') else 'No'}")
#print(f"GROQ_API_KEY value: {os.getenv('GROQ_API_KEY', 'NOT FOUND')[:10]}..." if os.getenv('GROQ_API_KEY') else "NOT FOUND")



def test_groq_service():
    """Test the Groq AI service with a sample email"""
    
    # Initialize the service
    ai_service = GroqAIService(model="openai/gpt-oss-20b")
    
    # Health check
    print("Checking Groq API health...")
    if not ai_service.health_check():
        print("❌ Groq API is not accessible. Check your API key.")
        return False
    print("✅ Groq API is accessible")
    
    # Test email
    test_email = {
        "subject": "Application for Senior Software Engineer - Google",
        "sender": "recruiting@google.com",
        "body": """
        Dear Candidate,
        
        Thank you for applying to Google for the Senior Software Engineer position.
        We have received your application and will review it shortly.
        
        If your qualifications match our requirements, we will contact you for an interview.
        
        Best regards,
        Google Recruiting Team
        """,
        "date": "2024-01-15"
    }
    
    print("\nAnalyzing test email...")
    print(f"Subject: {test_email['subject']}")
    print(f"From: {test_email['sender']}")
    
    # Analyze
    result = ai_service.analyze_email(
        email_subject=test_email["subject"],
        email_sender=test_email["sender"],
        email_body=test_email["body"],
        email_date=test_email["date"]
    )
    
    # Print results
    print("\n" + "="*50)
    print("ANALYSIS RESULT:")
    print("="*50)
    print(f"Is Job Related: {result.is_job_related}")
    print(f"Email Type: {result.email_type}")
    print(f"Company: {result.company_name}")
    print(f"Job Title: {result.job_title}")
    print(f"Application Status: {result.application_status}")
    print(f"Confidence Score: {result.confidence_score}")
    print(f"Requires Review: {result.requires_review}")
    print(f"Reasoning: {result.reasoning}")
    print("="*50)
    
    return True

if __name__ == "__main__":
    test_groq_service()