
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createServer } from 'node:http';
import { createBehavioralHealthRouter } from './behavioral-health.js';

const records = [];

const MOOD_SCORES = {
  'Very Good': 5,
  'Good': 4,
  'Neutral': 3,
  'Low': 2,
  'Very Low': 1
};

const q = async (sql, params = []) => {
  if (sql.includes('SELECT id FROM astronauts')) {
    return params[0] === 'astro-1' && params[1] === 'user-1'
      ? [{ id: 'astro-1' }]
      : [];
  }

  if (sql.includes('INSERT INTO behavioral_health_checkins')) {
    const record = {
      id: `record-${records.length + 1}`,
      mood: params[1],
      stress_level: params[2],
      journal_entry: params[3],
      sentiment: params[4],
      created_at: new Date().toISOString()
    };

    records.push(record);
    return [record];
  }

  if (sql.includes('FROM behavioral_health_checkins')) {

    // Weekly/monthly trend query.
    if (sql.includes('GROUP BY DATE')) {
      const grouped = {};

      for (const record of records) {
        const date = record.created_at.slice(0, 10);
        const score = MOOD_SCORES[record.mood];

        if (!grouped[date]) {
          grouped[date] = { count: 0, total: 0 };
        }

        grouped[date].count++;
        grouped[date].total += score;
      }

      return Object.entries(grouped).map(([date, values]) => ({
        date,
        checkin_count: values.count,
        average_mood_score: Number(
          (values.total / values.count).toFixed(2)
        )
      }));
    }

    // Statistics summary query.
    if (sql.includes('COUNT(*)')) {
      const scores = records.map(
        record => MOOD_SCORES[record.mood]
      );

      return [{
        total_checkins: records.length,
        average_mood_score: scores.length
          ? Number(
              (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)
            )
          : null
      }];
    }

    // History query.
    if (sql.includes('LIMIT $2')) {
      return records.slice(-params[1]).reverse();
    }

    // Repeated low-mood alert query.
    if (sql.includes('LIMIT 3')) {
      return records.slice(-3).reverse();
    }
  }

  throw new Error(`Unexpected SQL: ${sql}`);
};

// Default authenticated astronaut.
const auth = () => (req, res, next) => {
  req.user = {
    uid: 'user-1',
    aid: 'astro-1',
    role: 'astronaut'
  };
  next();
};

// Test server setup.
async function setup(authMiddleware = auth()) {
  const app = express();
  app.use(express.json());

  app.use(
    '/api/behavioral-health',
    createBehavioralHealthRouter({
      auth: () => authMiddleware,
      q
    })
  );

  const server = createServer(app);
  await new Promise(resolve => server.listen(0, resolve));

  const base = `http://127.0.0.1:${server.address().port}`;

  return {
    server,
    base,
    close: () => new Promise(resolve => server.close(resolve))
  };
}

// TEST 1: Valid check-in.
test('valid check-in is stored with sentiment', async () => {
  const api = await setup();

  try {
    const response = await fetch(
      `${api.base}/api/behavioral-health/checkins`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood: 'Good',
          stressLevel: 3,
          journalEntry: 'I feel happy, calm and motivated today.'
        })
      }
    );

    assert.equal(response.status, 201);

    const data = await response.json();

    assert.equal(data.checkin.mood, 'Good');
    assert.equal(data.sentimentAnalysis.sentiment, 'positive');
  } finally {
    await api.close();
  }
});

// TEST 2: Invalid mood.
test('invalid mood is rejected', async () => {
  const api = await setup();

  try {
    const response = await fetch(
      `${api.base}/api/behavioral-health/checkins`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood: 'Excellent' })
      }
    );

    assert.equal(response.status, 400);
  } finally {
    await api.close();
  }
});

// TEST 3: Invalid stress.
test('invalid stress level is rejected', async () => {
  const api = await setup();

  try {
    const response = await fetch(
      `${api.base}/api/behavioral-health/checkins`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood: 'Good',
          stressLevel: 15
        })
      }
    );

    assert.equal(response.status, 400);
  } finally {
    await api.close();
  }
});

// TEST 4: Oversized journal.
test('oversized journal is rejected', async () => {
  const api = await setup();

  try {
    const response = await fetch(
      `${api.base}/api/behavioral-health/checkins`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood: 'Neutral',
          journalEntry: 'x'.repeat(2001)
        })
      }
    );

    assert.equal(response.status, 400);
  } finally {
    await api.close();
  }
});

// TEST 5: History endpoint.
test('history returns records', async () => {
  const api = await setup();

  try {
    const response = await fetch(
      `${api.base}/api/behavioral-health/history`
    );

    assert.equal(response.status, 200);

    const data = await response.json();
    assert.ok(Array.isArray(data.records));
  } finally {
    await api.close();
  }
});

// TEST 6: Invalid statistics period.
test('invalid statistics period is rejected', async () => {
  const api = await setup();

  try {
    const response = await fetch(
      `${api.base}/api/behavioral-health/stats?period=year`
    );

    assert.equal(response.status, 400);
  } finally {
    await api.close();
  }
});

// TEST 7: Alerts endpoint.
test('alerts endpoint returns an array', async () => {
  const api = await setup();

  try {
    const response = await fetch(
      `${api.base}/api/behavioral-health/alerts`
    );

    assert.equal(response.status, 200);

    const data = await response.json();
    assert.ok(Array.isArray(data.alerts));
  } finally {
    await api.close();
  }
});

// TEST 8: Unauthenticated request.
test('unauthenticated request is rejected', async () => {
  const api = await setup((req, res) => {
    res.status(401).json({
      error: 'Authentication required'
    });
  });

  try {
    const response = await fetch(
      `${api.base}/api/behavioral-health/history`
    );

    assert.equal(response.status, 401);
  } finally {
    await api.close();
  }
});

// TEST 9: Cross-astronaut access.
test('another astronaut cannot access behavioral records', async () => {
  const api = await setup((req, res, next) => {
    req.user = {
      uid: 'user-2',
      aid: 'astro-2',
      role: 'astronaut'
    };
    next();
  });

  try {
    const response = await fetch(
      `${api.base}/api/behavioral-health/history`
    );

    assert.equal(response.status, 403);
  } finally {
    await api.close();
  }
});

// TEST 10: Three consecutive low moods.
test('three consecutive low moods trigger a wellness alert', async () => {
  const api = await setup();

  try {
    for (let i = 0; i < 3; i++) {
      const response = await fetch(
        `${api.base}/api/behavioral-health/checkins`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mood: 'Low',
            journalEntry: 'I feel lonely, anxious and overwhelmed.'
          })
        }
      );

      assert.equal(response.status, 201);
    }

    const response = await fetch(
      `${api.base}/api/behavioral-health/alerts`
    );

    const data = await response.json();

    assert.equal(response.status, 200);
    assert.equal(data.alerts.length, 1);
    assert.equal(data.alerts[0].type, 'repeated_low_mood');
  } finally {
    await api.close();
  }
});

// TEST 11: Weekly statistics.
test('weekly statistics return mood averages and trends', async () => {
  const api = await setup();

  try {
    const response = await fetch(
      `${api.base}/api/behavioral-health/stats?period=week`
    );

    assert.equal(response.status, 200);

    const data = await response.json();

    assert.equal(data.period, 'week');
    assert.equal(data.days, 7);
    assert.ok(Array.isArray(data.trends));
    assert.ok(Number.isInteger(data.summary.total_checkins));
  } finally {
    await api.close();
  }
});
