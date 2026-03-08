#!/usr/bin/env python3
import argparse
import json
import subprocess
from pathlib import Path

PIPELINE_JSON = Path(__file__).resolve().parent / "pipeline.json"
MAPPING_FILE = Path(__file__).resolve().parent / "github_sync_map.json"


def load_pipeline():
    return json.loads(PIPELINE_JSON.read_text(encoding="utf-8"))


def save_pipeline(data):
    PIPELINE_JSON.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def load_mapping():
    if not MAPPING_FILE.exists():
        return {"links": []}
    return json.loads(MAPPING_FILE.read_text(encoding="utf-8"))


def run_gh(args):
    cmd = ["gh", "api"] + args
    return subprocess.check_output(cmd, text=True)


def pull_sync(repo: str, apply: bool):
    mapping = load_mapping()
    pipeline = load_pipeline()

    linked = [l for l in mapping.get("links", []) if l.get("repo") == repo]
    if not linked:
        print("No mapped projects for repo. Add links to github_sync_map.json first.")
        return

    updates = []
    for link in linked:
        issue = int(link["issueNumber"])
        pid = link["projectId"]

        try:
            issue_json = run_gh([f"repos/{repo}/issues/{issue}"])
        except Exception as e:
            print(f"GH fetch failed for #{issue}: {e}")
            continue

        gh_issue = json.loads(issue_json)
        state = gh_issue.get("state")

        for p in pipeline.get("projects", []):
            if p.get("id") != pid:
                continue

            suggested = None
            if state == "closed" and p.get("status") != "completed":
                suggested = "completed"
            if state == "open" and p.get("status") == "completed":
                suggested = "active"

            if suggested:
                updates.append({"projectId": pid, "from": p.get("status"), "to": suggested, "issue": issue})
                if apply:
                    p["status"] = suggested

    if apply and updates:
        save_pipeline(pipeline)

    print(json.dumps({"repo": repo, "apply": apply, "updates": updates}, indent=2, ensure_ascii=False))


def main():
    parser = argparse.ArgumentParser(description="Pipeline GitHub sync scaffold")
    sub = parser.add_subparsers(dest="command", required=True)

    p_pull = sub.add_parser("pull", help="Pull GitHub issue state into pipeline status suggestions")
    p_pull.add_argument("--repo", required=True, help="owner/repo")
    p_pull.add_argument("--apply", action="store_true", help="apply suggested updates")

    args = parser.parse_args()

    if args.command == "pull":
        pull_sync(args.repo, args.apply)


if __name__ == "__main__":
    main()
