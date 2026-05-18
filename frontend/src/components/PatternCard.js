// components/PatternCard.js
// Displays the detected candlestick pattern with an emoji icon.

import React from "react";

// Map pattern names to emoji icons
const ICONS = {
  "Doji":               "➕",
  "Hammer":             "🔨",
  "Bullish Engulfing":  "🐂",
  "Bearish Engulfing":  "🐻",
  "Bullish Candle":     "📈",
  "Bearish Candle":     "📉",
  "Neutral":            "⚖️",
  "No Data":            "❓",
};

// Map pattern names to brief explanations
const DESCRIPTIONS = {
  "Doji":               "Open ≈ Close — market indecision.",
  "Hammer":             "Long lower wick — possible bullish reversal.",
  "Bullish Engulfing":  "Bull candle fully engulfs prior bear candle.",
  "Bearish Engulfing":  "Bear candle fully engulfs prior bull candle.",
  "Bullish Candle":     "Close > Open — upward momentum.",
  "Bearish Candle":     "Close < Open — downward momentum.",
  "Neutral":            "No significant pattern detected.",
  "No Data":            "Waiting for candle data...",
};

function PatternCard({ pattern = "No Data" }) {
  const icon = ICONS[pattern]        || "🕯️";
  const desc = DESCRIPTIONS[pattern] || "";

  return (
    <div className="card pattern-card">
      <div className="card-label">Detected Pattern</div>
      <div className="pattern-icon">{icon}</div>
      <div className="pattern-name">{pattern}</div>
      <div className="card-sub" style={{ marginTop: 8 }}>{desc}</div>
    </div>
  );
}

export default PatternCard;
