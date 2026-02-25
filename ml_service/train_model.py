"""
train_model.py
--------------
Loads ride_demand_aggregated.csv, trains a RandomForestRegressor,
and saves the model + label encoders as .pkl files.
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import os

# -- Load Dataset --------------------------------------------------------------
CSV_PATH = os.path.join(os.path.dirname(__file__), "ride_demand_aggregated.csv")

if not os.path.exists(CSV_PATH):
    raise FileNotFoundError(
        f"Dataset not found at {CSV_PATH}. "
        "Please run `python generate_dataset.py` first."
    )

df = pd.read_csv(CSV_PATH)
print(f"Loaded dataset: {len(df):,} rows")

# -- Feature Engineering -------------------------------------------------------
CATEGORICAL = ["origin", "destination", "day_of_week", "weather"]

encoders: dict[str, LabelEncoder] = {}
for col in CATEGORICAL:
    le = LabelEncoder()
    df[col] = le.fit_transform(df[col].astype(str))
    encoders[col] = le

FEATURES = ["origin", "destination", "day_of_week", "hour", "weather"]
TARGET   = "demand_count"

X = df[FEATURES].values
y = df[TARGET].values

# -- Train / Test Split --------------------------------------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# -- Train Model ---------------------------------------------------------------
print("\nTraining RandomForestRegressor (100 trees, max_depth=10) ...")
model = RandomForestRegressor(
    n_estimators=100,
    max_depth=10,
    random_state=42,
    n_jobs=-1,
)
model.fit(X_train, y_train)

# -- Evaluate ------------------------------------------------------------------
y_pred = model.predict(X_test)
mae    = mean_absolute_error(y_test, y_pred)
r2     = r2_score(y_test, y_pred)

print(f"\n{'='*40}")
print(f"  Mean Absolute Error (MAE) : {mae:.4f}")
print(f"  R² Score                  : {r2:.4f}")
print(f"{'='*40}")

# Feature importance
importances = model.feature_importances_
print("\nFeature Importances:")
for feat, imp in sorted(zip(FEATURES, importances), key=lambda x: -x[1]):
    print(f"  {feat:<20} {imp:.4f}")

# -- Save Artifacts ------------------------------------------------------------
MODEL_PATH    = os.path.join(os.path.dirname(__file__), "demand_model.pkl")
ENCODERS_PATH = os.path.join(os.path.dirname(__file__), "encoders.pkl")

joblib.dump(model,    MODEL_PATH)
joblib.dump(encoders, ENCODERS_PATH)

print(f"\nModel   saved -> {MODEL_PATH}")
print(f"Encoders saved -> {ENCODERS_PATH}")
