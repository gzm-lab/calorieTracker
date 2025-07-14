from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text, select
from db import SessionLocal, engine, sync_engine, Base
# Importer les modèles APRÈS Base pour qu'ils soient enregistrés
from models import User, Meal
from fastapi_users import FastAPIUsers
from fastapi_users.authentication import AuthenticationBackend, JWTStrategy, BearerTransport
from fastapi_users.db import SQLAlchemyUserDatabase
from user_manager import UserManager
from schemas import UserRead, UserCreate, UserUpdate, MealCreate, MealRead, MealUpdate
import os
from typing import List, Optional
from datetime import datetime, date, timedelta, timezone
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi_users.authentication.strategy.jwt import JWTStrategy as BaseJWTStrategy

class DebugJWTStrategy(BaseJWTStrategy):
    async def read_token(self, token: str, user_manager):
        try:
            return await super().read_token(token, user_manager)
        except Exception as e:
            print(f"[JWT DEBUG] Erreur lors du décodage du token : {e}")
            raise

app = FastAPI()

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "https://calorie.gzi.ovh", "https://api.calorie.gzi.ovh"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Création de la table User si elle n'existe pas
def create_db_and_tables():
    # S'assurer que les modèles sont bien importés et enregistrés
    import models  # Force l'import des modèles
    # Créer les tables de manière synchrone
    Base.metadata.create_all(bind=sync_engine)

async def ensure_tables_exist():
    """S'assure que les tables existent"""
    try:
        create_db_and_tables()
    except Exception as e:
        print(f"Erreur lors de la création des tables: {e}")

async def get_user_db():
    async with SessionLocal() as session:
        yield SQLAlchemyUserDatabase(session, User)

async def get_user_manager(user_db=Depends(get_user_db)):
    yield UserManager(user_db)

# Authentification JWT
SECRET = os.environ.get("SECRET", "changeme")

def get_jwt_strategy() -> DebugJWTStrategy:
    return DebugJWTStrategy(secret=SECRET, lifetime_seconds=3600)

jwt_auth_backend = AuthenticationBackend(
    name="jwt",
    transport=BearerTransport(tokenUrl="auth/jwt/login"),
    get_strategy=get_jwt_strategy,
)

fastapi_users = FastAPIUsers[User, int](
    get_user_manager,
    [jwt_auth_backend],
)

app.include_router(
    fastapi_users.get_auth_router(jwt_auth_backend),
    prefix="/auth/jwt",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_register_router(UserRead, UserCreate),
    prefix="/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_users_router(UserRead, UserUpdate),
    prefix="/users",
    tags=["users"],
)

# Endpoints pour les repas
@app.post("/meals/", response_model=MealRead, tags=["meals"])
async def create_meal(
    meal: MealCreate,
    user: User = Depends(fastapi_users.current_user())
):
    """Créer un nouveau repas"""
    await ensure_tables_exist()
    async with SessionLocal() as session:
        # Conversion UTC naive
        date_value = meal.date
        if date_value:
            if date_value.tzinfo is not None:
                date_value = date_value.astimezone(timezone.utc).replace(tzinfo=None)
        else:
            date_value = datetime.utcnow()
        db_meal = Meal(
            user_id=user.id,
            name=meal.name,
            description=meal.description,
            calories=meal.calories,
            proteins=meal.proteins,
            carbohydrates=meal.carbohydrates,
            fats=meal.fats,
            fiber=meal.fiber,
            meal_type=meal.meal_type,
            date=date_value
        )
        session.add(db_meal)
        await session.commit()
        await session.refresh(db_meal)
        return db_meal

@app.get("/meals/", response_model=List[MealRead], tags=["meals"])
async def get_meals(
    user: User = Depends(fastapi_users.current_user()),
    date_filter: Optional[str] = None
):
    """Récupérer tous les repas de l'utilisateur"""
    async with SessionLocal() as session:
        query = select(Meal).where(Meal.user_id == user.id)
        
        if date_filter:
            try:
                filter_date = datetime.strptime(date_filter, "%Y-%m-%d").date()
                query = query.where(Meal.date >= filter_date).where(Meal.date < filter_date + timedelta(days=1))
            except ValueError:
                raise HTTPException(status_code=400, detail="Format de date invalide. Utilisez YYYY-MM-DD")
        
        query = query.order_by(Meal.date.desc())
        result = await session.execute(query)
        meals = result.scalars().all()
        return meals

@app.get("/meals/{meal_id}", response_model=MealRead, tags=["meals"])
async def get_meal(
    meal_id: int,
    user: User = Depends(fastapi_users.current_user())
):
    """Récupérer un repas spécifique"""
    async with SessionLocal() as session:
        result = await session.execute(
            select(Meal).where(Meal.id == meal_id, Meal.user_id == user.id)
        )
        meal = result.scalar_one_or_none()
        if not meal:
            raise HTTPException(status_code=404, detail="Repas non trouvé")
        return meal

@app.put("/meals/{meal_id}", response_model=MealRead, tags=["meals"])
async def update_meal(
    meal_id: int,
    meal_update: MealUpdate,
    user: User = Depends(fastapi_users.current_user())
):
    """Mettre à jour un repas"""
    async with SessionLocal() as session:
        result = await session.execute(
            select(Meal).where(Meal.id == meal_id, Meal.user_id == user.id)
        )
        meal = result.scalar_one_or_none()
        if not meal:
            raise HTTPException(status_code=404, detail="Repas non trouvé")
        
        # Mettre à jour les champs fournis
        update_data = meal_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(meal, field, value)
        
        await session.commit()
        await session.refresh(meal)
        return meal

@app.delete("/meals/{meal_id}", tags=["meals"])
async def delete_meal(
    meal_id: int,
    user: User = Depends(fastapi_users.current_user())
):
    """Supprimer un repas"""
    async with SessionLocal() as session:
        result = await session.execute(
            select(Meal).where(Meal.id == meal_id, Meal.user_id == user.id)
        )
        meal = result.scalar_one_or_none()
        if not meal:
            raise HTTPException(status_code=404, detail="Repas non trouvé")
        
        await session.delete(meal)
        await session.commit()
        return {"message": "Repas supprimé avec succès"}

@app.get("/meals/stats/daily", tags=["meals"])
async def get_daily_stats(
    user: User = Depends(fastapi_users.current_user()),
    date_filter: Optional[str] = None
):
    """Récupérer les statistiques quotidiennes"""
    async with SessionLocal() as session:
        query = select(Meal).where(Meal.user_id == user.id)
        
        if date_filter:
            try:
                filter_date = datetime.strptime(date_filter, "%Y-%m-%d").date()
                query = query.where(Meal.date >= filter_date).where(Meal.date < filter_date + timedelta(days=1))
            except ValueError:
                raise HTTPException(status_code=400, detail="Format de date invalide. Utilisez YYYY-MM-DD")
        else:
            # Par défaut, aujourd'hui
            today = date.today()
            query = query.where(Meal.date >= today).where(Meal.date < today + timedelta(days=1))
        
        result = await session.execute(query)
        meals = result.scalars().all()
        
        # Calculer les totaux
        total_calories = sum(meal.calories for meal in meals)
        total_proteins = sum(meal.proteins for meal in meals)
        total_carbohydrates = sum(meal.carbohydrates for meal in meals)
        total_fats = sum(meal.fats for meal in meals)
        total_fiber = sum(meal.fiber or 0 for meal in meals)
        
        return {
            "date": date_filter or today.isoformat(),
            "total_calories": total_calories,
            "total_proteins": total_proteins,
            "total_carbohydrates": total_carbohydrates,
            "total_fats": total_fats,
            "total_fiber": total_fiber,
            "meal_count": len(meals)
        }

@app.get("/health")
def healthcheck():
    return {"status": "ok"}

@app.get("/db-check")
async def db_check():
    try:
        async with SessionLocal() as session:
            await session.execute(text("SELECT 1"))
        return {"db": "ok"}
    except SQLAlchemyError as e:
        return {"db": "error", "detail": str(e)}

@app.get("/test-users")
async def test_users():
    """Endpoint de test pour voir les utilisateurs existants"""
    try:
        async with SessionLocal() as session:
            result = await session.execute(text("SELECT id, email, is_active, is_superuser, is_verified FROM \"user\""))
            users = result.fetchall()
            return {"users": [{"id": u[0], "email": u[1], "is_active": u[2], "is_superuser": u[3], "is_verified": u[4]} for u in users]}
    except Exception as e:
        return {"error": str(e)}

# Créer les tables au démarrage
@app.on_event("startup")
async def startup_event():
    try:
        create_db_and_tables()
        print("✅ Tables créées avec succès")
    except Exception as e:
        print(f"⚠️ Erreur lors de la création des tables: {e}")
        print("Les tables seront créées lors de la première requête")

FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "../frontend/dist")

# Sert les fichiers statiques (JS, CSS, images, etc.)
if os.path.exists(os.path.join(FRONTEND_DIST, "assets")):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")
if os.path.exists(os.path.join(FRONTEND_DIST, "static")):
    app.mount("/static", StaticFiles(directory=os.path.join(FRONTEND_DIST, "static")), name="static")

# Sert index.html pour toutes les autres routes non-API
@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    index_path = os.path.join(FRONTEND_DIST, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"error": "index.html not found"}

# Endpoint OPTIONS spécifique pour l'authentification
@app.options("/auth/jwt/login")
async def auth_options():
    return {"message": "OK"} 