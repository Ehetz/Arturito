#!/usr/bin/env python3
import json
import uuid
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

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


def sort_key(project):
    return (
        0 if project.get("critical", False) else 1,
        project.get("importance", 5),
        project.get("createdAt", ""),
    )


def json_response(handler, status, payload):
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def parse_json_body(handler):
    length = int(handler.headers.get("Content-Length", "0"))
    raw = handler.rfile.read(length) if length > 0 else b"{}"
    return json.loads(raw.decode("utf-8") or "{}")


def find_project(data, project_id):
    for p in data["projects"]:
        if p["id"] == project_id:
            return p
    return None


class PipelineAPI(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        data = load_data()

        if path == "/health":
            return json_response(self, 200, {"ok": True, "service": "pipeline"})

        if path == "/projects":
            projects = sorted(data["projects"], key=sort_key)
            return json_response(self, 200, {"projects": projects})

        if path.startswith("/projects/"):
            project_id = path.split("/")[-1]
            project = find_project(data, project_id)
            if not project:
                return json_response(self, 404, {"error": "project not found"})
            return json_response(self, 200, project)

        if path == "/next":
            candidates = [
                p for p in data["projects"] if p.get("status") in {"active", "blocked", "maintenance"}
            ]
            if not candidates:
                return json_response(self, 200, {"project": None})
            return json_response(self, 200, {"project": sorted(candidates, key=sort_key)[0]})

        return json_response(self, 404, {"error": "not found"})

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        data = load_data()

        if path == "/projects":
            body = parse_json_body(self)
            name = (body.get("name") or "").strip()
            if not name:
                return json_response(self, 400, {"error": "name is required"})

            importance = int(body.get("importance", 3))
            if importance < 1 or importance > 5:
                return json_response(self, 400, {"error": "importance must be 1..5"})

            ts = now_iso()
            project = {
                "id": f"prj_{uuid.uuid4().hex[:8]}",
                "name": name,
                "description": body.get("description", ""),
                "importance": importance,
                "critical": bool(body.get("critical", False)),
                "status": body.get("status", "active") if body.get("status", "active") in PROJECT_STATUSES else "active",
                "tags": body.get("tags", []),
                "createdAt": ts,
                "updatedAt": ts,
                "lastUpdated": ts,
                "currentStep": None,
                "blockedReason": "",
                "steps": [],
            }
            data["projects"].append(project)
            save_data(data)
            return json_response(self, 201, project)

        if path.startswith("/projects/") and path.endswith("/steps"):
            parts = [p for p in path.split("/") if p]
            if len(parts) != 3:
                return json_response(self, 404, {"error": "not found"})
            project_id = parts[1]
            project = find_project(data, project_id)
            if not project:
                return json_response(self, 404, {"error": "project not found"})

            body = parse_json_body(self)
            title = (body.get("title") or "").strip()
            if not title:
                return json_response(self, 400, {"error": "title is required"})

            ts = now_iso()
            step = {
                "id": f"stp_{uuid.uuid4().hex[:8]}",
                "title": title,
                "description": body.get("description", ""),
                "status": "todo",
                "createdAt": ts,
                "updatedAt": ts,
                "lastUpdated": ts,
            }
            project["steps"].append(step)
            if not project.get("currentStep"):
                project["currentStep"] = step["id"]
            project["updatedAt"] = ts
            project["lastUpdated"] = ts
            save_data(data)
            return json_response(self, 201, step)

        return json_response(self, 404, {"error": "not found"})

    def do_PATCH(self):
        parsed = urlparse(self.path)
        path = parsed.path
        data = load_data()

        if path.startswith("/projects/"):
            parts = [p for p in path.split("/") if p]
            if len(parts) == 2:
                project_id = parts[1]
                project = find_project(data, project_id)
                if not project:
                    return json_response(self, 404, {"error": "project not found"})

                body = parse_json_body(self)
                ts = now_iso()

                if "importance" in body:
                    imp = int(body["importance"])
                    if imp < 1 or imp > 5:
                        return json_response(self, 400, {"error": "importance must be 1..5"})
                    project["importance"] = imp
                if "critical" in body:
                    project["critical"] = bool(body["critical"])
                if "status" in body:
                    if body["status"] not in PROJECT_STATUSES:
                        return json_response(self, 400, {"error": "invalid status"})
                    project["status"] = body["status"]
                if "blockedReason" in body:
                    project["blockedReason"] = body["blockedReason"]
                if "currentStep" in body:
                    project["currentStep"] = body["currentStep"]

                project["updatedAt"] = ts
                project["lastUpdated"] = ts
                save_data(data)
                return json_response(self, 200, project)

            if len(parts) == 4 and parts[2] == "steps":
                project_id = parts[1]
                step_id = parts[3]
                project = find_project(data, project_id)
                if not project:
                    return json_response(self, 404, {"error": "project not found"})

                step = next((s for s in project["steps"] if s["id"] == step_id), None)
                if not step:
                    return json_response(self, 404, {"error": "step not found"})

                body = parse_json_body(self)
                status = body.get("status")
                if status not in STEP_STATUSES:
                    return json_response(self, 400, {"error": "invalid step status"})

                ts = now_iso()
                step["status"] = status
                step["updatedAt"] = ts
                step["lastUpdated"] = ts
                if body.get("makeCurrent"):
                    project["currentStep"] = step_id
                project["updatedAt"] = ts
                project["lastUpdated"] = ts
                save_data(data)
                return json_response(self, 200, step)

        return json_response(self, 404, {"error": "not found"})

    def log_message(self, fmt, *args):
        return


def run(host="127.0.0.1", port=8787):
    server = ThreadingHTTPServer((host, port), PipelineAPI)
    print(f"Pipeline API listening on http://{host}:{port}")
    server.serve_forever()


if __name__ == "__main__":
    run()
