# Projects — how to add them

This folder holds **one markdown file per project**. The chatbot reads and
retrieves each file on its own, so write every project file to stand on its own:
name the project inside the text, and don't refer to "the other files."

> Note: this `README.md` is **not** part of the chatbot's knowledge — the
> ingestion step skips every `README.md`. It's just instructions for you.

## File naming convention

One project per file, lowercase words separated by hyphens, ending in `.md`:

```
project-<short-name>.md
```

For example: `project-predictive-maintenance.md`, `project-rag-chatbot.md`,
`project-fall-detection.md`. To remove a project from the chatbot, delete its
file and re-run the ingestion.

## What makes a file easy for the chatbot to use

Write it the way you'd answer if someone asked about the project out loud. Use
question-style headings (the kind a visitor would actually ask), give a clear
first-person answer under each, and keep every answer self-contained by naming
the project in the text rather than relying on the heading alone. Plain language
beats jargon.

## Template (with a real example filled in)

Copy this into a new file and replace the content with your own project:

```markdown
# AI Predictive Maintenance

## What is this project?

AI Predictive Maintenance is an end-to-end system I built that predicts
equipment failures before they happen, so maintenance can be scheduled instead
of reacting to breakdowns.

## What problem does it solve?

Unplanned equipment downtime is expensive. The system watches sensor data and
flags machines that are likely to fail soon, which gives teams time to act
early.

## What was my role?

I built the whole pipeline myself, from preparing the data and training the
model to deploying it as a service and setting up the monitoring around it.

## What technology did I use?

I trained the model in Python, served it through a FastAPI app, containerized it
with Docker, and ran it on Google Cloud Platform. I monitored it in production
with Prometheus and Grafana dashboards.

## What was the outcome?

The system runs as a containerized service with live monitoring, and it gave me
hands-on experience taking a model all the way from training to a deployed,
observable production service.

## Where can I learn more?

(Add a repo, demo, or write-up link here, or say there isn't a public one yet.)
```
