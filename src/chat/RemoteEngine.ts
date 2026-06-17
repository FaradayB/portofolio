import { ChatEngine, ChatMessage } from "./engine";

/**
 * Calls the hosted /api/chat function, which walks an ordered chain of free
 * models (Gemini -> Groq) server-side. Works on any device.
 */
export class RemoteEngine implements ChatEngine {
  async *ask(messages: ChatMessage[]): AsyncIterable<string> {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
    if (!res.ok) throw new Error(`Remote chat failed: ${res.status}`);
    const data = await res.json();
    if (typeof data.reply !== "string") throw new Error("Malformed remote reply");
    yield data.reply;
  }
}
