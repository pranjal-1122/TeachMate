import logging
from typing import List, Dict, Any, Tuple
from app.llm.base import BaseLLMClient, LLMUsage
from app.schemas.session import KnowledgeAnalysisResponse

logger = logging.getLogger(__name__)

SYSTEM_INSTRUCTION = """You are the TeachMate Knowledge Analyzer Agent.
Your objective is to objectively evaluate a teacher's submitted answers against the provided questions, format, and rubric criteria.
Rules:
1. Evaluate each answer individually on a 0 to 100 scale based on whether it meets the rubric criteria and reference explanation.
2. For Multiple-Choice Questions (MCQs):
   - Compare the teacher's selected option against the correct option stated in the reference explanation.
   - If the teacher selected the correct option, award 85-100 points (100 if any accompanying rationale is also sound).
   - If the teacher selected an incorrect option, award 0-35 points and cite the conceptual misconception in the evidence/feedback.
3. For Theoretical / Open-ended Questions:
   - Evaluate conceptual depth, pedagogical clarity, and adherence to the rubric criteria.
   - If an answer is blank, evasive, or states 'I don't know', assign a low score (<=30) and record a significant knowledge gap.
4. For each question, quote or paraphrase specific evidence from the teacher's answer explaining why points were awarded or deducted.
5. Identify 2 to 3 conceptual strengths where the teacher demonstrated mastery.
6. Identify knowledge gaps: for each gap, state the specific concept, severity ('minor', 'moderate', or 'significant'), and clear pedagogical explanation.
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
            format_str = item.get("format", "theoretical")
            options_text = ""
            if format_str == "mcq" and item.get("options"):
                opts = item["options"]
                if isinstance(opts, list):
                    opts_lines = [f"    - Option {o.get('id', '?')}: {o.get('text', '')}" for o in opts if isinstance(o, dict)]
                    options_text = "  Options:\n" + "\n".join(opts_lines) + "\n"

            formatted_items.append(
                f"Question {idx} (Position {item['position']}) [Format: {format_str.upper()}]: {item['question']}\n"
                f"{options_text}"
                f"  Concept: {item['concept']} | Difficulty: {item['difficulty']}\n"
                f"  Rubric Criteria: {item['rubric_criteria']}\n"
                f"  Reference Explanation / Answer Key: {item.get('reference_explanation', 'N/A')}\n"
                f"  Teacher's Submitted Answer: {item['answer_text']}\n"
            )

        prompt = f"""Topic: {topic} | Subject: {subject}

Evaluate the following teacher responses against their rubrics and answer keys:

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
