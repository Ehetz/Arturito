#!/usr/bin/env python3
import json
from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any, Dict, List

DATA_FILE = Path(__file__).resolve().parent / "pipeline.json"


@dataclass
class Signal:
    kind: str
    urgency: str
    projectId: str
    projectName: str
    message: str


def parse_iso(ts: str) -> datetime:
    if ts.endswith("Z"):
        ts = ts[:-1] + "+00:00"
    return datetime.fromisoformat(ts)


def load_pipeline() -> Dict[str, Any]:
    if not DATA_FILE.exists():
        return {"version": 1, "projects": []}
    return json.loads(DATA_FILE.read_text(encoding="utf-8"))


def urgency_for_importance(importance: int) -> str:
    if importance == 1:
        return "high"
    if importance in (2, 3):
        return "medium"
    return "low"


def evaluate_signals(data: Dict[str, Any], now: datetime | None = None) -> List[Signal]:
    now = now or datetime.now(timezone.utc)
    out: List[Signal] = []

    for p in data.get("projects", []):
        updated = p.get("lastUpdated") or p.get("updatedAt") or p.get("createdAt")
        if not updated:
            continue
        age = now - parse_iso(updated)

        if p.get("status") == "blocked" and age > timedelta(hours=24):
            imp = int(p.get("importance", 5))
            out.append(
                Signal(
                    kind="stale_blocked",
                    urgency=urgency_for_importance(imp),
                    projectId=p.get("id", ""),
                    projectName=p.get("name", ""),
                    message=f"Blocked for {int(age.total_seconds() // 3600)}h (>24h).",
                )
            )

        if p.get("critical", False) and age > timedelta(hours=6):
            out.append(
                Signal(
                    kind="critical_no_progress",
                    urgency="high",
                    projectId=p.get("id", ""),
                    projectName=p.get("name", ""),
                    message=f"Critical project has no progress for {int(age.total_seconds() // 3600)}h (>6h).",
                )
            )

    return out


def main():
    data = load_pipeline()
    signals = evaluate_signals(data)
    payload = {
        "timestamp": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "signals": [s.__dict__ for s in signals],
    }
    print(json.dumps(payload, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
