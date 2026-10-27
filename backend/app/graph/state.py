from typing import TypedDict, List, Optional, Dict, Any

class QuestionDict(TypedDict, total=False):
    id: str
    position: int
    question: str
    concept: str
    difficulty: str
    type: str
    rubric_criteria: str
    reference_explanation: Optional[str]

class KnowledgeGapDict(TypedDict, total=False):
    concept: str
    severity: str
    explanation: str

class PerQuestionFeedbackDict(TypedDict, total=False):
    question_position: int
    score: float
    feedback: str
    evidence: str

class TeachMateState(TypedDict, total=False):
    session_id: str
    teacher_id: str
    topic: str
    subject: str
    grade_level: str
    duration_minutes: int
    version: int

    questions: List[Dict[str, Any]]
    answers: List[Dict[str, str]]
    score: Optional[float]
    strengths: List[str]
    knowledge_gaps: List[Dict[str, Any]]
    per_question_feedback: List[Dict[str, Any]]

    revision_rounds_completed: int
    revision_content: Optional[str]
    quick_check_questions: List[Dict[str, Any]]
    quick_check_answers: List[Dict[str, str]]
    readiness_override: bool

    lesson: Optional[Dict[str, Any]]
    quiz: Optional[Dict[str, Any]]
    next_action: Optional[str]
    status: str
    error: Optional[str]
