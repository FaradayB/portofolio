import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Profile from "./Profile";
import Experience from "./Experience";
import Records from "./Records";
import Skills from "./Skills";
import Contact from "./Contact";

describe("sections render CV data", () => {
  it("Profile shows role, bio and three stat pills", () => {
    render(<Profile />);
    expect(screen.getByText("AI Engineer", { selector: ".profile-role" })).toBeInTheDocument();
    expect(document.querySelectorAll(".stat-pill")).toHaveLength(3);
  });

  it("Experience shows all four cards", () => {
    render(<Experience />);
    expect(document.querySelectorAll(".card")).toHaveLength(4);
    expect(screen.getByText("AI Engineer Bootcamp Trainee")).toBeInTheDocument();
  });

  it("Records shows a card per project with tech tags", () => {
    render(<Records />);
    expect(document.querySelectorAll(".project")).toHaveLength(5);
    expect(document.querySelectorAll(".tech-tag").length).toBeGreaterThan(5);
    expect(screen.getByText("RAG Chatbot")).toBeInTheDocument();
  });

  it("Skills renders three groups and all bars", () => {
    render(<Skills />);
    expect(document.querySelectorAll(".skill-group-head")).toHaveLength(3);
    expect(document.querySelectorAll(".skill-row")).toHaveLength(15);
  });

  it("Contact shows four items", () => {
    render(<Contact />);
    expect(document.querySelectorAll(".contact-item")).toHaveLength(4);
  });
});
