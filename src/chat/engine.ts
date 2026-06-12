import { CreateMLCEngine, MLCEngineInterface } from "@mlc-ai/web-llm";

export const MODEL_ID = "Qwen2.5-0.5B-Instruct-q4f16_1-MLC";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface InitProgress {
  text: string;
  progress: number; // 0..1
}

export interface ChatEngine {
  init(onProgress: (p: InitProgress) => void): Promise<void>;
  ask(messages: ChatMessage[]): AsyncIterable<string>;
}

/** Detects WebGPU support without instantiating the model. */
export function isWebGpuAvailable(): boolean {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}

export class WebLLMEngine implements ChatEngine {
  private engine: MLCEngineInterface | null = null;

  async init(onProgress: (p: InitProgress) => void): Promise<void> {
    this.engine = await CreateMLCEngine(MODEL_ID, {
      initProgressCallback: (r) => onProgress({ text: r.text, progress: r.progress }),
    });
  }

  async *ask(messages: ChatMessage[]): AsyncIterable<string> {
    if (!this.engine) throw new Error("Engine not initialized");
    const stream = await this.engine.chat.completions.create({
      messages,
      stream: true,
      temperature: 0.4,
    });
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield delta;
    }
  }
}
