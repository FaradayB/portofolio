# Publications — how to add them

This folder holds **one markdown file per paper or publication**. The chatbot
reads and retrieves each file on its own, so write every file to stand on its
own: name the paper inside the text, and don't refer to "the other files."

> Note: this `README.md` is **not** part of the chatbot's knowledge — the
> ingestion step skips every `README.md`. It's just instructions for you.

You can also drop a `.pdf` straight into this folder and the ingestion will read
it. But a short markdown summary in your own words usually gives the chatbot
cleaner, more accurate answers than a raw PDF full of citations and formatting.

## File naming convention

One paper per file, lowercase words separated by hyphens, ending in `.md` (or
`.pdf`):

```
paper-<short-name>.md
```

For example: `paper-rfid-inventory.md`, `paper-fall-detection-yolo.md`. To
remove a paper from the chatbot, delete its file and re-run the ingestion.

## What makes a file easy for the chatbot to use

Write it as if you're explaining your paper to someone outside your field. Use
question-style headings a visitor would actually ask, answer in the first person,
and keep each answer self-contained by naming the paper in the text. Plain
language beats academic phrasing here.

## Template (with a real example filled in)

Copy this into a new file and replace the content with your own paper:

```markdown
# RFID-Based Inventory Management

## What is this paper about?

This is my research on an RFID-based inventory management system — a way to track
items automatically using RFID tags instead of manual scanning or counting.

## What problem does it solve?

Manual inventory tracking is slow and error-prone. The work shows how RFID can
make tracking faster and more reliable, with a companion app so people can see
inventory in real time.

## What was my role?

I led the research. I built the Android app in Kotlin and ran the system
experiments end to end.

## What methods and technology did I use?

I used RFID hardware for tracking and built an Android application in Kotlin as
the interface, then designed and ran experiments to test how the system
performed.

## What was the outcome?

I produced a working RFID inventory system with a companion app and experimental
results showing how it performed. (Add where it was published or presented, and
the date, if you have it.)

## Where can I read it?

(Add a link, DOI, or preprint here, or say it isn't publicly available.)
```
