# HEARTBEAT.md

## Purpose
Use heartbeat polls as an execution loop for maintenance, upgrades, system health, and Pipeline progress.

## Global Rules
- Be proactive and execution-first.
- If a safe update is available, apply it.
- If an update is risky/breaking/unclear, alert with recommendation before applying.
- Always write an operational log entry after each heartbeat run.
- If nothing needs attention, reply exactly: `HEARTBEAT_OK`

## Required Checks

### 1) Twice daily: full review + memory update
Frequency: **2 times per day at 00:00 and 12:00 (Europe/Berlin)**

Tasks:
1. Check for updates (OpenClaw + tools + packages/libraries in active projects).
2. Apply available safe updates.
3. Run system health checks.
4. Verify tool status and confirm core workflows are working without issues.
5. Review everything completed since the last checkpoint.
6. Update memory files with relevant continuity notes:
   - `memory/YYYY-MM-DD.md` (session-level facts)
   - `MEMORY.md` (durable long-term items only)
7. Write results to log (what was checked, what changed, success/failures, next action).

### 2) Weekly: OpenClaw docs review
Frequency: **3 times per week**

Tasks:
1. Review `https://docs.openclaw.ai` for relevant new features, implementation patterns, and upgrade opportunities.
2. Produce concise recommendations prioritized by impact and effort.
3. If low-risk/high-value, proceed with implementation.
4. Log findings and actions.

### 3) Hourly: Pipeline execution
Frequency: **every 1 hour**

Tasks:
1. Read Pipeline state (priority order: critical first, then importance 1→5, then oldest).
2. Continue work on the top actionable project.
3. Update step status/progress in Pipeline.
4. Log what advanced and what is blocked.
5. If blocked, include blocker + required input in alert.

## Logging
Use file: `memory/heartbeat-log.md`

For each run append:
- timestamp (UTC)
- checks executed
- updates found/applied
- system/tool health result
- pipeline progress
- blockers/risks
- next action

## Alert Format (only when needed)
- **What happened**
- **Why it matters**
- **Action taken**
- **Recommended next action**
- **Urgency** (low/medium/high)

## No-action condition
If nothing actionable is found, reply only with:
HEARTBEAT_OK
