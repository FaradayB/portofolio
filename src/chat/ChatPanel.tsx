import { useRef, useState } from "react";
import {
  ChatEngine, ChatMessage, WebLLMEngine, isWebGpuAvailable,
} from "./engine";
import { RemoteEngine } from "./RemoteEngine";
import { FallbackEngine } from "./FallbackEngine";
import { buildSystemPrompt } from "./systemPrompt";

interface Props {
  engine?: ChatEngine;
  webGpuAvailable?: boolean;
}

type Status = "idle" | "loading" | "ready" | "thinking";

export default function ChatPanel({
  engine,
  webGpuAvailable = isWebGpuAvailable(),
}: Props) {
  const engineRef = useRef<ChatEngine>(
    engine ?? new FallbackEngine(new RemoteEngine(), new WebLLMEngine()),
  );
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState("");
  const [log, setLog] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  function start() {
    setStatus("loading");
    engineRef.current
      .init((p) => setProgress(`${p.text} ${Math.round(p.progress * 100)}%`))
      .then(() => setStatus("ready"))
      .catch((e) => { setProgress(String(e)); setStatus("idle"); });
  }

  if (status === "idle") {
    return (
      <div className="chat">
        <div className="chat-start">
          <p className="chat-fallback">
            Ask the <strong>CV Companion</strong> anything about my experience. It's
            powered by a hosted Gemini model by default, with a small Qwen model that
            runs <strong>entirely in your browser</strong> as an offline fallback.
            {!webGpuAvailable && (
              " Your browser doesn't support WebGPU, so the offline fallback won't be"
              + " available if the hosted model is ever unreachable."
            )}
          </p>
          <button className="chat-send" type="button" onClick={start}>
            Start Companion
          </button>
        </div>
      </div>
    );
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const question = draft.trim();
    if (!question || status !== "ready") return;
    setDraft("");
    const history = [...log, { role: "user" as const, text: question }];
    setLog([...history, { role: "assistant", text: "" }]);
    setStatus("thinking");

    const messages: ChatMessage[] = [
      { role: "system", content: buildSystemPrompt() },
      ...history.map((m) => ({ role: m.role, content: m.text })),
    ];

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
        "Sorry, the Companion couldn't reach the hosted model and the offline "
        + "fallback isn't available on this device.",
      );
      setLog((cur) => cur.slice(0, -1));
    }
    setStatus("ready");
  }

  return (
    <div className="chat">
      {status === "loading" && (
        <div className="chat-status">Loading Companion… {progress}</div>
      )}
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
