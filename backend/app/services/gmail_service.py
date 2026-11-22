import os
import base64
from email.mime.text import MIMEText
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from dotenv import load_dotenv
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import time
from sqlalchemy.orm import Session
from app.models import GmailToken

# Load .env
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(backend_dir, '.env'))

SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']

class GmailService:
    """Service for interacting with Gmail API"""
    
    def __init__(self, user_id: int = None, db: Session = None):
        self.user_id = user_id
        self.db = db
        self.creds = self._get_credentials()
        if self.creds:
            self.service = build('gmail', 'v1', credentials=self.creds)
    
    def _get_credentials(self):
        """Get valid credentials from database for the user"""
        if not self.user_id or not self.db:
            raise Exception("User ID and database session required")
        
        # Get token from database
        gmail_token = self.db.query(GmailToken).filter(
            GmailToken.user_id == self.user_id
        ).first()
        
        if not gmail_token:
            raise Exception("No Gmail token found for user")
        
        from google.oauth2.credentials import Credentials
        creds = Credentials(
            token=gmail_token.access_token,
            refresh_token=gmail_token.refresh_token,
            token_uri=gmail_token.token_uri,
            client_id=gmail_token.client_id,
            client_secret=gmail_token.client_secret,
            scopes=gmail_token.scopes.split(',')
        )
        
        # Refresh if expired
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
            # Update in database
            gmail_token.access_token = creds.token
            gmail_token.expires_at = creds.expiry
            self.db.commit()
        
        return creds
    
    def get_recent_emails(self, days_back: int = 7, max_results: int = 50,  db: Session = None) -> List[Dict]:
        """
        Fetch recent emails from Gmail with batched fetching to avoid quota limits
        
        Args:
            days_back: How many days back to fetch emails
            max_results: Maximum number of emails to fetch
        
        Returns:
            List of email dictionaries with id, subject, sender, body, date
        """
        if db:
            self.db = db
        # Calculate date filter
        date_filter = (datetime.now() - timedelta(days=days_back)).strftime('%Y/%m/%d')
        
        # Search query
        query = f'after:{date_filter} category:primary'

        print(f"[Gmail] Fetching emails with query: {query}, max_results: {max_results}")
        
        # Batch configuration
        batch_size = 30  # Safe batch size for Gmail quota
        cooldown_seconds = 60  # 1 minute cooldown between batches
        
        emails = []
        page_token = None
        total_fetched = 0
        batch_number = 0
        
        try:
            while total_fetched < max_results:
                batch_number += 1
                # Calculate how many to fetch in this batch
                remaining = max_results - total_fetched
                current_batch_size = min(batch_size, remaining)
                
                print(f"[Gmail] Batch {batch_number}: Fetching {current_batch_size} emails (total: {total_fetched}/{max_results})")
                
                # Fetch message IDs for this batch
                results = self.service.users().messages().list(
                    userId='me',
                    q=query,
                    maxResults=current_batch_size,
                    pageToken=page_token
                ).execute()
                
                messages = results.get('messages', [])
                if not messages:
                    print(f"[Gmail] No more messages found")
                    break
                
                print(f"[Gmail] Batch {batch_number}: Found {len(messages)} message IDs")
                
                # Fetch email details for this batch
                for msg in messages:
                    email_data = self._get_email_details(msg['id'])
                    if email_data:
                        emails.append(email_data)
                        total_fetched += 1
                    # Small delay between individual email fetches
                    time.sleep(0.1)
                
                print(f"[Gmail] Batch {batch_number}: Fetched {len(emails)} emails total")
                
                # Check if we need to fetch more
                if total_fetched >= max_results:
                    break
                
                # Get next page token for pagination
                page_token = results.get('nextPageToken')
                if not page_token:
                    print(f"[Gmail] No more pages available")
                    break
                
                # Cooldown before next batch to respect Gmail quota
                print(f"[Gmail] Waiting {cooldown_seconds} seconds for Gmail quota cooldown...")
                time.sleep(cooldown_seconds)
                    
            print(f"[Gmail] Successfully fetched {len(emails)} full emails")
            return emails
            
        except Exception as e:
            print(f"Error fetching emails: {e}")
            return emails  # Return whatever we've fetched so far
    
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
    

    def get_recent_emails_streaming(self, days_back: int = 7, max_results: int = 50, batch_size: int = 30) -> List[Dict]:
        """
        Fetch emails in streaming batches - yields batches as they arrive
        This allows immediate Groq analysis to avoid rate limits
        
        Args:
            days_back: How many days back to fetch emails
            max_results: Maximum number of emails to fetch
            batch_size: Number of emails per Gmail batch
        
        Yields:
            List of email dictionaries for each batch
        """
        # Calculate date filter
        date_filter = (datetime.now() - timedelta(days=days_back)).strftime('%Y/%m/%d')
        
        # Search query
        query = f'after:{date_filter} category:primary'

        print(f"[Gmail] Streaming fetch with query: {query}, max_results: {max_results}, batch_size: {batch_size}")
        
        # Cooldown between batches (in seconds)
        cooldown_seconds = 0
        
        page_token = None
        total_fetched = 0
        batch_number = 0
        
        try:
            while total_fetched < max_results:
                batch_number += 1
                # Calculate how many to fetch in this batch
                remaining = max_results - total_fetched
                current_batch_size = min(batch_size, remaining)
                
                print(f"[Gmail] Streaming Batch {batch_number}: Fetching {current_batch_size} emails (total: {total_fetched}/{max_results})")
                
                # Fetch message IDs for this batch
                results = self.service.users().messages().list(
                    userId='me',
                    q=query,
                    maxResults=current_batch_size,
                    pageToken=page_token
                ).execute()
                
                messages = results.get('messages', [])
                if not messages:
                    print(f"[Gmail] No more messages found")
                    break
                
                print(f"[Gmail] Streaming Batch {batch_number}: Found {len(messages)} message IDs")
                
                # Fetch email details for this batch
                batch_emails = []
                for msg in messages:
                    email_data = self._get_email_details(msg['id'])
                    if email_data:
                        batch_emails.append(email_data)
                        total_fetched += 1
                    # Small delay between individual email fetches
                    time.sleep(0.1)
                
                print(f"[Gmail] Streaming Batch {batch_number}: Yielding {len(batch_emails)} emails")
                yield batch_emails
                
                # Check if we need to fetch more
                if total_fetched >= max_results:
                    break
                
                # Get next page token for pagination
                page_token = results.get('nextPageToken')
                if not page_token:
                    print(f"[Gmail] No more pages available")
                    break
                
                # Cooldown before next batch to respect Gmail quota
                print(f"[Gmail] Waiting {cooldown_seconds} seconds for Gmail quota cooldown...")
                time.sleep(cooldown_seconds)
                    
            print(f"[Gmail] Streaming complete: Fetched {total_fetched} emails total")
            
        except Exception as e:
            print(f"Error in streaming fetch: {e}")