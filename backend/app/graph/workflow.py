import logging
from langgraph.graph import StateGraph, START, END
from app.graph.state import TeachMateState
from app.graph.routing import decide_next_step
from app.llm.router import get_llm_client
from app.agents.assessment import AssessmentAgent
from app.agents.analyzer import KnowledgeAnalyzerAgent
from app.agents.revision import RevisionAgent

logger = logging.getLogger(__name__)

async def assessment_node(state: TeachMateState) -> TeachMateState:
    llm = get_llm_client()
    agent = AssessmentAgent(llm)
    assessment_resp, usage = await agent.generate_questions(
        topic=state["topic"],
        subject=state["subject"],
        grade_level=state["grade_level"],
        duration_minutes=state["duration_minutes"]
    )
    return {
        **state,
        "questions": [q.model_dump() for q in assessment_resp.questions],
        "status": "awaiting_teacher_answers"
    }

async def analyzer_node(state: TeachMateState) -> TeachMateState:
    llm = get_llm_client()
    agent = KnowledgeAnalyzerAgent(llm)
    
    # Format questions with answers
    questions_map = {q.get("id", str(idx)): q for idx, q in enumerate(state.get("questions", []), 1)}
    qa_list = []
    for ans in state.get("answers", []):
        qid = ans.get("question_id")
        q = questions_map.get(qid, {})
        qa_list.append({
            "position": q.get("position", 1),
            "question": q.get("question", ""),
            "concept": q.get("concept", ""),
            "difficulty": q.get("difficulty", "medium"),
            "rubric_criteria": q.get("rubric_criteria", ""),
            "reference_explanation": q.get("reference_explanation", ""),
            "answer_text": ans.get("text", "")
        })

    analysis_resp, usage = await agent.analyze_answers(
        topic=state["topic"],
        subject=state["subject"],
        questions_with_answers=qa_list
    )

    next_step = decide_next_step(
        score=analysis_resp.score,
        revision_rounds_completed=state.get("revision_rounds_completed", 0)
    )

    return {
        **state,
        "score": analysis_resp.score,
        "strengths": analysis_resp.strengths,
        "knowledge_gaps": [g.model_dump() for g in analysis_resp.knowledge_gaps],
        "per_question_feedback": [f.model_dump() for f in analysis_resp.per_question_feedback],
        "next_action": next_step.upper()
    }

async def revision_node(state: TeachMateState) -> TeachMateState:
    llm = get_llm_client()
    agent = RevisionAgent(llm)
    current_round = state.get("revision_rounds_completed", 0) + 1
    
    rev_resp, usage = await agent.generate_revision(
        topic=state["topic"],
        subject=state["subject"],
        knowledge_gaps=state.get("knowledge_gaps", []),
        round_number=current_round
    )
    
    return {
        **state,
        "revision_rounds_completed": current_round,
        "revision_content": rev_resp.content_markdown,
        "quick_check_questions": [q.model_dump() for q in rev_resp.quick_check_questions],
        "status": "awaiting_reassessment"
    }

def route_decision(state: TeachMateState) -> str:
    next_action = state.get("next_action", "").lower()
    if next_action == "lesson":
        return "lesson"
    elif next_action == "revision":
        return "revision"
    else:
        return "choice"

def build_teachmate_graph():
    builder = StateGraph(TeachMateState)

    builder.add_node("assessment", assessment_node)
    builder.add_node("analyzer", analyzer_node)
    builder.add_node("revision", revision_node)

    builder.add_edge(START, "assessment")
    # Human-in-the-loop: between assessment and analyzer, execution pauses until teacher submits answers
    builder.add_edge("assessment", END)

    return builder.compile()

teachmate_graph = build_teachmate_graph()
