import api.chat as chat


def _patch(monkeypatch, reply="Faraday has a GPA of 3.88."):
    monkeypatch.setattr(chat, "get_retriever", lambda: type("R", (), {
        "invoke": lambda self, q: []})())
    monkeypatch.setattr(chat, "_generate", lambda prompt: reply)


def test_rejects_non_post():
    status, body = chat.handle_request("GET", {})
    assert status == 405


def test_rejects_malformed_body():
    status, body = chat.handle_request("POST", {"nope": 1})
    assert status == 400


def test_happy_path(monkeypatch):
    _patch(monkeypatch)
    status, body = chat.handle_request("POST", {"messages": [
        {"role": "user", "content": "what's his GPA?"}]})
    assert status == 200
    assert "3.88" in body["reply"]


def test_generation_failure_returns_502(monkeypatch):
    monkeypatch.setattr(chat, "get_retriever", lambda: type("R", (), {
        "invoke": lambda self, q: []})())
    def boom(prompt): raise RuntimeError("gemini down")
    monkeypatch.setattr(chat, "_generate", boom)
    status, body = chat.handle_request("POST", {"messages": [
        {"role": "user", "content": "hi"}]})
    assert status == 502
