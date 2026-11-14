CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'astronaut' CHECK(role IN('astronaut','medical')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT DEFAULT 'AV-EXP-01',
  status TEXT DEFAULT 'active' CHECK(status IN ('active','planned','completed','standby')),
  target_orbit TEXT DEFAULT 'LEO / 420km ISS',
  inclination TEXT DEFAULT '51.6°',
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  protocol_config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS astronauts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  mission_id UUID REFERENCES missions(id),
  display_name TEXT NOT NULL,
  callsign TEXT,
  role_title TEXT DEFAULT 'Mission Specialist',
  blood_type TEXT DEFAULT 'O+',
  flight_hours INT DEFAULT 0,
  status TEXT DEFAULT 'nominal' CHECK(status IN ('nominal','watch','warning','critical','rest','eva')),
  assigned_seat TEXT,
  avatar_color TEXT DEFAULT '#00F0FF',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  astronaut_id UUID NOT NULL REFERENCES astronauts(id),
  heart_rate NUMERIC(6,2) CHECK(heart_rate BETWEEN 20 AND 250),
  hrv NUMERIC(7,2) CHECK(hrv BETWEEN 0 AND 300),
  spo2 NUMERIC(5,2) CHECK(spo2 BETWEEN 50 AND 100),
  respiratory_rate NUMERIC(5,2) CHECK(respiratory_rate BETWEEN 5 AND 60),
  systolic_bp INT CHECK(systolic_bp BETWEEN 50 AND 260),
  diastolic_bp INT CHECK(diastolic_bp BETWEEN 30 AND 160),
  body_temperature NUMERIC(5,2) CHECK(body_temperature BETWEEN 30 AND 43),
  sleep_hours NUMERIC(4,2) CHECK(sleep_hours BETWEEN 0 AND 24),
  activity_level NUMERIC(7,2),
  recorded_at TIMESTAMPTZ NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source VARCHAR(30) NOT NULL DEFAULT 'manual',
  data_quality VARCHAR(20) NOT NULL DEFAULT 'valid'
);
CREATE INDEX IF NOT EXISTS idx_health_metrics_astronaut_time ON health_metrics(astronaut_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS mental_health_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  astronaut_id UUID NOT NULL REFERENCES astronauts(id),
  mood INT CHECK(mood BETWEEN 1 AND 10),
  stress INT CHECK(stress BETWEEN 1 AND 10),
  fatigue INT CHECK(fatigue BETWEEN 1 AND 10),
  sleep_quality INT CHECK(sleep_quality BETWEEN 1 AND 10),
  isolation INT CHECK(isolation BETWEEN 1 AND 10),
  concentration INT CHECK(concentration BETWEEN 1 AND 10),
  notes TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mental_health_time ON mental_health_records(astronaut_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS exercise_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  astronaut_id UUID NOT NULL REFERENCES astronauts(id),
  exercise_type TEXT NOT NULL,
  duration_min INT CHECK(duration_min BETWEEN 0 AND 600),
  completed BOOLEAN DEFAULT true,
  discomfort INT CHECK(discomfort BETWEEN 0 AND 10),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_exercise_time ON exercise_records(astronaut_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS bone_health_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  astronaut_id UUID NOT NULL REFERENCES astronauts(id),
  assessment_type TEXT NOT NULL,
  value NUMERIC,
  unit TEXT,
  source TEXT,
  assessed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS environmental_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  astronaut_id UUID REFERENCES astronauts(id),
  radiation_usv_h NUMERIC,
  cumulative_dose_msv NUMERIC,
  cabin_temp_c NUMERIC,
  humidity_pct NUMERIC,
  co2_ppm NUMERIC,
  cabin_pressure_kpa NUMERIC DEFAULT 101.3,
  oxygen_pct NUMERIC DEFAULT 20.9,
  instrument TEXT DEFAULT 'simulated',
  source TEXT DEFAULT 'simulated',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_environmental_time ON environmental_readings(recorded_at DESC);

CREATE TABLE IF NOT EXISTS health_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  astronaut_id UUID NOT NULL REFERENCES astronauts(id),
  metric_name TEXT NOT NULL,
  mean NUMERIC,
  std_dev NUMERIC,
  sample_count INT,
  version INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS anomaly_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  astronaut_id UUID NOT NULL REFERENCES astronauts(id),
  metric TEXT,
  score NUMERIC,
  evidence JSONB,
  detected_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS health_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  astronaut_id UUID NOT NULL REFERENCES astronauts(id),
  severity TEXT NOT NULL CHECK(severity IN ('green','yellow','orange','red')),
  title TEXT,
  explanation TEXT,
  evidence JSONB,
  actions JSONB,
  status TEXT DEFAULT 'open' CHECK(status IN ('open','acknowledged','resolved')),
  clinician_notes TEXT,
  acknowledged_by TEXT,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_alerts_astronaut ON health_alerts(astronaut_id, created_at DESC);

CREATE TABLE IF NOT EXISTS mission_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_code TEXT UNIQUE,
  title TEXT,
  category TEXT DEFAULT 'general',
  version INT DEFAULT 1,
  approved_content TEXT,
  active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  astronaut_id UUID NOT NULL REFERENCES astronauts(id),
  idempotency_key TEXT NOT NULL,
  status TEXT,
  synced_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(astronaut_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS assistant_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  astronaut_id UUID NOT NULL REFERENCES astronauts(id),
  user_id UUID REFERENCES users(id),
  role TEXT NOT NULL CHECK(role IN ('user','assistant','system')),
  content TEXT NOT NULL,
  sources JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_assistant_astronaut ON assistant_messages(astronaut_id, created_at ASC);

CREATE TABLE IF NOT EXISTS mission_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID REFERENCES missions(id),
  astronaut_id UUID REFERENCES astronauts(id),
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT DEFAULT 'info',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mission_events_time ON mission_events(created_at DESC);
