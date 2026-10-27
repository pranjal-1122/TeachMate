from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class LessonSection(BaseModel):
    heading: str
    content: str

class VisualSpec(BaseModel):
    type: str = Field(default="mermaid")  # mermaid, svg
    title: str
    spec: str

class ClassroomActivity(BaseModel):
    title: str
    duration_minutes: int = 15
    instructions: str

class LessonResponse(BaseModel):
    title: str
    objectives: List[str] = Field(min_length=2)
    sections: List[LessonSection] = Field(min_length=2)
    visual_specs: List[VisualSpec] = Field(default_factory=list)
    activities: List[ClassroomActivity] = Field(default_factory=list)
    summary: str

class MicroLessonCardResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    position: int
    card_type: str  # concept, example, diagram, micro_quiz, reflection, video
    title: str
    content_markdown: str
    media_spec: Optional[Dict[str, Any]] = None
    estimated_read_time_seconds: int = 60

class LessonDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    session_id: Optional[str] = None
    teacher_id: str
    title: str
    topic: str
    subject: str
    grade_level: str
    duration_minutes: int
    objectives: List[str]
    sections: List[Dict[str, Any]]
    visual_specs: List[Dict[str, Any]]
    activities: List[Dict[str, Any]]
    summary: str
    visibility: str
    readiness_override: bool
    created_at: datetime
    updated_at: datetime

class LessonSessionResponse(BaseModel):
    lesson: LessonDetail
    readiness_override: bool

class LessonUpdatePayload(BaseModel):
    title: Optional[str] = None
    objectives: Optional[List[str]] = None
    sections: Optional[List[LessonSection]] = None
    summary: Optional[str] = None
    expected_version: int

class LessonCatalogItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    topic: str
    subject: str
    grade_level: str
    duration_minutes: int
    readiness_override: bool
    teacher_name: str
    card_count: int
    created_at: datetime

class LessonCatalogResponse(BaseModel):
    items: List[LessonCatalogItem]
    next_cursor: Optional[str] = None

class PublishedLessonView(BaseModel):
    lesson: LessonDetail
    micro_lessons: List[MicroLessonCardResponse]
    quiz_available: bool
    is_teacher_owner: bool = False
