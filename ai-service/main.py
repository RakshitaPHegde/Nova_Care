"""AstroVital AI service. Stateless: no database. EXPERIMENTAL, non-clinical."""
import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel
from sklearn.ensemble import IsolationForest
app = FastAPI(title="AstroVital AI (experimental)")
KEYS = ["heart_rate", "hrv", "spo2", "respiratory_rate", "sleep_hours", "systolic_bp", "body_temperature"]
class Req(BaseModel):
    history: list[dict]
    current: dict
def mat(rows, keys=KEYS):
    X = [[r.get(k) for k in keys] for r in rows]
    return np.array([x for x in X if all(v is not None for v in x)], dtype=float)
@app.get("/health")
def health(): return {"status": "ok"}
@app.post("/baseline/create")
def baseline(r: Req):
    out = {}
    for k in KEYS:
        v = [x[k] for x in r.history if x.get(k) is not None]
        if len(v) >= 5: out[k] = {"mean": float(np.mean(v)), "std": float(np.std(v, ddof=1)), "n": len(v)}
    return out
@app.post("/anomaly/detect")
def detect(r: Req):
    X = mat(r.history)
    cur = [r.current.get(k) for k in KEYS]
    if len(X) < 14 or any(v is None for v in cur):
        return {"score": None, "flagged": False, "note": "Insufficient or incomplete data", "model": "isolation-forest-demo"}
    m = IsolationForest(random_state=0, contamination=0.1).fit(X)
    c = np.array([cur], dtype=float)
    return {"score": round(float(-m.decision_function(c)[0]), 3), "flagged": bool(m.predict(c)[0] == -1), "model": "isolation-forest-demo"}
@app.post("/trends/analyze")
def trends(r: Req):
    out = {}
    for k in KEYS:
        v = [x[k] for x in reversed(r.history) if x.get(k) is not None]
        if len(v) >= 3: out[k] = {"slope_per_day": float(np.polyfit(range(len(v)), v, 1)[0]), "n": len(v)}
    return out
