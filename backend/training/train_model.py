"""
Complete ML Training Pipeline for AI Career Path Optimizer
Trains: Random Forest (career), Gradient Boosting (salary), + encoders
"""
import pandas as pd
import numpy as np
import os
import joblib
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.metrics import accuracy_score, classification_report, mean_absolute_error
import warnings
warnings.filterwarnings('ignore')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, "../.."))
DATA_PATH = os.path.join(PROJECT_ROOT, "dataset/student_career_data.csv")
MODELS_DIR = os.path.join(PROJECT_ROOT, "models_saved")
os.makedirs(MODELS_DIR, exist_ok=True)

print("🚀 Starting AI Career Path Optimizer Training Pipeline...")
print("=" * 60)

# ─── Load Data ───────────────────────────────────────────────
print("📊 Loading dataset...")
df = pd.read_csv(DATA_PATH)
print(f"   Shape: {df.shape}")

FEATURE_COLS = [c for c in df.columns if c not in [
    "Career_Path", "Primary_Interest", "Secondary_Interest",
    "Personality_Type", "Education_Level"
]]

# ─── Encode categoricals ─────────────────────────────────────
le_career = LabelEncoder()
df["Career_Label"] = le_career.fit_transform(df["Career_Path"])

le_interest = LabelEncoder()
df["Primary_Interest_Enc"] = le_interest.fit_transform(df["Primary_Interest"])

le_personality = LabelEncoder()
df["Personality_Enc"] = le_personality.fit_transform(df["Personality_Type"])

le_edu = LabelEncoder()
df["Education_Enc"] = le_edu.fit_transform(df["Education_Level"])

FEATURE_COLS += ["Primary_Interest_Enc", "Personality_Enc", "Education_Enc"]

X = df[FEATURE_COLS].fillna(0)
y_career = df["Career_Label"]
y_salary = df["Expected_Salary"]

# ─── Scale ───────────────────────────────────────────────────
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y_career, test_size=0.2, random_state=42, stratify=y_career
)

# ─── Career Path Classifier ──────────────────────────────────
print("\n🌲 Training Career Path Classifier (Random Forest)...")
rf = RandomForestClassifier(n_estimators=200, max_depth=20,
                             min_samples_split=5, n_jobs=-1, random_state=42)
rf.fit(X_train, y_train)
y_pred = rf.predict(X_test)
acc = accuracy_score(y_test, y_pred)
print(f"   ✅ Accuracy: {acc:.2%}")
print(f"\n{classification_report(y_test, y_pred, target_names=le_career.classes_)}")

# ─── Salary Regressor ─────────────────────────────────────────
print("\n💰 Training Salary Predictor (Gradient Boosting)...")
X_sal_train, X_sal_test, y_sal_train, y_sal_test = train_test_split(
    X_scaled, y_salary, test_size=0.2, random_state=42
)
gb = GradientBoostingRegressor(n_estimators=200, learning_rate=0.05,
                                max_depth=5, random_state=42)
gb.fit(X_sal_train, y_sal_train)
sal_pred = gb.predict(X_sal_test)
mae = mean_absolute_error(y_sal_test, sal_pred)
print(f"   ✅ MAE: ${mae:,.0f}")

# ─── Feature Importance ──────────────────────────────────────
importances = pd.Series(rf.feature_importances_, index=FEATURE_COLS)
top10 = importances.nlargest(10)
print(f"\n🔍 Top 10 Important Features:\n{top10.to_string()}")

# ─── Save Models ─────────────────────────────────────────────
print("\n💾 Saving models...")
joblib.dump(rf, os.path.join(MODELS_DIR, "career_classifier.pkl"))
joblib.dump(gb, os.path.join(MODELS_DIR, "salary_predictor.pkl"))
joblib.dump(scaler, os.path.join(MODELS_DIR, "scaler.pkl"))
joblib.dump(le_career, os.path.join(MODELS_DIR, "label_encoder_career.pkl"))
joblib.dump(le_interest, os.path.join(MODELS_DIR, "label_encoder_interest.pkl"))
joblib.dump(le_personality, os.path.join(MODELS_DIR, "label_encoder_personality.pkl"))
joblib.dump(le_edu, os.path.join(MODELS_DIR, "label_encoder_education.pkl"))
joblib.dump(FEATURE_COLS, os.path.join(MODELS_DIR, "feature_columns.pkl"))

# Save career metadata
career_meta = {
    "classes": list(le_career.classes_),
    "skill_columns": [c for c in FEATURE_COLS if c.endswith("_Skill")],
    "required_skills": {
        career: list(top10.index[:5]) for career in le_career.classes_
    }
}
import json
with open(os.path.join(MODELS_DIR, "career_metadata.json"), "w") as f:
    json.dump(career_meta, f, indent=2)

print("\n✅ Training Complete! All models saved.")
print(f"   Models directory: {MODELS_DIR}")
print("=" * 60)
