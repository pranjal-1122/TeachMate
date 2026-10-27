from datetime import date, datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict

class CardProgressPayload(BaseModel):
    card_id: str
    completed: bool = True
    expected_version: Optional[int] = None

class CardProgressResponse(BaseModel):
    completed_cards: int
    total_cards: int
    progress_percent: int
    streak: int
    earned_badges: List[str] = []

class StreakInfo(BaseModel):
    current: int
    longest: int
    last_active_date: Optional[date] = None

class BadgeItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: str
    icon: str
    criteria_type: str
    criteria_threshold: int
    earned: bool = False
    earned_at: Optional[datetime] = None

class CourseProgressItem(BaseModel):
    lesson_id: str
    title: str
    subject: str
    grade_level: str
    completed_cards: int
    total_cards: int
    progress_percent: int
    last_completed_at: Optional[datetime] = None

class StudentProgressOverview(BaseModel):
    courses: List[CourseProgressItem]
    streak: StreakInfo
    badges: List[BadgeItem]
    total_lessons_completed: int
    total_quizzes_attempted: int
