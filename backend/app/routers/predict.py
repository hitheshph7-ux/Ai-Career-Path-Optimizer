"""
Career Prediction Router
POST /api/predict/career  — Full career prediction + salary + skill gap
POST /api/predict/roadmap — Learning roadmap for a career
"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import numpy as np

from app.services.model_loader import load_models, CAREER_INFO, get_top_careers
from app.routers.auth import FAKE_USERS_DB, verify_token, security

router = APIRouter()

INTERESTS  = ["AI/ML","Web Development","Mobile Apps","Cybersecurity","Cloud Computing","Blockchain","IoT","AR/VR","Data Analytics","Product Design"]
PERSONALITY = ["Analytical","Creative","Leadership","Detail-oriented","Innovative","Collaborative"]
EDUCATION  = ["B.Tech","B.Sc","BCA","M.Tech","M.Sc","MCA"]

class ProfileInput(BaseModel):
    # Skill ratings 1-10
    Python_Skill: int = Field(5, ge=1, le=10)
    Java_Skill: int = Field(5, ge=1, le=10)
    JavaScript_Skill: int = Field(5, ge=1, le=10)
    SQL_Skill: int = Field(5, ge=1, le=10)
    C___Skill: int = Field(5, ge=1, le=10)
    R_Skill: int = Field(3, ge=1, le=10)
    Machine_Learning_Skill: int = Field(4, ge=1, le=10)
    Deep_Learning_Skill: int = Field(3, ge=1, le=10)
    NLP_Skill: int = Field(3, ge=1, le=10)
    Computer_Vision_Skill: int = Field(3, ge=1, le=10)
    React_Skill: int = Field(4, ge=1, le=10)
    Node_js_Skill: int = Field(4, ge=1, le=10)
    Django_Skill: int = Field(3, ge=1, le=10)
    FastAPI_Skill: int = Field(3, ge=1, le=10)
    Docker_Skill: int = Field(3, ge=1, le=10)
    AWS_Skill: int = Field(3, ge=1, le=10)
    Azure_Skill: int = Field(3, ge=1, le=10)
    GCP_Skill: int = Field(3, ge=1, le=10)
    Kubernetes_Skill: int = Field(2, ge=1, le=10)
    Terraform_Skill: int = Field(2, ge=1, le=10)
    TensorFlow_Skill: int = Field(3, ge=1, le=10)
    PyTorch_Skill: int = Field(3, ge=1, le=10)
    Scikit_learn_Skill: int = Field(4, ge=1, le=10)
    Pandas_Skill: int = Field(4, ge=1, le=10)
    NumPy_Skill: int = Field(4, ge=1, le=10)
    System_Design_Skill: int = Field(3, ge=1, le=10)
    Data_Structures_Skill: int = Field(6, ge=1, le=10)
    Algorithms_Skill: int = Field(6, ge=1, le=10)
    Statistics_Skill: int = Field(5, ge=1, le=10)
    Linear_Algebra_Skill: int = Field(4, ge=1, le=10)
    # Profile
    CGPA: float = Field(7.5, ge=0, le=10)
    Experience_Years: int = Field(0, ge=0, le=20)
    Certifications: int = Field(0, ge=0, le=20)
    Projects_Completed: int = Field(2, ge=0, le=50)
    GitHub_Repos: int = Field(5, ge=0, le=200)
    Hackathons: int = Field(0, ge=0, le=20)
    Internships: int = Field(0, ge=0, le=5)
    Primary_Interest: str = "AI/ML"
    Personality_Type: str = "Analytical"
    Education_Level: str = "B.Tech"

def _build_feature_vector(data: ProfileInput, models: dict) -> np.ndarray:
    feature_cols = models["feature_cols"]
    row = data.model_dump()
    vec = []
    for col in feature_cols:
        if col == "Primary_Interest_Enc":
            try: val = int(models["le_interest"].transform([row["Primary_Interest"]])[0])
            except Exception: val = 0
        elif col == "Personality_Enc":
            try: val = int(models["le_person"].transform([row["Personality_Type"]])[0])
            except Exception: val = 0
        elif col == "Education_Enc":
            try: val = int(models["le_edu"].transform([row["Education_Level"]])[0])
            except Exception: val = 0
        else:
            val = row.get(col, 0)
        vec.append(float(val) if val is not None else 0.0)
    return np.array(vec).reshape(1, -1)

def _compute_skill_gap(career: str, profile: ProfileInput) -> List[Dict]:
    required_skills = CAREER_INFO.get(career, {}).get("top_skills", [])
    skill_map = {
        "Python": profile.Python_Skill, "JavaScript": profile.JavaScript_Skill,
        "Machine Learning": profile.Machine_Learning_Skill, "Deep Learning": profile.Deep_Learning_Skill,
        "SQL": profile.SQL_Skill, "React": profile.React_Skill, "Node.js": profile.Node_js_Skill,
        "Docker": profile.Docker_Skill, "AWS": profile.AWS_Skill, "TensorFlow": profile.TensorFlow_Skill,
        "PyTorch": profile.PyTorch_Skill, "Kubernetes": profile.Kubernetes_Skill,
        "Terraform": profile.Terraform_Skill, "System Design": profile.System_Design_Skill,
        "Statistics": profile.Statistics_Skill, "Data Structures": profile.Data_Structures_Skill,
        "Algorithms": profile.Algorithms_Skill, "Java": profile.Java_Skill,
        "C++": profile.C___Skill, "Azure": profile.Azure_Skill, "GCP": profile.GCP_Skill,
    }
    gaps = []
    for skill in required_skills:
        current = skill_map.get(skill, 5)
        required = 8
        gap = max(0, required - current)
        gaps.append({
            "skill": skill, "current": current, "required": required,
            "gap": gap, "priority": "High" if gap >= 3 else ("Medium" if gap >= 1 else "Low"),
            "weeks_to_close": gap * 3, "resources": max(1, gap + 2)
        })
    return sorted(gaps, key=lambda x: x["gap"], reverse=True)

def _generate_roadmap(career: str, gaps: List[Dict]) -> List[Dict]:
    roadmap = []
    week_start = 1
    for g in gaps:
        if g["gap"] == 0:
            continue
        weeks = g["weeks_to_close"]
        roadmap.append({
            "phase": f"Master {g['skill']}",
            "weeks": f"Week {week_start}–{week_start + weeks - 1}",
            "activities": [
                f"Complete online courses on {g['skill']}",
                "Build 2 hands-on mini projects",
                "Practice with real datasets / tools"
            ],
            "priority": g["priority"],
        })
        week_start += weeks
    return roadmap

@router.post("/career", summary="Predict career path + salary + roadmap")
def predict_career(profile: ProfileInput, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    models = load_models()
    if not models.get("career_clf"):
        raise HTTPException(503, "Models not loaded — please run training first.")

    vec = _build_feature_vector(profile, models)
    vec_scaled = models["scaler"].transform(vec)

    proba = models["career_clf"].predict_proba(vec_scaled)[0]
    top_careers = get_top_careers(proba, models["le_career"], top_n=3)
    primary_career = top_careers[0]["career"]
    confidence = top_careers[0]["confidence"]

    salary_pred = float(models["salary_reg"].predict(vec_scaled)[0])
    info = CAREER_INFO.get(primary_career, {})
    skill_gaps = _compute_skill_gap(primary_career, profile)
    roadmap = _generate_roadmap(primary_career, skill_gaps)

    res = {
        "primary_career": primary_career,
        "confidence": round(confidence * 100, 1),
        "top_matches": top_careers,
        "description": info.get("description", ""),
        "avg_salary": info.get("avg_salary", salary_pred),
        "predicted_salary": round(salary_pred),
        "market_demand": info.get("demand", 85),
        "growth": info.get("growth", ""),
        "top_skills": info.get("top_skills", []),
        "certifications": info.get("certifications", []),
        "top_companies": info.get("companies", []),
        "skill_gaps": skill_gaps,
        "learning_roadmap": roadmap,
    }

    if credentials:
        email = verify_token(credentials.credentials)
        if email and email in FAKE_USERS_DB:
            FAKE_USERS_DB[email]["latest_prediction"] = res

    return res

@router.post("/roadmap", summary="Get detailed learning roadmap")
def get_roadmap(career: str, profile: ProfileInput):
    gaps = _compute_skill_gap(career, profile)
    roadmap = _generate_roadmap(career, gaps)
    return {"career": career, "roadmap": roadmap, "total_weeks": sum(g["weeks_to_close"] for g in gaps)}
