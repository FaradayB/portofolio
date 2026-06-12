import { cv } from "../data/cv";
import { Entry } from "../data/cv";

function entryLines(label: string, entries: Entry[]): string {
  return entries
    .map((e) => `- [${label}] ${e.title} — ${e.org} (${e.date}): ${e.body}`)
    .join("\n");
}

export function buildSystemPrompt(): string {
  const skills = cv.skillGroups
    .map((g) => `${g.category}: ${g.skills.map((s) => s.name).join(", ")}`)
    .join("\n");
  const projects = cv.projects
    .map((p) => `- ${p.title} [${p.tech.join(", ")}]: ${p.description}`)
    .join("\n");
  const certs = cv.certifications.map((c) => `- ${c.title} (${c.sub})`).join("\n");
  const contact = cv.contact.map((c) => `${c.label}: ${c.value}`).join("\n");

  return [
    `You are the CV Companion for ${cv.name}, ${cv.role}.`,
    `Answer questions about this person ONLY using the CV below. If the CV does not`,
    `cover something, say you don't have that information. Be concise and professional.`,
    ``,
    `=== CV ===`,
    `Name: ${cv.name}`,
    `Role: ${cv.role}`,
    `Summary: ${cv.bio}`,
    ``,
    `Education:`,
    `- ${cv.education.title} — ${cv.education.org} (${cv.education.date}): ${cv.education.body}`,
    ``,
    `Experience:`,
    entryLines("Experience", cv.experience),
    ``,
    `Projects:`,
    projects,
    ``,
    `Research:`,
    entryLines("Research", cv.research),
    ``,
    `Leadership:`,
    entryLines("Leadership", cv.leadership),
    ``,
    `Skills:`,
    skills,
    ``,
    `Certifications:`,
    certs,
    ``,
    `Contact:`,
    contact,
    `=== END CV ===`,
  ].join("\n");
}
