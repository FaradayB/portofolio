import { describe, it, expect, vi } from "vitest";
import { FallbackEngine } from "./FallbackEngine";
import type { ChatEngine, InitProgress } from "./engine";

async function collect(iter: AsyncIterable<string>): Promise<string> {
  let acc = "";
  for await (const chunk of iter) acc += chunk;
  return acc;
}

function okEngine(reply: string): ChatEngine {
  return {
    init: async (onProgress: (p: InitProgress) => void) => {
      onProgress({ text: "ready", progress: 1 });
    },
    ask: async function* () {
      yield reply;
    },
  };
}

function failingEngine(): ChatEngine {
  return {
    init: async () => {},
    ask: async function* () {
      throw new Error("boom");
    },
  };
}

describe("FallbackEngine", () => {
  it("uses the primary engine when it succeeds", async () => {
    const primary = okEngine("from primary");
    const fallback = okEngine("from fallback");
    const engine = new FallbackEngine(primary, fallback);
    await engine.init(() => {});
    expect(await collect(engine.ask([]))).toBe("from primary");
  });

  it("falls back to the secondary engine when the primary fails to answer", async () => {
    const primary = failingEngine();
    const fallback = okEngine("from fallback");
    const initSpy = vi.spyOn(fallback, "init");
    const engine = new FallbackEngine(primary, fallback);
    await engine.init(() => {});
    expect(await collect(engine.ask([]))).toBe("from fallback");
    expect(initSpy).toHaveBeenCalledTimes(1);
  });

  it("falls back to the secondary engine when the primary fails to init", async () => {
    const primary: ChatEngine = {
      init: async () => { throw new Error("init failed"); },
      ask: async function* () {},
    };
    const fallback = okEngine("from fallback");
    const engine = new FallbackEngine(primary, fallback);
    await engine.init(() => {});
    expect(await collect(engine.ask([]))).toBe("from fallback");
  });
});
