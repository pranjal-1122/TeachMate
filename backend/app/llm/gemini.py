import time
import asyncio
import logging
from typing import Type, TypeVar, Optional, Tuple, Dict, Any
from pydantic import BaseModel, ValidationError
from google import genai
from google.genai import types
from google.genai.errors import APIError

from app.config import settings
from app.llm.base import BaseLLMClient, LLMUsage, T
from app.schemas.common import APIException

logger = logging.getLogger(__name__)

class GeminiClient(BaseLLMClient):
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model = model or settings.GEMINI_MODEL
        if not self.api_key:
            logger.warning("GEMINI_API_KEY is not set. Gemini client will fail unless mock is used.")
        self.client = genai.Client(api_key=self.api_key) if self.api_key else None

    async def generate_structured(
        self,
        prompt: str,
        response_schema: Type[T],
        system_instruction: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> Tuple[T, LLMUsage]:
        if not self.client:
            raise APIException(
                status_code=503,
                code="AI_PROVIDER_UNAVAILABLE",
                message="Gemini API key is not configured on the server."
            )

        start_time = time.time()
        last_error = None

        for attempt in range(settings.LLM_MAX_RETRIES + 1):
            try:
                config_args = {
                    "response_mime_type": "application/json",
                    "response_schema": response_schema,
                }
                if system_instruction:
                    config_args["system_instruction"] = system_instruction

                config = types.GenerateContentConfig(**config_args)

                # Run synchronous SDK call in threadpool with timeout
                response = await asyncio.wait_for(
                    asyncio.to_thread(
                        self.client.models.generate_content,
                        model=self.model,
                        contents=prompt,
                        config=config
                    ),
                    timeout=settings.LLM_TIMEOUT_SECONDS
                )

                latency_ms = int((time.time() - start_time) * 1000)

                # Extract token usage
                input_tokens = 0
                output_tokens = 0
                if hasattr(response, "usage_metadata") and response.usage_metadata:
                    input_tokens = getattr(response.usage_metadata, "prompt_token_count", 0) or 0
                    output_tokens = getattr(response.usage_metadata, "candidates_token_count", 0) or 0

                usage = LLMUsage(
                    input_tokens=input_tokens,
                    output_tokens=output_tokens,
                    total_tokens=input_tokens + output_tokens,
                    latency_ms=latency_ms,
                    model=self.model
                )

                parsed_data = response_schema.model_validate_json(response.text)
                return parsed_data, usage

            except asyncio.TimeoutError:
                last_error = APIException(
                    status_code=504,
                    code="AI_TIMEOUT",
                    message="AI provider timed out generating response. Please try again."
                )
                logger.warning(f"Gemini timeout on attempt {attempt + 1}")
            except APIError as e:
                status_code = getattr(e, "code", 500)
                if status_code in (429, 403) or "quota" in str(e).lower() or "resource_exhausted" in str(e).lower():
                    raise APIException(
                        status_code=429,
                        code="AI_QUOTA_EXCEEDED",
                        message="AI request quota or rate limit exceeded. Please wait a moment and try again.",
                        details={"provider": "gemini", "original_error": str(e)}
                    )
                last_error = APIException(
                    status_code=502,
                    code="AI_UPSTREAM_ERROR",
                    message=f"Gemini provider error: {str(e)}"
                )
                logger.warning(f"Gemini APIError on attempt {attempt + 1}: {e}")
            except ValidationError as e:
                last_error = APIException(
                    status_code=502,
                    code="AI_MALFORMED_OUTPUT",
                    message="AI provider returned invalid structured JSON output.",
                    details={"validation_errors": str(e)}
                )
                logger.warning(f"Gemini schema validation failed: {e}")
            except Exception as e:
                last_error = APIException(
                    status_code=500,
                    code="AI_UNEXPECTED_ERROR",
                    message=f"Unexpected error communicating with AI provider: {str(e)}"
                )
                logger.error(f"Unexpected error on attempt {attempt + 1}: {e}", exc_info=True)

            if attempt < settings.LLM_MAX_RETRIES:
                await asyncio.sleep(2 ** attempt * 0.5)

        raise last_error or APIException(
            status_code=500,
            code="AI_GENERATION_FAILED",
            message="Failed to generate structured AI response after retries."
        )
