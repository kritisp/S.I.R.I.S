"""
AIRA Local AI FastAPI Main Router — Phase 7.2
Combines all API sub-routers under the /api namespace prefix.
"""

from fastapi import APIRouter
from .health import router as health_router
from .query import router as query_router
from .voice import router as voice_router
from .tts import router as tts_router
from .cases import router as cases_router
from .ai import router as ai_router

api_router = APIRouter(prefix="/api")

# Mount primary Phase 7.2 sub-routers
api_router.include_router(health_router)
api_router.include_router(query_router)
api_router.include_router(voice_router)
api_router.include_router(tts_router)
api_router.include_router(cases_router)

# Mount backward-compatible AI router
api_router.include_router(ai_router)
