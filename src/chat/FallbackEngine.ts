import { ChatEngine, ChatMessage, InitProgress } from "./engine";

/**
 * Tries the primary engine first; if its init or ask fails, switches to the
 * fallback engine (lazily initializing it) and retries. Safe because the primary
 * (RemoteEngine) only ever throws before yielding anything, so there's never
 * partial output to discard.
 */
export class FallbackEngine implements ChatEngine {
  private current: ChatEngine;
  private usingFallback = false;

  constructor(primary: ChatEngine, private fallback: ChatEngine) {
    this.current = primary;
  }

  async init(onProgress: (p: InitProgress) => void): Promise<void> {
    try {
      await this.current.init(onProgress);
    } catch {
      this.usingFallback = true;
      this.current = this.fallback;
      await this.current.init(onProgress);
    }
  }

  async *ask(messages: ChatMessage[]): AsyncIterable<string> {
    if (!this.usingFallback) {
      try {
        yield* this.current.ask(messages);
        return;
      } catch {
        this.usingFallback = true;
        this.current = this.fallback;
        await this.current.init(() => {});
      }
    }
    yield* this.current.ask(messages);
  }
}
