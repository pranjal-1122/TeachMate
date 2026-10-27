from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session
from app.config import settings
from app.database.connection import get_db
from app.models.entities import User
from app.schemas.auth import UserRegister, UserLogin, AuthResponse, UserResponse
from app.schemas.common import APIException
from app.services.auth import (
    hash_password, verify_password, create_access_token, get_current_user
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

def set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key=settings.COOKIE_NAME,
        value=token,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        path="/"
    )

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, response: Response, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise APIException(
            status_code=400,
            code="EMAIL_ALREADY_EXISTS",
            message="An account with this email address already exists."
        )

    user = User(
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
        display_name=payload.display_name.strip(),
        role=payload.role,
        timezone=payload.timezone
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id, user.role)
    set_auth_cookie(response, token)

    return AuthResponse(user=UserResponse.model_validate(user))

@router.post("/login", response_model=AuthResponse)
def login(payload: UserLogin, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise APIException(
            status_code=401,
            code="INVALID_CREDENTIALS",
            message="Invalid email or password."
        )

    token = create_access_token(user.id, user.role)
    set_auth_cookie(response, token)

    return AuthResponse(user=UserResponse.model_validate(user))

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(
        key=settings.COOKIE_NAME,
        path="/",
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE
    )
    return {"ok": True}

@router.get("/me", response_model=AuthResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return AuthResponse(user=UserResponse.model_validate(current_user))
