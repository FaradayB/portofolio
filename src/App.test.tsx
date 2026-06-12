import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

describe("App navigation", () => {
  it("shows Profile by default with the first button active", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: /Profile/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/Viewing Profile overview\./)).toBeInTheDocument();
  });

  it("switches sections on click and updates the footer hint", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /Experience/ }));
    expect(screen.getByRole("button", { name: /Experience/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/Viewing Experience records\./)).toBeInTheDocument();
    // Profile content (role headline) no longer shown
    expect(screen.queryByText("AI Engineer", { selector: ".profile-role" })).not.toBeInTheDocument();
    // an Experience card is shown
    expect(screen.getByText("AI Engineer Bootcamp Trainee")).toBeInTheDocument();
  });
});
