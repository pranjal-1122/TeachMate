import pytest
from app.config import settings

@pytest.fixture
def teacher_auth(client):
    reg = client.post(f"{settings.API_V1_STR}/auth/register", json={
        "email": "teacher_session@example.com",
        "password": "teacherpass123",
        "display_name": "Prof. Session",
        "role": "teacher"
    })
    assert reg.status_code == 201
    return reg.cookies

@pytest.fixture
def student_auth(client):
    reg = client.post(f"{settings.API_V1_STR}/auth/register", json={
        "email": "student_session@example.com",
        "password": "studentpass123",
        "display_name": "Student Session",
        "role": "student"
    })
    assert reg.status_code == 201
    return reg.cookies

def test_student_cannot_create_session(client, student_auth):
    payload = {
        "topic": "Quantum Mechanics",
        "subject": "Physics",
        "grade_level": "Undergrad",
        "duration_minutes": 60
    }
    res = client.post(f"{settings.API_V1_STR}/sessions", json=payload, cookies=student_auth)
    assert res.status_code == 403
    assert res.json()["error"]["code"] == "FORBIDDEN_ROLE"

def test_teacher_create_session_and_fetch_questions(client, teacher_auth):
    payload = {
        "topic": "Newton's Laws of Motion",
        "subject": "Physics",
        "grade_level": "Grade 9",
        "duration_minutes": 45
    }
    create_res = client.post(f"{settings.API_V1_STR}/sessions", json=payload, cookies=teacher_auth)
    assert create_res.status_code == 202
    session_data = create_res.json()
    assert "session_id" in session_data
    assert session_data["status"] == "awaiting_teacher_answers"
    session_id = session_data["session_id"]

    # Fetch assessment questions
    q_res = client.get(f"{settings.API_V1_STR}/sessions/{session_id}/assessment", cookies=teacher_auth)
    assert q_res.status_code == 200
    q_data = q_res.json()
    assert "questions" in q_data
    assert len(q_data["questions"]) == 5
    # Verify that rubric_criteria and reference_explanation are NOT in public response
    for q in q_data["questions"]:
        assert "rubric_criteria" not in q
        assert "reference_explanation" not in q
        assert "question" in q
        assert "concept" in q

def test_submit_answers_validation_and_conflict(client, teacher_auth):
    create_res = client.post(f"{settings.API_V1_STR}/sessions", json={
        "topic": "Cell Biology",
        "subject": "Biology",
        "grade_level": "Grade 10"
    }, cookies=teacher_auth)
    session_id = create_res.json()["session_id"]
    version = create_res.json()["version"]

    # Fetch questions
    q_res = client.get(f"{settings.API_V1_STR}/sessions/{session_id}/assessment", cookies=teacher_auth)
    questions = q_res.json()["questions"]

    # 1. Test wrong expected version -> 409
    bad_version_payload = {
        "answers": [{"question_id": q["id"], "text": "Valid answer"} for q in questions],
        "expected_version": version + 99
    }
    conflict_res = client.post(
        f"{settings.API_V1_STR}/sessions/{session_id}/answers",
        json=bad_version_payload,
        cookies=teacher_auth
    )
    assert conflict_res.status_code == 409
    assert conflict_res.json()["error"]["code"] == "VERSION_CONFLICT"

    # 2. Test incomplete answers (only 4 submitted) -> 422 or 400
    incomplete_payload = {
        "answers": [{"question_id": questions[0]["id"], "text": "Only one"}],
        "expected_version": version
    }
    incomplete_res = client.post(
        f"{settings.API_V1_STR}/sessions/{session_id}/answers",
        json=incomplete_payload,
        cookies=teacher_auth
    )
    assert incomplete_res.status_code in (400, 422)

def test_submit_strong_answers_leads_to_lesson(client, teacher_auth):
    create_res = client.post(f"{settings.API_V1_STR}/sessions", json={
        "topic": "Thermodynamics",
        "subject": "Physics",
        "grade_level": "High School"
    }, cookies=teacher_auth)
    session_id = create_res.json()["session_id"]
    version = create_res.json()["version"]

    q_res = client.get(f"{settings.API_V1_STR}/sessions/{session_id}/assessment", cookies=teacher_auth)
    questions = q_res.json()["questions"]

    strong_payload = {
        "answers": [
            {"question_id": q["id"], "text": "Comprehensive, precise conceptual explanation addressing equilibrium and conservation laws."}
            for q in questions
        ],
        "expected_version": version
    }
    ans_res = client.post(
        f"{settings.API_V1_STR}/sessions/{session_id}/answers",
        json=strong_payload,
        cookies=teacher_auth
    )
    assert ans_res.status_code == 202
    res_data = ans_res.json()
    assert res_data["score"] >= 80.0
    assert res_data["status"] == "generating_lesson"

    # Fetch analysis
    analysis_res = client.get(f"{settings.API_V1_STR}/sessions/{session_id}/analysis", cookies=teacher_auth)
    assert analysis_res.status_code == 200
    analysis = analysis_res.json()
    assert analysis["score"] >= 80.0
    assert len(analysis["strengths"]) > 0
    assert analysis["next_action"] == "LESSON"

def test_submit_weak_answers_leads_to_revision(client, teacher_auth):
    create_res = client.post(f"{settings.API_V1_STR}/sessions", json={
        "topic": "Photosynthesis",
        "subject": "Biology",
        "grade_level": "Grade 8"
    }, cookies=teacher_auth)
    session_id = create_res.json()["session_id"]
    version = create_res.json()["version"]

    q_res = client.get(f"{settings.API_V1_STR}/sessions/{session_id}/assessment", cookies=teacher_auth)
    questions = q_res.json()["questions"]

    # Weak answers with trigger keyword "test_low_score" or "don't know"
    weak_payload = {
        "answers": [
            {"question_id": q["id"], "text": "I don't know the full details, weak and uncertain about this concept test_low_score."}
            for q in questions
        ],
        "expected_version": version
    }
    ans_res = client.post(
        f"{settings.API_V1_STR}/sessions/{session_id}/answers",
        json=weak_payload,
        cookies=teacher_auth
    )
    assert ans_res.status_code == 202
    res_data = ans_res.json()
    assert res_data["score"] < 80.0
    assert res_data["status"] in ("generating_revision", "awaiting_reassessment")

    # Fetch analysis
    analysis_res = client.get(f"{settings.API_V1_STR}/sessions/{session_id}/analysis", cookies=teacher_auth)
    assert analysis_res.status_code == 200
    analysis = analysis_res.json()
    assert analysis["score"] < 80.0
    assert len(analysis["gaps"]) > 0
    assert analysis["next_action"] == "REVISION"
    assert analysis["gaps"][0]["severity"] in ("minor", "moderate", "significant")
