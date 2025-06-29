from fastapi_users.db import SQLAlchemyBaseUserTable
from db import Base
from sqlalchemy import Integer, String, DateTime, Float, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

class User(SQLAlchemyBaseUserTable[int], Base):
    __tablename__ = "user"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    
    # Relation avec les repas
    meals: Mapped[list["Meal"]] = relationship("Meal", back_populates="user", cascade="all, delete-orphan")

class Meal(Base):
    __tablename__ = "meal"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("user.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    
    # Calories et macronutriments
    calories: Mapped[float] = mapped_column(Float, nullable=False)
    proteins: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)  # grammes
    carbohydrates: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)  # grammes
    fats: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)  # grammes
    fiber: Mapped[float] = mapped_column(Float, nullable=True, default=0.0)  # grammes
    
    meal_type: Mapped[str] = mapped_column(String(50), nullable=False)  # breakfast, lunch, dinner, snack
    date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relation avec l'utilisateur
    user: Mapped[User] = relationship("User", back_populates="meals")
