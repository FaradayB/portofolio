import { IconName } from "../components/Icon";

export type SectionId =
  | "profile" | "education" | "experience" | "records" | "research"
  | "leadership" | "skills" | "certifications" | "contact" | "companion";

export interface SectionMeta {
  id: SectionId;
  label: string;
  icon: IconName;
  hint: string;  // footer text when active
}

export const sections: SectionMeta[] = [
  { id: "profile",        label: "Profile",        icon: "user",        hint: "Viewing Profile overview." },
  { id: "education",      label: "Education",      icon: "school",      hint: "Viewing Education records." },
  { id: "experience",     label: "Experience",     icon: "briefcase",   hint: "Viewing Experience records." },
  { id: "records",        label: "Records",        icon: "trophy",      hint: "Viewing Project records." },
  { id: "research",       label: "Research",       icon: "microscope",  hint: "Viewing Research records." },
  { id: "leadership",     label: "Leadership",     icon: "crown",       hint: "Viewing Leadership records." },
  { id: "skills",         label: "Skills",         icon: "chart",       hint: "Viewing Skills ratings." },
  { id: "certifications", label: "Certifications", icon: "certificate", hint: "Viewing Certifications." },
  { id: "contact",        label: "Contact",        icon: "mail",        hint: "Viewing Contact links." },
  { id: "companion",      label: "Companion",      icon: "chat",        hint: "Talking with the CV Companion." },
];
