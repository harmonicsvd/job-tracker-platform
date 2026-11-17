from fastapi import FastAPI
from app.database import engine, Base
from app.api.jobs import router
from app.api.ai import router as ai_router
from app.api.gmail import router as gmail_router
from fastapi.middleware.cors import CORSMiddleware
from app.scheduler import start_scheduler


# Create database tables
Base.metadata.create_all(bind=engine)

# Start the scheduler
start_scheduler()

app = FastAPI(title="Job Application Tracker")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(router)
app.include_router(ai_router)
app.include_router(gmail_router)

@app.get("/")
def root():
    return {"message": "Job Application Tracker API", "docs": "/docs"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}