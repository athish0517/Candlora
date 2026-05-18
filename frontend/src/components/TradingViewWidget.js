import React from "react";

function TradingViewWidget({ symbol, interval }) {
  return (
    <iframe
      title="TradingView"
      width="100%"
      height="500"
      src={`https://s.tradingview.com/widgetembed/?symbol=${symbol}&interval=${interval}&theme=dark`}
      frameBorder="0"
    />
  );
}

export default TradingViewWidget;