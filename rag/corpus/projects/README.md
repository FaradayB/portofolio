# Projects — how to add them

This folder holds **one markdown file per project**. The chatbot reads each file
on its own, so every project file should make sense by itself without referring
to any other file.

> Note: this `README.md` is **not** part of the chatbot's knowledge — the
> ingestion step skips every `README.md`. It's just instructions for you.

## File naming convention

Use lowercase words separated by hyphens, ending in `.md`:

```
project-<short-name>.md
```

For example:

```
project-predictive-maintenance.md
project-rag-chatbot.md
project-fall-detection.md
```

Keep the short name descriptive but brief. One project per file. To remove a
project from the chatbot, delete its file and re-run the ingestion.

## Template for a single project file

Copy everything in the block below into a new file, fill in every
`[FILL IN: ...]`, and delete the instruction comment. Write in first person and
plain language, the way you'd describe the project if someone asked about it.

```markdown
<!-- Fill in every [FILL IN: ...], then delete this comment. First person. -->

# [FILL IN: Project name]

**What it is:** [FILL IN: one or two sentences describing what this project is,
in plain language.]

**The problem it solved:** [FILL IN: what problem or need this addressed, and why
it mattered.]

**My role:** [FILL IN: what you personally did. Be specific about your part,
especially if it was a team project.]

**Tech I used:** [FILL IN: the main languages, frameworks, and tools, with a
short note on how each was used rather than just a list.]

**Outcome:** [FILL IN: what came out of it — results, metrics, what shipped, what
you learned. Be honest; "it didn't ship but I learned X" is a fine outcome.]

**Links:** [FILL IN: repo, demo, write-up, or video links. Write "none yet" if
there aren't any.]
```
