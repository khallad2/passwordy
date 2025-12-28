from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.v1 import auth, vault
from app.core.config import settings
from app.core import security
from app.db.session import get_db, engine, SessionLocal
from app.models.models import User, Base

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

@app.on_event("startup")
async def startup_event():
    # Initial user creation
    async with SessionLocal() as db:
        result = await db.execute(select(User))
        user_exists = result.scalars().first()
        
        if not user_exists:
            hashed_password = security.get_password_hash(settings.INITIAL_PASSWORD)
            user = User(
                username=settings.INITIAL_USERNAME,
                password_hash=hashed_password
            )
            db.add(user)
            await db.commit()
            print(f"Initial user '{settings.INITIAL_USERNAME}' created.")

@app.get("/health")
def health_check():
    return {"status": "ok"}

app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(vault.router, prefix=f"{settings.API_V1_STR}/vault", tags=["vault"])
