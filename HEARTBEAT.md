# HEARTBEAT.md

## Purpose
Use heartbeat polls for proactive, low-noise operational checks.

## Rules
- Keep checks lightweight.
- Alert only when there is clear action value.
- If nothing needs attention, reply exactly: `HEARTBEAT_OK`
- Quiet hours: do not send non-urgent alerts between 23:00–08:00 (Europe/Berlin).

## Checks (run in this order)
1. **Priority inbox scan**
   - Look for urgent client/stakeholder emails.
   - Alert only for items requiring action within 24h.
2. **Calendar horizon**
   - Check next 48h for meetings, deadlines, conflicts.
   - Alert for events starting in <2h or conflicts.
3. **Critical ops signals**
   - Surface failures/blockers from active project workflows.
   - Alert only on incidents, broken promises, or delivery risk.
4. **Daily execution hygiene**
   - Ensure tasks/notes worth keeping are written to memory files.

## Alert format (when needed)
Use this compact structure:
- **What happened**
- **Why it matters**
- **Recommended next action**
- **Urgency** (low/medium/high)

## No-action condition
If no important update is found, respond only with:
HEARTBEAT_OK
