import os
import base64
from email.mime.text import MIMEText
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from dotenv import load_dotenv
from typing import List, Dict, Optional
from datetime import datetime, timedelta

# Load .env
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(backend_dir, '.env'))

SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']

class GmailService:
    """Service for interacting with Gmail API"""
    
    def __init__(self):
        self.creds = self._get_credentials()
        self.service = build('gmail', 'v1', credentials=self.creds)
    
    def _get_credentials(self):
        """Get valid credentials"""
        token_file = os.getenv("GMAIL_TOKEN_FILE", "token.json")
        credentials_file = os.getenv("GMAIL_CREDENTIALS_FILE", "credentials.json")
        
        creds = None
        if os.path.exists(token_file):
            creds = Credentials.from_authorized_user_file(token_file, SCOPES)
        
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                raise Exception("No valid credentials found. Run auth_gmail.py first")
        
        return creds
    
    def get_recent_emails(self, days_back: int = 7, max_results: int = 50) -> List[Dict]:
        """
        Fetch recent emails from Gmail
        
        Args:
            days_back: How many days back to fetch emails
            max_results: Maximum number of emails to fetch
        
        Returns:
            List of email dictionaries with id, subject, sender, body, date
        """
        # Calculate date filter
        date_filter = (datetime.now() - timedelta(days=days_back)).strftime('%Y/%m/%d')
        
        # Search query
        query = f'after:{date_filter}'
        
        try:
            results = self.service.users().messages().list(
                userId='me',
                q=query,
                maxResults=max_results
            ).execute()
            
            messages = results.get('messages', [])
            emails = []
            
            for msg in messages:
                email_data = self._get_email_details(msg['id'])
                if email_data:
                    emails.append(email_data)
            
            return emails
            
        except Exception as e:
            print(f"Error fetching emails: {e}")
            return []
    
    def _get_email_details(self, message_id: str) -> Optional[Dict]:
        """Get full email details including body"""
        try:
            message = self.service.users().messages().get(
                userId='me',
                id=message_id,
                format='full'
            ).execute()
            
            # Extract headers
            headers = {}
            for header in message['payload']['headers']:
                headers[header['name'].lower()] = header['value']
            
            # Extract body
            body = self._extract_body(message['payload'])
            
            return {
                'id': message_id,
                'subject': headers.get('subject', ''),
                'sender': headers.get('from', ''),
                'date': headers.get('date', ''),
                'body': body,
                'snippet': message.get('snippet', '')
            }
            
        except Exception as e:
            print(f"Error getting email details: {e}")
            return None
    
    def _extract_body(self, payload: Dict) -> str:
        """Extract email body from payload"""
        body = ""
        
        if 'body' in payload:
            if 'data' in payload['body']:
                body = base64.urlsafe_b64decode(payload['body']['data']).decode('utf-8')
        
        if 'parts' in payload:
            for part in payload['parts']:
                part_body = self._extract_body(part)
                if part_body:
                    body += part_body
        
        return body