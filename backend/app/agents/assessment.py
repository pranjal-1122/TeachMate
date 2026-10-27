import logging
from typing import Tuple
from app.llm.base import BaseLLMClient, LLMUsage
from app.schemas.session import AssessmentResponse

logger = logging.getLogger(__name__)

SYSTEM_INSTRUCTION = """You are the TeachMate Assessment Agent.
Your objective is to evaluate a teacher's conceptual depth and pedagogical readiness before they prepare a classroom lesson.
Rules:
1. Generate exactly 5 questions tailored to the specified topic, subject, and grade level.
2. Question 1: Core fundamental conceptual definition.
3. Question 2: Real-world application mechanism.
4. Question 3: Quantitative/mathematical or practical dynamic relationship.
5. Question 4: Common student misconception and how the teacher resolves it.
6. Question 5: Nuanced/edge-case conceptual scenario.
7. For each question, provide explicit rubric_criteria describing what constitutes an exemplary answer.
8. Provide a reference_explanation that will be stored server-side for automated grading.
"""

class AssessmentAgent:
    def __init__(self, llm: BaseLLMClient):
        self.llm = llm

    async def generate_questions(
        self,
        topic: str,
        subject: str,
        grade_level: str,
        duration_minutes: int
    ) -> Tuple[AssessmentResponse, LLMUsage]:
        prompt = f"""Generate an assessment for teacher preparation:
- Topic: {topic}
- Subject: {subject}
- Grade Level: {grade_level}
- Target Lesson Duration: {duration_minutes} minutes

Generate exactly 5 questions with positions 1 through 5, concepts, difficulties, types, rubric criteria, and reference explanations."""

        assessment_resp, usage = await self.llm.generate_structured(
            prompt=prompt,
            response_schema=AssessmentResponse,
            system_instruction=SYSTEM_INSTRUCTION
        )
        return assessment_resp, usage
