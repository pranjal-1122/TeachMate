from datetime import datetime, date, timedelta, timezone
from typing import List, Tuple, Dict, Any, Optional
from sqlalchemy.orm import Session as DBSession
from sqlalchemy import func
import zoneinfo

from app.models.entities import (
    User, Lesson, MicroLessonCard, LessonProgress,
    UserDailyActivity, BadgeDefinition, UserBadge, QuizAttempt
)
from app.schemas.progress import (
    CardProgressPayload, CardProgressResponse, StreakInfo,
    BadgeItem, CourseProgressItem, StudentProgressOverview
)
from app.schemas.common import APIException

class ProgressService:
    @staticmethod
    def get_user_today_date(user: User) -> date:
        try:
            tz = zoneinfo.ZoneInfo(user.timezone or "Asia/Kolkata")
        except Exception:
            tz = zoneinfo.ZoneInfo("Asia/Kolkata")
        return datetime.now(tz).date()

    @staticmethod
    def calculate_streak(user_id: str, today: date, db: DBSession) -> Tuple[int, int]:
        """Calculates current streak and longest streak based on calendar days."""
        activities = (
            db.query(UserDailyActivity)
            .filter(UserDailyActivity.user_id == user_id)
            .order_by(UserDailyActivity.activity_date.desc())
            .all()
        )
        if not activities:
            return 0, 0

        active_dates = {a.activity_date for a in activities if (a.cards_completed_count > 0 or a.quizzes_attempted_count > 0)}
        if not active_dates:
            return 0, 0

        # Current streak: checks today or yesterday
        current_streak = 0
        check_date = today
        if check_date not in active_dates:
            check_date = today - timedelta(days=1)

        while check_date in active_dates:
            current_streak += 1
            check_date -= timedelta(days=1)

        # Longest streak calculation
        sorted_dates = sorted(active_dates)
        longest_streak = 0
        temp_streak = 0
        prev_date = None

        for d in sorted_dates:
            if prev_date is None or d == prev_date + timedelta(days=1):
                temp_streak += 1
            else:
                temp_streak = 1
            if temp_streak > longest_streak:
                longest_streak = temp_streak
            prev_date = d

        return current_streak, max(current_streak, longest_streak)

    @staticmethod
    def award_badge_if_qualified(user_id: str, badge_id: str, db: DBSession) -> bool:
        """Idempotently award a badge to the user."""
        existing = db.query(UserBadge).filter(UserBadge.user_id == user_id, UserBadge.badge_id == badge_id).first()
        if existing:
            return False
        b_def = db.query(BadgeDefinition).filter(BadgeDefinition.id == badge_id).first()
        if not b_def:
            return False
        user_badge = UserBadge(user_id=user_id, badge_id=badge_id)
        db.add(user_badge)
        return True

    @staticmethod
    def record_card_progress(
        lesson_id: str,
        user_id: str,
        payload: CardProgressPayload,
        db: DBSession
    ) -> CardProgressResponse:
        lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
        if not lesson:
            raise APIException(status_code=404, code="LESSON_NOT_FOUND", message="Lesson not found.")

        card = db.query(MicroLessonCard).filter(
            MicroLessonCard.id == payload.card_id,
            MicroLessonCard.lesson_id == lesson_id
        ).first()
        if not card:
            raise APIException(status_code=404, code="CARD_NOT_FOUND", message="Micro-lesson card not found.")

        user = db.query(User).filter(User.id == user_id).first()

        # Idempotently record progress
        progress_record = db.query(LessonProgress).filter(
            LessonProgress.user_id == user_id,
            LessonProgress.card_id == payload.card_id
        ).first()

        if not progress_record:
            progress_record = LessonProgress(
                user_id=user_id,
                lesson_id=lesson_id,
                card_id=payload.card_id,
                completed=payload.completed
            )
            db.add(progress_record)
        else:
            progress_record.completed = payload.completed

        # Update user's daily activity
        today = ProgressService.get_user_today_date(user)
        daily_act = (
            db.query(UserDailyActivity)
            .filter(UserDailyActivity.user_id == user_id, UserDailyActivity.activity_date == today)
            .first()
        )
        if not daily_act:
            daily_act = UserDailyActivity(
                user_id=user_id,
                activity_date=today,
                cards_completed_count=1
            )
            db.add(daily_act)
        else:
            daily_act.cards_completed_count += 1

        db.flush()

        # Compute completion stats
        total_cards = len(lesson.cards)
        completed_cards = (
            db.query(LessonProgress)
            .filter(
                LessonProgress.user_id == user_id,
                LessonProgress.lesson_id == lesson_id,
                LessonProgress.completed.is_(True)
            )
            .count()
        )
        progress_percent = round((completed_cards / total_cards) * 100) if total_cards > 0 else 0

        # Calculate streak
        current_streak, _ = ProgressService.calculate_streak(user_id, today, db)

        earned_badges = []

        # Check badges:
        # 1. consistent_learner (3 consecutive days)
        if current_streak >= 3:
            if ProgressService.award_badge_if_qualified(user_id, "consistent_learner", db):
                earned_badges.append("consistent_learner")

        # 2. first_lesson & lesson_finisher (completed all cards in lesson)
        if completed_cards >= total_cards and total_cards > 0:
            # Check how many distinct lessons user has completed
            finished_lessons_count = (
                db.query(LessonProgress.lesson_id)
                .filter(LessonProgress.user_id == user_id, LessonProgress.completed.is_(True))
                .group_by(LessonProgress.lesson_id)
                .having(func.count(LessonProgress.card_id) >= total_cards)
                .count()
            )

            if finished_lessons_count >= 1:
                if ProgressService.award_badge_if_qualified(user_id, "first_lesson", db):
                    earned_badges.append("first_lesson")

            if finished_lessons_count >= 5:
                if ProgressService.award_badge_if_qualified(user_id, "lesson_finisher", db):
                    earned_badges.append("lesson_finisher")

        db.commit()

        return CardProgressResponse(
            completed_cards=completed_cards,
            total_cards=total_cards,
            progress_percent=progress_percent,
            streak=current_streak,
            earned_badges=earned_badges
        )

    @staticmethod
    def get_progress_overview(user_id: str, db: DBSession) -> StudentProgressOverview:
        user = db.query(User).filter(User.id == user_id).first()
        today = ProgressService.get_user_today_date(user)
        current_streak, longest_streak = ProgressService.calculate_streak(user_id, today, db)

        # Courses progress
        lessons = db.query(Lesson).filter(Lesson.visibility == "published").all()
        courses = []
        for l in lessons:
            total = len(l.cards)
            if total == 0:
                continue
            completed = (
                db.query(LessonProgress)
                .filter(
                    LessonProgress.user_id == user_id,
                    LessonProgress.lesson_id == l.id,
                    LessonProgress.completed.is_(True)
                )
                .count()
            )
            pct = round((completed / total) * 100) if total > 0 else 0
            latest = (
                db.query(LessonProgress)
                .filter(LessonProgress.user_id == user_id, LessonProgress.lesson_id == l.id)
                .order_by(LessonProgress.completed_at.desc())
                .first()
            )
            courses.append(CourseProgressItem(
                lesson_id=l.id,
                title=l.title,
                subject=l.subject,
                grade_level=l.grade_level,
                completed_cards=completed,
                total_cards=total,
                progress_percent=pct,
                last_completed_at=latest.completed_at if latest else None
            ))

        # Badges list
        all_defs = db.query(BadgeDefinition).all()
        user_badges_map = {b.badge_id: b.earned_at for b in user.user_badges}
        badges = []
        for b in all_defs:
            is_earned = b.id in user_badges_map
            badges.append(BadgeItem(
                id=b.id,
                name=b.name,
                description=b.description,
                icon=b.icon,
                criteria_type=b.criteria_type,
                criteria_threshold=b.criteria_threshold,
                earned=is_earned,
                earned_at=user_badges_map.get(b.id)
            ))

        # Aggregate counts
        total_quizzes = db.query(QuizAttempt).filter(QuizAttempt.user_id == user_id).count()
        total_lessons_done = sum(1 for c in courses if c.completed_cards >= c.total_cards and c.total_cards > 0)

        latest_activity = (
            db.query(UserDailyActivity)
            .filter(UserDailyActivity.user_id == user_id)
            .order_by(UserDailyActivity.activity_date.desc())
            .first()
        )

        return StudentProgressOverview(
            courses=courses,
            streak=StreakInfo(
                current=current_streak,
                longest=longest_streak,
                last_active_date=latest_activity.activity_date if latest_activity else None
            ),
            badges=badges,
            total_lessons_completed=total_lessons_done,
            total_quizzes_attempted=total_quizzes
        )

    @staticmethod
    def get_badges_list(user_id: str, db: DBSession) -> List[BadgeItem]:
        user = db.query(User).filter(User.id == user_id).first()
        all_defs = db.query(BadgeDefinition).all()
        user_badges_map = {b.badge_id: b.earned_at for b in user.user_badges}
        result = []
        for b in all_defs:
            is_earned = b.id in user_badges_map
            result.append(BadgeItem(
                id=b.id,
                name=b.name,
                description=b.description,
                icon=b.icon,
                criteria_type=b.criteria_type,
                criteria_threshold=b.criteria_threshold,
                earned=is_earned,
                earned_at=user_badges_map.get(b.id)
            ))
        return result
