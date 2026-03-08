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
- timestamp: 2026-03-08T20:19:49Z
  event: step_updated
  projectId: prj_21bbab21
  stepId: stp_88518b5f
  actor: assistant
  details: {"status": "done", "currentStep": "stp_88518b5f"}
- timestamp: 2026-03-08T20:19:49Z
  event: step_updated
  projectId: prj_21bbab21
  stepId: stp_e2287a97
  actor: assistant
  details: {"status": "doing", "currentStep": "stp_e2287a97"}
