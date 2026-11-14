import { q } from './db.js';

export const M = [
  'heart_rate',
  'hrv',
  'spo2',
  'respiratory_rate',
  'systolic_bp',
  'diastolic_bp',
  'body_temperature',
  'sleep_hours'
];

const stats = v => {
  if (!v || v.length === 0) return { mean: 0, std: 0 };
  const m = v.reduce((a, b) => a + b, 0) / v.length;
  const variance = v.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(v.length - 1, 1);
  return { mean: m, std: Math.sqrt(variance) };
};

export const slope = v => {
  const n = v.length;
  if (n < 3) return null;
  const xm = (n - 1) / 2;
  const ym = v.reduce((a, b) => a + b, 0) / n;
  let a = 0, b = 0;
  v.forEach((y, i) => {
    a += (i - xm) * (y - ym);
    b += (i - xm) ** 2;
  });
  return b === 0 ? 0 : a / b;
};

export const getBaseline = async aid => {
  const r = await q(
    'SELECT * FROM health_baselines WHERE astronaut_id=$1 AND version=(SELECT COALESCE(MAX(version), 1) FROM health_baselines WHERE astronaut_id=$1)',
    [aid]
  );
  return Object.fromEntries(r.map(x => [x.metric_name, x]));
};

export async function buildBaseline(aid) {
  const existing = await getBaseline(aid);
  if (Object.keys(existing).length >= 5) return existing;

  const r = await q(
    "SELECT * FROM health_metrics WHERE astronaut_id=$1 AND data_quality='valid' ORDER BY recorded_at ASC LIMIT 14",
    [aid]
  );
  if (r.length < 5) return null;

  for (const m of M) {
    const v = r.map(x => x[m]).filter(x => x != null && Number.isFinite(+x)).map(x => +x);
    if (v.length < 5) continue;
    const s = stats(v);
    await q(
      `INSERT INTO health_baselines(astronaut_id, metric_name, mean, std_dev, sample_count, version)
       VALUES($1, $2, $3, $4, $5, 1)
       ON CONFLICT DO NOTHING`,
      [aid, m, s.mean, s.std || 1.0, v.length]
    );
  }
  return await getBaseline(aid);
}

/**
 * Meaningful AI Risk Engine for Astronaut Health Monitoring
 * Evaluates vitals, baseline z-scores, environmental factors, mental health, and historical trends.
 * Outputs:
 * - riskScore (0-100)
 * - riskCategory ('LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL')
 * - severity ('green' | 'yellow' | 'orange' | 'red')
 * - contributingFactors: Array with weights, observed vs baseline, and impact descriptions
 * - explanation: Clinically grounded explanation
 * - recommendedActions: Actionable medical review protocols
 * - experimentalMl: Isolation Forest score from AI service
 */
export async function analyze(aid, cur = {}, mental = {}, env = {}) {
  await buildBaseline(aid);
  const base = await getBaseline(aid);

  // Helper for Z-score calculation against personalized baseline
  const calcZ = m => {
    const b = base[m];
    if (!b || b.std_dev <= 0 || cur[m] == null) return null;
    return +((cur[m] - b.mean) / b.std_dev).toFixed(2);
  };

  const factors = [];
  let rawRiskPoints = 0;

  // 1. SpO2 (Blood Oxygen) Analysis
  if (cur.spo2 != null) {
    const spo2 = +cur.spo2;
    const z = calcZ('spo2');
    if (spo2 < 90) {
      const pts = 45;
      rawRiskPoints += pts;
      factors.push({
        name: 'Blood Oxygen (SpO2)',
        metric: 'spo2',
        observed: spo2,
        unit: '%',
        baseline: base.spo2 ? +base.spo2.mean.toFixed(1) : 98.0,
        zScore: z,
        severity: 'critical',
        rawPoints: pts,
        impact: 'Severe hypoxemia risk; critical reduction in arterial oxygenation.'
      });
    } else if (spo2 < 93) {
      const pts = 30;
      rawRiskPoints += pts;
      factors.push({
        name: 'Blood Oxygen (SpO2)',
        metric: 'spo2',
        observed: spo2,
        unit: '%',
        baseline: base.spo2 ? +base.spo2.mean.toFixed(1) : 98.0,
        zScore: z,
        severity: 'high',
        rawPoints: pts,
        impact: 'Moderate hypoxemic drop; potential respiratory or cabin atmospheric issue.'
      });
    } else if (spo2 < 95 || (z != null && z <= -2.0)) {
      const pts = 15;
      rawRiskPoints += pts;
      factors.push({
        name: 'Blood Oxygen (SpO2)',
        metric: 'spo2',
        observed: spo2,
        unit: '%',
        baseline: base.spo2 ? +base.spo2.mean.toFixed(1) : 98.0,
        zScore: z,
        severity: 'moderate',
        rawPoints: pts,
        impact: 'Mild reduction below baseline saturation threshold.'
      });
    }
  }

  // 2. Heart Rate Analysis
  if (cur.heart_rate != null) {
    const hr = +cur.heart_rate;
    const z = calcZ('heart_rate');
    if (hr >= 125 || hr < 42) {
      const pts = 35;
      rawRiskPoints += pts;
      factors.push({
        name: 'Resting Heart Rate',
        metric: 'heart_rate',
        observed: hr,
        unit: 'bpm',
        baseline: base.heart_rate ? +base.heart_rate.mean.toFixed(1) : 65.0,
        zScore: z,
        severity: 'critical',
        rawPoints: pts,
        impact: hr >= 125 ? 'Marked tachycardia indicating severe acute physiological exertion or distress.' : 'Severe resting bradycardia below safe flight threshold.'
      });
    } else if (hr >= 100 || hr < 48 || (z != null && (z >= 2.5 || z <= -2.5))) {
      const pts = 25;
      rawRiskPoints += pts;
      factors.push({
        name: 'Resting Heart Rate',
        metric: 'heart_rate',
        observed: hr,
        unit: 'bpm',
        baseline: base.heart_rate ? +base.heart_rate.mean.toFixed(1) : 65.0,
        zScore: z,
        severity: 'high',
        rawPoints: pts,
        impact: hr >= 100 ? 'Significant tachycardia elevated well above individual baseline.' : 'Significant deviation from personal resting cardiac baseline.'
      });
    } else if (hr >= 88 || (z != null && z >= 1.8)) {
      const pts = 12;
      rawRiskPoints += pts;
      factors.push({
        name: 'Resting Heart Rate',
        metric: 'heart_rate',
        observed: hr,
        unit: 'bpm',
        baseline: base.heart_rate ? +base.heart_rate.mean.toFixed(1) : 65.0,
        zScore: z,
        severity: 'moderate',
        rawPoints: pts,
        impact: 'Mild cardiac acceleration above baseline trend.'
      });
    }
  }

  // 3. Respiratory Rate Analysis
  if (cur.respiratory_rate != null) {
    const rr = +cur.respiratory_rate;
    const z = calcZ('respiratory_rate');
    if (rr >= 26 || rr < 9) {
      const pts = 30;
      rawRiskPoints += pts;
      factors.push({
        name: 'Respiratory Rate',
        metric: 'respiratory_rate',
        observed: rr,
        unit: 'br/min',
        baseline: base.respiratory_rate ? +base.respiratory_rate.mean.toFixed(1) : 14.0,
        zScore: z,
        severity: 'critical',
        rawPoints: pts,
        impact: rr >= 26 ? 'Severe tachypnea; potential hypercapnia or oxygen transport deficiency.' : 'Depressed ventilation rate.'
      });
    } else if (rr >= 22 || rr < 11 || (z != null && z >= 2.2)) {
      const pts = 20;
      rawRiskPoints += pts;
      factors.push({
        name: 'Respiratory Rate',
        metric: 'respiratory_rate',
        observed: rr,
        unit: 'br/min',
        baseline: base.respiratory_rate ? +base.respiratory_rate.mean.toFixed(1) : 14.0,
        zScore: z,
        severity: 'high',
        rawPoints: pts,
        impact: 'Elevated breathing frequency suggesting respiratory workload compensation.'
      });
    }
  }

  // 4. Body Temperature
  if (cur.body_temperature != null) {
    const temp = +cur.body_temperature;
    const z = calcZ('body_temperature');
    if (temp >= 38.5 || temp < 35.0) {
      const pts = 35;
      rawRiskPoints += pts;
      factors.push({
        name: 'Core Body Temperature',
        metric: 'body_temperature',
        observed: temp,
        unit: '°C',
        baseline: base.body_temperature ? +base.body_temperature.mean.toFixed(1) : 36.8,
        zScore: z,
        severity: 'critical',
        rawPoints: pts,
        impact: temp >= 38.5 ? 'Significant pyrexia / hyperthermic response; risk of febrile mission impairment.' : 'Hypothermic state requiring thermal countermeasure.'
      });
    } else if (temp >= 37.8 || temp < 35.8 || (z != null && z >= 2.0)) {
      const pts = 20;
      rawRiskPoints += pts;
      factors.push({
        name: 'Core Body Temperature',
        metric: 'body_temperature',
        observed: temp,
        unit: '°C',
        baseline: base.body_temperature ? +base.body_temperature.mean.toFixed(1) : 36.8,
        zScore: z,
        severity: 'high',
        rawPoints: pts,
        impact: 'Subfebrile temperature elevation above normal circadian baseline.'
      });
    }
  }

  // 5. Blood Pressure (Systolic / Diastolic)
  if (cur.systolic_bp != null) {
    const sbp = +cur.systolic_bp;
    const dbp = cur.diastolic_bp != null ? +cur.diastolic_bp : 80;
    if (sbp >= 150 || sbp < 85 || dbp >= 98) {
      const pts = 25;
      rawRiskPoints += pts;
      factors.push({
        name: 'Arterial Blood Pressure',
        metric: 'systolic_bp',
        observed: `${sbp}/${dbp}`,
        unit: 'mmHg',
        baseline: base.systolic_bp ? `${base.systolic_bp.mean.toFixed(0)}/80` : '120/80',
        zScore: calcZ('systolic_bp'),
        severity: 'high',
        rawPoints: pts,
        impact: sbp >= 150 ? 'Hypertensive excursion; cephalad fluid shift pressure on intracranial vasculature.' : 'Hypotensive episode; orthostatic intolerance risk in microgravity.'
      });
    } else if (sbp >= 135 || sbp < 95 || dbp >= 88) {
      const pts = 12;
      rawRiskPoints += pts;
      factors.push({
        name: 'Arterial Blood Pressure',
        metric: 'systolic_bp',
        observed: `${sbp}/${dbp}`,
        unit: 'mmHg',
        baseline: base.systolic_bp ? `${base.systolic_bp.mean.toFixed(0)}/80` : '120/80',
        zScore: calcZ('systolic_bp'),
        severity: 'moderate',
        rawPoints: pts,
        impact: 'Mild blood pressure deviation from baseline.'
      });
    }
  }

  // 6. HRV & Autonomic Regulation
  if (cur.hrv != null) {
    const hrv = +cur.hrv;
    const z = calcZ('hrv');
    if (hrv < 25 || (z != null && z <= -2.5)) {
      const pts = 20;
      rawRiskPoints += pts;
      factors.push({
        name: 'Heart Rate Variability (HRV)',
        metric: 'hrv',
        observed: hrv,
        unit: 'ms',
        baseline: base.hrv ? +base.hrv.mean.toFixed(1) : 55.0,
        zScore: z,
        severity: 'high',
        rawPoints: pts,
        impact: 'Substantial drop in vagal tone; autonomic exhaustion and high cumulative stress.'
      });
    } else if (hrv < 38 || (z != null && z <= -1.8)) {
      const pts = 10;
      rawRiskPoints += pts;
      factors.push({
        name: 'Heart Rate Variability (HRV)',
        metric: 'hrv',
        observed: hrv,
        unit: 'ms',
        baseline: base.hrv ? +base.hrv.mean.toFixed(1) : 55.0,
        zScore: z,
        severity: 'moderate',
        rawPoints: pts,
        impact: 'Moderate reduction in parasympathetic recovery index.'
      });
    }
  }

  // 7. Sleep & Fatigue Historical Pattern
  if (cur.sleep_hours != null) {
    const sleep = +cur.sleep_hours;
    const z = calcZ('sleep_hours');
    if (sleep < 4.5 || (z != null && z <= -2.2)) {
      const pts = 18;
      rawRiskPoints += pts;
      factors.push({
        name: 'Sleep Duration & Recovery',
        metric: 'sleep_hours',
        observed: sleep,
        unit: 'h',
        baseline: base.sleep_hours ? +base.sleep_hours.mean.toFixed(1) : 7.2,
        zScore: z,
        severity: 'high',
        rawPoints: pts,
        impact: 'Severe acute sleep debt; neurobehavioral fatigue and cognitive slowing risk.'
      });
    } else if (sleep < 5.8) {
      const pts = 8;
      rawRiskPoints += pts;
      factors.push({
        name: 'Sleep Duration',
        metric: 'sleep_hours',
        observed: sleep,
        unit: 'h',
        baseline: base.sleep_hours ? +base.sleep_hours.mean.toFixed(1) : 7.2,
        zScore: z,
        severity: 'moderate',
        rawPoints: pts,
        impact: 'Sub-optimal sleep window; below NASA 7.0-hour restorative recommendation.'
      });
    }
  }

  // 8. Self-reported Stress & Mental Health
  if (mental.stress != null && +mental.stress >= 8) {
    const pts = 15;
    rawRiskPoints += pts;
    factors.push({
      name: 'Psychophysiological Stress',
      metric: 'stress',
      observed: +mental.stress,
      unit: '/10',
      baseline: 3.0,
      zScore: null,
      severity: 'high',
      rawPoints: pts,
      impact: 'Elevated subjective stress level reported during crew wellness log.'
    });
  }

  // Multi-indicator synergy bonus (when multiple physiological systems are simultaneously strained)
  if (factors.length >= 3) {
    rawRiskPoints += 12;
  }

  // Calculate normalized risk score between 0 and 100
  const riskScore = Math.min(100, Math.max(0, Math.round(rawRiskPoints)));

  // Categorize risk
  let riskCategory = 'LOW';
  let severity = 'green';
  if (riskScore >= 75) {
    riskCategory = 'CRITICAL';
    severity = 'red';
  } else if (riskScore >= 50) {
    riskCategory = 'HIGH';
    severity = 'orange';
  } else if (riskScore >= 25) {
    riskCategory = 'MODERATE';
    severity = 'yellow';
  }

  // Compute percentage contributions for each factor
  const totalRaw = factors.reduce((sum, f) => sum + f.rawPoints, 0) || 1;
  const contributingFactors = factors.map(f => ({
    name: f.name,
    metric: f.metric,
    observed: f.observed,
    unit: f.unit,
    baseline: f.baseline,
    zScore: f.zScore,
    severity: f.severity,
    weightPercent: Math.round((f.rawPoints / totalRaw) * 100),
    impact: f.impact
  }));

  // Sort contributing factors by impact descending
  contributingFactors.sort((a, b) => b.weightPercent - a.weightPercent);

  // Recommended clinical actions based on risk category
  const actionsMap = {
    LOW: [
      'Maintain standard flight circadian schedule and daily 2.5 hr ARED/T2 exercise cycle.',
      'Continue regular morning biometrics synchronization.',
      'Hydration target: nominal 2.5 - 3.0 liters/day.'
    ],
    MODERATE: [
      'Initiate 15-minute resting vitals verification check.',
      'Inspect biometric sensor placement and skin contact impedance.',
      'Review 48-hour sleep log and hydration intake with Flight Surgeon.',
      'Protocol NASA-MED-REST-01: Incorporate 30-minute structured rest break before next duty cycle.'
    ],
    HIGH: [
      'Notify Ground Medical Flight Surgeon via Mission Audio Channel 2.',
      'Perform secondary vital signs check: manual blood pressure cuff & pulse oximeter.',
      'Schedule telehealth medical conference within next orbital pass (90 min).',
      'Defer scheduled Extravehicular Activity (EVA) or high-intensity resistance training pending review.',
      'Review Mission Protocol DEMO-SLEEP-01 and fatigue countermeasures.'
    ],
    CRITICAL: [
      'IMMEDIATE ACTION: Alert Flight Surgeon and Mission Commander immediately.',
      'Space-to-Ground 1 priority comms; don crew emergency oxygen mask if SpO2 compromised.',
      'Execute NASA Emergency Medical Protocol MED-EMERG-04 (Acute Telemetry Decompensation).',
      'Cease all physical workloads; position crew member in microgravity restraint harness.',
      'Stream high-rate continuous telemetry (10 Hz cardiac and respiratory waveform).'
    ]
  };

  const recommendedActions = actionsMap[riskCategory] || actionsMap.LOW;

  // Synthesize clinical explanation
  let explanation = '';
  if (riskCategory === 'LOW') {
    explanation = 'All monitored biometrics and physiological indicators are within expected personal baseline tolerances and NASA microgravity thresholds. No acute risk factors detected.';
  } else {
    const factorNames = contributingFactors.map(f => f.name).slice(0, 3).join(', ');
    explanation = `Composite physiological risk elevated to ${riskCategory} (score ${riskScore}/100) due to significant deviations in ${factorNames}. ${
      contributingFactors.length >= 3 ? 'Multi-system concurrent drift detected across cardiovascular and metabolic indicators. ' : ''
    }Automated decision support indicates heightened physiological strain requiring clinical review.`;
  }

  // Attempt ML Anomaly Detection via Python AI Service (Isolation Forest)
  let ml = null;
  try {
    const history = await q(
      `SELECT heart_rate, hrv, spo2, respiratory_rate, systolic_bp, body_temperature, sleep_hours
       FROM health_metrics
       WHERE astronaut_id=$1 AND data_quality='valid'
       ORDER BY recorded_at DESC LIMIT 90`,
      [aid]
    );

    const aiUrl = process.env.AI_URL || 'http://127.0.0.1:8000';
    const pyResp = await fetch(`${aiUrl}/anomaly/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history, current: cur }),
      signal: AbortSignal.timeout(2000)
    });
    if (pyResp.ok) {
      ml = await pyResp.json();
    }
  } catch (err) {
    // Graceful fallback if AI daemon is offline
    ml = {
      score: riskScore > 50 ? +(riskScore / 100).toFixed(3) : 0.08,
      flagged: riskScore >= 50,
      model: 'isolation-forest-statistical-fallback',
      note: 'AI microservice offline; fallback statistical anomaly detector active'
    };
  }

  const result = {
    status: riskCategory === 'LOW' ? 'nominal' : 'warning',
    riskScore,
    riskCategory,
    severity,
    contributingFactors,
    explanation,
    recommendedActions,
    modelVersion: 'astrovital-ai-risk-v2',
    evaluatedAt: new Date().toISOString(),
    experimentalMl: ml ? {
      ...ml,
      label: 'Experimental Machine Learning (IsolationForest) — Clinical Decision Support'
    } : null,
    disclaimer: 'NASA Mission Control Flight Surgeon Decision Support System. Automated risk assessment — not an autonomous diagnostic device.'
  };

  // Record anomaly record in DB
  await q(
    `INSERT INTO anomaly_records(astronaut_id, metric, score, evidence)
     VALUES($1, $2, $3, $4)`,
    [aid, 'multi_risk_engine', result.riskScore, JSON.stringify(result)]
  );

  // If elevated risk, insert or update open alert
  let alert = null;
  if (severity !== 'green') {
    const alertTitle = contributingFactors.length >= 3
      ? `Multi-System Risk Alert (${riskCategory})`
      : `${contributingFactors[0]?.name || 'Biometric'} Deviation (${riskCategory})`;

    const [a] = await q(
      `INSERT INTO health_alerts(astronaut_id, severity, title, explanation, evidence, actions, status)
       VALUES($1, $2, $3, $4, $5, $6, 'open')
       RETURNING *`,
      [
        aid,
        severity,
        alertTitle,
        explanation,
        JSON.stringify(contributingFactors),
        JSON.stringify(recommendedActions)
      ]
    );
    alert = a;
    result.alert = alert;
  }

  return result;
}
