import logging
from typing import List, Dict, Any
from sqlalchemy.orm import Session as DBSession
from app.models.entities import (
    Session, AssessmentQuestion, AssessmentAnswer,
    KnowledgeAnalysis, RevisionRound, AgentRun
)
from app.schemas.session import (
    SessionCreate, SubmitAnswersPayload, AnalysisDetailResponse,
    KnowledgeGapItem, PerQuestionFeedbackItem, RevisionDetailResponse,
    QuickCheckQuestion, SubmitReassessmentPayload, TeacherDecisionPayload
)
from app.schemas.common import APIException
from app.llm.router import get_llm_client
from app.agents.assessment import AssessmentAgent
from app.agents.analyzer import KnowledgeAnalyzerAgent
from app.agents.revision import RevisionAgent

logger = logging.getLogger(__name__)

class SessionService:
    @staticmethod
    async def create_session(user_id: str, payload: SessionCreate, db: DBSession) -> Session:
        session = Session(
            user_id=user_id,
            topic=payload.topic.strip(),
            subject=payload.subject.strip(),
            grade_level=payload.grade_level.strip(),
            duration_minutes=payload.duration_minutes,
            status="generating_assessment",
            version=1
        )
        db.add(session)
        db.commit()
        db.refresh(session)

        # Generate exactly 5 assessment questions
        llm = get_llm_client()
        agent = AssessmentAgent(llm)
        try:
            assessment_data, usage = await agent.generate_questions(
                topic=session.topic,
                subject=session.subject,
                grade_level=session.grade_level,
                duration_minutes=session.duration_minutes
            )

            # Persist questions
            for q in assessment_data.questions:
                db_q = AssessmentQuestion(
                    session_id=session.id,
                    position=q.position,
                    question=q.question,
                    concept=q.concept,
                    difficulty=q.difficulty,
                    type=q.type,
                    rubric_criteria=q.rubric_criteria,
                    reference_explanation=q.reference_explanation
                )
                db.add(db_q)

            # Record agent run
            run = AgentRun(
                session_id=session.id,
                agent_name="assessment_agent",
                model=usage.model,
                input_tokens=usage.input_tokens,
                output_tokens=usage.output_tokens,
                latency_ms=usage.latency_ms
            )
            db.add(run)

            session.status = "awaiting_teacher_answers"
            session.version += 1
            db.commit()
            db.refresh(session)
            return session

        except Exception as e:
            session.status = "failed"
            db.commit()
            logger.error(f"Failed to generate assessment for session {session.id}: {e}", exc_info=True)
            raise APIException(
                status_code=500,
                code="ASSESSMENT_GENERATION_FAILED",
                message=f"Could not generate assessment questions: {str(e)}"
            )

    @staticmethod
    def get_session(session_id: str, user_id: str, db: DBSession) -> Session:
        session = db.query(Session).filter(Session.id == session_id).first()
        if not session:
            raise APIException(
                status_code=404,
                code="SESSION_NOT_FOUND",
                message="Teaching session not found."
            )
        if session.user_id != user_id:
            raise APIException(
                status_code=404,  # Privacy-preserving 404
                code="SESSION_NOT_FOUND",
                message="Teaching session not found."
            )
        return session

    @staticmethod
    def get_assessment_questions(session_id: str, user_id: str, db: DBSession) -> List[AssessmentQuestion]:
        session = SessionService.get_session(session_id, user_id, db)
        if session.status == "generating_assessment":
            raise APIException(
                status_code=409,
                code="ASSESSMENT_NOT_READY",
                message="Assessment questions are still being generated. Please poll again in a moment."
            )
        return session.questions

    @staticmethod
    async def submit_answers(
        session_id: str,
        user_id: str,
        payload: SubmitAnswersPayload,
        db: DBSession
    ) -> Session:
        session = SessionService.get_session(session_id, user_id, db)

        # Status guard
        if session.status != "awaiting_teacher_answers":
            raise APIException(
                status_code=409,
                code="INVALID_SESSION_STATE",
                message=f"Session is currently in status '{session.status}'. Answers can only be submitted in 'awaiting_teacher_answers' status."
            )

        # Optimistic locking
        if payload.expected_version != session.version:
            raise APIException(
                status_code=409,
                code="VERSION_CONFLICT",
                message="Session has been modified by another action. Please refresh and review your answers.",
                details={"current_version": session.version, "expected_version": payload.expected_version}
            )

        # Validate that all 5 questions belonging to this session are answered
        db_questions = {q.id: q for q in session.questions}
        submitted_q_ids = [a.question_id for a in payload.answers]

        if len(submitted_q_ids) != 5 or len(set(submitted_q_ids)) != 5:
            raise APIException(
                status_code=400,
                code="INVALID_ANSWER_COUNT",
                message="Exactly 5 distinct answer submissions corresponding to the assessment questions are required."
            )

        missing_ids = [qid for qid in db_questions if qid not in submitted_q_ids]
        if missing_ids:
            raise APIException(
                status_code=400,
                code="VALIDATION_ERROR",
                message="Answers are incomplete or reference invalid questions.",
                details={"missing_question_ids": missing_ids}
            )

        # Clear existing answers if any re-try occurred
        db.query(AssessmentAnswer).filter(AssessmentAnswer.session_id == session.id).delete()

        # Prepare payload for analysis agent
        analysis_input = []
        for ans in payload.answers:
            q = db_questions[ans.question_id]
            db_answer = AssessmentAnswer(
                session_id=session.id,
                question_id=q.id,
                answer_text=ans.text.strip(),
                score=0.0
            )
            db.add(db_answer)
            analysis_input.append({
                "position": q.position,
                "question": q.question,
                "concept": q.concept,
                "difficulty": q.difficulty,
                "rubric_criteria": q.rubric_criteria,
                "reference_explanation": q.reference_explanation,
                "answer_text": ans.text.strip(),
                "db_answer": db_answer
            })

        session.status = "analyzing"
        db.commit()

        # Run Knowledge Analyzer Agent
        llm = get_llm_client()
        analyzer = KnowledgeAnalyzerAgent(llm)
        try:
            analysis_result, usage = await analyzer.analyze_answers(
                topic=session.topic,
                subject=session.subject,
                questions_with_answers=analysis_input
            )

            # Update per-question scores and feedback in DB
            feedback_by_pos = {item.question_position: item for item in analysis_result.per_question_feedback}
            for item in analysis_input:
                q_pos = item["position"]
                if q_pos in feedback_by_pos:
                    fb = feedback_by_pos[q_pos]
                    item["db_answer"].score = fb.score
                    item["db_answer"].feedback = f"{fb.feedback} (Evidence: {fb.evidence})"

            # Decide next action using deterministic routing
            score = analysis_result.score
            session.score = score

            if score >= 80.0:
                next_action = "LESSON"
                session.status = "generating_lesson"
            elif session.revision_rounds_completed < 3:
                next_action = "REVISION"
                # Generate targeted revision immediately
                session.revision_rounds_completed += 1
                rev_agent = RevisionAgent(llm)
                rev_data, rev_usage = await rev_agent.generate_revision(
                    topic=session.topic,
                    subject=session.subject,
                    knowledge_gaps=[g.model_dump() for g in analysis_result.knowledge_gaps],
                    round_number=session.revision_rounds_completed
                )
                rev_db = RevisionRound(
                    session_id=session.id,
                    round_number=session.revision_rounds_completed,
                    content_markdown=rev_data.content_markdown,
                    quick_check_questions=[q.model_dump() for q in rev_data.quick_check_questions]
                )
                db.add(rev_db)
                session.status = "awaiting_reassessment"
            else:
                next_action = "CHOICE"
                session.status = "awaiting_teacher_choice"

            # Persist knowledge analysis record
            analysis_db = KnowledgeAnalysis(
                session_id=session.id,
                round_number=session.revision_rounds_completed,
                score=score,
                strengths=analysis_result.strengths,
                knowledge_gaps=[g.model_dump() for g in analysis_result.knowledge_gaps],
                per_question_feedback=[f.model_dump() for f in analysis_result.per_question_feedback],
                next_action=next_action
            )
            db.add(analysis_db)

            # Record agent run
            run = AgentRun(
                session_id=session.id,
                agent_name="knowledge_analyzer_agent",
                model=usage.model,
                input_tokens=usage.input_tokens,
                output_tokens=usage.output_tokens,
                latency_ms=usage.latency_ms
            )
            db.add(run)

            session.version += 1
            db.commit()
            db.refresh(session)
            return session

        except Exception as e:
            session.status = "awaiting_teacher_answers"  # Revert so teacher can re-submit
            db.commit()
            logger.error(f"Analysis failed for session {session.id}: {e}", exc_info=True)
            raise APIException(
                status_code=500,
                code="ANALYSIS_FAILED",
                message=f"Failed to analyze answers against rubrics: {str(e)}"
            )

    @staticmethod
    def get_revision(session_id: str, user_id: str, db: DBSession) -> RevisionDetailResponse:
        session = SessionService.get_session(session_id, user_id, db)
        latest_rev = (
            db.query(RevisionRound)
            .filter(RevisionRound.session_id == session.id)
            .order_by(RevisionRound.round_number.desc())
            .first()
        )
        if not latest_rev:
            raise APIException(
                status_code=409,
                code="REVISION_NOT_AVAILABLE",
                message="Revision material is not currently available for this session."
            )
        qc_questions = [QuickCheckQuestion(**q) for q in latest_rev.quick_check_questions]
        return RevisionDetailResponse(
            round=latest_rev.round_number,
            content=latest_rev.content_markdown,
            quick_check_questions=qc_questions,
            status=session.status
        )

    @staticmethod
    async def submit_reassessment(
        session_id: str,
        user_id: str,
        payload: SubmitReassessmentPayload,
        db: DBSession
    ) -> Session:
        session = SessionService.get_session(session_id, user_id, db)

        if session.status != "awaiting_reassessment":
            raise APIException(
                status_code=409,
                code="INVALID_SESSION_STATE",
                message=f"Session is in status '{session.status}'. Reassessment is only permitted in 'awaiting_reassessment' status."
            )

        if payload.expected_version != session.version:
            raise APIException(
                status_code=409,
                code="VERSION_CONFLICT",
                message="Session version mismatch. Please refresh the page.",
                details={"current_version": session.version, "expected_version": payload.expected_version}
            )

        latest_rev = (
            db.query(RevisionRound)
            .filter(RevisionRound.session_id == session.id)
            .order_by(RevisionRound.round_number.desc())
            .first()
        )
        if not latest_rev:
            raise APIException(status_code=500, code="REVISION_STATE_ERROR", message="Revision round not found.")

        # Save teacher's quick check answers
        latest_rev.quick_check_answers = [a.model_dump() for a in payload.answers]

        # Format items for analyzer
        qc_map = {q["id"]: q for q in latest_rev.quick_check_questions}
        qa_list = []
        for idx, a in enumerate(payload.answers, 1):
            qc = qc_map.get(a.question_id, {"prompt": "Quick Check Question", "concept": "Targeted Concept"})
            qa_list.append({
                "position": idx,
                "question": qc.get("prompt", "Question"),
                "concept": qc.get("concept", "Concept"),
                "difficulty": "medium",
                "rubric_criteria": "Teacher demonstrates accurate conceptual resolution of the targeted gap.",
                "reference_explanation": "Clear, direct understanding without misconception.",
                "answer_text": a.text
            })

        llm = get_llm_client()
        analyzer = KnowledgeAnalyzerAgent(llm)
        analysis_result, usage = await analyzer.analyze_answers(
            topic=session.topic,
            subject=session.subject,
            questions_with_answers=qa_list
        )

        score = analysis_result.score
        session.score = score

        if score >= 80.0:
            next_action = "LESSON"
            session.status = "generating_lesson"
        elif session.revision_rounds_completed < 3:
            next_action = "REVISION"
            session.revision_rounds_completed += 1
            rev_agent = RevisionAgent(llm)
            rev_data, rev_usage = await rev_agent.generate_revision(
                topic=session.topic,
                subject=session.subject,
                knowledge_gaps=[g.model_dump() for g in analysis_result.knowledge_gaps],
                round_number=session.revision_rounds_completed
            )
            new_rev_db = RevisionRound(
                session_id=session.id,
                round_number=session.revision_rounds_completed,
                content_markdown=rev_data.content_markdown,
                quick_check_questions=[q.model_dump() for q in rev_data.quick_check_questions]
            )
            db.add(new_rev_db)
            session.status = "awaiting_reassessment"
        else:
            # 3 rounds completed and still < 80!
            next_action = "CHOICE"
            session.status = "awaiting_teacher_choice"

        # Record analysis
        analysis_db = KnowledgeAnalysis(
            session_id=session.id,
            round_number=session.revision_rounds_completed,
            score=score,
            strengths=analysis_result.strengths,
            knowledge_gaps=[g.model_dump() for g in analysis_result.knowledge_gaps],
            per_question_feedback=[f.model_dump() for f in analysis_result.per_question_feedback],
            next_action=next_action
        )
        db.add(analysis_db)

        session.version += 1
        db.commit()
        db.refresh(session)
        return session

    @staticmethod
    def submit_decision(
        session_id: str,
        user_id: str,
        payload: TeacherDecisionPayload,
        db: DBSession
    ) -> Session:
        session = SessionService.get_session(session_id, user_id, db)

        if payload.expected_version != session.version:
            raise APIException(
                status_code=409,
                code="VERSION_CONFLICT",
                message="Session version mismatch. Please refresh.",
                details={"current_version": session.version, "expected_version": payload.expected_version}
            )

        if session.status not in ("awaiting_teacher_choice", "awaiting_reassessment"):
            raise APIException(
                status_code=409,
                code="INVALID_SESSION_STATE",
                message=f"Decisions can only be recorded when awaiting teacher choice, not in '{session.status}'."
            )

        if payload.action == "proceed_anyway":
            if not payload.acknowledge_incomplete_readiness:
                raise APIException(
                    status_code=400,
                    code="ACKNOWLEDGMENT_REQUIRED",
                    message="You must explicitly acknowledge incomplete readiness to proceed with lesson generation."
                )
            session.readiness_override = True
            session.status = "generating_lesson"

        elif payload.action == "continue_revision":
            # Allow continuing revision
            session.status = "awaiting_reassessment"

        elif payload.action == "save_for_later":
            session.status = "saved"

        session.version += 1
        db.commit()
        db.refresh(session)
        return session

    @staticmethod
    def get_analysis(session_id: str, user_id: str, db: DBSession) -> AnalysisDetailResponse:
        session = SessionService.get_session(session_id, user_id, db)
        latest_analysis = (
            db.query(KnowledgeAnalysis)
            .filter(KnowledgeAnalysis.session_id == session.id)
            .order_by(KnowledgeAnalysis.created_at.desc())
            .first()
        )
        if not latest_analysis:
            raise APIException(
                status_code=409,
                code="ANALYSIS_NOT_AVAILABLE",
                message="Analysis is not yet available for this session. Submit answers first."
            )

        gaps = [KnowledgeGapItem(**g) for g in latest_analysis.knowledge_gaps]
        feedback = [PerQuestionFeedbackItem(**f) for f in latest_analysis.per_question_feedback]

        return AnalysisDetailResponse(
            score=latest_analysis.score,
            strengths=latest_analysis.strengths,
            gaps=gaps,
            per_question_feedback=feedback,
            next_action=latest_analysis.next_action
        )

    @staticmethod
    def list_sessions(user_id: str, db: DBSession) -> List[Session]:
        return (
            db.query(Session)
            .filter(Session.user_id == user_id)
            .order_by(Session.created_at.desc())
            .all()
        )
