from abc import ABC, abstractmethod
from typing import Type, TypeVar, Optional, Tuple, Dict, Any
from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)

class LLMUsage(BaseModel):
    input_tokens: int = 0
    output_tokens: int = 0
    total_tokens: int = 0
    latency_ms: int = 0
    model: str = ""

class BaseLLMClient(ABC):
    @abstractmethod
    async def generate_structured(
        self,
        prompt: str,
        response_schema: Type[T],
        system_instruction: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> Tuple[T, LLMUsage]:
        """Generate structured data parsed into a Pydantic model."""
        pass
