Create a single-file HTML/CSS/JS interactive CV page styled exactly like
the Camp Menu UI from Trails of Cold Steel (JRPG). All content comes from
the resume data below. Here are the precise visual specs:

═══════════════════════════════════════
BACKGROUND
═══════════════════════════════════════

- CSS gradient bottom to top:
  #2e3d4a (bottom) → #4a6070 at 30% → #7a95a8 at 70% → #8faabb (top)
- Overlay a tight SVG honeycomb using TWO offset <pattern> elements
  (18px wide × 20.8px tall each, second offset by x:9 y:10.4) so hexagons
  interlock with no gaps. Stroke color #2e3d4a, stroke-width 0.8, no fill.

═══════════════════════════════════════
HEADER BAR
═══════════════════════════════════════

- No separate background — sits directly on the gradient
- Left: circular dark badge (#1a1e28, gold border #c8a030) with a chess
  knight icon in gold as crest, next to:
  - Name "FARADAY BARR FATAHILLAH" in Cinzel bold ~22px, color #e8d070,
    text-shadow 1px 1px 3px rgba(0,0,0,0.53)
  - Below: a 3px solid red (#b82020) horizontal line
  - Below that: "AI Engineer" in Cinzel ~11px, letter-spacing 3px,
    color #e8b840
- Right side: two shortcut hints in Cinzel 12px color #ddd8c0:
  - Two small square icons + ": faradaybarrf@gmail.com"
  - Small key badge "↗" + ": github.com/FaradayB"

═══════════════════════════════════════
LEFT SIDEBAR — INTERACTIVE NAV BUTTONS
═══════════════════════════════════════

- 8 pill-shaped buttons (border-radius: 17px), 148px wide, 34px tall
- Default button style (metallic silver):
  background: linear-gradient(to bottom, #d8dce4, #b8bcc8, #9ca0b0, #c0c4d0)
  border: 1px solid #b0b8c0
  box-shadow: 0 2px 4px rgba(0,0,0,0.27), inset 0 1px 0 rgba(255,255,255,0.67)
- Active/selected button style (gold-tinted):
  background: linear-gradient(to bottom, #e8d890, #c8a830, #a07820, #c0a040)
  border: 1px solid #e8c840
  box-shadow: 0 2px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,240,0.5)
  label color: #1a1200
- Left of each button: 26px circular icon badge with gradient
  #d0d4dc → #9098a8, border 1px solid #a0a8b8, Tabler outline icon inside
- Label: Cinzel font 12px, letter-spacing 2px, color #2a2e3a (default),
  dark gold #1a1200 (active)
- Clicking a button shows its section in the main area; hides all others
- 8 buttons in order:
  1. Profile (icon: ti-user)
  2. Education (icon: ti-school)
  3. Experience (icon: ti-briefcase)
  4. Research (icon: ti-microscope)
  5. Leadership (icon: ti-crown)
  6. Skills (icon: ti-chart-bar)
  7. Certifications (icon: ti-certificate)
  8. Contact (icon: ti-mail)

═══════════════════════════════════════
MAIN CONTENT AREA — SECTIONS
═══════════════════════════════════════
Only one section visible at a time, switched by sidebar button clicks.
All text in Cinzel font. All content cards use:
background: rgba(0,0,0,0.2)
border: 1px solid rgba(255,255,255,0.1)
border-left: 3px solid #c8a830
border-radius: 3px
padding: 12px 14px
margin-bottom: 10px

Entry title style: Cinzel 13px, color #e8d49a, font-weight 700
Entry subtitle (org/date): Cinzel 11px, color #c9a84c
Entry body: Cinzel 10px, color #a09878, line-height 1.7

--- SECTION 1: Profile ---
Show a centered summary block with:

- A large decorative diamond separator (◆) in gold
- "AI Engineer" as the role title in large Cinzel gold text
- The bio paragraph from the resume summary
- A row of 3 stat-style badges showing: "GPA 3.88", "250+ Students Mentored",
  "Top of Major" — each in a small pill with gold border

--- SECTION 2: Education ---
One card:
Title: "Bachelor of Computer Engineering"
Org: "Telkom University — Bandung, Indonesia"
Date: "Sep 2021 – Aug 2025"
Body: "GPA: 3.88 / 4.00 · Highest GPA in major · Led 15 teaching
assistants · Mentored 250+ students"

--- SECTION 3: Experience ---
Four cards:

Card 1:
Title: "AI Engineer Bootcamp Trainee"
Org: "PT. Berlian Sistem Informasi — Jakarta"
Date: "Apr 2026 – Sep 2026"
Body: Built end-to-end AI predictive maintenance system on GCP with
Docker, FastAPI, Prometheus, Grafana. Built RAG chatbot using Azure AI
Foundry, LangChain, Azure AI Search. Engineered prompts for grounding
and token efficiency, validated via Azure Evaluations.

Card 2:
Title: "Deputy Assistant Coordinator"
Org: "i-Smile Laboratory — Bandung"
Date: "Jul 2024 – Jul 2025"
Body: Designed and delivered 7 hands-on AI practicum sessions in Python.
Led ML study group for 50+ students covering fundamentals and workflows.

Card 3:
Title: "Machine Learning Cohort"
Org: "Bangkit Academy"
Date: "Sep 2024 – Dec 2024"
Body: Built SugarCare diabetes prediction app — 83% accuracy. Studied
deep learning and GANs. Recognized as Active Participant.

Card 4:
Title: "Teaching Assistant"
Org: "Telkom University — Bandung"
Date: "Sep 2024 – Aug 2025"
Body: Assisted 5 courses including IoT and Control Systems. Contributed
to course materials, assessments, and grading.

--- SECTION 4: Research ---
One card:
Title: "Student Researcher"
Org: "Telkom University"
Date: "Feb 2024 – Aug 2025"
Body: Led RFID-based inventory management research, built Android Kotlin
app, led system experiments. Supported fall detection research through
debugging, knowledge transfer, and hardware-software coordination.

--- SECTION 5: Leadership ---
Two cards:

Card 1:
Title: "Head of Academics & Profession Dept."
Org: "HMTK (Computer Engineering Student Assoc.) — Bandung"
Date: "Dec 2024 – Aug 2025"
Body: Managed department activities, coordinated company visits, led
academic study groups for 100+ students.

Card 2:
Title: "Organizer"
Org: "AWS Gen-AI Tour"
Date: "Aug 2024"
Body: Led student organizer team across Telkom University and Binus
University. Managed speakers, materials, and technical operations for
AWS generative AI hands-on event.

--- SECTION 6: Skills ---
Render skills as HP/EP/CP-style stat bars (same as game UI):
Bar track: background rgba(26,32,40,0.53), border 1px solid
rgba(255,255,255,0.13), height 9px, border-radius 1px
Skill label: Cinzel 10px, letter-spacing 1px, color #c8b880, min-width 140px

Group into 3 categories with a gold category header above each group:

"AI & Machine Learning" (orange bars #e08010):
Python 95%
TensorFlow/PyTorch 90%
Scikit-learn 88%
YOLO / CV 85%
RAG / LLM 90%
LangChain 85%

"MLOps & Cloud" (blue bars #1858b0):
Docker 88%
GCP 82%
Azure AI Foundry 85%
FastAPI 88%
Prometheus/Grafana 80%

"Other & Hardware" (green bars #20a040):
Android (Kotlin) 75%
Arduino / ESP32 78%
C 72%
Streamlit 85%

--- SECTION 7: Certifications ---
Four cards (pill style, smaller):

- "Generative AI for Everyone" — Coursera, 2024
- "DeepLearning.AI TensorFlow Developer Specialization" — 2024
- "Structuring Machine Learning Projects" — DeepLearning.AI, 2024
- "Machine Learning Specialization" — DeepLearning.AI, 2024

--- SECTION 8: Contact ---
Centered layout with large gold decorative dividers between items:
Phone: +6281282658563
Email: faradaybarrf@gmail.com
LinkedIn: linkedin.com/in/faradaybarr
GitHub: github.com/FaradayB
Each item has a Tabler icon on the left, label in muted gold, value in #e8d49a.

═══════════════════════════════════════
FOOTER BAR
═══════════════════════════════════════

- Background: rgba(26,30,40,0.8)
- Top border: 2px solid #c8a830
- Left: small crest icon + active section hint text (updates dynamically
  via JS to describe the current section, e.g. "Viewing Experience records.")
- Right: "Telkom University · GPA 3.88" and "Class of 2025" in Cinzel
  10px, color #c0b890

═══════════════════════════════════════
INTERACTIVITY (JavaScript)
═══════════════════════════════════════

- On page load, Profile section is active (first button gold-tinted)
- Clicking any sidebar button:
  1. Removes active state from all buttons
  2. Applies gold-tinted active style to clicked button
  3. Hides all content sections (display: none)
  4. Shows the matching content section (display: block)
  5. Updates the footer hint text to describe the section
- No animations needed — instant show/hide is fine

═══════════════════════════════════════
TYPOGRAPHY & DEPENDENCIES
═══════════════════════════════════════

- Google Font: Cinzel (weights 400, 700)
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap" rel="stylesheet">
- Tabler Icons webfont for sidebar button icons:
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css">
- Single .html file, no build tools, no frameworks
- All CSS in a <style> block in <head>
- All JS in a <script> block before </body>

═══════════════════════════════════════
OUTPUT
═══════════════════════════════════════
Save as: faraday_cv.html
