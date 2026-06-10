# Portfolio Website Design — Faraday Barr Fatahillah

**Date:** 2026-06-05  
**Folder:** `portofolio-hero-web-cv/`  
**Type:** One-page personal portfolio website

---

## Goal

A single-page portfolio targeting both local Indonesian companies and international remote roles, positioning Faraday as an **AI/ML Engineer**. The site pulls identity from the resume (`personal-hero-web-cv/CV-FARADAY BARR FATAHILLAH-1.pdf`) and highlights three flagship projects from the Hacktiv8 bootcamp and academic work.

---

## Tech Stack

- **React.js (via Vite)** — component-based structure, fast dev server, easy GitHub Pages deployment
- **Tailwind CSS** — utility-first styling configured via PostCSS
- **Google Fonts** — `JetBrains Mono` (terminal elements) + `Inter` (body text)
- **Vanilla JS within React** — typewriter animation via `useEffect`, scroll tracking via IntersectionObserver

The deliverable is a Vite + React project that builds to a `dist/` folder for static hosting.

---

## Visual Language

| Token | Value |
|---|---|
| Background | `#0d1117` |
| Card background | `#161b22` |
| Primary accent (green) | `#00ff88` |
| Secondary accent (blue) | `#58a6ff` |
| Body text | `#e6edf3` |
| Muted text | `#8b949e` |
| Font — terminal/headings | JetBrains Mono |
| Font — body | Inter |

**Aesthetic:** Dark tech / terminal. Section headers styled as shell commands. Stats styled as code key-value pairs. Skills styled as a JS object literal. Subtle scanline/noise CSS texture on hero background.

**Interactions:**
- Hero: typewriter animation on name (80ms/char), blinking `_` cursor, sequential fade-in for subtitle and bio
- Navbar: highlights active section on scroll, collapses to hamburger on mobile
- Project cards: `1px` border glows `#00ff88` on hover
- Sections: fade-up on scroll entry (IntersectionObserver)

---

## Page Sections

### 1. Navbar (fixed)
```
> portfolio/faraday          [about]  [skills]  [projects]  [experience]  [contact]
```
- Logo: `> portfolio/faraday` in JetBrains Mono, green
- Nav links turn green on hover/active section
- Hamburger menu on mobile

### 2. Hero (100vh)
```
$ whoami

Faraday Barr Fatahillah_

AI/ML Engineer · Researcher · Builder

Computer engineering graduate · 3.88 GPA · Published researcher at IC2IE
Passionate about building intelligent systems that work in the real world.

[ View Projects ]    [ Download CV ]    GitHub ↗   LinkedIn ↗
```
- `$ whoami` pre-rendered in muted green
- Name types out, then subtitle and bio fade in sequentially
- `[ View Projects ]` — solid green pill, scrolls to projects section
- `[ Download CV ]` — outlined pill, links to CV PDF
- GitHub and LinkedIn as plain icon links

### 3. About (2-column desktop, stacked mobile)

**Left — bio text:**
```
> about_me

I'm a Computer Engineering graduate from Telkom University (3.88 GPA,
highest in my major) with a focus on AI, machine learning, and
intelligent systems. I've built and deployed end-to-end AI pipelines,
published research at international conferences, and taught ML to
hundreds of students.

Currently expanding into LLM applications and production AI systems
through the Hacktiv8 LLM Bootcamp.
```

**Right — stat badges (code key-value style):**
```
degree      = "B.Eng Computer Engineering"
university  = "Telkom University"
gpa         = 3.88 / 4.00  // highest in major
research    = "Published · 8th IC2IE speaker"
languages   = ["Indonesian (native)", "English (fluent)"]
```

### 4. Skills (full width)
```
> skills --list

const skills = {
  ml_frameworks : [ Python, TensorFlow, PyTorch, Scikit-learn ],
  llm_stack     : [ RAG, ChromaDB, LangChain, Gemini, Ollama ],
  data          : [ Pandas, NumPy, Jupyter, SQL, Power BI ],
  deployment    : [ FastAPI, Docker, Streamlit, Prometheus ],
  web           : [ React, Tailwind, HTML, CSS, Bootstrap ],
  embedded      : [ Arduino, ESP32, YOLO, Android Studio, C ],
}
```
- Category labels in muted green monospace
- Each skill as a small dark pill with border, green on hover

### 5. Projects (3-column desktop, stacked mobile)
```
> ls projects/
```

**Card 1 — MitsuCare**
- Header: `[01] final_project/mitsucare`
- Title: AI-Powered Predictive Maintenance
- Description: End-to-end system detecting vehicle fault patterns before warning lights appear. Two-track LLM pipeline (RAG + Gemini) serving technicians and owners.
- Tech: `Python · FastAPI · ChromaDB · Docker · Gemini · SVM · Streamlit`
- Link: `[ GitHub ↗ ]` (URL to be added)

**Card 2 — Fall Detection System**
- Header: `[02] thesis/fall_detection`
- Title: YOLOv8 Fall Detection + Smart Home
- Description: Real-time fall detection integrated with an Android app and voice-command home automation. Research published at 8th IC2IE international conference.
- Tech: `Python · YOLOv8 · Android · TensorFlow`
- Link: `[ Research Paper ↗ ]` (URL to be added)

**Card 3 — SugarCare**
- Header: `[03] bangkit/sugarcare`
- Title: Diabetes Tracking & Prediction App
- Description: Mobile app for diabetes monitoring and ML-powered risk prediction. Capstone project for Bangkit Academy (Google, Tokopedia, Gojek, Traveloka).
- Tech: `Python · TensorFlow · Android Studio`
- Link: `[ GitHub ↗ ]` (URL to be added)

Card styling: background `#161b22`, `1px` border, green glow on hover. Header in muted green monospace. Tech tags as small dark pills.

### 6. Experience (compact timeline)
```
> git log --experience

  2024–2025   Teaching Assistant · Telkom University
              Power Supply Design, IoT, Discreet Math, Control System

  2024–2025   Deputy Asst. Coordinator · i-Smile Lab (AI/ML Lab)
              Instructed AI practicum · coordinated ML study group (50+ students)

  2024        Machine Learning Cohort · Bangkit Academy
              Google × Tokopedia × Gojek × Traveloka

  2024        Public Relations Intern · KAI (Kereta Api Indonesia)
              Built React + Bootstrap website for Bandung station

  2023–2024   Asst. Coordinator · SEA Lab (Software & App Dev Lab)
              Led 15 TAs · mentored 250+ students in OOP & algorithms
```
- Year in green monospace, role/org in white, description in muted gray
- No elaborate graphics — clean scannable rows

### 7. Contact (centered)
```
> contact --open

  Let's build something.

  [ faradaybarrf@gmail.com ]   [ LinkedIn ↗ ]   [ GitHub ↗ ]
```
- Three pill links in a row
- Footer: `Faraday Barr Fatahillah · 2026` in muted text

---

## File Structure

```
portofolio-hero-web-cv/
├── public/
│   └── CV-FARADAY BARR FATAHILLAH-1.pdf   # copied from personal-hero-web-cv/
├── src/
│   ├── main.jsx                # React entry point
│   ├── App.jsx                 # root component, assembles all sections
│   ├── index.css               # Tailwind directives + custom CSS (fonts, scanline)
│   └── components/
│       ├── Navbar.jsx
│       ├── Hero.jsx
│       ├── About.jsx
│       ├── Skills.jsx
│       ├── Projects.jsx
│       ├── Experience.jsx
│       └── Contact.jsx
├── index.html                  # Vite entry HTML
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
└── docs/
    └── superpowers/
        └── specs/
            └── 2026-06-05-portfolio-website-design.md
```

The CV PDF is placed in `public/` so Vite serves it as a static asset at `/CV-FARADAY BARR FATAHILLAH-1.pdf`.

---

## Responsive Behavior

| Breakpoint | Layout |
|---|---|
| Mobile (`< 768px`) | Single column, hamburger nav, cards stacked |
| Tablet (`768px–1024px`) | 2-column about, 2-column projects |
| Desktop (`> 1024px`) | 2-column about, 3-column projects |

---

## Out of Scope

- Contact form (links only)
- Backend / server-side logic
- CMS or dynamic content
- Animation libraries (all motion via Tailwind + CSS + vanilla JS inside React hooks)
- Additional projects beyond the three selected
