def decide_next_step(score: float, revision_rounds_completed: int) -> str:
    """
    Deterministic decision engine enforcing mastery thresholds and safe loop limits:
    - Score >= 80.0: Sufficient conceptual mastery to proceed to Lesson generation.
    - Score < 80.0 and rounds < 3: Targeted Revision & Reassessment needed.
    - Score < 80.0 and rounds >= 3: Maximum automated rounds reached. Require explicit teacher choice.
    """
    if score >= 80.0:
        return "lesson"
    elif revision_rounds_completed < 3:
        return "revision"
    else:
        return "choice"
