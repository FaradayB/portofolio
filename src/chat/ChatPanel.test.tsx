import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChatPanel from "./ChatPanel";
import type { ChatEngine, InitProgress } from "./engine";

function mockEngine(reply: string): ChatEngine {
  return {
    init: async (onProgress: (p: InitProgress) => void) => {
      onProgress({ text: "loading", progress: 1 });
    },
    ask: async function* () {
      for (const ch of reply.split(" ")) yield ch + " ";
    },
  };
}

describe("ChatPanel", () => {
  it("shows a fallback when WebGPU is unavailable", () => {
    render(<ChatPanel engine={mockEngine("hi")} webGpuAvailable={false} />);
    expect(screen.getByText(/WebGPU/i)).toBeInTheDocument();
  });

  it("does not load the model until the visitor opts in", () => {
    render(<ChatPanel engine={mockEngine("hi")} webGpuAvailable={true} />);
    expect(screen.getByRole("button", { name: /start companion/i })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/ask/i)).not.toBeInTheDocument();
  });

  it("loads on opt-in then answers a question by streaming", async () => {
    const user = userEvent.setup();
    render(<ChatPanel engine={mockEngine("Faraday is an AI Engineer")} webGpuAvailable={true} />);
    await user.click(screen.getByRole("button", { name: /start companion/i }));
    const input = await screen.findByPlaceholderText(/ask/i);
    await user.type(input, "What does he do?");
    await user.click(screen.getByRole("button", { name: /send/i }));
    expect(await screen.findByText(/Faraday is an AI Engineer/)).toBeInTheDocument();
  });
});
