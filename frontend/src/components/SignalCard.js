// components/SignalCard.js
// Displays the rule-based trading signal (BUY / SELL / HOLD).

import React from "react";

const SIGNAL_META = {
  BUY:  { emoji: "🚀", tip: "Pattern suggests upward movement." },
  SELL: { emoji: "🔻", tip: "Pattern suggests downward movement." },
  HOLD: { emoji: "⏸️",  tip: "Market is indecisive — wait." },
};

function SignalCard({ signal = "HOLD" }) {
  const meta = SIGNAL_META[signal] || SIGNAL_META["HOLD"];

  return (
    <div className="card signal-card">
      <div className="card-label">Trading Signal</div>
      <div className={`card-value signal-${signal}`}>
        {meta.emoji} {signal}
      </div>
      <div className="card-sub">{meta.tip}</div>
    </div>
  );
}

export default SignalCard;
