import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.gmail_service import GmailService

def test_gmail_service():
    """Test Gmail service by fetching recent emails"""
    
    # Initialize the service
    gmail_service = GmailService()
    
    print("Fetching recent emails from Gmail...")
    
    # Fetch recent emails (last 7 days, max 5)
    emails = gmail_service.get_recent_emails(days_back=7, max_results=5)
    
    print(f"\nFound {len(emails)} emails")
    print("="*50)
    
    for i, email in enumerate(emails, 1):
        print(f"\nEmail {i}:")
        print(f"Subject: {email['subject']}")
        print(f"From: {email['sender']}")
        print(f"Date: {email['date']}")
        print(f"Body preview: {email['snippet'][:100]}...")
        print("-"*50)
    
    return True

if __name__ == "__main__":
    test_gmail_service()