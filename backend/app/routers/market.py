"""
Job Market & Trends Router
GET /api/market/trends    — Industry demand data
GET /api/market/salaries  — Salary benchmarks by career
GET /api/market/jobs      — Job listings (simulated)
"""
from fastapi import APIRouter
from typing import Optional
import random

router = APIRouter()

TRENDING_SKILLS = [
    {"skill": "Large Language Models", "demand": 98, "growth": "+120%", "category": "AI/ML"},
    {"skill": "Kubernetes", "demand": 94, "growth": "+45%", "category": "DevOps"},
    {"skill": "Rust", "demand": 88, "growth": "+60%", "category": "Systems"},
    {"skill": "Terraform", "demand": 91, "growth": "+52%", "category": "Cloud"},
    {"skill": "React", "demand": 95, "growth": "+30%", "category": "Frontend"},
    {"skill": "PyTorch", "demand": 92, "growth": "+80%", "category": "AI/ML"},
    {"skill": "Go", "demand": 85, "growth": "+40%", "category": "Backend"},
    {"skill": "Solidity", "demand": 78, "growth": "+95%", "category": "Blockchain"},
    {"skill": "Figma", "demand": 87, "growth": "+35%", "category": "Design"},
    {"skill": "Apache Kafka", "demand": 83, "growth": "+55%", "category": "Data Engineering"},
]

SALARY_DATA = [
    {"career": "AI/ML Engineer",        "min": 110000, "max": 200000, "avg": 140000, "yoe": "0-2"},
    {"career": "Data Scientist",         "min": 90000,  "max": 160000, "avg": 120000, "yoe": "0-2"},
    {"career": "Cloud Architect",        "min": 110000, "max": 180000, "avg": 135000, "yoe": "3-5"},
    {"career": "Full Stack Developer",   "min": 80000,  "max": 140000, "avg": 105000, "yoe": "0-2"},
    {"career": "DevOps Engineer",        "min": 85000,  "max": 150000, "avg": 115000, "yoe": "0-2"},
    {"career": "Cybersecurity Analyst",  "min": 85000,  "max": 150000, "avg": 110000, "yoe": "0-2"},
    {"career": "Product Manager",        "min": 95000,  "max": 160000, "avg": 125000, "yoe": "3-5"},
    {"career": "Blockchain Developer",   "min": 90000,  "max": 160000, "avg": 118000, "yoe": "0-2"},
    {"career": "Mobile Developer",       "min": 75000,  "max": 130000, "avg": 100000, "yoe": "0-2"},
    {"career": "UI/UX Designer",         "min": 70000,  "max": 130000, "avg": 92000,  "yoe": "0-2"},
]

MOCK_JOBS = [
    {"title": "Senior Data Scientist", "company": "Google", "location": "Remote", "salary": "$130K-$170K", "match": 94, "posted": "2 days ago"},
    {"title": "ML Engineer", "company": "OpenAI", "location": "San Francisco, CA", "salary": "$150K-$200K", "match": 91, "posted": "1 day ago"},
    {"title": "Full Stack Developer", "company": "Stripe", "location": "Remote", "salary": "$100K-$140K", "match": 88, "posted": "3 days ago"},
    {"title": "Cloud Architect", "company": "Amazon", "location": "Seattle, WA", "salary": "$120K-$160K", "match": 85, "posted": "5 days ago"},
    {"title": "DevOps Engineer", "company": "Cloudflare", "location": "Remote", "salary": "$110K-$145K", "match": 87, "posted": "1 week ago"},
    {"title": "AI Research Scientist", "company": "DeepMind", "location": "London, UK", "salary": "$140K-$190K", "match": 90, "posted": "4 days ago"},
    {"title": "Frontend Engineer (React)", "company": "Airbnb", "location": "Remote", "salary": "$95K-$130K", "match": 82, "posted": "6 days ago"},
    {"title": "Blockchain Developer", "company": "Coinbase", "location": "Remote", "salary": "$110K-$150K", "match": 79, "posted": "3 days ago"},
    {"title": "Cybersecurity Analyst", "company": "CrowdStrike", "location": "Austin, TX", "salary": "$90K-$130K", "match": 83, "posted": "2 weeks ago"},
    {"title": "Product Manager – AI", "company": "Notion", "location": "Remote", "salary": "$120K-$155K", "match": 80, "posted": "1 day ago"},
]

MARKET_TRENDS = {
    "year_data": [
        {"year": "2020", "jobs": 1200000, "avg_salary": 85000},
        {"year": "2021", "jobs": 1450000, "avg_salary": 92000},
        {"year": "2022", "jobs": 1800000, "avg_salary": 102000},
        {"year": "2023", "jobs": 2200000, "avg_salary": 112000},
        {"year": "2024", "jobs": 2700000, "avg_salary": 125000},
        {"year": "2025", "jobs": 3200000, "avg_salary": 138000},
    ],
    "top_industries": [
        {"name": "Technology", "share": 35, "growth": "+28%"},
        {"name": "Finance/FinTech", "share": 18, "growth": "+22%"},
        {"name": "Healthcare/BioTech", "share": 14, "growth": "+30%"},
        {"name": "E-Commerce", "share": 12, "growth": "+18%"},
        {"name": "Government/Defense", "share": 10, "growth": "+8%"},
        {"name": "Education/EdTech", "share": 11, "growth": "+25%"},
    ]
}

@router.get("/trends", summary="Get tech skill demand trends")
def get_trends():
    return {"trending_skills": TRENDING_SKILLS, "market_overview": MARKET_TRENDS}

@router.get("/salaries", summary="Salary benchmarks by career")
def get_salaries():
    return {"salary_data": SALARY_DATA}

@router.get("/jobs", summary="Browse job listings")
def get_jobs(career: Optional[str] = None, location: Optional[str] = None):
    jobs = MOCK_JOBS
    if career:
        jobs = [j for j in jobs if career.lower() in j["title"].lower() or career.lower() in j["company"].lower()]
    return {"jobs": jobs, "total": len(jobs)}
