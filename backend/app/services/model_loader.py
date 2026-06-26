"""
ML Model Loader — loads all trained models into memory once at startup
"""
import os
import json
import joblib
import numpy as np

# This file lives at: backend/app/services/model_loader.py
# Models are at:      <project_root>/models_saved/
_THIS_DIR   = os.path.dirname(os.path.abspath(__file__))           # .../backend/app/services
_BACKEND    = os.path.abspath(os.path.join(_THIS_DIR, "../.."))    # .../backend
_PROJECT    = os.path.abspath(os.path.join(_BACKEND, ".."))       # <project_root>
BASE_DIR    = os.path.join(_PROJECT, "models_saved")

_models: dict = {}

CAREER_INFO = {
    "Data Scientist": {
        "description": "Analyze complex data to drive business decisions using statistics and ML.",
        "avg_salary": 120000,
        "demand": 95,
        "growth": "+22% over 5 years",
        "top_skills": ["Python", "Machine Learning", "Statistics", "SQL", "TensorFlow"],
        "certifications": ["Google Data Analytics", "IBM Data Science", "AWS ML Specialty"],
        "companies": ["Google", "Meta", "Amazon", "Netflix", "Uber"],
    },
    "Full Stack Developer": {
        "description": "Build end-to-end web applications covering both frontend and backend.",
        "avg_salary": 105000,
        "demand": 92,
        "growth": "+15% over 5 years",
        "top_skills": ["JavaScript", "React", "Node.js", "SQL", "Docker"],
        "certifications": ["MongoDB Developer", "AWS Developer", "Meta Frontend"],
        "companies": ["Atlassian", "Shopify", "Stripe", "Airbnb", "Slack"],
    },
    "AI/ML Engineer": {
        "description": "Design and deploy production AI/ML systems at scale.",
        "avg_salary": 140000,
        "demand": 98,
        "growth": "+35% over 5 years",
        "top_skills": ["Python", "TensorFlow", "PyTorch", "Deep Learning", "MLOps"],
        "certifications": ["TensorFlow Developer", "AWS ML Specialty", "Google ML Engineer"],
        "companies": ["OpenAI", "DeepMind", "Anthropic", "Nvidia", "Hugging Face"],
    },
    "Cloud Architect": {
        "description": "Design scalable cloud infrastructure and migration strategies.",
        "avg_salary": 135000,
        "demand": 90,
        "growth": "+25% over 5 years",
        "top_skills": ["AWS", "Azure", "GCP", "Kubernetes", "Terraform"],
        "certifications": ["AWS Solutions Architect", "GCP Professional", "Azure Expert"],
        "companies": ["Amazon", "Microsoft", "Google", "IBM", "Accenture"],
    },
    "Cybersecurity Analyst": {
        "description": "Protect systems and networks from cyber threats and vulnerabilities.",
        "avg_salary": 110000,
        "demand": 88,
        "growth": "+18% over 5 years",
        "top_skills": ["Python", "Networking", "Penetration Testing", "SIEM", "Cryptography"],
        "certifications": ["CISSP", "CEH", "CompTIA Security+", "OSCP"],
        "companies": ["CrowdStrike", "Palo Alto", "FireEye", "IBM Security", "Deloitte"],
    },
    "DevOps Engineer": {
        "description": "Bridge development and operations with CI/CD, automation, and monitoring.",
        "avg_salary": 115000,
        "demand": 91,
        "growth": "+20% over 5 years",
        "top_skills": ["Docker", "Kubernetes", "Jenkins", "Terraform", "AWS"],
        "certifications": ["Kubernetes CKA", "AWS DevOps Pro", "HashiCorp Terraform"],
        "companies": ["HashiCorp", "Cloudflare", "Datadog", "GitLab", "Red Hat"],
    },
    "Mobile Developer": {
        "description": "Create native and cross-platform mobile apps for iOS and Android.",
        "avg_salary": 100000,
        "demand": 85,
        "growth": "+12% over 5 years",
        "top_skills": ["React Native", "Swift", "Kotlin", "Java", "Flutter"],
        "certifications": ["Google Associate Android", "Apple App Development"],
        "companies": ["Snapchat", "TikTok", "Lyft", "DoorDash", "Pinterest"],
    },
    "Product Manager": {
        "description": "Lead product strategy, roadmap, and cross-functional team collaboration.",
        "avg_salary": 125000,
        "demand": 87,
        "growth": "+14% over 5 years",
        "top_skills": ["Product Strategy", "Data Analysis", "SQL", "User Research", "Agile"],
        "certifications": ["PMP", "CSPO", "Google PM Certificate"],
        "companies": ["Google", "Meta", "Salesforce", "HubSpot", "Notion"],
    },
    "UI/UX Designer": {
        "description": "Design intuitive, user-centered interfaces and digital experiences.",
        "avg_salary": 92000,
        "demand": 82,
        "growth": "+10% over 5 years",
        "top_skills": ["Figma", "User Research", "Prototyping", "Design Systems", "CSS"],
        "certifications": ["Google UX Design", "Interaction Design Foundation"],
        "companies": ["Figma", "Adobe", "Spotify", "Airbnb", "Apple"],
    },
    "Blockchain Developer": {
        "description": "Develop decentralized applications and smart contracts on blockchain platforms.",
        "avg_salary": 118000,
        "demand": 78,
        "growth": "+30% over 5 years",
        "top_skills": ["Solidity", "Ethereum", "Web3.js", "Python", "JavaScript"],
        "certifications": ["Certified Blockchain Developer", "Ethereum Developer"],
        "companies": ["Coinbase", "Binance", "Chainlink", "Polygon", "Consensys"],
    },
}

def load_models():
    global _models
    if _models:
        return _models
    try:
        _models["career_clf"]  = joblib.load(os.path.join(BASE_DIR, "career_classifier.pkl"))
        _models["salary_reg"]  = joblib.load(os.path.join(BASE_DIR, "salary_predictor.pkl"))
        _models["scaler"]      = joblib.load(os.path.join(BASE_DIR, "scaler.pkl"))
        _models["le_career"]   = joblib.load(os.path.join(BASE_DIR, "label_encoder_career.pkl"))
        _models["le_interest"] = joblib.load(os.path.join(BASE_DIR, "label_encoder_interest.pkl"))
        _models["le_person"]   = joblib.load(os.path.join(BASE_DIR, "label_encoder_personality.pkl"))
        _models["le_edu"]      = joblib.load(os.path.join(BASE_DIR, "label_encoder_education.pkl"))
        _models["feature_cols"]= joblib.load(os.path.join(BASE_DIR, "feature_columns.pkl"))
        with open(os.path.join(BASE_DIR, "career_metadata.json")) as f:
            _models["metadata"] = json.load(f)
        print("✅ All ML models loaded successfully")
    except Exception as e:
        print(f"⚠️  Models not loaded (run training first): {e}")
        _models["loaded"] = False
    return _models

def get_top_careers(proba: np.ndarray, le, top_n=3):
    indices = np.argsort(proba)[::-1][:top_n]
    return [
        {"career": le.classes_[i], "confidence": float(proba[i])}
        for i in indices
    ]
