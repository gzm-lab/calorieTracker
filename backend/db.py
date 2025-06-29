from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import create_engine
import os

DATABASE_URL = os.getenv("DATABASE_URL")
SYNC_DATABASE_URL = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")

engine = create_async_engine(DATABASE_URL, echo=True)
sync_engine = create_engine(SYNC_DATABASE_URL, echo=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)
Base = declarative_base() 