import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buildSystemPrompt } from "../src/chat/systemPrompt";

const MAX_TURNS = 10;
const MAX_MESSAGE_LENGTH = 2000;
const GEMINI_MODEL = "gemini-2.5-flash";

interface IncomingMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

function isIncomingMessage(value: unknown): value is IncomingMessage {
  if (typeof value !== "object" || value === null) return false;
  const m = value as Record<string, unknown>;
  return (
    (m.role === "system" || m.role === "user" || m.role === "assistant") &&
    typeof m.content === "string"
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: "Server is missing GEMINI_API_KEY" });
      return;
    }

    const body = req.body as { messages?: unknown };
    if (!Array.isArray(body?.messages) || !body.messages.every(isIncomingMessage)) {
      res.status(400).json({ error: "Expected { messages: {role, content}[] }" });
      return;
    }

    const history = (body.messages as IncomingMessage[])
      .filter((m) => m.role !== "system")
      .slice(-MAX_TURNS * 2)
      .map((m) => ({ ...m, content: m.content.slice(0, MAX_MESSAGE_LENGTH) }));

    const contents = history.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: buildSystemPrompt() }] },
        generationConfig: { temperature: 0.4 },
      }),
    });

    if (!geminiRes.ok) {
      res.status(502).json({ error: "Hosted model is unavailable right now" });
      return;
    }

    const data = await geminiRes.json();
    const reply: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) {
      res.status(502).json({ error: "Hosted model returned an empty reply" });
      return;
    }

    res.status(200).json({ reply });
  } catch {
    res.status(500).json({ error: "Something went wrong handling your message" });
  }
}
