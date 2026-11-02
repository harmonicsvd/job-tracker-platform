from fastapi import FastAPI
from app.database import engine, Base
from app.api.jobs import router

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Job Application Tracker")

# Include routers
app.include_router(router)

@app.get("/")
def root():
    return {"message": "Job Application Tracker API", "docs": "/docs"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}