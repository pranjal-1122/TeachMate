import pytest
from app.config import settings

@pytest.fixture
def teacher_auth(client):
    reg = client.post(f"{settings.API_V1_STR}/auth/register", json={
        "email": "teacher_lq@example.com",
        "password": "teacherpass123",
        "display_name": "Prof. Curie",
        "role": "teacher"
    })
    assert reg.status_code == 201
    return reg.cookies

@pytest.fixture
def student_auth(client):
    reg = client.post(f"{settings.API_V1_STR}/auth/register", json={
        "email": "student_lq@example.com",
        "password": "studentpass123",
        "display_name": "Student Leo",
        "role": "student"
    })
    assert reg.status_code == 201
    return reg.cookies

def test_full_lesson_and_quiz_lifecycle(client, teacher_auth, student_auth):
    # 1. Teacher creates session
    create_res = client.post(f"{settings.API_V1_STR}/sessions", json={
        "topic": "Gravity and Orbital Motion",
        "subject": "Physics",
        "grade_level": "Grade 10",
        "duration_minutes": 50
    }, cookies=teacher_auth)
    assert create_res.status_code == 202
    session_id = create_res.json()["session_id"]
    ver = create_res.json()["version"]

    # 2. Fetch questions
    q_res = client.get(f"{settings.API_V1_STR}/sessions/{session_id}/assessment", cookies=teacher_auth)
    questions = q_res.json()["questions"]

    # 3. Submit strong answers -> directly reaches lesson!
    ans_res = client.post(f"{settings.API_V1_STR}/sessions/{session_id}/answers", json={
        "answers": [{"question_id": q["id"], "text": "Precise conceptual answer on gravitational equilibrium and Keplerian orbits."} for q in questions],
        "expected_version": ver
    }, cookies=teacher_auth)
    assert ans_res.status_code == 202
    assert ans_res.json()["status"] == "generating_lesson"
    ver = ans_res.json()["version"]

    # 4. Fetch draft lesson
    lesson_res = client.get(f"{settings.API_V1_STR}/sessions/{session_id}/lesson", cookies=teacher_auth)
    assert lesson_res.status_code == 200
    lesson_data = lesson_res.json()["lesson"]
    assert "title" in lesson_data
    assert len(lesson_data["objectives"]) >= 2
    assert len(lesson_data["sections"]) >= 2
    assert len(lesson_data["visual_specs"]) >= 1
    assert lesson_data["visibility"] == "draft"
    lesson_id = lesson_data["id"]

    # 5. Verify draft is NOT yet in published catalog
    cat_res = client.get(f"{settings.API_V1_STR}/lessons")
    assert cat_res.status_code == 200
    published_ids = [item["id"] for item in cat_res.json()["items"]]
    assert lesson_id not in published_ids

    # 6. Teacher edits draft lesson
    # Note: version incremented after lesson generation
    cur_session = client.get(f"{settings.API_V1_STR}/sessions/{session_id}", cookies=teacher_auth).json()
    ver = cur_session["version"]
    patch_res = client.patch(f"{settings.API_V1_STR}/sessions/{session_id}/lesson", json={
        "title": "Mastering Orbital Gravity: From Newton to Kepler",
        "summary": "Updated concise classroom summary on gravitational mechanics.",
        "expected_version": ver
    }, cookies=teacher_auth)
    assert patch_res.status_code == 200
    assert patch_res.json()["title"] == "Mastering Orbital Gravity: From Newton to Kepler"

    # 7. Teacher publishes lesson
    cur_session = client.get(f"{settings.API_V1_STR}/sessions/{session_id}", cookies=teacher_auth).json()
    ver = cur_session["version"]
    pub_res = client.post(f"{settings.API_V1_STR}/sessions/{session_id}/publish", json={
        "expected_version": ver
    }, cookies=teacher_auth)
    assert pub_res.status_code == 200
    assert pub_res.json()["visibility"] == "published"

    # 8. Student browses catalog -> now visible!
    cat_after = client.get(f"{settings.API_V1_STR}/lessons")
    assert cat_after.status_code == 200
    catalog_items = cat_after.json()["items"]
    assert any(item["id"] == lesson_id for item in catalog_items)

    # 9. Student opens lesson -> micro-lesson cards stack available
    view_res = client.get(f"{settings.API_V1_STR}/lessons/{lesson_id}", cookies=student_auth)
    assert view_res.status_code == 200
    view_data = view_res.json()
    assert len(view_data["micro_lessons"]) >= 4
    assert view_data["quiz_available"] is True

    # 10. Student opens quiz -> VERIFY CORRECT ANSWERS ARE NOT LEAKED
    quiz_res = client.get(f"{settings.API_V1_STR}/lessons/{lesson_id}/quiz", cookies=student_auth)
    assert quiz_res.status_code == 200
    quiz_data = quiz_res.json()
    assert "quiz_id" in quiz_data
    quiz_id = quiz_data["quiz_id"]
    for q in quiz_data["questions"]:
        assert "correct_option_id" not in q
        assert "question_text" in q
        assert len(q["options"]) >= 3

    # 11. Student submits quiz attempt -> Python grades against private DB answers
    quiz_questions = quiz_data["questions"]
    attempt_payload = {
        "answers": [
            # Intentionally select 'a' or first option for each
            {"question_id": q["id"], "selected_option_id": q["options"][0]["id"]}
            for q in quiz_questions
        ]
    }
    submit_res = client.post(
        f"{settings.API_V1_STR}/quizzes/{quiz_id}/attempts",
        json=attempt_payload,
        cookies=student_auth
    )
    assert submit_res.status_code == 201
    result = submit_res.json()
    assert "score" in result
    assert "correct_count" in result
    assert result["total"] == len(quiz_questions)
    assert len(result["feedback"]) == len(quiz_questions)
    for fb in result["feedback"]:
        assert "correct" in fb
        assert "explanation" in fb
        assert "correct_option_id" in fb  # Revealed in feedback after grading!
