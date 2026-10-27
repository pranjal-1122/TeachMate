import pytest
from app.config import settings

@pytest.fixture
def teacher_auth(client):
    reg = client.post(f"{settings.API_V1_STR}/auth/register", json={
        "email": "teacher_prog@example.com",
        "password": "teacherpass123",
        "display_name": "Prof. Progress",
        "role": "teacher"
    })
    assert reg.status_code == 201
    return reg.cookies

@pytest.fixture
def student_auth(client):
    reg = client.post(f"{settings.API_V1_STR}/auth/register", json={
        "email": "student_prog@example.com",
        "password": "studentpass123",
        "display_name": "Learner Priya",
        "role": "student"
    })
    assert reg.status_code == 201
    return reg.cookies

def test_card_progress_and_badge_awarding(client, teacher_auth, student_auth):
    # 1. Teacher creates and publishes a lesson
    create_res = client.post(f"{settings.API_V1_STR}/sessions", json={
        "topic": "Genetic Inheritance",
        "subject": "Biology",
        "grade_level": "Grade 10"
    }, cookies=teacher_auth)
    session_id = create_res.json()["session_id"]
    ver = create_res.json()["version"]

    q_res = client.get(f"{settings.API_V1_STR}/sessions/{session_id}/assessment", cookies=teacher_auth)
    questions = q_res.json()["questions"]

    # Submit answers to reach lesson
    ans_res = client.post(f"{settings.API_V1_STR}/sessions/{session_id}/answers", json={
        "answers": [{"question_id": q["id"], "text": "Comprehensive Mendelian genetics answer."} for q in questions],
        "expected_version": ver
    }, cookies=teacher_auth)
    assert ans_res.status_code == 202

    # Fetch draft lesson and publish
    lesson_res = client.get(f"{settings.API_V1_STR}/sessions/{session_id}/lesson", cookies=teacher_auth)
    lesson_id = lesson_res.json()["lesson"]["id"]

    cur_session = client.get(f"{settings.API_V1_STR}/sessions/{session_id}", cookies=teacher_auth).json()
    ver = cur_session["version"]
    pub_res = client.post(f"{settings.API_V1_STR}/sessions/{session_id}/publish", json={"expected_version": ver}, cookies=teacher_auth)
    assert pub_res.status_code == 200

    # 2. Student views lesson and gets cards
    view_res = client.get(f"{settings.API_V1_STR}/lessons/{lesson_id}", cookies=student_auth)
    cards = view_res.json()["micro_lessons"]
    assert len(cards) >= 4

    # 3. Student completes card 1
    prog1 = client.post(f"{settings.API_V1_STR}/lessons/{lesson_id}/progress", json={
        "card_id": cards[0]["id"],
        "completed": True
    }, cookies=student_auth)
    assert prog1.status_code == 200
    p1_data = prog1.json()
    assert p1_data["completed_cards"] == 1
    assert p1_data["total_cards"] == len(cards)
    assert p1_data["streak"] >= 1

    # 4. Idempotency check: completing card 1 again does NOT increment count
    prog1_again = client.post(f"{settings.API_V1_STR}/lessons/{lesson_id}/progress", json={
        "card_id": cards[0]["id"],
        "completed": True
    }, cookies=student_auth)
    assert prog1_again.json()["completed_cards"] == 1

    # 5. Complete ALL remaining cards -> should earn 'first_lesson' badge!
    for c in cards[1:]:
        prog_res = client.post(f"{settings.API_V1_STR}/lessons/{lesson_id}/progress", json={
            "card_id": c["id"],
            "completed": True
        }, cookies=student_auth)
        assert prog_res.status_code == 200

    last_prog = prog_res.json()
    assert last_prog["completed_cards"] == len(cards)
    assert last_prog["progress_percent"] == 100
    assert "first_lesson" in last_prog["earned_badges"]

    # 6. Check student progress overview
    overview_res = client.get(f"{settings.API_V1_STR}/me/progress", cookies=student_auth)
    assert overview_res.status_code == 200
    overview = overview_res.json()
    assert overview["streak"]["current"] >= 1
    assert overview["total_lessons_completed"] == 1
    assert any(b["id"] == "first_lesson" and b["earned"] is True for b in overview["badges"])

    # 7. Check badges endpoint
    badges_res = client.get(f"{settings.API_V1_STR}/me/badges", cookies=student_auth)
    assert badges_res.status_code == 200
    badges_list = badges_res.json()
    assert len(badges_list) == 4
    first_lesson_badge = next(b for b in badges_list if b["id"] == "first_lesson")
    assert first_lesson_badge["earned"] is True
    assert first_lesson_badge["earned_at"] is not None
