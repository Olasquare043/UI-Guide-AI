import sys
from pathlib import Path

from fastapi.testclient import TestClient

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import main  # noqa: E402


def test_health_endpoint():
    client = TestClient(main.app)
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_root_endpoint(monkeypatch):
    def fake_vector_status():
        return {"status": "connected", "documents_count": 0}

    monkeypatch.setattr(main, "test_vector_store", fake_vector_status)
    client = TestClient(main.app)
    response = client.get("/")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "healthy"
    assert payload["vector_store"]["status"] == "connected"


def test_root_serves_frontend_when_dist_present(monkeypatch, tmp_path):
    dist_dir = tmp_path / "dist"
    dist_dir.mkdir()
    (dist_dir / "index.html").write_text("<!doctype html><html><body>UI Guide</body></html>")
    (dist_dir / "logo.txt").write_text("logo")

    monkeypatch.setenv("FRONTEND_DIST_DIR", str(dist_dir))
    client = TestClient(main.app)

    root_response = client.get("/")
    assert root_response.status_code == 200
    assert "text/html" in root_response.headers["content-type"]
    assert "UI Guide" in root_response.text

    asset_response = client.get("/logo.txt")
    assert asset_response.status_code == 200
    assert asset_response.text == "logo"

    route_response = client.get("/chat")
    assert route_response.status_code == 200
    assert "UI Guide" in route_response.text


def test_chat_success(monkeypatch):
    def fake_query_agent(message, thread_id):
        return {
            "answer": "Hello from UI Guide",
            "used_retriever": False,
            "thread_id": thread_id,
            "sources": [],
        }

    monkeypatch.setattr(main, "query_agent", fake_query_agent)
    client = TestClient(main.app)
    response = client.post("/chat", json={"message": "Hello"})
    assert response.status_code == 200
    payload = response.json()
    assert payload["answer"] == "Hello from UI Guide"
    assert payload["used_retriever"] is False
    assert payload["sources"] == []


def test_chat_missing_key(monkeypatch):
    def fake_query_agent(message, thread_id):
        raise RuntimeError("OPENAI_API_KEY is not configured")

    monkeypatch.setattr(main, "query_agent", fake_query_agent)
    client = TestClient(main.app)
    response = client.post("/chat", json={"message": "Hello"})
    assert response.status_code == 503
    payload = response.json()
    assert payload["error"]["message"] == "OPENAI_API_KEY is not configured"
