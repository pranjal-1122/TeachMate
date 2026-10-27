import pytest
from app.config import settings

@pytest.fixture
def teacher_auth(client):
    reg = client.post(f"{settings.API_V1_STR}/auth/register", json={
        "email": "teacher_revision@example.com",
        "password": "teacherpass123",
        "display_name": "Prof. Revision",
        "role": "teacher"
    })
    assert reg.status_code == 201
    return reg.cookies

def test_revision_generation_and_reassessment_pass(client, teacher_auth):
    # 1. Create session
    create_res = client.post(f"{settings.API_V1_STR}/sessions", json={
        "topic": "Electromagnetism",
        "subject": "Physics",
        "grade_level": "Grade 11"
    }, cookies=teacher_auth)
    session_id = create_res.json()["session_id"]
    version = create_res.json()["version"]

    # 2. Fetch assessment questions
    q_res = client.get(f"{settings.API_V1_STR}/sessions/{session_id}/assessment", cookies=teacher_auth)
    questions = q_res.json()["questions"]

    # 3. Submit weak answers to trigger revision
    weak_payload = {
        "answers": [
            {"question_id": q["id"], "text": "Weak answer test_low_score unsure about this."}
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
    assert ans_res.json()["status"] == "awaiting_reassessment"

    # 4. Fetch revision
    rev_res = client.get(f"{settings.API_V1_STR}/sessions/{session_id}/revision", cookies=teacher_auth)
    assert rev_res.status_code == 200
    rev_data = rev_res.json()
    assert rev_data["round"] == 1
    assert len(rev_data["quick_check_questions"]) > 0
    assert "content" in rev_data

    # 5. Submit strong reassessment answers -> should pass to lesson!
    current_version = ans_res.json()["version"]
    reassess_payload = {
        "answers": [
            {"question_id": qc["id"], "text": "Now fully understand the physical concept, net force is zero and flux is conserved."}
            for qc in rev_data["quick_check_questions"]
        ],
        "expected_version": current_version
    }
    reassess_res = client.post(
        f"{settings.API_V1_STR}/sessions/{session_id}/reassessment",
        json=reassess_payload,
        cookies=teacher_auth
    )
    assert reassess_res.status_code == 202
    res_data = reassess_res.json()
    assert res_data["score"] >= 80.0
    assert res_data["status"] == "generating_lesson"

def test_three_round_cap_and_override_acknowledgment(client, teacher_auth):
    create_res = client.post(f"{settings.API_V1_STR}/sessions", json={
        "topic": "Organic Chemistry",
        "subject": "Chemistry",
        "grade_level": "Grade 12"
    }, cookies=teacher_auth)
    session_id = create_res.json()["session_id"]
    version = create_res.json()["version"]

    q_res = client.get(f"{settings.API_V1_STR}/sessions/{session_id}/assessment", cookies=teacher_auth)
    questions = q_res.json()["questions"]

    # Initial weak answers -> Round 1
    ans_res = client.post(f"{settings.API_V1_STR}/sessions/{session_id}/answers", json={
        "answers": [{"question_id": q["id"], "text": "test_low_score idk"} for q in questions],
        "expected_version": version
    }, cookies=teacher_auth)
    assert ans_res.json()["status"] == "awaiting_reassessment"
    ver = ans_res.json()["version"]

    # Reassessment 1 (weak) -> Round 2
    rev1 = client.get(f"{settings.API_V1_STR}/sessions/{session_id}/revision", cookies=teacher_auth).json()
    reassess1 = client.post(f"{settings.API_V1_STR}/sessions/{session_id}/reassessment", json={
        "answers": [{"question_id": qc["id"], "text": "test_low_score still confused"} for qc in rev1["quick_check_questions"]],
        "expected_version": ver
    }, cookies=teacher_auth)
    assert reassess1.json()["revision_rounds_completed"] == 2
    assert reassess1.json()["status"] == "awaiting_reassessment"
    ver = reassess1.json()["version"]

    # Reassessment 2 (weak) -> Round 3
    rev2 = client.get(f"{settings.API_V1_STR}/sessions/{session_id}/revision", cookies=teacher_auth).json()
    reassess2 = client.post(f"{settings.API_V1_STR}/sessions/{session_id}/reassessment", json={
        "answers": [{"question_id": qc["id"], "text": "test_low_score second failure"} for qc in rev2["quick_check_questions"]],
        "expected_version": ver
    }, cookies=teacher_auth)
    assert reassess2.json()["revision_rounds_completed"] == 3
    assert reassess2.json()["status"] == "awaiting_reassessment"
    ver = reassess2.json()["version"]

    # Reassessment 3 (weak) -> Reached limit of 3 rounds!
    rev3 = client.get(f"{settings.API_V1_STR}/sessions/{session_id}/revision", cookies=teacher_auth).json()
    reassess3 = client.post(f"{settings.API_V1_STR}/sessions/{session_id}/reassessment", json={
        "answers": [{"question_id": qc["id"], "text": "test_low_score third failure"} for qc in rev3["quick_check_questions"]],
        "expected_version": ver
    }, cookies=teacher_auth)
    assert reassess3.json()["revision_rounds_completed"] == 3
    # MUST NOT auto-pass! Must pause at awaiting_teacher_choice
    assert reassess3.json()["status"] == "awaiting_teacher_choice"
    ver = reassess3.json()["version"]

    # Test decision without acknowledgment -> 400
    bad_dec = client.post(f"{settings.API_V1_STR}/sessions/{session_id}/decision", json={
        "action": "proceed_anyway",
        "acknowledge_incomplete_readiness": False,
        "expected_version": ver
    }, cookies=teacher_auth)
    assert bad_dec.status_code == 400
    assert bad_dec.json()["error"]["code"] == "ACKNOWLEDGMENT_REQUIRED"

    # Test decision WITH acknowledgment -> succeeds with readiness_override=True!
    good_dec = client.post(f"{settings.API_V1_STR}/sessions/{session_id}/decision", json={
        "action": "proceed_anyway",
        "acknowledge_incomplete_readiness": True,
        "expected_version": ver
    }, cookies=teacher_auth)
    assert good_dec.status_code == 200
    dec_data = good_dec.json()
    assert dec_data["status"] == "generating_lesson"
    assert dec_data["readiness_override"] is True
