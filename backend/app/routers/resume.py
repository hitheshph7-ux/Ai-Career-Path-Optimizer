"""
Resume Parser + ATS Enhancer Router
POST /api/resume/parse    — Extract skills from uploaded resume
POST /api/resume/enhance  — Generate ATS-optimized resume text
POST /api/resume/apply    — Auto-apply improvement suggestions to a resume draft
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional
import re

from app.routers.auth import FAKE_USERS_DB, verify_token, security

router = APIRouter()

# ─── Skill keyword dictionary ────────────────────────────────────────────────
SKILL_KEYWORDS = {
    "Python":          ["python"],
    "Java":            ["java"],
    "JavaScript":      ["javascript", "js"],
    "TypeScript":      ["typescript", "ts"],
    "React":           ["react", "reactjs"],
    "Node.js":         ["node.js", "nodejs", "node"],
    "SQL":             ["sql", "mysql", "postgresql", "postgres"],
    "Docker":          ["docker"],
    "Kubernetes":      ["kubernetes", "k8s"],
    "AWS":             ["aws", "amazon web services"],
    "Azure":           ["azure"],
    "GCP":             ["gcp", "google cloud"],
    "TensorFlow":      ["tensorflow", "tf"],
    "PyTorch":         ["pytorch"],
    "Machine Learning":["machine learning", "ml"],
    "Deep Learning":   ["deep learning", "dl", "neural network"],
    "NLP":             ["nlp", "natural language processing"],
    "Git":             ["git", "github", "gitlab"],
    "Linux":           ["linux", "bash", "shell"],
    "Django":          ["django"],
    "FastAPI":         ["fastapi"],
    "Flask":           ["flask"],
    "Redis":           ["redis"],
    "MongoDB":         ["mongodb", "mongo"],
    "CI/CD":           ["ci/cd", "jenkins", "github actions", "gitlab ci"],
    "System Design":   ["system design", "architecture"],
    "Agile":           ["agile", "scrum"],
    "C++":             ["c++", "cpp"],
    "Terraform":       ["terraform"],
    "Pandas":          ["pandas"],
    "NumPy":           ["numpy"],
    "Scikit-learn":    ["scikit-learn", "sklearn"],
}

# ATS power action verbs for bullet points
ACTION_VERBS = [
    "Developed", "Engineered", "Implemented", "Designed", "Architected",
    "Optimized", "Deployed", "Built", "Automated", "Streamlined",
    "Led", "Collaborated", "Delivered", "Improved", "Reduced",
]

# Career-specific skill sets for recommendations
CAREER_SKILL_REQUIREMENTS = {
    "Data Scientist":        ["Python", "SQL", "Machine Learning", "Pandas", "NumPy", "Scikit-learn", "TensorFlow", "Git"],
    "AI/ML Engineer":        ["Python", "TensorFlow", "PyTorch", "Deep Learning", "NLP", "Docker", "AWS", "Git"],
    "Full Stack Developer":  ["JavaScript", "React", "Node.js", "SQL", "Docker", "Git", "CI/CD", "TypeScript"],
    "Cloud Architect":       ["AWS", "Azure", "GCP", "Kubernetes", "Terraform", "Docker", "System Design", "Linux"],
    "DevOps Engineer":       ["Docker", "Kubernetes", "AWS", "CI/CD", "Linux", "Terraform", "Git", "Python"],
    "Cybersecurity Analyst": ["Linux", "Python", "Agile", "AWS", "Git", "System Design"],
    "Mobile Developer":      ["JavaScript", "React", "TypeScript", "Git", "Agile"],
}

# ─── Helpers ─────────────────────────────────────────────────────────────────
def extract_text_from_bytes(content: bytes, filename: str) -> str:
    if filename.lower().endswith(".pdf"):
        try:
            import PyPDF2, io
            reader = PyPDF2.PdfReader(io.BytesIO(content))
            return " ".join(page.extract_text() or "" for page in reader.pages)
        except Exception:
            pass
    return content.decode("utf-8", errors="ignore")

def parse_skills(text: str) -> dict:
    text_lower = text.lower()
    return {skill: True for skill, keywords in SKILL_KEYWORDS.items()
            if any(kw in text_lower for kw in keywords)}

def extract_email(text: str) -> str:
    m = re.search(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}", text)
    return m.group() if m else ""

def extract_name(text: str) -> str:
    """Try to extract name from first non-empty line."""
    for line in text.strip().splitlines():
        line = line.strip()
        if line and not re.search(r"[@|\d{4}|http|www]", line) and len(line.split()) <= 4:
            return line
    return "Your Name"

def extract_phone(text: str) -> str:
    m = re.search(r"(\+?\d[\d\s\-\(\)]{8,14}\d)", text)
    return m.group().strip() if m else ""

def estimate_experience(text: str) -> int:
    m = re.search(r"(\d+)\+?\s*years?\s*(of\s*)?(experience|exp)", text, re.IGNORECASE)
    return int(m.group(1)) if m else 0

def extract_education(text: str) -> str:
    patterns = [
        r"(B\.?Tech|B\.?E\.?|B\.?Sc|BCA|M\.?Tech|M\.?Sc|MCA|Bachelor|Master|PhD)[^\n]{0,60}",
        r"(Computer Science|Information Technology|Electronics|Electrical)[^\n]{0,40}",
    ]
    for p in patterns:
        m = re.search(p, text, re.IGNORECASE)
        if m:
            return m.group().strip()
    return "Bachelor of Technology (B.Tech)"

def get_ats_recommendations(found_skills: set, career_target: str = "Data Scientist") -> List[str]:
    required = set(CAREER_SKILL_REQUIREMENTS.get(career_target, []))
    missing  = required - found_skills
    recs = [f"Add '{s}' to your Skills section — critical for {career_target} roles" for s in list(missing)[:4]]
    recs += [
        "Use strong action verbs (Developed, Engineered, Optimized) to start each bullet point",
        "Quantify achievements with numbers/percentages (e.g., 'Reduced API latency by 40%')",
        "Add a concise Professional Summary at the top tailored to your target role",
        "Ensure consistent date formatting across all experience entries (e.g., Jan 2023 – Present)",
        "Keep resume to 1 page for under 5 years experience, 2 pages for senior roles",
    ]
    return recs[:6]

def generate_ats_resume(
    name: str,
    email: str,
    phone: str,
    skills: List[str],
    experience_years: int,
    education: str,
    target_role: str,
    extra_skills: List[str],
) -> str:
    """Generate a complete ATS-optimized resume in plain text format."""

    all_skills = list(dict.fromkeys(skills + extra_skills))  # merge, preserve order, deduplicate
    skills_line = " • ".join(all_skills)

    # Split skills into categories for better ATS parsing
    prog_langs = [s for s in all_skills if s in {"Python","Java","JavaScript","TypeScript","C++","SQL","R"}]
    frameworks = [s for s in all_skills if s in {"React","Node.js","Django","FastAPI","Flask","TensorFlow","PyTorch","Scikit-learn","Pandas","NumPy"}]
    cloud_devops = [s for s in all_skills if s in {"AWS","Azure","GCP","Docker","Kubernetes","Terraform","CI/CD","Linux","Git"}]
    ai_ml = [s for s in all_skills if s in {"Machine Learning","Deep Learning","NLP","TensorFlow","PyTorch","Scikit-learn"}]

    prog_str    = ", ".join(prog_langs)    if prog_langs    else "Python, Java, SQL"
    fw_str      = ", ".join(frameworks)   if frameworks    else "React, Node.js, TensorFlow"
    cloud_str   = ", ".join(cloud_devops) if cloud_devops  else "AWS, Docker, Git"
    ai_str      = ", ".join(ai_ml)        if ai_ml         else "Machine Learning, Deep Learning"

    level = "Senior" if experience_years >= 5 else ("Mid-Level" if experience_years >= 2 else "Junior")

    resume = f"""\
{'=' * 70}
{name.upper()}
{email}  |  {phone if phone else '+1 (000) 000-0000'}  |  linkedin.com/in/{name.lower().replace(' ','-')}  |  github.com/{name.lower().replace(' ','')}
{'=' * 70}

PROFESSIONAL SUMMARY
{'─' * 70}
Results-driven {level} {target_role} with {experience_years}+ years of hands-on experience
designing and delivering scalable, data-driven solutions. Proven expertise in
{', '.join(all_skills[:4])} with a strong record of improving system performance,
automating workflows, and collaborating cross-functionally to ship high-impact products.

TECHNICAL SKILLS
{'─' * 70}
Programming Languages : {prog_str if prog_str else 'Python, SQL, JavaScript'}
Frameworks & Libraries: {fw_str if fw_str else 'React, TensorFlow, Pandas'}
Cloud & DevOps        : {cloud_str if cloud_str else 'AWS, Docker, Git, Linux'}
AI / ML               : {ai_str if ai_str else 'Machine Learning, Deep Learning, NLP'}
Methodologies         : Agile, Scrum, CI/CD, Test-Driven Development (TDD)

PROFESSIONAL EXPERIENCE
{'─' * 70}
{level} {target_role}                                          [Company Name]  |  [City, Country]
[Start Month Year] – Present
  • Developed and deployed end-to-end ML pipelines using {', '.join(all_skills[:3])},
    reducing model inference latency by 35%
  • Engineered scalable microservices architecture serving 500K+ daily requests
    with 99.9% uptime on {cloud_str.split(',')[0] if cloud_str else 'AWS'}
  • Automated CI/CD workflows using GitHub Actions, cutting release cycle by 40%
  • Collaborated with cross-functional teams (Product, Design, QA) to define
    technical requirements and deliver features on schedule

[Previous Role]                                                [Company Name]  |  [City, Country]
[Start Month Year] – [End Month Year]
  • Implemented {all_skills[1] if len(all_skills)>1 else 'Python'}-based data processing pipeline handling 10M+ records daily
  • Designed RESTful APIs using {all_skills[2] if len(all_skills)>2 else 'FastAPI'} integrated with PostgreSQL and Redis cache
  • Improved system performance by 25% through query optimization and caching
  • Mentored 2 junior engineers and conducted code reviews for team of 6

PROJECTS
{'─' * 70}
AI Career Path Optimizer                          github.com/{name.lower().replace(' ','')}/<project>
  • Built an end-to-end ML platform using {', '.join(all_skills[:3])} to predict
    optimal career paths with 99.6% classification accuracy on 10K+ profiles
  • Deployed FastAPI backend + React frontend with Docker containerization

[Your Project Name]                               github.com/{name.lower().replace(' ','')}/<project>
  • Developed [brief description] leveraging {all_skills[3] if len(all_skills)>3 else 'Python'}
  • Achieved [key metric] through [technique/approach]

EDUCATION
{'─' * 70}
{education}
Relevant Coursework: Data Structures & Algorithms, Machine Learning, Database
Systems, Software Engineering, Computer Networks

CERTIFICATIONS
{'─' * 70}
  • [Certification Name] — [Issuing Organization], [Year]
  • [Certification Name] — [Issuing Organization], [Year]

{'=' * 70}
✅  ATS OPTIMIZATION NOTES (remove this section before submitting)
{'─' * 70}
• Keywords from your target role have been embedded throughout this resume
• Section headers use standard ATS-readable labels (no tables/columns)
• Skills auto-added from suggestions: {', '.join(extra_skills) if extra_skills else 'None'}
• Recommended file format: .docx or plain .txt for ATS submission
{'=' * 70}
"""
    return resume.strip()


# ─── Endpoints ───────────────────────────────────────────────────────────────

@router.post("/parse", summary="Upload resume and extract skills")
async def parse_resume(file: UploadFile = File(...), credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    if file.size and file.size > 5 * 1024 * 1024:
        raise HTTPException(413, "File too large (max 5MB)")
    content = await file.read()
    text     = extract_text_from_bytes(content, file.filename or "")
    skills   = parse_skills(text)
    exp      = estimate_experience(text)
    email    = extract_email(text)
    phone    = extract_phone(text)
    name     = extract_name(text)
    edu      = extract_education(text)
    skill_list = list(skills.keys())
    ats_score  = min(100, len(skill_list) * 7 + exp * 4 + (10 if email else 0))
    missing_high = [s for s in ["Python","Machine Learning","SQL","Docker","Git"] if s not in skills]

    res = {
        "filename":            file.filename or "",
        "name_detected":       name,
        "email_found":         email,
        "phone_found":         phone,
        "education_detected":  edu,
        "skills_extracted":    skill_list,
        "skill_count":         len(skill_list),
        "estimated_experience": exp,
        "word_count":          len(text.split()),
        "ats_score":           ats_score,
        "recommendations":     get_ats_recommendations(set(skill_list)),
        "missing_high_impact": missing_high,
        # Pass raw text forward so enhance can use it
        "_raw_text":           text[:3000],
    }

    if credentials:
        email_verified = verify_token(credentials.credentials)
        if email_verified and email_verified in FAKE_USERS_DB:
            FAKE_USERS_DB[email_verified]["resume_stats"] = res

    return res


class EnhanceRequest(BaseModel):
    skills_extracted:      List[str]
    name_detected:         Optional[str] = "Your Name"
    email_found:           Optional[str] = "email@example.com"
    phone_found:           Optional[str] = ""
    education_detected:    Optional[str] = "Bachelor of Technology (B.Tech)"
    estimated_experience:  Optional[int] = 0
    target_role:           Optional[str] = "Data Scientist"
    extra_skills:          Optional[List[str]] = []  # from "auto-apply suggestions"


@router.post("/enhance", summary="Generate ATS-optimized resume text")
def enhance_resume(req: EnhanceRequest):
    """Takes parsed resume data + optional extra skills → returns ATS-optimized resume."""
    ats_text = generate_ats_resume(
        name=req.name_detected or "Your Name",
        email=req.email_found or "email@example.com",
        phone=req.phone_found or "",
        skills=req.skills_extracted,
        experience_years=req.estimated_experience or 0,
        education=req.education_detected or "Bachelor of Technology (B.Tech)",
        target_role=req.target_role or "Data Scientist",
        extra_skills=req.extra_skills or [],
    )

    all_skills = list(dict.fromkeys(req.skills_extracted + (req.extra_skills or [])))
    new_score  = min(100, len(all_skills) * 7 + (req.estimated_experience or 0) * 4 + 15)

    return {
        "ats_resume_text": ats_text,
        "new_ats_score":   new_score,
        "total_skills":    len(all_skills),
        "skills_added":    len(req.extra_skills or []),
        "target_role":     req.target_role,
        "word_count":      len(ats_text.split()),
    }


class ApplyRequest(BaseModel):
    current_skills: List[str]
    suggestions:    List[str]


@router.post("/apply-suggestions", summary="Return merged skills after auto-applying suggestions")
def apply_suggestions(req: ApplyRequest):
    """Merges current skills + suggested skills, returns deduplicated list."""
    merged = list(dict.fromkeys(req.current_skills + req.suggestions))
    added  = [s for s in req.suggestions if s not in req.current_skills]
    return {
        "merged_skills": merged,
        "added_count":   len(added),
        "skills_added":  added,
        "message":       f"✅ {len(added)} skills automatically added to your profile",
    }
