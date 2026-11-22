from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from authlib.integrations.starlette_client import OAuth
from starlette.requests import Request
from starlette.responses import RedirectResponse
from app.database import get_db
from app.models import User, GmailToken
from app.auth import create_access_token, get_current_user
from datetime import datetime, timedelta, timezone
import os

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Google OAuth setup
oauth = OAuth()
oauth.register(
    name='google',
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid email profile https://www.googleapis.com/auth/gmail.readonly'
    }
)

@router.get("/google")
async def google_login(request: Request):
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")
    return await oauth.google.authorize_redirect(
        request,
        redirect_uri,
        access_type='offline',  # Force refresh token
        prompt='consent'  # Force consent screen
    )

@router.get("/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = await oauth.google.parse_id_token(request, token)

        if not user_info:
            # Fallback: fetch user info from Google's userinfo endpoint
            userinfo_resp = await oauth.google.get('https://www.googleapis.com/oauth2/v3/userinfo', token=token)
            user_info = userinfo_resp.json()
        
        
        email = user_info.get('email')
        google_id = user_info.get('sub')
        name = user_info.get('name')
        picture = user_info.get('picture')
        
        # Check if user exists
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            # Create new user
            user = User(
                email=email,
                google_id=google_id,
                name=name,
                picture=picture
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # Store Gmail token
        gmail_token = db.query(GmailToken).filter(GmailToken.user_id == user.id).first()

        if not gmail_token:
            gmail_token = GmailToken(
                user_id=user.id,
                access_token=token.get('access_token'),
                refresh_token=token.get('refresh_token') or '',  # Handle None
                token_uri='https://oauth2.googleapis.com/token',
                client_id=os.getenv("GOOGLE_CLIENT_ID"),
                client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
                scopes='https://www.googleapis.com/auth/gmail.readonly',
                expires_at=datetime.now(timezone.utc) + timedelta(seconds=token.get('expires_in', 3600))
            )
            db.add(gmail_token)
            db.commit()
        else:
            # Update existing token with new values
            gmail_token.access_token = token.get('access_token')
            # Only update refresh_token if we got a new one (it's only sent on first consent)
            if token.get('refresh_token'):
                gmail_token.refresh_token = token.get('refresh_token')
            gmail_token.expires_at = datetime.now(timezone.utc) + timedelta(seconds=token.get('expires_in', 3600))
            db.commit()
        
        # Create JWT
        access_token = create_access_token(data={"sub": user.email})
        
        # Redirect to frontend with token
       # Redirect to frontend with token
        frontend_url = "http://localhost:5173/?token=" + access_token
        return RedirectResponse(url=frontend_url)
        
    except Exception as error:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OAuth error: {str(error)}"
        )

@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "picture": current_user.picture
    }