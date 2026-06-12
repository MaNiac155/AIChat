from fastapi import APIRouter

from app.config import settings


router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
async def health_check() -> dict[str, str | bool]:
    return {
        "status": "ok",
        "service": settings.app_name,
        "environment": settings.app_env,
        "mock_mode": settings.mock_mode,
    }
