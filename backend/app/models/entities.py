import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Text, ForeignKey,
    DateTime, Date, UniqueConstraint, JSON
)
from sqlalchemy.orm import relationship
from app.database.connection import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    display_name = Column(String(120), nullable=False)
    role = Column(String(20), nullable=False, default="teacher")  # "teacher" or "student"
    timezone = Column(String(60), nullable=False, default="Asia/Kolkata")
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")
    lessons = relationship("Lesson", back_populates="teacher", cascade="all, delete-orphan")
    quiz_attempts = relationship("QuizAttempt", back_populates="user", cascade="all, delete-orphan")
    lesson_progress = relationship("LessonProgress", back_populates="user", cascade="all, delete-orphan")
    user_badges = relationship("UserBadge", back_populates="user", cascade="all, delete-orphan")
    daily_activities = relationship("UserDailyActivity", back_populates="user", cascade="all, delete-orphan")


class Session(Base):
    __tablename__ = "sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    topic = Column(String(255), nullable=False)
    subject = Column(String(100), nullable=False)
    grade_level = Column(String(50), nullable=False)
    duration_minutes = Column(Integer, nullable=False, default=45)
    
    # Status enum: generating_assessment, awaiting_teacher_answers, analyzing,
    # awaiting_reassessment, awaiting_teacher_choice, generating_lesson, draft_ready, published, failed, saved
    status = Column(String(50), nullable=False, default="generating_assessment", index=True)
    score = Column(Float, nullable=True)
    revision_rounds_completed = Column(Integer, nullable=False, default=0)
    readiness_override = Column(Boolean, nullable=False, default=False)
    version = Column(Integer, nullable=False, default=1)  # Optimistic concurrency
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    user = relationship("User", back_populates="sessions")
    questions = relationship("AssessmentQuestion", back_populates="session", cascade="all, delete-orphan", order_by="AssessmentQuestion.position")
    answers = relationship("AssessmentAnswer", back_populates="session", cascade="all, delete-orphan")
    analyses = relationship("KnowledgeAnalysis", back_populates="session", cascade="all, delete-orphan")
    revisions = relationship("RevisionRound", back_populates="session", cascade="all, delete-orphan")
    lesson = relationship("Lesson", back_populates="session", uselist=False, cascade="all, delete-orphan")


class AssessmentQuestion(Base):
    __tablename__ = "assessment_questions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    position = Column(Integer, nullable=False)  # 1 to 5
    question = Column(Text, nullable=False)
    concept = Column(String(150), nullable=False)
    difficulty = Column(String(20), nullable=False)  # easy, medium, hard
    type = Column(String(30), nullable=False)  # conceptual, application, misconception
    rubric_criteria = Column(Text, nullable=False)
    reference_explanation = Column(Text, nullable=True)  # Server-only reference

    session = relationship("Session", back_populates="questions")
    answers = relationship("AssessmentAnswer", back_populates="question", cascade="all, delete-orphan")


class AssessmentAnswer(Base):
    __tablename__ = "assessment_answers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(String(36), ForeignKey("assessment_questions.id", ondelete="CASCADE"), nullable=False)
    answer_text = Column(Text, nullable=False)
    score = Column(Float, nullable=True)  # 0 to 100
    feedback = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    session = relationship("Session", back_populates="answers")
    question = relationship("AssessmentQuestion", back_populates="answers")


class KnowledgeAnalysis(Base):
    __tablename__ = "knowledge_analyses"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    round_number = Column(Integer, nullable=False, default=0)
    score = Column(Float, nullable=False)
    strengths = Column(JSON, nullable=False, default=list)
    knowledge_gaps = Column(JSON, nullable=False, default=list)
    per_question_feedback = Column(JSON, nullable=False, default=list)
    next_action = Column(String(30), nullable=False)  # LESSON, REVISION, CHOICE
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    session = relationship("Session", back_populates="analyses")


class RevisionRound(Base):
    __tablename__ = "revision_rounds"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    round_number = Column(Integer, nullable=False)  # 1, 2, 3
    content_markdown = Column(Text, nullable=False)
    quick_check_questions = Column(JSON, nullable=False, default=list)
    quick_check_answers = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    session = relationship("Session", back_populates="revisions")


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("sessions.id", ondelete="SET NULL"), nullable=True, unique=True)
    teacher_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    topic = Column(String(255), nullable=False)
    subject = Column(String(100), nullable=False)
    grade_level = Column(String(50), nullable=False)
    duration_minutes = Column(Integer, nullable=False, default=45)
    
    objectives = Column(JSON, nullable=False, default=list)
    sections = Column(JSON, nullable=False, default=list)
    visual_specs = Column(JSON, nullable=False, default=list)
    activities = Column(JSON, nullable=False, default=list)
    summary = Column(Text, nullable=False)
    
    visibility = Column(String(20), nullable=False, default="draft", index=True)  # draft, published
    readiness_override = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    teacher = relationship("User", back_populates="lessons")
    session = relationship("Session", back_populates="lesson")
    cards = relationship("MicroLessonCard", back_populates="lesson", cascade="all, delete-orphan", order_by="MicroLessonCard.position")
    quiz = relationship("Quiz", back_populates="lesson", uselist=False, cascade="all, delete-orphan")
    progress_records = relationship("LessonProgress", back_populates="lesson", cascade="all, delete-orphan")


class MicroLessonCard(Base):
    __tablename__ = "micro_lesson_cards"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    lesson_id = Column(String(36), ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, index=True)
    position = Column(Integer, nullable=False)
    card_type = Column(String(30), nullable=False)  # concept, example, diagram, micro_quiz, reflection, video
    title = Column(String(255), nullable=False)
    content_markdown = Column(Text, nullable=False)
    media_spec = Column(JSON, nullable=True)
    estimated_read_time_seconds = Column(Integer, nullable=False, default=60)

    lesson = relationship("Lesson", back_populates="cards")
    progress_records = relationship("LessonProgress", back_populates="card", cascade="all, delete-orphan")


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    lesson_id = Column(String(36), ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, unique=True)
    title = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    lesson = relationship("Lesson", back_populates="quiz")
    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan", order_by="QuizQuestion.position")
    attempts = relationship("QuizAttempt", back_populates="quiz", cascade="all, delete-orphan")


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    quiz_id = Column(String(36), ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    position = Column(Integer, nullable=False)
    question_text = Column(Text, nullable=False)
    options = Column(JSON, nullable=False)  # [{"id": "a", "text": "..."}]
    correct_option_id = Column(String(20), nullable=False)  # SERVER-SIDE ONLY, NEVER EXPOSE IN PUBLIC GET
    explanation = Column(Text, nullable=False)

    quiz = relationship("Quiz", back_populates="questions")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    quiz_id = Column(String(36), ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    score = Column(Float, nullable=False)
    correct_count = Column(Integer, nullable=False)
    total_questions = Column(Integer, nullable=False)
    answers = Column(JSON, nullable=False)  # [{"question_id": "...", "selected_option_id": "..."}]
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    quiz = relationship("Quiz", back_populates="attempts")
    user = relationship("User", back_populates="quiz_attempts")


class LessonProgress(Base):
    __tablename__ = "lesson_progress"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    lesson_id = Column(String(36), ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, index=True)
    card_id = Column(String(36), ForeignKey("micro_lesson_cards.id", ondelete="CASCADE"), nullable=False, index=True)
    completed = Column(Boolean, nullable=False, default=True)
    completed_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "card_id", name="uq_user_card_progress"),
    )

    user = relationship("User", back_populates="lesson_progress")
    lesson = relationship("Lesson", back_populates="progress_records")
    card = relationship("MicroLessonCard", back_populates="progress_records")


class UserDailyActivity(Base):
    __tablename__ = "user_daily_activity"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    activity_date = Column(Date, nullable=False)  # User's local calendar date
    cards_completed_count = Column(Integer, nullable=False, default=0)
    quizzes_attempted_count = Column(Integer, nullable=False, default=0)

    __table_args__ = (
        UniqueConstraint("user_id", "activity_date", name="uq_user_activity_date"),
    )

    user = relationship("User", back_populates="daily_activities")


class BadgeDefinition(Base):
    __tablename__ = "badge_definitions"

    id = Column(String(50), primary_key=True)  # Slug e.g. "first_lesson"
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    icon = Column(String(50), nullable=False)
    criteria_type = Column(String(50), nullable=False)
    criteria_threshold = Column(Integer, nullable=False)

    awards = relationship("UserBadge", back_populates="badge_def", cascade="all, delete-orphan")


class UserBadge(Base):
    __tablename__ = "user_badges"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    badge_id = Column(String(50), ForeignKey("badge_definitions.id", ondelete="CASCADE"), nullable=False)
    earned_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "badge_id", name="uq_user_badge"),
    )

    user = relationship("User", back_populates="user_badges")
    badge_def = relationship("BadgeDefinition", back_populates="awards")


class AgentRun(Base):
    __tablename__ = "agent_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), nullable=True, index=True)
    agent_name = Column(String(80), nullable=False)
    model = Column(String(80), nullable=False)
    input_tokens = Column(Integer, nullable=False, default=0)
    output_tokens = Column(Integer, nullable=False, default=0)
    latency_ms = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
