import { ChatEngine, ChatMessage, InitProgress } from "./engine";

/**
 * Calls the hosted /api/chat function (Gemini Flash) instead of running a model
 * in-browser. Works on any device — no WebGPU, no download.
 */
export class RemoteEngine implements ChatEngine {
  async init(onProgress: (p: InitProgress) => void): Promise<void> {
    onProgress({ text: "Ready", progress: 1 });
  }

  async *ask(messages: ChatMessage[]): AsyncIterable<string> {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
    if (!res.ok) throw new Error(`Remote chat failed: ${res.status}`);
    const data = await res.json();
    if (typeof data.reply !== "string") throw new Error("Malformed remote reply");
    // Non-streaming: yield the full reply as a single chunk. This also guarantees
    // FallbackEngine never has to discard partial output if the remote call fails.
    yield data.reply;
  }
}
