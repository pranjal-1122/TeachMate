from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session as DBSession
from app.database.connection import get_db
from app.models.entities import User
from app.services.auth import require_teacher
from app.services.session import SessionService
from app.schemas.session import (
    SessionCreate, SessionResponse, AssessmentPayload,
    PublicAssessmentQuestion, SubmitAnswersPayload, AnalysisDetailResponse,
    RevisionDetailResponse, SubmitReassessmentPayload, TeacherDecisionPayload
)

router = APIRouter(prefix="/sessions", tags=["Teacher Sessions"])

@router.get("", response_model=List[SessionResponse])
def list_sessions(
    current_user: User = Depends(require_teacher),
    db: DBSession = Depends(get_db)
):
    sessions = SessionService.list_sessions(user_id=current_user.id, db=db)
    return [SessionResponse.model_validate(s) for s in sessions]

@router.post("", response_model=dict, status_code=status.HTTP_202_ACCEPTED)
async def create_session(
    payload: SessionCreate,
    current_user: User = Depends(require_teacher),
    db: DBSession = Depends(get_db)
):
    session = await SessionService.create_session(
        user_id=current_user.id,
        payload=payload,
        db=db
    )
    return {
        "session_id": session.id,
        "status": session.status,
        "topic": session.topic,
        "version": session.version
    }

@router.get("/{session_id}", response_model=SessionResponse)
def get_session(
    session_id: str,
    current_user: User = Depends(require_teacher),
    db: DBSession = Depends(get_db)
):
    session = SessionService.get_session(session_id, current_user.id, db)
    return SessionResponse.model_validate(session)

@router.get("/{session_id}/assessment", response_model=AssessmentPayload)
def get_assessment(
    session_id: str,
    current_user: User = Depends(require_teacher),
    db: DBSession = Depends(get_db)
):
    questions = SessionService.get_assessment_questions(session_id, current_user.id, db)
    session = SessionService.get_session(session_id, current_user.id, db)
    return AssessmentPayload(
        questions=[PublicAssessmentQuestion.model_validate(q) for q in questions],
        status=session.status
    )

@router.post("/{session_id}/answers", response_model=dict, status_code=status.HTTP_202_ACCEPTED)
async def submit_answers(
    session_id: str,
    payload: SubmitAnswersPayload,
    current_user: User = Depends(require_teacher),
    db: DBSession = Depends(get_db)
):
    session = await SessionService.submit_answers(
        session_id=session_id,
        user_id=current_user.id,
        payload=payload,
        db=db
    )
    return {
        "session_id": session.id,
        "status": session.status,
        "score": session.score,
        "version": session.version
    }

@router.get("/{session_id}/analysis", response_model=AnalysisDetailResponse)
def get_analysis(
    session_id: str,
    current_user: User = Depends(require_teacher),
    db: DBSession = Depends(get_db)
):
    return SessionService.get_analysis(session_id, current_user.id, db)

@router.get("/{session_id}/revision", response_model=RevisionDetailResponse)
def get_revision(
    session_id: str,
    current_user: User = Depends(require_teacher),
    db: DBSession = Depends(get_db)
):
    return SessionService.get_revision(session_id, current_user.id, db)

@router.post("/{session_id}/reassessment", response_model=dict, status_code=status.HTTP_202_ACCEPTED)
async def submit_reassessment(
    session_id: str,
    payload: SubmitReassessmentPayload,
    current_user: User = Depends(require_teacher),
    db: DBSession = Depends(get_db)
):
    session = await SessionService.submit_reassessment(
        session_id=session_id,
        user_id=current_user.id,
        payload=payload,
        db=db
    )
    return {
        "session_id": session.id,
        "status": session.status,
        "score": session.score,
        "revision_rounds_completed": session.revision_rounds_completed,
        "version": session.version
    }

@router.post("/{session_id}/decision", response_model=dict)
def submit_decision(
    session_id: str,
    payload: TeacherDecisionPayload,
    current_user: User = Depends(require_teacher),
    db: DBSession = Depends(get_db)
):
    session = SessionService.submit_decision(
        session_id=session_id,
        user_id=current_user.id,
        payload=payload,
        db=db
    )
    return {
        "session_id": session.id,
        "status": session.status,
        "readiness_override": session.readiness_override,
        "version": session.version
    }

