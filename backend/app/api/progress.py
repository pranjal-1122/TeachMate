from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session as DBSession
from app.database.connection import get_db
from app.models.entities import User
from app.services.auth import get_current_user
from app.services.progress import ProgressService
from app.schemas.progress import (
    CardProgressPayload, CardProgressResponse, StudentProgressOverview, BadgeItem
)

router = APIRouter(tags=["Student Progress & Gamification"])

@router.post("/lessons/{lesson_id}/progress", response_model=CardProgressResponse)
def record_card_progress(
    lesson_id: str,
    payload: CardProgressPayload,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db)
):
    return ProgressService.record_card_progress(
        lesson_id=lesson_id,
        user_id=current_user.id,
        payload=payload,
        db=db
    )

@router.get("/me/progress", response_model=StudentProgressOverview)
def get_my_progress(
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db)
):
    return ProgressService.get_progress_overview(current_user.id, db)

@router.get("/me/badges", response_model=List[BadgeItem])
def get_my_badges(
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db)
):
    return ProgressService.get_badges_list(current_user.id, db)
