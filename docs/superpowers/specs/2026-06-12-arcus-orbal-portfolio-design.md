# ARCUS / Orbal Portfolio — Faraday Barr Fatahillah

**Date:** 2026-06-12
**Type:** Multi-page static portfolio, themed on the *Trails / Kiseki* series (ARCUS orbment terminal, Erebonia / Trails of Cold Steel aesthetic)
**Supersedes:** `2026-06-05-portfolio-website-design.md` (dark-terminal single-page concept)

---

## Concept

The portfolio *is* an ARCUS orbment terminal. Navigating the site mirrors navigating
the in-game ARCUS menu. Deep navy background, electric-cyan glow, hexagonal quartz,
rotating orbital "link" rings, holographic HUD framing.

Chosen direction: **B — Erebonia / Trails of Cold Steel (ARCUS)**, picked over Liberl
(Sky) and Calvard (Daybreak/Kuro) during brainstorming.

---

## Structure — True Multi-Page

Five separate HTML pages, each an ARCUS "screen", sharing one HUD frame + CSS + JS.
Each is its own URL with a page-transition flash between them. Pure static
HTML/CSS/JS — no build step, no Node — deploys straight to GitHub Pages.

| URL | ARCUS tab | Content |
|---|---|---|
| `index.html` | **STATUS** | Hero / character profile: typewriter name, "Class: AI Engineer", hex portrait (user photo), animated stat bars, summary, `[Enter ARCUS]` + `[Download CV]` |
| `orbment.html` | **ORBMENT** | Skills as quartz set into an orbment grid; elemental color per category; glow + tooltip on hover |
| `records.html` | **RECORDS** | Projects as "Battle Records" cards: rank, tech-quartz tags, `[Repo ↗][Demo ↗]` (URLs supplied later) |
| `log.html` | **LOG** | Experience + Education + Leadership as an ARCUS timeline; Certifications & Languages |
| `link.html` | **LINK** | Contact as the "bonding/link" screen: email, LinkedIn, GitHub as glowing link nodes |

### Shared HUD frame (every page)
- Top ARCUS tab-bar nav; active tab glows.
- Animated rotating link-ring + particle/starfield background.
- Corner HUD brackets + subtle scanline overlay.
- "CONNECTING…" boot flash on every page transition.

---

## Visual System

| Token | Value |
|---|---|
| Background | `#04060f` → `#070d1c` gradient |
| Surface | navy glass, `rgba(20,40,70,.35)` |
| Primary cyan | `#39c0ff` / bright `#5fd3ff` |
| White glow | `#eaf6ff` |
| Amber highlight | `#ffb454` |
| Muted | `#8aa0c6` |

**Elemental quartz colors (skill categories):** earth `#ff8a3c`, water `#39c0ff`,
fire `#ff5a4c`, wind `#5fe0a0`, time `#ffd24a`, space `#c9d4e6`, mirage `#b07cff`.

**Fonts (Google Fonts):** Orbitron (display/headings), Chakra Petch (HUD/mono labels),
Rajdhani (body).

**Effects:** typewriter name; pulsing glows; rotating SVG link rings; hex clip-paths;
scanline overlay; IntersectionObserver scroll fade-ups; animated stat bars; quartz
hover glow + tooltip; page-transition flash.

---

## File Structure

```
index.html  orbment.html  records.html  log.html  link.html
assets/
  css/arcus.css      # shared theme + HUD frame + per-page styles
  js/arcus.js        # nav active-state, page transitions, typewriter, observers
  img/               # user profile photo
public/
  CV-FARADAY BARR FATAHILLAH-1.pdf   # kept, linked from STATUS
docs/superpowers/specs/2026-06-12-arcus-orbal-portfolio-design.md
```

**Removed (vestigial / misleading):** `package.json`, `vite.config.js`,
`tailwind.config.js`, `postcss.config.js`, old pink `index.html`. There was never a
`src/` folder; the prior Vite+React setup was never wired up. Going pure-static.

---

## Content (reconstructed from resume, OCR garble corrected)

- **Identity:** Faraday Barr Fatahillah — AI Engineer. End-to-end AI systems from model
  training to cloud deployment. LLM/RAG, Computer Vision (YOLOv8), IoT. Production MLOps
  with FastAPI, Docker, GCP, Prometheus, Grafana.
- **Contact:** +62 812-8265-8563 · faradaybarrf@gmail.com ·
  linkedin.com/in/faradaybarr · github.com/FaradayB
- **Education:** Telkom University, Bandung — B.Eng Computer Engineering, 3.88/4.00
  (Sep 2021–Aug 2025). Highest GPA in major. Led 15 TAs, mentored 250+ students.
- **Experience:**
  - PT. Berlian Sistem Informasi, Jakarta — AI Engineer Bootcamp Trainee (Apr–Sep 2026,
    current): predictive-maintenance PoC on GCP (Docker/FastAPI/Prometheus/Grafana);
    RAG chatbot (Azure AI Foundry, LangChain, Azure AI Search, Blob Storage); prompt
    engineering validated with Azure Evaluations; demos to mentors/users.
  - i-Smile Laboratory, Bandung — Deputy Assistant Coordinator (Jul 2024–Jul 2025):
    7 Python AI practicum sessions; ML study group (50+ students).
  - Bangkit Academy — ML Cohort (Sep–Dec 2024): SugarCare diabetes app, 83% accuracy
    capstone; Active Participant.
  - Telkom University — Student Researcher (Feb 2024–Aug 2025): RFID inventory research
    + Android Kotlin app; fall-detection research support.
  - Telkom University — Teaching Assistant (Sep 2024–Aug 2025): 5 courses incl. IoT &
    Control Systems.
- **Leadership:** HMTK Head of Academics & Profession Dept (Dec 2024–Aug 2025, 100+
  students); AWS Gen-AI Tour Organizer (Aug 2024).
- **Skills → quartz lines:**
  - ML / Modeling: Python, TensorFlow, PyTorch, Scikit-learn, YOLO
  - LLM / RAG: RAG/LLM, LangChain, Azure AI Foundry
  - Data: Pandas, NumPy, Streamlit
  - MLOps / Deploy: FastAPI, Docker, GCP, Prometheus, Grafana, Nginx
  - IoT / Embedded: Arduino, ESP32, Android Studio (Kotlin), C
- **Languages:** English (Fluent), Indonesian (Native).
- **Certifications (2024):** Generative AI for Everyone; DeepLearning.AI TensorFlow
  Developer Specialization; Structuring Machine Learning Projects; Machine Learning
  Specialization.

**Featured projects (Battle Records):**
1. AI Predictive Maintenance — GCP, Docker, FastAPI, Prometheus, Grafana
2. RAG Chatbot — Azure AI Foundry, LangChain, Azure AI Search, Blob Storage
3. SugarCare — diabetes prediction app, TensorFlow (83% accuracy)
4. Fall Detection — YOLOv8, Android
5. RFID Inventory Management — RFID, Android (Kotlin)

Project repo/demo URLs and profile photo to be supplied by user; placeholders until then.

---

## Out of Scope
- Contact form / backend (links only).
- Frameworks / build tooling (pure static).
- Real-time data, CMS.
