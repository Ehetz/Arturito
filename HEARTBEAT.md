# HEARTBEAT.md

## Purpose
Run structured heartbeat checks for updates, health, docs improvements, and Pipeline execution continuity.

## Required Schedule

### 1) Weekly Update Check (Monday 08:00 Europe/Berlin)
1. Check updates (OpenClaw, tools, packages/libraries in active projects).
2. Apply safe updates.
3. Check system health.
4. Review `https://docs.openclaw.ai` for implementation/upgrade opportunities.

### 2) Daily checkpoint (08:00 Europe/Berlin)
1. Check tool status and verify core workflows work without issues.
2. Review what was completed since last checkpoint.
3. Update memory:
   - `memory/YYYY-MM-DD.md`
   - `MEMORY.md` (only durable long-term items)
4. Append run results to log.

### 3) Pipeline execution (every 4 hours)
1. Read Pipeline in priority order: critical first, then importance 1→5, then oldest.
2. Continue work on the top actionable project.
3. Update step status/progress in Pipeline.
4. Log progress and blockers.
5. If blocked, include blocker + needed input in alert.

## Profile Memory Sync (new)

### Continuous capture (during chats)
- Whenever a new stable preference/fact/rule appears that belongs in `MEMORY.md`, `USER.md`, or `IDENTITY.md`, add a **pending** entry to:
  - `memory/profile-sync-log.md`

### Daily consolidation (once per day)
- Review `memory/profile-sync-log.md`
- Summarize and apply relevant pending entries to:
  - `MEMORY.md`
  - `USER.md`
  - `IDENTITY.md`
- Mark processed entries as `applied`
- Record summary in `memory/heartbeat-log.md`

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
