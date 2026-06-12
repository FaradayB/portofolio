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

export interface Certification {
  title: string;
  sub: string;
}

export interface ContactItem {
  icon: string; // tabler icon class, e.g. "ti-phone"
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
  stats: string[];
  education: Entry;
  experience: Entry[];
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
    "I build end-to-end AI systems — from model training to cloud deployment. " +
    "Experienced across LLM / RAG, computer vision (YOLOv8), and IoT, with " +
    "production MLOps on FastAPI, Docker, GCP, Prometheus and Grafana. " +
    "Computer Engineering graduate, Telkom University — highest GPA in my major.",
  emailHint: "faradaybarrf@gmail.com",
  githubHint: "github.com/FaradayB",
  stats: ["GPA 3.88", "250+ Students Mentored", "Top of Major"],
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
      date: "Jul 2024 – Jul 2025",
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
    { icon: "ti-phone", label: "Phone", value: "+6281282658563", href: "tel:+6281282658563" },
    { icon: "ti-mail", label: "Email", value: "faradaybarrf@gmail.com", href: "mailto:faradaybarrf@gmail.com" },
    { icon: "ti-brand-linkedin", label: "LinkedIn", value: "linkedin.com/in/faradaybarr", href: "https://linkedin.com/in/faradaybarr" },
    { icon: "ti-brand-github", label: "GitHub", value: "github.com/FaradayB", href: "https://github.com/FaradayB" },
  ],
};
