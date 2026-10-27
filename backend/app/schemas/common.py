from typing import Any, Dict, Optional
import uuid
from pydantic import BaseModel, Field

class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[Dict[str, Any]] = None
    request_id: str = Field(default_factory=lambda: str(uuid.uuid4()))

class ErrorEnvelope(BaseModel):
    error: ErrorDetail

class APIException(Exception):
    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        details: Optional[Dict[str, Any]] = None
    ):
        self.status_code = status_code
        self.code = code
        self.message = message
        self.details = details
        super().__init__(message)
