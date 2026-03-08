# Heartbeat ↔ Pipeline Integration Rules

## Signals to evaluate every heartbeat pipeline pass

1. **Top actionable project**
   - Select by: critical first, then importance (1→5), then oldest.

2. **Stale blocked project**
   - Condition: project status is `blocked` and `lastUpdated` older than 24h.
   - Action: emit medium/high urgency alert depending on project importance.

3. **Critical no-progress**
   - Condition: `critical=true` project with no update for >6h.
   - Action: emit high urgency alert with required unblock input.

4. **Progress requirement**
   - If no blockers, advance at least one project step (`todo→doing` or `doing→done`) for the top project.

## Alert payload format
- What happened
- Why it matters
- Action taken
- Recommended next action
- Urgency (low/medium/high)
