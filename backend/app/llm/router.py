import logging
from app.config import settings
from app.llm.base import BaseLLMClient
from app.llm.gemini import GeminiClient
from app.llm.mock import MockLLMClient

logger = logging.getLogger(__name__)

def get_llm_client() -> BaseLLMClient:
    """Return the active LLM client based on configuration and environment."""
    if settings.USE_MOCK_LLM or not settings.GEMINI_API_KEY:
        if not settings.GEMINI_API_KEY and not settings.USE_MOCK_LLM:
            logger.info("GEMINI_API_KEY is not set; using MockLLMClient for reliable operation.")
        return MockLLMClient()
    return GeminiClient(api_key=settings.GEMINI_API_KEY, model=settings.GEMINI_MODEL)
