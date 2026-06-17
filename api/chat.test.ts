import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import handler from "./chat";

function makeRes() {
  const res: { statusCode: number; body: unknown; status: (c: number) => typeof res; json: (b: unknown) => typeof res } = {
    statusCode: 0,
    body: undefined,
    status(c: number) { this.statusCode = c; return this; },
    json(b: unknown) { this.body = b; return this; },
  };
  return res;
}

function makeReq(method: string, body: unknown) {
  return { method, body } as unknown as Parameters<typeof handler>[0];
}

const userMessages = [{ role: "user", content: "hi" }];
const geminiOk = (text: string) => ({ ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }) });
const groqOk = (text: string) => ({ ok: true, status: 200, json: async () => ({ choices: [{ message: { content: text } }] }) });
const fail429 = { ok: false, status: 429, json: async () => ({}) };

beforeEach(() => {
  vi.stubEnv("GEMINI_API_KEY", "g-key");
  vi.stubEnv("GROQ_API_KEY", "q-key");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("/api/chat handler", () => {
  it("rejects non-POST with 405", async () => {
    const res = makeRes();
    await handler(makeReq("GET", undefined), res as never);
    expect(res.statusCode).toBe(405);
  });

  it("rejects a malformed body with 400", async () => {
    const res = makeRes();
    await handler(makeReq("POST", { messages: "nope" }), res as never);
    expect(res.statusCode).toBe(400);
  });

  it("returns the first Gemini model's reply and stops", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("generativelanguage")) return geminiOk("from gemini") as never;
      throw new Error("groq should not be reached");
    });
    vi.stubGlobal("fetch", fetchMock);
    const res = makeRes();
    await handler(makeReq("POST", { messages: userMessages }), res as never);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ reply: "from gemini" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("falls through all Gemini models to Groq", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("generativelanguage")) return fail429 as never;
      if (url.includes("api.groq.com")) return groqOk("from groq") as never;
      throw new Error("unexpected url");
    });
    vi.stubGlobal("fetch", fetchMock);
    const res = makeRes();
    await handler(makeReq("POST", { messages: userMessages }), res as never);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ reply: "from groq" });
    expect(fetchMock).toHaveBeenCalledTimes(6); // 5 gemini + 1 groq
  });

  it("advances when a model returns 200 with an empty reply", async () => {
    let geminiCalls = 0;
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("generativelanguage")) {
        geminiCalls += 1;
        return geminiOk("") as never; // 200 OK but empty text -> must advance
      }
      if (url.includes("api.groq.com")) return groqOk("from groq") as never;
      throw new Error("unexpected url");
    });
    vi.stubGlobal("fetch", fetchMock);
    const res = makeRes();
    await handler(makeReq("POST", { messages: userMessages }), res as never);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ reply: "from groq" });
    expect(geminiCalls).toBe(5); // all 5 Gemini entries returned empty and were skipped
  });

  it("returns 502 when every model fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => fail429 as never));
    const res = makeRes();
    await handler(makeReq("POST", { messages: userMessages }), res as never);
    expect(res.statusCode).toBe(502);
  });

  it("skips Groq (no fetch) when GROQ_API_KEY is missing", async () => {
    vi.stubEnv("GROQ_API_KEY", "");
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("generativelanguage")) return fail429 as never;
      throw new Error("groq must not be called without a key");
    });
    vi.stubGlobal("fetch", fetchMock);
    const res = makeRes();
    await handler(makeReq("POST", { messages: userMessages }), res as never);
    expect(res.statusCode).toBe(502);
    expect(fetchMock).toHaveBeenCalledTimes(5); // only gemini attempts
  });
});
