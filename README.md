# ASTROVITAL (hackathon prototype)
Synthetic data + experimental ML. Decision support only, not a medical device. Demo thresholds are NOT clinically validated.

## Run
1. `docker compose up -d`  (PostgreSQL 16, schema auto-loaded; or run server/schema.sql on your own `astrovital_db`)
2. `cd server && cp .env.example .env && npm i && npm run seed && npm start`   (API :4000)
3. `cd ai-service && pip install -r requirements.txt && uvicorn main:app --port 8000`  (optional; rules work without it)
4. `cd client && npm i && npm run dev`  (http://localhost:5173)
Demo logins: astro@demo.space / demo1234 (astronaut), medical@demo.space / demo1234 (mission control). Seed follows the 30-day story; day 21 raises a multi-indicator alert.

## Demo offline mode
Browser DevTools > Network > Offline, submit a check-in (queued in IndexedDB), go online: it syncs once; re-sync is deduplicated by idempotency key.

## Known gaps vs blueprint
Plain SQL (pg) instead of Prisma; no body map, no LLM (assistant is deterministic, protocol-grounded); no PDF generator (print-to-PDF); FastAPI has /health, /baseline/create, /anomaly/detect, /trends/analyze (risk, explain and recommendation logic live in Express); no automated tests; no role-specific report views; assistant messages are not persisted.
