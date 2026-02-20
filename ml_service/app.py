"""
app.py
------
Flask API for the ML Demand Prediction service.
Endpoints:
  GET  /health
  POST /predict-demand
  GET  /demand-heatmap
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import os
import numpy as np
from datetime import datetime, timedelta
import logging

# ── Setup ─────────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# ── Load model artifacts ───────────────────────────────────────────────────────
BASE_DIR      = os.path.dirname(__file__)
MODEL_PATH    = os.path.join(BASE_DIR, "demand_model.pkl")
ENCODERS_PATH = os.path.join(BASE_DIR, "encoders.pkl")

model    = None
encoders = None

def load_artifacts():
    global model, encoders
    if os.path.exists(MODEL_PATH) and os.path.exists(ENCODERS_PATH):
        model    = joblib.load(MODEL_PATH)
        encoders = joblib.load(ENCODERS_PATH)
        logger.info("✅ ML model and encoders loaded successfully.")
    else:
        logger.warning(
            "⚠️  Model files not found. "
            "Run `python generate_dataset.py` then `python train_model.py` first."
        )

load_artifacts()

# ── Constants ─────────────────────────────────────────────────────────────────
POPULAR_ROUTES = [
    ("Chennai",   "Bangalore"),
    ("Chennai",   "Coimbatore"),
    ("Bangalore", "Chennai"),
    ("Bangalore", "Hyderabad"),
    ("Mumbai",    "Pune"),
    ("Delhi",     "Jaipur"),
]

PEAK_HOURS = [8, 9, 17, 18, 19]

DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday",
             "Friday", "Saturday", "Sunday"]

WEATHER_OPTIONS = ["sunny", "cloudy", "rainy"]


def encode_feature(col: str, value: str):
    """Safely encode a single categorical value using the saved LabelEncoder."""
    le = encoders[col]
    if value in le.classes_:
        return int(le.transform([value])[0])
    # Unknown value → use last class index as fallback
    return len(le.classes_) - 1


def build_recommendation(demand: float, hour: int) -> str:
    if demand >= 10:
        return "High demand expected – surge pricing likely. Book early!"
    if demand >= 5:
        return "Moderate demand. Good time to find a ride."
    if 0 <= hour < 6:
        return "Low demand – off-peak hours. Rides available immediately."
    return "Low demand expected. Plenty of ride options available."


def calculate_confidence(prediction: float) -> float:
    """Heuristic confidence: higher demand → more data → higher confidence."""
    base = 0.70
    boost = min(prediction / 20.0, 0.25)   # cap at +25 %
    return round(base + boost, 2)


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status":       "UP",
        "service":      "ML Demand Prediction Service",
        "model_loaded": model is not None,
        "timestamp":    datetime.utcnow().isoformat() + "Z",
    }), 200


@app.route("/predict-demand", methods=["POST"])
def predict_demand():
    if model is None or encoders is None:
        return jsonify({
            "error": "Model not loaded. Please train the model first."
        }), 503

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON."}), 400

    required = ["origin", "destination", "day_of_week", "hour", "weather"]
    missing  = [f for f in required if f not in data]
    if missing:
        return jsonify({"error": f"Missing fields: {missing}"}), 400

    try:
        origin      = str(data["origin"]).strip()
        destination = str(data["destination"]).strip()
        day_of_week = str(data["day_of_week"]).strip()
        hour        = int(data["hour"])
        weather     = str(data["weather"]).strip().lower()

        if not (0 <= hour <= 23):
            return jsonify({"error": "hour must be between 0 and 23"}), 400
        if day_of_week not in DAY_ORDER:
            return jsonify({"error": f"day_of_week must be one of {DAY_ORDER}"}), 400
        if weather not in WEATHER_OPTIONS:
            return jsonify({"error": f"weather must be one of {WEATHER_OPTIONS}"}), 400

        features = np.array([[
            encode_feature("origin",      origin),
            encode_feature("destination", destination),
            encode_feature("day_of_week", day_of_week),
            hour,
            encode_feature("weather",     weather),
        ]])

        raw_prediction     = float(model.predict(features)[0])
        predicted_demand   = max(0, round(raw_prediction, 2))
        confidence         = calculate_confidence(predicted_demand)
        recommendation     = build_recommendation(predicted_demand, hour)

        return jsonify({
            "predicted_demand": predicted_demand,
            "confidence":       confidence,
            "route":            f"{origin} → {destination}",
            "time":             f"{hour:02d}:00",
            "recommendation":   recommendation,
            "inputs": {
                "origin":      origin,
                "destination": destination,
                "day_of_week": day_of_week,
                "hour":        hour,
                "weather":     weather,
            },
        }), 200

    except Exception as exc:
        logger.exception("Prediction error")
        return jsonify({"error": str(exc)}), 500


@app.route("/demand-heatmap", methods=["GET"])
def demand_heatmap():
    if model is None or encoders is None:
        return jsonify({
            "error": "Model not loaded. Please train the model first."
        }), 503

    try:
        today     = datetime.utcnow()
        heatmap   = []

        for day_offset in range(7):
            target_date = today + timedelta(days=day_offset)
            day_name    = target_date.strftime("%A")

            for origin, destination in POPULAR_ROUTES:
                for hour in PEAK_HOURS:
                    for weather in WEATHER_OPTIONS:
                        features = np.array([[
                            encode_feature("origin",      origin),
                            encode_feature("destination", destination),
                            encode_feature("day_of_week", day_name),
                            hour,
                            encode_feature("weather",     weather),
                        ]])
                        pred = max(0, round(float(model.predict(features)[0]), 2))

                        heatmap.append({
                            "date":        target_date.strftime("%Y-%m-%d"),
                            "day":         day_name,
                            "route":       f"{origin} → {destination}",
                            "hour":        hour,
                            "weather":     weather,
                            "demand":      pred,
                            "demand_level": (
                                "high"   if pred >= 10 else
                                "medium" if pred >= 5  else
                                "low"
                            ),
                        })

        return jsonify({
            "status":         "success",
            "total_entries":  len(heatmap),
            "generated_at":   datetime.utcnow().isoformat() + "Z",
            "heatmap":        heatmap,
        }), 200

    except Exception as exc:
        logger.exception("Heatmap error")
        return jsonify({"error": str(exc)}), 500


# ── Entry Point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)