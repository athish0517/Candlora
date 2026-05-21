// App.js — Main React Application
// Crypto Candlestick Pattern Detection System

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./App.css";

import TradingViewWidget from "./components/TradingViewWidget";
import PatternCard       from "./components/PatternCard";
import SignalCard        from "./components/SignalCard";
import MLCard            from "./components/MLCard";

// ── Config ──────────────────────────────────────────────────────
const API_BASE = "http://localhost:5000";

// Interval display labels
const INTERVALS = [
  { value: "1m",  label: "1 Min",   tv: "1"   },
  { value: "5m",  label: "5 Min",   tv: "5"   },
  { value: "15m", label: "15 Min",  tv: "15"  },
  { value: "1h",  label: "1 Hour",  tv: "60"  },
  { value: "4h",  label: "4 Hours", tv: "240" },
  { value: "1d",  label: "1 Day",   tv: "D"   },
];

const SYMBOLS = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT"];

// ── Helpers ──────────────────────────────────────────────────────
const fmt = (n, d = 2) =>
  n != null ? Number(n).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }) : "—";

function timeAgo(date) {
  if (!date) return "";
  const secs = Math.floor((Date.now() - date) / 1000);
  if (secs < 60)  return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

// ── App Component ────────────────────────────────────────────────
function App() {
  const [symbol,     setSymbol]     = useState("BTCUSDT");
  const [interval, setIntervalValue] = useState("1h");
  const [loading,    setLoading]    = useState(false);
  const [mlLoading,  setMlLoading]  = useState(false);
  const [error,      setError]      = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Pattern API response
  const [patternData, setPatternData] = useState(null);

  // ML prediction state
  const [mlData, setMlData] = useState(null);

  // Detection history (last 10)
  const [history, setHistory] = useState([]);

  // Current interval's TradingView notation
  const tvInterval = INTERVALS.find(i => i.value === interval)?.tv || "60";

  // ── Fetch Pattern from Backend ──────────────────────────────
  const fetchPattern = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`api/pattern`, {
        params: { symbol, interval },
        timeout: 10000,
      });
      const d = res.data;
      setPatternData(d);
      setLastUpdate(Date.now());

      // Add to history
      setHistory(prev => [
        {
          time:    new Date().toLocaleTimeString(),
          symbol:  d.symbol,
          price:   d.price,
          pattern: d.pattern,
          signal:  d.signal,
        },
        ...prev.slice(0, 9),   // keep last 10
      ]);

      // Trigger ML prediction with the latest candle
      if (d.candle) {
        runMLPredict(d.candle);
      }
    } catch (err) {
      if (err.code === "ERR_NETWORK" || err.code === "ECONNREFUSED") {
        setError("Cannot connect to backend. Make sure Flask is running on port 5000.");
      } else {
        setError(err.response?.data?.error || "Failed to fetch pattern data.");
      }
    } finally {
      setLoading(false);
    }
  }, [symbol, interval]);

  // ── Run ML Prediction ───────────────────────────────────────
  const runMLPredict = async (candle) => {
    setMlLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/predict`, {
        open:  candle.open,
        high:  candle.high,
        low:   candle.low,
        close: candle.close,
      }, { timeout: 8000 });
      setMlData(res.data);
    } catch (err) {
      console.warn("ML predict failed:", err.message);
      setMlData(null);
    } finally {
      setMlLoading(false);
    }
  };

  // ── Auto-refresh every 60 seconds ──────────────────────────
  useEffect(() => {
    fetchPattern();
    const timer = setInterval(fetchPattern, 60_000);
    return () => clearInterval(timer);
  }, [fetchPattern]);

  const candle = patternData?.candle;

  return (
    <div className="app">

      {/* ── Header ── */}
      <header className="header">
        <div className="header-left">
          <div className="logo-icon">📊</div>
          <div>
            <h1>Candlora</h1>
            <div className="header-subtitle">Candlestick Pattern Detection System</div>
          </div>
        </div>
        <div className="header-right">
          <div className="live-badge">
            <span className="live-dot" />
            LIVE
          </div>
          {lastUpdate && (
            <span className="last-update">Updated {timeAgo(lastUpdate)}</span>
          )}
        </div>
      </header>

      {/* ── Controls ── */}
      <div className="controls">
        <label>SYMBOL</label>
        <select value={symbol} onChange={e => setSymbol(e.target.value)}>
          {SYMBOLS.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <label>INTERVAL</label>
        <select value={interval} onChange={e => setIntervalValue(e.target.value)}>
          {INTERVALS.map(i => (
            <option key={i.value} value={i.value}>{i.label}</option>
          ))}
        </select>

        <button
          className={`btn-refresh ${loading ? "loading" : ""}`}
          onClick={fetchPattern}
          disabled={loading}
        >
          <span className="spin" style={{ display: "inline-block" }}>⟳</span>
          {loading ? "Fetching..." : "Refresh"}
        </button>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="error-banner">
          ⚠️ {error}
        </div>
      )}

      {/* ── Top 3 Cards: Price | Signal | Pattern ── */}
      <div className="grid-top">
        {/* Price Card */}
        <div className="card price-card">
          <div className="card-label">{symbol} Price</div>
          {loading && !patternData ? (
            <div className="skeleton" style={{ height: 36, marginTop: 4 }} />
          ) : (
            <>
              <div className="card-value">
                ${fmt(patternData?.price, 2)}
              </div>
              <div className="card-sub">
                {String(interval).toUpperCase()} candle — Binance
              </div>
            </>
          )}
        </div>

        {/* Signal Card */}
        <SignalCard signal={patternData?.signal || "HOLD"} />

        {/* Pattern Card */}
        <PatternCard pattern={patternData?.pattern || "No Data"} />
      </div>

      {/* ── Bottom Row: OHLC + ML ── */}
      <div className="grid-bottom">
        {/* OHLC Card */}
        <div className="card ohlc-card">
          <div className="card-label">Latest Candle — OHLC Data</div>
          {candle ? (
            <div className="ohlc-grid">
              <div className="ohlc-item ohlc-open">
                <div className="ohlc-key">Open</div>
                <div className="ohlc-val">${fmt(candle.open)}</div>
              </div>
              <div className="ohlc-item ohlc-high">
                <div className="ohlc-key">High</div>
                <div className="ohlc-val">${fmt(candle.high)}</div>
              </div>
              <div className="ohlc-item ohlc-low">
                <div className="ohlc-key">Low</div>
                <div className="ohlc-val">${fmt(candle.low)}</div>
              </div>
              <div className="ohlc-item ohlc-close">
                <div className="ohlc-key">Close</div>
                <div className="ohlc-val">${fmt(candle.close)}</div>
              </div>
            </div>
          ) : (
            <div className="skeleton" style={{ height: 60, marginTop: 12 }} />
          )}
          {candle && (
            <div className="card-sub" style={{ marginTop: 12 }}>
              Volume: {fmt(candle.volume, 3)} BTC
            </div>
          )}
        </div>

        {/* ML Card */}
        <MLCard
          prediction={mlData?.prediction}
          confidence={mlData?.confidence}
          loading={mlLoading}
        />
      </div>

      {/* ── TradingView Chart ── */}
      <div className="chart-section">
        <div className="chart-header">
          <div className="chart-title">
            📈 Live Chart — {symbol}
          </div>
          <span style={{ fontSize: 11, color: "var(--text-dim)" }}>
            Powered by TradingView
          </span>
        </div>
        <TradingViewWidget
          symbol={`BINANCE:${symbol}`}
          interval={tvInterval}
        />
      </div>

      {/* ── Detection History ── */}
      <div className="history-section">
        <div className="history-header">
          <div className="history-title">🕐 Detection History</div>
          <span style={{ fontSize: 11, color: "var(--text-dim)" }}>
            Last {history.length} detections
          </span>
        </div>
        {history.length === 0 ? (
          <div style={{ padding: "24px", color: "var(--text-dim)", textAlign: "center" }}>
            No detections yet. Click Refresh to start.
          </div>
        ) : (
          <table className="history-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Symbol</th>
                <th>Price</th>
                <th>Pattern</th>
                <th>Signal</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row, i) => (
                <tr key={i}>
                  <td style={{ color: "var(--text-secondary)" }}>{row.time}</td>
                  <td style={{ color: "var(--blue)" }}>{row.symbol}</td>
                  <td>${fmt(row.price)}</td>
                  <td>{row.pattern}</td>
                  <td>
                    <span className={`tag tag-${row.signal}`}>{row.signal}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {/* ── Footer ── */}
      <footer className="footer">
        CANDLORA · CANDLESTICK PATTERN DETECTION SYSTEM · MINI PROJECT · REACT + FLASK + SCIKIT-LEARN
      </footer>

    </div>
  );
}

export default App;
