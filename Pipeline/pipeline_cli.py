#!/usr/bin/env python3
import argparse
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

BACKUP_DIR = Path(__file__).resolve().parent / "backups"
ACTIVITY_LOG = Path(__file__).resolve().parent / "activity_log.md"

DATA_FILE = Path(__file__).resolve().parent / "pipeline.json"

PROJECT_STATUSES = {"active", "paused", "blocked", "completed", "maintenance"}
STEP_STATUSES = {"todo", "doing", "done", "blocked"}


def now_iso():
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def load_data():
    if not DATA_FILE.exists():
        return {"version": 1, "projects": []}
    with DATA_FILE.open("r", encoding="utf-8") as f:
        return json.load(f)


def save_data(data):
    with DATA_FILE.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")


def find_project(data, project_id):
    for p in data["projects"]:
        if p["id"] == project_id:
            return p
    return None


def sort_key(project):
    # Critical first, then importance (1 highest), then oldest first.
    return (
        0 if project.get("critical", False) else 1,
        project.get("importance", 5),
        project.get("createdAt", ""),
    )


def append_activity(event, project_id=None, step_id=None, actor="assistant", details=None):
    ts = now_iso()
    details_text = json.dumps(details, ensure_ascii=False) if isinstance(details, (dict, list)) else str(details or "")
    ACTIVITY_LOG.parent.mkdir(parents=True, exist_ok=True)
    if not ACTIVITY_LOG.exists():
        ACTIVITY_LOG.write_text("# activity_log.md\n\n", encoding="utf-8")
    with ACTIVITY_LOG.open("a", encoding="utf-8") as f:
        f.write(f"- timestamp: {ts}\n")
        f.write(f"  event: {event}\n")
        f.write(f"  projectId: {project_id or ''}\n")
        f.write(f"  stepId: {step_id or ''}\n")
        f.write(f"  actor: {actor}\n")
        f.write(f"  details: {details_text}\n")


def cmd_add_project(args):
    data = load_data()
    if args.importance < 1 or args.importance > 5:
        raise SystemExit("importance must be between 1 and 5")

    ts = now_iso()
    project = {
        "id": f"prj_{uuid.uuid4().hex[:8]}",
        "name": args.name,
        "description": args.description or "",
        "importance": args.importance,
        "critical": False,
        "status": "active",
        "tags": args.tags or [],
        "createdAt": ts,
        "updatedAt": ts,
        "lastUpdated": ts,
        "currentStep": None,
        "blockedReason": "",
        "steps": [],
    }
    data["projects"].append(project)
    save_data(data)
    append_activity("project_created", project_id=project["id"], details={"name": project["name"], "importance": project["importance"]})
    print(project["id"])


def cmd_list(args):
    data = load_data()
    projects = sorted(data["projects"], key=sort_key)
    if args.status:
        projects = [p for p in projects if p.get("status") == args.status]
    if not projects:
        print("No projects.")
        return

    for p in projects:
        print(
            f"{p['id']} | {p['name']} | status={p['status']} | importance={p['importance']} | critical={p.get('critical', False)} | updated={p.get('lastUpdated', p.get('updatedAt'))}"
        )


def cmd_show(args):
    data = load_data()
    project = find_project(data, args.project_id)
    if not project:
        raise SystemExit("project not found")
    print(json.dumps(project, indent=2, ensure_ascii=False))


def cmd_add_step(args):
    data = load_data()
    project = find_project(data, args.project_id)
    if not project:
        raise SystemExit("project not found")

    ts = now_iso()
    step = {
        "id": f"stp_{uuid.uuid4().hex[:8]}",
        "title": args.title,
        "description": args.description or "",
        "status": "todo",
        "createdAt": ts,
        "updatedAt": ts,
        "lastUpdated": ts,
    }
    project["steps"].append(step)
    if project["currentStep"] is None:
        project["currentStep"] = step["id"]
    project["updatedAt"] = ts
    project["lastUpdated"] = ts
    save_data(data)
    append_activity("step_created", project_id=project["id"], step_id=step["id"], details={"title": step["title"]})
    print(step["id"])


def cmd_set_project(args):
    data = load_data()
    project = find_project(data, args.project_id)
    if not project:
        raise SystemExit("project not found")

    changed = False
    ts = now_iso()

    if args.importance is not None:
        if args.importance < 1 or args.importance > 5:
            raise SystemExit("importance must be between 1 and 5")
        project["importance"] = args.importance
        changed = True

    if args.status is not None:
        if args.status not in PROJECT_STATUSES:
            raise SystemExit(f"invalid status. Use: {', '.join(sorted(PROJECT_STATUSES))}")
        project["status"] = args.status
        changed = True

    if args.critical is not None:
        project["critical"] = args.critical
        changed = True

    if args.blocked_reason is not None:
        project["blockedReason"] = args.blocked_reason
        changed = True

    if args.current_step is not None:
        project["currentStep"] = args.current_step
        changed = True

    if changed:
        project["updatedAt"] = ts
        project["lastUpdated"] = ts
        save_data(data)
        append_activity("project_updated", project_id=project["id"], details={
            "importance": project.get("importance"),
            "status": project.get("status"),
            "critical": project.get("critical"),
            "currentStep": project.get("currentStep"),
            "blockedReason": project.get("blockedReason"),
        })
        print("updated")
    else:
        print("no changes")


def cmd_set_step(args):
    data = load_data()
    project = find_project(data, args.project_id)
    if not project:
        raise SystemExit("project not found")

    step = None
    for s in project["steps"]:
        if s["id"] == args.step_id:
            step = s
            break
    if not step:
        raise SystemExit("step not found")

    if args.status not in STEP_STATUSES:
        raise SystemExit(f"invalid status. Use: {', '.join(sorted(STEP_STATUSES))}")

    ts = now_iso()
    step["status"] = args.status
    step["updatedAt"] = ts
    step["lastUpdated"] = ts
    project["updatedAt"] = ts
    project["lastUpdated"] = ts

    if args.make_current:
        project["currentStep"] = step["id"]

    save_data(data)
    append_activity("step_updated", project_id=project["id"], step_id=step["id"], details={"status": step["status"], "currentStep": project.get("currentStep")})
    print("updated")


def cmd_next(_args):
    data = load_data()
    candidates = [
        p
        for p in data["projects"]
        if p.get("status") in {"active", "blocked", "maintenance"}
    ]
    if not candidates:
        print("No actionable projects.")
        return

    project = sorted(candidates, key=sort_key)[0]
    print(json.dumps(project, indent=2, ensure_ascii=False))


def cmd_backup_export(args):
    data = load_data()
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    stamp = now_iso().replace(":", "-")
    out = Path(args.out) if args.out else BACKUP_DIR / f"pipeline-backup-{stamp}.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    with out.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")
    append_activity("backup_export", details={"out": str(out)})
    print(str(out))


def cmd_backup_restore(args):
    src = Path(args.file)
    if not src.exists():
        raise SystemExit("backup file not found")

    # Safety snapshot before restore.
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    safety = BACKUP_DIR / f"pipeline-pre-restore-{now_iso().replace(':', '-')}.json"
    with safety.open("w", encoding="utf-8") as f:
        json.dump(load_data(), f, indent=2, ensure_ascii=False)
        f.write("\n")

    with src.open("r", encoding="utf-8") as f:
        restored = json.load(f)

    if not isinstance(restored, dict) or "projects" not in restored:
        raise SystemExit("invalid backup format")

    save_data(restored)
    append_activity("backup_restore", details={"source": str(src), "safetySnapshot": str(safety)})
    print(f"restored={src} safety_snapshot={safety}")


def build_parser():
    parser = argparse.ArgumentParser(description="Pipeline manager")
    sub = parser.add_subparsers(dest="command", required=True)

    p_add = sub.add_parser("add-project", help="Add a new project")
    p_add.add_argument("--name", required=True)
    p_add.add_argument("--description")
    p_add.add_argument("--importance", type=int, default=3)
    p_add.add_argument("--tags", nargs="*")
    p_add.set_defaults(func=cmd_add_project)

    p_list = sub.add_parser("list", help="List projects in execution order")
    p_list.add_argument("--status", choices=sorted(PROJECT_STATUSES))
    p_list.set_defaults(func=cmd_list)

    p_show = sub.add_parser("show", help="Show project details")
    p_show.add_argument("project_id")
    p_show.set_defaults(func=cmd_show)

    p_add_step = sub.add_parser("add-step", help="Add a step to a project")
    p_add_step.add_argument("project_id")
    p_add_step.add_argument("--title", required=True)
    p_add_step.add_argument("--description")
    p_add_step.set_defaults(func=cmd_add_step)

    p_set_prj = sub.add_parser("set-project", help="Update project fields")
    p_set_prj.add_argument("project_id")
    p_set_prj.add_argument("--importance", type=int)
    p_set_prj.add_argument("--status")
    p_set_prj.add_argument("--critical", action=argparse.BooleanOptionalAction)
    p_set_prj.add_argument("--blocked-reason")
    p_set_prj.add_argument("--current-step")
    p_set_prj.set_defaults(func=cmd_set_project)

    p_set_step = sub.add_parser("set-step", help="Update step status")
    p_set_step.add_argument("project_id")
    p_set_step.add_argument("step_id")
    p_set_step.add_argument("--status", required=True)
    p_set_step.add_argument("--make-current", action="store_true")
    p_set_step.set_defaults(func=cmd_set_step)

    p_next = sub.add_parser("next", help="Show next project by priority rules")
    p_next.set_defaults(func=cmd_next)

    p_backup_export = sub.add_parser("backup-export", help="Export full pipeline backup JSON")
    p_backup_export.add_argument("--out", help="Optional output path")
    p_backup_export.set_defaults(func=cmd_backup_export)

    p_backup_restore = sub.add_parser("backup-restore", help="Restore pipeline from backup JSON")
    p_backup_restore.add_argument("--file", required=True, help="Backup file path")
    p_backup_restore.set_defaults(func=cmd_backup_restore)

    return parser


def main():
    parser = build_parser()
    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
