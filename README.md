# AI Career Path Optimizer 🚀

> ML-powered career guidance platform that analyzes your skills, predicts ideal career paths, identifies skill gaps, and generates ATS-optimized resumes — all in one place.

---

## Architecture

```
User Input (Skills / Resume / Quiz Answers)
               ↓
┌──────────────────────────────────────────────────────────┐
│                    React Frontend (Vite)                 │
│  Dashboard │ AI Predictor │ Skill Gap │ Resume │ Market  │
└───────────────────────┬──────────────────────────────────┘
                        │ REST API (JSON)
                        ↓
┌──────────────────────────────────────────────────────────┐
│                  FastAPI Backend                         │
│  /api/auth  │  /api/predict  │  /api/assessment         │
│  /api/resume  │  /api/market                            │
└───────────────────────┬──────────────────────────────────┘
                        │
          ┌─────────────┼──────────────┐
          ↓             ↓              ↓
   Random Forest   Salary Ridge   Label Encoders
   Classifier      Regressor      (career/edu/etc)
          │             │
          └──── Trained on 10,000+ synthetic student profiles
                        │
                        ↓
         ┌──────────────────────────────┐
         │  Prediction Output           │
         │  • Primary Career Match      │
         │  • Confidence Score          │
         │  • Skill Gap Analysis        │
         │  • Personalized Roadmap      │
         │  • Salary Prediction         │
         └──────────────────────────────┘
```

---

## Features

| Feature | Description |
|---------|-------------|
| 🎯 **AI Career Prediction** | Random Forest model trained on 10K+ profiles predicts your best-fit career with confidence score |
| 📊 **Skill Gap Analysis** | Radar & bar charts showing current vs required skills for any target role |
| 📄 **Resume Parser** | Upload PDF/TXT/DOC → extract skills → auto-apply ATS suggestions → generate optimized resume |
| 🧪 **Skill Assessment Quiz** | 8-question timed quizzes per skill with difficulty levels (Easy/Medium/Hard) + instant AI feedback |
| 📈 **Job Market Intelligence** | Real-time salary benchmarks, trending skill demand, and live job listings |
| 🔒 **JWT Authentication** | Secure login/register with token-based session management |
| 📡 **Persistent Dashboard** | Scores, predictions, and assessments all sync to your personalized dashboard |

---

## Tech Stack

**Frontend**
- React 18 + TypeScript (Vite)
- Recharts (AreaChart, BarChart, RadarChart, PieChart)
- Lucide React icons
- Vanilla CSS with glassmorphism design system

**Backend**
- FastAPI (Python)
- Scikit-learn (Random Forest + Ridge Regression)
- Joblib (model serialization)
- PyPDF2 (resume parsing)
- JWT (base64 token auth)

**ML Pipeline**
- Synthetic dataset: 10,000 student profiles × 35 features
- Models: Career Classifier (RF) + Salary Predictor (Ridge)
- Encoders: LabelEncoder for interest / personality / education
- StandardScaler for feature normalization

---

## Quick Start

### Frontend only (demo mode — no backend needed)

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

> Demo credentials: `demo@aicareer.com` / `password123`

### Full stack (Frontend + Backend)

**1. Backend**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# → http://localhost:8000/docs
```

**2. Train the ML Models** *(required for AI predictions)*
```bash
cd dataset
python generate_dataset.py          # generates student_career_data.csv

cd ../backend
python training/train_model.py      # outputs models to /models_saved/
```

**3. Frontend**
```bash
cd frontend
npm install
npm run dev
```

---

## Project Structure

```
AI_Career_Path_Optimizer/
│
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app + CORS + router registration
│   │   ├── routers/
│   │   │   ├── auth.py              # JWT login / register / dashboard
│   │   │   ├── predict.py           # Career prediction + skill gap + roadmap
│   │   │   ├── assessment.py        # Quiz questions + evaluation + scoring
│   │   │   ├── resume.py            # Resume parse + ATS enhancement
│   │   │   └── market.py            # Salary data + trending skills + jobs
│   │   └── services/
│   │       └── model_loader.py      # Loads trained ML models at startup
│   ├── training/
│   │   └── train_model.py           # ML training pipeline
│   └── requirements.txt
│
├── dataset/
│   ├── generate_dataset.py          # Synthetic student profile generator
│   └── student_career_data.csv      # 10,000 generated profiles
│
├── models_saved/                    # Trained model artifacts (auto-generated)
│   ├── career_classifier.pkl
│   ├── salary_predictor.pkl
│   ├── scaler.pkl
│   ├── label_encoder_*.pkl
│   ├── feature_columns.pkl
│   └── career_metadata.json
│
└── frontend/
    └── src/
        ├── pages/
        │   ├── Dashboard.tsx        # Live stats, charts, onboarding wizard
        │   ├── PredictPage.tsx      # 5-step ML prediction form
        │   ├── SkillGapPage.tsx     # Radar & bar chart skill analysis
        │   ├── ResumePage.tsx       # Upload → parse → enhance → download
        │   ├── AssessmentPage.tsx   # Timed quiz with instant feedback
        │   └── MarketPage.tsx       # Job listings + salary benchmarks
        ├── components/
        │   ├── Layout.tsx           # Collapsible sidebar navigation
        │   └── ProtectedRoute.tsx   # JWT-protected route wrapper
        ├── context/
        │   └── AuthContext.tsx      # Global auth state + login/register/logout
        └── api/
            └── client.ts            # Typed API client (all endpoints)
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create account |
| `POST` | `/api/auth/login` | Get JWT token |
| `GET`  | `/api/auth/me` | Current user info |
| `GET`  | `/api/auth/dashboard` | Personalized dashboard stats |
| `POST` | `/api/predict/career` | Full ML career prediction |
| `GET`  | `/api/assessment/questions/{skill}` | Quiz questions |
| `POST` | `/api/assessment/evaluate` | Submit + score quiz |
| `GET`  | `/api/assessment/available` | List all quiz skills |
| `POST` | `/api/resume/parse` | Upload + extract skills |
| `POST` | `/api/resume/enhance` | Generate ATS-optimized resume |
| `POST` | `/api/resume/apply-suggestions` | Merge skill suggestions |
| `GET`  | `/api/market/trends` | Trending skills + market data |
| `GET`  | `/api/market/salaries` | Salary benchmarks |
| `GET`  | `/api/market/jobs` | Job listings |

Full interactive docs: `http://localhost:8000/docs`

---

## ML Model Details

```
Dataset       : 10,000 synthetic student profiles
Features      : 35 (skill ratings × 29 + CGPA, experience, projects, etc.)
Target        : 10 career categories
               (Data Scientist, AI/ML Engineer, Full Stack, Cloud Architect,
                DevOps, Cybersecurity, Mobile Dev, Product Manager,
                UI/UX Designer, Blockchain Developer)

Classifier    : RandomForestClassifier  → accuracy ~99.6%
Salary Model  : Ridge Regression        → R² ~0.94
Preprocessing : StandardScaler + LabelEncoder (3 categorical fields)
```

---

## Supported Quiz Skills

`Python` · `JavaScript` · `Machine Learning` · `SQL` · `Docker` · `AWS` · `React` · `Git` · `System Design`

Each skill: **8 questions** · **3 difficulty levels** · **countdown timer** · **keyboard navigation (1–4, ← →)**

---

## Career Paths Covered

| Career | Avg Salary | Market Demand |
|--------|-----------|---------------|
| AI/ML Engineer | $140K | 98% |
| Data Scientist | $120K | 95% |
| Cloud Architect | $135K | 90% |
| DevOps Engineer | $115K | 91% |
| Full Stack Developer | $105K | 92% |
| Cybersecurity Analyst | $110K | 88% |
| Mobile Developer | $100K | 85% |
| Product Manager | $125K | 87% |

---

## License

MIT © 2025 [hitheshph7-ux](https://github.com/hitheshph7-ux)
