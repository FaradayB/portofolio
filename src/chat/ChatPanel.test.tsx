import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChatPanel from "./ChatPanel";
import type { ChatEngine } from "./engine";

function mockEngine(reply: string): ChatEngine {
  return {
    ask: async function* () {
      for (const ch of reply.split(" ")) yield ch + " ";
    },
  };
}

describe("ChatPanel", () => {
  it("shows the input immediately with no Start gate", () => {
    render(<ChatPanel engine={mockEngine("hi")} />);
    expect(screen.getByPlaceholderText(/ask/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /start companion/i })).not.toBeInTheDocument();
  });

  it("answers a question", async () => {
    const user = userEvent.setup();
    render(<ChatPanel engine={mockEngine("Faraday is an AI Engineer")} />);
    const input = screen.getByPlaceholderText(/ask/i);
    await user.type(input, "What does he do?");
    await user.click(screen.getByRole("button", { name: /send/i }));
    expect(await screen.findByText(/Faraday is an AI Engineer/)).toBeInTheDocument();
  });

  it("shows an error and stays usable when the engine fails", async () => {
    const failingEngine: ChatEngine = {
      ask: async function* () {
        throw new Error("network down");
      },
    };
    const user = userEvent.setup();
    render(<ChatPanel engine={failingEngine} />);
    const input = screen.getByPlaceholderText(/ask/i);
    await user.type(input, "What does he do?");
    await user.click(screen.getByRole("button", { name: /send/i }));
    expect(await screen.findByText(/couldn't reach the model/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send/i })).not.toBeDisabled();
  });
});
