import logging
from typing import Tuple
from app.llm.base import BaseLLMClient, LLMUsage
from app.schemas.session import AssessmentResponse

logger = logging.getLogger(__name__)

SYSTEM_INSTRUCTION = """You are the TeachMate Assessment Agent.
Your objective is to evaluate a teacher's conceptual depth and pedagogical readiness before they prepare a classroom lesson.
Rules:
1. Generate exactly 5 questions tailored to the specified topic, subject, and grade level.
2. Provide a pedagogically balanced mix of question formats (both multiple choice and theoretical):
   - Question 1 (format="mcq", type="conceptual"): Core fundamental definition or distinction. Provide 4 distinct options with ids "A", "B", "C", and "D". Exactly one option is correct.
   - Question 2 (format="theoretical", type="application"): Real-world application mechanism or explanation. Leave options null/empty.
   - Question 3 (format="theoretical", type="conceptual"): Quantitative/practical or dynamic relationship requiring pedagogical explanation. Leave options null/empty.
   - Question 4 (format="mcq", type="misconception"): Common student misconception scenario where the teacher must identify the most scientifically/pedagogically accurate diagnosis. Provide 4 distinct options with ids "A", "B", "C", and "D". Exactly one option is correct.
   - Question 5 (format="theoretical", type="misconception"): Nuanced edge-case conceptual scenario requiring deep pedagogical synthesis. Leave options null/empty.
3. For MCQ questions (Questions 1 & 4):
   - Set format="mcq".
   - Provide exactly 4 options in `options` ([{"id": "A", "text": "..."}, {"id": "B", "text": "..."}, {"id": "C", "text": "..."}, {"id": "D", "text": "..."}]).
   - In `reference_explanation`, clearly specify which option is correct and why.
4. For Theoretical questions (Questions 2, 3, & 5):
   - Set format="theoretical".
   - Set `options` to null.
   - In `reference_explanation`, provide a clear exemplary explanation for grading.
5. For each question, provide explicit rubric_criteria describing what constitutes an exemplary answer.
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
        prompt = f"""Generate a diagnostic assessment for teacher preparation:
- Topic: {topic}
- Subject: {subject}
- Grade Level: {grade_level}
- Target Lesson Duration: {duration_minutes} minutes

Generate a balanced mix of 5 questions:
- Question 1: Multiple-Choice (format="mcq") with 4 options A, B, C, D
- Question 2: Theoretical open-ended (format="theoretical", options=null)
- Question 3: Theoretical open-ended (format="theoretical", options=null)
- Question 4: Multiple-Choice (format="mcq") with 4 options A, B, C, D
- Question 5: Theoretical open-ended (format="theoretical", options=null)

Include concepts, difficulties, types, rubric criteria, and reference explanations."""

        assessment_resp, usage = await self.llm.generate_structured(
            prompt=prompt,
            response_schema=AssessmentResponse,
            system_instruction=SYSTEM_INSTRUCTION
        )
        return assessment_resp, usage
