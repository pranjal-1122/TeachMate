import logging
from typing import List, Dict, Any, Tuple
from app.llm.base import BaseLLMClient, LLMUsage
from app.schemas.session import KnowledgeAnalysisResponse

logger = logging.getLogger(__name__)

SYSTEM_INSTRUCTION = """You are the TeachMate Knowledge Analyzer Agent.
Your objective is to objectively evaluate a teacher's submitted answers against the provided questions and rubric criteria.
Rules:
1. Evaluate each answer individually on a 0 to 100 scale based on whether it meets the rubric criteria.
2. For each question, quote or paraphrase specific evidence from the teacher's answer explaining why points were awarded or deducted.
3. Identify 2 to 3 conceptual strengths where the teacher demonstrated mastery.
4. Identify knowledge gaps: for each gap, state the specific concept, severity ('minor', 'moderate', or 'significant'), and clear pedagogical explanation.
5. If an answer is blank, evasive, or states 'I don't know', assign a low score (<=40) and record a significant knowledge gap.
"""

class KnowledgeAnalyzerAgent:
    def __init__(self, llm: BaseLLMClient):
        self.llm = llm

    async def analyze_answers(
        self,
        topic: str,
        subject: str,
        questions_with_answers: List[Dict[str, Any]]
    ) -> Tuple[KnowledgeAnalysisResponse, LLMUsage]:
        formatted_items = []
        for idx, item in enumerate(questions_with_answers, 1):
            formatted_items.append(
                f"Question {idx} (Position {item['position']}): {item['question']}\n"
                f"Concept: {item['concept']} | Difficulty: {item['difficulty']}\n"
                f"Rubric Criteria: {item['rubric_criteria']}\n"
                f"Reference Explanation: {item.get('reference_explanation', 'N/A')}\n"
                f"Teacher's Answer: {item['answer_text']}\n"
            )

        prompt = f"""Topic: {topic} | Subject: {subject}

Evaluate the following teacher responses against their rubrics:

{"---".join(formatted_items)}

Evaluate each question score (0-100), per-question feedback with evidence, overall strengths, and structured knowledge gaps."""

        analysis_resp, usage = await self.llm.generate_structured(
            prompt=prompt,
            response_schema=KnowledgeAnalysisResponse,
            system_instruction=SYSTEM_INSTRUCTION
        )

        # Deterministic Python aggregate score calculation (equal weighting across questions)
        if analysis_resp.per_question_feedback:
            total = sum(q.score for q in analysis_resp.per_question_feedback)
            avg_score = round(total / len(analysis_resp.per_question_feedback), 1)
            # Clamp between 0 and 100
            analysis_resp.score = max(0.0, min(100.0, avg_score))

        return analysis_resp, usage
