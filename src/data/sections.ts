export type SectionId =
  | "profile" | "education" | "experience" | "records" | "research"
  | "leadership" | "skills" | "certifications" | "contact" | "companion";

export interface SectionMeta {
  id: SectionId;
  label: string;
  icon: string;  // tabler icon class
  hint: string;  // footer text when active
}

export const sections: SectionMeta[] = [
  { id: "profile",        label: "Profile",        icon: "ti-user",        hint: "Viewing Profile overview." },
  { id: "education",      label: "Education",      icon: "ti-school",      hint: "Viewing Education records." },
  { id: "experience",    label: "Experience",    icon: "ti-briefcase",   hint: "Viewing Experience records." },
  { id: "records",        label: "Records",        icon: "ti-trophy",      hint: "Viewing Project records." },
  { id: "research",       label: "Research",       icon: "ti-microscope",  hint: "Viewing Research records." },
  { id: "leadership",     label: "Leadership",     icon: "ti-crown",       hint: "Viewing Leadership records." },
  { id: "skills",         label: "Skills",         icon: "ti-chart-bar",   hint: "Viewing Skills ratings." },
  { id: "certifications", label: "Certifications", icon: "ti-certificate", hint: "Viewing Certifications." },
  { id: "contact",        label: "Contact",        icon: "ti-mail",        hint: "Viewing Contact links." },
  { id: "companion",      label: "Companion",      icon: "ti-message-chatbot", hint: "Talking with the CV Companion." },
];
