import logging
from app.database.connection import engine, Base, SessionLocal
from app.models.entities import BadgeDefinition

logger = logging.getLogger(__name__)

DEFAULT_BADGES = [
    {
        "id": "first_lesson",
        "name": "First Lesson",
        "description": "Completed your first published lesson.",
        "icon": "GraduationCap",
        "criteria_type": "lessons_completed",
        "criteria_threshold": 1,
    },
    {
        "id": "consistent_learner",
        "name": "Consistent Learner",
        "description": "Active in lessons or quizzes 3 consecutive days.",
        "icon": "Flame",
        "criteria_type": "streak_days",
        "criteria_threshold": 3,
    },
    {
        "id": "quiz_explorer",
        "name": "Quiz Explorer",
        "description": "Attempted 5 quizzes to reinforce understanding.",
        "icon": "HelpCircle",
        "criteria_type": "quizzes_attempted",
        "criteria_threshold": 5,
    },
    {
        "id": "lesson_finisher",
        "name": "Lesson Finisher",
        "description": "Successfully completed 5 full lessons.",
        "icon": "Award",
        "criteria_type": "lessons_completed",
        "criteria_threshold": 5,
    },
]

def init_db():
    # Create all tables if they do not exist
    Base.metadata.create_all(bind=engine)
    
    # Seed default badges
    db = SessionLocal()
    try:
        for badge_data in DEFAULT_BADGES:
            existing = db.query(BadgeDefinition).filter(BadgeDefinition.id == badge_data["id"]).first()
            if not existing:
                badge = BadgeDefinition(**badge_data)
                db.add(badge)
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding default badges: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized and default badges seeded successfully.")
