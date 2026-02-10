from backend import main
from fastapi.testclient import TestClient


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
