import { useRef, useState } from "react";
import { ChatEngine, ChatMessage } from "./engine";
import { RemoteEngine } from "./RemoteEngine";

interface Props {
  engine?: ChatEngine;
}

type Status = "ready" | "thinking";

export default function ChatPanel({ engine }: Props) {
  const engineRef = useRef<ChatEngine>(engine ?? new RemoteEngine());
  const [status, setStatus] = useState<Status>("ready");
  const [log, setLog] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const question = draft.trim();
    if (!question || status !== "ready") return;
    setError("");
    setDraft("");
    const history = [...log, { role: "user" as const, text: question }];
    setLog([...history, { role: "assistant", text: "" }]);
    setStatus("thinking");

    // The RAG backend builds its own grounded prompt from retrieved CV chunks,
    // so we send only the conversation history.
    const messages: ChatMessage[] = history.map((m) => ({
      role: m.role,
      content: m.text,
    }));

    let acc = "";
    try {
      for await (const token of engineRef.current.ask(messages)) {
        acc += token;
        setLog((cur) => {
          const next = [...cur];
          next[next.length - 1] = { role: "assistant", text: acc };
          return next;
        });
      }
    } catch {
      setError(
        "Sorry, the Companion couldn't reach the model right now. Please try again in a moment.",
      );
      setLog((cur) => cur.slice(0, -1));
    }
    setStatus("ready");
  }

  return (
    <div className="chat">
      <p className="chat-intro">
        Ask the <strong>CV Companion</strong> anything about my experience.
      </p>
      {error && <div className="chat-status chat-error">{error}</div>}
      <div className="chat-log">
        {log.map((m, i) => (
          <div className="chat-msg card" key={i}>
            <div className="card-sub">{m.role === "user" ? "You" : "Companion"}</div>
            <div className="card-body">{m.text || "…"}</div>
          </div>
        ))}
      </div>
      <form className="chat-form" onSubmit={send}>
        <input
          className="chat-input"
          placeholder="Ask about my experience…"
          value={draft}
          disabled={status !== "ready"}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button className="chat-send" type="submit" disabled={status !== "ready"}>
          Send
        </button>
      </form>
    </div>
  );
}
