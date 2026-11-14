import 'dotenv/config';
import { q, pool } from './db.js';
import { analyze } from './analysis.js';

const BASE = 'http://localhost:4000';

async function runTests() {
  console.log('====================================================');
  console.log('   ASTROVITAL MISSION TELEMETRY PLATFORM TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, title) => {
    if (condition) {
      console.log(`[PASS] ${title}`);
      passed++;
    } else {
      console.error(`[FAIL] ${title}`);
      failed++;
    }
  };

  try {
    // 1. Database Connectivity Test
    const dbTest = await q('SELECT NOW() as current_time, COUNT(*)::int as astronaut_count FROM astronauts');
    assert(dbTest.length > 0 && dbTest[0].astronaut_count >= 4, `Database connected. Found ${dbTest[0]?.astronaut_count} astronauts in manifest.`);

    // 2. Auth Tests: Astronaut Login
    const astroLoginRes = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'astro@demo.space', password: 'demo1234' })
    });
    const astroAuth = await astroLoginRes.json();
    assert(astroLoginRes.ok && astroAuth.token && astroAuth.role === 'astronaut', 'Astronaut login (astro@demo.space / demo1234)');
    const astroToken = astroAuth.token;
    const astroId = astroAuth.astronaut?.id;

    // 3. Auth Tests: Medical / Flight Surgeon Login
    const medLoginRes = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'medical@demo.space', password: 'demo1234' })
    });
    const medAuth = await medLoginRes.json();
    assert(medLoginRes.ok && medAuth.token && medAuth.role === 'medical', 'Flight Surgeon login (medical@demo.space / demo1234)');
    const medToken = medAuth.token;

    // 4. Test /api/auth/me
    const meRes = await fetch(`${BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${astroToken}` }
    });
    const meData = await meRes.json();
    assert(meRes.ok && meData.astronaut?.display_name?.includes('Sarah Vance'), `Identity verified: ${meData.astronaut?.display_name}`);

    // 5. Test /api/crew & /api/crew/:id
    const crewRes = await fetch(`${BASE}/api/crew`, {
      headers: { Authorization: `Bearer ${medToken}` }
    });
    const crewData = await crewRes.json();
    assert(crewRes.ok && crewData.length >= 4, `Crew Manifest endpoint returned ${crewData.length} astronauts`);

    const dossierRes = await fetch(`${BASE}/api/crew/${astroId}`, {
      headers: { Authorization: `Bearer ${astroToken}` }
    });
    const dossierData = await dossierRes.json();
    assert(dossierRes.ok && dossierData.baselines && dossierData.recentHistory?.length > 0, 'Individual Astronaut Dossier with 30-day telemetry and baselines');

    // 6. Test AI Risk Engine & Anomaly Detection
    const riskAnalysisRes = await fetch(`${BASE}/api/analysis/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${astroToken}` },
      body: JSON.stringify({ astronautId: astroId })
    });
    const riskData = await riskAnalysisRes.json();
    assert(
      riskAnalysisRes.ok &&
      typeof riskData.riskScore === 'number' &&
      ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'].includes(riskData.riskCategory) &&
      Array.isArray(riskData.contributingFactors) &&
      Array.isArray(riskData.recommendedActions),
      `AI Risk Engine returned Score: ${riskData.riskScore}/100, Level: ${riskData.riskCategory}`
    );

    // 7. Test Medical Alerts & Acknowledgement
    const alertsRes = await fetch(`${BASE}/api/alerts?astronautId=${astroId}`, {
      headers: { Authorization: `Bearer ${astroToken}` }
    });
    const alertsData = await alertsRes.json();
    assert(alertsRes.ok && Array.isArray(alertsData) && alertsData.length > 0, `Alerts center returned ${alertsData.length} records`);

    const alertToAck = alertsData[0];
    if (alertToAck) {
      const ackRes = await fetch(`${BASE}/api/alerts/${alertToAck.id}/acknowledge`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${medToken}` },
        body: JSON.stringify({ notes: 'Automated test suite clinical verification' })
      });
      const ackData = await ackRes.json();
      assert(ackRes.ok && ackData.status === 'acknowledged', `Alert acknowledged by Flight Surgeon (ID: ${alertToAck.id.slice(0, 8)})`);
    }

    // 8. Test AI Medical Assistant (Flight Surgeon Copilot)
    const assistantRes = await fetch(`${BASE}/api/assistant/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${astroToken}` },
      body: JSON.stringify({ question: 'What is my current resting heart rate?', astronautId: astroId })
    });
    const assistantData = await assistantRes.json();
    assert(
      assistantRes.ok &&
      assistantData.answer?.includes('heart rate') &&
      assistantData.sources?.length > 0,
      `AI Medical Assistant answered telemetry query: "${assistantData.answer.slice(0, 60)}..."`
    );

    // 9. Test Station Environment Monitoring
    const envRes = await fetch(`${BASE}/api/environment/history?limit=5`, {
      headers: { Authorization: `Bearer ${astroToken}` }
    });
    const envData = await envRes.json();
    assert(envRes.ok && envData.length > 0 && typeof envData[0].radiation_usv_h === 'number', `Station Environmental Telemetry (Radiation: ${envData[0]?.radiation_usv_h} µSv/h, CO2: ${envData[0]?.co2_ppm} ppm)`);

    // 10. Test Mission Management & Timeline
    const timelineRes = await fetch(`${BASE}/api/timeline?limit=10`, {
      headers: { Authorization: `Bearer ${astroToken}` }
    });
    const timelineData = await timelineRes.json();
    assert(timelineRes.ok && timelineData.length > 0, `Mission Activity Timeline returned ${timelineData.length} events`);

    // 11. Test Report Export: CSV
    const csvRes = await fetch(`${BASE}/api/reports/export/csv?astronautId=${astroId}`, {
      headers: { Authorization: `Bearer ${astroToken}` }
    });
    const csvText = await csvRes.text();
    assert(
      csvRes.ok &&
      csvText.startsWith('Timestamp,Astronaut,Callsign') &&
      csvText.split('\n').length > 5,
      `CSV Telemetry Exporter generated valid file (${csvText.split('\n').length} rows)`
    );

    // 12. Test Simulator Anomaly Injection & Status
    const simInjectRes = await fetch(`${BASE}/api/simulator/inject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${medToken}` },
      body: JSON.stringify({ scenario: 'hypoxia', astronautId: astroId })
    });
    const simInjectData = await simInjectRes.json();
    assert(simInjectRes.ok && simInjectData.scenario === 'hypoxia', 'Telemetry Simulator Anomaly Scenario Injection ("hypoxia")');

    const simClearRes = await fetch(`${BASE}/api/simulator/clear`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${medToken}` }
    });
    const simClearData = await simClearRes.json();
    assert(simClearRes.ok && simClearData.success, 'Telemetry Simulator Anomaly Reset to Baseline');

  } catch (err) {
    console.error('[TEST ERROR]', err);
    failed++;
  } finally {
    await pool.end();
  }

  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
}

runTests();
