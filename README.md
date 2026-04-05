# 🥗 CalorieTrack

> 🧒 **In plain English:** You tell the app what you ate today (like "I had a burger and fries"), and a smart AI figures out how many calories and proteins that is, then saves it for you!

A self-hosted nutrition tracking web app with **AI-powered chat** — describe what you ate in natural language, and a local LLM estimates the calories and macros and saves them automatically.

Designed to run on a **Raspberry Pi** (or any Linux server), deployable in a single Docker command.

## ✨ Features

- 💬 **AI Chat** — describe your meal in plain text, the LLM (Ollama) parses and logs your macros
- 📊 **Dashboard** — visualize daily calories, protein, carbs, fats, and fiber
- 📅 **History** — paginated list of all logged meals
- 🔐 **JWT Authentication** — multi-user, secure sessions
- 🐳 **Docker Compose** — one-command deployment

## 🖥️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS + Radix UI |
| Backend | Python + FastAPI + FastAPI Users |
| AI | [Ollama](https://ollama.ai) (local LLM) |
| Database | PostgreSQL + SQLAlchemy (async) |
| Charts | Victory (React) |
| DevOps | Docker Compose + Nginx |

## 🚀 Quick Start (Docker)

### Prerequisites

- Docker & Docker Compose
- [Ollama](https://ollama.ai) installed and reachable on the network

### 1. Clone & configure

```bash
git clone https://github.com/gzm-lab/calorieTracker.git
cd calorieTracker
cp .env.example .env   # then edit the variables
```

Key environment variables (`.env`):

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL URL | `postgresql+asyncpg://user:pass@db/calories` |
| `SECRET_KEY` | JWT secret (generate with `openssl rand -hex 32`) | `abc123...` |
| `OLLAMA_URL` | Your Ollama instance URL | `http://192.168.1.10:11434` |
| `OLLAMA_MODEL` | Model to use | `llama3` |

### 2. Start the app

```bash
docker compose up -d
```

The app is available at **http://localhost** (or your Pi's IP address).

### 3. Local development

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend (in a separate terminal)
cd frontend
npm install
npm run dev
```

## 🗂️ Architecture

```
calorieTracker/
├── backend/
│   ├── main.py          # FastAPI — REST endpoints + JWT auth
│   ├── models.py        # SQLAlchemy — User, Meal
│   ├── schemas.py       # Pydantic — input/output validation
│   ├── user_manager.py  # User management (FastAPI Users)
│   ├── db.py            # Async DB connection
│   ├── seed_data.py     # Demo data
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Chat.tsx        # AI chat interface (main feature)
│   │   │   ├── Dashboard.tsx   # Nutrition charts
│   │   │   └── Historique.tsx  # Meal history
│   │   ├── auth.tsx            # Auth context
│   │   └── App.tsx             # React routing
│   └── Dockerfile
├── db/
│   └── backup_db.sh     # PostgreSQL backup script
└── docker-compose.yml
```

## 📡 API Endpoints

| Method | Route | Description |
|---|---|---|
| `POST` | `/auth/jwt/login` | Login → JWT token |
| `POST` | `/meals/` | Create a meal |
| `GET` | `/meals/` | List meals |
| `GET` | `/meals/stats/daily` | Daily stats (calories + macros) |
| `PUT` | `/meals/{id}` | Update a meal |
| `DELETE` | `/meals/{id}` | Delete a meal |

## 🔒 Security

- JWT Bearer authentication (FastAPI Users)
- bcrypt password hashing
- Per-user data isolation (`user_id` FK on every meal)
- Sensitive variables in `.env` (never committed)
- Nginx as reverse proxy in production

## 📋 TODO

- [ ] Push notifications (meal reminders)
- [ ] CSV/PDF export of nutrition data
- [ ] Offline mode (PWA)
- [ ] Multi-language support
