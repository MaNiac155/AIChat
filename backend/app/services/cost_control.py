import asyncio
import logging
import time
from dataclasses import dataclass

from app.config import settings


logger = logging.getLogger(__name__)

VISION_CACHE_TTL_SECONDS = settings.vision_cache_ttl_seconds


@dataclass(frozen=True)
class VisionCacheEntry:
    description: str
    mock_mode: bool
    created_at: float


class VisionCostControl:
    def __init__(self) -> None:
        self._cache: VisionCacheEntry | None = None
        self._model_call_count = 0
        self._lock = asyncio.Lock()

    async def get_cached_description(self) -> VisionCacheEntry | None:
        async with self._lock:
            if not self._cache:
                return None

            cache_age = time.monotonic() - self._cache.created_at
            if cache_age > VISION_CACHE_TTL_SECONDS:
                self._cache = None
                return None

            logger.info(
                "reuse vision cache age_seconds=%.2f model_call_count=%d",
                cache_age,
                self._model_call_count,
            )
            return self._cache

    async def store_description(self, description: str, mock_mode: bool) -> None:
        async with self._lock:
            self._cache = VisionCacheEntry(
                description=description,
                mock_mode=mock_mode,
                created_at=time.monotonic(),
            )

    async def record_model_call(self) -> int:
        async with self._lock:
            self._model_call_count += 1
            logger.info("vision model called count=%d", self._model_call_count)
            return self._model_call_count

    async def get_model_call_count(self) -> int:
        async with self._lock:
            return self._model_call_count

    async def clear_cache(self) -> None:
        async with self._lock:
            self._cache = None


vision_cost_control = VisionCostControl()
