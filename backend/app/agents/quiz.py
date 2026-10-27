import logging
from typing import Dict, Any, Tuple
from app.llm.base import BaseLLMClient, LLMUsage
from app.schemas.quiz import QuizResponse

logger = logging.getLogger(__name__)

SYSTEM_INSTRUCTION = """You are the TeachMate Student Quiz Agent.
Your objective is to generate an interactive, diagnostic 5-question multiple-choice quiz based on the provided lesson.
Rules:
1. Generate exactly 5 questions spanning conceptual recall, application, and misconception busting.
2. For each question, provide 4 distinct options ('a', 'b', 'c', 'd').
3. Design realistic distractors based on common student errors; avoid obvious 'all of the above' or silly choices.
4. Designate exactly one 'correct_option_id' matching one of the options.
5. Provide a constructive, educational 'explanation' clarifying why the option is correct.
"""

class QuizAgent:
    def __init__(self, llm: BaseLLMClient):
        self.llm = llm

    async def generate_quiz(
        self,
        lesson_data: Dict[str, Any]
    ) -> Tuple[QuizResponse, LLMUsage]:
        title = lesson_data.get("title", "")
        topic = lesson_data.get("topic", "")
        objectives = lesson_data.get("objectives", [])
        summary = lesson_data.get("summary", "")

        prompt = f"""Lesson Title: {title}
Topic: {topic}
Learning Objectives:
{chr(10).join(f'- {obj}' for obj in objectives)}

Lesson Summary:
{summary}

Generate an interactive 5-question multiple choice quiz for students."""

        quiz_resp, usage = await self.llm.generate_structured(
            prompt=prompt,
            response_schema=QuizResponse,
            system_instruction=SYSTEM_INSTRUCTION
        )
        return quiz_resp, usage
