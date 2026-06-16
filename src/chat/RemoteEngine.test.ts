import { describe, it, expect, vi, afterEach } from "vitest";
import { RemoteEngine } from "./RemoteEngine";

async function collect(iter: AsyncIterable<string>): Promise<string> {
  let acc = "";
  for await (const chunk of iter) acc += chunk;
  return acc;
}

describe("RemoteEngine", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts the messages to /api/chat and yields the reply", async () => {
    const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
      expect(url).toBe("/api/chat");
      expect(JSON.parse(init.body as string)).toEqual({
        messages: [{ role: "user", content: "hi" }],
      });
      return new Response(JSON.stringify({ reply: "hello there" }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const engine = new RemoteEngine();
    const reply = await collect(engine.ask([{ role: "user", content: "hi" }]));
    expect(reply).toBe("hello there");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("throws before yielding anything when the response is not ok", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 500 })));
    const engine = new RemoteEngine();
    await expect(collect(engine.ask([{ role: "user", content: "hi" }]))).rejects.toThrow();
  });

  it("throws when the response body is malformed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ nope: true }), { status: 200 })),
    );
    const engine = new RemoteEngine();
    await expect(collect(engine.ask([{ role: "user", content: "hi" }]))).rejects.toThrow();
  });
});
