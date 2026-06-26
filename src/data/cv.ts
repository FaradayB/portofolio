export interface Entry {
  title: string;
  org: string;
  date: string;
  body: string;
}

export interface Skill {
  name: string;
  pct: number;
}

export interface SkillGroup {
  category: string;
  color: string; // bar fill color
  skills: Skill[];
}

export interface Project {
  title: string;
  tech: string[];
  description: string;
  repo?: string; // optional GitHub URL — fill in when available
  demo?: string; // optional live demo URL — fill in when available
}

export interface Certification {
  title: string;
  sub: string;
}

import { IconName } from "../components/Icon";

export interface ContactItem {
  icon: IconName;
  label: string;
  value: string;
  href?: string;
}

export interface CV {
  name: string;
  role: string;
  bio: string;
  emailHint: string;
  githubHint: string;
  resumePdf: string; // path to the downloadable CV (served from public/)
  stats: string[];
  education: Entry;
  experience: Entry[];
  projects: Project[];
  research: Entry[];
  leadership: Entry[];
  skillGroups: SkillGroup[];
  certifications: Certification[];
  contact: ContactItem[];
}

export const cv: CV = {
  name: "Faraday Barr Fatahillah",
  role: "AI Engineer",
  bio:
    "I build end-to-end AI systems from model training to cloud deployment. " +
    "Experienced across LLM / RAG, computer vision (YOLOv8), and IoT, with " +
    "production MLOps on FastAPI, Docker, GCP, Prometheus and Grafana." +
    "\n\nComputer Engineering, Telkom University — highest GPA in my major.",
  emailHint: "faradaybarrf@gmail.com",
  githubHint: "github.com/FaradayB",
  resumePdf: "/CV-FARADAY%20BARR%20FATAHILLAH-1.pdf",
  stats: ["GPA 3.88", "Top of Major"],
  education: {
    title: "Bachelor of Computer Engineering",
    org: "Telkom University — Bandung, Indonesia",
    date: "Sep 2021 – Aug 2025",
    body:
      "GPA: 3.88 / 4.00 · Highest GPA in major · Led 15 teaching assistants · " +
      "Mentored 250+ students",
  },
  experience: [
    {
      title: "AI Engineer Bootcamp Trainee",
      org: "PT. Berlian Sistem Informasi — Jakarta",
      date: "Apr 2026 – Sep 2026",
      body:
        "Built end-to-end AI predictive maintenance system on GCP with Docker, " +
        "FastAPI, Prometheus, Grafana. Built RAG chatbot using Azure AI Foundry, " +
        "LangChain, Azure AI Search. Engineered prompts for grounding and token " +
        "efficiency, validated via Azure Evaluations.",
    },
    {
      title: "Deputy Assistant Coordinator",
      org: "i-Smile Laboratory — Bandung",
      date: "Jul 2024 – Jun 2025",
      body:
        "Designed and delivered 7 hands-on AI practicum sessions in Python. Led ML " +
        "study group for 50+ students covering fundamentals and workflows.",
    },
    {
      title: "Machine Learning Cohort",
      org: "Bangkit Academy",
      date: "Sep 2024 – Dec 2024",
      body:
        "Built SugarCare diabetes prediction app — 83% accuracy. Studied deep " +
        "learning and GANs. Recognized as Active Participant.",
    },
    {
      title: "Teaching Assistant",
      org: "Telkom University — Bandung",
      date: "Sep 2024 – Aug 2025",
      body:
        "Assisted 5 courses including IoT and Control Systems. Contributed to course " +
        "materials, assessments, and grading.",
    },
    {
      title: "Assistant Coordinator",
      org: "SEA Laboratory — Bandung",
      date: "Jul 2023 – Jun 2024",
      body:
        "Designed and delivered 7 hands-on AI practicum sessions in Python. Led ML " +
        "study group for 50+ students covering fundamentals and workflows.",
    },
  ],
  projects: [
    {
      title: "AI Predictive Maintenance",
      tech: ["GCP", "Docker", "FastAPI", "Prometheus", "Grafana"],
      description:
        "End-to-end predictive maintenance system on GCP with a containerized FastAPI " +
        "service, monitored via Prometheus and Grafana dashboards.",
      // repo: "https://github.com/FaradayB/...",
      // demo: "https://...",
    },
    {
      title: "RAG Chatbot",
      tech: ["Azure AI Foundry", "LangChain", "Azure AI Search", "Blob Storage"],
      description:
        "Retrieval-augmented chatbot grounded on document search, with prompt " +
        "engineering for grounding and token efficiency validated via Azure Evaluations.",
    },
    {
      title: "SugarCare",
      tech: ["TensorFlow", "Python", "Streamlit"],
      description:
        "Diabetes prediction app reaching 83% accuracy — Bangkit Academy ML capstone.",
    },
    {
      title: "Fall Detection",
      tech: ["YOLOv8", "Computer Vision", "Android"],
      description:
        "Real-time fall detection research using YOLOv8, with debugging support and " +
        "hardware-software coordination.",
    },
    {
      title: "RFID Inventory Management",
      tech: ["RFID", "Android (Kotlin)"],
      description:
        "RFID-based inventory system with a companion Android app; led the system " +
        "experiments end to end.",
    },
  ],
  research: [
    {
      title: "Student Researcher",
      org: "Telkom University",
      date: "Feb 2024 – Aug 2025",
      body:
        "Led RFID-based inventory management research, built Android Kotlin app, led " +
        "system experiments. Supported fall detection research through debugging, " +
        "knowledge transfer, and hardware-software coordination.",
    },
  ],
  leadership: [
    {
      title: "Head of Academics & Profession Dept.",
      org: "HMTK (Computer Engineering Student Assoc.) — Bandung",
      date: "Dec 2024 – Aug 2025",
      body:
        "Managed department activities, coordinated company visits, led academic " +
        "study groups for 100+ students.",
    },
    {
      title: "Organizer",
      org: "AWS Gen-AI Tour",
      date: "Aug 2024",
      body:
        "Led student organizer team across Telkom University and Binus University. " +
        "Managed speakers, materials, and technical operations for AWS generative AI " +
        "hands-on event.",
    },
  ],
  skillGroups: [
    {
      category: "AI & Machine Learning",
      color: "#e08010",
      skills: [
        { name: "Python", pct: 95 },
        { name: "TensorFlow/PyTorch", pct: 90 },
        { name: "Scikit-learn", pct: 88 },
        { name: "YOLO / CV", pct: 85 },
        { name: "RAG / LLM", pct: 90 },
        { name: "LangChain", pct: 85 },
      ],
    },
    {
      category: "MLOps & Cloud",
      color: "#1858b0",
      skills: [
        { name: "Docker", pct: 88 },
        { name: "GCP", pct: 82 },
        { name: "Azure AI Foundry", pct: 85 },
        { name: "FastAPI", pct: 88 },
        { name: "Prometheus/Grafana", pct: 80 },
      ],
    },
    {
      category: "Other & Hardware",
      color: "#20a040",
      skills: [
        { name: "Android (Kotlin)", pct: 75 },
        { name: "Arduino / ESP32", pct: 78 },
        { name: "C", pct: 72 },
        { name: "Streamlit", pct: 85 },
      ],
    },
  ],
  certifications: [
    { title: "Generative AI for Everyone", sub: "Coursera, 2024" },
    { title: "DeepLearning.AI TensorFlow Developer Specialization", sub: "2024" },
    { title: "Structuring Machine Learning Projects", sub: "DeepLearning.AI, 2024" },
    { title: "Machine Learning Specialization", sub: "DeepLearning.AI, 2024" },
  ],
  contact: [
    { icon: "mail", label: "Email", value: "faradaybarrf@gmail.com", href: "mailto:faradaybarrf@gmail.com" },
    { icon: "linkedin", label: "LinkedIn", value: "linkedin.com/in/faradaybarr", href: "https://linkedin.com/in/faradaybarr" },
    { icon: "github", label: "GitHub", value: "github.com/FaradayB", href: "https://github.com/FaradayB" },
  ],
};
