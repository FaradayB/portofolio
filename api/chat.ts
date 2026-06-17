import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buildSystemPrompt } from "../src/chat/systemPrompt";

const MAX_TURNS = 10;
const MAX_MESSAGE_LENGTH = 2000;
const TEMPERATURE = 0.4;

type Provider = "gemini" | "groq";
interface ChainEntry {
  provider: Provider;
  model: string;
}

// Walked top-to-bottom; first non-empty reply wins. Advancing on ANY failure
// (incl. 404 unknown-model) means not-yet-released IDs are skipped harmlessly
// and start being used automatically once the provider ships them.
const MODEL_CHAIN: ChainEntry[] = [
  { provider: "gemini", model: "gemini-2.5-flash" },
  { provider: "gemini", model: "gemini-2.5-flash-lite" },
  { provider: "gemini", model: "gemini-3-flash-preview" }, // VERIFY: unreleased at write time
  { provider: "gemini", model: "gemini-3.1-flash-lite" }, // VERIFY
  { provider: "gemini", model: "gemini-3.5-flash" }, // VERIFY
  { provider: "groq", model: "llama-3.3-70b-versatile" },
];

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

async function callGemini(model: string, history: IncomingMessage[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

  const contents = history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      systemInstruction: { parts: [{ text: buildSystemPrompt() }] },
      generationConfig: { temperature: TEMPERATURE },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${model} failed: ${res.status}`);
  const data = await res.json();
  const reply: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!reply) throw new Error(`Gemini ${model} returned empty reply`);
  return reply;
}

async function callGroq(model: string, history: IncomingMessage[]): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("Missing GROQ_API_KEY");

  const messages = [
    { role: "system", content: buildSystemPrompt() },
    ...history.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    })),
  ];

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, temperature: TEMPERATURE }),
  });
  if (!res.ok) throw new Error(`Groq ${model} failed: ${res.status}`);
  const data = await res.json();
  const reply: string | undefined = data?.choices?.[0]?.message?.content;
  if (!reply) throw new Error(`Groq ${model} returned empty reply`);
  return reply;
}

function callModel(entry: ChainEntry, history: IncomingMessage[]): Promise<string> {
  return entry.provider === "gemini"
    ? callGemini(entry.model, history)
    : callGroq(entry.model, history);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
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

  for (const entry of MODEL_CHAIN) {
    try {
      const reply = await callModel(entry, history);
      res.status(200).json({ reply });
      return;
    } catch (err) {
      // advance to the next model in the chain
      console.warn(`Model ${entry.provider}:${entry.model} failed, trying next:`, err);
    }
  }

  res.status(502).json({ error: "All models are unavailable right now" });
}
