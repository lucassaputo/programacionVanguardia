from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_analyze_uses_mock_by_default(monkeypatch):
    monkeypatch.delenv("ANALYSIS_MODE", raising=False)

    response = client.post(
        "/analyze",
        json={
            "auditId": "audit-1",
            "language": "java",
            "code": 'String sql = "SELECT * FROM users WHERE id=" + userId;',
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["auditId"] == "audit-1"
    assert body["status"] == "success"
    assert body["findings"][0]["severity"] == "critical"


def test_ai_mode_without_key_returns_controlled_error(monkeypatch):
    monkeypatch.setenv("ANALYSIS_MODE", "ai")
    monkeypatch.delenv("AI_API_KEY", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("AI_FALLBACK_TO_MOCK", raising=False)

    response = client.post(
        "/analyze",
        json={
            "auditId": "audit-2",
            "language": "java",
            "code": "class Demo {}",
        },
    )

    assert response.status_code == 500
    assert response.json()["detail"] == "AI_API_KEY is not configured"


def test_ai_mode_can_fallback_to_mock_without_key(monkeypatch):
    monkeypatch.setenv("ANALYSIS_MODE", "ai")
    monkeypatch.setenv("AI_FALLBACK_TO_MOCK", "true")
    monkeypatch.delenv("AI_API_KEY", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)

    response = client.post(
        "/analyze",
        json={
            "auditId": "audit-3",
            "language": "java",
            "code": 'String sql = "SELECT * FROM users WHERE id=" + userId;',
        },
    )

    assert response.status_code == 200
    assert response.json()["auditId"] == "audit-3"
    assert response.json()["status"] == "success"


def test_empty_code_returns_400(monkeypatch):
    monkeypatch.setenv("ANALYSIS_MODE", "mock")

    response = client.post(
        "/analyze",
        json={
            "auditId": "audit-4",
            "language": "java",
            "code": " ",
        },
    )

    assert response.status_code == 400
