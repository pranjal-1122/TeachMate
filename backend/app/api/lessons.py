from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session as DBSession
from app.database.connection import get_db
from app.models.entities import User
from app.services.auth import require_teacher, get_current_user
from app.services.lesson import LessonService
from app.schemas.lesson import (
    LessonSessionResponse, LessonDetail, LessonUpdatePayload,
    LessonCatalogResponse, PublishedLessonView
)

router = APIRouter(tags=["Lessons"])

# Session-scoped Lesson Endpoints (Teacher Owner)
@router.get("/sessions/{session_id}/lesson", response_model=LessonSessionResponse)
async def get_session_lesson(
    session_id: str,
    current_user: User = Depends(require_teacher),
    db: DBSession = Depends(get_db)
):
    return await LessonService.get_session_lesson(session_id, current_user.id, db)

@router.patch("/sessions/{session_id}/lesson", response_model=LessonDetail)
def update_lesson(
    session_id: str,
    payload: LessonUpdatePayload,
    current_user: User = Depends(require_teacher),
    db: DBSession = Depends(get_db)
):
    return LessonService.update_lesson(session_id, current_user.id, payload, db)

@router.post("/sessions/{session_id}/publish", response_model=dict)
def publish_lesson(
    session_id: str,
    payload: dict,
    current_user: User = Depends(require_teacher),
    db: DBSession = Depends(get_db)
):
    expected_version = payload.get("expected_version", 1)
    return LessonService.publish_lesson(session_id, current_user.id, expected_version, db)

# Public & Student Catalog Endpoints
@router.get("/lessons", response_model=LessonCatalogResponse)
def list_published_lessons(
    subject: Optional[str] = Query(None),
    grade_level: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    db: DBSession = Depends(get_db)
):
    return LessonService.list_catalog(subject=subject, grade_level=grade_level, query=q, db=db)

@router.get("/lessons/{lesson_id}", response_model=PublishedLessonView)
def get_lesson_detail(
    lesson_id: str,
    current_user: Optional[User] = Depends(get_current_user),
    db: DBSession = Depends(get_db)
):
    return LessonService.get_lesson_view(lesson_id, current_user, db)
