"""
detector.py
-----------
Candlestick pattern detection logic.

Each function receives the LAST candle (or last two candles) as dicts:
    candle = { "open": float, "high": float, "low": float, "close": float }

Returns a dict:
    { "pattern": str, "signal": "BUY" | "SELL" | "HOLD" }
"""


def _body(c):
    """Absolute candle body size."""
    return abs(c["close"] - c["open"])


def _range(c):
    """Total candle range (high - low)."""
    return c["high"] - c["low"]


def _upper_wick(c):
    """Upper wick length."""
    return c["high"] - max(c["open"], c["close"])


def _lower_wick(c):
    """Lower wick length."""
    return min(c["open"], c["close"]) - c["low"]


def _is_bullish(c):
    return c["close"] > c["open"]


def _is_bearish(c):
    return c["close"] < c["open"]


# ── Pattern Detectors ─────────────────────────────────────────────

def detect_doji(c):
    """
    Doji: Open ≈ Close → tiny body compared to total range.
    Signal: HOLD (market indecision)
    """
    body  = _body(c)
    rng   = _range(c)
    if rng == 0:
        return False
    return (body / rng) < 0.1   # body is <10% of total range


def detect_hammer(c):
    """
    Hammer: Small body at top, long lower wick (≥2× body), tiny upper wick.
    Signal: BUY (bullish reversal)
    """
    body  = _body(c)
    lower = _lower_wick(c)
    upper = _upper_wick(c)
    rng   = _range(c)
    if rng == 0 or body == 0:
        return False
    return (
        lower >= 2 * body and   # lower wick at least 2× the body
        upper <= body * 0.3 and # tiny upper wick
        body / rng < 0.4        # body is a small portion of range
    )


def detect_bullish_engulfing(prev, curr):
    """
    Bullish Engulfing: Previous candle is bearish, current is bullish
    and completely engulfs the previous body.
    Signal: BUY
    """
    return (
        _is_bearish(prev) and
        _is_bullish(curr) and
        curr["open"] < prev["close"] and
        curr["close"] > prev["open"]
    )


def detect_bearish_engulfing(prev, curr):
    """
    Bearish Engulfing: Previous candle is bullish, current is bearish
    and completely engulfs the previous body.
    Signal: SELL
    """
    return (
        _is_bullish(prev) and
        _is_bearish(curr) and
        curr["open"] > prev["close"] and
        curr["close"] < prev["open"]
    )


# ── Main Detection Function ───────────────────────────────────────

def detect_pattern(candles):
    """
    Runs all pattern detectors on the last 2 candles.

    Parameters
    ----------
    candles : list of dicts
        Each dict has keys: open, high, low, close

    Returns
    -------
    dict with keys: pattern (str), signal (str)
    """
    if not candles or len(candles) < 2:
        return {"pattern": "No Data", "signal": "HOLD"}

    curr = candles[-1]   # Most recent candle
    prev = candles[-2]   # Previous candle

    # ── Single-candle patterns ────────────────────────────────────
    if detect_doji(curr):
        return {"pattern": "Doji", "signal": "HOLD"}

    if detect_hammer(curr):
        return {"pattern": "Hammer", "signal": "BUY"}

    # ── Two-candle patterns ───────────────────────────────────────
    if detect_bullish_engulfing(prev, curr):
        return {"pattern": "Bullish Engulfing", "signal": "BUY"}

    if detect_bearish_engulfing(prev, curr):
        return {"pattern": "Bearish Engulfing", "signal": "SELL"}

    # ── Fallback: simple trend check ─────────────────────────────
    if curr["close"] > curr["open"]:
        return {"pattern": "Bullish Candle", "signal": "BUY"}
    elif curr["close"] < curr["open"]:
        return {"pattern": "Bearish Candle", "signal": "SELL"}

    return {"pattern": "Neutral", "signal": "HOLD"}
