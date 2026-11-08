from fastapi import APIRouter, HTTPException
from app.services.groq_service import GroqAIService
from app.schemas_ai import EmailAnalysisResult, EmailAnalysisRequest

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.post("/analyze-email", response_model=EmailAnalysisResult)
def analyze_email(request: EmailAnalysisRequest):
    """
    Analyze an email to extract job application information
    """
    try:
        ai_service = GroqAIService()
        result = ai_service.analyze_email(
            email_subject=request.subject,
            email_sender=request.sender,
            email_body=request.body,
            email_date=request.date
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
def health_check():
    """Check if AI service is healthy"""
    try:
        ai_service = GroqAIService()
        is_healthy = ai_service.health_check()
        return {"status": "healthy" if is_healthy else "unhealthy"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))