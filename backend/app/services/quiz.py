from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session as DBSession
from app.models.entities import (
    Quiz, QuizQuestion, QuizAttempt, User, UserDailyActivity,
    BadgeDefinition, UserBadge
)
from app.schemas.quiz import (
    PublicQuizPayload, PublicQuizQuestion, QuizOption,
    QuizAttemptPayload, QuizAttemptResult, QuestionFeedbackItem
)
from app.schemas.common import APIException

class QuizService:
    @staticmethod
    def get_quiz_for_lesson(lesson_id: str, db: DBSession) -> PublicQuizPayload:
        quiz = db.query(Quiz).filter(Quiz.lesson_id == lesson_id).first()
        if not quiz or not quiz.questions:
            raise APIException(status_code=404, code="QUIZ_NOT_FOUND", message="Quiz not found for this lesson.")

        public_questions = []
        for q in quiz.questions:
            opts = [QuizOption(**opt) for opt in q.options]
            # STRICT REQUIREMENT: correct_option_id is NEVER exposed in public GET
            public_questions.append(PublicQuizQuestion(
                id=q.id,
                position=q.position,
                question_text=q.question_text,
                options=opts
            ))

        return PublicQuizPayload(
            quiz_id=quiz.id,
            title=quiz.title,
            questions=public_questions
        )

    @staticmethod
    def submit_quiz_attempt(
        quiz_id: str,
        user_id: str,
        payload: QuizAttemptPayload,
        db: DBSession
    ) -> QuizAttemptResult:
        quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
        if not quiz:
            raise APIException(status_code=404, code="QUIZ_NOT_FOUND", message="Quiz not found.")

        questions_by_id = {q.id: q for q in quiz.questions}
        if not questions_by_id:
            raise APIException(status_code=400, code="EMPTY_QUIZ", message="Quiz contains no questions.")

        total_questions = len(questions_by_id)
        correct_count = 0
        feedback_items = []

        # Python grades deterministically against server-side private answers
        submitted_answers_map = {a.question_id: a.selected_option_id for a in payload.answers}

        for qid, q in questions_by_id.items():
            selected_opt = submitted_answers_map.get(qid, "")
            is_correct = (selected_opt.strip().lower() == q.correct_option_id.strip().lower())
            if is_correct:
                correct_count += 1

            feedback_items.append(QuestionFeedbackItem(
                question_id=qid,
                correct=is_correct,
                selected_option_id=selected_opt,
                correct_option_id=q.correct_option_id,
                explanation=q.explanation
            ))

        score = round((correct_count / total_questions) * 100.0, 1)

        # Record attempt
        attempt = QuizAttempt(
            quiz_id=quiz.id,
            user_id=user_id,
            score=score,
            correct_count=correct_count,
            total_questions=total_questions,
            answers=[a.model_dump() for a in payload.answers]
        )
        db.add(attempt)

        # Gamification: Update user daily activity
        today_date = datetime.now(timezone.utc).date()
        daily_act = (
            db.query(UserDailyActivity)
            .filter(UserDailyActivity.user_id == user_id, UserDailyActivity.activity_date == today_date)
            .first()
        )
        if not daily_act:
            daily_act = UserDailyActivity(
                user_id=user_id,
                activity_date=today_date,
                quizzes_attempted_count=1
            )
            db.add(daily_act)
        else:
            daily_act.quizzes_attempted_count += 1

        db.flush()

        # Check badge criteria: quiz_explorer (5 quizzes attempted)
        earned_badges = []
        total_quiz_attempts = db.query(QuizAttempt).filter(QuizAttempt.user_id == user_id).count()
        if total_quiz_attempts >= 5:
            existing_badge = (
                db.query(UserBadge)
                .filter(UserBadge.user_id == user_id, UserBadge.badge_id == "quiz_explorer")
                .first()
            )
            if not existing_badge:
                user_badge = UserBadge(user_id=user_id, badge_id="quiz_explorer")
                db.add(user_badge)
                earned_badges.append("quiz_explorer")

        db.commit()

        return QuizAttemptResult(
            score=score,
            correct_count=correct_count,
            total=total_questions,
            feedback=feedback_items,
            earned_badges=earned_badges
        )
