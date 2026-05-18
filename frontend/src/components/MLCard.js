// components/MLCard.js
// Displays the ML model's prediction and confidence bar.

import React from "react";

function MLCard({ prediction = null, confidence = null, loading = false }) {
  const getBarClass = (conf) => {
    if (conf >= 70) return "conf-high";
    if (conf >= 40) return "conf-med";
    return "conf-low";
  };

  if (loading) {
    return (
      <div className="card ml-card">
        <div className="card-label">ML Prediction (Logistic Regression)</div>
        <div className="skeleton" style={{ height: 32, marginTop: 8, width: "60%" }} />
        <div className="skeleton" style={{ height: 10, marginTop: 16 }} />
      </div>
    );
  }

  return (
    <div className="card ml-card">
      <div className="card-label">ML Prediction (Logistic Regression)</div>

      {prediction ? (
        <>
          <div className={`ml-prediction signal-${prediction}`} style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>
            🤖 {prediction}
          </div>

          {confidence !== null && (
            <div className="confidence-bar-wrap">
              <div className="card-sub" style={{ marginBottom: 4 }}>
                Confidence: <strong style={{ color: "var(--text-primary)" }}>{confidence}%</strong>
              </div>
              <div className="confidence-bar-bg">
                <div
                  className={`confidence-bar-fill ${getBarClass(confidence)}`}
                  style={{ width: `${confidence}%` }}
                />
              </div>
            </div>
          )}

          <div className="card-sub" style={{ marginTop: 8 }}>
            Model trained on OHLC features using scikit-learn
          </div>
        </>
      ) : (
        <div className="card-sub" style={{ marginTop: 8 }}>
          Waiting for data to run ML prediction...
        </div>
      )}
    </div>
  );
}

export default MLCard;
