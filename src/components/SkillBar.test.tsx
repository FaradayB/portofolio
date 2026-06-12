import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import SkillBar from "./SkillBar";

describe("SkillBar", () => {
  it("renders the label and a fill sized + colored by props", () => {
    render(<SkillBar name="Python" pct={95} color="#e08010" />);
    expect(screen.getByText("Python")).toBeInTheDocument();
    const fill = document.querySelector(".skill-fill") as HTMLElement;
    expect(fill.style.width).toBe("95%");
    expect(fill.style.background).toBe("rgb(224, 128, 16)");
  });
});
