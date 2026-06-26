"""
Simple auth router — JWT-based login/register (no DB for portability)
"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
import hashlib, json, base64, time

from app.services.model_loader import CAREER_INFO

router = APIRouter()
security = HTTPBearer(auto_error=False)

SECRET = "antigravity_secret_2024"

def _hash(p: str) -> str:
    return hashlib.sha256(p.encode()).hexdigest()

FAKE_USERS_DB: dict = {
    "demo@aicareer.com": {"name": "Alex Johnson", "password": _hash("password123"), "role": "student"}
}

def create_token(email: str) -> str:
    payload = {"sub": email, "exp": time.time() + 86400}
    encoded = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode()
    return f"demo_{encoded}"

def verify_token(token: str) -> Optional[str]:
    try:
        encoded = token.replace("demo_", "")
        payload = json.loads(base64.urlsafe_b64decode(encoded).decode())
        if payload["exp"] > time.time():
            return payload["sub"]
    except Exception:
        pass
    return None

class RegisterInput(BaseModel):
    name: str
    email: str
    password: str

class LoginInput(BaseModel):
    email: str
    password: str

@router.post("/register")
def register(data: RegisterInput):
    if data.email in FAKE_USERS_DB:
        raise HTTPException(400, "Email already registered.")
    FAKE_USERS_DB[data.email] = {"name": data.name, "password": _hash(data.password), "role": "student"}
    return {"message": "Registration successful", "token": create_token(data.email), "name": data.name}

@router.post("/login")
def login(data: LoginInput):
    user = FAKE_USERS_DB.get(data.email)
    if not user or user["password"] != _hash(data.password):
        raise HTTPException(401, "Invalid credentials.")
    return {"token": create_token(data.email), "name": user["name"], "role": user["role"]}

@router.get("/me")
def get_me(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    if not credentials:
        raise HTTPException(401, "Not authenticated")
    email = verify_token(credentials.credentials)
    if not email:
        raise HTTPException(401, "Invalid or expired token")
    user = FAKE_USERS_DB.get(email, {})
    return {"email": email, "name": user.get("name", "User"), "role": user.get("role", "student")}

def get_current_user_email(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[str]:
    if not credentials:
        return None
    return verify_token(credentials.credentials)

@router.get("/dashboard")
def get_dashboard_data(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    if not credentials:
        raise HTTPException(401, "Not authenticated")
    email = verify_token(credentials.credentials)
    if not email:
        raise HTTPException(401, "Invalid or expired token")
    
    user = FAKE_USERS_DB.get(email, {})
    
    latest_prediction = user.get("latest_prediction")
    assessment_scores = user.get("assessment_scores", {})
    skills_assessed = user.get("skills_assessed", [])
    resume_stats = user.get("resume_stats")
    
    # 1. Career Match Score & Predicted Career
    if latest_prediction:
        match_score = f"{latest_prediction.get('confidence', 87)}%"
        primary_career = latest_prediction.get('primary_career', "Data Scientist")
        salary_potential = f"${int(latest_prediction.get('predicted_salary', 120000)) // 1000}K"
        market_demand = f"{latest_prediction.get('market_demand', 95)}%"
    elif resume_stats:
        match_score = f"{resume_stats.get('ats_score', 60)}%"
        primary_career = "Data Analyst"
        salary_potential = "$85K"
        market_demand = "85%"
    else:
        # Default placeholders for completely new user
        match_score = "Pending"
        primary_career = "No Prediction Yet"
        salary_potential = "$0K"
        market_demand = "N/A"
        
    # 2. Skills Tracked
    unique_skills = set(skills_assessed)
    if resume_stats:
        unique_skills.update(resume_stats.get("skills_extracted", []))
    if latest_prediction:
        unique_skills.update(latest_prediction.get("top_skills", []))
        
    skills_tracked = str(len(unique_skills)) if len(unique_skills) > 0 else "0"
    
    # 3. Dynamic Tech Salary Growth Chart Data based on primary career
    if latest_prediction and latest_prediction.get("primary_career"):
        avg_sal = int(latest_prediction.get("predicted_salary", 120000)) // 1000
        salary_trend = [
            { "year": "2020", "avg": int(avg_sal * 0.7) },
            { "year": "2021", "avg": int(avg_sal * 0.78) },
            { "year": "2022", "avg": int(avg_sal * 0.85) },
            { "year": "2023", "avg": int(avg_sal * 0.92) },
            { "year": "2024", "avg": int(avg_sal * 0.98) },
            { "year": "2025", "avg": int(avg_sal) }
        ]
    else:
        salary_trend = [
            { "year": "2020", "avg": 85 }, { "year": "2021", "avg": 92 }, { "year": "2022", "avg": 102 },
            { "year": "2023", "avg": 112 }, { "year": "2024", "avg": 125 }, { "year": "2025", "avg": 138 }
        ]
        
    # 4. Skill Mix distribution (pie chart)
    if assessment_scores:
        total_score = sum(assessment_scores.values())
        avg_score = total_score / len(assessment_scores) if len(assessment_scores) > 0 else 0
        skill_mix = [
            { "name": "Assessed Skills", "value": int(avg_score), "color": "#10b981" },
            { "name": "Remaining Skills", "value": max(10, 100 - int(avg_score)), "color": "#6366f1" }
        ]
    else:
        skill_mix = [
            { "name": "Technical", "value": 60, "color": "#6366f1" },
            { "name": "Communication", "value": 20, "color": "#8b5cf6" },
            { "name": "Leadership", "value": 12, "color": "#06b6d4" },
            { "name": "Domain", "value": 8, "color": "#10b981" }
        ]
        
    # 5. Career Demand (bar chart)
    if latest_prediction and latest_prediction.get("top_matches"):
        career_demand = []
        for match in latest_prediction["top_matches"]:
            car = match["career"]
            dem = CAREER_INFO.get(car, {}).get("demand", 85)
            career_demand.append({ "name": car, "demand": dem })
    else:
        career_demand = [
            { "name": "AI/ML", "demand": 98 }, { "name": "Cloud", "demand": 90 }, { "name": "Full Stack", "demand": 92 },
            { "name": "DevOps", "demand": 91 }, { "name": "Security", "demand": 88 }, { "name": "Data", "demand": 95 }
        ]
        
    stats = [
        { "icon": "🎯", "label": "Career Match Score", "value": match_score, "gradient": "var(--grad-primary)", "sub": f"Role: {primary_career}" },
        { "icon": "📚", "label": "Skills Tracked", "value": skills_tracked, "gradient": "var(--grad-cyan)", "sub": "Total skills identified" },
        { "icon": "💰", "label": "Salary Potential", "value": salary_potential, "gradient": "var(--grad-green)", "sub": "Avg predicted baseline" },
        { "icon": "📈", "label": "Market Demand", "value": market_demand, "gradient": "var(--grad-amber)", "sub": primary_career }
    ]
    
    return {
        "stats": stats,
        "salary_trend": salary_trend,
        "skill_mix": skill_mix,
        "career_demand": career_demand,
        "primary_career": primary_career,
        "has_data": latest_prediction is not None or len(assessment_scores) > 0 or resume_stats is not None
    }
