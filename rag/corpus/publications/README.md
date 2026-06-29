# Publications — how to add them

This folder holds **one markdown file per paper or publication**. The chatbot
reads each file on its own, so every file should make sense by itself without
referring to any other file.

> Note: this `README.md` is **not** part of the chatbot's knowledge — the
> ingestion step skips every `README.md`. It's just instructions for you.

If you have the paper as a PDF, you can drop the `.pdf` directly into this folder
instead of a markdown file and the ingestion will read it. But a short markdown
summary in your own words usually gives the chatbot better, cleaner answers than
a raw PDF full of citations and formatting.

## File naming convention

Use lowercase words separated by hyphens, ending in `.md` (or `.pdf`):

```
paper-<short-name>.md
```

For example:

```
paper-rfid-inventory.md
paper-fall-detection-yolo.md
```

Keep the short name descriptive but brief. One paper per file. To remove a paper
from the chatbot, delete its file and re-run the ingestion.

## Template for a single paper file

Copy everything in the block below into a new file, fill in every
`[FILL IN: ...]`, and delete the instruction comment. Write in first person and
plain language, as if explaining your paper to someone outside your field.

```markdown
<!-- Fill in every [FILL IN: ...], then delete this comment. First person. -->

# [FILL IN: Paper or publication title]

**What it is:** [FILL IN: one or two sentences on what the paper is about, in
plain language — what question it asks or what it presents.]

**The problem it solved:** [FILL IN: the gap, problem, or question this work
addressed, and why it mattered.]

**My role:** [FILL IN: what you personally contributed — e.g. lead author, ran
the experiments, built the system, co-author on the analysis.]

**Tech / methods used:** [FILL IN: the methods, models, datasets, or tools
involved, with a short note on how they were used.]

**Outcome:** [FILL IN: the main finding or result, where it was published or
presented, and the date if you have it.]

**Links:** [FILL IN: link to the paper, DOI, preprint, or slides. Write "not
public" if it isn't available to link.]
```
