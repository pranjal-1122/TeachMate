from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class QuizOption(BaseModel):
    id: str
    text: str

class QuizQuestionSchema(BaseModel):
    position: int
    question_text: str
    options: List[QuizOption] = Field(min_length=3, max_length=5)
    correct_option_id: str  # Server-side only
    explanation: str

class QuizResponse(BaseModel):
    title: str
    questions: List[QuizQuestionSchema] = Field(min_length=3, max_length=5)

class PublicQuizQuestion(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    position: int
    question_text: str
    options: List[QuizOption]

class PublicQuizPayload(BaseModel):
    quiz_id: str
    title: str
    questions: List[PublicQuizQuestion]

class QuizAnswerSubmission(BaseModel):
    question_id: str
    selected_option_id: str

class QuizAttemptPayload(BaseModel):
    answers: List[QuizAnswerSubmission]

class QuestionFeedbackItem(BaseModel):
    question_id: str
    correct: bool
    selected_option_id: str
    correct_option_id: str
    explanation: str

class QuizAttemptResult(BaseModel):
    score: float
    correct_count: int
    total: int
    feedback: List[QuestionFeedbackItem]
    earned_badges: List[str] = Field(default_factory=list)
