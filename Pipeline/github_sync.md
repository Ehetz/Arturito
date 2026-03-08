# GitHub Sync Layer

## Mapping model

### Pipeline Project -> GitHub
- `project.id` -> custom field in issue body: `pipeline_project_id`
- `project.name` -> issue title
- `project.description` -> issue body summary section
- `project.importance` -> GitHub label: `priority:P1`..`priority:P5`
- `project.critical=true` -> GitHub label: `critical`
- `project.status` -> GitHub label: `status:active|paused|blocked|completed|maintenance`
- `project.tags[]` -> standard labels (one label per tag)

### Pipeline Steps -> GitHub
- Steps stored in issue body checklist block:
  - `- [ ] step title` (todo/doing/blocked)
  - `- [x] step title` (done)
- `currentStep` mirrored via label `current-step:<step_id>`

## Sync direction rules

### Pull sync (GitHub -> Pipeline)
- Source of truth for project metadata: Pipeline.
- Pull only these from GitHub:
  - new comments (for context log)
  - manual issue close/open signals to suggest status updates

### Push sync (Pipeline -> GitHub)
- Push on project updates:
  - title/body refresh
  - labels refresh (priority/status/critical/tags)
  - checklist refresh from steps

## Conflict strategy
- Pipeline wins for core fields (`importance`, `critical`, `status`, `steps`).
- If GitHub changed the same field recently, add a conflict note to activity log and keep Pipeline value.
- Never overwrite unknown external labels; only manage labels in namespaces:
  - `priority:*`
  - `status:*`
  - `current-step:*`
  - `critical`

## Minimal transport contract

```json
{
  "repo": "owner/repo",
  "projectId": "prj_xxx",
  "issueNumber": 123,
  "managedLabelPrefixes": ["priority:", "status:", "current-step:"],
  "managedLabels": ["critical"]
}
```
