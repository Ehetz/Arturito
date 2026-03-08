# HEARTBEAT.md

## Purpose
Run structured heartbeat checks for updates, health, docs improvements, and Pipeline execution continuity.

## Required Schedule

### 1) Twice daily checkpoint (00:00 and 12:00 Europe/Berlin)
At each checkpoint:
1. Check updates (OpenClaw, tools, packages/libraries in active projects).
2. Apply safe updates.
3. Check system health.
4. Check tool status and verify core workflows work without issues.
5. Review what was completed since last checkpoint.
6. Update memory:
   - `memory/YYYY-MM-DD.md`
   - `MEMORY.md` (only durable long-term items)
7. Append run results to log.

### 2) Docs review 3 times per week
1. Review `https://docs.openclaw.ai` for implementation/upgrade opportunities.
2. Recommend high-impact items.
3. Implement low-risk, high-value improvements.
4. Log findings/actions.

### 3) Pipeline execution every 1 hour
1. Read Pipeline in priority order: critical first, then importance 1→5, then oldest.
2. Continue work on the top actionable project.
3. Update step status/progress in Pipeline.
4. Log progress and blockers.
5. If blocked, include blocker + needed input in alert.

## Logging
Use: `memory/heartbeat-log.md`

For each run append:
- timestamp (UTC)
- checks executed
- updates found/applied
- system/tool health result
- pipeline progress
- blockers/risks
- next action

## No-action response
If nothing needs attention, reply exactly:
HEARTBEAT_OK
