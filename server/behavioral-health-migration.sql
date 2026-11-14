CREATE TABLE IF NOT EXISTS behavioral_health_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    astronaut_id UUID NOT NULL REFERENCES astronauts(id),
    mood TEXT NOT NULL CHECK (
        mood IN ('Very Good', 'Good', 'Neutral', 'Low', 'Very Low')
    ),
    stress_level INT CHECK (stress_level BETWEEN 1 AND 10),
    journal_entry TEXT,
    sentiment TEXT CHECK (
        sentiment IN ('positive', 'neutral', 'negative')
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_behavioral_checkins_astronaut_time
ON behavioral_health_checkins(astronaut_id, created_at DESC);
