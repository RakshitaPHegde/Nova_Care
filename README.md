# 🚀 AstroVital — Astronaut Health Monitoring System

AstroVital is an experimental astronaut health-monitoring platform designed to demonstrate how real-time telemetry, anomaly detection, and mission-control dashboards can work together to support crew health monitoring during space missions.

It combines a React dashboard, an Express API, PostgreSQL storage, and an experimental Python-based ML service.

> **Disclaimer:** AstroVital is a hackathon/research prototype, not a medical device. It currently uses simulated telemetry and experimental algorithms. Its alerts and thresholds are not clinically validated and must not be used for medical decisions.

---

## ✨ Features

- **Mission dashboard:** Overview of astronaut health, mission status, and alerts.
- **Live monitoring:** Real-time telemetry updates and ECG-style visualization.
- **Health analytics:** Historical health metrics, trends, and visual analytics.
- **AI risk prediction:** Experimental anomaly detection and risk insights.
- **Anomaly detection:** Identification of unusual patterns in health metrics.
- **Crew management:** Astronaut profiles and crew information.
- **Mission management:** Mission details and activity tracking.
- **Alerts center:** Health alerts with severity indicators.
- **AI medical assistant:** Protocol-grounded informational assistance.
- **Offline check-ins:** Queue health check-ins locally and synchronize when connectivity returns.
- **Reports:** Health and mission reporting with browser print-to-PDF support.

## 🧱 Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite |
| UI & Charts | CSS, Lucide, Recharts |
| Backend | Node.js, Express |
| Database | PostgreSQL 16 |
| Real-time communication | Socket.IO |
| AI/ML service | Python, FastAPI, NumPy, Scikit-learn |
| Offline support | IndexedDB, Service Worker |

## 🏗️ Architecture

```text
                 ASTROVITAL
                      |
          +-----------+-----------+
          |                       |
     React Client             Express API
     localhost:5173           localhost:4000
                                  |
                    +-------------+-------------+
                    |                           |
                PostgreSQL                  AI Service
                localhost:5433             localhost:8000
                                            FastAPI
```

The AI service is optional. The main Express application includes its own analysis logic and can run without the Python service.

## 📋 Prerequisites

Install the following before starting:

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/) — Node.js 20 or newer recommended
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) with Docker Compose
- [Python](https://www.python.org/downloads/) — Python 3.10 or newer (for the optional AI service)
- A code editor such as [Visual Studio Code](https://code.visualstudio.com/)

Check your installations:

```bash
git --version
node --version
npm --version
docker --version
docker compose version
python --version
```

## ⚙️ Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/bindu-yogesh/Nova_Care.git
cd Nova_Care
```

### 2. Start PostgreSQL

From the project root:

```bash
docker compose up -d
```

This starts PostgreSQL 16 and maps:

- Host: `localhost`
- Port: `5433`
- Database: `astrovital_db`
- Username: `postgres`
- Password: `postgres`

The database schema is initialized automatically when the PostgreSQL container creates its database for the first time.

Check the container:

```bash
docker compose ps
```

### 3. Configure and start the backend

Open a new terminal:

```bash
cd server
```

Create your local environment file.

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env
```

**macOS/Linux:**

```bash
cp .env.example .env
```

Make sure your `.env` contains the following local development configuration:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/astrovital_db
JWT_SECRET=replace-with-a-long-random-secret
AI_URL=http://localhost:8000
PORT=4000
```

Install dependencies and seed the database:

```bash
npm install
npm run seed
```

Start the backend:

```bash
npm start
```

The Express API will run at:

`http://localhost:4000`

Keep this terminal running.

### 4. Start the optional AI service

Open another terminal from the project root:

```bash
cd ai-service
```

Create and activate a virtual environment.

**Windows PowerShell:**

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

**macOS/Linux:**

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Install the Python dependencies:

```bash
pip install -r requirements.txt
```

Start FastAPI:

```bash
uvicorn main:app --reload --port 8000
```

The AI service will run at:

`http://localhost:8000`

Health check:

`http://localhost:8000/health`

This service is optional for local development.

### 5. Start the frontend

Open another terminal from the project root:

```bash
cd client
npm install
npm run dev
```

Open the application:

**http://localhost:5173**

The frontend uses `http://localhost:4000` as its default API URL. If you use a different backend URL, configure `VITE_API` in the frontend environment.

---

## 🔐 Demo Login Credentials

The seed script creates demo accounts.

| Role | Email | Password |
|---|---|---|
| Astronaut | `astro@demo.space` | `demo1234` |
| Mission Control | `medical@demo.space` | `demo1234` |

Use these credentials to explore the application locally.

**Important:** These are development demo credentials. Never use them in a public production deployment.

## 🗂️ Project Structure

```text
Nova_Care/
│
├── ai-service/
│   ├── main.py
│   └── requirements.txt
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── views/
│   │   ├── App.tsx
│   │   ├── api.ts
│   │   ├── offline.ts
│   │   ├── styles.css
│   │   └── types.ts
│   ├── index.html
│   └── package.json
│
├── server/
│   ├── analysis.js
│   ├── db.js
│   ├── index.js
│   ├── migrate.js
│   ├── schema.sql
│   ├── seed.js
│   ├── simulator.js
│   ├── test-suite.js
│   ├── package.json
│   └── .env.example
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

## 🧪 Running in Offline Mode

AstroVital supports offline health check-ins.

To test:

1. Open the application in your browser.
2. Open Developer Tools → Network.
3. Enable **Offline** mode.
4. Submit a health check-in.
5. The check-in is queued locally using IndexedDB.
6. Disable Offline mode.
7. The queued record is synchronized with the backend.

The synchronization pipeline uses idempotency keys to prevent duplicate uploads.

## 🛠️ Troubleshooting

### Database connection refused

- Ensure Docker Desktop is running.
- Check the database container with `docker compose ps`.
- Confirm PostgreSQL is exposed on port `5433`.
- Verify `DATABASE_URL` in `server/.env`.

### Database tables do not exist

The schema is loaded when the PostgreSQL container initializes a new database.

If you already have an existing database volume, the initialization script will not automatically run again. For an existing database, apply `server/schema.sql` manually using a PostgreSQL client.

### Backend cannot connect to the AI service

- Ensure the AI service is running on port `8000`.
- Verify `AI_URL` in `server/.env`.
- Remember that the AI service is optional.

### Frontend cannot connect to the backend

- Ensure the backend is running on port `4000`.
- Check the browser console for API errors.
- Verify the `VITE_API` configuration if you changed the backend address.

### Port already in use

If ports `4000`, `5173`, `5433`, or `8000` are occupied, stop the conflicting process or update the corresponding configuration.

## 🤝 Contributing

Contributions, suggestions, and improvements are welcome!

1. Fork the repository.
2. Create a feature branch:

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. Make your changes.
4. Test your changes locally.
5. Commit:

   ```bash
   git add .
   git commit -m "Add: describe your change"
   ```

6. Push your branch:

   ```bash
   git push origin feature/your-feature-name
   ```

7. Open a Pull Request describing your changes.

Please do not commit `.env` files, passwords, API keys, or other secrets.

## ⚠️ Current Limitations

- Telemetry is simulated; live NASA or spacecraft telemetry integration is not implemented.
- ML predictions and thresholds are experimental and not clinically validated.
- The medical assistant is deterministic and protocol-grounded, not an LLM-powered medical system.
- Reports use browser print-to-PDF rather than a dedicated PDF generation engine.
- This project is a prototype and requires further validation before real-world use.

## 👩‍🚀 Project

**AstroVital — Experimental Astronaut Health Monitoring System**

Repository: https://github.com/bindu-yogesh/Nova_Care

Built as a hackathon/research prototype to explore health monitoring, anomaly detection, and mission-control workflows.
