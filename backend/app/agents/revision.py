import logging
from typing import List, Dict, Any, Tuple
from app.llm.base import BaseLLMClient, LLMUsage
from app.schemas.session import RevisionResponse, KnowledgeGapItem

logger = logging.getLogger(__name__)

SYSTEM_INSTRUCTION = """You are the TeachMate Targeted Revision Agent.
Your objective is to help the teacher rapidly resolve specific identified conceptual misconceptions or knowledge gaps.
Rules:
1. Target ONLY the identified knowledge gaps. Do NOT re-explain the entire broad subject.
2. Provide concise, high-impact pedagogical explanations with concrete examples and mathematical relationships where applicable.
3. Use formatted Markdown with bold highlights, bullet points, and clear distinction between concepts.
4. Generate 2 fresh, targeted quick_check_questions specifically testing whether the teacher has resolved these gaps.
5. Do NOT include answers or solutions inside the quick check question prompts.
"""

class RevisionAgent:
    def __init__(self, llm: BaseLLMClient):
        self.llm = llm

    async def generate_revision(
        self,
        topic: str,
        subject: str,
        knowledge_gaps: List[Dict[str, Any]],
        round_number: int
    ) -> Tuple[RevisionResponse, LLMUsage]:
        gap_lines = []
        for g in knowledge_gaps:
            gap_lines.append(f"- Concept: {g.get('concept')} (Severity: {g.get('severity', 'moderate')})\n  Issue: {g.get('explanation')}")

        prompt = f"""Topic: {topic} | Subject: {subject}
Revision Round: {round_number}

Target the following specific knowledge gaps:
{"".join(gap_lines)}

Generate bite-sized targeted revision notes and 2 quick-check questions with IDs and concepts."""

        revision_resp, usage = await self.llm.generate_structured(
            prompt=prompt,
            response_schema=RevisionResponse,
            system_instruction=SYSTEM_INSTRUCTION
        )
        revision_resp.round_number = round_number
        return revision_resp, usage
