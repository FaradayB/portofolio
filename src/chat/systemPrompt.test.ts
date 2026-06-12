import { describe, it, expect } from "vitest";
import { buildSystemPrompt } from "./systemPrompt";

describe("buildSystemPrompt", () => {
  it("embeds key CV facts", () => {
    const p = buildSystemPrompt();
    expect(p).toContain("Faraday Barr Fatahillah");
    expect(p).toContain("AI Engineer");
    expect(p).toContain("3.88");
    expect(p).toContain("AI Engineer Bootcamp Trainee");
    expect(p).toContain("RAG Chatbot");
  });

  it("instructs the model to answer only from the CV", () => {
    const p = buildSystemPrompt().toLowerCase();
    expect(p).toContain("only");
    expect(p).toContain("cv");
  });
});
