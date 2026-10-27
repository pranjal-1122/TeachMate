from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session as DBSession
from app.database.connection import get_db
from app.models.entities import User
from app.services.auth import get_current_user
from app.services.quiz import QuizService
from app.schemas.quiz import (
    PublicQuizPayload, QuizAttemptPayload, QuizAttemptResult
)

router = APIRouter(tags=["Student Quizzes"])

@router.get("/lessons/{lesson_id}/quiz", response_model=PublicQuizPayload)
def get_lesson_quiz(
    lesson_id: str,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db)
):
    return QuizService.get_quiz_for_lesson(lesson_id, db)

@router.post("/quizzes/{quiz_id}/attempts", response_model=QuizAttemptResult, status_code=status.HTTP_201_CREATED)
def submit_quiz_attempt(
    quiz_id: str,
    payload: QuizAttemptPayload,
    current_user: User = Depends(get_current_user),
    db: DBSession = Depends(get_db)
):
    return QuizService.submit_quiz_attempt(quiz_id, current_user.id, payload, db)
