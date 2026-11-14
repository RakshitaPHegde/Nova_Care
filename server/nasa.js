import express from 'express';

const router = express.Router();

const OSDR_URL = 'https://osdr.nasa.gov/osdr/data/search';
const ISS_URL = 'https://api.wheretheiss.at/v1/satellites/25544';

const cache = new Map();

async function fetchCached(key, url, ttlMs) {
  const cached = cache.get(key);

  if (cached && Date.now() - cached.time < ttlMs) {
    return { ...cached.data, cached: true };
  }

  const response = await fetch(url, {
    signal: AbortSignal.timeout(12000),
    headers: { Accept: 'application/json' }
  });

  if (!response.ok) {
    throw new Error(`External data source returned HTTP ${response.status}`);
  }

  const data = await response.json();
  cache.set(key, { time: Date.now(), data });

  return { ...data, cached: false };
}

function cleanStudy(source = {}) {
  const mission = source.Mission || {};

  return {
    id: source['Study Identifier'] || source.Accession || null,
    title: source['Study Title'] || 'Untitled study',
    description: source['Study Description'] || '',
    organism: source.organism || null,
    materialType: source['Material Type'] || null,
    assayType: source['Study Assay Measurement Type'] || null,
    technology: source['Study Assay Technology Type'] || null,
    project: source['Project Identifier'] || null,
    flightProgram: source['Flight Program'] || null,
    mission: mission.Name || null,
    missionStart: mission['Start Date'] || null,
    missionEnd: mission['End Date'] || null,
    releaseDate: source['Study Public Release Date'] || null,
    publication: source['Study Publication Title'] || null,
    source: 'NASA Open Science Data Repository',
    sourceUrl: `https://osdr.nasa.gov/bio/repo/data/studies/${encodeURIComponent(
      source['Study Identifier'] || source.Accession || ''
    )}`
  };
}

// Search NASA's public space-biology research repository.
router.get('/osdr/datasets', async (req, res) => {
  try {
    const term = String(req.query.q || 'space').trim().slice(0, 120);
    const from = Math.max(0, Math.min(10000, Number(req.query.from) || 0));
    const size = Math.max(1, Math.min(25, Number(req.query.size) || 10));

    if (!term) {
      return res.status(400).json({ error: 'Search term is required' });
    }

    const url = new URL(OSDR_URL);
    url.searchParams.set('term', term);
    url.searchParams.set('from', String(from));
    url.searchParams.set('size', String(size));

    const key = `osdr:${term}:${from}:${size}`;
    const result = await fetchCached(key, url.toString(), 5 * 60 * 1000);

    const hits = result.hits?.hits || [];

    res.json({
      dataType: 'NASA_PUBLISHED_RESEARCH',
      simulated: false,
      source: 'NASA Open Science Data Repository',
      query: term,
      total: result.hits?.total?.value ?? result.hits?.total ?? hits.length,
      from,
      size,
      fetchedAt: new Date().toISOString(),
      cached: result.cached,
      datasets: hits.map(item => cleanStudy(item._source))
    });
  } catch (error) {
    console.error('[NASA OSDR]', error.message);
    res.status(502).json({
      error: 'Unable to retrieve NASA research datasets',
      details: error.message
    });
  }
});

// Retrieve one study using its NASA study identifier.
router.get('/osdr/datasets/:id', async (req, res) => {
  try {
    const id = String(req.params.id || '').trim().toUpperCase();

    if (!/^OSD-\d+$/i.test(id)) {
      return res.status(400).json({ error: 'Invalid NASA study identifier' });
    }

    const url = new URL(OSDR_URL);
    url.searchParams.set('term', id);
    url.searchParams.set('from', '0');
    url.searchParams.set('size', '10');

    const result = await fetchCached(`osdr-detail:${id}`, url.toString(), 5 * 60 * 1000);

    const match = (result.hits?.hits || []).find(item => {
      const source = item._source || {};
      return String(source['Study Identifier'] || source.Accession || '').toUpperCase() === id;
    });

    if (!match) {
      return res.status(404).json({ error: 'NASA study not found' });
    }

    res.json({
      dataType: 'NASA_PUBLISHED_RESEARCH',
      simulated: false,
      source: 'NASA Open Science Data Repository',
      fetchedAt: new Date().toISOString(),
      cached: result.cached,
      dataset: cleanStudy(match._source)
    });
  } catch (error) {
    console.error('[NASA OSDR detail]', error.message);
    res.status(502).json({
      error: 'Unable to retrieve NASA study details',
      details: error.message
    });
  }
});

// Retrieve public ISS orbital position. This is not astronaut health data.
router.get('/iss/location', async (req, res) => {
  try {
    const result = await fetchCached('iss:location', ISS_URL, 10000);

    res.json({
      dataType: 'LIVE_ORBITAL_POSITION',
      simulated: false,
      source: 'Where The ISS At? API',
      fetchedAt: new Date().toISOString(),
      observationTime: result.timestamp
        ? new Date(result.timestamp * 1000).toISOString()
        : null,
      cached: result.cached,
      spacecraft: result.name,
      noradId: result.id,
      latitude: result.latitude,
      longitude: result.longitude,
      altitudeKm: result.altitude,
      velocityKmh: result.velocity,
      visibility: result.visibility,
      footprintKm: result.footprint,
      units: result.units || 'kilometers'
    });
  } catch (error) {
    console.error('[ISS location]', error.message);
    res.status(502).json({
      error: 'Unable to retrieve ISS orbital position',
      details: error.message
    });
  }
});

export default router;
