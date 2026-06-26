"""
Synthetic Dataset Generator for AI Career Path Optimizer
Generates 10,000 realistic student records
"""
import pandas as pd
import numpy as np
import random
import os

np.random.seed(42)
random.seed(42)

NUM_RECORDS = 10000
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "student_career_data.csv")

CAREER_PATHS = [
    "Data Scientist", "Full Stack Developer", "AI/ML Engineer",
    "Cloud Architect", "Cybersecurity Analyst", "DevOps Engineer",
    "Mobile Developer", "Product Manager", "UI/UX Designer", "Blockchain Developer"
]

SKILLS = [
    "Python", "Java", "JavaScript", "SQL", "C++", "R",
    "Machine Learning", "Deep Learning", "NLP", "Computer Vision",
    "React", "Node.js", "Django", "FastAPI", "Docker",
    "AWS", "Azure", "GCP", "Kubernetes", "Terraform",
    "TensorFlow", "PyTorch", "Scikit-learn", "Pandas", "NumPy",
    "System Design", "Data Structures", "Algorithms", "Statistics", "Linear Algebra"
]

INTERESTS = ["AI/ML", "Web Development", "Mobile Apps", "Cybersecurity", "Cloud Computing",
             "Blockchain", "IoT", "AR/VR", "Data Analytics", "Product Design"]

PERSONALITY = ["Analytical", "Creative", "Leadership", "Detail-oriented", "Innovative", "Collaborative"]

EDUCATION = ["B.Tech", "B.Sc", "BCA", "M.Tech", "M.Sc", "MCA"]

CAREER_SKILL_WEIGHTS = {
    "Data Scientist": {"Python": 9, "Machine Learning": 9, "Statistics": 9, "Deep Learning": 7, "SQL": 8, "Pandas": 9, "NumPy": 8, "TensorFlow": 7},
    "Full Stack Developer": {"JavaScript": 9, "React": 9, "Node.js": 9, "SQL": 7, "Docker": 7, "Python": 6, "Django": 7, "FastAPI": 6},
    "AI/ML Engineer": {"Python": 9, "TensorFlow": 9, "PyTorch": 9, "Deep Learning": 9, "NLP": 8, "Computer Vision": 8, "Machine Learning": 9},
    "Cloud Architect": {"AWS": 9, "Azure": 8, "GCP": 8, "Kubernetes": 9, "Terraform": 9, "Docker": 9, "System Design": 9},
    "Cybersecurity Analyst": {"Python": 7, "C++": 7, "Java": 6, "Algorithms": 8, "Data Structures": 7, "System Design": 8},
    "DevOps Engineer": {"Docker": 9, "Kubernetes": 9, "AWS": 8, "Terraform": 9, "Python": 7, "System Design": 8},
    "Mobile Developer": {"Java": 8, "JavaScript": 8, "React": 7, "Python": 5, "Data Structures": 7, "Algorithms": 7},
    "Product Manager": {"System Design": 8, "Python": 5, "Statistics": 7, "SQL": 7, "R": 5},
    "UI/UX Designer": {"JavaScript": 7, "React": 8, "Python": 3, "Statistics": 5, "Creative": 9},
    "Blockchain Developer": {"Python": 7, "JavaScript": 8, "C++": 8, "Data Structures": 8, "Algorithms": 9, "AWS": 5},
}

records = []
for _ in range(NUM_RECORDS):
    career = random.choice(CAREER_PATHS)
    weights = CAREER_SKILL_WEIGHTS.get(career, {})

    row = {"Career_Path": career}

    for skill in SKILLS:
        base = weights.get(skill, random.randint(1, 5))
        noise = random.randint(-2, 2)
        row[f"{skill.replace(' ', '_').replace('/', '_')}_Skill"] = max(1, min(10, base + noise))

    row["CGPA"] = round(random.uniform(6.0, 10.0), 2)
    row["Experience_Years"] = random.randint(0, 5)
    row["Primary_Interest"] = random.choice(INTERESTS)
    row["Secondary_Interest"] = random.choice(INTERESTS)
    row["Personality_Type"] = random.choice(PERSONALITY)
    row["Education_Level"] = random.choice(EDUCATION)
    row["Certifications"] = random.randint(0, 8)
    row["Projects_Completed"] = random.randint(0, 15)
    row["GitHub_Repos"] = random.randint(0, 50)
    row["Hackathons"] = random.randint(0, 10)
    row["Internships"] = random.randint(0, 3)
    row["Expected_Salary"] = random.randint(4, 30) * 10000
    row["Job_Market_Demand"] = random.randint(5, 10)
    row["Satisfaction_Score"] = random.randint(60, 100)
    records.append(row)

df = pd.DataFrame(records)
df.to_csv(OUTPUT_PATH, index=False)
print(f"✅ Generated {NUM_RECORDS} records → {OUTPUT_PATH}")
print(f"   Columns: {len(df.columns)}, Shape: {df.shape}")
print(f"   Career distribution:\n{df['Career_Path'].value_counts()}")
