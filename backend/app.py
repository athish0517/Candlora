"""
app.py
------
Flask backend for the Crypto Candlestick Pattern Detection System.

Routes:
    GET  /          → Health check
    GET  /pattern   → Fetch live Binance data + detect candlestick pattern
    POST /predict   → ML prediction using Logistic Regression model

Run:
    python app.py
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
import joblib
import numpy as np
import os

from detector import detect_pattern

app = Flask(__name__)
CORS(app)   # Allow React frontend (localhost:3000) to call this API


# ── Load ML Model ─────────────────────────────────────────────────
MODEL_PATH  = os.path.join(os.path.dirname(__file__), "model.pkl")
SCALER_PATH = os.path.join(os.path.dirname(__file__), "scaler.pkl")

try:
    model  = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    print("✅ ML model and scaler loaded successfully.")
except FileNotFoundError:
    model  = None
    scaler = None
    print("⚠️  model.pkl / scaler.pkl not found. Run train_model.py first.")


# ── Binance API Helper ────────────────────────────────────────────

BINANCE_URL = "https://api.binance.com/api/v3/klines"

def fetch_candles(symbol="BTCUSDT", interval="1h", limit=10):
    """
    Fetch OHLC candlestick data from Binance public API.

    Returns a list of dicts:
        [{ "open": float, "high": float, "low": float, "close": float,
           "volume": float, "timestamp": int }, ...]
    """
    try:
        params = {"symbol": symbol, "interval": interval, "limit": limit}
        res    = requests.get(BINANCE_URL, params=params, timeout=10)
        res.raise_for_status()
        raw = res.json()

        candles = []
        for k in raw:
            candles.append({
                "timestamp": k[0],          # Open time (ms)
                "open":      float(k[1]),
                "high":      float(k[2]),
                "low":       float(k[3]),
                "close":     float(k[4]),
                "volume":    float(k[5]),
            })
        return candles
    except Exception as e:
        print(f"❌ Binance fetch error: {e}")
        return []


def make_features(c):
    """Build the same feature vector used during training."""
    body       = abs(c["close"] - c["open"])
    rng        = c["high"] - c["low"]
    upper_wick = c["high"] - max(c["open"], c["close"])
    lower_wick = min(c["open"], c["close"]) - c["low"]
    body_ratio = body / (rng + 1e-9)
    return [
        c["open"], c["high"], c["low"], c["close"],
        body, upper_wick, lower_wick, rng, body_ratio
    ]


# ── Routes ────────────────────────────────────────────────────────

@app.route("/", methods=["GET"])
def index():
    """Health check endpoint."""
    return jsonify({
        "status":  "running",
        "message": "Crypto Pattern Detection API is live 🚀",
        "routes":  ["/pattern", "/predict"]
    })


@app.route("/pattern", methods=["GET"])
def pattern():
    """
    Fetch live Binance candle data and detect candlestick pattern.

    Query params (optional):
        symbol   – e.g. BTCUSDT (default)
        interval – e.g. 1h (default)

    Response:
        {
          "symbol":   "BTCUSDT",
          "interval": "1h",
          "pattern":  "Hammer",
          "signal":   "BUY",
          "candle":   { open, high, low, close, volume, timestamp },
          "price":    float
        }
    """
    symbol   = request.args.get("symbol",   "BTCUSDT").upper()
    interval = request.args.get("interval", "1h")

    candles = fetch_candles(symbol=symbol, interval=interval, limit=10)

    if not candles:
        return jsonify({"error": "Failed to fetch candle data from Binance."}), 500

    result   = detect_pattern(candles)
    latest   = candles[-1]

    return jsonify({
        "symbol":   symbol,
        "interval": interval,
        "pattern":  result["pattern"],
        "signal":   result["signal"],
        "candle":   latest,
        "price":    latest["close"],
    })


@app.route("/predict", methods=["POST"])
def predict():
    """
    ML prediction endpoint.

    Request body (JSON):
        { "open": float, "high": float, "low": float, "close": float }

    Response:
        { "prediction": "BUY" | "SELL" | "HOLD", "confidence": float }
    """
    if model is None or scaler is None:
        return jsonify({
            "error": "ML model not loaded. Please run train_model.py first."
        }), 500

    data = request.get_json()
    if not data:
        return jsonify({"error": "No JSON body provided."}), 400

    required = ["open", "high", "low", "close"]
    missing  = [k for k in required if k not in data]
    if missing:
        return jsonify({"error": f"Missing fields: {missing}"}), 400

    try:
        features = make_features(data)
        X        = np.array(features).reshape(1, -1)
        X_scaled = scaler.transform(X)

        prediction  = model.predict(X_scaled)[0]
        proba       = model.predict_proba(X_scaled)[0]
        confidence  = round(float(max(proba)) * 100, 2)

        return jsonify({
            "prediction": prediction,
            "confidence": confidence,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Entry Point ───────────────────────────────────────────────────

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
