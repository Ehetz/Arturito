# activity_log.md

Append-only operational history for Pipeline project/step changes.

## Record format
- `timestamp` (UTC, ISO8601)
- `event` (project_created | project_updated | step_created | step_updated | backup_export | backup_restore | sync_pull | sync_push)
- `projectId`
- `stepId` (optional)
- `actor` (assistant/system/user)
- `details` (short JSON/text payload)

## Notes
- Never edit or delete old records.
- New entries are always appended at end.
- Use this log for debugging and accountability.
