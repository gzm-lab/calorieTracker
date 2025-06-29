from fastapi_users import schemas
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class UserRead(schemas.BaseUser[int]):
    pass

class UserCreate(schemas.BaseUserCreate):
    pass

class UserUpdate(schemas.BaseUserUpdate):
    pass

# Schémas pour les repas
class MealBase(BaseModel):
    name: str
    description: Optional[str] = None
    calories: float
    proteins: float = 0.0  # grammes
    carbohydrates: float = 0.0  # grammes
    fats: float = 0.0  # grammes
    fiber: Optional[float] = 0.0  # grammes
    meal_type: str  # breakfast, lunch, dinner, snack
    date: Optional[datetime] = None

class MealCreate(MealBase):
    pass

class MealUpdate(MealBase):
    name: Optional[str] = None
    calories: Optional[float] = None
    proteins: Optional[float] = None
    carbohydrates: Optional[float] = None
    fats: Optional[float] = None
    fiber: Optional[float] = None
    meal_type: Optional[str] = None

class MealRead(MealBase):
    id: int
    user_id: int
    date: datetime
    
    class Config:
        from_attributes = True