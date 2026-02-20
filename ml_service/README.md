# ML Demand Prediction Service

A Python Flask microservice for predicting ride demand across popular carpooling routes.

## 📁 Structure

```
ml_service/
├── app.py                     # Flask API (port 5001)
├── train_model.py             # Train the ML model
├── generate_dataset.py        # Create synthetic training data
├── requirements.txt           # Python dependencies
├── demand_model.pkl           # Auto-generated after training
├── encoders.pkl               # Auto-generated after training
├── ride_demand_aggregated.csv # Auto-generated dataset
└── venv/                      # Python virtual environment
```

## 🚀 Quick Start

```bash
cd ml_service

# 1. Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate        # macOS/Linux
# venv\Scripts\activate         # Windows

# 2. Install dependencies
pip install -r requirements.txt

# 3. Generate training data (~10,000 ride requests)
python generate_dataset.py

# 4. Train the model
python train_model.py

# 5. Start the API server
python app.py
```

The server starts at **http://localhost:5001**

---

## 📡 API Endpoints

### `GET /health`
Returns service health status.

```json
{
  "status": "UP",
  "service": "ML Demand Prediction Service",
  "model_loaded": true,
  "timestamp": "2024-01-20T10:00:00Z"
}
```

---

### `POST /predict-demand`
Predicts ride demand for a given route, time, and condition.

**Request Body:**
```json
{
  "origin": "Chennai",
  "destination": "Bangalore",
  "day_of_week": "Friday",
  "hour": 18,
  "weather": "sunny"
}
```

**Response:**
```json
{
  "predicted_demand": 12.5,
  "confidence": 0.82,
  "route": "Chennai → Bangalore",
  "time": "18:00",
  "recommendation": "High demand expected – surge pricing likely. Book early!"
}
```

---

### `GET /demand-heatmap`
Returns demand predictions for all popular routes over the next 7 days at peak hours.

**Supported routes:** Chennai–Bangalore, Chennai–Coimbatore, Bangalore–Chennai, Bangalore–Hyderabad, Mumbai–Pune, Delhi–Jaipur

---

## 🤖 Model Details

| Parameter       | Value                  |
|----------------|------------------------|
| Algorithm       | Random Forest Regressor |
| Trees           | 100                    |
| Max Depth       | 10                     |
| Features        | origin, destination, day_of_week, hour, weather |
| Target          | demand_count           |
