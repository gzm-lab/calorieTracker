# 🥗 CalorieTrack

Application web self-hosted de suivi nutritionnel avec **IA conversationnelle** — décris ce que tu as mangé en langage naturel, un LLM local estime les calories et les macros et les enregistre automatiquement.

Conçu pour tourner sur un **Raspberry Pi** (ou tout serveur Linux), déployable en une commande Docker.

## ✨ Fonctionnalités

- 💬 **Chat IA** — décris ton repas en texte naturel, le LLM (Ollama) parse et enregistre les macros
- 📊 **Dashboard** — visualisation des calories, protéines, glucides, lipides et fibres du jour
- 📅 **Historique** — liste paginée de tous les repas enregistrés
- 🔐 **Authentification JWT** — multi-utilisateur, sessions sécurisées
- 🐳 **Docker Compose** — déploiement one-liner

## 🖥️ Stack technique

| Couche | Technologie |
|---|---|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS + Radix UI |
| Backend | Python + FastAPI + FastAPI Users |
| IA | [Ollama](https://ollama.ai) (LLM local) |
| Base de données | PostgreSQL + SQLAlchemy (async) |
| Charts | Victory (React) |
| DevOps | Docker Compose + Nginx |

## 🚀 Quick Start (Docker)

### Prérequis

- Docker & Docker Compose
- [Ollama](https://ollama.ai) installé et accessible sur le réseau

### 1. Clone & configure

```bash
git clone https://github.com/gzm-lab/calorieTracker.git
cd calorieTracker
cp .env.example .env   # puis édite les variables
```

Variables d'environnement clés (`.env`) :

| Variable | Description | Exemple |
|---|---|---|
| `DATABASE_URL` | URL PostgreSQL | `postgresql+asyncpg://user:pass@db/calories` |
| `SECRET_KEY` | Clé JWT (génère avec `openssl rand -hex 32`) | `abc123...` |
| `OLLAMA_URL` | URL de ton instance Ollama | `http://192.168.1.10:11434` |
| `OLLAMA_MODEL` | Modèle à utiliser | `llama3` |

### 2. Lance l'application

```bash
docker compose up -d
```

L'app est disponible sur **http://localhost** (ou l'IP de ton Pi).

### 3. Développement local

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend (dans un autre terminal)
cd frontend
npm install
npm run dev
```

## 🗂️ Architecture

```
calorieTracker/
├── backend/
│   ├── main.py          # FastAPI — endpoints REST + auth JWT
│   ├── models.py         # SQLAlchemy — User, Meal
│   ├── schemas.py        # Pydantic — validation entrées/sorties
│   ├── user_manager.py   # Gestion utilisateurs (FastAPI Users)
│   ├── db.py             # Connexion DB async
│   ├── seed_data.py      # Données de démo
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Chat.tsx        # Interface chat IA (plat principal)
│   │   │   ├── Dashboard.tsx   # Graphiques nutritionnels
│   │   │   └── Historique.tsx  # Historique des repas
│   │   ├── auth.tsx            # Contexte d'authentification
│   │   └── App.tsx             # Routing React
│   └── Dockerfile
├── db/
│   └── backup_db.sh     # Script de sauvegarde PostgreSQL
└── docker-compose.yml
```

## 📡 API Endpoints

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/auth/jwt/login` | Connexion → JWT token |
| `POST` | `/meals/` | Créer un repas |
| `GET` | `/meals/` | Lister les repas |
| `GET` | `/meals/stats/daily` | Stats journalières (calories + macros) |
| `PUT` | `/meals/{id}` | Modifier un repas |
| `DELETE` | `/meals/{id}` | Supprimer un repas |

## 🔒 Sécurité

- Authentification JWT Bearer (FastAPI Users)
- Mots de passe hashés bcrypt
- Isolation des données par utilisateur (FK `user_id` sur chaque repas)
- Variables sensibles dans `.env` (jamais committées)
- Nginx comme reverse proxy en production

## 📋 À faire

- [ ] Notifications push (rappels de repas)
- [ ] Export CSV/PDF des données nutritionnelles
- [ ] Mode hors-ligne (PWA)
- [ ] Support multi-langue
