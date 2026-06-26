"""
AI Career Path Optimizer — FastAPI Backend
Full REST API with ML inference endpoints
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.routers import predict, assessment, market, auth, resume

app = FastAPI(
    title="AI Career Path Optimizer API",
    description="Complete ML-powered career guidance platform",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads
os.makedirs("uploads", exist_ok=True)

# Routers
app.include_router(auth.router,       prefix="/api/auth",       tags=["Authentication"])
app.include_router(predict.router,    prefix="/api/predict",    tags=["Career Prediction"])
app.include_router(assessment.router, prefix="/api/assessment", tags=["Skill Assessment"])
app.include_router(market.router,     prefix="/api/market",     tags=["Job Market"])
app.include_router(resume.router,     prefix="/api/resume",     tags=["Resume Parser"])

@app.get("/", tags=["Root"])
def root():
    return {"message": "AI Career Path Optimizer API v2.0", "status": "running", "docs": "/docs"}

@app.get("/health", tags=["Root"])
def health():
    return {"status": "healthy"}
