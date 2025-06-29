#!/usr/bin/env python3
"""
Script pour insérer des données de test dans la base de données
"""
import asyncio
import os
import random
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import User, Meal
from db import sync_engine
from passlib.context import CryptContext

# Configuration pour le hashage des mots de passe
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def generate_random_meal_data(meal_type):
    """Génère des données de repas aléatoires mais réalistes pour un type donné"""
    meal_names = {
        "breakfast": ["Petit déjeuner", "Breakfast", "Déjeuner matinal"],
        "lunch": ["Déjeuner", "Lunch", "Repas de midi"],
        "dinner": ["Dîner", "Dinner", "Repas du soir"]
    }
    meal_descriptions = {
        "breakfast": [
            "Yaourt grec + fruits", "Omelette + avocat + toast", "Céréales + lait + banane",
            "Shake protéiné + flocons d'avoine", "Thé + biscottes + confiture",
            "Pancakes + sirop d'érable + bacon", "Pain au chocolat + café au lait",
            "Smoothie bowl + granola", "Tartines + beurre + confiture", "Œufs brouillés + saumon"
        ],
        "lunch": [
            "Poulet grillé + riz + légumes", "Burger + frites", "Salade composée + lentilles",
            "Pâtes carbonara + salade", "Poisson blanc + riz basmati + légumes",
            "Pizza margherita + soda", "Salade niçoise + baguette", "Quiche lorraine + salade",
            "Sushi + soupe miso", "Tacos + guacamole", "Risotto aux champignons"
        ],
        "dinner": [
            "Soupe de légumes + pain complet", "Saumon + quinoa + brocoli", "Smoothie protéiné + noix",
            "Steak + pommes de terre + haricots", "Curry de légumes + riz complet",
            "Soupe miso + sushi", "Lasagnes + salade verte", "Poulet rôti + légumes",
            "Pâtes aux fruits de mer", "Salade composée + fromage", "Soupe à l'oignon + croûtons"
        ]
    }
    
    name = random.choice(meal_names[meal_type])
    description = random.choice(meal_descriptions[meal_type])
    
    # Générer des macros réalistes selon le type de repas
    if meal_type == "breakfast":
        calories = random.randint(250, 600)
        proteins = random.randint(15, 40)
        carbohydrates = random.randint(30, 80)
        fats = random.randint(8, 35)
        fiber = random.randint(5, 15)
    elif meal_type == "lunch":
        calories = random.randint(450, 850)
        proteins = random.randint(25, 55)
        carbohydrates = random.randint(50, 100)
        fats = random.randint(15, 45)
        fiber = random.randint(8, 25)
    else:  # dinner
        calories = random.randint(350, 700)
        proteins = random.randint(20, 50)
        carbohydrates = random.randint(40, 80)
        fats = random.randint(10, 35)
        fiber = random.randint(8, 22)
    
    return {
        "name": name,
        "description": description,
        "calories": calories,
        "proteins": proteins,
        "carbohydrates": carbohydrates,
        "fats": fats,
        "fiber": fiber,
        "meal_type": meal_type
    }

async def create_test_user():
    """Créer un utilisateur de test"""
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=sync_engine)
    session = SessionLocal()
    
    try:
        # Supprimer l'ancien utilisateur de test s'il existe
        existing_user = session.query(User).filter(User.email == "test@example.com").first()
        if existing_user:
            print(f"🗑️ Suppression de l'ancien utilisateur de test (ID: {existing_user.id})")
            session.delete(existing_user)
            session.commit()
        
        # Créer un nouvel utilisateur de test avec le bon mot de passe hashé
        hashed_password = pwd_context.hash("test123")
        test_user = User(
            email="test@example.com",
            hashed_password=hashed_password,
            is_active=True,
            is_superuser=False,
            is_verified=True
        )
        session.add(test_user)
        session.commit()
        session.refresh(test_user)
        print(f"✅ Utilisateur de test créé (ID: {test_user.id})")
        print(f"📧 Email: test@example.com")
        print(f"🔑 Mot de passe: test123")
        return test_user.id
        
    except Exception as e:
        print(f"❌ Erreur lors de la création de l'utilisateur: {e}")
        session.rollback()
        return None
    finally:
        session.close()

async def insert_test_meals(user_id: int):
    """Insérer les repas de test pour 33 jours"""
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=sync_engine)
    session = SessionLocal()
    
    try:
        # Supprimer les anciens repas de test pour cet utilisateur
        existing_meals = session.query(Meal).filter(Meal.user_id == user_id).all()
        if existing_meals:
            print(f"🗑️ Suppression de {len(existing_meals)} anciens repas de test")
            for meal in existing_meals:
                session.delete(meal)
            session.commit()
        
        # Créer les repas sur les 33 derniers jours
        base_date = datetime.now() - timedelta(days=33)
        total_meals = 0
        
        print(f"📅 Génération des repas du {base_date.strftime('%d/%m/%Y')} au {datetime.now().strftime('%d/%m/%Y')}")
        
        for day in range(33):
            meal_date = base_date + timedelta(days=day)
            day_meals = 0
            
            # Générer 3 repas par jour (petit déjeuner, déjeuner, dîner)
            for meal_type in ["breakfast", "lunch", "dinner"]:
                meal_data = generate_random_meal_data(meal_type)
                
                meal = Meal(
                    user_id=user_id,
                    name=meal_data["name"],
                    description=meal_data["description"],
                    calories=meal_data["calories"],
                    proteins=meal_data["proteins"],
                    carbohydrates=meal_data["carbohydrates"],
                    fats=meal_data["fats"],
                    fiber=meal_data["fiber"],
                    meal_type=meal_data["meal_type"],
                    date=meal_date
                )
                session.add(meal)
                total_meals += 1
                day_meals += 1
            
            if day % 10 == 0:  # Log tous les 10 jours
                print(f"   Jour {day + 1}: {day_meals} repas générés")
        
        session.commit()
        print(f"✅ {total_meals} repas de test insérés avec succès (33 jours × 3 repas)")
        print(f"📅 Période: du {base_date.strftime('%d/%m/%Y')} au {datetime.now().strftime('%d/%m/%Y')}")
        
    except Exception as e:
        print(f"❌ Erreur lors de l'insertion des repas: {e}")
        session.rollback()
    finally:
        session.close()

async def main():
    """Fonction principale"""
    print("🌱 Début de l'insertion des données de test...")
    
    # Créer l'utilisateur de test
    user_id = await create_test_user()
    if not user_id:
        print("❌ Impossible de créer l'utilisateur de test")
        return
    
    # Insérer les repas de test
    await insert_test_meals(user_id)
    
    print("🎉 Insertion des données de test terminée !")
    print(f"📧 Email de test: test@example.com")
    print(f"🔑 Mot de passe: test123")

if __name__ == "__main__":
    asyncio.run(main()) 