import bcrypt from 'bcryptjs';
import './db.js';
import { q, pool } from './db.js';
import { analyze, buildBaseline, M } from './analysis.js';

const g = () => (Math.random() + Math.random() + Math.random() - 1.5) * 1.2;

async function seed() {
  console.log('[Seed] Resetting and seeding AstroVital mission database...');

  await q(`
    TRUNCATE users, missions, astronauts, health_metrics, mental_health_records,
             exercise_records, bone_health_assessments, environmental_readings,
             health_baselines, anomaly_records, health_alerts, sync_logs,
             assistant_messages, mission_events, mission_protocols CASCADE
  `);

  const h = await bcrypt.hash('demo1234', 10);
  const DAY = 864e5;
  const now = Date.now();
  const missionStart = new Date(now - 29 * DAY);

  // 1. Create Mission
  const [mission] = await q(
    `INSERT INTO missions(name, code, status, target_orbit, inclination, start_at, protocol_config)
     VALUES($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      'Artemis Gateway Expedition 03',
      'AV-EXP-03',
      'active',
      'Lunar Distant Retrograde Orbit (DRO)',
      '51.6°',
      missionStart,
      JSON.stringify({ telemetryRateHz: 1, alertAutoEscalate: true })
    ]
  );
  const mid = mission.id;

  // 2. Create Users
  const [uSarah] = await q(
    `INSERT INTO users(email, password_hash, role) VALUES('astro@demo.space', $1, 'astronaut') RETURNING id`,
    [h]
  );
  const [uMedical] = await q(
    `INSERT INTO users(email, password_hash, role) VALUES('medical@demo.space', $1, 'medical') RETURNING id`,
    [h]
  );
  const [uMarcus] = await q(
    `INSERT INTO users(email, password_hash, role) VALUES('pilot@demo.space', $1, 'astronaut') RETURNING id`,
    [h]
  );
  const [uDavid] = await q(
    `INSERT INTO users(email, password_hash, role) VALUES('engineer@demo.space', $1, 'astronaut') RETURNING id`,
    [h]
  );

  // 3. Create Astronauts
  const crewData = [
    {
      userId: uSarah.id,
      displayName: 'Cmdr. Sarah Vance',
      callsign: 'VALKYRIE',
      roleTitle: 'Mission Commander',
      bloodType: 'A+',
      flightHours: 1420,
      assignedSeat: 'Flight Deck 01',
      avatarColor: '#00F0FF',
      status: 'nominal'
    },
    {
      userId: uMarcus.id,
      displayName: 'Lt. Col. Marcus Chen',
      callsign: 'ORION',
      roleTitle: 'Command Module Pilot',
      bloodType: 'O+',
      flightHours: 980,
      assignedSeat: 'Flight Deck 02',
      avatarColor: '#38D0F0',
      status: 'nominal'
    },
    {
      userId: null,
      displayName: 'Dr. Elena Rostova',
      callsign: 'PHOENIX',
      roleTitle: 'Payload Science Specialist',
      bloodType: 'B+',
      flightHours: 640,
      assignedSeat: 'Science Module 01',
      avatarColor: '#3DDC97',
      status: 'nominal'
    },
    {
      userId: uDavid.id,
      displayName: 'David Okafor',
      callsign: 'TITAN',
      roleTitle: 'Systems & EVA Engineer',
      bloodType: 'O-',
      flightHours: 850,
      assignedSeat: 'Engineering Bay 01',
      avatarColor: '#FF9A3C',
      status: 'nominal'
    }
  ];

  const crew = [];
  for (const c of crewData) {
    const [astro] = await q(
      `INSERT INTO astronauts(user_id, mission_id, display_name, callsign, role_title, blood_type, flight_hours, assigned_seat, avatar_color, status)
       VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [c.userId, mid, c.displayName, c.callsign, c.roleTitle, c.bloodType, c.flightHours, c.assignedSeat, c.avatarColor, c.status]
    );
    crew.push(astro);
  }

  const sarahId = crew[0].id;
  let day21Record = null;

  // 4. Seed 30 Days of History for Sarah Vance (with Day 21 Multi-indicator Story)
  for (let d = 0; d < 30; d++) {
    const t = new Date(now - (29 - d) * DAY);
    t.setUTCHours(8, 0, 0, 0);

    // Realistic trajectory:
    // Days 0-6: baseline stabilization
    // Days 7-13: moderate workload
    // Days 14-21: increasing sleep disruption and fatigue accumulation
    // Days 22-29: gradual recovery post-intervention
    const sleep = d < 7 ? 7.4 : d < 14 ? 7.2 - (d - 6) * 0.3 : d < 22 ? 4.8 + g() * 0.2 : 6.8 + (d - 22) * 0.1;
    const hr = d < 14 ? 64 : d < 22 ? 64 + Math.min(d - 13, 7) * 2.2 : 74 - (d - 21) * 1.2;
    const hrv = d < 14 ? 58 : d < 22 ? 58 - Math.min(d - 13, 7) * 3.5 : 38 + (d - 21) * 2.2;
    const stress = d < 7 ? 3 : d < 22 ? Math.min(3 + (d - 7) * 0.45, 8.5) : Math.max(3, 8 - (d - 21) * 0.6);
    const rr = d < 14 ? 13.8 : d < 22 ? 14 + (d - 13) * 0.6 : 15.5;

    const r = {
      heart_rate: +(hr + g() * 1.5).toFixed(1),
      hrv: +(hrv + g() * 3.0).toFixed(1),
      spo2: +(98.4 + g() * 0.4).toFixed(1),
      respiratory_rate: +(rr + g() * 0.5).toFixed(1),
      systolic_bp: Math.round(118 + (d >= 14 && d < 22 ? (d - 13) * 2 : 0) + g() * 4),
      diastolic_bp: 78,
      body_temperature: +(36.8 + g() * 0.12).toFixed(2),
      sleep_hours: +(Math.max(sleep + g() * 0.3, 3.2)).toFixed(1),
      activity_level: Math.round(68 - (d >= 7 && d < 22 ? d * 0.8 : 0) + g() * 5)
    };

    await q(
      `INSERT INTO health_metrics(
        astronaut_id, heart_rate, hrv, spo2, respiratory_rate, systolic_bp, diastolic_bp,
        body_temperature, sleep_hours, activity_level, recorded_at, source, data_quality
      ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'simulated', 'valid')`,
      [
        sarahId, r.heart_rate, r.hrv, Math.min(r.spo2, 100), r.respiratory_rate,
        r.systolic_bp, r.diastolic_bp, r.body_temperature, r.sleep_hours,
        r.activity_level, t
      ]
    );

    // Mental health checkin
    await q(
      `INSERT INTO mental_health_records(
        astronaut_id, mood, stress, fatigue, sleep_quality, isolation, concentration, notes, recorded_at
      ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        sarahId,
        Math.round(Math.max(2, 8.5 - (d >= 7 && d < 22 ? (d - 7) * 0.3 : 0))),
        Math.round(stress),
        Math.round(Math.min(9, 2 + (d >= 7 && d < 22 ? (d - 7) * 0.45 : 0))),
        Math.round(Math.max(2, sleep)),
        Math.round(2 + g() * 0.5),
        Math.round(Math.max(3, 8 - (d >= 14 && d < 22 ? (d - 13) * 0.5 : 0))),
        d === 20 ? 'Noticeable cumulative fatigue after continuous orbital rendezvous simulations.' : null,
        t
      ]
    );

    // Environmental readings
    await q(
      `INSERT INTO environmental_readings(
        astronaut_id, radiation_usv_h, cumulative_dose_msv, cabin_temp_c, humidity_pct,
        co2_ppm, cabin_pressure_kpa, oxygen_pct, recorded_at
      ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        sarahId,
        +(24.8 + g() * 2.5).toFixed(1),
        +((d + 1) * 0.62).toFixed(3),
        +(22.1 + g() * 0.3).toFixed(1),
        +(44.5 + g() * 2.0).toFixed(1),
        Math.round(2600 + (d === 18 ? 850 : 0) + g() * 120),
        101.3,
        20.9,
        t
      ]
    );

    // Exercise logs
    if (d % 2 === 0) {
      await q(
        `INSERT INTO exercise_records(astronaut_id, exercise_type, duration_min, completed, discomfort, recorded_at)
         VALUES($1, $2, $3, true, $4, $5)`,
        [
          sarahId,
          d % 4 ? 'ARED Advanced Resistive Exercise' : 'T2 Treadmill Vibration Isolation',
          d >= 14 && d < 22 ? 35 : 60,
          d >= 14 && d < 22 ? 5 : 1,
          t
        ]
      );
    }

    // Bone assessments
    if (d === 0 || d === 14 || d === 28) {
      await q(
        `INSERT INTO bone_health_assessments(astronaut_id, assessment_type, value, unit, source, assessed_at)
         VALUES($1, 'Calibrated Bone Mineral Density T-Score', $2, 'index', 'in-flight ultrasound DEXA proxy', $3)`,
        [sarahId, +(1.0 - (d * 0.002)).toFixed(3), t]
      );
    }

    // Build personal baseline after first 7 days
    if (d === 6) {
      await buildBaseline(sarahId);
    }

    if (d === 20) {
      day21Record = { cur: r, mental: { stress: Math.round(stress) } };
    }
  }
  
  // 5. Seed Different 30-day Health Profiles for Other Crew Members

  const profiles = [
    {
      heartRate: 68,
      hrv: 52,
      spo2: 98.2,
      respiratoryRate: 14,
      systolicBP: 118,
      diastolicBP: 76,
      temperature: 36.7,
      sleep: 7.5,
      activity: 75,
      stress: 3,
      mood: 8,
      fatigue: 2
    },
    {
      heartRate: 74,
      hrv: 48,
      spo2: 97.8,
      respiratoryRate: 15,
      systolicBP: 122,
      diastolicBP: 80,
      temperature: 36.9,
      sleep: 6.8,
      activity: 65,
      stress: 5,
      mood: 6,
      fatigue: 4
    },
    {
      heartRate: 82,
      hrv: 42,
      spo2: 97.2,
      respiratoryRate: 16,
      systolicBP: 126,
      diastolicBP: 82,
      temperature: 37.0,
      sleep: 6.2,
      activity: 58,
      stress: 6,
      mood: 5,
      fatigue: 5
    }
  ];

  for (let ci = 1; ci < crew.length; ci++) {
    const aid = crew[ci].id;
    const p = profiles[ci - 1];

    for (let d = 0; d < 30; d++) {
      const t = new Date(now - (29 - d) * DAY);
      t.setUTCHours(8, 0, 0, 0);

      const hr = +(p.heartRate + g() * 2).toFixed(1);
      const hrvValue = +(p.hrv + g() * 3).toFixed(1);
      const spo2Value = +(p.spo2 + g() * 0.3).toFixed(1);
      const rr = +(p.respiratoryRate + g() * 0.5).toFixed(1);
      const sbp = Math.round(p.systolicBP + g() * 3);
      const dbp = Math.round(p.diastolicBP + g() * 2);
      const temp = +(p.temperature + g() * 0.1).toFixed(2);
      const sleep = +(p.sleep + g() * 0.3).toFixed(1);
      const activity = Math.round(p.activity + g() * 4);

      // Health metrics
      await q(
        `INSERT INTO health_metrics(
          astronaut_id, heart_rate, hrv, spo2, respiratory_rate,
          systolic_bp, diastolic_bp, body_temperature, sleep_hours,
          activity_level, recorded_at, source, data_quality
        ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'simulated', 'valid')`,
        [
          aid,
          hr,
          hrvValue,
          Math.min(spo2Value, 100),
          rr,
          sbp,
          dbp,
          temp,
          sleep,
          activity,
          t
        ]
      );

      // Mental health records
      await q(
        `INSERT INTO mental_health_records(
          astronaut_id, mood, stress, fatigue, sleep_quality,
          isolation, concentration, notes, recorded_at
        ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          aid,
          Math.max(1, Math.min(10, p.mood + Math.round(g()))),
          Math.max(1, Math.min(10, p.stress + Math.round(g()))),
          Math.max(1, Math.min(10, p.fatigue + Math.round(g()))),
          Math.max(1, Math.min(10, Math.round(p.sleep))),
          2 + ci,
          8 - ci,
          null,
          t
        ]
      );

      // Exercise records every alternate day
      if (d % 2 === 0) {
        await q(
          `INSERT INTO exercise_records(
            astronaut_id, exercise_type, duration_min,
            completed, discomfort, recorded_at
          ) VALUES($1, $2, $3, true, $4, $5)`,
          [
            aid,
            ci === 1 ? 'ARED Resistance Training' :
            ci === 2 ? 'T2 Treadmill Training' :
            'Cycle Ergometer Training',
            30 + ci * 10 + Math.round(g() * 5),
            ci + 1,
            t
          ]
        );
      }
    }

    // Build personal baseline
    await buildBaseline(aid);
  }

    // Run day 21 analysis for Sarah Vance to populate the multi-indicator alert
  if (day21Record) {
    const a21 = await analyze(sarahId, day21Record.cur, day21Record.mental);
    console.log(`[Seed] Day 21 alert generated: severity=${a21.severity}, score=${a21.riskScore}`);
  }

  // 6. Seed Mission Protocols
  const protocols = [
    {
      code: 'NASA-MED-CARD-01',
      title: 'Acute Cardiovascular Tachycardia Management',
      category: 'cardiovascular',
      content: 'In-flight resting heart rate exceeding 2.5 SD personal baseline requires immediate cessation of physical activity, 15-minute recumbent rest, and Space-to-Ground audio check with Flight Surgeon. Conduct 12-lead equivalent ECG telemetry stream.'
    },
    {
      code: 'NASA-MED-RESP-02',
      title: 'Cabin Atmospheric Hypoxia & Hypercapnia Response',
      category: 'respiratory',
      content: 'If SpO2 drops below 92% or respiratory rate exceeds 22 br/min, verify cabin atmospheric O2/CO2 telemetry. If cabin CO2 > 3800 ppm, don Portable Breathing Apparatus (PBA) and inspect scrubbers in Node 2.'
    },
    {
      code: 'DEMO-SLEEP-01',
      title: 'Circadian Disruption & Fatigue Countermeasures',
      category: 'neurobehavioral',
      content: 'For sleep reductions below 5.5 hours over consecutive flight days, administer 0.3mg melatonin 30 minutes prior to crew rest period. Review blue-spectrum light schedule in crew quarters.'
    },
    {
      code: 'DEMO-ESC-01',
      title: 'Flight Surgeon Emergency Telehealth Escalation',
      category: 'emergency',
      content: 'For ORANGE or RED severity health alerts, establish private Space-to-Ground Medical Audio Channel. Emergency clinical protocols supersede software decision support. Do not delay emergency interventions.'
    },
    {
      code: 'NASA-RAD-SOLAR-03',
      title: 'Solar Particle Event (SPE) Radiation Shelter Protocol',
      category: 'environmental',
      content: 'If dosimeter radiation flux exceeds 100 µSv/h, crew shall immediately retreat to the water-shielded crew quarters in the aft module. All EVAs suspended until magnetometer readings stabilize.'
    },
    {
      code: 'NASA-GRAV-BONE-04',
      title: 'Microgravity Bone & Musculoskeletal Protection',
      category: 'musculoskeletal',
      content: 'Mandatory daily 2.5 hour countermeasure regime utilizing ARED (Advanced Resistive Exercise Device) and T2 Cycle Ergometer with target bone axial loading of 1.5 - 2.0x body weight equivalent.'
    }
  ];

  for (const p of protocols) {
    await q(
      `INSERT INTO mission_protocols(protocol_code, title, category, version, approved_content, active)
       VALUES($1, $2, $3, 1, $4, true)`,
      [p.code, p.title, p.category, p.content]
    );
  }

  // 7. Seed Mission Timeline Events
  const events = [
    {
      missionId: mid,
      astronautId: sarahId,
      eventType: 'eva',
      title: 'Extravehicular Activity (EVA-01) Complete',
      description: 'Cmdr. Vance and Eng. Okafor completed 6 hr 14 min spacewalk replacing external S-band antenna.',
      severity: 'success',
      createdAt: new Date(now - 22 * DAY)
    },
    {
      missionId: mid,
      astronautId: sarahId,
      eventType: 'medical_alert',
      title: 'Multi-Indicator Physiological Fatigue Detected',
      description: 'AI Risk Engine detected 2.8 SD heart rate elevation, depressed HRV (32 ms), and severe sleep debt.',
      severity: 'warning',
      createdAt: new Date(now - 9 * DAY)
    },
    {
      missionId: mid,
      astronautId: sarahId,
      eventType: 'protocol_review',
      title: 'Flight Surgeon Protocol DEMO-SLEEP-01 Enacted',
      description: 'Mission Medical adjusted sleep schedule and recommended 48-hour light duty.',
      severity: 'info',
      createdAt: new Date(now - 8 * DAY)
    },
    {
      missionId: mid,
      astronautId: crew[1].id,
      eventType: 'exercise',
      title: 'ARED High-Resistance Cycle Passed',
      description: 'Pilot Marcus Chen completed 60 min session with 100% force compliance.',
      severity: 'info',
      createdAt: new Date(now - 3 * DAY)
    },
    {
      missionId: mid,
      astronautId: null,
      eventType: 'solar_event',
      title: 'Coronal Mass Ejection Monitoring Active',
      description: 'NOAA Space Weather Prediction Center issued minor geomagnetic advisory; dosimeters within safe margin.',
      severity: 'info',
      createdAt: new Date(now - 1 * DAY)
    }
  ];

  for (const ev of events) {
    await q(
      `INSERT INTO mission_events(mission_id, astronaut_id, event_type, title, description, severity, created_at)
       VALUES($1, $2, $3, $4, $5, $6, $7)`,
      [ev.missionId, ev.astronautId, ev.eventType, ev.title, ev.description, ev.severity, ev.createdAt]
    );
  }

  // 8. Seed Sample AI Assistant Messages
  await q(
    `INSERT INTO assistant_messages(astronaut_id, user_id, role, content, sources, created_at)
     VALUES
     ($1, $2, 'user', 'What is my current resting heart rate trend?', '[]', $3),
     ($1, $2, 'assistant', 'Your resting heart rate is currently 68 bpm. Over the past 7 days, your average has decreased from 76 bpm down to 68 bpm, reflecting recovery following the sleep management protocol.', '["health_metrics"]', $4)`,
    [sarahId, uSarah.id, new Date(now - 2 * DAY), new Date(now - 2 * DAY + 5000)]
  );

  console.log('[Seed] Seeding completed successfully!');
  console.log('--- DEMO LOGINS ---');
  console.log('Astronaut (Commander Sarah Vance): astro@demo.space / demo1234');
  console.log('Flight Surgeon (Mission Control): medical@demo.space / demo1234');
  console.log('Pilot (Lt. Col. Marcus Chen):      pilot@demo.space / demo1234');
  console.log('Engineer (David Okafor):           engineer@demo.space / demo1234');
  console.log('-------------------');

  await pool.end();
}

seed().catch(err => {
  console.error('[Seed] Error during seeding:', err);
  process.exit(1);
});
