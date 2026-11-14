import './db.js';
import { q, pool } from './db.js';

async function migrate() {
  console.log('Running database schema migrations...');

  // Extensions
  await q(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

  // Missions table columns
  await q(`ALTER TABLE missions ADD COLUMN IF NOT EXISTS code TEXT DEFAULT 'AV-EXP-01';`);
  await q(`ALTER TABLE missions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';`);
  await q(`ALTER TABLE missions ADD COLUMN IF NOT EXISTS target_orbit TEXT DEFAULT 'LEO / 420km ISS';`);
  await q(`ALTER TABLE missions ADD COLUMN IF NOT EXISTS inclination TEXT DEFAULT '51.6°';`);

  // Astronauts table columns
  await q(`ALTER TABLE astronauts ADD COLUMN IF NOT EXISTS callsign TEXT;`);
  await q(`ALTER TABLE astronauts ADD COLUMN IF NOT EXISTS role_title TEXT DEFAULT 'Mission Specialist';`);
  await q(`ALTER TABLE astronauts ADD COLUMN IF NOT EXISTS blood_type TEXT DEFAULT 'O+';`);
  await q(`ALTER TABLE astronauts ADD COLUMN IF NOT EXISTS flight_hours INT DEFAULT 0;`);
  await q(`ALTER TABLE astronauts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'nominal';`);
  await q(`ALTER TABLE astronauts ADD COLUMN IF NOT EXISTS assigned_seat TEXT;`);
  await q(`ALTER TABLE astronauts ADD COLUMN IF NOT EXISTS avatar_color TEXT DEFAULT '#00F0FF';`);

  // Health metrics columns
  await q(`ALTER TABLE health_metrics ADD COLUMN IF NOT EXISTS respiratory_rate NUMERIC(5,2);`);

  // Environmental readings columns
  await q(`ALTER TABLE environmental_readings ADD COLUMN IF NOT EXISTS cabin_pressure_kpa NUMERIC DEFAULT 101.3;`);
  await q(`ALTER TABLE environmental_readings ADD COLUMN IF NOT EXISTS oxygen_pct NUMERIC DEFAULT 20.9;`);

  // Health alerts columns
  await q(`ALTER TABLE health_alerts ADD COLUMN IF NOT EXISTS clinician_notes TEXT;`);
  await q(`ALTER TABLE health_alerts ADD COLUMN IF NOT EXISTS acknowledged_by TEXT;`);

  // Mission protocols columns
  await q(`ALTER TABLE mission_protocols ADD COLUMN IF NOT EXISTS title TEXT;`);
  await q(`ALTER TABLE mission_protocols ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';`);
  await q(`ALTER TABLE mission_protocols ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();`);

  // Assistant messages table
  await q(`CREATE TABLE IF NOT EXISTS assistant_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    astronaut_id UUID NOT NULL REFERENCES astronauts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    role TEXT NOT NULL CHECK(role IN ('user','assistant','system')),
    content TEXT NOT NULL,
    sources JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now()
  );`);
  await q(`CREATE INDEX IF NOT EXISTS idx_assistant_astronaut ON assistant_messages(astronaut_id, created_at ASC);`);

  // Mission events table
  await q(`CREATE TABLE IF NOT EXISTS mission_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_id UUID REFERENCES missions(id) ON DELETE CASCADE,
    astronaut_id UUID REFERENCES astronauts(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    severity TEXT DEFAULT 'info',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
  );`);
  await q(`CREATE INDEX IF NOT EXISTS idx_mission_events_time ON mission_events(created_at DESC);`);

  console.log('Database migrations completed successfully.');
  await pool.end();
}

migrate().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
