# CalorieTrack Web

Ce projet est la version web de l'application CalorieTrack, conçue pour tourner sur une Raspberry Pi et développée sur Mac. L'application permet de suivre ses repas et d'estimer les calories consommées grâce à un chatbot alimenté par une intelligence artificielle locale. L'interface s'inspire du design Apple pour une expérience utilisateur moderne et élégante.

## Fonctionnalités principales

- Interface web moderne (React + Radix UI + Tailwind CSS)
- Saisie des repas via un chat avec une IA locale (Ollama)
- Calcul automatique des calories
- Historique des repas et statistiques personnalisées
- Authentification sécurisée (multi-utilisateur, gestion par admin)
- Application dockerisée pour compatibilité Mac/Raspberry Pi

## Architecture technique

- **Frontend** : React (TypeScript), Radix UI, Tailwind CSS
- **Backend** : Python (FastAPI), FastAPI Users (authentification)
- **IA locale** : Ollama (modèle LLM, API REST locale)
- **Base de données** : PostgreSQL
- **Orchestration** : Docker & Docker Compose

### Schéma d'architecture

```
[ Utilisateur ]
      |
      v
[ Frontend React (Radix UI/Tailwind) ]
      |
      v
[ Backend FastAPI (auth, logique métier, API) ]
      |         \
      v          v
[ PostgreSQL ]  [ Ollama (IA locale) ]
```

- Le frontend communique avec le backend via API REST.
- Le backend gère l'authentification, la logique métier, l'accès à la base de données et relaie les requêtes à l'IA locale.
- Chaque utilisateur a son propre historique et contexte de chat.

## Structure des dossiers

```
calorieTrackV2/
│
├── frontend/         # Application React (Radix UI, Tailwind)
├── backend/          # API FastAPI, gestion utilisateurs, logique métier
├── db/               # Scripts d'initialisation PostgreSQL, migrations
├── ollama/           # Configurations pour Ollama (modèle, scripts)
├── docker-compose.yml
├── README.md
└── ...
```

## Prérequis
- Python 3.10+
- Node.js 18+
- Docker & Docker Compose (recommandé pour la prod)

## Variables d'environnement à définir

### Backend (`backend/.env` à créer, ne pas versionner)
- `DATABASE_URL` : URL de connexion à la base Postgres (ex : `postgresql+asyncpg://user:password@db:5432/calorietrack`)
- `SECRET` : clé secrète pour le JWT (ex : une chaîne aléatoire longue)

### Frontend (`frontend/.env` à créer, ne pas versionner)
- `VITE_API_URL` : URL de l'API backend (ex : `http://localhost:8000`)

## Lancer en local (développement)

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# Créer le fichier .env et remplir les variables
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Lancer avec Docker (recommandé pour la prod ou sur Raspberry)
```bash
docker-compose up --build
```

## Initialiser la base de données
- Utilise le script `backend/seed_data.py` pour remplir la base avec des données de test si besoin.

## Sécurité
- **Ne versionne jamais les fichiers `.env` ou contenant des secrets !**
- Les mots de passe, clés et tokens doivent être passés via les variables d'environnement.

## Déploiement sur Raspberry Pi
- Clone le repo sur la Raspberry
- Configure les variables d'environnement
- Lance avec Docker Compose

## Authentification & gestion des utilisateurs

- Authentification sécurisée via FastAPI Users (JWT)
- Création des utilisateurs par l'admin (interface ou script)
- Chaque utilisateur a son propre historique et contexte IA

## À faire

- Développement de l'interface web (chat, historique, stats)
- Intégration de l'authentification
- Intégration du backend avec Ollama et PostgreSQL
- Dockerisation complète
- (Plus tard) Fine-tuning du modèle IA

## Intégration avec un site web principal

Ce projet est conçu pour pouvoir être intégré derrière un site web principal (par exemple en sous-domaine, sous-répertoire ou via un reverse proxy). L'intégration peut se faire selon les besoins de l'infrastructure existante, sans modification majeure de l'architecture de l'application.

---

Pour toute question, ouvre une issue ou contacte le mainteneur. 