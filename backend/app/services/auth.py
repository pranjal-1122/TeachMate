from datetime import datetime, timedelta, timezone
from typing import Optional
import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, InvalidHashError
from fastapi import Request, Depends
from sqlalchemy.orm import Session
from app.config import settings
from app.database.connection import get_db
from app.models.entities import User
from app.schemas.common import APIException

ph = PasswordHasher()

def hash_password(password: str) -> str:
    return ph.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return ph.verify(hashed_password, plain_password)
    except (VerifyMismatchError, InvalidHashError):
        return False

def create_access_token(user_id: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": user_id,
        "role": role,
        "exp": expire,
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, settings.SESSION_SECRET, algorithm=settings.ALGORITHM)

def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.SESSION_SECRET, algorithms=[settings.ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise APIException(status_code=401, code="TOKEN_EXPIRED", message="Session has expired. Please log in again.")
    except jwt.PyJWTError:
        raise APIException(status_code=401, code="INVALID_TOKEN", message="Invalid authentication token.")

def get_token_from_request(request: Request) -> Optional[str]:
    # 1. Check HTTP-only cookie first
    token = request.cookies.get(settings.COOKIE_NAME)
    if token:
        return token
    # 2. Check Authorization header
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header[7:]
    return None

def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
) -> User:
    token = get_token_from_request(request)
    if not token:
        raise APIException(
            status_code=401,
            code="UNAUTHENTICATED",
            message="Authentication credentials were not provided."
        )
    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise APIException(
            status_code=401,
            code="INVALID_TOKEN",
            message="Token payload is missing user ID."
        )
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise APIException(
            status_code=401,
            code="USER_NOT_FOUND",
            message="User associated with this session no longer exists."
        )
    return user

def require_teacher(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "teacher":
        raise APIException(
            status_code=403,
            code="FORBIDDEN_ROLE",
            message="Only teachers can access this resource."
        )
    return current_user

def require_student(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "student":
        raise APIException(
            status_code=403,
            code="FORBIDDEN_ROLE",
            message="Only students can access this resource."
        )
    return current_user
