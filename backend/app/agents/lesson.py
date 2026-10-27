import logging
from typing import List, Dict, Any, Tuple
from app.llm.base import BaseLLMClient, LLMUsage
from app.schemas.lesson import LessonResponse

logger = logging.getLogger(__name__)

SYSTEM_INSTRUCTION = """You are the TeachMate Lesson Generator Agent.
Your objective is to generate an exceptional, classroom-ready lesson plan tailored for teachers to deliver to students.
Rules:
1. Objectives: 3 clear, measurable learning objectives using active verbs.
2. Sections: Include:
   - The Hook (engaging real-world phenomenon or provocative question)
   - Narrative & Storytelling (historical or contextual breakthrough)
   - Conceptual Explanation (clarity, depth, and relatable analogies)
   - Real-world Application (practical daily or technological instances)
3. Visual Specs: Provide 1 valid Mermaid flowchart or state diagram showing the conceptual relationships.
   - MANDATORY: Always wrap node label text inside double quotes: e.g. A["Node 1: Data | Next"] --> B["Node 2"].
   - NEVER use raw unquoted pipe characters (|), colons (:), or parentheses inside node brackets.
   - Start diagram with `graph TD` or `flowchart LR`.
4. Activities: 1 to 2 engaging, low-cost classroom activities with clear timings and instructions.
5. Summary: Concise, punchy core takeaways.
"""

class LessonAgent:
    def __init__(self, llm: BaseLLMClient):
        self.llm = llm

    async def generate_lesson(
        self,
        topic: str,
        subject: str,
        grade_level: str,
        duration_minutes: int,
        knowledge_gaps: List[Dict[str, Any]] = None,
        readiness_override: bool = False
    ) -> Tuple[LessonResponse, LLMUsage]:
        gap_context = ""
        if knowledge_gaps:
            gap_context = "Pay special attention to clearly explaining these concepts where misconceptions often arise:\n" + "\n".join(
                f"- {g.get('concept')}: {g.get('explanation')}" for g in knowledge_gaps
            )

        override_context = ""
        if readiness_override:
            override_context = "Note: Teacher has chosen to proceed with readiness override; ensure foundational scaffolding is comprehensive."

        prompt = f"""Topic: {topic}
Subject: {subject}
Grade Level: {grade_level}
Classroom Duration: {duration_minutes} minutes

{gap_context}
{override_context}

Generate a complete, structured, highly engaging lesson plan."""

        lesson_resp, usage = await self.llm.generate_structured(
            prompt=prompt,
            response_schema=LessonResponse,
            system_instruction=SYSTEM_INSTRUCTION
        )
        return lesson_resp, usage
