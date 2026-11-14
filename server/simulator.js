import { q } from './db.js';
import { analyze } from './analysis.js';

let ioInstance = null;
let intervalId = null;
let isRunning = true;
let tickCount = 0;

// Anomaly scenario state
let activeScenario = null;
let scenarioTargetId = null;
let scenarioTicksRemaining = 0;

// Random normal-ish generator
const randn = () => (Math.random() + Math.random() + Math.random() - 1.5) * 1.2;

export function initSimulator(io) {
  ioInstance = io;
  startSimulation();
}

export function startSimulation() {
  if (intervalId) clearInterval(intervalId);
  isRunning = true;
  intervalId = setInterval(simulationTick, 2500);
  console.log('[Simulator] NASA Telemetry Stream started (2.5s cadence)');
}

export function stopSimulation() {
  if (intervalId) clearInterval(intervalId);
  intervalId = null;
  isRunning = false;
  console.log('[Simulator] Telemetry Stream paused');
}

export function getSimulatorStatus() {
  return {
    isRunning,
    activeScenario,
    scenarioTargetId,
    scenarioTicksRemaining,
    cadenceMs: 2500,
    isSimulated: true,
    engine: 'AstroVital Synthetic Biometric & Atmospheric Generator v2'
  };
}

export function triggerScenario(type, astronautId) {
  activeScenario = type;
  scenarioTargetId = astronautId || null;
  scenarioTicksRemaining = 24; // ~60 seconds of anomaly
  console.log(`[Simulator] Injected anomaly scenario: "${type}" on astronaut ${astronautId || 'primary'}`);
  return {
    success: true,
    scenario: activeScenario,
    target: scenarioTargetId,
    durationSeconds: 60
  };
}

export function clearScenario() {
  activeScenario = null;
  scenarioTargetId = null;
  scenarioTicksRemaining = 0;
  return { success: true, message: 'Anomaly scenario cleared; telemetry returning to baseline' };
}

async function simulationTick() {
  if (!isRunning || !ioInstance) return;
  tickCount++;

  try {
    const astronauts = await q('SELECT id, display_name, callsign, role_title, status FROM astronauts ORDER BY created_at ASC');
    if (!astronauts.length) return;

    const now = new Date();
    const envAnomaly = activeScenario === 'cabin_co2_spike' || activeScenario === 'solar_flare';

    // 1. Environmental Telemetry Tick
    const baseCo2 = activeScenario === 'cabin_co2_spike' ? 5200 + randn() * 200 : 2650 + randn() * 120;
    const baseRad = activeScenario === 'solar_flare' ? 145 + randn() * 15 : 24.5 + randn() * 2.5;
    const envData = {
      cabin_temp_c: +(22.2 + randn() * 0.25).toFixed(1),
      humidity_pct: +(44.5 + randn() * 1.5).toFixed(1),
      co2_ppm: Math.round(Math.max(1800, baseCo2)),
      cabin_pressure_kpa: +(101.3 + randn() * 0.08).toFixed(2),
      oxygen_pct: +(20.9 + randn() * 0.05).toFixed(2),
      radiation_usv_h: +(Math.max(5, baseRad)).toFixed(1),
      cumulative_dose_msv: +(18.4 + (tickCount * 0.0001)).toFixed(3),
      recorded_at: now.toISOString(),
      instrument: 'SIM-ATMO-RAD-PRIMARY',
      source: 'simulated',
      isSimulated: true
    };

    ioInstance.emit('environment_tick', envData);

    // Persist environmental reading every 12 ticks (~30s) or during anomaly
    if (tickCount % 12 === 0 || envAnomaly) {
      await q(
        `INSERT INTO environmental_readings(
          radiation_usv_h, cumulative_dose_msv, cabin_temp_c, humidity_pct,
          co2_ppm, cabin_pressure_kpa, oxygen_pct, instrument, source, recorded_at
        ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          envData.radiation_usv_h,
          envData.cumulative_dose_msv,
          envData.cabin_temp_c,
          envData.humidity_pct,
          envData.co2_ppm,
          envData.cabin_pressure_kpa,
          envData.oxygen_pct,
          envData.instrument,
          envData.source,
          now
        ]
      ).catch(() => {});
    }

    // 2. Individual Biometrics for each astronaut
    for (const a of astronauts) {
      const isTarget = (!scenarioTargetId && a === astronauts[0]) || (scenarioTargetId === a.id);
      const isAnomalous = activeScenario && isTarget && scenarioTicksRemaining > 0;

      let hr = 66 + randn() * 2.5;
      let hrv = 54 + randn() * 4.0;
      let spo2 = 98.2 + randn() * 0.4;
      let rr = 14.2 + randn() * 0.8;
      let sbp = 118 + randn() * 3.0;
      let dbp = 76 + randn() * 2.5;
      let temp = 36.8 + randn() * 0.12;
      let sleep = 7.1;

      if (isAnomalous) {
        if (activeScenario === 'hypoxia') {
          spo2 = 89.5 + randn() * 0.6;
          rr = 25.0 + randn() * 1.5;
          hr = 112 + randn() * 4.0;
          hrv = 28 + randn() * 3.0;
        } else if (activeScenario === 'cardiac_stress') {
          hr = 138 + randn() * 5.0;
          hrv = 18 + randn() * 2.5;
          sbp = 156 + randn() * 4.0;
          dbp = 96 + randn() * 3.0;
          rr = 22 + randn() * 1.2;
        } else if (activeScenario === 'hyperthermia') {
          temp = 38.8 + randn() * 0.2;
          hr = 116 + randn() * 3.5;
          rr = 21 + randn() * 1.0;
          sbp = 132 + randn() * 3.0;
        } else if (activeScenario === 'orthostatic_intolerance') {
          sbp = 88 + randn() * 3.0;
          dbp = 58 + randn() * 2.0;
          hr = 108 + randn() * 4.0;
          hrv = 32 + randn() * 3.0;
        }
      }

      const payload = {
        astronautId: a.id,
        display_name: a.display_name,
        callsign: a.callsign,
        role_title: a.role_title,
        status: isAnomalous ? 'warning' : a.status || 'nominal',
        heart_rate: +Math.max(30, Math.min(220, hr)).toFixed(1),
        hrv: +Math.max(5, Math.min(150, hrv)).toFixed(1),
        spo2: +Math.max(70, Math.min(100, spo2)).toFixed(1),
        respiratory_rate: +Math.max(6, Math.min(45, rr)).toFixed(1),
        systolic_bp: Math.round(sbp),
        diastolic_bp: Math.round(dbp),
        body_temperature: +temp.toFixed(2),
        sleep_hours: sleep,
        activity_level: Math.round(65 + randn() * 8),
        recorded_at: now.toISOString(),
        isSimulated: true,
        scenario: isAnomalous ? activeScenario : null
      };

      // Broadcast real-time telemetry pulse to all connected clients
      ioInstance.emit('telemetry_tick', payload);

      // Persist to database periodically:
      // Every 12 ticks (~30s) per astronaut, OR immediately on anomaly
      const shouldPersist = (tickCount % 12 === 0) || (isAnomalous && tickCount % 3 === 0);
      if (shouldPersist) {
        await q(
          `INSERT INTO health_metrics(
            astronaut_id, heart_rate, hrv, spo2, respiratory_rate,
            systolic_bp, diastolic_bp, body_temperature, sleep_hours,
            activity_level, recorded_at, source, data_quality
          ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'simulated', 'valid')`,
          [
            a.id,
            payload.heart_rate,
            payload.hrv,
            payload.spo2,
            payload.respiratory_rate,
            payload.systolic_bp,
            payload.diastolic_bp,
            payload.body_temperature,
            payload.sleep_hours,
            payload.activity_level,
            now
          ]
        ).catch(() => {});

        // Run full AI risk analysis
        if (isAnomalous || tickCount % 24 === 0) {
          const analysis = await analyze(a.id, {
            heart_rate: payload.heart_rate,
            hrv: payload.hrv,
            spo2: payload.spo2,
            respiratory_rate: payload.respiratory_rate,
            systolic_bp: payload.systolic_bp,
            diastolic_bp: payload.diastolic_bp,
            body_temperature: payload.body_temperature,
            sleep_hours: payload.sleep_hours
          }).catch(err => {
            console.error('[Simulator] Analysis error:', err.message);
            return null;
          });

          if (analysis) {
            ioInstance.emit('risk_update', {
              astronautId: a.id,
              analysis
            });

            if (analysis.alert) {
              ioInstance.emit('alert', analysis.alert);
              // Log event to mission timeline
              await q(
                `INSERT INTO mission_events(
                  astronaut_id, event_type, title, description, severity, metadata
                ) VALUES($1, 'medical_alert', $2, $3, $4, $5)`,
                [
                  a.id,
                  analysis.alert.title,
                  analysis.alert.explanation,
                  analysis.severity === 'red' ? 'critical' : 'warning',
                  JSON.stringify({ alertId: analysis.alert.id, riskScore: analysis.riskScore })
                ]
              ).catch(() => {});
            }
          }
        }
      }
    }

    if (activeScenario && scenarioTicksRemaining > 0) {
      scenarioTicksRemaining--;
      if (scenarioTicksRemaining <= 0) {
        console.log(`[Simulator] Anomaly scenario "${activeScenario}" completed. Returned to nominal telemetry.`);
        activeScenario = null;
        scenarioTargetId = null;
      }
    }
  } catch (err) {
    console.error('[Simulator] Tick error:', err.message);
  }
}
