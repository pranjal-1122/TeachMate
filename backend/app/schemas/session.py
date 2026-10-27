from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

# --- Session Initialization ---

class SessionCreate(BaseModel):
    topic: str = Field(min_length=2, max_length=255)
    subject: str = Field(default="General Science", max_length=100)
    grade_level: str = Field(default="Middle School", max_length=50)
    duration_minutes: int = Field(default=45, ge=15, le=180)

class SessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    topic: str
    subject: str
    grade_level: str
    duration_minutes: int
    status: str
    score: Optional[float] = None
    revision_rounds_completed: int = 0
    readiness_override: bool = False
    version: int
    created_at: datetime
    updated_at: datetime

# --- Assessment Generation ---

class QuestionSchema(BaseModel):
    position: int = Field(ge=1, le=5)
    question: str
    concept: str
    difficulty: str = Field(pattern="^(easy|medium|hard)$")
    type: str = Field(pattern="^(conceptual|application|misconception)$")
    rubric_criteria: str
    reference_explanation: Optional[str] = None

class AssessmentResponse(BaseModel):
    questions: List[QuestionSchema] = Field(min_length=5, max_length=5)

class PublicAssessmentQuestion(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    position: int
    question: str
    concept: str
    difficulty: str
    type: str

class AssessmentPayload(BaseModel):
    questions: List[PublicAssessmentQuestion]
    status: str

# --- Teacher Answer Submission ---

class AnswerItem(BaseModel):
    question_id: str
    text: str = Field(min_length=1, max_length=5000)

class SubmitAnswersPayload(BaseModel):
    answers: List[AnswerItem] = Field(min_length=5, max_length=5)
    expected_version: int

# --- Knowledge Analysis ---

class KnowledgeGapItem(BaseModel):
    concept: str
    severity: str = Field(default="moderate")  # minor, moderate, significant
    explanation: str

class PerQuestionFeedbackItem(BaseModel):
    question_position: int
    score: float = Field(ge=0, le=100)
    feedback: str
    evidence: str

class KnowledgeAnalysisResponse(BaseModel):
    score: float = Field(ge=0, le=100)
    strengths: List[str]
    knowledge_gaps: List[KnowledgeGapItem]
    per_question_feedback: List[PerQuestionFeedbackItem]

class AnalysisDetailResponse(BaseModel):
    score: float
    strengths: List[str]
    gaps: List[KnowledgeGapItem]
    per_question_feedback: List[PerQuestionFeedbackItem]
    next_action: str

# --- Revision & Reassessment ---

class QuickCheckQuestion(BaseModel):
    id: str
    prompt: str
    concept: str

class RevisionResponse(BaseModel):
    round_number: int
    content_markdown: str
    quick_check_questions: List[QuickCheckQuestion]

class RevisionDetailResponse(BaseModel):
    round: int
    content: str
    quick_check_questions: List[QuickCheckQuestion]
    status: str

class SubmitReassessmentPayload(BaseModel):
    answers: List[AnswerItem]
    expected_version: int

# --- Teacher Decision ---

class TeacherDecisionPayload(BaseModel):
    action: str = Field(pattern="^(proceed_anyway|continue_revision|save_for_later)$")
    acknowledge_incomplete_readiness: bool = False
    expected_version: int
