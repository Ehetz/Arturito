# Pipeline

A lightweight backend-first task pipeline for OpenClaw-style assistants.

## Goal
Keep project continuity across sessions with clear priority, step-by-step execution, and persistent state.

This project is designed so assistants (Andrew, Arturito, etc.) can always resume work from the exact point where they stopped.

## Priority Model
Execution order is:
1. `critical=true` projects first (manual user override)
2. `importance` ascending (`1` highest, `5` lowest)
3. oldest project first (`createdAt` ascending)

## Data Model
Stored in `pipeline.json`:

- `projects[]`
  - `id`, `name`, `description`
  - `importance` (1..5)
  - `critical` (bool)
  - `status` (`active|paused|blocked|completed|maintenance`)
  - `createdAt`, `updatedAt`, `lastUpdated`
  - `currentStep`, `blockedReason`, `tags[]`
  - `steps[]`
    - `id`, `title`, `description`
    - `status` (`todo|doing|done|blocked`)
    - `createdAt`, `updatedAt`, `lastUpdated`

## Why single JSON first?
For this phase, one JSON file minimizes complexity and token overhead for assistant reads/writes.
Later, it can be upgraded to API + database without changing the conceptual model.

## CLI Usage
Run from this directory:

```bash
python3 pipeline_cli.py add-project --name "Project name" --description "..." --importance 1
python3 pipeline_cli.py list
python3 pipeline_cli.py show <project_id>
python3 pipeline_cli.py add-step <project_id> --title "Step title"
python3 pipeline_cli.py set-step <project_id> <step_id> --status doing --make-current
python3 pipeline_cli.py set-project <project_id> --status blocked --blocked-reason "Waiting on API key"
python3 pipeline_cli.py set-project <project_id> --critical
python3 pipeline_cli.py next
```

## Suggested Heartbeat Integration (next phase)
- heartbeat checks `pipeline.json`
- if a project is `blocked` for too long, alert user
- if there is an `active` critical project with no progress, alert user
- otherwise: `HEARTBEAT_OK`

## API (new)
A lightweight local API is now included in `pipeline_api.py`.

Run:
```bash
python3 pipeline_api.py
```

Default address: `http://127.0.0.1:8787`

Endpoints:
- `GET /health`
- `GET /projects`
- `GET /projects/<project_id>`
- `GET /next`
- `POST /projects`
- `POST /projects/<project_id>/steps`
- `PATCH /projects/<project_id>`
- `PATCH /projects/<project_id>/steps/<step_id>`

This gives a clean backend path for the future web app (project list + click for detail).

## Roadmap
1. File backend + CLI (done)
2. Local API layer (done)
3. Web frontend (project list + detail view)
4. GitHub sync (issues/projects mapping)
5. Heartbeat integration (read pipeline + alert on blockers)

## For other OpenClaw assistants
This repository is intentionally simple so any assistant can adopt it quickly.
Clone, run the CLI, and start tracking projects with durable state.
