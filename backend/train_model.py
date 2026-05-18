"""
train_model.py
--------------
Trains a Logistic Regression model on candlestick OHLC data.
Saves the trained model as model.pkl using joblib.

Run this once before starting the Flask server:
    python train_model.py
"""

import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, accuracy_score
import joblib
import os

# ── 1. Load dataset ──────────────────────────────────────────────
print("📦 Loading dataset...")
df = pd.read_csv("dataset.csv")

# ── 2. Features and Labels ───────────────────────────────────────
# Features: Open, High, Low, Close prices
X = df[["open", "high", "low", "close"]]

# Derived features that help the model understand candle shape
X = X.copy()
X["body"]        = abs(df["close"] - df["open"])            # Candle body size
X["upper_wick"]  = df["high"] - df[["open", "close"]].max(axis=1)  # Upper wick
X["lower_wick"]  = df[["open", "close"]].min(axis=1) - df["low"]   # Lower wick
X["range"]       = df["high"] - df["low"]                  # Total range
X["body_ratio"]  = X["body"] / (X["range"] + 1e-9)        # Body-to-range ratio

# Labels: BUY / SELL / HOLD
y = df["label"]

print(f"✅ Dataset loaded: {len(df)} rows | Classes: {df['label'].value_counts().to_dict()}")

# ── 3. Train/Test Split ──────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# ── 4. Feature Scaling ───────────────────────────────────────────
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled  = scaler.transform(X_test)

# ── 5. Train Logistic Regression ─────────────────────────────────
print("🤖 Training Logistic Regression model...")
model = LogisticRegression(
    max_iter=1000,
    random_state=42,
    multi_class="auto",
    solver="lbfgs"
)
model.fit(X_train_scaled, y_train)

# ── 6. Evaluate ──────────────────────────────────────────────────
y_pred = model.predict(X_test_scaled)
acc    = accuracy_score(y_test, y_pred)

print(f"\n📊 Model Accuracy: {acc * 100:.2f}%")
print("\n📋 Classification Report:")
print(classification_report(y_test, y_pred))

# ── 7. Save Model & Scaler ───────────────────────────────────────
joblib.dump(model,  "model.pkl")
joblib.dump(scaler, "scaler.pkl")

print("💾 Model saved as model.pkl")
print("💾 Scaler saved as scaler.pkl")
print("\n✅ Training complete! You can now run app.py")
