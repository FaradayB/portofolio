import { useRef, useState } from "react";
import {
  ChatEngine, ChatMessage, WebLLMEngine, isWebGpuAvailable,
} from "./engine";
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
  const engineRef = useRef<ChatEngine>(engine ?? new WebLLMEngine());
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState("");
  const [log, setLog] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [draft, setDraft] = useState("");

  if (!webGpuAvailable) {
    return (
      <div className="chat">
        <p className="chat-fallback">
          The CV Companion needs a WebGPU-capable browser (recent Chrome, Edge, or
          Firefox) to run the on-device model. Meanwhile, browse the sections on the left.
        </p>
      </div>
    );
  }

  // Opt-in: the ~350 MB model only downloads after the visitor clicks Start.
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
            Ask the <strong>CV Companion</strong> anything about my experience. It runs a
            small Qwen language model <strong>entirely in your browser</strong> — private,
            no server. The first launch downloads the model (~350&nbsp;MB) once, then it's
            cached.
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
    for await (const token of engineRef.current.ask(messages)) {
      acc += token;
      setLog((cur) => {
        const next = [...cur];
        next[next.length - 1] = { role: "assistant", text: acc };
        return next;
      });
    }
    setStatus("ready");
  }

  return (
    <div className="chat">
      {status === "loading" && (
        <div className="chat-status">Loading Companion… {progress}</div>
      )}
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
