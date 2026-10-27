import logging
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session as DBSession
from app.models.entities import (
    Session, Lesson, MicroLessonCard, Quiz, QuizQuestion,
    AgentRun, User
)
from app.schemas.lesson import (
    LessonDetail, LessonSessionResponse, LessonUpdatePayload,
    LessonCatalogItem, LessonCatalogResponse, PublishedLessonView,
    MicroLessonCardResponse
)
from app.schemas.common import APIException
from app.llm.router import get_llm_client
from app.agents.lesson import LessonAgent
from app.agents.quiz import QuizAgent

logger = logging.getLogger(__name__)

class LessonService:
    @staticmethod
    async def generate_lesson_and_quiz_if_needed(session: Session, db: DBSession) -> Lesson:
        """Generates the structured lesson, micro-learning cards, and quiz for a ready session."""
        existing_lesson = db.query(Lesson).filter(Lesson.session_id == session.id).first()
        if existing_lesson:
            return existing_lesson

        llm = get_llm_client()
        lesson_agent = LessonAgent(llm)

        # Retrieve knowledge gaps from latest analysis
        latest_analysis = session.analyses[-1] if session.analyses else None
        gaps = latest_analysis.knowledge_gaps if latest_analysis else []

        lesson_resp, usage = await lesson_agent.generate_lesson(
            topic=session.topic,
            subject=session.subject,
            grade_level=session.grade_level,
            duration_minutes=session.duration_minutes,
            knowledge_gaps=gaps,
            readiness_override=session.readiness_override
        )

        db_lesson = Lesson(
            session_id=session.id,
            teacher_id=session.user_id,
            title=lesson_resp.title,
            topic=session.topic,
            subject=session.subject,
            grade_level=session.grade_level,
            duration_minutes=session.duration_minutes,
            objectives=lesson_resp.objectives,
            sections=[s.model_dump() for s in lesson_resp.sections],
            visual_specs=[v.model_dump() for v in lesson_resp.visual_specs],
            activities=[a.model_dump() for a in lesson_resp.activities],
            summary=lesson_resp.summary,
            visibility="draft",
            readiness_override=session.readiness_override
        )
        db.add(db_lesson)
        db.flush()  # Flush to generate db_lesson.id

        # Generate MicroLessonCards for Student Scroll-Learning
        cards = []
        pos = 1

        # Card 1: Objectives & The Hook
        hook_section = next((s for s in lesson_resp.sections if "hook" in s.heading.lower()), lesson_resp.sections[0])
        cards.append(MicroLessonCard(
            lesson_id=db_lesson.id,
            position=pos,
            card_type="concept",
            title="Lesson Objectives & The Hook",
            content_markdown=f"### Objectives\n" + "\n".join(f"- {o}" for o in lesson_resp.objectives) + f"\n\n### The Phenomenon\n{hook_section.content}",
            estimated_read_time_seconds=60
        ))
        pos += 1

        # Card 2: Narrative & Breakthrough
        story_section = next((s for s in lesson_resp.sections if "story" in s.heading.lower() or "galileo" in s.heading.lower() or "breakthrough" in s.heading.lower()), None)
        if story_section:
            cards.append(MicroLessonCard(
                lesson_id=db_lesson.id,
                position=pos,
                card_type="example",
                title=story_section.heading,
                content_markdown=story_section.content,
                estimated_read_time_seconds=90
            ))
            pos += 1

        # Card 3: Visual Diagram Specification
        for v in lesson_resp.visual_specs:
            cards.append(MicroLessonCard(
                lesson_id=db_lesson.id,
                position=pos,
                card_type="diagram",
                title=v.title,
                content_markdown=f"Study this interactive diagram to understand how forces and mass relate:\n\n```mermaid\n{v.spec}\n```",
                media_spec={"diagram_type": v.type, "spec": v.spec},
                estimated_read_time_seconds=45
            ))
            pos += 1

        # Card 4: Conceptual Deep Dive
        for s in lesson_resp.sections:
            if s != hook_section and s != story_section:
                cards.append(MicroLessonCard(
                    lesson_id=db_lesson.id,
                    position=pos,
                    card_type="concept",
                    title=s.heading,
                    content_markdown=s.content,
                    estimated_read_time_seconds=90
                ))
                pos += 1

        # Card 5: Classroom Hands-On Experiment
        if lesson_resp.activities:
            act = lesson_resp.activities[0]
            cards.append(MicroLessonCard(
                lesson_id=db_lesson.id,
                position=pos,
                card_type="micro_quiz",
                title=f"Experiment: {act.title}",
                content_markdown=f"**Class Activity ({act.duration_minutes} min)**\n\n{act.instructions}",
                estimated_read_time_seconds=60
            ))
            pos += 1

        # Card 6: Summary & Core Takeaways
        cards.append(MicroLessonCard(
            lesson_id=db_lesson.id,
            position=pos,
            card_type="reflection",
            title="Summary & Core Takeaway",
            content_markdown=lesson_resp.summary,
            estimated_read_time_seconds=45
        ))

        for c in cards:
            db.add(c)

        # Generate Student Quiz
        quiz_agent = QuizAgent(llm)
        quiz_resp, q_usage = await quiz_agent.generate_quiz({
            "title": db_lesson.title,
            "topic": db_lesson.topic,
            "objectives": db_lesson.objectives,
            "summary": db_lesson.summary
        })

        db_quiz = Quiz(
            lesson_id=db_lesson.id,
            title=quiz_resp.title
        )
        db.add(db_quiz)
        db.flush()

        for q in quiz_resp.questions:
            db_q = QuizQuestion(
                quiz_id=db_quiz.id,
                position=q.position,
                question_text=q.question_text,
                options=[opt.model_dump() for opt in q.options],
                correct_option_id=q.correct_option_id,  # PRIVATE SERVER-SIDE KEY
                explanation=q.explanation
            )
            db.add(db_q)

        session.status = "draft_ready"
        session.version += 1
        db.commit()
        db.refresh(db_lesson)
        return db_lesson

    @staticmethod
    async def get_session_lesson(session_id: str, user_id: str, db: DBSession) -> LessonSessionResponse:
        session = db.query(Session).filter(Session.id == session_id).first()
        if not session or session.user_id != user_id:
            raise APIException(status_code=404, code="SESSION_NOT_FOUND", message="Session not found.")

        if session.status in ("generating_lesson", "draft_ready", "published"):
            lesson = await LessonService.generate_lesson_and_quiz_if_needed(session, db)
            return LessonSessionResponse(
                lesson=LessonDetail.model_validate(lesson),
                readiness_override=lesson.readiness_override
            )
        else:
            raise APIException(
                status_code=409,
                code="LESSON_NOT_READY",
                message=f"Lesson is not yet available. Current status is '{session.status}'."
            )

    @staticmethod
    def update_lesson(
        session_id: str,
        user_id: str,
        payload: LessonUpdatePayload,
        db: DBSession
    ) -> LessonDetail:
        session = db.query(Session).filter(Session.id == session_id).first()
        if not session or session.user_id != user_id:
            raise APIException(status_code=404, code="SESSION_NOT_FOUND", message="Session not found.")

        if payload.expected_version != session.version:
            raise APIException(
                status_code=409,
                code="VERSION_CONFLICT",
                message="Session version mismatch. Please refresh.",
                details={"current_version": session.version, "expected_version": payload.expected_version}
            )

        lesson = db.query(Lesson).filter(Lesson.session_id == session.id).first()
        if not lesson:
            raise APIException(status_code=404, code="LESSON_NOT_FOUND", message="Lesson draft not found.")

        if payload.title is not None:
            lesson.title = payload.title.strip()
        if payload.objectives is not None:
            lesson.objectives = payload.objectives
        if payload.sections is not None:
            lesson.sections = [s.model_dump() for s in payload.sections]
        if payload.summary is not None:
            lesson.summary = payload.summary.strip()

        session.version += 1
        db.commit()
        db.refresh(lesson)
        return LessonDetail.model_validate(lesson)

    @staticmethod
    def publish_lesson(session_id: str, user_id: str, expected_version: int, db: DBSession) -> Dict[str, Any]:
        session = db.query(Session).filter(Session.id == session_id).first()
        if not session or session.user_id != user_id:
            raise APIException(status_code=404, code="SESSION_NOT_FOUND", message="Session not found.")

        if expected_version != session.version:
            raise APIException(
                status_code=409,
                code="VERSION_CONFLICT",
                message="Session version mismatch. Please refresh.",
                details={"current_version": session.version, "expected_version": expected_version}
            )

        lesson = db.query(Lesson).filter(Lesson.session_id == session.id).first()
        if not lesson:
            raise APIException(status_code=404, code="LESSON_NOT_FOUND", message="Lesson draft not found.")

        lesson.visibility = "published"
        session.status = "published"
        session.version += 1
        db.commit()

        return {
            "lesson_id": lesson.id,
            "visibility": "published",
            "version": session.version
        }

    @staticmethod
    def list_catalog(
        subject: Optional[str] = None,
        grade_level: Optional[str] = None,
        query: Optional[str] = None,
        db: DBSession = None
    ) -> LessonCatalogResponse:
        q = db.query(Lesson).filter(Lesson.visibility == "published")
        if subject:
            q = q.filter(Lesson.subject.ilike(f"%{subject}%"))
        if grade_level:
            q = q.filter(Lesson.grade_level.ilike(f"%{grade_level}%"))
        if query:
            q = q.filter((Lesson.title.ilike(f"%{query}%")) | (Lesson.topic.ilike(f"%{query}%")))

        lessons = q.order_by(Lesson.created_at.desc()).limit(50).all()
        items = []
        for l in lessons:
            teacher_name = l.teacher.display_name if l.teacher else "Instructor"
            items.append(LessonCatalogItem(
                id=l.id,
                title=l.title,
                topic=l.topic,
                subject=l.subject,
                grade_level=l.grade_level,
                duration_minutes=l.duration_minutes,
                readiness_override=l.readiness_override,
                teacher_name=teacher_name,
                card_count=len(l.cards),
                created_at=l.created_at
            ))
        return LessonCatalogResponse(items=items)

    @staticmethod
    def get_lesson_view(lesson_id: str, current_user: Optional[User], db: DBSession) -> PublishedLessonView:
        lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
        if not lesson:
            raise APIException(status_code=404, code="LESSON_NOT_FOUND", message="Lesson not found.")

        is_owner = current_user and current_user.id == lesson.teacher_id

        # If still draft, only owner can view
        if lesson.visibility == "draft" and not is_owner:
            raise APIException(status_code=404, code="LESSON_NOT_FOUND", message="Lesson not found.")

        cards = [MicroLessonCardResponse.model_validate(c) for c in lesson.cards]
        has_quiz = lesson.quiz is not None and len(lesson.quiz.questions) > 0

        return PublishedLessonView(
            lesson=LessonDetail.model_validate(lesson),
            micro_lessons=cards,
            quiz_available=has_quiz,
            is_teacher_owner=bool(is_owner)
        )
